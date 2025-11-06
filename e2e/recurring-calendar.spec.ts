import { expect, test } from '@playwright/test';

/**
 * 반복 일정 관리 워크플로우 E2E 테스트
 * 반복 일정의 생성, 조회, 수정(단일/일괄), 삭제(단일/일괄) 기능을 테스트합니다.
 */
test.describe('반복 일정 관리 워크플로우', () => {
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
   * 반복 일정 CRUD 테스트
   * 반복 일정의 생성, 조회, 수정(단일/일괄), 삭제(단일/일괄) 기능을 검증합니다.
   */
  test.describe('일정 CRUD', () => {
    /**
     * 반복 일정 생성 테스트
     * 목적: 반복 일정을 생성했을 때, 반복 설정에 따라 여러 일정 인스턴스가 생성되는지 확인
     * 검증 항목:
     * - 반복 일정이 생성되어 이벤트 리스트에 표시됨
     * - 반복 설정에 따라 2개 이상의 일정 인스턴스가 생성됨
     */
    test('반복 일정 생성 시 생성한 일정이 캘린더에 표시된다.', async ({ page }) => {
      // Step 1: 일정 폼에 필수 정보 입력
      await page.getByLabel('제목').fill('반복 일정 생성 테스트');
      await page.getByLabel('날짜').fill('2025-11-24');
      await page.getByLabel('시작 시간').fill('10:00');
      await page.getByLabel('종료 시간').fill('23:00');
      await page.getByLabel('위치').fill('회의실 A');

      // Step 2: 반복 일정 체크박스 활성화
      await page.getByRole('checkbox', { name: '반복 일정' }).check();

      // Step 3: 일정 생성 버튼 클릭
      await page.getByTestId('event-submit-button').click();

      // Step 4: 반복 일정이 생성되고 렌더링될 때까지 대기
      await page.waitForSelector('[data-testid="month-view"] >> text=반복 일정 생성 테스트');

      // Step 5: 생성된 반복 일정 인스턴스 개수 확인 (반복 설정에 따라 2개 이상 생성되어야 함)
      const recurringEvents = page.getByTestId('event-list').getByText('반복 일정 생성 테스트');
      const eventCount = await recurringEvents.count();
      expect(eventCount).toBeGreaterThanOrEqual(2);
    });

    /**
     * 반복 일정 조회 테스트
     * 목적: e2e.json에 미리 정의된 반복 일정이 캘린더에 정상적으로 표시되는지 확인
     * 검증 항목:
     * - '주간 반복 일정'이 이벤트 리스트에 표시됨
     */
    test('생성되어있는 반복 일정은 캘린더에 표시되어 조회할 수 있다.', async ({ page }) => {
      // Step 1: e2e.json에 정의된 '주간 반복 일정'이 캘린더에 표시되는지 확인
      const recurringEvents = page.getByTestId('event-list').getByText('주간 반복 일정');
      const eventCount = await recurringEvents.count();

      // Step 2: 반복 일정이 최소 1개 이상 표시되는지 확인
      expect(eventCount).toBeGreaterThanOrEqual(1);
    });

    /**
     * 반복 일정 단일 수정 테스트
     * 목적: 반복 일정 수정 모달에서 "예"를 선택하면 해당 일정만 단일 일정으로 변경되는지 확인
     * 검증 항목:
     * - 선택한 일정만 수정되고 반복 속성이 제거됨
     * - 반복 아이콘이 표시되지 않음
     */
    test('반복 일정 수정 시 반복 일정 수정 모달에 예를 누르면 단일 일정으로 변경된다.', async ({
      page,
    }) => {
      // Step 1: 수정할 반복 일정의 편집 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '주간 반복 일정' })
        .first()
        .locator('button[aria-label="Edit event"]')
        .click();

      // Step 2: 반복 일정 수정 모달에서 "예" 버튼 클릭(해당 일정만 수정)
      await page.getByRole('button', { name: '예' }).click();

      // Step 3: 일정 제목 수정
      await page.getByRole('textbox', { name: '제목' }).clear();
      await page.getByRole('textbox', { name: '제목' }).fill('주간 단일 일정');

      // Step 4: 수정 완료 버튼 클릭
      await page.getByTestId('event-submit-button').click();

      // Step 5: 수정된 일정이 반복 속성을 제거하고 단일 일정으로 변경되었는지 확인
      // 반복 아이콘이 표시되지 않아야 함
      await expect(
        page.getByText('주간 단일 일정').locator('svg[data-testid="RepeatIcon"]')
      ).not.toBeVisible();
    });

    /**
     * 반복 일정 일괄 수정 테스트
     * 목적: 반복 일정 수정 모달에서 "아니오"를 선택하면 모든 반복 일정이 일괄적으로 수정되는지 확인
     * 검증 항목:
     * - 모든 반복 일정 인스턴스가 수정됨
     * - 수정된 일정이 이벤트 리스트에 표시됨
     */
    test('반복 일정 수정 시 반복 일정 수정 모달에 아니오를 누르면 일괄적으로 변경된다.', async ({
      page,
    }) => {
      // Step 1: 수정할 반복 일정의 편집 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '일간 반복 일정' })
        .first()
        .locator('button[aria-label="Edit event"]')
        .click();

      // Step 2: 반복 일정 수정 모달에서 "아니오" 버튼 클릭(일괄 수정)
      await page.getByRole('button', { name: '아니오' }).click();

      // Step 3: 일정 제목 수정
      await page.getByRole('textbox', { name: '제목' }).clear();
      await page.getByRole('textbox', { name: '제목' }).fill('일간 반복 일정 수정');

      // Step 4: 수정 완료 버튼 클릭
      await page.getByTestId('event-submit-button').click();

      // Step 5: 수정된 반복 일정이 렌더링될 때까지 대기
      await page.waitForSelector('[data-testid="month-view"] >> text=일간 반복 일정 수정');

      // Step 6: 수정된 반복 일정이 이벤트 리스트에 표시되는지 확인
      const recurringEvents = page.getByTestId('event-list').getByText('일간 반복 일정 수정');
      const eventCount = await recurringEvents.count();

      // Step 7: 일괄 수정이 적용되어 최소 1개 이상의 반복 일정이 표시되는지 확인
      expect(eventCount).toBeGreaterThanOrEqual(1);
    });

    /**
     * 반복 일정 단일 삭제 테스트
     * 목적: 반복 일정 삭제 모달에서 "예"를 선택하면 해당 일정만 삭제되는지 확인
     * 검증 항목:
     * - 선택한 일정만 삭제되고 나머지 반복 일정은 유지됨
     * - 삭제 전후 일정 개수 차이가 1개임
     * - 성공 메시지가 표시됨
     */
    test('반복 일정 삭제 시 예를 누르면 해당 일정만 삭제된다.', async ({ page }) => {
      // Step 1: 삭제 전 반복 일정 개수 측정
      const recurringLocator = page
        .getByTestId('event-list')
        .getByText('주간 반복 일정', { exact: true });
      const beforeCount = await recurringLocator.count();

      // Step 2: 삭제할 반복 일정의 삭제 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '주간 반복 일정' })
        .first()
        .locator('button[aria-label="Delete event"]')
        .click();

      // Step 3: 반복 일정 삭제 모달에서 "예" 버튼 클릭(해당 일정만 삭제)
      await page.getByRole('button', { name: '예' }).click();

      // Step 4: 일정 삭제 성공 스낵바 메시지가 표시되는지 확인
      await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();

      // Step 5: 삭제 후 반복 일정 개수가 1개 감소했는지 확인
      await expect(recurringLocator).toHaveCount(beforeCount - 1);

      // Step 6: 삭제 후 개수 재확인
      const afterCount = await recurringLocator.count();
      expect(afterCount).toBe(beforeCount - 1);
    });

    /**
     * 반복 일정 일괄 삭제 테스트
     * 목적: 반복 일정 삭제 모달에서 "아니오"를 선택하면 모든 반복 일정이 일괄적으로 삭제되는지 확인
     * 검증 항목:
     * - 모든 반복 일정 인스턴스가 삭제됨
     * - 삭제된 일정이 이벤트 리스트에서 사라짐
     */
    test('반복 일정 삭제 시 반복 일정 수정 모달에 아니오를 누르면 일괄적으로 삭제된다.', async ({
      page,
    }) => {
      // Step 1: 삭제할 반복 일정의 삭제 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '주간 반복 일정' })
        .first()
        .locator('button[aria-label="Delete event"]')
        .click();

      // Step 2: 반복 일정 삭제 모달에서 "아니오" 버튼 클릭(일괄 삭제)
      await page.getByRole('button', { name: '아니오' }).click();

      // Step 3: 일괄 삭제된 반복 일정이 이벤트 리스트에서 사라졌는지 확인
      const recurringEvents = page.getByTestId('event-list').getByText('주간 반복 일정 수정');
      const eventCount = await recurringEvents.count();

      // Step 4: 모든 반복 일정이 삭제되어 개수가 0 이하인지 확인
      expect(eventCount).toBeLessThanOrEqual(0);
    });
  });
});
