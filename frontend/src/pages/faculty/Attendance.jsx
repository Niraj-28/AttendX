import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Grid,
  MenuItem,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FileDownload,
  FilterList,
  Person,
  EventNote,
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('session'); // 'session' or 'student'
  
  // Filters
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    class: '',
    subject_id: '',
    status: '',
  });

  // Mock subjects - in real app, fetch from backend
  const subjects = [
    { id: 1, name: 'Cloud Computing' },
    { id: 2, name: 'Data Structures' },
    { id: 3, name: 'Database Management' },
    { id: 4, name: 'Operating Systems' },
  ];

  useEffect(() => {
    fetchAttendance();
  }, [filters, viewMode]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.class) params.class = filters.class;
      if (filters.subject_id) params.subject_id = filters.subject_id;
      if (filters.status) params.status = filters.status;
      
      const response = await attendanceAPI.getAll(params);
      setAttendanceRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.info(`Exporting attendance as ${format.toUpperCase()}...`);
      // In real app, call API endpoint that returns file
      // const response = await attendanceAPI.export({ ...filters, format });
      // Download file logic here
      setTimeout(() => {
        toast.success('Export completed!');
      }, 1500);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export attendance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Attendance Records
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* View Mode Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="View By"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <MenuItem value="session">By Session</MenuItem>
                <MenuItem value="student">By Student</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="caption" color="text.secondary">
                <FilterList sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Filter attendance records by date, class, subject, and status
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Class"
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                <MenuItem value="A">Class A</MenuItem>
                <MenuItem value="B">Class B</MenuItem>
                <MenuItem value="C">Class C</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Subject"
                value={filters.subject_id}
                onChange={(e) => handleFilterChange('subject_id', e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : attendanceRecords.length === 0 ? (
            <Box textAlign="center" py={4}>
              {viewMode === 'session' ? (
                <EventNote sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              ) : (
                <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              )}
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No attendance records found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or start a new session
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {viewMode === 'session' ? (
                        <>
                          <TableCell>Date</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>Enrollment No</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Confidence</TableCell>
                          <TableCell>Marked At</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>Student Name</TableCell>
                          <TableCell>Enrollment No</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Total Sessions</TableCell>
                          <TableCell>Present</TableCell>
                          <TableCell>Absent</TableCell>
                          <TableCell>Attendance %</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceRecords
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record, index) => (
                        <TableRow key={index} hover>
                          {viewMode === 'session' ? (
                            <>
                              <TableCell>
                                {format(new Date(record.session_date || new Date()), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{record.subject_name || 'N/A'}</TableCell>
                              <TableCell>{record.class}</TableCell>
                              <TableCell>{record.student_name}</TableCell>
                              <TableCell>{record.enrollment_no}</TableCell>
                              <TableCell>
                                <Chip
                                  label={record.status}
                                  size="small"
                                  color={getStatusColor(record.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {record.confidence_score
                                  ? `${(record.confidence_score * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {record.marked_at
                                  ? format(new Date(record.marked_at), 'HH:mm:ss')
                                  : 'N/A'}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{record.student_name}</TableCell>
                              <TableCell>{record.enrollment_no}</TableCell>
                              <TableCell>{record.class}</TableCell>
                              <TableCell>{record.total_sessions || 0}</TableCell>
                              <TableCell>
                                <Typography color="success.main" fontWeight="bold">
                                  {record.present_count || 0}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography color="error.main" fontWeight="bold">
                                  {record.absent_count || 0}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  color={
                                    (record.attendance_percentage || 0) >= 75
                                      ? 'success.main'
                                      : 'warning.main'
                                  }
                                  fontWeight="bold"
                                >
                                  {(record.attendance_percentage || 0).toFixed(1)}%
                                </Typography>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={attendanceRecords.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Attendance;
