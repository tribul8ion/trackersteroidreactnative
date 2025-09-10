import { AchievementsService } from '../../services/achievements';
import { LocalStorageService } from '../../services/localStorage';
import { AuthService } from '../../services/auth';
import { CoursesService } from '../../services/courses';
import { ActionsService } from '../../services/actions';
import { LabsService } from '../../services/labs';

// Мокаем зависимости
jest.mock('../../services/auth');
jest.mock('../../services/courses');
jest.mock('../../services/actions');
jest.mock('../../services/labs');

describe('AchievementsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await AchievementsService.initialize();
      expect(LocalStorageService.getItem).toHaveBeenCalledWith('achievements');
    });
  });

  describe('Получение достижений', () => {
    test('должна получить все достижения', async () => {
      const mockAchievements = [
        { id: '1', name: 'First Step', description: 'Complete first action' },
        { id: '2', name: 'Veteran', description: 'Complete 100 actions' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockAchievements);

      const achievements = await AchievementsService.getAllAchievements();
      expect(achievements).toEqual(mockAchievements);
    });

    test('должна получить достижения пользователя', async () => {
      const mockUserAchievements = [
        { id: '1', achievement_id: 'first_step', user_id: 'user1', earned_at: '2024-01-01' },
        { id: '2', achievement_id: 'veteran', user_id: 'user1', earned_at: '2024-01-02' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockUserAchievements);

      const achievements = await AchievementsService.getAchievements('user1');
      expect(achievements).toEqual(mockUserAchievements);
    });

    test('должна получить прогресс достижений пользователя', async () => {
      const mockUserData = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      };

      const mockCourses = [
        { id: '1', name: 'Test Course', status: 'active' }
      ];

      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' }
      ];

      const mockLabs = [
        { id: '1', name: 'Testosterone', value: 800, date: '2024-01-01' }
      ];

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (CoursesService.getCourses as jest.Mock).mockResolvedValue(mockCourses);
      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LabsService.getLabs as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      expect(achievements).toBeDefined();
      expect(Array.isArray(achievements)).toBe(true);
    });
  });

  describe('Добавление достижения', () => {
    test('должна добавить достижение пользователю', async () => {
      const userAchievement = {
        user_id: 'user1',
        achievement_id: 'first_step',
        earned_at: '2024-01-01T10:00:00Z'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await AchievementsService.addUserAchievement(userAchievement);
      expect(result.success).toBe(true);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });

    test('должна отклонить добавление дублирующегося достижения', async () => {
      const userAchievement = {
        user_id: 'user1',
        achievement_id: 'first_step',
        earned_at: '2024-01-01T10:00:00Z'
      };

      const existingAchievements = [
        { id: '1', user_id: 'user1', achievement_id: 'first_step', earned_at: '2024-01-01T10:00:00Z' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(existingAchievements);

      const result = await AchievementsService.addUserAchievement(userAchievement);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already earned');
    });
  });

  describe('Проверка и выдача достижений', () => {
    test('должна проверить и выдать достижения профиля', async () => {
      const mockUserData = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        weight: 80,
        height: 180
      };

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const newAchievements = await AchievementsService.checkAndGrantProfileAchievements();
      expect(Array.isArray(newAchievements)).toBe(true);
    });

    test('должна проверить и выдать достижения действий', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' },
        { id: '2', type: 'injection', timestamp: '2024-01-02T10:00:00Z' },
        { id: '3', type: 'injection', timestamp: '2024-01-03T10:00:00Z' }
      ];

      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const newAchievements = await AchievementsService.checkAndGrantActionAchievements();
      expect(Array.isArray(newAchievements)).toBe(true);
    });

    test('должна проверить и выдать все достижения', async () => {
      const mockUserData = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      };

      const mockCourses = [
        { id: '1', name: 'Test Course', status: 'active' }
      ];

      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' }
      ];

      const mockLabs = [
        { id: '1', name: 'Testosterone', value: 800, date: '2024-01-01' }
      ];

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (CoursesService.getCourses as jest.Mock).mockResolvedValue(mockCourses);
      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LabsService.getLabs as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const newAchievements = await AchievementsService.checkAndGrantAchievements();
      expect(Array.isArray(newAchievements)).toBe(true);
    });
  });

  describe('Расчет прогресса', () => {
    test('должна рассчитать прогресс для достижения "Первый шаг"', async () => {
      const mockActions = [
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' }
      ];

      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      const firstStepAchievement = achievements.find(ach => ach.id === 'first_step');
      
      expect(firstStepAchievement).toBeDefined();
      expect(firstStepAchievement.progress).toBe(1);
      expect(firstStepAchievement.achieved).toBe(true);
    });

    test('должна рассчитать прогресс для достижения "Ветеран"', async () => {
      const mockActions = Array.from({ length: 50 }, (_, i) => ({
        id: `action_${i}`,
        type: 'injection',
        timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`
      }));

      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      const veteranAchievement = achievements.find(ach => ach.id === 'veteran');
      
      expect(veteranAchievement).toBeDefined();
      expect(veteranAchievement.progress).toBe(50);
      expect(veteranAchievement.achieved).toBe(false);
    });

    test('должна рассчитать прогресс для достижения "Идеальный профиль"', async () => {
      const mockUserData = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        weight: 80,
        height: 180,
        experience: 'intermediate',
        goals: ['muscle_gain', 'strength']
      };

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      const perfectProfileAchievement = achievements.find(ach => ach.id === 'perfect_profile');
      
      expect(perfectProfileAchievement).toBeDefined();
      expect(perfectProfileAchievement.progress).toBe(1);
      expect(perfectProfileAchievement.achieved).toBe(true);
    });
  });

  describe('Фильтрация достижений', () => {
    test('должна фильтровать достижения по категории', async () => {
      const mockUserData = { id: 'user1', name: 'Test User' };
      const mockCourses = [];
      const mockActions = [];
      const mockLabs = [];

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (CoursesService.getCourses as jest.Mock).mockResolvedValue(mockCourses);
      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LabsService.getLabs as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      const injectionAchievements = achievements.filter(ach => ach.category === 'injection');
      
      expect(injectionAchievements.length).toBeGreaterThan(0);
      expect(injectionAchievements.every(ach => ach.category === 'injection')).toBe(true);
    });

    test('должна фильтровать достижения по редкости', async () => {
      const mockUserData = { id: 'user1', name: 'Test User' };
      const mockCourses = [];
      const mockActions = [];
      const mockLabs = [];

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUserData);
      (CoursesService.getCourses as jest.Mock).mockResolvedValue(mockCourses);
      (ActionsService.getActions as jest.Mock).mockResolvedValue(mockActions);
      (LabsService.getLabs as jest.Mock).mockResolvedValue(mockLabs);
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const achievements = await AchievementsService.getAchievementsWithProgress();
      const legendaryAchievements = achievements.filter(ach => ach.rarity === 'legendary');
      
      expect(legendaryAchievements.length).toBeGreaterThan(0);
      expect(legendaryAchievements.every(ach => ach.rarity === 'legendary')).toBe(true);
    });
  });
});