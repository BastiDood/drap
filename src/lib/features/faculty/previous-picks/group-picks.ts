interface Researcher {
  round: number;
}

export function groupPreviousPicks<T extends Researcher>(researchers: T[]) {
  const researchersByRound = Object.groupBy(researchers, r => r.round);
  const latestRound = Math.max(...Object.keys(researchersByRound).map(Number)).toString();
  const sortedRounds = Object.keys(researchersByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return { researchersByRound, latestRound, sortedRounds };
}
