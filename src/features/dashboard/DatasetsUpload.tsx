// src/features/dashboard/DatasetsUpload.tsx
import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Box, 
  Typography, 
  Button, 
  Table, 
  TableHead,
  TableRow, 
  TableCell, 
  TableBody, 
  IconButton, 
  Alert, 
  LinearProgress,
  TextField, 
  Snackbar,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import type { Dataset } from './Datasets';

// Move constants to top for better organization
const API_URL = import.meta.env.VITE_API_PYTHON_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ALLOWED_EXTENSIONS = [
  '.docx', '.doc', '.odt',
  '.pptx', '.ppt',
  '.xlsx', '.csv', '.tsv',
  '.eml', '.msg',
  '.rtf', '.epub',
  '.html', '.xml',
  '.pdf',
  '.png', '.jpg', '.jpeg', '.heic',
  '.txt', '.md', '.org',
  '.js', '.ts', '.c', '.cpp', '.py', '.java', '.go',
  '.cs', '.rb', '.swift',
];

const MAX_DATASET_NAME_LENGTH = 50;
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Improved TypeScript interfaces
interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface UploadProgress {
  loaded: number;
  total?: number;
}

export default function DatasetsUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [datasetName, setDatasetName] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(DEFAULT_CHUNK_SIZE);
  const [chunkOverlap, setChunkOverlap] = useState<number>(DEFAULT_CHUNK_OVERLAP);

  const validateDatasetName = (name: string): boolean => {
    setDatasetName(name);
    
    // Clear previous errors first
    setError(null);
    
    if (name.trim().length === 0) {
      setError('Dataset name is required');
      return false;
    }
    
    if (name.length > MAX_DATASET_NAME_LENGTH) {
      setError(`Dataset name cannot exceed ${MAX_DATASET_NAME_LENGTH} characters`);
      return false;
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      setError('Dataset name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }
    
    // Check for duplicate names (case-insensitive)
    if (datasets.some(dataset => dataset.name.toLowerCase() === name.toLowerCase())) {
      setError('A dataset with this name already exists');
      return false;
    }
    
    return true;
  };

  const validateFiles = (newFiles: FileList | null): File[] => {
    if (!newFiles) return [];
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File "${file.name}" exceeds maximum size of 50MB`);
        continue;
      }
      
      // Check file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext) {
        errors.push(`File "${file.name}" has no extension`);
        continue;
      }
      
      const normalizedExt = ext === 'jpeg' ? '.jpg' : `.${ext}`;
      if (!ALLOWED_EXTENSIONS.includes(normalizedExt)) {
        errors.push(`File type not supported: "${file.name}" (${ext})`);
        continue;
      }
      
      // Check for duplicate names
      if (files.some(existingFile => existingFile.name === file.name)) {
        errors.push(`File "${file.name}" is already selected`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    // Set error if any validation failures
    if (errors.length > 0) {
      setError(errors[0]); // Show first error
    }
    
    return validFiles;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = validateFiles(e.target.files);
    
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected]);
    }
    
    // Reset input to allow selecting the same files again if needed
    e.target.value = '';
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    // Clear error if it was related to file validation
    if (error?.includes(fileName)) {
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!files.length) {
      setError('Please select at least one file');
      return;
    }

    if (!datasetName.trim()) {
      setError('Dataset name is required');
      return;
    }

    if (!validateDatasetName(datasetName)) {
      return;
    }

    // Validate chunk parameters
    if (chunkSize < 100 || chunkSize > 10000) {
      setError('Chunk size must be between 100 and 10,000 characters');
      return;
    }

    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      setError('Chunk overlap must be between 0 and less than chunk size');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('datasetName', datasetName.trim());
    formData.append('chunk_size', chunkSize.toString());
    formData.append('chunk_overlap', chunkOverlap.toString());
    
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      
      await axios.post(
        `${API_URL}upload-rag`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: UploadProgress) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percentCompleted);
            }
          },
        }
      );
      
      // Reset form on success
      setFiles([]);
      setDatasetName('');
      setChunkSize(DEFAULT_CHUNK_SIZE);
      setChunkOverlap(DEFAULT_CHUNK_OVERLAP);
      setProgress(100);
      setSuccessMsg('Dataset uploaded successfully! Processing started, please check the Jobs page for status.');
      
      // Refresh datasets list
      await fetchDatasets();
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to upload dataset';
      setError(errorMessage);
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      const response = await axios.get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`);
      
      // Normalize the response into an array
      const data = response.data;
      let list: Dataset[] = [];
      
      if (Array.isArray(data)) {
        list = data;
      } else if (typeof data === 'object' && data !== null) {
        // If keyed by id, convert to array
        list = Object.values(data) as Dataset[];
      }
      
      // Sort datasets by creation date (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDatasets(list);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to load datasets';
      console.error('Failed to fetch datasets:', errorMessage);
      // Don't set error here as it might interfere with upload flow
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Upload Dataset Files
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload your files to create a new dataset for AI training and analysis.
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Upload Form */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 3 }}>
          {/* File Upload Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Files
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddIcon />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              Add Files
              <input
                type="file"
                multiple
                hidden
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Supported formats: {ALLOWED_EXTENSIONS.slice(0, 8).join(', ')} and more
            </Typography>
          </Box>

          {/* Files Table */}
          {files.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selected Files ({files.length})
              </Typography>
              <Table size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Size</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.name} hover>
                      <TableCell sx={{ maxWidth: '300px', wordBreak: 'break-all' }}>
                        {file.name}
                      </TableCell>
                      <TableCell align="right">
                        {file.size < 1024 * 1024 
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        }
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleRemoveFile(file.name)}
                          size="small"
                          color="error"
                          disabled={uploading}
                          aria-label={`Remove ${file.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Configuration Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Dataset Configuration
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <TextField
                label="Dataset Name"
                variant="outlined"
                value={datasetName}
                onChange={(e) => validateDatasetName(e.target.value)}
                disabled={uploading}
                required
                sx={{ minWidth: '250px' }}
                helperText="Enter a unique name for your dataset"
              />

              <TextField
                label="Chunk Size"
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                helperText="Characters per text chunk (100-10,000)"
                disabled={uploading}
                inputProps={{ min: 100, max: 10000 }}
                sx={{ minWidth: '200px' }}
              />

              <TextField
                label="Chunk Overlap"
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                helperText="Characters to overlap between chunks"
                disabled={uploading}
                inputProps={{ min: 0, max: chunkSize - 1 }}
                sx={{ minWidth: '200px' }}
              />
            </Box>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Uploading... {progress}%
              </Typography>
              <LinearProgress
                value={progress}
                variant="determinate"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              component={RouterLink}
              to="/dashboard/datasets"
              disabled={uploading}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!files.length || !datasetName.trim() || uploading}
              sx={{ minWidth: '120px' }}
            >
              {uploading ? `${progress}%` : 'Upload Dataset'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Success Snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={6000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMsg(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
