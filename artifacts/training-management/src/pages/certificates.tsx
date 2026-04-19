import { useState } from "react";
import { AppLayout } from "@/components/layout";
import {
  useListCertificates,
  useGetCertificatesByClass,
  useIssueCertificate,
  useUpdateCertificate,
  useListClassStudents,
  getGetCertificatesByClassQueryKey,
  getListClassStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronLeft, Calendar, Users, Plus, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CertificatesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ decisionNumber: "", supervisor: "", printLocation: "" });
  const [issueStudentId, setIssueStudentId] = useState<number | null>(null);
  const [issueForm, setIssueForm] = useState({ decisionNumber: "", supervisor: "", printLocation: "" });

  const { data: classes = [], isLoading } = useListCertificates();
  const { data: certificates = [] } = useGetCertificatesByClass(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getGetCertificatesByClassQueryKey(selectedClass!) }
  });
  const { data: classStudents = [] } = useListClassStudents(selectedClass!, {
    query: { enabled: !!selectedClass, queryKey: getListClassStudentsQueryKey(selectedClass!) }
  });

  const issueMutation = useIssueCertificate();
  const updateMutation = useUpdateCertificate();

  const selectedClassData = classes.find(c => c.id === selectedClass);

  const getCert = (studentId: number) => certificates.find(c => c.studentId === studentId);
  const hasCert = (studentId: number) => !!getCert(studentId);

  const openEdit = (studentId: number) => {
    const cert = getCert(studentId);
    setEditStudentId(studentId);
    setEditForm({
      decisionNumber: cert?.decisionNumber ?? "",
      supervisor: cert?.supervisor ?? "",
      printLocation: cert?.printLocation ?? "",
    });
  };

  const openIssue = (studentId: number) => {
    setIssueStudentId(studentId);
    setIssueForm({ decisionNumber: "", supervisor: "", printLocation: "" });
  };

  const handleIssue = async () => {
    if (!selectedClass || !issueStudentId) return;
    try {
      await issueMutation.mutateAsync({
        classId: selectedClass,
        data: { studentId: issueStudentId, ...issueForm }
      });
      toast({ title: "Cấp chứng chỉ thành công" });
      setIssueStudentId(null);
      qc.invalidateQueries({ queryKey: getGetCertificatesByClassQueryKey(selectedClass) });
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedClass || !editStudentId) return;
    try {
      await updateMutation.mutateAsync({
        classId: selectedClass,
        studentId: editStudentId,
        data: editForm
      });
      toast({ title: "Cập nhật thành công" });
      setEditStudentId(null);
      qc.invalidateQueries({ queryKey: getGetCertificatesByClassQueryKey(selectedClass) });
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  if (!selectedClass) {
    return (
      <AppLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Cấp chứng chỉ</h1>
            <p className="text-muted-foreground mt-1">Quản lý việc cấp chứng chỉ theo lớp học</p>
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
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{cls.courseName}</p>
                        <div className="flex gap-3 mt-2">
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedClass(null)}>
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedClassData?.name}</h1>
            <p className="text-muted-foreground text-sm">{selectedClassData?.courseName} &bull; {selectedClassData?.startDate} - {selectedClassData?.endDate}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border shadow-sm bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mã HV</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Họ và tên</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quyết định cấp</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Người phụ trách</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nơi in chứng chỉ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classStudents.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Chưa có học viên trong lớp này</td></tr>
              ) : classStudents.map((s) => {
                const cert = getCert(s.studentId);
                return (
                  <tr key={s.studentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-mono">{s.studentCode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cert?.decisionNumber || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cert?.supervisor || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cert?.printLocation || "—"}</td>
                    <td className="px-4 py-3">
                      {hasCert(s.studentId) ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                          <Check className="h-3 w-3" /> Đã cấp
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Chưa cấp</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasCert(s.studentId) ? (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openEdit(s.studentId)}>
                          <Pencil className="h-3 w-3" /> Sửa
                        </Button>
                      ) : (
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => openIssue(s.studentId)}>
                          <Plus className="h-3 w-3" /> Cấp CC
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Dialog open={!!issueStudentId} onOpenChange={(o) => !o && setIssueStudentId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cấp chứng chỉ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Quyết định cấp</Label>
                <Input value={issueForm.decisionNumber} onChange={(e) => setIssueForm({ ...issueForm, decisionNumber: e.target.value })} placeholder="Số quyết định..." />
              </div>
              <div className="space-y-1.5">
                <Label>Người phụ trách</Label>
                <Input value={issueForm.supervisor} onChange={(e) => setIssueForm({ ...issueForm, supervisor: e.target.value })} placeholder="Tên người phụ trách" />
              </div>
              <div className="space-y-1.5">
                <Label>Nơi in chứng chỉ</Label>
                <Input value={issueForm.printLocation} onChange={(e) => setIssueForm({ ...issueForm, printLocation: e.target.value })} placeholder="Địa điểm in..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIssueStudentId(null)}>Hủy</Button>
              <Button onClick={handleIssue} disabled={issueMutation.isPending}>Cấp chứng chỉ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editStudentId} onOpenChange={(o) => !o && setEditStudentId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cập nhật chứng chỉ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Quyết định cấp</Label>
                <Input value={editForm.decisionNumber} onChange={(e) => setEditForm({ ...editForm, decisionNumber: e.target.value })} placeholder="Số quyết định..." />
              </div>
              <div className="space-y-1.5">
                <Label>Người phụ trách</Label>
                <Input value={editForm.supervisor} onChange={(e) => setEditForm({ ...editForm, supervisor: e.target.value })} placeholder="Tên người phụ trách" />
              </div>
              <div className="space-y-1.5">
                <Label>Nơi in chứng chỉ</Label>
                <Input value={editForm.printLocation} onChange={(e) => setEditForm({ ...editForm, printLocation: e.target.value })} placeholder="Địa điểm in..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditStudentId(null)}>Hủy</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>Cập nhật</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
