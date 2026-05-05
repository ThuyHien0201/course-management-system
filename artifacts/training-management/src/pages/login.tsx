import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Eye, EyeOff, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[420px] bg-[#0047AB] flex-col items-center justify-center p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-12 left-8 w-40 h-40 rounded-full border-2 border-white" />
          <div className="absolute top-32 right-4 w-24 h-24 rounded-full border border-white" />
          <div className="absolute bottom-20 left-16 w-32 h-32 rounded-full border-2 border-white" />
          <div className="absolute bottom-8 right-12 w-20 h-20 rounded-full border border-white" />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur shadow-xl">
            <Award className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-white font-bold text-2xl leading-tight">Hệ thống Quản lý<br />Đào tạo Nội bộ</h1>
            <p className="text-blue-200 text-sm leading-relaxed max-w-[260px]">
              Quản lý toàn diện khóa học, học viên, giảng viên và cấp chứng chỉ chuyên nghiệp
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - login */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0047AB] shadow-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Hệ thống Quản lý Đào tạo</h1>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-xl font-bold text-slate-800">Đăng nhập</h2>
              <p className="text-sm text-slate-500 mt-0.5">Nhập thông tin tài khoản để tiếp tục</p>
            </div>
            <div className="px-6 pb-6 pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm font-medium">Tên đăng nhập</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 h-10 border-slate-200 focus:border-[#0047AB] focus:ring-[#0047AB]/20"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-sm font-medium">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 pr-10 h-10 border-slate-200 focus:border-[#0047AB] focus:ring-[#0047AB]/20"
                      type={showPass ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 bg-[#0047AB] hover:bg-[#0047AB]/90 text-white font-medium rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
