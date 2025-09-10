// Основные типы данных для приложения

export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  city?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  created_at: string;
  updated_at: string;
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    units: 'metric' | 'imperial';
    notifications: boolean;
    biometric_auth: boolean;
  };
}

export interface Course {
  id: string;
  name: string;
  type: 'bulking' | 'cutting' | 'recomp' | 'pct' | 'bridge' | 'cruise';
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  durationWeeks: number;
  compounds: Compound[];
  schedule: CourseSchedule;
  notes?: string;
  goals?: string[];
  created_at: string;
  updated_at: string;
}

export interface Compound {
  key: string;
  label: string;
  form: 'Injection' | 'Tablet' | 'Capsule' | 'Gel' | 'Patch';
  concentration?: number;
  unit?: string;
  recommendedDose?: number;
  doseUnit?: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dose: number;
  unit: string;
  startWeek?: number;
  endWeek?: number;
}

export interface CourseSchedule {
  [compoundKey: string]: {
    timesPerDay: number;
    timesPerWeek: number;
    injectionSites: string[];
    notes?: string;
  };
}

export interface Lab {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  category: 'hormone' | 'blood' | 'vitamin' | 'liver' | 'kidney' | 'lipid' | 'muscle';
  date: string;
  notes?: string;
  created_at: string;
}

export interface Action {
  id: string;
  type: 'injection' | 'tablet' | 'note' | 'measurement' | 'photo';
  timestamp: string;
  details: string; // JSON string with action-specific data
  course_id?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'injection' | 'tablet' | 'lab' | 'measurement' | 'general';
  time: string;
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
  course_id?: string;
  created_at: string;
}

export interface Achievement {
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
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  achieved_at: string;
  progress?: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  units: 'metric' | 'imperial';
  notifications: boolean;
  biometric_auth: boolean;
  auto_backup: boolean;
  data_retention_days: number;
  privacy_mode: boolean;
  analytics_enabled: boolean;
}

export interface Statistics {
  total_courses: number;
  total_injections: number;
  total_tablets: number;
  total_labs: number;
  total_actions: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  achievements_unlocked: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ExportData {
  version: string;
  exportDate: string;
  data: {
    profile?: Profile;
    courses: Course[];
    labs: Lab[];
    actions: Action[];
    reminders: Reminder[];
    achievements: UserAchievement[];
    settings: Settings;
    statistics: Statistics;
  };
}

// Типы для аналитики
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

export interface AppUsage {
  sessions: number;
  totalTime: number; // в минутах
  lastUsed: string;
  features: {
    [feature: string]: number; // количество использований
  };
}

// Типы для уведомлений
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime: string;
  type: 'reminder' | 'achievement' | 'general';
}

// Типы для резервного копирования
export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  created_at: string;
  type: 'manual' | 'auto';
  version: string;
}

// Типы для миграций данных
export interface DataMigration {
  fromVersion: string;
  toVersion: string;
  migration: (data: any) => any;
}

// Утилитарные типы
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;