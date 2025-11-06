import type { Meta, StoryObj } from '@storybook/react';

import DraggableEvent from './DraggableEvent';

const meta = {
  title: 'Components/DraggableEvent',
  component: DraggableEvent,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [320, 768, 1024] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DraggableEvent>;

export default meta;
type Story = StoryObj<typeof meta>;

const getRepeatTypeLabel = (type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none'): string => {
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
const mockEvent = {
  id: 'test-event-1',
  title: '테스트 일정',
  date: '2025-11-10',
  startTime: '10:00',
  endTime: '11:00',
  description: '테스트용 일정',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none' as const, interval: 0 },
  notificationTime: 1,
};

// 반복 일정 이벤트
const mockRecurringEvent = {
  ...mockEvent,
  id: 'test-recurring-1',
  title: '반복 일정',
  repeat: {
    type: 'weekly' as const,
    interval: 1,
    endDate: '2025-12-31',
    id: 'repeat-id-1',
  },
};

/**
 * 기본 일정 컴포넌트
 * 일정을 표시하는 기본 상태입니다.
 */
export const Default: Story = {
  args: {
    event: mockEvent,
    isNotified: false,
    isRepeating: false,
    getRepeatTypeLabel,
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * 알림이 설정된 일정
 * 알림 아이콘이 표시되고 빨간색으로 강조됩니다.
 */
export const Notified: Story = {
  args: {
    event: mockEvent,
    isNotified: true,
    isRepeating: false,
    getRepeatTypeLabel,
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * 반복 일정
 * 반복 아이콘이 표시됩니다.
 */
export const Recurring: Story = {
  args: {
    event: mockRecurringEvent,
    isNotified: false,
    isRepeating: true,
    getRepeatTypeLabel,
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};

/**
 * 알림 + 반복 일정
 * 알림과 반복 아이콘이 모두 표시됩니다.
 */
export const NotifiedAndRecurring: Story = {
  args: {
    event: mockRecurringEvent,
    isNotified: true,
    isRepeating: true,
    getRepeatTypeLabel,
    onDragStart: () => {},
    onDragEnd: () => {},
  },
};
