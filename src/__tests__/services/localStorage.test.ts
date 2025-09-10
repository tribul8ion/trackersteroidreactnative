import { LocalStorageService } from '../../services/localStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('LocalStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await LocalStorageService.initialize();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_initialized');
    });
  });

  describe('Сохранение данных', () => {
    test('должна сохранять данные', async () => {
      const key = 'test_key';
      const value = { test: 'data' };
      
      await LocalStorageService.setItem(key, value);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    test('должна сохранять строковые данные', async () => {
      const key = 'test_string';
      const value = 'test string';
      
      await LocalStorageService.setItem(key, value);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    });
  });

  describe('Получение данных', () => {
    test('должна получать данные', async () => {
      const key = 'test_key';
      const value = { test: 'data' };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(value));
      
      const result = await LocalStorageService.getItem(key);
      expect(result).toEqual(value);
    });

    test('должна возвращать null для несуществующих ключей', async () => {
      const key = 'nonexistent_key';
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await LocalStorageService.getItem(key);
      expect(result).toBeNull();
    });

    test('должна обрабатывать невалидный JSON', async () => {
      const key = 'invalid_json';
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      
      const result = await LocalStorageService.getItem(key);
      expect(result).toBeNull();
    });
  });

  describe('Удаление данных', () => {
    test('должна удалять данные', async () => {
      const key = 'test_key';
      
      await LocalStorageService.removeItem(key);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('Очистка данных', () => {
    test('должна очищать все данные', async () => {
      await LocalStorageService.clearAll();
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe('Первый запуск', () => {
    test('должна проверять первый запуск', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const isFirstLaunch = await LocalStorageService.isFirstLaunch();
      expect(isFirstLaunch).toBe(true);
    });

    test('должна отмечать первый запуск как завершенный', async () => {
      await LocalStorageService.markFirstLaunchComplete();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('first_launch_completed', 'true');
    });

    test('должна возвращать false для завершенного первого запуска', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      
      const isFirstLaunch = await LocalStorageService.isFirstLaunch();
      expect(isFirstLaunch).toBe(false);
    });
  });
});