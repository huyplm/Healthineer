import { Box, Typography } from '@mui/material';

export function AdminHome() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Admin
      </Typography>
      <Typography color="text.secondary">
        Choose an item from the sidebar menu
      </Typography>
    </Box>
  );
}
