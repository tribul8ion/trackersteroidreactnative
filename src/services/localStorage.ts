import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, Lab, Action, Reminder, Profile, Achievement, UserAchievement } from './types';

// Ключи для хранения данных
const STORAGE_KEYS = {
  PROFILE: 'profile',
  COURSES: 'courses',
  LABS: 'labs',
  ACTIONS: 'actions',
  REMINDERS: 'reminders',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  SETTINGS: 'settings',
  STATISTICS: 'statistics',
  APP_VERSION: 'app_version',
  FIRST_LAUNCH: 'first_launch',
  LAST_SYNC: 'last_sync',
} as const;

// Версия данных для миграций
const DATA_VERSION = '2.0.0';

export class LocalStorageService {
  // Инициализация хранилища
  static async initialize(): Promise<void> {
    try {
      const appVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (!appVersion) {
        // Первый запуск
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, DATA_VERSION);
        await this.createDefaultData();
      } else if (appVersion !== DATA_VERSION) {
        // Миграция данных
        await this.migrateData(appVersion, DATA_VERSION);
      }
    } catch (error) {
      console.error('Ошибка инициализации хранилища:', error);
    }
  }

  // Создание данных по умолчанию
  private static async createDefaultData(): Promise<void> {
    const defaultSettings = {
      theme: 'dark',
      notifications: true,
      biometricAuth: false,
      autoBackup: true,
      language: 'ru',
      units: 'metric',
    };

    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }

  // Миграция данных между версиями
  private static async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Миграция данных с версии ${fromVersion} на ${toVersion}`);
    // Здесь можно добавить логику миграции при необходимости
    await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, toVersion);
  }

  // Профиль
  static async getProfile(): Promise<Profile | null> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      return null;
    }
  }

  static async saveProfile(profile: Profile): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      return false;
    }
  }

  // Курсы
  static async getCourses(): Promise<Course[]> {
    try {
      const courses = await AsyncStorage.getItem(STORAGE_KEYS.COURSES);
      return courses ? JSON.parse(courses) : [];
    } catch (error) {
      console.error('Ошибка получения курсов:', error);
      return [];
    }
  }

  static async saveCourses(courses: Course[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения курсов:', error);
      return false;
    }
  }

  static async addCourse(course: Course): Promise<boolean> {
    try {
      const courses = await this.getCourses();
      courses.push(course);
      return await this.saveCourses(courses);
    } catch (error) {
      console.error('Ошибка добавления курса:', error);
      return false;
    }
  }

  static async updateCourse(courseId: string, updates: Partial<Course>): Promise<boolean> {
    try {
      const courses = await this.getCourses();
      const index = courses.findIndex(c => c.id === courseId);
      if (index !== -1) {
        courses[index] = { ...courses[index], ...updates };
        return await this.saveCourses(courses);
      }
      return false;
    } catch (error) {
      console.error('Ошибка обновления курса:', error);
      return false;
    }
  }

  static async deleteCourse(courseId: string): Promise<boolean> {
    try {
      const courses = await this.getCourses();
      const filteredCourses = courses.filter(c => c.id !== courseId);
      return await this.saveCourses(filteredCourses);
    } catch (error) {
      console.error('Ошибка удаления курса:', error);
      return false;
    }
  }

  // Анализы
  static async getLabs(): Promise<Lab[]> {
    try {
      const labs = await AsyncStorage.getItem(STORAGE_KEYS.LABS);
      return labs ? JSON.parse(labs) : [];
    } catch (error) {
      console.error('Ошибка получения анализов:', error);
      return [];
    }
  }

  static async saveLabs(labs: Lab[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(labs));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения анализов:', error);
      return false;
    }
  }

  static async addLab(lab: Lab): Promise<boolean> {
    try {
      const labs = await this.getLabs();
      labs.push(lab);
      return await this.saveLabs(labs);
    } catch (error) {
      console.error('Ошибка добавления анализа:', error);
      return false;
    }
  }

  // Действия
  static async getActions(): Promise<Action[]> {
    try {
      const actions = await AsyncStorage.getItem(STORAGE_KEYS.ACTIONS);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Ошибка получения действий:', error);
      return [];
    }
  }

  static async saveActions(actions: Action[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения действий:', error);
      return false;
    }
  }

  static async addAction(action: Action): Promise<boolean> {
    try {
      const actions = await this.getActions();
      actions.push(action);
      return await this.saveActions(actions);
    } catch (error) {
      console.error('Ошибка добавления действия:', error);
      return false;
    }
  }

  // Напоминания
  static async getReminders(): Promise<Reminder[]> {
    try {
      const reminders = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('Ошибка получения напоминаний:', error);
      return [];
    }
  }

  static async saveReminders(reminders: Reminder[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения напоминаний:', error);
      return false;
    }
  }

  // Достижения
  static async getUserAchievements(): Promise<UserAchievement[]> {
    try {
      const achievements = await AsyncStorage.getItem(STORAGE_KEYS.USER_ACHIEVEMENTS);
      return achievements ? JSON.parse(achievements) : [];
    } catch (error) {
      console.error('Ошибка получения достижений:', error);
      return [];
    }
  }

  static async saveUserAchievements(achievements: UserAchievement[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ACHIEVEMENTS, JSON.stringify(achievements));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения достижений:', error);
      return false;
    }
  }

  static async addUserAchievement(achievement: UserAchievement): Promise<boolean> {
    try {
      const achievements = await this.getUserAchievements();
      achievements.push(achievement);
      return await this.saveUserAchievements(achievements);
    } catch (error) {
      console.error('Ошибка добавления достижения:', error);
      return false;
    }
  }

  // Настройки
  static async getSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Ошибка получения настроек:', error);
      return {};
    }
  }

  static async saveSettings(settings: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      return false;
    }
  }

  // Статистика
  static async getStatistics(): Promise<any> {
    try {
      const stats = await AsyncStorage.getItem(STORAGE_KEYS.STATISTICS);
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {};
    }
  }

  static async saveStatistics(stats: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения статистики:', error);
      return false;
    }
  }

  // Экспорт всех данных
  static async exportAllData(): Promise<any> {
    try {
      const [profile, courses, labs, actions, reminders, achievements, settings, statistics] = await Promise.all([
        this.getProfile(),
        this.getCourses(),
        this.getLabs(),
        this.getActions(),
        this.getReminders(),
        this.getUserAchievements(),
        this.getSettings(),
        this.getStatistics(),
      ]);

      return {
        version: DATA_VERSION,
        exportDate: new Date().toISOString(),
        data: {
          profile,
          courses,
          labs,
          actions,
          reminders,
          achievements,
          settings,
          statistics,
        },
      };
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      return null;
    }
  }

  // Импорт данных
  static async importData(data: any): Promise<boolean> {
    try {
      if (!data || !data.data) return false;

      const { profile, courses, labs, actions, reminders, achievements, settings, statistics } = data.data;

      await Promise.all([
        profile && this.saveProfile(profile),
        courses && this.saveCourses(courses),
        labs && this.saveLabs(labs),
        actions && this.saveActions(actions),
        reminders && this.saveReminders(reminders),
        achievements && this.saveUserAchievements(achievements),
        settings && this.saveSettings(settings),
        statistics && this.saveStatistics(statistics),
      ]);

      return true;
    } catch (error) {
      console.error('Ошибка импорта данных:', error);
      return false;
    }
  }

  // Очистка всех данных
  static async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      await this.createDefaultData();
      return true;
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
      return false;
    }
  }

  // Получение размера хранилища
  static async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      return data.reduce((size, [key, value]) => size + (value?.length || 0), 0);
    } catch (error) {
      console.error('Ошибка получения размера хранилища:', error);
      return 0;
    }
  }

  // Проверка первого запуска
  static async isFirstLaunch(): Promise<boolean> {
    try {
      const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      return firstLaunch === 'true';
    } catch (error) {
      console.error('Ошибка проверки первого запуска:', error);
      return false;
    }
  }

  // Отметка о завершении первого запуска
  static async markFirstLaunchComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
    } catch (error) {
      console.error('Ошибка отметки первого запуска:', error);
    }
  }
}