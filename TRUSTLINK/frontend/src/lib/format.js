export const fmtRM = (n) =>
  'RM ' + Number(n || 0).toLocaleString('en-MY', { maximumFractionDigits: 0 });

export const monthlyPayment = (principal, term, rate = 0.068) => {
  const mr = rate / 12;
  if (mr === 0) return principal / term;
  return (principal * mr * Math.pow(1 + mr, term)) / (Math.pow(1 + mr, term) - 1);
};

export const tierFromScore = (s) =>
  s >= 800 ? 'Excellent' :
  s >= 700 ? 'Strong' :
  s >= 600 ? 'Good' :
  s >= 500 ? 'Fair' : 'Building';

export const scoreClass = (s) => (s >= 750 ? 'high' : s >= 650 ? 'mid' : 'low');

export const initials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

const COLORS = ['#1A4FBE', '#5B3FD9', '#1FB36B', '#F59E0B', '#E0354B', '#3D6FE0'];
export const colorForId = (id = '') => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};
