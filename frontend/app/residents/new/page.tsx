'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moradoresApi, condominiosApi, Condominio, MoradorCreate } from '@/lib/api';
import styles from '../residents.module.css';

export default function NewResident() {
  const router = useRouter();
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MoradorCreate>({
    name: '',
    phone: '',
    cpf: '',
    unit: '',
    condominio_id: '',
  });

  useEffect(() => {
    fetchCondominios();
  }, []);

  const fetchCondominios = async () => {
    try {
      const response = await condominiosApi.list();
      setCondominios(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, condominio_id: response.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching condominios:', err);
      setError('Failed to load condominios.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await moradoresApi.create(formData);
      router.push('/residents');
    } catch (err: any) {
      console.error('Error creating resident:', err);
      setError(err.response?.data?.detail || 'Failed to create resident. Please check your data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading form...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>New Resident</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="name">Full Name</label>
          <input
            className={styles.input}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="phone">Phone Number</label>
          <input
            className={styles.input}
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+55 11 99999-9999"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="cpf">CPF (Optional)</label>
          <input
            className={styles.input}
            type="text"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="unit">Unit / Apartment</label>
          <input
            className={styles.input}
            type="text"
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            placeholder="Apt 101"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="condominio_id">Condominio</label>
          <select
            className={styles.select}
            id="condominio_id"
            name="condominio_id"
            value={formData.condominio_id}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select a condominio</option>
            {condominios.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Link href="/residents" className={`${styles.button} ${styles.buttonSecondary}`}>
            Cancel
          </Link>
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Resident'}
          </button>
        </div>
      </form>
    </div>
  );
}
