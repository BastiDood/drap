import { describe, expect, it } from 'vitest';

import {
  DuplicateBatchContentIdError,
  InvalidBatchContentTypeError,
  MissingBatchBoundaryError,
  MissingBatchContentTypeError,
  MissingBatchPartContentIdError,
  MissingBatchPartContentTypeError,
  NonHttpBatchPartError,
  parseBatchSendResponse,
} from './http';

const BATCH_BOUNDARY = 'batch_foobarbaz';
const ITEM1 = 'item1:12930812@barnyard.example.com';
const ITEM2 = 'item2:12930812@barnyard.example.com';
const ITEM3 = 'item3:12930812@barnyard.example.com';

function createMultipartResponse(parts: string[]) {
  const lines = [
    `--${BATCH_BOUNDARY}`,
    parts.join(`\r\n--${BATCH_BOUNDARY}\r\n`),
    `--${BATCH_BOUNDARY}--`,
    '',
  ];
  return new Response(lines.join('\r\n'), {
    headers: { 'Content-Type': `multipart/mixed; boundary=${BATCH_BOUNDARY}` },
  });
}

function createApplicationHttpPart(contentId: string, responseLines: string[]) {
  return [
    'Content-Type: application/http',
    `Content-ID: <response-${contentId}>`,
    '',
    ...responseLines,
  ].join('\r\n');
}

function createGmailSuccessBody({
  id,
  threadId,
  labelIds,
  internalDate,
}: {
  id: string;
  threadId: string;
  labelIds: string[];
  internalDate?: string;
}) {
  return JSON.stringify({ id, threadId, labelIds, internalDate });
}

function createSuccessfulResponseLines(body: string, etag: string) {
  return [
    'HTTP/1.1 200 OK',
    'Content-Type: application/json',
    `Content-Length: ${Buffer.byteLength(body)}`,
    `ETag: "${etag}"`,
    '',
    body,
  ];
}

function createNotModifiedResponseLines(etag: string) {
  return ['HTTP/1.1 304 Not Modified', 'Content-Length: 0', `ETag: "${etag}"`, '', ''];
}

function createServerErrorResponseLines(body: string) {
  return [
    'HTTP/1.1 500 Internal Server Error',
    'Content-Type: application/json',
    `Content-Length: ${Buffer.byteLength(body)}`,
    '',
    body,
  ];
}

