import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Linking, Platform, ActivityIndicator, Modal, TextInput, Clipboard, ToastAndroid, Pressable, ScrollView, Image, StatusBar, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Constants from 'expo-constants';
import { getUser, signOut } from '../services/auth';
import { getProfile, Profile } from '../services/profile';
import { useContext } from 'react';
import { colors } from '../theme/colors';
import { supabase } from '../services/supabase';
import { sendFeedback } from '../services/feedback';
import { getCourses } from '../services/courses';
import { getActions } from '../services/actions';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Portal, Dialog, Button } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Шапка в стиле дашборда
  header: {
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    position: 'relative',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  // Профиль карточка
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  editButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  // Статистика
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
  },
  // Настройки
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  settingsItemDanger: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  settingsTextDanger: {
    color: colors.error,
  },
  settingsValue: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 8,
  },
  // Кнопки действий
  actionButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  actionButtonPrimary: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent + '30',
  },
  actionButtonSecondary: {
    backgroundColor: colors.purple + '15',
    borderColor: colors.purple + '30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  actionButtonTextPrimary: {
    color: colors.accent,
  },
  actionButtonTextSecondary: {
    color: colors.purple,
  },
  // Модальные окна
  modalOverlay: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: 320,
    minWidth: 260,
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.background,
    color: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight + '20',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonConfirm: {
    backgroundColor: colors.accent,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: colors.gray,
  },
  modalButtonTextConfirm: {
    color: colors.background,
  },
  // Донат модалка
  donateCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    width: 320,
    alignItems: 'center',
  },
  donateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  donateText: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    width: '100%',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  copyButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: colors.gray,
    fontSize: 15,
  },
});

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [biometry, setBiometry] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Модальные окна
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [stats, setStats] = useState({ courses: 0, injections: 0 });
  const cardNumber = '2200 7006 1377 4644';

  // Анимации
  const headerAnimation = useSharedValue(0);

  useEffect(() => {
    headerAnimation.value = withTiming(1, { duration: 800 });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userData } = await getUser();
        const user_id = userData?.user?.id;
        if (!user_id) throw new Error('Не удалось получить пользователя');
        const { data: profileData, error: profileError } = await getProfile(user_id);
        if (profileError) throw profileError;
        setProfile(profileData);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки профиля');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: userData } = await getUser();
        const user_id = userData?.user?.id;
        if (!user_id) return;
        const { data: coursesData } = await getCourses(user_id);
        const { data: actionsData } = await getActions(user_id);
        setStats({
          courses: coursesData ? coursesData.length : 0,
          injections: actionsData ? actionsData.filter((a: any) => a.type === 'injection').length : 0,
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Выйти из аккаунта?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => {
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Сбросить все настройки?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: () => {/* TODO: reset settings */} },
    ]);
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !currentPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    setLoadingModal(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile?.email || '', password: currentPassword });
    if (signInError) {
      setLoadingModal(false);
      Alert.alert('Ошибка', 'Неверный текущий пароль');
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoadingModal(false);
    if (error) {
      Alert.alert('Ошибка', error.message || 'Не удалось сменить email');
    } else {
      Alert.alert('Успех', 'Email обновлён. Проверьте почту для подтверждения.');
      setShowEmailModal(false);
      setNewEmail('');
      setCurrentPassword('');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    setLoadingModal(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile?.email || '', password: currentPassword });
    if (signInError) {
      setLoadingModal(false);
      Alert.alert('Ошибка', 'Неверный текущий пароль');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingModal(false);
    if (error) {
      Alert.alert('Ошибка', error.message || 'Не удалось сменить пароль');
    } else {
      Alert.alert('Успех', 'Пароль обновлён!');
      setShowPasswordModal(false);
      setNewPassword('');
      setCurrentPassword('');
    }
  };

  const handleCopyCard = () => {
    if (Platform.OS === 'android') {
      Clipboard.setString(cardNumber);
      ToastAndroid.show('Номер карты скопирован', ToastAndroid.SHORT);
    } else {
      Clipboard.setString(cardNumber);
      Alert.alert('Скопировано', 'Номер карты скопирован в буфер обмена');
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Пустое сообщение', 'Пожалуйста, напишите пожелание или опишите баг.');
      return;
    }
    setFeedbackSent(true);
    try {
      const { data: userData } = await getUser();
      const user_id = userData?.user?.id || null;
      const { error } = await sendFeedback(user_id, feedbackText.trim());
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось отправить отзыв');
      setFeedbackSent(false);
      return;
    }
    setTimeout(() => {
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackSent(false);
    }, 1200);
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnimation.value,
    transform: [{ translateY: (1 - headerAnimation.value) * -20 }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.error, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); setError(null); }} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Шапка */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Настройки</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Профиль */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 76, height: 76, borderRadius: 38 }} />
              ) : (
                <FontAwesome5 name="user-circle" size={76} color={colors.accent} />
              )}
            </View>
            <Text style={styles.profileName}>{profile?.full_name || profile?.username || 'Пользователь'}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => profile && navigation.navigate('EditProfile', { profile })}
            >
              <FontAwesome5 name="edit" size={16} color={colors.accent} />
              <Text style={styles.editButtonText}>Редактировать профиль</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Статистика */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.courses}</Text>
              <Text style={styles.statLabel}>Курсов</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.injections}</Text>
              <Text style={styles.statLabel}>Инъекций</Text>
            </View>
          </View>
        </Animated.View>

        {/* Аккаунт */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowEmailModal(true)}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.blue + '20' }]}>
              <FontAwesome5 name="envelope" size={18} color={colors.blue} />
            </View>
            <Text style={styles.settingsText}>Сменить email</Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setShowPasswordModal(true)}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.warning + '20' }]}>
              <FontAwesome5 name="key" size={18} color={colors.warning} />
            </View>
            <Text style={styles.settingsText}>Сменить пароль</Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, styles.settingsItemDanger]} onPress={handleLogout}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.error + '20' }]}>
              <FontAwesome5 name="sign-out-alt" size={18} color={colors.error} />
            </View>
            <Text style={[styles.settingsText, styles.settingsTextDanger]}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Безопасность */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Безопасность</Text>
          
          <View style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.purple + '20' }]}>
              <FontAwesome5 name="fingerprint" size={18} color={colors.purple} />
            </View>
            <Text style={styles.settingsText}>Биометрия</Text>
            <Switch 
              value={biometry} 
              onValueChange={setBiometry} 
              thumbColor={biometry ? colors.accent : colors.gray} 
              trackColor={{ true: colors.accent + '40', false: colors.grayLight }} 
            />
          </View>
        </Animated.View>

        {/* Уведомления */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          
          <View style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.orange + '20' }]}>
              <FontAwesome5 name="bell" size={18} color={colors.orange} />
            </View>
            <Text style={styles.settingsText}>Push-уведомления</Text>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications} 
              thumbColor={notifications ? colors.accent : colors.gray} 
              trackColor={{ true: colors.accent + '40', false: colors.grayLight }} 
            />
          </View>
        </Animated.View>

        {/* О приложении */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          
          <View style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.cyan + '20' }]}>
              <FontAwesome5 name="info-circle" size={18} color={colors.cyan} />
            </View>
            <Text style={styles.settingsText}>Версия</Text>
            <Text style={styles.settingsValue}>{Constants.manifest?.version || '1.0.0'}</Text>
          </View>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://your-privacy-policy-url.com')}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.success + '20' }]}>
              <FontAwesome5 name="shield-alt" size={18} color={colors.success} />
            </View>
            <Text style={styles.settingsText}>Политика конфиденциальности</Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('mailto:support@example.com')}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.warning + '20' }]}>
              <FontAwesome5 name="question-circle" size={18} color={colors.warning} />
            </View>
            <Text style={styles.settingsText}>Помощь и поддержка</Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/app/idYOUR_APP_ID' : 'https://play.google.com/store/apps/details?id=YOUR_APP_ID')}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.accent + '20' }]}>
              <FontAwesome5 name="star" size={18} color={colors.accent} />
            </View>
            <Text style={styles.settingsText}>Оценить приложение</Text>
            <FontAwesome5 name="chevron-right" size={16} color={colors.gray} />
          </TouchableOpacity>
        </Animated.View>

        {/* Поддержка проекта */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.section}>
          <Text style={styles.sectionTitle}>Поддержка проекта</Text>
          
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => setShowDonateModal(true)}>
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>💝 Поддержать проект</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={() => setShowFeedbackModal(true)}>
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>🚀 Сделайте нас лучше</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Сброс настроек */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.section}>
          <TouchableOpacity style={styles.settingsItem} onPress={handleReset}>
            <View style={[styles.settingsIcon, { backgroundColor: colors.gray + '20' }]}>
              <FontAwesome5 name="sync-alt" size={18} color={colors.gray} />
            </View>
            <Text style={[styles.settingsText, { color: colors.gray }]}>Сбросить все настройки</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Модальные окна остаются теми же, но с обновленными стилями */}
      
      {/* Модальное окно смены email */}
      <Portal>
        <Dialog visible={showEmailModal} onDismiss={() => { setShowEmailModal(false); setNewEmail(''); setCurrentPassword(''); }} style={{ backgroundColor: colors.card, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.accent, textAlign: 'center', fontSize: 20, marginBottom: 0 }}>Сменить email</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.modalInput}
              placeholder="Новый email"
              placeholderTextColor={colors.gray}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Текущий пароль"
              placeholderTextColor={colors.gray}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
            <Button onPress={() => { setShowEmailModal(false); setNewEmail(''); setCurrentPassword(''); }} textColor={colors.gray}>Отмена</Button>
            <Button onPress={handleChangeEmail} textColor={colors.accent} loading={loadingModal} disabled={loadingModal}>Сохранить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Модальное окно смены пароля */}
      <Portal>
        <Dialog visible={showPasswordModal} onDismiss={() => { setShowPasswordModal(false); setNewPassword(''); setCurrentPassword(''); }} style={{ backgroundColor: colors.card, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.accent, textAlign: 'center', fontSize: 20, marginBottom: 0 }}>Сменить пароль</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.modalInput}
              placeholder="Новый пароль"
              placeholderTextColor={colors.gray}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Текущий пароль"
              placeholderTextColor={colors.gray}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
            <Button onPress={() => { setShowPasswordModal(false); setNewPassword(''); setCurrentPassword(''); }} textColor={colors.gray}>Отмена</Button>
            <Button onPress={handleChangePassword} textColor={colors.accent} loading={loadingModal} disabled={loadingModal}>Сохранить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Модалка доната */}
      <Portal>
        <Dialog visible={showDonateModal} onDismiss={() => setShowDonateModal(false)} style={{ backgroundColor: colors.card, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.accent, textAlign: 'center', fontSize: 20, marginBottom: 0 }}>Спасибо за поддержку! 💝</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.donateText}>
              Если хочешь поддержать разработку, переведи любую сумму на карту:
            </Text>
            <TouchableOpacity onPress={handleCopyCard} activeOpacity={0.7} style={{ width: '100%' }}>
              <Text style={[styles.cardNumber, { borderWidth: 1, borderColor: colors.accent + '30', backgroundColor: colors.background + 'CC', marginBottom: 8 }]}>{cardNumber}</Text>
            </TouchableOpacity>
            <Button onPress={handleCopyCard} textColor={colors.accent} style={{ marginTop: 4 }}>Скопировать номер</Button>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', paddingBottom: 8 }}>
            <Button onPress={() => setShowDonateModal(false)} textColor={colors.gray}>Закрыть</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Модалка обратной связи */}
      <Portal>
        <Dialog visible={showFeedbackModal} onDismiss={() => setShowFeedbackModal(false)} style={{ backgroundColor: colors.card, borderRadius: 20 }}>
          <Dialog.Title style={{ color: colors.purple, textAlign: 'center', fontSize: 20, marginBottom: 0 }}>Ваше пожелание или баг</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={[styles.modalInput, { minHeight: 100, textAlignVertical: 'top', fontSize: 16, borderWidth: 1.5, borderColor: colors.purple + '40' }]}
              placeholder="Опишите, что можно улучшить или какой баг вы нашли..."
              placeholderTextColor={colors.gray}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={5}
              editable={!feedbackSent}
            />
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
            <Button onPress={() => setShowFeedbackModal(false)} textColor={colors.gray}>Отмена</Button>
            <Button onPress={handleSendFeedback} textColor={colors.purple} disabled={feedbackSent}>{feedbackSent ? 'Спасибо!' : 'Отправить'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default SettingsScreen;