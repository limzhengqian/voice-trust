import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM, tierFromScore } from '../lib/format.js';

const Icon = ({ children, sw = 1.8, fill = 'none' }) =>
  <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw}>{children}</svg>;

export default function Home() {
  const navigate = useNavigate();
  const { user, role, userId } = useAppStore();
  const [pending, setPending] = useState([]);
  const [network, setNetwork] = useState(null);
  const [usersById, setUsersById] = useState({});

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        // Pending loans where user is the guarantor
        const [loans, net, allUsers] = await Promise.all([
          api.loansForUser(userId, 'pending'),
          api.trustNetwork(userId),
          api.listUsers(),
        ]);
        setPending(loans.filter(l => l.guarantor_id === userId));
        setNetwork(net);
        setUsersById(Object.fromEntries(allUsers.map(u => [u.id, u])));
      } catch (e) { console.warn(e.message); }
    })();
  }, [userId]);

  if (!user) return <div style={{ padding: 40, color: '#888', fontSize: 13 }}>Loading…</div>;

  const power = user.borrowing_power || 0;
  const memberCount = (network?.direct?.length || 0);
  const isG = role === 'guarantor';
  const pendingBorrowers = pending.slice(0, 2).map(p => p.borrower_name).filter(Boolean);
  const pendingText = pendingBorrowers.length === 0
    ? 'No pending approvals'
    : pendingBorrowers.length === 1
    ? `${pendingBorrowers[0]} needs your approval`
    : `${pendingBorrowers.join(', ')} need your approval`;
  const test = "";
  return (
    <>
      <div style={{ background: 'linear-gradient(180deg, var(--tng-blue) 0%, var(--tng-blue-deep) 100%)', padding: '8px 20px 80px', color: '#fff', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ background: 'rgba(255,255,255,.18)', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>🇲🇾 MY ▾</div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 22, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tng-text-muted)', fontSize: 13 }}>
            <img
              src="https://www.svgrepo.com/show/532555/search.svg"
              alt="Search"
              style={{
                width: 18,
                height: 18,
                objectFit: 'contain'
              }}
            />
            <span style={{ width: 12 }} />Search
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD500,#FFA800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--tng-text)', border: '2px solid rgba(255,255,255,.3)' }}>
            {user.avatar_initials || user.name?.[0]}
          </div>
        </div>
        <div style={{ padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon sw={2.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></Icon>
            </div>
            <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 30, fontWeight: 700 }}>
              <span style={{ fontSize: 22, marginRight: 4, opacity: .9 }}>RM</span>
              <span style={{ letterSpacing: 6, fontSize: 24 }}>****</span>
            </span>
          </div>
          <div style={{ fontSize: 13, opacity: .85, marginBottom: 14 }}>View asset details ›</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,.5)', color: '#fff', padding: '9px 18px', borderRadius: 22, fontSize: 13, fontWeight: 600 }}>+ Add money</button>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', padding: '9px 4px', fontSize: 13, fontWeight: 600 }}>Transactions ›</button>
          </div>
        </div>
      </div>

      <div style={{ margin: '-50px 16px 0', background: '#fff', borderRadius: 18, padding: '18px 6px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', boxShadow: 'var(--shadow-card)', position: 'relative', zIndex: 5 }}>
        <FeatBtn label="Trust Link" onClick={() => navigate('/network')}>
          <Icon><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></Icon>
        </FeatBtn>
        <FeatBtn label="Apply Loan" onClick={() => navigate('/loan')}>
          <Icon><circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/></Icon>
        </FeatBtn>
        <FeatBtn label="Loans" onClick={() => navigate('/loans')}>
          <Icon><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></Icon>
        </FeatBtn>
        <FeatBtn label="Transfer" onClick={() => useAppStore.getState().showToast('Coming soon')}>
          <Icon><path d="m22 2-20 9 8 3 3 8z"/></Icon>
        </FeatBtn>
      </div>

      <div onClick={() => navigate('/network')} style={{ margin: '14px 16px 0', background: 'linear-gradient(135deg, #1A4FBE 0%, #5B3FD9 100%)', borderRadius: 18, padding: 16, color: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,213,0,.25),transparent 70%)' }} />
        <span style={{ display: 'inline-block', background: 'var(--tng-yellow)', color: 'var(--tng-text)', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, marginBottom: 8, letterSpacing: '.5px' }}>TRUSTGRAPH · AI</span>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, lineHeight: 1.25, marginBottom: 4 }}>Your <b style={{ color: 'var(--tng-yellow)' }}>Trust Link</b> is active</div>
        <div style={{ fontSize: 12, opacity: .85, marginBottom: 10 }}>Tap to view your network and credit power.</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <Stat label="Your Score" value={user.trust_score} yellow />
          <Stat label="Trust Link" value={`${memberCount} members`} />
          <Stat label="Borrowing Power" value={fmtRM(power)} />
        </div>
      </div>

      {isG && pending.length > 0 && (
        <div onClick={() => navigate('/requests')} style={{ margin: '12px 16px 0' }}>
          <div style={{ background: 'linear-gradient(135deg,#FFD500,#FFA800)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 6px 18px rgba(255,168,0,.35)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.2)' }} />
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tng-text)', position: 'relative' }}>
              <img
              src="https://www.svgrepo.com/show/513810/bell.svg"
              alt="Search"
              style={{
                width: 18,
                height: 18,
                objectFit: 'contain'
              }}
            />
              <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--tng-danger)', color: '#fff', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{pending.length}</span>
            </div>
            <div style={{ flex: 1, color: 'var(--tng-text)', position: 'relative' }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13 }}>New Loan Requests</div>
              <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{pendingText}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        <TgAction label="Manage Connections" color="purple" onClick={() => navigate('/connections')} />
        <TgAction label="Trust Network" color="blue"   onClick={() => navigate('/network')} />
        <TgAction label="Apply Loan"     color="success" onClick={() => navigate('/loan')} />
        <TgAction label="My Loans"       color="warn"   onClick={() => navigate('/loans')} />
      </div>

      <div style={{ margin: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--tng-text-muted)', fontWeight: 500 }}>My Trust Score</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Sora,sans-serif', color: 'var(--tng-success)' }}>{user.trust_score} · {tierFromScore(user.trust_score)}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--tng-text-muted)', fontWeight: 500 }}>Borrowing Power</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Sora,sans-serif', color: 'var(--tng-blue)' }}>{fmtRM(power)}</span>
        </div>
      </div>

      <div className="bottom-spacer" />
    </>
  );
}

function FeatBtn({ children, label, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--tng-blue)' }}>
      <div style={{ width: 30, height: 30 }}>{children}</div>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tng-text)' }}>{label}</span>
    </div>
  );
}

function Stat({ label, value, yellow }) {
  return (
    <div style={{ fontSize: 11, opacity: .85 }}>
      {label}
      <b style={{ display: 'block', fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, opacity: 1, color: yellow ? 'var(--tng-yellow)' : '#fff' }}>{value}</b>
    </div>
  );
}

function TgAction({ label, color, onClick }) {
  const palette = {
    purple:  { bg: 'rgba(91,63,217,.1)',  fg: 'var(--tng-purple)' },
    blue:    { bg: 'rgba(26,79,190,.1)',  fg: 'var(--tng-blue)' },
    success: { bg: 'rgba(31,179,107,.1)', fg: 'var(--tng-success)' },
    warn:    { bg: 'rgba(245,158,11,.12)',fg: 'var(--tng-warn)' },
  }[color];
  return (
    <div onClick={onClick} className="card" style={{ padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: palette.bg, color: palette.fg }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/></svg>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  );
}
