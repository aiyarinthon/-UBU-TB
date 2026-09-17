export interface Patient {
  id: string; // Patient code e.g. TB-2026-001
  hn: string; // Hospital Number (HN ผู้ป่วย)
  fullName: string;
  phone: string;
  email: string;
  nationalId?: string;
  ntipRegistrationDate: string; // วันขึ้นทะเบียนใน n-tip
  diagnosisDate: string; // วันที่เริ่มวินิจฉัย/รักษา
  age: number;
  gender: 'male' | 'female' | 'other';
  address: string;
  treatmentRights: string; // สิทธิการรักษา e.g. บัตรทอง (UC), ประกันสังคม, ข้าราชการ, จ่ายเอง, ต่างด้าว
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  treatmentCategory: 'Cat 1 (New)' | 'Cat 2 (Retreatment)' | 'MDR-TB' | 'Other';
  tbClassification: 'Pulmonary (Bacteriologically Confirmed)' | 'Pulmonary (Clinically Diagnosed)' | 'Extra-pulmonary';
  weightKg: number;
  treatmentRegimen: string; // e.g. 2HRZE/4HR
  doctorName: string;
  hospitalName: string;
  householdContactsCount: number; // จำนวนผู้สัมผัสร่วมบ้าน
  nonHouseholdContactsCount: number; // จำนวนผู้สัมผัสนอกบ้าน
  investigationStatus: 'pending' | 'completed'; // สถานะการสอบสวนโรค
  status: 'active' | 'completed' | 'transferred' | 'defaulted';
  notes?: string;
  lastUpdatedBy?: string; // ผู้แก้ไข/ปรับปรุงข้อมูลล่าสุด (ชื่อ-ตำแหน่งหรืออีเมล)
  updatedAt?: string; // วันเวลาที่แก้ไขล่าสุด
  createdAt: string;
}

export interface InvestigationForm {
  id: string; // INV-2026-001
  patientId: string;
  patientHN: string;
  patientName: string;
  investigationDate: string; // วันที่สอบสวนโรค
  investigatorName: string; // ผู้ทำการสอบสวนโรค
  investigatorPosition?: string; // ตำแหน่ง/หน่วยงาน
  occupation?: string; // อาชีพ / สถานที่ทำงาน
  symptomOnsetDate?: string; // วันที่เริ่มมีอาการ (Onset date)
  firstDoctorVisitDate?: string; // วันที่พบแพทย์ครั้งแรก
  infectiousPeriodStart?: string; // ช่วงเวลาแพร่เชื้อเริ่มต้น (ย้อนหลัง 3 เดือน)
  infectiousPeriodEnd?: string; // ช่วงเวลาแพร่เชื้อสิ้นสุด (2 สัปดาห์หลังเริ่มยา)
  tbClassification?: 'Pulmonary (Bacteriologically Confirmed)' | 'Pulmonary (Clinically Diagnosed)' | 'Extra-pulmonary';
  afbSmearResult: string; // ผล AFB: Negative, 1+, 2+, 3+, Scanty, Not done
  afbSmearDate?: string; // วันที่ตรวจเสมหะ AFB
  geneXpertResult: string; // ผล GeneXpert: MTB detected (Rif-S), MTB detected (Rif-R), Not detected, Not done
  geneXpertDate?: string; // วันที่ตรวจ GeneXpert
  cultureResult?: string; // ผลเพาะเชื้อ MTB (Culture): Positive, Negative, Pending, Not done
  initialCxrResult: string; // ผล CXR แรกรับ
  initialCxrDate: string; // วันที่ CXR แรกรับ
  symptoms: {
    chronicCough: boolean;
    coughDurationWeeks: number;
    coughBlood: boolean;
    fever: boolean;
    nightSweats: boolean;
    weightLoss: boolean;
    chestPain: boolean;
    fatigue: boolean;
  };
  comorbidities: {
    hiv: 'negative' | 'positive' | 'unknown' | 'not_tested';
    diabetes: boolean;
    ckd: boolean; // โรคไต
    smoking: boolean;
    alcohol: boolean;
    substanceAbuse?: boolean; // สารเสพติด
    previousTbHistory?: 'no' | 'yes_cured' | 'yes_relapse' | 'yes_defaulted'; // ประวัติเคยเป็นวัณโรค
    otherNotes?: string;
  };
  livingConditions: {
    homeType: 'บ้านเดี่ยว' | 'ทาวน์เฮาส์/ตึกแถว' | 'ห้องเช่า/อพาร์ตเมนต์' | 'แคมป์คนงาน/โรงงาน' | 'อื่นๆ';
    ventilation: 'ดี (โปร่ง ถ่ายเทดี)' | 'ปานกลาง' | 'แออัด/ปิดทึบ/การระบายอากาศไม่ดี';
    totalRooms: number;
    totalResidents: number;
  };
  householdContactsCount: number; // จำนวนผู้สัมผัสร่วมบ้านที่ประเมิน
  under5ContactsCount?: number; // จำนวนผู้สัมผัสเด็กอายุ <= 5 ปี
  nonHouseholdContactsCount: number; // จำนวนผู้สัมผัสนอกบ้านที่ประเมิน
  riskAssessmentNotes?: string; // การประเมินความเสี่ยง
  controlMeasures?: string; // มาตรการควบคุมโรคที่ดำเนินการ
  supervisorReviewerName?: string; // แพทย์ / ผู้ตรวจสอบรับรอง
  recordedAt: string;
}

