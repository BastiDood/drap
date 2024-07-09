import type { Database } from "$lib/server/database";
import GOOGLE from "$lib/server/env/google"
import { createTransport } from "nodemailer";

// this function sends an email to the provided email address with the given body via nodemailer using the access token of the designated admin sender
export async function sendEmailTo(to: string, subject: string, body: string, db: Database) {
    const credentials = await db.getEmailerCredentials()

    if (!credentials) throw Error();

    const transporter = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          type: "OAuth2",
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
        text: body
      })
    
}

