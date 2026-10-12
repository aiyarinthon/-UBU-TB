import { Patient, ContactPerson, ContactFollowUp } from '../types';

/**
 * Normalizes patient treatment status from raw string, Thai terms, or English codes
 * into standard union: 'active' | 'completed' | 'transferred' | 'defaulted'
 */
export function normalizePatientStatus(rawStatus?: any): 'active' | 'completed' | 'transferred' | 'defaulted' {
  if (!rawStatus) return 'active';
  const s = String(rawStatus).trim().toLowerCase();

  // Completed / Cured
  if (
    s === 'completed' ||
    s.includes('หาย') ||
    s.includes('ครบกำหนด') ||
    s.includes('รักษาครบ') ||
    s.includes('cured') ||
    s.includes('สำเร็จ')
  ) {
    return 'completed';
  }

  // Transferred out
  if (
    s === 'transferred' ||
    s.includes('ส่งต่อ') ||
    s.includes('ย้าย') ||
    s.includes('transfer')
  ) {
    return 'transferred';
  }

  // Defaulted / Lost to follow-up
  if (
    s === 'defaulted' ||
    s.includes('ขาดการรักษา') ||
    s.includes('ขาด') ||
    s.includes('ขาดยา') ||
    s.includes('สูญหาย') ||
    s.includes('default') ||
    s.includes('drop')
  ) {
    return 'defaulted';
  }

  // Default to active for any active-like or unspecified valid TB cohort member
  return 'active';
}

/**
 * Human-readable Thai label for patient status
 */
export function getPatientStatusLabel(status?: any): string {
  const norm = normalizePatientStatus(status);
  switch (norm) {
    case 'active':
      return 'กำลังรับการรักษา';
    case 'completed':
      return 'รักษาหาย / ครบกำหนด';
    case 'transferred':
      return 'ส่งต่อ';
    case 'defaulted':
      return 'ขาดการรักษา';
    default:
      return 'กำลังรับการรักษา';
  }
}

/**
 * Checks if a contact person has been successfully tracked / screened / followed up.
 * 
 * Criteria according to DDC / NTIP standards:
 * 1. Has attended any follow-up visit (completed follow-up or actual date recorded)
 * 2. Has undergone CXR (status done, date recorded, or valid finding)
 * 3. Has undergone IGRA / TST (date recorded or valid result)
 * 4. Has been placed on or completed TPT (3HP, 1HP, 6H)
 * 5. Has been enrolled into NTIP (ntipStatus 'entered' or ntipKeyCode recorded)
 * 6. Has completed clinical screening (screeningStatus not 'pending_screening')
 */
export function isContactTracked(contact: ContactPerson, followUps: ContactFollowUp[] = []): boolean {
  if (!contact) return false;

  // 1. Follow-up records with completed status or actual date
  const hasCompletedFollowUp = followUps.some(
    f => (f.contactId === contact.id || (f.contactHN && contact.hn && f.contactHN.toLowerCase() === contact.hn.toLowerCase())) &&
         (f.status === 'completed' || Boolean(f.actualDate && f.actualDate.trim()))
  );
  if (hasCompletedFollowUp) return true;

  // 2. CXR completed
  if (contact.cxrStatus === 'done' || Boolean(contact.cxrDate && contact.cxrDate.trim())) {
    return true;
  }
  if (contact.cxrResult && contact.cxrResult !== 'pending' && contact.cxrResult !== 'not_done') {
    return true;
  }

  // 3. IGRA / TST testing done
  if (Boolean(contact.igraDate && contact.igraDate.trim())) {
    return true;
  }
  if (contact.igraResult && contact.igraResult !== 'pending' && contact.igraResult !== 'not_done') {
    return true;
  }

  // 4. TPT preventative treatment started or completed
  if (contact.tptStatus === 'on_tpt' || contact.tptStatus === 'completed') {
    return true;
  }

  // 5. NTIP code entered
  if (contact.ntipStatus === 'entered' || Boolean(contact.ntipKeyCode && contact.ntipKeyCode.trim())) {
    return true;
  }

  // 6. Clinical screening completed (not pending)
  if (contact.screeningStatus && contact.screeningStatus !== 'pending_screening') {
    return true;
  }

  return false;
}
