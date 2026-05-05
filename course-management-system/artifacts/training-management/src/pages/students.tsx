import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth";
import {
  useListStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useListInstructors,
  useListClasses,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StudentForm = {
  studentCode: string; fullName: string; dateOfBirth: string; idNumber: string;
  idIssueDate: string; idIssuePlace: string; workplace: string; address: string;
  phone: string; email: string; photoUrl: string;
  instructorId: string; classId: string;
};
const emptyForm: StudentForm = {
  studentCode: "", fullName: "", dateOfBirth: "", idNumber: "",
  idIssueDate: "", idIssuePlace: "", workplace: "", address: "",
  phone: "", email: "", photoUrl: "", instructorId: "", classId: "",
};

export default function StudentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const canEdit = user?.role === "staff" || user?.role === "admin";

  const { data: students = [], isLoading } = useListStudents(search ? { search } : undefined);
  const { data: instructors = [] } = useListInstructors({ onlyApproved: "true" });
  const { data: classes = [] } = useListClasses({ onlyApproved: "true" });
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: typeof students[0]) => {
    setEditId(s.id);
    setForm({
      studentCode: s.studentCode, fullName: s.fullName,
      dateOfBirth: s.dateOfBirth ?? "", idNumber: s.idNumber ?? "",
      idIssueDate: s.idIssueDate ?? "", idIssuePlace: s.idIssuePlace ?? "",
      workplace: s.workplace ?? "", address: s.address ?? "",
      phone: s.phone ?? "", email: s.email ?? "", photoUrl: s.photoUrl ?? "",
      instructorId: s.instructorId ? String(s.instructorId) : "",
      classId: s.classId ? String(s.classId) : "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.studentCode || !form.fullName) {
      toast({ title: "Vui lòng nhập mã học viên và họ tên", variant: "destructive" });
      return;
    }
    const data = {
      studentCode: form.studentCode, fullName: form.fullName,
      dateOfBirth: form.dateOfBirth || null, idNumber: form.idNumber || null,
      idIssueDate: form.idIssueDate || null, idIssuePlace: form.idIssuePlace || null,
      workplace: form.workplace || null, address: form.address || null,
      phone: form.phone || null, email: form.email || null, photoUrl: form.photoUrl || null,
      instructorId: form.instructorId ? Number(form.instructorId) : null,
      classId: form.classId ? Number(form.classId) : null,
    };
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Thêm học viên thành công — đang chờ QC duyệt" });
      }
      setOpen(false);
      invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Đã xóa học viên" });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const f = (key: keyof StudentForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Học viên</h1>
            <p className="text-muted-foreground mt-1">Quản lý danh sách học viên</p>
          </div>
          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Thêm học viên
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm học viên..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có học viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mã HV</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày sinh</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Số điện thoại</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lớp học</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Badge variant="outline">{s.studentCode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {s.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.dateOfBirth || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.className || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={(s as { approvalStatus?: string }).approvalStatus} />
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canEdit && (
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Cập nhật học viên" : "Thêm học viên mới"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Mã học viên <span className="text-destructive">*</span></Label>
                    <Input value={form.studentCode} onChange={f("studentCode")} placeholder="VD: HV-2024-001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Họ và tên <span className="text-destructive">*</span></Label>
                    <Input value={form.fullName} onChange={f("fullName")} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ngày tháng năm sinh</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CCCD</Label>
                    <Input value={form.idNumber} onChange={f("idNumber")} placeholder="Số CCCD" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ngày cấp</Label>
                    <Input type="date" value={form.idIssueDate} onChange={f("idIssueDate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nơi cấp</Label>
                    <Input value={form.idIssuePlace} onChange={f("idIssuePlace")} placeholder="CA TP. Hà Nội" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Nơi công tác</Label>
                    <Input value={form.workplace} onChange={f("workplace")} placeholder="Tên công ty/đơn vị" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Nơi cư trú</Label>
                    <Input value={form.address} onChange={f("address")} placeholder="Địa chỉ thường trú" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Số điện thoại</Label>
                    <Input value={form.phone} onChange={f("phone")} placeholder="09xx xxx xxx" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={f("email")} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giảng viên phụ trách</Label>
                    <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                      <SelectContent>
                        {instructors.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>{i.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lớp học</Label>
                    <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn lớp học" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!editId && (
                    <div className="col-span-2">
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                        Sau khi thêm, học viên sẽ ở trạng thái <strong>Chờ duyệt</strong> và cần QC phê duyệt.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editId ? "Cập nhật" : "Thêm học viên"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>Bạn có chắc muốn xóa học viên này?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </AppLayout>
  );
}
