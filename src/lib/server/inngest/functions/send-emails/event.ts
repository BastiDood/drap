import type { ComponentProps } from 'svelte';
import { createMimeMessage } from 'mimetext/node';
import { toPlainText } from '@better-svelte-email/server';

import { assertDefined } from '$lib/server/assert';
import type { EmailEvent } from '$lib/server/inngest/schema';

import type { SenderIdentity } from './auth';

import DraftConcluded from './templates/draft-concluded.svelte';
import DraftFinalization from './templates/draft-finalization.svelte';
import LotteryIntervened from './templates/lottery-intervened.svelte';
import RoundStarted from './templates/round-started.svelte';
import RoundSubmitted from './templates/round-submitted.svelte';
import UserAssigned from './templates/user-assigned.svelte';
import { emailRenderer } from './templates/renderer';

interface ThreadRenderData {
  gmailThreadId: string;
  gmailMessageIds: string[];
}

export async function createEmailMessage(
  email: EmailEvent,
  sender: SenderIdentity,
  thread?: ThreadRenderData,
) {
  let recipient: string;
  let subject: string;
  let html: string;

  switch (email.name) {
    case 'round-started': {
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
    case 'round-submitted': {
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
    case 'lottery-intervened': {
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
    case 'draft-concluded': {
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
    case 'draft-finalization': {
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
    case 'user-assigned':
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
