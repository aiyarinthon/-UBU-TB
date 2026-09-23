import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  ShieldAlert, 
  AlertCircle,
  Stethoscope,
  Printer,
  Sparkles
} from 'lucide-react';
import { ContactPerson, ContactFollowUp } from '../types';
import { formatThaiDate } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contact: ContactPerson | null;
  followUps?: ContactFollowUp[];
  currentUserName?: string;
}

export const SendCxrEmailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  contact,
  followUps = [],
  currentUserName = 'เจ้าหน้าที่ควบคุมโรค',
}) => {
  if (!isOpen || !contact) return null;

  // Find latest completed CXR follow-up or use contact CXR data
  const contactFollowUps = followUps.filter(f => f.contactId === contact.id);
  const latestCompletedCxr = contactFollowUps
    .filter(f => f.stepType.startsWith('cxr_') && f.status === 'completed')
    .sort((a, b) => (b.actualDate || b.scheduledDate || '').localeCompare(a.actualDate || a.scheduledDate || ''))[0];

  const [recipientEmail, setRecipientEmail] = useState(contact.email || '');
  const [recipientName, setRecipientName] = useState(contact.fullName);
  const [cxrRound, setCxrRound] = useState<'cxr_1' | 'cxr_2' | 'cxr_3' | 'cxr_4' | 'general'>(() => {
    if (contact.cxrRound === 'cxr_1_0m') return 'cxr_1';
    if (contact.cxrRound === 'cxr_2_6m') return 'cxr_2';
    if (contact.cxrRound === 'cxr_3_12m') return 'cxr_3';
    if (contact.cxrRound === 'cxr_4_18m') return 'cxr_4';
    return 'cxr_1';
  });
  const [cxrDate, setCxrDate] = useState(
    latestCompletedCxr?.actualDate || contact.cxrDate || new Date().toISOString().split('T')[0]
  );
  const [cxrResult, setCxrResult] = useState<'normal' | 'abnormal_suspect_tb' | 'abnormal_other' | 'pending'>(
    contact.cxrResult || 'normal'
  );
  const [cxrFindings, setCxrFindings] = useState(
    latestCompletedCxr?.resultDetail || contact.cxrResultDetail || 'ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal, No active lesion)'
  );
  const [nextAppointment, setNextAppointment] = useState(
    latestCompletedCxr?.nextAppointmentDate || contact.nextCxrDate || ''
  );
  const [hospitalName, setHospitalName] = useState(
    latestCompletedCxr?.hospitalOrFacility || contact.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี'
  );
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync when contact changes
  useEffect(() => {
    if (contact) {
      setRecipientEmail(contact.email || '');
      setRecipientName(contact.fullName);
      setCxrResult(contact.cxrResult || 'normal');
      setCxrDate(contact.cxrDate || new Date().toISOString().split('T')[0]);
      setCxrFindings(contact.cxrResultDetail || 'ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal, No active lesion)');
      setNextAppointment(contact.nextCxrDate || '');
      setHospitalName(contact.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี');
    }
  }, [contact]);

  const getRoundLabel = (roundKey: string) => {
    switch (roundKey) {
      case 'cxr_1': return 'การตรวจเอกซเรย์ปอด ครั้งที่ 1 (แรกรับ/0 เดือน)';
      case 'cxr_2': return 'การตรวจเอกซเรย์ปอด ครั้งที่ 2 (ครบ 6 เดือน)';
      case 'cxr_3': return 'การตรวจเอกซเรย์ปอด ครั้งที่ 3 (ครบ 12 เดือน)';
      case 'cxr_4': return 'การตรวจเอกซเรย์ปอด ครั้งที่ 4 (ครบ 18 เดือน)';
      default: return 'การตรวจเอกซเรย์ปอดคัดกรองกลุ่มสัมผัสโรค';
    }
  };

  const getResultBadgeText = () => {
    switch (cxrResult) {
      case 'normal': return 'ปกติ (Normal) - ไม่พบรอยโรควัณโรค';
      case 'abnormal_suspect_tb': return 'พบความผิดปกติ สงสัยวัณโรค (Suspect TB) - กรุณาพบแพทย์';
      case 'abnormal_other': return 'พบความผิดปกติอื่นๆ (Other findings) - กรุณาพบแพทย์';
      default: return 'รอผลการตรวจทางรังสีวิทยา';
    }
  };

  // Generate Formal Thai Email Body
  const emailSubject = `[แจ้งผลตรวจเอกซเรย์ปอด CXR] รพ.มหาวิทยาลัยอุบลราชธานี - คุณ${recipientName}`;

  const formattedCxrDate = formatThaiDate(cxrDate, { short: false });
  const formattedNextAppointment = formatThaiDate(nextAppointment, { short: false });

  const emailBody = `เรียน คุณ${recipientName}

งานควบคุมโรค รพ.มหาวิทยาลัยอุบลราชธานี ขอแจ้งผลการตรวจเอกซเรย์ทรวงอก (Chest X-Ray) และคำแนะนำในการดูแลสุขภาพ ดังนี้:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ข้อมูลการตรวจคัดกรองผู้สัมผัสโรค
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ชื่อ-สกุล ผู้รับการตรวจ: คุณ${recipientName}
• รอบการตรวจ: ${getRoundLabel(cxrRound)}
• วันที่เข้ารับการตรวจ: ${formattedCxrDate}
• สถานพยาบาลที่ตรวจ: ${hospitalName || 'รพ.มหาวิทยาลัยอุบลราชธานี'}

📊 ผลการตรวจเอกซเรย์ปอด (CXR Result):
➡️ ${getResultBadgeText()}
• รายละเอียดผลตรวจ: ${cxrFindings || 'ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal, No active lesion)'}

📅 กำหนดนัดตรวจติดตามครั้งถัดไป:
➡️ วันที่ ${formattedNextAppointment} ณ ${hospitalName || 'รพ.มหาวิทยาลัยอุบลราชธานี'}
${customNote ? `\n💬 บันทึกเพิ่มเติมจากเจ้าหน้าที่:\n${customNote}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 คำแนะนำและข้อควรปฏิบัติสำหรับกลุ่มสัมผัส
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ผู้สัมผัสวัณโรคจำเป็นต้องได้รับการตรวจเอกซเรย์ปอดเป็นระยะรวม 4 ครั้ง (ทุก 6 เดือน จนครบ 2 ปี) แม้จะไม่มีอาการผิดปกติ
2. โปรดสังเกตอาการสงสัยวัณโรค ได้แก่:
   - มีอาการไอเรื้อรังติดต่อกันเกิน 2 สัปดาห์
   - มีไข้ต่ำๆ โดยเฉพาะช่วงบ่ายหรือค่ำ
   - เหงื่อออกผิดปกติตอนกลางคืน
   - เบื่ออาหาร น้ำหนักตัวลดลงอย่างรวดเร็ว เจ็บหน้าอก หรือไอมีเสมหะปนเลือด
3. หากมีอาการข้างต้นข้อใดข้อหนึ่ง ขอให้มาพบแพทย์ที่โรงพยาบาลทันทีโดยไม่ต้องรอนัด
4. สวมหน้ากากอนามัยเมื่ออยู่ในที่ชุมชนหรือร่วมกับผู้อื่น และเปิดประตูหน้าต่างให้อากาศถ่ายเทสะดวก

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 ข้อมูลการติดต่อ
งานควบคุมโรค รพ.มหาวิทยาลัยอุบลราชธานี
โทรศัพท์: 045-353-909 ต่อ 5923 งานควบคุมโรค
วัน-เวลาทำการ: จันทร์ - ศุกร์ (08.00 - 16.00 น.)
ผู้บันทึกและส่งข้อมูล: ${currentUserName || 'เจ้าหน้าที่ควบคุมโรค'}`;

  // Actions
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${emailSubject}</title>
          <style>
            body { font-family: 'Sarabun', 'Prompt', sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
            h2 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .highlight { font-weight: bold; color: ${cxrResult === 'normal' ? '#047857' : '#be123c'}; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h2>ใบแจ้งผลตรวจเอกซเรย์ปอด (Chest X-Ray Notification)</h2>
          <pre>${emailBody}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Mail className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                ส่งผลตรวจเอกซเรย์ปอด (CXR) ทางอีเมล
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-normal border border-emerald-400/30">
                  กลุ่มสัมผัสเสี่ยง
                </span>
              </h2>
              <p className="text-xs text-teal-100">
                ผู้รับ: <strong>{recipientName}</strong> (HN: {contact.hn}) • ผู้ป่วยดัชนี: {contact.indexPatientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Recipient & Quick Parameters */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-700" />
                  อีเมลผู้รับ (Recipient Email) *
                </label>
                <input
                  type="email"
                  placeholder="เช่น example@gmail.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                />
                {!recipientEmail && (
                  <span className="text-[11px] text-amber-600 flex items-center gap-1 mt-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> ผู้สัมผัสยังไม่มีอีเมล กรุณาระบุเพื่อส่ง
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-700" />
                  ชื่อ-สกุล ผู้รับแจ้ง
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* CXR Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  รอบการตรวจเอกซเรย์
                </label>
                <select
                  value={cxrRound}
                  onChange={(e) => setCxrRound(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="cxr_1">CXR ครั้งที่ 1 (แรกรับ/0 ด.)</option>
                  <option value="cxr_2">CXR ครั้งที่ 2 (6 เดือน)</option>
                  <option value="cxr_3">CXR ครั้งที่ 3 (12 เดือน)</option>
                  <option value="cxr_4">CXR ครั้งที่ 4 (18 เดือน)</option>
                  <option value="general">ผลตรวจคัดกรองทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ผลการตรวจ CXR
                </label>
                <select
                  value={cxrResult}
                  onChange={(e) => {
                    const res = e.target.value as any;
                    setCxrResult(res);
                    if (res === 'normal') {
                      setCxrFindings('ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal, No active infiltration)');
                    } else if (res === 'abnormal_suspect_tb') {
                      setCxrFindings('พบ Infiltration ในเนื้อปอด สงสัยวัณโรค กรุณามาพบแพทย์เพื่อตรวจเสมหะและวางแผนรักษา');
                    }
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs border rounded-xl font-bold ${
                    cxrResult === 'normal' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : cxrResult === 'abnormal_suspect_tb'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <option value="normal">✅ ปกติ (Normal)</option>
                  <option value="abnormal_suspect_tb">⚠️ ผิดปกติ สงสัยวัณโรค (Suspect TB)</option>
                  <option value="abnormal_other">ℹ️ ผิดปกติอื่นๆ (Other)</option>
                  <option value="pending">⏳ รอผลการตรวจ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  วันที่ตรวจเอกซเรย์
                </label>
                <input
                  type="date"
                  value={cxrDate}
                  onChange={(e) => setCxrDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Findings & Next appointment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  รายละเอียดผลอ่านฟิล์ม (Findings)
                </label>
                <input
                  type="text"
                  value={cxrFindings}
                  onChange={(e) => setCxrFindings(e.target.value)}
                  placeholder="เช่น CXR Normal, ไม่พบ active lesion"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  วันนัดตรวจติดตามครั้งถัดไป (Next Appointment)
                </label>
                <input
                  type="date"
                  value={nextAppointment}
                  onChange={(e) => setNextAppointment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Email Preview Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                ตัวอย่างข้อความอีเมลที่จะจัดส่ง (Email Preview):
              </span>
              <span className="text-[11px] text-slate-400">
                ภาษาทางการแพทย์ที่เข้าใจง่าย
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 border border-slate-800 shadow-inner select-text">
              <div className="text-teal-400 font-bold border-b border-slate-800 pb-2 mb-2">
                Subject: {emailSubject}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                {emailBody}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกข้อความ'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              title="พิมพ์ใบแจ้งผล"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>พิมพ์ใบแจ้งผล</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenGmail}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดส่งผ่าน Gmail</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMailClient}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ส่งผ่านโปรแกรมอีเมล (Default Mail)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
