import { CubFace } from "./CubFace";
import type { CubExpression } from "./cubExpressions";

type CubMascotProps = {
  size?: number;
  expression?: CubExpression;
};

export function CubMascot({ size = 96, expression = "happy-welcome" }: CubMascotProps) {
  return <CubFace expression={expression} size={size} />;
}
