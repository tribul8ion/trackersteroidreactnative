import { LocalStorageService } from './localStorage';
import { Action } from './types';

export class ActionsService {
  static async initialize(): Promise<void> {
    await LocalStorageService.getItem('actions' as any);
  }
  // Получение всех действий
  static async getActions(type?: Action['type'], courseId?: string): Promise<Action[]> {
    let list = (await LocalStorageService.getItem<Action[]>('actions' as any)) || [];
    if (type) list = list.filter(a => a.type === type);
    if (courseId) list = list.filter(a => a.course_id === courseId);
    return list;
  }

  // Получение действий по типу
  static async getActionsByType(type: Action['type']): Promise<Action[]> {
    const actions = await this.getActions();
    return actions.filter(action => action.type === type);
  }

  // Получение действий по курсу
  static async getActionsByCourse(courseId: string): Promise<Action[]> {
    const actions = await this.getActions();
    return actions.filter(action => action.course_id === courseId);
  }

  // Получение действий за период
  static async getActionsByDateRange(startDate: string, endDate: string): Promise<Action[]> {
    const actions = await this.getActions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return actions.filter(action => {
      const actionDate = new Date(action.timestamp);
      return actionDate >= start && actionDate <= end;
    });
  }

  // Получение действий за сегодня
  static async getTodayActions(): Promise<Action[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getActionsByDateRange(today, today);
  }

  // Получение действий за неделю
  static async getWeekActions(): Promise<Action[]> {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return await this.getActionsByDateRange(
      weekStart.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );
  }

  // Добавление действия
  static async addAction(actionData: any): Promise<{ success: boolean; action?: Action; error?: string }> {
    try {
      if (!actionData || !actionData.type || !actionData.timestamp) {
        return { success: false, error: 'validation: type and timestamp are required' };
      }
      if (!['injection','tablet','note','measurement'].includes(String(actionData.type))) {
        return { success: false, error: 'validation: unsupported type' };
      }
      const newAction: Action = {
        ...actionData,
        id: this.generateActionId(),
        created_at: new Date().toISOString(),
      };

      const existing = (await LocalStorageService.getItem<Action[]>('actions' as any)) || [];
      await LocalStorageService.setItem('actions' as any, [newAction, ...existing]);
      return { success: true, action: newAction };
    } catch (error) {
      console.error('Ошибка добавления действия:', error);
      return { success: false, error: 'Ошибка добавления действия' };
    }
  }

  // Добавление инъекции
  static async addInjection(data: {
    compound: string;
    amount: number;
    unit: string;
    injectionSite: string;
    courseId?: string;
    notes?: string;
  }): Promise<{ success: boolean; action?: Action; error?: string }> {
    const details = {
      compound: data.compound,
      amount: data.amount,
      unit: data.unit,
      injectionSite: data.injectionSite,
      notes: data.notes,
    };

    return await this.addAction({
      type: 'injection',
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
      course_id: data.courseId,
    });
  }

  // Добавление приема таблеток
  static async addTablet(data: {
    compound: string;
    amount: number;
    unit: string;
    courseId?: string;
    notes?: string;
  }): Promise<{ success: boolean; action?: Action; error?: string }> {
    const details = {
      compound: data.compound,
      amount: data.amount,
      unit: data.unit,
      notes: data.notes,
    };

    return await this.addAction({
      type: 'tablet',
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
      course_id: data.courseId,
    });
  }

  // Добавление заметки
  static async addNote(data: {
    note: string;
    type?: 'general' | 'side_effect' | 'progress' | 'mood';
    courseId?: string;
  }): Promise<{ success: boolean; action?: Action; error?: string }> {
    const details = {
      note: data.note,
      type: data.type || 'general',
      characterCount: data.note.length,
    };

    return await this.addAction({
      type: 'note',
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
      course_id: data.courseId,
    });
  }

  // Добавление измерения
  static async addMeasurement(data: {
    type: 'weight' | 'body_fat' | 'muscle_mass' | 'strength';
    value: number;
    unit: string;
    courseId?: string;
    notes?: string;
  }): Promise<{ success: boolean; action?: Action; error?: string }> {
    const details = {
      measurementType: data.type,
      value: data.value,
      unit: data.unit,
      notes: data.notes,
    };

    return await this.addAction({
      type: 'measurement',
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
      course_id: data.courseId,
    });
  }

