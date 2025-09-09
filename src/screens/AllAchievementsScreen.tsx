import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getUserAchievementsProgress } from '../services/achievements';
import { getUser } from '../services/auth';
import { colors } from '../theme/colors';
import { achievementsList, AchievementCategory } from '../data/achievementsList';
import { useNavigation } from '@react-navigation/native';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  injection: 'Инъекции',
  labs: 'Анализы',
  course: 'Курсы',
  meme: 'Мемные',
  profile: 'Профиль',
};

const AllAchievementsScreen = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      if (!user_id) return;
      const achs = await getUserAchievementsProgress(user_id);
      setAchievements(achs);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Группировка по категориям
  const grouped = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<AchievementCategory, any[]>);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.title}>Достижения</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={{ color: colors.gray, textAlign: 'center', marginTop: 40 }}>Загрузка...</Text>
        ) : (
          Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <View key={cat} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{label}</Text>
              {(grouped[cat as AchievementCategory] || []).map((ach: any) => {
                const received = ach.achieved;
                const isSecret = ach.isSecret && !received;
                const progressBar = ach.required ? (
                  <View style={styles.progressBarWrap}>
                    <View style={[styles.progressBar, { width: `${Math.min(100, (ach.progress / ach.required) * 100)}%`, backgroundColor: received ? colors.success : colors.accent }]} />
                  </View>
                ) : null;
                return (
                  <View key={ach.id} style={[styles.achCard, !received && styles.achCardLocked, ach.meme && styles.achCardMeme]}>
                    <View style={styles.iconWrap}>
                      <FontAwesome5 name={ach.icon} size={32} color={received ? (ach.meme ? colors.warning : colors.accent) : colors.gray} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.achName, received ? styles.achNameActive : styles.achNameLocked]}>
                        {isSecret ? '???' : ach.name}
                      </Text>
                      <Text style={[styles.achDesc, !received && { opacity: 0.5 }]}>
                        {isSecret ? 'Секретная ачивка' : ach.description}
                      </Text>
                      {progressBar}
                    </View>
                    {received && <Ionicons name="checkmark-circle" size={24} color={colors.success} style={{ marginLeft: 8 }} />}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryBlock: {
    marginBottom: 28,
  },
  categoryTitle: {
    color: colors.gray,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  achCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  achCardLocked: {
    opacity: 0.5,
  },
  achCardMeme: {
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    marginRight: 16,
    width: 40,
    alignItems: 'center',
  },
  achName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
  achNameActive: {
    color: colors.success,
  },
  achNameLocked: {
    color: colors.gray,
  },
  achDesc: {
    color: colors.white,
    fontSize: 13,
    marginTop: 2,
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: colors.grayLight,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});

export default AllAchievementsScreen; 