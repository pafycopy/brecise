import { useWorkoutStore } from "@/store/supabaseWorkoutStore";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const toKey = (year: number, month: number, day: number) => {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

type DayStatus = "completed" | "missed" | "planned" | "today" | "normal";

const ActivityCalendar = () => {
  const { workoutsByDate } = useWorkoutStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getDayStatus = (d: number): DayStatus => {
    const key = toKey(year, month, d);
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    const workouts = workoutsByDate[key] ?? [];
    const isToday = cellDate.getTime() === today.getTime();
    const isPast = cellDate < today;

    if (workouts.length === 0) return isToday ? "today" : "normal";

    const hasCompleted = workouts.some((w) => w.status === "completed");
    if (hasCompleted) return "completed";
    if (isPast && !isToday) return "missed";
    return isToday ? "today" : "planned";
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Map status ke style yang sudah terdaftar di StyleSheet
  const dayCellStyleMap: Record<DayStatus, object> = {
    completed: styles.cellCompleted,
    missed: styles.cellMissed,
    planned: styles.cellPlanned,
    today: styles.cellToday,
    normal: styles.cellNormal,
  };

  const dayTextStyleMap: Record<DayStatus, object> = {
    completed: styles.textLight,
    missed: styles.textLight,
    planned: styles.textGreen,
    today: styles.textLight,
    normal: styles.textDark,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthText}>{monthName}</Text>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dayRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={styles.cell} />;

            const status = getDayStatus(day);

            return (
              <View key={col} style={styles.cell}>
                <View style={[styles.dayCell, dayCellStyleMap[status]]}>
                  <Text style={[styles.dayNumber, dayTextStyleMap[status]]}>
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotCompleted]} />
          <Text style={styles.legendText}>Selesai</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotPlanned]} />
          <Text style={styles.legendText}>Direncanakan</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotMissed]} />
          <Text style={styles.legendText}>Terlewat</Text>
        </View>
      </View>
    </View>
  );
};

export default ActivityCalendar;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "Lexend-Bold",
  },
  navRow: { flexDirection: "row", gap: 4 },
  navBtn: { padding: 4 },
  dayRow: { flexDirection: "row", marginBottom: 6 },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    color: "#999",
    fontFamily: "Lexend-Bold",
    fontWeight: "600",
  },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1, alignItems: "center" },

  // Base — borderRadius WAJIB ada di sini dan di setiap cellXxx
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Status cells — semuanya punya borderRadius: 16 eksplisit
  cellNormal: { borderRadius: 6 },
  cellCompleted: { borderRadius: 6, backgroundColor: "#2E7D32" },
  cellMissed: { borderRadius: 6, backgroundColor: "#FF9800" },
  cellPlanned: { borderRadius: 6, backgroundColor: "#6BFF8F" },
  cellToday: { borderRadius: 6, backgroundColor: "#1A1A1A" },

  // Text
  dayNumber: { fontSize: 12, fontWeight: "500", fontFamily: "Lexend-Regular" },
  textLight: { color: "#fff", fontWeight: "700", fontFamily: "Lexend-Bold" },
  textGreen: { color: "#2E7D32", fontWeight: "600", fontFamily: "Lexend-Bold" },
  textDark: { color: "#333", fontWeight: "500", fontFamily: "Lexend-Regular" },

  // Legend
  legend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  dotCompleted: { backgroundColor: "#2E7D32" },
  dotPlanned: { backgroundColor: "#6BFF8F" },
  dotMissed: { backgroundColor: "#FF9800" },
  legendText: { fontSize: 11, color: "#888", fontFamily: "Lexend-Regular" },
});
