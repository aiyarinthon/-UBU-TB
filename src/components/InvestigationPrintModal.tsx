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
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Patient, InvestigationForm, ContactPerson } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  investigation: InvestigationForm;
  contacts?: ContactPerson[];
}

export const InvestigationPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patient,
  investigation,
  contacts = [],
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-investigation-form');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
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

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const safeHN = (patient.hn || patient.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `แบบสอบสวนโรค_TB_${safeHN}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาใช้ปุ่มพิมพ์รายงาน');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const householdContacts = contacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = contacts.filter(c => c.contactType === 'non_household');

  // Calculate default infectious period if not specified
  const symptomOnset = investigation.symptomOnsetDate || patient.diagnosisDate;
  let defaultInfectiousStart = investigation.infectiousPeriodStart;
  let defaultInfectiousEnd = investigation.infectiousPeriodEnd;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl my-4 overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] print:max-h-none">
        
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">พิมพ์แบบสอบสวนโรคผู้ป่วยวัณโรค (Print Investigation Form)</h3>
              <p className="text-xs text-slate-400">
                แนวทางการสอบสวนและควบคุมวัณโรค กรมควบคุมโรค พ.ศ. 2563 / 2566
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
              title="ดาวน์โหลดไฟล์ PDF ทันที"
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
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แบบสอบสวนโรค</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-investigation-form" className="p-8 sm:p-10 overflow-y-auto print:p-6 print:overflow-visible text-slate-900 font-sans text-xs space-y-5 bg-white">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left text-[11px] text-slate-600">
                <div>แบบฟอร์ม: <strong>TB-INV-63/66</strong></div>
                <div>รหัสการสอบสวน: <strong>{investigation.id}</strong></div>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <div>วันที่สอบสวน: <strong>{new Date(investigation.investigationDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div>HN ผู้ป่วย: <strong className="text-slate-900 text-xs font-mono">{patient.hn || '-'}</strong></div>
              </div>
            </div>

            <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              แบบรายงานการสอบสวนทางระบาดวิทยาผู้ป่วยวัณโรค
            </div>
            <div className="text-xs font-bold text-teal-900 mt-0.5">
              (Tuberculosis Epidemiological Case Investigation Form)
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              โรงพยาบาลมหาวิทยาลัยอุบลราชธานี • กรมควบคุมโรค กระทรวงสาธารณสุข
            </div>
          </div>

          {/* Section 1: General Patient Information */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>1. ข้อมูลทั่วไปของผู้ป่วย (Patient Demographics)</span>
              <span className="text-[10px] font-normal text-slate-600">วันขึ้นทะเบียน NTIP: {patient.ntipRegistrationDate ? new Date(patient.ntipRegistrationDate).toLocaleDateString('th-TH') : '-'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div><strong>ชื่อ-นามสกุล:</strong> {patient.fullName}</div>
              <div><strong>เพศ:</strong> {patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</div>
              <div><strong>อายุ:</strong> {patient.age} ปี</div>
              <div><strong>สิทธิการรักษา:</strong> {patient.treatmentRights || 'บัตรทอง (UC)'}</div>
              <div className="col-span-2"><strong>เบอร์ติดต่อ:</strong> {patient.phone || '-'} {patient.email ? `(${patient.email})` : ''}</div>
              <div className="col-span-2"><strong>อาชีพ / สถานที่ทำงาน:</strong> {investigation.occupation || 'ไม่ระบุ / ค้าขาย / รับจ้าง'}</div>
              <div className="col-span-4"><strong>ที่อยู่ปัจจุบันขณะป่วย:</strong> {patient.address || '-'}</div>
            </div>
          </div>

          {/* Section 2: Clinical Timeline & Infectious Period */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>2. ประวัติการเจ็บป่วยและช่วงเวลาแพร่กระจายเชื้อ (Clinical Timeline & Infectious Period)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <strong>วันที่เริ่มมีอาการ (Onset):</strong> {investigation.symptomOnsetDate ? new Date(investigation.symptomOnsetDate).toLocaleDateString('th-TH') : (patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-')}
              </div>
              <div>
                <strong>วันที่ตรวจพบ/วินิจฉัย:</strong> {patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-'}
              </div>
              <div>
                <strong>กลุ่มการรักษา:</strong> {patient.treatmentCategory || 'ผู้ป่วยรายใหม่ (Cat 1)'}
              </div>
            </div>

            {/* Infectious Period Highlight Box */}
            <div className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[11px] leading-relaxed">
              <strong className="text-slate-900">⏱️ ช่วงเวลาแพร่กระจายเชื้อของผู้ป่วย (Infectious Period):</strong>{' '}
              <span>
                ตั้งแต่ <strong>{defaultInfectiousStart ? new Date(defaultInfectiousStart).toLocaleDateString('th-TH') : '-'}</strong> ถึง <strong>{defaultInfectiousEnd ? new Date(defaultInfectiousEnd).toLocaleDateString('th-TH') : '-'}</strong>{' '}
                <span className="text-slate-500">(คำนวณย้อนหลัง 3 เดือนก่อนเริ่มมีอาการ จนถึงหลังรับประทานยาต้านวัณโรค 2 สัปดาห์)</span>
              </span>
            </div>

            {/* Symptoms list */}
            <div>
              <strong className="text-[11px] text-slate-800 block mb-1">อาการสำคัญแรกรับ (Clinical Symptoms):</strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div>[{investigation.symptoms.chronicCough ? ' ✓ ' : ' '}] ไอเรื้อรัง {investigation.symptoms.chronicCough ? `(${investigation.symptoms.coughDurationWeeks || 2} สัปดาห์)` : ''}</div>
                <div>[{investigation.symptoms.coughBlood ? ' ✓ ' : ' '}] ไอเป็นเลือด (Hemoptysis)</div>
                <div>[{investigation.symptoms.fever ? ' ✓ ' : ' '}] มีไข้ / ตัวร้อน</div>
                <div>[{investigation.symptoms.nightSweats ? ' ✓ ' : ' '}] เหงื่อออกตอนกลางคืน</div>
                <div>[{investigation.symptoms.weightLoss ? ' ✓ ' : ' '}] น้ำหนักลด / เบื่ออาหาร</div>
                <div>[{investigation.symptoms.chestPain ? ' ✓ ' : ' '}] เจ็บแน่นหน้าอก</div>
                <div>[{investigation.symptoms.fatigue ? ' ✓ ' : ' '}] อ่อนเพลีย เหนื่อยง่าย</div>
              </div>
            </div>
          </div>

          {/* Section 3: Diagnostic & Laboratory Results */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm">
              3. ผลตรวจทางห้องปฏิบัติการและภาพถ่ายรังสีทรวงอก (Diagnostic & Lab Findings)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="space-y-1">
                <div><strong>ประเภทวัณโรค:</strong> {patient.tbClassification || 'Pulmonary (Bacteriologically Confirmed)'}</div>
                <div><strong>ผลตรวจเสมหะ (AFB Smear):</strong> <span className="font-bold text-slate-900">{investigation.afbSmearResult || 'Negative'}</span></div>
                <div><strong>ผลตรวจโมเลกุล (GeneXpert MTB/RIF):</strong> {investigation.geneXpertResult || 'Not done'}</div>
                <div><strong>ผลการเพาะเชื้อ (Culture MTB):</strong> {investigation.cultureResult || 'รอผล / ไม่ได้ส่งตรวจ'}</div>
              </div>

              <div className="space-y-1">
                <div><strong>ผลตรวจภาพรังสีทรวงอก (CXR แรกรับ):</strong> {investigation.initialCxrResult || 'Infiltration / Cavitary lesion'}</div>
                <div><strong>วันที่ตรวจ CXR:</strong> {investigation.initialCxrDate ? new Date(investigation.initialCxrDate).toLocaleDateString('th-TH') : '-'}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Risk Factors & Environment */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm">
              4. ปัจจัยเสี่ยง ประวัติเดิม และสภาพแวดล้อมที่อยู่อาศัย (Risk Factors & Living Environment)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="space-y-1">
                <div>
                  <strong>โรคร่วม / ปัจจัยเสี่ยง:</strong>{' '}
                  {[
                    investigation.comorbidities.diabetes && 'โรคเบาหวาน (DM)',
                    investigation.comorbidities.ckd && 'โรคไตเรื้อรัง (CKD)',
                    investigation.comorbidities.smoking && 'สูบบุหรี่',
                    investigation.comorbidities.alcohol && 'ดื่มสุรา',
                    investigation.comorbidities.substanceAbuse && 'สารเสพติด',
                    !investigation.comorbidities.diabetes && !investigation.comorbidities.ckd && !investigation.comorbidities.smoking && !investigation.comorbidities.alcohol && 'ไม่มีโรคร่วมสำคัญ'
                  ].filter(Boolean).join(', ')}
                </div>
                <div>
                  <strong>ประวัติเคยเป็นวัณโรค:</strong>{' '}
                  {investigation.comorbidities.previousTbHistory === 'yes_cured' ? 'เคยเป็นและรักษาครบ' : investigation.comorbidities.previousTbHistory === 'yes_relapse' ? 'กลับเป็นซ้ำ' : investigation.comorbidities.previousTbHistory === 'yes_defaulted' ? 'เคยขาดยา' : 'ไม่เคยเป็นมาก่อน (ผู้ป่วยรายใหม่)'}
                </div>
              </div>

              <div className="space-y-1">
                <div><strong>ลักษณะที่อยู่อาศัย:</strong> {investigation.livingConditions.homeType}</div>
                <div><strong>สภาพการระบายอากาศ:</strong> {investigation.livingConditions.ventilation}</div>
                <div><strong>จำนวนผู้อาศัยในบ้านทั้งหมด:</strong> {investigation.livingConditions.totalResidents} คน</div>
              </div>
            </div>
          </div>

          {/* Section 5: Contact Investigation & Screening Plan */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm flex items-center justify-between">
              <span>5. ผลการค้นหาและจำแนกกลุ่มผู้สัมผัสโรค (Contact Investigation & Screening Plan)</span>
              <span className="text-[10px] text-slate-600 font-normal">อ้างอิงเกณฑ์กรมควบคุมโรค 2563/2566</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <div className="font-bold text-emerald-950">
                  1. ผู้สัมผัสร่วมบ้าน (Household Contacts): <strong>{investigation.householdContactsCount} คน</strong>
                </div>
                <div className="text-slate-600 text-[10px] mt-0.5">
                  • เด็กอายุ &le; 5 ปี: <strong>{investigation.under5ContactsCount || 0} คน</strong> (เกณฑ์ IGRA / TPT)<br/>
                  • ผู้ใหญ่อายุ &gt; 5 ปี: <strong>{Math.max(0, investigation.householdContactsCount - (investigation.under5ContactsCount || 0))} คน</strong> (เกณฑ์ CXR 4 ครั้ง: 0, 6, 12, 18 ด.)
                </div>
              </div>

              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="font-bold text-blue-950">
                  2. ผู้สัมผัสนอกบ้าน/ใกล้ชิด (Non-household Contacts): <strong>{investigation.nonHouseholdContactsCount} คน</strong>
                </div>
                <div className="text-slate-600 text-[10px] mt-0.5">
                  • เกณฑ์สัมผัสสะสม &ge; 40-120 ชม. ในสถานที่ปิด (ที่ทำงาน/โรงเรียน)<br/>
                  • แผนการตรวจ: CXR แรกรับ และติดตามตามความเสี่ยง
                </div>
              </div>
            </div>

            {/* Contacts Table if recorded */}
            {contacts.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-slate-700 mb-1">รายชื่อผู้สัมผัสที่บันทึกในระบบ ({contacts.length} ราย):</div>
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
                    {contacts.map((c, idx) => (
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
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded-sm">
              6. การประเมินความเสี่ยง มาตรการควบคุมโรค และข้อเสนอแนะ (Risk Assessment & Control Measures)
            </div>

            <div className="space-y-2 text-[11px] pt-1 leading-relaxed">
              <div>
                <strong>การประเมินความเสี่ยงและแหล่งแพร่เชื้อ:</strong>
                <p className="text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-200 mt-0.5">
                  {investigation.riskAssessmentNotes || 'ผู้ป่วยมีเสมหะพบเชื้อ (Smear Positive) ถือเป็นแหล่งแพร่กระจายเชื้อ ควรกำชับให้สวมหน้ากากอนามัยและเร่งคัดกรองผู้สัมผัสร่วมบ้าน'}
                </p>
              </div>

              <div>
                <strong>มาตรการควบคุมโรคและการให้สุขศึกษา:</strong>
                <p className="text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-200 mt-0.5">
                  {investigation.controlMeasures || '1. แนะนำให้ผู้ป่วยแยกห้องนอน เปิดหน้าต่างระบายอากาศ\n2. สวมหน้ากากอนามัยตลอดเวลาจนกว่าจะทานยาครบ 2 สัปดาห์\n3. ติดตามผู้สัมผัสร่วมบ้านเข้ารับการตรวจ CXR 4 ครั้ง หรือ IGRA/TPT ตามเกณฑ์'}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 flex justify-end text-[11px] text-center border-t border-slate-300">
            <div className="space-y-6 w-80">
              <div>
                ลงชื่อ .................................................................... ผู้ทำการสอบสวนโรค
              </div>
              <div className="space-y-1">
                <div>(<strong>{investigation.investigatorName || '..........................................................'}</strong>)</div>
                <div className="text-slate-600">ตำแหน่ง: {investigation.investigatorPosition || 'พยาบาลวิชาชีพ / เจ้าหน้าที่สอบสวนโรค'}</div>
                <div className="text-slate-600">วันที่: {new Date(investigation.investigationDate).toLocaleDateString('th-TH')}</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
