import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Award,
  Library,
  ShieldCheck,
  LogOut,
  UserCog,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700 border-purple-200" },
  staff: { label: "Nhân viên", color: "bg-blue-100 text-blue-700 border-blue-200" },
  issuer: { label: "Cấp chứng chỉ", color: "bg-amber-100 text-amber-700 border-amber-200" },
  qc: { label: "QC", color: "bg-green-100 text-green-700 border-green-200" },
};

type NavItem = { title: string; href: string; icon: React.ElementType; roles?: string[] };

const navItems: NavItem[] = [
  { title: "Tổng quan", href: "/", icon: LayoutDashboard, roles: ["admin", "staff", "issuer"] },
  { title: "Khóa học", href: "/khoa-hoc", icon: BookOpen, roles: ["admin", "staff"] },
  { title: "Lớp học", href: "/lop-hoc", icon: Library, roles: ["admin", "staff"] },
  { title: "Học viên", href: "/hoc-vien", icon: Users, roles: ["admin", "staff"] },
  { title: "Giảng viên", href: "/giang-vien", icon: GraduationCap, roles: ["admin", "staff"] },
  { title: "Cấp chứng chỉ", href: "/chung-chi", icon: Award, roles: ["admin", "issuer"] },
  { title: "Quản lý chất lượng", href: "/qc", icon: ShieldCheck, roles: ["admin", "qc"] },
  { title: "Thông tin doanh nghiệp", href: "/doanh-nghiep", icon: Building2, roles: ["admin"] },
  { title: "Quản lý tài khoản", href: "/tai-khoan", icon: UserCog, roles: ["admin", "qc"] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const roleInfo = user ? ROLE_LABELS[user.role] : null;

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <Award className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight leading-tight">Hệ thống Quản lý</h2>
              <p className="text-xs text-muted-foreground">Đào tạo Nội bộ</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Chính</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const isActive = location === item.href || 
                                  (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4 space-y-3">
          {user && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {user.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>
              {roleInfo && (
                <Badge className={`text-xs w-full justify-center ${roleInfo.color}`}>
                  {roleInfo.label}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
