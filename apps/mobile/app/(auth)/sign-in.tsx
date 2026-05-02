import { useSignIn, useOAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, AntDesign } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const TEAL = '#2DD4BF';

type Screen = 'login' | 'forgot_email' | 'forgot_code' | 'forgot_password';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogle } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startApple } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startFacebook } = useOAuth({ strategy: 'oauth_facebook' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | 'facebook' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  // ── Normal login ─────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      if (!signIn) throw new Error('Clerk yüklenemedi');
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  // ── Social OAuth ─────────────────────────────────────────────────────────────
  const handleOAuth = async (
    provider: 'google' | 'apple' | 'facebook',
    startFlow: (o: {
      redirectUrl: string;
    }) => Promise<{
      createdSessionId?: string | null;
      setActive?: ((o: { session: string }) => Promise<void>) | null;
    }>,
  ) => {
    setSocialLoading(provider);
    setError('');
    try {
      const redirectUrl = Linking.createURL('/');
      const { createdSessionId, setActive: sa } = await startFlow({ redirectUrl });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Giriş başarısız'));
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Forgot password: send code ───────────────────────────────────────────────
  const handleForgotSend = async () => {
    if (!isLoaded || !email) return;
    setLoading(true);
    setError('');
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      setScreen('forgot_code');
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? 'E-posta gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password: verify code ─────────────────────────────────────────────
  const handleForgotVerify = async () => {
    if (!isLoaded || !resetCode) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });
      if (result.status === 'needs_new_password') {
        setScreen('forgot_password');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? 'Kod geçersiz');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password: set new password ────────────────────────────────────────
  const handleSetNewPassword = async () => {
    if (!isLoaded || !newPassword) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.resetPassword({ password: newPassword });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? 'Şifre belirlenemedi');
    } finally {
      setLoading(false);
    }
  };

  // ── Renderers ─────────────────────────────────────────────────────────────────
  const renderError = () =>
    !!error && (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle" size={16} color="#F87171" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  const renderContent = () => {
    if (screen === 'forgot_email')
      return (
        <>
          <TouchableOpacity
            onPress={() => {
              setScreen('login');
              setError('');
            }}
            style={styles.backRow}
          >
            <Ionicons name="chevron-back" size={18} color={TEAL} />
            <Text style={styles.backRowText}>Geri dön</Text>
          </TouchableOpacity>
          <Text style={styles.cardTitle}>Şifremi Unuttum</Text>
          <Text style={styles.cardSub}>E-postana sıfırlama kodu göndereceğiz.</Text>
          {renderError()}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              placeholder="E-posta adresin"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (!email || loading) && styles.btnDisabled]}
            onPress={handleForgotSend}
            disabled={loading || !email}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryBtnText}>Kod Gönder</Text>
            )}
          </TouchableOpacity>
        </>
      );

    if (screen === 'forgot_code')
      return (
        <>
          <Text style={styles.cardTitle}>Kodu Gir</Text>
          <Text style={styles.cardSub}>{email} adresine gönderilen kodu gir.</Text>
          {renderError()}
          <View style={styles.inputWrap}>
            <Ionicons name="keypad-outline" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              placeholder="6 haneli kod"
              placeholderTextColor="#475569"
              value={resetCode}
              onChangeText={setResetCode}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (!resetCode || loading) && styles.btnDisabled]}
            onPress={handleForgotVerify}
            disabled={loading || !resetCode}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryBtnText}>Doğrula</Text>
            )}
          </TouchableOpacity>
        </>
      );

    if (screen === 'forgot_password')
      return (
        <>
          <Text style={styles.cardTitle}>Yeni Şifre</Text>
          <Text style={styles.cardSub}>Güçlü bir şifre belirle.</Text>
          {renderError()}
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#475569"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Yeni şifre"
              placeholderTextColor="#475569"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#475569"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (!newPassword || loading) && styles.btnDisabled]}
            onPress={handleSetNewPassword}
            disabled={loading || !newPassword}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryBtnText}>Şifreyi Kaydet</Text>
            )}
          </TouchableOpacity>
        </>
      );

    // Default: login
    return (
      <>
        <Text style={styles.cardTitle}>Giriş Yap</Text>
        {renderError()}
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#475569" style={styles.inputIcon} />
          <TextInput
            placeholder="E-posta"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#475569" style={styles.inputIcon} />
          <TextInput
            placeholder="Şifre"
            placeholderTextColor="#475569"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, { flex: 1 }]}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#475569"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setError('');
            setScreen('forgot_email');
          }}
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotText}>Şifremi Unuttum</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, (!email || !password || loading) && styles.btnDisabled]}
          onPress={handleSignIn}
          disabled={loading || !email || !password}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ya da</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOAuth('apple', startApple)}
            disabled={!!socialLoading}
            activeOpacity={0.8}
          >
            {socialLoading === 'apple' ? (
              <ActivityIndicator color="#1A1A2E" size="small" />
            ) : (
              <Ionicons name="logo-apple" size={22} color="#1A1A2E" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOAuth('google', startGoogle)}
            disabled={!!socialLoading}
            activeOpacity={0.8}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color="#1A1A2E" size="small" />
            ) : (
              <AntDesign name="google" size={20} color="#4285F4" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOAuth('facebook', startFacebook)}
            disabled={!!socialLoading}
            activeOpacity={0.8}
          >
            {socialLoading === 'facebook' ? (
              <ActivityIndicator color="#1877F2" size="small" />
            ) : (
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {router.canGoBack() && (
        <Pressable
          onPress={() => router.back()}
          style={[styles.backNavBtn, { top: insets.top + 12 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#1A1A2E" />
        </Pressable>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImg} />
            <Text style={styles.logoText}>FitAI</Text>
            <Text style={styles.tagline}>Gücünü Keşfet</Text>
          </View>
          <View style={styles.card}>{renderContent()}</View>
          {screen === 'login' && (
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Hesabın yok mu?</Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.signupLink}> Kaydol</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F7' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 40 },
  logoImg: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
  logoText: { color: '#1A1A2E', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: '#64748B', fontSize: 15, marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 24,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backRowText: { color: TEAL, fontSize: 14, fontWeight: '600' },
  cardTitle: {
    color: '#1A1A2E',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardSub: { color: '#64748B', fontSize: 14, marginBottom: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#1A1A2E', fontSize: 16, paddingVertical: 16 },
  eyeBtn: { padding: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText: { color: TEAL, fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#94A3B8', fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleGlyph: { color: '#1A1A2E', fontSize: 18, fontWeight: '800' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  signupText: { color: '#64748B', fontSize: 14 },
  signupLink: { color: TEAL, fontSize: 14, fontWeight: '600' },
  backNavBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
