import { LocalStorageService } from './localStorage';
import { Course, Compound } from './types';

export class CoursesService {
  static async initialize(): Promise<void> {
    await LocalStorageService.getItem('courses' as any);
  }
  // Получение всех курсов
  static async getCourses(): Promise<Course[]> {
    const items = (await LocalStorageService.getItem<Course[]>('courses' as any)) || [];
    return items.length ? items : await LocalStorageService.getCourses();
  }

  // Получение курса по ID
  static async getCourseById(id: string): Promise<Course | null> {
    const courses = await this.getCourses();
    return courses.find(course => course.id === id) || null;
  }

  // Создание нового курса
  static async createCourse(courseData: any): Promise<{ success: boolean; course?: Course; error?: string }> {
    try {
      if (!courseData || typeof courseData.name !== 'string' || !courseData.name.trim()) {
        return { success: false, error: 'validation: name is required' };
      }
      if (!courseData.status || !['active','completed','planned'].includes(String(courseData.status))) {
        return { success: false, error: 'validation: status is required' };
      }
      const newCourse: Course = {
        ...courseData,
        id: this.generateCourseId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existing = (await LocalStorageService.getItem<Course[]>('courses' as any)) || [];
      const updated = [...existing, newCourse];
      await LocalStorageService.setItem('courses' as any, updated);
      return { success: true, course: newCourse };
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      return { success: false, error: 'Ошибка создания курса' };
    }
  }

  // Обновление курса
  static async updateCourse(id: string, updates: Partial<Course>): Promise<{ success: boolean; course?: Course; error?: string }> {
    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const existing = (await LocalStorageService.getItem<Course[]>('courses' as any)) || [];
      const index = existing.findIndex(c => c.id === id);
      if (index === -1) return { success: false, error: 'not found' };
      existing[index] = { ...existing[index], ...updatedData } as any;
      await LocalStorageService.setItem('courses' as any, existing);
      return { success: true, course: existing[index] };
    } catch (error) {
      console.error('Ошибка обновления курса:', error);
      return { success: false, error: 'Ошибка обновления курса' };
    }
  }

