import ReportDetail from "@/components/Users/ReportDetail";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportDetail reportId={id} />;
}
