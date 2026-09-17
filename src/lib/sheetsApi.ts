import { Patient, InvestigationForm, ContactPerson, ContactFollowUp, DailyLog } from '../types';

export const PATIENTS_SHEET_NAME = 'ผู้ป่วยวัณโรครายใหม่ (Patients)';
export const INVESTIGATION_SHEET_NAME = 'การสอบสวนโรค (Investigation)';
export const CONTACTS_SHEET_NAME = 'กลุ่มผู้สัมผัสโรค (Contacts)';
export const FOLLOW_UPS_SHEET_NAME = 'บันทึกการติดตามตรวจ (Follow-ups)';
export const DAILY_LOGS_SHEET_NAME = 'บันทึกอาการและยา (Daily Logs)';

export function formatRange(sheetName: string, cellRange?: string): string {
  const fullRange = cellRange ? `'${sheetName}'!${cellRange}` : `'${sheetName}'`;
  return encodeURIComponent(fullRange);
}

export const PATIENT_HEADERS = [
  'รหัสผู้ป่วย (ID)',
  'HN',
  'ชื่อ-นามสกุล',
  'เบอร์ติดต่อ',
  'Email',
  'วันขึ้นทะเบียนใน n-tip',
  'วันที่เริ่มวินิจฉัย/รักษา',
  'อายุ',
  'เพศ',
  'เลขประจำตัวประชาชน',
  'สิทธิการรักษา',
  'ที่อยู่',
  'ผู้ติดต่อฉุกเฉิน (ชื่อ-เบอร์)',
  'กลุ่มการรักษา (Category)',
  'การจำแนกโรค (Classification)',
  'น้ำหนัก (กก.)',
  'สูตรยาที่ได้รับ (Regimen)',
  'แพทย์ผู้ดูแล',
  'โรงพยาบาล/สถานพยาบาล',
  'จำนวนผู้สัมผัสร่วมบ้าน',
  'จำนวนผู้สัมผัสนอกบ้าน',
  'สถานะการสอบสวนโรค',
  'สถานะการรักษา',
  'หมายเหตุเพิ่มเติม',
  'วันที่สร้างข้อมูล',
  'แก้ไขล่าสุดโดย (Last Updated By)',
  'วันที่แก้ไขล่าสุด (Updated At)'
];

export const INVESTIGATION_HEADERS = [
  'รหัสการสอบสวน (ID)',
  'รหัสผู้ป่วย (Patient ID)',
  'HN ผู้ป่วย',
  'ชื่อ-สกุล ผู้ป่วย',
  'วันที่สอบสวนโรค',
  'ผู้ทำการสอบสวนโรค',
  'ตำแหน่ง/หน่วยงาน',
  'อาชีพ/สถานที่ทำงาน',
  'วันที่เริ่มมีอาการ',
  'ช่วงเวลาแพร่เชื้อเริ่มต้น',
  'ช่วงเวลาแพร่เชื้อสิ้นสุด',
  'การจำแนกประเภทวัณโรค',
  'ผลตรวจเสมหะ (AFB Smear)',
  'วันที่ตรวจ AFB',
  'ผลตรวจโมเลกุล (GeneXpert)',
  'วันที่ตรวจ GeneXpert',
  'ผลการเพาะเชื้อ (Culture MTB)',
  'ผล CXR แรกรับ',
  'วันที่ CXR แรกรับ',
  'ไอเรื้อรัง (สัปดาห์)',
  'ไอเป็นเลือด',
  'มีไข้',
  'เหงื่อออกกลางคืน',
  'น้ำหนักลด',
  'เจ็บหน้าอก',
  'อ่อนเพลีย',
  'ผลตรวจ HIV',
  'เบาหวาน',
  'โรคไตเรื้อรัง',
  'สูบบุหรี่',
  'ดื่มแอลกอฮอล์',
  'ประวัติสารเสพติด',
  'ประวัติเคยรักษาวัณโรค',
  'ลักษณะที่อยู่อาศัย',
  'การระบายอากาศ',
  'จำนวนผู้อาศัยรวม (คน)',
  'จำนวนผู้สัมผัสร่วมบ้านที่ระบุ',
  'จำนวนเด็กอายุ <= 5 ปี (ร่วมบ้าน)',
  'จำนวนผู้สัมผัสนอกบ้านที่ระบุ',
  'การประเมินความเสี่ยง',
  'มาตรการควบคุมโรค',
  'แพทย์/ผู้บังคับบัญชาผู้ตรวจรับรอง',
  'วันที่บันทึก'
];

