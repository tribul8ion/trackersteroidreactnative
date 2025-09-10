# Руководство по миграции на автономную работу

## Обзор изменений

Приложение Steroid Tracker было полностью переработано для автономной работы без зависимости от внешних сервисов. Все данные теперь хранятся локально на устройстве пользователя.

## Основные изменения

### 1. Система хранения данных
- **Заменено:** Supabase → AsyncStorage
- **Новый файл:** `src/services/localStorage.ts`
- **Функции:** Полное управление данными через `LocalStorageService`

### 2. Аутентификация
- **Заменено:** Supabase Auth → Локальная аутентификация
- **Новый файл:** `src/services/auth.ts`
- **Функции:** 
  - Регистрация/вход без сервера
  - Биометрическая аутентификация
  - Безопасное хранение токенов

### 3. Сервисы данных
- **Новые файлы:**
  - `src/services/courses.ts` - управление курсами
  - `src/services/actions.ts` - управление действиями
  - `src/services/labs.ts` - управление анализами
  - `src/services/achievements.ts` - система достижений
  - `src/services/analytics.ts` - анонимная аналитика
  - `src/services/backup.ts` - резервное копирование

### 4. Типы данных
- **Новый файл:** `src/services/types.ts`
- **Содержит:** Все интерфейсы и типы для приложения

## Установка зависимостей

Добавьте в `package.json`:

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.5",
    "expo-secure-store": "~12.3.1",
    "expo-local-authentication": "~13.4.1",
    "expo-file-system": "~15.4.5",
    "expo-sharing": "~11.5.0"
  }
}
```

## Миграция экранов

### 1. Обновление импортов

**Было:**
```typescript
import { getUser } from '../services/auth';
import { getCourses } from '../services/courses';
import { getLabs } from '../services/labs';
import { getActions } from '../services/actions';
```

**Стало:**
```typescript
import { AuthService } from '../services/auth';
import { CoursesService } from '../services/courses';
import { LabsService } from '../services/labs';
import { ActionsService } from '../services/actions';
import { AnalyticsService } from '../services/analytics';
```

### 2. Обновление вызовов API

**Было:**
```typescript
const { data: userData } = await getUser();
const user_id = userData?.user?.id;
const { data: courses } = await getCourses(user_id);
```

**Стало:**
```typescript
const profile = AuthService.getCurrentUser();
const courses = await CoursesService.getCourses();
```

### 3. Добавление аналитики

```typescript
// Отслеживание экрана
await AnalyticsService.trackScreen('screen_name');

// Отслеживание действий
await AnalyticsService.trackUserAction('button_clicked', { button: 'create_course' });

// Отслеживание ошибок
await AnalyticsService.trackError('error_message', { context: 'screen_name' });
```

## Новые возможности

### 1. Резервное копирование
```typescript
import { BackupService } from '../services/backup';

// Создание резервной копии
const backup = await BackupService.createBackup();

// Восстановление из резервной копии
await BackupService.restoreBackup(backupId);

// Экспорт данных
await BackupService.exportToFile();
```

### 2. Аналитика использования
```typescript
import { AnalyticsService } from '../services/analytics';

// Получение статистики
const stats = await AnalyticsService.getUsageStatistics();

// Экспорт аналитики
const analytics = await AnalyticsService.exportAnalytics();
```

### 3. Система достижений
```typescript
import { AchievementsService } from '../services/achievements';

// Получение достижений с прогрессом
const achievements = await AchievementsService.getAchievementsWithProgress();

// Проверка новых достижений
const newAchievements = await AchievementsService.checkAndGrantAchievements();
```

## Удаление зависимостей

### 1. Удалить из package.json
```json
{
  "dependencies": {
    // Удалить эти пакеты:
    "@supabase/supabase-js": "^2.38.0",
    "react-native-url-polyfill": "^2.0.0"
  }
}
```

### 2. Удалить файлы
- `src/services/supabase.ts`
- `src/services/db.ts` (если есть)
- Все файлы с Supabase конфигурацией

### 3. Обновить App.tsx
```typescript
// Удалить импорты Supabase
// Добавить инициализацию локальных сервисов
```

## Настройка для продакшена

### 1. Анонимная аналитика
```typescript
// В настройках приложения
const settings = {
  analytics_enabled: true, // Включить анонимную аналитику
  privacy_mode: false,     // Отключить приватный режим
};
```

### 2. Автоматическое резервное копирование
```typescript
// В настройках приложения
const settings = {
  auto_backup: true,           // Включить автобэкап
  data_retention_days: 30,     // Хранить данные 30 дней
};
```

### 3. Биометрическая аутентификация
```typescript
// Включение биометрии
await AuthService.enableBiometricAuth();

// Проверка при запуске
const isEnabled = await AuthService.isBiometricEnabled();
```

## Преимущества автономной работы

1. **Скорость** - данные загружаются мгновенно
2. **Надежность** - работает без интернета
3. **Приватность** - данные не покидают устройство
4. **Производительность** - нет задержек сети
5. **Безопасность** - полный контроль над данными

## Обратная совместимость

Приложение автоматически:
- Создает локальные данные при первом запуске
- Мигрирует данные между версиями
- Сохраняет настройки пользователя
- Поддерживает экспорт/импорт данных

## Тестирование

1. Установите зависимости
2. Запустите приложение
3. Проверьте создание профиля
4. Создайте тестовый курс
5. Проверьте резервное копирование
6. Убедитесь в работе без интернета

## Поддержка

Все сервисы имеют обработку ошибок и логирование. При возникновении проблем проверьте:
- Консоль разработчика
- Локальное хранилище
- Настройки приложения
- Разрешения устройства