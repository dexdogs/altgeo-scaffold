import Map from "../components/Map";
import Dashboard from "../components/Dashboard";
import SearchOverlay from "../components/SearchOverlay";
import { makeAdapter } from "../adapters";

export const dynamic = "force-dynamic";

export default async function Page() {
  const db = await makeAdapter();
  const [assets, observations] = await Promise.all([
    db.listAssets(),
    db.listObservations(),
  ]);
  return (
    <div style={{ display: "flex", width: "100%", height: "calc(100vh - 48px)" }}>
      <Dashboard assets={assets as any} observations={observations as any} />
      <div style={{ flex: 1, position: "relative" }}>
        <SearchOverlay assets={assets as any} observations={observations as any} />
        <Map assets={assets as any} observations={observations as any} />
      </div>
    </div>
  );
}
