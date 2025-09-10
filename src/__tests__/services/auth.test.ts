import { AuthService } from '../../services/auth';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await AuthService.initialize();
      expect(SecureStore.isAvailableAsync).toHaveBeenCalled();
    });
  });

  describe('Регистрация', () => {
    test('должна зарегистрировать нового пользователя', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.signUp(userData);
      expect(result.success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        expect.stringContaining('test@example.com')
      );
    });

    test('должна отклонить регистрацию с неверными данными', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        name: ''
      };

      const result = await AuthService.signUp(userData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('должна отклонить регистрацию с существующим email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify({
        email: 'existing@example.com',
        name: 'Existing User'
      }));

      const result = await AuthService.signUp(userData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('Вход', () => {
    test('должна войти с правильными учетными данными', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password'
      }));

      const result = await AuthService.signIn(credentials);
      expect(result.success).toBe(true);
    });

    test('должна отклонить вход с неверными учетными данными', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.signIn(credentials);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('должна отклонить вход с несуществующим email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.signIn(credentials);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('Биометрическая аутентификация', () => {
    test('должна проверить доступность биометрии', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const isAvailable = await AuthService.isBiometricsAvailable();
      expect(isAvailable).toBe(true);
    });

    test('должна вернуть false если биометрия недоступна', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const isAvailable = await AuthService.isBiometricsAvailable();
      expect(isAvailable).toBe(false);
    });

    test('должна выполнить биометрическую аутентификацию', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
        error: null
      });

      const result = await AuthService.authenticateWithBiometrics();
      expect(result.success).toBe(true);
    });

    test('должна обработать ошибку биометрической аутентификации', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'UserCancel'
      });

      const result = await AuthService.authenticateWithBiometrics();
      expect(result.success).toBe(false);
      expect(result.error).toBe('UserCancel');
    });
  });

  describe('Выход', () => {
    test('должна выйти из системы', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.signOut();
      expect(result.success).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });

  describe('Проверка аутентификации', () => {
    test('должна проверить статус аутентификации', () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      }));

      const isAuthenticated = AuthService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    test('должна вернуть false для неаутентифицированного пользователя', () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const isAuthenticated = AuthService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Получение текущего пользователя', () => {
    test('должна получить данные текущего пользователя', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        id: 'user123'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(userData));

      const result = await AuthService.getCurrentUser();
      expect(result).toEqual(userData);
    });

    test('должна вернуть null для неаутентифицированного пользователя', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('Обновление пользователя', () => {
    test('должна обновить данные пользователя', async () => {
      const existingUser = {
        email: 'test@example.com',
        name: 'Test User',
        id: 'user123'
      };

      const updatedData = {
        name: 'Updated Name'
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(existingUser));
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.updateUser(updatedData);
      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Updated Name');
    });
  });
});