import AppShell from "../components/AppShell";
import { makeAdapter } from "../adapters";

export const dynamic = "force-dynamic";

export default async function Page() {
  const db = await makeAdapter();
  const [assets, observations] = await Promise.all([
    db.listAssets(),
    db.listObservations(),
  ]);
  return <AppShell assets={assets as any} observations={observations as any} />;
}
