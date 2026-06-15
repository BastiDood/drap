import assert from 'node:assert/strict';

import type { ComponentProps } from 'svelte';
import { createMimeMessage } from 'mimetext/node';
import { toPlainText } from '@better-svelte-email/server';

import {
  DraftConcludedBatchEmailEvent,
  type DraftConcludedBatchEmailSchema,
  type DraftConcludedSeedEmailSchema,
  DraftFinalizationBatchEmailEvent,
  type DraftFinalizationBatchEmailSchema,
  type DraftFinalizationSeedEmailSchema,
  type EmailBatchEnvelopeSchema,
  LotteryInterventionBatchEmailEvent,
  type LotteryInterventionBatchEmailSchema,
  type LotteryInterventionSeedEmailSchema,
  RoundStartedBatchEmailEvent,
  type RoundStartedBatchEmailSchema,
  type RoundStartedSeedEmailSchema,
  RoundSubmittedBatchEmailEvent,
  type RoundSubmittedBatchEmailSchema,
  type RoundSubmittedSeedEmailSchema,
  UserAssignedBatchEmailEvent,
  type UserAssignedBatchEmailSchema,
  type UserAssignedSeedEmailSchema,
} from '$lib/server/inngest/schema';
import type { GmailThreadKey, schema } from '$lib/server/database/drizzle';

import type { SenderIdentity } from './auth';

import DraftConcluded from './templates/draft-concluded.svelte';
import DraftFinalization from './templates/draft-finalization.svelte';
import LotteryIntervened from './templates/lottery-intervened.svelte';
import RoundStarted from './templates/round-started.svelte';
import RoundSubmitted from './templates/round-submitted.svelte';
import UserAssigned from './templates/user-assigned.svelte';
import { emailRenderer } from './templates/renderer';

type SeedEmailEvent =
  | { name: 'draft/round.started.email.seed'; data: RoundStartedSeedEmailSchema }
  | { name: 'draft/round.submitted.email.seed'; data: RoundSubmittedSeedEmailSchema }
  | { name: 'draft/lottery.intervened.email.seed'; data: LotteryInterventionSeedEmailSchema }
  | { name: 'draft/draft.concluded.email.seed'; data: DraftConcludedSeedEmailSchema }
  | { name: 'draft/draft.finalization.email.seed'; data: DraftFinalizationSeedEmailSchema }
  | { name: 'draft/user.assigned.email.seed'; data: UserAssignedSeedEmailSchema };

type BatchEmailEvent =
  | { name: 'draft/round.started.email.batch'; data: RoundStartedBatchEmailSchema }
  | { name: 'draft/round.submitted.email.batch'; data: RoundSubmittedBatchEmailSchema }
  | { name: 'draft/lottery.intervened.email.batch'; data: LotteryInterventionBatchEmailSchema }
  | { name: 'draft/draft.concluded.email.batch'; data: DraftConcludedBatchEmailSchema }
  | { name: 'draft/draft.finalization.email.batch'; data: DraftFinalizationBatchEmailSchema }
  | { name: 'draft/user.assigned.email.batch'; data: UserAssignedBatchEmailSchema };

interface ThreadRenderData {
  gmailThreadId: string;
  gmailMessageIds: string[];
}

