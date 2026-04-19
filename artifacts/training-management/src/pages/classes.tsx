import { useState } from "react";
import { AppLayout } from "@/components/layout";
import {
  useListClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useListCourses,
  useListClassSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useListClassStudents,
  useListInstructors,
  getListClassesQueryKey,
  getListClassSessionsQueryKey,
  getListClassStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Library, Calendar, User, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ClassForm = { name: string; courseId: string; startDate: string; endDate: string };
const emptyClassForm: ClassForm = { name: "", courseId: "", startDate: "", endDate: "" };

type SessionForm = { sessionDate: string; sessionPeriod: string; lessonCount: string; content: string; instructorId: string };
const emptySessionForm: SessionForm = { sessionDate: "", sessionPeriod: "Sáng", lessonCount: "", content: "", instructorId: "" };

export default function ClassesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyClassForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionEditId, setSessionEditId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySessionForm);
  const [sessionDeleteId, setSessionDeleteId] = useState<number | null>(null);

  const { data: classes = [], isLoading } = useListClasses(search ? { search } : undefined);
  const { data: courses = [] } = useListCourses();
  const { data: instructors = [] } = useListInstructors();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  const { data: sessions = [] } = useListClassSessions(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getListClassSessionsQueryKey(selectedClass!) }
  });
  const { data: classStudents = [] } = useListClassStudents(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getListClassStudentsQueryKey(selectedClass!) }
  });

  const selectedClassData = classes.find(c => c.id === selectedClass);

  const invalidateClasses = () => qc.invalidateQueries({ queryKey: getListClassesQueryKey() });
  const invalidateSessions = () => selectedClass && qc.invalidateQueries({ queryKey: getListClassSessionsQueryKey(selectedClass) });

  const openCreate = () => { setEditId(null); setForm(emptyClassForm); setOpen(true); };
  const openEdit = (c: typeof classes[0]) => {
    setEditId(c.id);
    setForm({ name: c.name, courseId: String(c.courseId), startDate: c.startDate, endDate: c.endDate });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.courseId || !form.startDate || !form.endDate) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    const data = { name: form.name, courseId: Number(form.courseId), startDate: form.startDate, endDate: form.endDate };
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: "Tạo lớp học thành công" });
      }
      setOpen(false);
      invalidateClasses();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Đã xóa lớp học" });
      if (selectedClass === deleteId) setSelectedClass(null);
      setDeleteId(null);
      invalidateClasses();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const openSessionCreate = () => { setSessionEditId(null); setSessionForm(emptySessionForm); setSessionOpen(true); };
  const openSessionEdit = (s: typeof sessions[0]) => {
    setSessionEditId(s.id);
    setSessionForm({
      sessionDate: s.sessionDate, sessionPeriod: s.sessionPeriod,
      lessonCount: String(s.lessonCount), content: s.content,
      instructorId: s.instructorId ? String(s.instructorId) : "",
    });
    setSessionOpen(true);
  };

  const handleSessionSubmit = async () => {
    if (!selectedClass || !sessionForm.sessionDate || !sessionForm.content || !sessionForm.lessonCount) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    const data = {
      sessionDate: sessionForm.sessionDate, sessionPeriod: sessionForm.sessionPeriod,
      lessonCount: Number(sessionForm.lessonCount), content: sessionForm.content,
      instructorId: sessionForm.instructorId ? Number(sessionForm.instructorId) : null,
    };
    try {
      if (sessionEditId) {
        await updateSessionMutation.mutateAsync({ classId: selectedClass, sessionId: sessionEditId, data });
        toast({ title: "Cập nhật buổi học thành công" });
      } else {
        await createSessionMutation.mutateAsync({ classId: selectedClass, data });
        toast({ title: "Thêm buổi học thành công" });
      }
      setSessionOpen(false);
      invalidateSessions();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleSessionDelete = async () => {
    if (!sessionDeleteId || !selectedClass) return;
    try {
      await deleteSessionMutation.mutateAsync({ classId: selectedClass, sessionId: sessionDeleteId });
      toast({ title: "Đã xóa buổi học" });
      setSessionDeleteId(null);
      invalidateSessions();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Lớp học</h1>
            <p className="text-muted-foreground mt-1">Quản lý danh sách lớp học</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm lớp học
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm lớp học..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Library className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có lớp học nào</p>
              </div>
            ) : (
              classes.map((cls) => (
                <Card
                  key={cls.id}
                  className={`border shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedClass === cls.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cls.courseName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{cls.startDate} - {cls.endDate}</span>
                        </div>
                        <Badge variant="secondary" className="mt-1.5 text-xs">
                          {cls.studentCount} học viên
                        </Badge>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(cls); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(cls.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {selectedClass && selectedClassData ? (
            <div className="lg:col-span-2">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedClassData.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedClassData.courseName} &bull; {selectedClassData.startDate} - {selectedClassData.endDate}</p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="sessions">
                    <TabsList className="mb-4">
                      <TabsTrigger value="sessions">Buổi học ({sessions.length})</TabsTrigger>
                      <TabsTrigger value="students">Danh sách học viên ({classStudents.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sessions" className="space-y-3">
                      <div className="flex justify-end">
                        <Button size="sm" className="gap-1" onClick={openSessionCreate}>
                          <Plus className="h-3.5 w-3.5" /> Thêm buổi học
                        </Button>
                      </div>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Chưa có buổi học nào
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sessions.map((s) => (
                            <div key={s.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{s.sessionDate}</Badge>
                                  <Badge className="text-xs">{s.sessionPeriod}</Badge>
                                  <span className="text-xs text-muted-foreground">{s.lessonCount} tiết</span>
                                </div>
                                <p className="text-sm mt-1">{s.content}</p>
                                {s.instructorName && (
                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <User className="h-3 w-3" /> {s.instructorName}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openSessionEdit(s)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setSessionDeleteId(s.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="students">
                      {classStudents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Chưa có học viên nào trong lớp</div>
                      ) : (
                        <div className="overflow-x-auto rounded border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Mã HV</th>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Họ và tên</th>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Kết quả</th>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Người phụ trách</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {classStudents.map((s) => (
                                <tr key={s.studentId} className="hover:bg-muted/20">
                                  <td className="px-3 py-2">
                                    <Badge variant="outline" className="text-xs">{s.studentCode}</Badge>
                                  </td>
                                  <td className="px-3 py-2 font-medium text-sm">{s.fullName}</td>
                                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.testResult || "—"}</td>
                                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.supervisorName || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
              <div className="text-center py-16">
                <Library className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chọn một lớp học để xem chi tiết</p>
              </div>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Cập nhật lớp học" : "Thêm lớp học mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Tên lớp học <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Lớp ATLĐ-2024-01" />
              </div>
              <div className="space-y-1.5">
                <Label>Khóa học <span className="text-destructive">*</span></Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn khóa học" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Từ ngày <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Đến ngày <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Cập nhật" : "Tạo lớp học"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{sessionEditId ? "Cập nhật buổi học" : "Thêm buổi học"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ngày học <span className="text-destructive">*</span></Label>
                  <Input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Buổi <span className="text-destructive">*</span></Label>
                  <Select value={sessionForm.sessionPeriod} onValueChange={(v) => setSessionForm({ ...sessionForm, sessionPeriod: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sáng">Sáng</SelectItem>
                      <SelectItem value="Chiều">Chiều</SelectItem>
                      <SelectItem value="Tối">Tối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Số lượng tiết <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" value={sessionForm.lessonCount} onChange={(e) => setSessionForm({ ...sessionForm, lessonCount: e.target.value })} placeholder="VD: 4" />
              </div>
              <div className="space-y-1.5">
                <Label>Nội dung buổi học <span className="text-destructive">*</span></Label>
                <Textarea rows={3} value={sessionForm.content} onChange={(e) => setSessionForm({ ...sessionForm, content: e.target.value })} placeholder="Mô tả nội dung buổi học..." />
              </div>
              <div className="space-y-1.5">
                <Label>Giảng viên</Label>
                <Select value={sessionForm.instructorId} onValueChange={(v) => setSessionForm({ ...sessionForm, instructorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSessionOpen(false)}>Hủy</Button>
              <Button onClick={handleSessionSubmit} disabled={createSessionMutation.isPending || updateSessionMutation.isPending}>
                {sessionEditId ? "Cập nhật" : "Thêm buổi học"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
              <AlertDialogDescription>Bạn có chắc muốn xóa lớp học này?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!sessionDeleteId} onOpenChange={(o) => !o && setSessionDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa buổi học</AlertDialogTitle>
              <AlertDialogDescription>Bạn có chắc muốn xóa buổi học này?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleSessionDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
