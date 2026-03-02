import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';
import { Skeleton } from '@mui/material';
import { MapErrorBoundary } from './MapErrorBoundary';

const LazyCourseLocationMap = lazy(() => import('./CourseLocationMap'));

type CourseLocationMapProps = ComponentProps<typeof LazyCourseLocationMap>;

export function CourseLocationMap(props: CourseLocationMapProps) {
  return (
    <MapErrorBoundary
      latitude={props.latitude}
      longitude={props.longitude}
      courseName={props.courseName}
    >
      <Suspense
        fallback={
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
        }
      >
        <LazyCourseLocationMap {...props} />
      </Suspense>
    </MapErrorBoundary>
  );
}
