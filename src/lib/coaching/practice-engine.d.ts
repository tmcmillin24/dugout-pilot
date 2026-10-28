import type { PracticeSettings, PracticePlan } from './practice';
export function build(settings: PracticeSettings): Omit<PracticePlan, 'id' | 'name' | 'date'>;
export function formatClock(start: string, offset: number): string;
export const focusLabel: Record<PracticeSettings['focus'], string>;
export function practiceName(name: string, focus: PracticeSettings['focus']): string;
export function practiceNameDraft(name: string, focus: PracticeSettings['focus']): string;
