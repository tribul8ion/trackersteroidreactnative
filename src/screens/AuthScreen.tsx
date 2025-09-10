import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Alert, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { signIn, supabase } from '../services/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../theme/colors';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInLeft, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Компонент для анимированного логотипа
const AnimatedLogo = () => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    rotation.value = withTiming(360, { duration: 1000 });
    opacity.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.logoContainer, animatedStyle]}>
      <View style={styles.logoCircle}>
        <Ionicons name="fitness" size={48} color={colors.accent} />
      </View>
    </Animated.View>
  );
};

// Компонент для валидации email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Компонент для валидации пароля
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Пароль должен содержать минимум 6 символов' };
  }
  return { isValid: true, message: '' };
};

// Компонент для отображения ошибок валидации
const ValidationError = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.validationError}>
      <Ionicons name="alert-circle" size={16} color={colors.error} />
      <Text style={styles.validationErrorText}>{message}</Text>
    </Animated.View>
  );
};

// Компонент для анимированного индикатора загрузки
const LoadingIndicator = ({ visible }: { visible: boolean }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotation.value = withTiming(360, { duration: 1000, repeat: -1 });
    } else {
      rotation.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.loadingIndicator, animatedStyle]}>
      <Ionicons name="refresh" size={20} color={colors.accent} />
    </Animated.View>
  );
};

