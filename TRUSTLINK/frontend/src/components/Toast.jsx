import { useAppStore } from '../store/useAppStore.js';

export default function Toast() {
  const toast = useAppStore(s => s.toast);
  return (
    <div className={`toast ${toast ? 'show' : ''}`}>{toast || ''}</div>
  );
}
