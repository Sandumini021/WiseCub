import { CubFace } from "./CubFace";

type CubAssistantAvatarProps = {
  size?: number;
  speaking?: boolean;
};

export function CubAssistantAvatar({ size = 52, speaking = false }: CubAssistantAvatarProps) {
  return <CubFace expression={speaking ? "talking" : "happy-welcome"} size={size} speaking={speaking} />;
}
