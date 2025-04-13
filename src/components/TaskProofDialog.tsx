import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { Task } from '../../backend/src/types';

interface TaskProofDialogProps {
  task: Task | null;
  onClose: () => void;
}

const TaskProofDialog: React.FC<TaskProofDialogProps> = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <Dialog open={!!task} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Task Proof - {task.title}</DialogTitle>
      <DialogContent>
        {task.proofImage ? (
          <Box
            component="img"
            src={`http://localhost:3000${task.proofImage}`}
            alt="Task proof"
            sx={{ width: '100%', height: 'auto' }}
          />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>No proof image available</Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskProofDialog; 