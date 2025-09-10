import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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

describe('Интеграционные тесты - Пользовательские сценарии', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Настраиваем моки для сервисов
    (LocalStorageService.initialize as jest.Mock).mockResolvedValue(undefined);
    (LocalStorageService.isFirstLaunch as jest.Mock).mockResolvedValue(false);
    (LocalStorageService.markFirstLaunchComplete as jest.Mock).mockResolvedValue(undefined);
    
    (AuthService.initialize as jest.Mock).mockResolvedValue(undefined);
    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    
    (AnalyticsService.initialize as jest.Mock).mockResolvedValue(undefined);
    (AnalyticsService.trackScreen as jest.Mock).mockResolvedValue(undefined);
    (AnalyticsService.trackEvent as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Сценарий 1: Первый запуск и регистрация', () => {
    test('должен показать экран приветствия при первом запуске', async () => {
      (LocalStorageService.isFirstLaunch as jest.Mock).mockResolvedValue(true);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('splash-screen')).toBeTruthy();
      });
    });

    test('должен перейти к регистрации после приветствия', async () => {
      (LocalStorageService.isFirstLaunch as jest.Mock).mockResolvedValue(true);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('splash-screen')).toBeTruthy();
      });

      // Симулируем завершение анимации приветствия
      act(() => {
        // Здесь должна быть логика завершения анимации
      });

      await waitFor(() => {
        expect(getByTestId('auth-screen')).toBeTruthy();
      });
    });

    test('должен зарегистрировать нового пользователя', async () => {
      (AuthService.signUp as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('auth-screen')).toBeTruthy();
      });

      // Заполняем форму регистрации
      const nameInput = getByTestId('name-input');
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Нажимаем кнопку регистрации
      const signUpButton = getByTestId('sign-up-button');
      fireEvent.press(signUpButton);

      await waitFor(() => {
        expect(AuthService.signUp).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('Сценарий 2: Вход в систему', () => {
    test('должен войти с правильными учетными данными', async () => {
      (AuthService.signIn as jest.Mock).mockResolvedValue({
        success: true,
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('auth-screen')).toBeTruthy();
      });

      // Заполняем форму входа
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Нажимаем кнопку входа
      const signInButton = getByTestId('sign-in-button');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(AuthService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('Сценарий 3: Создание курса', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен создать новый курс', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (CoursesService.addCourse as jest.Mock).mockResolvedValue({
        success: true,
        course: { id: 'course1', name: 'Test Course' }
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Переходим к созданию курса
      const createCourseButton = getByTestId('create-course-button');
      fireEvent.press(createCourseButton);

      await waitFor(() => {
        expect(getByTestId('add-edit-course-screen')).toBeTruthy();
      });

      // Заполняем форму курса
      const courseNameInput = getByTestId('course-name-input');
      fireEvent.changeText(courseNameInput, 'Test Course');

      // Нажимаем кнопку сохранения
      const saveButton = getByTestId('save-course-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(CoursesService.addCourse).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Course'
          })
        );
      });
    });
  });

  describe('Сценарий 4: Добавление действий', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен добавить инъекцию', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([
        { id: 'course1', name: 'Test Course', status: 'active' }
      ]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (ActionsService.addAction as jest.Mock).mockResolvedValue({
        success: true,
        action: { id: 'action1', type: 'injection' }
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Используем быстрое действие
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
    });

    test('должен добавить заметку', async () => {
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([
        { id: 'course1', name: 'Test Course', status: 'active' }
      ]);
      (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
      (ActionsService.addAction as jest.Mock).mockResolvedValue({
        success: true,
        action: { id: 'action1', type: 'note' }
      });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Переходим к добавлению заметки
      const quickNoteButton = getByTestId('quick-note-button');
      fireEvent.press(quickNoteButton);

      await waitFor(() => {
        expect(getByTestId('log-note-screen')).toBeTruthy();
      });

      // Заполняем заметку
      const noteInput = getByTestId('note-input');
      fireEvent.changeText(noteInput, 'Test note');

      // Нажимаем кнопку сохранения
      const saveButton = getByTestId('save-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(ActionsService.addAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'note',
            course_id: 'course1',
            details: expect.stringContaining('Test note')
          })
        );
      });
    });
  });

  describe('Сценарий 5: Добавление анализов', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен добавить анализ', async () => {
      (LabsService.getLabs as jest.Mock).mockResolvedValue([]);
      (LabsService.addLab as jest.Mock).mockResolvedValue({
        success: true,
        lab: { id: 'lab1', name: 'Testosterone', value: 800 }
      });

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

      // Нажимаем кнопку добавления анализа
      const addLabButton = getByTestId('add-lab-button');
      fireEvent.press(addLabButton);

      await waitFor(() => {
        expect(getByTestId('add-edit-lab-screen')).toBeTruthy();
      });

      // Заполняем форму анализа
      const labNameInput = getByTestId('lab-name-input');
      const labValueInput = getByTestId('lab-value-input');

      fireEvent.changeText(labNameInput, 'Testosterone');
      fireEvent.changeText(labValueInput, '800');

      // Нажимаем кнопку сохранения
      const saveButton = getByTestId('save-lab-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(LabsService.addLab).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Testosterone',
            value: 800
          })
        );
      });
    });
  });

  describe('Сценарий 6: Просмотр достижений', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен показать достижения', async () => {
      (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([
        {
          id: 'first_step',
          name: 'Первый шаг',
          description: 'Зарегистрироваться в приложении',
          achieved: true
        }
      ]);

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

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

  describe('Сценарий 7: Настройки', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен открыть настройки', async () => {
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
    });

    test('должен изменить настройки уведомлений', async () => {
      const { getByTestId } = render(<App />);

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
    });
  });

  describe('Сценарий 8: Экспорт данных', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен экспортировать данные', async () => {
      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });

      // Нажимаем кнопку экспорта
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

  describe('Сценарий 9: Выход из системы', () => {
    beforeEach(() => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('должен выйти из системы', async () => {
      (AuthService.signOut as jest.Mock).mockResolvedValue({ success: true });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });

      // Нажимаем кнопку выхода
      const signOutButton = getByTestId('sign-out-button');
      fireEvent.press(signOutButton);

      // Подтверждаем выход
      const confirmButton = getByTestId('confirm-sign-out-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(AuthService.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Сценарий 10: Обработка ошибок', () => {
    test('должен обработать ошибку загрузки данных', async () => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Load error'));

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });
    });

    test('должен обработать ошибку сохранения данных', async () => {
      (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      });
      (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
      (CoursesService.addCourse as jest.Mock).mockRejectedValue(new Error('Save error'));

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('dashboard-screen')).toBeTruthy();
      });

      // Пытаемся создать курс
      const createCourseButton = getByTestId('create-course-button');
      fireEvent.press(createCourseButton);

      await waitFor(() => {
        expect(getByTestId('add-edit-course-screen')).toBeTruthy();
      });

      const courseNameInput = getByTestId('course-name-input');
      fireEvent.changeText(courseNameInput, 'Test Course');

      const saveButton = getByTestId('save-course-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });
    });
  });
});