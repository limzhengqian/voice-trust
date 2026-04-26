import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import BottomNav from './BottomNav.jsx';
import Toast from './Toast.jsx';

export default function PhoneShell() {
  const role = useAppStore(s => s.role);
  const setRole = useAppStore(s => s.setRole);
  const refreshUser = useAppStore(s => s.refreshUser);
  const user = useAppStore(s => s.user);
  const loc = useLocation();

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const roleLabel = role === 'guarantor'
    ? `GUARANTOR · ${user?.name?.split(' ')[0] || 'Aiman'}`
    : `BORROWER · ${user?.name?.split(' ')[0] || 'Siti'}`;

  return (
    <div className="app-shell">
      <div className="role-switcher">
        <button className={role === 'guarantor' ? 'active' : ''} onClick={() => setRole('guarantor')}>Guarantor View</button>
        <button className={role === 'guarantee' ? 'active' : ''} onClick={() => setRole('guarantee')}>Borrower View</button>
      </div>

      <div className="phone-wrap">
        <div className="phone">
          <div className="notch" />
          <div className="role-tag"><span className="dot" /> {roleLabel}</div>
          <div className="statusbar">
            <span>20:46</span>
            <div className="right"><span>5G</span><span>•••</span><span>81</span></div>
          </div>
          <Toast />
          <div className="page-area">
            <div className="page" key={loc.pathname /* re-mount per route for clean transitions */}>
              <Outlet />
            </div>
          </div>
          <BottomNav />
        </div>
        <div className="phone-caption">TNG VoiceTrust · Trust Link</div>
      </div>
    </div>
  );
}
