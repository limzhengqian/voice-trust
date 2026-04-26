import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM, scoreClass, tierFromScore } from '../lib/format.js';
import SubHeader from '../components/SubHeader.jsx';
import Avatar from '../components/Avatar.jsx';

const RELATIONSHIPS = ['Family', 'Friend', 'Colleague', 'Employer', 'Community', 'Niece', 'Nephew', 'Spouse', 'Sibling'];

export default function ManageGuarantee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = useAppStore(s => s.userId);
  const showToast = useAppStore(s => s.showToast);
  const [member, setMember] = useState(null);
  const [edge, setEdge] = useState(null); // current viewer ↔ member relationship row
  const [loans, setLoans] = useState([]);
  const [strength, setStrength] = useState(null);
  const [path, setPath] = useState(null);

  // Editable form state
  const [relationship, setRelationship] = useState('Family');
  const [description, setDescription] = useState('');
  const [liabilityCap, setLiabilityCap] = useState(5000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await api.getUser(id);
        setMember(u);
        const [l, s, net] = await Promise.all([
          api.loansForUser(id),
          api.trustStrength(id),
          api.trustNetwork(userId),
        ]);
        setLoans(l);
        setStrength(s);

        const direct = net.direct.find(d => d.id === id);
        if (direct) {
          setEdge(direct);
          setRelationship(direct.relationship || 'Family');
          setDescription(direct.description || '');
          setLiabilityCap(direct.liability_cap ?? 5000);
          setPath(['You', direct.name]);
        } else {
          const ext = net.extended.find(e => e.id === id);
          if (ext) {
            const via = net.direct.find(d => d.id === ext.via);
            setPath(['You', via?.name || '?', ext.name]);
          }
        }
      } catch (e) { showToast(e.message); }
    })();
  }, [id, userId]);

  if (!member) return <div style={{ padding: 40, color: '#888' }}>Loading…</div>;

  const score = member.trust_score;
  const isDirect = !!edge;

  const save = async () => {
    setSaving(true);
    try {
      await api.updateRelationship({
        user_id: userId,
        peer_id: id,
        relationship, description,
        liability_cap: Number(liabilityCap),
      });
      showToast(`Saved · ${member.name} updated ✓`);
      setTimeout(() => navigate('/network'), 700);
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <SubHeader title="Member Details" back="/network" />

      {/* ===== User Information ===== */}
      <SectionLabel>User Information</SectionLabel>
      <div className="card" style={{ margin: '0 16px 6px', padding: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--tng-line)', marginBottom: 14 }}>
          <Avatar user={member} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{member.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`role-tag-mini ${edge?.role === 'guarantor' ? 'guarantor' : edge?.role === 'guarantee' ? 'guarantee' : ''}`}>
                {edge?.role === 'guarantor' ? 'Guarantor' : edge?.role === 'guarantee' ? 'Guarantee' : 'Extended'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(31,179,107,.12)', color: 'var(--tng-success)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5L20 7"/></svg>
                eKYC Verified
              </span>
            </div>
          </div>
        </div>
        <Info k="Phone" v={member.phone} />
        <Info k="Email" v={member.email} />
        <Info k="Trust Tier" v={tierFromScore(score)} />
        <Info k="Borrowing Power" v={fmtRM(member.borrowing_power || 0)} />
        {path && <Info k="Trust Path" v={path.join(' → ')} />}
      </div>

      {/* ===== Trust Score ===== */}
      <SectionLabel>Trust Score</SectionLabel>
      <div className="card" style={{ margin: '0 16px 6px', padding: 16, background: 'linear-gradient(135deg, rgba(26,79,190,.04), rgba(91,63,217,.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 90, height: 90, position: 'relative', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="manGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD500"/><stop offset="100%" stopColor="#1FB36B"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--tng-line)" strokeWidth="7"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#manGrad)" strokeWidth="7" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - (score / 850) * 264}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora,sans-serif' }}>
              <b className={`score-num ${scoreClass(score)}`} style={{ fontSize: 24, fontWeight: 800 }}>{score}</b>
              <span style={{ fontSize: 9, color: 'var(--tng-text-muted)', marginTop: 2 }}>/ 850</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', background: 'var(--tng-success)', color: '#fff', fontFamily: 'Sora,sans-serif', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10, letterSpacing: .5, marginBottom: 8 }}>{tierFromScore(score)}</div>
            <div style={{ fontSize: 12, color: 'var(--tng-text-muted)' }}>
              Trust Strength: <b style={{ color: 'var(--tng-text)' }}>{strength ? strength.strength : '—'}</b>
              <br/>Direct links: <b style={{ color: 'var(--tng-text)' }}>{strength?.links ?? 0}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Relationship Settings (only for direct trust links) ===== */}
      {isDirect && (
        <>
          <SectionLabel>Relationship Settings</SectionLabel>
          <div className="card" style={{ margin: '0 16px 6px', padding: 16 }}>
            <Field label="Relationship">
              <select value={relationship} onChange={e => setRelationship(e.target.value)} style={fieldStyle}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Description / Notes">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Add a note about this relationship…" style={{ ...fieldStyle, resize: 'none' }} />
            </Field>
            <Field label="Liability Cap (RM)" hint="Maximum amount you'll back as guarantor">
              <input type="number" min="0" step="500" value={liabilityCap}
                onChange={e => setLiabilityCap(e.target.value)} style={fieldStyle} />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={save} disabled={saving}
                style={{ flex: 1, padding: 11, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? .5 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => showToast('Removal flow not implemented in demo')}
                style={{ padding: '11px 16px', background: 'rgba(224,53,75,.1)', color: 'var(--tng-danger)', border: '1.5px solid rgba(224,53,75,.2)', borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                Remove
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== Loan History ===== */}
      <SectionLabel>Loan History <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 500, color: 'var(--tng-text-muted)', textTransform: 'none', letterSpacing: 0 }}>{loans.length} total</span></SectionLabel>
      <div className="card" style={{ margin: '0 16px 6px', padding: 14 }}>
        {loans.length === 0 && <div style={{ color: 'var(--tng-text-muted)', fontSize: 12, textAlign: 'center', padding: 12 }}>No loans yet.</div>}
        {loans.map(l => (
          <div key={l.id} style={{ background: 'var(--tng-bg)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700 }}>{fmtRM(l.amount)}</div>
              <span className={`status-badge ${l.status === 'active' ? 'ontime' : l.status === 'pending' ? 'pending' : l.status === 'repaid' ? 'completed' : 'overdue'}`}>{l.status}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--tng-text-muted)' }}>
              {l.term_months}-month plan · {l.purpose || 'Personal'}
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-spacer" style={{ height: 90 }} />
    </>
  );
}

const fieldStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--tng-line)', borderRadius: 10,
  fontSize: 13, color: 'var(--tng-text)', outline: 'none',
  background: '#fff', fontFamily: 'inherit',
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--tng-text-muted)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--tng-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ margin: '18px 20px 8px', fontFamily: 'Sora,sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--tng-text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
      {children}
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--tng-text-muted)', fontWeight: 500 }}>{k}</span>
      <span style={{ fontWeight: 600, color: 'var(--tng-text)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{v || '—'}</span>
    </div>
  );
}
