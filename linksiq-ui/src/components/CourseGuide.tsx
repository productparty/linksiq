import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button, CircularProgress } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import type { CourseGuide } from "../types/course";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#1a2332",
  },
  courseName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1a2332",
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 12,
    color: "#5a6577",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    fontSize: 10,
    color: "#5a6577",
  },
  narrative: {
    fontSize: 10,
    marginBottom: 16,
    lineHeight: 1.6,
    color: "#333",
  },
  holeSection: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  holeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  holeTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a2332",
  },
  holePar: {
    fontSize: 11,
    color: "#5a6577",
  },
  yardageRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  yardageRowAlt: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: "#f5f5f5",
  },
  yardageLabel: {
    width: 100,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  yardageValue: {
    width: 60,
    fontSize: 9,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#1a2332",
    marginTop: 4,
  },
  sectionText: {
    fontSize: 9,
    color: "#333",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
  },
});

function CourseGuidePdfDocument({ guide }: { guide: CourseGuide }) {
  const location = [guide.city, guide.state].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.courseName}>{guide.name}</Text>
          {location && <Text style={styles.courseLocation}>{location}</Text>}
          <View style={styles.statsRow}>
            {guide.total_par && (
              <Text style={styles.stat}>Par {guide.total_par}</Text>
            )}
            {guide.total_yardage && (
              <Text style={styles.stat}>
                {guide.total_yardage.toLocaleString()} yds
              </Text>
            )}
            {guide.slope_rating && (
              <Text style={styles.stat}>Slope {guide.slope_rating}</Text>
            )}
            {guide.course_rating && (
              <Text style={styles.stat}>Rating {guide.course_rating}</Text>
            )}
          </View>
        </View>

        {/* Narrative */}
        {guide.walkthrough_narrative && (
          <Text style={styles.narrative}>{guide.walkthrough_narrative}</Text>
        )}

        {/* Holes */}
        {guide.holes.map((hole) => (
          <View
            key={hole.hole_number}
            style={styles.holeSection}
            wrap={false}
          >
            <View style={styles.holeHeader}>
              <Text style={styles.holeTitle}>
                Hole {hole.hole_number}
              </Text>
              <Text style={styles.holePar}>
                Par {hole.par}
                {hole.handicap_rating ? ` | HCP ${hole.handicap_rating}` : ""}
              </Text>
            </View>

            {/* Yardages */}
            {hole.yardage_by_tee?.tees?.map((tee, i) => (
              <View
                key={tee.name}
                style={i % 2 === 0 ? styles.yardageRow : styles.yardageRowAlt}
              >
                <Text style={styles.yardageLabel}>{tee.name}</Text>
                <Text style={styles.yardageValue}>
                  {tee.yardage ? `${tee.yardage} yds` : "—"}
                </Text>
              </View>
            ))}

            {hole.terrain_description && (
              <>
                <Text style={styles.sectionLabel}>Terrain</Text>
                <Text style={styles.sectionText}>
                  {hole.terrain_description}
                </Text>
              </>
            )}
            {hole.strategic_tips && (
              <>
                <Text style={styles.sectionLabel}>Strategy</Text>
                <Text style={styles.sectionText}>{hole.strategic_tips}</Text>
              </>
            )}
            {hole.green_details && (
              <>
                <Text style={styles.sectionLabel}>Green</Text>
                <Text style={styles.sectionText}>{hole.green_details}</Text>
              </>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>LinksIQ Course Guide</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export function CourseGuidePdf({ guide }: { guide: CourseGuide }) {
  const filename = `${guide.name.replace(/[^a-zA-Z0-9]/g, "_")}_guide.pdf`;

  return (
    <PDFDownloadLink
      document={<CourseGuidePdfDocument guide={guide} />}
      fileName={filename}
    >
      {({ loading }) => (
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} /> : <PictureAsPdfIcon />}
          disabled={loading}
        >
          {loading ? "Generating PDF..." : "Download PDF Guide"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
