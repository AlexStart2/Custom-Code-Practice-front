// src/features/dashboard/Overview.tsx
import { Box, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import type { Dataset } from './Datasets';
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';
import type { JobResult } from './JobStatus';


// In  the future can add progree bars, charts, or other visualizations

const API_BASE_URL = import.meta.env.VITE_API_URL;


export default function Overview() {

  const [datasets, setDatasets] = useState<number>(0);
  const [jobs, setJobs] = useState<number>(0);

  const fetchDatasets = async () => {
    try {
      const response = await axios.get<Dataset[]>(`${API_BASE_URL}datasets/get-user-datasets`);
      const data = response.data;
      let list: Dataset[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (typeof data === 'object') {
        // If keyed by id
        list = Object.values(data) as Dataset[];
      }
      console.log('Fetched datasets:', list);
      setDatasets(list.length);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };
  

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get<JobResult>(`${API_BASE_URL}datasets/jobs`);

      const data = res.data.job.filter(job => job.status === 'processing' || job.status === 'pending');

      setJobs(data.length);
    } catch (e: any) {
      console.error('Failed to fetch jobs:', e.response?.data?.message || e.message);
    }
  }, [API_BASE_URL]);

  // Poll every 2s
  useEffect(() => {
    fetchJobs();
    fetchDatasets();
    const iv = window.setInterval(fetchJobs, 2000);
    return () => clearInterval(iv);
  }, [fetchJobs]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      {/* Example stats - replace with real data components */}
      <Grid container spacing={2}>
        <Grid>
          <Item>
              <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Total Datasets
                </Typography>
                <Typography variant="h3">{datasets}</Typography>
              </CardContent>
            </Card>
          </Item>
        </Grid>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Active Jobs
              </Typography>
              <Typography variant="h3">{jobs}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
