import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Link,
  TableProperties,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  Clock,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Eye,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { createTBSheet, verifyAndInitSheets, findOrCreateTBSheet } from '../lib/sheetsApi';
import { googleSignIn } from '../lib/auth';

interface Props {
  accessToken?: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string | null;
  onConfigChange: (id: string, url: string, name: string) => void;
  onRefreshData: () => void;
  onPushAllData?: () => void;
  isLoading: boolean;
  onTokenUpdate?: (token: string) => void;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
  lastSyncTime?: Date | null;
  nextSyncCountdown?: number;
  isAutoSyncing?: boolean;
}

export const SheetConfigBanner: React.FC<Props> = ({
  accessToken,
  spreadsheetId,
  spreadsheetUrl,
  spreadsheetName,
  onConfigChange,
  onRefreshData,
  onPushAllData,
  isLoading,
  onTokenUpdate,
  isAutoSyncEnabled = true,
  onToggleAutoSync,
  lastSyncTime,
  nextSyncCountdown = 60,
  isAutoSyncing = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Stored state for collapsed/compact mode and hidden mode
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    return localStorage.getItem('tb_care_sheet_banner_compact') === 'true';
  });
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    return localStorage.getItem('tb_care_sheet_banner_hidden') === 'true';
  });

  const toggleCompact = (val: boolean) => {
    setIsCompact(val);
    localStorage.setItem('tb_care_sheet_banner_compact', val ? 'true' : 'false');
  };

  const toggleHidden = (val: boolean) => {
    setIsHidden(val);
    localStorage.setItem('tb_care_sheet_banner_hidden', val ? 'true' : 'false');
  };

  // Check if running inside an iframe (like AI Studio preview)
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const openAppInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleAutoConnect = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    try {
      let activeToken = accessToken;
      if (!activeToken) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            activeToken = authRes.accessToken;
            if (onTokenUpdate) {
              onTokenUpdate(authRes.accessToken);
            }
          }
        } catch (authErr: any) {
          if (authErr.message?.includes('POPUP_BLOCKED') || isInIframe) {
            throw new Error('เบราว์เซอร์บล็อกหน้าต่าง Pop-up สิทธิ์ Google กรุณากดปุ่ม "เปิดในแท็บใหม่" ด้านล่างนี้');
          }
          throw new Error('จำเป็นต้องอนุญาตสิทธิ์ Google เพื่อค้นหาหรือสร้าง Google Sheet');
        }
      }

      if (!activeToken) {
        throw new Error('ไม่พบสิทธิ์การเชื่อมต่อ Google OAuth (กรุณาลงชื่อเข้าใช้ Google)');
      }

      const res = await findOrCreateTBSheet(activeToken);
      onConfigChange(res.spreadsheetId, res.spreadsheetUrl, res.title);
      setSuccessMsg(res.isNew 
        ? '✨ สร้างและเชื่อมต่อ Google Sheet ใหม่เรียบร้อยแล้ว' 
        : `🔗 ค้นพบและเชื่อมต่อ Google Sheet ใน Google Drive ของคุณอัตโนมัติแล้ว (${res.title})`
      );
      setShowConfigModal(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheet อัตโนมัติ');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    try {
      let activeToken = accessToken;
      
      // If token is missing, attempt to sign in with Google to get an OAuth access token
      if (!activeToken) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            activeToken = authRes.accessToken;
            if (onTokenUpdate) {
              onTokenUpdate(authRes.accessToken);
            }
          }
        } catch (authErr: any) {
          if (authErr.message?.includes('POPUP_BLOCKED') || isInIframe) {
            throw new Error('เบราว์เซอร์บล็อกหน้าต่าง Pop-up เนื่องจากแสดงผลในกรอบพรีวิว กรุณากดปุ่ม "เปิดในแท็บใหม่" สีน้ำเงินด้านล่างนี้');
          }
          throw new Error('จำเป็นต้องอนุญาตสิทธิ์ผ่านบัญชี Google เพื่อสร้างไฟล์ Google Sheet ใน Google Drive ของคุณ');
        }
      }

      if (!activeToken) {
        throw new Error('ไม่พบสิทธิ์การเชื่อมต่อ Google OAuth (กรุณาลงชื่อเข้าใช้ Google เพื่อสร้างชีทใหม่)');
      }

      const res = await createTBSheet(activeToken);
      onConfigChange(res.spreadsheetId, res.spreadsheetUrl, res.title);
      setSuccessMsg('สร้าง Google Sheet ฐานข้อมูลสำเร็จ พร้อมโครงสร้างตารางผู้ป่วยและบันทึกอาการ');
      setShowConfigModal(false);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('invalid authentication credentials') || msg.includes('Expected OAuth 2')) {
        setErrorMsg('เกิดข้อผิดพลาดด้านสิทธิ์ (OAuth): กรุณาอนุญาตสิทธิ์เข้าถึง Google Drive หรือเลือก "เชื่อมโยง Sheet ที่มีอยู่แล้ว"');
      } else {
        setErrorMsg(msg || 'เกิดข้อผิดพลาดในการสร้าง Google Sheet');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLinkExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;

    // Extract sheet ID if full URL pasted
    let cleanId = customSheetId.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    setIsLinking(true);
    setErrorMsg(null);
    try {
      let activeToken = accessToken;
      if (!activeToken) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            activeToken = authRes.accessToken;
            if (onTokenUpdate) onTokenUpdate(authRes.accessToken);
          }
        } catch (e) {
          // continue attempting to link even if local
        }
      }

      if (activeToken) {
        await verifyAndInitSheets(activeToken, cleanId);
      }
      
      const url = `https://docs.google.com/spreadsheets/d/${cleanId}`;
      onConfigChange(cleanId, url, 'Google Sheet ที่เชื่อมโยงแล้ว');
      setSuccessMsg('เชื่อมโยง Google Sheet สำเร็จแล้ว');
      setShowConfigModal(false);
      setCustomSheetId('');
    } catch (err: any) {
      // Fallback: save anyway so user can proceed
      const url = `https://docs.google.com/spreadsheets/d/${cleanId}`;
      onConfigChange(cleanId, url, 'Google Sheet ที่เชื่อมโยงแล้ว');
      setShowConfigModal(false);
      setCustomSheetId('');
    } finally {
      setIsLinking(false);
    }
  };

  if (!spreadsheetId) {
    return (
      <div className="bg-emerald-900/10 border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 mb-6 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            ยังไม่ได้เชื่อมต่อ Google Sheet สำหรับเก็บข้อมูล
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            ระบบเก็บข้อมูลผู้ป่วยวัณโรคปอดจะบันทึกข้อมูลประวัติผู้ป่วย การทานยาประจำวัน (DOTS) และอาการไม่พึงประสงค์ลงบน Google Sheet บัญชีของคุณโดยตรงแบบเรียลไทม์
          </p>

          {isInIframe && (
            <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>กำลังใช้งานในหน้าจอพรีวิว:</strong> บราวเซอร์อาจบล็อก Pop-up ให้กดเปิดในแท็บแยกเพื่อยืนยันสิทธิ์ Google ได้ทันที
                </span>
              </div>
              <button
                onClick={openAppInNewTab}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex-shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>เปิดในแท็บใหม่</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={openAppInNewTab}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs flex-shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>เปิดในแท็บใหม่</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleAutoConnect}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              title="ระบบจะค้นหาชีทฐานข้อมูลเดิมใน Google Drive ของคุณ หรือสร้างชีทใหม่อัตโนมัติในคลิกเดียว"
            >
              <Sparkles className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} />
              {isCreating ? 'กำลังค้นหาและเชื่อมต่อ Google Sheet...' : '✨ เชื่อมต่อ Google Sheet อัตโนมัติ (1-Click)'}
            </button>
            <button
              onClick={handleCreateNewSheet}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              สร้างชีทใหม่
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl transition cursor-pointer"
            >
              <Link className="w-4 h-4 text-slate-500" />
              ระบุ Sheet ID เอง
            </button>
          </div>
        </div>

        {/* Modal for linking existing sheet */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-emerald-600" />
                เชื่อมโยง Google Sheet ของคุณ
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                คุณสามารถสร้าง Google Sheet ใหม่ หรือใช้ Sheet ที่มีอยู่แล้วได้ง่ายๆ
              </p>

              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <span>💡 วิธีที่ง่ายที่สุด (ทำได้ใน 3 ขั้นตอน):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 text-xs">
                  <li>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 underline inline-flex items-center gap-1 hover:text-emerald-900"
                    >
                      <span>คลิกที่นี่เพื่อเปิดสร้าง Google Sheet ใหม่ (sheets.new)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                  <li>คัดลอกลิงก์ (URL) จากแถบเบราว์เซอร์ของหน้า Sheet นั้น</li>
                  <li>นำลิงก์มาวางในช่องด้านล่าง แล้วกด "เชื่อมโยงชีท"</li>
                </ol>
              </div>

              <form onSubmit={handleLinkExistingSheet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วาง Google Sheet URL หรือ Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1a2b3c... หรือ 1a2b3c..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking || !customSheetId.trim()}
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isLinking ? 'กำลังบันทึก...' : 'เชื่อมโยงชีท'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 1. If user set to completely Hidden
  if (isHidden) {
    return (
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-3.5 py-2 mb-4 text-xs flex flex-wrap items-center justify-between gap-2.5 transition animate-in fade-in">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-950">Google Sheet เชื่อมต่อแล้ว:</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{spreadsheetName || 'TB Patient Database'}</span>
          {accessToken && isAutoSyncEnabled && (
            <span className="text-[10px] bg-white border border-emerald-200 text-teal-800 px-1.5 py-0.5 rounded font-mono font-bold">
              ⏱️ {isAutoSyncing ? 'กำลังบันทึก...' : `${nextSyncCountdown}s`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-emerald-100/70 transition"
            title="ดึงข้อมูลล่าสุดจาก Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {onPushAllData && (
            <button
              onClick={onPushAllData}
              disabled={isLoading}
              className="p-1.5 text-teal-800 hover:text-teal-950 rounded-lg hover:bg-teal-100/70 transition"
              title="ส่งข้อมูลขึ้น Sheet"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isLoading ? 'animate-bounce' : ''}`} />
            </button>
          )}

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-emerald-800 hover:text-emerald-950 rounded-lg hover:bg-emerald-100/70 transition"
              title="เปิด Google Sheet ในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => toggleHidden(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
            title="แสดงแถบเครื่องมือ Google Sheet"
          >
            <Eye className="w-3 h-3 text-emerald-600" />
            <span>แสดงแถบเต็ม</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. If user set to Compact Mode (One-line bar)
  if (isCompact) {
    return (
      <div className="bg-white border border-emerald-200/90 rounded-2xl px-4 py-2.5 mb-5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {spreadsheetName || 'TB Patient Database'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded hidden sm:inline">
              Connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {accessToken && onToggleAutoSync && (
            <button
              onClick={() => onToggleAutoSync(!isAutoSyncEnabled)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition"
              title={isAutoSyncEnabled ? 'ปิด Auto-Sync อัตโนมัติ' : 'เปิด Auto-Sync อัตโนมัติ'}
            >
              <Clock className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin text-teal-600' : isAutoSyncEnabled ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{isAutoSyncing ? 'กำลังบันทึก...' : `Auto-Sync: ${nextSyncCountdown}s`}</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition disabled:opacity-50 cursor-pointer"
            title="ดึงข้อมูลล่าสุดจาก Google Sheet"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>ดึงข้อมูล</span>
          </button>

          {onPushAllData && (
            <button
              onClick={onPushAllData}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-[11px] transition disabled:opacity-50 shadow-2xs cursor-pointer"
              title="ส่งข้อมูลทั้งหมดขึ้น Google Sheet"
            >
              <UploadCloud className={`w-3 h-3 ${isLoading ? 'animate-bounce' : ''}`} />
              <span>ส่งขึ้น Sheet</span>
            </button>
          )}

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium text-[11px] transition"
              title="เปิด Google Sheet"
            >
              <span>เปิด Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          <button
            onClick={() => toggleCompact(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="ขยายแถบเครื่องมือเต็ม"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleHidden(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="ซ่อนแถบด้านบนนี้"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Full Expanded Banner View
  return (
    <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              Google Sheet Connected
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">ฐานข้อมูลวัณโรคปอด</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 truncate max-w-md">
            {spreadsheetName || 'TB Patient Database'}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Token Status Badge / Reconnect */}
        {accessToken ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg" title="สิทธิ์การเข้าถึง Google Drive/Sheets สมบูรณ์">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>สิทธิ์บันทึกพร้อมใช้งาน</span>
          </span>
        ) : (
          <button
            onClick={async () => {
              try {
                const res = await googleSignIn();
                if (res?.accessToken && onTokenUpdate) {
                  onTokenUpdate(res.accessToken);
                }
              } catch (e: any) {
                console.error(e);
                if (isInIframe) {
                  openAppInNewTab();
                }
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition shadow-2xs animate-pulse cursor-pointer"
            title="กดเพื่อต่ออายุสิทธิ์ Google OAuth สำหรับเขียนข้อมูลลง Sheet"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>เชื่อมต่อสิทธิ์ Google เพื่อบันทึก</span>
          </button>
        )}

        {/* Auto-Sync Every 1 Min Toggle & Countdown */}
        {accessToken && onToggleAutoSync && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/90 rounded-lg text-xs shadow-2xs">
            <button
              onClick={() => onToggleAutoSync(!isAutoSyncEnabled)}
              className={`inline-flex items-center gap-1 font-medium transition cursor-pointer ${
                isAutoSyncEnabled ? 'text-teal-700 font-semibold' : 'text-slate-400'
              }`}
              title={isAutoSyncEnabled ? 'คลิกเพื่อปิด Auto-Sync อัตโนมัติทุก 1 นาที' : 'คลิกเพื่อเปิด Auto-Sync อัตโนมัติทุก 1 นาที'}
            >
              <Clock className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin text-teal-600' : isAutoSyncEnabled ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>บันทึกอัตโนมัติ 1 นาที</span>
              <span className={`w-2 h-2 rounded-full ${isAutoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            </button>
            {isAutoSyncEnabled && (
              <span 
                className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold"
                title={lastSyncTime ? `ซิงค์ล่าสุด: ${lastSyncTime.toLocaleTimeString('th-TH')}` : 'กำลังนับถอยหลัง'}
              >
                {isAutoSyncing ? 'กำลังบันทึก...' : `${nextSyncCountdown}s`}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
          title="ดึงข้อมูลล่าสุดจาก Google Sheets เข้าสู่ระบบ"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>ดึงข้อมูลจาก Sheet</span>
        </button>

        {onPushAllData && (
          <button
            onClick={onPushAllData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition disabled:opacity-50 shadow-2xs cursor-pointer"
            title="ส่งข้อมูลผู้ป่วย ผู้สัมผัส และบันทึกยาทั้งหมดที่มีในระบบขึ้นไปบันทึกใน Google Sheet ทันที"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${isLoading ? 'animate-bounce' : ''}`} />
            <span>ส่งข้อมูลขึ้น Sheet</span>
          </button>
        )}

        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
          >
            <span>เปิด Google Sheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="เปลี่ยน Google Sheet"
        >
          เปลี่ยนชีท
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        <button
          onClick={() => toggleCompact(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="ย่อขนาดแถบให้กะทัดรัด (1 บรรทัด)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ย่อแถบ</span>
        </button>

        <button
          onClick={() => toggleHidden(true)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="ซ่อนแถบด้านบนนี้"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Modal for re-linking */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl text-left">
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-emerald-600" />
              จัดการ Google Sheet ฐานข้อมูล
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คุณสามารถสร้างชีทใหม่ หรือระบุชีทที่มีอยู่แล้วเพื่อเปลี่ยนฐานข้อมูลได้
            </p>

            <div className="space-y-4">
              <button
                onClick={handleCreateNewSheet}
                disabled={isCreating}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                {isCreating ? 'กำลังสร้าง...' : 'สร้างไฟล์ Google Sheet ใหม่'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-xs text-slate-400">หรือระบุ Sheet URL ที่มี</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleLinkExistingSheet} className="space-y-3">
                <input
                  type="text"
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ปิด
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking || !customSheetId.trim()}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {isLinking ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อชีทนี้'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
