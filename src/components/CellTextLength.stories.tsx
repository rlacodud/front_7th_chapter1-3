import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

import DraggableEvent from './DraggableEvent';
import DroppableCell from './DroppableCell';

const meta = {
  title: 'Components/CellTextLength',
  component: Box,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [320, 768, 1024] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Box>;

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

/**
 * DroppableCell - 긴 공휴일 이름
 * 공휴일 이름이 매우 길어서 셀 내에서 잘리는 경우를 테스트합니다.
 */
export const LongHolidayName: Story = {
  render: () => (
    <TableContainer sx={{ width: 200 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          <TableRow>
            <DroppableCell
              dateString="2025-11-10"
              day={10}
              holiday="매우 긴 공휴일 이름입니다. 이 이름은 셀 내에서 어떻게 표시될까요? 공휴일 이름이 길어서 잘릴 수도 있습니다."
              onClick={() => {}}
              onDrop={() => {}}
            >
              {null}
            </DroppableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * DroppableCell - 여러 긴 공휴일 이름
 * 여러 공휴일이 있는 경우를 테스트합니다.
 */
export const MultipleLongHolidayNames: Story = {
  render: () => (
    <TableContainer sx={{ width: 300 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          <TableRow>
            <DroppableCell
              dateString="2025-11-10"
              day={10}
              holiday="매우 긴 공휴일 이름입니다. 이 이름은 셀 내에서 어떻게 표시될까요?"
              onClick={() => {}}
              onDrop={() => {}}
            >
              {null}
            </DroppableCell>
            <DroppableCell
              dateString="2025-11-11"
              day={11}
              holiday="또 다른 매우 긴 공휴일 이름입니다. 이 이름도 셀 내에서 잘릴 수 있습니다."
              onClick={() => {}}
              onDrop={() => {}}
            >
              {null}
            </DroppableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * DraggableEvent - 긴 제목
 * 일정 제목이 매우 길어서 셀 내에서 잘리는 경우를 테스트합니다.
 */
export const LongEventTitle: Story = {
  render: () => (
    <TableContainer sx={{ width: 200 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          <TableRow>
            <DroppableCell dateString="2025-11-10" day={10} onClick={() => {}} onDrop={() => {}}>
              <DraggableEvent
                event={{
                  id: 'test-1',
                  title:
                    '매우 긴 제목의 일정입니다. 이 제목은 화면을 벗어날 수 있고, 셀 내에서 어떻게 표시될까요?',
                  date: '2025-11-10',
                  startTime: '10:00',
                  endTime: '11:00',
                  description: '',
                  location: '',
                  category: '업무',
                  repeat: { type: 'none', interval: 0 },
                  notificationTime: 1,
                }}
                isNotified={false}
                isRepeating={false}
                getRepeatTypeLabel={getRepeatTypeLabel}
                onDragStart={() => {}}
                onDragEnd={() => {}}
              />
            </DroppableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * DraggableEvent - 여러 긴 제목 일정
 * 같은 셀에 여러 개의 긴 제목 일정이 있는 경우를 테스트합니다.
 */
export const MultipleLongEventTitles: Story = {
  render: () => (
    <TableContainer sx={{ width: 200 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          <TableRow>
            <DroppableCell dateString="2025-11-10" day={10} onClick={() => {}} onDrop={() => {}}>
              <Stack spacing={0.5}>
                <DraggableEvent
                  event={{
                    id: 'test-1',
                    title:
                      '첫 번째 매우 긴 제목의 일정입니다. 이 제목은 셀 내에서 어떻게 표시될까요?',
                    date: '2025-11-10',
                    startTime: '10:00',
                    endTime: '11:00',
                    description: '',
                    location: '',
                    category: '업무',
                    repeat: { type: 'none', interval: 0 },
                    notificationTime: 1,
                  }}
                  isNotified={false}
                  isRepeating={false}
                  getRepeatTypeLabel={getRepeatTypeLabel}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <DraggableEvent
                  event={{
                    id: 'test-2',
                    title:
                      '두 번째 매우 긴 제목의 일정입니다. 이 제목도 셀 내에서 잘릴 수 있습니다.',
                    date: '2025-11-10',
                    startTime: '11:00',
                    endTime: '12:00',
                    description: '',
                    location: '',
                    category: '개인',
                    repeat: { type: 'none', interval: 0 },
                    notificationTime: 1,
                  }}
                  isNotified={false}
                  isRepeating={false}
                  getRepeatTypeLabel={getRepeatTypeLabel}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
                <DraggableEvent
                  event={{
                    id: 'test-3',
                    title:
                      '세 번째 매우 긴 제목의 일정입니다. 여러 일정이 겹칠 때 어떻게 표시될까요?',
                    date: '2025-11-10',
                    startTime: '12:00',
                    endTime: '13:00',
                    description: '',
                    location: '',
                    category: '가족',
                    repeat: { type: 'none', interval: 0 },
                    notificationTime: 1,
                  }}
                  isNotified={false}
                  isRepeating={false}
                  getRepeatTypeLabel={getRepeatTypeLabel}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              </Stack>
            </DroppableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * DroppableCell - 공휴일 + 긴 제목 일정
 * 공휴일과 긴 제목 일정이 함께 있는 경우를 테스트합니다.
 */
export const HolidayWithLongEventTitle: Story = {
  render: () => (
    <TableContainer sx={{ width: 200 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          <TableRow>
            <DroppableCell
              dateString="2025-11-10"
              day={10}
              holiday="매우 긴 공휴일 이름입니다. 이 이름은 셀 내에서 어떻게 표시될까요?"
              onClick={() => {}}
              onDrop={() => {}}
            >
              <DraggableEvent
                event={{
                  id: 'test-1',
                  title:
                    '공휴일에 있는 매우 긴 제목의 일정입니다. 공휴일 이름과 일정 제목이 모두 길 때 어떻게 표시될까요?',
                  date: '2025-11-10',
                  startTime: '10:00',
                  endTime: '11:00',
                  description: '',
                  location: '',
                  category: '업무',
                  repeat: { type: 'none', interval: 0 },
                  notificationTime: 1,
                }}
                isNotified={false}
                isRepeating={false}
                getRepeatTypeLabel={getRepeatTypeLabel}
                onDragStart={() => {}}
                onDragEnd={() => {}}
              />
            </DroppableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * CalendarView - Week 뷰에서 긴 텍스트
 * Week 뷰에서 여러 셀에 긴 텍스트가 있는 경우를 테스트합니다.
 */
export const WeekViewWithLongTexts: Story = {
  render: () => (
    <TableContainer sx={{ width: 800 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                {day}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            {[10, 11, 12, 13, 14, 15, 16].map((day, index) => (
              <DroppableCell
                key={day}
                dateString={`2025-11-${day}`}
                day={day}
                holiday={index === 0 ? '매우 긴 공휴일 이름입니다' : undefined}
                onClick={() => {}}
                onDrop={() => {}}
              >
                {index === 1 && (
                  <DraggableEvent
                    event={{
                      id: `test-${day}`,
                      title: '매우 긴 제목의 일정입니다. 이 제목은 셀 내에서 어떻게 표시될까요?',
                      date: `2025-11-${day}`,
                      startTime: '10:00',
                      endTime: '11:00',
                      description: '',
                      location: '',
                      category: '업무',
                      repeat: { type: 'none', interval: 0 },
                      notificationTime: 1,
                    }}
                    isNotified={false}
                    isRepeating={false}
                    getRepeatTypeLabel={getRepeatTypeLabel}
                    onDragStart={() => {}}
                    onDragEnd={() => {}}
                  />
                )}
              </DroppableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

/**
 * CalendarView - Month 뷰에서 긴 텍스트
 * Month 뷰에서 여러 셀에 긴 텍스트가 있는 경우를 테스트합니다.
 */
export const MonthViewWithLongTexts: Story = {
  render: () => (
    <TableContainer sx={{ width: 800 }}>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                {day}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            [null, null, null, null, null, 1, 2],
            [3, 4, 5, 6, 7, 8, 9],
            [10, 11, 12, 13, 14, 15, 16],
          ].map((week, weekIndex) => (
            <TableRow key={weekIndex}>
              {week.map((day, dayIndex) => (
                <DroppableCell
                  key={dayIndex}
                  dateString={day ? `2025-11-${day}` : ''}
                  day={day}
                  holiday={day === 10 ? '매우 긴 공휴일 이름입니다' : undefined}
                  onClick={() => {}}
                  onDrop={() => {}}
                >
                  {day === 11 && (
                    <DraggableEvent
                      event={{
                        id: `test-${day}`,
                        title: '매우 긴 제목의 일정입니다. 이 제목은 셀 내에서 어떻게 표시될까요?',
                        date: `2025-11-${day}`,
                        startTime: '10:00',
                        endTime: '11:00',
                        description: '',
                        location: '',
                        category: '업무',
                        repeat: { type: 'none', interval: 0 },
                        notificationTime: 1,
                      }}
                      isNotified={false}
                      isRepeating={false}
                      getRepeatTypeLabel={getRepeatTypeLabel}
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                    />
                  )}
                </DroppableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
};
