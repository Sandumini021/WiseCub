import { useRef, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/splash.css";

const SWIPE_PX = 40;

export function SplashPage() {
  const navigate = useNavigate();
  const start = useRef<{ x: number; y: number } | null>(null);

  function goLogin() {
    navigate("/login");
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    start.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!start.current) {
      return;
    }
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) >= SWIPE_PX || Math.abs(dy) >= SWIPE_PX) {
      event.preventDefault();
      goLogin();
    }
  }

  return (
    <main className="splash" id="main">
      <img
        className="splash-art"
        src="/images/wisecub-splash.jpg"
        alt="WiseCub. Cub waves beside the WiseCub logo."
        draggable={false}
      />
      <Link
        className="splash-go"
        to="/login"
        aria-label="Continue to login"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
            event.preventDefault();
            goLogin();
          }
        }}
      />
    </main>
  );
}
