import { LocalStorageService } from './localStorage';
import { Achievement, UserAchievement } from './types';
import { achievementsList } from '../data/achievementsList';

export class AchievementsService {
  static async initialize(): Promise<void> {
    await LocalStorageService.getItem('achievements' as any);
  }
  // Получение всех достижений
  static async getAllAchievements(): Promise<Achievement[]> {
    const stored = await LocalStorageService.getItem<Achievement[]>('achievements' as any);
    return stored || achievementsList as any;
  }

  // Получение достижений пользователя
  static async getUserAchievements(): Promise<UserAchievement[]> {
    return await LocalStorageService.getItem<UserAchievement[]>('user_achievements' as any) || [];
  }

  // Получение достижений с прогрессом
  static async getAchievementsWithProgress(): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const allAchievements = await this.getAllAchievements();
    const userAchievements = await this.getUserAchievements();
    const userAchievementIds = userAchievements.map(ua => ua.achievement_id);

    // Получаем статистику пользователя для расчета прогресса
    const stats = await this.getUserStatistics();

    return allAchievements.map(achievement => {
      const achieved = userAchievementIds.includes(achievement.id);
      const progress = this.calculateProgress(achievement, stats);
      
      return {
        ...achievement,
        achieved: achieved || progress >= (achievement.required || 1),
        progress,
      };
    });
  }

  // Получение статистики пользователя
  private static async getUserStatistics(): Promise<{
    courses: any[];
    actions: any[];
    labs: any[];
    profile: any;
  }> {
    const [courses, actions, labs, profile] = await Promise.all([
      LocalStorageService.getItem('courses' as any) || [],
      LocalStorageService.getItem('actions' as any) || [],
      LocalStorageService.getItem('labs' as any) || [],
      LocalStorageService.getProfile(),
    ]);

    return { courses, actions, labs, profile };
  }

  // Расчет прогресса достижения
  private static calculateProgress(achievement: Achievement, stats: any): number {
    const { courses, actions, labs, profile } = stats;

    switch (achievement.id) {
      case 'first_step':
        return (stats.actions && stats.actions.length > 0) ? 1 : 0;

      case 'perfect_profile':
        return stats.profile && stats.profile.name && stats.profile.email ? 1 : 0;

      case 'meme_nickname':
        return profile?.username?.toLowerCase() === 'admin' ? 1 : 0;

      case 'biohacker':
        return profile?.bio && profile.bio.length > 100 ? 1 : 0;

      case 'first_course':
        return courses && courses.length >= 1 ? 1 : 0;

      case 'experienced_courseman':
        return Math.min(courses?.length || 0, 5);

      case 'diverse':
        if (courses) {
          const uniqueTypes = new Set(courses.map((c: any) => c.type));
          return Math.min(uniqueTypes.size, 3);
        }
        return 0;

      case 'course_master':
        return Math.min(courses?.length || 0, 10);

      case 'first_injection':
        return actions && actions.some((a: any) => a.type === 'injection') ? 1 : 0;

      case 'ten_injections':
        return Math.min(actions?.filter((a: any) => a.type === 'injection').length || 0, 10);

      case 'injection_master':
        return Math.min(actions?.filter((a: any) => a.type === 'injection').length || 0, 100);

      case 'tablet_start':
        return actions && actions.some((a: any) => a.type === 'tablet') ? 1 : 0;

      case 'caring':
        return labs && labs.length >= 1 ? 1 : 0;

      case 'lab_rat':
        return Math.min(labs?.length || 0, 10);

      case 'health_monitor':
        return Math.min(labs?.length || 0, 50);

      case 'week_streak':
        if (actions && actions.length > 0) {
          const days = actions.map((a: any) => a.timestamp.slice(0, 10));
          const uniqueDays = Array.from(new Set(days)).sort();
          let maxStreak = 1, curStreak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const prev = new Date(uniqueDays[i - 1]);
            const curr = new Date(uniqueDays[i]);
            if ((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1) {
              curStreak++;
              maxStreak = Math.max(maxStreak, curStreak);
            } else {
              curStreak = 1;
            }
          }
          return Math.min(maxStreak, 7);
        }
        return 0;

      case 'month_streak':
        if (actions && actions.length > 0) {
          const days = actions.map((a: any) => a.timestamp.slice(0, 10));
          const uniqueDays = Array.from(new Set(days)).sort();
          let maxStreak = 1, curStreak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const prev = new Date(uniqueDays[i - 1]);
            const curr = new Date(uniqueDays[i]);
            if ((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1) {
              curStreak++;
              maxStreak = Math.max(maxStreak, curStreak);
            } else {
              curStreak = 1;
            }
          }
          return Math.min(maxStreak, 30);
        }
        return 0;

      case 'night_owl':
        return courses && courses.some((c: any) => {
          const hour = new Date(c.created_at).getHours();
          return hour >= 2 && hour < 6;
        }) ? 1 : 0;

      case 'early_bird':
        return courses && courses.some((c: any) => {
          const hour = new Date(c.created_at).getHours();
          return hour >= 5 && hour < 7;
        }) ? 1 : 0;

      case 'weekend_warrior':
        return courses && courses.some((c: any) => {
          const day = new Date(c.created_at).getDay();
          return day === 0 || day === 6;
        }) ? 1 : 0;

      case 'data_hoarder':
        return Math.min(actions?.length || 0, 1000);

      case 'perfectionist':
        const hasPerfectProfile = profile && profile.full_name && profile.username && 
                                profile.avatar_url && profile.date_of_birth && 
                                profile.city && profile.bio && profile.gender;
        const hasEnoughCourses = courses && courses.length >= 5;
        return (hasPerfectProfile && hasEnoughCourses) ? 1 : 0;

      default:
        return 0;
    }
  }

  // Проверка и выдача достижений
  static async checkAndGrantAchievements(): Promise<Achievement[]> {
    const achievements = await this.getAchievementsWithProgress();
    const userAchievements = await this.getUserAchievements();
    const userAchievementIds = userAchievements.map(ua => ua.achievement_id);

    const newAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      if (!achievement.achieved && achievement.progress >= (achievement.required || 1)) {
        // Выдаем достижение
        const userAchievement: UserAchievement = {
          id: this.generateUserAchievementId(),
          achievement_id: achievement.id,
          achieved_at: new Date().toISOString(),
          progress: achievement.progress,
        };

        const existing = (await this.getUserAchievements()) as any[];
        await LocalStorageService.setItem('user_achievements' as any, [...existing, userAchievement]);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  // APIs expected by tests
  static async getAchievements(userId?: string) {
    return (await this.getUserAchievements()) as any;
  }

  static async addUserAchievement(userAchievement: any) {
    const existing = await this.getUserAchievements();
    if (existing.some(a => a.achievement_id === userAchievement.achievement_id)) {
      return { success: false, error: 'already earned' };
    }
    await LocalStorageService.setItem('user_achievements' as any, [...existing, userAchievement]);
    return { success: true };
  }

  static async checkAndGrantProfileAchievements() {
    return await this.checkAndGrantAchievements();
  }

  static async checkAndGrantActionAchievements() {
    return await this.checkAndGrantAchievements();
  }

  // Получение достижений по категории
  static async getAchievementsByCategory(category: Achievement['category']): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const achievements = await this.getAchievementsWithProgress();
    return achievements.filter(achievement => achievement.category === category);
  }

  // Получение статистики достижений
  static async getAchievementsStatistics(): Promise<{
    total: number;
    achieved: number;
    byCategory: Record<string, { total: number; achieved: number }>;
    byRarity: Record<string, { total: number; achieved: number }>;
    totalPoints: number;
    achievedPoints: number;
  }> {
    const achievements = await this.getAchievementsWithProgress();

    const stats = {
      total: achievements.length,
      achieved: achievements.filter(a => a.achieved).length,
      byCategory: {} as Record<string, { total: number; achieved: number }>,
      byRarity: {} as Record<string, { total: number; achieved: number }>,
      totalPoints: 0,
      achievedPoints: 0,
    };

    achievements.forEach(achievement => {
      // По категориям
      if (!stats.byCategory[achievement.category]) {
        stats.byCategory[achievement.category] = { total: 0, achieved: 0 };
      }
      stats.byCategory[achievement.category].total++;
      if (achievement.achieved) {
        stats.byCategory[achievement.category].achieved++;
      }

      // По редкости
      if (!stats.byRarity[achievement.rarity]) {
        stats.byRarity[achievement.rarity] = { total: 0, achieved: 0 };
      }
      stats.byRarity[achievement.rarity].total++;
      if (achievement.achieved) {
        stats.byRarity[achievement.rarity].achieved++;
      }

      // Очки
      stats.totalPoints += achievement.points;
      if (achievement.achieved) {
        stats.achievedPoints += achievement.points;
      }
    });

    return stats;
  }

  // Получение последних достижений
  static async getRecentAchievements(limit: number = 5): Promise<UserAchievement[]> {
    const userAchievements = await this.getUserAchievements();
    return userAchievements
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
      .slice(0, limit);
  }

  // Поиск достижений
  static async searchAchievements(query: string): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const achievements = await this.getAchievementsWithProgress();
    const lowercaseQuery = query.toLowerCase();
    
    return achievements.filter(achievement => 
      achievement.name.toLowerCase().includes(lowercaseQuery) ||
      achievement.description.toLowerCase().includes(lowercaseQuery) ||
      achievement.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Получение достижения по ID
  static async getAchievementById(id: string): Promise<(Achievement & { achieved: boolean; progress: number }) | null> {
    const achievements = await this.getAchievementsWithProgress();
    return achievements.find(achievement => achievement.id === id) || null;
  }

  // Получение достижений по редкости
  static async getAchievementsByRarity(rarity: Achievement['rarity']): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const achievements = await this.getAchievementsWithProgress();
    return achievements.filter(achievement => achievement.rarity === rarity);
  }

  // Получение секретных достижений
  static async getSecretAchievements(): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const achievements = await this.getAchievementsWithProgress();
    return achievements.filter(achievement => achievement.isSecret);
  }

  // Получение мемных достижений
  static async getMemeAchievements(): Promise<Array<Achievement & { achieved: boolean; progress: number }>> {
    const achievements = await this.getAchievementsWithProgress();
    return achievements.filter(achievement => achievement.meme);
  }

  // Генерация ID пользовательского достижения
  private static generateUserAchievementId(): string {
    return 'user_achievement_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}