import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar, User } from "lucide-react";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type CompanyInfo = {
  companyName: string; slogan: string; description: string;
  address: string; logoUrl: string; qualityLogoUrl: string;
};

type Student = {
  studentId: number; studentCode: string; fullName: string;
  dateOfBirth?: string | null; courseName?: string | null;
  courseContent?: string | null; courseDuration?: string | null;
  issueDate?: string | null; expiryDate?: string | null;
  printLocation?: string | null; locationLink?: string | null;
  photoUrl?: string | null; courseCode?: string | null;
};

type ClassData = {
  name: string; courseName?: string | null;
  startDate?: string | null; endDate?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  classData: ClassData | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getYear(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).getFullYear().toString();
}

function genCertCode(classData: ClassData | null, issueDate?: string | null) {
  if (!classData) return "CC-000";
  const year = issueDate ? new Date(issueDate).getFullYear() : new Date().getFullYear();
  const slug = classData.name
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return `DT${year}-${slug}-001`;
}

export function CertificatePreview({ open, onClose, student, classData }: Props) {
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`${BASE}/api/company`)
      .then((r) => r.json())
      .then((d) => setCompany(d))
      .catch(() => {});
  }, [open]);

  if (!student || !classData) return null;

  const certCode = genCertCode(classData, student.issueDate);
  const companyName = company?.companyName || "Tên Doanh Nghiệp";
  const slogan = company?.slogan || "";
  const description = company?.description || "";
  const logoUrl = company?.logoUrl || "";
  const qualityLogoUrl = company?.qualityLogoUrl || "";
  const printLocation = student.printLocation || company?.address || "";
  const locationLink = student.locationLink || "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogDescription className="sr-only">Xem trước chứng chỉ</DialogDescription>

        {/* Blue header */}
        <div className="bg-[#0047AB] px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            {logoUrl ? (
              <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                <img src={logoUrl} alt="Logo công ty" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="h-8 w-8 text-white/60" />
              </div>
            )}
            {qualityLogoUrl ? (
              <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                <img src={qualityLogoUrl} alt="Logo chất lượng" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <span className="text-white text-xs font-bold text-center leading-tight">ISO</span>
              </div>
            )}
          </div>
          {slogan && (
            <h2 className="text-white text-center font-semibold text-base mt-4 leading-snug">
              "{slogan}"
            </h2>
          )}
          {description && (
            <p className="text-white/80 text-center text-xs mt-2 leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-white">

          {/* Course intro */}
          {(student.courseContent || student.courseName) && (
            <div className="border border-[#0047AB]/20 rounded-lg p-4 bg-[#0047AB]/[0.03]">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 mt-0.5 shrink-0 text-[#0047AB]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {student.courseContent || `Khóa học ${student.courseName} cung cấp kiến thức và kỹ năng chuyên môn cần thiết theo tiêu chuẩn.`}
                </p>
              </div>
            </div>
          )}

          {/* KẾT QUẢ TRUY XUẤT */}
          <div className="text-center space-y-1">
            <p className="text-[#0047AB] font-bold text-sm tracking-widest">⊙ KẾT QUẢ TRUY XUẤT</p>
            <p className="text-gray-700 font-semibold text-xs tracking-wide">THÔNG TIN KHÓA ĐÀO TẠO</p>
          </div>

          {/* Cert code */}
          <div className="text-center">
            <span className="text-[#0047AB] font-bold text-sm">{certCode}</span>
          </div>

          {/* Course name box */}
          <div className="bg-[#0047AB] rounded-lg px-5 py-3 text-center">
            <p className="text-white font-bold text-sm leading-snug">
              {classData.courseName || student.courseName || "Tên khóa học"}
            </p>
          </div>

          {/* Validity */}
          {student.expiryDate && (
            <div className="flex justify-center">
              <Badge className="bg-[#0047AB]/10 text-[#0047AB] border border-[#0047AB]/20 gap-1.5 px-3 py-1">
                <Clock className="h-3 w-3" />
                Hiệu lực: {formatDate(student.expiryDate)}
              </Badge>
            </div>
          )}

          {/* Student info */}
          <div className="border-l-4 border-[#0047AB] pl-4">
            <p className="text-[#0047AB] font-bold text-xs uppercase tracking-wide mb-3">Thông tin học viên</p>
            <div className="flex gap-4 items-start">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Ảnh thẻ"
                  className="h-20 w-16 object-cover rounded border border-gray-200 shrink-0"
                />
              ) : (
                <div className="h-20 w-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-gray-300" />
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 text-xs w-28 shrink-0">Mã học viên:</span>
                  <span className="font-semibold text-xs">{student.studentCode}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 text-xs w-28 shrink-0">Họ và tên:</span>
                  <span className="font-semibold text-xs">{student.fullName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 text-xs w-28 shrink-0">Năm sinh:</span>
                  <span className="font-semibold text-xs">{student.dateOfBirth ? getYear(student.dateOfBirth) : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course schedule */}
          <div className="border-l-4 border-[#0047AB] pl-4 space-y-2">
            <p className="text-[#0047AB] font-bold text-xs uppercase tracking-wide">Thông tin khóa học</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#0047AB] shrink-0" />
                <span className="text-xs text-gray-500">Thời gian:</span>
                <span className="text-xs font-medium">
                  {classData.startDate && classData.endDate
                    ? `${formatDate(classData.startDate)} - ${formatDate(classData.endDate)}`
                    : "—"}
                </span>
              </div>
              {student.courseDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#0047AB] shrink-0" />
                  <span className="text-xs text-gray-500">Thời lượng:</span>
                  <span className="text-xs font-medium">{student.courseDuration}</span>
                </div>
              )}
              {printLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#0047AB] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Địa điểm: </span>
                    <span className="text-xs font-medium">{printLocation}</span>
                    {locationLink && (
                      <a
                        href={locationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs text-[#0047AB] underline"
                      >
                        📍 Xem trên bản đồ
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">{companyName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
