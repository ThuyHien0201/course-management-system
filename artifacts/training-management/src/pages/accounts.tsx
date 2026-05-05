import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserCog, Plus, Pencil, Trash2, Eye, EyeOff, Crown, Shield, Award, Users, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ROLE_CONFIG: Record<string, { label: string; description: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Quản trị viên", description: "Toàn quyền hệ thống", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Crown },
  staff: { label: "Nhân viên", description: "Tạo, chỉnh sửa, xem chứng chỉ", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Users },
  issuer: { label: "Cấp chứng chỉ", description: "Cấp chứng chỉ chính thức", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Award },
  qc: { label: "Kiểm soát chất lượng", description: "Phê duyệt QC", color: "bg-green-100 text-green-700 border-green-200", icon: Shield },
};

interface UserRecord {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

type UserForm = { username: string; displayName: string; password: string; role: string };
const emptyForm: UserForm = { username: "", displayName: "", password: "", role: "staff" };

function useUsersApi() {
  const { token } = useAuth();
  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const list = useCallback(async (): Promise<UserRecord[]> => {
    const res = await fetch(`${BASE}/api/users`, { headers: headers() });
    if (!res.ok) throw new Error("Không thể tải danh sách tài khoản");
    return res.json();
  }, [headers]);

  const create = useCallback(async (data: UserForm): Promise<UserRecord> => {
    const res = await fetch(`${BASE}/api/users`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Tạo tài khoản thất bại");
    return json;
  }, [headers]);

  const update = useCallback(async ({ id, data }: { id: number; data: Partial<UserForm> }): Promise<UserRecord> => {
    const res = await fetch(`${BASE}/api/users/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Cập nhật thất bại");
    return json;
  }, [headers]);

  const remove = useCallback(async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/api/users/${id}`, { method: "DELETE", headers: headers() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Xóa thất bại");
  }, [headers]);

  return { list, create, update, remove };
}

export default function AccountsPage() {
  const { user: currentUser, token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const api = useUsersApi();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editForm, setEditForm] = useState<{ displayName: string; role: string; password: string }>({ displayName: "", role: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: api.list,
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => { toast({ title: "Tạo tài khoản thành công" }); setCreateOpen(false); setForm(emptyForm); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: api.update,
    onSuccess: () => { toast({ title: "Cập nhật thành công" }); setEditUser(null); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.remove,
    onSuccess: () => { toast({ title: "Đã xóa tài khoản" }); setDeleteUser(null); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setEditForm({ displayName: u.displayName, role: u.role, password: "" });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản lý tài khoản</h1>
              <p className="text-muted-foreground mt-1">Tạo và phân quyền tài khoản người dùng</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Làm mới
            </Button>
            <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Tạo tài khoản
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">Đang tải...</div>
          ) : users.map((u) => {
            const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.staff;
            const Icon = cfg.icon;
            const isSelf = currentUser?.id === u.id;
            return (
              <Card key={u.id} className={`border shadow-sm ${isSelf ? "ring-2 ring-primary/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.color.split(" ")[0]}`}>
                      <Icon className={`h-5 w-5 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CardTitle className="text-base truncate">{u.displayName}</CardTitle>
                        {isSelf && <span className="text-xs text-primary font-medium">(bạn)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">@{u.username}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!isSelf && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Badge className={`mt-2 text-xs w-fit ${cfg.color}`}>{cfg.label}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập <span className="text-destructive">*</span></Label>
                <Input placeholder="VD: nhanvien01" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label>Họ tên hiển thị <span className="text-destructive">*</span></Label>
                <Input placeholder="VD: Nguyễn Văn A" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vai trò <span className="text-destructive">*</span></Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="font-medium">{cfg.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">— {cfg.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa tài khoản: <span className="font-mono text-primary">@{editUser?.username}</span></DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Họ tên hiển thị <span className="text-destructive">*</span></Label>
                <Input value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vai trò <span className="text-destructive">*</span></Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="font-medium">{cfg.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">— {cfg.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Đặt lại mật khẩu <span className="text-muted-foreground text-xs">(để trống nếu không đổi)</span></Label>
                <div className="relative">
                  <Input
                    type={showEditPass ? "text" : "password"}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowEditPass(!showEditPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showEditPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
              <Button onClick={() => editUser && updateMutation.mutate({ id: editUser.id, data: editForm })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa tài khoản <span className="font-mono font-semibold">@{deleteUser?.username}</span>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa tài khoản
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
