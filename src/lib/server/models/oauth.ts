import {
    boolean,
    email,
    everyItem,
    literal,
    maxLength,
    minLength,
    number,
    object,
    pipe,
    safeInteger,
    string,
    transform,
    url,
} from 'valibot';
import { User } from '$lib/models/user';

const OAUTH_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.name',
];
export const OAUTH_SCOPE_STRING = OAUTH_SCOPES.join(' ');
export const OAUTH_TOKEN_TYPE = 'Bearer';

/** @see https://developers.google.com/identity/protocols/oauth2#size */
export const AuthorizationCode = pipe(string(), minLength(1), maxLength(256));

export const TokenResponse = object({
    // JSON Web Token token containing the user's ID token.
    id_token: string(),
    // Always set to `OAUTH_SCOPE` for now.
    scope: pipe(
        string(),
        transform(str => str.split(' ')),
        everyItem(item => OAUTH_SCOPES.includes(item)),
    ),
    token_type: literal(OAUTH_TOKEN_TYPE),
    // Remaining lifetime in seconds.
    expires_in: pipe(number(), safeInteger()),
});

const UnixTimeSecs = pipe(
    number(),
    safeInteger(),
    transform(secs => new Date(secs * 1000)),
);

export const IdToken = object({
    // OpenID audience.
    aud: string(),
    // OpenID subject. Typically the globally unique Google user ID.
    sub: User.entries.user_id,
    // Creation time (in seconds).
    iat: UnixTimeSecs,
    // Expiration time (in seconds) on or after which the token is invalid.
    exp: UnixTimeSecs,
    // OpenID issuer.
    iss: literal('https://accounts.google.com'),
    // OpenID authorized presenter.
    azp: string(),
    // Access token hash.
    at_hash: string(),
    email: pipe(string(), email()),
    email_verified: boolean(),
    given_name: string(),
    family_name: string(),
    nonce: string(),
    picture: pipe(string(), url()),
});
