type CubAvatarProps = {
  caption?: string;
  name?: string;
};

export function CubAvatar({
  caption = "Hi, I’m Cub. I’ll help you find your way.",
  name = "Cub",
}: CubAvatarProps) {
  return (
    <aside className="card cub-card" aria-label={`${name} the learning companion`}>
      <svg
        className="cub-face"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${name} avatar placeholder`}
      >
        <circle cx="32" cy="34" r="22" fill="#c9844a" />
        <circle cx="18" cy="16" r="8" fill="#c9844a" />
        <circle cx="46" cy="16" r="8" fill="#c9844a" />
        <circle cx="18" cy="16" r="4" fill="#5c3a1e" />
        <circle cx="46" cy="16" r="4" fill="#5c3a1e" />
        <ellipse cx="32" cy="38" rx="14" ry="11" fill="#f3d2b0" />
        <circle cx="25" cy="32" r="3" fill="#1f2a24" />
        <circle cx="39" cy="32" r="3" fill="#1f2a24" />
        <ellipse cx="32" cy="40" rx="4" ry="3" fill="#5c3a1e" />
      </svg>
      <div>
        <strong>{name} says</strong>
        <p className="muted">{caption}</p>
      </div>
    </aside>
  );
}
