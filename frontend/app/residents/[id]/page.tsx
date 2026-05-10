'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moradoresApi, condominiosApi, Condominio, MoradorCreate } from '@/lib/api';
import styles from '../residents.module.css';

export default function EditResident({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
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
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [residentRes, condominiosRes] = await Promise.all([
        moradoresApi.get(id),
        condominiosApi.list()
      ]);
      
      const resident = residentRes.data;
      setFormData({
        name: resident.name,
        phone: resident.phone,
        cpf: resident.cpf || '',
        unit: resident.unit,
        condominio_id: resident.condominio_id,
      });
      setCondominios(condominiosRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load resident data.');
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
      await moradoresApi.update(id, formData);
      router.push('/residents');
    } catch (err: any) {
      console.error('Error updating resident:', err);
      setError(err.response?.data?.detail || 'Failed to update resident. Please check your data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading resident data...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Resident</h1>
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
            {submitting ? 'Updating...' : 'Update Resident'}
          </button>
        </div>
      </form>
    </div>
  );
}
