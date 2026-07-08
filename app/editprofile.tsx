import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '@/store/userStore';

const GENDER_OPTIONS = ['Pria', 'Wanita', 'Memilih tidak mengatakan'];

const EditProfileScreen = () => {
  const {
    name, location, avatarUri, birthDate, gender, weightKg, userId,
    setName, setLocation, setAvatarUri, setBirthDate, setGender, setWeightKg,
    saveToSupabase,
  } = useUserStore();

  const [city, setCity] = useState(location.split(',')[0]?.trim() ?? '');
  const [country, setCountry] = useState(location.split(',')[1]?.trim() ?? '');
  const [localName, setLocalName] = useState(name);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUri);
  const [localGender, setLocalGender] = useState(gender ?? '');
  const [localWeight, setLocalWeight] = useState(weightKg ?? '');
  const [loading, setLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // ── Date Picker ─────────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localBirthDate, setLocalBirthDate] = useState<Date | null>(
    birthDate ? new Date(birthDate) : null
  );

  // ✅ FIX: state lokal di atas cuma di-seed SEKALI dari store pas komponen
  // pertama mount (React useState initial value hanya dipakai di render
  // pertama). Kalau userId di store berubah (ganti akun), field2 ini gak
  // pernah ke-refresh, jadi form ini masih nampilin data akun LAMA meskipun
  // store globalnya sudah benar (itu yang bikin "nama dan isi lainnya ga
  // reset" walau ProfileHeader di dashboard sudah benar).
  // Solusinya: re-seed semua state lokal setiap kali userId berubah.
  useEffect(() => {
    setLocalName(name);
    setCity(location.split(',')[0]?.trim() ?? '');
    setCountry(location.split(',')[1]?.trim() ?? '');
    setLocalAvatar(avatarUri);
    setLocalGender(gender ?? '');
    setLocalWeight(weightKg ?? '');
    setLocalBirthDate(birthDate ? new Date(birthDate) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setLocalBirthDate(selectedDate);
  };

  // ── Foto ────────────────────────────────────────────────────────────────
  const handleCamera = async () => {
    setShowActionSheet(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin diperlukan', 'Aktifkan izin kamera.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setLocalAvatar(result.assets[0].uri);
  };

  const handleGallery = async () => {
    setShowActionSheet(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin diperlukan', 'Aktifkan izin galeri.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setLocalAvatar(result.assets[0].uri);
  };

  // ── Simpan ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!localName.trim()) { Alert.alert('Nama tidak boleh kosong'); return; }

    setLoading(true);

    const newLocation = [city.trim(), country.trim()].filter(Boolean).join(', ');
    const parsedDate = localBirthDate
      ? localBirthDate.toISOString().split('T')[0] // → "YYYY-MM-DD"
      : null;

    setName(localName.trim());
    setLocation(newLocation || location);
    if (localAvatar) setAvatarUri(localAvatar);
    setBirthDate(parsedDate ?? '');
    setGender(localGender);
    setWeightKg(localWeight);

    await saveToSupabase({
      name: localName.trim(),
      location: newLocation || location,
      avatarUri: localAvatar,
      birthDate: parsedDate,
      gender: localGender || null,
      weightKg: localWeight || null,
    });

    setLoading(false);
    router.back();
  };

  const originalBirthDate = birthDate ? new Date(birthDate) : null;
  const hasChanges =
    localName !== name ||
    city !== (location.split(',')[0]?.trim() ?? '') ||
    country !== (location.split(',')[1]?.trim() ?? '') ||
    localAvatar !== avatarUri ||
    localBirthDate?.toISOString() !== originalBirthDate?.toISOString() ||
    localGender !== (gender ?? '') ||
    localWeight !== (weightKg ?? '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profil</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowActionSheet(true)} activeOpacity={0.85}>
            <Image
              source={{ uri: localAvatar ?? 'https://www.gravatar.com/avatar/?d=mp&s=200' }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View style={styles.form}>

            {/* Nama */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} value={localName} onChangeText={setLocalName}
                  placeholder="Masukkan nama lengkap" placeholderTextColor="#bbb"
                  maxLength={40} returnKeyType="next"
                />
              </View>
            </View>

            {/* Kota */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kota</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} value={city} onChangeText={setCity}
                  placeholder="Kota" placeholderTextColor="#bbb" maxLength={50} returnKeyType="next"
                />
              </View>
            </View>

            {/* Negara */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Negara</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="globe-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} value={country} onChangeText={setCountry}
                  placeholder="Negara" placeholderTextColor="#bbb" maxLength={50} returnKeyType="next"
                />
              </View>
            </View>

            {/* Preview lokasi */}
            {(city || country) && (
              <View style={styles.previewRow}>
                <Ionicons name="location-sharp" size={13} color="#2E7D32" />
                <Text style={styles.previewText}>{[city, country].filter(Boolean).join(', ')}</Text>
              </View>
            )}

            {/* Tanggal Lahir */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tanggal Lahir</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color="#999" style={styles.inputIcon} />
                <Text style={[styles.input, {
                  lineHeight: 52,
                  color: localBirthDate ? '#1A1A1A' : '#bbb',
                }]}>
                  {localBirthDate ? formatDisplayDate(localBirthDate) : 'Pilih tanggal lahir'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#999" />
              </TouchableOpacity>
            </View>

    {/* Jenis Kelamin */}
<View style={styles.fieldGroup}>
  <Text style={styles.label}>Jenis Kelamin</Text>
  <TouchableOpacity
    style={styles.inputWrapper}
    onPress={() => setShowGenderPicker((prev) => !prev)}
    activeOpacity={0.8}
  >
    <Ionicons name="people-outline" size={18} color="#999" style={styles.inputIcon} />
    <Text style={[styles.input, {
      lineHeight: 52,
      color: localGender ? '#1A1A1A' : '#bbb',
    }]}>
      {localGender || 'Pilih jenis kelamin'}
    </Text>
    <Ionicons
      name={showGenderPicker ? 'chevron-up' : 'chevron-down'}
      size={16} color="#999"
    />
  </TouchableOpacity>

  {/* ✅ Dropdown dengan radio button */}
  {showGenderPicker && (
    <View style={styles.radioCard}>
      <Text style={styles.radioCardTitle}>JENIS KELAMIN</Text>
      {GENDER_OPTIONS.map((opt, index) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.radioItem,
            index < GENDER_OPTIONS.length - 1 && styles.radioItemBorder,
          ]}
          onPress={() => {
            setLocalGender(opt);
            setShowGenderPicker(false);
          }}
          activeOpacity={0.7}
        >
          <View style={[
            styles.radioCircle,
            localGender === opt && styles.radioCircleActive,
          ]}>
            {localGender === opt && <View style={styles.radioDot} />}
          </View>
          <Text style={[
            styles.radioText,
            localGender === opt && styles.radioTextActive,
          ]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}
</View>

            {/* Berat */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Berat (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="barbell-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input} value={localWeight} onChangeText={setLocalWeight}
                  placeholder="Berat (kg)" placeholderTextColor="#bbb"
                  keyboardType="numeric" maxLength={5} returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

          </View>

          {/* Simpan */}
          <TouchableOpacity
            style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Date Picker ── */}
        {showDatePicker && (
          <DateTimePicker
            value={localBirthDate ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1940, 0, 1)}
            onChange={onDateChange}
          />
        )}

        {/* ── Action Sheet Foto ── */}
        <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={() => setShowActionSheet(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>EDIT FOTO PROFIL</Text>
              <TouchableOpacity style={styles.modalItem} onPress={handleCamera}>
                <Text style={styles.modalItemText}>Ambil Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={handleGallery}>
                <Text style={styles.modalItemText}>Pilih Dari Galeri</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  content: { paddingHorizontal: 16, paddingTop: 28, fontFamily: 'Lexend-Regular' },
  avatarWrapper: { alignSelf: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#E8F5E9' },
  form: { gap: 18, marginBottom: 28 },
  fieldGroup: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginLeft: 2, fontFamily: 'Lexend-Bold' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8E8E8',
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', fontFamily: 'Lexend-Regular' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -6, marginLeft: 2 },
  previewText: { fontSize: 12, color: '#2E7D32', fontWeight: '500', fontFamily: 'Lexend-Regular' },
  saveBtn: { backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#A5D6A7' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Lexend-Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 270, backgroundColor: '#FFF', borderRadius: 4, paddingVertical: 12, paddingHorizontal: 12, elevation: 5 },
  modalTitle: { fontSize: 12, fontWeight: '700', color: '#222', letterSpacing: 1.5, marginBottom: 12 },
  modalItem: { paddingVertical: 8 },
  modalItemText: { fontSize: 14, color: '#222' },
  genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdown: {
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: '#E8E8E8',
  overflow: 'hidden',
  marginTop: 4,
},
radioCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: '#E8E8E8',
  overflow: 'hidden',
  marginTop: 4,
  paddingHorizontal: 14,
  paddingTop: 12,
},
radioCardTitle: {
  fontSize: 12,
  fontWeight: '700',
  color: '#222', fontFamily: 'Lexend-Bold',
  letterSpacing: 1.5,
  marginBottom: 8,
},
radioItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  gap: 12,
},
radioItemBorder: {
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
},
radioCircle: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#D0D0D0',
  alignItems: 'center',
  justifyContent: 'center',
},
radioCircleActive: {
  borderColor: '#2E7D32',
},
radioDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#2E7D32',
},
radioText: {
  fontSize: 15,
  color: '#1A1A1A', fontFamily: 'Lexend-Regular',
},
radioTextActive: {
  color: '#2E7D32',
  fontWeight: '600', fontFamily: 'Lexend-Bold',
},
});