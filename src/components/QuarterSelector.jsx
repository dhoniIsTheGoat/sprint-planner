export default function QuarterSelector({ quarters, selectedQuarter, onChange }) {
  return (
    <select
      value={selectedQuarter || ''}
      onChange={e => onChange(e.target.value)}
      style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#1e293b', background: 'white', cursor: 'pointer', outline: 'none' }}
    >
      {quarters.map(q => <option key={q} value={q}>{q}</option>)}
    </select>
  );
}
