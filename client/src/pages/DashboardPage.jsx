import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import api from '../api/axios';

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async (taskData) => {
    const res = await api.post('/tasks', taskData);
    setTasks(prev => [res.data, ...prev]);
  };

  const handleToggle = async (task) => {
    const res = await api.patch(`/tasks/${task.id}`, { completed: !task.completed });
    setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
  };

  const handleDelete = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <TaskForm onCreate={handleCreate} />

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <p style={styles.center}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={styles.center}>No tasks yet. Add your first task above!</p>
        ) : (
          <div>
            <p style={styles.count}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '680px', margin: '2rem auto', padding: '0 1rem' },
  center: { textAlign: 'center', color: '#9ca3af', marginTop: '2rem' },
  error: { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' },
  count: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' },
};

export default DashboardPage;