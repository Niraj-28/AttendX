import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  TrendingUp,
  Event,
  School,
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const StudentHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch real attendance data
      const response = await attendanceAPI.getByStudent(user.id);
      const { attendance, statistics } = response.data.data;

      // Calculate subject-wise statistics
      const subjectMap = {};
      attendance.forEach((record) => {
        const subjectKey = record.subject_name || 'Unknown Subject';
        
        if (!subjectMap[subjectKey]) {
          subjectMap[subjectKey] = {
            subject: subjectKey,
            total: 0,
            present: 0,
          };
        }
        
        subjectMap[subjectKey].total += 1;
        if (record.status === 'present') {
          subjectMap[subjectKey].present += 1;
        }
      });

      // Convert to array and calculate percentages
      const subjectWiseData = Object.values(subjectMap).map(sub => ({
        ...sub,
        percentage: sub.total > 0 ? (sub.present / sub.total) * 100 : 0,
      }));

      setAttendanceData({
        totalSessions: statistics.total_classes,
        present: statistics.present,
        absent: statistics.absent,
        percentage: parseFloat(statistics.attendance_percentage),
        subjectWise: subjectWiseData,
      });

      // Get recent 10 sessions
      const recentSessionsData = attendance.slice(0, 10).map((record) => ({
        id: record.attendance_id,
        date: new Date(record.session_date),
        subject: record.subject_name || 'Unknown Subject',
        status: record.status,
        confidence: record.confidence_score,
      }));

      setRecentSessions(recentSessionsData);
      
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
      
      // Set empty data on error
      setAttendanceData({
        totalSessions: 0,
        present: 0,
        absent: 0,
        percentage: 0,
        subjectWise: [],
      });
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'present' ? 'success' : 'error';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show empty state if no attendance data
  if (!attendanceData || attendanceData.totalSessions === 0) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          My Attendance
        </Typography>
        <Alert severity="info">
          <Typography variant="body1">
            No attendance records found. Your attendance will appear here once your faculty starts marking attendance.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        My Attendance
      </Typography>

      {/* Warning Alert */}
      {attendanceData.percentage < 75 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Your attendance is below 75%. You need to attend more classes to meet the minimum requirement.
          </Typography>
        </Alert>
      )}

      {/* Overall Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {attendanceData.totalSessions}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Event sx={{ fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Present
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {attendanceData.present}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'success.light',
                    color: 'success.main',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Absent
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {attendanceData.absent}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'error.light',
                    color: 'error.main',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Cancel sx={{ fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Attendance
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {attendanceData.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: `${getAttendanceColor(attendanceData.percentage)}.light`,
                    color: `${getAttendanceColor(attendanceData.percentage)}.main`,
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject-wise Attendance */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Subject-wise Attendance
          </Typography>
          <Grid container spacing={3}>
            {attendanceData.subjectWise.map((subject, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <School sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight="bold">
                      {subject.subject}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      {subject.present} / {subject.total} sessions
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={`${getAttendanceColor(subject.percentage)}.main`}
                    >
                      {subject.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={subject.percentage}
                    color={getAttendanceColor(subject.percentage)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Recent Sessions
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      {format(session.date, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{session.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        size="small"
                        color={getStatusColor(session.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {session.confidence !== null && session.confidence !== undefined
                        ? `${(session.confidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentHome;
