import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TouchableWithoutFeedback, Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAssessmentStore } from '@/store/assessmentStore';
import { checkProStatus } from '@/lib/proService';

WebBrowser.maybeCompleteAuthSession();

const PRIVACY_URL = 'https://pafycopy.github.io/brecise-privacy/';

type Screen = 'splash' | 'register' | 'login' | 'forgot' | 'otp' | 'reset';

// ── Logo Component (reusable) ─────────────────────────────────────────────────
function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const imageStyle =
    size === 'lg' ? logoStyles.imageLg :
    size === 'md' ? logoStyles.imageMd :
    logoStyles.imageSm;

  return (
    <View style={logoStyles.wrapper}>
      <Image
        source={require('@/assets/images/breciselogo.png')}
        style={imageStyle}
        resizeMode="contain"
      />
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8, },
  imageLg: { width: 160, height: 160, marginLeft:16 },
  imageMd: { width: 80, height: 80, marginLeft:16 },
  imageSm: { width: 60, height: 60, marginLeft:16 },
  name: { fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  nameMd: { fontSize: 18 },
  nameSm: { fontSize: 15 },
});

// ── FormWrapper ───────────────────────────────────────────────────────────────
function FormWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { setName, syncFromSupabase: syncUserFromSupabase } = useUserStore();
  const { syncFromSupabase: syncAssessmentFromSupabase } = useAssessmentStore();

  const [screen, setScreen] = useState<Screen>('splash');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Inline validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const validatePasswordStrength = (val: string): string => {
    if (val.length < 6) return 'Password minimal 6 karakter';
    if (!/[A-Za-z]/.test(val)) return 'Password harus mengandung huruf';
    if (!/[0-9]/.test(val)) return 'Password harus mengandung angka';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) return 'Password harus mengandung simbol (!@#$%^&*)';
    return '';
  };

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    clearErrors();
    let hasError = false;

    if (!fullName.trim()) { setNameError('Nama tidak boleh kosong'); hasError = true; }
    if (!email.trim()) {
      setEmailError('Email tidak boleh kosong'); hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid'); hasError = true;
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) { setPasswordError(pwdErr); hasError = true; }
    if (hasError) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // PENTING: Supabase TIDAK mengembalikan error kalau email sudah terdaftar
      // (ini disengaja untuk mencegah "email enumeration attack"). Satu-satunya
      // penanda adalah data.user.identities menjadi array kosong.
      const isAlreadyRegistered = !!data.user && (data.user.identities?.length ?? 0) === 0;
      if (isAlreadyRegistered) {
        setEmailError('Email ini sudah terdaftar');
        Alert.alert(
          'Email sudah terdaftar',
          'Email ini sudah digunakan. Silakan masuk, atau gunakan alamat email lain.'
        );
        return;
      }

      setName(fullName.trim());
      Alert.alert('Berhasil', 'Cek email kamu untuk verifikasi akun');
    } catch (err: any) {
      Alert.alert('Register gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearErrors();
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email tidak boleh kosong'); hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid'); hasError = true;
    }
    if (!password) { setPasswordError('Password tidak boleh kosong'); hasError = true; }
    if (hasError) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Hydrate profil + assessment + status Pro dari Supabase setelah login
      await Promise.all([syncUserFromSupabase(), syncAssessmentFromSupabase(), checkProStatus()]);

      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Login gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setLoading(true);
      const redirectTo = 'brecise://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('OAuth URL tidak ditemukan');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const url = result.url;

        const hashParams = new URLSearchParams(url.split('#')[1] ?? '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (sessionError) throw sessionError;
        } else {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }

      const { data: sd } = await supabase.auth.getSession();
      if (sd?.session) {
        // Hydrate profil + assessment + status Pro dari Supabase setelah Google login
        await Promise.all([syncUserFromSupabase(), syncAssessmentFromSupabase(), checkProStatus()]);

        router.replace('/(tabs)/dashboard');
        return;
      }
    } catch (err: any) {
      Alert.alert('Google Login Error', err?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT: Kirim OTP ke email ────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email kosong', 'Masukkan email kamu terlebih dahulu.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setOtp(['', '', '', '', '', '']);
      setScreen('otp');
      startResendCooldown();
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Verifikasi kode ──────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Kode tidak lengkap', 'Masukkan 6 digit kode OTP.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'recovery',
      });
      if (error) throw error;
      setNewPassword('');
      setConfirmNewPassword('');
      setScreen('reset');
    } catch (err: any) {
      Alert.alert('Kode salah', 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  // ── RESET: Ganti password baru ────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Password tidak cocok', 'Pastikan kedua password sama.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      Alert.alert('Berhasil! 🎉', 'Password kamu berhasil diubah. Silakan masuk.', [
        {
          text: 'Masuk', onPress: () => {
            setEmail('');
            setPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setScreen('login');
          }
        }
      ]);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend cooldown timer ─────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setOtp(['', '', '', '', '', '']);
      startResendCooldown();
      Alert.alert('Terkirim', 'Kode OTP baru sudah dikirim ke email kamu.');
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handler ─────────────────────────────────────────────────────
  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (screen === 'splash') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.splashContainer}>
          <Logo size="lg" />
          <View style={styles.splashTextBlock}>
            <Text style={styles.splashTitle}>
              Pantau latihan lari{'\n'}dan progres{'\n'}kebugaran Anda
            </Text>
            <Text style={styles.splashSub}>Bangun kebiasaan sehat bersama Brecise</Text>
          </View>
          <View style={styles.splashButtons}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setScreen('register')}>
              <Text style={styles.btnPrimaryText}>Buat Akun</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={styles.splashLoginText}>
                Sudah Punya Akun?{' '}<Text style={styles.splashLoginBold}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
  if (screen === 'forgot') {
    return (
      <FormWrapper>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setEmail(''); setScreen('login'); }}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Logo size="md" />

        <View style={styles.screenHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="shield-checkmark" size={32} color="#6BFF8F" />
          </View>
          <Text style={styles.screenTitle}>Lupa Password</Text>
          <Text style={styles.screenSubtitle}>
            Masukkan alamat email Anda untuk mengatur ulang kata sandi. Kami akan mengirimkan tautan aman kepada Anda.
          </Text>
        </View>

        <View style={styles.fields}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email anda disini"
              placeholderTextColor="#CCC"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.btnPrimaryText}>Lanjut</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchRow} onPress={() => { setEmail(''); setScreen('login'); }}>
          <Text style={styles.switchText}>
            Masih ingat kata sandi Anda?{' '}<Text style={styles.switchBold}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </FormWrapper>
    );
  }

  // ── OTP SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'otp') {
    return (
      <FormWrapper>
        <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('forgot')}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Logo size="md" />

        <View style={styles.screenHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="key" size={32} color="#6BFF8F" />
          </View>
          <Text style={styles.screenTitle}>OTP</Text>
          <Text style={styles.screenSubtitle}>
            Masukkan kode 6 digit yang dikirimkan ke email{'\n'}
            <Text style={{ fontWeight: '700', color: '#333' }}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => { otpRefs.current[index] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={text => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.btnPrimaryText}>Lanjut</Text>}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.switchText}>Belum menerima kode apa pun?{'\n'}</Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={resendCooldown > 0}>
            <Text style={[styles.switchBold, resendCooldown > 0 && styles.resendDisabled]}>
              {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim ulang kode'}
            </Text>
          </TouchableOpacity>
        </View>
      </FormWrapper>
    );
  }

  // ── RESET PASSWORD ────────────────────────────────────────────────────────
  if (screen === 'reset') {
    return (
      <FormWrapper>
        <Logo size="md" />

        <View style={styles.screenHeader}>
          <View style={[styles.iconBadge, styles.iconBadgeGreen]}>
            <Ionicons name="checkmark" size={32} color="#111" />
          </View>
          <Text style={styles.screenTitle}>Atur ulang kata sandi</Text>
          <Text style={styles.screenSubtitle}>
            Kata Sandi Anda harus paling tidak 6 karakter dan harus menyertakan kombinasi huruf, angka, dan simbol (!@#$%^&*).
          </Text>
        </View>

        <View style={styles.fields}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="kata sandi baru"
              placeholderTextColor="#CCC"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.inputRow,
            confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && styles.inputRowError
          ]}>
            <TextInput
              style={styles.input}
              placeholder="konfirmasi kata sandi"
              placeholderTextColor="#CCC"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
            </TouchableOpacity>
          </View>
          {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
            <Text style={styles.errorText}>Kata sandi tidak cocok</Text>
          )}
        </View>

        <TouchableOpacity style={styles.switchRow} onPress={() => setScreen('login')}>
          <Text style={styles.switchText}>
            Masih ingat kata sandi Anda?{' '}<Text style={styles.switchBold}>Masuk</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.btnPrimaryText}>Lanjut</Text>}
        </TouchableOpacity>
      </FormWrapper>
    );
  }

  // ── LOGIN / REGISTER ──────────────────────────────────────────────────────
  const isRegister = screen === 'register';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('splash')}>
              <Ionicons name="arrow-back" size={20} color="#111" />
            </TouchableOpacity>

            <View style={styles.formLogoWrapper}>
              <Logo size="lg" />
            </View>

            <View style={styles.fields}>
              {isRegister && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                  <View style={[styles.inputRow, !!nameError && styles.inputRowError]}>
                    <Ionicons name="person-outline" size={18} color="#AAA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Masukan nama lengkap anda"
                      placeholderTextColor="#CCC"
                      value={fullName}
                      onChangeText={(v) => { setFullName(v); if (nameError) setNameError(''); }}
                    />
                  </View>
                  {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat Email</Text>
                <View style={[styles.inputRow, !!emailError && styles.inputRowError]}>
                  <Ionicons name="mail-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#CCC"
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kata Sandi</Text>
                <View style={[styles.inputRow, !!passwordError && styles.inputRowError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#AAA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CCC"
                    value={password}
                    onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#AAA"
                    />
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                {!isRegister && (
                  <TouchableOpacity
                    style={styles.forgotBelow}
                    onPress={() => setScreen('forgot')}
                  >
                    <Text style={styles.forgotLink}>Lupa Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#111" />
                : <Text style={styles.btnPrimaryText}>{isRegister ? 'Buat Akun' : 'Masuk'}</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU LOGIN MELALUI</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={loading}
            >
              <Image source={require('@/assets/images/G.png')} />
              <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>

            <Text style={styles.privacyText}>
              Dengan membuat akun, Anda menyetujui{' '}
              <Text
                style={styles.privacyLink}
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                Kebijakan Privasi
              </Text>
              {' '}BRECISE.
            </Text>

            <TouchableOpacity style={styles.switchRow} onPress={() => { clearErrors(); setScreen(isRegister ? 'login' : 'register'); }}>
              <Text style={styles.switchText}>
                {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                <Text style={styles.switchBold}>{isRegister ? 'Masuk' : 'Daftar'}</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // ── Splash ──
  splashContainer: {
    flex: 1, justifyContent: 'space-around',
    paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48,
  },
  splashTextBlock: { alignItems: 'center', gap: 10 },
  splashTitle: { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center', lineHeight: 38, fontFamily: 'Lexend-Black' },
  splashSub: { fontSize: 14, color: '#888', textAlign: 'center', fontFamily: 'Lexend-Regular' },
  splashButtons: { gap: 16, alignItems: 'center' },
  splashLoginText: { fontSize: 14, color: '#888', fontFamily: 'Lexend-Regular' },
  splashLoginBold: { fontWeight: '800', color: '#111', fontFamily: 'Lexend-Bold' },

  // ── Form wrapper ──
  formContainer: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 48, fontFamily: 'Lexend-Regular' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  formLogoWrapper: { alignItems: 'center', marginBottom: 32 },

  // ── Screen header (forgot / otp / reset) ──
  screenHeader: { alignItems: 'center', marginTop: 20, marginBottom: 32, gap: 12 },
  iconBadge: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#F0FFF4', borderWidth: 2, borderColor: '#6BFF8F',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  iconBadgeGreen: { backgroundColor: '#6BFF8F', borderColor: '#6BFF8F' },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', fontFamily: 'Lexend-Black' },
  screenSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, fontFamily: 'Lexend-Regular' },

  // ── Fields ──
  fields: { gap: 14, marginBottom: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.3, fontFamily: 'Lexend-Bold' },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotBelow: { alignItems: 'flex-end', marginTop: 8 },
  forgotLink: { fontSize: 12, fontWeight: '700', color: '#6BFF8F', fontFamily: 'Lexend-Bold' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F7F7', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  inputRowError: { borderColor: '#FF6B6B' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111', fontFamily: 'Lexend-Regular' },
  errorText: { fontSize: 11, color: '#FF6B6B', fontWeight: '600', fontFamily: 'Lexend-Bold' },

  // ── OTP ──
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 28, gap: 8,
  },
  otpBox: {
    flex: 1, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#EEEEEE',
    backgroundColor: '#F7F7F7',
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#111', fontFamily: 'Lexend-Bold',
  },
  otpBoxFilled: { borderColor: '#6BFF8F', backgroundColor: '#F0FFF4' },

  resendRow: { alignItems: 'center', marginTop: 20 },
  resendDisabled: { color: '#BBB', fontFamily: 'Lexend-Regular' },

  // ── Buttons ──
  btnPrimary: {
    backgroundColor: '#6BFF8F', borderRadius: 40,
    height: 54, width: '100%',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },

  // ── Divider / Google ──
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: { fontSize: 10, fontWeight: '700', color: '#BBB', letterSpacing: 0.5, fontFamily: 'Lexend-Bold' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 40, height: 54,
    borderWidth: 1.5, borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF', marginBottom: 16,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: '#111', fontFamily: 'Lexend-Bold' },

  // ── Privacy Policy ──
  privacyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18, fontFamily: 'Lexend-Regular',
  },
  privacyLink: {
    color: '#6BFF8F',
    fontWeight: '700', fontFamily: 'Lexend-Bold',
    textDecorationLine: 'underline',
  },

  // ── Switch ──
  switchRow: { alignItems: 'center', marginBottom: 12 },
  switchText: { fontSize: 13, color: '#888', textAlign: 'center', fontFamily: 'Lexend-Regular' },
  switchBold: { fontWeight: '800', color: '#111', fontFamily: 'Lexend-Bold' },
});