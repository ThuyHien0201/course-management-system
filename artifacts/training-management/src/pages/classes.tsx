import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/contexts/auth";
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
  useBulkUpdateClassStudents,
  useListInstructors,
  getListClassesQueryKey,
  getListClassSessionsQueryKey,
  getListClassStudentsQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Library, Calendar, User, CalendarDays, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ClassForm = { name: string; courseId: string; startDate: string; endDate: string };
const emptyClassForm: ClassForm = { name: "", courseId: "", startDate: "", endDate: "" };

type SessionForm = {
  title: string; sessionDate: string; sessionPeriod: string; lessonCount: string;
  content: string; instructorId: string; mediaUrls: string[];
};
const emptySessionForm: SessionForm = {
  title: "", sessionDate: "", sessionPeriod: "Sáng", lessonCount: "", content: "", instructorId: "", mediaUrls: [],
};

type StudentRow = {
  studentId: number; studentCode: string; fullName: string;
  testScore: string; grade: string; instructorId: string; supervisorName: string | null;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ClassesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
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

  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [studentsDirty, setStudentsDirty] = useState(false);

  const canEdit = user?.role === "staff" || user?.role === "admin";

  const { data: classes = [], isLoading } = useListClasses(search ? { search } : undefined);
  const { data: courses = [] } = useListCourses({ onlyApproved: "true" });
  const { data: instructors = [] } = useListInstructors({ onlyApproved: "true" });
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const bulkUpdateMutation = useBulkUpdateClassStudents();

  const { data: sessions = [] } = useListClassSessions(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getListClassSessionsQueryKey(selectedClass!) },
  });
  const { data: classStudents = [] } = useListClassStudents(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getListClassStudentsQueryKey(selectedClass!) },
  });

  useEffect(() => {
    if (classStudents.length > 0) {
      setStudentRows(
        classStudents.map((s) => ({
          studentId: s.studentId, studentCode: s.studentCode, fullName: s.fullName,
          testScore: s.testScore ?? "", grade: s.grade ?? "",
          instructorId: s.instructorId ? String(s.instructorId) : "",
          supervisorName: s.supervisorName ?? null,
        }))
      );
      setStudentsDirty(false);
    }
  }, [classStudents]);

  const selectedClassData = classes.find((c) => c.id === selectedClass);

  const invalidateClasses = () => qc.invalidateQueries({ queryKey: getListClassesQueryKey() });
  const invalidateSessions = () => selectedClass && qc.invalidateQueries({ queryKey: getListClassSessionsQueryKey(selectedClass) });
  const invalidateStudents = () => selectedClass && qc.invalidateQueries({ queryKey: getListClassStudentsQueryKey(selectedClass) });

  const openCreate = () => { setEditId(null); setForm(emptyClassForm); setOpen(true); };
  const openEdit = (c: (typeof classes)[0]) => {
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
        toast({ title: "Tạo lớp học thành công — đang chờ QC duyệt" });
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
  const openSessionEdit = (s: (typeof sessions)[0]) => {
    setSessionEditId(s.id);
    setSessionForm({
      title: (s as { title?: string | null }).title ?? "",
      sessionDate: s.sessionDate, sessionPeriod: s.sessionPeriod,
      lessonCount: String(s.lessonCount), content: s.content,
      instructorId: s.instructorId ? String(s.instructorId) : "",
      mediaUrls: (s.mediaUrls as string[]) ?? [],
    });
    setSessionOpen(true);
  };

  const handleSessionSubmit = async () => {
    if (!selectedClass || !sessionForm.sessionDate || !sessionForm.content || !sessionForm.lessonCount) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    const data = {
      title: sessionForm.title || null,
      sessionDate: sessionForm.sessionDate, sessionPeriod: sessionForm.sessionPeriod,
      lessonCount: Number(sessionForm.lessonCount), content: sessionForm.content,
      instructorId: sessionForm.instructorId ? Number(sessionForm.instructorId) : null,
      mediaUrls: sessionForm.mediaUrls,
    };
    try {
      if (sessionEditId) {
        await updateSessionMutation.mutateAsync({ classId: selectedClass, sessionId: sessionEditId, data });
        toast({ title: "Cập nhật buổi học thành công" });
      } else {
        await createSessionMutation.mutateAsync({ classId: selectedClass, data });
        toast({ title: "Thêm buổi học thành công — đang chờ QC duyệt" });
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

  const handleSaveStudents = async () => {
    if (!selectedClass) return;
    try {
      await bulkUpdateMutation.mutateAsync({
        classId: selectedClass,
        data: {
          students: studentRows.map((r) => ({
            studentId: r.studentId, testScore: r.testScore || null,
            grade: r.grade || null, instructorId: r.instructorId ? Number(r.instructorId) : null,
          })),
        },
      });
      toast({ title: "Lưu kết quả thành công — đang chờ QC duyệt" });
      setStudentsDirty(false);
      invalidateStudents();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleCancelStudents = () => {
    setStudentRows(
      classStudents.map((s) => ({
        studentId: s.studentId, studentCode: s.studentCode, fullName: s.fullName,
        testScore: s.testScore ?? "", grade: s.grade ?? "",
        instructorId: s.instructorId ? String(s.instructorId) : "",
        supervisorName: s.supervisorName ?? null,
      }))
    );
    setStudentsDirty(false);
  };

  const updateStudentRow = (idx: number, field: keyof StudentRow, value: string) => {
    setStudentRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setStudentsDirty(true);
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Lớp học</h1>
            <p className="text-muted-foreground mt-1">Quản lý danh sách lớp học</p>
          </div>
          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Thêm lớp học
            </Button>
          )}
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
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cls.courseName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{cls.startDate} - {cls.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{cls.studentCount} học viên</Badge>
                          <StatusBadge status={(cls as { approvalStatus?: string }).approvalStatus} />
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(cls); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(cls.id); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{selectedClassData.name}</CardTitle>
                    <StatusBadge status={(selectedClassData as { approvalStatus?: string }).approvalStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedClassData.courseName} &bull; {selectedClassData.startDate} - {selectedClassData.endDate}
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="sessions">
                    <TabsList className="mb-4">
                      <TabsTrigger value="sessions">Buổi học ({sessions.length})</TabsTrigger>
                      <TabsTrigger value="students">Danh sách học viên ({classStudents.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sessions" className="space-y-3">
                      {canEdit && (
                        <div className="flex justify-end">
                          <Button size="sm" className="gap-1" onClick={openSessionCreate}>
                            <Plus className="h-3.5 w-3.5" /> Thêm buổi học
                          </Button>
                        </div>
                      )}
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
                                {(s as { title?: string | null }).title && (
                                  <p className="font-medium text-sm mb-1">{(s as { title: string }).title}</p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{s.sessionDate}</Badge>
                                  <Badge className="text-xs">{s.sessionPeriod}</Badge>
                                  <span className="text-xs text-muted-foreground">{s.lessonCount} tiết</span>
                                  <StatusBadge status={(s as { approvalStatus?: string }).approvalStatus} />
                                </div>
                                <p className="text-sm mt-1">{s.content}</p>
                                {s.instructorName && (
                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <User className="h-3 w-3" /> {s.instructorName}
                                  </p>
                                )}
                                {(s.mediaUrls as string[])?.length > 0 && (
                                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                    {(s.mediaUrls as string[]).map((url, i) => (
                                      <a key={i} href={url.startsWith("/objects/") ? `${BASE}/api/storage${url}` : url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <Image className="h-3 w-3" /> Tệp {i + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {canEdit && (
                                <div className="flex gap-1 shrink-0">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openSessionEdit(s)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setSessionDeleteId(s.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="students">
                      {classStudents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Chưa có học viên nào trong lớp</div>
                      ) : (
                        <div className="space-y-3">
                          <div className="overflow-x-auto rounded border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Mã HV</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Họ tên</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Điểm số</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Xếp loại</th>
                                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Người phụ trách</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {studentRows.map((s, idx) => (
                                  <tr key={s.studentId} className="hover:bg-muted/20">
                                    <td className="px-3 py-2">
                                      <Badge variant="outline" className="text-xs">{s.studentCode}</Badge>
                                    </td>
                                    <td className="px-3 py-2 font-medium text-sm">{s.fullName}</td>
                                    <td className="px-3 py-2">
                                      {canEdit ? (
                                        <Input className="h-7 w-20 text-xs" placeholder="Điểm..." value={s.testScore}
                                          onChange={(e) => updateStudentRow(idx, "testScore", e.target.value)} />
                                      ) : <span className="text-sm">{s.testScore || "—"}</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                      {canEdit ? (
                                        <Select value={s.grade} onValueChange={(v) => updateStudentRow(idx, "grade", v)}>
                                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Chọn..." /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Đạt">Đạt</SelectItem>
                                            <SelectItem value="Không đạt">Không đạt</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : <span className="text-sm">{s.grade || "—"}</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                      {canEdit ? (
                                        <Select value={s.instructorId || "__none__"} onValueChange={(v) => updateStudentRow(idx, "instructorId", v === "__none__" ? "" : v)}>
                                          <SelectTrigger className="h-7 text-xs min-w-32"><SelectValue placeholder="Chọn GV..." /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="__none__">— Không có —</SelectItem>
                                            {instructors.map((i) => (
                                              <SelectItem key={i.id} value={String(i.id)}>{i.fullName}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : <span className="text-sm text-muted-foreground">{s.supervisorName || "—"}</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={handleCancelStudents} disabled={!studentsDirty}>Hủy</Button>
                              <Button size="sm" onClick={handleSaveStudents} disabled={!studentsDirty || bulkUpdateMutation.isPending}>
                                Lưu kết quả
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center text-muted-foreground text-sm border rounded-lg border-dashed">
              Chọn một lớp học để xem chi tiết
            </div>
          )}
        </div>

        {canEdit && (
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editId ? "Cập nhật lớp học" : "Thêm lớp học mới"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Tên lớp <span className="text-destructive">*</span></Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: ATLĐ-2025-01" />
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
                      <Label>Ngày bắt đầu <span className="text-destructive">*</span></Label>
                      <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ngày kết thúc <span className="text-destructive">*</span></Label>
                      <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                    </div>
                  </div>
                  {!editId && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                      Sau khi tạo, lớp học sẽ ở trạng thái <strong>Chờ duyệt</strong> và cần QC phê duyệt.
                    </p>
                  )}
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
                  <DialogDescription>Buổi học sau khi thêm sẽ cần QC duyệt</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Tiêu đề buổi học</Label>
                    <Input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder="VD: Ôn tập chương 3 — An toàn lao động" />
                  </div>
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
                    <Label>Số tiết <span className="text-destructive">*</span></Label>
                    <Input type="number" min={1} value={sessionForm.lessonCount} onChange={(e) => setSessionForm({ ...sessionForm, lessonCount: e.target.value })} placeholder="VD: 4" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nội dung buổi học <span className="text-destructive">*</span></Label>
                    <Textarea rows={3} value={sessionForm.content} onChange={(e) => setSessionForm({ ...sessionForm, content: e.target.value })} placeholder="Mô tả nội dung..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Giảng viên</Label>
                    <Select value={sessionForm.instructorId || "__none__"} onValueChange={(v) => setSessionForm({ ...sessionForm, instructorId: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Không có —</SelectItem>
                        {instructors.map((i) => (
                          <SelectItem key={i.id} value={String(i.id)}>{i.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tài liệu / Hình ảnh</Label>
                    <ObjectUploader
                      value={sessionForm.mediaUrls}
                      onChange={(urls) => setSessionForm({ ...sessionForm, mediaUrls: urls })}
                    />
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