export const CONTACT_HEADERS = [
  'รหัสผู้สัมผัส (ID)',
  'รหัสผู้ป่วยดัชนี (Index ID)',
  'HN ผู้ป่วยดัชนี',
  'ชื่อผู้ป่วยดัชนี',
  'กลุ่มผู้สัมผัส (ร่วมบ้าน/นอกบ้าน)',
  'ความสัมพันธ์กับผู้ป่วย',
  'HN ผู้สัมผัส',
  'ชื่อ-นามสกุล ผู้สัมผัส',
  'เพศ',
  'อายุ (ปี)',
  'สิทธิการรักษา',
  'เบอร์ติดต่อ',
  'Email',
  'เกณฑ์การติดตาม (Protocol)',
  'สถานะการคีย์ n-tip',
  'รหัสที่คีย์ใน n-tip (NTIP Code)',
  'วันที่คีย์ใน n-tip',
  'สถานะการตรวจคัดกรอง',
  'หมายเหตุ',
  'วันที่สร้างข้อมูล',
  'แก้ไขล่าสุดโดย (Last Updated By)',
  'วันที่แก้ไขล่าสุด (Updated At)',
  'หมายเหตุการคีย์ n-tip (NTIP Notes)',
  'สถานะการตรวจ CXR',
  'ครั้งที่ตรวจ CXR',
  'วันที่ตรวจ CXR',
  'ผลตรวจเอกซเรย์ปอด (CXR Result)',
  'รายละเอียดผลตรวจ CXR',
  'สถานพยาบาลที่ตรวจ CXR',
  'วันนัดตรวจ CXR ครั้งถัดไป'
];

export const FOLLOW_UP_HEADERS = [
  'รหัสติดตาม (ID)',
  'รหัสผู้สัมผัส (Contact ID)',
  'HN ผู้ป่วยดัชนี',
  'HN ผู้สัมผัส',
  'ชื่อผู้สัมผัส',
  'อายุผู้สัมผัส',
  'ขั้นตอนการตรวจ/ติดตาม',
  'วันที่นัดตรวจ',
  'วันที่ตรวจจริง',
  'สถานะการติดตาม',
  'ผลการตรวจ',
  'รายละเอียดผลตรวจ',
  'สูตรยาป้องกัน (TPT)',
  'สถานพยาบาลที่ตรวจ',
  'ผู้บันทึกข้อมูล',
  'หมายเหตุ'
];

export const DAILY_LOG_HEADERS = [
  'รหัสบันทึก (Log ID)',
  'รหัสผู้ป่วย (Patient ID)',
  'วันที่บันทึก (Date)',
  'ทานยาแล้วหรือไม่ (Taken)',
  'เวลาที่ทานยา (Time)',
  'ผู้กำกับการทานยา (DOTS Supervisor)',
  'ชื่อผู้กำกับยา',
  'อาการไอปกติ',
  'ไอเป็นเลือด (Hemoptysis)',
  'มีไข้ (Fever)',
  'เหงื่อออกตอนกลางคืน',
  'น้ำหนักลด',
  'เจ็บหน้าอก',
  'อ่อนเพลีย/เหนื่อยง่าย',
  'คลื่นไส้/อาเจียน',
  'ผื่นคันตามผิวหนัง',
  'ตาเหลือง/ตัวเหลือง (Jaundice)',
  'ปวดข้อ/กล้ามเนื้อ',
  'ตามัว/การมองเห็นผิดปกติ',
  'ชาปลายมือปลายเท้า',
  'ระดับความรุนแรง (Severity)',
  'อาการข้างเคียง/บันทึกเพิ่มเติม',
  'สภาวะอารมณ์',
  'ผู้บันทึกข้อมูล',
  'เวลาที่บันทึกระบบ'
];

