// src/features/dashboard/AskPage.tsx
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
} from '@mui/material';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import HistoryList from '../../components/historyList';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PYTHON_API_URL = import.meta.env.VITE_API_PYTHON_API_URL;

interface Dataset {
  _id: string;
  name: string;
  owner: string;
  createdAt: string;
  files: string[];
}

interface RagResponse {
  answer: string;
  context: string[]
}

export default function AskPage() {
  const token = useAuthStore((s) => s.token);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RagResponse | null>(null);
  const navigate = useNavigate();

  // 1) Fetch available datasets on mount
  useEffect(() => {
    axios
      .get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        let list: Dataset[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (typeof data === 'object') {
          // If keyed by id
          list = Object.values(data) as Dataset[];
        }

        // order by createdAt descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setDatasets(list);
      });

    // 2) Fetch available models
    axios
      .get<string[]>(`${API_BASE_URL}models/available-models`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;

        // delte first element
        if (Array.isArray(data) && data.length > 0) {
          data.shift(); // Remove the first element
        }

        setModels(data);

        if (res.data.length > 0) {
          setSelectedModel(res.data[0]); // Set default model
        }
      });
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDataset || !selectedModel || !query) return;

    const formData = new FormData();
    formData.append('datasetId', selectedDataset);
    formData.append('model', selectedModel);
    formData.append('query', query);

    setLoading(true);
    try {
      const res = await axios.post<RagResponse>(
        `${PYTHON_API_URL}models/rag-query`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponse(res.data);
    } catch (err) {
      console.error(err);

      // Cast err to any to safely access code property
      if ((err as any).code === 501) {
        alert('Server is busy, please try again later.');
      } else if ((err as any).response?.status === 401) {
        alert('Unauthorized. Please log in again.');
        navigate('auth/login');
      }else{
        alert('An error occurred while processing your request.');
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <HistoryList />
    <Box maxWidth="md" mx="auto" mt={4} p={2}>
      <Typography variant="h4" gutterBottom>
        Ask your model
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'grid', gap: 2 }}
      >
        <FormControl fullWidth>
          <InputLabel id="dataset-label">Dataset</InputLabel>
          <Select
            labelId="dataset-label"
            value={selectedDataset}
            label="Dataset"
            onChange={(e) => setSelectedDataset(e.target.value)}
          >
            {datasets.map((ds) => (
              <MenuItem key={ds._id} value={ds._id}>
                {ds.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="model-label">Model</InputLabel>
          <Select
            labelId="model-label"
            value={selectedModel}
            label="Model"
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Your question"
          multiline
          minRows={3}
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </Button>
      </Box>

      {response && (
        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6">Answer</Typography>
          <Typography paragraph>{response.answer}</Typography>

          {/* <Typography variant="subtitle1" gutterBottom>
            Supporting Context NEED TO ADD THRESHOLD
          </Typography> */}
          {/* {response.context.map((text, i) => (
            <Box key={i} sx={{ mb: 1 }}>
              <Typography>{text}</Typography>
            </Box>
          ))} */}
        </Paper>
      )}
    </Box>
    </>
  );
}
