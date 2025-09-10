import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('Интеграционные тесты - Потоки данных', () => {
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

  describe('Поток данных: Создание курса → Добавление действий → Просмотр статистики', () => {
    test('должен корректно обработать полный поток данных', async () => {
      // Настраиваем моки для последовательных вызовов
      (CoursesService.getCourses as jest.Mock)
        .mockResolvedValueOnce([]) // Первоначальная загрузка
        .mockResolvedValueOnce([{ id: 'course1', name: 'Test Course', status: 'active' }]); // После создания

      (CoursesService.addCourse as jest.Mock).mockResolvedValue({
        success: true,
        course: { id: 'course1', name: 'Test Course', status: 'active' }
      });

      (ActionsService.getActions as jest.Mock)
        .mockResolvedValueOnce([]) // Первоначальная загрузка
        .mockResolvedValueOnce([]) // После добавления действия
        .mockResolvedValueOnce([{ id: 'action1', type: 'injection', course_id: 'course1' }]); // После добавления

      (ActionsService.addAction as jest.Mock).mockResolvedValue({
        success: true,
        action: { id: 'action1', type: 'injection', course_id: 'course1' }
      });

      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      // 1. Проверяем первоначальную загрузку
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      expect(CoursesService.getCourses).toHaveBeenCalledTimes(1);
      expect(ActionsService.getActions).toHaveBeenCalledTimes(1);

      // 2. Создаем курс
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
        expect(CoursesService.addCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Course'
          })
        );
      });

      // 3. Возвращаемся на дашборд и проверяем обновление данных
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      expect(CoursesService.getCourses).toHaveBeenCalledTimes(2);

      // 4. Добавляем действие
      const quickInjectButton = getByTestId('quick-inject-button');
      fireEvent.press(quickInjectButton);

      await waitFor(() => {
        expect(ActionsService.addAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'injection',
            course_id: 'course1'
          })
        );
      });

      // 5. Проверяем обновление статистики
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      expect(ActionsService.getActions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Поток данных: Добавление анализов → Анализ результатов → Рекомендации', () => {
    test('должен корректно обработать поток данных анализов', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock)
        .mockResolvedValueOnce([]) // Первоначальная загрузка
        .mockResolvedValueOnce([{ id: 'lab1', name: 'Testosterone', value: 800, date: '2024-01-01' }]); // После добавления

      (LabsService.addLab as jest.Mock).mockResolvedValue({
        success: true,
        lab: { id: 'lab1', name: 'Testosterone', value: 800, date: '2024-01-01' }
      });

      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Переходим к анализам
      const labsButton = getByTestId('labs-button');
      fireEvent.press(labsButton);

      await waitFor(() => {
        expect(getByTestId('labs-screen')).toBeTruthy();
      });

      // Добавляем анализ
      const addLabButton = getByTestId('add-lab-button');
      fireEvent.press(addLabButton);

      await waitFor(() => {
        expect(getByTestId('add-edit-lab-screen')).toBeTruthy();
      });

      const labNameInput = getByTestId('lab-name-input');
      const labValueInput = getByTestId('lab-value-input');

      fireEvent.changeText(labNameInput, 'Testosterone');
      fireEvent.changeText(labValueInput, '800');

      const saveLabButton = getByTestId('save-lab-button');
      fireEvent.press(saveLabButton);

      await waitFor(() => {
        expect(LabsService.addLab).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Testosterone',
            value: 800
          })
        );
      });

      // Возвращаемся к списку анализов
      await waitFor(() => {
        expect(getByTestId('labs-screen')).toBeTruthy();
      });

      expect(LabsService.getLabs).toHaveBeenCalledTimes(2);
    });
  });

  describe('Поток данных: Достижения → Прогресс → Уведомления', () => {
    test('должен корректно обработать поток данных достижений', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);

      (AchievementsService.getAchievementsWithProgress as jest.Mock)
        .mockResolvedValueOnce([]) // Первоначальная загрузка
        .mockResolvedValueOnce([{ id: 'first_step', name: 'Первый шаг', achieved: true }]); // После получения

      (AchievementsService.checkAndGrantAchievements as jest.Mock).mockResolvedValue([
        { id: 'first_step', name: 'Первый шаг', achieved: true }
      ]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Проверяем, что достижения загружены
      expect(AchievementsService.getAchievementsWithProgress).toHaveBeenCalledTimes(1);

      // Проверяем, что новые достижения проверены
      expect(AchievementsService.checkAndGrantAchievements).toHaveBeenCalledTimes(1);

      // Переходим к достижениям
      const achievementsButton = getByTestId('achievements-button');
      fireEvent.press(achievementsButton);

      await waitFor(() => {
        expect(getByTestId('achievements-screen')).toBeTruthy();
      });

      // Проверяем, что достижения отображаются
      expect(getByTestId('achievement-card-first_step')).toBeTruthy();
    });
  });

  describe('Поток данных: Настройки → Изменения → Сохранение', () => {
    test('должен корректно обработать поток данных настроек', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      (LocalStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce('true') // notifications_enabled
        .mockResolvedValueOnce('light') // theme
        .mockResolvedValueOnce('ru') // language
        .mockResolvedValueOnce('false'); // analytics_enabled

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Переходим к настройкам
      const settingsButton = getByTestId('settings-button');
      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });

      // Изменяем настройки уведомлений
      const notificationsToggle = getByTestId('notifications-toggle');
      fireEvent.press(notificationsToggle);

      await waitFor(() => {
        expect(LocalStorageService.setItem).toHaveBeenCalledWith(
          'notifications_enabled',
          'false'
        );
      });

      // Изменяем тему
      const themeSelector = getByTestId('theme-selector');
      fireEvent.press(themeSelector);

      const darkThemeOption = getByTestId('dark-theme-option');
      fireEvent.press(darkThemeOption);

      await waitFor(() => {
        expect(LocalStorageService.setItem).toHaveBeenCalledWith(
          'theme',
          'dark'
        );
      });
    });
  });

  describe('Поток данных: Экспорт → Импорт → Валидация', () => {
    test('должен корректно обработать поток данных резервного копирования', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const mockExportData = {
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

      (LocalStorageService.getItem as jest.Mock)
        .mockResolvedValueOnce('true') // notifications_enabled
        .mockResolvedValueOnce('light') // theme
        .mockResolvedValueOnce('ru') // language
        .mockResolvedValueOnce('false') // analytics_enabled
        .mockResolvedValueOnce(JSON.stringify(mockExportData.user)) // user_data
        .mockResolvedValueOnce(JSON.stringify(mockExportData.courses)) // courses
        .mockResolvedValueOnce(JSON.stringify(mockExportData.actions)) // actions
        .mockResolvedValueOnce(JSON.stringify(mockExportData.labs)) // labs
        .mockResolvedValueOnce(JSON.stringify(mockExportData.achievements)); // achievements

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });

      // Экспортируем данные
      const exportButton = getByTestId('export-data-button');
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(LocalStorageService.getItem).toHaveBeenCalledWith('user_data');
        expect(LocalStorageService.getItem).toHaveBeenCalledWith('courses');
        expect(LocalStorageService.getItem).toHaveBeenCalledWith('actions');
        expect(LocalStorageService.getItem).toHaveBeenCalledWith('labs');
        expect(LocalStorageService.getItem).toHaveBeenCalledWith('achievements');
      });
    });
  });

  describe('Поток данных: Ошибки → Восстановление → Продолжение', () => {
    test('должен корректно обработать поток данных с ошибками', async () => {
      (CoursesService.getCourses as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error')) // Первая попытка
        .mockResolvedValueOnce([]); // Вторая попытка

      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      // Проверяем, что ошибка обработана
      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });

      // Пытаемся восстановиться
      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      // Проверяем, что данные загружены после повторной попытки
      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      expect(CoursesService.getCourses).toHaveBeenCalledTimes(2);
    });
  });

  describe('Поток данных: Аналитика → События → Отчеты', () => {
    test('должен корректно обработать поток данных аналитики', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Проверяем, что аналитика отслеживается
      expect(AnalyticsService.trackScreen).toHaveBeenCalledWith('dashboard');

      // Выполняем действие
      const quickInjectButton = getByTestId('quick-inject-button');
      fireEvent.press(quickInjectButton);

      // Проверяем, что событие отслежено
      expect(AnalyticsService.trackEvent).toHaveBeenCalledWith(
        'quick_action_used',
        expect.objectContaining({
          action_type: 'injection'
        })
      );
    });
  });
});