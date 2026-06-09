import type { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
}

export const AppShell = ({ children, currentPath }: AppShellProps) => (
  <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#/institution">
        <span>智护环</span>
        <strong>CareBand Agent</strong>
      </a>
      <Navigation currentPath={currentPath} />
      <div className="sidebar-note">
        <strong>Demo v0.1</strong>
        <p>模拟数据驱动的长者状态感知与 AI 照护闭环。</p>
      </div>
    </aside>
    <main className="main-content">{children}</main>
  </div>
);
