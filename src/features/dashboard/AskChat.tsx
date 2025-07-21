// src/features/dashboard/AskPage.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import History from '../../components/History';

// Move constants to top for better organization
const API_BASE_URL = import.meta.env.VITE_API_URL;
const PYTHON_API_URL = import.meta.env.VITE_API_PYTHON_API_URL;

// Improved TypeScript interfaces
interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

interface Dataset {
  _id: string;
  name: string;
  owner: string;
  createdAt: string;
  files: string[];
}

interface RagResponse {
  answer: string;
  context: string[];
}

interface RagResponseHistory {
  _id: string;
  datetime: string;
  messages: {
    prompt: string;
    answer: string;
  }[];
  model: string;
  dataset: string;
}

interface models {
  data: string[];
}

export default function AskPage() {
  const token = useAuthStore((s) => s.token);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<RagResponseHistory>();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Improved async function with better error handling
  const fetchHistory = async (): Promise<string | null> => {
    try {
      const res = await axios.get<RagResponseHistory>(`${API_BASE_URL}users/rag-query-history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(res.data);
      setSelectedModel(res.data.model);
      return res.data.dataset;
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch datasets first
        const datasetsRes = await axios.get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = datasetsRes.data;
        let list: Dataset[] = [];
        
        if (Array.isArray(data)) {
          list = data;
        } else if (typeof data === 'object' && data !== null) {
          list = Object.values(data) as Dataset[];
        }

        // Sort by creation date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDatasets(list);

        // Fetch models
        const modelsRes = await axios.get<models>(`${API_BASE_URL}models/names`);

        const models = modelsRes.data.data;

        if (Array.isArray(models) && models.length > 0) {
          setModels(models);
          setSelectedModel(models[0]); // Set default model
        }

        // Now fetch history and set dataset
        const historyDatasetId = await fetchHistory();
        if (historyDatasetId && list.some(d => d._id === historyDatasetId)) {
          setSelectedDataset(historyDatasetId);
        }

      } catch (error) {
        console.error('Failed to initialize data:', error);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setIsInitialized(true);
      }
    };

    if (token) {
      initializeData();
    }
  }, [token]);

  // Add loading states and memoization
  const isFormValid = selectedDataset && selectedModel && query.trim();
  const isSubmitDisabled = loading || !isFormValid;

  // Improved error handling and async logic
  async function handleSend() {
  if (!selectedDataset || !selectedModel || !query.trim()) return;

  const formData = new FormData();
  formData.append('datasetId', selectedDataset);
  formData.append('model', selectedModel);
  formData.append('query', query);

  // Add optimistic update
  if (history) {
    const newMessage = { prompt: query, answer: '' };
    setHistory(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : prev);
  }

  setLoading(true);
  setError(null); // Clear previous errors
  
  try {
    const res = await axios.post<RagResponse>(
      `${PYTHON_API_URL}models/rag-query-history`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (history) {
      setHistory(prev => prev ? {
        ...prev,
        messages: prev.messages.map((msg, idx) => 
          idx === prev.messages.length - 1 
            ? { ...msg, answer: res.data.answer }
            : msg
        )
      } : prev);
    }

  } catch (err) {
    console.error('Error sending message:', err);
    
    // Remove the optimistic message on error
    if (history) {
      setHistory(prev => prev ? {
        ...prev,
        messages: prev.messages.slice(0, -1)
      } : prev);
    }

    const apiError = err as ApiError;
    if (apiError.response?.status === 401) {
      setError('Session expired. Please log in again.');
      setTimeout(() => navigate('/auth/login'), 2000);
    } else {
      const errorMessage = apiError.response?.data?.message || 'Failed to send message. Please try again.';
      setError(errorMessage);
    }

  } finally {
    setLoading(false);
    setQuery(''); // Clear input
    
    // Improved scroll and focus management
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      const input = document.querySelector('textarea[placeholder="Type your question…"]') as HTMLTextAreaElement;
      input?.focus();
    }, 100);
  }
}


  return (
    <>
      <Box display="flex" flexDirection="column" height="auto" gap={2}>
        {/* Fixed Controls Panel */}
        <Box
          component={Paper}
          position="fixed"
          top={80}
          left={0}
          right={600}
          zIndex={10}
          elevation={2}
          p={2}
          display="flex"
          gap={2}
          alignItems="center"
          sx={{
            maxWidth: 600,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="dataset-label">Dataset</InputLabel>
            <Select
              labelId="dataset-label"
              label="Dataset"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              disabled={loading}
            >
              {datasets.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="model-label">Model</InputLabel>
            <Select
              labelId="model-label"
              label="Model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading}
            >
              {models.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Conversation History */}
        <Box
          flexGrow={1}
          overflow="auto"
          minHeight="65vh"
          px={2}
          pt={10} // Add padding for fixed header
        >
          {!isInitialized ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : history ? (
            <History messages={history} />
          ) : (
            <Box textAlign="center" mt={4} color="text.secondary">
              Start a conversation by selecting a dataset and asking a question.
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2 }}>
            {error}
          </Alert>
        )}

        {/* Input Area */}
        <Box
          component={Paper}
          elevation={4}
          p={2}
          display="flex"
          alignItems="flex-end"
          gap={2}
        >
          <TextField
            fullWidth
            placeholder="Type your question…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            multiline
            maxRows={4}
            disabled={loading || !selectedDataset || !isInitialized}
            aria-label="Question input"
            error={!selectedDataset && isInitialized}
            helperText={
              !isInitialized 
                ? "Loading..." 
                : !selectedDataset 
                  ? "Please select a dataset first" 
                  : ""
            }
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isSubmitDisabled || !isInitialized}
            aria-label={loading ? "Sending message" : "Send message"}
            sx={{ minWidth: 80 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
