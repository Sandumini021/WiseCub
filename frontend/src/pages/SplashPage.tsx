import { useRef, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/splash.css";

const SWIPE_PX = 40;

export function SplashPage() {
  const navigate = useNavigate();
  const start = useRef<{ x: number; y: number } | null>(null);

  function goHome() {
    navigate("/home");
  }

  function onPointerDown(event: PointerEvent<HTMLAnchorElement>) {
    start.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLAnchorElement>) {
    if (!start.current) {
      return;
    }
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) >= SWIPE_PX || Math.abs(dy) >= SWIPE_PX) {
      event.preventDefault();
      goHome();
    }
  }

  return (
    <main className="splash">
      <Link
        id="main"
        className="splash-stage"
        to="/home"
        aria-label="WiseCub. Tap, swipe, or press the yellow arrow to open home."
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
            event.preventDefault();
            goHome();
          }
        }}
      >
        <img
          className="splash-art"
          src="/images/wisecub-splash.jpg"
          alt=""
          draggable={false}
        />
      </Link>
    </main>
  );
}
