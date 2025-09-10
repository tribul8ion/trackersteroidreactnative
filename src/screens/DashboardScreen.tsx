import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
  StatusBar,
  FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  FadeIn,
  SlideInRight,
  SlideInUp,
  SlideInDown,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AuthService } from '../services/auth';
import { CoursesService } from '../services/courses';
import { LabsService } from '../services/labs';
import { ActionsService } from '../services/actions';
import { AchievementsService } from '../services/achievements';
import { AnalyticsService } from '../services/analytics';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '../theme/colors';
import { Portal, Dialog, Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

// Расширенный справочник анализов
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
  { name: 'АЛТ', type: 'liver', unit: 'Ед/л', norm_min: 7, norm_max: 56, color: colors.warning, priority: 16 },
  { name: 'АСТ', type: 'liver', unit: 'Ед/л', norm_min: 10, norm_max: 40, color: colors.warning, priority: 17 },
  { name: 'Билирубин общий', type: 'liver', unit: 'мкмоль/л', norm_min: 5, norm_max: 21, color: colors.yellow, priority: 18 },
  { name: 'Креатинин', type: 'kidney', unit: 'мкмоль/л', norm_min: 62, norm_max: 106, color: colors.blue, priority: 19 },
  { name: 'Мочевина', type: 'kidney', unit: 'ммоль/л', norm_min: 2.5, norm_max: 8.3, color: colors.blue, priority: 20 },
  { name: 'Общий холестерин', type: 'lipid', unit: 'ммоль/л', norm_min: 3.0, norm_max: 5.2, color: colors.purple, priority: 21 },
  { name: 'ЛПВП', type: 'lipid', unit: 'ммоль/л', norm_min: 1.0, norm_max: 2.2, color: colors.green, priority: 22 },
  { name: 'ЛПНП', type: 'lipid', unit: 'ммоль/л', norm_min: 0, norm_max: 3.0, color: colors.error, priority: 23 },
  { name: 'Триглицериды', type: 'lipid', unit: 'ммоль/л', norm_min: 0, norm_max: 1.7, color: colors.orange, priority: 24 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: colors.card,
    transform: [{ skewY: '-2deg' }],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.accent,
  },
  headerButton: {
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    backgroundColor: colors.error,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseHeaderLeft: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  courseWeek: {
    fontSize: 14,
    color: colors.gray,
  },
  courseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
    textTransform: 'capitalize',
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseStatText: {
    color: colors.gray,
    fontSize: 13,
  },
  nextEvents: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    gap: 8,
  },
  nextEvent: {
    marginBottom: 8,
  },
  nextEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nextEventLabel: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: '500',
  },
  nextEventTime: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 22,
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
  progressBarGradient: {
    // Можно добавить градиент через LinearGradient
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
  // Mini Calendar Styles
  miniCalendar: {
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  calendarDayToday: {
    backgroundColor: colors.accent + '20',
  },
  calendarDayLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4,
  },
  calendarDayLabelToday: {
    color: colors.accent,
    fontWeight: '600',
  },
  calendarDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  calendarDayNumberToday: {
    color: colors.accent,
  },
  calendarDayEvents: {
    flexDirection: 'row',
    gap: 2,
    minHeight: 8,
  },
  calendarEvent: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarEventMore: {
    fontSize: 8,
    color: colors.gray,
  },
  // Health Metrics Styles
  healthMetrics: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  healthMetricsTitle: {
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
  metricItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
  },
  // Alerts Widget Styles
  alertsWidget: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderLeftWidth: 5,
    borderLeftColor: colors.error,
    gap: 14,
    shadowOpacity: 0,
    elevation: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.gray,
  },
  // Quick Stats Styles
  quickStatsHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    marginHorizontal: 0,
    gap: 4,
  },
  statCardHorizontal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginHorizontal: 2,
  },
  quickStats: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 6,
    gap: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
  },
  // Progress Chart Styles
  progressChart: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.gray,
  },
  // Course Stats Widget Styles
  courseStatsWidget: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  courseStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  courseStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  courseStatItem: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
    backgroundColor: colors.grayLight + '20',
    borderRadius: 12,
    padding: 12,
  },
  courseStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  courseStatLabel: {
    fontSize: 11,
    color: colors.gray,
    textAlign: 'center',
  },
  courseProgressSection: {
    marginTop: 8,
  },
  courseProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseProgressLabel: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  courseProgressValue: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 'bold',
  },
  courseProgressText: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  // Quick Actions Styles
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  quickActionCardDisabled: {
    opacity: 0.6,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: colors.gray,
  },
  // Labs Styles
  labsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labsSummaryText: {
    fontSize: 14,
    color: colors.gray,
  },
  labsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  labMiniCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: colors.grayLight + '10',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  labMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labMiniIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labMiniName: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
    lineHeight: 16,
  },
  labMiniValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  labMiniUnit: {
    fontSize: 10,
    color: colors.gray,
  },
  // Reminders Styles
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  reminderDate: {
    color: colors.gray,
    fontSize: 13,
  },
  reminderAction: {
    padding: 8,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  moreText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  cardFooterLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeCourseCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
  },
  activeCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTypeInfo: {
    gap: 2,
  },
  courseTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  courseDurationLabel: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '500',
  },
  courseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  courseStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  courseStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeCourseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  courseProgressSection: {
    marginBottom: 24,
  },
  courseDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseDateItem: {
    alignItems: 'center',
    gap: 4,
  },
  courseDateLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseDateValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  courseProgressCenter: {
    alignItems: 'center',
    gap: 2,
  },
  courseProgressPercentage: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
  },
  courseProgressLabel: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: '500',
  },
  courseProgressBarContainer: {
    gap: 8,
  },
  courseProgressDays: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  courseStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background + '40',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  courseStatItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  courseStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  courseStatLabel: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nextEventsSection: {
    backgroundColor: colors.grayLight + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  nextEventsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  nextEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEventContent: {
    flex: 1,
    gap: 2,
  },
  nextEventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  nextEventTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  courseActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  courseActionButtonPrimary: {
    backgroundColor: colors.accent,
  },
  courseActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  courseActionButtonTextPrimary: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  courseActionButtonTextSecondary: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});

