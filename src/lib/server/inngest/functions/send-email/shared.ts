import { and, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';
import type { ComponentProps } from 'svelte';
import { createMimeMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { toPlainText } from '@better-svelte-email/server';

import * as dbSchema from '$lib/server/database/schema';
import { assertOptional } from '$lib/server/assert';
import { db } from '$lib/server/database';
import { decryptSecret, encryptSecret } from '$lib/crypto';
import type {
  DraftFinalizedBatchEmailSchema,
  DraftFinalizedFallbackEmailSchema,
  LotteryInterventionBatchEmailSchema,
  LotteryInterventionFallbackEmailSchema,
  RoundStartedBatchEmailSchema,
  RoundStartedFallbackEmailSchema,
  RoundSubmittedBatchEmailSchema,
  RoundSubmittedFallbackEmailSchema,
  UserAssignedBatchEmailSchema,
  UserAssignedFallbackEmailSchema,
} from '$lib/server/inngest/schema';
import type { DrizzleTransaction, schema } from '$lib/server/database/drizzle';
import { ENCRYPTION_KEY } from '$lib/server/env/drap/crypto';
import { GoogleOAuthClient } from '$lib/server/google';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import DraftFinalized from './draft-finalized.svelte';
import LotteryIntervened from './lottery-intervened.svelte';
import RoundStarted from './round-started.svelte';
import RoundSubmitted from './round-submitted.svelte';
import UserAssigned from './user-assigned.svelte';
import { emailRenderer } from './renderer';

const SERVICE_NAME = 'inngest.functions.send-email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

type SenderIdentity = Pick<schema.User, 'email' | 'givenName' | 'familyName'>;
type RenderableEmailEvent =
  | { name: 'draft/round.started.email.batch'; data: RoundStartedBatchEmailSchema }
  | { name: 'draft/round.started.email.fallback'; data: RoundStartedFallbackEmailSchema }
  | { name: 'draft/round.submitted.email.batch'; data: RoundSubmittedBatchEmailSchema }
  | { name: 'draft/round.submitted.email.fallback'; data: RoundSubmittedFallbackEmailSchema }
  | { name: 'draft/lottery.intervened.email.batch'; data: LotteryInterventionBatchEmailSchema }
  | {
      name: 'draft/lottery.intervened.email.fallback';
      data: LotteryInterventionFallbackEmailSchema;
    }
  | { name: 'draft/draft.finalized.email.batch'; data: DraftFinalizedBatchEmailSchema }
  | { name: 'draft/draft.finalized.email.fallback'; data: DraftFinalizedFallbackEmailSchema }
  | { name: 'draft/user.assigned.email.batch'; data: UserAssignedBatchEmailSchema }
  | { name: 'draft/user.assigned.email.fallback'; data: UserAssignedFallbackEmailSchema };

export async function createEmailMessage(event: RenderableEmailEvent, sender: SenderIdentity) {
  /* eslint-disable @typescript-eslint/init-declarations */
  let recipient: string;
  let subject: string;
  let html: string;
  /* eslint-enable @typescript-eslint/init-declarations */

  switch (event.name) {
    case 'draft/round.started.email.batch':
    case 'draft/round.started.email.fallback':
      recipient = event.data.recipientEmail;
      subject =
        event.data.round === null
          ? `[DRAP] Lottery Round for Draft #${event.data.draftId} has begun!`
          : `[DRAP] Round #${event.data.round} for Draft #${event.data.draftId} has begun!`;
      html = await emailRenderer.render(RoundStarted, {
        props: {
          draftId: event.data.draftId,
          round: event.data.round,
        } satisfies ComponentProps<typeof RoundStarted>,
      });
      break;
    case 'draft/round.submitted.email.batch':
    case 'draft/round.submitted.email.fallback':
      recipient = event.data.recipientEmail;
      subject = event.data.isCreate
        ? `[DRAP] Acknowledgement from ${event.data.labId.toUpperCase()} for Round #${event.data.round} of Draft #${event.data.draftId}`
        : `[DRAP] Preference Update from ${event.data.labId.toUpperCase()} for Round #${event.data.round} of Draft #${event.data.draftId}`;
      html = await emailRenderer.render(RoundSubmitted, {
        props: {
          labName: event.data.labName,
          round: event.data.round,
          draftId: event.data.draftId,
          isCreate: event.data.isCreate,
        } satisfies ComponentProps<typeof RoundSubmitted>,
      });
      break;
    case 'draft/lottery.intervened.email.batch':
    case 'draft/lottery.intervened.email.fallback':
      recipient = event.data.recipientEmail;
      subject = `[DRAP] Lottery Intervention for ${event.data.labId.toUpperCase()} in Draft #${event.data.draftId}`;
      html = await emailRenderer.render(LotteryIntervened, {
        props: {
          studentName: event.data.studentName,
          studentEmail: event.data.studentEmail,
          avatarUrl: event.data.avatarUrl,
          labName: event.data.labName,
          draftId: event.data.draftId,
        } satisfies ComponentProps<typeof LotteryIntervened>,
      });
      break;
    case 'draft/draft.finalized.email.batch':
    case 'draft/draft.finalized.email.fallback':
      recipient = event.data.recipientEmail;
      subject = `[DRAP] Draft #${event.data.draftId} Finalized`;
      html = await emailRenderer.render(DraftFinalized, {
        props: {
          draftId: event.data.draftId,
          lotteryAssignments: event.data.lotteryAssignments,
        } satisfies ComponentProps<typeof DraftFinalized>,
      });
      break;
    case 'draft/user.assigned.email.batch':
    case 'draft/user.assigned.email.fallback':
      recipient = event.data.userEmail;
      subject = `[DRAP] Assigned to ${event.data.labId.toUpperCase()}`;
      html = await emailRenderer.render(UserAssigned, {
        props: {
          userName: event.data.userName,
          labName: event.data.labName,
        } satisfies ComponentProps<typeof UserAssigned>,
      });
      break;
    default:
      throw new Error('unreachable email event type');
  }

  const mime = createMimeMessage();
  mime.setSender({
    name: `[DRAP] ${sender.givenName} ${sender.familyName}`,
    addr: sender.email,
  });
  mime.setRecipient(recipient);
  mime.setSubject(subject);
  mime.addMessage({
    contentType: 'text/plain',
    encoding: 'base64',
    data: Buffer.from(toPlainText(html), 'utf-8').toString('base64'),
  });
  mime.addMessage({
    contentType: 'text/html',
    encoding: 'base64',
    data: Buffer.from(html, 'utf-8').toString('base64'),
  });
  return mime;
}

export function isRetryableGmailStatus(status: number) {
  switch (status) {
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
      return true;
    default:
      return false;
  }
}

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

      // eslint-disable-next-line @typescript-eslint/init-declarations
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
