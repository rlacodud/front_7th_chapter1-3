import type { Meta, StoryObj } from '@storybook/react';

import CalendarView from './CalendarView';
import { Event, RepeatType } from '../types';

const meta = {
  title: 'Components/CalendarView',
  component: CalendarView,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [320, 768, 1024] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

const getRepeatTypeLabel = (type: RepeatType): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

// 단일 일정 이벤트
const mockEvent: Event = {
  id: 'test-event-1',
  title: '테스트 일정',
  date: '2025-11-10',
  startTime: '10:00',
  endTime: '11:00',
  description: '테스트용 일정',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 1,
};

// 반복 일정 이벤트
const mockRecurringEvent: Event = {
  ...mockEvent,
  id: 'test-recurring-1',
  title: '반복 일정',
  repeat: {
    type: 'weekly',
    interval: 1,
    endDate: '2025-12-31',
    id: 'repeat-id-1',
  },
};

// 알림이 설정된 일정
const mockNotifiedEvent: Event = {
  ...mockEvent,
  id: 'test-notified-1',
  title: '알림 일정',
};

const mockHolidays: Record<string, string> = {
  '2025-11-10': '크리스마스',
};

/**
 * 기본 Week 뷰
 * 주간 캘린더 뷰를 표시합니다.
 */
export const WeekView: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-11-10'),
    holidays: {},
    events: [],
    notifiedEvents: [],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * 기본 Month 뷰
 * 월간 캘린더 뷰를 표시합니다.
 */
export const MonthView: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-11-07'),
    holidays: {},
    events: [],
    notifiedEvents: [],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * Week 뷰 - 일정 포함
 * 주간 캘린더에 일정이 표시되는 상태입니다.
 */
export const WeekViewWithEvents: Story = {
  args: {
    view: 'week',
    currentDate: new Date('2025-11-10'),
    holidays: {},
    events: [mockEvent, mockRecurringEvent],
    notifiedEvents: [],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * Month 뷰 - 일정 포함
 * 월간 캘린더에 일정이 표시되는 상태입니다.
 */
export const MonthViewWithEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-11-07'),
    holidays: {},
    events: [mockEvent, mockRecurringEvent, mockNotifiedEvent],
    notifiedEvents: [mockNotifiedEvent.id],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * Month 뷰 - 공휴일 포함
 * 공휴일이 표시되는 월간 캘린더 뷰입니다.
 */
export const MonthViewWithHolidays: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-11-07'),
    holidays: mockHolidays,
    events: [],
    notifiedEvents: [],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * Month 뷰 - 반복 일정 포함
 * 반복 일정이 표시되는 월간 캘린더 뷰입니다.
 */
export const MonthViewWithRecurringEvents: Story = {
  args: {
    view: 'month',
    currentDate: new Date('2025-11-07'),
    holidays: {},
    events: [mockRecurringEvent],
    notifiedEvents: [],
    getRepeatTypeLabel,
    onDateClick: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};
