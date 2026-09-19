import { assertLogout } from './actions/session';
import { test } from './fixtures/users';

test.describe('Session Termination', { tag: '@logout' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('admin can log out', async ({ adminPage }) => await assertLogout(adminPage));
  test('NDSL head can log out', async ({ ndslHeadPage }) => await assertLogout(ndslHeadPage));
  test('CSL head can log out', async ({ cslHeadPage }) => await assertLogout(cslHeadPage));
  test('SCL head can log out', async ({ sclHeadPage }) => await assertLogout(sclHeadPage));
  test('CVMIL head can log out', async ({ cvmilHeadPage }) => await assertLogout(cvmilHeadPage));
  test('ACL head can log out', async ({ aclHeadPage }) => await assertLogout(aclHeadPage));
  test('Eager can log out', async ({ eagerDrafteePage }) => await assertLogout(eagerDrafteePage));
  test('Patient can log out', async ({ patientCandidatePage }) =>
    await assertLogout(patientCandidatePage));
  test('Persistent can log out', async ({ persistentHopefulPage }) =>
    await assertLogout(persistentHopefulPage));
  test('Unlucky can log out', async ({ unluckyFullRankerPage }) =>
    await assertLogout(unluckyFullRankerPage));
  test('NoRank can log out', async ({ noRankStudentPage }) =>
    await assertLogout(noRankStudentPage));
  test('Idle can log out', async ({ idleBystanderPage }) => await assertLogout(idleBystanderPage));
  test('Late can log out', async ({ lateRegistrantPage }) =>
    await assertLogout(lateRegistrantPage));
  test('PartialToDrafted can log out', async ({ partialToDraftedPage }) =>
    await assertLogout(partialToDraftedPage));
  test('PartialToLottery can log out', async ({ partialToLotteryPage }) =>
    await assertLogout(partialToLotteryPage));
  test('SecondNdslFirstChoice can log out', async ({ secondRoundNdslFirstChoicePage }) =>
    await assertLogout(secondRoundNdslFirstChoicePage));
  test('SecondCslFirstChoice can log out', async ({ secondRoundCslFirstChoicePage }) =>
    await assertLogout(secondRoundCslFirstChoicePage));
  test('SecondSclSecondChoice can log out', async ({ secondRoundSclSecondChoicePage }) =>
    await assertLogout(secondRoundSclSecondChoicePage));
  test('SnapshotGuard can log out', async ({ snapshotGuardStudentPage }) =>
    await assertLogout(snapshotGuardStudentPage));
  test('Repeat can log out', async ({ repeatDrafteePage }) =>
    await assertLogout(repeatDrafteePage));
});
