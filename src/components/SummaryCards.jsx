export default function SummaryCards({ entries }) {
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const people     = new Set(entries.map(e => e.userId)).size;
  const tasks      = new Set(entries.map(e => `${e.boardName}::${e.taskName}`)).size;

  const cards = [
    { label: 'Total Hours',     value: totalHours.toFixed(1), color: '#6366f1' },
    { label: 'Team Members',    value: people,                color: '#10b981' },
    { label: 'Tasks w/ Time',   value: tasks,                 color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'white',
          borderRadius: 10,
          padding: '16px 20px',
          borderLeft: `4px solid ${c.color}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
