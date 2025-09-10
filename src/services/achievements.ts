import { supabase } from './supabase';
import { achievementsList, Achievement } from '../data/achievementsList';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: 'injection' | 'labs' | 'course' | 'meme' | 'profile' | 'streak' | 'milestone';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  isSecret?: boolean;
  required?: number;
  progress?: number;
  achieved?: boolean;
  meme?: boolean;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
};

export async function getAchievements(user_id: string) {
  return await supabase
    .from('user_achievements')
    .select('*, achievement:achievement_id(*)')
    .eq('user_id', user_id);
}

export async function getAllAchievements() {
  return await supabase.from('achievements').select('*');
}

export async function addUserAchievement(user_id: string, achievement_id: string) {
  return await supabase.from('user_achievements').insert([{ user_id, achievement_id }]);
}

// Проверка и выдача достижений, связанных с профилем
export async function checkAndGrantProfileAchievements(user_id: string, profile: { username?: string; bio?: string }) {
  // Получаем все достижения пользователя
  const { data: userAchData } = await getAchievements(user_id);
  const userAchievementIds = userAchData?.map((ua: any) => ua.achievement_id) || [];

  // Получаем все достижения
  const { data: allAchData } = await getAllAchievements();
  if (!allAchData) return;

  // Массив для выдачи
  const toGrant: string[] = [];

  // Мемный ник
  const memeNick = allAchData.find((a: any) => a.name === 'Мемный ник');
  if (memeNick && profile.username && profile.username.toLowerCase() === 'admin' && !userAchievementIds.includes(memeNick.id)) {
    toGrant.push(memeNick.id);
  }

  // Биохакер
  const biohacker = allAchData.find((a: any) => a.name === 'Биохакер');
  if (biohacker && profile.bio && profile.bio.length > 100 && !userAchievementIds.includes(biohacker.id)) {
    toGrant.push(biohacker.id);
  }

  // Первый шаг (регистрация)
  const firstStep = allAchData.find((a: any) => a.name === 'Первый шаг');
  if (firstStep && !userAchievementIds.includes(firstStep.id)) {
    toGrant.push(firstStep.id);
  }

  // Выдаём все подходящие достижения
  for (const achId of toGrant) {
    await addUserAchievement(user_id, achId);
  }
}

export async function checkAndGrantActionAchievements(user_id: string, profile?: any) {
  const { data: userAchData } = await getAchievements(user_id);
  const userAchievementIds = userAchData?.map((ua: any) => ua.achievement_id) || [];
  const { data: allAchData } = await getAllAchievements();
  if (!allAchData) return [];

  // Получаем курсы, действия, анализы
  const { data: courses } = await supabase.from('courses').select('*').eq('user_id', user_id);
  const { data: actions } = await supabase.from('actions').select('*').eq('user_id', user_id);
  const { data: labs } = await supabase.from('labs').select('*').eq('user_id', user_id);

  const toGrant: string[] = [];
  const newAchievements: any[] = [];

  // Первый курс
  const firstCourse = allAchData.find((a: any) => a.name === 'Первый курс');
  if (firstCourse && courses && courses.length >= 1 && !userAchievementIds.includes(firstCourse.id)) {
    toGrant.push(firstCourse.id);
    newAchievements.push(firstCourse);
  }

  // 5 курсов
  const fiveCourses = allAchData.find((a: any) => a.name === 'Опытный курсант');
  if (fiveCourses && courses && courses.length >= 5 && !userAchievementIds.includes(fiveCourses.id)) {
    toGrant.push(fiveCourses.id);
    newAchievements.push(fiveCourses);
  }

  // 3 разных типа курсов
  const diverse = allAchData.find((a: any) => a.name === 'Разносторонний');
  if (diverse && courses && new Set(courses.map((c: any) => c.type)).size >= 3 && !userAchievementIds.includes(diverse.id)) {
    toGrant.push(diverse.id);
    newAchievements.push(diverse);
  }

  // 10 инъекций
  const tenInj = allAchData.find((a: any) => a.name === '10 инъекций');
  if (
    tenInj &&
    actions &&
    actions.filter((a: any) => a.type === 'injection').length >= 10 &&
    !userAchievementIds.includes(tenInj.id)
  ) {
    toGrant.push(tenInj.id);
    newAchievements.push(tenInj);
  }

  // Таблеточный старт
  const tabletStart = allAchData.find((a: any) => a.name === 'Таблеточный старт');
  if (
    tabletStart &&
    actions &&
    actions.some((a: any) => a.type === 'tablet') &&
    !userAchievementIds.includes(tabletStart.id)
  ) {
    toGrant.push(tabletStart.id);
    newAchievements.push(tabletStart);
  }

  // Заботливый (анализ)
  const caring = allAchData.find((a: any) => a.name === 'Заботливый');
  if (caring && labs && labs.length > 0 && !userAchievementIds.includes(caring.id)) {
    toGrant.push(caring.id);
    newAchievements.push(caring);
  }

  // Ночной совёнок
  const nightOwl = allAchData.find((a: any) => a.name === 'Ночной совёнок');
  if (
    nightOwl &&
    courses &&
    courses.some((c: any) => {
      const hour = new Date(c.created_at).getHours();
      return hour >= 2 && hour < 6;
    }) &&
    !userAchievementIds.includes(nightOwl.id)
  ) {
    toGrant.push(nightOwl.id);
    newAchievements.push(nightOwl);
  }

  // streak (7 дней подряд есть действия)
  const streak = allAchData.find((a: any) => a.name === 'Неделя без пропусков');
  if (streak && actions && actions.length > 0 && !userAchievementIds.includes(streak.id)) {
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
    if (maxStreak >= 7) {
      toGrant.push(streak.id);
      newAchievements.push(streak);
    }
  }

  // Идеальный профиль (все поля заполнены)
  const perfectProfile = allAchData.find((a: any) => a.name === 'Идеальный профиль');
  if (
    perfectProfile &&
    profile &&
    profile.full_name && profile.username && profile.avatar_url && profile.date_of_birth && profile.city && profile.bio && profile.gender &&
    !userAchievementIds.includes(perfectProfile.id)
  ) {
    toGrant.push(perfectProfile.id);
    newAchievements.push(perfectProfile);
  }

  for (const achId of toGrant) {
    await addUserAchievement(user_id, achId);
  }
  return newAchievements;
}

