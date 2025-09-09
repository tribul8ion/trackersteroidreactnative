import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addCourse } from '../services/courses';
import { getUser } from '../services/auth';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { checkAndGrantActionAchievements } from '../services/achievements';
import Toast from 'react-native-toast-message';
import { colors } from '../theme/colors';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const steps = [
  { key: 'type', label: 'Тип', icon: 'list-circle-outline' },
  { key: 'compounds', label: 'Препараты', icon: 'flask-outline' },
  { key: 'dose', label: 'Дозировка', icon: 'fitness-outline' },
  { key: 'schedule', label: 'Расписание', icon: 'calendar-outline' },
  { key: 'pct', label: 'PCT', icon: 'medkit-outline' },
  { key: 'safety', label: 'Готово', icon: 'shield-checkmark-outline' },
];

const COURSE_TYPES = [
  { key: 'mass', label: 'Масса', icon: 'barbell-outline', description: 'Набор мышечной массы', color: colors.green },
  { key: 'cut', label: 'Рельеф', icon: 'flash-outline', description: 'Сушка и снижение жира', color: colors.orange },
  { key: 'support', label: 'Поддержка', icon: 'heart-outline', description: 'Лёгкая поддержка формы', color: colors.blue },
  { key: 'recovery', label: 'Восстановление', icon: 'medkit-outline', description: 'Восстановление после курса', color: colors.purple },
];

const COMPOUND_CATEGORIES = [
  { key: 'test', label: 'Тестостерон', icon: 'fitness-outline', color: colors.green },
  { key: 'mass', label: 'Масса', icon: 'barbell-outline', color: colors.blue },
  { key: 'cut', label: 'Рельеф', icon: 'flash-outline', color: colors.orange },
  { key: 'sarm', label: 'SARM', icon: 'flask-outline', color: colors.purple },
  { key: 'pct', label: 'ПКТ/ИА', icon: 'shield-checkmark-outline', color: colors.error },
];

