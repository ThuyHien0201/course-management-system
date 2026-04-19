import { AppLayout } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Library, Users, GraduationCap, Calendar, Users as UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  const stats = [
    { title: "Tổng Khóa Học", value: summary?.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Tổng Lớp Học", value: summary?.totalClasses, icon: Library, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Tổng Học Viên", value: summary?.totalStudents, icon: Users, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Tổng Giảng Viên", value: summary?.totalInstructors, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tổng Quan</h1>
          <p className="text-muted-foreground mt-1">Hệ thống Quản lý Đào tạo Nội bộ</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover-elevate transition-all duration-200">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-foreground">{stat.value || 0}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Lớp học gần đây</CardTitle>
              <CardDescription>Các lớp học được tạo gần nhất trong hệ thống.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : summary?.recentClasses?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có lớp học nào</div>
              ) : (
                <div className="space-y-4">
                  {summary?.recentClasses?.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Library className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{cls.name}</h4>
                          <p className="text-sm text-muted-foreground">{cls.courseName}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" /> Thời gian</p>
                          <p className="text-sm font-medium">{format(new Date(cls.startDate), "dd/MM/yyyy")} - {format(new Date(cls.endDate), "dd/MM/yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end"><UsersIcon className="h-3 w-3" /> Học viên</p>
                          <p className="text-sm font-medium">{cls.studentCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
