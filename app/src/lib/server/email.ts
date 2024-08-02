import { IdToken, TokenResponse } from 'drap-model/oauth';
import assert, { strictEqual } from 'node:assert/strict';
import { isPast, sub } from 'date-fns';
import { parse, pick } from 'valibot';
import type { Database } from 'drap-database';
import GOOGLE from '$lib/server/env/google';
import { GmailMessageSendResult } from 'drap-model/email';
import type { User } from 'drap-model/user';
import { createMimeMessage } from 'mimetext/node';
import { fetchJwks } from '$lib/server/jwks';
import { jwtVerify } from 'jose';

export type Email = User['email'];

async function refreshAccessToken(db: Database, email: Email, refreshToken: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: GOOGLE.OAUTH_CLIENT_ID,
            client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
            grant_type: 'refresh_token',
        }),
    });

    const json = await res.json();
    const { id_token, access_token } = parse(TokenResponse, json);
    const { payload } = await jwtVerify(id_token, fetchJwks, {
        issuer: 'https://accounts.google.com',
        audience: GOOGLE.OAUTH_CLIENT_ID,
    });

    const token = parse(pick(IdToken, ['exp']), payload);
    await db.upsertCandidateSender(email, token.exp, access_token);
    return access_token;
}

export async function sendEmail(db: Database, to: Email[], subject: string, data: string) {
    const credentials = await db.getDesignatedSenderCredentials();
    if (credentials === null) return false;

    const message = createMimeMessage();
    message.setSender({
        name: `DRAP on behalf of ${credentials.given_name} ${credentials.family_name}`,
        addr: credentials.email,
    });
    message.setRecipient(to);
    message.setSubject(subject);
    message.addMessage({ contentType: 'text/plain', data });
    const raw = message.asEncoded();

    const accessToken = isPast(sub(credentials.expiration, { minutes: 10 }))
        ? await refreshAccessToken(db, credentials.email, credentials.refresh_token)
        : credentials.access_token;

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
    });

    assert(response.ok);
    strictEqual(response.status, 200);

    const json = await response.json();
    return parse(GmailMessageSendResult, json);
}
