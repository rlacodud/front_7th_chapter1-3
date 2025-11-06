import { expect, test } from '@playwright/test';

/**
 * 일정 겹침 처리 방식 E2E 테스트
 * 일정 생성 및 수정 시 겹치는 일정이 있을 경우의 처리 방식을 테스트합니다.
 * - 단일 일정 생성/수정 시 겹침 경고 모달 표시 및 처리
 * - 반복 일정 생성 시 겹침 무시 처리
 */
test.describe('일정 겹침 처리 방식', () => {
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
   * 단일 일정 생성 시 겹침 경고 모달 표시 테스트
   * 목적: 기존 일정과 시간이 겹치는 단일 일정을 생성할 때, 겹침 경고 모달이 표시되는지 확인
   * 검증 항목:
   * - 겹침 경고 모달이 표시됨
   * - 겹치는 기존 일정 정보가 모달에 표시됨
   */
  test('생성하는 단일 일정과 겹치는 기존 일정이 있을 경우, 일정 겹침 경고 팝업이 노출된다.', async ({
    page,
  }) => {
    // Step 1: 기존 일정('겹침 테스트 일정 1': 2025-11-16 13:00-15:00)과 겹치는 시간으로 단일 일정 생성
    await page.getByLabel('제목').fill('겹침 테스트 일정');
    await page.getByLabel('날짜').fill('2025-11-16');
    await page.getByLabel('시작 시간').fill('13:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('위치').fill('회의실 A');

    // Step 2: 일정 생성 버튼 클릭(겹침 발생)
    await page.getByTestId('event-submit-button').click();

    // Step 3: 일정 겹침 경고 모달이 표시되는지 확인
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // Step 4: 겹치는 기존 일정 정보가 모달에 표시되는지 확인
    await expect(page.getByText('겹침 테스트 일정 1 (2025-11-16 13:00-15:00)')).toBeVisible();
  });

  /**
   * 반복 일정 생성 시 겹침 무시 처리 테스트
   * 목적: 반복 일정을 생성할 때는 겹침 검사를 무시하고 일정이 생성되는지 확인
   * 검증 항목:
   * - 겹침 경고 모달이 표시되지 않음
   * - 일정이 정상적으로 생성됨
   * - 성공 메시지가 표시됨
   */
  test('생성하는 반복 일정과 겹치는 기존 일정이 있을 경우, 일정 겹침을 무시하고 생성한다.', async ({
    page,
  }) => {
    // Step 1: 기존 일정과 겹치는 시간으로 반복 일정 생성
    await page.getByLabel('제목').fill('겹침 테스트 반복 일정');
    await page.getByLabel('날짜').fill('2025-11-16');
    await page.getByLabel('시작 시간').fill('13:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('위치').fill('회의실 A');

    // Step 2: 반복 일정 체크박스 활성화
    await page.getByRole('checkbox', { name: '반복 일정' }).check();

    // Step 3: 일정 생성 버튼 클릭
    await page.getByTestId('event-submit-button').click();

    // Step 4: 반복 일정은 겹침 검사를 무시하므로 경고 모달이 표시되지 않아야 함
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

    // Step 5: 일정 추가 성공 스낵바 메시지가 표시되는지 확인
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Step 6: 생성된 반복 일정이 캘린더에 존재하는지 확인
    const recurringEvents = page.getByTestId('event-list').getByText('겹침 테스트 반복 일정');
    const eventCount = await recurringEvents.count();

    expect(eventCount).toBeGreaterThanOrEqual(1);
  });

  /**
   * 단일 일정 생성 시 겹침 모달에서 계속 진행 테스트
   * 목적: 겹침 경고 모달에서 "계속 진행" 버튼을 클릭하면 일정이 생성되는지 확인
   * 검증 항목:
   * - 겹침 모달이 표시됨
   * - "계속 진행" 클릭 시 일정이 생성됨
   * - 성공 메시지가 표시됨
   */
  test('생성하는 단일 일정과 겹치는 기존 일정이 있을 경우, 계속 진행 클릭 시 일정을 생성한다.', async ({
    page,
  }) => {
    // Step 1: 기존 일정과 겹치는 시간으로 단일 일정 생성
    await page.getByLabel('제목').fill('겹침 테스트 단일 일정');
    await page.getByLabel('날짜').fill('2025-11-16');
    await page.getByLabel('시작 시간').fill('13:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('위치').fill('회의실 A');

    // Step 2: 일정 생성 버튼 클릭 (겹침 발생)
    await page.getByTestId('event-submit-button').click();

    // Step 3: 일정 겹침 경고 모달이 표시되는지 확인
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // Step 4: 겹침 모달에서 "계속 진행" 버튼 클릭
    await page.getByRole('button', { name: '계속 진행' }).click();

    // Step 5: 일정 추가 성공 스낵바 메시지가 표시되는지 확인
    await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();

    // Step 6: 생성된 일정이 렌더링될 때까지 대기
    await page.waitForSelector('[data-testid="event-list"] >> text=겹침 테스트 단일 일정');

    // Step 7: 생성된 일정이 캘린더의 이벤트 리스트에 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('겹침 테스트 단일 일정')).toBeVisible();
  });

  /**
   * 단일 일정 생성 시 겹침 모달에서 취소 테스트
   * 목적: 겹침 경고 모달에서 "취소" 버튼을 클릭하면 일정 생성이 취소되는지 확인
   * 검증 항목:
   * - 겹침 모달이 표시됨
   * - "취소" 클릭 시 모달이 닫힘
   * - 일정이 생성되지 않음
   * - 성공 메시지가 표시되지 않음
   */
  test('생성하는 단일 일정과 겹치는 기존 일정이 있을 경우, 취소 클릭 시 일정 생성을 취소하고 아무런 변화가 일어나지 않는다.', async ({
    page,
  }) => {
    // Step 1: 기존 일정과 겹치는 시간으로 단일 일정 생성
    await page.getByLabel('제목').fill('겹침 테스트 단일 일정');
    await page.getByLabel('날짜').fill('2025-11-16');
    await page.getByLabel('시작 시간').fill('13:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('위치').fill('회의실 A');

    // Step 2: 일정 생성 버튼 클릭 (겹침 발생)
    await page.getByTestId('event-submit-button').click();

    // Step 3: 일정 겹침 경고 모달이 표시되는지 확인
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // Step 4: 겹침 모달에서 "취소" 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // Step 5: 겹침 경고 모달이 닫혔는지 확인
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

    // Step 6: 일정 추가 성공 메시지가 표시되지 않는지 확인(일정이 생성되지 않았음을 의미)
    await expect(page.getByText('일정이 추가되었습니다')).not.toBeVisible();

    // Step 7: 생성하려던 일정이 캘린더에 존재하지 않는지 확인
    await expect(
      page.getByTestId('event-list').getByText('겹침 테스트 단일 일정')
    ).not.toBeVisible();
  });

  /**
   * 단일 일정 수정 시 겹침 경고 모달 표시 테스트
   * 목적: 기존 일정을 수정하여 다른 일정과 시간이 겹치도록 변경할 때, 겹침 경고 모달이 표시되는지 확인
   * 검증 항목:
   * - 겹침 경고 모달이 표시됨
   * - 겹치는 기존 일정 정보가 모달에 표시됨
   */
  test('수정하는 단일 일정과 겹치는 기존 일정이 있을 경우, 일정 겹침 경고 팝업이 노출된다.', async ({
    page,
  }) => {
    // Step 1: 수정할 일정의 편집 버튼 클릭
    await page
      .getByTestId('event-list')
      .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
      .filter({ hasText: '수정 테스트 일정' })
      .locator('button[aria-label="Edit event"]')
      .click();

    // Step 2: 일정 날짜를 기존 일정('겹침 테스트 일정 2': 2025-11-16 14:00-16:00)과 겹치는 날짜로 변경
    await page.getByLabel('날짜').clear();
    await page.getByLabel('날짜').fill('2025-11-16');

    // Step 3: 수정 완료 버튼 클릭 (겹침 발생)
    await page.getByTestId('event-submit-button').click();

    // Step 4: 일정 겹침 경고 모달이 표시되는지 확인
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // Step 5: 겹치는 기존 일정 정보가 모달에 표시되는지 확인
    await expect(page.getByText('겹침 테스트 일정 2 (2025-11-16 14:00-16:00)')).toBeVisible();
  });
});
