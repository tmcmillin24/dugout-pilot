import { createContext, useContext, useState, type ReactNode } from 'react';
type Assistant = { open: boolean; prompt: string; request: number; show: (question?: string) => void; setPrompt: (text: string) => void; close: () => void };
const Context = createContext<Assistant | null>(null);
export function RulesAssistantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ open: false, prompt: '', request: 0 });
  return <Context.Provider value={{ ...state, show: (prompt = '') => setState(s => ({ open: true, prompt, request: s.request + 1 })), setPrompt: prompt => setState(s => ({ ...s,prompt })), close: () => setState(s => ({ ...s, open: false })) }}>{children}</Context.Provider>;
}
export function useRulesAssistant() { return useContext(Context); }
