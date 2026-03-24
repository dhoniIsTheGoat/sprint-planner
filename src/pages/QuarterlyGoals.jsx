import { useQuarterlyData, HEALTH_CONFIG } from '../hooks/useQuarterlyData';
import QuarterSelector from '../components/QuarterSelector';
import EscalationPanel from '../components/EscalationPanel';
import ProductBreakdown from '../components/ProductBreakdown';

export default function QuarterlyGoals() {
  const {
    filteredProducts, summary, escalations,
    quarters, selectedQuarter, setSelectedQuarter,
    loadStatus, errorMsg, refresh,
  } = useQuarterlyData();

  const overallPct = summary.total > 0 ? Math.round(summary.complete / summary.total * 100) : 0;

  const summaryItems = [
    { label: 'Total Committed', value: summary.total,      color: '#6366f1', sub: 'stories'  },
    { label: 'Complete',        value: summary.complete,   color: HEALTH_CONFIG.COMPLETE.color,    sub: `${overallPct}%` },
    { label: 'In Progress',     value: summary.inProgress + summary.onTrack, color: HEALTH_CONFIG.IN_PROGRESS.color, sub: '' },
    { label: 'Behind',          value: summary.behind,     color: HEALTH_CONFIG.BEHIND.color,      sub: '' },
    { label: 'At Risk',         value: summary.atRisk,     color: HEALTH_CONFIG.AT_RISK.color,     sub: '' },
    { label: 'Overdue',         value: summary.overdue,    color: HEALTH_CONFIG.OVERDUE.color,     sub: '' },
    { label: 'Blocked',         value: summary.blocked,    color: HEALTH_CONFIG.BLOCKED.color,     sub: '' },
  ];

  const progressSegments = [
    { health: 'COMPLETE',    count: summary.complete    },
    { health: 'IN_PROGRESS', count: summary.inProgress  },
    { health: 'ON_TRACK',    count: summary.onTrack     },
    { health: 'BEHIND',      count: summary.behind      },
    { health: 'AT_RISK',     count: summary.atRisk      },
    { health: 'OVERDUE',     count: summary.overdue     },
    { health: 'BLOCKED',     count: summary.blocked     },
  ].filter(s => s.count > 0);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Quarterly Goals Tracker</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
            Track committed stories by quarter across all product boards.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {quarters.length > 0 && (
            <QuarterSelector quarters={quarters} selectedQuarter={selectedQuarter} onChange={setSelectedQuarter} />
          )}
          <button
            onClick={refresh}
            disabled={loadStatus === 'loading'}
            style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, cursor: loadStatus === 'loading' ? 'not-allowed' : 'pointer', color: '#64748b', opacity: loadStatus === 'loading' ? 0.5 : 1 }}
          >
            {loadStatus === 'loading' ? 'Loading…' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {loadStatus === 'loading' && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div>Loading quarterly data from Monday.com…</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Fetching all project boards across workspaces.</div>
        </div>
      )}

      {loadStatus === 'error' && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: 20, color: '#dc2626', fontSize: 14 }}>
          <strong>Error:</strong> {errorMsg}
          {errorMsg.includes('.env') && (
            <pre style={{ marginTop: 10, background: '#fff5f5', borderRadius: 6, padding: 12, fontSize: 12, color: '#7f1d1d' }}>
{`# .env (project root)\nVITE_MONDAY_API_TOKEN=your_token_here`}
            </pre>
          )}
        </div>
      )}

      {loadStatus === 'ready' && (
        <>
          {/* Summary card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16 }}>{selectedQuarter} Summary</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, marginBottom: 20 }}>
              {summaryItems.map(card => (
                <div key={card.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 3 }}>{card.label}</div>
                  {card.sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{card.sub}</div>}
                </div>
              ))}
            </div>

            {/* Stacked progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Overall Progress</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#037f4c' }}>{overallPct}% complete</div>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                {summary.total > 0 && progressSegments.map(s => (
                  <div
                    key={s.health}
                    style={{ width: `${(s.count / summary.total) * 100}%`, background: HEALTH_CONFIG[s.health]?.color, minWidth: 2, transition: 'width 0.4s' }}
                    title={`${HEALTH_CONFIG[s.health]?.label}: ${s.count}`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10 }}>
                {progressSegments.map(s => (
                  <div key={s.health} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: HEALTH_CONFIG[s.health]?.color }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{HEALTH_CONFIG[s.health]?.label} {s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Escalation panel */}
          <EscalationPanel escalations={escalations} />

          {/* Per-product breakdown */}
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
              No stories with timelines found for {selectedQuarter}.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Per-Product Breakdown</span>
                <span style={{ background: '#f1f5f9', borderRadius: 99, padding: '1px 8px', fontSize: 11, color: '#64748b', fontWeight: 600 }}>{filteredProducts.length} products</span>
              </div>
              {filteredProducts.map(product => (
                <ProductBreakdown key={product.boardId} product={product} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
