"use client";
import { useState } from "react";
import Map from "./Map";
import Dashboard from "./Dashboard";
import SearchOverlay from "./SearchOverlay";

export default function AppShell({
  assets, observations,
}: { assets: any[]; observations: any[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", width: "100%", height: "calc(100vh - 48px)", position: "relative", overflow: "hidden" }}>
      <div style={{
        width: collapsed ? 0 : 360, transition: "width 0.25s ease",
        overflow: "hidden", flexShrink: 0, position: "relative",
      }}>
        <Dashboard assets={assets} observations={observations} />
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} title="Collapse panel"
            style={{
              position: "absolute", top: 12, right: 8, zIndex: 20,
              width: 24, height: 24, borderRadius: 6, cursor: "pointer",
              border: "1px solid #374151", background: "#111827", color: "#f9fafb",
              fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            &#8249;
          </button>
        )}
      </div>

      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        {/* search shifts right when collapsed so it clears the reopen arrow */}
        <div style={{ position: "absolute", top: 0, left: collapsed ? 52 : 0, right: 0, bottom: 0, transition: "left 0.25s ease", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <SearchOverlay assets={assets} observations={observations} />
          </div>
        </div>
        <Map assets={assets} observations={observations} collapsed={collapsed} />
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Expand panel"
            style={{
              position: "absolute", top: 12, left: 12, zIndex: 20,
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              border: "1px solid #374151", background: "#111827", color: "#f9fafb",
              fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,.4)",
            }}>
            &#8250;
          </button>
        )}
      </div>
    </div>
  );
}
