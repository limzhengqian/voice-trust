import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const Icon = ({ d, fill = 'none', stroke = 'currentColor', sw = 2 }) => (
  <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>{d}</svg>
);

export default function BottomNav() {
  const navigate = useNavigate();
  const loc = useLocation();
  const isActive = (p) => loc.pathname === p;

  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${isActive('/home') ? 'active' : ''}`} onClick={() => navigate('/home')}>
        <Icon fill="currentColor" stroke="none" d={<path d="M3 12 12 3l9 9v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>} />
        <span>Home</span>
      </button>
      <button className={`nav-item ${isActive('/network') ? 'active' : ''}`} onClick={() => navigate('/network')}>
        <Icon d={<><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></>} />
        <span>Network</span>
      </button>
      <button className="nav-item nav-scan" onClick={() => navigate('/connections')}>
        <Icon sw={2.5} d={<><circle cx="9" cy="9" r="4"/><path d="M16 11h6M19 8v6"/></>} />
      </button>
      <button className={`nav-item ${isActive('/loan') ? 'active' : ''}`} onClick={() => navigate('/loan')}>
        <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/></>} />
        <span>Apply</span>
      </button>
      <button className={`nav-item ${isActive('/loans') ? 'active' : ''}`} onClick={() => navigate('/loans')}>
        <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>} />
        <span>Loans</span>
      </button>
    </nav>
  );
}
