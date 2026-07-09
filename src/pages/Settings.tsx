import { useState, useRef } from 'react';
import { Download, Upload, Trash2, HardDrive, RefreshCw, Link, Copy, Check, Smartphone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useData } from '@/hooks/useData';
import { getCacheAgeString, clearCache } from '@/lib/db-cache';

const LOCAL_UID_KEY = 'fintrack_local_uid';

function getDeviceUUID(): string {
  return localStorage.getItem(LOCAL_UID_KEY) ?? '';
}

export default function Settings() {
  const ctx = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkUuid, setLinkUuid] = useState('');
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const deviceUuid = getDeviceUUID();

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(deviceUuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const ta = document.createElement('textarea');
      ta.value = deviceUuid;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkDevice = () => {
    if (!linkUuid.trim()) return;
    const uuid = linkUuid.trim();
    // Validate UUID format (simple check)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      setLinkMsg('❌ รหัสอุปกรณ์ไม่ถูกต้อง');
      return;
    }
    // Save the new UUID and clear cache
    localStorage.setItem(LOCAL_UID_KEY, uuid);
    clearCache();
    setLinkMsg('✅ เชื่อมต่ออุปกรณ์แล้ว! กำลังโหลดข้อมูลใหม่...');
    setTimeout(() => window.location.reload(), 1500);
  };

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

        {/* Device Link — ซิงค์ข้อมูลข้ามเครื่อง */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Smartphone size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">เชื่อมต่ออุปกรณ์ (Sync)</p>
              <p className="text-[11px] text-neutral-400">
                ใช้อุปกรณ์ร่วมกันโดยใช้รหัสเดียวกัน
              </p>
            </div>
          </div>

          {/* Current device ID */}
          <div className="bg-neutral-50 rounded-xl p-3 mb-3 border border-neutral-200">
            <p className="text-[11px] text-neutral-500 mb-1">รหัสอุปกรณ์นี้</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white px-2 py-1.5 rounded-lg border border-neutral-200 truncate select-all">
                {deviceUuid}
              </code>
              <button
                onClick={handleCopyUuid}
                className="shrink-0 w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                title="คัดลอกรหัส"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-neutral-500" />}
              </button>
            </div>
          </div>

          {/* Link another device */}
          {!showLinkInput ? (
            <Button size="sm" variant="secondary" icon={<Link size={14} />} onClick={() => setShowLinkInput(true)}>
              เชื่อมต่อกับอุปกรณ์อื่น
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">วางรหัสอุปกรณ์อีกเครื่องเพื่อเชื่อมต่อข้อมูล</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkUuid}
                  onChange={e => { setLinkUuid(e.target.value); setLinkMsg(null); }}
                  placeholder=" paste device UUID here"
                  className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-neutral-300 bg-white outline-none focus:border-blue-400 transition-colors"
                />
                <Button size="sm" variant="primary" onClick={handleLinkDevice}>
                  เชื่อมต่อ
                </Button>
              </div>
              {linkMsg && <p className="text-xs mt-1">{linkMsg}</p>}
              <button
                onClick={() => { setShowLinkInput(false); setLinkUuid(''); setLinkMsg(null); }}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </Card>

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
            <li>• ใช้ฟีเจอร์ "เชื่อมต่ออุปกรณ์" เพื่อแชร์ข้อมูลระหว่างเครื่อง!</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

