import { useNavigate } from 'react-router-dom';

export default function SubHeader({ title, back = -1, action, onAction }) {
  const navigate = useNavigate();
  return (
    <div className="sub-header">
      <div className="sub-nav">
        <div className="sub-back" onClick={() => navigate(back)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
        <div className="sub-title">{title}</div>
        {action && <div className="sub-action" onClick={onAction}>{action}</div>}
      </div>
    </div>
  );
}
