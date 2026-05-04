import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Shield, Award, Users } from "lucide-react";

const ACCOUNTS = [
  {
    username: "nhanvien",
    displayName: "Nguyễn Thị Nhân Viên",
    role: "staff",
    roleLabel: "Nhân viên (Staff)",
    password: "demo123",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Users,
    permissions: [
      "Tạo, chỉnh sửa, xóa Khóa học",
      "Tạo, chỉnh sửa, xóa Lớp học",
      "Tạo, chỉnh sửa, xóa Học viên",
      "Tạo, chỉnh sửa, xóa Giảng viên",
      "Thêm, chỉnh sửa Buổi học",
      "Nhập điểm & xếp loại học viên",
      "Xem và xem trước trang Chứng chỉ",
    ],
    restricted: [
      "Không thể cấp chứng chỉ chính thức",
      "Không thể truy cập trang QC",
      "Không thể duyệt/từ chối hồ sơ",
    ],
  },
  {
    username: "capchungchi",
    displayName: "Trần Văn Cấp CC",
    role: "issuer",
    roleLabel: "Cấp chứng chỉ (Issuer)",
    password: "issuer123",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Award,
    permissions: [
      "Xem toàn bộ danh sách lớp học, học viên",
      "Cấp chứng chỉ cho học viên đủ điều kiện",
      "Cập nhật thông tin chứng chỉ đã cấp",
    ],
    restricted: [
      "Không thể tạo/xóa khóa học, lớp học, học viên, giảng viên",
      "Không thể truy cập trang QC",
    ],
  },
  {
    username: "qc",
    displayName: "Lê Thị QC",
    role: "qc",
    roleLabel: "Kiểm soát chất lượng (QC)",
    password: "qc123",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Shield,
    permissions: [
      "Xem toàn bộ dữ liệu hệ thống",
      "Phê duyệt / Từ chối Khóa học",
      "Phê duyệt / Từ chối Lớp học",
      "Phê duyệt / Từ chối Học viên & Kết quả học tập",
      "Phê duyệt / Từ chối Giảng viên",
      "Phê duyệt / Từ chối Buổi học",
      "Phê duyệt / Từ chối Chứng chỉ đã cấp",
      "Xem lịch sử phê duyệt",
      "Quản lý tài khoản (xem danh sách)",
    ],
    restricted: [
      "Không thể tạo/xóa dữ liệu",
      "Không thể cấp chứng chỉ",
    ],
  },
];

export default function AccountsPage() {
  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản lý tài khoản</h1>
            <p className="text-muted-foreground mt-1">Danh sách tài khoản demo và phân quyền hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <Card key={acc.username} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${acc.color.replace("text-", "text-").split(" ")[0]}`}>
                      <Icon className={`h-5 w-5 ${acc.color.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{acc.displayName}</CardTitle>
                      <Badge className={`mt-1 text-xs ${acc.color}`}>{acc.roleLabel}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Thông tin đăng nhập</p>
                    <p className="text-sm"><span className="text-muted-foreground">Tài khoản:</span> <span className="font-mono font-medium">{acc.username}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Mật khẩu:</span> <span className="font-mono font-medium">{acc.password}</span></p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-green-700">Quyền hạn</p>
                    <ul className="space-y-1">
                      {acc.permissions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {acc.restricted.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-red-600">Hạn chế</p>
                      <ul className="space-y-1">
                        {acc.restricted.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-red-400 mt-0.5">✗</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
