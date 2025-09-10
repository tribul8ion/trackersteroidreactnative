import { LocalStorageService } from './localStorage';
import { ExportData, BackupInfo } from './types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export class BackupService {
  // Создание резервной копии
  static async createBackup(): Promise<{ success: boolean; backup?: BackupInfo; error?: string }> {
    try {
      const exportData = await LocalStorageService.exportAllData();
      if (!exportData) {
        return { success: false, error: 'Ошибка экспорта данных' };
      }

      const backupInfo: BackupInfo = {
        id: this.generateBackupId(),
        name: `Backup_${new Date().toISOString().split('T')[0]}`,
        size: JSON.stringify(exportData).length,
        created_at: new Date().toISOString(),
        type: 'manual',
        version: exportData.version,
      };

      // Сохраняем информацию о резервной копии
      const backups = await this.getBackups();
      backups.push(backupInfo);
      await this.saveBackups(backups);

      // Сохраняем данные резервной копии
      const fileName = `steroid_tracker_backup_${backupInfo.id}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      return { success: true, backup: backupInfo };
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error);
      return { success: false, error: 'Ошибка создания резервной копии' };
    }
  }

  // Восстановление из резервной копии
  static async restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileName = `steroid_tracker_backup_${backupId}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return { success: false, error: 'Файл резервной копии не найден' };
      }

      const backupData = await FileSystem.readAsStringAsync(fileUri);
      const exportData = JSON.parse(backupData);

      const success = await LocalStorageService.importData(exportData);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Ошибка импорта данных' };
      }
    } catch (error) {
      console.error('Ошибка восстановления резервной копии:', error);
      return { success: false, error: 'Ошибка восстановления резервной копии' };
    }
  }

  // Получение списка резервных копий
  static async getBackups(): Promise<BackupInfo[]> {
    try {
      const stats = await LocalStorageService.getStatistics();
      return stats.backups || [];
    } catch (error) {
      console.error('Ошибка получения резервных копий:', error);
      return [];
    }
  }

  // Удаление резервной копии
  static async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Удаляем файл
      const fileName = `steroid_tracker_backup_${backupId}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }

      // Удаляем из списка
      const backups = await this.getBackups();
      const filteredBackups = backups.filter(backup => backup.id !== backupId);
      await this.saveBackups(filteredBackups);

      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления резервной копии:', error);
      return { success: false, error: 'Ошибка удаления резервной копии' };
    }
  }

  // Экспорт данных в файл
  static async exportToFile(): Promise<{ success: boolean; fileUri?: string; error?: string }> {
    try {
      const exportData = await LocalStorageService.exportAllData();
      if (!exportData) {
        return { success: false, error: 'Ошибка экспорта данных' };
      }

      const fileName = `steroid_tracker_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      // Проверяем, можно ли поделиться файлом
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      }

      return { success: true, fileUri };
    } catch (error) {
      console.error('Ошибка экспорта в файл:', error);
      return { success: false, error: 'Ошибка экспорта в файл' };
    }
  }

  // Импорт данных из файла
  static async importFromFile(fileUri: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return { success: false, error: 'Файл не найден' };
      }

      const fileData = await FileSystem.readAsStringAsync(fileUri);
      const importData = JSON.parse(fileData);

      // Валидация данных
      const validation = this.validateImportData(importData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const success = await LocalStorageService.importData(importData);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Ошибка импорта данных' };
      }
    } catch (error) {
      console.error('Ошибка импорта из файла:', error);
      return { success: false, error: 'Ошибка импорта из файла' };
    }
  }

  // Автоматическое создание резервной копии
  static async createAutoBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      const settings = await LocalStorageService.getSettings();
      if (!settings.auto_backup) {
        return { success: true }; // Автобэкап отключен
      }

      const backup = await this.createBackup();
      if (backup.success && backup.backup) {
        // Обновляем тип на автоматический
        const backups = await this.getBackups();
        const updatedBackups = backups.map(b => 
          b.id === backup.backup!.id ? { ...b, type: 'auto' as const } : b
        );
        await this.saveBackups(updatedBackups);
      }

      return backup;
    } catch (error) {
      console.error('Ошибка автоматического резервного копирования:', error);
      return { success: false, error: 'Ошибка автоматического резервного копирования' };
    }
  }

  // Очистка старых резервных копий
  static async cleanupOldBackups(daysToKeep: number = 30): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const backups = await this.getBackups();
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      const validBackups: BackupInfo[] = [];

      for (const backup of backups) {
        const backupDate = new Date(backup.created_at);
        if (backupDate < cutoffDate) {
          // Удаляем файл
          const fileName = `steroid_tracker_backup_${backup.id}.json`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(fileUri);
          }
          
          deletedCount++;
        } else {
          validBackups.push(backup);
        }
      }

      await this.saveBackups(validBackups);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Ошибка очистки старых резервных копий:', error);
      return { success: false, deletedCount: 0, error: 'Ошибка очистки старых резервных копий' };
    }
  }

  // Получение размера всех резервных копий
  static async getBackupsSize(): Promise<number> {
    try {
      const backups = await this.getBackups();
      let totalSize = 0;

      for (const backup of backups) {
        const fileName = `steroid_tracker_backup_${backup.id}.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Ошибка получения размера резервных копий:', error);
      return 0;
    }
  }

  // Валидация импортируемых данных
  private static validateImportData(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Неверный формат файла' };
    }

    if (!data.version) {
      return { valid: false, error: 'Версия данных не указана' };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { valid: false, error: 'Данные не найдены' };
    }

    const { data: appData } = data;
    const requiredFields = ['courses', 'labs', 'actions', 'reminders', 'achievements', 'settings', 'statistics'];
    
    for (const field of requiredFields) {
      if (!(field in appData)) {
        return { valid: false, error: `Отсутствует поле: ${field}` };
      }
    }

    return { valid: true };
  }

  // Сохранение списка резервных копий
  private static async saveBackups(backups: BackupInfo[]): Promise<void> {
    try {
      const stats = await LocalStorageService.getStatistics();
      stats.backups = backups;
      await LocalStorageService.saveStatistics(stats);
    } catch (error) {
      console.error('Ошибка сохранения списка резервных копий:', error);
    }
  }

  // Генерация ID резервной копии
  private static generateBackupId(): string {
    return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Форматирование размера файла
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Получение информации о дисковом пространстве
  static async getDiskSpaceInfo(): Promise<{
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
    backupsSize: number;
  }> {
    try {
      const diskInfo = await FileSystem.getFreeDiskStorageAsync();
      const backupsSize = await this.getBackupsSize();
      
      return {
        totalSpace: 0, // Не доступно в Expo
        freeSpace: diskInfo,
        usedSpace: 0, // Не доступно в Expo
        backupsSize,
      };
    } catch (error) {
      console.error('Ошибка получения информации о дисковом пространстве:', error);
      return {
        totalSpace: 0,
        freeSpace: 0,
        usedSpace: 0,
        backupsSize: 0,
      };
    }
  }
}