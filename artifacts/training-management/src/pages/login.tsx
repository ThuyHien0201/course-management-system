import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, Eye, EyeOff, Lock, User, Crown, Users, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEMO_ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    label: "Quản trị viên",
    desc: "Toàn quyền tất cả module",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    iconColor: "text-purple-600",
    Icon: Crown,
  },
  {
    username: "staff",
    password: "staff123",
    label: "Nhân viên",
    desc: "Quản lý khóa học, lớp, học viên, giảng viên, xem chứng chỉ",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
    Icon: Users,
  },
  {
    username: "issuer",
    password: "issuer123",
    label: "Cấp chứng chỉ",
    desc: "Cấp & quản lý chứng chỉ (sau khi QC duyệt kết quả)",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    iconColor: "text-amber-600",
    Icon: Award,
  },
  {
    username: "qc",
    password: "qc123",
    label: "Kiểm soát chất lượng",
    desc: "Phê duyệt toàn bộ nội dung trước khi sử dụng",
    color: "bg-green-100 text-green-700 border-green-200",
    iconColor: "text-green-600",
    Icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

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
    setActiveDemo(acc.username);
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
          <div className="grid grid-cols-2 gap-3 max-w-[280px]">
            {[
              { label: "Khóa học", value: "7" },
              { label: "Học viên", value: "17" },
              { label: "Chứng chỉ", value: "16" },
              { label: "Giảng viên", value: "5" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur">
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
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
                      onChange={(e) => { setUsername(e.target.value); setActiveDemo(null); }}
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
                      onChange={(e) => { setPassword(e.target.value); setActiveDemo(null); }}
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

          {/* Demo accounts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
              Tài khoản demo — nhấn để điền tự động
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.Icon;
                const isActive = activeDemo === acc.username;
                return (
                  <button
                    key={acc.username}
                    onClick={() => fillDemo(acc)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? "border-[#0047AB] bg-[#0047AB]/5 ring-1 ring-[#0047AB]/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-[#0047AB]/10" : "bg-slate-100"
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-[#0047AB]" : acc.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700 font-mono">{acc.username}</span>
                        <span className="text-xs text-slate-400">/</span>
                        <span className="text-xs text-slate-500 font-mono">{acc.password}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight truncate">{acc.desc}</p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${acc.color}`}>{acc.label}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