const COMPOUNDS = [
  // Базовые тестостероны
  { 
    key: 'test-e', 
    label: 'Тестостерон Энантат', 
    form: 'Инъекция', 
    tHalf: '5-7 дн', 
    tox: 1, 
    features: 'Базовый препарат с длительным действием. Стабильный уровень гормона, инъекции 1-2 раза в неделю. Подходит для первого курса.', 
    category: 'test' 
  },
  { 
    key: 'test-c', 
    label: 'Тестостерон Ципионат', 
    form: 'Инъекция', 
    tHalf: '5-6 дн', 
    tox: 1, 
    features: 'Аналог энантата с похожими свойствами. Популярен в США. Практически идентичен энантату по действию.', 
    category: 'test' 
  },
  { 
    key: 'test-p', 
    label: 'Тестостерон Пропионат', 
    form: 'Инъекция', 
    tHalf: '1-2 дн', 
    tox: 1, 
    features: 'Короткий эфир тестостерона. Быстрое начало действия, требует частых инъекций через день. Меньше задержки воды.', 
    category: 'test' 
  },
  { 
    key: 'sustanon', 
    label: 'Сустанон / Омнадрен', 
    form: 'Инъекция', 
    tHalf: '1-14 дн', 
    tox: 1, 
    features: 'Смесь 4 эфиров тестостерона. Нестабильные пики концентрации, сложно контролировать уровень в крови.', 
    category: 'test' 
  },
  
  // Массонаборные ААС
  { 
    key: 'methan', 
    label: 'Метандиенон (Метан)', 
    form: 'Таблетки', 
    tHalf: '4-6 ч', 
    tox: 3, 
    features: 'Сильно ароматизируется в эстроген. Быстрый набор массы с задержкой воды. Высокая нагрузка на печень.', 
    category: 'mass' 
  },
  { 
    key: 'turinabol', 
    label: 'Туринабол', 
    form: 'Таблетки', 
    tHalf: '16 ч', 
    tox: 2, 
    features: 'Не ароматизируется, качественная сухая масса. Умеренная нагрузка на печень. Популярен у новичков.', 
    category: 'mass' 
  },
  { 
    key: 'deca', 
    label: 'Нандролон Деканоат', 
    form: 'Инъекция', 
    tHalf: '6-12 дн', 
    tox: 1, 
    features: 'Повышает пролактин. Положительно влияет на суставы. Медленное начало действия, долгое выведение.', 
    category: 'mass' 
  },
  { 
    key: 'npp', 
    label: 'Нандролон Фенилпропионат', 
    form: 'Инъекция', 
    tHalf: '2-4 дн', 
    tox: 1, 
    features: 'Короткий эфир нандролона. Быстрее начинает действовать и выводится. Требует более частых инъекций.', 
    category: 'mass' 
  },
  { 
    key: 'boldenone', 
    label: 'Болденон', 
    form: 'Инъекция', 
    tHalf: '~14 дн', 
    tox: 1, 
    features: 'Медленный набор качественной массы. Слабо ароматизируется. Может повышать аппетит и выносливость.', 
    category: 'mass' 
  },
  { 
    key: 'anapolon', 
    label: 'Оксиметолон', 
    form: 'Таблетки', 
    tHalf: '8-10 ч', 
    tox: 3, 
    features: 'Очень мощный препарат с сильной задержкой воды. Может повышать давление. Высокая гепатотоксичность.', 
    category: 'mass' 
  },
  
  // Сушка/рельеф
  { 
    key: 'stano', 
    label: 'Станозолол', 
    form: 'Таблетки/Инъекции', 
    tHalf: '9-24 ч', 
    tox: 2, 
    features: 'Выводит лишнюю воду, придает твердость мышцам. Может негативно влиять на суставы и связки.', 
    category: 'cut' 
  },
  { 
    key: 'masteron', 
    label: 'Мастерон', 
    form: 'Инъекция', 
    tHalf: '2-3 дн', 
    tox: 1, 
    features: 'Обладает антиэстрогенными свойствами. Придает мышцам твердость и плотность. Популярен на сушке.', 
    category: 'cut' 
  },
  { 
    key: 'tren-a', 
    label: 'Тренболон Ацетат', 
    form: 'Инъекция', 
    tHalf: '1-2 дн', 
    tox: 2, 
    features: 'Очень мощный препарат. Повышает пролактин, может вызывать агрессию и потливость. Только для опытных.', 
    category: 'cut' 
  },
  { 
    key: 'tren-e', 
    label: 'Тренболон Энантат', 
    form: 'Инъекция', 
    tHalf: '7-10 дн', 
    tox: 2, 
    features: 'Длинный эфир тренболона. Сложнее контролировать побочные эффекты. Затрудняет восстановление на ПКТ.', 
    category: 'cut' 
  },
  { 
    key: 'primo', 
    label: 'Примоболан', 
    form: 'Инъекция', 
    tHalf: '~10 дн', 
    tox: 1, 
    features: 'Мягкий препарат с минимальными побочными эффектами. Не ароматизируется. Дорогой и часто подделывается.', 
    category: 'cut' 
  },
  { 
    key: 'anavar', 
    label: 'Оксандролон', 
    form: 'Таблетки', 
    tHalf: '9-10 ч', 
    tox: 1, 
    features: 'Один из самых безопасных оральных стероидов. Подходит для женщин. Минимальное подавление тестостерона.', 
    category: 'cut' 
  },
  
  // SARM
  { 
    key: 'ostarine', 
    label: 'Ostarine (MK-2866)', 
    form: 'Капсулы', 
    tHalf: '~24 ч', 
    tox: 1, 
    features: 'Селективный модулятор андрогенных рецепторов. Мягкое действие, часто не требует ПКТ. Подходит новичкам.', 
    category: 'sarm' 
  },
  { 
    key: 'rad140', 
    label: 'RAD-140', 
    form: 'Капсулы', 
    tHalf: '~16-20 ч', 
    tox: 2, 
    features: 'Более мощный SARM. Может значительно подавлять выработку тестостерона. Требует контроля анализов.', 
    category: 'sarm' 
  },
  { 
    key: 'lgd', 
    label: 'LGD-4033', 
    form: 'Капсулы', 
    tHalf: '~24-36 ч', 
    tox: 2, 
    features: 'Сильный SARM для набора массы. Может подавлять ЛГ и ФСГ. Возможна задержка воды на высоких дозах.', 
    category: 'sarm' 
  },
  { 
    key: 'yk11', 
    label: 'YK-11', 
    form: 'Капсулы', 
    tHalf: '~6-10 ч', 
    tox: 3, 
    features: 'Спорный препарат с механизмом действия, похожим на стероиды. Агрессивное воздействие, не для новичков.', 
    category: 'sarm' 
  },
  
  // ПКТ и вспомогательные
  { 
    key: 'anastrozole', 
    label: 'Анастрозол', 
    form: 'Таблетки', 
    tHalf: '48 ч', 
    tox: 1, 
    features: 'Ингибитор ароматазы. Снижает уровень эстрадиола. Важно не переборщить с дозировкой - может "убить" эстроген.', 
    category: 'pct' 
  },
  { 
    key: 'tamoxifen', 
    label: 'Тамоксифен', 
    form: 'Таблетки', 
    tHalf: '5-7 дн', 
    tox: 1, 
    features: 'Селективный модулятор эстрогенных рецепторов. Стандарт для ПКТ. Блокирует эстроген в груди, но не в организме.', 
    category: 'pct' 
  },
  { 
    key: 'clomid', 
    label: 'Кломид', 
    form: 'Таблетки', 
    tHalf: '5-7 дн', 
    tox: 1, 
    features: 'Стимулирует выработку ЛГ и ФСГ, запуская естественную продукцию тестостерона. Основа любой ПКТ.', 
    category: 'pct' 
  },
  { 
    key: 'cabergoline', 
    label: 'Каберголин', 
    form: 'Таблетки', 
    tHalf: '2-3 дн', 
    tox: 2, 
    features: 'Агонист дофаминовых рецепторов. Снижает пролактин. Необходим при использовании нандролонов и тренболона.', 
    category: 'pct' 
  },
];

const DAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' },
];

