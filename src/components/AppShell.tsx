import type { ReactNode } from "react";
import { useDemo } from "../store/demoStore";
import { Navigation } from "./Navigation";

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
}

export const AppShell = ({ children, currentPath }: AppShellProps) => {
  const { state } = useDemo();
  const backendText =
    state.backend.mode === "connected"
      ? "后端已连接"
      : state.backend.mode === "unavailable"
        ? "后端未连接，使用本地 Mock"
        : "本地 Mock 模式";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/institution">
          <span>智护环</span>
          <strong>CareBand Agent</strong>
        </a>
        <Navigation currentPath={currentPath} />
        <div className="sidebar-note">
          <strong>Demo v0.2 落地验证版</strong>
          <p>最小后端 + SQLite + Apple Health 导入 + AI Agent fallback。</p>
          <small>{backendText}</small>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};
