import { supabase } from './supabase';
// import { achievementsList, Achievement } from '../data/achievementsList';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  type: 'serious' | 'meme';
  icon: string;
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
  return [];
} 