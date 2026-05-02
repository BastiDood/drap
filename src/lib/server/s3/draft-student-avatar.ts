import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getStreamAsBuffer } from 'get-stream';

import { Tracer } from '$lib/server/telemetry/tracer';

import { assertPayloadSize, assertSecureCdnUrl, normalizeImageContentType } from './util';
import { s3 } from './client';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const DRAFT_AVATAR_BUCKET = 'draft-student-avatar';

const SERVICE_NAME = 's3.draft-student-avatar';
const tracer = Tracer.byName(SERVICE_NAME);

async function putDraftAvatarObject(objectKey: string, contentType: string, bytes: Buffer) {
  return await tracer.asyncSpan('put-draft-avatar-object', async span => {
    span.setAttributes({
      'draft.avatar.object_key': objectKey,
      'draft.avatar.content_type': contentType,
      'draft.avatar.bytes.count': bytes.length,
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: DRAFT_AVATAR_BUCKET,
        Key: objectKey,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  });
}

export async function getDraftAvatarObject(objectKey: string) {
  return await tracer.asyncSpan('get-draft-avatar-object', async span => {
    span.setAttributes({ 'draft.avatar.object_key': objectKey });
    return await s3.send(
      new GetObjectCommand({
        Bucket: DRAFT_AVATAR_BUCKET,
        Key: objectKey,
      }),
    );
  });
}

export async function deleteDraftAvatarObject(objectKey: string) {
  return await tracer.asyncSpan('delete-draft-avatar-object', async span => {
    span.setAttributes({ 'draft.avatar.object_key': objectKey });
    await s3.send(
      new DeleteObjectCommand({
        Bucket: DRAFT_AVATAR_BUCKET,
        Key: objectKey,
      }),
    );
  });
}

export async function uploadDraftAvatarFromCdn(
  objectKey: string,
  avatarUrl: string,
  http: typeof fetch,
) {
  return await tracer.asyncSpan('upload-draft-avatar-from-cdn', async span => {
    span.setAttributes({
      'draft.avatar.object_key': objectKey,
      'draft.avatar.avatar_url': avatarUrl,
    });

    const url = assertSecureCdnUrl(avatarUrl);
    const response = await http(url);
    assert(response.ok, `failed to download avatar: ${response.status}`);

    const contentType = response.headers.get('Content-Type');
    assert(contentType !== null, 'avatar response missing content type');

    // Google CDN and Vercel CDN are trusted sources of SVGs.
    const normalizedContentType = normalizeImageContentType(contentType, true);

    const contentLength = response.headers.get('Content-Length');
    if (contentLength !== null) {
      // Some CDNs don't return `Content-Length`, so this assertion is mainly advisory.
      const expectedSize = Number.parseInt(contentLength, 10);
      assertPayloadSize(expectedSize, MAX_AVATAR_BYTES);
    }

    assert(response.body !== null, 'avatar response body is null');
    const bytes = await getStreamAsBuffer(response.body, { maxBuffer: MAX_AVATAR_BYTES });
    await putDraftAvatarObject(objectKey, normalizedContentType, bytes);
  });
}

export async function uploadDraftAvatarOverride(objectKey: string, file: File) {
  return await tracer.asyncSpan('upload-draft-avatar-override', async span => {
    span.setAttributes({
      'draft.avatar.object_key': objectKey,
      'draft.avatar.file.type': file.type,
      'draft.avatar.file.size': file.size,
    });

    // Ban SVGs for user-uploaded avatars because it is untrusted data (potential XSS attack vector!).
    const normalizedContentType = normalizeImageContentType(file.type);
    assertPayloadSize(file.size, MAX_AVATAR_BYTES);

    const bytes = Buffer.from(await file.arrayBuffer());
    await putDraftAvatarObject(objectKey, normalizedContentType, bytes);
  });
}
