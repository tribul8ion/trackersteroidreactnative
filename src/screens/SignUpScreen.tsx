import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Alert, 
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { signUp } from '../services/auth';
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
        <Ionicons name="person-add" size={48} color={colors.accent} />
      </View>
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
  // --- Динамические стили для primary ---
  const isInactive = disabled || loading;
  const buttonStyles = [
    styles.button,
    variant === 'primary' && {
      backgroundColor: isInactive ? colors.grayLight : colors.accent,
    },
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'ghost' && styles.buttonGhost,
    isInactive && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && {
      color: isInactive ? colors.gray : colors.white,
    },
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'ghost' && styles.buttonTextGhost,
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={isInactive}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons name={icon as any} size={20} color={variant === 'primary' ? (isInactive ? colors.gray : colors.white) : colors.accent} />
        )}
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

// Компонент Badge для требований к паролю
const Badge = ({ 
  children, 
  isValid = false,
  color
}: { 
  children: React.ReactNode; 
  isValid?: boolean;
  color?: string;
}) => (
  <View style={[styles.badge, { backgroundColor: color || (isValid ? '#4ADE8020' : '#49454F20') }]}>
    <Ionicons 
      name={isValid ? 'checkmark-circle' : 'close-circle'} 
      size={12} 
      color={isValid ? '#4ADE80' : '#CAC4D0'} 
    />
    <Text style={[styles.badgeText, { color: isValid ? '#4ADE80' : '#CAC4D0' }]}>
      {children}
    </Text>
  </View>
);

const SignUpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Валидация пароля
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isEmailValid && isPasswordValid && passwordsMatch && fullName.length > 0 && acceptTerms;

  const handleSignUp = async () => {
    if (!isFormValid) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля корректно');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    
    if (error) {
      Alert.alert('Ошибка регистрации', error.message || 'Не удалось зарегистрироваться');
    } else {
      Alert.alert(
        'Добро пожаловать!', 
        'Аккаунт успешно создан. Добро пожаловать в Steroid Tracker!',
        [{ text: 'Продолжить', onPress: () => navigation.replace('Main') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
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
            <Animated.Text entering={FadeInUp.delay(400)} style={[styles.title, { color: colors.accent }]}>Создать аккаунт</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(600)} style={styles.subtitle}>Присоединяйтесь к сообществу</Animated.Text>
          </Animated.View>

          {/* Main Form Card */}
          <Animated.View entering={SlideInLeft.delay(800)} style={styles.formSection}>
            <Card style={styles.formCard}>
              <Animated.View entering={FadeIn.delay(1000)} style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Регистрация</Text>
                <Text style={styles.cardSubtitle}>Заполните данные для создания аккаунта</Text>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(1200)} style={styles.cardContent}>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Полное имя</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                    mode="outlined"
                    placeholder="Введите ваше имя"
                    theme={{
                      colors: {
                        primary: '#D0BCFF',
                        outline: '#49454F',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="account-outline" />}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    mode="outlined"
                    placeholder="Введите ваш email"
                    theme={{
                      colors: {
                        primary: isEmailValid || email.length === 0 ? '#D0BCFF' : '#EF4444',
                        outline: isEmailValid || email.length === 0 ? '#49454F' : '#EF4444',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="email-outline" />}
                    right={
                      email.length > 0 ? (
                        <TextInput.Icon 
                          icon={isEmailValid ? 'check-circle' : 'close-circle'} 
                        />
                      ) : undefined
                    }
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Пароль</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    mode="outlined"
                    placeholder="Создайте надёжный пароль"
                    theme={{
                      colors: {
                        primary: '#D0BCFF',
                        outline: '#49454F',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  
                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.requirementsTitle}>Требования к паролю:</Text>
                      <View style={styles.requirementsList}>
                        <Badge isValid={passwordValidation.minLength}>
                          Минимум 8 символов
                        </Badge>
                        <Badge isValid={passwordValidation.hasUpperCase}>
                          Заглавная буква
                        </Badge>
                        <Badge isValid={passwordValidation.hasLowerCase}>
                          Строчная буква
                        </Badge>
                        <Badge isValid={passwordValidation.hasNumber}>
                          Цифра
                        </Badge>
                        <Badge isValid={passwordValidation.hasSpecialChar}>
                          Спецсимвол
                        </Badge>
                      </View>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Подтвердите пароль</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    secureTextEntry={!showConfirmPassword}
                    mode="outlined"
                    placeholder="Повторите пароль"
                    theme={{
                      colors: {
                        primary: passwordsMatch || confirmPassword.length === 0 ? '#D0BCFF' : '#EF4444',
                        outline: passwordsMatch || confirmPassword.length === 0 ? '#49454F' : '#EF4444',
                        background: '#1C1B1F',
                        onSurfaceVariant: '#CAC4D0',
                        onSurface: '#FFF'
                      }
                    }}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    right={
                      <>
                        {confirmPassword.length > 0 && (
                          <TextInput.Icon 
                            icon={passwordsMatch ? 'check-circle' : 'close-circle'} 
                          />
                        )}
                        <TextInput.Icon
                          icon={showConfirmPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      </>
                    }
                  />
                </View>

                {/* Terms and Conditions */}
                <TouchableOpacity 
                  style={styles.termsContainer}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                    {acceptTerms && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.termsText}>
                    Я принимаю{' '}
                    <Text style={[styles.termsLink, { color: colors.accent }]}>Условия использования</Text>
                    {' '}и{' '}
                    <Text style={[styles.termsLink, { color: colors.accent }]}>Политику конфиденциальности</Text>
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Button */}
                <Animated.View entering={FadeInUp.delay(1600)}>
                  <Button
                    variant="primary"
                    onPress={handleSignUp}
                    loading={loading}
                    disabled={!isFormValid || loading}
                    icon={loading ? undefined : "person-add-outline"}
                    style={[styles.signUpButton, !isFormValid && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <View style={styles.buttonLoadingContent}>
                        <LoadingIndicator visible={loading} />
                        <Text style={styles.buttonText}>Создание...</Text>
                      </View>
                    ) : (
                      'Создать аккаунт'
                    )}
                  </Button>
                </Animated.View>
              </View>
            </Card>
          </View>

          {/* Sign In Link */}
          <Animated.View entering={FadeInUp.delay(1800)} style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.signInText, { color: colors.accent }]}>Войти</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Security Badge */}
          <Animated.View entering={FadeIn.delay(2000)} style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4ADE80" />
            <Text style={styles.securityText}>256-битное шифрование данных</Text>
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
    color: '#CAC4D0',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1C1B1F',
  },
  inputOutline: {
    borderColor: '#49454F',
    borderWidth: 1,
    borderRadius: 12,
  },
  inputContent: {
    color: '#FFF',
    paddingLeft: 12,
  },
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#49454F20',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    color: '#CAC4D0',
    marginBottom: 8,
    fontWeight: '500',
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#49454F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#D0BCFF',
    borderColor: '#D0BCFF',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#CAC4D0',
    lineHeight: 20,
  },
  termsLink: {
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
    backgroundColor: '#D0BCFF',
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
    color: '#000',
  },
  buttonTextSecondary: {
    color: '#D0BCFF',
  },
  buttonTextGhost: {
    color: '#CAC4D0',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signUpButton: {
    marginTop: 8,
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
    color: '#CAC4D0',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE8020',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '500',
  },
});

export default SignUpScreen;