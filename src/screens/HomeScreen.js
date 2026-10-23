/**
 * Ecranul principal — dashboard cu statistici, filtre și lista de task-uri
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import StatCard from '../components/StatCard';

const FILTERS = [
  { key: 'all', label: 'Toate' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Finalizate' },
];

export default function HomeScreen({ navigation }) {
  const { user, getFilteredTasks, getStats, filter, setFilter, categories } = useTask();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const stats = getStats();
  const allTasks = getFilteredTasks();

  // Filtrare după căutare
  const tasks = allTasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Sortare: necompletate primele, apoi după dată scadentă
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat : null;
  };

  const ListHeader = () => (
    <>
      {/* Salut utilizator */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetHi}>Bună, {user?.name || 'utilizator'} 👋</Text>
          <Text style={styles.greetSub}>
            {stats.active > 0
              ? `Ai ${stats.active} task${stats.active !== 1 ? '-uri' : ''} de rezolvat`
              : 'Toate task-urile sunt rezolvate! 🎉'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Profilul meu"
          accessibilityRole="button"
        >
          <Text style={styles.profileInitial}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistici */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={stats.total} color="#4A6CF7" icon="📋" />
        <StatCard label="Active" value={stats.active} color="#F5A623" icon="⏳" />
        <StatCard label="Finalizate" value={stats.completed} color="#27AE60" icon="✅" />
        <StatCard label="Depășite" value={stats.overdue} color="#E74C3C" icon="⚠️" />
      </View>

      {/* Bară de căutare */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Caută task-uri..."
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Caută task-uri"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Șterge căutarea">
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtre */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tasks.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>
            {search ? '🔍' : filter === 'completed' ? '🎉' : '📝'}
          </Text>
          <Text style={styles.emptyTitle}>
            {search
              ? 'Niciun rezultat'
              : filter === 'completed'
              ? 'Nicio sarcină finalizată'
              : 'Nicio sarcină activă'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? 'Încearcă un alt termen de căutare'
              : 'Apasă + pentru a adăuga o sarcină nouă'}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            category={getCategoryName(item.categoryId)}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A6CF7" />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Buton adăugare */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask')}
        accessibilityRole="button"
        accessibilityLabel="Adaugă task nou"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
  },
  greetHi: { fontSize: 22, fontWeight: '800', color: '#2C3E6B' },
  greetSub: { fontSize: 13, color: '#7B8AB8', marginTop: 2 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A6CF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#2C3E6B' },
  clearBtn: { fontSize: 16, color: '#7B8AB8', paddingLeft: 8 },
  filterRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8EDFF',
  },
  filterActive: { backgroundColor: '#4A6CF7' },
  filterText: { fontSize: 13, color: '#4A6CF7', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E6B', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#7B8AB8', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4A6CF7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A6CF7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
});