  // Получение статистики действий
  static async getActionsStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    today: number;
    thisWeek: number;
    thisMonth: number;
    injections: number;
    tablets: number;
    notes: number;
    measurements: number;
  }> {
    const actions = await this.getActions();
    const todayActions = await this.getTodayActions();
    const weekActions = await this.getWeekActions();
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthActions = await this.getActionsByDateRange(
      monthStart.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const stats = {
      total: actions.length,
      byType: {} as Record<string, number>,
      today: todayActions.length,
      thisWeek: weekActions.length,
      thisMonth: monthActions.length,
      injections: 0,
      tablets: 0,
      notes: 0,
      measurements: 0,
    };

    // Подсчет по типам
    actions.forEach(action => {
      stats.byType[action.type] = (stats.byType[action.type] || 0) + 1;
      
      switch (action.type) {
        case 'injection':
          stats.injections++;
          break;
        case 'tablet':
          stats.tablets++;
          break;
        case 'note':
          stats.notes++;
          break;
        case 'measurement':
          stats.measurements++;
          break;
      }
    });

    return stats;
  }

  // Получение прогресса по курсу
  static async getCourseProgress(courseId: string): Promise<{
    totalActions: number;
    injections: number;
    tablets: number;
    notes: number;
    measurements: number;
    lastActivity?: string;
    compliance: number; // Процент соблюдения расписания
  }> {
    const actions = await this.getActionsByCourse(courseId);
    
    const progress = {
      totalActions: actions.length,
      injections: 0,
      tablets: 0,
      notes: 0,
      measurements: 0,
      lastActivity: undefined as string | undefined,
      compliance: 0,
    };

    // Подсчет по типам
    actions.forEach(action => {
      switch (action.type) {
        case 'injection':
          progress.injections++;
          break;
        case 'tablet':
          progress.tablets++;
          break;
        case 'note':
          progress.notes++;
          break;
        case 'measurement':
          progress.measurements++;
          break;
      }
    });

    // Последняя активность
    if (actions.length > 0) {
      const sortedActions = actions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      progress.lastActivity = sortedActions[0].timestamp;
    }

    // Расчет соблюдения расписания (упрощенный)
    // В реальном приложении здесь была бы сложная логика сравнения с расписанием
    progress.compliance = Math.min(100, (progress.injections + progress.tablets) * 10);

    return progress;
  }

  // Получение трендов
  static async getTrends(days: number = 30): Promise<{
    injections: Array<{ date: string; count: number }>;
    tablets: Array<{ date: string; count: number }>;
    notes: Array<{ date: string; count: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const actions = await this.getActionsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const trends = {
      injections: [] as Array<{ date: string; count: number }>,
      tablets: [] as Array<{ date: string; count: number }>,
      notes: [] as Array<{ date: string; count: number }>,
    };

    // Группировка по дням
    const dailyData: Record<string, { injections: number; tablets: number; notes: number }> = {};

    actions.forEach(action => {
      const date = action.timestamp.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { injections: 0, tablets: 0, notes: 0 };
      }

      switch (action.type) {
        case 'injection':
          dailyData[date].injections++;
          break;
        case 'tablet':
          dailyData[date].tablets++;
          break;
        case 'note':
          dailyData[date].notes++;
          break;
      }
    });

    // Преобразование в массивы
    Object.entries(dailyData).forEach(([date, counts]) => {
      trends.injections.push({ date, count: counts.injections });
      trends.tablets.push({ date, count: counts.tablets });
      trends.notes.push({ date, count: counts.notes });
    });

    // Сортировка по дате
    trends.injections.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    trends.tablets.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    trends.notes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return trends;
  }

  // Удаление действия
  static async deleteAction(actionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const actions = await this.getActions();
      const idx = actions.findIndex(a => a.id === actionId);
      if (idx === -1) return { success: false, error: 'not found' };
      const filteredActions = actions.filter(action => action.id !== actionId);
      await LocalStorageService.setItem('actions' as any, filteredActions);
      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления действия:', error);
      return { success: false, error: 'Ошибка удаления действия' };
    }
  }

  // Генерация ID действия
  private static generateActionId(): string {
    return 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Backward-compatible named exports for legacy screens
export async function getActions(user_id?: string, courseId?: string): Promise<{ data: Action[]; error?: any }> {
  try {
    let data = await ActionsService.getActions();
    if (courseId) {
      data = data.filter(a => a.course_id === courseId);
    }
    return { data };
  } catch (error) {
    return { data: [], error };
  }
}

export async function addAction(payload: Omit<Action, 'id' | 'created_at'> & { user_id?: string }): Promise<{ error?: any }> {
  try {
    const { success, error } = await ActionsService.addAction(payload);
    if (!success) return { error: error || new Error('Failed to add action') };
    return {};
  } catch (error) {
    return { error };
  }
}

// Aliases for tests expecting CRUD-like methods
export const addInjection = ActionsService.addInjection.bind(ActionsService);
export const addTablet = ActionsService.addTablet.bind(ActionsService);
export const addNote = ActionsService.addNote.bind(ActionsService);
export const deleteActionById = ActionsService.deleteAction.bind(ActionsService);
export const updateAction = async (id: string, updates: Partial<Action>) => {
  try {
    const actions = await ActionsService.getActions();
    const idx = actions.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'not found' };
    const updated = { ...actions[idx], ...updates } as Action;
    const remaining = [...actions];
    remaining[idx] = updated;
    await LocalStorageService.setItem('actions' as any, remaining);
    return { success: true, action: updated };
  } catch (e) {
    return { success: false, error: 'update failed' };
  }
};

// Compatibility name for tests
(ActionsService as any).updateAction = updateAction;
(ActionsService as any).getActionStats = async (type?: string, start?: Date, end?: Date) => {
  const actions = await ActionsService.getActions();
  const filtered = actions.filter(a => {
    if (type && a.type !== type) return false;
    const t = new Date(a.timestamp).getTime();
    if (start && t < start.getTime()) return false;
    if (end && t > end.getTime()) return false;
    return true;
  });
  return {
    injection: filtered.filter(a => a.type === 'injection').length,
    tablet: filtered.filter(a => a.type === 'tablet').length,
    note: filtered.filter(a => a.type === 'note').length,
  } as any;
};