import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";

type Props = {
  day: string;
  date: number;
  active?: boolean;
  hasWorkout?: boolean;
  isMissed?: boolean; // workout ada tapi tanggal sudah lewat & belum selesai
  onPress?: () => void;
};

const DayCard = ({ day, date, active, hasWorkout = false, isMissed = false, onPress }: Props) => {
  // Tentukan warna dot:
  // - oranye  : ada workout tapi terlewat
  // - hijau   : ada workout, belum terlewat
  // - transparan : tidak ada workout
  const dotColor = !hasWorkout
    ? 'transparent'
    : isMissed
    ? '#FF9800'
    : '#4CD964';

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, active && styles.active]}>
        <Text style={[styles.day, active && styles.activeText]}>{day}</Text>
        <Text style={[styles.date, active && styles.activeText]}>{date}</Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>
    </TouchableOpacity>
  );
};

export default DayCard;

const styles = StyleSheet.create({
  card: {
    width: 60, height: 80, overflow: "hidden",
    borderRadius: 12, borderWidth: 1, borderColor: "#C6C6CD4D",
    backgroundColor: Colors.light.background,
    justifyContent: "center", alignItems: "center", marginRight: 6,
  },
  active: { backgroundColor: "#000" },
  day: { fontSize: 12, color: "#333" },
  date: { fontSize: 16, fontWeight: "bold", color: "#333" },
  activeText: { color: "#fff" },
  dot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 4,
  },
});