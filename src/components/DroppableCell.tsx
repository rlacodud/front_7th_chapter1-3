import { TableCell, Typography } from '@mui/material';
import React, { ReactNode, useState } from 'react';

interface DroppableCellProps {
  dateString: string;
  day: number | null;
  holiday?: string;
  onClick: () => void;

  onDrop: (_e: React.DragEvent, _dateString: string) => void;
  children: ReactNode;
}

const DroppableCell = ({
  dateString,
  day,
  holiday,
  onClick,
  onDrop,
  children,
}: DroppableCellProps) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <TableCell
      sx={{
        height: '120px',
        verticalAlign: 'top',
        width: '14.28%',
        padding: 1,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isOver ? '#f0f0f0' : '',
        // 크로마틱 시각적 회귀 테스트를 위한 인라인 스타일
        transition: 'background-color 0.2s ease-in-out',
      }}
      style={{
        minHeight: '120px',
      }}
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => {
        setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e, dateString);
      }}
    >
      {day && (
        <>
          <Typography variant="body2" fontWeight="bold">
            {day}
          </Typography>
          {holiday && (
            <Typography
              variant="body2"
              color="error"
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {holiday}
            </Typography>
          )}
          {children}
        </>
      )}
    </TableCell>
  );
};

export default DroppableCell;
