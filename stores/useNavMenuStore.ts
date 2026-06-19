import { create } from "zustand";

type Store = {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
};

export const useNavMenuStore = create<Store>((set) => ({
  isMenuOpen: false,
  setIsMenuOpen: (value) =>
    set((state) => ({ isMenuOpen: state.isMenuOpen === value })),
}));