export interface ContactPerson {
  id: string; // CT-2026-001
  indexPatientId: string; // รหัสผู้ป่วยดัชนี
  indexPatientHN: string; // HN ผู้ป่วยดัชนี
  indexPatientName: string; // ชื่อผู้ป่วยดัชนี
  contactType: 'household' | 'non_household'; // กลุ่มร่วมบ้าน (Household) หรือ กลุ่มนอกบ้าน (Non-household)
  relationship: string; // ความสัมพันธ์ เช่น คู่สมรส, บุตร, บิดา/มารดา, เพื่อนร่วมงาน, เพื่อนร่วมห้อง
  hn: string; // HN ผู้สัมผัสโรค
  fullName: string; // ชื่อ-สกุล ผู้สัมผัส
  gender: 'male' | 'female' | 'other'; // เพศ
  age: number; // อายุ
  treatmentRights: string; // สิทธิการรักษา (บัตรทอง/UC, ประกันสังคม, ข้าราชการ, จ่ายเอง, ต่างด้าว/อื่นๆ)
  phone: string; // เบอร์ติดต่อ
  email: string; // e-mail
  protocolType: 'cxr_4_times' | 'igra_tpt'; // เกณฑ์: อายุ > 5 ปี (CXR 4 ครั้ง ห่างกัน 6 ด.) vs อายุ <= 5 ปี (IGRA / TPT)
  ntipStatus: 'entered' | 'not_entered'; // ข้อมูลการคีย์ n-tip
  ntipKeyCode: string; // รหัสที่คีย์ใน n-tip (NTIP Key Code)
  ntipKeyDate?: string; // วันที่คีย์ n-tip
  ntipNotes?: string; // หมายเหตุการคีย์ N-tip
  
  // บันทึกตรวจและติดตามเอกซเรย์ปอด (CXR Follow-up)
  cxrStatus?: 'done' | 'pending' | 'not_done' | 'refused'; // สถานะการตรวจ CXR
  cxrRound?: 'cxr_1_0m' | 'cxr_2_6m' | 'cxr_3_12m' | 'cxr_4_18m' | 'symptom_check'; // ครั้งที่ตรวจ CXR
  cxrDate?: string; // วันที่ตรวจ CXR
  cxrResult?: 'normal' | 'abnormal_suspect_tb' | 'abnormal_other' | 'pending' | 'not_done'; // ผลการตรวจเอกซเรย์ปอด
  cxrResultDetail?: string; // รายละเอียดผลการอ่านฟิล์ม
  cxrHospital?: string; // สถานพยาบาลที่ตรวจ
  nextCxrDate?: string; // วันนัดตรวจ CXR ครั้งถัดไป
  
