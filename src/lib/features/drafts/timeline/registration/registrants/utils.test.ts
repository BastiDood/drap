import { describe, expect, test } from 'vitest';

import { buildRegistrationTimelineData, getRegistrationClosedAnnotationDay } from './utils';

describe('buildRegistrationTimelineData', () => {
  test('buckets registration timestamps by the local calendar day', () => {
    const june27 = new Date(2026, 5, 27);
    const june28 = new Date(2026, 5, 28);
    const data = buildRegistrationTimelineData({
      draftCreatedAt: new Date(2026, 5, 27, 9),
      chartEnd: new Date(2026, 5, 28, 10),
      registrationTimestamps: [
        new Date(2026, 5, 27, 23, 59).toISOString(),
        new Date(2026, 5, 28, 0, 1).toISOString(),
      ],
    });

    expect(data.map(({ date, count }) => [date.getTime(), count])).toEqual([
      [june27.getTime(), 1],
      [june28.getTime(), 1],
    ]);
  });
});

describe('getRegistrationClosedAnnotationDay', () => {
  test('places a late-night close marker at the next local day boundary', () => {
    const closedAt = new Date(2026, 5, 27, 23, 59);
    const expected = new Date(2026, 5, 28);

    expect(getRegistrationClosedAnnotationDay(closedAt).getTime()).toBe(expected.getTime());
  });
});
