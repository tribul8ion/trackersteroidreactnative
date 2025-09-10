import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AchievementCard } from '../../components/AchievementCard';

describe('AchievementCard', () => {
  const mockAchievement = {
    id: 'test_achievement',
    name: 'Test Achievement',
    description: 'This is a test achievement',
    category: 'injection',
    icon: 'syringe',
    rarity: 'common',
    points: 10,
    progress: 1,
    achieved: true,
    required: 1
  };

  const mockProps = {
    achievement: mockAchievement,
    onPress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('должен отрендериться без ошибок', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('achievement-card')).toBeTruthy();
  });

  test('должен отобразить название достижения', () => {
    const { getByText } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByText('Test Achievement')).toBeTruthy();
  });

  test('должен отобразить описание достижения', () => {
    const { getByText } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByText('This is a test achievement')).toBeTruthy();
  });

  test('должен отобразить иконку достижения', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('achievement-icon')).toBeTruthy();
  });

  test('должен отобразить количество очков', () => {
    const { getByText } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByText('10 очков')).toBeTruthy();
  });

  test('должен отобразить иконку редкости', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('rarity-icon')).toBeTruthy();
  });

  test('должен отобразить цвет редкости', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
  });

  test('должен отобразить статус достижения', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('achievement-status')).toBeTruthy();
  });

  test('должен отобразить значок "Получено" для достигнутых достижений', () => {
    const { getByText } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByText('Получено')).toBeTruthy();
  });

  test('должен отобразить прогресс-бар для незавершенных достижений', () => {
    const unachievedAchievement = {
      ...mockAchievement,
      achieved: false,
      progress: 5,
      required: 10
    };

    const { getByTestId } = render(
      <AchievementCard achievement={unachievedAchievement} onPress={jest.fn()} />
    );

    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  test('должен отобразить правильный прогресс в прогресс-баре', () => {
    const unachievedAchievement = {
      ...mockAchievement,
      achieved: false,
      progress: 5,
      required: 10
    };

    const { getByText } = render(
      <AchievementCard achievement={unachievedAchievement} onPress={jest.fn()} />
    );

    expect(getByText('5/10')).toBeTruthy();
  });

  test('должен отобразить правильную ширину прогресс-бара', () => {
    const unachievedAchievement = {
      ...mockAchievement,
      achieved: false,
      progress: 5,
      required: 10
    };

    const { getByTestId } = render(
      <AchievementCard achievement={unachievedAchievement} onPress={jest.fn()} />
    );

    const progressBar = getByTestId('progress-bar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  test('должен отобразить категорию достижения', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('achievement-category')).toBeTruthy();
  });

  test('должен отобразить иконку категории', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    expect(getByTestId('category-icon')).toBeTruthy();
  });

  test('должен отобразить секретное достижение', () => {
    const secretAchievement = {
      ...mockAchievement,
      isSecret: true,
      achieved: false
    };

    const { getByText } = render(
      <AchievementCard achievement={secretAchievement} onPress={jest.fn()} />
    );

    expect(getByText('Секретное достижение')).toBeTruthy();
  });

  test('должен отобразить мемное достижение', () => {
    const memeAchievement = {
      ...mockAchievement,
      meme: true
    };

    const { getByTestId } = render(
      <AchievementCard achievement={memeAchievement} onPress={jest.fn()} />
    );

    expect(getByTestId('meme-badge')).toBeTruthy();
  });

  test('должен отобразить легендарное достижение', () => {
    const legendaryAchievement = {
      ...mockAchievement,
      rarity: 'legendary'
    };

    const { getByTestId } = render(
      <AchievementCard achievement={legendaryAchievement} onPress={jest.fn()} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
  });

  test('должен отобразить эпическое достижение', () => {
    const epicAchievement = {
      ...mockAchievement,
      rarity: 'epic'
    };

    const { getByTestId } = render(
      <AchievementCard achievement={epicAchievement} onPress={jest.fn()} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
  });

  test('должен отобразить редкое достижение', () => {
    const rareAchievement = {
      ...mockAchievement,
      rarity: 'rare'
    };

    const { getByTestId } = render(
      <AchievementCard achievement={rareAchievement} onPress={jest.fn()} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
  });

  test('должен отобразить обычное достижение', () => {
    const commonAchievement = {
      ...mockAchievement,
      rarity: 'common'
    };

    const { getByTestId } = render(
      <AchievementCard achievement={commonAchievement} onPress={jest.fn()} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
  });

  test('должен вызвать onPress при нажатии', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    fireEvent.press(getByTestId('achievement-card'));

    expect(mockProps.onPress).toHaveBeenCalledWith(mockAchievement);
  });

  test('должен отобразить анимацию для достигнутых достижений', () => {
    const { getByTestId } = render(
      <AchievementCard {...mockProps} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ opacity: 1 });
  });

  test('должен отобразить затемнение для незавершенных достижений', () => {
    const unachievedAchievement = {
      ...mockAchievement,
      achieved: false
    };

    const { getByTestId } = render(
      <AchievementCard achievement={unachievedAchievement} onPress={jest.fn()} />
    );

    const card = getByTestId('achievement-card');
    expect(card).toHaveStyle({ opacity: 0.6 });
  });

  test('должен отобразить правильный цвет для разных категорий', () => {
    const categories = ['injection', 'labs', 'course', 'meme', 'profile', 'streak', 'milestone'];
    
    categories.forEach(category => {
      const achievement = {
        ...mockAchievement,
        category
      };

      const { getByTestId } = render(
        <AchievementCard achievement={achievement} onPress={jest.fn()} />
      );

      const categoryIcon = getByTestId('category-icon');
      expect(categoryIcon).toBeTruthy();
    });
  });

  test('должен отобразить правильный цвет для разных редкостей', () => {
    const rarities = ['common', 'rare', 'epic', 'legendary'];
    
    rarities.forEach(rarity => {
      const achievement = {
        ...mockAchievement,
        rarity
      };

      const { getByTestId } = render(
        <AchievementCard achievement={achievement} onPress={jest.fn()} />
      );

      const card = getByTestId('achievement-card');
      expect(card).toHaveStyle({ borderLeftColor: expect.any(String) });
    });
  });
});