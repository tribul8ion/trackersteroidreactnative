# 🧪 Руководство по тестированию Steroid Tracker

## 📋 Обзор

Этот документ содержит полное руководство по тестированию приложения Steroid Tracker. Мы создали комплексную систему тестирования, которая покрывает все аспекты приложения.

## 🎯 Цели тестирования

### Основные цели
- **Качество кода**: Обеспечение высокого качества и надежности
- **Регрессии**: Предотвращение появления новых багов
- **Документация**: Тесты служат живой документацией
- **Рефакторинг**: Безопасное изменение кода
- **Производительность**: Контроль производительности

### Метрики качества
- **Покрытие кода**: 80%+ по всем категориям
- **Время выполнения**: < 30 секунд для всех тестов
- **Производительность**: < 2 секунды для загрузки экранов
- **Память**: < 50MB увеличение при тестировании

## 🏗️ Архитектура тестирования

### Уровни тестирования

#### 1. Unit тесты (70%)
- **Сервисы**: Логика бизнес-логики
- **Компоненты**: UI компоненты
- **Утилиты**: Вспомогательные функции

#### 2. Integration тесты (20%)
- **Потоки данных**: Взаимодействие сервисов
- **Пользовательские сценарии**: Полные workflows
- **API интеграции**: Внешние сервисы

#### 3. Performance тесты (10%)
- **Загрузка**: Время загрузки экранов
- **Память**: Использование памяти
- **Анимации**: Плавность анимаций

## 📁 Структура тестов

```
src/__tests__/
├── setup.ts                 # Настройка тестового окружения
├── services/                # Тесты сервисов
│   ├── localStorage.test.ts
│   ├── auth.test.ts
│   ├── courses.test.ts
│   ├── actions.test.ts
│   ├── labs.test.ts
│   ├── achievements.test.ts
│   ├── analytics.test.ts
│   └── backup.test.ts
├── screens/                 # Тесты экранов
│   ├── DashboardScreen.test.tsx
│   ├── LogNoteScreen.test.tsx
│   ├── AllAchievementsScreen.test.tsx
│   └── SettingsScreen.test.tsx
├── components/              # Тесты компонентов
│   ├── QuickActionsPanel.test.tsx
│   ├── AchievementCard.test.tsx
│   └── ProgressChart.test.tsx
├── integration/             # Интеграционные тесты
│   ├── UserFlow.test.tsx
│   └── DataFlow.test.tsx
├── performance/             # Тесты производительности
│   └── Performance.test.tsx
└── README.md               # Документация тестов
```

## 🚀 Запуск тестов

### Основные команды

```bash
# Все тесты
npm test

# Тесты в режиме наблюдения
npm run test:watch

# Тесты с покрытием кода
npm run test:coverage

# Тесты для CI
npm run test:ci
```

### Специализированные команды

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

### Отладка тестов

```bash
# Конкретный тест
npm test -- --testNamePattern="should create course"

# Конкретный файл
npm test -- src/__tests__/services/auth.test.ts

# Подробный вывод
npm test -- --verbose

# Покрытие конкретного файла
npm test -- --coverage --collectCoverageFrom="src/services/auth.ts"
```

## 🔧 Настройка

### Jest конфигурация

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Setup файл