  // Удаление курса
  static async deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = (await LocalStorageService.getItem<Course[]>('courses' as any)) || [];
      const index = existing.findIndex(c => c.id === id);
      if (index === -1) return { success: false, error: 'not found' };
      const updated = existing.filter(c => c.id !== id);
      await LocalStorageService.setItem('courses' as any, updated);
      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления курса:', error);
      return { success: false, error: 'Ошибка удаления курса' };
    }
  }

  // Aliases expected by tests
  static async addCourse(courseData: any) { return this.createCourse(courseData); }

  // Получение активных курсов
  static async getActiveCourses(): Promise<Course[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.status === 'active');
  }

  // Получение курсов по статусу
  static async getCoursesByStatus(status: Course['status']): Promise<Course[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.status === status);
  }

  // Получение курсов по типу
  static async getCoursesByType(type: Course['type']): Promise<Course[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.type === type);
  }

  // Поиск курсов
  static async searchCourses(query: string): Promise<Course[]> {
    const courses = await this.getCourses();
    const lowercaseQuery = query.toLowerCase();
    
    return courses.filter(course => 
      course.name.toLowerCase().includes(lowercaseQuery) ||
      course.type.toLowerCase().includes(lowercaseQuery) ||
      course.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Получение статистики курсов
  static async getCoursesStatistics(): Promise<{
    total: number;
    active: number;
    completed: number;
    planned: number;
    byType: Record<string, number>;
    averageDuration: number;
  }> {
    const courses = await this.getCourses();
    
    const stats = {
      total: courses.length,
      active: courses.filter(c => c.status === 'active').length,
      completed: courses.filter(c => c.status === 'completed').length,
      planned: courses.filter(c => c.status === 'planned').length,
      byType: {} as Record<string, number>,
      averageDuration: 0,
    };

    // Подсчет по типам
    courses.forEach(course => {
      stats.byType[course.type] = (stats.byType[course.type] || 0) + 1;
    });

    // Средняя продолжительность
    if (courses.length > 0) {
      const totalDuration = courses.reduce((sum, course) => sum + course.durationWeeks, 0);
      stats.averageDuration = Math.round(totalDuration / courses.length);
    }

    return stats;
  }

  // Получение прогресса курса
  static getCourseProgress(course: Course): number {
    if (course.status === 'completed') return 100;
    if (course.status === 'planned') return 0;
    
    const startDate = new Date(course.startDate);
    const endDate = course.endDate ? new Date(course.endDate) : new Date();
    const now = new Date();
    
    if (now < startDate) return 0;
    if (now > endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  // Получение следующих событий курса
  static getNextCourseEvents(course: Course): Array<{
    type: 'injection' | 'tablet' | 'lab' | 'measurement';
    compound?: Compound;
    date: string;
    time?: string;
  }> {
    const events: Array<{
      type: 'injection' | 'tablet' | 'lab' | 'measurement';
      compound?: Compound;
      date: string;
      time?: string;
    }> = [];

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Добавляем события на основе расписания
    course.compounds.forEach(compound => {
      const schedule = course.schedule[compound.key];
      if (!schedule) return;

      // Инъекции
      if (compound.form === 'Injection' && schedule.timesPerWeek > 0) {
        const daysPerWeek = schedule.timesPerWeek;
        const interval = Math.floor(7 / daysPerWeek);
        
        for (let i = 0; i < daysPerWeek; i++) {
          const eventDate = new Date(today.getTime() + i * interval * 24 * 60 * 60 * 1000);
          if (eventDate <= nextWeek) {
            events.push({
              type: 'injection',
              compound,
              date: eventDate.toISOString().split('T')[0],
              time: '09:00', // По умолчанию
            });
          }
        }
      }

      // Таблетки
      if (compound.form === 'Tablet' && schedule.timesPerDay > 0) {
        for (let i = 0; i < 7; i++) {
          const eventDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
          if (eventDate <= nextWeek) {
            events.push({
              type: 'tablet',
              compound,
              date: eventDate.toISOString().split('T')[0],
              time: '09:00',
            });
          }
        }
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Валидация курса
  static validateCourse(courseData: Partial<Course>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!courseData.name || courseData.name.trim().length === 0) {
      errors.push('Название курса обязательно');
    }

    if (!courseData.type) {
      errors.push('Тип курса обязателен');
    }

    if (!courseData.startDate) {
      errors.push('Дата начала обязательна');
    }

    if (!courseData.durationWeeks || courseData.durationWeeks <= 0) {
      errors.push('Продолжительность курса должна быть больше 0');
    }

    if (!courseData.compounds || courseData.compounds.length === 0) {
      errors.push('Добавьте хотя бы один препарат');
    }

    if (courseData.startDate) {
      const startDate = new Date(courseData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.push('Дата начала не может быть в прошлом');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Генерация ID курса
  private static generateCourseId(): string {
    return 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Получение шаблонов курсов
  static getCourseTemplates(): Array<{
    id: string;
    name: string;
    type: Course['type'];
    description: string;
    compounds: Compound[];
    durationWeeks: number;
  }> {
    return [
      {
        id: 'bulking_template',
        name: 'Классический массонабор',
        type: 'bulking',
        description: 'Стандартный курс для набора мышечной массы',
        durationWeeks: 12,
        compounds: [
          {
            key: 'testosterone_enanthate',
            label: 'Тестостерон Энантат',
            form: 'Injection',
            concentration: 250,
            unit: 'mg/ml',
            recommendedDose: 500,
            doseUnit: 'mg',
            frequency: 'weekly',
            dose: 500,
            unit: 'mg',
          },
          {
            key: 'nandrolone_decanate',
            label: 'Нандролон Деканоат',
            form: 'Injection',
            concentration: 200,
            unit: 'mg/ml',
            recommendedDose: 300,
            doseUnit: 'mg',
            frequency: 'weekly',
            dose: 300,
            unit: 'mg',
          },
        ],
      },
      {
        id: 'cutting_template',
        name: 'Сушка и рельеф',
        type: 'cutting',
        description: 'Курс для сжигания жира и прорисовки мышц',
        durationWeeks: 8,
        compounds: [
          {
            key: 'testosterone_propionate',
            label: 'Тестостерон Пропионат',
            form: 'Injection',
            concentration: 100,
            unit: 'mg/ml',
            recommendedDose: 100,
            doseUnit: 'mg',
            frequency: 'daily',
            dose: 100,
            unit: 'mg',
          },
          {
            key: 'trenbolone_acetate',
            label: 'Тренболон Ацетат',
            form: 'Injection',
            concentration: 100,
            unit: 'mg/ml',
            recommendedDose: 50,
            doseUnit: 'mg',
            frequency: 'daily',
            dose: 50,
            unit: 'mg',
          },
        ],
      },
      {
        id: 'pct_template',
        name: 'ПКТ (Посткурсовая терапия)',
        type: 'pct',
        description: 'Восстановление после курса',
        durationWeeks: 4,
        compounds: [
          {
            key: 'tamoxifen',
            label: 'Тамоксифен',
            form: 'Tablet',
            concentration: 20,
            unit: 'mg',
            recommendedDose: 20,
            doseUnit: 'mg',
            frequency: 'daily',
            dose: 20,
            unit: 'mg',
          },
          {
            key: 'clomiphene',
            label: 'Кломифен',
            form: 'Tablet',
            concentration: 50,
            unit: 'mg',
            recommendedDose: 50,
            doseUnit: 'mg',
            frequency: 'daily',
            dose: 50,
            unit: 'mg',
          },
        ],
      },
    ];
  }
}

// Backward-compatible named exports for legacy screens
export async function getCourses(user_id?: string): Promise<{ data: Course[]; error?: any }> {
  try {
    const data = await CoursesService.getCourses();
    return { data };
  } catch (error) {
    return { data: [], error };
  }
}

export async function getCourseById(id: string): Promise<{ data: Course | null; error?: any }> {
  try {
    const data = await CoursesService.getCourseById(id);
    return { data };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addCourse(course: any): Promise<{ error?: any }> {
  try {
    const { success, error } = await CoursesService.createCourse(course);
    if (!success) return { error: error || new Error('Failed to create course') };
    return {};
  } catch (error) {
    return { error };
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<{ error?: any }> {
  try {
    const { success, error } = await CoursesService.updateCourse(id, updates);
    if (!success) return { error: error || new Error('Failed to update course') };
    return {};
  } catch (error) {
    return { error };
  }
}

export async function deleteCourse(id: string): Promise<{ error?: any }> {
  try {
    const { success, error } = await CoursesService.deleteCourse(id);
    if (!success) return { error: error || new Error('Failed to delete course') };
    return {};
  } catch (error) {
    return { error };
  }
}