  // กรณีอายุ <= 5 ปี (IGRA & TPT)
  igraResult?: 'positive' | 'negative' | 'indeterminate' | 'pending' | 'not_done';
  igraDate?: string;
  tptRegimen?: '3HP' | '1HP' | '6H' | 'none' | 'refused';
  tptStatus?: 'on_tpt' | 'completed' | 'not_started' | 'refused';

  screeningStatus: 'pending_screening' | 'screened_normal' | 'abnormal_investigating' | 'confirmed_tb' | 'on_tpt';
  notes?: string;
  lastUpdatedBy?: string; // ผู้แก้ไข/ปรับปรุงข้อมูลล่าสุด
  updatedAt?: string; // วันเวลาที่แก้ไขล่าสุด
  createdAt: string;
}

export interface ContactFollowUp {
  id: string;
  contactId: string;
  indexPatientHN: string;
  contactHN: string;
  contactName: string;
  contactAge: number;
  stepType: 
    | 'cxr_1_0m' // CXR ครั้งที่ 1 (แรกรับ/0 เดือน)
    | 'cxr_2_6m' // CXR ครั้งที่ 2 (6 เดือน)
    | 'cxr_3_12m' // CXR ครั้งที่ 3 (12 เดือน)
    | 'cxr_4_18m' // CXR ครั้งที่ 4 (18 เดือน)
    | 'igra_test' // ส่งตรวจ IGRA / TST (อายุ <= 5 ปี)
    | 'tpt_assessment' // การประเมินรับยาป้องกัน TPT
    | 'symptom_check'; // ตรวจติดตามอาการ
  scheduledDate: string; // วันที่นัดตรวจ
  actualDate?: string; // วันที่มาตรวจจริง
  status: 'scheduled' | 'completed' | 'missed' | 'delayed';
  testResult?: 'normal' | 'abnormal_suspect_tb' | 'igra_positive' | 'igra_negative' | 'indeterminate' | 'pending';
  resultDetail?: string; // รายละเอียดผลตรวจ เช่น ฟิล์มปอดปกติ / ผล IGRA 0.45 IU/ml
  tptRegimen?: '3HP' | '1HP' | '6H' | 'none' | 'refused'; // สูตรยาป้องกันวัณโรค
  hospitalOrFacility?: string; // สถานพยาบาลที่ตรวจ
  ntipKeyCode?: string; // รหัสที่คีย์ใน n-tip
  ntipNotes?: string; // หมายเหตุการคีย์ N-tip
  nextAppointmentDate?: string; // วันนัดตรวจครั้งถัดไป
  recordedBy: string;
  notes?: string;
}

export interface DailyLog {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  takenMedication: boolean;
  medicationTime?: string; // HH:mm
  supervisorType: 'self' | 'family' | 'health_worker' | 'vhv'; // VHV = อสม. (DOTS supervisor)
  supervisorName?: string;
  symptoms: {
    cough: boolean;
    coughBlood: boolean;
    fever: boolean;
    nightSweats: boolean;
    weightLoss: boolean;
    chestPain: boolean;
    fatigue: boolean;
    nauseaVomiting: boolean;
    rashItch: boolean;
    yellowSkinEyes: boolean; // jaundice
    jointPain: boolean;
    visionChanges: boolean;
    numbnessHandsFeet: boolean;
  };
  sideEffectsNotes?: string;
  severityLevel: 'normal' | 'mild' | 'moderate' | 'severe';
  patientMood?: 'good' | 'neutral' | 'poor';
  recordedBy: string;
  recordedAt: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetName: string;
}

export type UserRole = 'admin' | 'staff' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  position: string; // เช่น 'นักวิชาการสาธารณสุข', 'พยาบาลวิชาชีพ', 'แพทย์ผู้เชี่ยวชาญ'
  department: string; // เช่น 'กลุ่มงานเวชกรรมสังคม / รพ.มหาวิทยาลัยอุบลราชธานี'
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  role: UserRole;
  isActive: boolean;
  lastActive?: string;
}
