import { useState, useMemo } from "react";
import {
  useListQcItems,
  useGetQcSummary,
  useApproveQc,
  useRejectQc,
  useGetQcHistory,
  getListQcItemsQueryKey,
  getGetQcSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, X, History as HistoryIcon, ShieldCheck, Calendar, Eye, FileText } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type EntityType = "course" | "class" | "student" | "instructor" | "session" | "result" | "certificate";
type Status = "PENDING" | "APPROVED" | "REJECTED";

const ENTITY_LABELS: Record<EntityType, string> = {
  course: "Khóa học",
  class: "Lớp học",
  student: "Học viên",
  instructor: "Giảng viên",
  session: "Buổi học",
  result: "Kết quả HT",
  certificate: "Chứng chỉ",
};

type QcField = { label: string; value: string };
type QcItem = {
  id: number; id2?: number;
  title: string; subtitle?: string; detail?: string;
  approvalStatus: string; approvalNote?: string | null;
  approvedAt?: string | null; createdAt?: string;
  fields?: QcField[];
  mediaUrls?: string[];
};

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700 border-green-200">Đã duyệt</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700 border-red-200">Từ chối</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Chờ duyệt</Badge>;
}

export default function QcPage() {
  const [entityType, setEntityType] = useState<EntityType>("course");
  const [status, setStatus] = useState<Status>("PENDING");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; mode: "approve" | "reject"; entityId?: number; entityId2?: number; entityType?: EntityType }>({ open: false, mode: "approve" });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; entityType?: EntityType; entityId?: number; title?: string }>({ open: false });
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; item?: QcItem }>({ open: false });
  const [note, setNote] = useState("");

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: summary } = useGetQcSummary();
  const { data: rawItems = [], isLoading } = useListQcItems({ entityType, status });
  const approveM = useApproveQc();
  const rejectM = useRejectQc();

  const items = useMemo(() => {
    if (!fromDate && !toDate) return rawItems as QcItem[];
    return (rawItems as QcItem[]).filter((item) => {
      const d = item.createdAt;
      if (!d) return true;
      const date = d.slice(0, 10);
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  }, [rawItems, fromDate, toDate]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getListQcItemsQueryKey({ entityType, status }) });
    qc.invalidateQueries({ queryKey: getGetQcSummaryQueryKey() });
  };

  const submitAction = async () => {
    if (!actionDialog.entityId || !actionDialog.entityType) return;
    const data = {
      entityType: actionDialog.entityType,
      entityId: actionDialog.entityId,
      entityId2: actionDialog.entityId2,
      note: note || undefined,
    };
    try {
      if (actionDialog.mode === "approve") {
        await approveM.mutateAsync({ data });
        toast({ title: "Đã duyệt thành công" });
      } else {
        await rejectM.mutateAsync({ data });
        toast({ title: "Đã từ chối" });
      }
      setActionDialog({ open: false, mode: "approve" });
      setNote("");
      refresh();
    } catch {
      toast({ title: "Lỗi", description: "Không thể thực hiện hành động.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quản lý chất lượng</h1>
              <p className="text-sm text-muted-foreground">Phê duyệt nội dung trước khi đưa vào sử dụng</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Từ</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-sm w-[140px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">đến</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-sm w-[140px]" />
            </div>
            {(fromDate || toDate) && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setFromDate(""); setToDate(""); }}>
                Xóa lọc
              </Button>
            )}
          </div>
        </div>

        <Tabs value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
          <TabsList className="grid grid-cols-7 w-full">
            {(Object.keys(ENTITY_LABELS) as EntityType[]).map((t) => {
              const counts = summary?.[t];
              const pending = counts?.PENDING ?? 0;
              return (
                <TabsTrigger key={t} value={t} className="relative text-xs">
                  {ENTITY_LABELS[t]}
                  {pending > 0 && (
                    <Badge className="ml-1 bg-amber-500 hover:bg-amber-600 text-white text-xs px-1 h-4">{pending}</Badge>
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
                  <CardTitle className="flex items-center justify-between">
                    <span>{ENTITY_LABELS[t]}</span>
                    {(fromDate || toDate) && (
                      <span className="text-xs font-normal text-muted-foreground">
                        Đang lọc: {fromDate || "…"} → {toDate || "…"} &bull; {items.length} kết quả
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Không có mục nào</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => {
                        const itemStatus = item.approvalStatus as string;
                        return (
                          <div key={`${item.id}-${item.id2 ?? ""}`} className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-accent/30">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium">{item.title}</h3>
                                <StatusBadge status={itemStatus} />
                              </div>
                              {item.subtitle && <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>}
                              {item.detail && <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{item.detail}</p>}
                              {item.approvalNote && (
                                <p className="text-xs text-muted-foreground mt-2 italic">Ghi chú: {item.approvalNote}</p>
                              )}
                              {item.createdAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => setDetailDialog({ open: true, item })}>
                                <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                              </Button>
                              {itemStatus === "PENDING" && (
                                <>
                                  <Button size="sm" onClick={() => {
                                    setActionDialog({ open: true, mode: "approve", entityId: item.id, entityId2: item.id2, entityType: t });
                                    setNote("");
                                  }}>
                                    <Check className="h-4 w-4 mr-1" />Duyệt
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => {
                                    setActionDialog({ open: true, mode: "reject", entityId: item.id, entityId2: item.id2, entityType: t });
                                    setNote("");
                                  }}>
                                    <X className="h-4 w-4 mr-1" />Từ chối
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setHistoryDialog({ open: true, entityType: t, entityId: item.id, title: item.title })}>
                                <HistoryIcon className="h-4 w-4 mr-1" />Lịch sử
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => setDetailDialog({ open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Chi tiết: {detailDialog.item?.title}
            </DialogTitle>
            <DialogDescription>
              {detailDialog.item && <StatusBadge status={detailDialog.item.approvalStatus} />}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {detailDialog.item?.fields && detailDialog.item.fields.length > 0 ? (
              <div className="space-y-1 pr-2">
                {detailDialog.item.fields.map((f, i) => (
                  <div key={i} className="grid grid-cols-[140px_1fr] gap-2 py-2 border-b last:border-0">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">{f.label}</span>
                    <span className="text-sm break-words whitespace-pre-wrap">{f.value}</span>
                  </div>
                ))}
                {detailDialog.item.mediaUrls && detailDialog.item.mediaUrls.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tài liệu / Hình ảnh</p>
                    <div className="flex flex-col gap-1.5">
                      {detailDialog.item.mediaUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url.startsWith("/objects/") ? `${BASE}/api/storage${url}` : url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> Tệp đính kèm {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Không có thông tin chi tiết</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false })}>Đóng</Button>
            {detailDialog.item?.approvalStatus === "PENDING" && (
              <>
                <Button onClick={() => {
                  setDetailDialog({ open: false });
                  setActionDialog({ open: true, mode: "approve", entityId: detailDialog.item!.id, entityId2: detailDialog.item!.id2, entityType });
                  setNote("");
                }}>
                  <Check className="h-4 w-4 mr-1" /> Duyệt
                </Button>
                <Button variant="destructive" onClick={() => {
                  setDetailDialog({ open: false });
                  setActionDialog({ open: true, mode: "reject", entityId: detailDialog.item!.id, entityId2: detailDialog.item!.id2, entityType });
                  setNote("");
                }}>
                  <X className="h-4 w-4 mr-1" /> Từ chối
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <span className="text-xs font-medium">
                      {h.action === "APPROVE" ? "✅ Phê duyệt" : h.action === "RESUBMIT" ? "🔄 Gửi lại yêu cầu" : "❌ Từ chối"}
                    </span>
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
