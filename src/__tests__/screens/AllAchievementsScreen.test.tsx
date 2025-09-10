import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AllAchievementsScreen } from '../../screens/AllAchievementsScreen';
import { AchievementsService } from '../../services/achievements';

// Мокаем сервисы
jest.mock('../../services/achievements');

describe('AllAchievementsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  const mockAchievements = [
    {
      id: 'first_step',
      name: 'Первый шаг',
      description: 'Зарегистрироваться в приложении',
      category: 'profile',
      icon: 'user-plus',
      rarity: 'common',
      points: 10,
      progress: 1,
      achieved: true
    },
    {
      id: 'veteran',
      name: 'Ветеран',
      description: 'Выполнить 100 действий',
      category: 'injection',
      icon: 'syringe',
      rarity: 'rare',
      points: 50,
      required: 100,
      progress: 50,
      achieved: false
    },
    {
      id: 'perfect_profile',
      name: 'Идеальный профиль',
      description: 'Заполнить все поля профиля',
      category: 'profile',
      icon: 'user-check',
      rarity: 'epic',
      points: 100,
      progress: 1,
      achieved: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue(mockAchievements);
  });

  test('должен отрендериться без ошибок', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('all-achievements-screen')).toBeTruthy();
    });
  });

  test('должен загрузить достижения при монтировании', async () => {
    render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(AchievementsService.getAchievementsWithProgress).toHaveBeenCalled();
    });
  });

  test('должен отобразить заголовок с общим количеством достижений', async () => {
    const { getByText } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('3 достижения')).toBeTruthy();
    });
  });

  test('должен отобразить общее количество очков', async () => {
    const { getByText } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('160 очков')).toBeTruthy();
    });
  });

  test('должен отобразить фильтры по категориям', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('category-filters')).toBeTruthy();
    });
  });

  test('должен отобразить кнопку "Все" в фильтрах', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('filter-all')).toBeTruthy();
    });
  });

  test('должен отобразить кнопки фильтров по категориям', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('filter-profile')).toBeTruthy();
      expect(getByTestId('filter-injection')).toBeTruthy();
    });
  });

  test('должен фильтровать достижения по категории', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('filter-profile')).toBeTruthy();
    });

    fireEvent.press(getByTestId('filter-profile'));

    await waitFor(() => {
      expect(getByTestId('achievements-list')).toBeTruthy();
    });
  });

  test('должен отобразить достижения в списке', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievement-card-first_step')).toBeTruthy();
      expect(getByTestId('achievement-card-veteran')).toBeTruthy();
      expect(getByTestId('achievement-card-perfect_profile')).toBeTruthy();
    });
  });

  test('должен отобразить информацию о достижении', async () => {
    const { getByText } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Первый шаг')).toBeTruthy();
      expect(getByText('Зарегистрироваться в приложении')).toBeTruthy();
      expect(getByText('10 очков')).toBeTruthy();
    });
  });

  test('должен отобразить статус достижения', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('achievement-badge-first_step')).toBeTruthy();
      expect(getByTestId('achievement-badge-veteran')).toBeFalsy();
    });
  });

  test('должен отобразить прогресс-бар для незавершенных достижений', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('progress-bar-veteran')).toBeTruthy();
    });
  });

  test('должен отобразить правильный прогресс в прогресс-баре', async () => {
    const { getByText } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('50/100')).toBeTruthy();
    });
  });

  test('должен отобразить иконку редкости', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('rarity-icon-first_step')).toBeTruthy();
      expect(getByTestId('rarity-icon-veteran')).toBeTruthy();
      expect(getByTestId('rarity-icon-perfect_profile')).toBeTruthy();
    });
  });

  test('должен отобразить цвет редкости', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const commonAchievement = getByTestId('achievement-card-first_step');
      const rareAchievement = getByTestId('achievement-card-veteran');
      const epicAchievement = getByTestId('achievement-card-perfect_profile');

      expect(commonAchievement).toHaveStyle({ borderLeftColor: expect.any(String) });
      expect(rareAchievement).toHaveStyle({ borderLeftColor: expect.any(String) });
      expect(epicAchievement).toHaveStyle({ borderLeftColor: expect.any(String) });
    });
  });

  test('должен обновить данные при нажатии на кнопку обновления', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('refresh-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('refresh-button'));

    await waitFor(() => {
      expect(AchievementsService.getAchievementsWithProgress).toHaveBeenCalledTimes(2);
    });
  });

  test('должен показать индикатор загрузки при обновлении', async () => {
    (AchievementsService.getAchievementsWithProgress as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  test('должен обработать ошибку загрузки данных', async () => {
    (AchievementsService.getAchievementsWithProgress as jest.Mock).mockRejectedValue(new Error('Load error'));

    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  test('должен отобразить пустое состояние когда нет достижений', async () => {
    (AchievementsService.getAchievementsWithProgress as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  test('должен отобразить статистику по категориям', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('category-stats')).toBeTruthy();
    });
  });

  test('должен отобразить количество достижений по категориям', async () => {
    const { getByText } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Профиль')).toBeTruthy();
      expect(getByText('2')).toBeTruthy(); // 2 достижения в категории profile
    });
  });

  test('должен вернуться назад при нажатии на кнопку назад', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test('должен отобразить поиск достижений', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('search-input')).toBeTruthy();
    });
  });

  test('должен фильтровать достижения по поиску', async () => {
    const { getByTestId } = render(
      <AllAchievementsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('search-input')).toBeTruthy();
    });

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'первый');

    await waitFor(() => {
      expect(getByTestId('achievement-card-first_step')).toBeTruthy();
      expect(getByTestId('achievement-card-veteran')).toBeFalsy();
    });
  });
});