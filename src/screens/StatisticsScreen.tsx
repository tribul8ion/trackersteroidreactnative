import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getUser } from '../services/auth';
import { getCourses } from '../services/courses';
import { getActions } from '../services/actions';
import { getLabs } from '../services/labs';
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
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

// Компонент для статистических карточек
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = colors.accent, 
  trend = null,
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: string; 
  color?: string; 
  trend?: { value: number; isPositive: boolean } | null;
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
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <FontAwesome5 name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={[styles.trend, { backgroundColor: trend.isPositive ? colors.success + '20' : colors.error + '20' }]}>
            <Ionicons 
              name={trend.isPositive ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend.isPositive ? colors.success : colors.error} 
            />
            <Text style={[styles.trendText, { color: trend.isPositive ? colors.success : colors.error }]}>
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Animated.View>
  );
};

// Компонент для графиков
const ChartCard = ({ 
  title, 
  children, 
  delay = 0 
}: { 
  title: string; 
  children: React.ReactNode; 
  delay?: number;
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 800 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.chartCard, animatedStyle]}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </Animated.View>
  );
};

// Компонент для временных фильтров
const TimeFilter = ({ 
  selected, 
  onSelect 
}: { 
  selected: string; 
  onSelect: (period: string) => void;
}) => {
  const periods = [
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'quarter', label: 'Квартал' },
    { key: 'year', label: 'Год' },
    { key: 'all', label: 'Все время' }
  ];

  return (
    <View style={styles.timeFilter}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.timeFilterButton,
            selected === period.key && styles.timeFilterButtonActive
          ]}
          onPress={() => onSelect(period.key)}
        >
          <Text style={[
            styles.timeFilterText,
            selected === period.key && styles.timeFilterTextActive
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const StatisticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('month');
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalInjections: 0,
    totalTablets: 0,
    totalLabs: 0,
    averageCompliance: 0,
    totalWeight: 0,
    averageWeight: 0
  });

  // Данные для графиков
  const [chartData, setChartData] = useState({
    weightTrend: [],
    complianceTrend: [],
    injectionFrequency: [],
    labResults: []
  });

  const fetchStats = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(isRefresh);
    
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      
      if (!user_id) return;
      
      // Получаем данные
      const [coursesRes, actionsRes, labsRes] = await Promise.all([
        getCourses(user_id),
        getActions(user_id),
        getLabs(user_id)
      ]);

      const courses = coursesRes.data || [];
      const actions = actionsRes.data || [];
      const labs = labsRes.data || [];

      // Вычисляем статистику
      const activeCourses = courses.filter(c => c.status === 'активный').length;
      const completedCourses = courses.filter(c => c.status === 'завершен').length;
      const injections = actions.filter(a => a.type === 'injection');
      const tablets = actions.filter(a => a.type === 'tablet');

      // Вычисляем средний вес
      const weightEntries = actions.filter(a => a.weight && a.weight > 0);
      const totalWeight = weightEntries.reduce((sum, a) => sum + (a.weight || 0), 0);
      const averageWeight = weightEntries.length > 0 ? totalWeight / weightEntries.length : 0;

      // Вычисляем комплаенс (соблюдение графика)
      const totalScheduledActions = actions.length;
      const completedActions = actions.filter(a => a.completed).length;
      const averageCompliance = totalScheduledActions > 0 ? (completedActions / totalScheduledActions) * 100 : 0;

      setStats({
        totalCourses: courses.length,
        activeCourses,
        completedCourses,
        totalInjections: injections.length,
        totalTablets: tablets.length,
        totalLabs: labs.length,
        averageCompliance: Math.round(averageCompliance),
        totalWeight: Math.round(totalWeight),
        averageWeight: Math.round(averageWeight)
      });

      // Подготавливаем данные для графиков
      prepareChartData(courses, actions, labs);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const prepareChartData = (courses: any[], actions: any[], labs: any[]) => {
    // Тренд веса
    const weightData = actions
      .filter(a => a.weight && a.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10)
      .map((action, index) => ({
        value: action.weight,
        label: new Date(action.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        dataPointText: `${action.weight}кг`
      }));

    // Тренд комплаенса по неделям
    const complianceData = [];
    const weeks = 8; // Последние 8 недель
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekActions = actions.filter(a => {
        const actionDate = new Date(a.date);
        return actionDate >= weekStart && actionDate <= weekEnd;
      });

      const completed = weekActions.filter(a => a.completed).length;
      const total = weekActions.length;
      const compliance = total > 0 ? (completed / total) * 100 : 0;

      complianceData.push({
        value: Math.round(compliance),
        label: `Н${weeks - i}`,
        dataPointText: `${Math.round(compliance)}%`
      });
    }

    // Частота инъекций по дням недели
    const injectionFrequency = [];
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    days.forEach((day, index) => {
      const dayInjections = injections.filter(a => {
        const dayOfWeek = new Date(a.date).getDay();
        return dayOfWeek === (index + 1) % 7;
      }).length;

      injectionFrequency.push({
        value: dayInjections,
        label: day,
        frontColor: colors.accent
      });
    });

    // Результаты анализов (последние 5)
    const recentLabs = labs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(lab => ({
        value: lab.value,
        label: lab.name,
        frontColor: lab.value > lab.referenceHigh ? colors.error : 
                   lab.value < lab.referenceLow ? colors.warning : colors.success
      }));

    setChartData({
      weightTrend: weightData,
      complianceTrend: complianceData,
      injectionFrequency,
      labResults: recentLabs
    });
  };

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const onRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка статистики...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={styles.headerTitle}>Статистика</Text>
          <Text style={styles.headerSubtitle}>Анализ вашего прогресса</Text>
        </Animated.View>

        {/* Time Filter */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.filterContainer}>
          <TimeFilter selected={timeFilter} onSelect={setTimeFilter} />
        </Animated.View>

        {/* Main Stats */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.statsGrid}>
          <StatCard
            title="Активные курсы"
            value={stats.activeCourses}
            icon="play-circle"
            color={colors.warning}
            delay={0}
          />
          <StatCard
            title="Завершенные курсы"
            value={stats.completedCourses}
            icon="check-circle"
            color={colors.success}
            delay={100}
          />
          <StatCard
            title="Всего инъекций"
            value={stats.totalInjections}
            icon="syringe"
            color={colors.blue}
            delay={200}
          />
          <StatCard
            title="Всего таблеток"
            value={stats.totalTablets}
            icon="pills"
            color={colors.purple}
            delay={300}
          />
          <StatCard
            title="Средний вес"
            value={`${stats.averageWeight}кг`}
            icon="weight"
            color={colors.orange}
            delay={400}
          />
          <StatCard
            title="Комплаенс"
            value={`${stats.averageCompliance}%`}
            icon="chart-line"
            color={colors.cyan}
            delay={500}
          />
        </Animated.View>

        {/* Charts */}
        {chartData.weightTrend.length > 0 && (
          <ChartCard title="Тренд веса" delay={600}>
            <LineChart
              data={chartData.weightTrend}
              width={width - 60}
              height={200}
              color={colors.accent}
              thickness={3}
              dataPointsColor={colors.accent}
              dataPointsRadius={6}
              yAxisColor={colors.gray}
              xAxisColor={colors.gray}
              yAxisTextStyle={{ color: colors.gray }}
              xAxisLabelTextStyle={{ color: colors.gray }}
              curved
              showDataPointText
              dataPointTextColor={colors.white}
              dataPointTextFontSize={12}
            />
          </ChartCard>
        )}

        {chartData.complianceTrend.length > 0 && (
          <ChartCard title="Соблюдение графика" delay={700}>
            <BarChart
              data={chartData.complianceTrend}
              width={width - 60}
              height={200}
              barWidth={30}
              frontColor={colors.accent}
              yAxisColor={colors.gray}
              xAxisColor={colors.gray}
              yAxisTextStyle={{ color: colors.gray }}
              xAxisLabelTextStyle={{ color: colors.gray }}
              showValuesAsTopLabel
              topLabelTextStyle={{ color: colors.white, fontSize: 12 }}
            />
          </ChartCard>
        )}

        {chartData.injectionFrequency.length > 0 && (
          <ChartCard title="Частота инъекций по дням" delay={800}>
            <BarChart
              data={chartData.injectionFrequency}
              width={width - 60}
              height={200}
              barWidth={25}
              frontColor={colors.blue}
              yAxisColor={colors.gray}
              xAxisColor={colors.gray}
              yAxisTextStyle={{ color: colors.gray }}
              xAxisLabelTextStyle={{ color: colors.gray }}
              showValuesAsTopLabel
              topLabelTextStyle={{ color: colors.white, fontSize: 12 }}
            />
          </ChartCard>
        )}

        {chartData.labResults.length > 0 && (
          <ChartCard title="Последние анализы" delay={900}>
            <BarChart
              data={chartData.labResults}
              width={width - 60}
              height={200}
              barWidth={30}
              yAxisColor={colors.gray}
              xAxisColor={colors.gray}
              yAxisTextStyle={{ color: colors.gray }}
              xAxisLabelTextStyle={{ color: colors.gray }}
              showValuesAsTopLabel
              topLabelTextStyle={{ color: colors.white, fontSize: 10 }}
            />
          </ChartCard>
        )}

        {/* Summary */}
        <Animated.View entering={FadeIn.delay(1000)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Сводка</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="trophy" size={16} color={colors.warning} />
              <Text style={styles.summaryText}>
                Завершено {stats.completedCourses} из {stats.totalCourses} курсов
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="syringe" size={16} color={colors.blue} />
              <Text style={styles.summaryText}>
                Выполнено {stats.totalInjections} инъекций
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="chart-line" size={16} color={colors.success} />
              <Text style={styles.summaryText}>
                Соблюдение графика: {stats.averageCompliance}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="flask" size={16} color={colors.purple} />
              <Text style={styles.summaryText}>
                Сдано {stats.totalLabs} анализов
              </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeFilter: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeFilterButtonActive: {
    backgroundColor: colors.accent,
  },
  timeFilterText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  timeFilterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
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
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray,
    flex: 1,
  },
});

export default StatisticsScreen;