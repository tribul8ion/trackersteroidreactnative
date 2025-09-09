import { supabase } from './supabase';

export type Course = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  compounds: string; // JSON
  doses: string; // JSON
  schedule: string; // JSON
  pct: string; // JSON
  createdAt: string;
  status: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
};

export async function addCourse(course: Omit<Course, 'id'>) {
  return await supabase.from('courses').insert([course]);
}

export async function getCourses(user_id: string) {
  return await supabase.from('courses').select('*').eq('user_id', user_id).order('createdAt', { ascending: false });
}

export async function updateCourse(id: string, updates: Partial<Course>) {
  return await supabase.from('courses').update(updates).eq('id', id);
}

export async function deleteCourse(id: string) {
  return await supabase.from('courses').delete().eq('id', id);
}

export async function getCourseById(id: string) {
  return await supabase.from('courses').select('*').eq('id', id).single();
} 