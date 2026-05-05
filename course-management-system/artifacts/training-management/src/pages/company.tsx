import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Save, ImageIcon } from "lucide-react";

type CompanyInfo = {
  companyName: string; slogan: string; description: string;
  address: string; contact: string; email: string;
  website: string; taxId: string; logoUrl: string; qualityLogoUrl: string;
};

const empty: CompanyInfo = {
  companyName: "", slogan: "", description: "", address: "",
  contact: "", email: "", website: "", taxId: "", logoUrl: "", qualityLogoUrl: "",
};

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 shrink-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => ref.current?.click()}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
          )}
        </div>
        <div className="space-y-1.5 flex-1">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => ref.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Tải ảnh lên
          </Button>
          <p className="text-xs text-muted-foreground">Hoặc dán URL ảnh bên dưới</p>
          <Input
            placeholder="https://..."
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

export default function CompanyPage() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [form, setForm] = useState<CompanyInfo>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/company`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          companyName: data.companyName ?? "",
          slogan: data.slogan ?? "",
          description: data.description ?? "",
          address: data.address ?? "",
          contact: data.contact ?? "",
          email: data.email ?? "",
          website: data.website ?? "",
          taxId: data.taxId ?? "",
          logoUrl: data.logoUrl ?? "",
          qualityLogoUrl: data.qualityLogoUrl ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof CompanyInfo) => (val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setFromEvent = (key: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/company`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Lưu thông tin doanh nghiệp thành công" });
    } catch {
      toast({ title: "Có lỗi khi lưu", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">Đang tải...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Thông tin doanh nghiệp
            </h1>
            <p className="text-muted-foreground mt-1">Thông tin hiển thị trên chứng chỉ và hệ thống</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ImageUpload label="Logo công ty" value={form.logoUrl} onChange={set("logoUrl")} />
            <ImageUpload label="Logo chất lượng (ISO/tiêu chuẩn)" value={form.qualityLogoUrl} onChange={set("qualityLogoUrl")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên doanh nghiệp</Label>
              <Input placeholder="VD: Công ty TNHH HungAnhSciTek" value={form.companyName} onChange={setFromEvent("companyName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Slogan</Label>
              <Input placeholder="VD: Giải pháp phù hợp – Hiệu quả tối ưu" value={form.slogan} onChange={setFromEvent("slogan")} />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả ngắn về doanh nghiệp..."
                value={form.description}
                onChange={setFromEvent("description")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin liên hệ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Địa chỉ doanh nghiệp</Label>
              <Input placeholder="VD: 207A Nguyễn Văn Thủ, Quận 1, TP.HCM" value={form.address} onChange={setFromEvent("address")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Số điện thoại liên hệ</Label>
                <Input placeholder="VD: 0989 23 23 84" value={form.contact} onChange={setFromEvent("contact")} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="info@company.com" value={form.email} onChange={setFromEvent("email")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input placeholder="https://company.com" value={form.website} onChange={setFromEvent("website")} />
              </div>
              <div className="space-y-1.5">
                <Label>Mã số thuế</Label>
                <Input placeholder="VD: 0123456789" value={form.taxId} onChange={setFromEvent("taxId")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
