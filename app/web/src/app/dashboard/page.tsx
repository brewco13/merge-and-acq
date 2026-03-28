import { getDashboardSummary } from "@/lib/dashboard/queries";
import SummaryCards from "@/components/dashboard/SummaryCards";
import SummaryGroup from "@/components/dashboard/SummaryGroup";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <SummaryCards totals={data.totals} />

      <div className="grid gap-6 md:grid-cols-2">
        <SummaryGroup title="By TSA Disposition" items={data.byTsaDisposition} />
        <SummaryGroup title="By Business Area" items={data.byBusinessArea} />
      </div>
    </main>
  );
}
