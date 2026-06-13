import { and, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';
import { NonRetriableError } from 'inngest';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';

import * as dbSchema from '$lib/server/database/schema';
import { assertOptional } from '$lib/server/assert';
import { db } from '$lib/server/database';
import { decryptSecret, encryptSecret } from '$lib/crypto';
import type { DrizzleTransaction, schema } from '$lib/server/database/drizzle';
import { ENCRYPTION_KEY } from '$lib/server/env/drap/crypto';
import { GoogleOAuthClient } from '$lib/server/google';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.auth';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export type SenderIdentity = Pick<schema.User, 'email' | 'givenName' | 'familyName'>;

export async function getRefreshedCredentials() {
  return await db.transaction(async db => await RefreshedCredentials.fromTransaction(db), {
    isolationLevel: 'read uncommitted',
  });
}

class RefreshedCredentials {
  private constructor(
    public readonly client: GoogleOAuthClient,
    public readonly sender: SenderIdentity,
  ) {}

  static async fromTransaction(db: DrizzleTransaction) {
    return await tracer.asyncSpan('refresh-sender-credentials', async () => {
      logger.trace('getting designated sender credentials...');
      const sender = await getDesignatedSenderCredentialsForUpdate(db, ENCRYPTION_KEY);
      if (typeof sender === 'undefined') {
        const error = new NonRetriableError('no designated sender configured');
        logger.error('no designated sender configured', error);
        throw error;
      }

      let client: GoogleOAuthClient;
      if (sender.isValid) {
        client = new GoogleOAuthClient(sender.accessToken, sender.scopes);
      } else {
        logger.debug('refreshing OAuth token...');
        const refreshed = await GoogleOAuthClient.fromRefreshToken(sender.refreshToken);
        ({ client } = refreshed);

        logger.debug('updating candidate sender...');
        await updateCandidateSender(
          db,
          sender.id,
          refreshed.token.expiresIn,
          client.scopes,
          ENCRYPTION_KEY,
          client.accessToken,
          sender.refreshToken,
        );
      }

      return new RefreshedCredentials(client, sender);
    });
  }
}

async function getDesignatedSenderCredentialsForUpdate(
  db: DrizzleTransaction,
  encryptionKey: CryptoKey,
) {
  return await tracer.asyncSpan('get-designated-sender-credentials', async () => {
    const sender = await db
      .select({
        id: dbSchema.user.id,
        email: dbSchema.user.email,
        givenName: dbSchema.user.givenName,
        familyName: dbSchema.user.familyName,
        accessTokenIv: dbSchema.candidateSender.accessTokenIv,
        accessTokenCipher: dbSchema.candidateSender.accessTokenCipher,
        refreshTokenIv: dbSchema.candidateSender.refreshTokenIv,
        refreshTokenCipher: dbSchema.candidateSender.refreshTokenCipher,
        scopes: dbSchema.candidateSender.scopes,
        isValid: gte(dbSchema.candidateSender.expiredAt, sql`now()`).mapWith(Boolean),
      })
      .from(dbSchema.designatedSender)
      .innerJoin(
        dbSchema.candidateSender,
        eq(dbSchema.designatedSender.candidateSenderUserId, dbSchema.candidateSender.userId),
      )
      .innerJoin(
        dbSchema.user,
        eq(dbSchema.designatedSender.candidateSenderUserId, dbSchema.user.id),
      )
      .where(
        and(
          isNotNull(dbSchema.user.googleUserId),
          eq(dbSchema.user.isAdmin, true),
          isNull(dbSchema.user.labId),
        ),
      )
      .for('update')
      .then(assertOptional);

    if (typeof sender === 'undefined') return;

    const [accessToken, refreshToken] = await Promise.all([
      decryptSecret(encryptionKey, sender.accessTokenIv, sender.accessTokenCipher),
      decryptSecret(encryptionKey, sender.refreshTokenIv, sender.refreshTokenCipher),
    ]);

    return {
      id: sender.id,
      email: sender.email,
      givenName: sender.givenName,
      familyName: sender.familyName,
      accessToken,
      refreshToken,
      scopes: sender.scopes,
      isValid: sender.isValid,
    };
  });
}

async function updateCandidateSender(
  db: DrizzleTransaction,
  userId: string,
  expiresIn: number,
  scopes: string[],
  encryptionKey: CryptoKey,
  accessToken: string,
  refreshToken?: string | undefined,
) {
  return await tracer.asyncSpan('update-candidate-sender', async span => {
    span.setAttributes({
      'database.user.id': userId,
      'database.candidate_sender.expires_in': expiresIn,
    });

    const encryptedAccessToken = await encryptSecret(encryptionKey, accessToken);
    const update: PgUpdateSetSource<typeof dbSchema.candidateSender> = {
      userId,
      scopes,
      accessTokenIv: Buffer.from(encryptedAccessToken.iv),
      accessTokenCipher: Buffer.from(encryptedAccessToken.cipher),
      refreshTokenIv: dbSchema.candidateSender.refreshTokenIv,
      refreshTokenCipher: dbSchema.candidateSender.refreshTokenCipher,
      expiredAt: sql`now() + make_interval(secs => ${expiresIn})`,
    };

    if (typeof refreshToken !== 'undefined') {
      const { iv, cipher } = await encryptSecret(encryptionKey, refreshToken);
      update.refreshTokenIv = Buffer.from(iv);
      update.refreshTokenCipher = Buffer.from(cipher);
    }

    const { rowCount } = await db
      .update(dbSchema.candidateSender)
      .set(update)
      .where(eq(dbSchema.candidateSender.userId, userId));
    logger.debug('updated candidate sender', { rowCount });
  });
}
