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
  Paper,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  CalendarToday,
  Download,
  FilterList,
  TrendingUp,
  School,
  EventNote,
  ViewWeek,
  DateRange,
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getByStudent(user.id);
      const { attendance, statistics: stats } = response.data.data;

      setAttendanceData(attendance);
      setStatistics(stats);

      // Extract unique subjects
      const uniqueSubjects = [...new Set(attendance.map(a => a.subject_name).filter(Boolean))];
      setSubjects(uniqueSubjects);

    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
      setAttendanceData([]);
      setStatistics({
        total_classes: 0,
        present: 0,
        absent: 0,
        attendance_percentage: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance data
  const getFilteredData = () => {
    let filtered = [...attendanceData];

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(a => a.subject_name === selectedSubject);
    }

    if (startDate) {
      filtered = filtered.filter(a => new Date(a.session_date) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter(a => new Date(a.session_date) <= new Date(endDate));
    }

    return filtered;
  };

  // Calculate subject-wise statistics
  const getSubjectWiseStats = () => {
    const filtered = getFilteredData();
    const subjectMap = {};

    filtered.forEach(record => {
      const subject = record.subject_name || 'Unknown Subject';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, present: 0, absent: 0 };
      }
      subjectMap[subject].total++;
      if (record.status === 'present') {
        subjectMap[subject].present++;
      } else {
        subjectMap[subject].absent++;
      }
    });

    return Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      ...stats,
      percentage: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
    }));
  };

  // Calculate day-wise statistics (Monday, Tuesday, etc.)
  const getDayWiseStats = () => {
    const filtered = getFilteredData();
    const dayMap = {
      0: { day: 'Sunday', total: 0, present: 0 },
      1: { day: 'Monday', total: 0, present: 0 },
      2: { day: 'Tuesday', total: 0, present: 0 },
      3: { day: 'Wednesday', total: 0, present: 0 },
      4: { day: 'Thursday', total: 0, present: 0 },
      5: { day: 'Friday', total: 0, present: 0 },
      6: { day: 'Saturday', total: 0, present: 0 },
    };

    filtered.forEach(record => {
      const dayOfWeek = new Date(record.session_date).getDay();
      dayMap[dayOfWeek].total++;
      if (record.status === 'present') {
        dayMap[dayOfWeek].present++;
      }
    });

    return Object.values(dayMap).map(day => ({
      ...day,
      absent: day.total - day.present,
      percentage: day.total > 0 ? (day.present / day.total) * 100 : 0,
    }));
  };

  // Get date-wise attendance (for calendar/list view)
  const getDateWiseData = () => {
    const filtered = getFilteredData();
    
    // Group by date
    const dateMap = {};
    filtered.forEach(record => {
      try {
        const date = format(parseISO(record.session_date), 'yyyy-MM-dd');
        if (!dateMap[date]) {
          dateMap[date] = [];
        }
        dateMap[date].push(record);
      } catch (error) {
        console.error('Error parsing date:', error, record);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(dateMap)
      .map(([date, records]) => ({
        date,
        records,
        presentCount: records.filter(r => r.status === 'present').length,
        absentCount: records.filter(r => r.status === 'absent').length,
        total: records.length,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    const filtered = getFilteredData();
    
    // Create CSV content
    const headers = ['Date', 'Subject', 'Subject Code', 'Status', 'Confidence Score'];
    const rows = filtered.map(record => [
      format(parseISO(record.session_date), 'dd/MM/yyyy'),
      record.subject_name || 'N/A',
      record.subject_code || 'N/A',
      record.status,
      record.confidence_score ? (record.confidence_score * 100).toFixed(2) + '%' : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${user.roll_no}_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Attendance report downloaded');
  };

  const getStatusColor = (status) => {
    return status === 'present' ? 'success' : 'error';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const clearFilters = () => {
    setSelectedSubject('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Attendance Records
        </Typography>
        <Alert severity="info">
          <Typography variant="body1">
            No attendance records found. Your attendance will appear here once your faculty starts marking attendance.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const filteredData = getFilteredData();
  const filteredStats = {
    total: filteredData.length,
    present: filteredData.filter(a => a.status === 'present').length,
    absent: filteredData.filter(a => a.status === 'absent').length,
  };
  filteredStats.percentage = filteredStats.total > 0 
    ? (filteredStats.present / filteredStats.total) * 100 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Attendance Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
          disabled={filteredData.length === 0}
        >
          Export Report
        </Button>
      </Box>

      {/* Warning Alert */}
      {filteredStats.percentage < 75 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Your attendance is {filteredStats.percentage.toFixed(1)}% (below 75% requirement).
          </Typography>
        </Alert>
      )}

      {/* Overall Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Classes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {filteredStats.total}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.main', p: 1.5, borderRadius: 2 }}>
                  <EventNote />
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
                  <Typography color="text.secondary" variant="body2">
                    Present
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {filteredStats.present}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'success.light', color: 'success.main', p: 1.5, borderRadius: 2 }}>
                  <CheckCircle />
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
                  <Typography color="text.secondary" variant="body2">
                    Absent
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {filteredStats.absent}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'error.light', color: 'error.main', p: 1.5, borderRadius: 2 }}>
                  <Cancel />
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
                  <Typography color="text.secondary" variant="body2">
                    Percentage
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    color={`${getAttendanceColor(filteredStats.percentage)}.main`}
                  >
                    {filteredStats.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    bgcolor: `${getAttendanceColor(filteredStats.percentage)}.light`, 
                    color: `${getAttendanceColor(filteredStats.percentage)}.main`, 
                    p: 1.5, 
                    borderRadius: 2 
                  }}
                >
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '40px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<School />} label="Subject-wise" iconPosition="start" />
            <Tab icon={<CalendarToday />} label="Date-wise" iconPosition="start" />
            <Tab icon={<ViewWeek />} label="Day-wise" iconPosition="start" />
            <Tab icon={<DateRange />} label="All Records" iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Subject-wise View */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Subject-wise Attendance
              </Typography>
              {getSubjectWiseStats().length === 0 ? (
                <Alert severity="info">No data available for the selected filters.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {getSubjectWiseStats().map((subject, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <School sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {subject.subject}
                          </Typography>
                        </Box>
                        <Grid container spacing={2} mb={1}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Total
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {subject.total}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Present
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                              {subject.present}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Absent
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="error.main">
                              {subject.absent}
                            </Typography>
                          </Grid>
                        </Grid>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            Attendance
                          </Typography>
                          <Typography
                            variant="body1"
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
              )}
            </Box>
          )}

          {/* Date-wise View */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Date-wise Attendance
              </Typography>
              {getDateWiseData().length === 0 ? (
                <Alert severity="info">No data available for the selected filters.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Day</TableCell>
                        <TableCell align="center">Total Classes</TableCell>
                        <TableCell align="center">Present</TableCell>
                        <TableCell align="center">Absent</TableCell>
                        <TableCell>Subjects</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDateWiseData().map((dateData, index) => {
                        try {
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {(() => {
                                    try {
                                      return format(parseISO(dateData.date), 'MMM dd, yyyy');
                                    } catch (e) {
                                      return dateData.date;
                                    }
                                  })()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  try {
                                    return format(parseISO(dateData.date), 'EEEE');
                                  } catch (e) {
                                    return 'N/A';
                                  }
                                })()}
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={dateData.total} size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={dateData.presentCount} size="small" color="success" />
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={dateData.absentCount} size="small" color="error" />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {dateData.records.map((record, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={`${record.subject_name || 'Unknown'} - ${record.status}`}
                                      arrow
                                    >
                                      <Chip
                                        label={record.subject_code || record.subject_name?.substring(0, 3) || 'N/A'}
                                        size="small"
                                        color={record.status ? getStatusColor(record.status) : 'default'}
                                        variant="outlined"
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        } catch (error) {
                          console.error('Error rendering date row:', error, dateData);
                          return null;
                        }
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Day-wise View */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Day-wise Attendance (by Weekday)
              </Typography>
              {getDayWiseStats().every(day => day.total === 0) ? (
                <Alert severity="info">No data available for the selected filters.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {getDayWiseStats().map((day, index) => (
                    day.total > 0 && (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {day.day}
                            </Typography>
                          </Box>
                          <Grid container spacing={2} mb={1}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Total
                              </Typography>
                              <Typography variant="h6">{day.total}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Present
                              </Typography>
                              <Typography variant="h6" color="success.main">
                                {day.present}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">
                                Absent
                              </Typography>
                              <Typography variant="h6" color="error.main">
                                {day.absent}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Attendance
                            </Typography>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color={`${getAttendanceColor(day.percentage)}.main`}
                            >
                              {day.percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={day.percentage}
                            color={getAttendanceColor(day.percentage)}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Paper>
                      </Grid>
                    )
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* All Records View */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                All Attendance Records
              </Typography>
              {filteredData.length === 0 ? (
                <Alert severity="info">No data available for the selected filters.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Day</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.map((record, index) => {
                        try {
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                {(() => {
                                  try {
                                    return format(parseISO(record.session_date), 'MMM dd, yyyy');
                                  } catch (e) {
                                    return record.session_date || 'N/A';
                                  }
                                })()}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  try {
                                    return format(parseISO(record.session_date), 'EEE');
                                  } catch (e) {
                                    return 'N/A';
                                  }
                                })()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {record.subject_name || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={record.subject_code || 'N/A'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  try {
                                    if (!record.start_time) return 'N/A';
                                    
                                    // Try parsing as ISO datetime first
                                    let date = new Date(record.start_time);
                                    
                                    // If that doesn't work, try as time string
                                    if (isNaN(date.getTime())) {
                                      date = new Date(`2000-01-01T${record.start_time}`);
                                    }
                                    
                                    if (isNaN(date.getTime())) return 'N/A';
                                    return format(date, 'hh:mm a');
                                  } catch (error) {
                                    return 'N/A';
                                  }
                                })()}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={record.status || 'N/A'}
                                  size="small"
                                  color={record.status ? getStatusColor(record.status) : 'default'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                {record.confidence_score !== null && record.confidence_score !== undefined
                                  ? `${(record.confidence_score * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </TableCell>
                            </TableRow>
                          );
                        } catch (error) {
                          console.error('Error rendering row:', error, record);
                          return null;
                        }
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Attendance;
