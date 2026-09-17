import * as XLSX from 'xlsx';
import { Patient, ContactPerson, ContactFollowUp, DailyLog, InvestigationForm } from '../types';

/**
 * Helper to trigger browser download of a Blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format date for display
 */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Export Patients list to Excel (.xlsx)
 */
export function exportPatientsToExcel(patients: Patient[]) {
  const data = patients.map((p, idx) => ({
    'ลำดับ': idx + 1,
    'รหัสระบบ': p.id,
    'HN ผู้ป่วย': p.hn,
    'ชื่อ-สกุล': p.fullName,
    'เพศ': p.gender === 'male' ? 'ชาย' : p.gender === 'female' ? 'หญิง' : 'อื่นๆ',
    'อายุ (ปี)': p.age,
    'สิทธิการรักษา': p.treatmentRights || '-',
    'เบอร์โทรศัพท์': p.phone || '-',
    'อีเมล': p.email || '-',
    'ที่อยู่': p.address || '-',
    'สถานะการรักษา': p.status === 'active' ? 'กำลังรักษา' :
                     p.status === 'completed' ? 'รักษาครบกำหนด/หาย' :
                     p.status === 'transferred' ? 'ส่งต่อ' :
                     p.status === 'defaulted' ? 'ขาดการรักษา' : p.status,
    'ประเภทผู้ป่วย': p.patientType || '-',
    'การวินิจฉัย/ประเภทวัณโรค': p.tbType || '-',
    'ผลตรวจเสมหะ': p.sputumResult || '-',
    'ผลตรวจ GeneXpert': p.geneXpertResult || '-',
    'สูตรยารักษา': p.regimen || '-',
    'วันที่เริ่มยา': formatDate(p.treatmentStartDate),
    'วันที่ขึ้นทะเบียน NTIP': formatDate(p.ntipRegistrationDate),
    'แพทย์ผู้ดูแล': p.doctorName || '-',
    'โรงพยาบาล': p.hospitalName || 'รพ.มหาวิทยาลัยอุบลราชธานี',
    'แก้ไขล่าสุดโดย': p.lastUpdatedBy || '-',
    'วันที่แก้ไขล่าสุด': formatDate(p.updatedAt || p.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อผู้ป่วยวัณโรค');

  // Auto-fit column widths
  const maxProps = Object.keys(data[0] || {});
  worksheet['!cols'] = maxProps.map(key => ({ wch: Math.max(key.length * 2, 14) }));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const today = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `TB_Patients_List_${today}.xlsx`);
}

/**
 * Export Contacts / Risk Group list to Excel (.xlsx)
 */
export function exportContactsToExcel(contacts: ContactPerson[], followUps: ContactFollowUp[] = []) {
  const data = contacts.map((c, idx) => {
    const contactFollowUps = followUps.filter(f => f.contactId === c.id);
    return {
      'ลำดับ': idx + 1,
      'รหัสผู้สัมผัส': c.id,
      'HN ผู้สัมผัส': c.hn,
      'ชื่อ-สกุล ผู้สัมผัส': c.fullName,
      'ประเภทกลุ่มสัมผัส': c.contactType === 'household' ? 'กลุ่มร่วมบ้าน (Household)' : 'กลุ่มนอกบ้าน (Non-household)',
      'ความสัมพันธ์': c.relationship || '-',
      'เพศ': c.gender === 'male' ? 'ชาย' : c.gender === 'female' ? 'หญิง' : 'อื่นๆ',
      'อายุ (ปี)': c.age,
      'เกณฑ์การคัดกรอง': c.protocolType === 'cxr_4_times' ? 'อายุ > 5 ปี (CXR 4 ครั้ง)' : 'อายุ ≤ 5 ปี (IGRA / TPT)',
      'สิทธิการรักษา': c.treatmentRights || '-',
      'เบอร์โทรศัพท์': c.phone || '-',
      'อีเมล': c.email || '-',
      'ผู้ป่วยดัชนี (Index Case)': c.indexPatientName,
      'HN ผู้ป่วยดัชนี': c.indexPatientHN,
      'สถานะคีย์ N-tip': c.ntipStatus === 'entered' ? 'คีย์แล้ว' : 'ยังไม่ได้คีย์',
      'รหัสที่คีย์ใน n-tip': c.ntipKeyCode || '-',
      'หมายเหตุ N-tip': c.ntipNotes || '-',
      'ผล CXR ล่าสุด': c.cxrResult === 'normal' ? 'ปกติ (Normal)' :
                       c.cxrResult === 'abnormal_suspect_tb' ? 'ผิดปกติ สงสัยวัณโรค' :
                       c.cxrResult === 'abnormal_other' ? 'ผิดปกติอื่นๆ' :
                       c.cxrResult === 'pending' ? 'รอตรวจ/รอผล' : '-',
      'วันที่ตรวจ CXR': formatDate(c.cxrDate),
      'รายละเอียดผล CXR': c.cxrResultDetail || '-',
      'วันนัด CXR ครั้งถัดไป': formatDate(c.nextCxrDate),
      'สถานพยาบาลที่ตรวจ': c.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี',
      'ผลตรวจ IGRA (เด็กเล็ก)': c.igraResult || '-',
      'สูตรยาป้องกัน TPT': c.tptRegimen || '-',
      'สถานะการคัดกรอง': c.screeningStatus || '-',
      'จำนวนครั้งที่ตรวจแล้ว': contactFollowUps.length,
      'แก้ไขล่าสุดโดย': c.lastUpdatedBy || '-',
      'วันที่แก้ไขล่าสุด': formatDate(c.updatedAt || c.createdAt),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'กลุ่มสัมผัสและกลุ่มเสี่ยง');

  // Auto-fit column widths
  const maxProps = Object.keys(data[0] || {});
  worksheet['!cols'] = maxProps.map(key => ({ wch: Math.max(key.length * 2, 14) }));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const today = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `TB_Contacts_RiskGroup_${today}.xlsx`);
}

/**
 * Export All System Data (Multi-Sheet Workbook)
 */
export function exportAllDataToExcel(
  patients: Patient[],
  contacts: ContactPerson[],
  followUps: ContactFollowUp[],
  logs: DailyLog[],
  investigations: InvestigationForm[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Patients Sheet
  const patientData = patients.map((p, idx) => ({
    'ลำดับ': idx + 1,
    'HN': p.hn,
    'ชื่อ-สกุล': p.fullName,
    'อายุ': p.age,
    'เพศ': p.gender,
    'เบอร์โทร': p.phone,
    'สถานะ': p.status,
    'การวินิจฉัย': p.tbType,
    'ผลเสมหะ': p.sputumResult,
    'สูตรยา': p.regimen,
    'วันที่เริ่มยา': p.treatmentStartDate,
    'รหัส n-tip': p.ntipRegistrationDate,
    'แก้ไขโดย': p.lastUpdatedBy,
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientData);
  XLSX.utils.book_append_sheet(workbook, wsPatients, '1. รายชื่อผู้ป่วย');

  // 2. Contacts Sheet
  const contactData = contacts.map((c, idx) => ({
    'ลำดับ': idx + 1,
    'HN ผู้สัมผัส': c.hn,
    'ชื่อ-สกุล': c.fullName,
    'กลุ่ม': c.contactType === 'household' ? 'ร่วมบ้าน' : 'นอกบ้าน',
    'ความสัมพันธ์': c.relationship,
    'อายุ': c.age,
    'เบอร์โทร': c.phone,
    'อีเมล': c.email,
    'ผู้ป่วยดัชนี': c.indexPatientName,
    'HN ดัชนี': c.indexPatientHN,
    'รหัส NTIP': c.ntipKeyCode,
    'หมายเหตุ NTIP': c.ntipNotes,
    'ผล CXR ล่าสุด': c.cxrResult,
    'วันที่ CXR': c.cxrDate,
    'รายละเอียดผล': c.cxrResultDetail,
    'วันนัดถัดไป': c.nextCxrDate,
    'สถานพยาบาล': c.cxrHospital,
    'แก้ไขโดย': c.lastUpdatedBy,
  }));
  const wsContacts = XLSX.utils.json_to_sheet(contactData);
  XLSX.utils.book_append_sheet(workbook, wsContacts, '2. กลุ่มสัมผัสเสี่ยง');

  // 3. Follow-ups Sheet
  const followUpData = followUps.map((f, idx) => ({
    'ลำดับ': idx + 1,
    'ผู้สัมผัส': f.contactName,
    'HN ผู้สัมผัส': f.contactHN,
    'HN ผู้ป่วยดัชนี': f.indexPatientHN,
    'รอบ/ขั้นตอน': f.stepType,
    'วันที่นัด': f.scheduledDate,
    'วันที่ตรวจจริง': f.actualDate,
    'สถานะ': f.status,
    'ผลตรวจ': f.testResult,
    'รายละเอียด': f.resultDetail,
    'สูตร TPT': f.tptRegimen,
    'รหัส NTIP': f.ntipKeyCode,
    'หมายเหตุ NTIP': f.ntipNotes,
    'นัดครั้งถัดไป': f.nextAppointmentDate,
    'สถานพยาบาล': f.hospitalOrFacility,
    'ผู้บันทึก': f.recordedBy,
  }));
  const wsFollowUps = XLSX.utils.json_to_sheet(followUpData);
  XLSX.utils.book_append_sheet(workbook, wsFollowUps, '3. ประวัติตรวจติดตาม');

  // 4. Daily Logs Sheet
  const logsData = logs.map((l, idx) => ({
    'ลำดับ': idx + 1,
    'HN ผู้ป่วย': l.patientHN,
    'วันที่': l.date,
    'ทานยา': l.takenMedication ? 'ทานครบ' : 'ไม่ทาน/ลืม',
    'ตรงเวลา': l.takenOnTime ? 'ตรงเวลา' : 'ไม่ตรงเวลา',
    'ระดับอาการ': l.severityLevel,
    'อาการข้างเคียง': (l.sideEffects || []).join(', '),
    'บันทึกโดย': l.recordedBy,
    'หมายเหตุ': l.notes,
  }));
  const wsLogs = XLSX.utils.json_to_sheet(logsData);
  XLSX.utils.book_append_sheet(workbook, wsLogs, '4. บันทึกการทานยา (DOTS)');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const today = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `TB_Care_Full_Database_${today}.xlsx`);
}
