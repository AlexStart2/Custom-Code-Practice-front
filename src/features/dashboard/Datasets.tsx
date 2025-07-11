// src/features/dashboard/Datasets.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface Dataset {
  id: string;
  name: string;
  createdAt: string;
  fileCount: number;
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await axios.get<any>('/api/datasets'); // After implementing the backend to change type
        // Normalize the response into an array
        const data = response.data;
        let list: Dataset[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data.datasets)) {
          list = data.datasets;
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
    }

    fetchDatasets();
  }, []);

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
              <TableRow key={ds.id} hover>
                <TableCell>{ds.name}</TableCell>
                <TableCell>{ds.fileCount}</TableCell>
                <TableCell>{new Date(ds.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" component={RouterLink} to={`/dashboard/datasets/${ds.id}`}>
                    View
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
