import { AnalyticsService } from '../../services/analytics';
import { LocalStorageService } from '../../services/localStorage';

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await AnalyticsService.initialize();
      expect(LocalStorageService.getItem).toHaveBeenCalledWith('analytics_data');
    });
  });

  describe('Отслеживание событий', () => {
    test('должна отслеживать событие', async () => {
      const event = 'button_click';
      const properties = { button_name: 'test_button', screen: 'dashboard' };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.trackEvent(event, properties);
      expect(LocalStorageService.setItem).toHaveBeenCalledWith(
        'analytics_data',
        expect.stringContaining(event)
      );
    });

    test('должна отслеживать событие без свойств', async () => {
      const event = 'screen_view';

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.trackEvent(event);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });

    test('должна добавить timestamp к событию', async () => {
      const event = 'test_event';
      const beforeTime = Date.now();

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.trackEvent(event);

      const afterTime = Date.now();
      const setItemCall = (LocalStorageService.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      const eventData = savedData[0];

      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Отслеживание экранов', () => {
    test('должна отслеживать просмотр экрана', async () => {
      const screenName = 'dashboard';
      const properties = { user_id: 'user1' };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.trackScreen(screenName, properties);
      expect(LocalStorageService.setItem).toHaveBeenCalledWith(
        'analytics_data',
        expect.stringContaining(screenName)
      );
    });

    test('должна отслеживать просмотр экрана без свойств', async () => {
      const screenName = 'settings';

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.trackScreen(screenName);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });
  });

  describe('Получение аналитических данных', () => {
    test('должна получить все аналитические данные', async () => {
      const mockAnalyticsData = [
        {
          id: '1',
          event: 'button_click',
          properties: { button_name: 'test_button' },
          timestamp: Date.now()
        },
        {
          id: '2',
          event: 'screen_view',
          properties: { screen_name: 'dashboard' },
          timestamp: Date.now()
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const data = await AnalyticsService.getAnalyticsData();
      expect(data).toEqual(mockAnalyticsData);
    });

    test('должна вернуть пустой массив если данных нет', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const data = await AnalyticsService.getAnalyticsData();
      expect(data).toEqual([]);
    });

    test('должна фильтровать данные по типу события', async () => {
      const mockAnalyticsData = [
        {
          id: '1',
          event: 'button_click',
          properties: { button_name: 'test_button' },
          timestamp: Date.now()
        },
        {
          id: '2',
          event: 'screen_view',
          properties: { screen_name: 'dashboard' },
          timestamp: Date.now()
        },
        {
          id: '3',
          event: 'button_click',
          properties: { button_name: 'another_button' },
          timestamp: Date.now()
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const buttonClickEvents = await AnalyticsService.getAnalyticsData('button_click');
      expect(buttonClickEvents).toHaveLength(2);
      expect(buttonClickEvents.every(event => event.event === 'button_click')).toBe(true);
    });

    test('должна фильтровать данные по дате', async () => {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

      const mockAnalyticsData = [
        {
          id: '1',
          event: 'button_click',
          properties: {},
          timestamp: now
        },
        {
          id: '2',
          event: 'button_click',
          properties: {},
          timestamp: oneDayAgo
        },
        {
          id: '3',
          event: 'button_click',
          properties: {},
          timestamp: twoDaysAgo
        }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const recentEvents = await AnalyticsService.getAnalyticsData(undefined, new Date(oneDayAgo));
      expect(recentEvents).toHaveLength(2);
    });
  });

  describe('Очистка данных', () => {
    test('должна очистить все аналитические данные', async () => {
      (LocalStorageService.removeItem as jest.Mock).mockResolvedValue(undefined);

      await AnalyticsService.clearAnalyticsData();
      expect(LocalStorageService.removeItem).toHaveBeenCalledWith('analytics_data');
    });
  });

  describe('Анализ данных', () => {
    test('должна проанализировать частоту событий', async () => {
      const mockAnalyticsData = [
        { event: 'button_click', timestamp: Date.now() },
        { event: 'button_click', timestamp: Date.now() },
        { event: 'screen_view', timestamp: Date.now() },
        { event: 'button_click', timestamp: Date.now() }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const data = await AnalyticsService.getAnalyticsData();
      const eventCounts = data.reduce((acc, event) => {
        acc[event.event] = (acc[event.event] || 0) + 1;
        return acc;
      }, {});

      expect(eventCounts.button_click).toBe(3);
      expect(eventCounts.screen_view).toBe(1);
    });

    test('должна проанализировать популярные экраны', async () => {
      const mockAnalyticsData = [
        { event: 'screen_view', properties: { screen_name: 'dashboard' }, timestamp: Date.now() },
        { event: 'screen_view', properties: { screen_name: 'dashboard' }, timestamp: Date.now() },
        { event: 'screen_view', properties: { screen_name: 'settings' }, timestamp: Date.now() },
        { event: 'screen_view', properties: { screen_name: 'dashboard' }, timestamp: Date.now() }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const data = await AnalyticsService.getAnalyticsData();
      const screenViews = data.filter(event => event.event === 'screen_view');
      const screenCounts = screenViews.reduce((acc, event) => {
        const screenName = event.properties.screen_name;
        acc[screenName] = (acc[screenName] || 0) + 1;
        return acc;
      }, {});

      expect(screenCounts.dashboard).toBe(3);
      expect(screenCounts.settings).toBe(1);
    });
  });

  describe('Обработка ошибок', () => {
    test('должна обработать ошибку при сохранении события', async () => {
      const event = 'test_event';
      
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(AnalyticsService.trackEvent(event)).rejects.toThrow('Storage error');
    });

    test('должна обработать ошибку при получении данных', async () => {
      (LocalStorageService.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(AnalyticsService.getAnalyticsData()).rejects.toThrow('Storage error');
    });
  });
});