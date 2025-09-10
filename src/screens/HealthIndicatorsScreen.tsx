import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { colors } from '../theme/colors';
import { getLabs } from '../services/labs';
import { getUser } from '../services/auth';

const { width } = Dimensions.get('window');

const HEALTH_CATEGORIES = [
  { key: 'hormones', label: 'Гормоны', icon: 'dna', color: colors.accent },
  { key: 'liver', label: 'Печень', icon: 'liver', color: colors.warning },
  { key: 'kidney', label: 'Почки', icon: 'heartbeat', color: colors.blue },
  { key: 'blood', label: 'Кровь', icon: 'tint', color: colors.error },
  { key: 'lipid', label: 'Липиды', icon: 'oil-can', color: colors.purple },
];

const HEALTH_INDICATORS = [
  // Гормоны
  { 
    name: 'Тестостерон общий', 
    category: 'hormones',
    unit: 'нмоль/л', 
    norm_min: 8, 
    norm_max: 29, 
    color: colors.accent,
    priority: 1
  },
  { 
    name: 'Эстрадиол', 
    category: 'hormones',
    unit: 'пг/мл', 
    norm_min: 11, 
    norm_max: 44, 
    color: colors.orange,
    priority: 2
  },
  { 
    name: 'Пролактин', 
    category: 'hormones',
    unit: 'нг/мл', 
    norm_min: 2, 
    norm_max: 17, 
    color: colors.error,
    priority: 3
  },
  { 
    name: 'ЛГ', 
    category: 'hormones',
    unit: 'МЕ/л', 
    norm_min: 1.7, 
    norm_max: 8.6, 
    color: colors.warning,
    priority: 4
  },
  { 
    name: 'ФСГ', 
    category: 'hormones',
    unit: 'МЕ/л', 
    norm_min: 1, 
    norm_max: 12, 
    color: colors.purple,
    priority: 5
  },
  
  // Печень
  { 
    name: 'АЛТ', 
    category: 'liver',
    unit: 'Ед/л', 
    norm_min: 7, 
    norm_max: 56, 
    color: colors.warning,
    priority: 6
  },
  { 
    name: 'АСТ', 
    category: 'liver',
    unit: 'Ед/л', 
    norm_min: 10, 
    norm_max: 40, 
    color: colors.warning,
    priority: 7
  },
  { 
    name: 'Билирубин общий', 
    category: 'liver',
    unit: 'мкмоль/л', 
    norm_min: 5, 
    norm_max: 21, 
    color: colors.yellow,
    priority: 8
  },
  { 
    name: 'ГГТ', 
    category: 'liver',
    unit: 'Ед/л', 
    norm_min: 8, 
    norm_max: 61, 
    color: colors.pink,
    priority: 9
  },
  
  // Почки
  { 
    name: 'Креатинин', 
    category: 'kidney',
    unit: 'мкмоль/л', 
    norm_min: 62, 
    norm_max: 106, 
    color: colors.blue,
    priority: 10
  },
  { 
    name: 'Мочевина', 
    category: 'kidney',
    unit: 'ммоль/л', 
    norm_min: 2.5, 
    norm_max: 8.3, 
    color: colors.blue,
    priority: 11
  },
  
  // Кровь
  { 
    name: 'Гемоглобин', 
    category: 'blood',
    unit: 'г/л', 
    norm_min: 130, 
    norm_max: 175, 
    color: colors.error,
    priority: 12
  },
  { 
    name: 'Лейкоциты', 
    category: 'blood',
    unit: '×10⁹/л', 
    norm_min: 4.5, 
    norm_max: 11, 
    color: colors.blue,
    priority: 13
  },
  
  // Липиды
  { 
    name: 'Общий холестерин', 
    category: 'lipid',
    unit: 'ммоль/л', 
    norm_min: 3.0, 
    norm_max: 5.2, 
    color: colors.purple,
    priority: 14
  },
  { 
    name: 'ЛПВП', 
    category: 'lipid',
    unit: 'ммоль/л', 
    norm_min: 1.0, 
    norm_max: 2.2, 
    color: colors.green,
    priority: 15
  },
  { 
    name: 'ЛПНП', 
    category: 'lipid',
    unit: 'ммоль/л', 
    norm_min: 0, 
    norm_max: 3.0, 
    color: colors.error,
    priority: 16
  },
];