export async function getUserAchievementsProgress(user_id: string) {
  const { data: userAchievements } = await getAchievements(user_id);
  const userAchievementIds = userAchievements?.map((ua: any) => ua.achievement_id) || [];

  // Получаем статистику пользователя
  const { data: courses } = await supabase.from('courses').select('*').eq('user_id', user_id);
  const { data: actions } = await supabase.from('actions').select('*').eq('user_id', user_id);
  const { data: labs } = await supabase.from('labs').select('*').eq('user_id', user_id);
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user_id).single();

  // Вычисляем прогресс для каждого достижения
  const achievementsWithProgress = achievementsList.map(achievement => {
    const achieved = userAchievementIds.includes(achievement.id);
    let progress = 0;

    switch (achievement.id) {
      case 'first_step':
        progress = 1;
        break;
      case 'perfect_profile':
        progress = profile && profile.full_name && profile.username && profile.avatar_url && 
                  profile.date_of_birth && profile.city && profile.bio && profile.gender ? 1 : 0;
        break;
      case 'meme_nickname':
        progress = profile?.username?.toLowerCase() === 'admin' ? 1 : 0;
        break;
      case 'biohacker':
        progress = profile?.bio && profile.bio.length > 100 ? 1 : 0;
        break;
      case 'first_course':
        progress = courses && courses.length >= 1 ? 1 : 0;
        break;
      case 'experienced_courseman':
        progress = courses ? Math.min(courses.length, 5) : 0;
        break;
      case 'diverse':
        if (courses) {
          const uniqueTypes = new Set(courses.map((c: any) => c.type));
          progress = Math.min(uniqueTypes.size, 3);
        }
        break;
      case 'course_master':
        progress = courses ? Math.min(courses.length, 10) : 0;
        break;
      case 'first_injection':
        progress = actions && actions.some((a: any) => a.type === 'injection') ? 1 : 0;
        break;
      case 'ten_injections':
        progress = actions ? Math.min(actions.filter((a: any) => a.type === 'injection').length, 10) : 0;
        break;
      case 'injection_master':
        progress = actions ? Math.min(actions.filter((a: any) => a.type === 'injection').length, 100) : 0;
        break;
      case 'tablet_start':
        progress = actions && actions.some((a: any) => a.type === 'tablet') ? 1 : 0;
        break;
      case 'caring':
        progress = labs && labs.length >= 1 ? 1 : 0;
        break;
      case 'lab_rat':
        progress = labs ? Math.min(labs.length, 10) : 0;
        break;
      case 'health_monitor':
        progress = labs ? Math.min(labs.length, 50) : 0;
        break;
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
          progress = Math.min(maxStreak, 7);
        }
        break;
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
          progress = Math.min(maxStreak, 30);
        }
        break;
      case 'night_owl':
        progress = courses && courses.some((c: any) => {
          const hour = new Date(c.created_at).getHours();
          return hour >= 2 && hour < 6;
        }) ? 1 : 0;
        break;
      case 'early_bird':
        progress = courses && courses.some((c: any) => {
          const hour = new Date(c.created_at).getHours();
          return hour >= 5 && hour < 7;
        }) ? 1 : 0;
        break;
      case 'weekend_warrior':
        progress = courses && courses.some((c: any) => {
          const day = new Date(c.created_at).getDay();
          return day === 0 || day === 6; // Воскресенье или суббота
        }) ? 1 : 0;
        break;
      case 'data_hoarder':
        progress = actions ? Math.min(actions.length, 1000) : 0;
        break;
      case 'perfectionist':
        const hasPerfectProfile = profile && profile.full_name && profile.username && 
                                profile.avatar_url && profile.date_of_birth && 
                                profile.city && profile.bio && profile.gender;
        const hasEnoughCourses = courses && courses.length >= 5;
        progress = (hasPerfectProfile && hasEnoughCourses) ? 1 : 0;
        break;
      default:
        progress = achieved ? 1 : 0;
    }

    return {
      ...achievement,
      progress,
      achieved,
    };
  });

  return achievementsWithProgress;
} 