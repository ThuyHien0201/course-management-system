import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Eye, EyeOff, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "admin", label: "Quản trị viên", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { username: "qc", password: "qc123", role: "qc", label: "QC", color: "bg-green-100 text-green-700 border-green-200" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Vui lòng nhập đầy đủ thông tin", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      toast({
        title: "Đăng nhập thất bại",
        description: err instanceof Error ? err.message : "Vui lòng kiểm tra lại thông tin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Award className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hệ thống Quản lý Đào tạo</h1>
          <p className="text-muted-foreground text-sm">Đăng nhập để tiếp tục</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-10"
                    type={showPass ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tài khoản demo — nhấn để điền tự động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                onClick={() => fillDemo(acc)}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium">{acc.username} / {acc.password}</p>
                  <p className="text-xs text-muted-foreground">
                    {acc.role === "admin" ? "Truy cập đầy đủ tất cả module" :
                     "Chỉ truy cập module Quản lý chất lượng"}
                  </p>
                </div>
                <Badge className={acc.color}>{acc.label}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
