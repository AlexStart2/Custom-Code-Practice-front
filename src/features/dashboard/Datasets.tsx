// src/features/dashboard/Datasets.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, 
  Typography, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  Button, 
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
  import { Link as RouterLink } from 'react-router-dom';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Dataset {
  _id: string;
  name: string;
  owner: string;
  createdAt: string;
  files: string[];
}


export default function Datasets() {
  const token = useAuthStore(s => s.token);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // For delete confirmation dialog
  const [toDelete, setToDelete] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);


  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Normalize the response into an array
      const data = response.data;
      let list: Dataset[] = [];
      
      if (Array.isArray(data)) {
        list = data;
      } else if (typeof data === 'object' && data !== null) {
        // If keyed by id, convert to array
        list = Object.values(data) as Dataset[];
      }

      // Sort by creation date (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDatasets(list);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load datasets';
      setError(errorMessage);
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const confirmDelete = (ds: Dataset) => setToDelete(ds);
  const cancelDelete = () => setToDelete(null);


  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${API_BASE_URL}datasets/dataset/${toDelete._id}`, // your delete endpoint
      );
      setSuccess(`Deleted “${toDelete.name}”`);
      setToDelete(null);
      await loadDatasets();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Datasets</Typography>
        <Button variant="contained" component={RouterLink} to="/dashboard/datasets/upload">
          Upload New
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Files</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.map((ds) => (
              <TableRow key={ds._id} hover 
              sx={{ cursor: 'pointer' }}>
                <TableCell onClick={() => navigate(`/dashboard/datasets/${ds._id}`)} >{ds.name}</TableCell>
                <TableCell onClick={() => navigate(`/dashboard/datasets/${ds._id}`)} >{ds.files.length}</TableCell>
                <TableCell onClick={() => navigate(`/dashboard/datasets/${ds._id}`)} >{new Date(ds.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    onClick={() => confirmDelete(ds)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={!!toDelete}
        onClose={cancelDelete}
      >
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete “{toDelete?.name}”? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
