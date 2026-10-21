import type { CubLang } from "../cub-assistant/cubAssistantTypes";
import { useLang } from "../../i18n/useLang";

const OPTIONS: Array<{ id: CubLang; label: string }> = [
  { id: "en", label: "English 🇬🇧" },
  { id: "si", label: "සිංහල 🇱🇰" },
  { id: "sg", label: "Singlish 🇱🇰" },
];

export function LanguageSelect({ className = "lang-select" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <label className={className}>
      <span className="visually-hidden">{t("lang.label")}</span>
      <select value={lang} onChange={(event) => setLang(event.target.value as CubLang)} aria-label={t("lang.label")}>
        {OPTIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
