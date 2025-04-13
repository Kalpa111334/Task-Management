import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface TeamMember {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  joinDate: Date;
  status: 'active' | 'inactive';
}

interface EditMemberData {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
}

const Team: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<EditMemberData>({});

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/users');
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleEditClick = (member: TeamMember) => {
    setSelectedMember(member);
    setEditData({
      name: member.name,
      email: member.email,
      department: member.department,
      role: member.role
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedMember) return;

    try {
      await axios.put(`http://localhost:3000/api/users/${selectedMember.id}`, editData);
      await fetchTeamMembers();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;

    try {
      await axios.delete(`http://localhost:3000/api/users/${memberId}`);
      await fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Team Members</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditDialogOpen(true)}
        >
          Add Member
        </Button>
      </Box>

      <Grid container spacing={3}>
        {team.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 56,
                      height: 56,
                      mr: 2,
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{member.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    color={member.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={member.status === 'active' ? 'Active' : 'Inactive'}
                    color={member.status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                  {member.department && (
                    <Chip
                      label={`Department: ${member.department}`}
                      size="small"
                    />
                  )}
                  <Box>
                    {user?.role === 'admin' && (
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(member)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {user?.id !== member.id && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              value={editData.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Department"
              name="department"
              value={editData.department || ''}
              onChange={(e) => setEditData({ ...editData, department: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Role"
              name="role"
              value={editData.role || ''}
              onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={
              !editData.name ||
              !editData.email ||
              !editData.role
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Team; 