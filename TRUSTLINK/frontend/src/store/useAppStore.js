// Global app state — current mock user (role) + a few session helpers.

import { create } from 'zustand';
import { api } from '../services/api.js';

// Map a UI role to the seeded user id.
const ROLE_TO_USER = {
  guarantor: 'guarantor_01', // Aiman — anchors a network, has 2 pending requests
  guarantee: 'borrower_01',  // Siti — borrower, has an active loan + pending app
};

export const useAppStore = create((set, get) => ({
  role: 'guarantor',
  userId: ROLE_TO_USER.guarantor,
  user: null,
  toast: null,

  setRole: async (role) => {
    const userId = ROLE_TO_USER[role];
    set({ role, userId });
    await get().refreshUser();
  },

  refreshUser: async () => {
    const { userId } = get();
    try {
      const user = await api.getUser(userId);
      set({ user });
    } catch (e) {
      console.warn('refreshUser failed', e.message);
    }
  },

  showToast: (msg) => {
    set({ toast: msg });
    clearTimeout(get()._toastT);
    const t = setTimeout(() => set({ toast: null }), 2200);
    set({ _toastT: t });
  },
}));

export { ROLE_TO_USER };
