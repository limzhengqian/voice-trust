import { initials, colorForId } from '../lib/format.js';

export default function Avatar({ user, size = 40, text }) {
  const id = user?.id || 'x';
  const bg = user?.avatar_color || colorForId(id);
  const label = text || user?.avatar_initials || initials(user?.name || id);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Sora,sans-serif', fontWeight: 700,
        fontSize: Math.max(10, size / 3), flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}
