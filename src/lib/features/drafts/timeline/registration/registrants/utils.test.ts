import { describe, expect, test } from 'vitest';

import {
  buildRegistrationTimelineData,
  getRegistrationClosedAnnotationDay,
  getRegistrationTimelineEnd,
} from './utils';

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

describe('getRegistrationTimelineEnd', () => {
  test('extends the chart to include the close annotation boundary', () => {
    const chartEnd = new Date(2026, 5, 27, 12);
    const closedAt = new Date(2026, 5, 27, 23, 59);
    const expected = new Date(2026, 5, 28);

    expect(getRegistrationTimelineEnd(chartEnd, closedAt).getTime()).toBe(expected.getTime());
  });

  test('preserves the chart end when it already includes the close annotation boundary', () => {
    const chartEnd = new Date(2026, 5, 28, 9);
    const closedAt = new Date(2026, 5, 27, 23, 59);

    expect(getRegistrationTimelineEnd(chartEnd, closedAt).getTime()).toBe(chartEnd.getTime());
  });
});
