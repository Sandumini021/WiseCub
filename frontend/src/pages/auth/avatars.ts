export const PRACTICE_AVATARS = [
  { id: "kid-sky", label: "Sky", src: "/images/avatars/kid-sky.png", tone: "#3b82f6" },
  { id: "kid-gold", label: "Gold", src: "/images/avatars/kid-gold.png", tone: "#f5c400" },
  { id: "kid-leaf", label: "Leaf", src: "/images/avatars/kid-leaf.png", tone: "#4caf50" },
  { id: "kid-berry", label: "Berry", src: "/images/avatars/kid-berry.png", tone: "#ec4899" },
  { id: "kid-royal", label: "Royal", src: "/images/avatars/kid-royal.png", tone: "#7c3aed" },
  { id: "kid-aqua", label: "Aqua", src: "/images/avatars/kid-aqua.png", tone: "#22c3c8" },
] as const;

export type PracticeAvatarId = (typeof PRACTICE_AVATARS)[number]["id"];

const LEGACY: Record<string, PracticeAvatarId> = {
  "cub-gold": "kid-gold",
  "cub-sky": "kid-sky",
  "cub-leaf": "kid-leaf",
  "cub-berry": "kid-berry",
  "cub-navy": "kid-royal",
  "cub-sand": "kid-aqua",
};

export function resolveAvatarId(id?: string): PracticeAvatarId | null {
  if (id && PRACTICE_AVATARS.some((avatar) => avatar.id === id)) {
    return id as PracticeAvatarId;
  }
  if (id && LEGACY[id]) {
    return LEGACY[id];
  }
  return null;
}

export function avatarSrc(id?: string) {
  const resolved = resolveAvatarId(id);
  if (!resolved) {
    return null;
  }
  return PRACTICE_AVATARS.find((avatar) => avatar.id === resolved)?.src ?? null;
}
