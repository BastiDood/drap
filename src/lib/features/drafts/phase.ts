import type { Draft } from './types';

export const enum DraftPhase {
  Registration = 'registration',
  RegistrationClosed = 'registration-closed',
  Regular = 'regular',
  Intervention = 'intervention',
  Review = 'review',
  Finalized = 'finalized',
}

export function getDraftPhase(
  draft: Pick<Draft, 'activePeriodEnd' | 'currRound' | 'maxRounds' | 'isRegistrationClosed'>,
) {
  if (draft.activePeriodEnd !== null) return DraftPhase.Finalized;
  if (draft.currRound === null) return DraftPhase.Review;
  if (draft.currRound === 0)
    return draft.isRegistrationClosed ? DraftPhase.RegistrationClosed : DraftPhase.Registration;
  if (draft.currRound > draft.maxRounds) return DraftPhase.Intervention;
  return DraftPhase.Regular;
}

export function isInterventionsRendered(phase: DraftPhase) {
  switch (phase) {
    case DraftPhase.Intervention:
    case DraftPhase.Review:
    case DraftPhase.Finalized:
      return true;
    default:
      return false;
  }
}

export function isLotteryRendered(phase: DraftPhase) {
  switch (phase) {
    case DraftPhase.Review:
    case DraftPhase.Finalized:
      return true;
    default:
      return false;
  }
}
