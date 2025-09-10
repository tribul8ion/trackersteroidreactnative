import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { DashboardScreen } from '../../screens/DashboardScreen';
import { AuthService } from '../../services/auth';
import { CoursesService } from '../../services/courses';
import { ActionsService } from '../../services/actions';
import { LabsService } from '../../services/labs';
import { AchievementsService } from '../../services/achievements';
import { AnalyticsService } from '../../services/analytics';

// Мокаем сервисы
jest.mock('../../services/auth');
jest.mock('../../services/courses');
jest.mock('../../services/actions');
jest.mock('../../services/labs');
jest.mock('../../services/achievements');
jest.mock('../../services/analytics');

describe('DashboardScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Настраиваем моки для сервисов
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    });

    (CoursesService.getCourses as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Test Course', status: 'active' }
    ]);

    (ActionsService.getActions as jest.Mock).mockResolvedValue([
      { id: '1', type: 'injection', timestamp: '2024-01-01T10:00:00Z' }
    ]);

    (LabsService.getLabs as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Testosterone', value: 800, date: '2024-01-01' }
    ]);

    (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([
      { id: '1', name: 'First Step', achieved: true }
    ]);

    (AnalyticsService.trackScreen as jest.Mock).mockResolvedValue(undefined);
    (AnalyticsService.trackError as jest.Mock).mockResolvedValue(undefined);
  });

  test('должен отрендериться без ошибок', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('dashboard-screen')).toBeTruthy();
    });
  });

  test('должен загрузить данные при монтировании', async () => {
    render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(AuthService.getCurrentUser).toHaveBeenCalled();
      expect(CoursesService.getCourses).toHaveBeenCalled();
      expect(ActionsService.getActions).toHaveBeenCalled();
      expect(LabsService.getLabs).toHaveBeenCalled();
      expect(AchievementsService.getAchievementsWithProgress).toHaveBeenCalled();
    });
  });

  test('должен отобразить информацию о пользователе', async () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
    });
  });

  test('должен отобразить активный курс', async () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Test Course')).toBeTruthy();
    });
  });

  test('должен отобразить статистику действий', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('actions-stats')).toBeTruthy();
    });
  });

  test('должен отобразить статистику анализов', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('labs-stats')).toBeTruthy();
    });
  });

  test('должен отобразить достижения', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievements-section')).toBeTruthy();
    });
  });

  test('должен обновить данные при нажатии на кнопку обновления', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('refresh-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('refresh-button'));

    await waitFor(() => {
      expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(2);
      expect(CoursesService.getCourses).toHaveBeenCalledTimes(2);
    });
  });

  test('должен перейти к экрану курсов при нажатии на кнопку', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('courses-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('courses-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Courses');
  });

  test('должен перейти к экрану действий при нажатии на кнопку', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('actions-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('actions-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Actions');
  });

  test('должен перейти к экрану анализов при нажатии на кнопку', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('labs-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('labs-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Labs');
  });

  test('должен перейти к экрану достижений при нажатии на кнопку', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievements-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('achievements-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Achievements');
  });

  test('должен показать модальное окно с новыми достижениями', async () => {
    (AchievementsService.checkAndGrantAchievements as jest.Mock).mockResolvedValue([
      { id: '1', name: 'New Achievement', description: 'You earned a new achievement!' }
    ]);

    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievement-modal')).toBeTruthy();
    });
  });

  test('должен закрыть модальное окно достижений', async () => {
    (AchievementsService.checkAndGrantAchievements as jest.Mock).mockResolvedValue([
      { id: '1', name: 'New Achievement', description: 'You earned a new achievement!' }
    ]);

    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievement-modal')).toBeTruthy();
    });

    fireEvent.press(getByTestId('close-achievement-modal'));

    await waitFor(() => {
      expect(getByTestId('achievement-modal')).toBeFalsy();
    });
  });

  test('должен обработать ошибку загрузки данных', async () => {
    (AuthService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Auth error'));

    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(AnalyticsService.trackError).toHaveBeenCalledWith('dashboard_load_error', expect.any(Object));
    });
  });

  test('должен отобразить индикатор загрузки', async () => {
    (AuthService.getCurrentUser as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('должен отобразить пустое состояние когда нет данных', async () => {
    (CoursesService.getCourses as jest.Mock).mockResolvedValue([]);
    (ActionsService.getActions as jest.Mock).mockResolvedValue([]);
    (LabsService.getLabs as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  test('должен отобразить статистику курса', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('course-stats')).toBeTruthy();
    });
  });

  test('должен отобразить график прогресса', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('progress-chart')).toBeTruthy();
    });
  });

  test('должен отобразить быстрые действия', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('quick-actions')).toBeTruthy();
    });
  });

  test('должен выполнить быстрое действие - инъекция', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('quick-inject-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quick-inject-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LogAction', { type: 'injection' });
  });

  test('должен выполнить быстрое действие - таблетка', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('quick-pill-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quick-pill-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LogAction', { type: 'tablet' });
  });

  test('должен выполнить быстрое действие - заметка', async () => {
    const { getByTestId } = render(
      <DashboardScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('quick-note-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quick-note-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LogNote');
  });
});