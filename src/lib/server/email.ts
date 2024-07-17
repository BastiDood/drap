import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import { isPast, sub } from 'date-fns';
import { parse, pick } from 'valibot';
import { createTransport } from 'nodemailer';
import { fetchJwks } from '$lib/server/jwks';
import { jwtVerify } from 'jose';

import type { Database } from '$lib/server/database';
import GOOGLE from '$lib/server/env/google';

async function refreshAccessToken(db: Database, email: string, refreshToken: string) {
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

// this function sends an email to the provided email address with the given body via nodemailer using the access token of the designated admin sender
export async function sendEmailTo(db: Database, to: string, subject: string, text: string) {
    const credentials = await db.getDesignatedSenderCredentials();
    if (credentials === null) return false;

    const sendMail = await createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: credentials.email,
            clientId: GOOGLE.OAUTH_CLIENT_ID,
            clientSecret: GOOGLE.OAUTH_CLIENT_SECRET,
            refreshToken: credentials.refresh_token,
            accessToken: isPast(sub(credentials.expiration, { minutes: 10 }))
                ? await refreshAccessToken(db, credentials.email, credentials.refresh_token)
                : credentials.access_token,
        },
    }).sendMail({ from: credentials.email, to, subject, text });

    db.logger.info({ sendMail });
    return true;
}
