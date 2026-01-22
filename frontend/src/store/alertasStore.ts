import { create } from 'zustand'

interface AlertasStore {
  debeRecargar: boolean
  triggerRecarga: () => void
  resetRecarga: () => void
}

export const useAlertasStore = create<AlertasStore>((set) => ({
  debeRecargar: false,
  triggerRecarga: () => set({ debeRecargar: true }),
  resetRecarga: () => set({ debeRecargar: false }),
}))
