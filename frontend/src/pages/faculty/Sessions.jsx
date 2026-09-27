import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  CloudUpload,
  StopCircle,
  CheckCircle,
  Cancel,
  Image as ImageIcon,
  Search,
} from '@mui/icons-material';
import { sessionAPI, attendanceAPI, subjectAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { compressAttendancePhoto } from '../../utils/imageCompressor';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openStartDialog, setOpenStartDialog] = useState(false);
  const [openCaptureDialog, setOpenCaptureDialog] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subjects, setSubjects] = useState([]);
  
  // Filters for sessions list
  const [streamFilter, setStreamFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    stream: '',
    semester: '',
    class: ''
  });
  
  // Form state for starting session
  const [formData, setFormData] = useState({
    subject_id: '',
    stream: '',
    semester: '',
    class: '',
    session_type: 'lecture',
  });

  useEffect(() => {
    fetchSessions();
    checkActiveSession();
    fetchSubjects();
  }, [appliedFilters]);

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getAll();
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
      setSubjects([]);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      stream: streamFilter,
      semester: semesterFilter,
      class: classFilter
    });
  };

  const handleClearFilters = () => {
    setStreamFilter('');
    setSemesterFilter('');
    setClassFilter('');
    setAppliedFilters({
      stream: '',
      semester: '',
      class: ''
    });
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (appliedFilters.stream) params.stream = appliedFilters.stream;
      if (appliedFilters.semester) params.semester = appliedFilters.semester;
      if (appliedFilters.class) params.class = appliedFilters.class;
      
      const response = await sessionAPI.getAll(params);
      setSessions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await sessionAPI.getActive();
      if (response.data.data && response.data.data.length > 0) {
        setActiveSession(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      await sessionAPI.start(formData);
      toast.success('Session started successfully');
      setOpenStartDialog(false);
      setFormData({ subject_id: '', stream: '', semester: '', class: '', session_type: 'lecture' });
      fetchSessions();
      checkActiveSession();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to stop this session?')) {
      return;
    }
    
    try {
      setLoading(true);
      await sessionAPI.stop(sessionId);
      toast.success('Session stopped successfully');
      setActiveSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop session');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check original file size
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }

      try {
        // Show loading toast
        const loadingToast = toast.info('Compressing image...', { autoClose: false });
        
        // Compress image for attendance (larger, better quality for multiple faces)
        const compressedFile = await compressAttendancePhoto(file);
        const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
        
        // Close loading toast
        toast.dismiss(loadingToast);
        
        // Show success message with size reduction
        if (compressedFile.size < file.size) {
          toast.success(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
        }
        
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Image compression error:', error);
        toast.error('Failed to process image. Using original.');
        // Fallback to original file if compression fails
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCaptureAttendance = async () => {
    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }
    
    try {
      setLoading(true);
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('session_id', activeSession.session_id);
      
      setUploadProgress(30);
      await attendanceAPI.capture(formData);
      
      setUploadProgress(100);
      toast.success('Attendance marked successfully!');
      setOpenCaptureDialog(false);
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      fetchSessions();
      checkActiveSession();
    } catch (error) {
      console.error('Error capturing attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to capture attendance');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenStartDialog(true)}
          disabled={activeSession !== null}
        >
          Start Session
        </Button>
      </Box>

      {/* Active Session Card */}
      {activeSession && (
        <Card sx={{ mb: 3, bgcolor: 'success.lighter', borderLeft: 4, borderColor: 'success.main' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight="bold" color="success.dark">
                  Active Session
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Subject: {activeSession.subject_name || 'N/A'} | Class: {activeSession.class}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Started: {format(new Date(activeSession.session_date), 'MMM dd, yyyy HH:mm')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" display="inline">
                    Present: <strong>{activeSession.present_count}</strong> / {activeSession.total_students}
                  </Typography>
                  <Typography variant="body2" display="inline" sx={{ ml: 3 }}>
                    Attendance: <strong>
                      {activeSession.total_students > 0
                        ? ((activeSession.present_count / activeSession.total_students) * 100).toFixed(1)
                        : 0}%
                    </strong>
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUpload />}
                  onClick={() => setOpenCaptureDialog(true)}
                >
                  Upload Image
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopCircle />}
                  onClick={() => handleStopSession(activeSession.session_id)}
                >
                  Stop Session
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Sessions Table */}
      <Card>
        <CardContent>
          {/* Filters */}
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Stream"
                  value={streamFilter}
                  onChange={(e) => setStreamFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Streams</MenuItem>
                  <MenuItem value="MCA">MCA</MenuItem>
                  <MenuItem value="B.Tech CSE">B.Tech CSE</MenuItem>
                  <MenuItem value="B.Tech AI/ML">B.Tech AI/ML</MenuItem>
                  <MenuItem value="B.Tech Data Science">B.Tech Data Science</MenuItem>
                  <MenuItem value="B.Tech EC">B.Tech EC</MenuItem>
                  <MenuItem value="M.Tech CSE">M.Tech CSE</MenuItem>
                  <MenuItem value="M.Tech Cyber Security">M.Tech Cyber Security</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Semester"
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Semesters</MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      Semester {sem}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Class"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Classes</MenuItem>
                  <MenuItem value="A">Class A</MenuItem>
                  <MenuItem value="B">Class B</MenuItem>
                  <MenuItem value="C">Class C</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box display="flex" gap={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleApplyFilters}
                    startIcon={<Search />}
                    size="small"
                  >
                    Filter
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<Cancel />}
                    size="small"
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {loading && sessions.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No sessions yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => setOpenStartDialog(true)}
              >
                Start First Session
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Stream</TableCell>
                    <TableCell>Semester</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Present</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Attendance %</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.session_id} hover>
                      <TableCell>
                        {format(new Date(session.session_date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{session.subject_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={session.stream || 'N/A'} size="small" color="secondary" />
                      </TableCell>
                      <TableCell>{session.semester || 'N/A'}</TableCell>
                      <TableCell>{session.class}</TableCell>
                      <TableCell>
                        <Chip label={session.session_type} size="small" variant="outlined" />
                      </TableCell>
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
                          color={getStatusColor(session.status)}
                          icon={getStatusIcon(session.status)}
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

      {/* Start Session Dialog */}
      <Dialog open={openStartDialog} onClose={() => setOpenStartDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Subject"
                value={formData.subject_id}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id: e.target.value })
                }
                required
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Stream"
                value={formData.stream}
                onChange={(e) =>
                  setFormData({ ...formData, stream: e.target.value })
                }
                required
              >
                <MenuItem value="MCA">MCA</MenuItem>
                <MenuItem value="B.Tech CSE">B.Tech CSE</MenuItem>
                <MenuItem value="B.Tech AI/ML">B.Tech AI/ML</MenuItem>
                <MenuItem value="B.Tech Data Science">B.Tech Data Science</MenuItem>
                <MenuItem value="B.Tech EC">B.Tech EC</MenuItem>
                <MenuItem value="M.Tech CSE">M.Tech CSE</MenuItem>
                <MenuItem value="M.Tech Cyber Security">M.Tech Cyber Security</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Semester"
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Class"
                value={formData.class}
                onChange={(e) =>
                  setFormData({ ...formData, class: e.target.value })
                }
                required
              >
                <MenuItem value="A">Class A</MenuItem>
                <MenuItem value="B">Class B</MenuItem>
                <MenuItem value="C">Class C</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Session Type"
                value={formData.session_type}
                onChange={(e) =>
                  setFormData({ ...formData, session_type: e.target.value })
                }
                required
              >
                <MenuItem value="lecture">Lecture</MenuItem>
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="tutorial">Tutorial</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenStartDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStartSession}
            disabled={loading || !formData.subject_id || !formData.stream || !formData.semester || !formData.class}
          >
            {loading ? <CircularProgress size={24} /> : 'Start Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Capture Attendance Dialog */}
      <Dialog open={openCaptureDialog} onClose={() => setOpenCaptureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Capture Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload a classroom image to automatically detect and mark attendance.
            </Alert>
            
            {imagePreview ? (
              <Box textAlign="center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ mt: 2 }}
                >
                  Change Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              </Box>
            ) : (
              <Box
                textAlign="center"
                sx={{
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 4,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  size="large"
                >
                  Select Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  Max 10MB, JPG or PNG
                </Typography>
              </Box>
            )}
            
            {uploadProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Processing... {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCaptureDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCaptureAttendance}
            disabled={loading || !imageFile}
          >
            {loading ? <CircularProgress size={24} /> : 'Capture Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions;