const PCT_SUGGESTIONS = [
  { key: 'clomid', label: 'Кломид', defaultDose: '50', defaultDuration: '14', unit: 'мг', durationUnit: 'дней' },
  { key: 'tamoxifen', label: 'Тамоксифен', defaultDose: '20', defaultDuration: '14', unit: 'мг', durationUnit: 'дней' },
  { key: 'anastrozole', label: 'Анастрозол', defaultDose: '0.5', defaultDuration: '10', unit: 'мг', durationUnit: 'дней' },
];

const SAFETY_WARNINGS = [
  { key: 'liver', text: 'Повышенная нагрузка на печень (оральные препараты, токсичные соединения)' },
  { key: 'estrogen', text: 'Риск гинекомастии и эстрогеновых побочных эффектов' },
  { key: 'blood', text: 'Необходимость контроля анализов крови (печёночные ферменты, липиды, гормоны)' },
  { key: 'pct', text: 'ПКТ обязательна после курса для восстановления гормонального баланса' },
  { key: 'bp', text: 'Возможен рост артериального давления' },
  { key: 'prolactin', text: 'Возможен рост пролактина (нандролоны, тренболон)' },
  { key: 'mental', text: 'Возможны перепады настроения, агрессия, бессонница' },
];

const AddEditCourseScreen = () => {
  const route = useRoute();
  const editingCourse = (route.params as any)?.course;

  const [step, setStep] = useState(0);
  const [courseType, setCourseType] = useState<string | null>(editingCourse?.type ?? null);
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>(editingCourse?.compounds?.map?.((c: any) => c.key) ?? []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userWeight, setUserWeight] = useState(editingCourse?.userWeight ?? '');
  const [customDoses, setCustomDoses] = useState<Record<string, string>>(editingCourse?.doses ?? {});
  const [schedule, setSchedule] = useState<Record<string, { days: string[]; time: string; timesPerDay: number }>>(editingCourse?.schedule ?? {});
  const [pctList, setPctList] = useState<Array<{ key: string; label: string; dose: string; duration: string; unit: string; durationUnit: string; custom?: boolean }>>(editingCourse?.pct ?? []);
  const [showAddPct, setShowAddPct] = useState(false);
  const [newPct, setNewPct] = useState<{ label: string; dose: string; duration: string }>({ label: '', dose: '', duration: '' });
  const [safetyAgree, setSafetyAgree] = useState(editingCourse ? true : false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [saving, setSaving] = useState(false);
  const [courseDurationWeeks, setCourseDurationWeeks] = useState(editingCourse?.durationWeeks ?? 8);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null);
  const [pickerTime, setPickerTime] = useState<string>('08:00');
  const [showExitModal, setShowExitModal] = useState(false);
  const isEditing = !!editingCourse;
  const [compoundConcentrations, setCompoundConcentrations] = useState<{ [key: string]: string }>({});
  const [compoundVialVolumes, setCompoundVialVolumes] = useState<{ [key: string]: string }>({});

  // Помечаем форму как изменённую при любом изменении
  React.useEffect(() => {
    if (step > 0) setIsDirty(true);
  }, [courseType, selectedCompounds, customDoses, schedule, pctList, courseDurationWeeks, userWeight]);

  // Подтверждение при выходе без сохранения
  React.useEffect(() => {
    const beforeRemove = (e: any) => {
      if (!isEditing || !isDirty) return;
      e.preventDefault();
      setShowExitModal(true);
    };
    navigation.addListener('beforeRemove', beforeRemove);
    return () => navigation.removeListener('beforeRemove', beforeRemove);
  }, [isDirty, navigation, isEditing]);

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const filteredCompounds = COMPOUNDS.filter(comp => {
    const matchesCategory = !selectedCategory || comp.category === selectedCategory;
    const matchesSearch = !searchQuery || comp.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToxicityColor = (tox: number) => {
    switch (tox) {
      case 1: return colors.green;
      case 2: return colors.orange;
      case 3: return colors.error;
      default: return colors.gray;
    }
  };

  const getToxicityText = (tox: number) => {
    switch (tox) {
      case 1: return 'Безопасный';
      case 2: return 'Умеренный';
      case 3: return 'Осторожно';
      default: return 'Неизвестно';
    }
  };

  // Автопредложение ПКТ на основе выбранных препаратов
  useEffect(() => {
    if (step === 4 && pctList.length === 0) {
      const hasToxic = selectedCompounds.some(key => {
        const c = COMPOUNDS.find(c => c.key === key);
        return c && c.tox >= 2;
      });
      const hasInject = selectedCompounds.some(key => {
        const c = COMPOUNDS.find(c => c.key === key);
        return c && c.form.includes('Инъекция');
      });
      if (hasToxic || hasInject) {
        setPctList(PCT_SUGGESTIONS.map(s => ({ ...s, dose: s.defaultDose, duration: s.defaultDuration })));
      }
    }
  }, [step]);

  function getWarningsForCourse() {
    const warnings: string[] = [];
    const hasOral = selectedCompounds.some(key => {
      const c = COMPOUNDS.find(c => c.key === key);
      return c && c.form.includes('Таблет');
    });
    const hasToxic = selectedCompounds.some(key => {
      const c = COMPOUNDS.find(c => c.key === key);
      return c && c.tox >= 2;
    });
    const hasEstrogen = selectedCompounds.some(key => {
      const c = COMPOUNDS.find(c => c.key === key);
      return c && (c.features.toLowerCase().includes('эстроген') || c.features.toLowerCase().includes('гинекомастия'));
    });
    const hasProlactin = selectedCompounds.some(key => {
      const c = COMPOUNDS.find(c => c.key === key);
      return c && (c.features.toLowerCase().includes('пролактин'));
    });
    if (hasOral || hasToxic) warnings.push('liver');
    if (hasEstrogen) warnings.push('estrogen');
    warnings.push('blood');
    warnings.push('pct');
    if (hasToxic) warnings.push('bp');
    if (hasProlactin) warnings.push('prolactin');
    warnings.push('mental');
    return SAFETY_WARNINGS.filter(w => warnings.includes(w.key));
  }

  const handleTimeChange = (key: string) => (date: Date) => {
    setActiveTimePicker(null);
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setSchedule(s => ({
        ...s,
        [key]: { ...s[key], time: `${hours}:${minutes}` }
      }));
    }
  };

  async function handleSaveCourse() {
    if (!courseType || selectedCompounds.length === 0 || !safetyAgree) return;
    setSaving(true);
    try {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      if (!user_id) throw new Error('Не удалось получить пользователя');
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + courseDurationWeeks * 7);
      const compoundsToSave = selectedCompounds.map(key => {
        const comp = COMPOUNDS.find(c => c.key === key);
        if (!comp) return null;
        const isInjection = comp.form.includes('Инъекция');
        return {
          ...comp,
          dose: customDoses[key] || '',
          ...(isInjection ? { concentration: compoundConcentrations[key] || '', vialVolume: compoundVialVolumes[key] || '' } : {}),
        };
      }).filter(Boolean);
      const course = {
        user_id,
        name: COURSE_TYPES.find(t => t.key === courseType)?.label + ' — ' + new Date().toLocaleDateString(),
        type: courseType,
        compounds: JSON.stringify(compoundsToSave),
        doses: JSON.stringify(customDoses),
        schedule: JSON.stringify(schedule),
        pct: JSON.stringify(pctList),
        createdAt: startDate.toISOString(),
        status: 'Активный',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationWeeks: courseDurationWeeks,
      };
      const { error } = await addCourse(course);
      if (error) throw error;
      
      const newAchievements = await checkAndGrantActionAchievements(user_id);
      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(ach =>
          Toast.show({
            type: 'success',
            text1: `Новое достижение!`,
            text2: `${ach.icon} ${ach.name}`,
            visibilityTime: 4000,
          })
        );
      }
      navigation.navigate('Main', { screen: 'Courses' } as any);
    } catch (e: any) {
      alert('Ошибка при сохранении курса: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.accentSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый курс</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step + 1} из {steps.length}</Text>
      </View>

      {/* Steps Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsContainer} contentContainerStyle={{ height: 40, alignItems: 'center' }}>
        {steps.map((s, idx) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.stepChip, idx === step && styles.stepChipActive]}
            onPress={() => setStep(idx)}
          >
            <Ionicons 
              name={s.icon as any} 
              size={14} 
              color={idx === step ? colors.accent : colors.gray} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.stepChipText, idx === step && styles.stepChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Выберите тип курса</Text>
            <View style={styles.typeGrid}>
              {COURSE_TYPES.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    courseType === type.key && [styles.typeCardActive, { borderColor: type.color }]
                  ]}
                  onPress={() => setCourseType(type.key)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                    <Ionicons 
                      name={type.icon as any} 
                      size={24} 
                      color={type.color} 
                    />
                  </View>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDesc}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.durationSection}>
              <Text style={styles.sectionTitle}>Длительность курса</Text>
              <View style={styles.durationGrid}>
                {[4,6,8,10,12].map(w => (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setCourseDurationWeeks(w)}
                    style={[
                      styles.durationBtn,
                      courseDurationWeeks === w && styles.durationBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.durationBtnText,
                      courseDurationWeeks === w && styles.durationBtnTextActive
                    ]}>
                      {w} нед
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Выберите препараты</Text>
            
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Поиск препарата..."
                placeholderTextColor={colors.gray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              <TouchableOpacity
                style={[styles.categoryBtn, !selectedCategory && styles.categoryBtnActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryBtnText, !selectedCategory && styles.categoryBtnTextActive]}>
                  Все
                </Text>
              </TouchableOpacity>
              {COMPOUND_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryBtn,
                    selectedCategory === cat.key && [styles.categoryBtnActive, { backgroundColor: cat.color + '20', borderColor: cat.color }]
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={14} 
                    color={selectedCategory === cat.key ? cat.color : colors.gray} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.categoryBtnText,
                    selectedCategory === cat.key && { color: cat.color }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selected compounds - compact */}
            {selectedCompounds.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>Выбрано: {selectedCompounds.length}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectedList}>
                    {selectedCompounds.map(key => {
                      const comp = COMPOUNDS.find(c => c.key === key);
                      const categoryInfo = COMPOUND_CATEGORIES.find(c => c.key === comp?.category);
                      return comp ? (
                        <View key={key} style={[styles.selectedChip, { borderColor: categoryInfo?.color || colors.gray }]}>
                          <Text style={styles.selectedChipText}>{comp.label}</Text>
                          <TouchableOpacity 
                            onPress={() => setSelectedCompounds(selectedCompounds.filter(k => k !== key))}
                            style={styles.selectedChipRemove}
                          >
                            <Ionicons name="close" size={12} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ) : null;
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Compounds list */}
            <View style={styles.compoundsList}>
              {filteredCompounds.map(comp => {
                const isSelected = selectedCompounds.includes(comp.key);
                const categoryInfo = COMPOUND_CATEGORIES.find(c => c.key === comp.category);
                
                return (
                  <TouchableOpacity
                    key={comp.key}
                    style={[
                      styles.compoundItem,
                      isSelected && [styles.compoundItemActive, { borderColor: categoryInfo?.color || colors.gray }]
                    ]}
                    onPress={() => {
                      setSelectedCompounds(isSelected
                        ? selectedCompounds.filter(k => k !== comp.key)
                        : [...selectedCompounds, comp.key]);
                    }}
                  >
                    <View style={styles.compoundHeader}>
                      <View style={styles.compoundTitleRow}>
                        <View style={[styles.compoundDot, { backgroundColor: categoryInfo?.color || colors.gray }]} />
                        <Text style={[styles.compoundName, isSelected && styles.compoundNameActive]}>
                          {comp.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={categoryInfo?.color || colors.green} />
                        )}
                      </View>
                      
                      <View style={styles.compoundMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons 
                            name={comp.form.includes('Инъекция') ? 'medical-outline' : 'tablet-portrait-outline'} 
                            size={12} 
                            color={colors.gray} 
                          />
                          <Text style={styles.metaText}>{comp.form}</Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={12} color={colors.gray} />
                          <Text style={styles.metaText}>T½: {comp.tHalf}</Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <View style={[styles.toxDot, { backgroundColor: getToxicityColor(comp.tox) }]} />
                          <Text style={[styles.metaText, { color: getToxicityColor(comp.tox) }]}>
                            {getToxicityText(comp.tox)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={styles.compoundDesc} numberOfLines={2}>
                      {comp.features}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={styles.stepTitle}>Дозировка препаратов</Text>
            
            <View style={styles.weightSection}>
              <Text style={styles.sectionTitle}>Ваш вес (опционально)</Text>
              <View style={styles.weightInput}>
                <Ionicons name="body-outline" size={20} color={colors.gray} />
                <TextInput
                  style={styles.weightField}
                  placeholder="75"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                  value={userWeight}
                  onChangeText={setUserWeight}
                  maxLength={3}
                />
                <Text style={styles.weightUnit}>кг</Text>
              </View>
            </View>

            <View style={styles.dosesSection}>
              <Text style={styles.sectionTitle}>Дозировки</Text>
              {selectedCompounds.map(key => {
                const comp = COMPOUNDS.find(c => c.key === key);
                if (!comp) return null;
                const custom = customDoses[key] || '';
                const categoryInfo = COMPOUND_CATEGORIES.find(c => c.key === comp.category);
                const isInjection = comp.form.includes('Инъекция');
                const isTablet = comp.form.includes('Таблет');
                
                return (
                  <View key={key} style={styles.doseItem}>
                    <View style={styles.doseHeader}>
                      <View style={[styles.compoundDot, { backgroundColor: categoryInfo?.color || colors.gray }]} />
                      <Text style={styles.doseName}>{comp.label}</Text>
                    </View>
                    
                    <View style={styles.doseInputContainer}>
                      {/* Основное поле дозы */}
                      <View style={styles.doseInputRow}>
                      <TextInput
                        style={styles.doseField}
                          placeholder={isInjection ? 'Доза на одну инъекцию' : 'Доза'}
                        placeholderTextColor={colors.gray}
                        keyboardType="numeric"
                        value={custom}
                        onChangeText={val => setCustomDoses({ ...customDoses, [key]: val })}
                        maxLength={4}
                      />
                        <Text style={styles.doseUnit}>
                          {isInjection ? 'мл' : 'мг'}
                        </Text>
                    </View>
                      
                      {/* Описание для основного поля */}
                      {isInjection && (
                        <Text style={styles.fieldDescription}>
                          Сколько мл вы будете вводить за одну инъекцию (например, 1 мл = 250 мг, 0.5 мл = 125 мг и т.д.)
                        </Text>
                      )}
                      {isTablet && (
                        <Text style={styles.fieldDescription}>
                        Сколько мг действующего вещества в одной таблетке (смотрите на упаковке, например, 10 мг)
                      </Text>
                    )}

                      {/* Дополнительные поля только для инъекций */}
                      {isInjection && (
                        <>
                          <View style={styles.doseInputRow}>
                            <TextInput
                              style={styles.doseField}
                              placeholder="Концентрация (мг/мл)"
                              placeholderTextColor={colors.gray}
                              keyboardType="numeric"
                              value={compoundConcentrations[key] || ''}
                              onChangeText={val => setCompoundConcentrations({ ...compoundConcentrations, [key]: val })}
                              maxLength={5}
                            />
                            <Text style={styles.doseUnit}>мг/мл</Text>
                          </View>
                          <Text style={styles.fieldDescription}>
                            Сколько мг действующего вещества содержится в 1 мл раствора (смотрите на упаковке, например, 250 мг/мл)
                          </Text>

                          <View style={styles.doseInputRow}>
                            <TextInput
                              style={styles.doseField}
                              placeholder="Объём флакона (мл)"
                              placeholderTextColor={colors.gray}
                              keyboardType="numeric"
                              value={compoundVialVolumes[key] || ''}
                              onChangeText={val => setCompoundVialVolumes({ ...compoundVialVolumes, [key]: val })}
                              maxLength={5}
                            />
                            <Text style={styles.doseUnit}>мл</Text>
                          </View>
                          <Text style={styles.fieldDescription}>
                            Общий объём флакона или ампулы (например, 10 мл). Для справки, не влияет на расчёт дозы.
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Расписание приёма</Text>
            {selectedCompounds.map(key => {
              const comp = COMPOUNDS.find(c => c.key === key);
              if (!comp) return null;
              const value = schedule[key] || { days: [], time: '', timesPerDay: 1 };
              const days = Array.isArray(value.days) ? value.days : [];
              const timesPerDay = Number.isFinite(value.timesPerDay) && value.timesPerDay > 0 ? value.timesPerDay : 1;
              const setValue = (v: Partial<typeof value>) => setSchedule(s => ({
                ...s,
                [key]: {
                  ...value,
                  ...v,
                  timesPerDay: Math.max(1, Number(v.timesPerDay ?? value.timesPerDay ?? 1)),
                }
              }));
              const categoryInfo = COMPOUND_CATEGORIES.find(c => c.key === comp.category);
              return (
                <View key={key} style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <View style={[styles.compoundDot, { backgroundColor: categoryInfo?.color || colors.gray }]} />
                    <Text style={styles.scheduleName}>{comp.label}</Text>
                  </View>
                  <Text style={styles.scheduleSubtitle}>Дни недели</Text>
                  <View style={styles.daysGrid}>
                    {DAYS.map(day => (
                      <TouchableOpacity
                        key={day.key}
                        style={[
                          styles.dayBtn,
                          days.includes(day.key) && styles.dayBtnActive
                        ]}
                        onPress={() => {
                          setValue({
                            days: days.includes(day.key)
                              ? days.filter(d => d !== day.key)
                              : [...days, day.key],
                          });
                        }}
                      >
                        <Text style={[
                          styles.dayBtnText,
                          days.includes(day.key) && styles.dayBtnTextActive
                        ]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.timeSection}>
                    <View style={styles.timeInput}>
                      <Text style={styles.scheduleSubtitle}>Время</Text>
                      <TouchableOpacity
                        style={styles.timeFieldTouchable}
                        onPress={() => {
                          if (Platform.OS === 'web') return;
                          setPickerTime(value.time || '08:00');
                          setActiveTimePicker(key);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.timeFieldRow}>
                          <Ionicons name="time-outline" size={18} color={colors.gray} style={{ marginRight: 6 }} />
                          <TextInput
                            style={styles.timeField}
                            placeholder="08:00"
                            placeholderTextColor={colors.gray}
                            value={value.time}
                            onChangeText={t => setValue({ time: t })}
                            maxLength={5}
                            editable={Platform.OS === 'web'}
                            pointerEvents={Platform.OS === 'web' ? 'auto' : 'none'}
                          />
                        </View>
                      </TouchableOpacity>
                      {activeTimePicker === key && (
                        <DateTimePickerModal
                          isVisible={true}
                          mode="time"
                          date={value.time ? new Date(0,0,0,parseInt(value.time.split(':')[0]||'8'),parseInt(value.time.split(':')[1]||'0')) : new Date(0,0,0,8,0)}
                          onConfirm={date => handleTimeChange(key)(date)}
                          onCancel={() => setActiveTimePicker(null)}
                          isDarkModeEnabled={true}
                          textColor={colors.accentSecondary}
                        />
                      )}
                    </View>
                    <View style={styles.frequencyInputCompact}>
                      <Text style={styles.scheduleSubtitle}>Раз в день</Text>
                      <View style={styles.frequencyControlsCompact}>
                        <TouchableOpacity
                          onPress={() => setValue({ timesPerDay: Math.max(1, Number(timesPerDay) - 1) })}
                          style={styles.frequencyBtn}
                        >
                          <Ionicons name="remove" size={16} color={colors.gray} />
                        </TouchableOpacity>
                        <Text style={styles.frequencyText}>{timesPerDay}</Text>
                        <TouchableOpacity
                          onPress={() => setValue({ timesPerDay: Math.max(1, Number(timesPerDay) + 1) })}
                          style={styles.frequencyBtn}
                        >
                          <Ionicons name="add" size={16} color={colors.gray} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>ПКТ (Послекурсовая терапия)</Text>
            
            {pctList.map((pct, idx) => (
              <View key={pct.key + idx} style={styles.pctItem}>
                <View style={styles.pctHeader}>
                  <Text style={styles.pctName}>{pct.label}</Text>
                  <TouchableOpacity onPress={() => setPctList(pctList.filter((_, i) => i !== idx))}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pctInputs}>
                  <View style={styles.pctInputGroup}>
                    <Text style={styles.pctInputLabel}>Доза</Text>
                    <TextInput
                      style={styles.pctField}
                      placeholder="50"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={pct.dose}
                      onChangeText={val => setPctList(pctList.map((p, i) => i === idx ? { ...p, dose: val } : p))}
                      maxLength={5}
                    />
                    <Text style={styles.pctUnit}>{pct.unit}</Text>
                  </View>
                  <View style={styles.pctInputGroup}>
                    <Text style={styles.pctInputLabel}>Дней</Text>
                    <TextInput
                      style={styles.pctField}
                      placeholder="14"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={pct.duration}
                      onChangeText={val => setPctList(pctList.map((p, i) => i === idx ? { ...p, duration: val } : p))}
                      maxLength={3}
                    />
                    <Text style={styles.pctUnit}>{pct.durationUnit}</Text>
                  </View>
                </View>
              </View>
            ))}

            {showAddPct ? (
              <View style={styles.pctItem}>
                <TextInput
                  style={styles.pctNameField}
                  placeholder="Название препарата"
                  placeholderTextColor={colors.gray}
                  value={newPct.label}
                  onChangeText={val => setNewPct({ ...newPct, label: val })}
                />
                <View style={styles.pctInputs}>
                  <View style={styles.pctInputGroup}>
                    <Text style={styles.pctInputLabel}>Доза</Text>
                    <TextInput
                      style={styles.pctField}
                      placeholder="50"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={newPct.dose}
                      onChangeText={val => setNewPct({ ...newPct, dose: val })}
                      maxLength={5}
                    />
                    <Text style={styles.pctUnit}>мг</Text>
                  </View>
                  <View style={styles.pctInputGroup}>
                    <Text style={styles.pctInputLabel}>Дней</Text>
                    <TextInput
                      style={styles.pctField}
                      placeholder="14"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={newPct.duration}
                      onChangeText={val => setNewPct({ ...newPct, duration: val })}
                      maxLength={3}
                    />
                    <Text style={styles.pctUnit}>дней</Text>
                  </View>
                </View>
                <View style={styles.pctActions}>
                  <TouchableOpacity onPress={() => setShowAddPct(false)} style={styles.pctCancel}>
                    <Text style={styles.pctCancelText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (newPct.label && newPct.dose && newPct.duration) {
                        setPctList([...pctList, { 
                          key: newPct.label + Date.now(), 
                          label: newPct.label, 
                          dose: newPct.dose, 
                          duration: newPct.duration, 
                          unit: 'мг', 
                          durationUnit: 'дней', 
                          custom: true 
                        }]);
                        setNewPct({ label: '', dose: '', duration: '' });
                        setShowAddPct(false);
                      }
                    }}
                    style={styles.pctAdd}
                  >
                    <Text style={styles.pctAddText}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPctBtn} onPress={() => setShowAddPct(true)}>
                <Ionicons name="add" size={20} color={colors.accent} />
                <Text style={styles.addPctText}>Добавить препарат</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Безопасность</Text>
            
            <View style={styles.warningsSection}>
              <Text style={styles.sectionTitle}>Важные предупреждения</Text>
              {getWarningsForCourse().map(w => (
                <View key={w.key} style={styles.warningItem}>
                  <Ionicons name="alert-circle" size={16} color={colors.warning} />
                  <Text style={styles.warningText}>{w.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.agreementContainer} onPress={() => setSafetyAgree(!safetyAgree)}>
              <View style={[styles.checkbox, safetyAgree && styles.checkboxActive]}>
                {safetyAgree && <Ionicons name="checkmark" size={14} color={colors.accent} />}
              </View>
              <Text style={styles.agreementText}>
                Я ознакомлен(а) с рисками и беру ответственность на себя
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.finishBtn, (!safetyAgree || saving) && styles.finishBtnDisabled]}
              disabled={!safetyAgree || saving}
              onPress={handleSaveCourse}
            >
              <Text style={styles.finishBtnText}>
                {saving ? 'Создание курса...' : 'Создать курс'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.footerBtn, styles.footerBtnSecondary, step === 0 && styles.footerBtnDisabled]} 
          onPress={() => {
            if (step === 0) {
              if (isEditing && isDirty) {
                setShowExitModal(true);
              } else {
                navigation.navigate('Main');
              }
            } else {
              prevStep();
            }
          }}
          disabled={step === 0}
        >
          <Text style={[styles.footerBtnText, styles.footerBtnTextSecondary]}>Назад</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerBtn, step === steps.length - 1 && styles.footerBtnDisabled]} 
          onPress={nextStep} 
          disabled={step === steps.length - 1}
        >
          <Text style={styles.footerBtnText}>
            {step === steps.length - 1 ? 'Готово' : 'Далее'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модалка выхода без сохранения */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000A', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 28, width: 320, maxWidth: '90%' }}>
            <Text style={{ color: colors.accentSecondary, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Выйти без сохранения?</Text>
            <Text style={{ color: colors.gray, fontSize: 15, marginBottom: 24 }}>Все несохранённые изменения будут потеряны.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
              <TouchableOpacity onPress={() => setShowExitModal(false)}>
                <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600', marginRight: 12 }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setShowExitModal(false);
                navigation.navigate('Main', { screen: 'Courses' } as any);
              }}>
                <Text style={{ color: colors.error, fontSize: 16, fontWeight: '600' }}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    backgroundColor: colors.card,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.accentSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  stepsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    height: 40,
    maxHeight: 40,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  stepChip: {
    backgroundColor: colors.section,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.grayLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  stepChipActive: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
  },
  stepChipText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  stepChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    color: colors.accentSecondary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 8,
  },
  
  // Step 0 - Type selection
  typeGrid: {
    gap: 12,
    marginBottom: 32,
  },
  typeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  typeCardActive: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.cardSecondary,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    color: colors.accentSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeDesc: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  durationSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.accentSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  durationBtnActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  durationBtnText: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  durationBtnTextActive: {
    color: colors.accent,
  },
  
  // Step 1 - Compounds
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  searchInput: {
    flex: 1,
    color: colors.accentSecondary,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryBtn: {
    backgroundColor: colors.section,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.grayLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  categoryBtnText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBtnTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  selectedContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  selectedTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.section,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 6,
  },
  selectedChipText: {
    color: colors.accentSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  selectedChipRemove: {
    padding: 2,
  },
  compoundsList: {
    gap: 8,
  },
  compoundItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 8,
  },
  compoundItemActive: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.cardSecondary,
  },
  compoundHeader: {
    marginBottom: 8,
  },
  compoundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  compoundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compoundName: {
    flex: 1,
    color: colors.accentSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  compoundNameActive: {
    color: colors.accent,
  },
  compoundMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.gray,
    fontSize: 11,
  },
  toxDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  compoundDesc: {
    color: colors.gray,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Step 2 - Dosage
  weightSection: {
    marginBottom: 24,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  weightField: {
    flex: 1,
    color: colors.accentSecondary,
    fontSize: 16,
  },
  weightUnit: {
    color: colors.gray,
    fontSize: 14,
  },
  dosesSection: {
    gap: 12,
  },
  doseItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 8,
  },
  doseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  doseName: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  doseInputContainer: {
    gap: 0,
  },
  doseInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  doseField: {
    flex: 1,
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.accentSecondary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginRight: 8,
  },
  doseUnit: {
    color: colors.gray,
    fontSize: 14,
    minWidth: 45,
    textAlign: 'left',
  },
  fieldDescription: {
    color: colors.gray,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
    marginTop: 2,
  },
  
  // Step 3 - Schedule
  scheduleItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  scheduleName: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleSubtitle: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dayBtn: {
    flex: 1,
    backgroundColor: colors.section,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayBtnActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  dayBtnText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  dayBtnTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeField: {
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.accentSecondary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.grayLight,
    flex: 1,
  },
  timeFieldTouchable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyInput: {
    flex: 1,
  },
  frequencyInputCompact: {
    width: 110,
    alignItems: 'flex-end',
  },
  frequencyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  frequencyControlsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
    width: 90,
    justifyContent: 'space-between',
  },
  frequencyBtn: {
    padding: 8,
  },
  frequencyText: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Step 4 - PCT
  pctItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 12,
  },
  pctHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pctName: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  pctInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  pctInputGroup: {
    flex: 1,
  },
  pctInputLabel: {
    color: colors.gray,
    fontSize: 12,
    marginBottom: 6,
  },
  pctField: {
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.accentSecondary,
    fontSize: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  pctUnit: {
    color: colors.gray,
    fontSize: 12,
  },
  pctNameField: {
    backgroundColor: colors.section,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.accentSecondary,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  pctActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  pctCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pctCancelText: {
    color: colors.gray,
    fontSize: 14,
  },
  pctAdd: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pctAddText: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  addPctBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.section,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  addPctText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Step 5 - Safety
  warningsSection: {
    marginBottom: 24,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  warningText: {
    flex: 1,
    color: colors.accentSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.section,
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  agreementText: {
    flex: 1,
    color: colors.accentSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  finishBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishBtnDisabled: {
    backgroundColor: colors.grayLight,
  },
  finishBtnText: {
    color: colors.accentSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    gap: 12,
    backgroundColor: colors.card,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  footerBtnDisabled: {
    backgroundColor: colors.grayLight,
    borderColor: colors.grayLight,
  },
  footerBtnText: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerBtnTextSecondary: {
    color: colors.accent,
  },
});

export default AddEditCourseScreen;