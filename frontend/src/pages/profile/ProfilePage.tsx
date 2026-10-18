import { ChildAvatar } from "../auth/ChildAvatar";
import { useDemoChild } from "../auth/demoSession";
import en from "../../locales/en.json";

export function ProfilePage() {
  const child = useDemoChild();
  const name = child?.name?.trim() || "Guest";

  return (
    <>
      <h1>{en.profile.title}</h1>
      <p>{en.profile.intro}</p>
      <ChildAvatar className="profile-face" avatarId={child?.avatarId} name={name} />
      <p>
        <strong>{name}</strong>
        {child?.age ? ` · age ${child.age}` : ""}
      </p>
    </>
  );
}
