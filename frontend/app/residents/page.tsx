'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { moradoresApi, Morador } from '@/lib/api';
import styles from './residents.module.css';

export default function ResidentsList() {
  const [residents, setResidents] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const response = await moradoresApi.list();
      setResidents(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching residents:', err);
      setError('Failed to load residents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resident?')) return;
    
    try {
      await moradoresApi.delete(id);
      setResidents(residents.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting resident:', err);
      alert('Failed to delete resident.');
    }
  };

  if (loading) return <div className={styles.loading}>Loading residents...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Residents</h1>
        <Link href="/residents/new" className={styles.button}>
          New Resident
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Unit</th>
              <th className={styles.th}>Phone</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {residents.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: 'center' }}>
                  No residents found.
                </td>
              </tr>
            ) : (
              residents.map((resident) => (
                <tr key={resident.id}>
                  <td className={styles.td}>{resident.name}</td>
                  <td className={styles.td}>{resident.unit}</td>
                  <td className={styles.td}>{resident.phone}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <Link href={`/residents/${resident.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(resident.id)} 
                        className={`${styles.button} ${styles.buttonDanger}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