export async function createTBSheet(accessToken: string, customTitle?: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const title = customTitle || `ระบบสอบสวนและติดตามกลุ่มเสี่ยงวัณโรคปอด โรงพยาบาลมหาวิทยาลัยอุบลราชธานี - ${new Date().toLocaleDateString('th-TH')}`;
  
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: PATIENTS_SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
            tabColor: { red: 0.1, green: 0.5, blue: 0.9 },
          },
        },
        {
          properties: {
            title: INVESTIGATION_SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
            tabColor: { red: 0.9, green: 0.4, blue: 0.1 },
          },
        },
        {
          properties: {
            title: CONTACTS_SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
            tabColor: { red: 0.6, green: 0.2, blue: 0.8 },
          },
        },
        {
          properties: {
            title: FOLLOW_UPS_SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
            tabColor: { red: 0.2, green: 0.7, blue: 0.6 },
          },
        },
        {
          properties: {
            title: DAILY_LOGS_SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
            tabColor: { red: 0.1, green: 0.7, blue: 0.3 },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await createResponse.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Insert initial headers for all sheets
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `'${PATIENTS_SHEET_NAME}'!A1:Y1`,
          values: [PATIENT_HEADERS],
        },
        {
          range: `'${INVESTIGATION_SHEET_NAME}'!A1:AQ1`,
          values: [INVESTIGATION_HEADERS],
        },
        {
          range: `'${CONTACTS_SHEET_NAME}'!A1:T1`,
          values: [CONTACT_HEADERS],
        },
        {
          range: `'${FOLLOW_UPS_SHEET_NAME}'!A1:P1`,
          values: [FOLLOW_UP_HEADERS],
        },
        {
          range: `'${DAILY_LOGS_SHEET_NAME}'!A1:Y1`,
          values: [DAILY_LOG_HEADERS],
        },
      ],
    }),
  });

  return { spreadsheetId, spreadsheetUrl, title };
}

export async function verifyAndInitSheets(accessToken: string, spreadsheetId: string): Promise<boolean> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('ไม่สามารถเข้าถึง Google Sheet นี้ได้ กรุณาตรวจสอบสิทธิ์หรือ ID');
  }

  const meta = await res.json();
  const existingSheets: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

  const missingSheets: { title: string; color: any; headers: string[]; range: string }[] = [];
  
  if (!existingSheets.includes(PATIENTS_SHEET_NAME)) {
    missingSheets.push({
      title: PATIENTS_SHEET_NAME,
      color: { red: 0.1, green: 0.5, blue: 0.9 },
      headers: PATIENT_HEADERS,
      range: `'${PATIENTS_SHEET_NAME}'!A1:AA1`,
    });
  }
  if (!existingSheets.includes(INVESTIGATION_SHEET_NAME)) {
    missingSheets.push({
      title: INVESTIGATION_SHEET_NAME,
      color: { red: 0.9, green: 0.4, blue: 0.1 },
      headers: INVESTIGATION_HEADERS,
      range: `'${INVESTIGATION_SHEET_NAME}'!A1:AQ1`,
    });
  }
  if (!existingSheets.includes(CONTACTS_SHEET_NAME)) {
    missingSheets.push({
      title: CONTACTS_SHEET_NAME,
      color: { red: 0.6, green: 0.2, blue: 0.8 },
      headers: CONTACT_HEADERS,
      range: `'${CONTACTS_SHEET_NAME}'!A1:V1`,
    });
  }
  if (!existingSheets.includes(FOLLOW_UPS_SHEET_NAME)) {
    missingSheets.push({
      title: FOLLOW_UPS_SHEET_NAME,
      color: { red: 0.2, green: 0.7, blue: 0.6 },
      headers: FOLLOW_UP_HEADERS,
      range: `'${FOLLOW_UPS_SHEET_NAME}'!A1:P1`,
    });
  }
  if (!existingSheets.includes(DAILY_LOGS_SHEET_NAME)) {
    missingSheets.push({
      title: DAILY_LOGS_SHEET_NAME,
      color: { red: 0.1, green: 0.7, blue: 0.3 },
      headers: DAILY_LOG_HEADERS,
      range: `'${DAILY_LOGS_SHEET_NAME}'!A1:Y1`,
    });
  }

  if (missingSheets.length > 0) {
    const requests = missingSheets.map(s => ({
      addSheet: {
        properties: {
          title: s.title,
          gridProperties: { frozenRowCount: 1 },
          tabColor: s.color,
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    const valueUpdates = missingSheets.map(s => ({
      range: s.range,
      values: [s.headers],
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueUpdates,
      }),
    });
  }

  return true;
}

// Helper to wrap API calls with auto-initialize on missing sheet tab
async function executeSheetWriteWithAutoInit(
  accessToken: string,
  spreadsheetId: string,
  fn: () => Promise<Response>
): Promise<Response> {
  let res = await fn();
  if (!res.ok) {
    const errData = await res.clone().json().catch(() => ({}));
    const errMsg = errData.error?.message || '';
    if (errMsg.includes('Unable to parse range') || errMsg.includes('not found') || res.status === 400) {
      try {
        await verifyAndInitSheets(accessToken, spreadsheetId);
        res = await fn();
      } catch (retryErr) {
        console.error('Auto-init retry failed:', retryErr);
      }
    }
  }
  return res;
}

// ------------------- PATIENT OPERATIONS -------------------

export async function fetchAllPatients(accessToken: string, spreadsheetId: string): Promise<Patient[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(PATIENTS_SHEET_NAME, 'A2:AA5000')}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[]): Patient => {
    const emergencyRaw = row[12] || '';
    const [emName, emPhone] = emergencyRaw.split(' - ');

    return {
      id: row[0] || '',
      hn: row[1] || '',
      fullName: row[2] || '',
      phone: row[3] || '',
      email: row[4] || '',
      ntipRegistrationDate: row[5] || '',
      diagnosisDate: row[6] || '',
      age: Number(row[7]) || 0,
      gender: (row[8] === 'หญิง' || row[8] === 'female' ? 'female' : row[8] === 'อื่นๆ' ? 'other' : 'male'),
      nationalId: row[9] || '',
      treatmentRights: row[10] || 'บัตรทอง (UC)',
      address: row[11] || '',
      emergencyContact: {
        name: emName || emergencyRaw,
        relationship: 'ผู้ติดต่อฉุกเฉิน',
        phone: emPhone || '',
      },
      treatmentCategory: (row[13] as any) || 'Cat 1 (New)',
      tbClassification: (row[14] as any) || 'Pulmonary (Bacteriologically Confirmed)',
      weightKg: Number(row[15]) || 0,
      treatmentRegimen: row[16] || '2HRZE/4HR',
      doctorName: row[17] || '',
      hospitalName: row[18] || '',
      householdContactsCount: Number(row[19]) || 0,
      nonHouseholdContactsCount: Number(row[20]) || 0,
      investigationStatus: (row[21] as any) || 'pending',
      status: (row[22] as any) || 'active',
      notes: row[23] || '',
      createdAt: row[24] || new Date().toISOString(),
      lastUpdatedBy: row[25] || '',
      updatedAt: row[26] || row[24] || '',
    };
  }).filter((p: Patient) => p.id && p.fullName);
}

