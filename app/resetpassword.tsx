import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase auto-handle session saat deep link dibuka
    // Event PASSWORD_RECOVERY akan terpanggil otomatis
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Timeout fallback: kalau 5 detik belum ada event, cek session manual
    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setSessionReady(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password tidak cocok', 'Pastikan kedua password sama.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── WAITING FOR SESSION ───────────────────────────────────────────────────
  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#6BFF8F" size="large" />
          <Text style={styles.waitingText}>Memverifikasi link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#111" />
          </View>
          <Text style={styles.successTitle}>Password Berhasil Diubah!</Text>
          <Text style={styles.successSubtitle}>
            Sekarang kamu bisa masuk dengan password baru kamu.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/auth')}
          >
            <Text style={styles.btnPrimaryText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── RESET FORM ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.formLogoWrapper}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>B</Text>
                <View style={styles.logoDumbbell}>
                  <Ionicons name="barbell" size={18} color="#4ADE80" />
                </View>
              </View>
              <Text style={styles.appName}>Brecise</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Buat Password Baru</Text>
              <Text style={styles.subtitle}>
                Masukkan password baru kamu. Pastikan minimal 6 karakter.
              </Text>
            </View>

            {/* Fields */}
            <View style={styles.fields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password Baru</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CCC"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color="#AAA"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
                <View style={[
                  styles.inputRow,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError
                ]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CCC"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color="#AAA"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.errorText}>Password tidak cocok</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.btnPrimaryText}>Simpan Password Baru</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  centerContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  waitingText: { fontSize: 14, color: '#888', marginTop: 8, fontFamily: 'Lexend-Regular' },

  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#6BFF8F',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', fontFamily: 'Lexend-Black' },
  successSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, fontFamily: 'Lexend-Regular' },

  formContainer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },

  formLogoWrapper: { alignItems: 'center', gap: 10, marginBottom: 32 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  logoText: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', lineHeight: 52, fontFamily: 'Lexend-Black' },
  logoDumbbell: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: '#111', borderRadius: 20, padding: 4,
  },
  appName: { fontSize: 20, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },

  header: { marginBottom: 28, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', fontFamily: 'Lexend-Black' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, fontFamily: 'Lexend-Regular' },

  fields: { gap: 16, marginBottom: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.3, fontFamily: 'Lexend-Bold' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F7F7', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  inputError: { borderColor: '#FF6B6B' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111', fontFamily: 'Lexend-Regular' },
  errorText: { fontSize: 11, color: '#FF6B6B', fontWeight: '600', fontFamily: 'Lexend-Bold' },

  btnPrimary: {
    backgroundColor: '#6BFF8F', borderRadius: 40,
    height: 54, width: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
});