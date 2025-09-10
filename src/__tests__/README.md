# Тесты Steroid Tracker

Этот каталог содержит полный набор тестов для приложения Steroid Tracker.

## Структура тестов

### 📁 services/
Тесты для всех сервисов приложения:
- `localStorage.test.ts` - Тесты локального хранилища
- `auth.test.ts` - Тесты аутентификации
- `courses.test.ts` - Тесты курсов
- `actions.test.ts` - Тесты действий
- `labs.test.ts` - Тесты анализов
- `achievements.test.ts` - Тесты достижений
- `analytics.test.ts` - Тесты аналитики
- `backup.test.ts` - Тесты резервного копирования

### 📁 screens/
Тесты для всех экранов приложения:
- `DashboardScreen.test.tsx` - Тесты главного экрана
- `LogNoteScreen.test.tsx` - Тесты экрана добавления заметок
- `AllAchievementsScreen.test.tsx` - Тесты экрана достижений
- `SettingsScreen.test.tsx` - Тесты экрана настроек

### 📁 components/
Тесты для компонентов:
- `QuickActionsPanel.test.tsx` - Тесты панели быстрых действий
- `AchievementCard.test.tsx` - Тесты карточки достижения
- `ProgressChart.test.tsx` - Тесты графика прогресса

### 📁 integration/
Интеграционные тесты:
- `UserFlow.test.tsx` - Тесты пользовательских сценариев
- `DataFlow.test.tsx` - Тесты потоков данных

### 📁 performance/
Тесты производительности:
- `Performance.test.tsx` - Тесты производительности

## Запуск тестов

### Все тесты
```bash
npm test
```

### Тесты в режиме наблюдения
```bash
npm run test:watch
```

### Тесты с покрытием
```bash
npm run test:coverage
```

### Тесты для CI
```bash
npm run test:ci
```

### Тесты по категориям
```bash
# Только сервисы
npm run test:services

# Только экраны
npm run test:screens

# Только компоненты
npm run test:components

# Только интеграционные тесты
npm run test:integration

# Только тесты производительности
npm run test:performance
```

## Покрытие кода

Целевое покрытие кода:
- **Ветки**: 80%
- **Функции**: 80%
- **Строки**: 80%
- **Операторы**: 80%

## Настройка тестов

### Jest конфигурация
Файл `jest.config.js` содержит настройки Jest:
- Preset: `jest-expo`
- Setup файл: `src/__tests__/setup.ts`
- Покрытие кода
- Исключения из покрытия
- Таймауты

### Setup файл
Файл `src/__tests__/setup.ts` содержит:
- Настройки тестового окружения
- Моки для нативных модулей
- Глобальные моки
- Настройки для React Native Testing Library

## Типы тестов

### Unit тесты
Тестируют отдельные функции и компоненты в изоляции.

### Integration тесты
Тестируют взаимодействие между различными частями приложения.

### Performance тесты
Тестируют производительность приложения:
- Время загрузки
- Обработка больших данных
- Использование памяти
- Производительность анимаций

### E2E тесты
Тестируют полные пользовательские сценарии.

## Моки

### Нативные модули
Все нативные модули замокированы в setup файле:
- `expo-secure-store`
- `@react-native-async-storage/async-storage`
- `expo-local-authentication`
- `expo-file-system`
- `expo-sharing`
- `expo-notifications`
- `react-native-reanimated`
- `react-native-gifted-charts`
- `react-native-paper`
- `@react-navigation/native`
- `react-native-safe-area-context`

### Сервисы
Сервисы мокированы в соответствующих тестах:
- `AuthService`
- `CoursesService`
- `ActionsService`
- `LabsService`
- `AchievementsService`
- `AnalyticsService`
- `LocalStorageService`

## Лучшие практики

### Именование тестов
- Используйте описательные имена
- Группируйте тесты по функциональности
- Используйте `describe` для группировки

### Структура тестов
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Настройка перед каждым тестом
  });

  describe('Feature', () => {
    test('should do something', () => {
      // Тест
    });
  });
});
```

### Моки
- Используйте `jest.clearAllMocks()` в `beforeEach`
- Мокайте только то, что необходимо
- Используйте реалистичные данные в моках

### Асинхронные тесты
- Используйте `async/await`
- Используйте `waitFor` для ожидания элементов
- Используйте `act` для обновлений состояния

### Очистка
- Очищайте моки после каждого теста
- Размонтируйте компоненты
- Очищайте таймеры

## Отладка тестов

### Запуск одного теста
```bash
npm test -- --testNamePattern="test name"
```

### Запуск тестов в файле
```bash
npm test -- src/__tests__/services/auth.test.ts
```

### Отладочный режим
```bash
npm test -- --verbose
```

### Покрытие конкретного файла
```bash
npm test -- --coverage --collectCoverageFrom="src/services/auth.ts"
```

## CI/CD

### GitHub Actions
Файл `.github/workflows/test.yml` содержит:
- Установку зависимостей
- Запуск тестов
- Загрузку покрытия кода
- Проверку качества кода

### Требования
- Node.js 18+
- npm
- Jest
- React Native Testing Library

## Проблемы и решения

### Частые проблемы
1. **Таймауты**: Увеличьте `testTimeout` в конфигурации
2. **Моки**: Проверьте правильность моков
3. **Асинхронность**: Используйте `waitFor` и `act`
4. **Память**: Очищайте ресурсы после тестов

### Отладка
1. Используйте `console.log` для отладки
2. Проверьте моки
3. Проверьте асинхронные операции
4. Используйте `--verbose` флаг

## Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Jest Matchers](https://github.com/testing-library/jest-native)
- [Expo Testing](https://docs.expo.dev/guides/testing-with-jest/)