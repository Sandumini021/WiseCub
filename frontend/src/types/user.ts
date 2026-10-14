export type UserRole = "child" | "parent" | "teacher";

export type DemoProfile = {
  id: string;
  displayName: string;
  role: UserRole;
  avatarId: string;
};
