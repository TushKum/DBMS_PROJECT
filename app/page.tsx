import { HeroSection } from "@/client/components/HeroSection";
import { ContentRow } from "@/client/components/ContentRow";
import { getDashboardRows } from "@/server/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let data;
  try {
    data = await getDashboardRows();
  } catch (err) {
    return (
      <div className="mt-20 rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-sm">
        <div className="font-bold text-red-300">Database not reachable.</div>
        <div className="mt-1 text-red-400/80">
          {err instanceof Error ? err.message : String(err)}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          Check that the <code className="rounded bg-zinc-900 px-1">stockflix-mysql</code> container
          is running and <code className="rounded bg-zinc-900 px-1">DATABASE_URL</code> is set in
          <code className="rounded bg-zinc-900 px-1">.env.local</code>.
        </div>
      </div>
    );
  }

  const hero =
    data.highVelocity.find((p) => p.is_hyped) ??
    data.byCategory.find((p) => p.is_hyped) ??
    data.highVelocity[0] ??
    data.byCategory[0] ??
    null;

  return (
    <>
      <HeroSection product={hero} />
      <ContentRow
        title="Almost Sold Out"
        subtitle="Low stock somewhere · Grab before it's gone"
        products={data.lowStock}
      />
      <ContentRow
        title="High Velocity"
        subtitle="Trending across platforms · Last 7 days"
        products={data.highVelocity}
      />
      <ContentRow
        title="Recently Restocked"
        subtitle="Back in stock · Last 30 days"
        products={data.recentlyRestocked}
      />
      <ContentRow
        title="Browse the Drop"
        subtitle="Tops · Bottoms · Outerwear · Footwear · Accessories"
        products={data.byCategory}
      />
    </>
  );
}
