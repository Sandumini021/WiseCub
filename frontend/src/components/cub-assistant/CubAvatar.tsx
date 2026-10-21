import { CubFace } from "./CubFace";

type CubAvatarProps = {
  caption?: string;
  name?: string;
  size?: number;
};

export function CubAvatar({
  caption = "Hi, I’m Cub. I’ll help you find your way.",
  name = "Cub",
  size = 72,
}: CubAvatarProps) {
  return (
    <aside className="card cub-card" aria-label={`${name} the learning companion`}>
      <CubFace expression="happy-welcome" message={caption} size={size} name={name} />
    </aside>
  );
}
