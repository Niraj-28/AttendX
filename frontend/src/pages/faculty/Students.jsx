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
  TablePagination,
  IconButton,
  Avatar,
  Chip,
  Typography,
  Grid,
  InputAdornment,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  CloudUpload,
  Person,
  Cancel,
  Close,
  ZoomIn,
} from '@mui/icons-material';
import { studentAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Helper function to get full image URL
const getImageUrl = (photoUrl) => {
  if (!photoUrl) return null;
  
  // If it's already a full URL (S3), return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // For local storage, prepend the backend URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001';
  return `${baseUrl}${photoUrl}`;
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Image preview
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewStudentName, setPreviewStudentName] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  
  // Applied filters (actual filters used for API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    stream: '',
    class: '',
    semester: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    roll_no: '',
    name: '',
    email: '',
    stream: '',
    class: '',
    semester: '',
    department: 'Computer Science',
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.stream) params.stream = appliedFilters.stream;
      if (appliedFilters.class) params.class = appliedFilters.class;
      if (appliedFilters.semester) params.semester = appliedFilters.semester;
      
      console.log('=== FETCHING STUDENTS ===');
      console.log('API params:', params);
      
      const response = await studentAPI.getAll(params);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Students received:', response.data.data?.length);
      console.log('Students array:', response.data.data);
      setStudents(response.data.data || []);
      console.log('State updated with students');
    } catch (error) {
      console.error('=== ERROR FETCHING STUDENTS ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
      console.log('=== FETCH COMPLETE ===');
    }
  };

  useEffect(() => {
    console.log('=== useEffect TRIGGERED ===');
    console.log('appliedFilters changed:', appliedFilters);
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const handleApplyFilters = () => {
    console.log('=== APPLYING FILTERS ===');
    console.log('streamFilter:', streamFilter);
    console.log('semesterFilter:', semesterFilter);
    console.log('classFilter:', classFilter);
    
    const newFilters = {
      search: searchTerm,
      stream: streamFilter,
      class: classFilter,
      semester: semesterFilter
    };
    
    console.log('New filters:', newFilters);
    setAppliedFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStreamFilter('');
    setClassFilter('');
    setSemesterFilter('');
    setAppliedFilters({
      search: '',
      stream: '',
      class: '',
      semester: ''
    });
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditMode(true);
      setSelectedStudent(student);
      setFormData({
        roll_no: student.roll_no,
        name: student.name,
        email: student.email,
        stream: student.stream,
        class: student.class,
        semester: student.semester,
        department: student.department,
      });
      // Don't set photoPreview here - we'll use student.photo_url directly in the Avatar
      setPhotoPreview(null);
    } else {
      setEditMode(false);
      setSelectedStudent(null);
      setFormData({
        roll_no: '',
        name: '',
        email: '',
        stream: '',
        class: '',
        semester: '',
        department: 'Computer Science',
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (photoFile) {
        data.append('photo', photoFile);
      }

      if (editMode) {
        await studentAPI.update(selectedStudent.student_id, data);
        toast.success('Student updated successfully');
      } else {
        await studentAPI.create(data);
        toast.success('Student added successfully');
      }
      
      handleCloseDialog();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      setLoading(true);
      await studentAPI.delete(studentId);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleImageClick = (student) => {
    if (student.photo_url) {
      const fullImageUrl = getImageUrl(student.photo_url);
      console.log('Opening image preview:', {
        photo_url: student.photo_url,
        fullImageUrl: fullImageUrl,
        studentName: student.name
      });
      setPreviewImage(fullImageUrl); // Store the full URL directly
      setPreviewStudentName(student.name);
      setImagePreviewOpen(true);
    }
  };

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false);
    setPreviewImage(null);
    setPreviewStudentName('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Students
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Student
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent>
          {loading && students.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No students found
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => handleOpenDialog()}
              >
                Add First Student
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Photo</TableCell>
                      <TableCell>Roll No</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Stream</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => (
                        <TableRow key={student.student_id} hover>
                          <TableCell>
                            <Avatar
                              src={getImageUrl(student.photo_url)}
                              alt={student.name}
                              sx={{ 
                                width: 48, 
                                height: 48,
                                cursor: student.photo_url ? 'pointer' : 'default',
                                border: student.photo_url ? '2px solid' : 'none',
                                borderColor: 'primary.light',
                                '&:hover': student.photo_url ? {
                                  opacity: 0.8,
                                  transform: 'scale(1.05)',
                                  transition: 'all 0.2s',
                                  boxShadow: 3,
                                } : {},
                                position: 'relative',
                              }}
                              onClick={() => handleImageClick(student)}
                            >
                              {!student.photo_url && student.name.charAt(0)}
                            </Avatar>
                            {student.photo_url && (
                              <ZoomIn 
                                sx={{ 
                                  fontSize: 12, 
                                  position: 'absolute', 
                                  mt: -2,
                                  ml: 3,
                                  color: 'primary.main',
                                  bgcolor: 'white',
                                  borderRadius: '50%',
                                  p: 0.2
                                }} 
                              />
                            )}
                          </TableCell>
                          <TableCell>{student.roll_no}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Chip label={student.stream || 'N/A'} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{student.semester}</TableCell>
                          <TableCell>
                            <Chip label={student.class} size="small" />
                          </TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(student)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(student.student_id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={students.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box textAlign="center" mb={2}>
                <Avatar
                  src={photoPreview ? photoPreview : getImageUrl(selectedStudent?.photo_url)}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '3px solid', borderColor: 'primary.light' }}
                >
                  {formData.name ? formData.name.charAt(0) : <Person sx={{ fontSize: 60 }} />}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  size="small"
                >
                  {photoPreview || selectedStudent?.photo_url ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Max 5MB • JPG, PNG • Single face required
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enrollment Number"
                value={formData.roll_no}
                onChange={(e) =>
                  setFormData({ ...formData, roll_no: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
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
                    {sem}
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
                label="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.roll_no || !formData.email}
          >
            {loading ? <CircularProgress size={24} /> : editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog 
        open={imagePreviewOpen} 
        onClose={handleCloseImagePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 24,
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Person sx={{ color: 'primary.main' }} />
              <Typography variant="h6">{previewStudentName}</Typography>
            </Box>
            <IconButton
              onClick={handleCloseImagePreview}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#000', p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 500,
              maxHeight: '70vh',
            }}
          >
            {previewImage ? (
              <Box>
                <img
                  src={previewImage} // Now using the full URL directly
                  alt={previewStudentName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    console.error('Attempted URL:', previewImage);
                    e.target.onerror = null;
                    e.target.alt = `Failed to load image from: ${previewImage}`;
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', previewImage);
                  }}
                />
                {/* Debug info */}
                <Typography variant="caption" color="grey.500" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  URL: {previewImage}
                </Typography>
              </Box>
            ) : (
              <Box textAlign="center">
                <Person sx={{ fontSize: 80, color: 'grey.600', mb: 2 }} />
                <Typography variant="body1" color="grey.400">
                  No image available
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'rgba(0,0,0,0.9)', borderTop: '1px solid rgba(255,255,255,0.1)', px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseImagePreview} 
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Students;
