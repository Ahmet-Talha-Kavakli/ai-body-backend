import { useSignUp, useOAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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

type Step = 'form' | 'verify' | 'profile';
type Gender = 'male' | 'female' | 'other' | '';

const DIAL_CODES = [
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Türkiye' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'ABD' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Birleşik Krallık' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Almanya' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'Fransa' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Hollanda' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Avusturya' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'İsviçre' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belçika' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'İsveç' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norveç' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Danimarka' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Avustralya' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Kanada' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'İtalya' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'İspanya' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'BAE' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'S. Arabistan' },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Azerbaycan' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Rusya' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japonya' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Yunanistan' },
];

const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
  { code: 'GB', name: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
  { code: 'AT', name: 'Avusturya', flag: '🇦🇹' },
  { code: 'CH', name: 'İsviçre', flag: '🇨🇭' },
  { code: 'BE', name: 'Belçika', flag: '🇧🇪' },
  { code: 'SE', name: 'İsveç', flag: '🇸🇪' },
  { code: 'NO', name: 'Norveç', flag: '🇳🇴' },
  { code: 'DK', name: 'Danimarka', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlandiya', flag: '🇫🇮' },
  { code: 'AU', name: 'Avustralya', flag: '🇦🇺' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
  { code: 'PT', name: 'Portekiz', flag: '🇵🇹' },
  { code: 'PL', name: 'Polonya', flag: '🇵🇱' },
  { code: 'RU', name: 'Rusya', flag: '🇷🇺' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪' },
  { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: 'JP', name: 'Japonya', flag: '🇯🇵' },
  { code: 'KR', name: 'Güney Kore', flag: '🇰🇷' },
  { code: 'CN', name: 'Çin', flag: '🇨🇳' },
  { code: 'IN', name: 'Hindistan', flag: '🇮🇳' },
  { code: 'BR', name: 'Brezilya', flag: '🇧🇷' },
  { code: 'MX', name: 'Meksika', flag: '🇲🇽' },
  { code: 'AR', name: 'Arjantin', flag: '🇦🇷' },
  { code: 'EG', name: 'Mısır', flag: '🇪🇬' },
  { code: 'MA', name: 'Fas', flag: '🇲🇦' },
  { code: 'GR', name: 'Yunanistan', flag: '🇬🇷' },
  { code: 'AZ', name: 'Azerbaycan', flag: '🇦🇿' },
];

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const GENDERS = [
  { value: 'male', label: 'Erkek', icon: 'male-outline' as const },
  { value: 'female', label: 'Kadın', icon: 'female-outline' as const },
  { value: 'other', label: 'Diğer', icon: 'person-outline' as const },
];

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogle } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startApple } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startFacebook } = useOAuth({ strategy: 'oauth_facebook' });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Step 1
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneDialCode, setPhoneDialCode] = useState('+90');
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2
  const [code, setCode] = useState('');

  // Step 3
  const [gender, setGender] = useState<Gender>('');
  const [country, setCountry] = useState<{ code: string; name: string; flag: string } | null>(null);
  const [language, setLanguage] = useState('tr');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | 'facebook' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      setError('Ad Soyad gerekli');
      return;
    }
    if (!email.trim()) {
      setError('E-posta gerekli');
      return;
    }
    if (!password) {
      setError('Şifre gerekli');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!signUp) throw new Error('Clerk yüklenemedi, uygulamayı yeniden başlat');
      const parts = fullName.trim().split(' ');
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: parts[0],
        lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(auth)/onboarding');
        return;
      }

      // Doğrulama emailini gönder — birden fazla SDK versiyonu desteklenir
      const r = result as Record<string, unknown>;
      if (typeof r['prepareEmailAddressVerification'] === 'function') {
        await (r['prepareEmailAddressVerification'] as (o: object) => Promise<void>)({
          strategy: 'email_code',
        });
      } else if (typeof r['prepareVerification'] === 'function') {
        await (r['prepareVerification'] as (o: object) => Promise<void>)({
          strategy: 'email_code',
        });
      }
      // Clerk bazı durumlarda create() ile otomatik gönderir, her halükarda devam et

      setStep('verify');
    } catch (err: unknown) {
      console.error('SignUp error:', err instanceof Error ? err.message : String(err));
      const e = err as { errors?: Array<{ message: string; longMessage?: string }> };
      setError(
        e.errors?.[0]?.longMessage ??
          e.errors?.[0]?.message ??
          (err instanceof Error ? err.message : 'Kayıt başarısız'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !code) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptVerification({ strategy: 'email_code', code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setStep('profile');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? 'Kod geçersiz');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishProfile = () => {
    router.replace('/(auth)/onboarding');
  };

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
        router.replace('/(auth)/onboarding');
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string }> };
      setError(e.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Giriş başarısız'));
    } finally {
      setSocialLoading(null);
    }
  };

  const renderError = () =>
    !!error && (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle" size={16} color="#F87171" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  const renderStep = () => {
    // ── Step 1: Account ───────────────────────────────────────────────────────
    if (step === 'form')
      return (
        <>
          <Text style={styles.cardTitle}>Hesap Oluştur</Text>
          {renderError()}

          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              placeholder="Ad Soyad"
              placeholderTextColor="#475569"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

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
            <TouchableOpacity
              style={styles.dialCodeBtn}
              onPress={() => setPhoneModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dialCodeText}>
                {DIAL_CODES.find((d) => d.dial === phoneDialCode)?.flag ?? '🇹🇷'}
                {'  '}
                {phoneDialCode}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.dialDivider} />
            <TextInput
              placeholder="Telefon numarası"
              placeholderTextColor="#475569"
              value={phone}
              onChangeText={setPhone}
              style={[styles.input, { flex: 1 }]}
              keyboardType="phone-pad"
            />
          </View>

          <View
            style={[
              styles.inputWrap,
              !passwordsMatch &&
                password.length > 0 &&
                confirmPassword.length > 0 &&
                styles.inputWrapError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#475569"
              style={styles.inputIcon}
            />
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

          <View
            style={[
              styles.inputWrap,
              !passwordsMatch && confirmPassword.length > 0 && styles.inputWrapError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#475569"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Şifre Tekrar"
              placeholderTextColor="#475569"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#475569"
              />
            </TouchableOpacity>
            {confirmPassword.length > 0 && (
              <Ionicons
                name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={passwordsMatch ? TEAL : '#F87171'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryBtnText}>Devam Et</Text>
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

    // ── Step 2: Verify ────────────────────────────────────────────────────────
    if (step === 'verify')
      return (
        <>
          <View style={styles.stepIconWrap}>
            <Ionicons name="mail-unread-outline" size={32} color={TEAL} />
          </View>
          <Text style={styles.cardTitle}>E-postanı Doğrula</Text>
          <Text style={styles.cardSub}>{email} adresine bir kod gönderdik.</Text>
          {renderError()}
          <View style={styles.inputWrap}>
            <Ionicons name="keypad-outline" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              placeholder="6 haneli kod"
              placeholderTextColor="#475569"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (!code || loading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || !code}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryBtnText}>Doğrula</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => setStep('form')}>
            <Text style={styles.backLinkText}>← Geri dön</Text>
          </TouchableOpacity>
        </>
      );

    // ── Step 3: Profile ───────────────────────────────────────────────────────
    return (
      <>
        <View style={styles.stepIconWrap}>
          <Ionicons name="person-circle-outline" size={32} color={TEAL} />
        </View>
        <Text style={styles.cardTitle}>Profil Bilgileri</Text>
        <Text style={styles.cardSub}>Seni biraz daha tanıyalım.</Text>

        <Text style={styles.fieldLabel}>Cinsiyet</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => {
            const active = gender === g.value;
            return (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderBtn, active && styles.genderBtnActive]}
                onPress={() => setGender(g.value as Gender)}
                activeOpacity={0.8}
              >
                <Ionicons name={g.icon} size={20} color={active ? TEAL : '#475569'} />
                <Text style={[styles.genderLabel, active && { color: TEAL }]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Ülke</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={country ? styles.pickerValue : styles.pickerPlaceholder}>
            {country ? `${country.flag}  ${country.name}` : 'Ülke seç...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Dil</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langBtn, active && styles.langBtnActive]}
                onPress={() => setLanguage(l.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={[styles.langLabel, active && { color: TEAL }]}>{l.label}</Text>
                {active && <Ionicons name="checkmark-circle" size={16} color={TEAL} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleFinishProfile}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Hadi Başlayalım 🚀</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipLink} onPress={handleFinishProfile}>
          <Text style={styles.skipLinkText}>Şimdilik geç</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'form' && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#475569" />
            </TouchableOpacity>
          )}

          <View style={styles.logoWrap}>
            <Image source={require('../../assets/icon.png')} style={styles.logoImg} />
            <Text style={styles.logoText}>FitAI</Text>
            <Text style={styles.tagline}>Yolculuğuna Başla</Text>
          </View>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {(['form', 'verify', 'profile'] as Step[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  step === s && styles.progressDotActive,
                  (['form', 'verify', 'profile'] as Step[]).indexOf(step) > i &&
                    styles.progressDotDone,
                ]}
              />
            ))}
          </View>

          <View style={styles.card}>{renderStep()}</View>

          {step === 'form' && (
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Hesabın var mı?</Text>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signupLink}> Giriş Yap</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dial code picker modal */}
      <Modal visible={phoneModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alan Kodu</Text>
            <TouchableOpacity onPress={() => setPhoneModalVisible(false)}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={DIAL_CODES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  phoneDialCode === item.dial &&
                    item.code === DIAL_CODES.find((d) => d.dial === phoneDialCode)?.code &&
                    styles.countryItemActive,
                ]}
                onPress={() => {
                  setPhoneDialCode(item.dial);
                  setPhoneModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialBadge}>{item.dial}</Text>
                {phoneDialCode === item.dial && (
                  <Ionicons name="checkmark" size={18} color={TEAL} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>

      {/* Country picker modal */}
      <Modal visible={countryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ülke Seç</Text>
            <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Ara..."
              placeholderTextColor="#94A3B8"
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  country?.code === item.code && styles.countryItemActive,
                ]}
                onPress={() => {
                  setCountry(item);
                  setCountryModalVisible(false);
                  setCountrySearch('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={[styles.countryName, country?.code === item.code && { color: TEAL }]}>
                  {item.name}
                </Text>
                {country?.code === item.code && (
                  <Ionicons name="checkmark" size={18} color={TEAL} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F7' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { marginTop: 8, marginBottom: 8, width: 40, height: 40, justifyContent: 'center' },

  logoWrap: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  logoImg: { width: 80, height: 80, borderRadius: 20, marginBottom: 16 },
  logoText: { color: '#1A1A2E', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: '#64748B', fontSize: 15, marginTop: 4 },

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  progressDotActive: { backgroundColor: TEAL, width: 24 },
  progressDotDone: { backgroundColor: TEAL + '60' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 24,
  },

  stepIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: TEAL + '12',
    borderWidth: 1,
    borderColor: TEAL + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#1A1A2E',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
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
  inputWrapError: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#1A1A2E', fontSize: 16, paddingVertical: 16 },
  eyeBtn: { padding: 4 },
  dialCodeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10 },
  dialCodeText: { color: '#1A1A2E', fontSize: 15, fontWeight: '600' },
  dialDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginRight: 10 },
  dialBadge: { color: '#64748B', fontSize: 14, marginRight: 4 },

  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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

  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: TEAL, fontSize: 13, fontWeight: '500' },
  skipLink: { marginTop: 12, alignItems: 'center' },
  skipLinkText: { color: '#94A3B8', fontSize: 13 },

  fieldLabel: { color: '#64748B', fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },

  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  genderBtnActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  genderLabel: { color: '#475569', fontSize: 13, fontWeight: '600' },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  pickerValue: { color: '#1A1A2E', fontSize: 15 },
  pickerPlaceholder: { color: '#475569', fontSize: 15 },

  langRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  langBtnActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  langFlag: { fontSize: 20 },
  langLabel: { color: '#475569', fontSize: 14, fontWeight: '600' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  signupText: { color: '#64748B', fontSize: 14 },
  signupLink: { color: TEAL, fontSize: 14, fontWeight: '600' },

  // Country modal
  modalRoot: { flex: 1, backgroundColor: '#F5F5F7' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: { color: '#1A1A2E', fontSize: 18, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: '#1A1A2E', fontSize: 16, paddingVertical: 14 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  countryItemActive: { backgroundColor: TEAL + '08' },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, color: '#1A1A2E', fontSize: 15 },
});
