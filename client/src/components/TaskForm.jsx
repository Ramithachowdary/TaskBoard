import { useState } from 'react';

const TaskForm = ({ onCreate }) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setError('');
    setLoading(true);
    try {
      await onCreate({ ...form, due_date: form.due_date || null });
      setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.heading}>New Task</h3>
      {error && <div style={styles.error}>{error}</div>}
      <input style={styles.input} name="title" placeholder="Task title *" value={form.title} onChange={handleChange} required />
      <textarea style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }} name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />
      <div style={styles.row}>
        <select style={styles.select} name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input style={styles.dateInput} type="date" name="due_date" value={form.due_date} onChange={handleChange} />
      </div>
      <button style={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Adding...' : '+ Add Task'}
      </button>
    </form>
  );
};

const styles = {
  form: { background: '#fff', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  heading: { marginBottom: '1rem', color: '#1f2937', fontWeight: 700 },
  input: { display: 'block', width: '100%', padding: '0.65rem 0.9rem', marginBottom: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem' },
  row: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' },
  select: { flex: 1, padding: '0.65rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem' },
  dateInput: { flex: 1, padding: '0.65rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem' },
  btn: { width: '100%', padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.875rem' },
};

export default TaskForm;