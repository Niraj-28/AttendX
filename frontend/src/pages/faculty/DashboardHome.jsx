import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  People,
  EventNote,
  CheckCircle,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import { attendanceAPI, sessionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data
      const [sessionsRes, activeSessRes] = await Promise.all([
        sessionAPI.getAll({ limit: 5 }),
        sessionAPI.getActive()
      ]);
      
      const sessions = sessionsRes.data.data || [];
      const activeSessions = activeSessRes.data.data || [];
      
      // Calculate real statistics from sessions
      const totalSessions = sessions.length;
      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.session_date);
        const today = new Date();
        return sessionDate.toDateString() === today.toDateString();
      }).length;
      
      // Calculate average attendance
      const sessionsWithAttendance = sessions.filter(s => s.total_students > 0);
      const avgAttendance = sessionsWithAttendance.length > 0
        ? sessionsWithAttendance.reduce((sum, s) => 
            sum + (s.present_count / s.total_students) * 100, 0) / sessionsWithAttendance.length
        : 0;
      
      // Get unique students count (approximation from sessions)
      const totalStudents = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.total_students || 0))
        : 0;
      
      setStats({
        totalStudents: totalStudents,
        todaySessions: todaySessions,
        activeSession: activeSessions.length,
        avgAttendance: Math.round(avgAttendance),
      });
      
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set default values on error
      setStats({
        totalStudents: 0,
        todaySessions: 0,
        activeSession: 0,
        avgAttendance: 0,
      });
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/faculty/sessions')}
        >
          Start Session
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={People}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sessions"
            value={stats?.todaySessions || 0}
            icon={EventNote}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats?.activeSession || 0}
            icon={CheckCircle}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Attendance"
            value={`${stats?.avgAttendance || 0}%`}
            icon={TrendingUp}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Recent Sessions */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Recent Sessions
            </Typography>
            <Button size="small" onClick={() => navigate('/faculty/sessions')}>
              View All
            </Button>
          </Box>

          {recentSessions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No sessions yet. Start your first session!
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/faculty/sessions')}
              >
                Start Session
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="center">Present</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Attendance %</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSessions.map((session) => (
                    <TableRow key={session.session_id} hover>
                      <TableCell>
                        {format(new Date(session.session_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{session.subject_name || 'N/A'}</TableCell>
                      <TableCell>{session.class}</TableCell>
                      <TableCell align="center">{session.present_count}</TableCell>
                      <TableCell align="center">{session.total_students}</TableCell>
                      <TableCell align="center">
                        <Typography
                          color={
                            (session.present_count / session.total_students) * 100 >= 75
                              ? 'success.main'
                              : 'warning.main'
                          }
                          fontWeight="bold"
                        >
                          {session.total_students > 0
                            ? ((session.present_count / session.total_students) * 100).toFixed(1)
                            : 0}
                          %
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.status}
                          size="small"
                          color={
                            session.status === 'active'
                              ? 'success'
                              : session.status === 'completed'
                              ? 'primary'
                              : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardHome;
