import { expect, test } from './fixtures';

/**
 * 기본 일정 관리 워크플로우 E2E 테스트
 * 일정의 생성, 조회, 수정, 삭제 기능과 유효성 검증을 테스트합니다.
 */
test.describe('기본 일정 관리 워크플로우', () => {
  /**
   * 일정 CRUD 테스트
   * 생성(Create), 조회(Read), 수정(Update), 삭제(Delete) 기능을 검증합니다.
   */
  test.describe('일정 CRUD', () => {
    /**
     * 일정 생성 테스트
     * 목적: 새로운 일정을 생성했을 때, 해당 일정이 캘린더에 정상적으로 표시되는지 확인
     * 검증 항목:
     * - 생성된 일정이 이벤트 리스트에 표시됨
     * - 성공 메시지가 표시됨
     */
    test('일정 생성 시 생성한 일정이 캘린더에 표시된다.', async ({ page }) => {
      // Step 1: 일정 폼에 필수 정보 입력
      await page.getByLabel('제목').fill('3주차 과제');
      await page.getByLabel('날짜').fill('2025-11-06');
      await page.getByLabel('시작 시간').fill('15:00');
      await page.getByLabel('종료 시간').fill('23:00');
      await page.getByLabel('위치').fill('회의실 A');

      // Step 2: 일정 추가 버튼 클릭하여 일정 생성
      await page.getByRole('button', { name: '일정 추가' }).click();

      // Step 3: 생성된 일정이 캘린더의 이벤트 리스트에 표시되는지 확인
      await expect(page.getByTestId('event-list').getByText('3주차 과제')).toBeVisible();

      // Step 4: 일정 추가 성공 스낵바 메시지가 표시되는지 확인
      await expect(page.getByText('일정이 추가되었습니다')).toBeVisible();
    });

    /**
     * 일정 조회 테스트
     * 목적: e2e.json에 미리 정의된 일정이 캘린더에 정상적으로 표시되는지 확인
     * 검증 항목:
     * - '조회 테스트 일정'이 이벤트 리스트에 표시됨
     */
    test('생성되어있는 일정은 캘린더에 표시되어 조회할 수 있다.', async ({ page }) => {
      // Step 1: e2e.json에 정의된 '조회 테스트 일정'이 캘린더에 표시되는지 확인
      await expect(page.getByTestId('event-list').getByText('조회 테스트 일정')).toBeVisible();
    });

    /**
     * 일정 수정 테스트
     * 목적: 기존 일정을 수정했을 때, 수정된 내용이 캘린더에 반영되는지 확인
     * 검증 항목:
     * - 수정된 일정의 제목이 이벤트 리스트에 표시됨
     * - 성공 메시지가 표시됨
     */
    test('기존 일정 수정 시 수정된 일정이 캘린더에 표시된다.', async ({ page }) => {
      // Step 1: 수정할 일정의 편집 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '수정 테스트 일정' })
        .locator('button[aria-label="Edit event"]')
        .click();

      // Step 2: 일정 제목 수정
      await page.getByLabel('제목').clear();
      await page.getByLabel('제목').fill('수정된 일정');

      // Step 3: 수정 완료 버튼 클릭
      await page.getByTestId('event-submit-button').click();

      // Step 4: 일정 수정 성공 스낵바 메시지가 표시되는지 확인
      await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();

      // Step 5: 수정된 일정의 제목이 캘린더의 이벤트 리스트에 표시되는지 확인
      await expect(page.getByTestId('event-list').getByText('수정된 일정')).toBeVisible();
    });

    /**
     * 일정 삭제 테스트
     * 목적: 일정을 삭제했을 때, 해당 일정이 캘린더에서 제거되는지 확인
     * 검증 항목:
     * - 삭제된 일정이 이벤트 리스트에서 사라짐
     * - 성공 메시지가 표시됨
     */
    test('삭제 테스트 일정을 삭제하면 캘린더에서 사라진다', async ({ page }) => {
      // Step 1: 삭제할 일정이 캘린더에 존재하는지 사전 확인
      await expect(page.getByTestId('event-list').getByText('삭제 테스트 일정')).toBeVisible();

      // Step 2: 삭제할 일정의 삭제 버튼 클릭
      await page
        .getByTestId('event-list')
        .locator('.MuiStack-root.css-gmwslw-MuiStack-root')
        .filter({ hasText: '삭제 테스트 일정' })
        .locator('button[aria-label="Delete event"]')
        .click();

      // Step 3: 삭제된 일정이 이벤트 리스트에서 사라졌는지 확인
      await expect(page.getByTestId('event-list').getByText('삭제 테스트 일정')).not.toBeVisible();

      // Step 4: 일정 삭제 성공 스낵바 메시지가 표시되는지 확인
      await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible();
    });
  });

  /**
   * 유효값 검증 테스트
   * 필수 필드 검증 및 시간 유효성 검증을 테스트합니다.
   */
  test.describe('유효값 검증', () => {
    /**
     * 필수 필드 검증 테스트
     * 목적: 필수 필드(제목, 날짜, 시작시간, 종료시간) 중 하나라도 누락 시 에러 메시지가 표시되는지 확인
     * 검증 항목:
     * - 필수 필드 누락 시 에러 메시지 표시
     */
    test('필수 필드(제목, 날짜, 시작시간, 종료 시간) 중 하나라도 입력하지 않고 생성 시 에러 메시지가 표시된다.', async ({
      page,
    }) => {
      // Step 1: 제목만 입력하고 나머지 필수 필드(날짜, 시작시간, 종료시간)는 입력하지 않음
      await page.getByLabel('제목').fill('입력값 검증 일정');

      // Step 2: 일정 추가 버튼 클릭 (필수 필드 누락 상태)
      await page.getByRole('button', { name: '일정 추가' }).click();

      // Step 3: 필수 정보 누락에 대한 에러 메시지가 표시되는지 확인
      await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();
    });

    /**
     * 시간 유효성 검증 테스트
     * 목적: 종료 시간이 시작 시간보다 빠른 경우 에러 메시지가 표시되는지 확인
     * 검증 항목:
     * - 시작 시간과 종료 시간 유효성 검증 메시지 표시
     */
    test('종료 시간이 시작 시간보다 빠른 경우 에러 메시지가 표시된다.', async ({ page }) => {
      // Step 1: 종료 시간이 시작 시간보다 빠르도록 입력
      // 시작 시간: 11:00, 종료 시간: 10:00 (종료 시간이 시작 시간보다 빠름)
      await page.getByLabel('시작 시간').fill('11:00');
      await page.getByLabel('종료 시간').fill('10:00');

      // Step 2: 시작 시간과 종료 시간 유효성 검증 에러 메시지가 표시되는지 확인
      await expect(page.getByText('시작 시간은 종료 시간보다 빨라야 합니다.')).toBeVisible();
      await expect(page.getByText('종료 시간은 시작 시간보다 늦어야 합니다.')).toBeVisible();
    });
  });
});
