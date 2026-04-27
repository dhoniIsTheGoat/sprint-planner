import { NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',                label: 'Sprint Review'   },
  { to: '/time-log',        label: 'Hours Logged'    },
  { to: '/dashboard',       label: 'Dashboard'       },
  { to: '/quarterly-goals', label: 'Quarterly Goals' },
  { to: '/team-workload',   label: 'Team Workload'   },
  { to: '/product-leads',   label: 'Product Leads'   },
  { to: '/setup',           label: 'Setup'           },
];

export default function NavBar() {
  return (
    <nav style={{
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#6366f1', marginRight: 28, whiteSpace: 'nowrap', padding: '14px 0' }}>
        Planer
      </div>
      {NAV_LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            padding: '14px 16px',
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#a5b4fc' : '#94a3b8',
            textDecoration: 'none',
            borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'color 0.15s',
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
