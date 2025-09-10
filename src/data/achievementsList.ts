export type AchievementCategory = 'injection' | 'labs' | 'course' | 'meme' | 'profile' | 'streak' | 'milestone';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  isSecret?: boolean;
  required?: number;
  progress?: number;
  achieved?: boolean;
  meme?: boolean;
}

export const achievementsList: Achievement[] = [
  // Профиль
  {
    id: 'first_step',
    name: 'Первый шаг',
    description: 'Зарегистрировались в приложении',
    category: 'profile',
    icon: 'user-plus',
    rarity: 'common',
    points: 10,
  },
  {
    id: 'perfect_profile',
    name: 'Идеальный профиль',
    description: 'Заполнили все поля профиля',
    category: 'profile',
    icon: 'user-check',
    rarity: 'rare',
    points: 50,
  },
  {
    id: 'meme_nickname',
    name: 'Мемный ник',
    description: 'Установили никнейм "admin"',
    category: 'meme',
    icon: 'grin-tongue',
    rarity: 'epic',
    points: 100,
    isSecret: true,
  },
  {
    id: 'biohacker',
    name: 'Биохакер',
    description: 'Написали био длиннее 100 символов',
    category: 'profile',
    icon: 'dna',
    rarity: 'rare',
    points: 30,
  },

  // Курсы
  {
    id: 'first_course',
    name: 'Первый курс',
    description: 'Создали первый курс',
    category: 'course',
    icon: 'play-circle',
    rarity: 'common',
    points: 25,
  },
  {
    id: 'experienced_courseman',
    name: 'Опытный курсант',
    description: 'Создали 5 курсов',
    category: 'course',
    icon: 'graduation-cap',
    rarity: 'rare',
    points: 100,
    required: 5,
  },
  {
    id: 'diverse',
    name: 'Разносторонний',
    description: 'Создали курсы 3 разных типов',
    category: 'course',
    icon: 'layer-group',
    rarity: 'epic',
    points: 150,
    required: 3,
  },
  {
    id: 'course_master',
    name: 'Мастер курсов',
    description: 'Создали 10 курсов',
    category: 'course',
    icon: 'crown',
    rarity: 'legendary',
    points: 300,
    required: 10,
  },

  // Инъекции
  {
    id: 'first_injection',
    name: 'Первая инъекция',
    description: 'Записали первую инъекцию',
    category: 'injection',
    icon: 'syringe',
    rarity: 'common',
    points: 20,
  },
  {
    id: 'ten_injections',
    name: '10 инъекций',
    description: 'Записали 10 инъекций',
    category: 'injection',
    icon: 'syringe',
    rarity: 'rare',
    points: 75,
    required: 10,
  },
  {
    id: 'injection_master',
    name: 'Мастер инъекций',
    description: 'Записали 100 инъекций',
    category: 'injection',
    icon: 'syringe',
    rarity: 'legendary',
    points: 500,
    required: 100,
  },
  {
    id: 'tablet_start',
    name: 'Таблеточный старт',
    description: 'Записали прием таблеток',
    category: 'injection',
    icon: 'pills',
    rarity: 'common',
    points: 15,
  },

  // Анализы
  {
    id: 'caring',
    name: 'Заботливый',
    description: 'Добавили первый анализ',
    category: 'labs',
    icon: 'vial',
    rarity: 'common',
    points: 30,
  },
  {
    id: 'lab_rat',
    name: 'Лабораторная крыса',
    description: 'Добавили 10 анализов',
    category: 'labs',
    icon: 'flask',
    rarity: 'rare',
    points: 100,
    required: 10,
  },
  {
    id: 'health_monitor',
    name: 'Монитор здоровья',
    description: 'Добавили 50 анализов',
    category: 'labs',
    icon: 'heartbeat',
    rarity: 'epic',
    points: 250,
    required: 50,
  },

  // Стрики
  {
    id: 'week_streak',
    name: 'Неделя без пропусков',
    description: '7 дней подряд записывали действия',
    category: 'streak',
    icon: 'fire',
    rarity: 'epic',
    points: 200,
    required: 7,
  },
  {
    id: 'month_streak',
    name: 'Месяц дисциплины',
    description: '30 дней подряд записывали действия',
    category: 'streak',
    icon: 'fire',
    rarity: 'legendary',
    points: 1000,
    required: 30,
  },

  // Вехи
  {
    id: 'night_owl',
    name: 'Ночной совёнок',
    description: 'Создали курс между 2 и 6 утра',
    category: 'milestone',
    icon: 'moon',
    rarity: 'rare',
    points: 50,
  },
  {
    id: 'early_bird',
    name: 'Ранняя пташка',
    description: 'Создали курс между 5 и 7 утра',
    category: 'milestone',
    icon: 'sun',
    rarity: 'rare',
    points: 50,
  },
  {
    id: 'weekend_warrior',
    name: 'Выходной воин',
    description: 'Создали курс в выходные',
    category: 'milestone',
    icon: 'calendar-week',
    rarity: 'common',
    points: 25,
  },

  // Мемные достижения
  {
    id: 'steroid_guru',
    name: 'Гуру стероидов',
    description: 'Изучили всю базу знаний',
    category: 'meme',
    icon: 'brain',
    rarity: 'epic',
    points: 300,
    meme: true,
  },
  {
    id: 'data_hoarder',
    name: 'Собиратель данных',
    description: 'Записали 1000 действий',
    category: 'meme',
    icon: 'database',
    rarity: 'legendary',
    points: 1000,
    required: 1000,
    meme: true,
  },
  {
    id: 'perfectionist',
    name: 'Перфекционист',
    description: 'Заполнили все поля профиля и создали 5 курсов',
    category: 'meme',
    icon: 'star',
    rarity: 'legendary',
    points: 500,
    meme: true,
  },
];

export const getAchievementsByCategory = (category: AchievementCategory) => {
  return achievementsList.filter(achievement => achievement.category === category);
};

export const getAchievementById = (id: string) => {
  return achievementsList.find(achievement => achievement.id === id);
};

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return '#9CA3AF';
    case 'rare': return '#3B82F6';
    case 'epic': return '#8B5CF6';
    case 'legendary': return '#F59E0B';
    default: return '#9CA3AF';
  }
};

export const getRarityLabel = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'Обычное';
    case 'rare': return 'Редкое';
    case 'epic': return 'Эпическое';
    case 'legendary': return 'Легендарное';
    default: return 'Обычное';
  }
};