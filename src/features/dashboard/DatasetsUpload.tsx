// src/features/dashboard/DatasetsUpload.tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Box, Typography, Button, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Alert, LinearProgress,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';

const API_URL = import.meta.env.PYTHON_API_URL || 'http://localhost:5001/';

const ALLOWED_EXTENSIONS = [
  '.docx', '.doc', '.odt',
  '.pptx', '.ppt',
  '.xlsx', '.csv', '.tsv',
  '.eml', '.msg',
  '.rtf', '.epub',
  '.html', '.xml',
  '.pdf',
  '.png', '.jpg', '.jpeg', '.heic',
  '.txt',
];

export default function DatasetsUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [datasetName, setDatasetName] = useState('');

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
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box maxWidth="md" mx="auto" ml={2}>
      <Typography variant="h5" gutterBottom>
        Upload Dataset Files
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<AddIcon />}
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

        <br />
          <TextField
            label="Dataset Name"
            variant="outlined"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            disabled={uploading}
            sx={{ width: '200px' }}
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
