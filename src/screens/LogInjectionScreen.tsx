import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getCourseById } from '../services/courses';
import { addAction, getActions } from '../services/actions';
import { getUser } from '../services/auth';
import { checkAndGrantActionAchievements } from '../services/achievements';
import Toast from 'react-native-toast-message';
import { Portal, Dialog, Button } from 'react-native-paper';
import { colors } from '../theme/colors';

function getTodayKey() {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date().getDay()];
}

// Компонент для препарата
const CompoundItem = ({
  compound,
  amount,
  onAmountChange,
  isLogged,
  isScheduled
}: {
  compound: any;
  amount: string;
  onAmountChange: (value: string) => void;
  isLogged: boolean;
  isScheduled: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const concentration = Number(compound.concentration || 0);
  const amountMl = Number(amount || 0);
  const amountMg = concentration > 0 && amountMl > 0 ? amountMl * concentration : null;

  return (
    <View style={[
      styles.compoundCard,
      isLogged && styles.compoundCardLogged
    ]}>
      <View style={styles.compoundHeader}>
        <View style={styles.compoundLeft}>
          <View style={[
            styles.statusIcon,
            isLogged && styles.statusIconLogged
          ]}>
            <FontAwesome5 
              name={isLogged ? 'check' : 'syringe'} 
              size={16} 
              color={isLogged ? colors.success : colors.accent} 
            />
          </View>
          <View style={styles.compoundInfo}>
            <Text style={[
              styles.compoundName,
              isLogged && styles.compoundNameLogged
            ]}>
              {compound.label}
            </Text>
            <Text style={styles.compoundType}>Инъекция</Text>
          </View>
        </View>
        
        {isLogged && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Отмечено</Text>
          </View>
        )}
      </View>

      <View style={styles.doseSection}>
        <Text style={styles.doseLabel}>Объём</Text>
        <View style={styles.doseRow}>
          <TextInput
            style={[
              styles.doseInput,
              isFocused && styles.doseInputFocused,
              isLogged && styles.doseInputDisabled
            ]}
            placeholder="0"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={onAmountChange}
            keyboardType="numeric"
            editable={!isLogged}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Text style={styles.doseUnit}>мл</Text>
        </View>
        {concentration > 0 && amountMl > 0 && (
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, marginLeft: 2 }}>
            Это {amountMg} мг
          </Text>
        )}
      </View>
    </View>
  );
};

const LogInjectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, offSchedule } = route.params as { courseId?: string, offSchedule?: boolean };
  const courseIdStr = String(courseId);
  
  const [compounds, setCompounds] = useState<any[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loggedCompounds, setLoggedCompounds] = useState<string[]>([]);
  const [courseName, setCourseName] = useState('');
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [compoundProgress, setCompoundProgress] = useState<{ [key: string]: { taken: number; planned: number } }>({});
  const [schedule, setSchedule] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [courseIdStr, offSchedule]);

  const loadData = async () => {
    setIsScreenLoading(true);
    try {
      const { data: course } = await getCourseById(courseIdStr);
      if (course) {
        setCourseName(course.name || 'Курс');
        const allCompounds = JSON.parse(course.compounds || '[]').filter((c: any) => c.form && c.form.includes('Инъекция'));
        const scheduleObj = JSON.parse(course.schedule || '{}');
        setSchedule(scheduleObj);
        let compounds: any[] = [];
        if (offSchedule) {
          compounds = allCompounds;
        } else {
          // Только те, что по расписанию на сегодня
          const todayKey = getTodayKey();
          compounds = allCompounds.filter((c: any) => {
            const sched = scheduleObj[c.key];
            return sched && sched.days && sched.timesPerDay && sched.days.includes(todayKey);
          });
        }
        setCompounds(compounds);
        // Проверяем уже отмеченные препараты
        const { data: userData } = await getUser();
        const user_id = userData?.user?.id;
        const { data: actions } = await getActions(String(user_id || ''), String(courseIdStr));
        const todayStr = new Date().toISOString().slice(0, 10);
        // Считаем сумму amount по каждому compound
        const progress: { [key: string]: { taken: number; planned: number } } = {};
        compounds.forEach((c: any) => {
          const sched = scheduleObj[c.key] || {};
          const planned = offSchedule ? 0 : (sched.timesPerDay || 1);
          // Суммируем amount за сегодня
          const taken = (actions || []).filter(
            (a: any) => a.type === 'injection' && a.timestamp.slice(0, 10) === todayStr && (() => {
              try {
                const d = JSON.parse(a.details);
                if (Array.isArray(d)) {
                  return d.some((item) => item.compound === c.key);
                } else {
                  return d.compound === c.key;
                }
              } catch { return false; }
            })()
          ).reduce((sum: number, a: any) => {
            try {
              const d = JSON.parse(a.details);
              if (Array.isArray(d)) {
                return sum + d.filter((item) => item.compound === c.key).reduce((s, item) => s + Number(item.amount || 0), 0);
              } else {
                return sum + Number(d.amount || 0);
              }
            } catch { return sum; }
          }, 0);
          progress[c.key] = { taken, planned };
        });
        setCompoundProgress(progress);
        // Для старой логики (оставляю для совместимости)
        let logged: string[] = [];
        (actions || []).forEach((a: any) => {
          try {
            const details = JSON.parse(a.details);
            if (Array.isArray(details)) {
              details.forEach((d) => {
                if (d.compound) logged.push(d.compound);
              });
            } else if (details.compound) {
              logged.push(details.compound);
            }
          } catch {}
        });
        setLoggedCompounds(logged);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные курса');
    } finally {
      setIsScreenLoading(false);
    }
  };

  const handleAmountChange = (key: string, val: string) => {
    const progress = compoundProgress[key] || { taken: 0, planned: 1 };
    let num = Number(val.replace(/[^\d]/g, ''));
    if (offSchedule) {
      if (num > 9999) num = 9999;
      setAmounts((prev) => ({ ...prev, [key]: num ? String(num) : '' }));
    } else {
      const left = Math.max(0, progress.planned - progress.taken);
      if (num > left) num = left;
      setAmounts((prev) => ({ ...prev, [key]: num ? String(num) : '' }));
    }
  };

  const handleLog = async () => {
    // Собираем только те, которые не превысили лимит
    const selected = compounds
      .map((c) => {
        const amtMl = Number(amounts[c.key] || 0);
        const concentration = Number(c.concentration || 0);
        const amtMg = concentration > 0 && amtMl > 0 ? amtMl * concentration : null;
        if (offSchedule) {
          return amtMl > 0 ? { compound: c.key, label: c.label, amountMl: amtMl, amountMg: amtMg } : null;
        } else {
          const progress = compoundProgress[c.key] || { taken: 0, planned: 1 };
          const left = Math.max(0, progress.planned - progress.taken);
          const finalAmtMl = Math.min(amtMl, left);
          const finalAmtMg = concentration > 0 && finalAmtMl > 0 ? finalAmtMl * concentration : null;
          return finalAmtMl > 0 && left > 0 && !loggedCompounds.includes(c.key)
            ? { compound: c.key, label: c.label, amountMl: finalAmtMl, amountMg: finalAmtMg }
            : null;
        }
      })
      .filter(Boolean);
    if (selected.length === 0) {
      Alert.alert('Внимание', 'Выберите препараты и укажите объём');
      return;
    }
    setLoading(true);
    try {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      await addAction({
        user_id: String(user_id || ''),
        course_id: String(courseIdStr),
        type: 'injection',
        timestamp: new Date().toISOString(),
        details: JSON.stringify(selected),
      });
      setSuccessText(`Отмечено ${selected.length} препаратов`);
      setShowSuccessModal(true);
      // После логирования сбрасываем выбор и дозы
      setAmounts({});
      setLoggedCompounds([]);
      loadData();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  const canLog = offSchedule
    ? compounds.some((c) => amounts[c.key] && Number(amounts[c.key]) > 0)
    : compounds.some((c) => {
        const progress = compoundProgress[c.key] || { taken: 0, planned: 1 };
        const left = Math.max(0, progress.planned - progress.taken);
        return !loggedCompounds.includes(c.key) && amounts[c.key] && Number(amounts[c.key]) > 0 && left > 0;
      });

  let loggedCount = 0;
  let totalCount = 0;
  if (offSchedule) {
    loggedCount = compounds.reduce((sum, c) => sum + (compoundProgress[c.key]?.taken || 0), 0);
    totalCount = compounds.length;
  } else {
    loggedCount = compounds.reduce((sum, c) => sum + (compoundProgress[c.key]?.taken || 0), 0);
    totalCount = compounds.reduce((sum, c) => sum + (compoundProgress[c.key]?.planned || 0), 0);
  }

  if (isScreenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: '#FFF', marginTop: 16 }}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Логирование инъекций</Text>
          <Text style={styles.headerSubtitle}>{courseName} — {new Date().toLocaleDateString()}</Text>
          {offSchedule && (
            <Text style={{ color: colors.warning, fontSize: 13, marginTop: 2 }}>Вне расписания</Text>
          )}
        </View>
        
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{loggedCount}/{totalCount}</Text>
        </View>
      </View>

      {/* Success Banner */}
      {loggedCount > 0 && (
        <View style={styles.successBanner}>
          <FontAwesome5 name="check-circle" size={20} color={colors.success} />
          <Text style={styles.successText}>
            {offSchedule
              ? `Отмечено ${loggedCount} вне расписания`
              : `Отмечено ${loggedCount} из ${totalCount} доз за сегодня`}
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Препараты для инъекций</Text>
          <Text style={styles.sectionSubtitle}>
            {offSchedule
              ? 'Логирование вне расписания. Будьте внимательны!'
              : totalCount === 0
                ? 'Сегодня по расписанию нет инъекций'
                : 'Все препараты отмечены'}
          </Text>
        </View>

        {/* Compounds List */}
        <View style={styles.compoundsList}>
          {compounds.map((compound) => {
            const progress = compoundProgress[compound.key] || { taken: 0, planned: 1 };
            const isLimitReached = progress.taken >= progress.planned && !offSchedule;
            return (
              <View key={compound.key}>
                <CompoundItem
                  compound={compound}
                  amount={amounts[compound.key] || ''}
                  onAmountChange={(value) => handleAmountChange(compound.key, value)}
                  isLogged={isLimitReached}
                  isScheduled={!offSchedule}
                />
                <Text style={{ color: offSchedule ? colors.warning : '#3B82F6', fontSize: 13, marginTop: 4, marginLeft: 12 }}>
                  {offSchedule
                    ? `Вне расписания: принято ${progress.taken} доз за сегодня`
                    : `Принято: ${progress.taken} из ${progress.planned} за сегодня`}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.logButton,
            !canLog && styles.logButtonDisabled
          ]}
          onPress={handleLog}
          disabled={!canLog || loading}
        >
          <FontAwesome5 
            name={loading ? "sync-alt" : "check"} 
            size={20} 
            color="#000" 
          />
          <Text style={styles.logButtonText}>
            {loading
              ? 'Сохраняю...'
              : offSchedule
                ? `Отметить ${compounds.filter(c => amounts[c.key] && Number(amounts[c.key]) > 0).length} препаратов`
                : `Отметить ${compounds.filter(c => amounts[c.key] && Number(amounts[c.key]) > 0 && !loggedCompounds.includes(c.key)).length} препаратов`
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Portal>
        <Dialog visible={showSuccessModal} onDismiss={() => { setShowSuccessModal(false); navigation.goBack(); }} style={{ backgroundColor: colors.card, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.accent, textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 0, marginTop: 8 }}>Успешно!</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.white, fontSize: 16, textAlign: 'center', marginVertical: 12 }}>{successText}</Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 12 }}>
            <Button onPress={() => { setShowSuccessModal(false); navigation.goBack(); }} textColor={colors.accent} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.success,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  compoundsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  compoundCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  compoundCardLogged: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  compoundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compoundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconLogged: {
    backgroundColor: colors.success,
  },
  compoundInfo: {
    flex: 1,
  },
  compoundName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  compoundNameLogged: {
    color: colors.success,
  },
  compoundType: {
    fontSize: 12,
    color: colors.gray,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  doseSection: {
    gap: 8,
  },
  doseLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doseInput: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  doseInputFocused: {
    borderColor: colors.accent,
  },
  doseInputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.grayLight,
  },
  doseUnit: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  logButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logButtonDisabled: {
    backgroundColor: colors.grayLight,
    opacity: 0.5,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});

export default LogInjectionScreen;