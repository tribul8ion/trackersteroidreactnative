import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addAction } from '../services/actions';
import { getUser } from '../services/auth';
import { colors } from '../theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Portal, Dialog, Button } from 'react-native-paper';

const LogNoteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, courseName } = route.params as { courseId: string; courseName?: string };
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [noteType, setNoteType] = useState<'general' | 'side_effect' | 'progress' | 'mood'>('general');

  const noteTypes = [
    { key: 'general', label: 'Общая', icon: 'sticky-note', color: colors.accent },
    { key: 'side_effect', label: 'Побочки', icon: 'exclamation-triangle', color: colors.error },
    { key: 'progress', label: 'Прогресс', icon: 'chart-line', color: colors.success },
    { key: 'mood', label: 'Настроение', icon: 'smile', color: colors.warning },
  ];

  const handleLog = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      const { data } = await getUser();
      const user_id = data?.user?.id;
      await addAction({
        user_id: String(user_id),
        course_id: courseId,
        type: 'note',
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ 
          note: note.trim(), 
          type: noteType,
          characterCount: note.trim().length 
        }),
      });
      setShowSuccessModal(true);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  const getNoteTypeIcon = (type: string) => {
    const typeData = noteTypes.find(t => t.key === type);
    return typeData?.icon || 'sticky-note';
  };

  const getNoteTypeColor = (type: string) => {
    const typeData = noteTypes.find(t => t.key === type);
    return typeData?.color || colors.accent;
  };

  const getTemplatesForType = (type: string) => {
    const templates = {
      general: [
        'Сегодня чувствую себя хорошо',
        'Отличная тренировка',
        'Заметил улучшения в силе',
        'Планирую изменить дозировку'
      ],
      side_effect: [
        'Легкая тошнота после инъекции',
        'Покраснение в месте укола',
        'Головная боль',
        'Проблемы со сном'
      ],
      progress: [
        'Прибавил 2 кг за неделю',
        'Увеличил рабочие веса',
        'Улучшилась выносливость',
        'Заметен рост мышц'
      ],
      mood: [
        'Отличное настроение',
        'Чувствую мотивацию',
        'Агрессивность в норме',
        'Стабильное эмоциональное состояние'
      ]
    };
    return templates[type as keyof typeof templates] || templates.general;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Добавить заметку</Text>
          <Text style={styles.headerSubtitle}>
            {courseName || 'Курс'} — {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <FontAwesome5 
            name={getNoteTypeIcon(noteType)} 
            size={20} 
            color={getNoteTypeColor(noteType)} 
          />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Note Type Selection */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Тип заметки</Text>
          <View style={styles.typeContainer}>
            {noteTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  noteType === type.key && styles.typeButtonActive,
                  { borderColor: type.color }
                ]}
                onPress={() => setNoteType(type.key as any)}
              >
                <FontAwesome5 
                  name={type.icon} 
                  size={16} 
                  color={noteType === type.key ? '#FFF' : type.color} 
                />
                <Text style={[
                  styles.typeButtonText,
                  noteType === type.key && styles.typeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Note Input */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Текст заметки</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`Введите ${noteTypes.find(t => t.key === noteType)?.label.toLowerCase()} заметку...`}
              placeholderTextColor={colors.gray}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.characterCount}>
                {note.length}/1000 символов
              </Text>
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setNote('')}
                  disabled={!note}
                >
                  <FontAwesome5 name="times" size={14} color={note ? colors.gray : colors.gray + '50'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Templates */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрые шаблоны</Text>
          <View style={styles.templatesContainer}>
            {getTemplatesForType(noteType).map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateButton}
                onPress={() => setNote(template)}
              >
                <Text style={styles.templateText}>{template}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Button */}
      <Animated.View entering={FadeInUp.delay(1000)} style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !note.trim() && styles.saveButtonDisabled
          ]}
          onPress={handleLog}
          disabled={!note.trim() || loading}
        >
          <FontAwesome5
            name={loading ? "sync-alt" : "save"}
            size={20}
            color="#000"
          />
          <Text style={styles.saveButtonText}>
            {loading ? 'Сохраняю...' : 'Сохранить заметку'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Modal */}
      <Portal>
        <Dialog 
          visible={showSuccessModal} 
          onDismiss={() => {
            setShowSuccessModal(false);
            navigation.goBack();
          }} 
          style={styles.successModal}
        >
          <Dialog.Title style={styles.successModalTitle}>
            Заметка сохранена!
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.successContent}>
              <FontAwesome5 
                name="check-circle" 
                size={48} 
                color={colors.success} 
              />
              <Text style={styles.successText}>
                Ваша {noteTypes.find(t => t.key === noteType)?.label.toLowerCase()} заметка успешно добавлена
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.successModalActions}>
            <Button 
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }} 
              textColor={colors.accent}
              labelStyle={styles.successButtonLabel}
            >
              Отлично!
            </Button>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  typeButtonActive: {
    backgroundColor: colors.accent,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray,
    marginLeft: 6,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  inputContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    fontSize: 16,
    color: colors.white,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  characterCount: {
    fontSize: 12,
    color: colors.gray,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesContainer: {
    gap: 8,
  },
  templateButton: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateText: {
    fontSize: 14,
    color: colors.gray,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray + '50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  successModal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    margin: 20,
  },
  successModalTitle: {
    color: colors.accent,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 0,
    marginTop: 8,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  successModalActions: {
    justifyContent: 'center',
    paddingBottom: 12,
  },
  successButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogNoteScreen; 