export async function appendPatientToSheet(accessToken: string, spreadsheetId: string, patient: Patient): Promise<void> {
  const genderMap: Record<string, string> = { male: 'ชาย', female: 'หญิง', other: 'อื่นๆ' };
  const values = [
    [
      patient.id,
      patient.hn,
      patient.fullName,
      patient.phone,
      patient.email,
      patient.ntipRegistrationDate,
      patient.diagnosisDate,
      patient.age,
      genderMap[patient.gender] || patient.gender,
      patient.nationalId || '',
      patient.treatmentRights || '',
      patient.address,
      `${patient.emergencyContact?.name || ''} - ${patient.emergencyContact?.phone || ''}`,
      patient.treatmentCategory,
      patient.tbClassification,
      patient.weightKg,
      patient.treatmentRegimen,
      patient.doctorName,
      patient.hospitalName,
      patient.householdContactsCount || 0,
      patient.nonHouseholdContactsCount || 0,
      patient.investigationStatus || 'pending',
      patient.status,
      patient.notes || '',
      patient.createdAt || new Date().toISOString(),
      patient.lastUpdatedBy || '',
      patient.updatedAt || new Date().toISOString(),
    ],
  ];

  const doAppend = () => fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(PATIENTS_SHEET_NAME, 'A1')}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  const res = await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doAppend);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถบันทึกข้อมูลผู้ป่วยลงใน Google Sheet ได้');
  }
}

export async function updatePatientInSheet(accessToken: string, spreadsheetId: string, patient: Patient): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(PATIENTS_SHEET_NAME, 'A:A')}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    await verifyAndInitSheets(accessToken, spreadsheetId);
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }
  if (!res.ok) throw new Error('ไม่สามารถค้นหาแถวข้อมูลผู้ป่วยได้');
  
  const data = await res.json();
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r: string[]) => r[0] === patient.id);

  if (rowIndex === -1) {
    return appendPatientToSheet(accessToken, spreadsheetId, patient);
  }

  const sheetRowNum = rowIndex + 1;
  const genderMap: Record<string, string> = { male: 'ชาย', female: 'หญิง', other: 'อื่นๆ' };
  const values = [
    [
      patient.id,
      patient.hn,
      patient.fullName,
      patient.phone,
      patient.email,
      patient.ntipRegistrationDate,
      patient.diagnosisDate,
      patient.age,
      genderMap[patient.gender] || patient.gender,
      patient.nationalId || '',
      patient.treatmentRights || '',
      patient.address,
      `${patient.emergencyContact?.name || ''} - ${patient.emergencyContact?.phone || ''}`,
      patient.treatmentCategory,
      patient.tbClassification,
      patient.weightKg,
      patient.treatmentRegimen,
      patient.doctorName,
      patient.hospitalName,
      patient.householdContactsCount || 0,
      patient.nonHouseholdContactsCount || 0,
      patient.investigationStatus || 'pending',
      patient.status,
      patient.notes || '',
      patient.createdAt,
      patient.lastUpdatedBy || '',
      patient.updatedAt || new Date().toISOString(),
    ],
  ];

  const doUpdate = () => fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(PATIENTS_SHEET_NAME, `A${sheetRowNum}:AA${sheetRowNum}`)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  const updateRes = await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doUpdate);

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถอัปเดตข้อมูลผู้ป่วยใน Google Sheet ได้');
  }
}