export function toBatchEnvelope(event: SeedEmailEvent | BatchEmailEvent): EmailBatchEnvelopeSchema {
  switch (event.name) {
    case 'draft/round.started.email.seed':
      return {
        name: 'draft/round.started.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/round.submitted.email.seed':
      return {
        name: 'draft/round.submitted.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/lottery.intervened.email.seed':
      return {
        name: 'draft/lottery.intervened.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/draft.concluded.email.seed':
      return {
        name: 'draft/draft.concluded.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/draft.finalization.email.seed':
      return {
        name: 'draft/draft.finalization.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/user.assigned.email.seed':
      return {
        name: 'draft/user.assigned.email.batch',
        data: { ...event.data, gmailMessageId: crypto.randomUUID() },
      };
    case 'draft/round.started.email.batch':
    case 'draft/round.submitted.email.batch':
    case 'draft/lottery.intervened.email.batch':
    case 'draft/draft.concluded.email.batch':
    case 'draft/draft.finalization.email.batch':
    case 'draft/user.assigned.email.batch':
      return event;
    default:
      throw new Error('unreachable email event type');
  }
}

export function createBatchEvent(envelope: EmailBatchEnvelopeSchema, attempt?: number) {
  switch (envelope.name) {
    case 'draft/round.started.email.batch':
      return RoundStartedBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    case 'draft/round.submitted.email.batch':
      return RoundSubmittedBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    case 'draft/lottery.intervened.email.batch':
      return LotteryInterventionBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    case 'draft/draft.concluded.email.batch':
      return DraftConcludedBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    case 'draft/draft.finalization.email.batch':
      return DraftFinalizationBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    case 'draft/user.assigned.email.batch':
      return UserAssignedBatchEmailEvent.create(
        typeof attempt === 'undefined' ? envelope.data : { ...envelope.data, attempt },
      );
    default:
      throw new Error('unreachable email event type');
  }
}

export function groupEnvelopesByThreadKey(envelopes: EmailBatchEnvelopeSchema[]) {
  const groups = new Map<string, { key: GmailThreadKey; envelopes: EmailBatchEnvelopeSchema[] }>();
  for (const envelope of envelopes) {
    const key = getGmailThreadKey(envelope);
    const keyString = getGmailThreadKeyString(key);
    const group = groups.get(keyString);
    if (typeof group === 'undefined') groups.set(keyString, { key, envelopes: [envelope] });
    else group.envelopes.push(envelope);
  }
  return groups;
}

export function getGmailThreadKey(envelope: EmailBatchEnvelopeSchema): GmailThreadKey {
  const { data } = envelope;
  return {
    draftId: BigInt(data.draftId),
    eventType: getGmailThreadEventType(envelope.name),
    round: getGmailThreadRound(envelope),
    recipientUserId: data.recipientUserId,
  };
}

export function getGmailThreadKeyString(key: GmailThreadKey) {
  return `${key.draftId}:${key.eventType}:${key.round ?? ''}:${key.recipientUserId}`;
}

export function getGmailThreadRowsByKey(
  rows: {
    draftId: bigint;
    eventType: schema.InngestEventName;
    round: number | null;
    recipientUserId: string;
    gmailThreadId: string | null;
    gmailMessageIds: string[];
  }[],
) {
  return new Map(rows.map(row => [getGmailThreadKeyString(row), row]));
}

export async function createEmailMessage(
  envelope: EmailBatchEnvelopeSchema,
  sender: SenderIdentity,
  thread?: ThreadRenderData,
) {
  let recipient: string;
  let subject: string;
  let html: string;

  switch (envelope.name) {
    case 'draft/round.started.email.batch': {
      recipient = envelope.data.recipientEmail;
      subject =
        envelope.data.round === null
          ? `[DRAP] Lottery Round for Draft ${envelope.data.draftYear} has begun!`
          : `[DRAP] Round #${envelope.data.round} for Draft ${envelope.data.draftYear} has begun!`;
      html = await emailRenderer.render(RoundStarted, {
        props: {
          draftYear: envelope.data.draftYear,
          round: envelope.data.round,
        } satisfies ComponentProps<typeof RoundStarted>,
      });
      break;
    }
    case 'draft/round.submitted.email.batch': {
      recipient = envelope.data.recipientEmail;
      subject = `[DRAP] Draft ${envelope.data.draftYear} Round #${envelope.data.round} Preference Acknowledgements`;
      html = await emailRenderer.render(RoundSubmitted, {
        props: {
          labName: envelope.data.labName,
          round: envelope.data.round,
          draftYear: envelope.data.draftYear,
          isCreate: envelope.data.isCreate,
        } satisfies ComponentProps<typeof RoundSubmitted>,
      });
      break;
    }
    case 'draft/lottery.intervened.email.batch': {
      recipient = envelope.data.recipientEmail;
      subject = `[DRAP] Draft ${envelope.data.draftYear} Lottery Intervention Updates`;
      html = await emailRenderer.render(LotteryIntervened, {
        props: {
          studentName: envelope.data.studentName,
          studentEmail: envelope.data.studentEmail,
          avatarUrl: envelope.data.avatarUrl,
          labName: envelope.data.labName,
          draftYear: envelope.data.draftYear,
        } satisfies ComponentProps<typeof LotteryIntervened>,
      });
      break;
    }
    case 'draft/draft.concluded.email.batch': {
      recipient = envelope.data.recipientEmail;
      subject = `[DRAP] Draft ${envelope.data.draftYear} Concluded`;
      html = await emailRenderer.render(DraftConcluded, {
        props: {
          draftId: envelope.data.draftId,
          draftYear: envelope.data.draftYear,
          lotteryAssignments: envelope.data.lotteryAssignments,
        } satisfies ComponentProps<typeof DraftConcluded>,
      });
      break;
    }
    case 'draft/draft.finalization.email.batch': {
      recipient = envelope.data.recipientEmail;
      subject = `[DRAP] Draft ${envelope.data.draftYear} Finalized`;
      html = await emailRenderer.render(DraftFinalization, {
        props: {
          draftId: envelope.data.draftId,
          draftYear: envelope.data.draftYear,
        } satisfies ComponentProps<typeof DraftFinalization>,
      });
      break;
    }
    case 'draft/user.assigned.email.batch':
      recipient = envelope.data.userEmail;
      subject = '[DRAP] Your Draft Assignment Results';
      html = await emailRenderer.render(UserAssigned, {
        props: {
          userName: envelope.data.userName,
          labName: envelope.data.labName,
        } satisfies ComponentProps<typeof UserAssigned>,
      });
      break;
    default:
      throw new Error('unreachable email event type');
  }

  const mime = createMimeMessage();
  mime.setSender({
    name: `[DRAP] ${sender.givenName} ${sender.familyName}`,
    addr: sender.email,
  });
  mime.setRecipient(recipient);
  mime.setSubject(subject);
  mime.addMessage({
    contentType: 'text/plain',
    encoding: 'base64',
    data: Buffer.from(toPlainText(html), 'utf-8').toString('base64'),
  });
  mime.addMessage({
    contentType: 'text/html',
    encoding: 'base64',
    data: Buffer.from(html, 'utf-8').toString('base64'),
  });

  if (typeof thread === 'undefined')
    return { message: mime, gmailMessageId: envelope.data.gmailMessageId };

  const latestMessageId = thread.gmailMessageIds.at(-1);
  assert(typeof latestMessageId !== 'undefined', 'threaded email requires a prior message id');

  mime.setHeaders({
    'In-Reply-To': latestMessageId,
    References: thread.gmailMessageIds.join(' '),
  });
  return {
    message: mime,
    gmailThreadId: thread.gmailThreadId,
    gmailMessageId: envelope.data.gmailMessageId,
  };
}

export function isRetryableGmailStatus(status: number) {
  switch (status) {
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
      return true;
    default:
      return false;
  }
}

function getGmailThreadEventType(name: EmailBatchEnvelopeSchema['name']): schema.InngestEventName {
  switch (name) {
    case 'draft/round.started.email.batch':
      return 'round-started';
    case 'draft/round.submitted.email.batch':
      return 'round-submitted';
    case 'draft/lottery.intervened.email.batch':
      return 'lottery-intervened';
    case 'draft/draft.concluded.email.batch':
      return 'draft-concluded';
    case 'draft/draft.finalization.email.batch':
      return 'draft-finalization';
    case 'draft/user.assigned.email.batch':
      return 'user-assigned';
    default:
      throw new Error('unreachable email event type');
  }
}

function getGmailThreadRound(envelope: EmailBatchEnvelopeSchema) {
  switch (envelope.name) {
    case 'draft/round.started.email.batch':
    case 'draft/round.submitted.email.batch':
      return envelope.data.round;
    default:
      return null;
  }
}
