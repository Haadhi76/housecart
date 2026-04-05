import { create } from "zustand";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface Household {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

interface HouseholdState {
  household: Household | null;
  members: Member[];
  setHousehold: (household: Household | null) => void;
  setMembers: (members: Member[]) => void;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  household: null,
  members: [],
  setHousehold: (household) => set({ household }),
  setMembers: (members) => set({ members }),
  clear: () => set({ household: null, members: [] }),
}));
