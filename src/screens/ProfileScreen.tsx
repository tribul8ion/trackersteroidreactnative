import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: 90, height: 90, borderRadius: 45 }} />
          ) : (
            <Ionicons name="person-circle" size={90} color={colors.primary} />
          )}
        </View>
        <Text style={styles.name}>{profile?.full_name || profile?.username || 'Пользователь'}</Text>
        <Text style={styles.status}>{profile?.email}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => profile && navigation.navigate('EditProfile', { profile })}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.editText}>Редактировать</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.courses}</Text>
          <Text style={styles.statLabel}>Курсов</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.injections}</Text>
          <Text style={styles.statLabel}>Инъекций</Text>
        </View>
      </View>
      {/* Блок достижений временно скрыт */}
      {/*
      <Text style={styles.sectionTitle}>Достижения</Text>
      <TouchableOpacity onPress={() => navigation.navigate('AllAchievements')} style={{ alignSelf: 'flex-end', marginRight: 16, marginBottom: 4 }}>
        <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: 'bold' }}>Все достижения →</Text>
      </TouchableOpacity>
      <View style={styles.achievementsRow}>
        {achievements.length === 0 ? (
          <Text style={{ color: colors.secondary, fontSize: 13 }}>Пока нет достижений</Text>
        ) : (
          achievements.filter(a => a.achievement).map((ach, idx) => (
            <View key={ach.id || idx} style={styles.achievementCard}>
              <Text style={{ fontSize: 28, textAlign: 'center' }}>{ach.achievement.icon}</Text>
              <Text style={[styles.achievementLabel, { color: ach.achievement.type === 'meme' ? colors.warning : colors.secondary, fontWeight: 'bold' }]}>{ach.achievement.name}</Text>
              <Text style={{ color: colors.secondary, fontSize: 11, textAlign: 'center', marginTop: 2 }}>{ach.achievement.description}</Text>
            </View>
          ))
        )}
      </View>
      */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  name: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 4,
  },
  status: {
    color: colors.success,
    fontSize: 14,
    marginBottom: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: {
    color: colors.primary,
    marginLeft: 6,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
  },
  statValue: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.secondary,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 8,
    minHeight: 60,
    alignItems: 'center',
  },
  achievementCard: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    marginHorizontal: 4,
  },
  achievementLabel: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProfileScreen; 