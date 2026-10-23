/**
 * Context global al aplicației — gestionează starea task-urilor,
 * categoriilor și a utilizatorului curent (autentificare simplă).
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getTasks, saveTasks, getCategories, saveCategories, getUser, saveUser, clearUser, addTask as addTaskStorage, updateTask as updateTaskStorage, deleteTask as deleteTaskStorage } from '../utils/storage';

// ─── Tipuri acțiuni ───────────────────────────────────────────────────────────
const ACTIONS = {
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SET_CATEGORIES: 'SET_CATEGORIES',
  ADD_CATEGORY: 'ADD_CATEGORY',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_FILTER: 'SET_FILTER',
};

// ─── State inițial ────────────────────────────────────────────────────────────
const initialState = {
  tasks: [],
  categories: [],
  user: null,
  loading: true,
  filter: 'all', // all | active | completed
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function taskReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload };
    case ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };
    case ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    case ACTIONS.ADD_CATEGORY:
      return { ...state, categories: [...state.categories, action.payload] };
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case ACTIONS.LOGOUT:
      return { ...state, user: null };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_FILTER:
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Încărcăm datele la pornire
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const [tasks, categories, user] = await Promise.all([
        getTasks(),
        getCategories(),
        getUser(),
      ]);
      dispatch({ type: ACTIONS.SET_TASKS, payload: tasks });
      dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories });
      if (user) dispatch({ type: ACTIONS.SET_USER, payload: user });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    };
    loadData();
  }, []);

  // ─── Acțiuni task-uri ─────────────────────────────────────────────────────
  const addTask = async (task) => {
    dispatch({ type: ACTIONS.ADD_TASK, payload: task });
    await addTaskStorage(task);
  };

  const updateTask = async (task) => {
    dispatch({ type: ACTIONS.UPDATE_TASK, payload: task });
    await updateTaskStorage(task);
  };

  const deleteTask = async (id) => {
    dispatch({ type: ACTIONS.DELETE_TASK, payload: id });
    await deleteTaskStorage(id);
  };

  const toggleTask = async (id) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null };
    await updateTask(updated);
  };

  // ─── Acțiuni categorii ────────────────────────────────────────────────────
  const addCategory = async (category) => {
    const updated = [...state.categories, category];
    dispatch({ type: ACTIONS.ADD_CATEGORY, payload: category });
    await saveCategories(updated);
  };

  // ─── Autentificare ────────────────────────────────────────────────────────
  const login = async (userData) => {
    dispatch({ type: ACTIONS.SET_USER, payload: userData });
    await saveUser(userData);
  };

  const logout = async () => {
    dispatch({ type: ACTIONS.LOGOUT });
    await clearUser();
  };

  // ─── Filtrare task-uri ────────────────────────────────────────────────────
  const setFilter = (filter) => {
    dispatch({ type: ACTIONS.SET_FILTER, payload: filter });
  };

  const getFilteredTasks = (categoryId = null) => {
    let filtered = state.tasks;
    if (categoryId) {
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    }
    switch (state.filter) {
      case 'active':
        return filtered.filter((t) => !t.completed);
      case 'completed':
        return filtered.filter((t) => t.completed);
      default:
        return filtered;
    }
  };

  // Statistici rapide
  const getStats = () => {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const overdue = state.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    return { total, completed, active, overdue };
  };

  return (
    <TaskContext.Provider
      value={{
        ...state,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        addCategory,
        login,
        logout,
        setFilter,
        getFilteredTasks,
        getStats,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask trebuie folosit în interiorul TaskProvider');
  return ctx;
};
