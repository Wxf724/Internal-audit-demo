import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReportSection } from '../data/projectWork'
export interface ReportProposal { id?:string; sections: ReportSection[]; before: string; sources: string; summary: string }
export interface ReportMessage { id?:string; at?:string; role:'user'|'assistant'; text:string; proposalId?:string; chapterIds?:string[]; status?:'pending'|'partial'|'accepted'|'discarded'|'undone'|'superseded' }
export interface ReportUndo { sections:ReportSection[]; after:string; sources:string; messageId?:string }
export interface ReportChat { messages: ReportMessage[]; proposal?:ReportProposal; undo?:ReportUndo }
interface AssistantState { reports:Record<string,ReportChat>; update:(id:string,chat:ReportChat)=>void }
export const useProjectAssistantStore=create<AssistantState>()(persist((set)=>({reports:{},update:(id,chat)=>set((s)=>({reports:{...s.reports,[id]:chat}}))}),{name:'internal-audit-project-assistant-v1'}))
