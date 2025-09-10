import { LocalStorageService } from './localStorage';
import { AnalyticsEvent, AppUsage } from './types';

export class AnalyticsService {
  private static events: AnalyticsEvent[] = [];
  private static sessionId: string = '';
  private static sessionStartTime: number = 0;

  // Инициализация аналитики
  static async initialize(): Promise<void> {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // Загружаем сохраненные события
    await this.loadEvents();
    
    // Отправляем событие запуска приложения
    await this.trackEvent('app_launched', {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  }

  // Отслеживание события
  static async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
      };

      this.events.push(analyticsEvent);
      
      // Сохраняем события каждые 10 событий или при критических событиях
      if (this.events.length >= 10 || this.isCriticalEvent(event)) {
        await this.saveEvents();
      }
    } catch (error) {
      console.error('Ошибка отслеживания события:', error);
    }
  }

  // Отслеживание экрана
  static async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('screen_viewed', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Отслеживание действия пользователя
  static async trackUserAction(action: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }

  // Отслеживание ошибки
  static async trackError(error: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('error_occurred', {
      error,
      ...properties,
    });
  }

  // Отслеживание производительности
  static async trackPerformance(metric: string, value: number, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('performance_metric', {
      metric,
      value,
      ...properties,
    });
  }

  // Отслеживание использования функции
  static async trackFeatureUsage(feature: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('feature_used', {
      feature,
      ...properties,
    });
  }

  // Завершение сессии
  static async endSession(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    await this.trackEvent('session_ended', {
      duration: sessionDuration,
      events_count: this.events.length,
    });

    // Сохраняем все события
    await this.saveEvents();
  }

  // Получение статистики использования
  static async getUsageStatistics(): Promise<AppUsage> {
    const events = await this.getEvents();
    const sessions = this.getSessions(events);
    
    const features: Record<string, number> = {};
    events.forEach(event => {
      if (event.event === 'feature_used' && event.properties?.feature) {
        features[event.properties.feature] = (features[event.properties.feature] || 0) + 1;
      }
    });

    const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const lastUsed = events.length > 0 ? events[events.length - 1].timestamp : new Date().toISOString();

    return {
      sessions: sessions.length,
      totalTime: Math.round(totalTime / 1000 / 60), // в минутах
      lastUsed,
      features,
    };
  }

  // Получение всех событий
  static async getEvents(): Promise<AnalyticsEvent[]> {
    return [...this.events];
  }

  // Получение событий за период
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<AnalyticsEvent[]> {
    const events = await this.getEvents();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Получение событий по типу
  static async getEventsByType(eventType: string): Promise<AnalyticsEvent[]> {
    const events = await this.getEvents();
    return events.filter(event => event.event === eventType);
  }

  // Получение статистики экранов
  static async getScreenStatistics(): Promise<Record<string, number>> {
    const events = await this.getEventsByType('screen_viewed');
    const screenStats: Record<string, number> = {};
    
    events.forEach(event => {
      const screenName = event.properties?.screen_name;
      if (screenName) {
        screenStats[screenName] = (screenStats[screenName] || 0) + 1;
      }
    });

    return screenStats;
  }

  // Получение статистики функций
  static async getFeatureStatistics(): Promise<Record<string, number>> {
    const events = await this.getEventsByType('feature_used');
    const featureStats: Record<string, number> = {};
    
    events.forEach(event => {
      const feature = event.properties?.feature;
      if (feature) {
        featureStats[feature] = (featureStats[feature] || 0) + 1;
      }
    });

    return featureStats;
  }

  // Получение статистики ошибок
  static async getErrorStatistics(): Promise<Array<{ error: string; count: number; lastOccurred: string }>> {
    const events = await this.getEventsByType('error_occurred');
    const errorStats: Record<string, { count: number; lastOccurred: string }> = {};
    
    events.forEach(event => {
      const error = event.properties?.error;
      if (error) {
        if (!errorStats[error]) {
          errorStats[error] = { count: 0, lastOccurred: event.timestamp };
        }
        errorStats[error].count++;
        if (new Date(event.timestamp) > new Date(errorStats[error].lastOccurred)) {
          errorStats[error].lastOccurred = event.timestamp;
        }
      }
    });

    return Object.entries(errorStats).map(([error, stats]) => ({
      error,
      count: stats.count,
      lastOccurred: stats.lastOccurred,
    }));
  }

  // Экспорт аналитических данных
  static async exportAnalytics(): Promise<any> {
    const events = await this.getEvents();
    const usageStats = await this.getUsageStatistics();
    const screenStats = await this.getScreenStatistics();
    const featureStats = await this.getFeatureStatistics();
    const errorStats = await this.getErrorStatistics();

    return {
      exportDate: new Date().toISOString(),
      sessionId: this.sessionId,
      totalEvents: events.length,
      usage: usageStats,
      screens: screenStats,
      features: featureStats,
      errors: errorStats,
      events: events.slice(-1000), // Последние 1000 событий
    };
  }

  // Очистка старых данных
  static async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const events = await this.getEvents();
    const filteredEvents = events.filter(event => new Date(event.timestamp) >= cutoffDate);
    
    this.events = filteredEvents;
    await this.saveEvents();
  }

  // Приватные методы

  private static async loadEvents(): Promise<void> {
    try {
      const events = await LocalStorageService.getStatistics();
      this.events = events.analytics_events || [];
    } catch (error) {
      console.error('Ошибка загрузки событий аналитики:', error);
      this.events = [];
    }
  }

  private static async saveEvents(): Promise<void> {
    try {
      const stats = await LocalStorageService.getStatistics();
      stats.analytics_events = this.events;
      await LocalStorageService.saveStatistics(stats);
    } catch (error) {
      console.error('Ошибка сохранения событий аналитики:', error);
    }
  }

  private static generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private static isCriticalEvent(event: string): boolean {
    const criticalEvents = [
      'app_launched',
      'app_crashed',
      'error_occurred',
      'user_registered',
      'course_created',
      'achievement_unlocked',
    ];
    return criticalEvents.includes(event);
  }

  private static getSessions(events: AnalyticsEvent[]): Array<{ start: string; end: string; duration: number }> {
    const sessions: Array<{ start: string; end: string; duration: number }> = [];
    const sessionMap: Record<string, { start: string; end: string }> = {};

    events.forEach(event => {
      const sessionId = event.sessionId;
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = { start: event.timestamp, end: event.timestamp };
      } else {
        if (new Date(event.timestamp) < new Date(sessionMap[sessionId].start)) {
          sessionMap[sessionId].start = event.timestamp;
        }
        if (new Date(event.timestamp) > new Date(sessionMap[sessionId].end)) {
          sessionMap[sessionId].end = event.timestamp;
        }
      }
    });

    Object.values(sessionMap).forEach(session => {
      const duration = new Date(session.end).getTime() - new Date(session.start).getTime();
      sessions.push({
        start: session.start,
        end: session.end,
        duration,
      });
    });

    return sessions;
  }
}