import { BackupService } from '../../services/backup';
import { LocalStorageService } from '../../services/localStorage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Экспорт данных', () => {
    test('должна экспортировать все данные', async () => {
      const mockData = {
        user: { id: 'user1', name: 'Test User' },
        courses: [{ id: '1', name: 'Test Course' }],
        actions: [{ id: '1', type: 'injection' }],
        labs: [{ id: '1', name: 'Testosterone', value: 800 }],
        achievements: [{ id: '1', name: 'First Step' }]
      };

      (LocalStorageService.getItem as jest.Mock).mockImplementation((key) => {
        const dataMap = {
          'user_data': mockData.user,
          'courses': mockData.courses,
          'actions': mockData.actions,
          'labs': mockData.labs,
          'achievements': mockData.achievements
        };
        return Promise.resolve(dataMap[key] || null);
      });

      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, uri: 'file://test/backup.json' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await BackupService.exportData();
      expect(result.success).toBe(true);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    test('должна создать файл с правильным именем', async () => {
      const mockData = {
        user: { id: 'user1', name: 'Test User' },
        courses: [],
        actions: [],
        labs: [],
        achievements: []
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockData);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, uri: 'file://test/backup.json' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await BackupService.exportData();
      
      const writeCall = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      const fileName = writeCall[0];
      
      expect(fileName).toMatch(/steroid_tracker_backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json/);
    });

    test('должна включить метаданные в экспорт', async () => {
      const mockData = {
        user: { id: 'user1', name: 'Test User' },
        courses: [],
        actions: [],
        labs: [],
        achievements: []
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockData);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, uri: 'file://test/backup.json' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await BackupService.exportData();
      
      const writeCall = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      const exportedData = JSON.parse(writeCall[1]);
      
      expect(exportedData.metadata).toBeDefined();
      expect(exportedData.metadata.version).toBeDefined();
      expect(exportedData.metadata.exportDate).toBeDefined();
      expect(exportedData.metadata.deviceInfo).toBeDefined();
    });

    test('должна обработать ошибку при экспорте', async () => {
      (LocalStorageService.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await BackupService.exportData();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('Импорт данных', () => {
    test('должна импортировать валидные данные', async () => {
      const mockBackupData = {
        metadata: {
          version: '1.0.0',
          exportDate: '2024-01-01T10:00:00Z',
          deviceInfo: { platform: 'ios', version: '1.0.0' }
        },
        data: {
          user: { id: 'user1', name: 'Test User' },
          courses: [{ id: '1', name: 'Test Course' }],
          actions: [{ id: '1', type: 'injection' }],
          labs: [{ id: '1', name: 'Testosterone', value: 800 }],
          achievements: [{ id: '1', name: 'First Step' }]
        }
      };

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await BackupService.importData('file://test/backup.json');
      expect(result.success).toBe(true);
      expect(LocalStorageService.setItem).toHaveBeenCalledTimes(5);
    });

    test('должна отклонить импорт невалидных данных', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('invalid json');

      const result = await BackupService.importData('file://test/invalid.json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('должна отклонить импорт данных с неверной версией', async () => {
      const mockBackupData = {
        metadata: {
          version: '2.0.0', // Неподдерживаемая версия
          exportDate: '2024-01-01T10:00:00Z'
        },
        data: {
          user: { id: 'user1', name: 'Test User' },
          courses: [],
          actions: [],
          labs: [],
          achievements: []
        }
      };

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));

      const result = await BackupService.importData('file://test/backup.json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported version');
    });

    test('должна создать резервную копию перед импортом', async () => {
      const mockBackupData = {
        metadata: {
          version: '1.0.0',
          exportDate: '2024-01-01T10:00:00Z'
        },
        data: {
          user: { id: 'user1', name: 'Test User' },
          courses: [],
          actions: [],
          labs: [],
          achievements: []
        }
      };

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockBackupData));
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue({});
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await BackupService.importData('file://test/backup.json');
      
      // Проверяем, что была создана резервная копия
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    test('должна обработать ошибку при чтении файла', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValue(new Error('File read error'));

      const result = await BackupService.importData('file://test/nonexistent.json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('File read error');
    });
  });

  describe('Валидация данных', () => {
    test('должна валидировать структуру данных', async () => {
      const validData = {
        metadata: {
          version: '1.0.0',
          exportDate: '2024-01-01T10:00:00Z'
        },
        data: {
          user: { id: 'user1', name: 'Test User' },
          courses: [],
          actions: [],
          labs: [],
          achievements: []
        }
      };

      const isValid = BackupService.validateBackupData(validData);
      expect(isValid).toBe(true);
    });

    test('должна отклонить данные без метаданных', async () => {
      const invalidData = {
        data: {
          user: { id: 'user1', name: 'Test User' }
        }
      };

      const isValid = BackupService.validateBackupData(invalidData);
      expect(isValid).toBe(false);
    });

    test('должна отклонить данные без основного контента', async () => {
      const invalidData = {
        metadata: {
          version: '1.0.0',
          exportDate: '2024-01-01T10:00:00Z'
        }
      };

      const isValid = BackupService.validateBackupData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('Сжатие данных', () => {
    test('должна сжать большие данные', async () => {
      const largeData = {
        user: { id: 'user1', name: 'Test User' },
        courses: Array.from({ length: 1000 }, (_, i) => ({ id: `course_${i}`, name: `Course ${i}` })),
        actions: Array.from({ length: 1000 }, (_, i) => ({ id: `action_${i}`, type: 'injection' })),
        labs: [],
        achievements: []
      };

      (LocalStorageService.getItem as jest.Mock).mockImplementation((key) => {
        const dataMap = {
          'user_data': largeData.user,
          'courses': largeData.courses,
          'actions': largeData.actions,
          'labs': largeData.labs,
          'achievements': largeData.achievements
        };
        return Promise.resolve(dataMap[key] || null);
      });

      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, uri: 'file://test/backup.json' });
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await BackupService.exportData();
      expect(result.success).toBe(true);
      
      const writeCall = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
      const exportedData = JSON.parse(writeCall[1]);
      
      expect(exportedData.data.courses).toHaveLength(1000);
      expect(exportedData.data.actions).toHaveLength(1000);
    });
  });
});