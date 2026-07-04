import Map from "../components/Map";
import Dashboard from "../components/Dashboard";
import { makeAdapter } from "../adapters";

export const dynamic = "force-dynamic";

export default async function Page() {
  const db = await makeAdapter();
  const [assets, observations] = await Promise.all([
    db.listAssets(),
    db.listObservations(),
  ]);
  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      <Dashboard assets={assets as any} observations={observations as any} />
      <div style={{ flex: 1, position: "relative" }}>
        <Map assets={assets as any} observations={observations as any} />
      </div>
    </div>
  );
}
