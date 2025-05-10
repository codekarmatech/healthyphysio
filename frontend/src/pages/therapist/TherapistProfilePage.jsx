import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import therapistService from '../../services/therapistService';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  Paper,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * Therapist Profile Page
 * Allows therapists to view and edit their profile information
 * Changes require admin approval
 */
const TherapistProfilePage = () => {
  const { user, therapistProfile, fetchTherapistProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [changeRequests, setChangeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch therapist profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Try to use the profile from auth context first
        if (therapistProfile) {
          console.log('Using therapist profile from context:', therapistProfile);
          setProfile(therapistProfile);
          setFormData(therapistProfile);
          setLoading(false);
          return;
        }

        // If user exists but no therapist profile, try to fetch it
        if (user && user.id) {
          console.log('Fetching therapist profile for user ID:', user.id);
          try {
            // Try to fetch the profile using the fetchTherapistProfile function from AuthContext
            const fetchedProfile = await fetchTherapistProfile(user.id);
            if (fetchedProfile) {
              console.log('Successfully fetched therapist profile:', fetchedProfile);
              setProfile(fetchedProfile);
              setFormData(fetchedProfile);
              setLoading(false);
              return;
            }
          } catch (fetchError) {
            console.error('Error fetching profile from AuthContext:', fetchError);
          }
        }

        // As a last resort, try the therapistService
        console.log('Trying to fetch profile using therapistService');
        const response = await therapistService.getCurrentProfile();
        console.log('Profile response from service:', response.data);
        setProfile(response.data);
        setFormData(response.data);
      } catch (err) {
        console.error('Error fetching therapist profile:', err);
        setError('Failed to load profile. Please try again later.');
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [therapistProfile, user, fetchTherapistProfile]);

  // Fetch change requests
  useEffect(() => {
    const fetchChangeRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await therapistService.getChangeRequests();
        setChangeRequests(response.data);
      } catch (err) {
        console.error('Error fetching change requests:', err);
        toast.error('Failed to load change requests');
      } finally {
        setLoadingRequests(false);
      }
    };

    if (user?.role === 'therapist') {
      fetchChangeRequests();
    }
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare data for submission
      const updateData = {};

      // Only include fields that have changed
      Object.keys(formData).forEach(key => {
        if (formData[key] !== profile[key] && key !== 'user' && key !== 'id') {
          updateData[key] = formData[key];
        }
      });

      // If nothing changed, just exit edit mode
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      // Submit the update request
      await therapistService.updateProfile(updateData);

      toast.success('Profile update request submitted for approval');
      setIsEditing(false);

      // Refresh change requests
      const requestsResponse = await therapistService.getChangeRequests();
      setChangeRequests(requestsResponse.data);

    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    }
  };

  // Handle delete request
  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    try {
      // Create a special change request for deletion
      await therapistService.requestDeletion(deleteReason);

      toast.success('Profile deletion request submitted for approval');
      setDeleteDialogOpen(false);
      setDeleteReason('');

      // Refresh change requests
      const requestsResponse = await therapistService.getChangeRequests();
      setChangeRequests(requestsResponse.data);

    } catch (err) {
      console.error('Error requesting profile deletion:', err);
      toast.error('Failed to submit deletion request');
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">{error}</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Therapist Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Profile Information</Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box>
                    <Button
                      startIcon={<CloseIcon />}
                      variant="outlined"
                      color="error"
                      onClick={handleCancel}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<CheckIcon />}
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        fullWidth
                        label="License Number"
                        name="license_number"
                        value={formData.license_number || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        fullWidth
                        label="Specialization"
                        name="specialization"
                        value={formData.specialization || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        fullWidth
                        label="Years of Experience"
                        name="years_of_experience"
                        type="number"
                        value={formData.years_of_experience || 0}
                        onChange={(e) => {
                          // Ensure value is not negative
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          handleChange({
                            target: {
                              name: 'years_of_experience',
                              value
                            }
                          });
                        }}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        fullWidth
                        label="Experience"
                        name="experience"
                        value={formData.experience || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        fullWidth
                        label="Residential Address"
                        name="residential_address"
                        value={formData.residential_address || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        fullWidth
                        label="Preferred Areas"
                        name="preferred_areas"
                        value={formData.preferred_areas || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        helperText="Enter comma-separated areas where you prefer to work"
                      />
                    </Grid>
                  </Grid>
                </form>
              ) : (
                <Grid container spacing={2}>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">
                      {profile?.user?.first_name} {profile?.user?.last_name}
                    </Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{profile?.user?.email}</Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{profile?.user?.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
                    <Typography variant="body1">{profile?.license_number || 'Not provided'}</Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">Specialization</Typography>
                    <Typography variant="body1">{profile?.specialization || 'Not provided'}</Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">Years of Experience</Typography>
                    <Typography variant="body1">{profile?.years_of_experience || 0}</Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {profile?.experience || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">Residential Address</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {profile?.residential_address || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">Preferred Areas</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile?.preferred_areas ?
                        profile.preferred_areas.split(',').map((area, index) => (
                          <Chip key={index} label={area.trim()} size="small" />
                        )) :
                        <Typography variant="body2" color="text.secondary">No preferred areas specified</Typography>
                      }
                    </Box>
                  </Grid>
                  <Grid sx={{ gridColumn: 'span 12' }}>
                    <Typography variant="subtitle2" color="text.secondary">Approval Status</Typography>
                    <Chip
                      label={profile?.is_approved ? 'Approved' : 'Pending Approval'}
                      color={profile?.is_approved ? 'success' : 'warning'}
                      size="small"
                    />
                    {profile?.approval_date && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Approved on: {format(new Date(profile.approval_date), 'PPP')}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Delete Profile Request */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2 }}>
                Requesting to delete your profile will create a request for admin approval.
                Your account will remain active until an administrator approves the deletion.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Request Profile Deletion
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Requests */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loadingRequests ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : changeRequests.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {changeRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              color={
                                request.status === 'approved' ? 'success' :
                                request.status === 'rejected' ? 'error' : 'warning'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {request.requested_data.delete_profile ? 'Deletion' : 'Update'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No change requests found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Request Profile Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for requesting profile deletion. This will be reviewed by an administrator.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for deletion"
            fullWidth
            multiline
            rows={4}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteRequest} color="error">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TherapistProfilePage;