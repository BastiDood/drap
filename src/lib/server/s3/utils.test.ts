import { describe, expect, test } from 'vitest';

import {
  assertPayloadSize,
  assertSecureCdnUrl,
  normalizeImageContentType,
  S3ContentTypeError,
  S3EmptyPayloadError,
  S3RemoteHostError,
  S3RemoteProtocolError,
  S3TooLargePayloadError,
} from './util';

function expectError<T extends Error>(error: unknown, ExpectedError: new (...args: never[]) => T) {
  expect(error).toBeInstanceOf(ExpectedError);
  if (error instanceof ExpectedError) return error;
  throw error;
}

describe('normalizeImageContentType', () => {
  test('canonicalizes supported content types with parameters', () => {
    expect(normalizeImageContentType('image/jpeg; charset=UTF-8')).toBe('image/jpeg');
  });

  test('canonicalizes mixed-case supported content types', () => {
    expect(normalizeImageContentType('IMAGE/PNG')).toBe('image/png');
  });

  test('rejects unsupported content types', () => {
    try {
      normalizeImageContentType('text/plain; charset=UTF-8');
      throw new Error('expected normalizeImageContentType to throw');
    } catch (error) {
      const typedError = expectError(error, S3ContentTypeError);
      expect(typedError.contentType).toBe('text/plain; charset=UTF-8');
    }
  });

  test('rejects malformed content types', () => {
    try {
      normalizeImageContentType('not-a-real-type');
      throw new Error('expected normalizeImageContentType to throw');
    } catch (error) {
      const typedError = expectError(error, S3ContentTypeError);
      expect(typedError.contentType).toBe('not-a-real-type');
    }
  });

  test('rejects SVG images by default', () => {
    try {
      normalizeImageContentType('image/svg+xml; charset=UTF-8');
      throw new Error('expected normalizeImageContentType to throw');
    } catch (error) {
      const typedError = expectError(error, S3ContentTypeError);
      expect(typedError.contentType).toBe('image/svg+xml; charset=UTF-8');
    }
  });

  test('accepts SVG images with parameters when allowSvg is enabled for trusted sources', () => {
    expect(normalizeImageContentType('image/svg+xml; charset=UTF-8', true)).toBe('image/svg+xml');
  });
});

describe('assertPayloadSize', () => {
  test('accepts a positive payload size within the maximum', () => {
    expect(() => assertPayloadSize(1024, 4096)).not.toThrow();
  });

  test('accepts a payload size exactly at the maximum', () => {
    expect(() => assertPayloadSize(4096, 4096)).not.toThrow();
  });

  test('rejects an empty payload', () => {
    try {
      assertPayloadSize(0, 4096);
      throw new Error('expected assertPayloadSize to throw');
    } catch (error) {
      expectError(error, S3EmptyPayloadError);
    }
  });

  test('rejects negative payload sizes as empty', () => {
    try {
      assertPayloadSize(-1, 4096);
      throw new Error('expected assertPayloadSize to throw');
    } catch (error) {
      expectError(error, S3EmptyPayloadError);
    }
  });

  test('rejects payloads larger than the maximum', () => {
    try {
      assertPayloadSize(4097, 4096);
      throw new Error('expected assertPayloadSize to throw');
    } catch (error) {
      const typedError = expectError(error, S3TooLargePayloadError);
      expect(typedError.size).toBe(4097);
      expect(typedError.maxBytes).toBe(4096);
    }
  });
});

describe('assertSecureGoogleCdnUrl', () => {
  test('accepts secure googleusercontent hosts', () => {
    const url = assertSecureCdnUrl('https://lh3.googleusercontent.com/avatar.png');

    expect(url.hostname).toBe('lh3.googleusercontent.com');
  });

  test('accepts secure Vercel avatar hosts', () => {
    const url = assertSecureCdnUrl('https://avatar.vercel.sh/drap.svg');

    expect(url.hostname).toBe('avatar.vercel.sh');
    expect(url.pathname).toBe('/drap.svg');
  });

  test('accepts secure googleusercontent hosts with mixed-case input', () => {
    const url = assertSecureCdnUrl('https://LH3.GoogleUserContent.com/avatar.png?size=256');

    expect(url.hostname).toBe('lh3.googleusercontent.com');
    expect(url.searchParams.get('size')).toBe('256');
  });

  test('rejects non-https URLs', () => {
    try {
      assertSecureCdnUrl('http://lh3.googleusercontent.com/avatar.png');
      throw new Error('expected assertSecureGoogleCdnUrl to throw');
    } catch (error) {
      const typedError = expectError(error, S3RemoteProtocolError);
      expect(typedError.protocol).toBe('http:');
    }
  });

  test('rejects disallowed hosts', () => {
    try {
      assertSecureCdnUrl('https://example.com/avatar.png');
      throw new Error('expected assertSecureGoogleCdnUrl to throw');
    } catch (error) {
      const typedError = expectError(error, S3RemoteHostError);
      expect(typedError.host).toBe('example.com');
    }
  });

  test('accepts googleusercontent subdomains by registrable domain', () => {
    const url = assertSecureCdnUrl('https://foo.bar.googleusercontent.com/avatar.png');

    expect(url.hostname).toBe('foo.bar.googleusercontent.com');
  });

  test('rejects sibling domains that only share a suffix', () => {
    try {
      assertSecureCdnUrl('https://googleusercontent.com.example.com/avatar.png');
      throw new Error('expected assertSecureGoogleCdnUrl to throw');
    } catch (error) {
      const typedError = expectError(error, S3RemoteHostError);
      expect(typedError.host).toBe('googleusercontent.com.example.com');
    }
  });

  test('rejects lookalike registrable domains', () => {
    try {
      assertSecureCdnUrl('https://googleusercontent.co/avatar.png');
      throw new Error('expected assertSecureGoogleCdnUrl to throw');
    } catch (error) {
      const typedError = expectError(error, S3RemoteHostError);
      expect(typedError.host).toBe('googleusercontent.co');
    }
  });

  test('propagates malformed URLs before host checks run', () => {
    expect(() => assertSecureCdnUrl('not a url')).toThrow(TypeError);
  });
});
