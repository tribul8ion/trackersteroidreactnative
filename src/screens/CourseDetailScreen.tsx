import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
  FlatList,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  SlideInRight,
  SlideInUp,
  Layout,
} from 'react-native-reanimated';
import { getCourseById, deleteCourse, updateCourse } from '../services/courses';
import { getUser } from '../services/auth';
import { addAction, getActions } from '../services/actions';
import { getLabs } from '../services/labs';
import { isInjectionForm } from '../services/domain';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Portal, Dialog, Button, Menu } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'overview', label: 'Обзор', icon: 'analytics-outline' },
  { key: 'progress', label: 'Прогресс', icon: 'trending-up-outline' },
  { key: 'schedule', label: 'Расписание', icon: 'calendar-outline' },
  { key: 'analytics', label: 'Аналитика', icon: 'bar-chart-outline' },
];

// Улучшенный компонент Progress Bar с градиентом
const ProgressBar = ({ 
  value, 
  max = 100, 
  color = colors.accent,
  height = 8,
  showPercentage = false,
  animated = true
}: { 
  value: number; 
  max?: number; 
  color?: string;
  height?: number;
  showPercentage?: boolean;
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

// Компонент Mini Chart для трендов
const MiniChart = ({ 
  data, 
  color = colors.accent,
  height = 40,
  showDots = false
}: {
  data: number[];
  color?: string;
  height?: number;
  showDots?: boolean;
}) => {
  if (!data.length) return null;

  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <View style={[styles.miniChart, { height }]}>
      <LineChart
        data={chartData}
        width={80}
        height={height}
        color={color}
        thickness={2}
        hideDataPoints={!showDots}
        hideAxesAndRules
        hideYAxisText
        curved
      />
    </View>
  );
};

// Улучшенный компонент Badge без анимации дыхания
const Badge = ({ 
  children, 
  variant = 'default',
  color = colors.accent,
  icon,
  size = 'medium',
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

// Компонент Metric Card с трендом
const MetricCard = ({ 
  icon, 
  label, 
  value, 
  color = colors.accent,
  trend,
  trendData,
  subtitle,
  onPress
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendData?: number[];
  subtitle?: string;
  onPress?: () => void;
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'minus';
      default: return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return colors.success;
      case 'down': return colors.error;
      case 'stable': return colors.gray;
      default: return colors.gray;
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component style={styles.metricCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
      <FontAwesome5 name={icon as any} size={20} color={color} />
    </View>
        {trendData && <MiniChart data={trendData} color={color} />}
    </View>
      
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        
        {trend && (
          <View style={styles.metricTrend}>
            <FontAwesome5 name={getTrendIcon()!} size={12} color={getTrendColor()} />
            <Text style={[styles.metricTrendText, { color: getTrendColor() }]}>
              {trend === 'up' ? 'Рост' : trend === 'down' ? 'Снижение' : 'Стабильно'}
            </Text>
  </View>
        )}
      </View>
    </Component>
);
};

// Компонент Achievement Badge
const AchievementBadge = ({ 
  icon, 
  title, 
  description,
  unlocked = false,
  progress = 0
}: {
  icon: string;
  title: string;
  description: string;
  unlocked?: boolean;
  progress?: number;
}) => (
  <View style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}>
    <View style={[styles.achievementIcon, { backgroundColor: unlocked ? colors.warning + '20' : colors.gray + '20' }]}>
      <FontAwesome5 
        name={icon} 
        size={24} 
        color={unlocked ? colors.warning : colors.gray} 
      />
    </View>
    <View style={styles.achievementContent}>
      <Text style={[styles.achievementTitle, { color: unlocked ? colors.white : colors.gray }]}>
        {title}
      </Text>
      <Text style={styles.achievementDescription}>{description}</Text>
      {!unlocked && progress > 0 && (
        <ProgressBar value={progress} height={4} color={colors.accent} />
      )}
    </View>
  </View>
);

// Компонент Calendar View
const CalendarView = ({ schedule, compounds }: { schedule: any; compounds: any[] }) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const getEventsForDay = (dayKey: string) => {
    const events: any[] = [];
    
    Object.entries(schedule).forEach(([compoundKey, sched]: any) => {
      const compound = compounds.find(c => c.key === compoundKey);
      if (!compound || !sched.days || !sched.days.includes(dayKey)) return;
      
      events.push({
        time: sched.time || '09:00',
        compound: compound.label || compound.key,
        type: compound.form,
        color: isInjectionForm(compound.form) ? colors.accent : colors.blue
      });
    });
    
    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>Расписание на неделю</Text>
        <View style={styles.weekSelector}>
          <TouchableOpacity 
            style={styles.weekButton}
            onPress={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
          >
            <FontAwesome5 name="chevron-left" size={16} color={colors.gray} />
  </TouchableOpacity>
          <Text style={styles.weekText}>Неделя {selectedWeek + 1}</Text>
          <TouchableOpacity 
            style={styles.weekButton}
            onPress={() => setSelectedWeek(selectedWeek + 1)}
          >
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.calendarGrid}>
        {weekDays.map((day, index) => {
          const dayKey = dayKeys[index];
          const events = getEventsForDay(dayKey);
          
          return (
            <View key={day} style={styles.calendarDay}>
              <Text style={styles.calendarDayLabel}>{day}</Text>
              <View style={styles.calendarDayEvents}>
                {events.map((event, eventIndex) => (
                  <View 
                    key={eventIndex} 
                    style={[styles.calendarEvent, { backgroundColor: event.color + '20' }]}
                  >
                    <Text style={[styles.calendarEventTime, { color: event.color }]}>
                      {event.time}
                    </Text>
                    <Text style={styles.calendarEventText} numberOfLines={2}>
                      {event.compound}
                    </Text>
                  </View>
                ))}
                {events.length === 0 && (
                  <View style={styles.calendarEmptyDay}>
                    <Text style={styles.calendarEmptyText}>Отдых</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Компонент Weekly Progress Chart
const WeeklyProgressChart = ({ actions, startDate, durationWeeks }: { 
  actions: any[]; 
  startDate: string; 
  durationWeeks: number;
}) => {
  const getWeeklyData = () => {
    const weeks = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < durationWeeks; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekActions = actions.filter(action => {
        const actionDate = new Date(action.timestamp);
        return actionDate >= weekStart && actionDate <= weekEnd;
      });
      
      const injections = weekActions.filter(a => a.type === 'injection').length;
      const tablets = weekActions.filter(a => a.type === 'tablet').length;
      const labs = weekActions.filter(a => a.type === 'lab').length;
      const notes = weekActions.filter(a => a.type === 'note').length;
      
      weeks.push({
        week: i + 1,
        injections,
        tablets,
        labs,
        notes,
        total: injections + tablets + labs + notes
      });
    }
    
    return weeks;
  };

  const weeklyData = getWeeklyData();
  const maxValue = Math.max(...weeklyData.map(w => w.total)) || 10;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Активность по неделям</Text>
      
      {/* Статистика по неделям */}
      <View style={styles.weeklyStats}>
        {weeklyData.slice(-4).map((week, index) => (
          <View key={week.week} style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatWeek}>Н{week.week}</Text>
            <View style={styles.weeklyStatBars}>
              <View style={[styles.weeklyStatBar, { 
                height: (week.injections / maxValue) * 20, 
                backgroundColor: colors.accent 
              }]} />
              <View style={[styles.weeklyStatBar, { 
                height: (week.tablets / maxValue) * 20, 
                backgroundColor: colors.blue 
              }]} />
              <View style={[styles.weeklyStatBar, { 
                height: (week.labs / maxValue) * 20, 
                backgroundColor: colors.success 
              }]} />
            </View>
            <Text style={styles.weeklyStatTotal}>{week.total}</Text>
          </View>
        ))}
      </View>

      {/* Основной график */}
      <BarChart
        data={weeklyData.map(week => ({
          value: week.total,
          label: `Н${week.week}`,
          frontColor: colors.accent,
        }))}
        width={width - 64}
        height={200}
        barWidth={22}
        spacing={20}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: colors.gray }}
        xAxisLabelTextStyle={{ color: colors.gray }}
        noOfSections={3}
        maxValue={maxValue}
      />
    </View>
  );
};

// Компонент Compliance Chart
const ComplianceChart = ({ actions, startDate, durationWeeks }: { 
  actions: any[]; 
  startDate: string; 
  durationWeeks: number;
}) => {
  const getComplianceData = () => {
    const weeks = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < durationWeeks; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekActions = actions.filter(action => {
        const actionDate = new Date(action.timestamp);
        return actionDate >= weekStart && actionDate <= weekEnd;
      });
      
      // Предполагаем, что в неделю должно быть 7 инъекций и 14 приёмов таблеток
      const expectedInjections = 7;
      const expectedTablets = 14;
      
      const actualInjections = weekActions.filter(a => a.type === 'injection').length;
      const actualTablets = weekActions.filter(a => a.type === 'tablet').length;
      
      const injectionCompliance = Math.min(100, (actualInjections / expectedInjections) * 100);
      const tabletCompliance = Math.min(100, (actualTablets / expectedTablets) * 100);
      const overallCompliance = (injectionCompliance + tabletCompliance) / 2;
      
      weeks.push({
        week: i + 1,
        injectionCompliance,
        tabletCompliance,
        overallCompliance
      });
    }
    
    return weeks;
  };

  const complianceData = getComplianceData();

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Соблюдение графика</Text>
      
      <LineChart
        data={complianceData.map(week => ({
          value: week.overallCompliance,
          label: `Н${week.week}`,
          index: week.week - 1
        }))}
        width={width - 64}
        height={200}
        color={colors.success}
        thickness={3}
        curved
        dataPointsColor={colors.success}
        dataPointsRadius={5}
        hideAxesAndRules={false}
        xAxisThickness={1}
        yAxisThickness={1}
        xAxisColor={colors.grayLight}
        yAxisColor={colors.grayLight}
        xAxisLabelTextStyle={{ color: colors.gray, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.gray, fontSize: 10 }}
        rulesColor={colors.grayLight}
        rulesType="dashed"
        showVerticalLines
        verticalLinesColor={colors.grayLight}
        noOfSections={4}
        maxValue={100}
      />
    </View>
  );
};

// Компонент Health Trends
const HealthTrends = ({ labs }: { labs: any[] }) => {
  const getHealthTrends = () => {
    const trends = {
      testosterone: [],
      estradiol: [],
      prolactin: [],
      liver: []
    };

    labs.forEach(lab => {
      const date = new Date(lab.date);
      const value = lab.value;
      
      switch (lab.name) {
        case 'Тестостерон общий':
          trends.testosterone.push({ date, value });
          break;
        case 'Эстрадиол':
          trends.estradiol.push({ date, value });
          break;
        case 'Пролактин':
          trends.prolactin.push({ date, value });
          break;
        case 'АЛТ':
        case 'АСТ':
          trends.liver.push({ date, value, name: lab.name });
          break;
      }
    });

    return trends;
  };

  const trends = getHealthTrends();

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Показатели здоровья</Text>
      
      {trends.testosterone.length > 0 && (
        <View style={styles.trendSection}>
          <Text style={styles.trendLabel}>Тестостерон</Text>
          <LineChart
            data={trends.testosterone.map((point, index) => ({
              value: point.value,
              index
            }))}
            width={width - 64}
            height={120}
            color={colors.accent}
            thickness={2}
            curved
            hideAxesAndRules
            hideYAxisText
          />
        </View>
      )}
      
      {trends.liver.length > 0 && (
        <View style={styles.trendSection}>
          <Text style={styles.trendLabel}>Печень (АЛТ/АСТ)</Text>
          <LineChart
            data={trends.liver.map((point, index) => ({
              value: point.value,
              index
            }))}
            width={width - 64}
            height={120}
            color={colors.warning}
            thickness={2}
            curved
            hideAxesAndRules
            hideYAxisText
          />
        </View>
      )}
    </View>
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

function getCurrentWeek(startDate: string, durationWeeks: number) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.min(1 + Math.floor(daysPassed / 7), durationWeeks || 12);
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

// Компонент Tab Button
const TabButton = ({ 
  tab, 
  active, 
  onPress 
}: { 
  tab: any; 
  active: boolean; 
  onPress: () => void;
}) => (
  <TouchableOpacity 
    style={[styles.tabButton, active && styles.tabButtonActive]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons 
      name={tab.icon} 
      size={20} 
      color={active ? colors.accent : colors.gray} 
    />
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {tab.label}
    </Text>
  </TouchableOpacity>
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
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    padding: 4,
  },
  courseInfoSection: {
    padding: 16,
  },
  courseInfoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  courseInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flex: 1,
  },
  editButton: {
    padding: 8,
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
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  progressInfo: {
    marginTop: 8,
  },
  progressInfoText: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  nextEventsSection: {
    marginTop: 16,
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
  tabsContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 0,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    minHeight: 60,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: 'transparent',
    marginBottom: 4,
    marginTop: 4,
  },
  tabButtonActive: {
    backgroundColor: colors.accent + '20',
    marginBottom: 4,
    marginTop: 4,
  },
  tabButtonText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContentWrapper: {
    flex: 1,
  },
  tabContentContainer: {
    gap: 24,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContent: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricSubtitle: {
    fontSize: 10,
    color: colors.gray,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricTrendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  compoundsContainer: {
    gap: 12,
  },
  compoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  compoundIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compoundInfo: {
    flex: 1,
  },
  compoundName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  compoundForm: {
    fontSize: 12,
    color: colors.gray,
  },
  compoundDosage: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: colors.gray,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekButton: {
    padding: 8,
  },
  weekText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  calendarDayEvents: {
    width: '100%',
    gap: 4,
  },
  calendarEvent: {
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  calendarEventTime: {
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 2,
  },
  calendarEventText: {
    fontSize: 8,
    color: colors.white,
    textAlign: 'center',
  },
  calendarEmptyDay: {
    padding: 8,
    alignItems: 'center',
  },
  calendarEmptyText: {
    fontSize: 10,
    color: colors.gray,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
  },
  weeklyStatItem: {
    alignItems: 'center',
    gap: 8,
  },
  weeklyStatWeek: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
  },
  weeklyStatBars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
  },
  weeklyStatBar: {
    width: 8,
    borderRadius: 2,
  },
  weeklyStatTotal: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  trendSection: {
    marginBottom: 16,
  },
  trendLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
    fontWeight: '600',
  },
  miniChart: {
    overflow: 'hidden',
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
});

const CourseDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { courseId } = (route.params || {}) as { courseId: string };
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [stats, setStats] = useState({ injections: 0, tablets: 0, labs: 0, effects: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Анимированные значения
  const pulseAnimation = useSharedValue(1);
  const fadeAnimation = useSharedValue(0);

  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    fadeAnimation.value = withTiming(1, { duration: 800 });
  }, []);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getCourseById(courseId);
      if (error) throw error;
      if (!data) throw new Error('Курс не найден');
      setCourse({
        ...data,
        compounds: JSON.parse(data.compounds || '[]'),
        doses: JSON.parse(data.doses || '{}'),
        schedule: JSON.parse(data.schedule || '{}'),
        pct: JSON.parse(data.pct || '[]'),
      });
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки курса');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchActions = async (user_id: string) => {
    try {
      const { data, error } = await getActions(user_id, courseId);
      if (error) throw error;
      setActions(data || []);
      
      // Аналитика по actions
      const injections = (data || [])
        .filter((a: any) => a.type === 'injection')
        .reduce((sum: number, a: any) => {
          try {
            const details = JSON.parse(a.details);
            if (Array.isArray(details)) {
              return sum + details.length;
            } else {
              return sum + 1;
            }
          } catch {
            return sum;
          }
        }, 0);
      
      // Теперь tablets — это количество логов (приёмов), а не сумма amount
      const tablets = (data || [])
        .filter((a: any) => a.type === 'tablet')
        .length;
      
      const labs = (data || []).filter((a: any) => a.type === 'lab').length;
      const effects = (data || []).filter((a: any) => a.type === 'effect').length;
      setStats({ injections, tablets, labs, effects });
    } catch {}
  };

  const fetchLabs = async (user_id: string) => {
    try {
      const { data } = await getLabs(user_id);
      setLabs(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    (async () => {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      if (user_id) {
        fetchActions(user_id);
        fetchLabs(user_id);
      }
    })();
  }, [courseId, refreshing]);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { data } = await getUser();
        const user_id = data?.user?.id;
        if (user_id) {
          fetchActions(user_id);
          fetchLabs(user_id);
        }
      })();
    }, [courseId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourse();
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

  // Функция для получения достижений
  const getAchievements = () => {
    const achievements = [
      {
        icon: 'calendar-check',
        title: 'Первая неделя',
        description: 'Завершите первую неделю курса',
        unlocked: getCurrentWeek(course?.startDate, course?.durationWeeks) > 1,
        progress: Math.min(100, (getCurrentWeek(course?.startDate, course?.durationWeeks) / 1) * 100)
      },
      {
        icon: 'syringe',
        title: 'Первые 10 инъекций',
        description: 'Сделайте 10 инъекций',
        unlocked: stats.injections >= 10,
        progress: Math.min(100, (stats.injections / 10) * 100)
      },
      {
        icon: 'chart-line',
        title: 'Половина пути',
        description: 'Пройдите 50% курса',
        unlocked: getCourseProgress(course?.startDate, course?.durationWeeks) >= 50,
        progress: getCourseProgress(course?.startDate, course?.durationWeeks) * 2
      },
      {
        icon: 'trophy',
        title: 'Завершение курса',
        description: 'Завершите весь курс',
        unlocked: course?.status === 'завершен',
        progress: getCourseProgress(course?.startDate, course?.durationWeeks)
      }
    ];
    
    return achievements;
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateCourse(courseId, { status });
      setMenuVisible(false);
      navigation.navigate('Main' as any, { screen: 'Courses' });
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось обновить статус курса');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContentContainer}>
            {/* Key Metrics */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Ключевые показатели</Text>
              <View style={styles.metricsGrid}>
                <MetricCard
                  icon="calendar-week" 
                  label="Неделя курса"
                  value={`${getCurrentWeek(course.startDate, course.durationWeeks)} / ${course.durationWeeks || 12}`}
                  color={colors.accent}
                  subtitle="Текущая неделя"
                />
                <MetricCard
                  icon="hourglass-half" 
                  label="Дней осталось"
                  value={String(getCourseProgressDays(course.startDate, course.durationWeeks).daysLeft)}
                  color={colors.orange}
                  subtitle="До завершения"
                />
                <MetricCard
                  icon="syringe" 
                  label="Инъекций" 
                  value={String(stats.injections)}
                  color={colors.accent}
                  subtitle="Всего сделано"
                />
                <MetricCard
                  icon="pills" 
                  label="Приёмов" 
                  value={String(stats.tablets)}
                  color={colors.blue}
                  subtitle="Всего приёмов"
                />
              </View>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Быстрые действия</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('LogInjectionModal', { courseId })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '20' }]}> 
                    <FontAwesome5 name="syringe" size={24} color={colors.accent} />
                  </View>
                  <Text style={styles.quickActionLabel}>Добавить инъекцию</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('LogTabletModal', { courseId })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.blue + '20' }]}> 
                    <FontAwesome5 name="pills" size={24} color={colors.blue} />
                  </View>
                  <Text style={styles.quickActionLabel}>Принять таблетку</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('LogNoteModal', { courseId })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.orange + '20' }]}> 
                    <FontAwesome5 name="edit" size={24} color={colors.orange} />
                  </View>
                  <Text style={styles.quickActionLabel}>Добавить заметку</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Labs')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}> 
                    <FontAwesome5 name="vial" size={24} color={colors.success} />
                  </View>
                  <Text style={styles.quickActionLabel}>Добавить анализы</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Current Compounds */}
            <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Текущие препараты</Text>
              <View style={styles.compoundsContainer}>
                {course.compounds.map((compound: any, index: number) => {
                  // Дозировка
                  const dose = (course.doses && course.doses[compound.key]) || compound.dosage || '';
                  // Расписание
                  const sched = course.schedule && course.schedule[compound.key];
                  let scheduleText = '';
                  if (sched) {
                    const times = sched.timesPerDay || 1;
                    const days: string[] = sched.days || [];
                    const time = sched.time || '';
                    let daysText = '';
                    if (days.length === 7) {
                      daysText = 'ежедневно';
                    } else if (days.length === 1) {
                      daysText = `по ${{
                        'mon': 'понедельникам', 'tue': 'вторникам', 'wed': 'средам', 'thu': 'четвергам', 'fri': 'пятницам', 'sat': 'субботам', 'sun': 'воскресеньям'
                      }[days[0]] || days[0]}`;
                    } else if (days.length > 1) {
                      daysText = 'по: ' + (days as string[]).map((d: string) => ({
                        'mon': 'Пн', 'tue': 'Вт', 'wed': 'Ср', 'thu': 'Чт', 'fri': 'Пт', 'sat': 'Сб', 'sun': 'Вс'
                      }[d] || d)).join(', ');
                    }
                    scheduleText = `${times} раз${times > 1 ? 'а' : ''} в день${daysText ? ', ' + daysText : ''}${time ? `, в ${time}` : ''}`;
                  }
                  return (
                    <View key={index} style={styles.compoundCard}>
                      <View style={[
                        styles.compoundIcon, 
                        { backgroundColor: compound.form === 'Инъекция' ? colors.accent + '20' : colors.blue + '20' }
                      ]}>
                        <FontAwesome5 
                          name={compound.form === 'Инъекция' ? 'syringe' : 'pills'} 
                          size={16} 
                          color={compound.form === 'Инъекция' ? colors.accent : colors.blue} 
                        />
                      </View>
                      <View style={styles.compoundInfo}>
                        <Text style={styles.compoundName}>{compound.label || compound.key}</Text>
                        <Text style={styles.compoundForm}>{compound.form}</Text>
                        {dose && (
                          <Text style={styles.compoundDosage}>
                            {compound.form === 'Инъекция'
                              ? (() => {
                                  const volume = Number(dose);
                                  const conc = Number(compound.concentration || 0);
                                  if (conc > 0 && volume > 0) {
                                    return `${volume} мл (${volume * conc} мг)`;
                                  } else if (volume > 0) {
                                    return `${volume} мл`;
                                  } else {
                                    return '';
                                  }
                                })()
                              : `${dose} мг`}
                          </Text>
                        )}
                        {scheduleText && <Text style={{ color: colors.gray, fontSize: 12 }}>{scheduleText}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
              {/* ПКТ */}
              {course.pct && Array.isArray(course.pct) && course.pct.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>Препараты ПКТ</Text>
                  <View style={styles.compoundsContainer}>
                    {course.pct.map((pct: any, idx: number) => (
                      <View key={idx} style={styles.compoundCard}>
                        <View style={[
                          styles.compoundIcon,
                          { backgroundColor: colors.orange + '20' }
                        ]}>
                          <FontAwesome5 name="capsules" size={16} color={colors.orange} />
                        </View>
                        <View style={styles.compoundInfo}>
                          <Text style={styles.compoundName}>{pct.label || pct.key}</Text>
                          <Text style={styles.compoundForm}>ПКТ</Text>
                          {pct.dose && <Text style={styles.compoundDosage}>{pct.dose}</Text>}
                          {pct.duration && <Text style={{ color: colors.gray, fontSize: 12 }}>Длительность: {pct.duration} дней</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        );

      case 'progress':
        return (
          <View style={styles.tabContentContainer}>
            <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
              <WeeklyProgressChart 
                actions={actions} 
                startDate={course.startDate} 
                durationWeeks={course.durationWeeks} 
              />
            </Animated.View>
          </View>
        );

      case 'schedule':
        return (
          <View style={styles.tabContentContainer}>
            <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
              <CalendarView schedule={course.schedule} compounds={course.compounds} />
            </Animated.View>
          </View>
        );

      case 'analytics':
        return (
          <View style={styles.tabContentContainer}>
            <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
              <ComplianceChart 
                actions={actions} 
                startDate={course.startDate} 
                durationWeeks={course.durationWeeks} 
              />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
              <HealthTrends labs={labs} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Детальная аналитика</Text>
              <View style={styles.analyticsGrid}>
                <MetricCard
                  icon="chart-line"
                  label="Соблюдение графика"
                  value="87%"
                  color={colors.success}
                  trend="up"
                  subtitle="За последние 7 дней"
                />
                <MetricCard
                  icon="target"
                  label="Эффективность"
                  value="92%"
                  color={colors.accent}
                  trend="stable"
                  subtitle="Общая оценка"
                />
                <MetricCard
                  icon="heartbeat"
                  label="Здоровье"
                  value="85%"
                  color={colors.warning}
                  trend="up"
                  subtitle="По анализам"
                />
                <MetricCard
                  icon="trophy"
                  label="Достижения"
                  value="3/5"
                  color={colors.orange}
                  trend="up"
                  subtitle="Получено"
                />
              </View>
            </Animated.View>
          </View>
        );
      
      default:
        return (
          <Animated.View entering={FadeIn.delay(100)} style={styles.placeholderContainer}>
            <FontAwesome5 name="dumbbell" size={64} color={colors.gray} />
            <Text style={styles.placeholderTitle}>В разработке</Text>
            <Text style={styles.placeholderText}>
              Раздел "{TABS.find(tab => tab.key === activeTab)?.label}" находится в разработке
            </Text>
          </Animated.View>
        );
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await deleteCourse(courseId);
      navigation.navigate('Main' as any, { screen: 'Courses' });
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось удалить курс');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка курса...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка: {error || 'Курс не найден'}</Text>
          <TouchableOpacity onPress={fetchCourse} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { daysPassed, totalDays, daysLeft, endDate } = getCourseProgressDays(course.startDate, course.durationWeeks);
  const nextInjection = getNextEvent(course.schedule, course.compounds, 'Инъекция');
  const nextTablet = getNextEvent(course.schedule, course.compounds, 'Таблетки');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {course.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {course.phase ? course.phase + ' • ' : ''}Неделя {getCurrentWeek(course.startDate, course.durationWeeks)}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity style={styles.headerAction} onPress={() => setMenuVisible(true)}>
                  <FontAwesome5 name="ellipsis-v" size={20} color={colors.white} />
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: colors.card }}
            >
              {course.status?.toLowerCase() === 'активный' && (
                <Menu.Item 
                  onPress={() => handleUpdateStatus('приостановлен')} 
                  title="Приостановить курс" 
                  titleStyle={{ color: colors.warning }} 
                />
              )}
              {course.status?.toLowerCase() !== 'активный' && course.status?.toLowerCase() !== 'завершен' && (
                <Menu.Item 
                  onPress={() => handleUpdateStatus('активный')} 
                  title="Сделать активным" 
                  titleStyle={{ color: colors.success }} 
                />
              )}
              {course.status?.toLowerCase() !== 'завершен' && (
                <Menu.Item 
                  onPress={() => handleUpdateStatus('завершен')} 
                  title="Завершить курс" 
                  titleStyle={{ color: colors.gray }} 
                />
              )}
            </Menu>
            
              <TouchableOpacity style={styles.headerAction} onPress={() => setShowDeleteModal(true)}>
              <FontAwesome5 name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

        {/* Course Info Card */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.courseInfoSection}>
        <View style={styles.courseInfoCard}>
            <View style={styles.courseInfoHeader}>
                <View style={styles.statusContainer}>
                  <Badge 
                    variant={getStatusVariant(course.status)}
                    color={getStatusColor(course.status)}
                icon={getStatusIcon(course.status)}
                  >
                    {course.status}
                  </Badge>
              </View>
              
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AddEditCourse', { course })}>
              <FontAwesome5 name="edit" size={16} color={colors.accent} />
              </TouchableOpacity>
            </View>

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
              height={8}
              showPercentage={false}
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressInfoText}>
                {daysPassed} из {totalDays} дней • Осталось {daysLeft} дней
              </Text>
              </View>
            </View>

          {/* Next Events */}
          {(nextInjection || nextTablet) && (
            <View style={styles.nextEventsSection}>
              <Text style={styles.nextEventsTitle}>Ближайшие события</Text>
            {nextInjection && (
                <View style={styles.nextEventItem}>
                  <FontAwesome5 name="syringe" size={16} color={colors.accent} />
                  <Text style={styles.nextEventText}>
                    Инъекция через {nextInjection.time}
                  </Text>
                </View>
            )}
            {nextTablet && (
                <View style={styles.nextEventItem}>
                  <FontAwesome5 name="pills" size={16} color={colors.blue} />
                  <Text style={styles.nextEventText}>
                    Таблетка через {nextTablet.time}
                    </Text>
                  </View>
              )}
                </View>
          )}
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map(tab => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </ScrollView>
        </Animated.View>

        {/* Tab Content */}
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
        <Animated.View entering={FadeIn.delay(400)} style={styles.tabContentWrapper}>
          {renderTabContent()}
        </Animated.View>
      </ScrollView>

      {/* Delete Modal */}
      <Portal>
        <Dialog 
          visible={showDeleteModal} 
          onDismiss={() => setShowDeleteModal(false)} 
          style={{ backgroundColor: colors.card }}
        >
          <Dialog.Title style={{ color: colors.white, textAlign: 'center' }}>
            Удалить курс?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.gray, fontSize: 15, textAlign: 'center' }}>
              Вы уверены, что хотите удалить этот курс? Это действие необратимо.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'flex-end' }}>
            <Button onPress={() => setShowDeleteModal(false)} textColor={colors.gray}>
              Отмена
            </Button>
            <Button 
              onPress={async () => { 
                setShowDeleteModal(false); 
                await handleDeleteCourse(); 
              }} 
              textColor={colors.error}
            >
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default CourseDetailScreen;