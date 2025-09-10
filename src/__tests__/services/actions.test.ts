import { ActionsService } from '../../services/actions';
import { LocalStorageService } from '../../services/localStorage';

describe('ActionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await ActionsService.initialize();
      expect(LocalStorageService.getItem).toHaveBeenCalledWith('actions');
    });
  });

  describe('Получение действий', () => {
    test('должна получить все действия', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'tablet', timestamp: '2024-01-01T12:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);

      const actions = await ActionsService.getActions();
      expect(actions).toEqual(mockActions);
    });

    test('должна получить пустой массив если действий нет', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const actions = await ActionsService.getActions();
      expect(actions).toEqual([]);
    });

    test('должна фильтровать действия по типу', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'tablet', timestamp: '2024-01-01T12:00:00Z' },
        { id: '3', type: 'injection', timestamp: '2024-01-01T14:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);

      const injectionActions = await ActionsService.getActions('injection');
      expect(injectionActions).toHaveLength(2);
      expect(injectionActions.every(action => action.type === 'injection')).toBe(true);
    });

    test('должна фильтровать действия по курсу', async () => {
      const mockActions = [
        { id: '1', type: 'injection', course_id: 'course1', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'injection', course_id: 'course2', timestamp: '2024-01-01T12:00:00Z' },
        { id: '3', type: 'tablet', course_id: 'course1', timestamp: '2024-01-01T14:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);

      const course1Actions = await ActionsService.getActions(undefined, 'course1');
      expect(course1Actions).toHaveLength(2);
      expect(course1Actions.every(action => action.course_id === 'course1')).toBe(true);
    });
  });

  describe('Добавление действия', () => {
    test('должна добавить новое действие', async () => {
      const newAction = {
        user_id: 'user1',
        course_id: 'course1',
        type: 'injection',
        timestamp: '2024-01-01T10:00:00Z',
        details: JSON.stringify({ compound: 'testosterone', dosage: 250 })
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await ActionsService.addAction(newAction);
      expect(result.success).toBe(true);
      expect(result.action).toMatchObject(newAction);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });

    test('должна отклонить добавление действия с неверными данными', async () => {
      const invalidAction = {
        user_id: '',
        course_id: '',
        type: 'invalid',
        timestamp: 'invalid-date'
      };

      const result = await ActionsService.addAction(invalidAction);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('должна добавить ID к новому действию', async () => {
      const newAction = {
        user_id: 'user1',
        course_id: 'course1',
        type: 'injection',
        timestamp: '2024-01-01T10:00:00Z'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await ActionsService.addAction(newAction);
      expect(result.action.id).toBeDefined();
      expect(typeof result.action.id).toBe('string');
    });
  });

  describe('Обновление действия', () => {
    test('должна обновить существующее действие', async () => {
      const existingAction = { 
        id: '1', 
        type: 'injection', 
        timestamp: '2024-01-01T10:00:00Z',
        details: JSON.stringify({ compound: 'testosterone', dosage: 250 })
      };
      const mockActions = [existingAction];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await ActionsService.updateAction('1', { 
        details: JSON.stringify({ compound: 'testosterone', dosage: 300 })
      });
      expect(result.success).toBe(true);
      expect(JSON.parse(result.action.details).dosage).toBe(300);
    });

    test('должна отклонить обновление несуществующего действия', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await ActionsService.updateAction('nonexistent', { details: '{}' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Удаление действия', () => {
    test('должна удалить существующее действие', async () => {
      const existingAction = { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' };
      const mockActions = [existingAction];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await ActionsService.deleteAction('1');
      expect(result.success).toBe(true);
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('actions', []);
    });

    test('должна отклонить удаление несуществующего действия', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await ActionsService.deleteAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Статистика действий', () => {
    test('должна подсчитать действия по типу', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'tablet', timestamp: '2024-01-01T12:00:00Z' },
        { id: '3', type: 'injection', timestamp: '2024-01-01T14:00:00Z' },
        { id: '4', type: 'note', timestamp: '2024-01-01T16:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);

      const stats = await ActionsService.getActionStats();
      expect(stats.injection).toBe(2);
      expect(stats.tablet).toBe(1);
      expect(stats.note).toBe(1);
    });

    test('должна подсчитать действия за период', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'injection', timestamp: '2024-01-15T10:00:00Z' },
        { id: '3', type: 'injection', timestamp: '2024-02-01T10:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockActions);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const stats = await ActionsService.getActionStats(undefined, startDate, endDate);
      expect(stats.injection).toBe(2);
    });
  });
});