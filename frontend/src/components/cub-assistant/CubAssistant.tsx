import { useLocation } from "react-router-dom";
import { CubChatPanel } from "./CubChatPanel";
import { isAuthPath } from "./cubRoutes";

export function CubAssistant() {
  const location = useLocation();
  if (isAuthPath(location.pathname)) {
    return null;
  }
  return <CubChatPanel />;
}
