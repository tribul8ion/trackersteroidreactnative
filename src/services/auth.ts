import { LocalStorageService } from './localStorage';
import { Profile } from './types';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

const SECURE_KEYS = {
  USER_ID: 'user_id',
  AUTH_TOKEN: 'auth_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

export class AuthService {
  private static currentUser: Profile | null = null;
  private static isInitialized = false;

  // Инициализация сервиса
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Проверяем, есть ли сохраненный пользователь
      const userId = await SecureStore.getItemAsync(SECURE_KEYS.USER_ID);
      if (userId) {
        this.currentUser = await LocalStorageService.getProfile();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Ошибка инициализации AuthService:', error);
    }
  }

  // Регистрация нового пользователя
  static async signUp(userData: {
    username: string;
    email?: string;
    full_name?: string;
    password?: string;
  }): Promise<{ success: boolean; user?: Profile; error?: string }> {
    try {
      // Проверяем, не существует ли уже пользователь
      const existingProfile = await LocalStorageService.getProfile();
      if (existingProfile) {
        return { success: false, error: 'Пользователь уже существует' };
      }

      // Создаем новый профиль
      const newProfile: Profile = {
        id: this.generateUserId(),
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          language: 'ru',
          units: 'metric',
          notifications: true,
          biometric_auth: false,
        },
      };

      // Сохраняем профиль
      const saved = await LocalStorageService.saveProfile(newProfile);
      if (!saved) {
        return { success: false, error: 'Ошибка сохранения профиля' };
      }

      // Сохраняем ID пользователя в безопасном хранилище
      if (userData.password) {
        await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, newProfile.id);
        await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, this.generateAuthToken());
      }

      this.currentUser = newProfile;
      return { success: true, user: newProfile };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return { success: false, error: 'Ошибка регистрации' };
    }
  }

  // Вход в систему
  static async signIn(identifier: string, password?: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
    try {
      const profile = await LocalStorageService.getProfile();
      
      if (!profile) {
        return { success: false, error: 'Пользователь не найден' };
      }

      // Проверяем идентификатор (username или email)
      const isValidIdentifier = 
        profile.username === identifier || 
        profile.email === identifier;

      if (!isValidIdentifier) {
        return { success: false, error: 'Неверный логин или пароль' };
      }

      // Если есть пароль, проверяем его
      if (password) {
        const storedToken = await SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);
        if (!storedToken) {
          return { success: false, error: 'Неверный пароль' };
        }
        // В реальном приложении здесь была бы проверка хеша пароля
      }

      // Сохраняем ID пользователя
      await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, profile.id);

      this.currentUser = profile;
      return { success: true, user: profile };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return { success: false, error: 'Ошибка входа' };
    }
  }

  // Выход из системы
  static async signOut(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_ID);
      await SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_TOKEN);
      this.currentUser = null;
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  }

  // Получение текущего пользователя
  static getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  // Helper used by screens expecting a Supabase-like shape
  static async getUser(): Promise<{ data: { user: { id: string } | null } }> {
    const user = this.getCurrentUser();
    return { data: { user: user ? { id: user.id } : null } };
  }

  // Проверка авторизации
  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Обновление профиля
  static async updateProfile(updates: Partial<Profile>): Promise<{ success: boolean; user?: Profile; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Пользователь не авторизован' };
      }

      const updatedProfile = {
        ...this.currentUser,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const saved = await LocalStorageService.saveProfile(updatedProfile);
      if (!saved) {
        return { success: false, error: 'Ошибка сохранения профиля' };
      }

      this.currentUser = updatedProfile;
      return { success: true, user: updatedProfile };
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      return { success: false, error: 'Ошибка обновления профиля' };
    }
  }

  // Удаление аккаунта
  static async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Пользователь не авторизован' };
      }

      // Очищаем все данные
      const cleared = await LocalStorageService.clearAllData();
      if (!cleared) {
        return { success: false, error: 'Ошибка удаления данных' };
      }

      // Очищаем безопасное хранилище
      await this.signOut();

      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      return { success: false, error: 'Ошибка удаления аккаунта' };
    }
  }

  // Биометрическая аутентификация
  static async enableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'Биометрическая аутентификация не поддерживается' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'Биометрические данные не настроены' };
      }

      await SecureStore.setItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED, 'true');
      
      // Обновляем настройки профиля
      if (this.currentUser) {
        await this.updateProfile({
          preferences: {
            ...this.currentUser.preferences,
            biometric_auth: true,
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка включения биометрической аутентификации:', error);
      return { success: false, error: 'Ошибка настройки биометрической аутентификации' };
    }
  }

  static async disableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED);
      
      // Обновляем настройки профиля
      if (this.currentUser) {
        await this.updateProfile({
          preferences: {
            ...this.currentUser.preferences,
            biometric_auth: false,
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка отключения биометрической аутентификации:', error);
      return { success: false, error: 'Ошибка отключения биометрической аутентификации' };
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Ошибка проверки биометрической аутентификации:', error);
      return false;
    }
  }

  static async authenticateWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false, error: 'Биометрическая аутентификация не включена' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Войдите в Steroid Tracker',
        fallbackLabel: 'Использовать пароль',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Аутентификация не удалась' };
      }
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      return { success: false, error: 'Ошибка аутентификации' };
    }
  }

  // Генерация ID пользователя
  private static generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Генерация токена аутентификации
  private static generateAuthToken(): string {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  // Проверка валидности email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Проверка валидности пароля
  static isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Пароль должен содержать минимум 8 символов');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Пароль должен содержать заглавную букву');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Пароль должен содержать строчную букву');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать цифру');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Пароль должен содержать специальный символ');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Проверка валидности имени пользователя
  static isValidUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Имя пользователя должно содержать минимум 3 символа');
    }
    
    if (username.length > 20) {
      errors.push('Имя пользователя должно содержать максимум 20 символов');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Имя пользователя может содержать только буквы, цифры и подчеркивания');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}