import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUser } from '../services/auth';
import { getProfile, Profile } from '../services/profile';
import { getCourses } from '../services/courses';
import { getActions } from '../services/actions';
import { getAchievements } from '../services/achievements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '../navigation/AppNavigator';
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
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Компонент для анимированного аватара
const AnimatedAvatar = ({ profile }: { profile: Profile | null }) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    rotation.value = withTiming(360, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <Animated.View style={[styles.avatarContainer, animatedStyle]}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <FontAwesome5 name="user-circle" size={60} color={colors.accent} />
        </View>
      )}
      <View style={styles.avatarBadge}>
        <FontAwesome5 name="crown" size={16} color={colors.warning} />
      </View>
    </Animated.View>
  );
};

// Компонент для статистики
const StatCard = ({ value, label, icon, color = colors.accent, delay = 0 }: { 
  value: string | number; 
  label: string; 
  icon: string; 
  color?: string; 
  delay?: number;
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome5 name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// Компонент для достижений
const AchievementCard = ({ achievement, index }: { achievement: any; index: number }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 100, withSpring(1, { damping: 8, stiffness: 100 }));
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 800 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.achievementCard, animatedStyle]}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{achievement.achievement?.icon || '🏆'}</Text>
      </View>
      <Text style={styles.achievementName}>{achievement.achievement?.name || 'Достижение'}</Text>
      <Text style={styles.achievementDescription}>{achievement.achievement?.description || 'Описание'}</Text>
    </Animated.View>
  );
};

// Компонент для быстрых действий
const QuickAction = ({ icon, title, onPress, color = colors.accent, delay = 0 }: {
  icon: string;
  title: string;
  onPress: () => void;
  color?: string;
  delay?: number;
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={[styles.quickAction, { borderColor: color + '30' }]} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
          <FontAwesome5 name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.quickActionText, { color }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ courses: 0, injections: 0, achievements: 0 });
  const [achievements, setAchievements] = useState<any[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      if (!user_id) throw new Error('Не удалось получить пользователя');
      // Профиль
      const { data: profileData, error: profileError } = await getProfile(user_id);
      if (profileError) throw profileError;
      setProfile(profileData);
      // Курсы
      const { data: coursesData } = await getCourses(user_id);
      // Инъекции
      const { data: actionsData } = await getActions(user_id);
      // Достижения
      const { data: achievementsData } = await getAchievements(user_id);
      setStats({
        courses: coursesData ? coursesData.length : 0,
        injections: actionsData ? actionsData.filter((a: any) => a.type === 'injection').length : 0,
        achievements: achievementsData ? achievementsData.length : 0,
      });
      setAchievements(achievementsData || []);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.error, fontSize: 16, marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity onPress={() => { setLoading(true); setError(null); }} style={{ padding: 12, backgroundColor: colors.secondary, borderRadius: 8 }}>
          <Text style={{ color: colors.primary }}>Повторить</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <AnimatedAvatar profile={profile} />
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.name}>
            {profile?.full_name || profile?.username || 'Пользователь'}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(600)} style={styles.email}>
            {profile?.email}
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(800)}>
            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => profile && navigation.navigate('EditProfile', { profile })}
            >
              <FontAwesome5 name="edit" size={16} color={colors.accent} />
              <Text style={styles.editText}>Редактировать профиль</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Statistics */}
        <Animated.View entering={FadeIn.delay(1000)} style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsContainer}>
            <StatCard 
              value={stats.courses} 
              label="Курсов" 
              icon="dumbbell" 
              color={colors.accent}
              delay={0}
            />
            <StatCard 
              value={stats.injections} 
              label="Инъекций" 
              icon="syringe" 
              color={colors.blue}
              delay={100}
            />
            <StatCard 
              value={stats.achievements} 
              label="Достижений" 
              icon="trophy" 
              color={colors.warning}
              delay={200}
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(1200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <View style={styles.quickActionsContainer}>
            <QuickAction
              icon="chart-line"
              title="Аналитика"
              onPress={() => navigation.navigate('Statistics')}
              color={colors.purple}
              delay={0}
            />
            <QuickAction
              icon="cog"
              title="Настройки"
              onPress={() => navigation.navigate('Settings')}
              color={colors.gray}
              delay={100}
            />
            <QuickAction
              icon="book"
              title="База знаний"
              onPress={() => navigation.navigate('KnowledgeBase')}
              color={colors.cyan}
              delay={200}
            />
            <QuickAction
              icon="trophy"
              title="Достижения"
              onPress={() => navigation.navigate('AllAchievements')}
              color={colors.warning}
              delay={300}
            />
          </View>
        </Animated.View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <Animated.View entering={FadeIn.delay(1400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Последние достижения</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllAchievements')}>
                <Text style={styles.seeAllText}>Все →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {achievements.slice(0, 5).map((achievement, index) => (
                <AchievementCard 
                  key={achievement.id || index} 
                  achievement={achievement} 
                  index={index}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Profile Info */}
        <Animated.View entering={FadeIn.delay(1600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о профиле</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="calendar" size={16} color={colors.gray} />
              <Text style={styles.infoLabel}>Дата регистрации:</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="clock" size={16} color={colors.gray} />
              <Text style={styles.infoLabel}>Последняя активность:</Text>
              <Text style={styles.infoValue}>Сегодня</Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="shield-alt" size={16} color={colors.gray} />
              <Text style={styles.infoLabel}>Статус аккаунта:</Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>Активен</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.accent + '30',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  avatarPlaceholder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    color: colors.gray,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  editText: {
    color: colors.accent,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.gray,
    fontSize: 14,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementsScroll: {
    paddingHorizontal: 4,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    color: colors.gray,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    color: colors.gray,
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen; 