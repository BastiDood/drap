import { NonRetriableError } from 'inngest';

export class ManualMetadataReconciliationRequiredError extends NonRetriableError {
  constructor(options: ErrorOptions) {
    super('gmail send succeeded but metadata requires manual reconciliation', options);
    this.name = 'ManualMetadataReconciliationRequiredError';
  }
}

export class UnreachableEmailEventTypeError extends Error {
  constructor() {
    super('unreachable email event type');
    this.name = 'UnreachableEmailEventTypeError';
  }
}

export class MissingGmailBatchResultError extends Error {
  constructor(public readonly contentId: string) {
    super(`missing gmail batch result for content ${contentId}`);
    this.name = 'MissingGmailBatchResultError';
  }
}

export class MissingGmailSeedBatchResultError extends Error {
  constructor(public readonly rowId: number) {
    super(`missing gmail seed batch result for row ${rowId}`);
    this.name = 'MissingGmailSeedBatchResultError';
  }
}

export class MissingGmailMetadataResultError extends Error {
  constructor(public readonly gmailMessageId: string) {
    super(`missing gmail metadata result for message ${gmailMessageId}`);
    this.name = 'MissingGmailMetadataResultError';
  }
}
