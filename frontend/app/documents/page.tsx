'use client';

import { useEffect, useState } from 'react';
import { documentosApi, condominiosApi, Condominio, Documento } from '@/lib/api';
import styles from './documents.module.css';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  useEffect(() => {
    if (selectedCondominio) {
      fetchDocuments(selectedCondominio);
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

  const fetchDocuments = async (condominioId: string) => {
    try {
      setLoading(true);
      const response = await documentosApi.list(condominioId);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCondominio) return;

    if (!file.name.toLowerCase().endswith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await documentosApi.upload(selectedCondominio, file);
      fetchDocuments(selectedCondominio);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? All associated RAG embeddings will be removed.')) return;

    try {
      await documentosApi.delete(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  if (loading && condominios.length === 0) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Documents & RAG</h1>
        <div className={styles.controls}>
          <select 
            className={styles.select}
            value={selectedCondominio}
            onChange={(e) => setSelectedCondominio(e.target.value)}
          >
            {condominios.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className={styles.uploadBtnWrapper}>
            <button className={styles.button} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
            <input type="file" name="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Created At</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: 'center' }}>
                  No documents found for this condominio.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className={styles.td}>{doc.name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.status} ${styles[doc.status.toLowerCase()]}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className={styles.td}>{new Date(doc.created_at).toLocaleString()}</td>
                  <td className={styles.td}>
                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      className={`${styles.button} ${styles.buttonDanger}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className={styles.info}>
        <h3>About RAG Monitoring</h3>
        <p>
          When a document is uploaded, it goes through a pipeline:
          <strong> Extracting Text → Chunking → Embedding → Indexing</strong>.
        </p>
        <ul>
          <li><strong>PROCESSANDO</strong>: The document is being analyzed and indexed.</li>
          <li><strong>INDEXADO</strong>: The document is ready to be used by the AI to answer questions.</li>
          <li><strong>ERRO</strong>: Something went wrong during processing (e.g., corrupt PDF).</li>
        </ul>
      </div>
    </div>
  );
}
