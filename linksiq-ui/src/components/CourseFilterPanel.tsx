import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Slider,
  Switch,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Select,
  MenuItem,
  Badge,
  Divider,
} from "@mui/material";
import type { FilterState } from "../hooks/useCourseFilters";
import { SLOPE_RANGE, RATING_RANGE, YARDAGE_RANGE } from "../hooks/useCourseFilters";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

interface Props {
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  resultCount?: number;
  isMobile?: boolean;
  onApply?: () => void;
}

interface RangeFilterSectionProps {
  label: string;
  range: [number, number];
  value: [number | null, number | null];
  step?: number;
  marks: { value: number; label: string }[];
  onChange: (min: number | null, max: number | null) => void;
  formatLabel?: (v: number) => string;
}

function RangeFilterSection({
  label,
  range,
  value,
  step = 1,
  marks,
  onChange,
  formatLabel,
}: RangeFilterSectionProps) {
  const effectiveMin = value[0] ?? range[0];
  const effectiveMax = value[1] ?? range[1];
  const [local, setLocal] = useState<[number, number]>([effectiveMin, effectiveMax]);
  const isActive = value[0] != null || value[1] != null;

  const handleChange = useCallback((_: unknown, newValue: number | number[]) => {
    setLocal(newValue as [number, number]);
  }, []);

  const handleCommit = useCallback(
    (_: unknown, newValue: number | number[]) => {
      const [min, max] = newValue as [number, number];
      onChange(
        min === range[0] ? null : min,
        max === range[1] ? null : max
      );
    },
    [onChange, range]
  );

  // Sync local state if URL changes externally
  const syncedMin = value[0] ?? range[0];
  const syncedMax = value[1] ?? range[1];
  if (local[0] !== syncedMin && !document.querySelector(".MuiSlider-active")) {
    // Only sync if slider is not being dragged
    if (Math.abs(local[0] - syncedMin) > step) {
      setLocal([syncedMin, local[1]]);
    }
  }
  if (local[1] !== syncedMax && !document.querySelector(".MuiSlider-active")) {
    if (Math.abs(local[1] - syncedMax) > step) {
      setLocal([local[0], syncedMax]);
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Typography>
        {isActive && (
          <Typography variant="caption" sx={{ color: "secondary.main", fontWeight: 600 }}>
            {formatLabel ? formatLabel(local[0]) : local[0]} – {formatLabel ? formatLabel(local[1]) : local[1]}
          </Typography>
        )}
      </Box>
      <Box sx={{ px: 1 }}>
        <Slider
          value={local}
          min={range[0]}
          max={range[1]}
          step={step}
          marks={marks}
          onChange={handleChange}
          onChangeCommitted={handleCommit}
          valueLabelDisplay="auto"
          valueLabelFormat={formatLabel}
          size="small"
          sx={{
            "& .MuiSlider-markLabel": {
              fontSize: "0.65rem",
              color: "text.disabled",
            },
          }}
        />
      </Box>
    </Box>
  );
}

export function CourseFilterPanel({
  filters,
  setFilters,
  clearAllFilters,
  activeFilterCount,
  resultCount,
  isMobile,
  onApply,
}: Props) {
  return (
    <Box sx={{ p: isMobile ? 2.5 : 0 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Badge badgeContent={activeFilterCount} color="secondary" sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem" } }} />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={clearAllFilters} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}>
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Holes */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
          Holes
        </Typography>
        <ToggleButtonGroup
          value={filters.holes ?? "all"}
          exclusive
          onChange={(_, val) => setFilters({ holes: val === "all" ? null : val })}
          size="small"
          fullWidth
        >
          <ToggleButton value="all" sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}>All</ToggleButton>
          <ToggleButton value={9} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}>9</ToggleButton>
          <ToggleButton value={18} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}>18</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Slope Rating */}
      <RangeFilterSection
        label="Slope Rating"
        range={SLOPE_RANGE}
        value={[filters.slope_min, filters.slope_max]}
        marks={[
          { value: 93, label: "93" },
          { value: 113, label: "113" },
          { value: 130, label: "130" },
          { value: 150, label: "150" },
        ]}
        onChange={(min, max) => setFilters({ slope_min: min, slope_max: max })}
      />

      <Divider sx={{ mb: 2.5 }} />

      {/* Course Rating */}
      <RangeFilterSection
        label="Course Rating"
        range={RATING_RANGE}
        value={[filters.rating_min, filters.rating_max]}
        step={0.5}
        marks={[
          { value: 55, label: "55" },
          { value: 60, label: "60" },
          { value: 65, label: "65" },
          { value: 70, label: "70" },
          { value: 75, label: "75" },
        ]}
        onChange={(min, max) => setFilters({ rating_min: min, rating_max: max })}
        formatLabel={(v) => v.toFixed(1)}
      />

      <Divider sx={{ mb: 2.5 }} />

      {/* Yardage */}
      <RangeFilterSection
        label="Yardage"
        range={YARDAGE_RANGE}
        value={[filters.yardage_min, filters.yardage_max]}
        step={100}
        marks={[
          { value: 3000, label: "3k" },
          { value: 4500, label: "4.5k" },
          { value: 6000, label: "6k" },
          { value: 7500, label: "7.5k" },
        ]}
        onChange={(min, max) => setFilters({ yardage_min: min, yardage_max: max })}
        formatLabel={(v) => v.toLocaleString()}
      />

      <Divider sx={{ mb: 2.5 }} />

      {/* Has Intel */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.has_intel}
              onChange={(_, checked) => setFilters({ has_intel: checked })}
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Has Intel
            </Typography>
          }
        />
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* State */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
          State
        </Typography>
        <Select
          value={filters.state || "all"}
          onChange={(e) => setFilters({ state: e.target.value === "all" ? "" : e.target.value })}
          size="small"
          fullWidth
        >
          <MenuItem value="all">All States</MenuItem>
          {US_STATES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Mobile: Show Results button */}
      {isMobile && (
        <Button
          variant="contained"
          fullWidth
          onClick={onApply}
          sx={{ mt: 1, py: 1.5, fontWeight: 700 }}
        >
          Show {resultCount != null ? `${resultCount} ` : ""}Results
        </Button>
      )}
    </Box>
  );
}
