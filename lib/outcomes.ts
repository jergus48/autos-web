export type Outcome = 'no_answer' | 'voicemail' | 'call_back' | 'not_interested' | 'interested' | 'email_sent' | 'meeting_booked' | 'wrong_number';

export const OUTCOMES: { code: Outcome; label: string; tone: 'good' | 'great' | 'warn' | 'bad' | 'mute' }[] = [
  { code: 'meeting_booked', label: 'Meeting agreed', tone: 'great' },
  { code: 'interested', label: 'Interested', tone: 'good' },
  { code: 'email_sent', label: 'Email / deck sent', tone: 'good' },
  { code: 'call_back', label: 'Call back later', tone: 'warn' },
  { code: 'voicemail', label: 'Voicemail', tone: 'mute' },
  { code: 'no_answer', label: 'No answer', tone: 'mute' },
  { code: 'not_interested', label: 'Not interested', tone: 'bad' },
  { code: 'wrong_number', label: 'Wrong number', tone: 'bad' },
];

export const outcomeLabel = (c?: string | null) => OUTCOMES.find((o) => o.code === c)?.label || c || '';
export const outcomeTone = (c?: string | null) => OUTCOMES.find((o) => o.code === c)?.tone || 'mute';
export const VALID_OUTCOMES = OUTCOMES.map((o) => o.code) as string[];

export function ago(iso?: string | null) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString();
}
