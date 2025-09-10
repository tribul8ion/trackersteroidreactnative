import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getUserAchievementsProgress } from '../services/achievements';
import { getUser } from '../services/auth';
import { colors } from '../theme/colors';
import { achievementsList, AchievementCategory, getRarityColor, getRarityLabel } from '../data/achievementsList';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInLeft } from 'react-native-reanimated';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  injection: 'Инъекции',
  labs: 'Анализы',
  course: 'Курсы',
  meme: 'Мемные',
  profile: 'Профиль',
  streak: 'Стрики',
  milestone: 'Вехи',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  injection: 'syringe',
  labs: 'vial',
  course: 'graduation-cap',
  meme: 'grin-tongue',
  profile: 'user',
  streak: 'fire',
  milestone: 'trophy',
};

const AllAchievementsScreen = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const navigation = useNavigation();

  const fetchData = async () => {
    const { data: userData } = await getUser();
    const user_id = userData?.user?.id;
    if (!user_id) return;
    const achs = await getUserAchievementsProgress(user_id);
    setAchievements(achs);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Фильтрация и группировка по категориям
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(ach => ach.category === selectedCategory);

  const grouped = filteredAchievements.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<AchievementCategory, any[]>);

  const totalPoints = achievements
    .filter(ach => ach.achieved)
    .reduce((sum, ach) => sum + ach.points, 0);

  const achievedCount = achievements.filter(ach => ach.achieved).length;
  const totalCount = achievements.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Достижения</Text>
          <Text style={styles.subtitle}>{achievedCount} из {totalCount} получено</Text>
        </View>
        <View style={styles.pointsContainer}>
          <FontAwesome5 name="star" size={16} color={colors.warning} />
          <Text style={styles.pointsText}>{totalPoints}</Text>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedCategory === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <FontAwesome5 name="th" size={14} color={selectedCategory === 'all' ? colors.white : colors.gray} />
            <Text style={[styles.filterText, selectedCategory === 'all' && styles.filterTextActive]}>
              Все
            </Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterButton, selectedCategory === cat && styles.filterButtonActive]}
              onPress={() => setSelectedCategory(cat as AchievementCategory)}
            >
              <FontAwesome5 
                name={CATEGORY_ICONS[cat as AchievementCategory]} 
                size={14} 
                color={selectedCategory === cat ? colors.white : colors.gray} 
              />
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <FontAwesome5 name="spinner" size={32} color={colors.accent} />
            <Text style={styles.loadingText}>Загрузка достижений...</Text>
          </View>
        ) : selectedCategory === 'all' ? (
          Object.entries(CATEGORY_LABELS).map(([cat, label], categoryIndex) => {
            const categoryAchievements = grouped[cat as AchievementCategory] || [];
            if (categoryAchievements.length === 0) return null;
            
            return (
              <Animated.View 
                key={cat} 
                entering={FadeIn.delay(600 + categoryIndex * 100)} 
                style={styles.categoryBlock}
              >
                <View style={styles.categoryHeader}>
                  <FontAwesome5 
                    name={CATEGORY_ICONS[cat as AchievementCategory]} 
                    size={20} 
                    color={colors.accent} 
                  />
                  <Text style={styles.categoryTitle}>{label}</Text>
                  <Text style={styles.categoryCount}>
                    {categoryAchievements.filter(ach => ach.achieved).length}/{categoryAchievements.length}
                  </Text>
                </View>
                {categoryAchievements.map((ach: any, index) => (
                  <AchievementCard 
                    key={ach.id} 
                    achievement={ach} 
                    index={index}
                  />
                ))}
              </Animated.View>
            );
          })
        ) : (
          <Animated.View entering={FadeIn.delay(600)} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <FontAwesome5 
                name={CATEGORY_ICONS[selectedCategory]} 
                size={20} 
                color={colors.accent} 
              />
              <Text style={styles.categoryTitle}>{CATEGORY_LABELS[selectedCategory]}</Text>
              <Text style={styles.categoryCount}>
                {filteredAchievements.filter(ach => ach.achieved).length}/{filteredAchievements.length}
              </Text>
            </View>
            {filteredAchievements.map((ach: any, index) => (
              <AchievementCard 
                key={ach.id} 
                achievement={ach} 
                index={index}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AchievementCard = ({ achievement, index }: { achievement: any; index: number }) => {
  const received = achievement.achieved;
  const isSecret = achievement.isSecret && !received;
  const rarityColor = getRarityColor(achievement.rarity);
  
  const progressBar = achievement.required ? (
    <View style={styles.progressBarWrap}>
      <View style={[styles.progressBar, { 
        width: `${Math.min(100, (achievement.progress / achievement.required) * 100)}%`, 
        backgroundColor: received ? colors.success : rarityColor 
      }]} />
      <Text style={styles.progressText}>
        {achievement.progress}/{achievement.required}
      </Text>
    </View>
  ) : null;

  return (
    <Animated.View 
      entering={SlideInLeft.delay(800 + index * 50)} 
      style={[
        styles.achCard, 
        !received && styles.achCardLocked, 
        achievement.meme && styles.achCardMeme,
        { borderLeftColor: rarityColor }
      ]}
    >
      <View style={styles.iconWrap}>
        <FontAwesome5 
          name={achievement.icon} 
          size={24} 
          color={received ? (achievement.meme ? colors.warning : rarityColor) : colors.gray} 
        />
        {achievement.meme && (
          <View style={styles.memeBadge}>
            <FontAwesome5 name="grin-tongue" size={8} color={colors.white} />
          </View>
        )}
      </View>
      
      <View style={styles.achContent}>
        <View style={styles.achHeader}>
          <Text style={[styles.achName, received ? styles.achNameActive : styles.achNameLocked]}>
            {isSecret ? '???' : achievement.name}
          </Text>
          <View style={styles.achMeta}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {getRarityLabel(achievement.rarity)}
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <FontAwesome5 name="star" size={10} color={colors.warning} />
              <Text style={styles.pointsText}>{achievement.points}</Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.achDesc, !received && { opacity: 0.5 }]}>
          {isSecret ? 'Секретная ачивка' : achievement.description}
        </Text>
        
        {progressBar}
      </View>
      
      {received && (
        <View style={styles.achievedBadge}>
          <FontAwesome5 name="check-circle" size={20} color={colors.success} />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  filterContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray,
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: colors.gray,
    fontSize: 16,
    marginTop: 16,
  },
  categoryBlock: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.gray,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  achCardLocked: {
    opacity: 0.6,
  },
  achCardMeme: {
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    marginRight: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  memeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achContent: {
    flex: 1,
  },
  achHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  achName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray,
    flex: 1,
  },
  achNameActive: {
    color: colors.white,
  },
  achNameLocked: {
    color: colors.gray,
  },
  achMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  achDesc: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  achievedBadge: {
    marginLeft: 8,
  },
});

export default AllAchievementsScreen; 