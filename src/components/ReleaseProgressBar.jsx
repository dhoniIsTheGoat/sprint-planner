export default function ReleaseProgressBar({ statusCounts, total, colorMap, completion, light }) {
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: light ? 8 : 12, borderRadius: 6, background: light ? 'rgba(255,255,255,0.25)' : '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
        {entries.map(([label, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const color = light ? 'rgba(255,255,255,0.85)' : (colorMap[label] || '#94a3b8');
          return (
            <div
              key={label}
              style={{ width: `${pct}%`, background: color, transition: 'width 0.3s', minWidth: pct > 0 ? 2 : 0 }}
              title={`${label}: ${count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      {!light && (
        <div style={{ fontSize: 12, fontWeight: 700, color: completion === 100 ? '#16a34a' : '#475569', minWidth: 36, textAlign: 'right' }}>
          {completion}%
        </div>
      )}
    </div>
  );
}
