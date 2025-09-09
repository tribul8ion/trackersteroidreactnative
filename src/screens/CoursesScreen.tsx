import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getCourses, updateCourse } from '../services/courses';
import { getUser } from '../services/auth';
import { Menu, Portal, Dialog, Button } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// Шаблоны популярных курсов
const COURSE_TEMPLATES = [
  {
    id: 'beginner_test',
    name: 'Первый курс (Тестостерон)',
    description: 'Базовый курс для начинающих',
    type: 'Набор массы',
    durationWeeks: 12,
    compounds: [
      { key: 'test_e', label: 'Тестостерон Энантат', form: 'Инъекция', dosage: '250mg' }
    ],
    icon: '🥇'
  },
  {
    id: 'mass_cycle',
    name: 'Масса (Тест + Дека)',
    description: 'Классический курс на массу',
    type: 'Набор массы',
    durationWeeks: 16,
    compounds: [
      { key: 'test_e', label: 'Тестостерон Энантат', form: 'Инъекция', dosage: '500mg' },
      { key: 'deca', label: 'Нандролон Деканоат', form: 'Инъекция', dosage: '300mg' }
    ],
    icon: '💪'
  },
  {
    id: 'cutting_cycle',
    name: 'Сушка (Тест + Винстрол)',
    description: 'Курс для рельефа',
    type: 'Сушка',
    durationWeeks: 10,
    compounds: [
      { key: 'test_p', label: 'Тестостерон Пропионат', form: 'Инъекция', dosage: '100mg' },
      { key: 'winstrol', label: 'Станозолол', form: 'Таблетки', dosage: '50mg' }
    ],
    icon: '🔥'
  }
];

// Компонент Enhanced Progress Bar с анимацией
const ProgressBar = ({ 
  value, 
  max = 100, 
  color = colors.accent,
  showPercentage = true,
  height = 8,
  animated = true
}: { 
  value: number; 
  max?: number; 
  color?: string;
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming((value / max) * 100, { duration: 1500 });
    } else {
      progress.value = (value / max) * 100;
    }
  }, [value, max, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.progressWrapper}>
      <View style={[styles.progressContainer, { height }]}>
      <Animated.View style={[styles.progressBar, { backgroundColor: color }, animatedStyle]} />
      </View>
      {showPercentage && (
        <Text style={[styles.progressText, { color }]}>
          {Math.round(value)}%
        </Text>
      )}
    </View>
  );
};

// Улучшенный компонент Badge с иконками
const Badge = ({ 
  children, 
  variant = 'default',
  color = colors.accent,
  icon,
  size = 'medium'
}: { 
  children: React.ReactNode; 
  variant?: 'active' | 'completed' | 'paused' | 'default';
  color?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'active':
        return { 
          backgroundColor: colors.warning + '20', 
          borderColor: colors.warning,
          iconColor: colors.warning
        };
      case 'completed':
        return { 
          backgroundColor: colors.success + '20', 
          borderColor: colors.success,
          iconColor: colors.success
        };
      case 'paused':
        return { 
          backgroundColor: colors.error + '20', 
          borderColor: colors.error,
          iconColor: colors.error
        };
      default:
        return { 
          backgroundColor: color + '20', 
          borderColor: color,
          iconColor: color
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 };
      case 'large':
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.badge, variantStyles, sizeStyles]}>
      {icon && (
        <FontAwesome5 name={icon} size={sizeStyles.fontSize} color={variantStyles.iconColor} />
      )}
      <Text style={[styles.badgeText, { color: variantStyles.iconColor, fontSize: sizeStyles.fontSize }]}>
        {children}
      </Text>
    </View>
  );
};

// Компонент Quick Stats для курса
const QuickStats = ({ course }: { course: any }) => {
  const progress = getCourseProgress(course.startDate, course.durationWeeks);
  const { daysPassed, daysLeft } = getCourseProgressDays(course.startDate, course.durationWeeks);
  
  return (
    <View style={styles.quickStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{daysPassed}</Text>
        <Text style={styles.statLabel}>Дней пройдено</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{daysLeft}</Text>
        <Text style={styles.statLabel}>Дней осталось</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{progress}%</Text>
        <Text style={styles.statLabel}>Завершено</Text>
      </View>
    </View>
  );
};

// Компонент Template Card
const TemplateCard = ({ template, onPress }: { template: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.templateCard} onPress={onPress}>
    <View style={styles.templateHeader}>
      <Text style={styles.templateIcon}>{template.icon}</Text>
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateDescription}>{template.description}</Text>
    </View>
    </View>
    <View style={styles.templateFooter}>
      <Badge variant="default" color={colors.accent} size="small">
        {template.durationWeeks} недель
      </Badge>
      <Badge variant="default" color={colors.blue} size="small">
        {template.type}
      </Badge>
    </View>
    </TouchableOpacity>
);

