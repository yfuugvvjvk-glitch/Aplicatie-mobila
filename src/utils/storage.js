/**
 * Utilitar pentru gestionarea stocării locale (AsyncStorage)
 * Oferă metode CRUD pentru task-uri și categorii
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@TaskManager:tasks';
const CATEGORIES_KEY = '@TaskManager:categories';
const USER_KEY = '@TaskManager:user';

// ─── TASK-URI ────────────────────────────────────────────────────────────────

export const getTasks = async () => {
  try {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Eroare la citirea task-urilor:', e);
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Eroare la salvarea task-urilor:', e);
  }
};

export const addTask = async (task) => {
  const tasks = await getTasks();
  const updated = [...tasks, task];
  await saveTasks(updated);
  return updated;
};

export const updateTask = async (updatedTask) => {
  const tasks = await getTasks();
  const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
  await saveTasks(updated);
  return updated;
};

export const deleteTask = async (taskId) => {
  const tasks = await getTasks();
  const updated = tasks.filter((t) => t.id !== taskId);
  await saveTasks(updated);
  return updated;
};

// ─── CATEGORII ────────────────────────────────────────────────────────────────

export const getCategories = async () => {
  try {
    const json = await AsyncStorage.getItem(CATEGORIES_KEY);
    return json ? JSON.parse(json) : getDefaultCategories();
  } catch (e) {
    return getDefaultCategories();
  }
};

export const saveCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Eroare la salvarea categoriilor:', e);
  }
};

const getDefaultCategories = () => [
  { id: '1', name: 'Muncă', color: '#4A90E2', icon: '💼' },
  { id: '2', name: 'Personal', color: '#7ED321', icon: '🏠' },
  { id: '3', name: 'Sănătate', color: '#F5A623', icon: '💪' },
  { id: '4', name: 'Studiu', color: '#9B59B6', icon: '📚' },
  { id: '5', name: 'Cumpărături', color: '#E74C3C', icon: '🛒' },
];

// ─── UTILIZATOR ───────────────────────────────────────────────────────────────

export const getUser = async () => {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Eroare la salvarea utilizatorului:', e);
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Eroare la ștergerea utilizatorului:', e);
  }
};
