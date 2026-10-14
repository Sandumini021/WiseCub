import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  as?: "article" | "section" | "div";
};

export function Card({ title, children, as: Tag = "article" }: CardProps) {
  return (
    <Tag className="card">
      {title ? <h3>{title}</h3> : null}
      {children}
    </Tag>
  );
}
