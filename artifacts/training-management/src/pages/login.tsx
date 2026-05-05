import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User } from "lucide-react";
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
    <div className="min-h-screen flex bg-white">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] flex-col items-center justify-center p-14 relative overflow-hidden shrink-0" style={{ background: "linear-gradient(145deg, #1a6bab 0%, #0d4f85 60%, #083b66 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 border-2 border-white" />
          <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full opacity-[0.07] border border-white" />
          <div className="absolute -bottom-20 right-10 w-56 h-56 rounded-full opacity-10 border-2 border-white" />
          <div className="absolute bottom-1/4 -right-10 w-36 h-36 rounded-full opacity-[0.06] border border-white" />
          {/* Orange accent blob */}
          <div className="absolute top-16 right-16 w-14 h-14 rounded-full opacity-30" style={{ background: "#e8622a" }} />
          <div className="absolute bottom-24 left-12 w-8 h-8 rounded-full opacity-20" style={{ background: "#e8622a" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-[340px]">
          {/* Logo */}
          <div className="bg-white rounded-2xl shadow-2xl px-6 py-4">
            <img src="/checkbee-logo.png" alt="Checkbee" className="h-14 w-auto" />
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <h1 className="text-white font-bold text-2xl leading-tight tracking-tight">
              Hệ thống Quản lý<br />Đào tạo Nội bộ
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed">
              Quản lý toàn diện khóa học, học viên,<br />giảng viên và cấp chứng chỉ chuyên nghiệp
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs uppercase tracking-widest">Checkbee</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <p className="text-blue-300/80 text-xs italic">Giải pháp Truy xuất nguồn gốc</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16 bg-slate-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center space-y-2">
          <img src="/checkbee-logo.png" alt="Checkbee" className="h-10 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng nhập</h2>
            <p className="text-sm text-slate-500 mt-1">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-sm font-medium">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 h-11 border-slate-200 bg-white focus:border-[#1a6bab] focus:ring-[#1a6bab]/20 rounded-lg text-sm"
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 pr-11 h-11 border-slate-200 bg-white focus:border-[#1a6bab] focus:ring-[#1a6bab]/20 rounded-lg text-sm"
                  type={showPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold rounded-lg text-sm shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(90deg, #1a6bab 0%, #0d4f85 100%)" }}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2025 Checkbee · Giải pháp Truy xuất nguồn gốc
          </p>
        </div>
      </div>
    </div>
  );
}
