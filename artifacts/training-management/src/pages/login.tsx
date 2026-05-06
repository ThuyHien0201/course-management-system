import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, BookOpen, Users, Award, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: BookOpen, label: "Quản lý khóa học & lớp học" },
  { icon: Users, label: "Theo dõi học viên & giảng viên" },
  { icon: Award, label: "Cấp chứng chỉ chuyên nghiệp" },
  { icon: ShieldCheck, label: "Kiểm duyệt QC toàn diện" },
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

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[500px] shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d4f85 0%, #0a3d6b 40%, #062d52 100%)" }}
      >
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(26,107,171,0.5) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full" style={{ background: "radial-gradient(circle, rgba(13,79,133,0.6) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)" }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Accent dots */}
          <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-blue-300/40" />
          <div className="absolute top-36 right-14 w-1.5 h-1.5 rounded-full bg-blue-200/30" />
          <div className="absolute bottom-32 left-16 w-2.5 h-2.5 rounded-full bg-blue-300/30" />
          <div className="absolute bottom-20 right-24 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10">
          <img src="/checkbee-logo.png" alt="Checkee" className="h-16 w-auto" />
        </div>

        {/* Middle: Headline + Features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
              Hệ thống Quản lý<br />Đào tạo Nội bộ
            </h1>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              Nền tảng số hóa toàn bộ quy trình đào tạo — từ khóa học đến cấp chứng chỉ.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                  <Icon className="h-4 w-4 text-blue-200" />
                </div>
                <span className="text-sm text-blue-100/90">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <p className="text-blue-300/60 text-xs">© 2025 Checkee · Giải pháp Truy xuất nguồn gốc</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16 bg-slate-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <img src="/checkbee-logo.png" alt="Checkee" className="h-10 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng nhập</h2>
            <p className="text-sm text-slate-500 mt-1.5">Nhập thông tin tài khoản để tiếp tục</p>
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
              className="w-full h-11 text-white font-semibold rounded-lg text-sm shadow-md hover:shadow-lg transition-all mt-2"
              style={{ background: "linear-gradient(90deg, #1a6bab 0%, #0d4f85 100%)" }}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            © 2025 Checkee · Giải pháp Truy xuất nguồn gốc
          </p>
        </div>
      </div>
    </div>
  );
}
