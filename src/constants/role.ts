export const Role = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