// Компонент Health Score
const HealthScore = ({ labs }: { labs: any[] }) => {
  const getHealthScore = () => {
    if (labs.length === 0) return { score: 0, status: 'Нет данных', color: colors.gray };
    
    const indicatorsWithData = HEALTH_INDICATORS.filter(indicator => {
      const labData = labs.find(lab => lab.name === indicator.name);
      return labData && labData.value;
    });
    
    if (indicatorsWithData.length === 0) return { score: 0, status: 'Нет данных', color: colors.gray };
    
    let totalScore = 0;
    let totalIndicators = 0;
    
    indicatorsWithData.forEach(indicator => {
      const labData = labs.find(lab => lab.name === indicator.name);
      if (labData && labData.value) {
        const value = labData.value;
        const isInNorm = value >= indicator.norm_min && value <= indicator.norm_max;
        totalScore += isInNorm ? 100 : 0;
        totalIndicators++;
      }
    });
    
    const averageScore = totalIndicators > 0 ? Math.round(totalScore / totalIndicators) : 0;
    
    let status, color;
    if (averageScore >= 90) {
      status = 'Отлично';
      color = colors.success;
    } else if (averageScore >= 70) {
      status = 'Хорошо';
      color = colors.warning;
    } else if (averageScore >= 50) {
      status = 'Удовлетворительно';
      color = colors.orange;
    } else {
      status = 'Требует внимания';
      color = colors.error;
    }
    
    return { score: averageScore, status, color };
  };

  const healthData = getHealthScore();

  return (
    <Animated.View entering={FadeIn.delay(100)} style={styles.healthScoreCard}>
      <View style={styles.healthScoreHeader}>
        <Text style={styles.healthScoreTitle}>Общий индекс здоровья</Text>
        <View style={[styles.healthScoreBadge, { backgroundColor: healthData.color + '20' }]}>
          <Text style={[styles.healthScoreValue, { color: healthData.color }]}>
            {healthData.score}%
          </Text>
        </View>
      </View>
      <Text style={[styles.healthScoreStatus, { color: healthData.color }]}>
        {healthData.status}
      </Text>
      <View style={styles.healthScoreBar}>
        <View 
          style={[
            styles.healthScoreProgress, 
            { 
              width: `${healthData.score}%`,
              backgroundColor: healthData.color
            }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

// Компонент Category Overview
const CategoryOverview = ({ labs }: { labs: any[] }) => {
  const getCategoryStats = () => {
    return HEALTH_CATEGORIES.map(category => {
      const categoryIndicators = HEALTH_INDICATORS.filter(ind => ind.category === category.key);
      const categoryLabs = labs.filter(lab => 
        categoryIndicators.some(ind => ind.name === lab.name)
      );
      
      const inNorm = categoryLabs.filter(lab => {
        const indicator = categoryIndicators.find(ind => ind.name === lab.name);
        if (!indicator) return false;
        return lab.value >= indicator.norm_min && lab.value <= indicator.norm_max;
      }).length;
      
      const total = categoryLabs.length;
      const percentage = total > 0 ? Math.round((inNorm / total) * 100) : 0;
      
      return {
        ...category,
        total,
        inNorm,
        percentage
      };
    }).filter(cat => cat.total > 0);
  };

  const categoryStats = getCategoryStats();

  return (
    <Animated.View entering={FadeIn.delay(200)} style={styles.categoryOverview}>
      <Text style={styles.sectionTitle}>Показатели по категориям</Text>
      <View style={styles.categoryGrid}>
        {categoryStats.map((category, index) => (
          <Animated.View 
            key={category.key}
            entering={SlideInRight.delay(100 + index * 100)}
            style={styles.categoryCard}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <FontAwesome5 name={category.icon} size={24} color={category.color} />
            </View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.categoryValue}>
              {category.inNorm}/{category.total}
            </Text>
            <View style={styles.categoryProgress}>
              <View 
                style={[
                  styles.categoryProgressBar, 
                  { 
                    width: `${category.percentage}%`,
                    backgroundColor: category.percentage >= 80 ? colors.success : 
                                   category.percentage >= 60 ? colors.warning : colors.error
                  }
                ]} 
              />
            </View>
            <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

// Компонент Health Trends Chart
const HealthTrendsChart = ({ labs }: { labs: any[] }) => {
  const getTrendsData = () => {
    const testosteroneLabs = labs
      .filter(lab => lab.name === 'Тестостерон общий')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (testosteroneLabs.length < 2) return null;
    
    return testosteroneLabs.map((lab, index) => ({
      value: lab.value,
      label: new Date(lab.date).toLocaleDateString('ru', { 
        month: 'short', 
        day: 'numeric' 
      }),
      index
    }));
  };

  const trendsData = getTrendsData();
  if (!trendsData) return null;

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.trendsChart}>
      <Text style={styles.sectionTitle}>Динамика тестостерона</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={trendsData}
          width={width - 64}
          height={200}
          color={colors.accent}
          thickness={3}
          curved
          dataPointsColor={colors.accent}
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
        />
      </View>
    </Animated.View>
  );
};

// Компонент Health Indicators List
const HealthIndicatorsList = ({ labs, selectedCategory, onCategoryChange }: { 
  labs: any[]; 
  selectedCategory: string | null; 
  onCategoryChange: (category: string | null) => void; 
}) => {
  const getFilteredIndicators = () => {
    return HEALTH_INDICATORS.filter(indicator => {
      if (selectedCategory && indicator.category !== selectedCategory) return false;
      
      const labData = labs.find(lab => lab.name === indicator.name);
      return labData && labData.value;
    }).sort((a, b) => a.priority - b.priority);
  };

  const filteredIndicators = getFilteredIndicators();

  return (
    <Animated.View entering={FadeIn.delay(400)} style={styles.indicatorsList}>
      <View style={styles.indicatorsHeader}>
        <Text style={styles.sectionTitle}>Детальные показатели</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => onCategoryChange(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              Все
            </Text>
          </TouchableOpacity>
          {HEALTH_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[styles.categoryChip, selectedCategory === category.key && styles.categoryChipActive]}
              onPress={() => onCategoryChange(category.key)}
            >
              <FontAwesome5 
                name={category.icon} 
                size={14} 
                color={selectedCategory === category.key ? colors.accent : colors.gray} 
              />
              <Text style={[styles.categoryChipText, selectedCategory === category.key && styles.categoryChipTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.indicatorsGrid}>
        {filteredIndicators.map((indicator, index) => {
          const labData = labs.find(lab => lab.name === indicator.name);
          if (!labData || !labData.value) return null;
          
          const value = labData.value;
          const isInNorm = value >= indicator.norm_min && value <= indicator.norm_max;
          const statusColor = isInNorm ? colors.success : colors.warning;
          const statusText = isInNorm ? 'В норме' : 'Вне нормы';
          
          return (
            <Animated.View 
              key={indicator.name}
              entering={SlideInRight.delay(100 + index * 50)}
              style={styles.indicatorCard}
            >
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorName}>{indicator.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              </View>
              <Text style={[styles.indicatorValue, { color: indicator.color }]}>
                {value} {indicator.unit}
              </Text>
              <Text style={styles.indicatorStatus}>{statusText}</Text>
              <Text style={styles.indicatorNorm}>
                Норма: {indicator.norm_min}-{indicator.norm_max} {indicator.unit}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const HealthIndicatorsScreen = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    setLoading(true);
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      if (!user_id) return;
      
      const { data } = await getLabs(user_id);
      setLabs(data || []);
    } catch (e) {
      setLabs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLabs();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка показателей...</Text>
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
        <HealthScore labs={labs} />
        <CategoryOverview labs={labs} />
        <HealthTrendsChart labs={labs} />
        <HealthIndicatorsList 
          labs={labs} 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
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
    padding: 16,
    paddingBottom: 32,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  
  // Health Score
  healthScoreCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  healthScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  healthScoreStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  healthScoreBar: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthScoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Category Overview
  categoryOverview: {
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 8,
  },
  categoryProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '600',
  },
  
  // Trends Chart
  trendsChart: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  
  // Indicators List
  indicatorsList: {
    marginBottom: 20,
  },
  indicatorsHeader: {
    marginBottom: 16,
  },
  categoryFilter: {
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.grayLight + '20',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.accent + '20',
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.accent,
  },
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  indicatorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  indicatorStatus: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4,
  },
  indicatorNorm: {
    fontSize: 10,
    color: colors.gray,
  },
});

export default HealthIndicatorsScreen; 