import { extension, lookup } from 'mime-types';
import { getDomain } from 'tldts';

export class S3ContentTypeError extends Error {
  constructor(public readonly contentType: string) {
    super(`unsupported S3 content type: ${contentType}`);
    this.name = 'S3ContentTypeError';
  }
}

/** @throws {S3ContentTypeError} */
export function normalizeImageContentType(contentType: string, allowSvg = false) {
  const contentExtension = extension(contentType);
  if (contentExtension === false) throw new S3ContentTypeError(contentType);

  const canonicalContentType = lookup(contentExtension);
  if (canonicalContentType === false) throw new S3ContentTypeError(contentType);

  switch (canonicalContentType) {
    case 'image/svg+xml':
      if (!allowSvg) break;
    // falls through
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      return canonicalContentType;
    default:
      break;
  }

  throw new S3ContentTypeError(contentType);
}

export class S3EmptyPayloadError extends Error {
  constructor() {
    super('payload must not be empty');
    this.name = 'S3EmptyPayloadError';
  }
}

export class S3TooLargePayloadError extends Error {
  constructor(
    public readonly size: number,
    public readonly maxBytes: number,
  ) {
    super(`payload of ${size} bytes exceeds maximum of ${maxBytes} bytes`);
    this.name = 'S3TooLargePayloadError';
  }
}

/**
 * @throws {S3EmptyPayloadError}
 * @throws {S3TooLargePayloadError}
 */
export function assertPayloadSize(size: number, maxBytes: number) {
  if (size <= 0) throw new S3EmptyPayloadError();
  if (size > maxBytes) throw new S3TooLargePayloadError(size, maxBytes);
}

export class S3RemoteProtocolError extends Error {
  constructor(public readonly protocol: string) {
    super(`unexpected remote URL protocol: ${protocol}`);
    this.name = 'S3RemoteProtocolError';
  }
}

export class S3RemoteHostError extends Error {
  constructor(public readonly host: string) {
    super(`unexpected remote URL host: ${host}`);
    this.name = 'S3RemoteHostError';
  }
}

/**
 * @throws {S3RemoteProtocolError}
 * @throws {S3RemoteHostError}
 */
export function assertSecureCdnUrl(avatarUrl: string) {
  const url = new URL(avatarUrl);
  if (url.protocol !== 'https:') throw new S3RemoteProtocolError(url.protocol);
  if (url.hostname !== 'avatar.vercel.sh')
    switch (getDomain(url.hostname)) {
      case 'googleusercontent.com':
        break;
      default:
        throw new S3RemoteHostError(url.hostname);
    }
  return url;
}
