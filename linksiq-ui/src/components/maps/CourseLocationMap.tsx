import { useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { Box, Link, Typography } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SATELLITE_STYLE, MAP_MARKER_COLOR, MAP_DEFAULT_ZOOM } from './constants';

interface CourseLocationMapProps {
  latitude: number;
  longitude: number;
  courseName: string;
  city?: string | null;
  state?: string | null;
}

export default function CourseLocationMap({
  latitude,
  longitude,
  courseName,
  city,
  state,
}: CourseLocationMapProps) {
  const [showPopup, setShowPopup] = useState(false);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <Box>
      <Box sx={{ borderRadius: 2, overflow: 'hidden', height: { xs: 250, md: 300 } }}>
        <Map
          initialViewState={{
            longitude,
            latitude,
            zoom: MAP_DEFAULT_ZOOM,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={SATELLITE_STYLE}
          scrollZoom={false}
        >
          <NavigationControl position="top-right" />

          <Marker
            longitude={longitude}
            latitude={latitude}
            color={MAP_MARKER_COLOR}
            onClick={() => setShowPopup(true)}
          />

          {showPopup && (
            <Popup
              longitude={longitude}
              latitude={latitude}
              onClose={() => setShowPopup(false)}
              closeOnClick={false}
              anchor="bottom"
            >
              <strong>{courseName}</strong>
              {city && state && <div>{city}, {state}</div>}
            </Popup>
          )}
        </Map>
      </Box>
      <Box sx={{ mt: 1 }}>
        <Link
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <DirectionsIcon sx={{ fontSize: 18 }} />
          <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
            Get Directions
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}
