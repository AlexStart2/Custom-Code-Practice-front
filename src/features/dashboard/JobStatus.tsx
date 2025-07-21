
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary,
  AccordionDetails, Button, Table,
  TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Snackbar, Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import CancelIcon from '@mui/icons-material/Cancel';
// import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

interface Job {
  _id: string;
  owner: string;
  dataset_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  finishedAt?: string;
  createdAt: string;
  error?: string;
}

interface ProcessingFile {
  _id: string;
  job_id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  finishedAt?: string;
  createdAt: string;
  error?: string;
}

export interface JobResult {
  job: Job[];
  processingFiles: ProcessingFile[];
}

export default function JobsPage() {
  const [data, setData] = useState<JobResult>({ job: [], processingFiles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null);
  const [busyCancel, setBusyCancel] = useState(false);

  // NEW: track which panel is open (job._id or null)
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  // Fetch function (wrapped in useCallback so deps are stable)
  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get<JobResult>(`${API_BASE}datasets/jobs`);

      res.data.job.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.data.processingFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setData(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Poll every 2s
  useEffect(() => {
    fetchJobs();
    const iv = window.setInterval(fetchJobs, 2000);
    return () => clearInterval(iv);
  }, [fetchJobs]);

  // Actually perform cancel after confirmation
  const confirmCancelJob = async () => {
    if (!jobToCancel) return;
    setBusyCancel(true);
    try {
      await axios.post(`${API_BASE}/datasets/jobs/${jobToCancel._id}/cancel`);
      setSnack(`Job "${jobToCancel.dataset_name}" canceled`);
      setData((d) => ({
        ...d,
        jobs: d.job.map((j) =>
          j._id === jobToCancel._id ? { ...j, status: 'canceled' } : j
        ),
      }));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cancel job failed');
    } finally {
      setBusyCancel(false);
      setJobToCancel(null);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
        <Typography>Loading jobs…</Typography>
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!data) {
    return <Alert severity="info">No jobs found.</Alert>;
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress /><Typography>Loading jobs…</Typography>
      </Box>
    );
  }

  return (
    <Box mx="auto" maxWidth="lg" p={2}>
      <Typography variant="h4" gutterBottom>Status Jobs</Typography>

      {data.job.map((j) => {
        const filesForJob = data.processingFiles.filter(f => f.job_id === j._id);
        // const isActive = j.status === 'pending' || j.status === 'processing';

        // NEW: controlled expand handler
        const handleExpand = (_: React.SyntheticEvent, isEx: boolean) => {
          setExpandedJob(isEx ? j._id : null);
        };

        return (
          <Accordion
            key={j._id}
            expanded={expandedJob === j._id}
            onChange={handleExpand}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{j.dataset_name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Created: {new Date(j.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', alignContent: 'center' }}>
                <Typography
                  variant="body2"
                  marginRight={1}

                  color={
                    j.status === 'completed'
                      ? 'success.main'
                      : j.status === 'failed' || j.status === 'canceled'
                        ? 'error.main'
                        : j.status === 'processing' ? 'textSecondary' : 'warning'
                  }
                >
                  {j.status.toUpperCase()}
                </Typography>

                {/* {isActive && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{ cursor: 'pointer', marginRight: 1, ":hover": { textDecoration: 'underline' } }}
                    onClick={() => setJobToCancel(j)}
                  >
                    Cancel
                  </Typography>
                )} */}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {filesForJob.length === 0 ? (
                <Typography>No files</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>File Name</TableCell>
                      <TableCell align='right'>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filesForJob.map((file) => {
                      // const isFileActive =
                      //   file.status === 'pending' || file.status === 'processing';
                      return (
                        <TableRow key={file._id} hover>
                          <TableCell>{file.file_name}</TableCell>
                          <TableCell align="right">

                            {file.status=== 'completed' ? (
                              <Typography color="success.main">Completed</Typography>
                            ) : file.status === 'failed' ? (
                              <Typography color="error.main">Failed</Typography>
                            ) : file.status === 'canceled' ? (
                              <Typography color="error.main">Canceled</Typography>
                            ) : file.status === 'processing' ? (
                              <Typography color="textSecondary">
                                <CircularProgress size={20} />
                              </Typography>
                            ) : file.status === 'pending' ? (
                              <Typography color="textSecondary">Pending</Typography>
                            ) : null}
                          </TableCell>

                          {/* <TableCell align="right">
                            {isFileActive && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => cancelFile(file._id)}
                              >
                                <CancelIcon />
                              </IconButton>
                            )}
                            {file.status !== 'completed' && file.status !== 'failed' && (
                              <IconButton
                                size="small"
                                onClick={() => deleteFile(file._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}


      {/* Confirmation Dialog */}
      <Dialog
        open={!!jobToCancel}
        onClose={() => setJobToCancel(null)}
      >
        <DialogTitle>Cancel Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the job “
            {jobToCancel?.dataset_name}”? This will stop processing all files.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setJobToCancel(null)}
            disabled={busyCancel}
          >
            No, keep running
          </Button>
          <Button
            onClick={confirmCancelJob}
            color="error"
            disabled={busyCancel}
          >
            {busyCancel ? <CircularProgress size={16} /> : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnack(null)}>
          {snack}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
