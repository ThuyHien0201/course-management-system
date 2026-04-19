import { useState } from "react";
import { AppLayout } from "@/components/layout";
import {
  useListInstructors,
  useCreateInstructor,
  useUpdateInstructor,
  useDeleteInstructor,
  getListInstructorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, GraduationCap, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InstructorForm = {
  fullName: string;
  academicTitle: string;
  position: string;
  specialization: string;
  email: string;
  phone: string;
  notes: string;
};
const emptyForm: InstructorForm = { fullName: "", academicTitle: "", position: "", specialization: "", email: "", phone: "", notes: "" };

export default function InstructorsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<InstructorForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: instructors = [], isLoading } = useListInstructors(search ? { search } : undefined);
  const createMutation = useCreateInstructor();
  const updateMutation = useUpdateInstructor();
  const deleteMutation = useDeleteInstructor();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListInstructorsQueryKey() });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (i: typeof instructors[0]) => {
    setEditId(i.id);
    setForm({
      fullName: i.fullName,
      academicTitle: i.academicTitle ?? "",
      position: i.position ?? "",
      specialization: i.specialization ?? "",
      email: i.email ?? "",
      phone: i.phone ?? "",
      notes: i.notes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.fullName) {
      toast({ title: "Vui lòng nhập họ và tên", variant: "destructive" });
      return;
    }
    const data = {
      fullName: form.fullName,
      academicTitle: form.academicTitle || null,
      position: form.position || null,
      specialization: form.specialization || null,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
    };
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Thêm giảng viên thành công" });
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
      toast({ title: "Đã xóa giảng viên" });
      setDeleteId(null);
      invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const f = (key: keyof InstructorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Giảng viên</h1>
            <p className="text-muted-foreground mt-1">Quản lý danh sách giảng viên</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm giảng viên
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm giảng viên..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có giảng viên nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{instructor.fullName}</CardTitle>
                      {instructor.academicTitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{instructor.academicTitle}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(instructor)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(instructor.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {instructor.position && <Badge variant="secondary" className="text-xs">{instructor.position}</Badge>}
                  {instructor.specialization && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Chuyên môn:</span> {instructor.specialization}</p>
                  )}
                  <div className="space-y-1 pt-1 border-t">
                    {instructor.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {instructor.email}
                      </div>
                    )}
                    {instructor.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {instructor.phone}
                      </div>
                    )}
                  </div>
                  {instructor.notes && <p className="text-xs text-muted-foreground italic">{instructor.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Cập nhật giảng viên" : "Thêm giảng viên mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Họ và tên (kèm học vị) <span className="text-destructive">*</span></Label>
                <Input value={form.fullName} onChange={f("fullName")} placeholder="VD: TS. Nguyễn Văn A" />
              </div>
              <div className="space-y-1.5">
                <Label>Học vị</Label>
                <Input value={form.academicTitle} onChange={f("academicTitle")} placeholder="VD: Tiến sĩ (TS.)" />
              </div>
              <div className="space-y-1.5">
                <Label>Chức vụ</Label>
                <Input value={form.position} onChange={f("position")} placeholder="VD: Trưởng bộ môn" />
              </div>
              <div className="space-y-1.5">
                <Label>Chuyên môn</Label>
                <Input value={form.specialization} onChange={f("specialization")} placeholder="VD: ISO 9001, Quản lý chất lượng" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={f("email")} placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input value={form.phone} onChange={f("phone")} placeholder="09xx xxx xxx" />
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea rows={3} value={form.notes} onChange={f("notes")} placeholder="Ghi chú thêm..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Cập nhật" : "Thêm giảng viên"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>Bạn có chắc muốn xóa giảng viên này?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