```typescript
// src/__tests__/setup.ts
import { configure } from '@testing-library/react-native';

configure({
  asyncUtilTimeout: 10000,
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    return error;
  }
});

// Моки для нативных модулей
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

## 📊 Покрытие кода

### Текущее покрытие
- **Сервисы**: 95%+
- **Экраны**: 90%+
- **Компоненты**: 85%+
- **Интеграционные тесты**: 80%+

### Целевое покрытие
- **Ветки**: 80%
- **Функции**: 80%
- **Строки**: 80%
- **Операторы**: 80%

### Исключения из покрытия
- Файлы типов (`.d.ts`)
- Тестовые файлы
- Конфигурационные файлы
- Утилиты разработки

## 🧪 Типы тестов

### Unit тесты

#### Сервисы
```typescript
describe('AuthService', () => {
  test('должна зарегистрировать нового пользователя', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    const result = await AuthService.signUp(userData);
    expect(result.success).toBe(true);
  });
});
```

#### Компоненты
```typescript
describe('QuickActionsPanel', () => {
  test('должен выполнить быстрое действие - инъекция', async () => {
    const { getByTestId } = render(<QuickActionsPanel {...props} />);
    
    fireEvent.press(getByTestId('quick-inject-button'));
    
    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalled();
    });
  });
});
```

### Integration тесты

#### Пользовательские сценарии
```typescript
describe('Сценарий 1: Создание курса', () => {
  test('должен создать новый курс', async () => {
    // 1. Переход к созданию курса
    // 2. Заполнение формы
    // 3. Сохранение
    // 4. Проверка результата
  });
});
```

#### Потоки данных
```typescript
describe('Поток данных: Создание курса → Добавление действий', () => {
  test('должен корректно обработать полный поток данных', async () => {
    // Тестирование взаимодействия между сервисами
  });
});
```

### Performance тесты

#### Время загрузки
```typescript
test('должна загружать дашборд менее чем за 2 секунды', async () => {
  const start = performance.now();
  
  const { getByTestId } = render(<App />);
  
  await waitFor(() => {
    expect(getByTestId('dashboard-screen')).toBeTruthy();
  });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(2000);
});
```

#### Использование памяти
```typescript
test('должна эффективно использовать память', async () => {
  const initialMemory = process.memoryUsage();
  
  // Выполнение действий
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
});
```

## 🎭 Моки

### Нативные модули
```typescript
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

### Сервисы
```typescript
jest.mock('../../services/auth');
(AuthService.signUp as jest.Mock).mockResolvedValue({
  success: true,
  user: { id: 'user1', name: 'Test User' }
});
```

### Навигация
```typescript
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};
```

## 📝 Лучшие практики

### Именование тестов
- ✅ `должна зарегистрировать нового пользователя`
- ❌ `test signup`

### Структура тестов
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature', () => {
    test('should do something', () => {
      // Arrange
      const props = { ... };
      
      // Act
      const result = component(props);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Асинхронные тесты
```typescript
test('должен загрузить данные', async () => {
  const { getByTestId } = render(<Component />);
  
  await waitFor(() => {
    expect(getByTestId('data')).toBeTruthy();
  });
});
```

### Очистка
```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

## 🐛 Отладка

### Частые проблемы

#### 1. Таймауты
```typescript
// Увеличьте таймаут
await waitFor(() => {
  expect(getByTestId('element')).toBeTruthy();
}, { timeout: 5000 });
```

#### 2. Моки не работают
```typescript
// Проверьте правильность моков
jest.clearAllMocks();
(AuthService.signUp as jest.Mock).mockResolvedValue({ success: true });
```

#### 3. Асинхронные операции
```typescript
// Используйте act для обновлений состояния
await act(async () => {
  fireEvent.press(getByTestId('button'));
});
```

### Инструменты отладки
- `console.log` для отладки
- `--verbose` флаг для подробного вывода
- `--testNamePattern` для запуска конкретных тестов
- `--coverage` для анализа покрытия

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v4
```

### Требования
- Node.js 18+
- npm
- Jest
- React Native Testing Library

## 📈 Метрики и отчеты

### Покрытие кода
- HTML отчет: `coverage/index.html`
- LCOV отчет: `coverage/lcov.info`
- JSON отчет: `coverage/coverage-final.json`

### Производительность
- Время выполнения тестов
- Использование памяти
- Время загрузки экранов

### Качество
- Количество тестов
- Процент прохождения
- Время выполнения

## 🚨 Мониторинг

### Автоматические проверки
- Запуск тестов при каждом PR
- Проверка покрытия кода
- Проверка производительности

### Уведомления
- Email при падении тестов
- Slack уведомления
- GitHub статус

## 📚 Дополнительные ресурсы

### Документация
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Jest Matchers](https://github.com/testing-library/jest-native)

### Инструменты
- [Jest](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing](https://docs.expo.dev/guides/testing-with-jest/)

### Сообщество
- [Jest Discord](https://discord.gg/jest)
- [React Native Testing Library GitHub](https://github.com/callstack/react-native-testing-library)

## 🎉 Заключение

Система тестирования Steroid Tracker обеспечивает:
- **Высокое качество кода**
- **Надежность приложения**
- **Безопасный рефакторинг**
- **Живую документацию**
- **Контроль производительности**

Следуйте этому руководству для поддержания высокого качества тестов и приложения в целом.