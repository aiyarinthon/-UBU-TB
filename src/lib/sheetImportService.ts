import { Patient, ContactPerson, ContactFollowUp } from '../types';

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

/**
 * Fetch spreadsheet metadata including available tabs
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string): Promise<SheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถเปิด Google Sheet นี้ได้ กรุณาตรวจสอบสิทธิ์หรือ ID');
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Google Sheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || '',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

/**
 * Extract clean Spreadsheet ID from full URL or raw ID
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Normalize header text for fuzzy matching
 */
function normalizeHeader(h: string): string {
  return (h || '')
    .toLowerCase()
    .replace(/[\s\-_()\[\]/\\.,:*]/g, '')
    .trim();
}

/**
 * Find best column index from row of headers
 */
function findColIndex(headers: string[], matchers: (string | RegExp)[]): number {
  for (let i = 0; i < headers.length; i++) {
    const raw = headers[i] || '';
    const norm = normalizeHeader(raw);
    for (const matcher of matchers) {
      if (typeof matcher === 'string') {
        if (norm.includes(normalizeHeader(matcher))) {
          return i;
        }
      } else if (matcher.test(raw) || matcher.test(norm)) {
        return i;
      }
    }
  }
  return -1;
}

export interface PatientImportPreviewItem {
  patient: Patient;
  rowNumber: number;
  isExisting: boolean;
  warnings: string[];
}

export interface ContactImportPreviewItem {
  contact: ContactPerson;
  rowNumber: number;
  isExisting: boolean;
  warnings: string[];
}

/**
 * Fetch and parse Patients from any sheet tab
 */
