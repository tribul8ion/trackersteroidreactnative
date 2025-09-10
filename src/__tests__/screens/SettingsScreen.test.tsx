import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { AuthService } from '../../services/auth';
import { LocalStorageService } from '../../services/localStorage';
import { BackupService } from '../../services/backup';

// Мокаем сервисы
jest.mock('../../services/auth');
jest.mock('../../services/localStorage');
jest.mock('../../services/backup');

describe('SettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (LocalStorageService.getItem as jest.Mock).mockResolvedValue('true');
    (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);
    (BackupService.exportData as jest.Mock).mockResolvedValue({ success: true });
    (BackupService.importData as jest.Mock).mockResolvedValue({ success: true });
  });

  test('должен отрендериться без ошибок', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });

  test('должен отобразить информацию о пользователе', async () => {
    const { getByText } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  test('должен отобразить настройки уведомлений', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('notifications-section')).toBeTruthy();
    });
  });

  test('должен отобразить переключатель уведомлений', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('notifications-toggle')).toBeTruthy();
    });
  });

  test('должен включить/выключить уведомления', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('notifications-toggle')).toBeTruthy();
    });

    fireEvent.press(getByTestId('notifications-toggle'));

    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('notifications_enabled', 'false');
    });
  });

  test('должен отобразить настройки темы', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('theme-section')).toBeTruthy();
    });
  });

  test('должен отобразить селектор темы', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('theme-selector')).toBeTruthy();
    });
  });

  test('должен изменить тему', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('theme-selector')).toBeTruthy();
    });

    fireEvent.press(getByTestId('theme-selector'));

    const darkThemeOption = getByTestId('dark-theme-option');
    fireEvent.press(darkThemeOption);

    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  test('должен отобразить настройки языка', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('language-section')).toBeTruthy();
    });
  });

  test('должен отобразить селектор языка', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('language-selector')).toBeTruthy();
    });
  });

  test('должен изменить язык', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('language-selector')).toBeTruthy();
    });

    fireEvent.press(getByTestId('language-selector'));

    const englishOption = getByTestId('english-option');
    fireEvent.press(englishOption);

    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('language', 'en');
    });
  });

  test('должен отобразить настройки биометрии', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('biometrics-section')).toBeTruthy();
    });
  });

  test('должен отобразить переключатель биометрии', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('biometrics-toggle')).toBeTruthy();
    });
  });

  test('должен включить/выключить биометрию', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('biometrics-toggle')).toBeTruthy();
    });

    fireEvent.press(getByTestId('biometrics-toggle'));

    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('biometrics_enabled', 'true');
    });
  });

  test('должен отобразить настройки резервного копирования', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('backup-section')).toBeTruthy();
    });
  });

  test('должен экспортировать данные', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('export-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(BackupService.exportData).toHaveBeenCalled();
    });
  });

  test('должен импортировать данные', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('import-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('import-data-button'));

    await waitFor(() => {
      expect(getByTestId('file-picker')).toBeTruthy();
    });
  });

  test('должен отобразить настройки приватности', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('privacy-section')).toBeTruthy();
    });
  });

  test('должен отобразить переключатель анонимной аналитики', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('analytics-toggle')).toBeTruthy();
    });
  });

  test('должен включить/выключить анонимную аналитику', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('analytics-toggle')).toBeTruthy();
    });

    fireEvent.press(getByTestId('analytics-toggle'));

    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('analytics_enabled', 'false');
    });
  });

  test('должен отобразить настройки аккаунта', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('account-section')).toBeTruthy();
    });
  });

  test('должен отобразить кнопку редактирования профиля', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('edit-profile-button')).toBeTruthy();
    });
  });

  test('должен перейти к редактированию профиля', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('edit-profile-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('edit-profile-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
  });

  test('должен отобразить кнопку смены пароля', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('change-password-button')).toBeTruthy();
    });
  });

  test('должен перейти к смене пароля', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('change-password-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('change-password-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangePassword');
  });

  test('должен отобразить кнопку выхода', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('sign-out-button')).toBeTruthy();
    });
  });

  test('должен выйти из системы', async () => {
    (AuthService.signOut as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('sign-out-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('sign-out-button'));

    await waitFor(() => {
      expect(AuthService.signOut).toHaveBeenCalled();
    });
  });

  test('должен показать подтверждение выхода', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('sign-out-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('sign-out-button'));

    await waitFor(() => {
      expect(getByTestId('sign-out-confirmation')).toBeTruthy();
    });
  });

  test('должен отобразить информацию о приложении', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('about-section')).toBeTruthy();
    });
  });

  test('должен отобразить версию приложения', async () => {
    const { getByText } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText(/Версия/)).toBeTruthy();
    });
  });

  test('должен отобразить кнопку обратной связи', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('feedback-button')).toBeTruthy();
    });
  });

  test('должен отобразить кнопку помощи', async () => {
    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('help-button')).toBeTruthy();
    });
  });

  test('должен обработать ошибку загрузки настроек', async () => {
    (LocalStorageService.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  test('должен обработать ошибку экспорта данных', async () => {
    (BackupService.exportData as jest.Mock).mockRejectedValue(new Error('Export error'));

    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('export-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });

  test('должен обработать ошибку импорта данных', async () => {
    (BackupService.importData as jest.Mock).mockRejectedValue(new Error('Import error'));

    const { getByTestId } = render(
      <SettingsScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('import-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('import-data-button'));

    await waitFor(() => {
      expect(getByTestId('file-picker')).toBeTruthy();
    });
  });
});