import { HEALTH_CONFIG } from '../hooks/useQuarterlyData';

export default function HealthBadge({ health, small }) {
  const cfg = HEALTH_CONFIG[health] || { color: '#94a3b8', label: health || '—', bg: '#f1f5f9' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color, borderRadius: 99,
      padding: small ? '2px 8px' : '3px 10px',
      fontSize: small ? 11 : 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
