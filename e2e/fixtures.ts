import { test as base } from '@playwright/test';

/**
 * e2e 테스트용 fixtures
 * 각 테스트 전에 e2e.json 데이터를 초기 상태로 리셋합니다.
 *
 * 사용법:
 * - 각 테스트 파일에서 `import { test, expect } from './fixtures';`로 import
 * - `@playwright/test` 대신 `./fixtures`에서 import한 test 사용
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // 테스트 실행 전 e2e.json 데이터 리셋
    try {
      const response = await page.request.post('http://localhost:3000/api/reset-e2e-data');
      if (!response.ok()) {
        console.warn('Failed to reset e2e data, server might not be in e2e mode');
      }
    } catch (error) {
      console.warn('Could not reset e2e data:', error);
    }

    // 페이지 이동
    await page.goto('http://localhost:5173');

    // 서버가 데이터를 다시 로드할 때까지 대기
    await page.waitForTimeout(500);

    // 페이지 사용
    await use(page);
  },
});

export { expect } from '@playwright/test';