// ------------------- INVESTIGATION OPERATIONS -------------------

export async function fetchAllInvestigations(accessToken: string, spreadsheetId: string): Promise<InvestigationForm[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(INVESTIGATION_SHEET_NAME, 'A2:AQ5000')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[]): InvestigationForm => {
    return {
      id: row[0] || '',
      patientId: row[1] || '',
      patientHN: row[2] || '',
      patientName: row[3] || '',
      investigationDate: row[4] || '',
      investigatorName: row[5] || '',
      investigatorPosition: row[6] || '',
      occupation: row[7] || '',
      symptomOnsetDate: row[8] || '',
      infectiousPeriodStart: row[9] || '',
      infectiousPeriodEnd: row[10] || '',
      tbClassification: (row[11] as any) || 'Pulmonary',
      afbSmearResult: row[12] || '',
      afbSmearDate: row[13] || '',
      geneXpertResult: row[14] || '',
      geneXpertDate: row[15] || '',
      cultureResult: row[16] || '',
      initialCxrResult: row[17] || '',
      initialCxrDate: row[18] || '',
      symptoms: {
        chronicCough: row[19] ? Number(row[19]) > 0 : false,
        coughDurationWeeks: Number(row[19]) || 0,
        coughBlood: row[20] === 'มี' || row[20] === 'TRUE',
        fever: row[21] === 'มี' || row[21] === 'TRUE',
        nightSweats: row[22] === 'มี' || row[22] === 'TRUE',
        weightLoss: row[23] === 'มี' || row[23] === 'TRUE',
        chestPain: row[24] === 'มี' || row[24] === 'TRUE',
        fatigue: row[25] === 'มี' || row[25] === 'TRUE',
      },
      comorbidities: {
        hiv: (row[26] === 'ผลบวก (+)' ? 'positive' : row[26] === 'ผลลบ (-)' ? 'negative' : 'unknown') as any,
        diabetes: row[27] === 'มี' || row[27] === 'TRUE',
        ckd: row[28] === 'มี' || row[28] === 'TRUE',
        smoking: row[29] === 'สูบ' || row[29] === 'TRUE',
        alcohol: row[30] === 'ดื่ม' || row[30] === 'TRUE',
        substanceAbuse: row[31] === 'มี' || row[31] === 'TRUE',
        previousTbHistory: (row[32] === 'เคย' || row[32] === 'yes_cured' ? 'yes_cured' : 'no') as any,
      },
      livingConditions: {
        homeType: (row[33] || 'บ้านเดี่ยว') as any,
        ventilation: (row[34] || 'ดี (โปร่ง ถ่ายเทดี)') as any,
        totalRooms: 1,
        totalResidents: Number(row[35]) || 1,
      },
      householdContactsCount: Number(row[36]) || 0,
      under5ContactsCount: Number(row[37]) || 0,
      nonHouseholdContactsCount: Number(row[38]) || 0,
      riskAssessmentNotes: row[39] || '',
      controlMeasures: row[40] || '',
      supervisorReviewerName: row[41] || '',
      recordedAt: row[42] || '',
    };
  }).filter(inv => inv.id && inv.patientId);
}