describe('parseBatchSendResponse', () => {
  it('parses a Google-docs-shaped multipart response into a result map', async () => {
    // Boundary and Content-ID values are taken from Google's batch API example.
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
      internalDate: '1735689600000',
    });
    const sheepBody = createGmailSuccessBody({
      id: 'sheep-message-id',
      threadId: 'sheep-thread-id',
      labelIds: ['SENT', 'UNREAD'],
    });
    const response = createMultipartResponse([
      createApplicationHttpPart(ITEM1, createSuccessfulResponseLines(ponyBody, 'etag/pony')),
      createApplicationHttpPart(ITEM2, createSuccessfulResponseLines(sheepBody, 'etag/sheep')),
      createApplicationHttpPart(ITEM3, createNotModifiedResponseLines('etag/animals')),
    ]);

    const results = await parseBatchSendResponse(response);

    expect(results).toEqual(
      new Map([
        [
          ITEM1,
          {
            ok: true,
            value: {
              id: 'pony-message-id',
              threadId: 'pony-thread-id',
              labelIds: ['SENT'],
              internalDate: '1735689600000',
            },
          },
        ],
        [
          ITEM2,
          {
            ok: true,
            value: {
              id: 'sheep-message-id',
              threadId: 'sheep-thread-id',
              labelIds: ['SENT', 'UNREAD'],
            },
          },
        ],
        [
          ITEM3,
          {
            ok: false,
            status: 304,
            body: '',
          },
        ],
      ]),
    );
  });

  it('normalizes bracketed response content ids from the Google batch example', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      createApplicationHttpPart(ITEM1, createSuccessfulResponseLines(ponyBody, 'etag/pony')),
    ]);

    const results = await parseBatchSendResponse(response);

    expect(Array.from(results.keys())).toEqual([ITEM1]);
  });

  it('normalizes unbracketed response content ids with a response- prefix', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      [
        'Content-Type: application/http',
        `Content-ID: response-${ITEM1}`,
        '',
        ...createSuccessfulResponseLines(ponyBody, 'etag/pony'),
      ].join('\r\n'),
    ]);

    const results = await parseBatchSendResponse(response);

    expect(Array.from(results.keys())).toEqual([ITEM1]);
  });

  it('keeps content ids without the response- prefix unchanged', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      [
        'Content-Type: application/http',
        `Content-ID: <${ITEM1}>`,
        '',
        ...createSuccessfulResponseLines(ponyBody, 'etag/pony'),
      ].join('\r\n'),
    ]);

    const results = await parseBatchSendResponse(response);

    expect(Array.from(results.keys())).toEqual([ITEM1]);
  });

  it('throws on duplicate normalized response content ids', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      createApplicationHttpPart(ITEM1, createSuccessfulResponseLines(ponyBody, 'etag/pony')),
      createApplicationHttpPart(ITEM1, createNotModifiedResponseLines('etag/animals')),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      DuplicateBatchContentIdError,
    );
  });

  it('throws on non-http multipart parts', async () => {
    const response = createMultipartResponse([
      ['Content-Type: text/plain', `Content-ID: <response-${ITEM1}>`, '', 'not http'].join('\r\n'),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(NonHttpBatchPartError);
  });

  it('throws when the outer multipart response is missing its content type', async () => {
    const response = new Response(null);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      MissingBatchContentTypeError,
    );
  });

  it('throws when the outer response content type is not multipart', async () => {
    const response = new Response('irrelevant', {
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      InvalidBatchContentTypeError,
    );
  });

  it('throws when the outer multipart response is missing a boundary', async () => {
    const response = new Response('', {
      headers: { 'Content-Type': 'multipart/mixed' },
    });

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      MissingBatchBoundaryError,
    );
  });

  it('throws when a multipart part is missing its content type', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      [
        `Content-ID: <response-${ITEM1}>`,
        '',
        ...createSuccessfulResponseLines(ponyBody, 'etag/pony'),
      ].join('\r\n'),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      MissingBatchPartContentTypeError,
    );
  });

  it('throws when a multipart part is missing its content id', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      [
        'Content-Type: application/http',
        '',
        ...createSuccessfulResponseLines(ponyBody, 'etag/pony'),
      ].join('\r\n'),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(
      MissingBatchPartContentIdError,
    );
  });

  it('accepts application/http content types regardless of case', async () => {
    const ponyBody = createGmailSuccessBody({
      id: 'pony-message-id',
      threadId: 'pony-thread-id',
      labelIds: ['SENT'],
    });
    const response = createMultipartResponse([
      [
        'Content-Type: Application/HTTP',
        `Content-ID: <response-${ITEM1}>`,
        '',
        ...createSuccessfulResponseLines(ponyBody, 'etag/pony'),
      ].join('\r\n'),
    ]);

    await expect(parseBatchSendResponse(response)).resolves.toEqual(
      new Map([
        [
          ITEM1,
          {
            ok: true,
            value: {
              id: 'pony-message-id',
              threadId: 'pony-thread-id',
              labelIds: ['SENT'],
            },
          },
        ],
      ]),
    );
  });

  it('returns failure items with status and body passthrough for non-2xx parts', async () => {
    const errorBody = JSON.stringify({ error: { code: 500, message: 'backend failure' } });
    const response = createMultipartResponse([
      createApplicationHttpPart(ITEM1, createServerErrorResponseLines(errorBody)),
    ]);

    await expect(parseBatchSendResponse(response)).resolves.toEqual(
      new Map([[ITEM1, { ok: false, status: 500, body: errorBody }]]),
    );
  });

  it('throws when a successful part contains invalid json', async () => {
    const response = createMultipartResponse([
      createApplicationHttpPart(ITEM1, createSuccessfulResponseLines('{', 'etag/pony')),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toBeInstanceOf(SyntaxError);
  });

  it('throws when a successful part contains schema-invalid json', async () => {
    const response = createMultipartResponse([
      createApplicationHttpPart(
        ITEM1,
        createSuccessfulResponseLines(JSON.stringify({ id: 'pony-message-id' }), 'etag/pony'),
      ),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toThrow();
  });

  it('bubbles parser execute errors from malformed inner http', async () => {
    const response = createMultipartResponse([
      [
        'Content-Type: application/http',
        `Content-ID: <response-${ITEM1}>`,
        '',
        'not an http response',
      ].join('\r\n'),
    ]);

    await expect(parseBatchSendResponse(response)).rejects.toThrow();
  });
});
