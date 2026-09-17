import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Building, 
  Calendar,
  User,
  Activity,
  Microscope,
  Home,
  Users,
  Download,
  AlertTriangle,
  Pill,
  Clock,
  Loader2,
  FileCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Patient, InvestigationForm, ContactPerson, DailyLog, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  investigation?: InvestigationForm | null;
  contacts?: ContactPerson[];
  logs?: DailyLog[];
  currentUserProfile?: UserProfile | null;
}

export const PatientReportPdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patient,
  investigation,
  contacts = [],
  logs = [],
  currentUserProfile,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter contacts belonging to this patient
  const patientContacts = contacts.filter(
    c => c.indexPatientId === patient.id || c.indexPatientHN === patient.hn
  );
  const householdContacts = patientContacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = patientContacts.filter(c => c.contactType === 'non_household');

  // DOTS statistics
  const patientLogs = logs.filter(l => l.patientId === patient.id);
  const totalDays = patientLogs.length;
  const takenDays = patientLogs.filter(l => l.takenMedication).length;
  const adherenceRate = totalDays > 0 ? Math.round((takenDays / totalDays) * 100) : 0;

  // Calculate default infectious period if not specified
  const symptomOnset = investigation?.symptomOnsetDate || patient.diagnosisDate;
  let defaultInfectiousStart = investigation?.infectiousPeriodStart;
  let defaultInfectiousEnd = investigation?.infectiousPeriodEnd;

  if (!defaultInfectiousStart && symptomOnset) {
    const d = new Date(symptomOnset);
    d.setMonth(d.getMonth() - 3);
    defaultInfectiousStart = d.toISOString().split('T')[0];
  }
  if (!defaultInfectiousEnd && patient.diagnosisDate) {
    const d = new Date(patient.diagnosisDate);
    d.setDate(d.getDate() + 14);
    defaultInfectiousEnd = d.toISOString().split('T')[0];
  }

  // Print via browser
  const handlePrint = () => {
    window.print();
  };

  // Direct download PDF
  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-medical-report');
    if (!element) return;

    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      // Ensure element styles render cleanly on canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution for high-definition print quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Subsequent pages if document exceeds single page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const safeHN = (patient.hn || patient.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `รายงานผู้ป่วยวัณโรค_${safeHN}_${dateStr}.pdf`;

      pdf.save(filename);
      setPdfSuccessMessage(`ดาวน์โหลดสำเร็จ: ${filename}`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง หรือเลือกใช้ปุ่มพิมพ์รายงาน');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const reportDateFormatted = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl my-4 overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] print:max-h-none">
        
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">ส่งออกรายงานทางการแพทย์ & ผลการสอบสวนโรค (PDF)</h3>
                <span className="text-[10px] bg-teal-800 text-teal-200 font-bold px-2 py-0.5 rounded-full border border-teal-700/60">
                  แบบฟอร์มทางการ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ผู้ป่วย: {patient.fullName} (HN: {patient.hn || '-'}) • รพ.มหาวิทยาลัยอุบลราชธานี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pdfSuccessMessage && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {pdfSuccessMessage}
              </span>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
              title="ดาวน์โหลดเป็นไฟล์ PDF ทันที"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 border border-slate-700 shadow-sm cursor-pointer"
              title="พิมพ์ผ่านหน้าต่างพิมพ์ของเบราว์เซอร์หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          id="printable-medical-report" 
          className="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 font-sans text-xs space-y-4 bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 text-center relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left text-[11px] text-slate-600 space-y-0.5">
                <div>รหัสแบบรายงาน: <strong>TB-HOSP-INV/2566</strong></div>
                <div>รหัสการสอบสวน: <strong>{investigation?.id || 'รอขึ้นทะเบียนสอบสวน'}</strong></div>
              </div>
              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <div>วันที่ออกเอกสาร: <strong>{reportDateFormatted}</strong></div>
                <div>HN ผู้ป่วย: <strong className="text-slate-900 text-xs font-mono">{patient.hn || '-'}</strong></div>
              </div>
            </div>

            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              แบบรายงานการสอบสวนโรคและสรุปประวัติผู้ป่วยวัณโรค
            </div>
            <div className="text-xs font-bold text-teal-900 mt-0.5">
              (Tuberculosis Epidemiological Investigation & Medical Summary Report)
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              โรงพยาบาลมหาวิทยาลัยอุบลราชธานี • คณะแพทยศาสตร์และการสาธารณสุข • กรมควบคุมโรค กระทรวงสาธารณสุข
            </div>
          </div>

          {/* Section 1: General Patient Information */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>1. ข้อมูลทั่วไปและประวัติการขึ้นทะเบียน (Patient Demographics & Registration)</span>
              <span className="text-[10px] font-normal text-slate-600">
                วันขึ้นทะเบียน NTIP: {patient.ntipRegistrationDate ? new Date(patient.ntipRegistrationDate).toLocaleDateString('th-TH') : '-'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div><strong>ชื่อ-นามสกุล:</strong> {patient.fullName}</div>
              <div><strong>เพศ:</strong> {patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</div>
              <div><strong>อายุ:</strong> {patient.age} ปี</div>
              <div><strong>สิทธิการรักษา:</strong> {patient.treatmentRights || 'บัตรทอง (UC)'}</div>
              <div><strong>เลขประจำตัว ปชช.:</strong> {patient.nationalId ? `${patient.nationalId.slice(0, 1)}-${patient.nationalId.slice(1, 5)}-${patient.nationalId.slice(5, 10)}-${patient.nationalId.slice(10, 12)}-${patient.nationalId.slice(12)}` : '-'}</div>
              <div><strong>เบอร์ติดต่อ:</strong> {patient.phone || '-'}</div>
              <div className="col-span-2"><strong>อีเมล / ช่องทางติดต่อ:</strong> {patient.email || '-'}</div>
              <div className="col-span-2"><strong>ผู้ติดต่อฉุกเฉิน:</strong> {patient.emergencyContact?.name || '-'} ({patient.emergencyContact?.relationship || 'ผู้ติดต่อ'}, โทร: {patient.emergencyContact?.phone || '-'})</div>
              <div className="col-span-2"><strong>อาชีพ / สถานประกอบการ:</strong> {investigation?.occupation || 'ไม่ระบุ'}</div>
              <div className="col-span-4"><strong>ที่อยู่ปัจจุบันขณะป่วย:</strong> {patient.address || '-'}</div>
            </div>
          </div>

          {/* Section 2: Clinical Diagnosis & Treatment Regimen */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>2. ข้อมูลการวินิจฉัยและการรักษา (Clinical Diagnosis & Treatment Regimen)</span>
              <span className="text-[10px] font-bold text-teal-800">
                สถานะ: {patient.status === 'active' ? 'กำลังรักษา' : patient.status === 'completed' ? 'รักษาครบแล้ว' : 'ส่งต่อ'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div><strong>วันที่วินิจฉัย:</strong> {patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-'}</div>
              <div><strong>ประเภทผู้ป่วย:</strong> {patient.treatmentCategory || 'ผู้ป่วยรายใหม่ (Cat 1 New)'}</div>
              <div className="col-span-2"><strong>การจำแนกโรค:</strong> {patient.tbClassification || 'Pulmonary (Bacteriologically Confirmed)'}</div>
              <div><strong>สูตรยาที่ได้รับ:</strong> <span className="font-bold text-slate-900">{patient.treatmentRegimen || '2HRZE/4HR'}</span></div>
              <div><strong>น้ำหนักแรกรับ:</strong> {patient.weightKg ? `${patient.weightKg} กก.` : '-'}</div>
              <div><strong>แพทย์ผู้ดูแลรักษา:</strong> {patient.doctorName || '-'}</div>
              <div><strong>โรงพยาบาล/หน่วยบริการ:</strong> {patient.hospitalName || 'รพ.มหาวิทยาลัยอุบลราชธานี'}</div>
            </div>

            {/* DOTS Summary bar */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>สรุปการรับประทานยา (DOTS Adherence):</strong> บันทึกแล้ว {totalDays} วัน • ทานยาครบ {takenDays} วัน
              </div>
              <div>
                อัตราความสม่ำเสมอ: <strong className={adherenceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}>{adherenceRate}%</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Timeline & Infectious Period */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>3. ประวัติการเจ็บป่วยและช่วงเวลาแพร่กระจายเชื้อ (Clinical Timeline & Infectious Period)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <strong>วันที่เริ่มมีอาการ (Onset):</strong> {investigation?.symptomOnsetDate ? new Date(investigation.symptomOnsetDate).toLocaleDateString('th-TH') : (patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-')}
              </div>
              <div>
                <strong>วันที่ตรวจพบ/วินิจฉัย:</strong> {patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-'}
              </div>
              <div>
                <strong>วันที่พบแพทย์ครั้งแรก:</strong> {investigation?.firstDoctorVisitDate ? new Date(investigation.firstDoctorVisitDate).toLocaleDateString('th-TH') : '-'}
              </div>
            </div>

            {/* Infectious Period Highlight Box */}
            <div className="p-2 bg-teal-50/70 border border-teal-200 rounded-lg text-[11px] leading-relaxed">
              <strong className="text-teal-950">⏱️ ช่วงเวลาแพร่กระจายเชื้อของผู้ป่วย (Infectious Period Window):</strong>{' '}
              <span>
                ตั้งแต่ <strong>{defaultInfectiousStart ? new Date(defaultInfectiousStart).toLocaleDateString('th-TH') : '-'}</strong> ถึง <strong>{defaultInfectiousEnd ? new Date(defaultInfectiousEnd).toLocaleDateString('th-TH') : '-'}</strong>{' '}
                <span className="text-slate-600">(คำนวณย้อนหลัง 3 เดือนก่อนเริ่มมีอาการ จนถึงหลังรับประทานยาต้านวัณโรค 2 สัปดาห์)</span>
              </span>
            </div>

            {/* Symptoms list */}
            <div>
              <strong className="text-[11px] text-slate-800 block mb-1">อาการสำคัญแรกรับ (Clinical Symptoms):</strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div>[{investigation?.symptoms?.chronicCough ? ' ✓ ' : ' '}] ไอเรื้อรัง {investigation?.symptoms?.chronicCough ? `(${investigation?.symptoms?.coughDurationWeeks || 2} สัปดาห์)` : ''}</div>
                <div>[{investigation?.symptoms?.coughBlood ? ' ✓ ' : ' '}] ไอเป็นเลือด (Hemoptysis)</div>
                <div>[{investigation?.symptoms?.fever ? ' ✓ ' : ' '}] มีไข้ / ตัวร้อน</div>
                <div>[{investigation?.symptoms?.nightSweats ? ' ✓ ' : ' '}] เหงื่อออกตอนกลางคืน</div>
                <div>[{investigation?.symptoms?.weightLoss ? ' ✓ ' : ' '}] น้ำหนักลด / เบื่ออาหาร</div>
                <div>[{investigation?.symptoms?.chestPain ? ' ✓ ' : ' '}] เจ็บแน่นหน้าอก</div>
                <div>[{investigation?.symptoms?.fatigue ? ' ✓ ' : ' '}] อ่อนเพลีย เหนื่อยง่าย</div>
              </div>
            </div>
          </div>

          {/* Section 4: Diagnostic & Laboratory Results */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm">
              4. ผลตรวจทางห้องปฏิบัติการและภาพถ่ายรังสีทรวงอก (Diagnostic & Laboratory Findings)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="space-y-1">
                <div><strong>ประเภทวัณโรค:</strong> {patient.tbClassification || 'Pulmonary (Bacteriologically Confirmed)'}</div>
                <div><strong>ผลตรวจเสมหะ (AFB Smear):</strong> <span className="font-bold text-slate-900">{investigation?.afbSmearResult || 'Negative'}</span> {investigation?.afbSmearDate ? `(วันที่: ${new Date(investigation.afbSmearDate).toLocaleDateString('th-TH')})` : ''}</div>
                <div><strong>ผลตรวจโมเลกุล (GeneXpert MTB/RIF):</strong> {investigation?.geneXpertResult || 'Not done'} {investigation?.geneXpertDate ? `(วันที่: ${new Date(investigation.geneXpertDate).toLocaleDateString('th-TH')})` : ''}</div>
                <div><strong>ผลการเพาะเชื้อ (Culture MTB):</strong> {investigation?.cultureResult || 'รอผล / ไม่ได้ส่งตรวจ'}</div>
              </div>

              <div className="space-y-1">
                <div><strong>ผลตรวจภาพรังสีทรวงอก (CXR แรกรับ):</strong> {investigation?.initialCxrResult || 'Infiltration / Cavitary lesion'}</div>
                <div><strong>วันที่ตรวจ CXR:</strong> {investigation?.initialCxrDate ? new Date(investigation.initialCxrDate).toLocaleDateString('th-TH') : '-'}</div>
                <div>
                  <strong>ผลการตรวจเลือดหาการติดเชื้อ HIV:</strong>{' '}
                  <span className="font-bold">
                    {investigation?.comorbidities?.hiv === 'negative' ? 'Negative (ผลลบ)' : investigation?.comorbidities?.hiv === 'positive' ? 'Positive (ผลบวก)' : 'ไม่ทราบผล / ไม่ได้ตรวจ'}
                  </span>
                </div>
                <div>
                  <strong>โรคร่วม / ปัจจัยเสี่ยง:</strong>{' '}
                  {[
                    investigation?.comorbidities?.diabetes && 'เบาหวาน (DM)',
                    investigation?.comorbidities?.ckd && 'ไตเรื้อรัง (CKD)',
                    investigation?.comorbidities?.smoking && 'สูบบุหรี่',
                    investigation?.comorbidities?.alcohol && 'ดื่มสุรา',
                    investigation?.comorbidities?.substanceAbuse && 'สารเสพติด',
                    !investigation?.comorbidities?.diabetes && !investigation?.comorbidities?.ckd && !investigation?.comorbidities?.smoking && !investigation?.comorbidities?.alcohol && 'ไม่มีโรคร่วมสำคัญ'
                  ].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Contact Investigation & Screening Plan */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>5. ผลการค้นหาและจำแนกกลุ่มผู้สัมผัสโรค (Contact Tracing & Investigation Plan)</span>
              <span className="text-[10px] text-slate-600 font-normal">ตามเกณฑ์กรมควบคุมโรค 2563/2566</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <div className="font-bold text-emerald-950">
                  1. ผู้สัมผัสร่วมบ้าน (Household Contacts): <strong>{investigation?.householdContactsCount || householdContacts.length || 0} คน</strong>
                </div>
                <div className="text-slate-600 text-[10px] mt-0.5">
                  • เด็กอายุ &le; 5 ปี: <strong>{investigation?.under5ContactsCount || householdContacts.filter(c => c.age <= 5).length || 0} คน</strong> (เกณฑ์ IGRA / TPT)<br/>
                  • ผู้ใหญ่อายุ &gt; 5 ปี: <strong>{Math.max(0, (investigation?.householdContactsCount || householdContacts.length || 0) - (investigation?.under5ContactsCount || 0))} คน</strong> (เกณฑ์ CXR 4 ครั้ง: 0, 6, 12, 18 ด.)
                </div>
              </div>

              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="font-bold text-blue-950">
                  2. ผู้สัมผัสนอกบ้าน/ใกล้ชิด (Non-household Contacts): <strong>{investigation?.nonHouseholdContactsCount || nonHouseholdContacts.length || 0} คน</strong>
                </div>
                <div className="text-slate-600 text-[10px] mt-0.5">
                  • สัมผัสสะสม &ge; 40-120 ชม. ในสถานที่ปิด (ที่ทำงาน/สถานศึกษา)<br/>
                  • แผนการตรวจ: CXR แรกรับ และติดตามตามความเสี่ยง
                </div>
              </div>
            </div>

            {/* Contacts Table if recorded */}
            {patientContacts.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-slate-700 mb-1">
                  รายชื่อผู้สัมผัสที่บันทึกในระบบ ({patientContacts.length} ราย):
                </div>
                <table className="w-full text-[10px] border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 p-1">ลำดับ</th>
                      <th className="border border-slate-300 p-1">ชื่อ-สกุล</th>
                      <th className="border border-slate-300 p-1">ความสัมพันธ์</th>
                      <th className="border border-slate-300 p-1">อายุ</th>
                      <th className="border border-slate-300 p-1">กลุ่มผู้สัมผัส</th>
                      <th className="border border-slate-300 p-1">เกณฑ์ติดตาม</th>
                      <th className="border border-slate-300 p-1">รหัส n-tip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientContacts.map((c, idx) => (
                      <tr key={c.id}>
                        <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1 font-medium">{c.fullName}</td>
                        <td className="border border-slate-300 p-1">{c.relationship}</td>
                        <td className="border border-slate-300 p-1 text-center">{c.age} ปี</td>
                        <td className="border border-slate-300 p-1">
                          {c.contactType === 'household' ? 'ร่วมบ้าน' : 'นอกบ้าน/ใกล้ชิด'}
                        </td>
                        <td className="border border-slate-300 p-1">
                          {c.protocolType === 'cxr_4_times' ? 'CXR 4 ครั้ง (0,6,12,18 ด.)' : 'IGRA / TPT (เด็กเล็ก)'}
                        </td>
                        <td className="border border-slate-300 p-1 font-mono text-[9px]">{c.ntipKeyCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 6: Evaluation & Control Measures */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm">
              6. การประเมินความเสี่ยง มาตรการควบคุมโรค และข้อเสนอแนะ (Risk Assessment & Control Measures)
            </div>

            <div className="space-y-2 text-[11px] pt-1 leading-relaxed">
              <div>
                <strong>การประเมินความเสี่ยงและแหล่งแพร่เชื้อ:</strong>
                <p className="text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-200 mt-0.5">
                  {investigation?.riskAssessmentNotes || 'ผู้ป่วยได้รับการวินิจฉัยเป็นวัณโรคปอด จำเป็นต้องรับประทานยาอย่างต่อเนื่องและกำกับแบบประชิด (DOTS) เพื่อป้องกันภาวะดื้อยา และเร่งคัดกรองผู้สัมผัส'}
                </p>
              </div>

              <div>
                <strong>มาตรการควบคุมโรคและการให้สุขศึกษา:</strong>
                <p className="text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-200 mt-0.5">
                  {investigation?.controlMeasures || '1. แนะนำให้ผู้ป่วยสวมหน้ากากอนามัยและแยกห้องนอนที่มีการระบายอากาศที่ดี\n2. กำชับให้รับประทานยาสม่ำเสมอทุกวันตามสูตรที่แพทย์กำหนด\n3. นัดติดตามผู้สัมผัสโรคเข้ารับการตรวจเอกซเรย์ปอด (CXR) ตามนัดหมาย'}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-4 flex justify-end text-[11px] text-center border-t border-slate-300">
            <div className="space-y-5 w-80">
              <div>
                ลงชื่อ .................................................................... ผู้ทำการสอบสวนโรค
              </div>
              <div className="space-y-1">
                <div>(<strong>{investigation?.investigatorName || currentUserProfile?.displayName || '..........................................................'}</strong>)</div>
                <div className="text-slate-600">ตำแหน่ง: {investigation?.investigatorPosition || currentUserProfile?.position || 'พยาบาลวิชาชีพ / เจ้าหน้าที่สอบสวนโรค'}</div>
                <div className="text-slate-600">วันที่: {investigation?.investigationDate ? new Date(investigation.investigationDate).toLocaleDateString('th-TH') : reportDateFormatted}</div>
              </div>
            </div>
          </div>

          {/* Document Footer Note */}
          <div className="text-[10px] text-slate-400 text-center pt-2">
            เอกสารฉบับนี้ออกโดยระบบบริหารจัดการและติดตามผู้ป่วยวัณโรค โรงพยาบาลมหาวิทยาลัยอุบลราชธานี • วันที่พิมพ์: {new Date().toLocaleString('th-TH')}
          </div>

        </div>

      </div>
    </div>
  );
};
