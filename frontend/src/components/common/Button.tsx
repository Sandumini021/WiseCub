import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  to?: string;
};

export function Button({
  children,
  variant = "primary",
  className = "",
  to,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
