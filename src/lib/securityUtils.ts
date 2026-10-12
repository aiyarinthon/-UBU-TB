export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: 'LOGIN' | 'LOGOUT' | 'VIEW_PATIENT' | 'SAVE_PATIENT' | 'DELETE_PATIENT' | 'SAVE_HCW' | 'EXPORT_DATA' | 'CONFIG_SHEET' | 'SECURITY_CHANGE';
  details: string;
  deviceInfo?: string;
}

const STORAGE_AUDIT_LOGS = 'tb_care_security_audit_logs_v1';
const STORAGE_DATA_MASKING = 'tb_care_data_masking_enabled';
const STORAGE_AUTO_LOCK = 'tb_care_auto_lock_minutes';

/**
 * Mask Thai Phone Number (e.g. 081-234-5678 -> 081-***-5678)
 */
export function maskPhoneNumber(phone?: string, enabled: boolean = true): string {
  if (!phone || !phone.trim()) return '-';
  if (!enabled) return phone;

  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  } else if (clean.length === 9) {
    return `${clean.slice(0, 2)}-***-${clean.slice(5)}`;
  }
  // Generic fallback
  if (phone.length > 5) {
    return phone.slice(0, 3) + '***' + phone.slice(-3);
  }
  return '***-***-****';
}

/**
 * Mask Thai National Identification Number (13 digits: 1-1002-34567-89-0 -> 1-1002-*****-**-0)
 */
export function maskNationalId(nationalId?: string, enabled: boolean = true): string {
  if (!nationalId || !nationalId.trim()) return '-';
  if (!enabled) return nationalId;

  const clean = nationalId.replace(/[^0-9]/g, '');
  if (clean.length === 13) {
    return `${clean[0]}-${clean.slice(1, 5)}-*****-**-${clean[12]}`;
  }
  if (clean.length >= 6) {
    return clean.slice(0, 4) + '******' + clean.slice(-2);
  }
  return '*-****-*****-**-*';
}

/**
 * Check if the email belongs to an institutional or hospital domain
 */
export function isEnterpriseEmail(email?: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return (
    lower.endsWith('@ubu.ac.th') ||
    lower.endsWith('.ac.th') ||
    lower.endsWith('.go.th') ||
    lower.endsWith('.moph.go.th') ||
    lower.includes('hospital') ||
    lower.includes('hosp') ||
    lower.includes('.or.th')
  );
}

/**
 * Retrieve Audit Logs from storage
 */
export function getSecurityAuditLogs(): SecurityAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse audit logs:', e);
  }
  
  // Default initial audit entries for clinical demonstration
  return [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      userName: 'นางสาวไอญารินธร  อุ้มบุญ',
      userEmail: 'aiyarinthon.a@ubu.ac.th',
      userRole: 'admin',
      action: 'LOGIN',
      details: 'เข้าสู่ระบบด้วยบัญชีองค์กร รพ.มหาวิทยาลัยอุบลราชธานี',
      deviceInfo: 'Web Browser (TLS 1.3 / HTTPS)'
    },
    {
      id: 'AUD-002',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      userName: 'นางสาวไอญารินธร  อุ้มบุญ',
      userEmail: 'aiyarinthon.a@ubu.ac.th',
      userRole: 'admin',
      action: 'CONFIG_SHEET',
      details: 'ตรวจสอบการเชื่อมโยงฐานข้อมูล Google Sheets บัญชีองค์กร',
      deviceInfo: 'Google Drive API v4'
    }
  ];
}

/**
 * Record a new Security Audit Log
 */
export function recordSecurityAuditLog(entry: {
  userName: string;
  userEmail: string;
  userRole: string;
  action: SecurityAuditLog['action'];
  details: string;
  deviceInfo?: string;
}): void {
  try {
    const existing = getSecurityAuditLogs();
    const newLog: SecurityAuditLog = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
      deviceInfo: entry.deviceInfo || 'Web Client (HTTPS / Secure Session)'
    };
    // Keep last 100 logs
    const updated = [newLog, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_AUDIT_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not record security audit log:', e);
  }
}

/**
 * Clear Audit Logs (Admin only)
 */
export function clearSecurityAuditLogs(): void {
  try {
    localStorage.removeItem(STORAGE_AUDIT_LOGS);
  } catch (e) {
    console.warn('Could not clear audit logs:', e);
  }
}

/**
 * Get / Set Data Masking preference
 */
export function getDataMaskingPreference(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_DATA_MASKING);
    // Default to false or true
    return val === 'true';
  } catch {
    return false;
  }
}

export function setDataMaskingPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_DATA_MASKING, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Could not save data masking preference:', e);
  }
}

/**
 * Get / Set Auto Lock Minutes
 */
export function getAutoLockMinutes(): number {
  try {
    const val = localStorage.getItem(STORAGE_AUTO_LOCK);
    return val ? parseInt(val, 10) : 15; // default 15 minutes
  } catch {
    return 15;
  }
}

export function setAutoLockMinutes(min: number): void {
  try {
    localStorage.setItem(STORAGE_AUTO_LOCK, min.toString());
  } catch (e) {
    console.warn('Could not save auto lock minutes:', e);
  }
}