export async function saveInvestigationToSheet(accessToken: string, spreadsheetId: string, inv: InvestigationForm): Promise<void> {
  const hivLabel = inv.comorbidities.hiv === 'positive' ? 'ผลบวก (+)' : inv.comorbidities.hiv === 'negative' ? 'ผลลบ (-)' : 'ไม่ระบุ/ไม่ได้ตรวจ';
  const prevTbLabel = inv.comorbidities.previousTbHistory && inv.comorbidities.previousTbHistory !== 'no' ? 'เคย' : 'ไม่เคย';
  const values = [
    [
      inv.id,
      inv.patientId,
      inv.patientHN,
      inv.patientName,
      inv.investigationDate,
      inv.investigatorName,
      inv.investigatorPosition || '',
      inv.occupation || '',
      inv.symptomOnsetDate || '',
      inv.infectiousPeriodStart || '',
      inv.infectiousPeriodEnd || '',
      inv.tbClassification || '',
      inv.afbSmearResult,
      inv.afbSmearDate || '',
      inv.geneXpertResult,
      inv.geneXpertDate || '',
      inv.cultureResult || '',
      inv.initialCxrResult,
      inv.initialCxrDate || '',
      inv.symptoms.chronicCough ? inv.symptoms.coughDurationWeeks : 0,
      inv.symptoms.coughBlood ? 'มี' : 'ไม่มี',
      inv.symptoms.fever ? 'มี' : 'ไม่มี',
      inv.symptoms.nightSweats ? 'มี' : 'ไม่มี',
      inv.symptoms.weightLoss ? 'มี' : 'ไม่มี',
      inv.symptoms.chestPain ? 'มี' : 'ไม่มี',
      inv.symptoms.fatigue ? 'มี' : 'ไม่มี',
      hivLabel,
      inv.comorbidities.diabetes ? 'มี' : 'ไม่มี',
      inv.comorbidities.ckd ? 'มี' : 'ไม่มี',
      inv.comorbidities.smoking ? 'สูบ' : 'ไม่สูบ',
      inv.comorbidities.alcohol ? 'ดื่ม' : 'ไม่ดื่ม',
      inv.comorbidities.substanceAbuse ? 'มี' : 'ไม่มี',
      prevTbLabel,
      inv.livingConditions.homeType,
      inv.livingConditions.ventilation,
      inv.livingConditions.totalResidents,
      inv.householdContactsCount,
      inv.under5ContactsCount || 0,
      inv.nonHouseholdContactsCount,
      inv.riskAssessmentNotes || '',
      inv.controlMeasures || '',
      inv.supervisorReviewerName || '',
      inv.recordedAt || new Date().toISOString(),
    ],
  ];

  // Check if exists
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(INVESTIGATION_SHEET_NAME, 'A:A')}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    await verifyAndInitSheets(accessToken, spreadsheetId);
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }

  const data = await res.json().catch(() => ({}));
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r: string[]) => r[0] === inv.id || (r[1] === inv.patientId));

  if (rowIndex === -1) {
    // Append
    const doAppend = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(INVESTIGATION_SHEET_NAME, 'A1')}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doAppend);
  } else {
    // Update
    const sheetRowNum = rowIndex + 1;
    const doUpdate = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(INVESTIGATION_SHEET_NAME, `A${sheetRowNum}:AQ${sheetRowNum}`)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doUpdate);
  }
}

// ------------------- CONTACT PERSONS OPERATIONS -------------------

export async function fetchAllContacts(accessToken: string, spreadsheetId: string): Promise<ContactPerson[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(CONTACTS_SHEET_NAME, 'A2:AD5000')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[]): ContactPerson => {
    const age = Number(row[9]) || 0;
    const protocol: 'cxr_4_times' | 'igra_tpt' = age > 5 ? 'cxr_4_times' : 'igra_tpt';
    const cType: 'household' | 'non_household' = (row[4]?.includes('นอกบ้าน') || row[4] === 'non_household') ? 'non_household' : 'household';

    return {
      id: row[0] || '',
      indexPatientId: row[1] || '',
      indexPatientHN: row[2] || '',
      indexPatientName: row[3] || '',
      contactType: cType,
      relationship: row[5] || '',
      hn: row[6] || '',
      fullName: row[7] || '',
      gender: (row[8] === 'หญิง' || row[8] === 'female' ? 'female' : row[8] === 'อื่นๆ' ? 'other' : 'male'),
      age: age,
      treatmentRights: row[10] || 'บัตรทอง (UC)',
      phone: row[11] || '',
      email: row[12] || '',
      protocolType: protocol,
      ntipStatus: row[14] === 'คีย์แล้ว' || row[14] === 'entered' ? 'entered' : 'not_entered',
      ntipKeyCode: row[15] || '',
      ntipKeyDate: row[16] || '',
      screeningStatus: (row[17] as any) || 'pending_screening',
      notes: row[18] || '',
      createdAt: row[19] || '',
      lastUpdatedBy: row[20] || '',
      updatedAt: row[21] || row[19] || '',
      ntipNotes: row[22] || '',
      cxrStatus: (row[23] as any) || undefined,
      cxrRound: (row[24] as any) || undefined,
      cxrDate: row[25] || '',
      cxrResult: (row[26] as any) || undefined,
      cxrResultDetail: row[27] || '',
      cxrHospital: row[28] || '',
      nextCxrDate: row[29] || '',
    };
  }).filter(c => c.id && c.fullName);
}

