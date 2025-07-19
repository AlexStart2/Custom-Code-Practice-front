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
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { Edit, Save, Cancel, Delete, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Dataset } from './Datasets';

export interface fileDetail {
  _id: string;
  file_name: string;
  results: { text: string; embedding: number[] }[];
}

export interface DatasetDetail {
  dataset: Dataset;
  files: fileDetail[];
}

export default function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For renaming dataset
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName]         = useState('');

  // For delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // Track which files are “expanded” (show all chunks) by file _id
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get<DatasetDetail>(`${API}datasets/dataset/${id}`);
        setData(res.data);
        setNewName(res.data.dataset.name);
        setError(null);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Save new dataset name
  const saveName = async () => {
    if (!id) return;
    try {
      await axios.patch(`${API}datasets/dataset/name/${id}`, { name: newName });
      setData((d) => d && ({ ...d, dataset: { ...d.dataset, name: newName } }));
      setEditingName(false);
      setSuccess('Name updated');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Update failed');
    }
  };

  // Confirm dataset deletion
  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}datasets/dataset/${id}`);
      navigate('/dashboard/datasets', { replace: true });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle expand/collapse for a file
  const toggleFile = (fileId: string) => {
    setExpandedFiles((prev) => ({ 
      ...prev, 
      [fileId]: !prev[fileId] 
    }));
  };

  // Handlers for chunk edit/delete — fill these in to call your API
  const handleEditChunk = (fileId: string, idx: number) => {
    console.log('Edit chunk', fileId, idx);
  };
  const handleDeleteChunk = async (fileId: string, idx: number) => {
    // call DELETE /datasets/:id/file/:fileId/chunk/:idx
    console.log('Delete chunk', fileId, idx);
  };

  if (loading) {
    return <Box textAlign="center" mt={4}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!data) {
    return <Alert severity="info">No data found</Alert>;
  }

  return (
    <Box maxWidth="md" mx="auto" mt={4} p={2}>
      {/* Title & rename */}
      <Box display="flex" alignItems="center" mb={2}>
        {editingName ? (
          <>
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
            />
            <IconButton onClick={saveName}><Save /></IconButton>
            <IconButton onClick={() => { setEditingName(false); setNewName(data.dataset.name); }}><Cancel /></IconButton>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              {data.dataset.name}
            </Typography>
            <IconButton onClick={() => setEditingName(true)}><Edit /></IconButton>
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
        Created: {new Date(data.dataset.createdAt).toLocaleString()}
      </Typography>
      <Typography variant="subtitle2" color="textSecondary">
        Files: {data.files.length}
      </Typography>
      <Divider sx={{ my: 2 }} />

      {/* Per-file chunk tables */}
      {data.files.map((fileDetail) => {
        const isExpanded = !!expandedFiles[fileDetail._id];
        const chunksToShow = isExpanded
          ? fileDetail.results
          : fileDetail.results.slice(0, 5);

        return (
          <Box key={fileDetail._id} mb={4}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {fileDetail.file_name}
              </Typography>
              {fileDetail.results.length > 5 && (
                <Button
                  size="small"
                  onClick={() => toggleFile(fileDetail._id)}
                  startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {isExpanded ? 'Show less' : 'Show all'}
                </Button>
              )}
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chunksToShow.map((chunk, idx) => (
                  <TableRow key={`${fileDetail._id}-${idx}`} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {chunk.text}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditChunk(fileDetail._id, idx)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteChunk(fileDetail._id, idx)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        );
      })}

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete Dataset?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{data.dataset.name}"? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={doDelete} color="error" disabled={deleting}>
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
