import { create } from 'zustand'

interface AuditoriaState {
  refreshTrigger: number
  triggerRefresh: () => void
}

export const useAuditoriaStore = create<AuditoriaState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}))
