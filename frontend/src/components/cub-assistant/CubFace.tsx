import { useEffect, useState } from "react";
import type { CubLang } from "./cubAssistantTypes";
import {
  CUB_EXPRESSION_ALT,
  CUB_EXPRESSION_FALLBACK,
  type CubExpression,
  expressionSrc,
} from "./cubExpressions";

type CubFaceProps = {
  expression?: CubExpression;
  message?: string;
  size?: number;
  lang?: CubLang;
  speaking?: boolean;
  name?: string;
};

export function CubFace({
  expression = "listening",
  message,
  size = 96,
  lang = "en",
  speaking = false,
  name = "Cub",
}: CubFaceProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [expression]);
  const src = broken ? CUB_EXPRESSION_FALLBACK : expressionSrc(expression);
  const row = CUB_EXPRESSION_ALT[expression];
  const alt = (lang === "si" ? row?.si : row?.en) ?? name;

  return (
    <figure className={`cub-face-block${speaking ? " is-speaking" : ""}`} style={{ ["--cub-size" as string]: `${size}px` }}>
      <img
        className="cub-face-photo"
        src={src}
        width={size}
        height={size}
        alt={alt}
        draggable={false}
        onError={() => setBroken(true)}
      />
      {message ? (
        <figcaption className="cub-face-bubble" aria-live="polite">
          <strong>{name}</strong>
          <p>{message}</p>
        </figcaption>
      ) : null}
    </figure>
  );
}
