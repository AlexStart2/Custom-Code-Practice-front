// src/features/dashboard/Models.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
} from '@mui/material';

interface ModelInfo {
  id: string;
  name: string;
  createdAt: string;
  size: number; // in MB
}

export default function Models() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await axios.get<ModelInfo[]>('/api/models');
        const data = response.data;
        setModels(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  if (loading) return <Typography>Loading models...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Trained Models</Typography>
        {/* Optionally add upload or deploy buttons */}
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Size (MB)</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} hover>
                <TableCell>{model.name}</TableCell>
                <TableCell>{model.size.toFixed(2)}</TableCell>
                <TableCell>{new Date(model.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => window.open(`/api/models/${model.id}/download`, '_blank')}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {/* TODO: deploy action */}}
                  >
                    Deploy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
