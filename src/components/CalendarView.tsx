import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

import { Event, RepeatType } from '../types';
import DraggableEvent from './DraggableEvent';
import DroppableCell from './DroppableCell';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarViewProps {
  view: 'week' | 'month';
  currentDate: Date;
  holidays: Record<string, string>;
  events: Event[];
  notifiedEvents: string[];

  getRepeatTypeLabel: (type: RepeatType) => string;

  onDateClick: (dateString: string) => void;

  onDragStart: (e: React.DragEvent, event: Event) => void;

  onDragEnd: (eventId: string, targetDate: string) => void;
}

/**
 * 캘린더 뷰 컴포넌트
 * Week 뷰와 Month 뷰를 렌더링합니다.
 */
const CalendarView = ({
  view,
  currentDate,
  holidays,
  events,
  notifiedEvents,
  getRepeatTypeLabel,
  onDateClick,
  onDragStart,
  onDragEnd,
}: CalendarViewProps) => {
  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    const eventId = e.dataTransfer.getData('eventId');
    if (eventId) {
      onDragEnd(eventId, dateStr);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  if (view === 'week') {
    const weekDates = getWeekDates(currentDate);
    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates.map((date) => {
                  const dateString = formatDate(date, date.getDate());
                  const day = date.getDate();
                  const holiday = holidays[dateString];

                  return (
                    <DroppableCell
                      key={date.toISOString()}
                      dateString={dateString}
                      day={day}
                      holiday={holiday}
                      onClick={() => onDateClick(dateString)}
                      onDrop={handleDrop}
                    >
                      {events
                        .filter(
                          (event) => new Date(event.date).toDateString() === date.toDateString()
                        )
                        .map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);
                          const isRepeating = event.repeat.type !== 'none';

                          return (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              isNotified={isNotified}
                              isRepeating={isRepeating}
                              getRepeatTypeLabel={getRepeatTypeLabel}
                              onDragStart={onDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          );
                        })}
                    </DroppableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }

  // Month view
  const weeks = getWeeksAtMonth(currentDate);

  return (
    <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
      <Typography variant="h5">{formatMonth(currentDate)}</Typography>
      <TableContainer>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {weekDays.map((day) => (
                <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {weeks.map((week, weekIndex) => (
              <TableRow key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const dateString = day ? formatDate(currentDate, day) : '';
                  const holiday = holidays[dateString];

                  return (
                    <DroppableCell
                      key={dayIndex}
                      dateString={dateString}
                      day={day}
                      holiday={holiday}
                      onClick={() => onDateClick(dateString)}
                      onDrop={handleDrop}
                    >
                      {day &&
                        getEventsForDay(events, day).map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);
                          const isRepeating = event.repeat.type !== 'none';

                          return (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              isNotified={isNotified}
                              isRepeating={isRepeating}
                              getRepeatTypeLabel={getRepeatTypeLabel}
                              onDragStart={onDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          );
                        })}
                    </DroppableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default CalendarView;
