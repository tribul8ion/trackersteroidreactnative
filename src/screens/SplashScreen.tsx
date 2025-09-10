import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, StatusBar, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
  FadeIn,
  SlideInUp,
  SlideInDown,
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getUser } from '../services/auth';
import { restoreSession } from '../services/session';
import { colors } from '../theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loadingStep, setLoadingStep] = useState(0);

  // Анимированные значения
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);
  const versionOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const bgScale = useSharedValue(0.98);
  const particlesOpacity = useSharedValue(0);
  const particlesScale = useSharedValue(0.8);

  const loadingSteps = [
    'Инициализация...',
    'Загрузка данных...',
    'Проверка авторизации...',
    'Готово!'
  ];

  const checkAuthAndNavigate = async () => {
    try {
      setLoadingStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoadingStep(2);
      await restoreSession();
      const { data } = await getUser();
      
      setLoadingStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (data?.user) {
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    } catch (error) {
      setLoadingStep(3);
      setTimeout(() => {
        navigation.replace('Auth');
      }, 500);
    }
  };

  useEffect(() => {
    // Последовательность анимаций
    const startAnimations = () => {
      // Фон
      bgOpacity.value = withTiming(1, { duration: 1200 });
      bgScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(0.98, { duration: 2000 })
        ),
        -1,
        true
      );
      
      // Частицы
      particlesOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
      particlesScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 100 }));
      
      // Логотип
      logoOpacity.value = withTiming(1, { duration: 800 });
      logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      logoRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 1000 }),
          withTiming(-5, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
      
      // Заголовок
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }));
      
      // Подзаголовок
      subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      subtitleTranslateY.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));
      
      // Прогресс
      progressOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
      progressWidth.value = withDelay(1000, withTiming(100, { duration: 2000, easing: Easing.out(Easing.cubic) }));
      
      // Версия
      versionOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
      
      // Запуск загрузки
      setTimeout(() => {
        runOnJS(checkAuthAndNavigate)();
      }, 1500);
    };
    startAnimations();
  }, [navigation]);

  // Стили анимаций
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: bgScale.value }],
  }));
  
  const particlesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: particlesOpacity.value,
    transform: [{ scale: particlesScale.value }],
  }));
  
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
  }));
  
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  
  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));
  
  const progressContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));
  
  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  const versionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: versionOpacity.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>  
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Градиентный фон */}
      <Animated.View style={[styles.gradientBackground, bgAnimatedStyle]} />
      
      {/* Частицы */}
      <Animated.View style={[styles.particlesContainer, particlesAnimatedStyle]}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: `${Math.random() * 2}s`,
              }
            ]}
          />
        ))}
      </Animated.View>
      
      <View style={styles.overlay}>
        {/* Логотип */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <FontAwesome5 name="dumbbell" size={48} color={colors.accent} />
          </View>
        </Animated.View>
        
        {/* Текст */}
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          Steroid Tracker
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
          Твой путь к совершенству
        </Animated.Text>
        
        {/* Прогресс */}
        <Animated.View style={[styles.progressContainer, progressContainerAnimatedStyle]}>
          <Text style={styles.loadingText}>
            {loadingSteps[loadingStep] || 'Загрузка...'}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressBarAnimatedStyle]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressWidth.value)}%
          </Text>
        </Animated.View>
        
        {/* Дополнительные иконки */}
        <Animated.View entering={FadeIn.delay(1000)} style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <FontAwesome5 name="chart-line" size={20} color={colors.accent} />
            <Text style={styles.featureText}>Аналитика</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="vial" size={20} color={colors.accent} />
            <Text style={styles.featureText}>Анализы</Text>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="calendar-check" size={20} color={colors.accent} />
            <Text style={styles.featureText}>Планирование</Text>
          </View>
        </Animated.View>
      </View>
      
      {/* Версия и копирайт */}
      <Animated.View style={[styles.footer, versionAnimatedStyle]}>
        <Text style={styles.version}>v2.0.0</Text>
        <Text style={styles.copyright}>© 2024 Steroid Tracker</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.card} 50%, ${colors.accent}20 100%)`,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
    opacity: 0.6,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: colors.accent + '40',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.accentSecondary,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 40,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.accentSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.grayLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 280,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  version: {
    fontSize: 14,
    color: colors.accentSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.gray,
    opacity: 0.8,
  },
});

export default SplashScreen;