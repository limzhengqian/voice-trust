import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM, monthlyPayment } from '../lib/format.js';
import SubHeader from '../components/SubHeader.jsx';
import Modal from '../components/Modal.jsx';

export default function ApplyLoan() {
  const navigate = useNavigate();
  const { user, userId, role } = useAppStore();
  const showToast = useAppStore(s => s.showToast);

  const [network, setNetwork] = useState(null);
  const [amount, setAmount] = useState(3000);
  const [term, setTerm] = useState(6);
  const [submitted, setSubmitted] = useState(false);
  const [decision, setDecision] = useState(null);
  const [hasPending, setHasPending] = useState(false);

  const isGuarantor = role === 'guarantor';

  const reload = async () => {
    if (!userId) return;
    const [n, mine] = await Promise.all([
      api.trustNetwork(userId),
      api.loansForUser(userId, 'pending'),
    ]);
    setNetwork(n);
    setHasPending(mine.some(l => l.borrower_id === userId));
  };

  useEffect(() => { reload(); }, [userId]);

  const cap = user?.borrowing_power || 0;
  const monthly = useMemo(() => Math.round(monthlyPayment(amount, term)), [amount, term]);

  const submit = async () => {
    try {
      const res = await api.loanApply({
        borrower_id: userId,
        amount, term_months: term, purpose: 'Personal use',
        // Network-anchor guarantors don't require external approval — their
        // own trust score is the underwriting signal. Guarantees do.
        auto_approve: isGuarantor,
      });
      setDecision(res);
      setSubmitted(true);
      reload();
    } catch (e) { showToast('Error: ' + e.message); }
  };

  if (!user) return <div style={{ padding: 40, color: '#888' }}>Loading…</div>;

  return (
    <>
      <SubHeader title="Apply Loan" back="/home" />

      {/* Persistent pending status banner — visible whenever user has an
          unapproved application of their own */}
      {hasPending && !submitted && (
        <div style={{ margin: '14px 16px', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,.1)', border: '1.5px solid rgba(245,158,11,.3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,.2)', color: 'var(--tng-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Awaiting Guarantor Approval</div>
            <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 2 }}>Your guarantor has been notified. Usually within 24 hrs.</div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ margin: '14px 16px', background: 'linear-gradient(135deg, #1A4FBE, #5B3FD9)', borderRadius: 18, padding: 18, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,213,0,.25),transparent 70%)' }} />
        <div style={{ fontSize: 11, letterSpacing: 1.5, opacity: .7, textTransform: 'uppercase', fontWeight: 600, position: 'relative' }}>Trust Link · Eligible Amount</div>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 30, fontWeight: 800, marginTop: 4, position: 'relative', lineHeight: 1.1 }}>
          <span style={{ fontSize: 18, opacity: .8, marginRight: 4 }}>RM</span>{cap.toLocaleString('en-MY')}
        </div>
        <div style={{ fontSize: 12, opacity: .85, marginTop: 6, position: 'relative' }}>at 6.8% p.a. · Powered by your Trust Link</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, position: 'relative' }}>
          <ScoreMini label="Personal Score" value={user.trust_score} />
          <ScoreMini label="Trust Network" value={`${network?.direct?.length || 0} members`} yellow />
        </div>
      </div>

      {/* Sim card */}
      <div className="card" style={{ margin: '14px 16px', padding: 18 }}>
        <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          How much do you need?<span style={{ fontSize: 10, color: 'var(--tng-text-muted)', fontWeight: 500 }}>Max <b style={{ color: 'var(--tng-blue)', fontWeight: 700 }}>{fmtRM(cap)}</b></span>
        </h3>
        <div style={{ textAlign: 'center', margin: '8px 0 18px' }}>
          <span style={{ fontSize: 14, color: 'var(--tng-text-muted)', fontWeight: 600 }}>RM</span>
          <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 42, fontWeight: 800, color: 'var(--tng-blue)', margin: '0 4px' }}>
            {amount.toLocaleString('en-MY')}
          </span>
        </div>
        <input type="range" min="500" max={Math.max(500, cap)} step="500" value={amount}
               onChange={e => setAmount(parseInt(e.target.value))}
               style={{ ['--p']: `${((amount - 500) / Math.max(1, cap - 500)) * 100}%` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tng-text-muted)', marginTop: 8 }}>
          <span>RM 500</span><span>{fmtRM(cap)}</span>
        </div>
        <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 10 }}>Repayment term</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 6, 12, 24].map(t => (
            <div key={t} onClick={() => setTerm(t)}
                 style={{ flex: 1, padding: 8, textAlign: 'center', border: `1.5px solid ${term === t ? 'var(--tng-blue)' : 'var(--tng-line)'}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: term === t ? 'var(--tng-blue)' : '#fff', color: term === t ? '#fff' : 'var(--tng-text)' }}>
              {t} mo
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ margin: '14px 16px', padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Sora,sans-serif', marginBottom: 10 }}>Loan Summary</h3>
        <Row k="Principal" v={fmtRM(amount)} />
        <Row k="Interest rate" v="6.8% p.a." />
        <Row k="Term" v={`${term} months`} />
        <Row k="Backed by" v={`Trust Link · ${network?.direct?.length || 0} members`} />
        <Row k="Approval" v={isGuarantor ? 'Auto-approved (anchor)' : (hasPending || submitted) ? 'Pending' : 'Required'} mute={!isGuarantor && !hasPending && !submitted} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }}>
          <span style={{ color: 'var(--tng-text)', fontWeight: 600 }}>Monthly payment</span>
          <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--tng-blue)' }}>{fmtRM(monthly)}</span>
        </div>
      </div>

      <button onClick={submit} disabled={amount > cap || hasPending}
        style={{ margin: '14px 16px 18px', width: 'calc(100% - 32px)', padding: 16, background: 'var(--tng-yellow)', color: 'var(--tng-text)', border: 'none', borderRadius: 16, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,213,0,.3)', opacity: (amount > cap || hasPending) ? .5 : 1 }}>
        {hasPending ? 'Application Pending' : amount > cap ? 'Amount exceeds cap' : 'Submit Loan Application'}
      </button>

      <div style={{ height: 100 }} />

      <Modal open={submitted} onClose={() => { setSubmitted(false); navigate('/loans'); }}>
        {decision?.decision === 'approved' ? (
          <>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Loan Approved! 🎉</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              <b>{fmtRM(amount)}</b> disbursed to your TNG wallet. As a Trust Link anchor, your loan was auto-approved.
            </p>
          </>
        ) : decision?.decision === 'rejected' ? (
          <>
            <div className="success-icon" style={{ background: 'linear-gradient(135deg,var(--tng-danger),#A01F33)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Application Rejected</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              {decision.reason}. Cap {fmtRM(decision.cap)}.
            </p>
          </>
        ) : (
          <>
            <div className="success-icon" style={{ background: 'linear-gradient(135deg,var(--tng-warn),#D97706)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Awaiting Guarantor Approval</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              Your request for <b>{fmtRM(amount)}</b> has been sent to your Trust Link guarantor for approval. You'll be notified once it's approved.
            </p>
          </>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setSubmitted(false); }} style={{ flex: 1, padding: 14, background: 'var(--tng-bg)', color: 'var(--tng-text)', border: '1.5px solid var(--tng-line)', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close</button>
          <button onClick={() => { setSubmitted(false); navigate('/loans'); }} style={{ flex: 1, padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Track Status</button>
        </div>
      </Modal>
    </>
  );
}

function ScoreMini({ label, value, yellow }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, opacity: .8, textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, marginTop: 2, lineHeight: 1, color: yellow ? 'var(--tng-yellow)' : '#fff' }}>{value}</div>
    </div>
  );
}

function Row({ k, v, mute }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13, borderBottom: '1px dashed var(--tng-line)' }}>
      <span style={{ color: 'var(--tng-text-muted)' }}>{k}</span>
      <span style={{ fontWeight: 700, fontFamily: 'Sora,sans-serif', color: mute ? 'var(--tng-text-muted)' : 'var(--tng-text)' }}>{v}</span>
    </div>
  );
}
