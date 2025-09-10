import { CoursesService } from '../../services/courses';
import { LocalStorageService } from '../../services/localStorage';

describe('CoursesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должна инициализироваться', async () => {
      await CoursesService.initialize();
      expect(LocalStorageService.getItem).toHaveBeenCalledWith('courses');
    });
  });

  describe('Получение курсов', () => {
    test('должна получить все курсы', async () => {
      const mockCourses = [
        { id: '1', name: 'Test Course 1', status: 'active' },
        { id: '2', name: 'Test Course 2', status: 'completed' }
      ];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockCourses);

      const courses = await CoursesService.getCourses();
      expect(courses).toEqual(mockCourses);
    });

    test('должна получить пустой массив если курсов нет', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(null);

      const courses = await CoursesService.getCourses();
      expect(courses).toEqual([]);
    });

    test('должна получить курс по ID', async () => {
      const mockCourse = { id: '1', name: 'Test Course', status: 'active' };
      const mockCourses = [mockCourse];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockCourses);

      const course = await CoursesService.getCourseById('1');
      expect(course).toEqual(mockCourse);
    });

    test('должна вернуть null для несуществующего курса', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const course = await CoursesService.getCourseById('nonexistent');
      expect(course).toBeNull();
    });
  });

  describe('Добавление курса', () => {
    test('должна добавить новый курс', async () => {
      const newCourse = {
        name: 'New Course',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-03-01'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await CoursesService.addCourse(newCourse);
      expect(result.success).toBe(true);
      expect(result.course).toMatchObject(newCourse);
      expect(LocalStorageService.setItem).toHaveBeenCalled();
    });

    test('должна отклонить добавление курса с неверными данными', async () => {
      const invalidCourse = {
        name: '',
        status: 'invalid',
        startDate: 'invalid-date'
      };

      const result = await CoursesService.addCourse(invalidCourse);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('должна добавить ID к новому курсу', async () => {
      const newCourse = {
        name: 'New Course',
        status: 'active'
      };

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await CoursesService.addCourse(newCourse);
      expect(result.course.id).toBeDefined();
      expect(typeof result.course.id).toBe('string');
    });
  });

  describe('Обновление курса', () => {
    test('должна обновить существующий курс', async () => {
      const existingCourse = { id: '1', name: 'Test Course', status: 'active' };
      const mockCourses = [existingCourse];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockCourses);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await CoursesService.updateCourse('1', { status: 'completed' });
      expect(result.success).toBe(true);
      expect(result.course.status).toBe('completed');
    });

    test('должна отклонить обновление несуществующего курса', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await CoursesService.updateCourse('nonexistent', { status: 'completed' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('должна сохранить обновленный курс', async () => {
      const existingCourse = { id: '1', name: 'Test Course', status: 'active' };
      const mockCourses = [existingCourse];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockCourses);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      await CoursesService.updateCourse('1', { status: 'completed' });
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('courses', expect.any(Array));
    });
  });

  describe('Удаление курса', () => {
    test('должна удалить существующий курс', async () => {
      const existingCourse = { id: '1', name: 'Test Course', status: 'active' };
      const mockCourses = [existingCourse];

      (LocalStorageService.getItem as jest.Mock).mockResolvedValue(mockCourses);
      (LocalStorageService.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await CoursesService.deleteCourse('1');
      expect(result.success).toBe(true);
      expect(LocalStorageService.setItem).toHaveBeenCalledWith('courses', []);
    });

    test('должна отклонить удаление несуществующего курса', async () => {
      (LocalStorageService.getItem as jest.Mock).mockResolvedValue([]);

      const result = await CoursesService.deleteCourse('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});