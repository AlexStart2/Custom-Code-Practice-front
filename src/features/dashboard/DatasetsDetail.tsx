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

// Move constants to top for better organization
const API_BASE_URL = import.meta.env.VITE_API_URL;
const PYTHON_API_URL = import.meta.env.VITE_API_PYTHON_API_URL;

// Improved TypeScript interfaces
export interface FileDetail {
  _id: string;
  file_name: string;
  results: { text: string; embedding: number[] }[];
}

export interface DatasetDetail {
  dataset: Dataset;
  files: FileDetail[];
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

interface ChunkToDelete {
  fileId: string;
  idx: number;
  textPreview: string;
}

interface EditingChunk {
  fileId: string;
  idx: number;
  text: string;
}

export default function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState<ChunkToDelete | null>(null);
  const [editingChunk, setEditingChunk] = useState<EditingChunk | null>(null);

  // Track which files are "expanded" (show all chunks) by file _id
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const onRequestDeleteChunk = (fileId: string, idx: number, text: string) => {
    setChunkToDelete({ fileId, idx, textPreview: text.slice(0, 100) + (text.length > 100 ? '…' : '') });
  };

  const confirmDeleteChunk = async () => {
    if (!chunkToDelete || !id) return;
    const { fileId, idx } = chunkToDelete;
    
    try {
      await axios.delete(`${API_BASE_URL}datasets/${id}/files/${fileId}/chunks/${idx}`);
      setData((d) => {
        if (!d) return d;
        return {
          ...d,
          files: d.files.map((file) =>
            file._id !== fileId
              ? file
              : {
                  ...file,
                  results: file.results.filter((_, i) => i !== idx),
                }
          ),
        };
      });
      setSuccess("Chunk deleted successfully");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || "Failed to delete chunk";
      setError(errorMessage);
      console.error('Failed to delete chunk:', err);
    } finally {
      setChunkToDelete(null);
    }
  };

