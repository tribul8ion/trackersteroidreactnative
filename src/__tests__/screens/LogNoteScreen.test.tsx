import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogNoteScreen } from '../../screens/LogNoteScreen';
import { ActionsService } from '../../services/actions';
import { AuthService } from '../../services/auth';

// Мокаем сервисы
jest.mock('../../services/actions');
jest.mock('../../services/auth');

describe('LogNoteScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {
      courseId: 'course1',
      courseName: 'Test Course'
    },
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
      action: { id: '1', type: 'note' }
    });
  });

  test('должен отрендериться без ошибок', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('log-note-screen')).toBeTruthy();
  });

  test('должен отобразить название курса', () => {
    const { getByText } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Test Course')).toBeTruthy();
  });

  test('должен отобразить поле ввода заметки', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('note-input')).toBeTruthy();
  });

  test('должен отобразить кнопки типов заметок', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('note-type-general')).toBeTruthy();
    expect(getByTestId('note-type-side-effect')).toBeTruthy();
    expect(getByTestId('note-type-progress')).toBeTruthy();
    expect(getByTestId('note-type-mood')).toBeTruthy();
  });

  test('должен изменить тип заметки при нажатии на кнопку', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('note-type-side-effect'));

    expect(getByTestId('note-type-side-effect')).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  test('должен отобразить шаблоны для выбранного типа', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('note-type-progress'));

    expect(getByTestId('templates-container')).toBeTruthy();
  });

  test('должен вставить шаблон в поле ввода', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('note-type-progress'));
    
    const templateButton = getByTestId('template-0');
    fireEvent.press(templateButton);

    const noteInput = getByTestId('note-input');
    expect(noteInput.props.value).toContain('Прибавил');
  });

  test('должен отобразить счетчик символов', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    expect(getByTestId('character-count')).toBeTruthy();
  });

  test('должен очистить поле ввода при нажатии на кнопку очистки', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('clear-button'));

    expect(noteInput.props.value).toBe('');
  });

  test('должен сохранить заметку при нажатии на кнопку сохранения', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user1',
          course_id: 'course1',
          type: 'note',
          details: expect.stringContaining('Test note')
        })
      );
    });
  });

  test('должен показать модальное окно успеха после сохранения', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(getByTestId('success-modal')).toBeTruthy();
    });
  });

  test('должен закрыть модальное окно успеха', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(getByTestId('success-modal')).toBeTruthy();
    });

    fireEvent.press(getByTestId('close-success-modal'));

    await waitFor(() => {
      expect(getByTestId('success-modal')).toBeFalsy();
    });
  });

  test('должен отклонить сохранение пустой заметки', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('save-button'));

    expect(ActionsService.addAction).not.toHaveBeenCalled();
  });

  test('должен обработать ошибку сохранения', async () => {
    (ActionsService.addAction as jest.Mock).mockRejectedValue(new Error('Save error'));

    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  test('должен показать индикатор загрузки при сохранении', async () => {
    (ActionsService.addAction as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('должен включить тип заметки в детали', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('note-type-progress'));

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringContaining('"type":"progress"')
        })
      );
    });
  });

  test('должен включить количество символов в детали', async () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const noteInput = getByTestId('note-input');
    fireEvent.changeText(noteInput, 'Test note');

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(ActionsService.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringContaining('"characterCount":9')
        })
      );
    });
  });

  test('должен отобразить разные шаблоны для разных типов', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Проверяем шаблоны для общего типа
    fireEvent.press(getByTestId('note-type-general'));
    expect(getByTestId('template-0')).toHaveTextContent('Сегодня чувствую себя хорошо');

    // Проверяем шаблоны для побочных эффектов
    fireEvent.press(getByTestId('note-type-side-effect'));
    expect(getByTestId('template-0')).toHaveTextContent('Легкая тошнота после инъекции');

    // Проверяем шаблоны для прогресса
    fireEvent.press(getByTestId('note-type-progress'));
    expect(getByTestId('template-0')).toHaveTextContent('Прибавил 2 кг за неделю');

    // Проверяем шаблоны для настроения
    fireEvent.press(getByTestId('note-type-mood'));
    expect(getByTestId('template-0')).toHaveTextContent('Отличное настроение');
  });

  test('должен вернуться назад при нажатии на кнопку отмены', () => {
    const { getByTestId } = render(
      <LogNoteScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('cancel-button'));

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});