// Компонент улучшенного Progress Bar
const ProgressBar = ({ 
  value, 
  max = 100, 
  color = colors.accent,
  height = 8,
  showPercentage = false,
  animated = true,
  gradient = false
}: { 
  value: number; 
  max?: number; 
  color?: string;
  height?: number;
  showPercentage?: boolean;
  animated?: boolean;
  gradient?: boolean;
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
        <Animated.View 
          style={[
            styles.progressBar, 
            { backgroundColor: color },
            gradient && styles.progressBarGradient,
            animatedStyle
          ]} 
        />
      </View>
      {showPercentage && (
        <Text style={[styles.progressText, { color }]}>
          {Math.round(value)}%
        </Text>
      )}
    </View>
  );
};

// Компонент мини-календаря
const MiniCalendar = ({ events, onDatePress, selectedDate }: { 
  events: any[]; 
  onDatePress: (date: Date) => void;
  selectedDate: Date | null;
}) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeek * 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return events.filter(event => event.date === dateStr);
  };

  const weekDays = getWeekDays();
  const today = new Date().toDateString();

  return (
    <View style={styles.miniCalendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity 
          onPress={() => setCurrentWeek(currentWeek - 1)}
          style={styles.calendarNavButton}
        >
          <FontAwesome5 name="chevron-left" size={16} color={colors.gray} />
        </TouchableOpacity>
        
        <Text style={styles.calendarTitle}>
          {currentWeek === 0 ? 'Эта неделя' : 
           currentWeek > 0 ? `+${currentWeek} недель` : 
           `${Math.abs(currentWeek)} недель назад`}
        </Text>
        
        <TouchableOpacity 
          onPress={() => setCurrentWeek(currentWeek + 1)}
          style={styles.calendarNavButton}
        >
          <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarDays}>
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day.toDateString() === today;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                isToday && styles.calendarDayToday,
                selectedDate && selectedDate.toDateString() === day.toDateString() && styles.calendarDayToday
              ]}
              onPress={() => onDatePress(day)}
            >
              <Text style={[
                styles.calendarDayLabel,
                isToday && styles.calendarDayLabelToday
              ]}>
                {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][day.getDay()]}
              </Text>
              <Text style={[
                styles.calendarDayNumber,
                isToday && styles.calendarDayNumberToday
              ]}>
                {day.getDate()}
              </Text>
              
              <View style={styles.calendarDayEvents}>
                {dayEvents.slice(0, 2).map((event, eventIndex) => (
                  <View 
                    key={eventIndex}
                    style={[
                      styles.calendarEvent,
                      { backgroundColor: event.color || colors.accent }
                    ]}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <Text style={styles.calendarEventMore}>+{dayEvents.length - 2}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Улучшенный компонент статистики здоровья
const HealthMetrics = ({ labs, actions, course }: { labs: any[]; actions: any[]; course: any }) => {
  const getHealthScore = () => {
    const recentLabs = labs.filter(lab => {
      const labDate = new Date(lab.date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return labDate >= monthAgo;
    });

    if (recentLabs.length === 0) return 0;

    let score = 0;
    let total = 0;

    LABS_REFERENCE.forEach(labType => {
      const labValues = recentLabs.filter(lab => lab.name === labType.name);
      if (labValues.length > 0) {
        const latest = labValues[labValues.length - 1];
        if (latest.value >= labType.norm_min && latest.value <= labType.norm_max) {
          score += 100;
        } else {
          const deviation = Math.min(
            Math.abs(latest.value - labType.norm_min) / labType.norm_min,
            Math.abs(latest.value - labType.norm_max) / labType.norm_max
          );
          score += Math.max(0, 100 - deviation * 100);
        }
        total += 100;
      }
    });

    return total > 0 ? Math.round(score / total * 100) : 0;
  };

  const getActivityScore = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const recentActions = actions.filter(action => {
      const actionDate = new Date(action.timestamp);
      return actionDate >= weekAgo;
    });

    const daysWithActions = new Set(
      recentActions.map(action => action.timestamp.slice(0, 10))
    ).size;

    return Math.round((daysWithActions / 7) * 100);
  };

  const getCourseCompliance = () => {
    if (!course || !course.schedule) return 0;
    
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const recentActions = actions.filter(action => {
      const actionDate = new Date(action.timestamp);
      return actionDate >= weekAgo;
    });

    // Подсчитываем запланированные действия за неделю
    let plannedActions = 0;
    let completedActions = 0;
    
    try {
      const schedule = JSON.parse(course.schedule);
      const compounds = JSON.parse(course.compounds);
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekAgo);
        checkDate.setDate(weekAgo.getDate() + i);
        const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][checkDate.getDay()];
        
        compounds.forEach((comp: any) => {
          const sched = schedule[comp.key];
          if (sched && sched.days && sched.days.includes(dayKey)) {
            plannedActions += sched.timesPerDay || 1;
          }
        });
      }
      
      completedActions = recentActions.length;
    } catch {}
    
    return plannedActions > 0 ? Math.round((completedActions / plannedActions) * 100) : 0;
  };

  const getRiskAssessment = () => {
    const recentLabs = labs.filter(lab => {
      const labDate = new Date(lab.date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return labDate >= monthAgo;
    });

    let riskFactors = 0;
    let totalFactors = 0;

    // Проверяем критические показатели
    const criticalLabs = ['АЛТ', 'АСТ', 'Билирубин общий', 'Креатинин', 'ПСА общий'];
    criticalLabs.forEach(labName => {
      const labType = LABS_REFERENCE.find(l => l.name === labName);
      if (labType) {
        totalFactors++;
        const labValues = recentLabs.filter(lab => lab.name === labName);
        if (labValues.length > 0) {
          const latest = labValues[labValues.length - 1];
          if (latest.value > labType.norm_max * 1.5) {
            riskFactors++;
          }
        }
      }
    });

    return totalFactors > 0 ? Math.round(((totalFactors - riskFactors) / totalFactors) * 100) : 100;
  };

  const healthScore = getHealthScore();
  const activityScore = getActivityScore();
  const complianceScore = getCourseCompliance();
  const riskScore = getRiskAssessment();

  return (
    <View style={styles.healthMetrics}>
      <Text style={styles.healthMetricsTitle}>Показатели здоровья</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <FontAwesome5 name="heart" size={20} color={colors.error} />
            <Text style={styles.metricValue}>{healthScore}%</Text>
          </View>
          <Text style={styles.metricLabel}>Здоровье</Text>
          <ProgressBar 
            value={healthScore} 
            color={healthScore >= 80 ? colors.success : healthScore >= 60 ? colors.warning : colors.error}
            height={4}
          />
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <FontAwesome5 name="chart-line" size={20} color={colors.accent} />
            <Text style={styles.metricValue}>{activityScore}%</Text>
          </View>
          <Text style={styles.metricLabel}>Активность</Text>
          <ProgressBar 
            value={activityScore} 
            color={colors.accent}
            height={4}
          />
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <FontAwesome5 name="check-circle" size={20} color={colors.success} />
            <Text style={styles.metricValue}>{complianceScore}%</Text>
          </View>
          <Text style={styles.metricLabel}>Соблюдение</Text>
          <ProgressBar 
            value={complianceScore} 
            color={complianceScore >= 80 ? colors.success : complianceScore >= 60 ? colors.warning : colors.error}
            height={4}
          />
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <FontAwesome5 name="shield-alt" size={20} color={colors.blue} />
            <Text style={styles.metricValue}>{riskScore}%</Text>
          </View>
          <Text style={styles.metricLabel}>Безопасность</Text>
          <ProgressBar 
            value={riskScore} 
            color={riskScore >= 80 ? colors.success : riskScore >= 60 ? colors.warning : colors.error}
            height={4}
          />
        </View>
      </View>
    </View>
  );
};

// Компонент уведомлений и алертов
const AlertsWidget = ({ 
  course, 
  labs, 
  reminders 
}: { 
  course: any; 
  labs: any[]; 
  reminders: Reminder[];
}) => {
  const getAlerts = () => {
    const alerts = [];

    // Проверка критических анализов
    const criticalLabs = labs.filter(lab => {
      const labType = LABS_REFERENCE.find(ref => ref.name === lab.name);
      if (!labType) return false;
      
      return lab.value < labType.norm_min * 0.7 || lab.value > labType.norm_max * 1.3;
    });

    if (criticalLabs.length > 0) {
      alerts.push({
        type: 'critical',
        icon: 'exclamation-triangle',
        title: 'Критические показатели',
        message: `${criticalLabs.length} анализов требуют внимания`,
        color: colors.error
      });
    }

    // Проверка просроченных напоминаний
    const overdue = reminders.filter(r => new Date(r.date) < new Date() && !r.is_done);
    if (overdue.length > 0) {
      alerts.push({
        type: 'overdue',
        icon: 'clock',
        title: 'Просроченные задачи',
        message: `${overdue.length} напоминаний просрочено`,
        color: colors.warning
      });
    }

    // Проверка длительности курса
    if (course && course.startDate) {
      const start = new Date(course.startDate);
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = (course.durationWeeks || 12) * 7;
      
      if (daysPassed > totalDays * 1.1) {
        alerts.push({
          type: 'course',
          icon: 'calendar-times',
          title: 'Курс превышен',
          message: 'Рекомендуется завершить курс',
          color: colors.warning
        });
      }
    }

    return alerts;
  };

  const alerts = getAlerts();

  if (alerts.length === 0) return null;

  return (
    <View style={styles.alertsWidget}>
      <Text style={styles.alertsTitle}>Важные уведомления</Text>
      
      {alerts.map((alert, index) => (
        <Animated.View 
          key={index}
          entering={FadeIn.delay(100 + index * 80)}
          style={[styles.alertItem, { borderLeftColor: alert.color }]}
        >
          <FontAwesome5 name={alert.icon} size={20} color={alert.color} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Улучшенный компонент графика прогресса
const ProgressChart = ({ actions, course }: { actions: any[]; course: any }) => {
  const getWeeklyProgress = () => {
    if (!course || !course.startDate) return [];

    const startDate = new Date(course.startDate);
    const weeks = [];
    const now = new Date();

    for (let i = 0; i < (course.durationWeeks || 12); i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (weekStart > now) break;

      const weekActions = actions.filter(action => {
        const actionDate = new Date(action.timestamp);
        return actionDate >= weekStart && actionDate <= weekEnd;
      });

      const injections = weekActions.filter(a => a.type === 'injection').length;
      const tablets = weekActions.filter(a => a.type === 'tablet').length;

      weeks.push({
        week: i + 1,
        injections,
        tablets,
        total: injections + tablets,
        value: injections + tablets
      });
    }

    return weeks;
  };

  const getMonthlyTrend = () => {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthActions = actions.filter(action => {
        const actionDate = new Date(action.timestamp);
        return actionDate >= monthStart && actionDate <= monthEnd;
      });
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('ru', { month: 'short' }),
        value: monthActions.length
      });
    }
    
    return monthlyData;
  };

  const weeklyData = getWeeklyProgress();
  const monthlyData = getMonthlyTrend();

  if (weeklyData.length === 0 && monthlyData.length === 0) return null;

  return (
    <View style={styles.progressChart}>
      <Text style={styles.chartTitle}>Активность по неделям</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={weeklyData}
          width={width - 64}
          height={120}
          color={colors.accent}
          thickness={3}
          curved
          dataPointsColor={colors.accent}
          dataPointsRadius={4}
          hideAxesAndRules
          hideYAxisText
          xAxisLabelTextStyle={{ color: colors.gray, fontSize: 10 }}
          showVerticalLines={false}
        />
      </View>
      
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Общая активность</Text>
        </View>
      </View>
    </View>
  );
};

// Новый компонент для отображения детальной статистики курса
const CourseStatsWidget = ({ course, actions, labs }: { course: any; actions: any[]; labs: any[] }) => {
  const getCourseStats = () => {
    if (!course) return null;

    const startDate = new Date(course.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = (course.durationWeeks || 12) * 7;
    const progress = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    // Статистика по действиям
    const totalInjections = actions.filter(a => a.type === 'injection').length;
    const totalTablets = actions.filter(a => a.type === 'tablet').length;
    const totalLabs = labs.length;

    // Статистика за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const recentActions = actions.filter(action => {
      const actionDate = new Date(action.timestamp);
      return actionDate >= weekAgo;
    });

    // Средняя активность в день
    const avgDailyActivity = recentActions.length / 7;

    return {
      progress,
      daysPassed,
      totalDays,
      totalInjections,
      totalTablets,
      totalLabs,
      avgDailyActivity,
      recentActions: recentActions.length
    };
  };

  const stats = getCourseStats();
  if (!stats) return null;

  return (
    <View style={styles.courseStatsWidget}>
      <Text style={styles.courseStatsTitle}>Статистика курса</Text>
      
      <View style={styles.courseStatsGrid}>
        <View style={styles.courseStatItem}>
          <View style={styles.courseStatIcon}>
            <FontAwesome5 name="calendar-day" size={16} color={colors.accent} />
          </View>
          <Text style={styles.courseStatValue}>{stats.daysPassed}</Text>
          <Text style={styles.courseStatLabel}>Дней</Text>
        </View>
        
        <View style={styles.courseStatItem}>
          <View style={styles.courseStatIcon}>
            <FontAwesome5 name="syringe" size={16} color={colors.blue} />
          </View>
          <Text style={styles.courseStatValue}>{stats.totalInjections}</Text>
          <Text style={styles.courseStatLabel}>Инъекций</Text>
        </View>
        
        <View style={styles.courseStatItem}>
          <View style={styles.courseStatIcon}>
            <FontAwesome5 name="pills" size={16} color={colors.orange} />
          </View>
          <Text style={styles.courseStatValue}>{stats.totalTablets}</Text>
          <Text style={styles.courseStatLabel}>Таблеток</Text>
        </View>
        
        <View style={styles.courseStatItem}>
          <View style={styles.courseStatIcon}>
            <FontAwesome5 name="vial" size={16} color={colors.success} />
          </View>
          <Text style={styles.courseStatValue}>{stats.totalLabs}</Text>
          <Text style={styles.courseStatLabel}>Анализов</Text>
        </View>
      </View>
      
      <View style={styles.courseProgressSection}>
        <View style={styles.courseProgressHeader}>
          <Text style={styles.courseProgressLabel}>Прогресс курса</Text>
          <Text style={styles.courseProgressValue}>{stats.progress}%</Text>
        </View>
        <ProgressBar 
          value={stats.progress} 
          color={colors.accent}
          height={6}
          animated
        />
        <Text style={styles.courseProgressText}>
          {stats.daysPassed} из {stats.totalDays} дней
        </Text>
      </View>
    </View>
  );
};

// Компонент быстрой статистики
const QuickStats = ({ 
  course, 
  actions, 
  labs 
}: { 
  course: any; 
  actions: any[]; 
  labs: any[];
}) => {
  const getStats = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const recentActions = actions.filter(action => {
      const actionDate = new Date(action.timestamp);
      return actionDate >= weekAgo;
    });

    const totalInjections = actions.filter(a => a.type === 'injection').length;
    const totalTablets = actions
      .filter(a => a.type === 'tablet')
      .reduce((sum, a) => {
        try {
          const d = JSON.parse(a.details);
          return sum + (Number(d.amount) || 0);
        } catch { return sum; }
      }, 0);
    const recentLabs = labs.filter(lab => {
      const labDate = new Date(lab.date);
      return labDate >= weekAgo;
    }).length;

    const courseDays = course && course.startDate ? 
      Math.floor((today.getTime() - new Date(course.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      courseDays,
      totalInjections,
      totalTablets,
      recentLabs,
      weeklyActions: recentActions.length
    };
  };

  const stats = getStats();

  return (
    <View style={styles.quickStatsHorizontal}>
      <View style={styles.statCardHorizontal}>
        <FontAwesome5 name="calendar-day" size={24} color={colors.accent} />
        <Text style={styles.statValue}>{stats.courseDays}</Text>
        <Text style={styles.statLabel}>Дней на курсе</Text>
      </View>
      <View style={styles.statCardHorizontal}>
        <FontAwesome5 name="syringe" size={24} color={colors.blue} />
        <Text style={styles.statValue}>{stats.totalInjections}</Text>
        <Text style={styles.statLabel}>Инъекций</Text>
      </View>
      <View style={styles.statCardHorizontal}>
        <FontAwesome5 name="pills" size={24} color={colors.orange} />
        <Text style={styles.statValue}>{stats.totalTablets}</Text>
        <Text style={styles.statLabel}>Таблеток</Text>
      </View>
      <View style={styles.statCardHorizontal}>
        <FontAwesome5 name="vial" size={24} color={colors.success} />
        <Text style={styles.statValue}>{stats.recentLabs}</Text>
        <Text style={styles.statLabel}>Анализов за неделю</Text>
      </View>
    </View>
  );
};

// Улучшенный компонент анализов
const RecentLabsCard = ({ labs, onPress }: { labs: any[]; onPress: () => void }) => {
  const getGroupedLabs = () => {
    const grouped: { [key: string]: { labType: any; history: any[]; latestValue: any | null } } = {};
    
    LABS_REFERENCE.forEach(labType => {
      const history = labs
        .filter(lab => lab.name === labType.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (history.length > 0) {
        grouped[labType.name] = {
          labType,
          history,
          latestValue: history[history.length - 1]
        };
      }
    });

    return grouped;
  };

  const groupedLabs = getGroupedLabs();
  const labEntries = Object.values(groupedLabs);

  if (labEntries.length === 0) {
    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardContent} onPress={onPress}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <FontAwesome5 name="vial" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>Анализы</Text>
          </View>
            <FontAwesome5 name="plus" size={16} color={colors.accent} />
        </View>
          <View style={styles.emptyState}>
            <FontAwesome5 name="chart-line" size={32} color={colors.gray} />
            <Text style={styles.emptyStateText}>Нет данных анализов</Text>
            <Text style={styles.emptyStateSubtext}>Добавьте первые результаты</Text>
        </View>
      </TouchableOpacity>
      </View>
    );
  }

  const recentLabs = labEntries
    .sort((a: any, b: any) => a.labType.priority - b.labType.priority)
    .slice(0, 4);

  const getStatusColor = (lab: any) => {
    if (lab.latestValue.value < lab.labType.norm_min) return colors.warning;
    if (lab.latestValue.value > lab.labType.norm_max) return colors.error;
    return colors.success;
  };

  const getStatusIcon = (lab: any) => {
    if (lab.latestValue.value < lab.labType.norm_min) return 'arrow-down';
    if (lab.latestValue.value > lab.labType.norm_max) return 'arrow-up';
    return 'check';
  };

  const inNormCount = labEntries.filter((lab: any) => {
    const value = lab.latestValue.value;
    return value >= lab.labType.norm_min && value <= lab.labType.norm_max;
  }).length;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardContent} onPress={onPress}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <FontAwesome5 name="vial" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Анализы</Text>
        </View>
          <View style={styles.labsSummary}>
            <Text style={styles.labsSummaryText}>
              {inNormCount}/{labEntries.length} в норме
            </Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
        </View>
      </View>
      
        <View style={styles.labsGrid}>
        {recentLabs.map((lab: any, index: number) => (
            <Animated.View 
              key={lab.labType.name}
              entering={FadeIn.delay(100 + index * 80)}
              style={styles.labMiniCard}
            >
              <View style={styles.labMiniHeader}>
                <View style={[styles.labMiniIcon, { backgroundColor: lab.labType.color + '20' }]}>
                  <FontAwesome5 name="vial" size={12} color={lab.labType.color} />
              </View>
                <FontAwesome5 
                  name={getStatusIcon(lab)} 
                  size={12} 
                  color={getStatusColor(lab)} 
                />
              </View>
              
              <Text style={styles.labMiniName} numberOfLines={2}>
                  {lab.labType.name}
                </Text>
              
              <Text style={[styles.labMiniValue, { color: lab.labType.color }]}>
                {lab.latestValue.value}
                  </Text>
              
              <Text style={styles.labMiniUnit}>{lab.labType.unit}</Text>
            </Animated.View>
        ))}
      </View>
      
        {labEntries.length > 4 && (
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterLink}>
              Посмотреть все {labEntries.length} анализов
          </Text>
          </View>
      )}
    </TouchableOpacity>
    </View>
  );
};

