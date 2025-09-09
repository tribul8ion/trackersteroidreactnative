import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  SlideInRight,
  SlideInUp,
  Layout,
} from 'react-native-reanimated';
import { getLabs, addLab, deleteLab } from '../services/labs';
import { getUser } from '../services/auth';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const LAB_CATEGORIES = [
  { key: 'all', label: 'Все', icon: 'vials' },
  { key: 'hormone', label: 'Гормоны', icon: 'dna' },
  { key: 'blood', label: 'Кровь', icon: 'tint' },
  { key: 'vitamin', label: 'Витамины', icon: 'leaf' },
];

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Компонент фильтра категорий
const CategoryFilter = ({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: {
  categories: any[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}) => (
  <View style={styles.categoryFilter}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
      {categories.map(category => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.categoryChip,
            activeCategory === category.key && styles.categoryChipActive
          ]}
          onPress={() => onCategoryChange(category.key)}
        >
          <FontAwesome5 
            name={category.icon} 
            size={16} 
            color={activeCategory === category.key ? colors.accent : colors.gray} 
          />
          <Text style={[
            styles.categoryChipText,
            activeCategory === category.key && styles.categoryChipTextActive
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// Компонент сводной статистики
const LabsSummary = ({ groupedLabs }: { groupedLabs: any }) => {
  const getStats = () => {
    const labsWithData = Object.values(groupedLabs).filter((lab: any) => lab.latestValue);
    const totalLabs = labsWithData.length;
    const inNorm = labsWithData.filter((lab: any) => {
      const value = lab.latestValue.value;
      return value >= lab.labType.norm_min && value <= lab.labType.norm_max;
    }).length;
    const aboveNorm = labsWithData.filter((lab: any) => {
      return lab.latestValue.value > lab.labType.norm_max;
    }).length;
    const belowNorm = labsWithData.filter((lab: any) => {
      return lab.latestValue.value < lab.labType.norm_min;
    }).length;

    return { totalLabs, inNorm, aboveNorm, belowNorm };
  };

  const stats = getStats();

  return (
    <Animated.View entering={FadeIn.delay(100)} style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Сводка анализов</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '20' }]}>
            <FontAwesome5 name="vials" size={20} color={colors.accent} />
          </View>
          <Text style={styles.summaryValue}>{stats.totalLabs}</Text>
          <Text style={styles.summaryLabel}>Всего</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
            <FontAwesome5 name="check" size={20} color={colors.success} />
          </View>
          <Text style={styles.summaryValue}>{stats.inNorm}</Text>
          <Text style={styles.summaryLabel}>В норме</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '20' }]}>
            <FontAwesome5 name="exclamation" size={20} color={colors.warning} />
          </View>
          <Text style={styles.summaryValue}>{stats.aboveNorm}</Text>
          <Text style={styles.summaryLabel}>Выше</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.error + '20' }]}>
            <FontAwesome5 name="arrow-down" size={20} color={colors.error} />
          </View>
          <Text style={styles.summaryValue}>{stats.belowNorm}</Text>
          <Text style={styles.summaryLabel}>Ниже</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Улучшенный компонент карточки анализа
