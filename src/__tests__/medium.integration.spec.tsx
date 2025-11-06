import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import App from '../App';
import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerListCreation,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import { server } from '../setupTests';
import { Event, RepeatInfo } from '../types';

const theme = createTheme();

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'> & { repeat?: RepeatInfo }
) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  if (repeat) {
    await user.click(screen.getByLabelText('반복 일정'));
    await user.click(within(screen.getByLabelText('반복 유형')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: `${repeat.type}-option` }));
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), String(repeat.interval));
    if (repeat.endDate) {
      await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate!);
    }
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click((await screen.findAllByLabelText('Edit event'))[0]);

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: '2',
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // ! 일정 로딩 완료 후 테스트
  await screen.findByText('일정 로딩 완료!');

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
});

// ! 새로 추가된 테스트

it('입력한 새로운 반복 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
  setupMockHandlerListCreation();

  const { user } = setup(<App />);

  await saveSchedule(user, {
    title: '새 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '프로젝트 진행 상황 논의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 2, endDate: '2025-10-17' },
  });

  const eventList = within(screen.getByTestId('event-list'));
  expect(eventList.getAllByText('반복: 2일마다 (종료: 2025-10-17)')).toHaveLength(2);
  expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
  expect(eventList.getByText('2025-10-17')).toBeInTheDocument();
});

it('새로 추가한 반복 일정을 수정하는 경우 반복 일정에 관한 표시가 사라진다', async () => {
  setupMockHandlerUpdating([
    {
      id: '1',
      title: '새 회의',
      date: '2025-10-17',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-10-17' },
      notificationTime: 10,
    },
  ]);

  const { user } = setup(<App />);

  const eventList = within(screen.getByTestId('event-list'));
  expect(await eventList.findByText('반복: 2일마다 (종료: 2025-10-17)')).toBeInTheDocument();

  await user.click(await screen.findByLabelText('Edit event'));

  // 반복 일정 편집 다이얼로그가 나타나면 '예'를 선택 (단일 수정)
  const recurringDialog = await screen.findByText('반복 일정 수정');
  expect(recurringDialog).toBeInTheDocument();

  await user.click(screen.getByText('예'));

  const titleInput = screen.getByLabelText('제목');
  await user.click(titleInput);
  await user.keyboard('{Control>}a{/Control}');
  await user.keyboard('{delete}');
  await user.type(titleInput, '수정된 회의');

  const descInput = screen.getByLabelText('설명');
  await user.click(descInput);
  await user.keyboard('{Control>}a{/Control}');
  await user.keyboard('{delete}');
  await user.type(descInput, '회의 내용 변경');

  await user.click(screen.getByTestId('event-submit-button'));

  expect(eventList.queryByText('반복: 2일마다 (종료: 2025-10-17)')).not.toBeInTheDocument();
});

it('반복 일정을 수정하는 경우 반복 유형 관련 입력 폼이 사라진다', async () => {
  setupMockHandlerUpdating([
    {
      id: '1',
      title: '새 회의',
      date: '2025-10-17',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-10-17' },
      notificationTime: 10,
    },
  ]);

  const { user } = setup(<App />);

  await user.click(await screen.findByLabelText('Edit event'));

  // 반복 일정 편집 다이얼로그가 나타나면 '예'를 선택 (단일 수정)
  const recurringDialog = await screen.findByText('반복 일정 수정');
  expect(recurringDialog).toBeInTheDocument();

  await user.click(screen.getByText('예'));

  // 반복 일정 편집 모드에서는 반복 관련 폼이 숨겨져야 함
  expect(screen.queryByText('반복 일정')).not.toBeInTheDocument();
  expect(screen.queryByText('반복 유형')).not.toBeInTheDocument();
  expect(screen.queryByText('반복 간격')).not.toBeInTheDocument();
  expect(screen.queryByText('반복 종료일')).not.toBeInTheDocument();
});

it('주별 뷰 선택 후 해당 주에 반복 일정이 존재한다면 해당 일정이 반복 일정 표시와 함께 정확히 표시된다', async () => {
  setupMockHandlerListCreation();

  const { user } = setup(<App />);

  await saveSchedule(user, {
    title: '새 회의',
    date: '2025-10-01',
    startTime: '14:00',
    endTime: '15:00',
    description: '프로젝트 진행 상황 논의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 2, endDate: '2025-10-03' },
  });

  await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: 'week-option' }));

  const weekView = within(screen.getByTestId('week-view'));
  expect(weekView.getAllByText('새 회의')).toHaveLength(2);
});

