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
const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Dataset {
  _id: string;
  name: string;
  createdAt: string;
  chunks: any[];
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For delete confirmation dialog
  const [toDelete, setToDelete] = useState<Dataset | null>(null);
  const [deleting, setDeleting] = useState(false);


  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`); // After implementing the backend to change type
      // Normalize the response into an array
      const data = response.data;
      let list: Dataset[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (typeof data === 'object') {
        // If keyed by id
        list = Object.values(data) as Dataset[];
      }
      setDatasets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets');
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
        `${API_BASE_URL}datasets/${toDelete._id}`, // your delete endpoint
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
              <TableRow key={ds._id} hover>
                <TableCell>{ds.name}</TableCell>
                <TableCell>{ds.chunks.length}</TableCell>
                <TableCell>{new Date(ds.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" component={RouterLink} to={`${ds._id}`}>
                    View
                  </Button>
                </TableCell>
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
