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
  ShieldAlert
} from 'lucide-react';
import { createTBSheet, verifyAndInitSheets } from '../lib/sheetsApi';
import { googleSignIn } from '../lib/auth';

interface Props {
  accessToken?: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string | null;
  onConfigChange: (id: string, url: string, name: string) => void;
  onRefreshData: () => void;
  isLoading: boolean;
  onTokenUpdate?: (token: string) => void;
}

export const SheetConfigBanner: React.FC<Props> = ({
  accessToken,
  spreadsheetId,
  spreadsheetUrl,
  spreadsheetName,
  onConfigChange,
  onRefreshData,
  isLoading,
  onTokenUpdate
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

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

          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCreateNewSheet}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isCreating ? 'กำลังสร้าง Google Sheet...' : 'สร้าง Google Sheet ใหม่ทันที (แนะนำ)'}
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl transition"
            >
              <Link className="w-4 h-4" />
              เชื่อมโยง Sheet ที่มีอยู่แล้ว
            </button>
          </div>
        </div>

        {/* Modal for linking existing sheet */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl text-left">
              <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-emerald-600" />
                เชื่อมโยง Google Sheet ที่มีอยู่
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                วาง Google Sheet URL หรือ Spreadsheet ID ของคุณ ระบบจะสร้างชีทที่จำเป็นให้โดยอัตโนมัติ
              </p>

              <form onSubmit={handleLinkExistingSheet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Spreadsheet URL หรือ ID
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
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLinking ? 'กำลังตรวจสอบ...' : 'เชื่อมโยงชีท'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
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
              } catch (e) {
                console.error(e);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition shadow-2xs animate-pulse"
            title="กดเพื่อต่ออายุสิทธิ์ Google OAuth สำหรับเขียนข้อมูลลง Sheet"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>เชื่อมต่อสิทธิ์ Google เพื่อบันทึก</span>
          </button>
        )}

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
          title="ซิงค์ข้อมูลล่าสุดจาก Google Sheets"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>ซิงค์ข้อมูล</span>
        </button>

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
