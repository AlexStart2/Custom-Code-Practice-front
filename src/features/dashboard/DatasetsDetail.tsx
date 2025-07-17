// src/features/dashboard/DatasetDetail.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Edit, Save, Cancel, Delete } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DatasetDetail {
  _id: string;
  name: string;
  owner: string;
  chunks: { file: string; results: { text: string; embedding: number[] }[] } [];
  createdAt: string;
}

export default function DatasetDetail() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const [data, setData]      = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  // Fetch the dataset on mount (and when id changes)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get<DatasetDetail>(`${API_BASE}datasets/dataset/${id}`);
        setData(res.data);
        setNewName(res.data.name);
        setError(null);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Handle renaming
  const saveName = async () => {
    if (!id) return;
    try {
      await axios.patch(`${API_BASE}datasets/dataset/${id}`, { name: newName });
      setData((d) => d && { ...d, name: newName });
      setEditing(false);
      setSuccess('Name updated');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Update failed');
    }
  };

  // Handle deletion
  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}datasets/${id}`);
      navigate('/dashboard/datasets', { replace: true });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!data) {
    return <Alert severity="info">No data found</Alert>;
  }

  return (
    <Box maxWidth="md" mx="auto" mt={4} p={2}>
      {/* Title & edit */}
      <Box display="flex" alignItems="center" mb={2}>
        {editing ? (
          <>
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <IconButton onClick={saveName}><Save /></IconButton>
            <IconButton onClick={() => { setEditing(false); setNewName(data.name); }}><Cancel /></IconButton>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              {data.name}
            </Typography>
            <IconButton onClick={() => setEditing(true)}>
              <Edit />
            </IconButton>
          </>
        )}
        <Button
          startIcon={<Delete />}
          color="error"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </Box>

      {/* Metadata */}
      <Typography variant="subtitle2" color="textSecondary">
        Created: {new Date(data.createdAt).toLocaleString()}
      </Typography>
      <Typography variant="subtitle2" color="textSecondary">
        Files: {data.chunks.map(c => c.file).join(', ')}
      </Typography>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Total files: {data.chunks.length}
      </Typography>
      <Divider sx={{ my: 2 }} />

      {/* (Optional) List first few chunks */}
      <Typography variant="h6">Extracted Text</Typography>
      <List dense>
        {data.chunks.map((file) => (
          <ListItem>
            <ListItemText
                primary={file.file}
                secondary={
                    file.results.slice(0, 5).map((res, idx) => (
                    <Box key={idx}>
                        <Typography variant="body2">{res.text}</Typography>
                    </Box>
                    ))
                }
            />
          </ListItem>
        ))}
      </List>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete Dataset?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{data.name}"? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={doDelete}
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