// Компонент Quick Action Card (улучшенный)
const QuickActionCard = ({ 
  icon, 
  title, 
  subtitle, 
  color = colors.accent,
  onPress,
  badge,
  disabled = false
}: {
  icon: string;
  title: string;
  subtitle: string;
  color?: string;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[
      styles.quickActionCard, 
      { borderLeftColor: color },
      disabled && styles.quickActionCardDisabled
    ]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}> 
      <FontAwesome5 name={icon as any} size={24} color={disabled ? colors.gray : color} />
      {badge && (
        <View style={styles.quickActionBadge}>
          <Text style={styles.quickActionBadgeText}>{badge}</Text>
      </View>
      )}
    </View>
    <View style={styles.quickActionContent}>
      <Text style={[styles.quickActionTitle, disabled && { color: colors.gray }]}>
        {title}
      </Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
    <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
  </TouchableOpacity>
);

// Функция для получения следующего события (без изменений)
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

// Вспомогательные функции для определения цветов и иконок
const getCourseTypeColor = (type: string) => {
  switch ((type || '').toLowerCase()) {
    case 'масса': return colors.success;
    case 'cut': case 'сушка': return colors.error;
    case 'support': case 'поддержка': return colors.blue;
    case 'recovery': case 'восстановление': return colors.warning;
    default: return colors.accent;
  }
};

