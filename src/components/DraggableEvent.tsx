import { Notifications, Repeat } from '@mui/icons-material';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';

import { Event, RepeatType } from '../types';

interface DraggableEventProps {
  event: Event;
  isNotified: boolean;
  isRepeating: boolean;
  getRepeatTypeLabel: (type: RepeatType) => string;
  onDragStart: (e: React.DragEvent, event: Event) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const eventBoxStyles = {
  notified: {
    backgroundColor: '#ffebee',
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  normal: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'normal',
    color: 'inherit',
  },
  common: {
    p: 0.5,
    my: 0.5,
    borderRadius: 1,
    minHeight: '18px',
    width: '100%',
    overflow: 'hidden',
    cursor: 'move',
  },
};

const DraggableEvent = ({
  event,
  isNotified,
  isRepeating,
  getRepeatTypeLabel,
  onDragStart,
  onDragEnd,
}: DraggableEventProps) => {
  return (
    <Box
      draggable
      sx={{
        ...eventBoxStyles.common,
        ...(isNotified ? eventBoxStyles.notified : eventBoxStyles.normal),
      }}
      onDragStart={(e) => {
        onDragStart(e, event);
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        onDragEnd(e);
        e.currentTarget.style.opacity = '1';
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: '100%' }}>
        {isNotified && <Notifications fontSize="small" sx={{ flexShrink: 0 }} />}
        {isRepeating && (
          <Tooltip
            title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
            }`}
          >
            <Repeat fontSize="small" sx={{ flexShrink: 0 }} />
          </Tooltip>
        )}
        <Typography
          variant="caption"
          noWrap
          sx={{
            fontSize: '0.75rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
};

export default DraggableEvent;
