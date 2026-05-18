import { isPast, parseISO, format } from 'date-fns';
import PriorityBadge from './PriorityBadge';

const TaskCard = ({ task, onToggle, onDelete }) => {
  const isOverdue = task.due_date && !task.completed && isPast(parseISO(task.due_date));

  return (
    <div style={{
      background: '#fff',
      border: task.completed ? '1px solid #e5e7eb' : '1px solid #e0e0e0',
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      marginBottom: '0.75rem',
      opacity: task.completed ? 0.6 : 1,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 600,
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#9ca3af' : '#1f2937',
          }}>
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {task.description}
          </p>
        )}
        {task.due_date && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400 }}>
            {isOverdue ? '⚠️ Overdue: ' : '📅 Due: '}
            {format(parseISO(task.due_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem', padding: '0 0.25rem' }}
        title="Delete task"
      >
        ✕
      </button>
    </div>
  );
};

export default TaskCard;