// Компонент поиска
const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = "Поиск курсов..." 
}: { 
  value: string; 
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search-outline" size={20} color={colors.gray} />
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Ionicons name="close-circle" size={20} color={colors.gray} />
      </TouchableOpacity>
    )}
  </View>
);

// Компонент сортировки
const SortButton = ({ 
  sortBy, 
  onSortChange 
}: { 
  sortBy: string; 
  onSortChange: (sort: string) => void;
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  const sortOptions = [
    { key: 'name', label: 'По названию', icon: 'sort-alphabetical-variant' },
    { key: 'date', label: 'По дате создания', icon: 'calendar' },
    { key: 'progress', label: 'По прогрессу', icon: 'trending-up' },
    { key: 'status', label: 'По статусу', icon: 'flag' }
  ];

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
  <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setMenuVisible(true)}
  >
          <FontAwesome5 name="sort" size={16} color={colors.gray} />
          <Text style={styles.sortButtonText}>Сортировка</Text>
  </TouchableOpacity>
      }
      contentStyle={{ backgroundColor: colors.card }}
    >
      {sortOptions.map(option => (
        <Menu.Item
          key={option.key}
          onPress={() => {
            onSortChange(option.key);
            setMenuVisible(false);
          }}
          title={option.label}
          titleStyle={{ 
            color: sortBy === option.key ? colors.accent : colors.white 
          }}
        />
      ))}
    </Menu>
  );
};

// Основные функции (без изменений)
function getCourseProgress(startDate: string, durationWeeks: number) {
  if (!startDate || !durationWeeks) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = durationWeeks * 7;
  const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  return Math.round(progress);
}

function getCurrentWeek(startDate: string) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.min(1 + Math.floor(daysPassed / 7), 12);
}

function getCourseProgressDays(startDate: string, durationWeeks: number) {
  if (!startDate || !durationWeeks) return { daysPassed: 0, totalDays: 0, daysLeft: 0, endDate: '' };
  const start = new Date(startDate);
  const now = new Date();
  const totalDays = durationWeeks * 7;
  const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, totalDays - daysPassed);
  const endDate = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
  return { daysPassed, totalDays, daysLeft, endDate: endDate.toLocaleDateString() };
}

function getNextEvent(schedule: any, compounds: any[], type: 'Инъекция' | 'Таблетки') {
  if (!schedule || !compounds) return null;
  const now = new Date();
  let minDiff = Infinity;
  let nextLabel = '';
  Object.entries(schedule).forEach(([compoundKey, sched]: any) => {
    const comp = compounds.find((c: any) => c.key === compoundKey);
    if (!comp || comp.form !== type) return;
    const { days, time } = sched;
    if (!days || !time) return;
    days.forEach((day: string) => {
      const dayIdx = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(day);
      if (dayIdx === -1) return;
      const nextDate = new Date(now);
      nextDate.setHours(Number(time.split(':')[0] || 0), Number(time.split(':')[1] || 0), 0, 0);
      let addDays = (dayIdx - now.getDay() + 7) % 7;
      if (addDays === 0 && nextDate < now) addDays = 7;
      nextDate.setDate(now.getDate() + addDays);
      const diff = nextDate.getTime() - now.getTime();
      if (diff < minDiff) {
        minDiff = diff;
        nextLabel = `${comp.label} (${time})`;
      }
    });
  });
  if (minDiff === Infinity) return null;
  const hours = Math.floor(minDiff / (1000 * 60 * 60));
  const minutes = Math.floor((minDiff / (1000 * 60)) % 60);
  let timeStr = '';
  if (hours > 0) timeStr += `${hours} ч `;
  timeStr += `${minutes} мин`;
  return { label: nextLabel, time: timeStr };
}

