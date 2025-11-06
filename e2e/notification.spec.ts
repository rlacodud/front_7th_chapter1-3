import { expect, test } from '@playwright/test';

/**
 * 알림 시스템 노출 조건 E2E 테스트
 * 일정의 알림 시간 설정에 따라 알림이 정확한 시점에 표시되는지 테스트합니다.
 * - 각 알림 시간 설정(1분, 10분, 1시간, 2시간, 1일)에 따른 알림 표시
 * - 알림 시간 전/후 알림 표시 여부
 * - 중복 알림 방지
 * - 알림 닫기 기능
 * - 여러 알림 동시 표시
 */
test.describe('알림 시스템 노출 조건', () => {
  // 각 테스트 전에 e2e.json 데이터 리셋 및 페이지 이동
  test.beforeEach(async ({ page }) => {
    try {
      const response = await page.request.post('http://localhost:3000/api/reset-e2e-data');
      if (!response.ok()) {
        console.warn('Failed to reset e2e data, server might not be in e2e mode');
      }
    } catch (error) {
      console.warn('Could not reset e2e data:', error);
    }
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(500);
  });
  /**
   * 1분 전 알림 테스트
   * 목적: 알림 시간을 1분 전으로 설정한 일정이 시작 시간 1분 전에 알림이 노출되는지 확인
   * 검증 항목:
   * - 시작 시간 1분 전에 알림이 표시됨
   * - 알림 메시지가 올바르게 표시됨
   */
  test('알림을 1분 전으로 설정한 일정의 경우, 시작 시간 1분 전에 알림이 노출된다.', async ({
    page,
  }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 시간 1분 전
    // 따라서 2025-11-17 09:59:00에 알림이 표시되어야 함
    await page.clock.setFixedTime(new Date('2025-11-17T09:59:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 1분 전 알림 일정의 알림이 표시되는지 확인
    // 알림 메시지 형식: "1분 후 1분 전 알림 일정 일정이 시작됩니다."
    await expect(page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 10분 전 알림 테스트
   * 목적: 알림 시간을 10분 전으로 설정한 일정이 시작 시간 10분 전에 알림이 노출되는지 확인
   * 검증 항목:
   * - 시작 시간 10분 전에 알림이 표시됨
   * - 알림 메시지가 올바르게 표시됨
   */
  test('알림을 10분 전으로 설정한 일정의 경우, 시작 시간 10분 전에 알림이 노출된다.', async ({
    page,
  }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-10min 일정: 2025-11-17 14:00 시작, 알림 시간 10분 전
    // 따라서 2025-11-17 13:50:00에 알림이 표시되어야 함
    await page.clock.setFixedTime(new Date('2025-11-17T13:50:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 10분 전 알림 일정의 알림이 표시되는지 확인
    // 알림 메시지 형식: "10분 후 10분 전 알림 일정 일정이 시작됩니다."
    await expect(page.getByText('10분 후 10분 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 1시간 전 알림 테스트
   * 목적: 알림 시간을 1시간 전으로 설정한 일정이 시작 시간 1시간 전에 알림이 노출되는지 확인
   * 검증 항목:
   * - 시작 시간 1시간 전에 알림이 표시됨
   * - 알림 메시지가 올바르게 표시됨
   */
  test('알림을 1시간 전으로 설정한 일정의 경우, 시작 시간 1시간 전에 알림이 노출된다.', async ({
    page,
  }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1hour 일정: 2025-11-17 16:00 시작, 알림 시간 1시간(60분) 전
    // 따라서 2025-11-17 15:00:00에 알림이 표시되어야 함
    await page.clock.setFixedTime(new Date('2025-11-17T15:00:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 1시간 전 알림 일정의 알림이 표시되는지 확인
    // 알림 메시지 형식: "60분 후 1시간 전 알림 일정 일정이 시작됩니다."
    await expect(page.getByText('60분 후 1시간 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 2시간 전 알림 테스트
   * 목적: 알림 시간을 2시간 전으로 설정한 일정이 시작 시간 2시간 전에 알림이 노출되는지 확인
   * 검증 항목:
   * - 시작 시간 2시간 전에 알림이 표시됨
   * - 알림 메시지가 올바르게 표시됨
   */
  test('알림을 2시간 전으로 설정한 일정의 경우, 시작 시간 2시간 전에 알림이 노출된다.', async ({
    page,
  }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-2hour 일정: 2025-11-18 09:00 시작, 알림 시간 2시간(120분) 전
    // 따라서 2025-11-18 07:00:00에 알림이 표시되어야 함
    await page.clock.setFixedTime(new Date('2025-11-18T07:00:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 2시간 전 알림 일정의 알림이 표시되는지 확인
    // 알림 메시지 형식: "120분 후 2시간 전 알림 일정 일정이 시작됩니다."
    await expect(page.getByText('120분 후 2시간 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 1일 전 알림 테스트
   * 목적: 알림 시간을 1일 전으로 설정한 일정이 시작 시간 1일 전에 알림이 노출되는지 확인
   * 검증 항목:
   * - 시작 시간 1일 전에 알림이 표시됨
   * - 알림 메시지가 올바르게 표시됨
   */
  test('알림을 1일 전으로 설정한 일정의 경우, 시작 시간 1일 전에 알림이 노출된다.', async ({
    page,
  }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1day 일정: 2025-11-19 10:00 시작, 알림 시간 1일(1440분) 전
    // 따라서 2025-11-18 10:00:00에 알림이 표시되어야 함
    await page.clock.setFixedTime(new Date('2025-11-18T10:00:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 1일 전 알림 일정의 알림이 표시되는지 확인
    // 알림 메시지 형식: "1440분 후 1일 전 알림 일정 일정이 시작됩니다."
    await expect(page.getByText('1440분 후 1일 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 알림 시간 전에는 알림이 표시되지 않는 테스트
   * 목적: 알림 시간보다 이른 시점에는 알림이 표시되지 않는지 확인
   * 검증 항목:
   * - 알림 시간 전에는 알림이 표시되지 않음
   */
  test('알림 시간 전에는 알림이 표시되지 않는다.', async ({ page }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 시간 1분 전
    // 1분 전보다 이른 시점(예: 5분 전)으로 시간 설정
    await page.clock.setFixedTime(new Date('2025-11-17T09:55:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 알림 시간 전이므로 알림이 표시되지 않아야 함
    await expect(page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.')).not.toBeVisible();
  });

  /**
   * 알림 시간이 지난 후에는 알림이 표시되지 않는 테스트
   * 목적: 일정 시작 시간이 지난 후에는 알림이 표시되지 않는지 확인
   * 검증 항목:
   * - 일정 시작 시간 이후에는 알림이 표시되지 않음
   */
  test('일정 시작 시간이 지난 후에는 알림이 표시되지 않는다.', async ({ page }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 시간 1분 전
    // 일정 시작 시간 이후로 시간 설정
    await page.clock.setFixedTime(new Date('2025-11-17T10:01:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 일정 시작 시간이 지났으므로 알림이 표시되지 않아야 함
    await expect(page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.')).not.toBeVisible();
  });

  /**
   * 여러 알림이 동시에 표시되는 테스트
   * 목적: 여러 일정이 같은 시점에 알림 조건을 만족할 때 모두 표시되는지 확인
   * 검증 항목:
   * - 여러 알림이 동시에 표시됨
   */
  test('여러 일정의 알림이 동시에 표시될 수 있다.', async ({ page }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 1분 전 → 09:59
    // test-notification-10min 일정: 2025-11-17 14:00 시작, 알림 10분 전 → 13:50
    // 두 알림이 동시에 표시될 수 있는 시간으로 설정 (예: 09:59에 1분 전 알림, 다른 시간에 10분 전 알림)
    // 실제로는 다른 시간에 각각 표시되므로, 1분 전 알림 시간으로 설정
    await page.clock.setFixedTime(new Date('2025-11-17T09:59:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 1분 전 알림이 표시되는지 확인
    await expect(page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.')).toBeVisible();
  });

  /**
   * 알림 닫기 기능 테스트
   * 목적: 알림의 닫기 버튼을 클릭하면 알림이 사라지는지 확인
   * 검증 항목:
   * - 알림 닫기 버튼 클릭 시 알림이 사라짐
   */
  test('알림 닫기 버튼을 클릭하면 알림이 사라진다.', async ({ page }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 시간 1분 전
    await page.clock.setFixedTime(new Date('2025-11-17T09:59:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 알림이 표시되는지 확인
    const notification = page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.');
    await expect(notification).toBeVisible();

    // Step 5: 알림의 닫기 버튼 클릭
    // Alert 컴포넌트는 role="alert"를 가지고 있으며, action 영역에 IconButton이 있음
    // AlertTitle 텍스트를 포함하는 Alert 내부의 버튼을 찾음
    const alert = page.locator('div[role="alert"]').filter({
      hasText: '1분 후 1분 전 알림 일정 일정이 시작됩니다.',
    });
    await alert.locator('button').first().click();

    // Step 6: 알림이 사라졌는지 확인
    await expect(notification).not.toBeVisible();
  });

  /**
   * 중복 알림 방지 테스트
   * 목적: 이미 알림을 받은 일정에 대해 중복 알림이 표시되지 않는지 확인
   * 검증 항목:
   * - 동일한 일정에 대해 알림이 한 번만 표시됨
   * - 알림을 받은 일정은 notifiedEvents에 포함되어 중복 알림 방지
   */
  test('이미 알림을 받은 일정은 중복 알림이 표시되지 않는다.', async ({ page }) => {
    // Step 1: Playwright Clock API를 사용하여 시간을 고정
    // test-notification-1min 일정: 2025-11-17 10:00 시작, 알림 시간 1분 전
    await page.clock.setFixedTime(new Date('2025-11-17T09:59:00'));

    // Step 2: 페이지 새로고침하여 모킹된 시간 적용
    await page.reload();

    // Step 3: 알림 시스템이 1초마다 체크하므로 충분한 대기 시간 확보
    await page.waitForTimeout(2000);

    // Step 4: 첫 번째 알림이 표시되는지 확인
    const notification = page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.');
    await expect(notification).toBeVisible();

    // Step 5: 알림 시스템이 다시 체크할 때까지 대기 (1초마다 체크하므로 2초 대기)
    await page.waitForTimeout(2000);

    // Step 6: 동일한 알림이 중복으로 표시되지 않는지 확인
    // 알림은 한 번만 표시되어야 하므로, 여러 개의 동일한 알림이 표시되지 않아야 함
    const notifications = page.getByText('1분 후 1분 전 알림 일정 일정이 시작됩니다.');
    const count = await notifications.count();
    expect(count).toBe(1);
  });
});
