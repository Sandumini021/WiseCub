export type UserRole = "student" | "teacher" | "guardian" | "child" | "parent";

export type DemoProfile = {
  id: string;
  displayName: string;
  role: UserRole;
  avatarId: string;
  username?: string;
};
