import type * as v from 'valibot';
import type { ComponentProps } from 'svelte';
import { createMimeMessage } from 'mimetext/node';
import { toPlainText } from '@better-svelte-email/server';

import { assertDefined } from '$lib/server/assert';
import { EmailSeedEvent } from '$lib/server/inngest/schema';
import type { GmailThreadKey, schema } from '$lib/server/database/drizzle';

import type { SenderIdentity } from './auth';

import DraftConcluded from './templates/draft-concluded.svelte';
import DraftFinalization from './templates/draft-finalization.svelte';
import LotteryIntervened from './templates/lottery-intervened.svelte';
import RoundStarted from './templates/round-started.svelte';
import RoundSubmitted from './templates/round-submitted.svelte';
import UserAssigned from './templates/user-assigned.svelte';
import { emailRenderer } from './templates/renderer';

type EmailEnvelope = v.InferOutput<typeof EmailSeedEvent.schema>['seed'];

interface ThreadRenderData {
  gmailThreadId: string;
  gmailMessageIds: string[];
}

export function groupEmailsByThreadKey<const TEmail extends EmailEnvelope>(
  emails: IteratorObject<TEmail>,
) {
  return emails.reduce((groups, email) => {
    const key = getGmailThreadKey(email);
    const keyString = getGmailThreadKeyString(key);
    const group = groups.get(keyString);
    if (typeof group === 'undefined') groups.set(keyString, { key, emails: [email] });
    else group.emails.push(email);
    return groups;
  }, new Map<string, { key: GmailThreadKey; emails: TEmail[] }>());
}

export function getGmailThreadKey(email: EmailEnvelope): GmailThreadKey {
  const { data } = email;
  return {
    draftId: BigInt(data.draftId),
    eventType: getGmailThreadEventType(email.name),
    round: getGmailThreadRound(email),
    recipientUserId: data.recipientUserId,
  };
}

export function getGmailThreadKeyString(key: GmailThreadKey) {
  return `${key.draftId}:${key.eventType}:${key.round ?? ''}:${key.recipientUserId}`;
}

export function getGmailThreadRowsByKey(
  rows: IteratorObject<{
    id: bigint;
    draftId: bigint;
    eventType: schema.InngestEventName;
    round: number | null;
    recipientUserId: string;
    gmailThreadId: string | null;
    gmailMessageIds: string[];
  }>,
) {
  return new Map(rows.map(row => [getGmailThreadKeyString(row), row]));
}

export async function createEmailMessage(
  email: EmailEnvelope,
  sender: SenderIdentity,
  thread?: ThreadRenderData,
) {
  let recipient: string;
  let subject: string;
  let html: string;

  switch (email.name) {
    case 'draft/round.started.email.seed': {
      recipient = email.data.recipientEmail;
      subject =
        email.data.round === null
          ? `[DRAP] Lottery Round for Draft ${email.data.draftYear} has begun!`
          : `[DRAP] Round #${email.data.round} for Draft ${email.data.draftYear} has begun!`;
      html = await emailRenderer.render(RoundStarted, {
        props: {
          draftYear: email.data.draftYear,
          round: email.data.round,
        } satisfies ComponentProps<typeof RoundStarted>,
      });
      break;
    }
    case 'draft/round.submitted.email.seed': {
      recipient = email.data.recipientEmail;
      subject = `[DRAP] Draft ${email.data.draftYear} Round #${email.data.round} Preference Acknowledgements`;
      html = await emailRenderer.render(RoundSubmitted, {
        props: {
          labName: email.data.labName,
          round: email.data.round,
          draftYear: email.data.draftYear,
          isCreate: email.data.isCreate,
        } satisfies ComponentProps<typeof RoundSubmitted>,
      });
      break;
    }
    case 'draft/lottery.intervened.email.seed': {
      recipient = email.data.recipientEmail;
      subject = `[DRAP] Draft ${email.data.draftYear} Lottery Intervention Updates`;
      html = await emailRenderer.render(LotteryIntervened, {
        props: {
          studentName: email.data.studentName,
          studentEmail: email.data.studentEmail,
          avatarUrl: email.data.avatarUrl,
          labName: email.data.labName,
          draftYear: email.data.draftYear,
        } satisfies ComponentProps<typeof LotteryIntervened>,
      });
      break;
    }
    case 'draft/draft.concluded.email.seed': {
      recipient = email.data.recipientEmail;
      subject = `[DRAP] Draft ${email.data.draftYear} Concluded`;
      html = await emailRenderer.render(DraftConcluded, {
        props: {
          draftId: email.data.draftId,
          draftYear: email.data.draftYear,
          lotteryAssignments: email.data.lotteryAssignments,
        } satisfies ComponentProps<typeof DraftConcluded>,
      });
      break;
    }
    case 'draft/draft.finalization.email.seed': {
      recipient = email.data.recipientEmail;
      subject = `[DRAP] Draft ${email.data.draftYear} Finalized`;
      html = await emailRenderer.render(DraftFinalization, {
        props: {
          draftId: email.data.draftId,
          draftYear: email.data.draftYear,
        } satisfies ComponentProps<typeof DraftFinalization>,
      });
      break;
    }
    case 'draft/user.assigned.email.seed':
      recipient = email.data.userEmail;
      subject = '[DRAP] Your Draft Assignment Results';
      html = await emailRenderer.render(UserAssigned, {
        props: {
          userName: email.data.userName,
          labName: email.data.labName,
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

  if (typeof thread === 'undefined') return { message: mime };

  const latestMessageId = assertDefined(thread.gmailMessageIds.at(-1));

  mime.setHeaders({
    'In-Reply-To': latestMessageId,
    References: thread.gmailMessageIds.join(' '),
  });
  return {
    message: mime,
    gmailThreadId: thread.gmailThreadId,
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

function getGmailThreadEventType(name: EmailEnvelope['name']): schema.InngestEventName {
  switch (name) {
    case 'draft/round.started.email.seed':
      return 'round-started';
    case 'draft/round.submitted.email.seed':
      return 'round-submitted';
    case 'draft/lottery.intervened.email.seed':
      return 'lottery-intervened';
    case 'draft/draft.concluded.email.seed':
      return 'draft-concluded';
    case 'draft/draft.finalization.email.seed':
      return 'draft-finalization';
    case 'draft/user.assigned.email.seed':
      return 'user-assigned';
    default:
      throw new Error('unreachable email event type');
  }
}

function getGmailThreadRound(email: EmailEnvelope) {
  switch (email.name) {
    case 'draft/round.started.email.seed':
    case 'draft/round.submitted.email.seed':
      return email.data.round;
    default:
      return null;
  }
}
