import GOOGLE from "$lib/server/env/google"
import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

// this function gets an OAuth access token from Google's OAuth servers on behalf of the service account
export async function getServiceAccountToken() {
    const secretKey = createPrivateKey(GOOGLE.SERVICE_SECRET)
    
    const token = await new SignJWT({
        scope: GOOGLE.SERVICE_SCOPE  
    }).setProtectedHeader({
            alg: 'RS256',
            typ: 'JWT',
            kid: GOOGLE.SERVICE_SECRET_ID
        })
        .setAudience("https://oauth2.googleapis.com/token")
        .setIssuedAt()
        .setExpirationTime("1 hour")
        .setIssuer(GOOGLE.SERVICE_ISSUER)
        .sign(secretKey)
    
}

// this function sends an email to the provided email address with the given body via the GMail REST API
export async function sendEmailTo(email: string, body: string) {

}