import { useState } from "react";
import {
  useListQcItems,
  useGetQcSummary,
  useApproveQc,
  useRejectQc,
  useGetQcHistory,
  getListQcItemsQueryKey,
  getGetQcSummaryQueryKey,
  getGetQcHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Check, X, History as HistoryIcon, ShieldCheck } from "lucide-react";

type EntityType = "course" | "class" | "student" | "instructor" | "session" | "result";
type Status = "PENDING" | "APPROVED" | "REJECTED";

const ENTITY_LABELS: Record<EntityType, string> = {
  course: "Khóa học",
  class: "Lớp học",
  student: "Học viên",
  instructor: "Giảng viên",
  session: "Buổi học",
  result: "Kết quả học tập",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-green-600 hover:bg-green-700">Đã duyệt</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">Từ chối</Badge>;
  return <Badge variant="secondary">Chờ duyệt</Badge>;
}

export default function QcPage() {
  const [entityType, setEntityType] = useState<EntityType>("course");
  const [status, setStatus] = useState<Status>("PENDING");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; mode: "approve" | "reject"; entityId?: number; entityType?: EntityType }>({ open: false, mode: "approve" });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; entityType?: EntityType; entityId?: number; title?: string }>({ open: false });
  const [note, setNote] = useState("");

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: summary } = useGetQcSummary();
  const { data: items = [], isLoading } = useListQcItems({ entityType, status });
  const approveM = useApproveQc();
  const rejectM = useRejectQc();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getListQcItemsQueryKey({ entityType, status }) });
    qc.invalidateQueries({ queryKey: getGetQcSummaryQueryKey() });
    if (historyDialog.entityType && historyDialog.entityId) {
      qc.invalidateQueries({ queryKey: getGetQcHistoryQueryKey({ entityType: historyDialog.entityType, entityId: historyDialog.entityId }) });
    }
  };

  const submitAction = async () => {
    if (!actionDialog.entityId || !actionDialog.entityType) return;
    const data = { entityType: actionDialog.entityType, entityId: actionDialog.entityId, note: note || undefined };
    try {
      if (actionDialog.mode === "approve") {
        await approveM.mutateAsync({ data });
        toast({ title: "Đã duyệt", description: "Mục đã được phê duyệt." });
      } else {
        await rejectM.mutateAsync({ data });
        toast({ title: "Đã từ chối", description: "Mục đã bị từ chối." });
      }
      setActionDialog({ open: false, mode: "approve" });
      setNote("");
      refresh();
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể thực hiện hành động.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý chất lượng</h1>
            <p className="text-sm text-muted-foreground">Phê duyệt nội dung trước khi đưa vào sử dụng</p>
          </div>
        </div>

        <Tabs value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
          <TabsList className="grid grid-cols-6 w-full">
            {(Object.keys(ENTITY_LABELS) as EntityType[]).map((t) => {
              const counts = summary?.[t];
              const pending = counts?.PENDING ?? 0;
              return (
                <TabsTrigger key={t} value={t} className="relative">
                  {ENTITY_LABELS[t]}
                  {pending > 0 && (
                    <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 text-white">{pending}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(ENTITY_LABELS) as EntityType[]).map((t) => (
            <TabsContent key={t} value={t} className="space-y-4">
              <div className="flex gap-2">
                {(["PENDING", "APPROVED", "REJECTED"] as Status[]).map((s) => (
                  <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
                    {s === "PENDING" ? "Chờ duyệt" : s === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                    <Badge variant="secondary" className="ml-2">{summary?.[t]?.[s] ?? 0}</Badge>
                  </Button>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{ENTITY_LABELS[t]}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Không có mục nào</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-accent/30">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{item.title}</h3>
                              <StatusBadge status={item.approvalStatus} />
                            </div>
                            {item.subtitle && <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>}
                            {item.detail && <p className="text-sm mt-2 line-clamp-2">{item.detail}</p>}
                            {item.approvalNote && (
                              <p className="text-xs text-muted-foreground mt-2 italic">Ghi chú: {item.approvalNote}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {status !== "APPROVED" && (
                              <Button size="sm" onClick={() => { setActionDialog({ open: true, mode: "approve", entityId: item.id, entityType: t }); setNote(""); }}>
                                <Check className="h-4 w-4 mr-1" />Duyệt
                              </Button>
                            )}
                            {status !== "REJECTED" && (
                              <Button size="sm" variant="destructive" onClick={() => { setActionDialog({ open: true, mode: "reject", entityId: item.id, entityType: t }); setNote(""); }}>
                                <X className="h-4 w-4 mr-1" />Từ chối
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setHistoryDialog({ open: true, entityType: t, entityId: item.id, title: item.title })}>
                              <HistoryIcon className="h-4 w-4 mr-1" />Lịch sử
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog({ ...actionDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.mode === "approve" ? "Duyệt mục" : "Từ chối mục"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do hoặc nhận xét..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, mode: "approve" })}>Huỷ</Button>
            <Button onClick={submitAction} variant={actionDialog.mode === "approve" ? "default" : "destructive"}>
              {actionDialog.mode === "approve" ? "Duyệt" : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryDialog dialog={historyDialog} onClose={() => setHistoryDialog({ open: false })} />
    </AppLayout>
  );
}

function HistoryDialog({ dialog, onClose }: { dialog: { open: boolean; entityType?: EntityType; entityId?: number; title?: string }; onClose: () => void }) {
  const { data: history = [], isLoading } = useGetQcHistory(
    { entityType: dialog.entityType, entityId: dialog.entityId },
    { query: { enabled: dialog.open && !!dialog.entityType && !!dialog.entityId } },
  );
  return (
    <Dialog open={dialog.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lịch sử duyệt: {dialog.title ?? ""}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có lịch sử</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="border rounded p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={h.status} />
                    <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  {h.note && <p className="text-sm">{h.note}</p>}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
