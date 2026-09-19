import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';
import { describe, expect, test } from 'vitest';

import { getQuotaPieChartData, getTotalQuota } from './data';

const csl: DraftLabQuotaSnapshot = {
  labId: 'csl',
  labName: 'Computer Science Laboratory',
  initialQuota: 5,
  lotteryQuota: 0,
};

const ndsl: DraftLabQuotaSnapshot = {
  labId: 'ndsl',
  labName: 'Networks and Distributed Systems Laboratory',
  initialQuota: 0,
  lotteryQuota: 3,
};

const snapshots: DraftLabQuotaSnapshot[] = [
  csl,
  ndsl,
  {
    labId: 'acl',
    labName: 'Algorithms and Complexity Laboratory',
    initialQuota: 10,
    lotteryQuota: 2,
  },
];

describe('quota pie chart data', () => {
  test('includes every snapshot when calculating the total', () => {
    expect(getTotalQuota(snapshots, 'initial')).toBe(15);
    expect(getTotalQuota(snapshots, 'lottery')).toBe(5);
  });

  test('filters non-positive quotas before creating chart data', () => {
    expect(getQuotaPieChartData(snapshots, 'initial')).toEqual([
      {
        key: 'CSL',
        label: 'CSL',
        labName: 'Computer Science Laboratory',
        value: 5,
      },
      {
        key: 'ACL',
        label: 'ACL',
        labName: 'Algorithms and Complexity Laboratory',
        value: 10,
      },
    ]);
  });

  test('creates data from lottery quotas independently of initial quotas', () => {
    expect(getQuotaPieChartData(snapshots, 'lottery')).toEqual([
      {
        key: 'NDSL',
        label: 'NDSL',
        labName: 'Networks and Distributed Systems Laboratory',
        value: 3,
      },
      {
        key: 'ACL',
        label: 'ACL',
        labName: 'Algorithms and Complexity Laboratory',
        value: 2,
      },
    ]);
  });

  test('returns no data for empty and all-zero quotas', () => {
    expect(getTotalQuota([], 'initial')).toBe(0);
    expect(getQuotaPieChartData([], 'initial')).toEqual([]);

    const noQuotaSnapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'Computer Science Laboratory', initialQuota: 0, lotteryQuota: 0 },
    ];

    expect(getTotalQuota(noQuotaSnapshots, 'initial')).toBe(0);
    expect(getQuotaPieChartData(noQuotaSnapshots, 'initial')).toEqual([]);
  });
});
