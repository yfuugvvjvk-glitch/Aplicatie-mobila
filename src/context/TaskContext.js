import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import {
  DEFAULT_CATEGORIES,
  getCachedData,
  getPendingChanges,
  saveCachedData,
} from '../utils/storage';
import { getSyncErrorMessage, saveOfflineChange, syncUserData } from '../services/sync';
import {
  DEMO_USER_ID,
  endDemoSession,
  getDemoSessionName,
  hasDemoSession,
  requireSupabase,
  startDemoSession,
  supabase,
} from '../services/supabase';

const ACTIONS = {
  SET_DATA: 'SET_DATA',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_CATEGORY: 'ADD_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_FILTER: 'SET_FILTER',
  SET_SYNC: 'SET_SYNC',
};

const initialState = {
  tasks: [],
  categories: [],
  user: null,
  loading: true,
  filter: 'all',
  syncStatus: 'idle',
  syncError: '',
  pendingChanges: 0,
};

function taskReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DATA:
      return { ...state, tasks: action.payload.tasks, categories: action.payload.categories };
    case ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) => task.id === action.payload.id ? action.payload : task),
      };
    case ACTIONS.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.payload) };
    case ACTIONS.ADD_CATEGORY:
      return { ...state, categories: [...state.categories, action.payload] };
    case ACTIONS.UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };
    case ACTIONS.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
        // Dezasociază task-urile din categoria ștearsă
        tasks: state.tasks.map((t) =>
          t.categoryId === action.payload ? { ...t, categoryId: null } : t
        ),
      };
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case ACTIONS.LOGOUT:
      return { ...state, user: null, tasks: [], categories: [], syncError: '', pendingChanges: 0 };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_FILTER:
      return { ...state, filter: action.payload };
    case ACTIONS.SET_SYNC:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const TaskContext = createContext(null);

