import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * 겹침 경고 다이얼로그 컴포넌트
 * 일정이 겹칠 때 표시되는 경고 다이얼로그입니다.
 */
const OverlapDialog = ({
  open,
  overlappingEvents,
  onClose,
  onConfirm,
}: {
  open: boolean;
  overlappingEvents: Array<{
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>일정 겹침 경고</DialogTitle>
      <DialogContent>
        <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
        {overlappingEvents.map((event) => (
          <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
            {event.title} ({event.date} {event.startTime}-{event.endTime})
          </Typography>
        ))}
        <DialogContentText>계속 진행하시겠습니까?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button color="error" onClick={onConfirm}>
          계속 진행
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const meta = {
  title: 'Components/OverlapDialog',
  component: OverlapDialog,

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
} satisfies Meta<typeof OverlapDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOverlappingEvents = [
  {
    id: 'event-1',
    title: '기존 일정 1',
    date: '2025-11-10',
    startTime: '10:00',
    endTime: '11:00',
  },
  {
    id: 'event-2',
    title: '기존 일정 2',
    date: '2025-11-10',
    startTime: '10:30',
    endTime: '11:30',
  },
];

/**
 * 기본 겹침 경고
 * 1개의 겹치는 일정이 있는 경우입니다.
 */
export const SingleOverlap: Story = {
  args: {
    open: true,
    overlappingEvents: [mockOverlappingEvents[0]],
    onClose: () => {},
    onConfirm: () => {},
  },
};

/**
 * 여러 일정 겹침 경고
 * 2개 이상의 겹치는 일정이 있는 경우입니다.
 */
export const MultipleOverlaps: Story = {
  args: {
    open: true,
    overlappingEvents: mockOverlappingEvents,
    onClose: () => {},
    onConfirm: () => {},
  },
};
