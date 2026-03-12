export default function StatusLegend({ statusCounts, colorMap }) {
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
      {entries.map(([label, count]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: colorMap[label] || '#94a3b8', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}
