import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api.js";

export function useCurrentUser() {
  const user = useQuery(api.users.currentUser);

  return {
    user: user ?? null,
    isLoading: user === undefined,
  };
}