export async function saveContactToSheet(accessToken: string, spreadsheetId: string, contact: ContactPerson): Promise<void> {
  const genderLabel = contact.gender === 'female' ? 'หญิง' : contact.gender === 'other' ? 'อื่นๆ' : 'ชาย';
  const typeLabel = contact.contactType === 'household' ? 'กลุ่มร่วมบ้าน (Household)' : 'กลุ่มนอกบ้าน (Non-household)';
  const protocolLabel = contact.age > 5 ? 'อายุ > 5 ปี: CXR 4 ครั้ง (0, 6, 12, 18 เดือน)' : 'อายุ ≤ 5 ปี: ตรวจ IGRA / ให้ยาป้องกัน TPT';
  const ntipLabel = contact.ntipStatus === 'entered' ? 'คีย์แล้ว' : 'ยังไม่ได้คีย์';

  const values = [
    [
      contact.id,
      contact.indexPatientId,
      contact.indexPatientHN,
      contact.indexPatientName,
      typeLabel,
      contact.relationship,
      contact.hn,
      contact.fullName,
      genderLabel,
      contact.age,
      contact.treatmentRights,
      contact.phone,
      contact.email,
      protocolLabel,
      ntipLabel,
      contact.ntipKeyCode || '',
      contact.ntipKeyDate || '',
      contact.screeningStatus,
      contact.notes || '',
      contact.createdAt || new Date().toISOString(),
      contact.lastUpdatedBy || '',
      contact.updatedAt || new Date().toISOString(),
      contact.ntipNotes || '',
      contact.cxrStatus || '',
      contact.cxrRound || '',
      contact.cxrDate || '',
      contact.cxrResult || '',
      contact.cxrResultDetail || '',
      contact.cxrHospital || '',
      contact.nextCxrDate || '',
    ],
  ];

  // Check if exists
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(CONTACTS_SHEET_NAME, 'A:A')}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    await verifyAndInitSheets(accessToken, spreadsheetId);
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }

  const data = await res.json().catch(() => ({}));
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r: string[]) => r[0] === contact.id);

  if (rowIndex === -1) {
    const doAppend = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(CONTACTS_SHEET_NAME, 'A1')}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doAppend);
  } else {
    const sheetRowNum = rowIndex + 1;
    const doUpdate = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(CONTACTS_SHEET_NAME, `A${sheetRowNum}:AD${sheetRowNum}`)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doUpdate);
  }
}

// ------------------- FOLLOW-UP OPERATIONS -------------------

export async function fetchAllFollowUps(accessToken: string, spreadsheetId: string): Promise<ContactFollowUp[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(FOLLOW_UPS_SHEET_NAME, 'A2:P5000')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[]): ContactFollowUp => {
    return {
      id: row[0] || '',
      contactId: row[1] || '',
      indexPatientHN: row[2] || '',
      contactHN: row[3] || '',
      contactName: row[4] || '',
      contactAge: Number(row[5]) || 0,
      stepType: (row[6] as any) || 'cxr_1_0m',
      scheduledDate: row[7] || '',
      actualDate: row[8] || '',
      status: (row[9] as any) || 'scheduled',
      testResult: (row[10] as any) || 'pending',
      resultDetail: row[11] || '',
      tptRegimen: (row[12] as any) || 'none',
      hospitalOrFacility: row[13] || '',
      recordedBy: row[14] || '',
      notes: row[15] || '',
    };
  }).filter(f => f.id && f.contactId);
}

export async function saveFollowUpToSheet(accessToken: string, spreadsheetId: string, fu: ContactFollowUp): Promise<void> {
  const values = [
    [
      fu.id,
      fu.contactId,
      fu.indexPatientHN,
      fu.contactHN,
      fu.contactName,
      fu.contactAge,
      fu.stepType,
      fu.scheduledDate,
      fu.actualDate || '',
      fu.status,
      fu.testResult || 'pending',
      fu.resultDetail || '',
      fu.tptRegimen || 'none',
      fu.hospitalOrFacility || '',
      fu.recordedBy,
      fu.notes || '',
    ],
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(FOLLOW_UPS_SHEET_NAME, 'A:A')}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    await verifyAndInitSheets(accessToken, spreadsheetId);
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }

  const data = await res.json().catch(() => ({}));
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r: string[]) => r[0] === fu.id);

  if (rowIndex === -1) {
    const doAppend = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(FOLLOW_UPS_SHEET_NAME, 'A1')}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doAppend);
  } else {
    const sheetRowNum = rowIndex + 1;
    const doUpdate = () => fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(FOLLOW_UPS_SHEET_NAME, `A${sheetRowNum}:P${sheetRowNum}`)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      }
    );
    await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doUpdate);
  }
}