const getCourseTypeIcon = (type: string) => {
  switch ((type || '').toLowerCase()) {
    case 'масса': return 'dumbbell';
    case 'cut': case 'сушка': return 'fire';
    case 'support': case 'поддержка': return 'heartbeat';
    case 'recovery': case 'восстановление': return 'medkit';
    default: return 'flask';
  }
};

const getCourseStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'активный': return colors.success;
    case 'завершен': return colors.gray;
    case 'приостановлен': return colors.warning;
    case 'отменен': return colors.error;
    default: return colors.success;
  }
};

// Основной компонент Dashboard
export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<{
    injectionsDone: number, 
    injectionsPlanned: number, 
    tabletsDone: number, 
    tabletsPlanned: number
  }>({
    injectionsDone: 0, 
    injectionsPlanned: 0, 
    tabletsDone: 0, 
    tabletsPlanned: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showOffScheduleModal, setShowOffScheduleModal] = useState(false);
  const [offScheduleType, setOffScheduleType] = useState<'injection' | 'tablet' | null>(null);

  // Анимированные значения
  const headerAnimation = useSharedValue(0);
  const fabAnimation = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    headerAnimation.value = withTiming(1, { duration: 800 });

    fabAnimation.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Отслеживаем загрузку дашборда
        await AnalyticsService.trackScreen('dashboard');

        // Загружаем данные из локального хранилища
        const [coursesData, labsData, actionsData, profileData, achievementsData] = await Promise.all([
          CoursesService.getCourses(),
          LabsService.getLabs(),
          ActionsService.getActions(),
          AuthService.getCurrentUser(),
          AchievementsService.getAchievementsWithProgress(),
        ]);

        setProfile(profileData);
        setCourses(coursesData);
        setLabs(labsData);
        setActions(actionsData);
        setAchievements(achievementsData);

        // Находим активный курс
        const active = coursesData.find((c: any) => 
          (c.status || '').toLowerCase().replace(/\s/g, '') === 'активный'
        );
        const selectedCourse = active || coursesData[0] || null;
        setCurrentCourse(selectedCourse);

        // Фильтруем напоминания (пока используем пустой массив, так как у нас нет сервиса напоминаний)
        setReminders([]);

        // Проверяем новые достижения
        const newAchievements = await AchievementsService.checkAndGrantAchievements();
        if (newAchievements.length > 0) {
          setShowAchievementModal(true);
          setNewAchievements(newAchievements);
        }

        // Статистика курса
        if (selectedCourse) {
          const todayStr = new Date().toISOString().slice(0, 10);
          let injectionsDone = 0, tabletsDone = 0;
        (actionsData || []).forEach((a: any) => {
          if (a.timestamp.slice(0, 10) === todayStr) {
            if (a.type === 'injection') {
              try {
                const details = JSON.parse(a.details);
                if (Array.isArray(details)) {
                  injectionsDone += details.length;
                } else {
                  injectionsDone += 1;
                }
              } catch {}
            }
            if (a.type === 'tablet') {
              try {
                const details = JSON.parse(a.details);
                tabletsDone += Number(details.amount) || 0;
              } catch {}
            }
          }
        });
        let injectionsPlanned = 0, tabletsPlanned = 0;
        try {
          const compounds = JSON.parse(selectedCourse.compounds || '[]');
          const schedule = JSON.parse(selectedCourse.schedule || '{}');
          const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
          compounds.forEach((comp: any) => {
            const sched = schedule[comp.key];
            if (!sched || !sched.days || !sched.timesPerDay) return;
            if (sched.days.includes(todayKey)) {
              if (comp.form === 'Инъекция') injectionsPlanned += Number(sched.timesPerDay);
              if (comp.form && comp.form.includes('Таблет')) tabletsPlanned += Number(sched.timesPerDay);
            }
          });
        } catch {}
        setCourseStats({ injectionsDone, injectionsPlanned, tabletsDone, tabletsPlanned });
      } else {
        setActions([]);
        setCourseStats({ injectionsDone: 0, injectionsPlanned: 0, tabletsDone: 0, tabletsPlanned: 0 });
      }
      } catch (error) {
        console.error('Ошибка загрузки данных дашборда:', error);
        await AnalyticsService.trackError('dashboard_load_error', { error: error.message });
      }
    };
    
    fetchData();
  }, [refreshing]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 0 && hour < 5) return 'Доброй ночи';
    if (hour >= 5 && hour < 12) return 'Доброе утро';
    if (hour >= 12 && hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnimation.value,
    transform: [{ translateY: (1 - headerAnimation.value) * -20 }],
  }));

  // Генерируем события для календаря
  const getCalendarEvents = () => {
    const events: { date: string; type: string; title: string; color: string }[] = [];
    
    // Добавляем напоминания
    reminders.forEach(reminder => {
      events.push({
        date: reminder.date.slice(0, 10),
        type: 'reminder',
        title: reminder.title,
        color: colors.warning
      });
    });
    
    // Добавляем запланированные инъекции
    if (currentCourse) {
      try {
        const compounds = JSON.parse(currentCourse.compounds || '[]');
        const schedule = JSON.parse(currentCourse.schedule || '{}');
        
        Object.entries(schedule).forEach(([compoundKey, sched]: any) => {
          const comp = compounds.find((c: any) => c.key === compoundKey);
          if (comp && sched.days && sched.time) {
            // Добавляем события на ближайшие 2 недели
            for (let i = 0; i < 14; i++) {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
              
              if (sched.days.includes(dayKey)) {
                events.push({
                  date: date.toISOString().slice(0, 10),
                  type: comp.form === 'Инъекция' ? 'injection' : 'tablet',
                  title: comp.label,
                  color: comp.form === 'Инъекция' ? colors.accent : colors.blue
                });
              }
            }
          }
        });
      } catch {}
    }
    
    return events;
  };

  // Автообновление данных при изменении actions/labs/reminders/currentCourse
  useEffect(() => {
    // Можно добавить fetchData() или аналогичную функцию, если есть логика обновления
    // Например, если actions/labs/reminders обновляются через подписку или после логирования
  }, [actions, labs, reminders, currentCourse]);

  // useFocusEffect для автообновления данных при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 500); // или вызвать fetchData напрямую, если есть
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()}, {profile?.full_name || profile?.username || 'Пользователь'}
            </Text>
          </View>
        </View>
      </Animated.View>

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
        {/* Active Course Card - Улучшенная версия */}
        {currentCourse && (
          <Animated.View entering={FadeIn.delay(80)} style={styles.section}>
            <TouchableOpacity
              style={[styles.card, styles.activeCourseCard]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CourseDetail', { courseId: currentCourse.id })}
            >
              {/* Заголовок карточки */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <FontAwesome5 name="flask" size={22} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 17, marginBottom: 2 }} numberOfLines={1}>{currentCourse.name}</Text>
                  <Text style={{ color: colors.gray, fontSize: 13 }}>{currentCourse.durationWeeks || 12} недель</Text>
                </View>
                <View style={[styles.courseStatusBadge, { backgroundColor: getCourseStatusColor(currentCourse.status) + '20', paddingHorizontal: 8, paddingVertical: 4 }]}> 
                  <View style={[styles.courseStatusDot, { backgroundColor: getCourseStatusColor(currentCourse.status) }]} />
                  <Text style={[styles.courseStatusText, { color: getCourseStatusColor(currentCourse.status), fontSize: 10 }]}> 
                    {currentCourse.status || 'Активный'}
                  </Text>
                </View>
              </View>
              {/* Название курса */}
              <Text style={[styles.activeCourseTitle, { fontSize: 16, marginBottom: 10 }]}>{currentCourse.name}</Text>
              {/* Даты и прогресс */}
              <View style={[styles.courseProgressSection, { marginBottom: 10 }]}> 
                <View style={[styles.courseDatesRow, { marginBottom: 8 }]}> 
                  <View style={styles.courseDateItem}>
                    <FontAwesome5 name="play" size={10} color={colors.success} />
                    <Text style={[styles.courseDateLabel, { fontSize: 9 }]}>Начало</Text>
                    <Text style={[styles.courseDateValue, { fontSize: 11 }]}> {new Date(currentCourse.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} </Text>
                  </View>
                  <View style={styles.courseProgressCenter}>
                    <Text style={[styles.courseProgressPercentage, { fontSize: 18 }]}> {(() => { const start = new Date(currentCourse.startDate); const now = new Date(); const totalDays = (currentCourse.durationWeeks || 12) * 7; const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))); return Math.min(100, Math.round((daysPassed / totalDays) * 100)); })()}% </Text>
                    <Text style={[styles.courseProgressLabel, { fontSize: 10 }]}>завершено</Text>
                  </View>
                  <View style={styles.courseDateItem}>
                    <FontAwesome5 name="flag-checkered" size={10} color={colors.warning} />
                    <Text style={[styles.courseDateLabel, { fontSize: 9 }]}>Окончание</Text>
                    <Text style={[styles.courseDateValue, { fontSize: 11 }]}> {(() => { const start = new Date(currentCourse.startDate); const end = new Date(start.getTime() + (currentCourse.durationWeeks || 12) * 7 * 24 * 60 * 60 * 1000); return end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); })()} </Text>
                  </View>
                </View>
                {/* Прогресс-бар */}
                <View style={styles.courseProgressBarContainer}>
                  <ProgressBar value={(() => { const start = new Date(currentCourse.startDate); const now = new Date(); const totalDays = (currentCourse.durationWeeks || 12) * 7; const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))); return Math.min(100, Math.round((daysPassed / totalDays) * 100)); })()} color={getCourseTypeColor(currentCourse.type)} height={6} animated gradient />
                  <Text style={[styles.courseProgressDays, { fontSize: 10, marginTop: 2 }]}> {(() => { const start = new Date(currentCourse.startDate); const now = new Date(); const totalDays = (currentCourse.durationWeeks || 12) * 7; const daysPassed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))); const daysLeft = Math.max(0, totalDays - daysPassed); return `${daysPassed} дней пройдено • ${daysLeft} дней осталось`; })()} </Text>
                </View>
              </View>
              {/* Статистика курса (оставить только одну строку) */}
              
              {/* Следующие события (стилизованный блок) */}
              {(() => {
                let compounds = [];
                let schedule = {};
                try {
                  compounds = typeof currentCourse.compounds === 'string' ? JSON.parse(currentCourse.compounds) : currentCourse.compounds;
                  schedule = typeof currentCourse.schedule === 'string' ? JSON.parse(currentCourse.schedule) : currentCourse.schedule;
                } catch {}
                const nextInjection = getNextEvent(schedule, compounds, 'Инъекция');
                const nextTablet = getNextEvent(schedule, compounds, 'Таблетки');
                if (nextInjection || nextTablet) {
                  return (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Ближайшие события</Text>
                      {nextInjection && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                            <FontAwesome5 name="syringe" size={14} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '500' }}>Инъекция</Text>
                            <Text style={{ color: colors.white, fontSize: 12 }}>{nextInjection.label}</Text>
                          </View>
                          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: 'bold', marginLeft: 8 }}>через {nextInjection.time}</Text>
                        </View>
                      )}
                      {nextTablet && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                            <FontAwesome5 name="pills" size={14} color={colors.blue} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '500' }}>Таблетка</Text>
                            <Text style={{ color: colors.white, fontSize: 12 }}>{nextTablet.label}</Text>
                          </View>
                          <Text style={{ color: colors.blue, fontSize: 13, fontWeight: 'bold', marginLeft: 8 }}>через {nextTablet.time}</Text>
                        </View>
                      )}
                    </View>
                  );
                }
                return null;
              })()}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Alerts Widget */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="syringe"
              title="Логировать инъекцию"
              subtitle={courseStats.injectionsPlanned > 0 ? 
                `Сегодня: ${courseStats.injectionsDone}/${courseStats.injectionsPlanned}` : 
                'Нет запланированных'
              }
              color={colors.accent}
              onPress={() => {
                let hasPlanned = false;
                try {
                  const compounds = typeof currentCourse.compounds === 'string' ? JSON.parse(currentCourse.compounds) : currentCourse.compounds;
                  const schedule = typeof currentCourse.schedule === 'string' ? JSON.parse(currentCourse.schedule) : currentCourse.schedule;
                  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                  hasPlanned = compounds.some((comp: any) => {
                    const sched = schedule[comp.key];
                    return (comp.form && (comp.form.includes('Инъек') || comp.form === 'Injection')) && sched && sched.days && sched.timesPerDay && sched.days.includes(todayKey);
                  });
                } catch {}
                if (hasPlanned) {
                  navigation.navigate('LogInjectionModal', { courseId: currentCourse?.id });
                } else {
                  setOffScheduleType('injection');
                  setShowOffScheduleModal(true);
                }
              }}
              disabled={!currentCourse}
              badge={courseStats.injectionsPlanned > courseStats.injectionsDone ? 
                String(courseStats.injectionsPlanned - courseStats.injectionsDone) : undefined
              }
            />
            <QuickActionCard
              icon="pills"
              title="Принять таблетку"
              subtitle={(() => {
                if (!currentCourse) return 'Нет активного курса';
                if (courseStats.tabletsPlanned > 0) {
                  return `Сегодня: ${courseStats.tabletsDone}/${courseStats.tabletsPlanned}`;
                }
                let compounds = [];
                try {
                  compounds = typeof currentCourse.compounds === 'string' ? JSON.parse(currentCourse.compounds) : currentCourse.compounds;
                } catch {}
                const tablet = compounds.find((c: any) => c.form && c.form.includes('Таблет'));
                return tablet ? tablet.label || tablet.key : 'Нет препаратов';
              })()}
              color={colors.blue}
              onPress={() => {
                let hasPlanned = false;
                try {
                  const compounds = typeof currentCourse.compounds === 'string' ? JSON.parse(currentCourse.compounds) : currentCourse.compounds;
                  const schedule = typeof currentCourse.schedule === 'string' ? JSON.parse(currentCourse.schedule) : currentCourse.schedule;
                  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                  hasPlanned = compounds.some((comp: any) => {
                    const sched = schedule[comp.key];
                    return comp.form && (comp.form.includes('Таблет') || comp.form === 'Tablet') && sched && sched.days && sched.timesPerDay && sched.days.includes(todayKey);
                  });
                } catch {}
                if (hasPlanned) {
                  navigation.navigate('LogTabletModal', { courseId: currentCourse?.id });
                } else {
                  setOffScheduleType('tablet');
                  setShowOffScheduleModal(true);
                }
              }}
              disabled={!currentCourse}
              badge={courseStats.tabletsPlanned > courseStats.tabletsDone ? 
                String(courseStats.tabletsPlanned - courseStats.tabletsDone) : undefined
              }
            />
            <QuickActionCard
              icon="flask"
              title="Добавить анализы"
              subtitle={labs.length > 0 ? 
                `Последние: ${Math.floor((Date.now() - new Date(labs[labs.length - 1]?.date || 0).getTime()) / (1000 * 60 * 60 * 24))} дн. назад` :
                'Добавьте первые результаты'
              }
              color={colors.success}
              onPress={() => navigation.navigate('Labs')}
            />
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <QuickStats course={currentCourse} actions={actions} labs={labs} />
        </Animated.View>

        {/* Mini Calendar */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Календарь событий</Text>
          <View style={styles.card}>
            <MiniCalendar 
              events={getCalendarEvents()}
              onDatePress={(date) => setSelectedDate(date)}
              selectedDate={selectedDate}
            />
                </View>
          {selectedDate && (
            <View style={[styles.card, { marginTop: 12 }]}> 
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { marginBottom: 8 }]}>События на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                {(() => {
                  const dateStr = selectedDate.toISOString().slice(0, 10);
                  // 1. Корректно вычисляем запланированные действия
                  let planned: { type: 'injection' | 'tablet'; label: string; dose: string; timesPerDay: number; time: string }[] = [];
                  if (currentCourse) {
                    try {
                      const compounds = typeof currentCourse.compounds === 'string' ? JSON.parse(currentCourse.compounds) : currentCourse.compounds;
                      const schedule = typeof currentCourse.schedule === 'string' ? JSON.parse(currentCourse.schedule) : currentCourse.schedule;
                      const doses = typeof currentCourse.doses === 'string' ? JSON.parse(currentCourse.doses) : currentCourse.doses;
                      const startDate = new Date(currentCourse.startDate);
                      const duration = currentCourse.durationWeeks || 12;
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + duration * 7 - 1);
                      if (selectedDate >= startDate && selectedDate <= endDate) {
                        const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][selectedDate.getDay()];
                        compounds.forEach((comp: any) => {
                          const sched = schedule[comp.key];
                          if (!sched || !sched.days || !sched.timesPerDay) return;
                          if (sched.days.includes(dayKey)) {
                            planned.push({
                              type: comp.form === 'Инъекция' ? 'injection' : 'tablet',
                              label: comp.label,
                              dose: doses && doses[comp.key] ? doses[comp.key] : '',
                              timesPerDay: sched.timesPerDay,
                              time: sched.time || ''
                            });
                          }
                        });
                      }
                    } catch {}
                  }
                  // 2. Выполненные действия
                  const done = actions.filter(a => a.timestamp.slice(0, 10) === dateStr);
                  // 3. Напоминания
                  const dayReminders = reminders.filter(r => r.date.slice(0, 10) === dateStr);
                  // 4. Анализы
                  const dayLabs = labs.filter(lab => lab.date.slice(0, 10) === dateStr);
                  return (
                    <View style={{ width: '100%' }}>
                      {/* Запланировано */}
                      <Text style={{ color: colors.gray, fontWeight: 'bold', marginBottom: 4 }}>Запланировано:</Text>
                      {planned.length === 0 && <Text style={{ color: colors.gray }}>Нет запланированных действий</Text>}
                      {planned.map((p, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <FontAwesome5 name={p.type === 'injection' ? 'syringe' : 'pills'} size={14} color={p.type === 'injection' ? colors.accent : colors.blue} />
                          <Text style={{ color: colors.white }}>
                            {p.label} — {p.dose}{p.dose ? (p.type === 'injection' ? ' мг' : ' мг') : ''} × {p.timesPerDay} {p.type === 'injection' ? 'раз' : 'раза'} {p.time ? `в ${p.time}` : 'в течение дня'}
                          </Text>
              </View>
            ))}
                      {/* Выполнено */}
                      <Text style={{ color: colors.gray, fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Выполнено:</Text>
                      {done.length === 0 && <Text style={{ color: colors.gray }}>Нет действий</Text>}
                      {done.map((a, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <FontAwesome5 name={a.type === 'injection' ? 'syringe' : a.type === 'tablet' ? 'pills' : 'check'} size={14} color={a.type === 'injection' ? colors.accent : a.type === 'tablet' ? colors.blue : colors.success} />
                          <Text style={{ color: colors.white }}>{a.type === 'injection' ? 'Инъекция' : a.type === 'tablet' ? 'Таблетка' : a.type}</Text>
                          <Text style={{ color: colors.gray, fontSize: 12 }}>{a.details ? (() => { try { const d = JSON.parse(a.details); return d.label || d.amount || ''; } catch { return ''; } })() : ''}</Text>
                        </View>
                      ))}
                      
                      {/* Анализы */}
                      <Text style={{ color: colors.gray, fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Анализы:</Text>
                      {dayLabs.length === 0 && <Text style={{ color: colors.gray }}>Нет анализов</Text>}
                      {dayLabs.map((lab, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <FontAwesome5 name="vial" size={14} color={colors.accent} />
                          <Text style={{ color: colors.white }}>{lab.name}: {lab.value} {lab.unit}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>
          </View>
        )}
        </Animated.View>

        {/* Health Metrics */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <HealthMetrics labs={labs} actions={actions} course={currentCourse} />
        </Animated.View>

        {/* Course Stats Widget */}
        {currentCourse && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
            <CourseStatsWidget course={currentCourse} actions={actions} labs={labs} />
          </Animated.View>
        )}

        {/* Progress Chart */}
        {actions.length > 0 && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
            <ProgressChart actions={actions} course={currentCourse} />
          </Animated.View>
        )}

        {/* Recent Labs Section */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <RecentLabsCard 
            labs={labs} 
            onPress={() => navigation.navigate('Labs')}
          />
        </Animated.View>

        {/* Reminders Section */}
        {reminders.length > 0 && (
          <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>Напоминания</Text>
            
            <View style={styles.remindersList}>
              {reminders.slice(0, 3).map((reminder, index) => (
                <Animated.View 
                  key={reminder.id}
                  entering={FadeIn.delay(100 + index * 80)}
                  style={styles.reminderItem}
                >
                  <FontAwesome5 name="bell" size={20} color={colors.accent} />
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDate}>
                      {new Date(reminder.date).toLocaleString('ru', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.reminderAction}>
                    <FontAwesome5 name="check" size={16} color={colors.success} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            
            {reminders.length > 3 && (
              <TouchableOpacity style={styles.moreButton}>
                <Text style={styles.moreText}>Показать все {reminders.length} напоминаний</Text>
                <FontAwesome5 name="chevron-right" size={12} color={colors.accent} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Кастомное модальное окно для внепланового логирования */}
      <Portal>
        <Dialog visible={showOffScheduleModal} onDismiss={() => setShowOffScheduleModal(false)} style={{ backgroundColor: '#23232a', borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.accent, textAlign: 'center', fontSize: 20, marginBottom: 0 }}>
            {offScheduleType === 'injection' ? 'Нет инъекций по расписанию' : 'Нет таблеток по расписанию'}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.white, fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              {offScheduleType === 'injection'
                ? 'Сегодня по расписанию нет инъекций. Добавить вне расписания?'
                : 'Сегодня по расписанию нет таблеток. Добавить вне расписания?'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
            <Button onPress={() => setShowOffScheduleModal(false)} textColor={colors.gray}>Отмена</Button>
            <Button onPress={() => {
              setShowOffScheduleModal(false);
              if (offScheduleType === 'injection') {
                navigation.navigate('LogInjectionModal', { courseId: currentCourse?.id, offSchedule: true });
              } else if (offScheduleType === 'tablet') {
                navigation.navigate('LogTabletModal', { courseId: currentCourse?.id, offSchedule: true });
              }
            }} textColor={colors.accent}>Добавить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}