export async function importPatientsFromSheetTab(
  accessToken: string,
  spreadsheetId: string,
  sheetTabTitle: string,
  existingPatients: Patient[] = []
): Promise<{
  totalRows: number;
  previewItems: PatientImportPreviewItem[];
  headersFound: string[];
}> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = encodeURIComponent(`'${sheetTabTitle}'!A1:ZZ5000`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `ไม่สามารถอ่านข้อมูลจากแท็บ "${sheetTabTitle}" ได้`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];
  if (rows.length === 0) {
    return { totalRows: 0, previewItems: [], headersFound: [] };
  }

  // Row 0 is header row
  const headers = (rows[0] || []).map(h => (h || '').toString().trim());

  // Match columns flexibly
  const colId = findColIndex(headers, ['รหัสผู้ป่วย', 'patientid', 'id']);
  const colHn = findColIndex(headers, ['hn', 'เลขประจำตัวผู้ป่วย', 'hospitalnumber', 'เลขhn']);
  const colName = findColIndex(headers, ['ชื่อนามสกุล', 'ชื่อสกุล', 'fullname', 'name', 'ชื่อ']);
  const colPhone = findColIndex(headers, ['เบอร์ติดต่อ', 'เบอร์โทร', 'phone', 'telephone', 'tel']);
  const colEmail = findColIndex(headers, ['email', 'อีเมล', 'mail']);
  const colNtipDate = findColIndex(headers, ['วันขึ้นทะเบียน', 'ntip', 'วันลงทะเบียน']);
  const colDiagDate = findColIndex(headers, ['วันที่เริ่มวินิจฉัย', 'วันที่วินิจฉัย', 'diagnosisdate', 'วันที่เริ่มรักษา', 'treatmentstart']);
  const colAge = findColIndex(headers, ['อายุ', 'age']);
  const colGender = findColIndex(headers, ['เพศ', 'gender', 'sex']);
  const colNatId = findColIndex(headers, ['เลขประจำตัวประชาชน', 'บัตรประชาชน', 'nationalid', 'cid', 'เลข13หลัก', 'citizenid']);
  const colRights = findColIndex(headers, ['สิทธิการรักษา', 'สิทธิ', 'right', 'treatmentrights']);
  const colAddress = findColIndex(headers, ['ที่อยู่', 'address']);
  const colEmergency = findColIndex(headers, ['ผู้ติดต่อฉุกเฉิน', 'emergency']);
  const colCategory = findColIndex(headers, ['กลุ่มการรักษา', 'category', 'treatmentcategory']);
  const colClassification = findColIndex(headers, ['การจำแนกโรค', 'classification', 'tbclassification', 'ประเภทวัณโรค']);
  const colWeight = findColIndex(headers, ['น้ำหนัก', 'weight', 'weightkg']);
  const colRegimen = findColIndex(headers, ['สูตรยา', 'regimen', 'สูตรยาที่ได้รับ']);
  const colDoctor = findColIndex(headers, ['แพทย์', 'doctor', 'แพทย์ผู้ดูแล']);
  const colHospital = findColIndex(headers, ['โรงพยาบาล', 'hospital', 'สถานพยาบาล']);
  const colHouseholdCount = findColIndex(headers, ['จำนวนผู้สัมผัสร่วมบ้าน', 'householdcontact', 'ร่วมบ้าน']);
  const colNonHouseholdCount = findColIndex(headers, ['จำนวนผู้สัมผัสนอกบ้าน', 'nonhouseholdcontact', 'นอกบ้าน']);
  const colStatus = findColIndex(headers, ['สถานะการรักษา', 'สถานะ', 'status']);
  const colNotes = findColIndex(headers, ['หมายเหตุ', 'notes', 'remark']);

  const previewItems: PatientImportPreviewItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const rawHn = colHn !== -1 ? (row[colHn] || '').trim() : (colId !== -1 && (row[colId] || '').trim().startsWith('HN') ? row[colId].trim() : '');
    const rawName = colName !== -1 ? (row[colName] || '').trim() : '';

    // If completely empty on both HN and Name, skip
    if (!rawHn && !rawName) continue;
    // Skip if repeated header
    if (rawName === 'ชื่อ-นามสกุล' || rawHn.toLowerCase() === 'hn') continue;

    const rawId = colId !== -1 ? (row[colId] || '').trim() : '';
    const rawNatId = colNatId !== -1 ? (row[colNatId] || '').trim().replace(/[^0-9]/g, '') : '';
    const rawGender = colGender !== -1 ? (row[colGender] || '').trim().toLowerCase() : '';
    const gender: 'male' | 'female' | 'other' = 
      (rawGender === 'หญิง' || rawGender === 'female' || rawGender === 'f') ? 'female' :
      (rawGender === 'อื่นๆ' || rawGender === 'other') ? 'other' : 'male';

    const rawAge = colAge !== -1 ? Number((row[colAge] || '').replace(/[^0-9]/g, '')) || 0 : 0;
    const rawWeight = colWeight !== -1 ? parseFloat(row[colWeight] || '0') || 0 : 0;
    const rawEmergency = colEmergency !== -1 ? (row[colEmergency] || '').trim() : '';
    const [emName, emPhone] = rawEmergency.split(/[-–—:]+/).map(s => s.trim());

    // Check if patient already exists in local state
    const existingMatch = existingPatients.find(p => 
      (p.hn && rawHn && p.hn.toLowerCase() === rawHn.toLowerCase()) ||
      (rawNatId && rawNatId.length === 13 && p.nationalId === rawNatId) ||
      (p.fullName && rawName && p.fullName.trim().toLowerCase() === rawName.toLowerCase()) ||
      (rawId && p.id === rawId)
    );

    const warnings: string[] = [];
    if (!rawHn) warnings.push('ไม่มี HN');
    if (!rawName) warnings.push('ไม่มีชื่อ-สกุล');
    if (existingMatch) warnings.push(`มีข้อมูลในระบบแล้ว (${existingMatch.hn || existingMatch.id}) จะเป็นการอัปเดต`);

    const patientId = rawId || (existingMatch ? existingMatch.id : (rawHn ? `TB-${rawHn}` : `TB-${Date.now()}-${r}`));

    const patient: Patient = {
      id: patientId,
      hn: rawHn || (existingMatch?.hn || ''),
      fullName: rawName || (existingMatch?.fullName || 'ผู้ป่วย (ไม่ระบุชื่อ)'),
      phone: colPhone !== -1 ? (row[colPhone] || '').trim() : (existingMatch?.phone || ''),
      email: colEmail !== -1 ? (row[colEmail] || '').trim() : (existingMatch?.email || ''),
      ntipRegistrationDate: colNtipDate !== -1 ? (row[colNtipDate] || '').trim() : (existingMatch?.ntipRegistrationDate || ''),
      diagnosisDate: colDiagDate !== -1 ? (row[colDiagDate] || '').trim() : (existingMatch?.diagnosisDate || ''),
      age: rawAge || existingMatch?.age || 0,
      gender: gender || existingMatch?.gender || 'male',
      nationalId: rawNatId || existingMatch?.nationalId || '',
      treatmentRights: colRights !== -1 ? (row[colRights] || '').trim() : (existingMatch?.treatmentRights || 'บัตรทอง (UC)'),
      address: colAddress !== -1 ? (row[colAddress] || '').trim() : (existingMatch?.address || ''),
      emergencyContact: {
        name: emName || existingMatch?.emergencyContact?.name || '',
        relationship: 'ผู้ติดต่อฉุกเฉิน',
        phone: emPhone || existingMatch?.emergencyContact?.phone || '',
      },
      treatmentCategory: (colCategory !== -1 ? (row[colCategory] as any) : existingMatch?.treatmentCategory) || 'Cat 1 (New)',
      tbClassification: (colClassification !== -1 ? (row[colClassification] as any) : existingMatch?.tbClassification) || 'Pulmonary (Bacteriologically Confirmed)',
      weightKg: rawWeight || existingMatch?.weightKg || 0,
      treatmentRegimen: colRegimen !== -1 ? (row[colRegimen] || '').trim() : (existingMatch?.treatmentRegimen || '2HRZE/4HR'),
      doctorName: colDoctor !== -1 ? (row[colDoctor] || '').trim() : (existingMatch?.doctorName || ''),
      hospitalName: colHospital !== -1 ? (row[colHospital] || '').trim() : (existingMatch?.hospitalName || 'โรงพยาบาลมหาวิทยาลัยอุบลราชธานี'),
      householdContactsCount: colHouseholdCount !== -1 ? Number(row[colHouseholdCount]) || 0 : (existingMatch?.householdContactsCount || 0),
      nonHouseholdContactsCount: colNonHouseholdCount !== -1 ? Number(row[colNonHouseholdCount]) || 0 : (existingMatch?.nonHouseholdContactsCount || 0),
      investigationStatus: existingMatch?.investigationStatus || 'pending',
      status: (colStatus !== -1 ? (row[colStatus] as any) : existingMatch?.status) || 'active',
      notes: colNotes !== -1 ? (row[colNotes] || '').trim() : (existingMatch?.notes || ''),
      createdAt: existingMatch?.createdAt || new Date().toISOString(),
      lastUpdatedBy: 'นำเข้าจาก Google Sheet',
      updatedAt: new Date().toISOString(),
    };

    previewItems.push({
      patient,
      rowNumber: r + 1,
      isExisting: !!existingMatch,
      warnings,
    });
  }

  return {
    totalRows: rows.length - 1,
    previewItems,
    headersFound: headers,
  };
}

