import type { Database } from "$lib/server/database";
import GOOGLE from "$lib/server/env/google"
import { Base64 } from "js-base64";

type Message = {
    id: string,
    raw: string
}

type Draft = {
    id: string,
    message: Message
}

function formEmail(to: string, from: string, subject: string, body: string): Draft {
    return {
        id: "",
        message: {
            id: "",
            raw: body
        }
    }
}

// this function sends an email to the provided email address with the given body via nodemailer using the access token of the designated admin sender
export async function sendEmailTo(to: string, subject: string, body: string, db: Database) {
    const credentials = await db.getEmailerCredentials()

    if (!credentials) throw Error();
    
    const draft = await fetch(
        `https://gmail.googleapis.com/upload/gmail/v1/users/${credentials.user_id}/drafts`,
        {
            method: "POST",
            headers: { 'Authorization': `Bearer ${credentials.access_token}`, 'Content-Type': 'message/rfc822' },
            body: Base64.encode(JSON.stringify(formEmail(to, credentials.email, subject, body)))
        }
    )

    console.log(await draft.json())
}

