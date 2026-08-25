export const UserRole = {
  ADMIN: "admin",
  COLLABORATOR: "collaborator",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];