// Компонент Button в стиле дэшборда
const Button = ({
  children,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  loading = false,
  icon,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: any;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'ghost' && styles.buttonGhost,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'ghost' && styles.buttonTextGhost,
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {icon && <Ionicons name={icon as any} size={20} color={variant === 'primary' ? '#000' : '#D0BCFF'} />}
        <Text style={textStyles}>
          {loading ? 'Загрузка...' : children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Компонент Card
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// --- CustomModal ---
const CustomModal = ({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) => {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 28, minWidth: 280, alignItems: 'center' }}>
        <Text style={{ color: colors.error, fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>{title}</Text>
        <Text style={{ color: colors.white, fontSize: 15, marginBottom: 24, textAlign: 'center' }}>{message}</Text>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 32, paddingVertical: 12 }}>
          <Text style={{ color: colors.white, fontWeight: '600', fontSize: 15 }}>ОК</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AuthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [canUseBiometry, setCanUseBiometry] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  
  // Состояния для валидации
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Проверка биометрии и сессии
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const session = await SecureStore.getItemAsync('SUPABASE_SESSION');
      const biometryEnabled = await SecureStore.getItemAsync('biometryEnabled');
      setCanUseBiometry(!!session && biometryEnabled === 'true' && compatible && enrolled);
    })();
  }, []);

  // Валидация формы при изменении полей
  useEffect(() => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password).isValid;
    
    setEmailError(email && !emailValid ? 'Введите корректный email' : '');
    setPasswordError(password && !passwordValid ? 'Пароль должен содержать минимум 6 символов' : '');
    
    setIsFormValid(emailValid && passwordValid && email.length > 0 && password.length > 0);
  }, [email, password]);

  const handleSignIn = async () => {
    if (!isFormValid) {
      setModal({ visible: true, title: 'Ошибка', message: 'Проверьте правильность заполнения полей' });
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      setModal({ visible: true, title: 'Ошибка входа', message: error.message || 'Неверный email или пароль' });
    } else {
      navigation.replace('Main');
    }
  };

  const handleBiometricAuth = async () => {
    const session = await SecureStore.getItemAsync('SUPABASE_SESSION');
    if (!session) {
      Alert.alert('Нет сохранённой сессии', 'Сначала войдите обычным способом');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Войти по отпечатку',
      fallbackLabel: 'Использовать пароль',
    });
    if (result.success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Ошибка', 'Не удалось пройти биометрическую аутентификацию');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    setLoading(false);
    
    if (error) {
      Alert.alert('Ошибка', error.message || 'Ошибка входа через Google');
    }
  };

  const handleTelegramSignIn = () => {
    Alert.alert('Telegram', 'Интеграция с Telegram будет реализована позже.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <CustomModal visible={modal.visible} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, visible: false })} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <AnimatedLogo />
            <Animated.Text entering={FadeInUp.delay(400)} style={styles.title}>Steroid Tracker</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(600)} style={styles.subtitle}>Твой путь к совершенству</Animated.Text>
          </Animated.View>

          {/* Main Form Card */}
          <Animated.View entering={SlideInLeft.delay(800)} style={styles.formSection}>
            <Card style={styles.formCard}>
              <Animated.View entering={FadeIn.delay(1000)} style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Вход в аккаунт</Text>
                <Text style={styles.cardSubtitle}>Добро пожаловать обратно</Text>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(1200)} style={styles.cardContent}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.input, emailError ? styles.inputError : null]}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    placeholder="Введите ваш email"
                    theme={{
                      colors: {
                        primary: emailError ? colors.error : '#D0BCFF',
                        outline: emailError ? colors.error : '#49454F',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={[styles.inputOutline, emailError ? styles.inputOutlineError : null]}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="email-outline" />}
                  />
                  <ValidationError message={emailError} visible={!!emailError} />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Пароль</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.input, passwordError ? styles.inputError : null]}
                    secureTextEntry={!showPassword}
                    mode="outlined"
                    placeholder="Введите ваш пароль"
                    theme={{
                      colors: {
                        primary: passwordError ? colors.error : '#D0BCFF',
                        outline: passwordError ? colors.error : '#49454F',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={[styles.inputOutline, passwordError ? styles.inputOutlineError : null]}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  <ValidationError message={passwordError} visible={!!passwordError} />
                </View>

                {/* Forgot Password */}
                <Animated.View entering={FadeIn.delay(1400)}>
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign In Button */}
                <Animated.View entering={FadeInUp.delay(1600)}>
                  <Button
                    variant="primary"
                    onPress={handleSignIn}
                    loading={loading}
                    disabled={loading || !isFormValid}
                    icon={loading ? undefined : "log-in-outline"}
                    style={[styles.signInButton, !isFormValid && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <View style={styles.buttonLoadingContent}>
                        <LoadingIndicator visible={loading} />
                        <Text style={styles.buttonText}>Вход...</Text>
                      </View>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                </Animated.View>

                {/* Alternative Methods */}
                {/*
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>или</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <View style={styles.alternativeButtons}>
                      {canUseBiometry && (
                        <Button
                          variant="secondary"
                          onPress={handleBiometricAuth}
                          icon="finger-print"
                          style={styles.biometricButton}
                        >
                          Touch ID
                        </Button>
                      )}
                    </View>
                  </>
                */}
              </View>
            </Card>
          </View>

          {/* Sign Up Link */}
          <Animated.View entering={FadeInUp.delay(1800)} style={styles.footer}>
            <Text style={styles.footerText}>Нет аккаунта?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpText}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Security Badge */}
          <Animated.View entering={FadeIn.delay(2000)} style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4ADE80" />
            <Text style={styles.securityText}>Ваши данные под надёжной защитой</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent + '40',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formCard: {
    marginHorizontal: 0,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#49454F',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.card,
  },
  inputOutline: {
    borderColor: colors.grayLight,
    borderWidth: 1,
    borderRadius: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputOutlineError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  validationErrorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContent: {
    color: colors.white,
    paddingLeft: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#49454F',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: colors.white,
  },
  buttonTextSecondary: {
    color: '#D0BCFF',
  },
  buttonTextGhost: {
    color: '#CAC4D0',
  },
  signInButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#49454F',
  },
  dividerText: {
    color: '#CAC4D0',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  alternativeButtons: {
    gap: 12,
  },
  biometricButton: {
    backgroundColor: '#D0BCFF20',
    borderColor: '#D0BCFF',
  },
  socialButton: {
    backgroundColor: '#49454F20',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.gray,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  securityText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
});

export default AuthScreen;