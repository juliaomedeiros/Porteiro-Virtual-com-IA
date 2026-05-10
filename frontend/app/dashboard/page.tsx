'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, condominiosApi, Condominio, Interacao, Stats } from '@/lib/api';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Interacao[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  useEffect(() => {
    if (selectedCondominio) {
      fetchDashboardData(selectedCondominio);
    }
  }, [selectedCondominio]);

  const fetchCondominios = async () => {
    try {
      const response = await condominiosApi.list();
      setCondominios(response.data);
      if (response.data.length > 0) {
        setSelectedCondominio(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching condominios:', err);
      setError('Failed to load condominios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (condominioId: string) => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        analyticsApi.getStats(condominioId),
        analyticsApi.getLogs(condominioId, { limit: 10 })
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && condominios.length === 0) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Interaction Dashboard</h1>
        <select 
          className={styles.select}
          value={selectedCondominio}
          onChange={(e) => setSelectedCondominio(e.target.value)}
        >
          {condominios.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Interactions</span>
            <span className={styles.statValue}>{stats.total_interactions}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Escalated to Human</span>
            <span className={`${styles.statValue} ${stats.escalated_interactions > 0 ? styles.warning : ''}`}>
              {stats.escalated_interactions}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Escalation Rate</span>
            <span className={styles.statValue}>{stats.escalation_rate.toFixed(1)}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Tokens Used</span>
            <span className={styles.statValue}>{stats.total_tokens_used.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Interactions</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Message</th>
                <th className={styles.th}>Response</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.td} style={{ textAlign: 'center' }}>
                    No interactions found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                    <td className={styles.td}>{log.user_message.substring(0, 50)}...</td>
                    <td className={styles.td}>{log.ai_response.substring(0, 50)}...</td>
                    <td className={styles.td}>
                      {log.is_escalated ? (
                        <span className={`${styles.badge} ${styles.badgeEscalated}`}>ESCALATED</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeResolved}`}>RESOLVED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