/**
 * Fetch and parse Contacts from any sheet tab
 */
export async function importContactsFromSheetTab(
  accessToken: string,
  spreadsheetId: string,
  sheetTabTitle: string,
  existingContacts: ContactPerson[] = [],
  patients: Patient[] = []
): Promise<{
  totalRows: number;
  previewItems: ContactImportPreviewItem[];
  headersFound: string[];
}> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = encodeURIComponent(`'${sheetTabTitle}'!A1:ZZ5000`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `ไม่สามารถอ่านข้อมูลจากแท็บ "${sheetTabTitle}" ได้`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];
  if (rows.length === 0) {
    return { totalRows: 0, previewItems: [], headersFound: [] };
  }

  // Row 0 is header row
  const headers = (rows[0] || []).map(h => (h || '').toString().trim());

  // Match columns flexibly
  const colId = findColIndex(headers, ['รหัสผู้สัมผัส', 'contactid', 'id']);
  const colIndexId = findColIndex(headers, ['รหัสผู้ป่วยดัชนี', 'indexid', 'patientid']);
  const colIndexHn = findColIndex(headers, ['hnผู้ป่วยดัชนี', 'hnผู้ป่วย', 'indexhn', 'hnดัชนี']);
  const colIndexName = findColIndex(headers, ['ชื่อผู้ป่วยดัชนี', 'indexname', 'ชื่อผู้ป่วย']);
  const colType = findColIndex(headers, ['กลุ่มผู้สัมผัส', 'ประเภทผู้สัมผัส', 'contacttype', 'ร่วมบ้าน/นอกบ้าน']);
  const colRelation = findColIndex(headers, ['ความสัมพันธ์', 'relationship']);
  const colHn = findColIndex(headers, ['hnผู้สัมผัส', 'hn', 'เลขhn']);
  const colName = findColIndex(headers, ['ชื่อนามสกุลผู้สัมผัส', 'ชื่อผู้สัมผัส', 'ชื่อสกุล', 'fullname', 'ชื่อ']);
  const colGender = findColIndex(headers, ['เพศ', 'gender', 'sex']);
  const colAge = findColIndex(headers, ['อายุ', 'age']);
  const colRights = findColIndex(headers, ['สิทธิการรักษา', 'สิทธิ', 'right']);
  const colPhone = findColIndex(headers, ['เบอร์ติดต่อ', 'เบอร์โทร', 'phone', 'tel']);
  const colEmail = findColIndex(headers, ['email', 'อีเมล', 'mail']);
  const colNtipStatus = findColIndex(headers, ['สถานะการคีย์ntip', 'ntipstatus', 'คีย์ntip']);
  const colNtipCode = findColIndex(headers, ['รหัสที่คีย์ในntip', 'ntipcode', 'ntipkeycode', 'รหัสntip']);
  const colNtipDate = findColIndex(headers, ['วันที่คีย์ในntip', 'ntipdate', 'ntipkeydate']);
  const colScreenStatus = findColIndex(headers, ['สถานะการตรวจคัดกรอง', 'screeningstatus']);
  const colNotes = findColIndex(headers, ['หมายเหตุ', 'notes', 'remark']);
  const colCxrStatus = findColIndex(headers, ['สถานะการตรวจcxr', 'cxrstatus']);
  const colCxrRound = findColIndex(headers, ['ครั้งที่ตรวจcxr', 'cxrround']);
  const colCxrDate = findColIndex(headers, ['วันที่ตรวจcxr', 'cxrdate']);
  const colCxrResult = findColIndex(headers, ['ผลตรวจเอกซเรย์ปอด', 'cxrresult', 'ผลcxr']);
  const colCxrDetail = findColIndex(headers, ['รายละเอียดผลตรวจcxr', 'cxrresultdetail']);
  const colCxrHosp = findColIndex(headers, ['สถานพยาบาลที่ตรวจcxr', 'cxrhospital']);
  const colNextCxr = findColIndex(headers, ['วันนัดตรวจcxrครั้งถัดไป', 'nextcxrdate', 'วันนัดcxr']);
  const colNtip1 = findColIndex(headers, ['รหัสntipครั้งที่1', 'ntipcoderound1', 'ntip1']);
  const colNtip2 = findColIndex(headers, ['รหัสntipครั้งที่2', 'ntipcoderound2', 'ntip2']);
  const colNtip3 = findColIndex(headers, ['รหัสntipครั้งที่3', 'ntipcoderound3', 'ntip3']);
  const colNtip4 = findColIndex(headers, ['รหัสntipครั้งที่4', 'ntipcoderound4', 'ntip4']);

  const previewItems: ContactImportPreviewItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every(c => !c || !c.trim())) continue;

    const rawId = colId !== -1 ? (row[colId] || '').trim() : '';
    const rawHn = colHn !== -1 ? (row[colHn] || '').trim() : '';
    const rawName = colName !== -1 ? (row[colName] || '').trim() : '';
    const rawIndexHn = colIndexHn !== -1 ? (row[colIndexHn] || '').trim() : '';
    const rawIndexName = colIndexName !== -1 ? (row[colIndexName] || '').trim() : '';

    // If completely empty on key identifiers, skip
    if (!rawName && !rawHn && !rawId) continue;
    // Skip if header repetition
    if (rawName === 'ชื่อ-นามสกุล ผู้สัมผัส' || rawHn === 'HN ผู้สัมผัส') continue;

    const rawType = colType !== -1 ? (row[colType] || '').trim() : '';
    const contactType: 'household' | 'non_household' = 
      (rawType.includes('นอกบ้าน') || rawType === 'non_household') ? 'non_household' : 'household';

    const rawGender = colGender !== -1 ? (row[colGender] || '').trim().toLowerCase() : '';
    const gender: 'male' | 'female' | 'other' = 
      (rawGender === 'หญิง' || rawGender === 'female' || rawGender === 'f') ? 'female' :
      (rawGender === 'อื่นๆ' || rawGender === 'other') ? 'other' : 'male';

    const rawAge = colAge !== -1 ? Number((row[colAge] || '').replace(/[^0-9]/g, '')) || 0 : 0;
    const protocol: 'cxr_4_times' | 'igra_tpt' = rawAge > 5 ? 'cxr_4_times' : 'igra_tpt';

    // Find index patient by HN or Name if possible
    const indexPatient = patients.find(p => 
      (rawIndexHn && p.hn && p.hn.toLowerCase() === rawIndexHn.toLowerCase()) ||
      (rawIndexName && p.fullName && p.fullName.toLowerCase() === rawIndexName.toLowerCase())
    );

    // Check if contact already exists
    const existingMatch = existingContacts.find(c => 
      (rawId && c.id === rawId) ||
      (rawHn && c.hn && c.hn.toLowerCase() === rawHn.toLowerCase() && rawIndexHn && c.indexPatientHN && c.indexPatientHN.toLowerCase() === rawIndexHn.toLowerCase()) ||
      (rawName && c.fullName && c.fullName.trim().toLowerCase() === rawName.toLowerCase() && rawIndexHn && c.indexPatientHN && c.indexPatientHN.toLowerCase() === rawIndexHn.toLowerCase())
    );

    const warnings: string[] = [];
    if (!rawName) warnings.push('ไม่มีชื่อ-สกุล');
    if (!rawIndexHn && !rawIndexName) warnings.push('ไม่ได้ระบุผู้ป่วยดัชนี (Index Patient)');
    if (existingMatch) warnings.push('มีข้อมูลผู้สัมผัสรายนี้ในระบบแล้ว จะเป็นการอัปเดต');

    const contactId = rawId || (existingMatch ? existingMatch.id : (rawHn ? `CT-${rawHn}` : `CT-${Date.now()}-${r}`));

    const rawNtipStatus = colNtipStatus !== -1 ? (row[colNtipStatus] || '').trim() : '';
    const ntipStatus: 'entered' | 'not_entered' = 
      (rawNtipStatus === 'คีย์แล้ว' || rawNtipStatus === 'entered' || (colNtipCode !== -1 && !!row[colNtipCode])) ? 'entered' : 'not_entered';

    const contact: ContactPerson = {
      id: contactId,
      indexPatientId: (colIndexId !== -1 ? row[colIndexId]?.trim() : '') || indexPatient?.id || existingMatch?.indexPatientId || '',
      indexPatientHN: rawIndexHn || indexPatient?.hn || existingMatch?.indexPatientHN || '',
      indexPatientName: rawIndexName || indexPatient?.fullName || existingMatch?.indexPatientName || '',
      contactType: contactType,
      relationship: (colRelation !== -1 ? row[colRelation]?.trim() : '') || existingMatch?.relationship || (contactType === 'household' ? 'คนในครอบครัว' : 'เพื่อนร่วมงาน/คนรู้จัก'),
      hn: rawHn || existingMatch?.hn || '',
      fullName: rawName || existingMatch?.fullName || 'ผู้สัมผัส (ไม่ระบุชื่อ)',
      gender: gender || existingMatch?.gender || 'male',
      age: rawAge || existingMatch?.age || 0,
      treatmentRights: (colRights !== -1 ? row[colRights]?.trim() : '') || existingMatch?.treatmentRights || 'บัตรทอง (UC)',
      phone: (colPhone !== -1 ? row[colPhone]?.trim() : '') || existingMatch?.phone || '',
      email: (colEmail !== -1 ? row[colEmail]?.trim() : '') || existingMatch?.email || '',
      protocolType: protocol,
      ntipStatus: ntipStatus,
      ntipKeyCode: (colNtipCode !== -1 ? row[colNtipCode]?.trim() : '') || existingMatch?.ntipKeyCode || '',
      ntipKeyDate: (colNtipDate !== -1 ? row[colNtipDate]?.trim() : '') || existingMatch?.ntipKeyDate || '',
      screeningStatus: (colScreenStatus !== -1 ? (row[colScreenStatus] as any) : existingMatch?.screeningStatus) || 'pending_screening',
      notes: (colNotes !== -1 ? row[colNotes]?.trim() : '') || existingMatch?.notes || '',
      createdAt: existingMatch?.createdAt || new Date().toISOString(),
      lastUpdatedBy: 'นำเข้าจาก Google Sheet',
      updatedAt: new Date().toISOString(),
      ntipNotes: existingMatch?.ntipNotes || '',
      cxrStatus: (colCxrStatus !== -1 ? (row[colCxrStatus] as any) : existingMatch?.cxrStatus) || undefined,
      cxrRound: (colCxrRound !== -1 ? (row[colCxrRound] as any) : existingMatch?.cxrRound) || undefined,
      cxrDate: (colCxrDate !== -1 ? row[colCxrDate]?.trim() : '') || existingMatch?.cxrDate || '',
      cxrResult: (colCxrResult !== -1 ? (row[colCxrResult] as any) : existingMatch?.cxrResult) || undefined,
      cxrResultDetail: (colCxrDetail !== -1 ? row[colCxrDetail]?.trim() : '') || existingMatch?.cxrResultDetail || '',
      cxrHospital: (colCxrHosp !== -1 ? row[colCxrHosp]?.trim() : '') || existingMatch?.cxrHospital || '',
      nextCxrDate: (colNextCxr !== -1 ? row[colNextCxr]?.trim() : '') || existingMatch?.nextCxrDate || '',
      ntipCodeRound1: (colNtip1 !== -1 ? row[colNtip1]?.trim() : '') || existingMatch?.ntipCodeRound1 || '',
      ntipCodeRound2: (colNtip2 !== -1 ? row[colNtip2]?.trim() : '') || existingMatch?.ntipCodeRound2 || '',
      ntipCodeRound3: (colNtip3 !== -1 ? row[colNtip3]?.trim() : '') || existingMatch?.ntipCodeRound3 || '',
      ntipCodeRound4: (colNtip4 !== -1 ? row[colNtip4]?.trim() : '') || existingMatch?.ntipCodeRound4 || '',
    };

    previewItems.push({
      contact,
      rowNumber: r + 1,
      isExisting: !!existingMatch,
      warnings,
    });
  }

  return {
    totalRows: rows.length - 1,
    previewItems,
    headersFound: headers,
  };
}
