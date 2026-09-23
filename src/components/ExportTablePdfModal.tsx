import React, { useRef } from 'react';
import { Printer, Download, X, FileSpreadsheet, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Patient, ContactPerson, ContactFollowUp } from '../types';
import { formatThaiDate, formatThaiDateTime } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'patients' | 'contacts';
  patients?: Patient[];
  contacts?: ContactPerson[];
  followUps?: ContactFollowUp[];
  currentUser?: string;
}

export const ExportTablePdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  reportType,
  patients = [],
  contacts = [],
  followUps = [],
  currentUser = 'เจ้าหน้าที่เวชกรรมสังคม',
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;

  const printDateStr = formatThaiDateTime(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {reportType === 'patients' 
                  ? 'พิมพ์ / บันทึกรายงานทะเบียนผู้ป่วยวัณโรค (PDF Report)' 
                  : 'พิมพ์ / บันทึกรายงานกลุ่มสัมผัสและกลุ่มเสี่ยง (PDF Report)'}
              </h3>
              <p className="text-xs text-slate-400">
                รวมทั้งหมด {reportType === 'patients' ? patients.length : contacts.length} รายการ • โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ / บันทึกเป็น PDF (Print to PDF)
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-0">
          <div 
            ref={printContainerRef}
            className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 mx-auto max-w-4xl text-slate-900 text-xs leading-normal"
          >
            {/* Hospital Header */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <h1 className="text-lg font-bold text-slate-900">
                โรงพยาบาลมหาวิทยาลัยอุบลราชธานี (Ubon Ratchathani University Hospital)
              </h1>
              <h2 className="text-sm font-bold text-teal-900">
                กลุ่มงานเวชกรรมสังคม คลินิกควบคุมและรักษาวัณโรค (TB Clinic)
              </h2>
              <div className="text-xs font-semibold text-slate-600">
                {reportType === 'patients' 
                  ? 'รายงานสรุปทะเบียนประวัติและการรักษาผู้ป่วยวัณโรคปอด' 
                  : 'รายงานทะเบียนการสอบสวนและติดตามคัดกรองกลุ่มสัมผัส/กลุ่มเสี่ยงวัณโรค'}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex justify-between items-center border-t border-slate-200 mt-2">
                <span>ผู้จัดทำเอกสาร: <strong>{currentUser}</strong></span>
                <span>พิมพ์เมื่อ: <strong>{printDateStr} น.</strong></span>
              </div>
            </div>

            {/* Summary Statistics Card */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 print:border-slate-400 grid grid-cols-4 gap-2 text-center text-xs">
              {reportType === 'patients' ? (
                <>
                  <div>
                    <div className="text-slate-500 text-[10px]">ผู้ป่วยทั้งหมด</div>
                    <div className="font-bold text-sm text-slate-900">{patients.length} คน</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">กำลังรักษา (Active)</div>
                    <div className="font-bold text-sm text-emerald-800">
                      {patients.filter(p => p.status === 'active').length} คน
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">รักษาหาย/ครบ (Completed)</div>
                    <div className="font-bold text-sm text-blue-800">
                      {patients.filter(p => p.status === 'completed').length} คน
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">ส่งต่อ / ขาดรักษา</div>
                    <div className="font-bold text-sm text-amber-800">
                      {patients.filter(p => p.status === 'transferred' || p.status === 'defaulted').length} คน
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-slate-500 text-[10px]">ผู้สัมผัสทั้งหมด</div>
                    <div className="font-bold text-sm text-slate-900">{contacts.length} คน</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">กลุ่มร่วมบ้าน (Household)</div>
                    <div className="font-bold text-sm text-emerald-800">
                      {contacts.filter(c => c.contactType === 'household').length} คน
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">กลุ่มนอกบ้าน (Non-household)</div>
                    <div className="font-bold text-sm text-blue-800">
                      {contacts.filter(c => c.contactType === 'non_household').length} คน
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">คีย์ใน n-tip แล้ว</div>
                    <div className="font-bold text-sm text-purple-800">
                      {contacts.filter(c => c.ntipStatus === 'entered').length} คน
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Table Content */}
            {reportType === 'patients' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-800">
                      <th className="py-2 px-1.5 text-center w-8">#</th>
                      <th className="py-2 px-2">HN</th>
                      <th className="py-2 px-2">ชื่อ - สกุล</th>
                      <th className="py-2 px-1.5 text-center">อายุ/เพศ</th>
                      <th className="py-2 px-2">สิทธิการรักษา</th>
                      <th className="py-2 px-2">สูตรยา / เริ่ม</th>
                      <th className="py-2 px-2">ผลเสมหะ</th>
                      <th className="py-2 px-2 text-center">สถานะ</th>
                      <th className="py-2 px-2">เบอร์โทร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {patients.map((p, idx) => (
                      <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                        <td className="py-2 px-1.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-2 font-mono font-bold text-teal-950">{p.hn}</td>
                        <td className="py-2 px-2 font-semibold text-slate-900">{p.fullName}</td>
                        <td className="py-2 px-1.5 text-center text-slate-700">
                          {p.age} ปี / {p.gender === 'male' ? 'ช' : p.gender === 'female' ? 'ญ' : '-'}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{p.treatmentRights || '-'}</td>
                        <td className="py-2 px-2 text-slate-800">
                          <span className="font-mono font-bold">{p.regimen}</span>
                          {p.treatmentStartDate && (
                            <div className="text-[10px] text-slate-500">{formatThaiDate(p.treatmentStartDate)}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-700 font-medium">{p.sputumResult || '-'}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                            p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.status === 'active' ? 'กำลังรักษา' :
                             p.status === 'completed' ? 'รักษาหาย' : p.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-600 font-mono">{p.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-800">
                      <th className="py-2 px-1.5 text-center w-8">#</th>
                      <th className="py-2 px-2">HN ผู้สัมผัส</th>
                      <th className="py-2 px-2">ชื่อ - สกุล</th>
                      <th className="py-2 px-1.5 text-center">อายุ</th>
                      <th className="py-2 px-2">กลุ่มสัมผัส</th>
                      <th className="py-2 px-2">ผู้ป่วยดัชนี (Index)</th>
                      <th className="py-2 px-2">เกณฑ์คัดกรอง</th>
                      <th className="py-2 px-2">ผล CXR ล่าสุด</th>
                      <th className="py-2 px-2 text-center">รหัส n-tip</th>
                      <th className="py-2 px-2">นัดถัดไป</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contacts.map((c, idx) => (
                      <tr key={c.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                        <td className="py-2 px-1.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-2 font-mono font-bold text-teal-950">{c.hn}</td>
                        <td className="py-2 px-2 font-semibold text-slate-900">{c.fullName}</td>
                        <td className="py-2 px-1.5 text-center text-slate-700">{c.age} ปี</td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.contactType === 'household' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {c.contactType === 'household' ? 'ร่วมบ้าน' : 'นอกบ้าน'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">({c.relationship || '-'})</span>
                        </td>
                        <td className="py-2 px-2 text-slate-800">
                          <span className="font-medium">{c.indexPatientName}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">HN: {c.indexPatientHN}</span>
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {c.age > 5 ? 'CXR 4 ครั้ง (ทุก 6 ด.)' : 'IGRA / TPT (เด็กเล็ก)'}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ${
                            c.cxrResult === 'normal' ? 'bg-emerald-100 text-emerald-800' :
                            c.cxrResult === 'abnormal_suspect_tb' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {c.cxrResult === 'normal' ? 'ปกติ' :
                             c.cxrResult === 'abnormal_suspect_tb' ? 'สงสัยวัณโรค' :
                             c.cxrResult === 'abnormal_other' ? 'ผิดปกติอื่นๆ' : 'รอผล'}
                          </span>
                          {c.cxrDate && <div className="text-[10px] text-slate-400">{formatThaiDate(c.cxrDate)}</div>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          {c.ntipStatus === 'entered' ? (
                            <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              {c.ntipKeyCode || 'คีย์แล้ว'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">ยังไม่คีย์</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-700 font-mono text-[10px]">
                          {c.nextCxrDate ? formatThaiDate(c.nextCxrDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Signature & Footer */}
            <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-end text-[11px] text-slate-600">
              <div>
                <div>เอกสารรายงานออกโดยระบบบริหารจัดการและติดตามผู้ป่วยวัณโรค</div>
                <div>โรงพยาบาลมหาวิทยาลัยอุบลราชธานี</div>
              </div>
              <div className="text-center w-64 space-y-4">
                <div>ลงชื่อ ................................................................</div>
                <div>(<strong>{currentUser}</strong>)</div>
                <div>ผู้รับผิดชอบงานควบคุมโรควัณโรค</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
