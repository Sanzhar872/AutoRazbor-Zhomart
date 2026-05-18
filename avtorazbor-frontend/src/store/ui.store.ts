import { create } from 'zustand'

interface UiState {
  mobileFiltersOpen: boolean
  searchQuery: string
  setMobileFiltersOpen: (v: boolean) => void
  setSearchQuery: (q: string) => void
}

export const useUiStore = create<UiState>()((set) => ({
  mobileFiltersOpen: false,
  searchQuery: '',
  setMobileFiltersOpen: (v) => set({ mobileFiltersOpen: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
