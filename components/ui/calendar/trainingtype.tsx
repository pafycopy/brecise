import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Pisahkan library icon dan nama icon sebagai string
export type IconLibrary = 'material' | 'ionicons';

export type WorkoutType = {
  id: number;
  label: string;
  iconName: string;
  iconLib: IconLibrary;
  iconBg: string;
  icon: string;       // ← Wajib agar cocok dengan WorkoutCategory
  active?: boolean;
};

type TrainingTypeProps = {
  onSelect: (workout: WorkoutType) => void;
};

const workoutTypes: WorkoutType[] = [
  {
  id: 1,
  label: 'Easy Run',
  iconName: 'directions-run',
  iconLib: 'material',
  iconBg: '#E8E8E8',
  icon: 'directions-run',  // ← duplikat iconName, hanya untuk satisfying WorkoutCategory
},
  {
    id: 2,
    label: 'Long Run',
    iconName: 'sync',
    iconLib: 'material',
    iconBg: '#cfc9f1',
    icon: 'sync', 
  },
  {
    id: 3,
    label: 'Tempo Run',
    iconName: 'speed',
    iconLib: 'material',
    iconBg: '#C8F5C8',
    icon: 'speed',
  },
  {
    id: 4,
    label: 'Interval Run',
    iconName: 'timer',
    iconLib: 'material',
    iconBg: '#f3c0c0',
    icon: 'timer',
  },
  {
    id: 5,
    label: 'Strength Training',
    iconName: 'barbell',
    iconLib: 'ionicons',
    iconBg: '#FFE8D6',
    icon: 'barbell',
  },
];

// Komponen helper untuk render icon berdasarkan lib + name
function WorkoutIcon({ iconName, iconLib }: { iconName: string; iconLib: IconLibrary }) {
  if (iconLib === 'ionicons') {
    return <Ionicons name={iconName as any} size={24} color="black" />;
  }
  return <MaterialIcons name={iconName as any} size={24} color="black" />;
}

export default function TrainingType({ onSelect }: TrainingTypeProps) {
  const [selected, setSelected] = useState<number>(3);

  const handlePress = (item: WorkoutType) => {
    setSelected(item.id);
    onSelect(item);
  };

  return (
    <View style={styles.grid}>
      {workoutTypes.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => handlePress(item)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
            <WorkoutIcon iconName={item.iconName} iconLib={item.iconLib} />
          </View>
          <Text style={styles.cardLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
});