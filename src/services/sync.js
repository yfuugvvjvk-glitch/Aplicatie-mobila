import { requireSupabase } from './supabase';
import {
  DEFAULT_CATEGORIES,
  getCachedData,
  getPendingChanges,
  removePendingChange,
  saveCachedData,
  queueChange,
} from '../utils/storage';

const toRemoteTask = (userId, task) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: task.description || '',
  priority: task.priority,
  category_id: task.categoryId,
  due_date: task.dueDate,
  has_reminder: Boolean(task.hasReminder),
  completed: Boolean(task.completed),
  created_at: task.createdAt,
  completed_at: task.completedAt,
});

const fromRemoteTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description || '',
  priority: task.priority,
  categoryId: task.category_id,
  dueDate: task.due_date,
  hasReminder: task.has_reminder,
  completed: task.completed,
  createdAt: task.created_at,
  completedAt: task.completed_at,
});

const toRemoteCategory = (userId, category) => ({
  id: category.id,
  user_id: userId,
  name: category.name,
  color: category.color,
  icon: category.icon,
});

const fromRemoteCategory = (category) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  icon: category.icon,
});

async function applyChange(client, userId, change) {
  const table = change.entity === 'task' ? 'tasks' : 'categories';
  const id = change.record.id;

  if (change.operation === 'delete') {
    const { error } = await client.from(table).delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const record = change.entity === 'task'
    ? toRemoteTask(userId, change.record)
    : toRemoteCategory(userId, change.record);
  const { error } = await client.from(table).upsert(record, { onConflict: 'user_id,id' });
  if (error) throw error;
}

function mergePending(remoteRecords, changes) {
  const records = new Map(remoteRecords.map((record) => [record.id, record]));
  for (const change of changes) {
    if (change.operation === 'delete') records.delete(change.record.id);
    else records.set(change.record.id, change.record);
  }
  return [...records.values()];
}

export async function syncUserData(userId) {
  const client = requireSupabase();
  const cached = await getCachedData(userId);
  const categoryResponse = await client
    .from('categories')
    .select('id')
    .eq('user_id', userId);
  if (categoryResponse.error) throw categoryResponse.error;

  let localCategories = cached.categories;
  if (categoryResponse.data.length === 0 && localCategories.length === 0) {
    localCategories = DEFAULT_CATEGORIES;
    for (const category of localCategories) {
      await queueChange(userId, 'category', 'upsert', category);
    }
  }

  const changes = (await getPendingChanges(userId))
    .sort((left, right) => Number(right.entity === 'category') - Number(left.entity === 'category'));
  for (const change of changes) {
    await applyChange(client, userId, change);
    await removePendingChange(userId, change.id);
  }

  let [{ data: tasks, error: tasksError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      client.from('tasks').select('*').eq('user_id', userId),
      client.from('categories').select('*').eq('user_id', userId),
    ]);
  if (tasksError) throw tasksError;
  if (categoriesError) throw categoriesError;

  const pending = await getPendingChanges(userId);
  const pendingTasks = pending.filter((change) => change.entity === 'task');
  const pendingCategories = pending.filter((change) => change.entity === 'category');
  const data = {
    tasks: mergePending((tasks || []).map(fromRemoteTask), pendingTasks),
    categories: mergePending(
      (categories || []).map(fromRemoteCategory),
      pendingCategories
    ),
  };

  await saveCachedData(userId, data);
  return data;
}

export async function saveOfflineChange(userId, entity, operation, record) {
  await queueChange(userId, entity, operation, record);
  const cached = await getCachedData(userId);
  const records = cached[entity === 'task' ? 'tasks' : 'categories'];
  const updated = operation === 'delete'
    ? records.filter((item) => item.id !== record.id)
    : [...records.filter((item) => item.id !== record.id), record];
  await saveCachedData(userId, {
    ...cached,
    [entity === 'task' ? 'tasks' : 'categories']: updated,
  });
}

export function getSyncErrorMessage(error) {
  return error?.message || 'Sincronizarea cu Supabase a eșuat.';
}
