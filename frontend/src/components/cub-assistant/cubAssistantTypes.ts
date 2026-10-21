export type CubLang = "en" | "si" | "sg";

export type CubRole = "student" | "teacher" | "guardian";

export type CubReply = {
  text: string;
  path?: string;
  speakPage?: boolean;
  needsConfirm?: boolean;
  languageIntent?: "CHANGE_LANGUAGE_ENGLISH" | "CHANGE_LANGUAGE_SINHALA" | string;
  intent?: string;
};
