import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * 일정 폼 컴포넌트
 * 일정 추가/수정을 위한 폼입니다.
 */
const EventForm = ({
  title,
  date,
  startTime,
  endTime,
  description,
  location,
  category,
  isRepeating,
  repeatType,
  repeatInterval,
  repeatEndDate,
  notificationTime,
  startTimeError,
  endTimeError,
  isEditing,
  onTitleChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDescriptionChange,
  onLocationChange,
  onCategoryChange,
  onIsRepeatingChange,
  onRepeatTypeChange,
  onRepeatIntervalChange,
  onRepeatEndDateChange,
  onNotificationTimeChange,
}: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  isRepeating: boolean;
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatInterval: number;
  repeatEndDate: string;
  notificationTime: number;
  startTimeError?: string;
  endTimeError?: string;
  isEditing: boolean;

  onTitleChange: (value: string) => void;

  onDateChange: (value: string) => void;

  onStartTimeChange: (value: string) => void;

  onEndTimeChange: (value: string) => void;

  onDescriptionChange: (value: string) => void;

  onLocationChange: (value: string) => void;

  onCategoryChange: (value: string) => void;

  onIsRepeatingChange: (checked: boolean) => void;

  onRepeatTypeChange: (value: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;

  onRepeatIntervalChange: (value: number) => void;

  onRepeatEndDateChange: (value: string) => void;

  onNotificationTimeChange: (value: number) => void;
}) => {
  const categories = ['업무', '개인', '가족', '기타'];
  const notificationOptions = [
    { value: 1, label: '1분 전' },
    { value: 10, label: '10분 전' },
    { value: 60, label: '1시간 전' },
    { value: 120, label: '2시간 전' },
    { value: 1440, label: '1일 전' },
  ];

  return (
    <Box sx={{ width: 400, p: 3 }}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <FormLabel htmlFor="title">제목</FormLabel>
          <TextField
            id="title"
            size="small"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel htmlFor="date">날짜</FormLabel>
          <TextField
            id="date"
            size="small"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
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
                onChange={(e) => onStartTimeChange(e.target.value)}
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
                onChange={(e) => onEndTimeChange(e.target.value)}
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
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel htmlFor="location">위치</FormLabel>
          <TextField
            id="location"
            size="small"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </FormControl>

        <FormControl fullWidth>
          <FormLabel id="category-label">카테고리</FormLabel>
          <Select
            id="category"
            size="small"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-labelledby="category-label"
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!isEditing && (
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRepeating}
                  onChange={(e) => onIsRepeatingChange(e.target.checked)}
                />
              }
              label="반복 일정"
            />
          </FormControl>
        )}

        {isRepeating && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <FormLabel id="repeat-type-label">반복 유형</FormLabel>
              <Select
                id="repeat-type"
                size="small"
                value={repeatType}
                onChange={(e) =>
                  onRepeatTypeChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')
                }
                aria-labelledby="repeat-type-label"
              >
                <MenuItem value="daily">매일</MenuItem>
                <MenuItem value="weekly">매주</MenuItem>
                <MenuItem value="monthly">매월</MenuItem>
                <MenuItem value="yearly">매년</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
              <TextField
                id="repeat-interval"
                size="small"
                type="number"
                value={repeatInterval}
                onChange={(e) => onRepeatIntervalChange(Number(e.target.value))}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
              <TextField
                id="repeat-end-date"
                size="small"
                type="date"
                value={repeatEndDate}
                onChange={(e) => onRepeatEndDateChange(e.target.value)}
              />
            </FormControl>
          </Stack>
        )}

        <FormControl fullWidth>
          <FormLabel htmlFor="notification">알림 설정</FormLabel>
          <Select
            id="notification"
            size="small"
            value={notificationTime}
            onChange={(e) => onNotificationTimeChange(Number(e.target.value))}
          >
            {notificationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" color="primary">
          {isEditing ? '일정 수정' : '일정 추가'}
        </Button>
      </Stack>
    </Box>
  );
};

