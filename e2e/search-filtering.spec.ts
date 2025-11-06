import { expect, test } from '@playwright/test';

/**
 * 검색 및 필터링 E2E 테스트
 * 일정 검색 기능과 캘린더 뷰 필터링 기능을 테스트합니다.
 * - 제목, 위치, 설명 기반 검색 기능
 * - 검색 결과 없음 처리
 * - 주간 뷰 필터링 기능
 */
test.describe('검색 및 필터링', () => {
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
   * 제목 기반 검색 테스트
   * 목적: 검색어를 입력하면 일정의 제목과 일치하는 일정만 필터링되는지 확인
   * 검증 항목:
   * - 검색어와 일치하는 제목의 일정만 표시됨
   * - 검색어와 일치하지 않는 일정은 표시되지 않음
   */
  test('검색어 입력 시 검색어와 일치하는 제목의 일정만 필터링한다.', async ({ page }) => {
    // Step 1: 검색 입력 필드 클릭 및 검색어 입력
    await page.getByRole('textbox', { name: '일정 검색' }).click();
    await page.getByRole('textbox', { name: '일정 검색' }).fill('검색 테스트 키워드');

    // Step 2: 검색어와 일치하는 제목의 일정이 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('검색 테스트 키워드')).toBeVisible();

    // Step 3: 검색어와 일치하지 않는 다른 일정들이 필터링되어 표시되지 않는지 확인
    await expect(page.getByTestId('event-list').getByText('위치 검색 테스트')).not.toBeVisible();
    await expect(page.getByTestId('event-list').getByText('기타 카테고리 일정')).not.toBeVisible();
  });

  /**
   * 위치 기반 검색 테스트
   * 목적: 검색어를 입력하면 일정의 위치와 일치하는 일정만 필터링되는지 확인
   * 검증 항목:
   * - 검색어와 일치하는 위치의 일정만 표시됨
   * - 검색어와 일치하지 않는 일정은 표시되지 않음
   */
  test('검색어 입력 시 검색어와 일치하는 위치의 일정만 필터링한다.', async ({ page }) => {
    // Step 1: 검색 입력 필드 클릭 및 검색어 입력 (위치명 일부 입력)
    await page.getByRole('textbox', { name: '일정 검색' }).click();
    await page.getByRole('textbox', { name: '일정 검색' }).fill('회의실 m');

    // Step 2: 검색어와 일치하는 위치의 일정이 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('위치 검색 테스트')).toBeVisible();

    // Step 3: 검색어와 일치하지 않는 다른 일정들이 필터링되어 표시되지 않는지 확인
    await expect(page.getByTestId('event-list').getByText('검색 테스트 키워드')).not.toBeVisible();
    await expect(page.getByTestId('event-list').getByText('기타 카테고리 일정')).not.toBeVisible();
  });

  /**
   * 설명 기반 검색 테스트
   * 목적: 검색어를 입력하면 일정의 설명과 일치하는 일정만 필터링되는지 확인
   * 검증 항목:
   * - 검색어와 일치하는 설명의 일정만 표시됨
   * - 검색어와 일치하지 않는 일정은 표시되지 않음
   */
  test('검색어 입력 시 검색어와 일치하는 설명의 일정만 필터링한다.', async ({ page }) => {
    // Step 1: 검색 입력 필드 클릭 및 검색어 입력 (설명 내용 일부 입력)
    await page.getByRole('textbox', { name: '일정 검색' }).click();
    await page.getByRole('textbox', { name: '일정 검색' }).fill('기타 카테고리 검색 테스트용');

    // Step 2: 검색어와 일치하는 설명의 일정이 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('기타 카테고리 일정')).toBeVisible();

    // Step 3: 검색어와 일치하지 않는 다른 일정들이 필터링되어 표시되지 않는지 확인
    await expect(page.getByTestId('event-list').getByText('위치 검색 테스트')).not.toBeVisible();
    await expect(page.getByTestId('event-list').getByText('검색 테스트 키워드')).not.toBeVisible();
  });

  /**
   * 검색 결과 없음 처리 테스트
   * 목적: 검색어와 일치하는 일정이 없을 때 적절한 메시지가 표시되는지 확인
   * 검증 항목:
   * - "검색 결과가 없습니다." 메시지가 표시됨
   */
  test('검색어 결과가 없을 때 `검색 결과가 없습니다.` 문구가 노출된다.', async ({ page }) => {
    // Step 1: 검색 입력 필드 클릭 및 존재하지 않는 검색어 입력
    await page.getByRole('textbox', { name: '일정 검색' }).click();
    await page.getByRole('textbox', { name: '일정 검색' }).fill('존재하지 않는 일정');

    // Step 2: 검색 결과 없음 메시지가 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('검색 결과가 없습니다.')).toBeVisible();
  });

  /**
   * 주간 뷰 필터링 테스트
   * 목적: 주간 뷰로 전환했을 때 해당 주에 속한 일정만 표시되는지 확인
   * 검증 항목:
   * - 현재 주에 일정이 없으면 "검색 결과가 없습니다." 메시지 표시
   * - 다른 주로 이동하면 해당 주의 일정이 표시됨
   */
  test('주간 뷰로 전환 시 해당 주에 해당하는 일정 기준으로 필터링한다.', async ({ page }) => {
    // Step 1: 월간 뷰에서 주간 뷰로 전환
    await page.getByText('Month').click();
    await page.getByRole('option', { name: 'week-option' }).click();

    // Step 2: 현재 주에 일정이 없으면 "검색 결과가 없습니다." 메시지가 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('검색 결과가 없습니다.')).toBeVisible();

    // Step 3: 다음 주로 이동 (Next 버튼 클릭)
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: 이동한 주에 일정이 있으면 "검색 결과가 없습니다." 메시지가 사라지는지 확인
    await expect(
      page.getByTestId('event-list').getByText('검색 결과가 없습니다.')
    ).not.toBeVisible();

    // Step 5: 해당 주의 일정이 표시되는지 확인
    await expect(page.getByTestId('event-list').getByText('조회 테스트 일정')).toBeVisible();
    await expect(page.getByTestId('event-list').getByText('2025-11-10')).toBeVisible();
  });
});
