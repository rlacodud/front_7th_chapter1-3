import {
  ChevronLeft,
  ChevronRight,
  Close,
  Delete,
  Edit,
  Notifications,
  Repeat,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';

import DraggableEvent from './components/DraggableEvent.tsx';
import DroppableCell from './components/DroppableCell.tsx';
import RecurringEventDialog from './components/RecurringEventDialog.tsx';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventForm } from './hooks/useEventForm.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useRecurringEventOperations } from './hooks/useRecurringEventOperations.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event, EventForm, RepeatType } from './types.ts';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from './utils/dateUtils.ts';
import { findOverlappingEvents } from './utils/eventOverlap.ts';
import { getTimeErrorMessage } from './utils/timeValidation.ts';

const categories = ['업무', '개인', '가족', '기타'];

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

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

function App() {
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  } = useEventForm();

  const { events, saveEvent, updateEvent, deleteEvent, createRepeatEvent, fetchEvents } =
    useEventOperations(Boolean(editingEvent), () => setEditingEvent(null));

  const { handleRecurringEdit, handleRecurringDelete, findRelatedRecurringEvents } =
    useRecurringEventOperations(events, async () => {
      // After recurring edit, refresh events from server
      await fetchEvents();
      setEditingEvent(null);
    });

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);
  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<Event | null>(null);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<Event | null>(null);
  const [recurringEditMode, setRecurringEditMode] = useState<boolean | null>(null);
  const [recurringDialogMode, setRecurringDialogMode] = useState<'edit' | 'delete' | 'drag'>(
    'edit'
  );
  const [pendingDragMove, setPendingDragMove] = useState<{
    event: Event;
    newDate: string;
  } | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  const handleRecurringConfirm = async (editSingleOnly: boolean) => {
    // 드래그로 인한 반복 일정 이동 처리
    if (recurringDialogMode === 'drag' && pendingDragMove) {
      await handleRecurringMove(pendingDragMove.event, pendingDragMove.newDate, editSingleOnly);
      setIsRecurringDialogOpen(false);
      setPendingDragMove(null);
      return;
    } else if (recurringDialogMode === 'edit' && pendingRecurringEdit) {
      // 편집 모드: 선택한 모드에 따라 편집 폼으로 이동
      setRecurringEditMode(editSingleOnly);
      editEvent(pendingRecurringEdit);
      setIsRecurringDialogOpen(false);
      setPendingRecurringEdit(null);
      return;
    } else if (recurringDialogMode === 'delete' && pendingRecurringDelete) {
      // 삭제 모드: 선택한 모드에 따라 일정 삭제
      try {
        await handleRecurringDelete(pendingRecurringDelete, editSingleOnly);
        enqueueSnackbar('일정이 삭제되었습니다', { variant: 'success' });
      } catch (error) {
        console.error(error);
        enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
      }
      setIsRecurringDialogOpen(false);
      setPendingRecurringDelete(null);
    }
  };

  /**
   * 반복 일정 이동 처리
   * @param draggedEvent - 드래그된 일정
   * @param newDate - 이동할 새 날짜
   * @param moveSingleOnly - true: 단일 일정만 이동 | false: 일괄 이동
   */
  const handleRecurringMove = async (
    draggedEvent: Event,
    newDate: string,
    moveSingleOnly: boolean
  ) => {
    try {
      if (moveSingleOnly) {
        // 단일 일정만 이동: 반복 속성을 제거하고 일반 일정으로 변경
        const updatedEvent: Event = {
          ...draggedEvent,
          date: newDate,
          repeat: {
            type: 'none',
            interval: 0,
          },
        };

        // 중복 검사
        const overlapping = findOverlappingEvents(updatedEvent, events).filter(
          (e) => e.id !== draggedEvent.id
        );
        const hasOverlap = overlapping.length > 0;

        if (hasOverlap) {
          setEditingEvent(updatedEvent);
          setOverlappingEvents(overlapping);
          setIsOverlapDialogOpen(true);
          return;
        }

        await updateEvent(updatedEvent);
        enqueueSnackbar('일정이 이동되었습니다', { variant: 'success' });
      } else {
        // 일괄 이동: 날짜 차이를 계산하여 모든 관련 일정에 동일한 차이 적용
        const originalDate = new Date(draggedEvent.date);
        const targetDateObj = new Date(newDate);
        const daysDiff = Math.round(
          (targetDateObj.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const relatedEvents = findRelatedRecurringEvents(draggedEvent);

        if (relatedEvents.length === 0) {
          // 관련 일정이 없는 경우: 단일 일정만 이동
          const updatedEvent: Event = { ...draggedEvent, date: newDate };

          const overlapping = findOverlappingEvents(updatedEvent, events).filter(
            (e) => e.id !== draggedEvent.id
          );
          const hasOverlap = overlapping.length > 0;

          if (hasOverlap) {
            setEditingEvent(updatedEvent);
            setOverlappingEvents(overlapping);
            setIsOverlapDialogOpen(true);
            return;
          }

          await updateEvent(updatedEvent);
        } else {
          // 관련 일정이 있는 경우: 모든 일정의 날짜를 동일한 일수만큼 이동
          const updatedEvents = relatedEvents.map((event) => {
            const eventDate = new Date(event.date);
            eventDate.setDate(eventDate.getDate() + daysDiff);
            return {
              ...event,
              date: formatDate(eventDate),
            };
          });

          // 모든 이동된 일정에 대해 중복 검사
          const allOverlapping: Event[] = [];
          for (const event of updatedEvents) {
            const overlapping = findOverlappingEvents(
              event,
              events.filter((e) => !updatedEvents.some((evt) => evt.id === e.id))
            );
            allOverlapping.push(...overlapping);
          }

          // 중복이 있으면 모달 표시 후 대기
          if (allOverlapping.length > 0) {
            setEditingEvent(updatedEvents[0]);
            setOverlappingEvents(allOverlapping);
            setIsOverlapDialogOpen(true);
            // 중복 모달에서 확인 후 전체 일정 업데이트를 위해 정보 저장
            setPendingDragMove({
              event: draggedEvent,
              newDate,
            });
            return;
          }

          // 중복이 없으면 모든 일정 일괄 업데이트
          const response = await fetch('/api/events-list', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: updatedEvents }),
          });

          if (!response.ok) {
            throw new Error('Failed to move recurring events');
          }

          await fetchEvents();
        }
        enqueueSnackbar('반복 일정이 모두 이동되었습니다', { variant: 'success' });
      }
    } catch (error) {
      console.error('일정 이동 실패:', error);
      enqueueSnackbar('일정 이동에 실패했습니다', { variant: 'error' });
    }
  };

  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  const handleEditEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring edit dialog
      setPendingRecurringEdit(event);
      setRecurringDialogMode('edit');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event editing
      editEvent(event);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      // Show recurring delete dialog
      setPendingRecurringDelete(event);
      setRecurringDialogMode('delete');
      setIsRecurringDialogOpen(true);
    } else {
      // Regular event deletion
      deleteEvent(event.id);
    }
  };

  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }

    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData: Event | EventForm = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: editingEvent
        ? editingEvent.repeat // Keep original repeat settings for recurring event detection
        : {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
      notificationTime,
    };

    const overlapping = findOverlappingEvents(eventData, events);
    const hasOverlapEvent = overlapping.length > 0;

    // 수정
    if (editingEvent) {
      if (hasOverlapEvent) {
        setOverlappingEvents(overlapping);
        setIsOverlapDialogOpen(true);
        return;
      }

      if (
        editingEvent.repeat.type !== 'none' &&
        editingEvent.repeat.interval > 0 &&
        recurringEditMode !== null
      ) {
        await handleRecurringEdit(eventData as Event, recurringEditMode);
        setRecurringEditMode(null);
      } else {
        await saveEvent(eventData);
      }

      resetForm();
      return;
    }

    // 생성
    if (isRepeating) {
      // 반복 생성은 반복 일정을 고려하지 않는다.
      await createRepeatEvent(eventData);
      resetForm();
      return;
    }

    if (hasOverlapEvent) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      return;
    }

    await saveEvent(eventData);
    resetForm();
  };

  /**
   * 일정 드래그 시작 시
   * 드래그할 일정의 ID를 dataTransfer에 저장
   */
  const handleDragStart = (e: React.DragEvent, event: Event) => {
    e.dataTransfer.setData('eventId', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * 일정 드롭 시
   * 드롭된 위치의 날짜로 일정을 이동하고 중복 검사 및 반복 일정 처리 진행
   * @param eventId - 드래그된 일정의 ID
   * @param targetDate - 드롭된 위치의 날짜
   */
  const handleDragEnd = async (eventId: string, targetDate: string) => {
    const draggedEvent = events.find((evt) => evt.id === eventId);
    // 같은 날짜로 이동하는 경우 처리하지 않음
    if (!draggedEvent || draggedEvent.date === targetDate) {
      return;
    }

    // 날짜만 변경한 새로운 일정 객체 생성
    const updatedEvent: Event = {
      ...draggedEvent,
      date: targetDate,
    };

    // 중복 검사(자기 자신은 제외)
    const overlapping = findOverlappingEvents(updatedEvent, events).filter(
      (e) => e.id !== draggedEvent.id
    );
    const hasOverlap = overlapping.length > 0;

    // 반복 일정인 경우: 사용자에게 단일/전체 이동 선택 모달 표시
    if (isRecurringEvent(draggedEvent)) {
      setPendingDragMove({
        event: draggedEvent,
        newDate: targetDate,
      });
      setRecurringDialogMode('drag');
      setIsRecurringDialogOpen(true);
      // 중복 정보도 함께 저장(모달 확인용)
      if (hasOverlap) {
        setOverlappingEvents(overlapping);
      }
      return;
    }

    // 일반 일정인 경우: 중복이 있으면 확인 모달 표시
    if (hasOverlap) {
      setEditingEvent(updatedEvent);
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      return;
    }

    // 중복이 없으면 일정 업데이트
    try {
      await updateEvent(updatedEvent);
    } catch {
      enqueueSnackbar('일정 이동을 실패했습니다', { variant: 'error' });
    }
  };

  const renderWeekView = () => {
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
                      onClick={() => setDate(dateString)}
                      onDrop={(e: React.DragEvent, dateStr: string) => {
                        const eventId = e.dataTransfer.getData('eventId');
                        if (eventId) {
                          handleDragEnd(eventId, dateStr);
                        }
                      }}
                    >
                      {filteredEvents
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
                              onDragStart={handleDragStart}
                              onDragEnd={(e: React.DragEvent) => {
                                (e.currentTarget as HTMLElement).style.opacity = '1';
                              }}
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
  };

  const renderMonthView = () => {
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
                        onClick={() => setDate(dateString)}
                        onDrop={(e: React.DragEvent, dateStr: string) => {
                          const eventId = e.dataTransfer.getData('eventId');
                          if (eventId) {
                            handleDragEnd(eventId, dateStr);
                          }
                        }}
                      >
                        {day &&
                          getEventsForDay(filteredEvents, day).map((event) => {
                            const isNotified = notifiedEvents.includes(event.id);
                            const isRepeating = event.repeat.type !== 'none';

                            return (
                              <DraggableEvent
                                key={event.id}
                                event={event}
                                isNotified={isNotified}
                                isRepeating={isRepeating}
                                getRepeatTypeLabel={getRepeatTypeLabel}
                                onDragStart={handleDragStart}
                                onDragEnd={(e: React.DragEvent) => {
                                  (e.currentTarget as HTMLElement).style.opacity = '1';
                                }}
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

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <Stack spacing={2} sx={{ width: '20%' }}>
          <Typography variant="h4">{editingEvent ? '일정 수정' : '일정 추가'}</Typography>

          <FormControl fullWidth>
            <FormLabel htmlFor="title">제목</FormLabel>
            <TextField
              id="title"
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="date">날짜</FormLabel>
            <TextField
              id="date"
              size="small"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormControl>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel htmlFor="start-time">시작 시간</FormLabel>
              <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
                <TextField
                  id="start-time"
                  size="small"
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  onBlur={() => getTimeErrorMessage(startTime, endTime)}
                  error={!!startTimeError}
                />
              </Tooltip>
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="end-time">종료 시간</FormLabel>
              <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
                <TextField
                  id="end-time"
                  size="small"
                  type="time"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  onBlur={() => getTimeErrorMessage(startTime, endTime)}
                  error={!!endTimeError}
                />
              </Tooltip>
            </FormControl>
          </Stack>

          <FormControl fullWidth>
            <FormLabel htmlFor="description">설명</FormLabel>
            <TextField
              id="description"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="location">위치</FormLabel>
            <TextField
              id="location"
              size="small"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel id="category-label">카테고리</FormLabel>
            <Select
              id="category"
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-labelledby="category-label"
              aria-label="카테고리"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!editingEvent && (
            <FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRepeating}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsRepeating(checked);
                      if (checked) {
                        setRepeatType('daily');
                      } else {
                        setRepeatType('none');
                      }
                    }}
                  />
                }
                label="반복 일정"
              />
            </FormControl>
          )}

          {/* ! TEST CASE */}
          {isRepeating && !editingEvent && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <FormLabel>반복 유형</FormLabel>
                <Select
                  size="small"
                  value={repeatType}
                  aria-label="반복 유형"
                  onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                >
                  <MenuItem value="daily" aria-label="daily-option">
                    매일
                  </MenuItem>
                  <MenuItem value="weekly" aria-label="weekly-option">
                    매주
                  </MenuItem>
                  <MenuItem value="monthly" aria-label="monthly-option">
                    매월
                  </MenuItem>
                  <MenuItem value="yearly" aria-label="yearly-option">
                    매년
                  </MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
                  <TextField
                    id="repeat-interval"
                    size="small"
                    type="number"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
                  <TextField
                    id="repeat-end-date"
                    size="small"
                    type="date"
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                  />
                </FormControl>
              </Stack>
            </Stack>
          )}

          <FormControl fullWidth>
            <FormLabel htmlFor="notification">알림 설정</FormLabel>
            <Select
              id="notification"
              size="small"
              value={notificationTime}
              onChange={(e) => setNotificationTime(Number(e.target.value))}
            >
              {notificationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            data-testid="event-submit-button"
            onClick={addOrUpdateEvent}
            variant="contained"
            color="primary"
          >
            {editingEvent ? '일정 수정' : '일정 추가'}
          </Button>
        </Stack>

        <Stack flex={1} spacing={5}>
          <Typography variant="h4">일정 보기</Typography>

          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
              <ChevronLeft />
            </IconButton>
            <Select
              size="small"
              aria-label="뷰 타입 선택"
              value={view}
              onChange={(e) => setView(e.target.value as 'week' | 'month')}
            >
              <MenuItem value="week" aria-label="week-option">
                Week
              </MenuItem>
              <MenuItem value="month" aria-label="month-option">
                Month
              </MenuItem>
            </Select>
            <IconButton aria-label="Next" onClick={() => navigate('next')}>
              <ChevronRight />
            </IconButton>
          </Stack>

          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </Stack>

        <Stack
          data-testid="event-list"
          spacing={2}
          sx={{ width: '30%', height: '100%', overflowY: 'auto' }}
        >
          <FormControl fullWidth>
            <FormLabel htmlFor="search">일정 검색</FormLabel>
            <TextField
              id="search"
              size="small"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>

          {filteredEvents.length === 0 ? (
            <Typography>검색 결과가 없습니다.</Typography>
          ) : (
            filteredEvents.map((event) => (
              <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {notifiedEvents.includes(event.id) && <Notifications color="error" />}
                      {event.repeat.type !== 'none' && (
                        <Tooltip
                          title={`${event.repeat.interval}${getRepeatTypeLabel(
                            event.repeat.type
                          )}마다 반복${
                            event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
                          }`}
                        >
                          <Repeat fontSize="small" />
                        </Tooltip>
                      )}
                      <Typography
                        fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
                        color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
                      >
                        {event.title}
                      </Typography>
                    </Stack>
                    <Typography>{event.date}</Typography>
                    <Typography>
                      {event.startTime} - {event.endTime}
                    </Typography>
                    <Typography>{event.description}</Typography>
                    <Typography>{event.location}</Typography>
                    <Typography>카테고리: {event.category}</Typography>
                    {event.repeat.type !== 'none' && (
                      <Typography>
                        반복: {event.repeat.interval}
                        {event.repeat.type === 'daily' && '일'}
                        {event.repeat.type === 'weekly' && '주'}
                        {event.repeat.type === 'monthly' && '월'}
                        {event.repeat.type === 'yearly' && '년'}
                        마다
                        {event.repeat.endDate && ` (종료: ${event.repeat.endDate})`}
                      </Typography>
                    )}
                    <Typography>
                      알림:{' '}
                      {
                        notificationOptions.find(
                          (option) => option.value === event.notificationTime
                        )?.label
                      }
                    </Typography>
                  </Stack>
                  <Stack>
                    <IconButton aria-label="Edit event" onClick={() => handleEditEvent(event)}>
                      <Edit />
                    </IconButton>
                    <IconButton aria-label="Delete event" onClick={() => handleDeleteEvent(event)}>
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Stack>

      <Dialog open={isOverlapDialogOpen} onClose={() => setIsOverlapDialogOpen(false)}>
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
          <Button onClick={() => setIsOverlapDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            onClick={async () => {
              setIsOverlapDialogOpen(false);

              // 드래그앤드롭으로 인한 수정인지 판단(폼 필드가 비어있으면 D&D로 판단)
              const isDragAndDrop = editingEvent && !title && !date && !startTime && !endTime;

              if (isDragAndDrop) {
                // 드래그앤드롭으로 이동된 일정 저장
                await updateEvent(editingEvent);
                setEditingEvent(null);

                // 반복 일정 일괄 이동이 대기 중인 경우 처리
                if (pendingDragMove) {
                  const { event, newDate } = pendingDragMove;
                  // 원본 날짜와 이동할 날짜의 차이 계산
                  const originalDate = new Date(event.date);
                  const targetDateObj = new Date(newDate);
                  const daysDiff = Math.round(
                    (targetDateObj.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const relatedEvents = findRelatedRecurringEvents(event);

                  // 관련된 모든 반복 일정의 날짜를 동일한 일수만큼 이동
                  if (relatedEvents.length > 0) {
                    const updatedEvents = relatedEvents.map((e) => {
                      const eventDate = new Date(e.date);
                      eventDate.setDate(eventDate.getDate() + daysDiff);
                      return {
                        ...e,
                        date: formatDate(eventDate),
                      };
                    });

                    // 모든 관련 일정 일괄 업데이트
                    const response = await fetch('/api/events-list', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ events: updatedEvents }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to move recurring events');
                    }

                    await fetchEvents();
                    enqueueSnackbar('반복 일정이 모두 이동되었습니다', { variant: 'success' });
                  }
                  setPendingDragMove(null);
                }
              } else {
                // 일반 추가/수정으로 인한 겹침: 폼 데이터로 일정 저장
                saveEvent({
                  id: editingEvent ? editingEvent.id : undefined,
                  title,
                  date,
                  startTime,
                  endTime,
                  description,
                  location,
                  category,
                  repeat: {
                    type: isRepeating ? repeatType : 'none',
                    interval: repeatInterval,
                    endDate: repeatEndDate || undefined,
                  },
                  notificationTime,
                });
              }
            }}
          >
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      <RecurringEventDialog
        open={isRecurringDialogOpen}
        onClose={() => {
          setIsRecurringDialogOpen(false);
          setPendingRecurringEdit(null);
          setPendingRecurringDelete(null);
        }}
        onConfirm={handleRecurringConfirm}
        event={recurringDialogMode === 'edit' ? pendingRecurringEdit : pendingRecurringDelete}
        mode={recurringDialogMode}
      />

      {notifications.length > 0 && (
        <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
          {notifications.map((notification, index) => (
            <Alert
              key={index}
              severity="info"
              sx={{ width: 'auto' }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Close />
                </IconButton>
              }
            >
              <AlertTitle>{notification.message}</AlertTitle>
            </Alert>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default App;
