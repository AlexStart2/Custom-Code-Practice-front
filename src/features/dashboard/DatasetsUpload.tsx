// src/features/dashboard/DatasetsUpload.tsx
import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Box, Typography, Button, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Alert, LinearProgress,
  TextField, Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import type { Dataset } from './Datasets';

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

export default function DatasetsUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [datasetName, setDatasetName] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [chunkSize, setChunkSize]     = useState<number>(1000);
  const [chunkOverlap, setChunkOverlap] = useState<number>(200);

  const validateDatasetName = (name: string): boolean => {
    setDatasetName(name);
    if (name.length > 50) {
      setError('Dataset name cannot exceed 50 characters');
      return false;
    }
    // check datasetsNames to avoid duplicates
    if (datasets.some(dataset => dataset.name === name)) {
      setError('Dataset name already exists');
      return false;
    }
    // Reset error if validation passes
    if (error) {
      setError(null);
    }

    
    // If all validations pass
    setError(null);

    return true;
  };


  const validateFiles = (newFiles: FileList | null): File[] => {
    if (!newFiles) return [];
    const validFiles: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const ext = newFiles[i].name.split('.').pop()?.toLowerCase();
      const normalized = ext === 'jpeg' ? 'jpg' : `.${ext}`;
      if (ALLOWED_EXTENSIONS.includes(normalized)) {
        validFiles.push(newFiles[i]);
      } else {
        setError(`File type not allowed: ${newFiles[i].name}`);
      }
    }
    return validFiles;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = validateFiles(e.target.files);
    // Merge new files avoiding duplicates
    const existingNames = new Set(files.map((f) => f.name));
    const uniqueFiles = selected.filter(f => !existingNames.has(f.name));
    setFiles(prev => [...prev, ...uniqueFiles]);
    e.target.value = ''; // Reset input
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    if (datasetName) {
      formData.append('datasetName', datasetName);
    }else{
        setError('Dataset name is required');
        return;
    }

    if (!validateDatasetName(datasetName)) {
      return;
    }

    formData.append('chunk_size', chunkSize.toString());
    formData.append('chunk_overlap', chunkOverlap.toString());
    
    try {
      setUploading(true);
      setProgress(0);
      await axios.post(
        `${API_URL}upload-rag`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(Math.round((event.loaded * 100) / event.total));
            }
          },
        }
      );
      setFiles([]);
      setDatasetName('');
      setSuccessMsg('Dataset uploaded, processing started, please check the Jobs page for status.');
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      fetchDatasets(); // Refresh datasets after upload
    }
  };

  async function fetchDatasets() {
      try {
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
      }
    }

  useEffect(() => {
    fetchDatasets();
  }, []);

  return (
    <Box maxWidth="md" mx="auto" ml={2}>
      <Typography variant="h5" gutterBottom>
        Upload Dataset Files
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}


      {/* Success Snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMsg(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMsg}
        </Alert>
      </Snackbar>

      <Box component="form" onSubmit={handleSubmit} sx={{display: 'grid', gap: 2}}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<AddIcon />}
          sx={{ mb: 2, width: 'fit-content' }}
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

        {files.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell align="right">Size (KB)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell align="right">
                    {(file.size / 1024).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleRemoveFile(file.name)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

          <TextField
            label="Dataset Name"
            variant="outlined"
            value={datasetName}
            onChange={(e) => validateDatasetName(e.target.value)}
            disabled={uploading}
            sx={{ width: '200px' }}
          />

        <TextField
          label="Chunk Size"
          type="number"
          value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))}
          helperText="Max characters per text chunk"
          disabled={uploading}
          sx={{ maxWidth: '200px' }}
        />

        <TextField
          label="Chunk Overlap"
          type="number"
          value={chunkOverlap}
          onChange={e => setChunkOverlap(Number(e.target.value))}
          helperText="Characters to overlap between chunks"
          disabled={uploading}
          sx={{ maxWidth: '200px' }}
        />

        {uploading && (
          <LinearProgress
            value={progress}
            variant="determinate"
            sx={{ mt: 2 }}
          />
        )}

        <Box mt={3}>
          <Button
            type="submit"
            variant="contained"
            disabled={!files.length || uploading}
          >
            {uploading ? `Uploading... ${progress}%` : 'Upload'}
          </Button>

          <Button
            sx={{ ml: 2 }}
            component={RouterLink}
            to="/dashboard/datasets"
            disabled={uploading}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
