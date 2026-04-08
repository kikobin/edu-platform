import { useUserStore } from "@/store/userStore";
import type { UserRole } from "@/types";

export function useRole(): UserRole {
  return useUserStore((s) => s.user?.role ?? "student");
}

export function useIsAdmin(): boolean {
  return useRole() === "admin";
}

export function useIsCurator(): boolean {
  const role = useRole();
  return role === "curator" || role === "admin";
}
