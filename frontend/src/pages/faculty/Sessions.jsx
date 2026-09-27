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
  
  // Form state for starting session with attendance
  const [formData, setFormData] = useState({
    subject_id: '',
    stream: '',
    semester: '',
    class: '',
    session_type: 'lecture',
    session_date: new Date().toISOString().split('T')[0], // Today's date
    start_time: '',
    end_time: '',
  });

  // Filtered data based on selections
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  // Get available semesters based on selected stream
  const getAvailableSemesters = (stream) => {
    // MCA: 2 years (4 semesters)
    // B.Tech: 4 years (8 semesters)
    // M.Tech: 2 years (4 semesters)
    if (stream === 'MCA' || stream.includes('M.Tech')) {
      return [1, 2, 3, 4];
    } else if (stream.includes('B.Tech')) {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
    return [1, 2, 3, 4, 5, 6, 7, 8]; // Default all semesters
  };

  // Handle stream change - reset dependent fields
  const handleStreamChange = (newStream) => {
    setFormData({
      ...formData,
      stream: newStream,
      semester: '', // Reset semester
      subject_id: '', // Reset subject
      class: newStream ? '' : '', // Reset class
    });
    setFilteredSubjects([]); // Clear filtered subjects
  };

  // Handle semester change - filter subjects
  const handleSemesterChange = (newSemester) => {
    setFormData({
      ...formData,
      semester: newSemester,
      subject_id: '', // Reset subject when semester changes
    });
    
    // Filter subjects based on stream and semester
    if (formData.stream && newSemester) {
      console.log('Filtering subjects for:', { stream: formData.stream, semester: newSemester });
      console.log('All subjects:', subjects);
      
      const filtered = subjects.filter(
        (subject) => {
          const streamMatch = subject.stream === formData.stream;
          const semesterMatch = subject.semester === parseInt(newSemester);
          console.log(`Subject ${subject.subject_name}: stream=${subject.stream} (match: ${streamMatch}), semester=${subject.semester} (match: ${semesterMatch})`);
          return streamMatch && semesterMatch;
        }
      );
      
      console.log('Filtered subjects:', filtered);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
  };

  // Handle session type change - set class accordingly
  const handleSessionTypeChange = (newType) => {
    setFormData({
      ...formData,
      session_type: newType,
      class: newType === 'lecture' ? 'ALL' : '', // Auto-set to ALL for lecture, empty for lab/tutorial
    });
  };

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
      const errorMessage = error.response?.data?.message || 'Unable to load subjects list';
      toast.error(errorMessage);
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
      const errorMessage = error.response?.data?.message || error.message || 'Unable to load sessions. Please check your connection and try again.';
      toast.error(errorMessage);
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
    console.log('=== START SESSION CLICKED ===');
    console.log('imageFile:', imageFile);
    console.log('imageFile type:', imageFile ? imageFile.type : 'null');
    console.log('imageFile size:', imageFile ? imageFile.size : 'null');
    console.log('formData:', formData);
    
    if (!imageFile) {
      toast.error('Please upload a classroom image to capture attendance');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Please specify session start time and end time');
      return;
    }

    // Validate end time is after start time
    if (formData.start_time >= formData.end_time) {
      toast.error('Session end time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for multipart upload
      const data = new FormData();
      data.append('subject_id', formData.subject_id);
      data.append('stream', formData.stream);
      data.append('semester', formData.semester);
      data.append('class', formData.class || 'ALL'); // Ensure class is always set
      data.append('session_type', formData.session_type);
      data.append('session_date', formData.session_date);
      data.append('start_time', formData.start_time);
      data.append('end_time', formData.end_time);
      data.append('image', imageFile);

      console.log('=== SENDING TO API ===');
      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      await sessionAPI.start(data);
      toast.success('Session started and attendance captured successfully!');
      setOpenStartDialog(false);
      setFormData({ 
        subject_id: '', 
        stream: '', 
        semester: '', 
        class: '', 
        session_type: 'lecture',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
      });
      setImageFile(null);
      setImagePreview(null);
      fetchSessions();
      checkActiveSession();
    } catch (error) {
      console.error('Error starting session:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Unable to start session. Please check all fields and try again.';
      toast.error(errorMessage);
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
      const errorMessage = error.response?.data?.message || 'Unable to stop session. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    console.log('=== IMAGE SELECTED ===');
    console.log('File:', file);
    console.log('File name:', file?.name);
    console.log('File size:', file?.size);
    console.log('File type:', file?.type);
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file size must be less than 10MB. Please select a smaller image.');
        return;
      }

      try {
        // Compress image silently (no notification)
        console.log('Starting compression...');
        const compressedFile = await compressAttendancePhoto(file);
        console.log('Compression complete:', {
          originalSize: file.size,
          compressedSize: compressedFile.size,
          name: compressedFile.name,
          type: compressedFile.type
        });
        
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        console.log('imageFile state updated');
      } catch (error) {
        console.error('Image compression error:', error);
        toast.error('Failed to process image. Please try a different image or reduce its size.');
        // Fallback to original file if compression fails
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
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
              <Box>
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
      <Dialog open={openStartDialog} onClose={() => setOpenStartDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Start New Session & Capture Attendance</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Fill in session details, select the session date and timings, then upload a classroom image to automatically mark attendance.
          </Alert>
          
          <Grid container spacing={2}>
            {/* Step 1: Stream Selection */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Stream"
                value={formData.stream}
                onChange={(e) => handleStreamChange(e.target.value)}
                required
                helperText="Step 1: Select your stream first"
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

            {/* Step 2: Semester Selection (enabled after stream) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Semester"
                value={formData.semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                required
                disabled={!formData.stream}
                helperText={!formData.stream ? "Select stream first" : "Step 2: Select semester"}
              >
                {formData.stream && getAvailableSemesters(formData.stream).map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Step 3: Subject Selection (enabled after semester) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Subject"
                value={formData.subject_id}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id: e.target.value })
                }
                required
                disabled={!formData.semester || filteredSubjects.length === 0}
                helperText={!formData.semester ? "Select semester first" : filteredSubjects.length === 0 ? "No subjects available" : "Step 3: Select subject"}
              >
                {filteredSubjects.map((subject) => (
                  <MenuItem key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name} ({subject.subject_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Step 4: Session Type Selection */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Session Type"
                value={formData.session_type}
                onChange={(e) => handleSessionTypeChange(e.target.value)}
                required
                disabled={!formData.subject_id}
                helperText={!formData.subject_id ? "Select subject first" : "Step 4: Lecture (all classes) or Lab (specific class)"}
              >
                <MenuItem value="lecture">Lecture (All Classes Together)</MenuItem>
                <MenuItem value="lab">Lab (Individual Class)</MenuItem>
                <MenuItem value="tutorial">Tutorial (Individual Class)</MenuItem>
              </TextField>
            </Grid>

            {/* Step 5: Class Selection (only for Lab/Tutorial) */}
            {formData.session_type !== 'lecture' && (
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
                  helperText="Select which class for this lab/tutorial"
                >
                  <MenuItem value="A">Class A</MenuItem>
                  <MenuItem value="B">Class B</MenuItem>
                  <MenuItem value="C">Class C</MenuItem>
                </TextField>
              </Grid>
            )}

            {formData.session_type === 'lecture' && (
              <Grid item xs={12} sm={6}>
                <Alert severity="success" icon={<CheckCircle />}>
                  All classes (A, B, C) will be combined
                </Alert>
              </Grid>
            )}

            {/* Session Date */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Session Date"
                value={formData.session_date}
                onChange={(e) =>
                  setFormData({ ...formData, session_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Session Start and End Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Session Start Time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
                helperText="When the session started"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Session End Time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
                helperText="When the session ended"
              />
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Upload Classroom Image
              </Typography>
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
                    Select Classroom Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Max 10MB, JPG or PNG • Image will be used to automatically detect and mark attendance
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setOpenStartDialog(false);
            setImageFile(null);
            setImagePreview(null);
          }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStartSession}
            disabled={
              loading || 
              !formData.subject_id || 
              !formData.stream || 
              !formData.semester || 
              (formData.session_type !== 'lecture' && !formData.class) || // Class required only for lab/tutorial
              !formData.start_time || 
              !formData.end_time || 
              !imageFile
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Start Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions;