it('월간 뷰 선택 후 해당 주에 반복 일정이 존재한다면 해당 일정이 반복 일정 표시와 함께 정확히 표시된다', async () => {
  setupMockHandlerListCreation();

  const { user } = setup(<App />);

  await saveSchedule(user, {
    title: '새 회의',
    date: '2025-10-01',
    startTime: '14:00',
    endTime: '15:00',
    description: '프로젝트 진행 상황 논의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 2, endDate: '2025-10-03' },
  });

  const eventList = within(screen.getByTestId('event-list'));
  expect(eventList.getAllByText('새 회의')).toHaveLength(2);
});

describe('날짜 클릭', () => {
  it('일정 추가 시 캘린더에서 날짜 셀을 클릭하면 해당 날짜에 일정이 생성된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 월별 뷰에서 날짜 셀 클릭 (예: 15일)
    const monthView = screen.getByTestId('month-view');
    const dateCell = within(monthView).getByText('15').closest('td');
    expect(dateCell).toBeInTheDocument();

    // 날짜 셀 클릭
    await user.click(dateCell!);

    // 날짜 입력 폼에 해당 날짜가 입력되었는지 확인
    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toContain('2025-10-15');

    // 일정 정보 입력
    await user.type(screen.getByLabelText('제목'), '날짜 클릭 테스트 일정');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');
    await user.type(screen.getByLabelText('설명'), '날짜 클릭으로 생성된 일정');
    await user.type(screen.getByLabelText('위치'), '회의실 A');
    await user.click(screen.getByLabelText('카테고리'));
    await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '업무-option' }));

    // 일정 추가 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정 추가 스낵바가 노출되는지 확인
    expect(await screen.findByText('일정이 추가되었습니다')).toBeInTheDocument();

    // 일정이 이벤트 리스트에 표시되는지 확인
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('날짜 클릭 테스트 일정')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
  });

  it('일정 수정 시 캘린더에서 날짜 셀을 클릭하면 해당 날짜로 일정이 수정된다.', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 수정 아이콘 클릭
    const editButton = (await screen.findAllByLabelText('Edit event'))[0];
    await user.click(editButton);

    // 월별 뷰에서 다른 날짜 셀 클릭 (예: 20일)
    const monthView = screen.getByTestId('month-view');
    const dateCell = within(monthView).getByText('20').closest('td');
    expect(dateCell).toBeInTheDocument();

    // 날짜 셀 클릭
    await user.click(dateCell!);

    // 날짜 입력 폼에 해당 날짜가 입력되었는지 확인
    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toContain('2025-10-20');

    // 일정 수정 버튼 클릭
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정 수정 스낵바가 노출되는지 확인
    expect(await screen.findByText('일정이 수정되었습니다')).toBeInTheDocument();

    // 수정된 일정이 이벤트 리스트에 표시되는지 확인
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-10-20')).toBeInTheDocument();
  });
});

