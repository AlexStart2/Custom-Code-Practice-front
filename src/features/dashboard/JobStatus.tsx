// src/features/dashboard/JobsPage.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

interface Job {
  _id: string;
  owner: string;
  dataset_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  createdAt: string;
}

interface ProcessingFile {
  _id: string;
  job_id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface JobResult {
  job: Job[];
  processingFiles: ProcessingFile[];
}

export default function JobsPage() {
  const [data, setData]         = useState<JobResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [snack, setSnack]       = useState<string | null>(null);
  const API_BASE                = import.meta.env.VITE_API_URL;

  // Fetch jobs + files
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get<JobResult>(`${API_BASE}datasets/jobs`);
        console.log('Fetched jobs:', res.data);
        setData(res.data);
        setError(null);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cancelJob = async (jobId: string) => {
    try {
      await axios.post(`${API_BASE}jobs/${jobId}/cancel`);
      setSnack(`Job ${jobId} canceled`);
      // update locally
      setData((d) =>
        d && {
          ...d,
          jobs: d.job.map((j) =>
            j._id === jobId ? { ...j, status: 'canceled' } : j
          ),
        }
      );
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cancel job failed');
    }
  };

  const cancelFile = async (fileId: string) => {
    try {
      await axios.post(`${API_BASE}jobs/file/${fileId}/cancel`);
      setSnack(`File ${fileId} canceled`);
      setData((d) =>
        d && {
          ...d,
          processingFiles: d.processingFiles.map((f) =>
            f._id === fileId ? { ...f, status: 'failed' } : f
          ),
        }
      );
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cancel file failed');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await axios.delete(`${API_BASE}jobs/file/${fileId}`);
      setSnack(`File ${fileId} deleted`);
      setData((d) =>
        d && {
          ...d,
          processingFiles: d.processingFiles.filter((f) => f._id !== fileId),
        }
      );
    } catch (e: any) {
      setError(e.response?.data?.message || 'Delete file failed');
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

  return (
    <Box mx="auto" maxWidth="lg" mt={4} p={2}>
      <Typography variant="h4" gutterBottom>
        Processing Jobs
      </Typography>

      {data.job.map((job) => {
        const filesForJob = data.processingFiles.filter(
          (f) => f.job_id === job._id
        );
        const isActive = job.status === 'pending' || job.status === 'processing';

        return (
          <Accordion key={job._id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{job.dataset_name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Created: {new Date(job.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  color={
                    job.status === 'completed'
                      ? 'success.main'
                      : job.status === 'failed' || job.status === 'canceled'
                      ? 'error.main'
                      : 'textSecondary'
                  }
                >
                  {job.status.toUpperCase()}
                </Typography>
                {isActive && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => cancelJob(job._id)}
                  >
                    Cancel Job
                  </Button>
                )}
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
                      <TableCell>Status</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filesForJob.map((file) => {
                      const isFileActive =
                        file.status === 'pending' || file.status === 'processing';
                      return (
                        <TableRow key={file._id} hover>
                          <TableCell>{file.file_name}</TableCell>
                          <TableCell>{file.status}</TableCell>
                          <TableCell>
                            {new Date(file.createdAt).toLocaleTimeString()}
                          </TableCell>
                          <TableCell align="right">
                            {isFileActive && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => cancelFile(file._id)}
                              >
                                <CancelIcon />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => deleteFile(file._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
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

      {/* Snackbars */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSnack(null)}
          sx={{ width: '100%' }}
        >
          {snack}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
