import type { Meta, StoryObj } from '@storybook/react';

import RecurringEventDialog from './RecurringEventDialog';

const meta = {
  title: 'Components/RecurringEventDialog',
  component: RecurringEventDialog,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [320, 768, 1024] },
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecurringEventDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockEvent = {
  id: 'test-event-1',
  title: '반복 일정',
  date: '2025-11-10',
  startTime: '10:00',
  endTime: '11:00',
  description: '테스트용 반복 일정',
  location: '회의실 A',
  category: '업무',
  repeat: {
    type: 'weekly' as const,
    interval: 1,
    endDate: '2025-12-31',
    id: 'repeat-id-1',
  },
  notificationTime: 1,
};

/**
 * 편집 모달
 * 반복 일정 수정 시 표시되는 모달입니다.
 */
export const EditMode: Story = {
  args: {
    open: true,
    mode: 'edit',
    event: mockEvent,
    onClose: () => {},
    onConfirm: () => {},
  },
};

/**
 * 삭제 모달
 * 반복 일정 삭제 시 표시되는 모달입니다.
 */
export const DeleteMode: Story = {
  args: {
    open: true,
    mode: 'delete',
    event: mockEvent,
    onClose: () => {},
    onConfirm: () => {},
  },
};

/**
 * 드래그 모달
 * 반복 일정 드래그앤드롭 시 표시되는 모달입니다.
 */
export const DragMode: Story = {
  args: {
    open: true,
    mode: 'drag',
    event: mockEvent,
    onClose: () => {},
    onConfirm: () => {},
  },
};