describe('드래그 앤 드롭', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('일반 일정을 다른 날짜로 드래그 앤 드롭하면 해당 날짜로 일정이 이동된다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '이동할 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '드래그 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const monthView = screen.getByTestId('month-view');
    const sourceCell = within(monthView).getByText('15').closest('td');
    const targetCell = within(monthView).getByText('20').closest('td');

    expect(sourceCell).toBeInTheDocument();
    expect(targetCell).toBeInTheDocument();

    // 드래그할 일정 찾기
    const draggableEvent = within(sourceCell!).getByText('이동할 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 드롭 대상 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 드롭 이벤트 발생
    fireEvent.drop(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 일정이 이동되었는지 확인
    expect(await screen.findByText('일정이 수정되었습니다')).toBeInTheDocument();

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-10-20')).toBeInTheDocument();
  });

  it('반복 일정을 드래그 앤 드롭하면 단일 이동/전체 이동 선택 다이얼로그가 표시된다', async () => {
    setupMockHandlerListCreation([
      {
        id: '1',
        title: '반복 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '반복 일정',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
        notificationTime: 10,
      },
    ]);

    setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const monthView = screen.getByTestId('month-view');
    const sourceCell = within(monthView).getByText('15').closest('td');
    const targetCell = within(monthView).getByText('20').closest('td');

    const draggableEvent = within(sourceCell!).getByText('반복 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 드롭 대상 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 드롭 이벤트 발생
    fireEvent.drop(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 반복 일정 다이얼로그가 표시되는지 확인
    expect(await screen.findByText('반복 일정 이동')).toBeInTheDocument();
  });

  it('반복 일정을 드래그 앤 드롭하여 단일 이동을 선택하면 해당 일정만 이동하고 반복 속성이 제거된다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '반복 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const monthView = screen.getByTestId('month-view');
    const sourceCell = within(monthView).getByText('15').closest('td');
    const targetCell = within(monthView).getByText('20').closest('td');

    const draggableEvent = within(sourceCell!).getByText('반복 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 드롭 대상 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 드롭 이벤트 발생
    fireEvent.drop(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 반복 일정 다이얼로그에서 '예' 선택 (단일 이동)
    const dialog = await screen.findByText('반복 일정 이동');
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByText('예'));

    // 일정이 이동되었는지 확인
    expect(await screen.findByText('일정이 이동되었습니다')).toBeInTheDocument();

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('2025-10-20')).toBeInTheDocument();
    // 반복 표시가 사라졌는지 확인
    expect(eventList.queryByText(/반복:/)).not.toBeInTheDocument();
  });

  it('드래그 앤 드롭으로 일정을 이동할 때 충돌하는 일정이 있으면 경고 다이얼로그가 표시된다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '이동할 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '드래그 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '기존 일정',
        date: '2025-10-20',
        startTime: '09:30',
        endTime: '10:30',
        description: '충돌 일정',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const monthView = screen.getByTestId('month-view');
    const sourceCell = within(monthView).getByText('15').closest('td');
    const targetCell = within(monthView).getByText('20').closest('td');

    const draggableEvent = within(sourceCell!).getByText('이동할 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 드롭 대상 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 드롭 이벤트 발생
    fireEvent.drop(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 충돌 경고 다이얼로그가 표시되는지 확인
    expect(await screen.findByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 일정 (2025-10-20 09:30-10:30)')).toBeInTheDocument();
  });

  it('같은 날짜로 일정을 드래그 앤 드롭하면 일정이 변경되지 않는다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '이동할 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '드래그 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const monthView = screen.getByTestId('month-view');
    const sourceCell = within(monthView).getByText('15').closest('td');

    const draggableEvent = within(sourceCell!).getByText('이동할 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 같은 셀로 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 같은 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(sourceCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 같은 셀에 드롭 이벤트 발생
    fireEvent.drop(sourceCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 일정 수정 메시지가 표시되지 않아야 함
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(screen.queryByText('일정이 수정되었습니다')).not.toBeInTheDocument();
  });

  it('주별 뷰에서 일정을 드래그 앤 드롭하여 이동할 수 있다', async () => {
    setupMockHandlerUpdating([
      {
        id: '1',
        title: '주별 뷰 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '주별 뷰 테스트',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // 주별 뷰로 전환
    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = screen.getByTestId('week-view');
    const sourceCell = within(weekView).getByText('1').closest('td');
    const targetCell = within(weekView).getByText('3').closest('td');

    const draggableEvent = within(sourceCell!).getByText('주별 뷰 일정');

    // dataTransfer 모킹
    const mockDataTransfer = {
      data: {} as Record<string, string>,
      setData: function (key: string, value: string) {
        this.data[key] = value;
      },
      getData: function (key: string) {
        return this.data[key] || '';
      },
      effectAllowed: 'move',
    };

    // 드래그 시작
    fireEvent.dragStart(draggableEvent, {
      dataTransfer: mockDataTransfer as any,
    });
    mockDataTransfer.setData('eventId', '1');

    // 드롭 대상 셀에 dragOver 이벤트 발생
    fireEvent.dragOver(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 드롭 이벤트 발생
    fireEvent.drop(targetCell!, {
      dataTransfer: mockDataTransfer as any,
      preventDefault: () => {},
    });

    // 일정이 이동되었는지 확인
    expect(await screen.findByText('일정이 수정되었습니다')).toBeInTheDocument();
  });
});
