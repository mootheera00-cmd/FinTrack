import { useState, useRef } from 'react';
import { Download, Upload, Trash2, HardDrive, RefreshCw, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useData } from '@/hooks/useData';
import { getCacheAgeString } from '@/lib/db-cache';

export default function Settings() {
  const ctx = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      await ctx.restore(file);
      setRestoreMsg('✅ นำเข้าข้อมูลสำเร็จ! ข้อมูลทั้งหมดถูกอัปเดตแล้ว');
    } catch (err: any) {
      setRestoreMsg(`❌ ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Header */}
        <h1 className="text-xl font-bold text-neutral-900">ตั้งค่า</h1>

        {/* Cache status */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <HardDrive size={18} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">ข้อมูลในเครื่อง (Preload)</p>
              <p className="text-[11px] text-neutral-400">
                อัปเดตล่าสุด: {getCacheAgeString()}
                {ctx.lastSyncTime && (
                  <span className="ml-1">
                    • {new Date(ctx.lastSyncTime).toLocaleTimeString('th-TH')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={ctx.refetchAll}>
              ดึงข้อมูลล่าสุด
            </Button>
            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => setShowConfirmClear(true)}>
              ล้างแคช
            </Button>
          </div>
        </Card>

        {/* Clear cache confirmation */}
        {showConfirmClear && (
          <Card className="!border-neutral-300 !bg-neutral-50">
            <p className="text-sm text-neutral-700 mb-3">ต้องการล้างข้อมูลแคชในเครื่อง? ข้อมูลจะโหลดจาก Supabase ใหม่</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => { ctx.clearLocalCache(); setShowConfirmClear(false); }}>
                ยืนยันล้างแคช
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowConfirmClear(false)}>
                ยกเลิก
              </Button>
            </div>
          </Card>
        )}

        {/* Backup */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Download size={18} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">สำรองข้อมูล (Backup)</p>
              <p className="text-[11px] text-neutral-400">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
            </div>
          </div>
          <Button size="sm" variant="primary" icon={<Download size={14} />} onClick={ctx.backup}>
            ดาวน์โหลด Backup
          </Button>
        </Card>

        {/* Restore */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Upload size={18} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">กู้คืนข้อมูล (Restore)</p>
              <p className="text-[11px] text-neutral-400">นำเข้าข้อมูลจากไฟล์ Backup</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestore}
          />
          <Button
            size="sm"
            variant="secondary"
            icon={<Upload size={14} />}
            loading={restoring}
            onClick={() => fileInputRef.current?.click()}
          >
            {restoring ? 'กำลังนำเข้า...' : 'เลือกไฟล์เพื่อกู้คืน'}
          </Button>
          {restoreMsg && (
            <p className="text-xs text-neutral-600 mt-2">{restoreMsg}</p>
          )}
        </Card>

        {/* Tips */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">💡 เคล็ดลับ</p>
          <ul className="text-xs text-neutral-600 space-y-1.5 leading-relaxed">
            <li>• ข้อมูล Preload จะถูกบันทึกอัตโนมัติทุกครั้งที่ซิงค์กับ Supabase</li>
            <li>• ครั้งถัดไปที่เปิดแอป ข้อมูลจะแสดงทันทีจากแคช</li>
            <li>• แนะนำสำรองข้อมูล (Backup) ก่อนล้างแคชหรืออัปเดตครั้งใหญ่</li>
            <li>• การกู้คืนจะนำเข้าข้อมูลทั้งหมด — อาจใช้เวลาสักครู่</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

