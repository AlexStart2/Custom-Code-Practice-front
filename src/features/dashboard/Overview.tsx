// src/features/dashboard/Overview.tsx
import { Box, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';


// In  the future can add progree bars, charts, or other visualizations

export default function Overview() { 
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
                <Typography variant="h3">--</Typography>
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
              <Typography variant="h3">--</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Models Trained
              </Typography>
              <Typography variant="h3">--</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Upcoming Tasks
              </Typography>
              <Typography variant="h3">--</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
