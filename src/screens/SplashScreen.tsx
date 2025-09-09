import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, Image } from 'react-native';
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
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getUser } from '../services/auth';
import { restoreSession } from '../services/session';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Анимированные значения
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const progressOpacity = useSharedValue(0);
  const versionOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const bgScale = useSharedValue(0.98);

  const checkAuthAndNavigate = async () => {
    try {
      await restoreSession();
      const { data } = await getUser();
      setTimeout(() => {
        if (data?.user) {
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      }, 500);
    } catch (error) {
      setTimeout(() => {
        navigation.replace('Auth');
      }, 500);
    }
  };

  useEffect(() => {
    // Последовательность анимаций
    const startAnimations = () => {
      bgOpacity.value = withTiming(1, { duration: 1200 });
      bgScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1200 }),
          withTiming(0.98, { duration: 1200 })
        ),
        -1,
        true
      );
      logoOpacity.value = withTiming(1, { duration: 800 });
      logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(400, withSpring(0, { damping: 10, stiffness: 100 }));
      subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      subtitleTranslateY.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));
      progressOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
      progressWidth.value = withDelay(1000, withTiming(100, { duration: 1500, easing: Easing.out(Easing.cubic) }));
      versionOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
      setTimeout(() => {
        runOnJS(checkAuthAndNavigate)();
      }, 2000);
    };
    startAnimations();
  }, [navigation]);

  // Стили анимаций
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: bgScale.value }],
  }));
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [ { scale: logoScale.value } ],
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
      {/* Splash icon как background с анимацией */}
      <Animated.Image
        source={require('../../assets/splash-icon.png')}
        style={[styles.backgroundImage, bgAnimatedStyle]}
        resizeMode="cover"
        blurRadius={2}
      />
      <View style={styles.overlay}>
        {/* Иконки гантели и шприца */}
        <View style={styles.iconsRow}>
          <Ionicons name="barbell-outline" size={36} color={colors.accent} style={{ marginRight: 16 }} />
          <Ionicons name="medkit-outline" size={36} color={colors.accent} />
        </View>
        {/* Текст */}
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          Steroid Tracker
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
          Твой путь к совершенству
        </Animated.Text>
        {/* Прогресс */}
        <Animated.View style={[styles.progressContainer, progressContainerAnimatedStyle]}>
          <Text style={styles.loadingText}>Загрузка...</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressBarAnimatedStyle]} />
          </View>
        </Animated.View>
      </View>
      {/* Версия и копирайт */}
      <Animated.View style={[styles.footer, versionAnimatedStyle]}>
        <Text style={styles.version}>v1.0.0</Text>
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
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.accentSecondary,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 32,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  loadingText: {
    fontSize: 14,
    color: colors.accentSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  version: {
    fontSize: 14,
    color: colors.accentSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.gray,
  },
});

export default SplashScreen;