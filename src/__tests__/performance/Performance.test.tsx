import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { performance } from 'perf_hooks';
import { App } from '../../App';
import { AuthService } from '../../services/auth';
import { CoursesService } from '../../services/courses';
import { ActionsService } from '../../services/actions';
import { LabsService } from '../../services/labs';
import { AchievementsService } from '../../services/achievements';
import { AnalyticsService } from '../../services/analytics';
import { LocalStorageService } from '../../services/localStorage';

// Мокаем все сервисы
jest.mock('../../services/auth');
jest.mock('../../services/courses');
jest.mock('../../services/actions');
jest.mock('../../services/labs');
jest.mock('../../services/achievements');
jest.mock('../../services/analytics');
jest.mock('../../services/localStorage');

describe('Тесты производительности', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Настраиваем моки для сервисов
    (LocalStorageService.initialize as jest.Mock).mockResolvedValue(undefined);
    (LocalStorageService.isFirstLaunch as jest.Mock).mockResolvedValue(false);
    (LocalStorageService.markFirstLaunchComplete as jest.Mock).mockResolvedValue(undefined);
    
    (AuthService.initialize as jest.Mock).mockResolvedValue(undefined);
    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    });
    
    (AnalyticsService.initialize as jest.Mock).mockResolvedValue(undefined);
    (AnalyticsService.trackScreen as jest.Mock).mockResolvedValue(undefined);
    (AnalyticsService.trackEvent as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Производительность загрузки', () => {
    test('должна загружать дашборд менее чем за 2 секунды', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(2000);
    });

    test('должна загружать экран курсов менее чем за 1 секунду', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Test Course', status: 'active' }
      ]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      const coursesButton = getByTestId('courses-button');
      fireEvent.press(coursesButton);
      
      await waitFor(() => {
        expect(getByTestId('courses-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });

    test('должна загружать экран действий менее чем за 1 секунду', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([
        { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' }
      ]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      const actionsButton = getByTestId('actions-button');
      fireEvent.press(actionsButton);
      
      await waitFor(() => {
        expect(getByTestId('actions-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });

    test('должна загружать экран анализов менее чем за 1 секунду', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Testosterone', value: 800, date: '2024-01-01' }
      ]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      const labsButton = getByTestId('labs-button');
      fireEvent.press(labsButton);
      
      await waitFor(() => {
        expect(getByTestId('labs-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });

    test('должна загружать экран достижений менее чем за 1 секунду', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([
        { id: '1', name: 'First Step', achieved: true }
      ]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      const achievementsButton = getByTestId('achievements-button');
      fireEvent.press(achievementsButton);
      
      await waitFor(() => {
        expect(getByTestId('achievements-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Производительность обработки данных', () => {
    test('должна обрабатывать большие объемы данных курсов', async () => {
      const largeCoursesDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `course_${i}`,
        name: `Course ${i}`,
        status: i % 2 === 0 ? 'active' : 'completed'
      }));

      (CoursesService.getCourses as jest.Mock).mockResolvedValue(largeCoursesDataset);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000);
    });

    test('должна обрабатывать большие объемы данных действий', async () => {
      const largeActionsDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `action_${i}`,
        type: i % 3 === 0 ? 'injection' : i % 3 === 1 ? 'tablet' : 'note',
        timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`
      }));

      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue(largeActionsDataset);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000);
    });

    test('должна обрабатывать большие объемы данных анализов', async () => {
      const largeLabsDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `lab_${i}`,
        name: `Lab ${i}`,
        value: Math.random() * 1000,
        date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`
      }));

      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue(largeLabsDataset);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000);
    });

    test('должна обрабатывать большие объемы данных достижений', async () => {
      const largeAchievementsDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `achievement_${i}`,
        name: `Achievement ${i}`,
        description: `Description ${i}`,
        category: ['injection', 'labs', 'course', 'meme', 'profile', 'streak', 'milestone'][i % 7],
        achieved: i % 2 === 0
      }));

      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue(largeAchievementsDataset);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Производительность анимаций', () => {
    test('должна выполнять анимации плавно', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      // Выполняем несколько анимированных действий
      const quickInjectButton = getByTestId('quick-inject-button');
      fireEvent.press(quickInjectButton);
      
      const quickPillButton = getByTestId('quick-pill-button');
      fireEvent.press(quickPillButton);
      
      const quickNoteButton = getByTestId('quick-note-button');
      fireEvent.press(quickNoteButton);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(500);
    });

    test('должна выполнять переходы между экранами плавно', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      // Переходим между экранами
      const coursesButton = getByTestId('courses-button');
      fireEvent.press(coursesButton);
      
      await waitFor(() => {
        expect(getByTestId('courses-screen')).toBeTruthy();
      });
      
      const actionsButton = getByTestId('actions-button');
      fireEvent.press(actionsButton);
      
      await waitFor(() => {
        expect(getByTestId('actions-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Производительность памяти', () => {
    test('должна эффективно использовать память', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId, unmount } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Проверяем, что память не растет неконтролируемо
      const initialMemory = process.memoryUsage();
      
      // Выполняем несколько действий
      for (let i = 0; i < 100; i++) {
        const quickInjectButton = getByTestId('quick-inject-button');
        fireEvent.press(quickInjectButton);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Память не должна увеличиваться более чем на 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      unmount();
    });

    test('должна освобождать память при размонтировании', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId, unmount } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const beforeUnmount = process.memoryUsage();
      
      unmount();
      
      // Даем время на сборку мусора
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterUnmount = process.memoryUsage();
      const memoryDecrease = beforeUnmount.heapUsed - afterUnmount.heapUsed;
      
      // Память должна уменьшиться
      expect(memoryDecrease).toBeGreaterThan(0);
    });
  });

  describe('Производительность сети', () => {
    test('должна обрабатывать медленные сетевые запросы', async () => {
      (CoursesService.getCourses as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Должна загрузиться менее чем за 3 секунды даже с медленным запросом
      expect(duration).toBeLessThan(3000);
    });

    test('должна обрабатывать ошибки сети', async () => {
      (CoursesService.getCourses as jest.Mock).mockRejectedValue(new Error('Network error'));
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Ошибка должна обработаться быстро
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Производительность базы данных', () => {
    test('должна эффективно выполнять запросы к локальному хранилищу', async () => {
      (CoursesService.getCourses as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      (ActionsService.getActions as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      (LabsService.getLabs as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const start = performance.now();
      
      const { getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Все запросы должны выполниться параллельно и быстро
      expect(duration).toBeLessThan(500);
    });

    test('должна эффективно сохранять данные', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      (CoursesService.addCourse as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 50))
      );

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      const start = performance.now();
      
      const createCourseButton = getByTestId('create-course-button');
      fireEvent.press(createCourseButton);
      
      await waitFor(() => {
        expect(getByTestId('add-edit-course-screen')).toBeTruthy();
      });
      
      const courseNameInput = getByTestId('course-name-input');
      fireEvent.changeText(courseNameInput, 'Test Course');
      
      const saveCourseButton = getByTestId('save-course-button');
      fireEvent.press(saveCourseButton);
      
      await waitFor(() => {
        expect(CoursesService.addCourse).toHaveBeenCalled();
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Сохранение должно быть быстрым
      expect(duration).toBeLessThan(1000);
    });
  });
});