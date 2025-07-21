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

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName]         = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [chunkToDelete, setChunkToDelete] = useState<{
    fileId: string;
    idx: number;
    textPreview: string;
  } | null>(null);

  const [editingChunk, setEditingChunk] = useState<{
    fileId: string;
    idx: number;
    text: string;
  } | null>(null);

  const onRequestDeleteChunk = (fileId: string, idx: number, text: string) => {
    setChunkToDelete({ fileId, idx, textPreview: text.slice(0, 100) + (text.length>100?'…':'') });
  };

  const confirmDeleteChunk = async () => {
    if (!chunkToDelete || !id) return;
    const { fileId, idx } = chunkToDelete;
    try {
      await axios.delete(
        `${API}datasets/${id}/files/${fileId}/chunks/${idx}`
      );
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
      setSuccess("Chunk deleted");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to delete chunk");
    } finally {
      setChunkToDelete(null);
    }
  };

  // Track which files are “expanded” (show all chunks) by file _id
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const API = import.meta.env.VITE_API_URL;
  const PYTHON_API = import.meta.env.VITE_API_PYTHON_API_URL;

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

  const handleEditChunk = (fileId: string, idx: number) => {
  // pre‑populate dialog with current text
  const file = data!.files.find((f) => f._id === fileId)!;
  const currentText = file.results[idx].text;
  setEditingChunk({ fileId, idx, text: currentText });
};

const saveEditedChunk = async () => {
    if (!editingChunk || !id) return;
    const { fileId, idx, text } = editingChunk;
    const formData = new FormData();
    formData.append('fileId', fileId);
    const _id = String(idx);
    formData.append('idx', _id);
    formData.append('text', text);

    try {
      await axios.patch(
        `${PYTHON_API}datasets/files/chunks/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // update local state
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
      setSuccess("Chunk updated");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to update chunk");
    } finally {
      setEditingChunk(null);
    }
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
                  <TableCell>Chunk Text</TableCell>
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
                            onClick={() =>
                              onRequestDeleteChunk(
                                fileDetail._id,
                                idx,
                                chunk.text
                              )
                            }
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

      {/* Edit‐Chunk Dialog */}
      <Dialog
        open={!!editingChunk}
        onClose={() => setEditingChunk(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Chunk</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={editingChunk?.text}
            onChange={(e) =>
              setEditingChunk((c) =>
                c ? { ...c, text: e.target.value } : c
              )
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingChunk(null)}>Cancel</Button>
          <Button onClick={saveEditedChunk} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!chunkToDelete}
        onClose={() => setChunkToDelete(null)}
      >
        <DialogTitle>Delete Chunk?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chunk?
            <Box
              mt={2}
              p={1}
              sx={{
                maxHeight: 120,
                overflow: "auto",
                bgcolor: "grey.100",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                {chunkToDelete?.textPreview}
              </Typography>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setChunkToDelete(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteChunk}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            Delete
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