  const loadDataset = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await axios.get<DatasetDetail>(`${API_BASE_URL}datasets/dataset/${id}`);
      setData(res.data);
      setNewName(res.data.dataset.name);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to load dataset';
      setError(errorMessage);
      console.error('Failed to load dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataset();
  }, [id]);

  // Save new dataset name
  const saveName = async () => {
    if (!id) return;
    try {
      await axios.patch(`${API_BASE_URL}datasets/dataset/name/${id}`, { name: newName });
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
      await axios.delete(`${API_BASE_URL}datasets/dataset/${id}`);
      navigate('/dashboard/datasets', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Delete failed';
      setError(errorMessage);
      console.error('Failed to delete dataset:', err);
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

  const handleEditChunk = (fileId: string, idx: number) => {
    // Pre-populate dialog with current text
    const file = data!.files.find((f) => f._id === fileId)!;
    const currentText = file.results[idx].text;
    setEditingChunk({ fileId, idx, text: currentText });
  };

  const saveEditedChunk = async () => {
    if (!editingChunk || !id) return;
    const { fileId, idx, text } = editingChunk;
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('idx', idx.toString());
    formData.append('text', text);

    try {
      await axios.patch(
        `${PYTHON_API_URL}datasets/files/chunks/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // Update local state
      setData((d) => {
        if (!d) return d;
        const files = d.files.map((file) => {
          if (file._id !== fileId) return file;
          const results = [...file.results];
          results[idx] = { ...results[idx], text };
          return { ...file, results };
        });
        return { ...d, files };
      });
      setSuccess("Chunk updated successfully");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || "Failed to update chunk";
      setError(errorMessage);
      console.error('Failed to update chunk:', err);
    } finally {
      setEditingChunk(null);
    }
  };

  // Enhanced loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading dataset details...
        </Typography>
      </Box>
    );
  }

  // Enhanced error state
  if (error && !data) {
    return (
      <Box textAlign="center" mt={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDataset}>
          Try Again
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard/datasets')} 
          sx={{ ml: 2 }}
        >
          Back to Datasets
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box textAlign="center" mt={4}>
        <Alert severity="info">Dataset not found</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard/datasets')} 
          sx={{ mt: 2 }}
        >
          Back to Datasets
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" mt={4} p={2}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header with Title & Actions */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        {editingName ? (
          <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              variant="outlined"
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveName();
                } else if (e.key === 'Escape') {
                  setEditingName(false);
                  setNewName(data.dataset.name);
                }
              }}
              autoFocus
            />
            <IconButton onClick={saveName} color="primary" aria-label="Save name">
              <Save />
            </IconButton>
            <IconButton 
              onClick={() => { 
                setEditingName(false); 
                setNewName(data.dataset.name); 
              }}
              aria-label="Cancel edit"
            >
              <Cancel />
            </IconButton>
          </Box>
        ) : (
          <>
            <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {data.dataset.name}
            </Typography>
            <IconButton onClick={() => setEditingName(true)} aria-label="Edit name">
              <Edit />
            </IconButton>
          </>
        )}
        <Button
          startIcon={<Delete />}
          color="error"
          variant="outlined"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          Delete Dataset
        </Button>
      </Box>

      {/* Enhanced Metadata Section */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Dataset Information</Typography>
        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">Created</Typography>
            <Typography variant="body1">
              {new Date(data.dataset.createdAt).toLocaleDateString()} at{' '}
              {new Date(data.dataset.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Files</Typography>
            <Typography variant="body1">
              {data.files.length} {data.files.length === 1 ? 'file' : 'files'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Chunks</Typography>
            <Typography variant="body1">
              {data.files.reduce((total, file) => total + file.results.length, 0)} chunks
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Enhanced Files Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        File Contents
      </Typography>
      
      {data.files.length === 0 ? (
        <Alert severity="info">
          This dataset contains no files.
        </Alert>
      ) : (
        data.files.map((fileDetail) => {
          const isExpanded = !!expandedFiles[fileDetail._id];
          const chunksToShow = isExpanded
            ? fileDetail.results
            : fileDetail.results.slice(0, 5);

          return (
            <Box key={fileDetail._id} mb={4}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                mb={2}
                sx={{ 
                  p: 2, 
                  bgcolor: 'primary.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {fileDetail.file_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {fileDetail.results.length} {fileDetail.results.length === 1 ? 'chunk' : 'chunks'}
                  </Typography>
                </Box>
                {fileDetail.results.length > 5 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => toggleFile(fileDetail._id)}
                    startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                  >
                    {isExpanded ? 'Show less' : `Show all ${fileDetail.results.length}`}
                  </Button>
                )}
              </Box>

              {fileDetail.results.length > 0 && (
                <Table size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Chunk Content</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 120 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chunksToShow.map((chunk, idx) => (
                      <TableRow key={`${fileDetail._id}-${idx}`} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: '600px',
                            lineHeight: 1.5
                          }}>
                            {chunk.text}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditChunk(fileDetail._id, idx)}
                            color="primary"
                            aria-label="Edit chunk"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onRequestDeleteChunk(fileDetail._id, idx, chunk.text)}
                            color="error"
                            aria-label="Delete chunk"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          );
        })
      )}

      {/* Enhanced Delete Dataset Confirmation */}
      <Dialog 
        open={confirmDelete} 
        onClose={() => setConfirmDelete(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>"{data.dataset.name}"</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, color: 'error.main' }}>
            This action cannot be undone. All files and chunks will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={doDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete Dataset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Edit Chunk Dialog */}
      <Dialog
        open={!!editingChunk}
        onClose={() => setEditingChunk(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Chunk</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={6}
            maxRows={12}
            fullWidth
            value={editingChunk?.text || ''}
            onChange={(e) =>
              setEditingChunk((c) =>
                c ? { ...c, text: e.target.value } : c
              )
            }
            placeholder="Enter chunk content..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingChunk(null)}>
            Cancel
          </Button>
          <Button 
            onClick={saveEditedChunk} 
            variant="contained"
            disabled={!editingChunk?.text.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Delete Chunk Confirmation */}
      <Dialog
        open={!!chunkToDelete}
        onClose={() => setChunkToDelete(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Chunk</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Are you sure you want to delete this chunk?
          </DialogContentText>
          <Box
            sx={{
              mt: 2,
              p: 2,
              maxHeight: 150,
              overflow: "auto",
              bgcolor: "grey.100",
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {chunkToDelete?.textPreview}
            </Typography>
          </Box>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChunkToDelete(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteChunk}
            color="error"
            variant="contained"
            startIcon={<Delete />}
          >
            Delete Chunk
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Feedback Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
