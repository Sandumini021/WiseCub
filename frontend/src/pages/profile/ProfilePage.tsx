import { ChildAvatar } from "../auth/ChildAvatar";
import { PRACTICE_AVATARS } from "../auth/avatars";
import { persistAvatar, useDemoChild } from "../auth/demoSession";
import { LanguageSelect } from "../../components/layout/LanguageSelect";
import { useLang } from "../../i18n/useLang";
import "../../styles/signup.css";

export function ProfilePage() {
  const { t } = useLang();
  const { child } = useDemoChild();
  const name = child?.name?.trim() || "Guest";
  const isStudent = (child?.role ?? "student") === "student";

  function pickAvatar(avatarId: string) {
    if (!child) {
      return;
    }
    persistAvatar(avatarId);
  }

  return (
    <>
      <h1>{t("profile.title")}</h1>
      <LanguageSelect />
      <p>
        {child?.username ? `@${child.username}` : t("profile.intro")} · demo {child?.role ?? "student"}
      </p>
      <ChildAvatar className="profile-face" avatarId={child?.avatarId} name={name} />
      <p>
        <strong>{name}</strong>
        {child?.age ? ` · age ${child.age}` : ""}
      </p>
      {isStudent ? (
        <div className="signup-avatars" style={{ maxWidth: 520 }}>
          {PRACTICE_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              className={`signup-avatar${child?.avatarId === avatar.id ? " is-on" : ""}`}
              onClick={() => pickAvatar(avatar.id)}
            >
              <img src={avatar.src} alt="" />
              <span>{avatar.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
