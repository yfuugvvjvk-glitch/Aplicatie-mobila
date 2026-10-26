/**
 * Ecranul de profil — statistici avansate, setări, delogare
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useTask } from '../context/TaskContext';

export default function ProfileScreen({ navigation }) {
  const {
    user,
    logout,
    getStats,
    tasks,
    categories,
    syncStatus,
    syncError,
    pendingChanges,
    refreshData,
  } = useTask();
  const stats = getStats();

  const handleLogout = () => {
    Alert.alert(
      'Deconectare',
      'Ești sigur că vrei să te deconectezi?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Deconectează-te',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Deconectare eșuată', error.message || 'Încearcă din nou.');
            }
          },
        },
      ]
    );
  };

  // Calcul productivitate pe categorii
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    const completed = catTasks.filter((t) => t.completed).length;
    return { ...cat, total: catTasks.length, completed };
  }).filter((c) => c.total > 0);

  // Task-uri cu prioritate ridicată necompletate
  const urgentTasks = tasks.filter((t) => t.priority === 'high' && !t.completed);

  const formatDate = (iso) => {
    if (!iso) return 'Necunoscut';
    return new Date(iso).toLocaleDateString('ro-RO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#4A6CF7" />

      {/* Header profil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Utilizator'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <Text style={styles.memberSince}>Membru din {formatDate(user?.createdAt)}</Text>
      </View>

        <View style={styles.syncCard}>
          <View style={styles.syncTextBlock}>
            <Text style={styles.syncTitle}>
              {syncStatus === 'synced' ? 'Date sincronizate' :
                syncStatus === 'syncing' ? 'Se sincronizează...' :
                  syncStatus === 'error' ? 'Sincronizare indisponibilă' :
                    pendingChanges ? 'Modificări în așteptare' : 'Date salvate local'}
            </Text>
            <Text style={styles.syncSubtitle}>
              {syncError || (pendingChanges
                ? `${pendingChanges} modificări vor fi reîncercate automat.`
                : 'Datele offline sunt criptate pe acest dispozitiv.')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={() => refreshData(user?.id)}
            accessibilityRole="button"
            accessibilityLabel="Sincronizează datele acum"
            disabled={syncStatus === 'syncing'}
          >
            <Text style={styles.syncButtonText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>

      {/* Rată de finalizare */}
      <View style={styles.rateCard}>
        <Text style={styles.rateLabel}>Rată de finalizare</Text>
        <Text style={styles.rateValue}>{completionRate}%</Text>
        <View style={styles.rateBar}>
          <View style={[styles.rateFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.rateSubtitle}>
          {stats.completed} din {stats.total} task-uri finalizate
        </Text>
      </View>

      {/* Statistici detaliate */}
      <Text style={styles.sectionTitle}>📊 Statistici</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: '#4A6CF7' },
          { label: 'Finalizate', value: stats.completed, icon: '✅', color: '#27AE60' },
          { label: 'Active', value: stats.active, icon: '⏳', color: '#F5A623' },
          { label: 'Depășite', value: stats.overdue, icon: '⚠️', color: '#E74C3C' },
        ].map((s) => (
          <View key={s.label} style={[styles.statItem, { borderLeftColor: s.color }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Task-uri urgente */}
      {urgentTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🔴 Task-uri urgente ({urgentTasks.length})</Text>
          {urgentTasks.slice(0, 3).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.urgentCard}
              onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
              accessibilityRole="button"
            >
              <Text style={styles.urgentTitle}>{t.title}</Text>
              {t.dueDate && (
                <Text style={styles.urgentDate}>
                  Scadent: {formatDate(t.dueDate)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Progres pe categorii */}
      {categoryStats.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📁 Progres pe categorii</Text>
          {categoryStats.map((cat) => (
            <View key={cat.id} style={styles.catStatRow}>
              <Text style={styles.catStatIcon}>{cat.icon}</Text>
              <View style={styles.catStatInfo}>
                <View style={styles.catStatHeader}>
                  <Text style={styles.catStatName}>{cat.name}</Text>
                  <Text style={[styles.catStatPercent, { color: cat.color }]}>
                    {cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.catStatBar}>
                  <View
                    style={[
                      styles.catStatFill,
                      {
                        width: cat.total > 0 ? `${(cat.completed / cat.total) * 100}%` : '0%',
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catStatCount}>{cat.completed}/{cat.total} task-uri</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Buton delogare */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Deconectează-te din aplicație"
      >
        <Text style={styles.logoutText}>🚪 Deconectare</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { paddingBottom: 40 },
  profileHeader: {
    backgroundColor: '#4A6CF7',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  memberSince: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  syncCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  syncTextBlock: { flex: 1 },
  syncTitle: { color: '#2C3E6B', fontSize: 14, fontWeight: '700' },
  syncSubtitle: { color: '#7B8AB8', fontSize: 12, marginTop: 4, lineHeight: 17 },
  syncButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#E8EDFF', borderRadius: 9 },
  syncButtonText: { color: '#4A6CF7', fontSize: 12, fontWeight: '700' },
  rateCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rateLabel: { fontSize: 13, color: '#7B8AB8', fontWeight: '600', marginBottom: 4 },
  rateValue: { fontSize: 36, fontWeight: '800', color: '#4A6CF7', marginBottom: 8 },
  rateBar: {
    height: 10,
    backgroundColor: '#E8EDFF',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rateFill: {
    height: '100%',
    backgroundColor: '#4A6CF7',
    borderRadius: 5,
  },
  rateSubtitle: { fontSize: 13, color: '#7B8AB8' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E6B',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#2C3E6B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9BA8C0', fontWeight: '600' },
  urgentCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  urgentTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E6B' },
  urgentDate: { fontSize: 12, color: '#E74C3C', marginTop: 2 },
  catStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  catStatIcon: { fontSize: 24, marginRight: 12 },
  catStatInfo: { flex: 1 },
  catStatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catStatName: { fontSize: 14, fontWeight: '700', color: '#2C3E6B' },
  catStatPercent: { fontSize: 13, fontWeight: '700' },
  catStatBar: {
    height: 6,
    backgroundColor: '#E8EDFF',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  catStatFill: { height: '100%', borderRadius: 3 },
  catStatCount: { fontSize: 11, color: '#9BA8C0' },
  logoutBtn: {
    margin: 20,
    marginTop: 24,
    backgroundColor: '#FDECEA',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5B7B1',
  },
  logoutText: { color: '#E74C3C', fontWeight: '700', fontSize: 15 },
});