// Компонент Empty State с шаблонами
const EmptyState = ({ onAddCourse, onUseTemplate }: { 
  onAddCourse: () => void;
  onUseTemplate: (template: any) => void;
}) => (
  <Animated.View entering={FadeIn.delay(300)} style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="fitness-outline" size={64} color={colors.gray} />
    </View>
    <Text style={styles.emptyTitle}>Нет активных курсов</Text>
    <Text style={styles.emptySubtitle}>
      Создайте свой первый курс
    </Text>
    
    <TouchableOpacity style={styles.emptyButton} onPress={onAddCourse}>
      <Ionicons name="add" size={20} color={colors.background} />
      <Text style={styles.emptyButtonText}>Создать курс</Text>
    </TouchableOpacity>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  searchWrapper: {
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.white,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.gray,
  },
  filtersContainer: {
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: colors.grayLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  templatesContainer: {
    width: '100%',
    gap: 12,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.gray,
  },
  templateFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchText: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  courseCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  cardMenuButton: {
    padding: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.grayLight + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.grayLight,
    marginHorizontal: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 'bold',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  nextEventsSection: {
    marginBottom: 16,
  },
  nextEventsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  nextEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nextEventText: {
    fontSize: 13,
    color: colors.gray,
  },
  courseInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabButton: {
    backgroundColor: colors.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default function CoursesScreen(props: any) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showSearch, setShowSearch] = useState(false);
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);

  // Анимированные значения
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const fetchCourses = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      
      if (!user_id) {
        setCourses([]);
        return;
      }
      
      const { data, error } = await getCourses(user_id);
      if (error) throw error;
      setCourses(data || []);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки курсов');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'активный':
        return colors.warning;
      case 'завершен':
        return colors.success;
      case 'приостановлен':
        return colors.error;
      default:
        return colors.accent;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'активный':
        return 'active';
      case 'завершен':
        return 'completed';
      case 'приостановлен':
        return 'paused';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'активный':
        return 'play';
      case 'завершен':
        return 'check';
      case 'приостановлен':
        return 'pause';
      default:
        return 'circle';
    }
  };

  // Функция сортировки
  const sortCourses = (courses: any[], sortBy: string) => {
    return [...courses].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'progress':
          return getCourseProgress(b.startDate, b.durationWeeks) - getCourseProgress(a.startDate, a.durationWeeks);
        case 'status':
          const statusOrder: { [key: string]: number } = { 'активный': 0, 'приостановлен': 1, 'завершен': 2 };
          return (statusOrder[a.status?.toLowerCase()] || 3) - (statusOrder[b.status?.toLowerCase()] || 3);
        default:
          return 0;
      }
    });
  };

  // Фильтрация и сортировка курсов
  const filteredAndSortedCourses = sortCourses(
    courses.filter(course => {
      const matchesFilter = activeFilter === 'all' || course.status?.toLowerCase() === activeFilter;
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.type?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }),
    sortBy
  );

  const handleUseTemplate = (template: any) => {
    navigation.navigate('AddEditCourse' as any, { template });
  };

  const handleUpdateStatus = async (courseId: string, status: string) => {
    try {
      await updateCourse(courseId, { status });
      setMenuVisibleId(null);
      fetchCourses();
    } catch (e: any) {
      alert(e.message || 'Не удалось обновить статус курса');
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка курсов...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Ошибка загрузки</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchCourses()}>
            <Ionicons name="refresh" size={20} color={colors.background} />
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Курсы</Text>
            <Text style={styles.headerSubtitle}>
              {courses.length} {courses.length === 1 ? 'курс' : 'курсов'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons 
                name={showSearch ? "close" : "search-outline"} 
                size={20} 
                color={colors.gray} 
              />
            </TouchableOpacity>
            <SortButton sortBy={sortBy} onSortChange={setSortBy} />
          </View>
        </View>
        
        {/* Search Bar */}
        {showSearch && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.searchWrapper}>
            <SearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск по названию или типу..."
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Filters */}
      {courses.length > 0 && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <FilterChip 
              label="Все" 
              active={activeFilter === 'all'} 
              onPress={() => setActiveFilter('all')} 
            />
            <FilterChip 
              label="Активные" 
              active={activeFilter === 'активный'} 
              onPress={() => setActiveFilter('активный')} 
            />
            <FilterChip 
              label="Завершенные" 
              active={activeFilter === 'завершен'} 
              onPress={() => setActiveFilter('завершен')} 
            />
            <FilterChip 
              label="Приостановленные" 
              active={activeFilter === 'приостановлен'} 
              onPress={() => setActiveFilter('приостановлен')} 
            />
          </ScrollView>
        </Animated.View>
      )}

      {/* Content */}
      {courses.length === 0 ? (
        <EmptyState 
          onAddCourse={() => navigation.navigate('AddEditCourse')}
          onUseTemplate={handleUseTemplate}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredAndSortedCourses.length === 0 ? (
            <Animated.View entering={FadeIn.delay(300)} style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color={colors.gray} />
              <Text style={styles.noResultsText}>
                {searchQuery ? 'Нет результатов по запросу' : 'Нет курсов по выбранному фильтру'}
              </Text>
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Очистить поиск</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            filteredAndSortedCourses.map((course, index) => (
              <Animated.View
                key={course.id}
                entering={FadeIn.delay(100 + index * 80)}
                layout={Layout.springify()}
              >
                <TouchableOpacity 
                  style={styles.courseCard}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                  activeOpacity={0.7}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {course.name}
                      </Text>
                      <Badge 
                        variant={getStatusVariant(course.status)}
                        color={getStatusColor(course.status)}
                        icon={getStatusIcon(course.status)}
                        size="small"
                      >
                        {course.status}
                      </Badge>
                    </View>
                    <Menu
                      visible={menuVisibleId === course.id}
                      onDismiss={() => setMenuVisibleId(null)}
                      anchor={
                        <TouchableOpacity 
                          style={styles.cardMenuButton} 
                          onPress={() => setMenuVisibleId(course.id)}
                        >
                          <Ionicons name="ellipsis-vertical" size={16} color={colors.gray} />
                        </TouchableOpacity>
                      }
                      contentStyle={{ backgroundColor: colors.card }}
                    >
                      {course.status?.toLowerCase() === 'активный' && (
                        <Menu.Item 
                          onPress={() => handleUpdateStatus(course.id, 'приостановлен')} 
                          title="Приостановить курс" 
                          titleStyle={{ color: colors.warning }} 
                        />
                      )}
                      {course.status?.toLowerCase() !== 'активный' && course.status?.toLowerCase() !== 'завершен' && (
                        <Menu.Item 
                          onPress={() => handleUpdateStatus(course.id, 'активный')} 
                          title="Сделать активным" 
                          titleStyle={{ color: colors.success }} 
                        />
                      )}
                      {course.status?.toLowerCase() !== 'завершен' && (
                        <Menu.Item 
                          onPress={() => handleUpdateStatus(course.id, 'завершен')} 
                          title="Завершить курс" 
                          titleStyle={{ color: colors.gray }} 
                        />
                      )}
                    </Menu>
                  </View>

                  {/* Quick Stats */}
                  <QuickStats course={course} />

                  {/* Progress Section */}
                  <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Прогресс курса</Text>
                      <Text style={styles.progressValue}>
                        {getCourseProgress(course.startDate, course.durationWeeks)}%
                      </Text>
                      </View>
                    <ProgressBar 
                      value={getCourseProgress(course.startDate, course.durationWeeks)} 
                      color={getStatusColor(course.status)}
                      height={6}
                    />
                    </View>

                  {/* Next Events */}
                    {course.status?.toLowerCase() === 'активный' && (() => {
                      let schedule: Record<string, any> = {};
                      let compounds = [];
                      try {
                        schedule = JSON.parse(course.schedule || '{}');
                        compounds = JSON.parse(course.compounds || '[]');
                      } catch { return null; }
                    
                      const nextInjection = getNextEvent(schedule, compounds, 'Инъекция');
                      const nextTablet = getNextEvent(schedule, compounds, 'Таблетки');
                    
                    if (!nextInjection && !nextTablet) return null;
                    
                      return (
                      <View style={styles.nextEventsSection}>
                        <Text style={styles.nextEventsTitle}>Ближайшие события</Text>
                          {nextInjection && (
                          <View style={styles.nextEventItem}>
                            <FontAwesome5 name="syringe" size={14} color={colors.accent} />
                            <Text style={styles.nextEventText}>
                              Инъекция через {nextInjection.time}
                            </Text>
                          </View>
                          )}
                          {nextTablet && (
                          <View style={styles.nextEventItem}>
                            <FontAwesome5 name="pills" size={14} color={colors.blue} />
                            <Text style={styles.nextEventText}>
                              Таблетка через {nextTablet.time}
                            </Text>
                          </View>
                          )}
                        </View>
                      );
                    })()}

                    {/* Course Info */}
                    <View style={styles.courseInfo}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <FontAwesome5 name="dumbbell" size={14} color={colors.gray} />
                        <Text style={styles.infoText}>{course.type || 'Не указан'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <FontAwesome5 name="calendar-week" size={14} color={colors.gray} />
                        <Text style={styles.infoText}>
                          {getCurrentWeek(course.startDate)} / {course.durationWeeks || 12} нед.
                        </Text>
                      </View>
                      </View>
                      </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
          
          {/* Bottom spacing for FAB */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <Animated.View 
        entering={FadeIn.delay(500)}
        style={[styles.fab, pulseStyle]}
      >
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => navigation.navigate('AddEditCourse')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// Компонент фильтра (без изменений)
const FilterChip = ({ 
  label, 
  active = false, 
  onPress 
}: { 
  label: string; 
  active?: boolean; 
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[styles.filterChip, active && styles.filterChipActive]} 
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);