const meta = {
  title: 'Components/EventForm',
  component: EventForm,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [320, 768, 1024] },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 폼 상태
 * 빈 폼의 기본 상태입니다.
 */
export const Default: Story = {
  args: {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 1,
    isEditing: false,
    onTitleChange: () => {},
    onDateChange: () => {},
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onDescriptionChange: () => {},
    onLocationChange: () => {},
    onCategoryChange: () => {},
    onIsRepeatingChange: () => {},
    onRepeatTypeChange: () => {},
    onRepeatIntervalChange: () => {},
    onRepeatEndDateChange: () => {},
    onNotificationTimeChange: () => {},
  },
};

/**
 * 폼 필드 채워진 상태
 * 모든 필드가 채워진 상태입니다.
 */
export const Filled: Story = {
  args: {
    title: '회의 일정',
    date: '2025-11-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '프로젝트 회의',
    location: '회의실 A',
    category: '업무',
    isRepeating: false,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 60,
    isEditing: false,
    onTitleChange: () => {},
    onDateChange: () => {},
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onDescriptionChange: () => {},
    onLocationChange: () => {},
    onCategoryChange: () => {},
    onIsRepeatingChange: () => {},
    onRepeatTypeChange: () => {},
    onRepeatIntervalChange: () => {},
    onRepeatEndDateChange: () => {},
    onNotificationTimeChange: () => {},
  },
};

/**
 * 에러 상태 - 시작 시간 오류
 * 시작 시간이 종료 시간보다 늦은 경우입니다.
 */
export const StartTimeError: Story = {
  args: {
    title: '회의 일정',
    date: '2025-11-10',
    startTime: '12:00',
    endTime: '11:00',
    description: '프로젝트 회의',
    location: '회의실 A',
    category: '업무',
    isRepeating: false,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 60,
    startTimeError: '시작 시간이 종료 시간보다 늦을 수 없습니다.',
    isEditing: false,
    onTitleChange: () => {},
    onDateChange: () => {},
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onDescriptionChange: () => {},
    onLocationChange: () => {},
    onCategoryChange: () => {},
    onIsRepeatingChange: () => {},
    onRepeatTypeChange: () => {},
    onRepeatIntervalChange: () => {},
    onRepeatEndDateChange: () => {},
    onNotificationTimeChange: () => {},
  },
};

/**
 * 반복 일정 활성화 상태
 * 반복 일정 체크박스가 활성화된 상태입니다.
 */
export const RepeatingEnabled: Story = {
  args: {
    title: '주간 회의',
    date: '2025-11-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 정기 회의',
    location: '회의실 A',
    category: '업무',
    isRepeating: true,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '2025-12-31',
    notificationTime: 60,
    isEditing: false,
    onTitleChange: () => {},
    onDateChange: () => {},
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onDescriptionChange: () => {},
    onLocationChange: () => {},
    onCategoryChange: () => {},
    onIsRepeatingChange: () => {},
    onRepeatTypeChange: () => {},
    onRepeatIntervalChange: () => {},
    onRepeatEndDateChange: () => {},
    onNotificationTimeChange: () => {},
  },
};

/**
 * 수정 모드
 * 기존 일정을 수정하는 모드입니다.
 */
export const EditMode: Story = {
  args: {
    title: '수정할 일정',
    date: '2025-11-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '수정 중인 일정',
    location: '회의실 B',
    category: '개인',
    isRepeating: false,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    isEditing: true,
    onTitleChange: () => {},
    onDateChange: () => {},
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onDescriptionChange: () => {},
    onLocationChange: () => {},
    onCategoryChange: () => {},
    onIsRepeatingChange: () => {},
    onRepeatTypeChange: () => {},
    onRepeatIntervalChange: () => {},
    onRepeatEndDateChange: () => {},
    onNotificationTimeChange: () => {},
  },
};
