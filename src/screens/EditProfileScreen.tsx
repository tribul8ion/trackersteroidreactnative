import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import type { Profile } from '../services/types';
import { AuthService } from '../services/auth';
import Animated, { 
  FadeIn, 
  SlideInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { AchievementsService } from '../services/achievements';
import { colors } from '../theme/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

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
    flexDirection: 'row',
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    backgroundColor: colors.card + 'CC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  // Аватар секция
  avatarSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarEditText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  // Форма
  formSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.grayLight + '10',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight + '20',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  // Селектор пола
  genderSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grayLight + '20',
  },
  genderOptionActive: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  genderText: {
    color: colors.gray,
    fontWeight: '600',
    fontSize: 14,
  },
  genderTextActive: {
    color: colors.accent,
  },
  // Кнопка сохранения
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: colors.grayLight,
  },
});

export default function EditProfileScreen({ route, navigation }: { route: any, navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { profile } = route.params as { profile: Profile };
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '');
  const [city, setCity] = useState(profile.city || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Анимации
  const headerAnimation = useSharedValue(0);

  useEffect(() => {
    headerAnimation.value = withTiming(1, { duration: 800 });
  }, []);

  useEffect(() => {
    if (!username) {
      setUsernameError(null);
      return;
    }
    // Валидация длины и символов (оффлайн)
    if (username.length < 3 || username.length > 20) {
      setUsernameError('От 3 до 20 символов');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Только латиница, цифры и _');
      return;
    }
    // Оффлайн: пропускаем проверку уникальности среди других пользователей
    setUsernameError(null);
    setCheckingUsername(false);
  }, [username]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatarUrl(asset.uri);
    }
  };

  const uploadAvatar = async (uri: string, userId: string) => {
    // Оффлайн: сохраняем локальный URI (без загрузки)
    return uri;
  };

  const handleSave = async () => {
    if (usernameError) {
      Alert.alert('Ошибка', usernameError);
      return;
    }
    setLoading(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (avatarUrl && avatarUrl !== profile.avatar_url && !avatarUrl.startsWith('http')) {
        newAvatarUrl = await uploadAvatar(avatarUrl, profile.id);
      }
      const { success, error: updateError } = await AuthService.updateProfile({
        full_name: fullName,
        username,
        avatar_url: newAvatarUrl,
        date_of_birth: dateOfBirth,
        city,
        bio,
        gender,
      } as any);
      if (!success) throw updateError || new Error('Не удалось обновить профиль');
      // Проверка и выдача достижений (оффлайн)
      await AchievementsService.checkAndGrantAchievements();
      Alert.alert('Успех', 'Профиль обновлён!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnimation.value,
    transform: [{ translateY: (1 - headerAnimation.value) * -20 }],
  }));

  const getUsernameInputStyle = () => {
    if (checkingUsername) return styles.input;
    if (usernameError) return [styles.input, styles.inputError];
    if (username && !usernameError) return [styles.input, styles.inputSuccess];
    return styles.input;
  };

  const isFormValid = !usernameError && !checkingUsername && fullName.trim();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Шапка */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Аватар */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user" size={40} color={colors.gray} />
              </View>
            )}
            <View style={styles.avatarEditButton}>
              <FontAwesome5 name="camera" size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarEditText}>Нажмите, чтобы изменить фото</Text>
        </Animated.View>

        {/* Основная информация */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.formSection}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, { backgroundColor: colors.grayLight + '10', borderColor: 'transparent' }]}> 
              <Text style={{ color: colors.gray }}>{profile.email}</Text>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Полное имя *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Введите ваше имя"
              placeholderTextColor={colors.gray}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={getUsernameInputStyle()}
                value={username}
                onChangeText={setUsername}
                placeholder="Введите username"
                placeholderTextColor={colors.gray}
                autoCapitalize="none"
              />
              {checkingUsername && (
                <ActivityIndicator 
                  size="small" 
                  color={colors.accent} 
                  style={styles.loadingIndicator} 
                />
              )}
              {!checkingUsername && username && !usernameError && (
                <FontAwesome5 
                  name="check" 
                  size={16} 
                  color={colors.success} 
                  style={[styles.loadingIndicator, { top: 20 }]} 
                />
              )}
            </View>
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Кнопка сохранения */}
      <Animated.View entering={SlideInUp.delay(400)}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!isFormValid || loading) && styles.saveButtonDisabled
          ]} 
          onPress={handleSave} 
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              (!isFormValid || loading) && styles.saveButtonTextDisabled
            ]}>
              Сохранить изменения
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}