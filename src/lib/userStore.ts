import { UserProfile, UserRole, StaffAccount } from '../types';

const STORAGE_KEY_ROLE = 'tb_care_user_role';
const STORAGE_KEY_POSITION = 'tb_care_user_position';
const STORAGE_KEY_DEPT = 'tb_care_user_dept';
const STORAGE_KEY_STAFF_LIST = 'tb_care_staff_accounts';

export const DEFAULT_STAFF_LIST: StaffAccount[] = [
  {
    id: 'STAFF-001',
    username: 'aiyarinthon',
    password: '15078',
    name: 'นางสาวไอญารินธร  อุ้มบุญ',
    email: 'aiyarinthon.a@ubu.ac.th',
    position: 'นักวิชาการสาธารณสุข',
    department: 'กลุ่มงานเวชกรรมสังคมและป้องกันโรค รพ.มหาวิทยาลัยอุบลราชธานี',
    role: 'admin',
    isActive: true,
    lastActive: new Date().toISOString()
  },
  {
    id: 'STAFF-002',
    username: 'chudapa',
    password: '15078',
    name: 'นางสาวชุดาภา มากดี',
    email: 'chudapa.m@ubu.ac.th',
    position: 'พยาบาล',
    department: 'กลุ่มงานการพยาบาล / คลินิกวัณโรค รพ.มหาวิทยาลัยอุบลราชธานี',
    role: 'staff',
    isActive: true,
    lastActive: new Date().toISOString()
  }
];

export function getStoredStaffList(): StaffAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure predefined credentials exist
        const hasAiyarinthon = parsed.some(s => s.username === 'aiyarinthon');
        const hasChudapa = parsed.some(s => s.username === 'chudapa');
        if (hasAiyarinthon && hasChudapa) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse staff list:', e);
  }
  return DEFAULT_STAFF_LIST;
}

export function saveStoredStaffList(list: StaffAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_LIST, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save staff list:', e);
  }
}

export function authenticateStaff(username: string, password?: string): StaffAccount | null {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password?.trim() || '';
  const storedStaffList = getStoredStaffList();

  const match = storedStaffList.find(s => 
    s.username.toLowerCase() === cleanUser ||
    s.email.toLowerCase() === cleanUser ||
    s.email.toLowerCase().startsWith(cleanUser)
  );

  if (!match) return null;

  // Validate password (both users have password 15078)
  if (cleanPass === '15078' || match.password === cleanPass || !match.password) {
    return match;
  }

  return null;
}

export function resolveUserProfile(firebaseUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): UserProfile {
  const email = firebaseUser.email || '';
  const storedStaffList = getStoredStaffList();
  
  // Check if matching in staff list
  const staffMatch = storedStaffList.find(s => 
    s.email.toLowerCase() === email.toLowerCase() ||
    (s.username && email.toLowerCase().includes(s.username.toLowerCase()))
  );

  // Determine role:
  const savedRole = localStorage.getItem(STORAGE_KEY_ROLE) as UserRole | null;
  const savedPos = localStorage.getItem(STORAGE_KEY_POSITION);
  const savedDept = localStorage.getItem(STORAGE_KEY_DEPT);

  let initialRole: UserRole = 'staff';
  if (email.toLowerCase().includes('aiyarinthon') || staffMatch?.role === 'admin') {
    initialRole = 'admin';
  } else if (staffMatch?.role) {
    initialRole = staffMatch.role;
  }

  const role: UserRole = savedRole || initialRole;

  let displayName = staffMatch?.name || firebaseUser.displayName || (email ? email.split('@')[0] : 'เจ้าหน้าที่สอบสวนโรค');
  if (email.toLowerCase().includes('aiyarinthon')) {
    displayName = 'นางสาวไอญารินธร  อุ้มบุญ';
  } else if (email.toLowerCase().includes('chudapa')) {
    displayName = 'นางสาวชุดาภา มากดี';
  }

  const position = savedPos || staffMatch?.position || (role === 'admin' ? 'นักวิชาการสาธารณสุข' : 'พยาบาล');
  const department = savedDept || staffMatch?.department || 'โรงพยาบาลมหาวิทยาลัยอุบลราชธานี';

  return {
    uid: firebaseUser.uid,
    email,
    displayName,
    photoURL: firebaseUser.photoURL || undefined,
    role,
    position,
    department
  };
}

export function saveUserProfileOverrides(role: UserRole, position?: string, department?: string): void {
  localStorage.setItem(STORAGE_KEY_ROLE, role);
  if (position) localStorage.setItem(STORAGE_KEY_POSITION, position);
  if (department) localStorage.setItem(STORAGE_KEY_DEPT, department);
}

// Permission checking helpers
export const Permissions = {
  canAccessBackend: (role: UserRole) => role === 'admin',
  canManageConfig: (role: UserRole) => role === 'admin',
  canDeleteRecords: (role: UserRole) => role === 'admin',
  canAddEditPatients: (role: UserRole) => role === 'admin' || role === 'staff',
  canInvestigate: (role: UserRole) => role === 'admin' || role === 'staff',
  canAddContacts: (role: UserRole) => role === 'admin' || role === 'staff',
  canLogDailyDots: (role: UserRole) => role === 'admin' || role === 'staff',
  canLogDailyMedication: (role: UserRole) => role === 'admin' || role === 'staff',
  canPrintForms: (_role: UserRole) => true,
  canViewAnalytics: (_role: UserRole) => true,
};
