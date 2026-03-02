import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Link } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Props {
  latitude: number;
  longitude: number;
  courseName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Map failed to load:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { latitude, longitude, courseName } = this.props;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      return (
        <Box
          sx={{
            height: 300,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.50',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Map unavailable
          </Typography>
          <Link
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
          >
            View {courseName} on Google Maps
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        </Box>
      );
    }

    return this.props.children;
  }
}
