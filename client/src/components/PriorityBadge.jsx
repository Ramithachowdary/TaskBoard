const colors = {
  high: { bg: '#fee2e2', color: '#dc2626' },
  medium: { bg: '#fef9c3', color: '#ca8a04' },
  low: { bg: '#dcfce7', color: '#16a34a' },
};

const PriorityBadge = ({ priority }) => {
  const style = colors[priority] || colors.medium;
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 8px', borderRadius: '12px',
      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
    }}>
      {priority}
    </span>
  );
};

export default PriorityBadge;