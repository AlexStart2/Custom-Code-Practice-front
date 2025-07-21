
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';

// Constants for better organization
const API_BASE_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000; // 2 seconds
const SNACKBAR_DURATION = 4000;
const ERROR_SNACKBAR_DURATION = 6000;

// Enhanced TypeScript interfaces
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';

export interface Job {
  _id: string;
  owner: string;
  dataset_name: string;
  status: JobStatus;
  finishedAt?: string;
  createdAt: string;
  error?: string;
}

export interface ProcessingFile {
  _id: string;
  job_id: string;
  file_name: string;
  status: FileStatus;
  finishedAt?: string;
  createdAt: string;
  error?: string;
}

export interface JobResult {
  jobs: Job[];
  processingFiles: ProcessingFile[];
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function JobStatus() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<JobResult>({ jobs: [], processingFiles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null);
  const [cancellingJob, setCancellingJob] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced fetch function with better error handling
  const fetchJobs = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const res = await axios.get<JobResult>(`${API_BASE_URL}datasets/jobs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Sort jobs by creation date (newest first)
      res.data.jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.data.processingFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setData(res.data);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to load jobs';
      setError(errorMessage);
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  // Enhanced polling with cleanup
  useEffect(() => {
    fetchJobs();
    const intervalId = window.setInterval(() => fetchJobs(), POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchJobs]);

  // Enhanced cancel job function with better error handling
  const confirmCancelJob = async () => {
    if (!jobToCancel) return;
    
    setCancellingJob(true);
    try {
      await axios.post(`${API_BASE_URL}datasets/jobs/${jobToCancel._id}/cancel`);
      setSuccessMsg(`Job "${jobToCancel.dataset_name}" has been canceled successfully`);
      
      // Optimistically update the UI
      setData((prevData) => ({
        ...prevData,
        job: prevData.jobs.map((j) =>
          j._id === jobToCancel._id ? { ...j, status: 'canceled' as JobStatus } : j
        ),
      }));
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to cancel job';
      setError(errorMessage);
      console.error('Failed to cancel job:', err);
    } finally {
      setCancellingJob(false);
      setJobToCancel(null);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchJobs(true);
  };

  // Early returns for different states
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="200px"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading jobs...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, m: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleManualRefresh}
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!data || data.jobs.length === 0) {
    return (
      <Paper sx={{ p: 4, m: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No jobs found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a dataset to see processing jobs here.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleManualRefresh}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
        >
          Refresh
        </Button>
      </Paper>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Job Status
        </Typography>
        <Button
          variant="outlined"
          onClick={handleManualRefresh}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          size="small"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor the status of your dataset processing jobs and file uploads.
      </Typography>

      {data.jobs.map((job) => {
        const filesForJob = data.processingFiles.filter(f => f.job_id === job._id);

        // Controlled expand handler
        const handleExpand = (_: React.SyntheticEvent, isExpanded: boolean) => {
          setExpandedJob(isExpanded ? job._id : null);
        };

        return (
          <Paper 
            key={job._id} 
            elevation={1} 
            sx={{ mb: 2, overflow: 'hidden' }}
          >
            <Accordion
              expanded={expandedJob === job._id}
              onChange={handleExpand}
              elevation={0}
              sx={{ boxShadow: 'none' }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  '&.Mui-expanded': { 
                    minHeight: 56 
                  },
                  '& .MuiAccordionSummary-content.Mui-expanded': {
                    margin: '12px 0'
                  }
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {job.dataset_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(job.createdAt).toLocaleString()}
                    {job.finishedAt && (
                      <> • Finished: {new Date(job.finishedAt).toLocaleString()}</>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={job.status.toUpperCase()}
                    size="small"
                    color={
                      job.status === 'completed' 
                        ? 'success' 
                        : job.status === 'failed' || job.status === 'canceled'
                        ? 'error'
                        : job.status === 'processing'
                        ? 'info'
                        : 'warning'
                    }
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0 }}>
                {job.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">{job.error}</Typography>
                  </Alert>
                )}
                
                {filesForJob.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No files found for this job
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Files ({filesForJob.length})
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filesForJob.map((file) => (
                          <TableRow key={file._id} hover>
                            <TableCell sx={{ maxWidth: '400px', wordBreak: 'break-word' }}>
                              {file.file_name}
                              {file.finishedAt && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Finished: {new Date(file.finishedAt).toLocaleString()}
                                </Typography>
                              )}
                              {file.error && (
                                <Typography variant="caption" display="block" color="error.main">
                                  Error: {file.error}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" justifyContent="flex-end" alignItems="center">
                                {file.status === 'processing' ? (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                      Processing...
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Chip
                                    label={file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                                    size="small"
                                    color={
                                      file.status === 'completed'
                                        ? 'success'
                                        : file.status === 'failed' || file.status === 'canceled'
                                        ? 'error'
                                        : 'default'
                                    }
                                  />
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        );
      })}

      {/* Enhanced Confirmation Dialog */}
      <Dialog
        open={!!jobToCancel}
        onClose={() => setJobToCancel(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the job for dataset "{jobToCancel?.dataset_name}"? 
            This will stop processing all remaining files in this job.
          </DialogContentText>
          {jobToCancel?.status === 'processing' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This job is currently being processed. Canceling may take a few moments.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setJobToCancel(null)}
            disabled={cancellingJob}
          >
            Keep Running
          </Button>
          <Button
            onClick={confirmCancelJob}
            color="error"
            variant="contained"
            disabled={cancellingJob}
            startIcon={cancellingJob ? <CircularProgress size={16} /> : undefined}
          >
            {cancellingJob ? 'Canceling...' : 'Cancel Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Success Snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={SNACKBAR_DURATION}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccessMsg(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMsg}
        </Alert>
      </Snackbar>

      {/* Enhanced Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={ERROR_SNACKBAR_DURATION}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
