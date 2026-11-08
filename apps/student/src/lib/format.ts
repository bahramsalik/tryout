export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function hours(n: number): string {
  return `~${n} h`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export interface CountdownInfo {
  /** Short label, e.g. "1d 4h", "3h 12m", "12m 40s". */
  label: string;
  /** ms remaining (negative when passed). */
  ms: number;
  passed: boolean;
  urgency: 'calm' | 'soon' | 'urgent';
}

export function countdown(deadline: string, now = Date.now()): CountdownInfo {
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return { label: 'Closed', ms, passed: true, urgency: 'urgent' };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  let label: string;
  if (d >= 1) label = `${d}d ${h}h`;
  else if (h >= 1) label = `${h}h ${m}m`;
  else label = `${Math.max(1, m)}m`;
  const urgency = ms < 6 * 3600_000 ? 'urgent' : ms < 36 * 3600_000 ? 'soon' : 'calm';
  return { label, ms, passed: false, urgency };
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string | undefined | null): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

