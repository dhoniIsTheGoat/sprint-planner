import { useState } from 'react';

function groupByPerson(entries) {
  const map = {};
  entries.forEach(e => {
    if (!map[e.userId]) {
      map[e.userId] = { userId: e.userId, userName: e.userName, totalHours: 0, tasks: [] };
    }
    map[e.userId].totalHours = parseFloat((map[e.userId].totalHours + e.hours).toFixed(2));
    map[e.userId].tasks.push(e);
  });
  return Object.values(map).sort((a, b) => b.totalHours - a.totalHours);
}

export default function PersonSummary({ entries }) {
  const [open, setOpen] = useState({});
  const people = groupByPerson(entries);

  const toggle = uid => setOpen(prev => ({ ...prev, [uid]: !prev[uid] }));

  if (people.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
        No data to display.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {people.map(person => {
        const isOpen = !!open[person.userId];
        return (
          <div key={person.userId} style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <button
              onClick={() => toggle(person.userId)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: isOpen ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{person.userName}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{person.totalHours.toFixed(1)} hrs total</span>
            </button>

            {isOpen && (
              <div style={{ padding: '8px 16px 12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>Product</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>Task</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.tasks.map((t, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{t.productName}</td>
                        <td style={{ padding: '6px 8px', color: '#374151', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.taskName}>
                          {t.taskName}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#6366f1' }}>{t.hours.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
