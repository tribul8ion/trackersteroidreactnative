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
import { isTabletForm } from '../services/domain';
import { addAction, getActions } from '../services/actions';
import { getUser } from '../services/auth';
import { Portal, Dialog, Button } from 'react-native-paper';
import { colors } from '../theme/colors';

// Компонент для таблетки
const TabletItem = ({
  compound,
  isSelected,
  onSelect,
  amount,
  onAmountChange,
  isLogged
}: {
  compound: any;
  isSelected: boolean;
  onSelect: () => void;
  amount: string;
  onAmountChange: (value: string) => void;
  isLogged: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableOpacity 
      style={[
        styles.tabletCard,
        isSelected && styles.tabletCardSelected,
        isLogged && styles.tabletCardLogged
      ]}
      onPress={onSelect}
      disabled={isLogged}
    >
      <View style={styles.tabletHeader}>
        <View style={styles.tabletLeft}>
          <View style={[
            styles.statusIcon,
            isSelected && styles.statusIconSelected,
            isLogged && styles.statusIconLogged
          ]}>
            <FontAwesome5 
              name={isLogged ? 'check' : 'pills'} 
              size={16} 
              color={isLogged ? colors.success : isSelected ? colors.accent : colors.gray} 
            />
          </View>
          <View style={styles.tabletInfo}>
            <Text style={[
              styles.tabletName,
              isSelected && styles.tabletNameSelected,
              isLogged && styles.tabletNameLogged
            ]}>
              {compound.label}
            </Text>
            <Text style={styles.tabletType}>Таблетка</Text>
          </View>
        </View>
        
        {isLogged && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Принято</Text>
          </View>
        )}
      </View>

      {isSelected && !isLogged && (
        <View style={styles.doseSection}>
          <Text style={styles.doseLabel}>Количество</Text>
          <View style={styles.doseRow}>
            <TextInput
              style={[
                styles.doseInput,
                isFocused && styles.doseInputFocused
              ]}
              placeholder={compound.dosePerTablet || '0'}
              placeholderTextColor={colors.gray}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="numeric"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <Text style={styles.doseUnit}>мг/шт</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const LogTabletScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, offSchedule } = route.params as { courseId: string, offSchedule?: boolean };
  
  const [compounds, setCompounds] = useState<any[]>([]);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [loggedCompounds, setLoggedCompounds] = useState<string[]>([]);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [compoundProgress, setCompoundProgress] = useState<{ [key: string]: { taken: number; planned: number } }>({});
  const [schedule, setSchedule] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setIsScreenLoading(true);
    try {
      const { data: course } = await getCourseById(courseId);
      if (course) {
        setCourseName(course.name || 'Курс');
        
        const compounds = JSON.parse(course.compounds || '[]')
          .filter((c: any) => isTabletForm(c.form));
        setCompounds(compounds);
        const scheduleObj = JSON.parse(course.schedule || '{}');
        setSchedule(scheduleObj);

        // Проверяем уже принятые таблетки сегодня
        const { data: userData } = await getUser();
        const user_id = userData?.user?.id;
        const { data: actions } = await getActions(String(user_id), courseId);
        const todayStr = new Date().toISOString().slice(0, 10);
        // Считаем количество приёмов (логов) по каждому compound
        const progress: { [key: string]: { taken: number; planned: number } } = {};
        compounds.forEach((c: any) => {
          const sched = scheduleObj[c.key] || {};
          const planned = sched.timesPerDay || 1;
          // Считаем сумму amount по логам за сегодня
          const taken = (actions || []).reduce((sum, a) => {
            if (
              a.type === 'tablet' &&
              a.timestamp.slice(0, 10) === todayStr
            ) {
              try {
                const d = JSON.parse(a.details);
                if (d.compound === c.key) {
                  return sum + (Number(d.amount) || 0);
                }
              } catch {}
            }
            return sum;
          }, 0);
          progress[c.key] = { taken, planned };
        });
        setCompoundProgress(progress);
        // Для старой логики (оставляю для совместимости)
        let logged: string[] = [];
        (actions || []).forEach((a: any) => {
          try {
            const details = JSON.parse(a.details);
            if (details.compound) {
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

  const handleCompoundSelect = (key: string) => {
    const progress = compoundProgress[key] || { taken: 0, planned: 1 };
    if (progress.taken >= progress.planned) return; // блокируем только если лимит
    if (selectedCompound === key) {
      setSelectedCompound(null);
      setAmount('');
    } else {
      setSelectedCompound(key);
      setAmount('');
    }
  };

  const handleAmountChange = (val: string) => {
    // Ограничиваем ввод, чтобы сумма не превышала лимит
    if (!selectedCompound) return setAmount(val);
    const progress = compoundProgress[selectedCompound] || { taken: 0, planned: 1 };
    let num = Number(val.replace(/[^\d]/g, ''));
    if (offSchedule) {
      if (num > 9999) num = 9999;
      setAmount(num ? String(num) : '');
    } else {
      const left = Math.max(0, progress.planned - progress.taken);
      if (num > left) num = left;
      setAmount(num ? String(num) : '');
    }
  };

  const handleLog = async () => {
    if (!selectedCompound || !amount) {
      Alert.alert('Внимание', 'Выберите препарат и укажите количество');
      return;
    }
    let toLog = 0;
    if (offSchedule) {
      toLog = Number(amount);
      if (toLog <= 0) {
        Alert.alert('Ошибка', 'Введите количество');
        return;
      }
    } else {
      const progress = compoundProgress[selectedCompound] || { taken: 0, planned: 1 };
      const left = Math.max(0, progress.planned - progress.taken);
      toLog = Math.min(Number(amount), left);
      if (toLog <= 0) {
        Alert.alert('Ошибка', 'Превышен лимит приёмов на сегодня');
        return;
      }
    }
    setLoading(true);
    try {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      const selectedCompoundData = compounds.find(c => c.key === selectedCompound);
      await addAction({
        user_id: String(user_id),
        course_id: courseId,
        type: 'tablet',
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ 
          compound: selectedCompound, 
          label: selectedCompoundData?.label,
          amount: toLog 
        }),
      });
      setSuccessText(`Отмечен приём: ${selectedCompoundData?.label} ${toLog} шт.`);
      setShowSuccessModal(true);
      setSelectedCompound(null);
      setAmount('');
      loadData();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  const canLog = offSchedule
    ? selectedCompound && amount && Number(amount) > 0
    : selectedCompound && amount && Number(amount) > 0 && (compoundProgress[selectedCompound]?.taken || 0) < (compoundProgress[selectedCompound]?.planned || 1);
  const loggedCount = compounds.reduce((sum, c) => sum + (compoundProgress[c.key]?.taken || 0), 0);
  const totalCount = compounds.reduce((sum, c) => sum + (compoundProgress[c.key]?.planned || 0), 0);

  if (isScreenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.white, marginTop: 16 }}>Загрузка...</Text>
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
          <Text style={styles.headerTitle}>Логирование таблеток</Text>
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
            Принято {loggedCount} из {totalCount} приёмов
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
          <Text style={styles.sectionTitle}>Препараты в таблетках</Text>
          <Text style={styles.sectionSubtitle}>
            {offSchedule
              ? 'Логирование вне расписания. Будьте внимательны!'
              : 'Выберите препарат и укажите количество'}
          </Text>
        </View>

        {/* Tablets List */}
        <View style={styles.tabletsList}>
          {compounds.map((compound) => {
            const progress = compoundProgress[compound.key] || { taken: 0, planned: 1 };
            const isLimitReached = progress.taken >= progress.planned;
            return (
              <View key={compound.key}>
                <TabletItem
                  compound={compound}
                  isSelected={selectedCompound === compound.key && !isLimitReached}
                  onSelect={() => handleCompoundSelect(compound.key)}
                  amount={selectedCompound === compound.key ? amount : ''}
                  onAmountChange={handleAmountChange}
                  isLogged={isLimitReached}
                />
                <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, marginLeft: 12 }}>
                  {`Принято: ${progress.taken} из ${progress.planned} за сегодня`}
                </Text>
              </View>
            );
          })}
        </View>

        {compounds.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome5 name="pills" size={48} color={colors.gray} />
            <Text style={styles.emptyText}>Нет препаратов в таблетках</Text>
            <Text style={styles.emptySubtext}>
              Добавьте препараты в курс для отслеживания приема
            </Text>
          </View>
        )}
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
            name={loading ? 'sync-alt' : 'check'} 
            size={20} 
            color="#000" 
          />
          <Text style={styles.logButtonText}>
            {loading ? 'Сохраняю...' : 'Отметить прием'}
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
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
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
    color: colors.accent,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  tabletsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tabletCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  tabletCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  tabletCardLogged: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  tabletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabletLeft: {
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
  statusIconSelected: {
    backgroundColor: colors.accent,
  },
  statusIconLogged: {
    backgroundColor: colors.success,
  },
  tabletInfo: {
    flex: 1,
  },
  tabletName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  tabletNameSelected: {
    color: colors.accent,
  },
  tabletNameLogged: {
    color: colors.success,
  },
  tabletType: {
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
    marginTop: 16,
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
    backgroundColor: colors.grayLight + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  doseInputFocused: {
    borderColor: colors.accent,
  },
  doseUnit: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grayLight,
    textAlign: 'center',
    lineHeight: 20,
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
    borderRadius: 12,
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

export default LogTabletScreen;