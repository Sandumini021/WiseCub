type CubAssistantAvatarProps = {
  size?: number;
  speaking?: boolean;
};

export function CubAssistantAvatar({ size = 52, speaking = false }: CubAssistantAvatarProps) {
  return (
    <img
      className={`cub-face-img${speaking ? " is-speaking" : ""}`}
      src="/images/cub-wave.png"
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}
