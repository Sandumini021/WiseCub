import { CubAvatar } from "./CubAvatar";
import en from "../../locales/en.json";

type CubMessageProps = {
  message?: string;
};

export function CubMessage({ message = en.cub.placeholder }: CubMessageProps) {
  return (
    <aside className="cub-dock" aria-label={`${en.cub.name} the learning companion`}>
      <CubAvatar caption={message} name={en.cub.name} />
    </aside>
  );
}
