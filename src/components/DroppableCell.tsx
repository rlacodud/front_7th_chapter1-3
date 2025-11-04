import { TableCell, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';

interface DroppableCellProps {
  dateString: string;
  day: number | null;
  holiday?: string;
  onClick: () => void;
  onDrop: (e: React.DragEvent, dateString: string) => void;
  children: ReactNode;
}

const DroppableCell = ({ dateString, day, holiday, onClick, onDrop, children }: DroppableCellProps) => {
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
      }}
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(e) => {
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
            <Typography variant="body2" color="error">
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