// ------------------- DAILY LOG OPERATIONS -------------------

export async function fetchAllDailyLogs(accessToken: string, spreadsheetId: string): Promise<DailyLog[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(DAILY_LOGS_SHEET_NAME, 'A2:Y10000')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[]): DailyLog => {
    return {
      id: row[0] || '',
      patientId: row[1] || '',
      date: row[2] || '',
      takenMedication: row[3] === 'ทานแล้ว' || row[3] === 'TRUE' || row[3] === 'true' || row[3] === 'Yes',
      medicationTime: row[4] || '',
      supervisorType: (row[5] === 'อสม.' ? 'vhv' : row[5] === 'เจ้าหน้าที่สาธารณสุข' ? 'health_worker' : row[5] === 'ญาติ/ครอบครัว' ? 'family' : 'self'),
      supervisorName: row[6] || '',
      symptoms: {
        cough: row[7] === 'มี' || row[7] === 'TRUE',
        coughBlood: row[8] === 'มี' || row[8] === 'TRUE',
        fever: row[9] === 'มี' || row[9] === 'TRUE',
        nightSweats: row[10] === 'มี' || row[10] === 'TRUE',
        weightLoss: row[11] === 'มี' || row[11] === 'TRUE',
        chestPain: row[12] === 'มี' || row[12] === 'TRUE',
        fatigue: row[13] === 'มี' || row[13] === 'TRUE',
        nauseaVomiting: row[14] === 'มี' || row[14] === 'TRUE',
        rashItch: row[15] === 'มี' || row[15] === 'TRUE',
        yellowSkinEyes: row[16] === 'มี' || row[16] === 'TRUE',
        jointPain: row[17] === 'มี' || row[17] === 'TRUE',
        visionChanges: row[18] === 'มี' || row[18] === 'TRUE',
        numbnessHandsFeet: row[19] === 'มี' || row[19] === 'TRUE',
      },
      severityLevel: (row[20] as any) || 'normal',
      sideEffectsNotes: row[21] || '',
      patientMood: (row[22] as any) || 'neutral',
      recordedBy: row[23] || '',
      recordedAt: row[24] || '',
    };
  }).filter((l: DailyLog) => l.id && l.patientId && l.date);
}

export async function appendDailyLogToSheet(accessToken: string, spreadsheetId: string, log: DailyLog): Promise<void> {
  const supervisorMap: Record<string, string> = {
    self: 'ทานยาด้วยตนเอง',
    family: 'ญาติ/ครอบครัว',
    health_worker: 'เจ้าหน้าที่สาธารณสุข',
    vhv: 'อสม.',
  };

  const values = [
    [
      log.id,
      log.patientId,
      log.date,
      log.takenMedication ? 'ทานแล้ว' : 'ยังไม่ได้ทาน/ขาดทานยา',
      log.medicationTime || '',
      supervisorMap[log.supervisorType] || log.supervisorType,
      log.supervisorName || '',
      log.symptoms.cough ? 'มี' : 'ไม่มี',
      log.symptoms.coughBlood ? 'มี' : 'ไม่มี',
      log.symptoms.fever ? 'มี' : 'ไม่มี',
      log.symptoms.nightSweats ? 'มี' : 'ไม่มี',
      log.symptoms.weightLoss ? 'มี' : 'ไม่มี',
      log.symptoms.chestPain ? 'มี' : 'ไม่มี',
      log.symptoms.fatigue ? 'มี' : 'ไม่มี',
      log.symptoms.nauseaVomiting ? 'มี' : 'ไม่มี',
      log.symptoms.rashItch ? 'มี' : 'ไม่มี',
      log.symptoms.yellowSkinEyes ? 'มี' : 'ไม่มี',
      log.symptoms.jointPain ? 'มี' : 'ไม่มี',
      log.symptoms.visionChanges ? 'มี' : 'ไม่มี',
      log.symptoms.numbnessHandsFeet ? 'มี' : 'ไม่มี',
      log.severityLevel,
      log.sideEffectsNotes || '',
      log.patientMood || 'neutral',
      log.recordedBy,
      log.recordedAt || new Date().toISOString(),
    ],
  ];

  const doAppend = () => fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${formatRange(DAILY_LOGS_SHEET_NAME, 'A1')}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  const res = await executeSheetWriteWithAutoInit(accessToken, spreadsheetId, doAppend);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถบันทึกข้อมูลอาการลงใน Google Sheet ได้');
  }
}
