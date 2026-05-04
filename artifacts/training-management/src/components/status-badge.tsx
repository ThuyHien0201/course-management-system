import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Đã duyệt</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Từ chối</Badge>;
  if (status === "PENDING") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Chờ duyệt</Badge>;
  return null;
}
