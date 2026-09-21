import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileSpreadsheet, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ArrowRight,
  Lightbulb,
  Lock,
  RefreshCw,
  TableProperties
} from 'lucide-react';

interface Props {
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  hasAccessToken?: boolean;
  onOpenSheetConfig?: () => void;
}

export const GettingStartedGuide: React.FC<Props> = ({
  spreadsheetId,
  spreadsheetUrl,
  hasAccessToken = false,
  onOpenSheetConfig
}) => {
  // Default expanded if no sheet connected, collapsed if already connected (user can toggle anytime)
  const [isExpanded, setIsExpanded] = useState<boolean>(!spreadsheetId);
  const [activeTab, setActiveTab] = useState<'setup' | 'popup' | 'structure'>('setup');

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const openAppInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                คู่มือเริ่มต้นใช้งาน & การตั้งค่า Google Sheets (Getting Started Guide)
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                spreadsheetId
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {spreadsheetId ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>เชื่อมต่อ Sheet แล้ว</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3 h-3 text-amber-400" />
                    <span>ยังไม่ได้เชื่อมต่อ Sheet</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              ขั้นตอนการผูกฐานข้อมูล Google Sheets ครั้งแรก และวิธีแก้ไขปัญหาหน้าต่าง Pop-up สิทธิ์การเข้าถึง
            </p>
          </div>
        </div>

        {/* Action / Toggle Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          {isInIframe && (
            <button
              onClick={openAppInNewTab}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="เปิดแอปในแท็บใหม่เพื่อการเชื่อมต่อที่ราบรื่นยิ่งขึ้น"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>เปิดในแท็บใหม่</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>{isExpanded ? 'ซ่อนคู่มือ' : 'ดูคำแนะนำ'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-100">
          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. วิธีตั้งค่า Google Sheet ครั้งแรก</span>
            </button>

            <button
              onClick={() => setActiveTab('popup')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'popup'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>2. แก้ปัญหา Pop-up / สิทธิ์ไม่ขึ้น</span>
            </button>

            <button
              onClick={() => setActiveTab('structure')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'structure'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. โครงสร้าง 5 แท็บมาตรฐาน</span>
            </button>
          </div>

          {/* TAB 1: Setup Steps */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">สร้างไฟล์ Google Sheet</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    สร้างไฟล์ Google Sheet เปล่าขึ้นมาใหม่ใน Google Drive ของท่าน หรือคลิกสร้างด่วนได้ทันที
                  </p>
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition"
                  >
                    <span>เปิดสร้าง sheets.new</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">คัดลอกลิงก์ (URL) มาเชื่อมโยง</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    คัดลอก URL จากช่องที่อยู่ของเบราว์เซอร์ แล้วนำมากดปุ่ม <strong>"เชื่อมโยง Sheet ที่มีอยู่แล้ว"</strong>
                  </p>
                  <div className="text-[11px] font-mono bg-slate-100 p-2 rounded-lg text-slate-600 truncate">
                    https://docs.google.com/spreadsheets/d/...
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">ระบบสร้าง 5 แท็บให้อัตโนมัติ</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    เมื่อเริ่มบันทึกข้อมูลแรก ระบบจะใส่หัวตารางและโครงสร้างทางการแพทย์ให้ครบถ้วน <strong>โดยไม่ต้องพิมพ์หัวตารางเอง</strong>
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>พร้อมจัดเก็บแบบเรียลไทม์</span>
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-900">
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span>
                    <strong>สถานะปัจจุบัน:</strong> {spreadsheetId ? `เชื่อมต่อ Google Sheet เรียบร้อยแล้ว (ID: ${spreadsheetId.substring(0, 8)}...)` : 'ยังไม่ได้เชื่อมโยง Google Sheet แนะนำให้เชื่อมโยงเพื่อป้องกันข้อมูลสูญหาย'}
                  </span>
                </div>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 underline flex-shrink-0"
                  >
                    <span>เปิดดู Google Sheet ใน Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Pop-up Blocked & OAuth Troubleshoot */}
          {activeTab === 'popup' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-900">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm mb-1">
                      ทำไมถึงกดแล้วไม่ขึ้นหน้าต่างให้ยืนยันสิทธิ์ Google?
                    </h4>
                    <p className="text-amber-800 leading-relaxed mb-3">
                      เนื่องจากแอปพลิเคชันกำลังแสดงผลผ่านระบบ Sandbox (iFrame) ของ AI Studio ตัวเบราว์เซอร์จึงบล็อกหน้าต่าง Pop-up เพื่อความปลอดภัยโดยอัตโนมัติ
                    </p>
                  </div>
                </div>

                {/* 3 Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center">
                        A
                      </span>
                      <span>วิธีที่ 1: เปิดแอปในแท็บใหม่ (แนะนำที่สุด)</span>
                    </div>
                    <p className="text-slate-600 mb-2.5">
                      กดเปิดโปรแกรมในแท็บเบราว์เซอร์เต็มจอ เพื่อให้หน้าต่างขอสิทธิ์ Google เด้งขึ้นมาได้โดยไม่ถูกบล็อก
                    </p>
                    <button
                      onClick={openAppInNewTab}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>เปิดโปรแกรมในแท็บใหม่</span>
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-black flex items-center justify-center">
                        B
                      </span>
                      <span>วิธีที่ 2: ปลดบล็อก Pop-up ในเบราว์เซอร์</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      1. สังเกตที่แถบ Address bar ด้านบนขวาของ Chrome/Edge<br />
                      2. คลิกไอคอนรูปหน้าต่างที่มีกากบาทสีแดง<br />
                      3. เลือก <strong>"อนุญาตป๊อปอัปเสมอ (Always allow pop-ups)"</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>
                    <strong>ตรวจสอบสิทธิ์ของบัญชี Google:</strong> ตรวจสอบว่าบัญชีที่ใช้เป็น <strong>ผู้แก้ไข (Editor)</strong> หรือเจ้าของไฟล์ใน Google Drive
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 5 Sheets Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 mb-2">
                ระบบจะจัดการจัดเก็บข้อมูลแยกออกเป็น 5 แท็บตามหลักระบาดวิทยาและเวชระเบียน ดังนี้:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-teal-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    <span>1. ผู้ป่วยวัณโรครายใหม่ (Patients)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    ข้อมูลประวัติผู้ป่วย HN, ชื่อ-สกุล, สูตรยา, วันที่เริ่มรักษา, สถานะการรักษา, และหน่วยบริการ
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-indigo-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>2. การสอบสวนโรค (Investigation)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    แบบฟอร์มสอบสวนโรคตามเกณฑ์กรมควบคุมโรค (DDC), ประวัติเสี่ยง, สภาพแวดล้อมที่อยู่อาศัย
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>3. กลุ่มผู้สัมผัสโรค (Contacts)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    รายชื่อผู้สัมผัสร่วมบ้าน (Household) และผู้สัมผัสใกล้ชิด (Close Contacts), ความเสี่ยงสูง/ต่ำ
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="font-bold text-rose-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>4. บันทึกการติดตามตรวจ (Follow-ups)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    ผลการตรวจคัดกรองอาการ, ผลตรวจเอกซเรย์ปอด (CXR), การขึ้นทะเบียน NTIP และการรับยาป้องกัน TPT
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-1">
                  <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>5. บันทึกอาการและยา (Daily Logs)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    บันทึกการรับประทานยา DOTS รายวัน, อาการข้างเคียง (ADR) และบันทึกหมายเหตุของเจ้าหน้าที่
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
