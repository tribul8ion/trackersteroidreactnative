import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickActionsPanel } from '../../components/QuickActionsPanel';
import { ActionsService } from '../../services/actions';
import { AuthService } from '../../services/auth';

// Мокаем сервисы
jest.mock('../../services/actions');
jest.mock('../../services/auth');

describe('QuickActionsPanel', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  const mockProps = {
    navigation: mockNavigation,
    courseId: 'course1',
    courseName: 'Test Course'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    });

    (ActionsService.addAction as jest.Mock).mockResolvedValue({
      success: true,
      action: { id: '1', type: 'injection' }
    });
  });

  test('должен отрендериться без ошибок', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('quick-actions-panel')).toBeTruthy();
  });

  test('должен отобразить заголовок', () => {
    const { getByText } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByText('Быстрые действия')).toBeTruthy();
  });

  test('должен отобразить кнопку инъекции', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('quick-inject-button')).toBeTruthy();
  });

  test('должен отобразить кнопку таблетки', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('quick-pill-button')).toBeTruthy();
  });

  test('должен отобразить кнопку заметки', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('quick-note-button')).toBeTruthy();
  });

  test('должен выполнить быстрое действие - инъекция', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user1',
          course_id: 'course1',
          type: 'injection',
          timestamp: expect.any(String)
        })
      );
    });
  });

  test('должен выполнить быстрое действие - таблетка', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-pill-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user1',
          course_id: 'course1',
          type: 'tablet',
          timestamp: expect.any(String)
        })
      );
    });
  });

  test('должен выполнить быстрое действие - заметка', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-note-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user1',
          course_id: 'course1',
          type: 'note',
          timestamp: expect.any(String)
        })
      );
    });
  });

  test('должен показать подтверждение действия', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    await waitFor(() => {
      expect(getByTestId('confirmation-modal')).toBeTruthy();
    });
  });

  test('должен закрыть модальное окно подтверждения', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    await waitFor(() => {
      expect(getByTestId('confirmation-modal')).toBeTruthy();
    });

    fireEvent.press(getByTestId('close-confirmation-modal'));

    await waitFor(() => {
      expect(getByTestId('confirmation-modal')).toBeFalsy();
    });
  });

  test('должен показать успешное сообщение', async () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    await waitFor(() => {
      expect(getByTestId('success-message')).toBeTruthy();
    });
  });

  test('должен обработать ошибку при выполнении действия', async () => {
    (ActionsService.addAction as jest.Mock).mockRejectedValue(new Error('Action error'));

    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  test('должен показать индикатор загрузки при выполнении действия', async () => {
    (ActionsService.addAction as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('quick-inject-button'));

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('должен отобразить иконки для кнопок', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('inject-icon')).toBeTruthy();
    expect(getByTestId('pill-icon')).toBeTruthy();
    expect(getByTestId('note-icon')).toBeTruthy();
  });

  test('должен отобразить подписи для кнопок', () => {
    const { getByText } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByText('Инъекция')).toBeTruthy();
    expect(getByText('Таблетка')).toBeTruthy();
    expect(getByText('Заметка')).toBeTruthy();
  });

  test('должен отобразить описание действий', () => {
    const { getByText } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByText('Быстрое добавление действий')).toBeTruthy();
  });

  test('должен отобразить информацию о курсе', () => {
    const { getByText } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByText('Test Course')).toBeTruthy();
  });

  test('должен работать без courseId', () => {
    const propsWithoutCourse = {
      ...mockProps,
      courseId: undefined
    };

    const { getByTestId } = render(
      <QuickActionsPanel {...propsWithoutCourse} />
    );

    expect(getByTestId('quick-actions-panel')).toBeTruthy();
  });

  test('должен работать без courseName', () => {
    const propsWithoutCourseName = {
      ...mockProps,
      courseName: undefined
    };

    const { getByTestId } = render(
      <QuickActionsPanel {...propsWithoutCourseName} />
    );

    expect(getByTestId('quick-actions-panel')).toBeTruthy();
  });

  test('должен отобразить кнопку "Все действия"', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('all-actions-button')).toBeTruthy();
  });

  test('должен перейти к экрану всех действий', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    fireEvent.press(getByTestId('all-actions-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Actions');
  });

  test('должен отобразить статистику действий', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('actions-stats')).toBeTruthy();
  });

  test('должен отобразить последние действия', () => {
    const { getByTestId } = render(
      <QuickActionsPanel {...mockProps} />
    );

    expect(getByTestId('recent-actions')).toBeTruthy();
  });
});