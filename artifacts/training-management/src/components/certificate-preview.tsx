import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Clock, MapPin, Calendar, User } from "lucide-react";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type CompanyInfo = {
  companyName: string; slogan: string; description: string;
  address: string; contact: string; logoUrl: string; qualityLogoUrl: string;
};

type Student = {
  studentId: number; studentCode: string; fullName: string;
  dateOfBirth?: string | null; courseName?: string | null;
  courseContent?: string | null; courseDuration?: string | null;
  issueDate?: string | null; expiryDate?: string | null;
  printLocation?: string | null; locationLink?: string | null;
  photoUrl?: string | null;
};

type ClassData = {
  name: string; courseName?: string | null;
  startDate?: string | null; endDate?: string | null;
  duration?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  classData: ClassData | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getYear(d?: string | null) {
  if (!d) return "";
  const y = new Date(d).getFullYear();
  return isNaN(y) ? "" : String(y);
}

function genCode(classData: ClassData | null) {
  if (!classData) return "DT----";
  const year = new Date().getFullYear();
  const slug = classData.name
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "CC";
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

  const certCode = genCode(classData);
  const logo = company?.logoUrl || "";
  const qLogo = company?.qualityLogoUrl || "";
  const slogan = company?.slogan || "";
  const desc = company?.description || "";
  const companyName = company?.companyName || "";
  const companyAddr = student.printLocation || company?.address || "";
  const locationLink = student.locationLink || "";
  const courseName = classData.courseName || student.courseName || "";
  const courseContent = student.courseContent || (courseName ? `Khóa học ${courseName} trang bị kiến thức và kỹ năng chuyên môn cần thiết theo tiêu chuẩn quốc tế.` : "");

  const dateRange =
    classData.startDate && classData.endDate
      ? `${fmtDate(classData.startDate)} – ${fmtDate(classData.endDate)}`
      : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">Xem trước chứng chỉ</DialogTitle>
        <DialogDescription className="sr-only">Xem trước chứng chỉ</DialogDescription>

        {/* ── HEADER ── */}
        <div className="bg-[#0047AB] px-6 py-5">
          {/* Logos */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[72px] w-[72px] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 shadow">
              {logo
                ? <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                : <span className="text-[#0047AB] font-black text-lg leading-none text-center">LOGO</span>
              }
            </div>
            <div className="h-[72px] w-[72px] bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 shadow">
              {qLogo
                ? <img src={qLogo} alt="Chất lượng" className="h-full w-full object-contain" />
                : <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="w-8 h-8 rounded-full border-2 border-[#0047AB] flex items-center justify-center">
                      <span className="text-[#0047AB] font-black text-[9px] leading-none text-center">ISO{"\n"}9001</span>
                    </div>
                  </div>
              }
            </div>
          </div>

          {/* Slogan */}
          {slogan && (
            <h2 className="text-white font-bold text-center text-sm leading-snug">
              "{slogan}"
            </h2>
          )}

          {/* Description */}
          {desc && (
            <p className="text-white/80 text-center text-xs mt-2 leading-relaxed">
              {desc}
            </p>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="bg-white px-6 py-5 space-y-4">

          {/* Course intro box */}
          {courseContent && (
            <div className="rounded-xl border border-[#0047AB]/20 bg-[#0047AB]/[0.04] px-4 py-3">
              <div className="flex gap-2.5 items-start">
                <div className="shrink-0 mt-0.5 text-[#0047AB]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{courseContent}</p>
              </div>
            </div>
          )}

          {/* KẾT QUẢ TRUY XUẤT */}
          <div className="text-center space-y-0.5 pt-1">
            <p className="text-[#0047AB] font-bold text-sm tracking-widest flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              KẾT QUẢ TRUY XUẤT
            </p>
            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-widest">Thông tin khóa đào tạo</p>
          </div>

          {/* Cert code */}
          <p className="text-center text-[#0047AB] font-bold text-base">{certCode}</p>

          {/* Course name */}
          <div className="bg-[#0047AB] rounded-xl px-4 py-3 text-center">
            <p className="text-white font-bold text-sm leading-snug">
              {courseName || <span className="opacity-50 italic text-xs">Tên khóa học</span>}
            </p>
          </div>

          {/* Validity */}
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 border border-[#0047AB]/30 rounded-full px-3 py-1 text-xs text-[#0047AB]">
              <Clock className="h-3 w-3" />
              Hiệu lực:{" "}
              <span className="font-semibold">
                {student.expiryDate ? fmtDate(student.expiryDate) : <span className="italic opacity-50">chưa có</span>}
              </span>
            </div>
          </div>

          {/* Student info */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 bg-[#0047AB] rounded-full" />
              <p className="text-[#0047AB] font-bold text-xs uppercase tracking-wide">Thông tin học viên</p>
            </div>
            <div className="flex gap-3 items-start">
              {/* Photo */}
              <div className="shrink-0 h-24 w-[72px] rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                {student.photoUrl
                  ? <img src={student.photoUrl} alt="Ảnh" className="h-full w-full object-cover" />
                  : <div className="flex flex-col items-center gap-0.5">
                      <User className="h-7 w-7 text-gray-300" />
                      <span className="text-[9px] text-gray-300">Ảnh thẻ</span>
                    </div>
                }
              </div>
              {/* Fields */}
              <div className="flex-1 space-y-2 text-xs">
                <InfoRow label="Mã học viên" value={student.studentCode} />
                <InfoRow label="Họ và tên" value={student.fullName} />
                <InfoRow label="Năm sinh" value={getYear(student.dateOfBirth)} />
              </div>
            </div>
          </div>

          {/* Course schedule */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 bg-[#0047AB] rounded-full" />
              <p className="text-[#0047AB] font-bold text-xs uppercase tracking-wide">Thông tin khóa học</p>
            </div>
            <div className="space-y-1.5 text-xs pl-3">
              <ScheduleRow icon={<Calendar className="h-3 w-3" />} label="Thời gian" value={dateRange} />
              {(student.courseDuration || classData.duration) && (
                <ScheduleRow icon={<Clock className="h-3 w-3" />} label="Thời lượng" value={student.courseDuration || classData.duration || ""} />
              )}
              {companyAddr && (
                <ScheduleRow
                  icon={<MapPin className="h-3 w-3" />}
                  label="Địa điểm"
                  value={
                    <span>
                      {companyAddr}
                      {locationLink && (
                        <a href={locationLink} target="_blank" rel="noreferrer" className="ml-1.5 text-[#0047AB] underline">
                          📍 Xem bản đồ
                        </a>
                      )}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          {/* Footer */}
          {companyName && (
            <div className="pt-3 border-t border-gray-100 text-center">
              <p className="text-xs font-medium text-gray-400">{companyName}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className="font-semibold text-gray-800">{value || <span className="italic text-gray-300">—</span>}</span>
    </div>
  );
}

function ScheduleRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[#0047AB] mt-0.5 shrink-0">{icon}</span>
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className="font-medium text-gray-700">{value || <span className="italic text-gray-300">—</span>}</span>
    </div>
  );
}
