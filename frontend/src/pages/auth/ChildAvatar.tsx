import { avatarSrc } from "./avatars";

type ChildAvatarProps = {
  avatarId?: string;
  name?: string;
  className?: string;
  alt?: string;
};

export function ChildAvatar({ avatarId, name, className, alt }: ChildAvatarProps) {
  const src = avatarSrc(avatarId);
  if (src) {
    return <img className={className} src={src} alt={alt ?? ""} />;
  }
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  return (
    <span className={`${className ?? ""} avatar-fallback`.trim()} aria-hidden="true">
      {initial}
    </span>
  );
}
