import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM } from '../lib/format.js';
import SubHeader from '../components/SubHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Loan instalments are mocked as monthly cadence from creation date.
// Returns date of the next unpaid instalment + how many have been paid.
function nextDueDate(loan, instalmentsPaid) {
  const created = new Date(loan.approved_at || loan.created_at);
  const next = new Date(created);
  next.setMonth(next.getMonth() + instalmentsPaid + 1);
  return next;
}
const fmtDate = (d) => d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

export default function LoanTracking() {
  const navigate = useNavigate();
  const { userId, role } = useAppStore();
  const showToast = useAppStore(s => s.showToast);
  const refreshUser = useAppStore(s => s.refreshUser);
  const [loans, setLoans] = useState([]);
  const [statuses, setStatuses] = useState({}); // loan_id -> full status
  const [users, setUsers] = useState({});
  const [filter, setFilter] = useState('active');
  const [pendingCount, setPendingCount] = useState(0);
  const [payTarget, setPayTarget] = useState(null);
  const [paySuccess, setPaySuccess] = useState(null);
  const [remindTarget, setRemindTarget] = useState(null);

  const reload = async () => {
    const [all, allUsers, pending] = await Promise.all([
      api.loansForUser(userId),
      api.listUsers(),
      api.loansForUser(userId, 'pending'),
    ]);
    setLoans(all);
    setUsers(Object.fromEntries(allUsers.map(u => [u.id, u])));
    setPendingCount(pending.filter(p => p.guarantor_id === userId).length);
    // Hydrate per-loan repayment status (paid / remaining / next-due)
    const detail = await Promise.all(all.map(l => api.loanStatus(l.id).catch(() => null)));
    setStatuses(Object.fromEntries(detail.filter(Boolean).map(s => [s.id, s])));
  };

  useEffect(() => { if (userId) reload(); }, [userId]);

  const visible = loans.filter(l => {
    if (filter === 'active')    return l.status === 'active';
    if (filter === 'pending')   return l.status === 'pending';
    if (filter === 'completed') return ['repaid', 'rejected', 'defaulted'].includes(l.status);
    return true;
  });

  const myActive = loans.filter(l => l.status === 'active' && l.borrower_id === userId);
  const myActiveStatuses = myActive.map(l => statuses[l.id]).filter(Boolean);
  const totalOutstanding = myActiveStatuses.reduce((s, st) => s + (st.remaining || 0), 0);
  const nextDue = myActive[0]
    ? Number(myActive[0].monthly_payment)
    : 0;

  const pay = async () => {
    if (!payTarget) return;
    try {
      const res = await api.loanRepay(payTarget.id, payTarget.monthly_payment);
      setPayTarget(null);
      setPaySuccess(res);
      reload();
      refreshUser();
    } catch (e) { showToast(e.message); }
  };

  const sendRemind = () => {
    setRemindTarget(null);
    showToast(`Reminder sent to ${remindTarget.name} ✉️`);
  };

  return (
    <>
      <SubHeader title="Trust Link Loans" back="/home" />

      <div className="card" style={{ margin: '14px 16px', padding: 18, display: 'flex', gap: 14 }}>
        <SumCol label="Total Outstanding" value={fmtRM(totalOutstanding)} />
        <div style={{ width: 1, background: 'var(--tng-line)' }} />
        <SumCol label="Next Due" value={fmtRM(nextDue)} cls="danger" />
        <div style={{ width: 1, background: 'var(--tng-line)' }} />
        <SumCol label="On-time" value="100%" cls="success" />
      </div>

      {pendingCount > 0 && (
        <div onClick={() => navigate('/requests')} style={{ margin: '0 16px 10px', cursor: 'pointer' }}>
          <div style={{ background: 'var(--tng-blue)', color: '#fff', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 16px rgba(26,79,190,.25)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Loan Requests Pending</div>
              <div style={{ fontSize: 11, opacity: .85, marginTop: 2 }}>{pendingCount} awaiting your approval</div>
            </div>
            <span style={{ background: 'var(--tng-yellow)', color: 'var(--tng-text)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8 }}>{pendingCount}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ margin: '0 16px 12px', display: 'flex', gap: 6 }}>
        {['active', 'pending', 'completed'].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ flex: 1, padding: '6px 12px', borderRadius: 14, background: filter === k ? 'var(--tng-blue)' : '#fff', color: filter === k ? '#fff' : 'var(--tng-text-muted)', border: `1.5px solid ${filter === k ? 'var(--tng-blue)' : 'var(--tng-line)'}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{k}</button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ margin: 30, textAlign: 'center', color: 'var(--tng-text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700 }}>No loans in this view</div>
        </div>
      )}

      {visible.map(loan => {
        const counterId = loan.borrower_id === userId ? loan.guarantor_id : loan.borrower_id;
        const counter = users[counterId] || { id: counterId, name: counterId };
        const borrower = users[loan.borrower_id] || { id: loan.borrower_id, name: loan.borrower_id };
        const isMine = loan.borrower_id === userId;
        const isMyGuarantee = loan.guarantor_id === userId; // I back this borrower
        const st = statuses[loan.id] || {};
        const totalDue = Number(st.total_due || (Number(loan.monthly_payment) * Number(loan.term_months)));
        const paid = Number(st.total_paid || 0);
        const remaining = Number(st.remaining ?? Math.max(0, totalDue - paid));
        const instalmentsPaid = Number(st.instalments_paid || 0);
        const pct = totalDue > 0 ? Math.round((paid / totalDue) * 100) : 0;
        const nextDate = loan.status === 'active' ? nextDueDate(loan, instalmentsPaid) : null;

        return (
          <div key={loan.id} className="card" style={{ margin: '0 16px 12px', padding: 14, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar user={isMine ? borrower : borrower} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {isMine ? `${borrower.name} (You)` : borrower.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tng-text-muted)' }}>
                    {isMine
                      ? `Backed by ${counter.name || 'Trust Link'}`
                      : `You vouched · ${loan.purpose || 'Personal'}`}
                  </div>
                </div>
              </div>
              <span className={`status-badge ${loan.status === 'active' ? 'ontime' : loan.status === 'pending' ? 'pending' : loan.status === 'repaid' ? 'completed' : 'overdue'}`}>{loan.status}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800 }}>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: .7, marginRight: 2 }}>RM</span>{Number(loan.amount).toLocaleString('en-MY')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', textAlign: 'right' }}>
                {loan.term_months}-month plan
                <b style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, color: 'var(--tng-text)', display: 'block' }}>
                  {instalmentsPaid} of {loan.term_months} paid
                </b>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, background: 'var(--tng-line)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--tng-success),#16965A)', borderRadius: 4, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--tng-text-muted)', marginBottom: 12 }}>
              <span>Paid: <b style={{ color: 'var(--tng-text)', fontFamily: 'Sora,sans-serif' }}>{fmtRM(paid)}</b></span>
              <span>Remaining: <b style={{ color: 'var(--tng-text)', fontFamily: 'Sora,sans-serif' }}>{fmtRM(remaining)}</b></span>
            </div>

            {loan.status === 'active' && nextDate && (
              <div style={{ background: 'rgba(245,158,11,.08)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,.15)', color: 'var(--tng-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--tng-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>
                    Next payment · {fmtDate(nextDate)}
                  </div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 700 }}>{fmtRM(loan.monthly_payment)}</div>
                </div>
                {isMine ? (
                  <button onClick={() => setPayTarget(loan)} style={{ background: 'var(--tng-blue)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Pay now</button>
                ) : isMyGuarantee ? (
                  <button onClick={() => setRemindTarget({ loan, name: borrower.name, amount: loan.monthly_payment, due: fmtDate(nextDate) })}
                          style={{ background: 'transparent', color: 'var(--tng-text-muted)', border: '1.5px solid var(--tng-line)', padding: '8px 14px', borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Remind</button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      <div className="bottom-spacer" style={{ height: 90 }} />

      {/* Pay confirm modal */}
      <Modal open={!!payTarget} onClose={() => setPayTarget(null)}>
        {payTarget && (
          <>
            <div className="consent-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Confirm Repayment</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              Repay your instalment using your TNG wallet balance.
            </p>
            <div style={{ background: 'var(--tng-bg)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <PayRow k="Instalment Amount" v={fmtRM(payTarget.monthly_payment)} />
              <PayRow k="Loan ID" v={payTarget.id.slice(0, 8)} />
              <PayRow k="From" v="TNG Wallet" />
              <PayRow k="Total Deducted" v={fmtRM(payTarget.monthly_payment)} bold />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPayTarget(null)} style={{ flex: 1, padding: 14, background: 'var(--tng-bg)', color: 'var(--tng-text)', border: '1.5px solid var(--tng-line)', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={pay} style={{ flex: 1, padding: 14, background: 'var(--tng-success)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(31,179,107,.3)' }}>Confirm & Pay</button>
            </div>
          </>
        )}
      </Modal>

      {/* Pay success */}
      <Modal open={!!paySuccess} onClose={() => setPaySuccess(null)}>
        {paySuccess && (
          <>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Payment Successful! 🎉</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              <b>{fmtRM(paySuccess.repayment.amount)}</b> deducted. {paySuccess.loan.status === 'repaid' ? 'Loan fully repaid! 🎊' : 'Remaining ' + fmtRM(paySuccess.remaining)}
            </p>
            <div style={{ background: 'var(--tng-bg)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <PayRow k="Remaining Balance" v={paySuccess.remaining > 0 ? fmtRM(paySuccess.remaining) : 'Cleared'} />
              <PayRow k="Instalments paid" v={`${paySuccess.instalmentsPaid} of ${paySuccess.loan.term_months}`} />
              <PayRow k="Trust Score impact" v="+5 pts" />
            </div>
            <button onClick={() => setPaySuccess(null)} style={{ width: '100%', padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Done</button>
          </>
        )}
      </Modal>

      {/* Remind modal */}
      <Modal open={!!remindTarget} onClose={() => setRemindTarget(null)}>
        {remindTarget && (
          <>
            <div className="consent-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Remind {remindTarget.name}</h2>
            <p style={{ textAlign: 'center', color: 'var(--tng-text-muted)', fontSize: 13, marginBottom: 18 }}>
              Send a payment reminder via TNG push notification.
            </p>
            <div style={{ background: 'var(--tng-bg)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <PayRow k="Member" v={remindTarget.name} />
              <PayRow k="Amount Due" v={fmtRM(remindTarget.amount)} />
              <PayRow k="Due Date" v={remindTarget.due} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRemindTarget(null)} style={{ flex: 1, padding: 14, background: 'var(--tng-bg)', color: 'var(--tng-text)', border: '1.5px solid var(--tng-line)', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendRemind} style={{ flex: 1, padding: 14, background: 'var(--tng-blue)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Send Reminder</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function SumCol({ label, value, cls = '' }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 800, marginTop: 2, color: cls === 'danger' ? 'var(--tng-danger)' : cls === 'success' ? 'var(--tng-success)' : 'var(--tng-text)' }}>{value}</div>
    </div>
  );
}

function PayRow({ k, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 15 : 13, padding: '5px 0', borderBottom: bold ? 'none' : '1px dashed var(--tng-line)', fontWeight: bold ? 700 : 400, fontFamily: bold ? 'Sora,sans-serif' : 'inherit' }}>
      <span style={{ color: 'var(--tng-text-muted)', fontWeight: 400 }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}
