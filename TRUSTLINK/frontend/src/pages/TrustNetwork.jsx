import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM, scoreClass } from '../lib/format.js';
import SubHeader from '../components/SubHeader.jsx';
import TrustGraph from '../components/TrustGraph.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';

export default function TrustNetwork() {
  const navigate = useNavigate();
  const userId = useAppStore(s => s.userId);
  const [network, setNetwork] = useState(null);
  const [filter, setFilter] = useState('all');
  const [nodeDetail, setNodeDetail] = useState(null);

  useEffect(() => {
    if (!userId) return;
    api.trustNetwork(userId).then(setNetwork).catch(e => console.warn(e.message));
  }, [userId]);

  const members = network ? [...network.direct, ...network.extended] : [];
  const filtered = members.filter(m => filter === 'all' || m.role === filter);

  const score = network?.me?.trust_score || 0;
  const dashOffset = 264 - (score / 850) * 264;

  return (
    <>
      <SubHeader title="Trust Link" back={-1} action="⋮" onAction={() => useAppStore.getState().showToast('Filter options')} />

      {/* Score summary */}
      <div className="card" style={{ margin: '14px 16px', padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD500" /><stop offset="100%" stopColor="#1FB36B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--tng-line)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#miniGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="264" strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora,sans-serif' }}>
            <b style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{score}</b>
            <span style={{ fontSize: 9, color: 'var(--tng-text-muted)', marginTop: 2 }}>/ 850</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Trust Link Score</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {network?.me?.name || 'You'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 4 }}>
            <b style={{ color: 'var(--tng-success)' }}>{network?.direct?.length || 0} active</b> · {network?.extended?.length || 0} extended
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ margin: '0 16px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          ['all', 'All'],
          ['guarantor', 'My Guarantors'],
          ['guarantee', 'I Vouch For'],
          ['extended', 'Extended (2-hop)'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 14,
              background: filter === k ? 'var(--tng-blue)' : '#fff',
              color: filter === k ? '#fff' : 'var(--tng-text-muted)',
              border: `1.5px solid ${filter === k ? 'var(--tng-blue)' : 'var(--tng-line)'}`,
              fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
        ))}
      </div>

      {/* Graph */}
      <div className="card" style={{ margin: '0 16px 14px', padding: 14, height: 300, position: 'relative', overflow: 'hidden' }}>
        <TrustGraph network={network} onNodeClick={setNodeDetail} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: 'var(--tng-text-muted)', background: 'rgba(255,255,255,.85)', padding: '6px 8px', borderRadius: 8 }}>
          <Legend color="#1A4FBE" label="You" />
          <Legend color="#5B3FD9" label="Guarantor" />
          <Legend color="#1FB36B" label="Guarantee" />
          <Legend color="#94A3B8" label="2-hop" />
        </div>
      </div>

      {/* Members */}
      <div style={{ margin: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700, margin: 0 }}>Network Members</h3>
          <button onClick={() => navigate('/connections')}
            style={{ background: 'var(--tng-blue)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(26,79,190,.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Trust Link
          </button>
        </div>

        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--tng-text-muted)', fontSize: 12 }}>No members in this view yet.</div>}

        {filtered.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: 12, cursor: 'pointer' }}
               onClick={() => navigate(`/manage/${m.id}`)}>
            <Avatar user={m} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.name}
                <span className={`role-tag-mini ${m.role === 'guarantor' ? 'guarantor' : m.role === 'guarantee' ? 'guarantee' : ''}`}>
                  {m.role === 'extended' ? 'Extended' : m.role === 'guarantor' ? 'Guarantor' : 'Guarantee'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 2 }}>
                {m.relationship || (m.hop === 2 ? '2-hop' : 'Direct')}{m.hop === 1 ? ' · 1-hop' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className={`score-num ${scoreClass(m.trust_score || 0)}`} style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700 }}>
                {m.trust_score}
              </div>
              <div style={{ fontSize: 9, color: 'var(--tng-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>trust</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-spacer" style={{ height: 90 }} />

      {/* Node detail modal */}
      <Modal open={!!nodeDetail} onClose={() => setNodeDetail(null)}>
        {nodeDetail && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar user={nodeDetail} size={60} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700 }}>{nodeDetail.name}</div>
                <div style={{ fontSize: 12, color: 'var(--tng-text-muted)' }}>Trust score: <b>{nodeDetail.score}</b></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNodeDetail(null)} style={{ flex: 1, padding: 14, background: 'var(--tng-bg)', color: 'var(--tng-text)', border: '1.5px solid var(--tng-line)', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { setNodeDetail(null); navigate(`/manage/${nodeDetail.id}`); }}
                style={{ flex: 1, padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(26,79,190,.3)' }}>Manage</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />{label}
    </div>
  );
}