const LabCard = ({ 
  labType, 
  latestValue, 
  history, 
  onPress, 
  onAddValue,
  index
}: {
  labType: any;
  latestValue: any | null;
  history: any[];
  onPress: () => void;
  onAddValue: () => void;
  index: number;
}) => {
  const getStatusColor = () => {
    if (!latestValue) return colors.gray;
    if (latestValue.value < labType.norm_min) return colors.warning;
    if (latestValue.value > labType.norm_max) return colors.error;
    return colors.success;
  };

  const getStatusText = () => {
    if (!latestValue) return 'Нет данных';
    if (latestValue.value < labType.norm_min) return 'Ниже нормы';
    if (latestValue.value > labType.norm_max) return 'Выше нормы';
    return 'В норме';
  };

  const getStatusIcon = () => {
    if (!latestValue) return 'question-circle';
    if (latestValue.value < labType.norm_min) return 'arrow-down';
    if (latestValue.value > labType.norm_max) return 'arrow-up';
    return 'check-circle';
  };

  const getTrend = () => {
    if (history.length < 2) return null;
    const current = history[history.length - 1].value;
    const previous = history[history.length - 2].value;
    const change = ((current - previous) / previous) * 100;
    return { direction: current > previous ? 'up' : current < previous ? 'down' : 'stable', change };
  };

  const getTrendIcon = () => {
    const trend = getTrend();
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'minus';
      default: return null;
    }
  };

  const getTrendColor = () => {
    const trend = getTrend();
    if (!trend) return colors.gray;
    
    // Для некоторых анализов рост - это плохо, для других - хорошо
    const isGoodTrend = () => {
      if (labType.name.includes('Тестостерон') && trend.direction === 'up') return true;
      if (labType.name.includes('Эстрадиол') && trend.direction === 'down') return true;
      if (labType.name.includes('Пролактин') && trend.direction === 'down') return true;
      return trend.direction === 'stable';
    };

    if (trend.direction === 'stable') return colors.gray;
    return isGoodTrend() ? colors.success : colors.warning;
  };

  const getNormPercentage = () => {
    if (!latestValue) return 0;
    const range = labType.norm_max - labType.norm_min;
    const position = latestValue.value - labType.norm_min;
    return Math.max(0, Math.min(100, (position / range) * 100));
  };

  const trend = getTrend();

  return (
    <Animated.View 
      entering={FadeIn.delay(100 + index * 80)}
      layout={Layout.springify()}
    >
      <TouchableOpacity style={styles.labCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.labCardHeader}>
          <View style={styles.labCardLeft}>
            <View style={[styles.labIcon, { backgroundColor: labType.color + '20' }]}>
              <FontAwesome5 name="vial" size={20} color={labType.color} />
            </View>
            <View style={styles.labInfo}>
              <Text style={styles.labName}>{labType.name}</Text>
              <Text style={styles.labUnit}>{labType.unit}</Text>
            </View>
          </View>
          
          <View style={styles.labCardRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <FontAwesome5 name={getStatusIcon()} size={12} color={getStatusColor()} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.labCardContent}>
          {latestValue ? (
            <>
              <View style={styles.valueSection}>
                <View style={styles.valueLeft}>
                  <Text style={[styles.currentValue, { color: labType.color }]}>
                    {latestValue.value} {labType.unit}
                  </Text>
                  <Text style={styles.valueDate}>
                    {new Date(latestValue.date).toLocaleDateString('ru', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Text>
                </View>
                
                {trend && (
                  <View style={styles.trendSection}>
                    <FontAwesome5 
                      name={getTrendIcon()!} 
                      size={16} 
                      color={getTrendColor()} 
                    />
                    <Text style={[styles.trendText, { color: getTrendColor() }]}>
                      {Math.abs(trend.change).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Визуальный индикатор нормы */}
              <View style={styles.normIndicator}>
                <View style={styles.normRange}>
                  <View 
                    style={[
                      styles.normPosition, 
                      { 
                        left: `${getNormPercentage()}%`,
                        backgroundColor: getStatusColor()
                      }
                    ]} 
                  />
                </View>
                <View style={styles.normLabels}>
                  <Text style={styles.normLabel}>{labType.norm_min}</Text>
                  <Text style={styles.normLabel}>{labType.norm_max}</Text>
                </View>
              </View>

              {/* Мини-график */}
              {history.length >= 2 && (
                <View style={styles.miniChartContainer}>
                  <LineChart
                    data={history.slice(-5).map((h, i) => ({ value: h.value, index: i }))}
                    width={width - 80}
                    height={40}
                    color={labType.color}
                    thickness={2}
                    hideDataPoints={false}
                    hideAxesAndRules
                    hideYAxisText
                    curved
                    dataPointsColor={labType.color}
                    dataPointsRadius={3}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.noDataSection}>
              <FontAwesome5 name="chart-line" size={24} color={colors.gray} />
              <Text style={styles.noDataText}>Нет данных</Text>
              <Text style={styles.noDataSubtext}>Добавьте первое значение</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.addValueButton, !latestValue && styles.addValueButtonPrimary]}
              onPress={(e) => {
                e.stopPropagation();
                onAddValue();
              }}
            >
              <FontAwesome5 name="plus" size={14} color={!latestValue ? colors.background : colors.accent} />
              <Text style={[styles.addValueText, !latestValue && styles.addValueTextPrimary]}>
                {latestValue ? 'Добавить' : 'Первое значение'}
              </Text>
            </TouchableOpacity>
            
            {history.length > 0 && (
              <View style={styles.historyInfo}>
                <FontAwesome5 name="history" size={12} color={colors.gray} />
                <Text style={styles.historyCount}>
                  {history.length} {history.length === 1 ? 'запись' : 'записей'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Улучшенный компонент детального просмотра
const LabDetailModal = ({ 
  labType, 
  history, 
  visible, 
  onClose,
  onDeleteValue,
  onAddValue
}: {
  labType: any;
  history: any[];
  visible: boolean;
  onClose: () => void;
  onDeleteValue: (id: string) => void;
  onAddValue: () => void;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  if (!labType) return null;

  const periods = [
    { key: 'all', label: 'Все время' },
    { key: '3m', label: '3 месяца' },
    { key: '6m', label: '6 месяцев' },
    { key: '1y', label: '1 год' },
  ];

  const getFilteredHistory = () => {
    if (selectedPeriod === 'all') return history;
    
    const now = new Date();
    const months = selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    
    return history.filter(h => new Date(h.date) >= cutoffDate);
  };

  const getAdvice = () => {
    if (!history.length) return null;
    const latest = history[history.length - 1];
    
    if (latest.value > labType.norm_max) {
      const excess = ((latest.value - labType.norm_max) / labType.norm_max * 100).toFixed(1);
      return {
        type: 'warning',
        icon: 'exclamation-triangle',
        text: `Показатель выше нормы на ${excess}%! Рекомендуется консультация с врачом.`
      };
    }
    
    if (latest.value < labType.norm_min) {
      const deficit = ((labType.norm_min - latest.value) / labType.norm_min * 100).toFixed(1);
      return {
        type: 'warning',
        icon: 'exclamation-circle',
        text: `Показатель ниже нормы на ${deficit}%! Обратите внимание на самочувствие.`
      };
    }
    
    return {
      type: 'success',
      icon: 'check-circle',
      text: 'Показатель в пределах нормы. Продолжайте мониторинг.'
    };
  };

  const getStatistics = () => {
    if (history.length === 0) return null;
    
    const values = history.map(h => h.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg: avg.toFixed(1), min, max };
  };

  const filteredHistory = getFilteredHistory();
  const advice = getAdvice();
  const stats = getStatistics();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <FontAwesome5 name="times" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>{labType.name}</Text>
            <Text style={styles.modalSubtitle}>{labType.unit}</Text>
          </View>
          <TouchableOpacity onPress={onAddValue} style={styles.modalAddButton}>
            <FontAwesome5 name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Статистика */}
          {stats && (
            <Animated.View entering={FadeIn.delay(100)} style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Статистика</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.avg}</Text>
                  <Text style={styles.statLabel}>Среднее</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.min}</Text>
                  <Text style={styles.statLabel}>Минимум</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.max}</Text>
                  <Text style={styles.statLabel}>Максимум</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{history.length}</Text>
                  <Text style={styles.statLabel}>Записей</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* График */}
          {filteredHistory.length >= 2 && (
            <Animated.View entering={FadeIn.delay(100)} style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Динамика</Text>
                <View style={styles.periodSelector}>
                  {periods.map(period => (
                    <TouchableOpacity
                      key={period.key}
                      style={[
                        styles.periodButton,
                        selectedPeriod === period.key && styles.periodButtonActive
                      ]}
                      onPress={() => setSelectedPeriod(period.key)}
                    >
                      <Text style={[
                        styles.periodButtonText,
                        selectedPeriod === period.key && styles.periodButtonTextActive
                      ]}>
                        {period.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.chartContainer}>
                <LineChart
                  data={filteredHistory.map((h, i) => ({
                    value: h.value,
                    label: new Date(h.date).toLocaleDateString('ru', { 
                      month: 'short', 
                      day: 'numeric' 
                    }),
                    index: i
                  }))}
                  width={width - 64}
                  height={220}
                  color={labType.color}
                  thickness={3}
                  curved
                  dataPointsColor={labType.color}
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
                
                {/* Линии нормы */}
                <View style={styles.normLines}>
                  <View style={[styles.normLine, { backgroundColor: colors.success + '40' }]} />
                  <Text style={styles.normLineLabel}>
                    Норма: {labType.norm_min}-{labType.norm_max}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Совет */}
          {advice && (
            <Animated.View entering={FadeIn.delay(100)} style={[
              styles.adviceSection,
              { backgroundColor: advice.type === 'warning' ? colors.warning + '20' : colors.success + '20' }
            ]}>
              <FontAwesome5 
                name={advice.icon} 
                size={20} 
                color={advice.type === 'warning' ? colors.warning : colors.success} 
              />
              <Text style={[
                styles.adviceText,
                { color: advice.type === 'warning' ? colors.warning : colors.success }
              ]}>
                {advice.text}
              </Text>
            </Animated.View>
          )}

          {/* История */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.historySection}>
            <Text style={styles.sectionTitle}>История значений</Text>
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <FontAwesome5 name="chart-line" size={48} color={colors.gray} />
                <Text style={styles.emptyHistoryText}>Нет записей</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Добавьте первое значение для начала отслеживания
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.slice().reverse().map((record, index) => (
                  <Animated.View 
                    key={record.id}
                    entering={FadeIn.delay(100 + index * 80)}
                    style={styles.historyItem}
                  >
                    <View style={styles.historyLeft}>
                      <Text style={[styles.historyValue, { color: labType.color }]}>
                        {record.value} {labType.unit}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(record.date).toLocaleDateString('ru', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.historyRight}>
                      <View style={[
                        styles.historyStatus,
                        { 
                          backgroundColor: record.value >= labType.norm_min && record.value <= labType.norm_max 
                            ? colors.success + '20' 
                            : colors.warning + '20' 
                        }
                      ]}>
                        <FontAwesome5 
                          name={
                            record.value >= labType.norm_min && record.value <= labType.norm_max 
                              ? 'check' 
                              : 'exclamation'
                          } 
                          size={12} 
                          color={
                            record.value >= labType.norm_min && record.value <= labType.norm_max 
                              ? colors.success 
                              : colors.warning
                          } 
                        />
                      </View>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Удалить запись?',
                            'Это действие нельзя отменить',
                            [
                              { text: 'Отмена', style: 'cancel' },
                              { 
                                text: 'Удалить', 
                                style: 'destructive',
                                onPress: () => onDeleteValue(record.id)
                              }
                            ]
                          );
                        }}
                      >
                        <FontAwesome5 name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const MODAL_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.8);

// Улучшенный компонент добавления значения
const AddValueModal = ({ 
  labType, 
  visible, 
  onClose, 
  onSave 
}: {
  labType: any;
  visible: boolean;
  onClose: () => void;
  onSave: (value: string, date: string) => void;
}) => {
  const [value, setValue] = useState('');
  const [date, setDate] = useState(getToday());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    
    if (!value || isNaN(Number(value))) {
      setError('Введите корректное значение');
      setSaving(false);
      return;
    }
    
    if (Number(value) <= 0) {
      setError('Значение должно быть больше нуля');
      setSaving(false);
      return;
    }
    
    try {
      await onSave(value, date);
      setValue('');
      setDate(getToday());
    } catch (e) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const getValueStatus = () => {
    if (!value || isNaN(Number(value))) return null;
    const numValue = Number(value);
    if (numValue < labType.norm_min) return { type: 'low', text: 'Ниже нормы' };
    if (numValue > labType.norm_max) return { type: 'high', text: 'Выше нормы' };
    return { type: 'normal', text: 'В пределах нормы' };
  };

  const valueStatus = getValueStatus();

  if (!labType) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{width: '100%', alignItems: 'center', justifyContent: 'center', flex: 1}}
        >
          <Animated.View style={styles.addModalContent}>
            <SafeAreaView>
              <ScrollView
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{maxHeight: MODAL_MAX_HEIGHT}}
              >
                <View style={styles.addModalHeader}>
                  <View style={[styles.labTypeIndicator, { backgroundColor: labType.color + '20' }]}> 
                    <FontAwesome5 name="vial" size={20} color={labType.color} />
                  </View>
                  <Text style={styles.addModalTitle}>Добавить значение</Text>
                  <Text style={styles.addModalSubtitle}>{labType.name}</Text>
                </View>

                <View style={styles.addModalForm}>
                  <View style={[styles.formField, {marginBottom: 16}]}> 
                    <Text style={styles.fieldLabel}>Значение ({labType.unit})</Text>
                    <TextInput
                      style={[
                        styles.fieldInput,
                        valueStatus && valueStatus.type !== 'normal' && styles.fieldInputWarning
                      ]}
                      value={value}
                      onChangeText={setValue}
                      placeholder={`Введите значение`}
                      placeholderTextColor={colors.gray}
                      keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    />
                    {valueStatus && (
                      <View style={[
                        styles.valueStatusIndicator,
                        { 
                          backgroundColor: valueStatus.type === 'normal' 
                            ? colors.success + '20' 
                            : colors.warning + '20' 
                        }
                      ]}>
                        <FontAwesome5 
                          name={valueStatus.type === 'normal' ? 'check' : 'exclamation'} 
                          size={12} 
                          color={valueStatus.type === 'normal' ? colors.success : colors.warning} 
                        />
                        <Text style={[
                          styles.valueStatusText,
                          { 
                            color: valueStatus.type === 'normal' 
                              ? colors.success 
                              : colors.warning 
                          }
                        ]}>
                          {valueStatus.text}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.fieldHint}>
                      Норма: {labType.norm_min}–{labType.norm_max} {labType.unit}
                    </Text>
                  </View>

                  <View style={[styles.formField, {marginBottom: 16}]}> 
                    <Text style={styles.fieldLabel}>Дата анализа</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={date}
                      onChangeText={setDate}
                      placeholder="ГГГГ-ММ-ДД"
                      placeholderTextColor={colors.gray}
                    />
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <FontAwesome5 name="exclamation-circle" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.addModalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <Text style={styles.saveButtonText}>Сохранить</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const LABS_REFERENCE = [
  { name: 'Тестостерон общий', type: 'hormone', unit: 'нмоль/л', norm_min: 8, norm_max: 29, color: colors.accent, priority: 1 },
  { name: 'Тестостерон свободный', type: 'hormone', unit: 'пг/мл', norm_min: 4.5, norm_max: 42, color: colors.blue, priority: 2 },
  { name: 'Эстрадиол', type: 'hormone', unit: 'пг/мл', norm_min: 11, norm_max: 44, color: colors.orange, priority: 3 },
  { name: 'Пролактин', type: 'hormone', unit: 'нг/мл', norm_min: 2, norm_max: 17, color: colors.error, priority: 4 },
  { name: 'ГСПГ', type: 'hormone', unit: 'нмоль/л', norm_min: 13, norm_max: 71, color: colors.success, priority: 5 },
  { name: 'ЛГ', type: 'hormone', unit: 'МЕ/л', norm_min: 1.7, norm_max: 8.6, color: colors.warning, priority: 6 },
  { name: 'ФСГ', type: 'hormone', unit: 'МЕ/л', norm_min: 1, norm_max: 12, color: colors.purple, priority: 7 },
  { name: 'ДГТ', type: 'hormone', unit: 'нг/дл', norm_min: 30, norm_max: 85, color: colors.cyan, priority: 8 },
  { name: 'Прогестерон', type: 'hormone', unit: 'нг/мл', norm_min: 0.1, norm_max: 0.7, color: colors.orangeDark, priority: 9 },
  { name: 'Инсулин', type: 'hormone', unit: 'мкЕд/мл', norm_min: 2, norm_max: 25, color: colors.teal, priority: 10 },
  { name: 'ИФР 1', type: 'hormone', unit: 'нг/мл', norm_min: 115, norm_max: 307, color: colors.pink, priority: 11 },
  { name: 'Ферритин', type: 'blood', unit: 'нг/мл', norm_min: 30, norm_max: 400, color: colors.lime, priority: 12 },
  { name: 'Витамин 25(OH) D', type: 'vitamin', unit: 'нг/мл', norm_min: 30, norm_max: 100, color: colors.orange, priority: 13 },
  { name: 'ПСА общий', type: 'blood', unit: 'нг/мл', norm_min: 0, norm_max: 4, color: colors.indigo, priority: 14 },
  { name: 'Гликированный гемоглобин (A1c)', type: 'blood', unit: '%', norm_min: 4, norm_max: 6, color: colors.teal, priority: 15 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
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
  summaryContainer: {
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.gray,
  },
  categoryFilter: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.grayLight + '20',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.accent + '20',
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.accent,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  labCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  labCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  labIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  labUnit: {
    fontSize: 12,
    color: colors.gray,
  },
  labCardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  labCardContent: {
    gap: 12,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLeft: {
    flex: 1,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  valueDate: {
    fontSize: 12,
    color: colors.gray,
  },
  trendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  normIndicator: {
    gap: 4,
  },
  normRange: {
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    position: 'relative',
  },
  normPosition: {
    position: 'absolute',
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }],
  },
  normLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  normLabel: {
    fontSize: 10,
    color: colors.gray,
  },
  miniChartContainer: {
    height: 40,
    overflow: 'hidden',
  },
  noDataSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  noDataSubtext: {
    fontSize: 12,
    color: colors.gray,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  addValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addValueButtonPrimary: {
    backgroundColor: colors.accent,
  },
  addValueText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  addValueTextPrimary: {
    color: colors.background,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCount: {
    fontSize: 12,
    color: colors.gray,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  modalAddButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.grayLight + '20',
  },
  periodButtonActive: {
    backgroundColor: colors.accent + '20',
  },
  periodButtonText: {
    fontSize: 10,
    color: colors.gray,
  },
  periodButtonTextActive: {
    color: colors.accent,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  normLines: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    height: 2,
    justifyContent: 'center',
  },
  normLine: {
    height: 2,
    borderRadius: 1,
  },
  normLineLabel: {
    position: 'absolute',
    top: -20,
    right: 0,
    fontSize: 10,
    color: colors.gray,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
  },
  adviceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  historySection: {
    marginBottom: 24,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  emptyHistorySubtext: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  historyLeft: {
    flex: 1,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.gray,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  // Add Value Modal
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addModalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  addModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  labTypeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  addModalSubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  addModalForm: {
    gap: 16,
    marginBottom: 24,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  fieldInput: {
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  fieldInputWarning: {
    borderColor: colors.warning,
  },
  valueStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  valueStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 12,
    color: colors.gray,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    flex: 1,
  },
  addModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

const LabsScreen = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabType, setSelectedLabType] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddValue, setShowAddValue] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    }
  };

  // Группировка анализов по типу
  const getGroupedLabs = () => {
    const grouped: { [key: string]: { labType: any; history: any[]; latestValue: any | null } } = {};
    
    LABS_REFERENCE.forEach(labType => {
      const history = labs
        .filter(lab => lab.name === labType.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      grouped[labType.name] = {
        labType,
        history,
        latestValue: history.length > 0 ? history[history.length - 1] : null
      };
    });

    return grouped;
  };

  // Фильтрация по категории и поиску
  const getFilteredLabs = () => {
    const grouped = getGroupedLabs();
    return Object.values(grouped).filter((group: any) => {
      const matchesCategory = activeCategory === 'all' || group.labType.type === activeCategory;
      const matchesSearch = group.labType.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a: any, b: any) => {
      // Сначала показываем анализы с данными, потом по приоритету
      if (a.latestValue && !b.latestValue) return -1;
      if (!a.latestValue && b.latestValue) return 1;
      return a.labType.priority - b.labType.priority;
    });
  };

  const handleAddValue = async (value: string, date: string) => {
    if (!selectedLabType) return;
    
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id;
      if (!user_id) throw new Error('Нет пользователя');
      
      await addLab({
        user_id,
        name: selectedLabType.name,
        type: selectedLabType.type,
        value: Number(value),
        unit: selectedLabType.unit,
        date,
        norm_min: selectedLabType.norm_min,
        norm_max: selectedLabType.norm_max,
      });
      
      setShowAddValue(false);
      loadLabs();
    } catch (e) {
      throw new Error('Не удалось сохранить значение');
    }
  };

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteLab(id);
      loadLabs();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось удалить запись');
    }
  };

  const groupedLabs = getGroupedLabs();
  const filteredLabs = getFilteredLabs();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <Text style={styles.headerTitle}>Анализы</Text>
        <Text style={styles.headerSubtitle}>
          Отслеживайте динамику показателей здоровья
        </Text>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка анализов...</Text>
        </View>
      ) : (
        <>
          {/* Сводка */}
          <LabsSummary groupedLabs={groupedLabs} />

          {/* Фильтры */}
          <CategoryFilter 
            categories={LAB_CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Список анализов */}
          <FlatList
            data={filteredLabs}
            keyExtractor={(item: any) => item.labType.name}
            renderItem={({ item, index }) => (
              <LabCard
                labType={item.labType}
                latestValue={item.latestValue}
                history={item.history}
                index={index}
                onPress={() => {
                  setSelectedLabType(item.labType);
                  setShowDetail(true);
                }}
                onAddValue={() => {
                  setSelectedLabType(item.labType);
                  setShowAddValue(true);
                }}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Модальные окна */}
      <LabDetailModal
        labType={selectedLabType}
        history={selectedLabType ? groupedLabs[selectedLabType.name]?.history || [] : []}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onDeleteValue={handleDeleteValue}
        onAddValue={() => {
          setShowDetail(false);
          setTimeout(() => setShowAddValue(true), 250);
        }}
      />

      <AddValueModal
        labType={selectedLabType}
        visible={showAddValue}
        onClose={() => setShowAddValue(false)}
        onSave={handleAddValue}
      />
    </SafeAreaView>
  );
};

export default LabsScreen;