const mapUser = (user) => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilizator',
  createdAt: user.created_at,
});

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const currentUserId = state.user?.id;
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const updatePendingCount = async (userId) => {
    const changes = await getPendingChanges(userId);
    dispatch({ type: ACTIONS.SET_SYNC, payload: { pendingChanges: changes.length } });
  };

  const refreshData = useCallback(async (userId = currentUserIdRef.current) => {
    if (!userId || !supabase || userId === DEMO_USER_ID) return;
    dispatch({
      type: ACTIONS.SET_SYNC,
      payload: { syncStatus: 'syncing', syncError: '' },
    });
    try {
      const data = await syncUserData(userId);
      if (currentUserIdRef.current !== userId) return;
      dispatch({ type: ACTIONS.SET_DATA, payload: data });
      const changes = await getPendingChanges(userId);
      dispatch({
        type: ACTIONS.SET_SYNC,
        payload: {
          syncStatus: changes.length ? 'pending' : 'synced',
          pendingChanges: changes.length,
          syncError: '',
        },
      });
    } catch (error) {
      let syncError = getSyncErrorMessage(error);
      let pendingChanges = 0;
      try {
        const cached = await getCachedData(userId);
        const changes = await getPendingChanges(userId);
        if (currentUserIdRef.current !== userId) return;
        dispatch({ type: ACTIONS.SET_DATA, payload: cached });
        pendingChanges = changes.length;
      } catch (storageError) {
        syncError = `${syncError} Cache local: ${getSyncErrorMessage(storageError)}`;
      }
      if (currentUserIdRef.current !== userId) return;
      dispatch({
        type: ACTIONS.SET_SYNC,
        payload: {
          syncStatus: 'error',
          pendingChanges,
          syncError,
        },
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        if (await hasDemoSession()) {
          if (!active) return;
          const user = {
            id: DEMO_USER_ID,
            name: await getDemoSessionName(),
            email: 'Date păstrate doar pe acest dispozitiv',
            createdAt: new Date().toISOString(),
            isDemo: true,
          };
          dispatch({ type: ACTIONS.SET_USER, payload: user });
          const data = await getCachedData(user.id);
          if (!data.categories.length) {
            data.categories = DEFAULT_CATEGORIES;
            await saveCachedData(user.id, data);
          }
          if (!active) return;
          dispatch({ type: ACTIONS.SET_DATA, payload: data });
          dispatch({
            type: ACTIONS.SET_SYNC,
            payload: { syncStatus: 'local', syncError: '', pendingChanges: 0 },
          });
          return;
        }
        if (!supabase) return;
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active || !data.session?.user) return;
        const user = mapUser(data.session.user);
        dispatch({ type: ACTIONS.SET_USER, payload: user });
        dispatch({ type: ACTIONS.SET_DATA, payload: await getCachedData(user.id) });
        await refreshData(user.id);
      } catch (error) {
        if (active) {
          dispatch({
            type: ACTIONS.SET_SYNC,
            payload: { syncStatus: 'error', syncError: getSyncErrorMessage(error) },
          });
        }
      } finally {
        if (active) dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };
    initialize();
    return () => {
      active = false;
    };
  }, [refreshData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && currentUserId) refreshData(currentUserId);
    });
    return () => subscription.remove();
  }, [currentUserId, refreshData]);

  const mutate = async (entity, operation, record, action) => {
    if (!state.user) throw new Error('Autentifică-te pentru a modifica datele.');
    if (state.user.isDemo) {
      const cached = await getCachedData(state.user.id);
      const key = entity === 'task' ? 'tasks' : 'categories';
      const records = operation === 'delete'
        ? cached[key].filter((item) => item.id !== record.id)
        : [...cached[key].filter((item) => item.id !== record.id), record];
      await saveCachedData(state.user.id, { ...cached, [key]: records });
      if (currentUserIdRef.current !== state.user.id) return;
      dispatch(action);
      dispatch({
        type: ACTIONS.SET_SYNC,
        payload: { syncStatus: 'local', syncError: '', pendingChanges: 0 },
      });
      return;
    }
    await saveOfflineChange(state.user.id, entity, operation, record);
    dispatch(action);
    await updatePendingCount(state.user.id);
    refreshData(state.user.id);
  };

  const addTask = (task) => mutate('task', 'upsert', task, {
    type: ACTIONS.ADD_TASK,
    payload: task,
  });

  const updateTask = (task) => mutate('task', 'upsert', task, {
    type: ACTIONS.UPDATE_TASK,
    payload: task,
  });

  const deleteTask = (id) => mutate('task', 'delete', { id }, {
    type: ACTIONS.DELETE_TASK,
    payload: id,
  });

  const toggleTask = async (id) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    await updateTask({
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    });
  };

  const addCategory = (category) => mutate('category', 'upsert', category, {
    type: ACTIONS.ADD_CATEGORY,
    payload: category,
  });

  const updateCategory = (category) => mutate('category', 'upsert', category, {
    type: ACTIONS.UPDATE_CATEGORY,
    payload: category,
  });

  const deleteCategory = async (id) => {
    // Dezasociază task-urile din categoria ștearsă (persistat local + cloud)
    const catTasks = state.tasks.filter((t) => t.categoryId === id);
    for (const t of catTasks) {
      await mutate('task', 'upsert', { ...t, categoryId: null }, {
        type: ACTIONS.UPDATE_TASK,
        payload: { ...t, categoryId: null },
      });
    }
    return mutate('category', 'delete', { id }, {
      type: ACTIONS.DELETE_CATEGORY,
      payload: id,
    });
  };

  const login = async ({ email, password }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase nu a returnat un utilizator autentificat.');
    const user = mapUser(data.user);
    dispatch({ type: ACTIONS.SET_USER, payload: user });
    dispatch({ type: ACTIONS.SET_DATA, payload: await getCachedData(user.id) });
    await refreshData(user.id);
  };

  const continueAsDemo = async () => {
    const user = {
      id: DEMO_USER_ID,
      name: 'Utilizator demo',
      email: 'Date păstrate doar pe acest dispozitiv',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    await startDemoSession(user.name);
    const data = await getCachedData(user.id);
    if (!data.categories.length) {
      data.categories = DEFAULT_CATEGORIES;
      await saveCachedData(user.id, data);
    }
    currentUserIdRef.current = user.id;
    dispatch({ type: ACTIONS.SET_USER, payload: user });
    dispatch({ type: ACTIONS.SET_DATA, payload: data });
    dispatch({
      type: ACTIONS.SET_SYNC,
      payload: { syncStatus: 'local', syncError: '', pendingChanges: 0 },
    });
  };

  const register = async ({ name, email, password }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw error;
    if (!data.session || !data.user) return { confirmationRequired: true };

    const user = mapUser(data.user);
    dispatch({ type: ACTIONS.SET_USER, payload: user });
    dispatch({ type: ACTIONS.SET_DATA, payload: await getCachedData(user.id) });
    await refreshData(user.id);
    return { confirmationRequired: false };
  };

  const updateProfileName = async (name) => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new Error('Numele trebuie să aibă cel puțin 2 caractere.');
    }
    if (!state.user) throw new Error('Autentifică-te pentru a modifica profilul.');

    if (state.user.isDemo) {
      await startDemoSession(trimmedName);
      dispatch({ type: ACTIONS.SET_USER, payload: { ...state.user, name: trimmedName } });
      return;
    }

    const { data, error } = await requireSupabase().auth.updateUser({
      data: { full_name: trimmedName },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase nu a returnat profilul actualizat.');
    dispatch({ type: ACTIONS.SET_USER, payload: mapUser(data.user) });
  };

  const logout = async () => {
    if (state.user?.isDemo) {
      await endDemoSession();
      currentUserIdRef.current = undefined;
      dispatch({ type: ACTIONS.LOGOUT });
      return;
    }
    const client = requireSupabase();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const setFilter = (filter) => dispatch({ type: ACTIONS.SET_FILTER, payload: filter });

  const getFilteredTasks = (categoryId = null) => {
    let tasks = state.tasks;
    if (categoryId) tasks = tasks.filter((task) => task.categoryId === categoryId);
    if (state.filter === 'active') return tasks.filter((task) => !task.completed);
    if (state.filter === 'completed') return tasks.filter((task) => task.completed);
    return tasks;
  };

  const getStats = () => {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const active = total - completed;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = state.tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < now;
    }).length;
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
        updateCategory,
        deleteCategory,
        login,
        continueAsDemo,
        register,
        updateProfileName,
        logout,
        refreshData,
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
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTask trebuie folosit în interiorul TaskProvider');
  return context;
};
