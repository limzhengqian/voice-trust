import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import SubHeader from '../components/SubHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';

export default function Connections() {
  const navigate = useNavigate();
  const userId = useAppStore(s => s.userId);
  const showToast = useAppStore(s => s.showToast);
  const [allUsers, setAllUsers] = useState([]);
  const [network, setNetwork] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [relationship, setRelationship] = useState('Family');
  const [showConsent, setShowConsent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const reload = async () => {
    const [u, n] = await Promise.all([api.listUsers(), api.trustNetwork(userId)]);
    setAllUsers(u);
    setNetwork(n);
  };
  useEffect(() => { if (userId) reload(); }, [userId]);

  const inNetworkIds = useMemo(() => {
    if (!network) return new Set();
    return new Set([userId, ...network.direct.map(d => d.id)]);
  }, [network, userId]);

  const candidates = allUsers
    .filter(u => !inNetworkIds.has(u.id))
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  const inNetwork = (network?.direct || []);

  const toggle = (u) => {
    setSelected(prev => prev.find(p => p.id === u.id) ? prev.filter(p => p.id !== u.id) : [...prev, u]);
  };

  const confirm = async () => {
    setShowConsent(false);
    try {
      // Create trust requests for each selected contact (auto-accept on backend
      // for the demo so the network updates immediately).
      for (const u of selected) {
        const req = await api.trustRequest(userId, u.id, relationship);
        await api.trustAccept(req.id);
      }
      setShowSuccess(true);
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  const onSuccessClose = async () => {
    setShowSuccess(false);
    setSelected([]);
    await reload();
    navigate('/network');
  };

  return (
    <>
      <SubHeader title="Manage Connections" back="/network" />

      <div style={{ margin: '14px 16px 0', background: '#fff', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center' }}>
        <Stat num={inNetwork.length} label="In Network" />
        <Sep />
        <Stat num={(network?.pending || []).length} label="Pending" color="var(--tng-warn)" />
        <Sep />
        <Stat num={selected.length} label="Selected" color="var(--tng-blue)" />
      </div>

      <SectionHeader title="Add New Connections" sub="Select people to invite into your trust link" />

      <div style={{ margin: '14px 16px 8px', background: '#fff', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-card)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--tng-text-muted)' }}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--tng-text)', background: 'transparent', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ margin: '14px 20px 8px', fontSize: 11, fontWeight: 700, color: 'var(--tng-text-muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Suggested · From your TNG contacts</div>
      <div style={{ margin: '0 16px 14px' }}>
        {candidates.map(u => {
          const isSel = selected.find(s => s.id === u.id);
          return (
            <div key={u.id} onClick={() => toggle(u)} style={{ background: isSel ? 'rgba(26,79,190,.04)' : '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--tng-line)', cursor: 'pointer' }}>
              <Avatar user={u} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 2 }}>{u.phone} · TNG verified</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--tng-blue)' : 'var(--tng-line)'}`, background: isSel ? 'var(--tng-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isSel && <span style={{ width: 10, height: 6, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translate(1px,-1px)' }} />}
              </div>
            </div>
          );
        })}
        {candidates.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 12 }}>No more contacts to add.</div>}
      </div>

      <SectionHeader title="Currently in your Trust Link" sub="Tap to manage relationship" />
      <div style={{ margin: '0 16px 14px' }}>
        {inNetwork.map(u => (
          <div key={u.id} onClick={() => navigate(`/manage/${u.id}`)} style={{ background: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--tng-line)', cursor: 'pointer' }}>
            <Avatar user={u} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 2 }}>{u.role === 'guarantor' ? 'Guarantor' : 'Guarantee'} · {u.relationship || '—'}</div>
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--tng-success)' }}>{u.trust_score} ›</div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'sticky', bottom: 74, background: 'var(--tng-bg)', padding: '14px 16px', boxShadow: '0 -8px 16px -8px rgba(15,30,80,0.06)' }}>
        {selected.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 10, boxShadow: 'var(--shadow-card)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, color: 'var(--tng-text-muted)' }}>
              <b style={{ color: 'var(--tng-text)' }}>{selected.length}</b> selected to add
            </span>
            <span onClick={() => setSelected([])} style={{ color: 'var(--tng-blue)', fontWeight: 600, cursor: 'pointer' }}>Clear</span>
          </div>
        )}
        <button disabled={selected.length === 0} onClick={() => setShowConsent(true)}
          style={{ width: '100%', padding: 15, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 20px rgba(26,79,190,.3)', opacity: selected.length === 0 ? .4 : 1 }}>
          {selected.length > 0 ? `Create (${selected.length})` : 'Create'}
        </button>
      </div>

      <Modal open={showConsent} onClose={() => setShowConsent(false)}>
        <div className="consent-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Confirm Trust Link</h2>
        <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
          You're adding <b>{selected.length} {selected.length === 1 ? 'person' : 'people'}</b> to your Trust Link.
        </p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tng-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Default relationship</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Family', 'Friend', 'Colleague', 'Employer', 'Community'].map(r => (
              <button key={r} onClick={() => setRelationship(r)}
                style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${relationship === r ? 'var(--tng-blue)' : 'var(--tng-line)'}`, background: relationship === r ? 'var(--tng-blue)' : '#fff', color: relationship === r ? '#fff' : 'var(--tng-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowConsent(false)} style={{ flex: 1, padding: 14, background: 'var(--tng-bg)', color: 'var(--tng-text)', border: '1.5px solid var(--tng-line)', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={confirm} style={{ flex: 1, padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(26,79,190,.3)' }}>Confirm</button>
        </div>
      </Modal>

      <Modal open={showSuccess} onClose={onSuccessClose}>
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Trust Link created!</h2>
        <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
          Your network now includes {selected.map(s => s.name).join(', ')}.
        </p>
        <button onClick={onSuccessClose} style={{ width: '100%', padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Done</button>
      </Modal>
    </>
  );
}

function Stat({ num, label, color = 'var(--tng-text)' }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 10, color: 'var(--tng-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginTop: 4 }}>{label}</div>
    </div>
  );
}
const Sep = () => <div style={{ width: 1, height: 28, background: 'var(--tng-line)' }} />;

function SectionHeader({ title, sub }) {
  return (
    <div style={{ margin: '18px 20px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--tng-text)' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
