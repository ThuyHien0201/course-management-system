import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth";
import {
  useListCertificates,
  useGetCertificateStudentsByClass,
  useIssueCertificate,
  useUpdateCertificate,
  useListInstructors,
  getGetCertificateStudentsByClassQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronLeft, Calendar, Users, Plus, Pencil, Check, Search, Lock, Eye, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CertificatePreview } from "@/components/certificate-preview";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type CertForm = {
  issueDate: string; expiryDate: string; instructorId: string;
  printLocation: string; locationLink: string;
};
const emptyCertForm: CertForm = { issueDate: "", expiryDate: "", instructorId: "", printLocation: "", locationLink: "" };

export default function CertificatesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [certModal, setCertModal] = useState<{ studentId: number; isEdit: boolean } | null>(null);
  const [certForm, setCertForm] = useState<CertForm>(emptyCertForm);
  const [previewStudentId, setPreviewStudentId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const canSubmit = user?.role === "staff" || user?.role === "admin";
  const canConfirm = user?.role === "issuer" || user?.role === "admin";

  const { data: classes = [], isLoading } = useListCertificates();
  const { data: instructors = [] } = useListInstructors({ onlyApproved: "true" });
  const { data: students = [], isLoading: studentsLoading } = useGetCertificateStudentsByClass(
    selectedClass!,
    search ? { search } : undefined,
    {
      query: {
        enabled: !!selectedClass,
        queryKey: getGetCertificateStudentsByClassQueryKey(selectedClass!, search ? { search } : undefined),
      },
    }
  );

  const issueMutation = useIssueCertificate();
  const updateMutation = useUpdateCertificate();

  const selectedClassData = classes.find((c) => c.id === selectedClass);

  const invalidateStudents = () =>
    qc.invalidateQueries({ queryKey: getGetCertificateStudentsByClassQueryKey(selectedClass!) });

  const openSubmit = (studentId: number) => {
    setCertForm(emptyCertForm);
    setCertModal({ studentId, isEdit: false });
  };

  const openEdit = (studentId: number) => {
    const s = students.find((s) => s.studentId === studentId);
    if (!s) return;
    setCertForm({
      issueDate: s.issueDate ?? "", expiryDate: s.expiryDate ?? "",
      instructorId: s.instructorId ? String(s.instructorId) : "",
      printLocation: s.printLocation ?? "", locationLink: s.locationLink ?? "",
    });
    setCertModal({ studentId, isEdit: true });
  };

  const handleSubmit = async () => {
    if (!certModal || !selectedClass) return;
    const data = {
      studentId: certModal.studentId,
      issueDate: certForm.issueDate || null,
      expiryDate: certForm.expiryDate || null,
      instructorId: certForm.instructorId ? Number(certForm.instructorId) : null,
      printLocation: certForm.printLocation || null,
      locationLink: certForm.locationLink || null,
    };
    try {
      if (certModal.isEdit) {
        await updateMutation.mutateAsync({ classId: selectedClass, studentId: certModal.studentId, data });
        toast({ title: "Cập nhật thông tin chứng chỉ thành công — đang chờ QC duyệt lại" });
      } else {
        await issueMutation.mutateAsync({ classId: selectedClass, data });
        toast({ title: "Đã gửi thông tin chứng chỉ — đang chờ QC duyệt" });
      }
      setCertModal(null);
      invalidateStudents();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleConfirm = async (studentId: number) => {
    if (!selectedClass) return;
    setConfirmingId(studentId);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${BASE}/api/certificates/${selectedClass}/${studentId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Có lỗi xảy ra");
      }
      toast({ title: "Đã xác nhận cấp chứng chỉ thành công" });
      invalidateStudents();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : "Có lỗi xảy ra", variant: "destructive" });
    } finally {
      setConfirmingId(null);
    }
  };

  if (!selectedClass) {
    return (
      <AppLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Cấp chứng chỉ</h1>
              <p className="text-muted-foreground mt-1">Chọn lớp học để quản lý cấp chứng chỉ</p>
            </div>
            {!canSubmit && !canConfirm && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                <Lock className="h-4 w-4" />
                Chỉ xem
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có lớp học nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <Card
                  key={cls.id}
                  className="border shadow-sm cursor-pointer hover:shadow-md hover:ring-1 hover:ring-primary transition-all"
                  onClick={() => { setSelectedClass(cls.id); setSearch(""); }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{cls.courseName}</p>
                        <div className="flex gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> {cls.startDate}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {cls.studentCount} HV
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedClass(null)}>
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedClassData?.name}</h1>
            <p className="text-muted-foreground text-sm">
              {selectedClassData?.courseName} &bull; {selectedClassData?.startDate} &mdash; {selectedClassData?.endDate}
            </p>
          </div>
        </div>

        {canConfirm && !canSubmit && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Nhân viên đã điền thông tin, QC đã duyệt — bạn chỉ cần xác nhận cấp chứng chỉ.
          </div>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm học viên..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto rounded-lg border shadow-sm bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mã HV</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Họ và tên</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày sinh</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tên khóa học</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày cấp</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày hết HH</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Chứng chỉ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duyệt QC</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {studentsLoading ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Đang tải...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Chưa có học viên trong lớp này</td></tr>
              ) : students.map((s) => {
                const certStatus = (s as { approvalStatus?: string | null }).approvalStatus;
                const confirmedAt = (s as { confirmedAt?: string | null }).confirmedAt;
                return (
                  <tr key={s.studentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-mono">{s.studentCode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.dateOfBirth || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.courseName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.issueDate || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.expiryDate || "—"}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 gap-1 text-xs ${s.hasCertificate ? "border-[#0047AB]/40 text-[#0047AB] hover:bg-[#0047AB]/10" : "text-muted-foreground"}`}
                        onClick={() => setPreviewStudentId(s.studentId)}
                      >
                        <Eye className="h-3 w-3" /> Xem
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      {confirmedAt ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Đã xác nhận
                        </Badge>
                      ) : s.hasCertificate ? (
                        <StatusBadge status={certStatus} />
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {canConfirm && !canSubmit ? (
                        confirmedAt ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-xs">
                            <Check className="h-3 w-3" /> Đã cấp
                          </Badge>
                        ) : certStatus === "APPROVED" ? (
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleConfirm(s.studentId)}
                            disabled={confirmingId === s.studentId}
                          >
                            <Check className="h-3 w-3" />
                            {confirmingId === s.studentId ? "Đang xử lý..." : "Xác nhận cấp"}
                          </Button>
                        ) : s.hasCertificate ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Chờ QC duyệt</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )
                      ) : canSubmit ? (
                        confirmedAt ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-xs">
                            <Check className="h-3 w-3" /> Đã cấp
                          </Badge>
                        ) : s.hasCertificate ? (
                          certStatus !== "APPROVED" ? (
                            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openEdit(s.studentId)}>
                              <Pencil className="h-3 w-3" /> Sửa
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <Check className="h-3 w-3" />
                              <span>Chờ xác nhận</span>
                            </div>
                          )
                        ) : (s as { resultApprovalStatus?: string | null }).resultApprovalStatus === "APPROVED" ? (
                          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => openSubmit(s.studentId)}>
                            <Send className="h-3 w-3" /> Gửi thông tin
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Chờ QC duyệt KQ</span>
                          </div>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canSubmit && (
          <Dialog open={!!certModal} onOpenChange={(o) => !o && setCertModal(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{certModal?.isEdit ? "Cập nhật thông tin chứng chỉ" : "Gửi thông tin chứng chỉ"}</DialogTitle>
                <DialogDescription>
                  {certModal?.isEdit
                    ? "Chỉnh sửa thông tin — sau khi lưu sẽ gửi lại cho QC phê duyệt."
                    : "Điền thông tin chứng chỉ. Sau khi gửi, QC sẽ phê duyệt và bên cấp chứng chỉ sẽ xác nhận."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ngày cấp</Label>
                    <Input type="date" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ngày hết hiệu lực</Label>
                    <Input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Giảng viên ký chứng chỉ</Label>
                  <Select value={certForm.instructorId} onValueChange={(v) => setCertForm({ ...certForm, instructorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                    <SelectContent>
                      {instructors.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>{i.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nơi in chứng chỉ</Label>
                  <Input value={certForm.printLocation} onChange={(e) => setCertForm({ ...certForm, printLocation: e.target.value })} placeholder="Địa điểm in..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Link định vị</Label>
                  <Input value={certForm.locationLink} onChange={(e) => setCertForm({ ...certForm, locationLink: e.target.value })} placeholder="https://maps.google.com/..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCertModal(null)}>Hủy</Button>
                <Button onClick={handleSubmit} disabled={issueMutation.isPending || updateMutation.isPending}>
                  <Send className="h-4 w-4 mr-1" />
                  {certModal?.isEdit ? "Cập nhật & Gửi lại" : "Gửi cho QC duyệt"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <CertificatePreview
          open={!!previewStudentId}
          onClose={() => setPreviewStudentId(null)}
          student={previewStudentId ? (students.find((s) => s.studentId === previewStudentId) ?? null) as Parameters<typeof CertificatePreview>[0]["student"] : null}
          classData={selectedClassData ? {
            id: selectedClassData.id,
            name: selectedClassData.name,
            courseName: selectedClassData.courseName,
            startDate: selectedClassData.startDate,
            endDate: selectedClassData.endDate,
          } : null}
        />
      </div>
    </AppLayout>
  );
}
