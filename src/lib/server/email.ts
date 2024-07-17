import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import { parse, pick } from 'valibot';
import { fetchJwks } from '$lib/server/jwks';
import { jwtVerify } from 'jose';

import type { Database } from '$lib/server/database';
import GOOGLE from '$lib/server/env/google';
import { createTransport } from 'nodemailer';

// this function refreshes the access token and updates the db accordingly
async function refreshAccessToken(refreshToken: string, email: string, db: Database) {
    const body = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
        grant_type: 'refresh_token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    const json = await res.json();

    const { id_token, access_token, refresh_token } = parse(TokenResponse, json);
    const { payload } = await jwtVerify(id_token, fetchJwks, {
        issuer: 'https://accounts.google.com',
        audience: GOOGLE.OAUTH_CLIENT_ID,
    });

    const token = parse(pick(IdToken, ['exp']), payload);

    await db.updateDesignatedSender(email, token.exp, access_token);

    return await db.getDesignatedSender();
}

// this function sends an email to the provided email address with the given body via nodemailer using the access token of the designated admin sender
export async function sendEmailTo(to: string, subject: string, body: string, db: Database) {
    let credentials = await db.getDesignatedSender();
    if (!credentials) throw Error();
    if (!credentials.refresh_token) throw Error();

    if (credentials.expiration < new Date())
        credentials = await refreshAccessToken(credentials.refresh_token, credentials.email, db);

    if (!credentials) throw Error();

    const transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: credentials.email,
            clientId: GOOGLE.OAUTH_CLIENT_ID,
            clientSecret: GOOGLE.OAUTH_CLIENT_SECRET,
            refreshToken: credentials.refresh_token,
            accessToken: credentials.access_token,
        },
    });

    transporter.sendMail({
        from: credentials.email,
        to,
        subject,
        text: body,
    });
}
