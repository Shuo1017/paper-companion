import { useEffect, useState } from "react";
import App from "./App";

/** 封面门：首屏播 3D 下潜封面，钻进屏幕后切到真正的 React 应用。
 *  URL 带 ?app=1 可跳过封面（调试/直链阅读器用）。 */
export default function CoverGate() {
  const [showCover, setShowCover] = useState(
    () => !new URLSearchParams(location.search).has("app")
  );

  useEffect(() => {
    if (!showCover) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "paper-dive-enter") return;
      if (e.origin !== location.origin) return;
      // 等封面 FLIP 铺满动画（.8s）播完再切，避免转场被截断
      window.setTimeout(() => {
        setShowCover(false);
        history.replaceState(null, "", location.pathname + "?app=1");
      }, 850);
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [showCover]);

  function backToCover() {
    history.replaceState(null, "", location.pathname);
    location.reload();
  }

  if (showCover) {
    return (
      <iframe
        src="/cover/index.html"
        title="论文通解 · 下潜封面"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
        }}
      />
    );
  }

  return (
    <>
      <App />
      <button
        type="button"
        onClick={backToCover}
        title="重看封面动画"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 50,
          borderRadius: 999,
          border: "1px solid rgba(165,180,252,.5)",
          background: "rgba(12,14,30,.85)",
          color: "#a5b4fc",
          padding: "8px 14px",
          fontSize: 12,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
        }}
      >
        重看封面 ↑
      </button>
    </>
  );
}
