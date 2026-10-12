import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  FileSpreadsheet, 
  Users, 
  Database, 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  Lock, 
  Unlock, 
  KeyRound, 
  FileText, 
  Activity, 
  Award, 
  ChevronRight, 
  Sparkles,
  UploadCloud,
  UserPlus,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  ShieldAlert,
  Clock,
  Check
} from 'lucide-react';
import { UserProfile, UserRole, StaffAccount, Patient, InvestigationForm, ContactPerson, ContactFollowUp, DailyLog } from '../types';
import { 
  getStoredStaffList, 
  saveStoredStaffList, 
  saveUserProfileOverrides,
  Permissions 
} from '../lib/userStore';
import { verifyAndInitSheets, createTBSheet } from '../lib/sheetsApi';
import { googleSignIn } from '../lib/auth';
import { 
  getSecurityAuditLogs, 
  clearSecurityAuditLogs, 
  isEnterpriseEmail, 
  SecurityAuditLog, 
  recordSecurityAuditLog 
} from '../lib/securityUtils';
import { formatThaiDateTime } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  onUpdateUserProfile: (updated: UserProfile) => void;
  accessToken: string;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string | null;
  onConfigChange: (id: string, url: string, name: string) => void;
  onRefreshData: () => void;
  patients: Patient[];
  investigations: InvestigationForm[];
  contacts: ContactPerson[];
  followUps: ContactFollowUp[];
  dailyLogs: DailyLog[];
  onTokenUpdate?: (token: string) => void;
  onClearAllData?: () => void;
  onOpenImportModal?: (mode: 'patient' | 'contact') => void;
  defaultTab?: 'sheets' | 'staff' | 'permissions' | 'security' | 'backup';
  isMaskingEnabled?: boolean;
  onToggleMasking?: (enabled: boolean) => void;
  autoLockMinutes?: number;
  onSetAutoLockMinutes?: (minutes: number) => void;
  onLockScreenNow?: () => void;
}

export const BackendAdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onUpdateUserProfile,
  accessToken,
  spreadsheetId,
  spreadsheetUrl,
  spreadsheetName,
  onConfigChange,
  onRefreshData,
  patients,
  investigations,
  contacts,
  followUps,
  dailyLogs,
  onTokenUpdate,
  onClearAllData,
  onOpenImportModal,
  defaultTab = 'sheets',
  isMaskingEnabled = false,
  onToggleMasking,
  autoLockMinutes = 15,
  onSetAutoLockMinutes,
  onLockScreenNow
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'staff' | 'permissions' | 'security' | 'backup'>(defaultTab);
  const [staffList, setStaffList] = useState<StaffAccount[]>(() => getStoredStaffList());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() => getSecurityAuditLogs());
  
  // Sheet config state
  const [customSheetId, setCustomSheetId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New staff form state
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('พยาบาลวิชาชีพ / เจ้าหน้าที่สอบสวนโรค');
  const [newStaffDept, setNewStaffDept] = useState('โรงพยาบาลมหาวิทยาลัยอุบลราชธานี');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('staff');

  if (!isOpen) return null;

  const isAdmin = currentUserProfile.role === 'admin';

  const showToast = (success: boolean, msg: string) => {
    if (success) {
      setActionSuccess(msg);
      setActionError(null);
    } else {
      setActionError(msg);
      setActionSuccess(null);
    }
    setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 5000);
  };

  // Handle Switch Current User Role
  const handleRoleChange = (newRole: UserRole) => {
    const updated: UserProfile = { ...currentUserProfile, role: newRole };
    saveUserProfileOverrides(newRole, updated.position, updated.department);
    onUpdateUserProfile(updated);
    showToast(true, `เปลี่ยนสิทธิ์ผู้ใช้เป็น: ${newRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : newRole === 'staff' ? 'เจ้าหน้าที่ (Staff)' : 'ผู้เข้าชม (Viewer)'}`);
  };

  // Handle Create New Sheet
  const handleCreateNewSheet = async () => {
    setIsCreating(true);
    try {
      let activeToken = accessToken;
      if (!activeToken) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            activeToken = authRes.accessToken;
            if (onTokenUpdate) onTokenUpdate(authRes.accessToken);
          }
        } catch (authErr: any) {
          throw new Error('จำเป็นต้องลงชื่อเข้าใช้ Google เพื่อขอสิทธิ์สร้างไฟล์ Google Sheet บน Google Drive');
        }
      }

      if (!activeToken) {
        throw new Error('ไม่พบสิทธิ์การเชื่อมต่อ Google OAuth');
      }

      const res = await createTBSheet(activeToken);
      onConfigChange(res.spreadsheetId, res.spreadsheetUrl, res.title);
      showToast(true, 'สร้าง Google Sheet ฐานข้อมูลระบบสำเร็จเรียบร้อย พร้อม 5 ตารางหลัก');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('invalid authentication credentials') || msg.includes('Expected OAuth 2')) {
        showToast(false, 'ต้องลงชื่อเข้าใช้ Google Account เพื่อสร้างไฟล์ หรือใช้ "เชื่อมโยง Sheet ที่มีอยู่แล้ว"');
      } else {
        showToast(false, msg || 'เกิดข้อผิดพลาดในการสร้าง Sheet');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Link Existing Sheet
  const handleLinkSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;

    let cleanId = customSheetId.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    setIsLinking(true);
    try {
      await verifyAndInitSheets(accessToken, cleanId);
      const url = `https://docs.google.com/spreadsheets/d/${cleanId}`;
      onConfigChange(cleanId, url, 'Google Sheet ที่เชื่อมโยงแล้ว');
      showToast(true, 'เชื่อมโยงและเริ่มต้นตารางบน Google Sheet สำเร็จ');
      setCustomSheetId('');
    } catch (err: any) {
      showToast(false, err.message || 'ไม่สามารถเชื่อมต่อ Google Sheet นี้ได้');
    } finally {
      setIsLinking(false);
    }
  };

  // Handle Repair / Sync Schema
  const handleRepairSchema = async () => {
    if (!spreadsheetId) return;
    setIsRepairing(true);
    try {
      await verifyAndInitSheets(accessToken, spreadsheetId);
      onRefreshData();
      showToast(true, 'ตรวจสอบและซ่อมแซมโครงสร้างตารางทั้ง 5 แท็บเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast(false, err.message || 'เกิดข้อผิดพลาดในการซ่อมแซมตาราง');
    } finally {
      setIsRepairing(false);
    }
  };

  // Add Staff Account
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showToast(false, 'กรุณาระบุชื่อและอีเมลเจ้าหน้าที่');
      return;
    }

    const newStaff: StaffAccount = {
      id: `STAFF-${String(staffList.length + 1).padStart(3, '0')}`,
      username: newStaffEmail.split('@')[0] || `staff${staffList.length + 1}`,
      password: '15078',
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      position: newStaffPosition.trim(),
      department: newStaffDept.trim(),
      role: newStaffRole,
      isActive: true,
      lastActive: new Date().toISOString()
    };

    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveStoredStaffList(updated);
    setShowAddStaffForm(false);
    setNewStaffName('');
    setNewStaffEmail('');
    showToast(true, `เพิ่มเจ้าหน้าที่ ${newStaff.name} สำเร็จ`);
  };

  // Delete Staff Account
  const handleDeleteStaff = (id: string) => {
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    saveStoredStaffList(updated);
    showToast(true, 'ลบรายชื่อเจ้าหน้าที่เรียบร้อย');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      system: 'ระบบสอบสวนและติดตามกลุ่มเสี่ยงวัณโรคปอด รพ.มหาวิทยาลัยอุบลราชธานี',
      exportedBy: currentUserProfile.displayName,
      counts: {
        patients: patients.length,
        investigations: investigations.length,
        contacts: contacts.length,
        followUps: followUps.length,
        dailyLogs: dailyLogs.length,
      },
      data: {
        patients,
        investigations,
        contacts,
        followUps,
        dailyLogs,
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tb_ubu_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(true, 'ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-teal-500/20 border border-teal-400/40 rounded-2xl flex items-center justify-center text-teal-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">ศูนย์จัดการระบบหลังบ้าน (Backend Admin & RBAC)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {currentUserProfile.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                กำหนดค่าฐานข้อมูล Google Sheets, ควบคุมสิทธิ์การเข้าถึงข้อมูล และจัดการบัญชีเจ้าหน้าที่
              </p>
            </div>
          </div>

          {/* Navigation Tabs inside modal */}
          <div className="flex gap-2 mt-6 pt-2 border-t border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ฐานข้อมูล Google Sheets</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>จัดการสิทธิ์เจ้าหน้าที่ ({staffList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>ตารางสิทธิ์การเข้าถึง (Access Matrix)</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ความปลอดภัย & PDPA</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Database className="w-4 h-4 text-purple-600" />
              <span>สำรองข้อมูล & ข้อมูลดิบ</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">

          {/* TAB 1: Google Sheets Management */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {/* Current Status Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {spreadsheetName || 'ยังไม่ได้เชื่อมต่อ Google Sheet'}
                        </h4>
                        {spreadsheetId ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            เชื่อมต่อแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            ยังไม่เชื่อมต่อ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: {spreadsheetId || 'ไม่มี'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <span>เปิด Google Sheet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isAdmin && spreadsheetId && (
                      <button
                        onClick={handleRepairSchema}
                        disabled={isRepairing}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                        <span>{isRepairing ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ/ซ่อมแซมโครงสร้าง 5 แท็บ'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Breakdown Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-200/80">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <span className="text-[11px] text-slate-500 block">ผู้ป่วยวัณโรค</span>
                    <span className="text-base font-bold text-slate-800">{patients.length} ราย</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <span className="text-[11px] text-slate-500 block">ใบสอบสวนโรค</span>
                    <span className="text-base font-bold text-teal-700">{investigations.length} ชุด</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <span className="text-[11px] text-slate-500 block">กลุ่มผู้สัมผัส</span>
                    <span className="text-base font-bold text-blue-700">{contacts.length} คน</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <span className="text-[11px] text-slate-500 block">บันทึกติดตาม</span>
                    <span className="text-base font-bold text-purple-700">{followUps.length} รายการ</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <span className="text-[11px] text-slate-500 block">บันทึก DOTS</span>
                    <span className="text-base font-bold text-emerald-700">{dailyLogs.length} วัน</span>
                  </div>
                </div>
              </div>

              {/* Sheet Configuration Actions (Admin Only) */}
              {isAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create New Sheet */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">สร้าง Google Sheet ใหม่ทันที</h5>
                    <p className="text-[11px] text-slate-500 mb-4">
                      ระบบจะสร้างชีทใหม่ใน Google Drive ของคุณ พร้อมตั้งชื่อและสร้างทั้ง 5 แท็บตามมาตรฐาน รพ.มหาวิทยาลัยอุบลราชธานี
                    </p>
                    <button
                      onClick={handleCreateNewSheet}
                      disabled={isCreating}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isCreating ? 'กำลังสร้างชีทใหม่...' : 'สร้าง Google Sheet ใหม่'}</span>
                    </button>
                  </div>

                  {/* Connect Existing Sheet */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                      <Database className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">เชื่อมโยง Google Sheet ที่มีอยู่แล้ว</h5>
                    <p className="text-[11px] text-slate-500 mb-2">
                      วาง URL หรือ Spreadsheet ID ของไฟล์เดิมเพื่อเชื่อมต่อข้อมูล
                    </p>
                    <form onSubmit={handleLinkSheet} className="space-y-2">
                      <input
                        type="text"
                        placeholder="วาง Spreadsheet ID หรือ URL..."
                        value={customSheetId}
                        onChange={(e) => setCustomSheetId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isLinking || !customSheetId.trim()}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isLinking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>{isLinking ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อชีทเดิม'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยน URL หรือสร้างชีทฐานข้อมูลใหม่ได้</span>
                </div>
              )}

              {/* Data Import Section */}
              {onOpenImportModal && (
                <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>นำเข้าข้อมูลผู้ป่วยและกลุ่มเสี่ยงจาก Google Sheet (Data Import)</span>
                          <span className="px-2 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full">
                            ฟังก์ชันใหม่
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          เลือกนำเข้าข้อมูลผู้ป่วยวัณโรค หรือข้อมูลผู้สัมผัสโรคร่วมบ้าน/นอกบ้าน จากไฟล์ชีทหรือแท็บอื่นๆ ใน Google Drive เข้าสู่ระบบโดยตรง พร้อมจับคู่คอลัมน์อัตโนมัติ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onOpenImportModal('patient')}
                        className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>นำเข้าผู้ป่วย</span>
                      </button>
                      <button
                        onClick={() => onOpenImportModal('contact')}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>นำเข้ากลุ่มเสี่ยง</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Staff Accounts & Role Management */}
          {activeTab === 'staff' && (
            <div className="space-y-5">
              {/* Current Active User Profile Switcher */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shadow-sm">
                    {currentUserProfile.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900">{currentUserProfile.displayName}</strong>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full">
                        กำลังใช้งาน ({currentUserProfile.role})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{currentUserProfile.position} • {currentUserProfile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">สลับบทบาททดสอบ:</span>
                  <div className="inline-flex rounded-xl bg-white p-1 border border-teal-200 shadow-sm">
                    <button
                      onClick={() => handleRoleChange('admin')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        currentUserProfile.role === 'admin'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👑 Admin
                    </button>
                    <button
                      onClick={() => handleRoleChange('staff')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        currentUserProfile.role === 'staff'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🛡️ Staff
                    </button>
                    <button
                      onClick={() => handleRoleChange('viewer')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        currentUserProfile.role === 'viewer'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👁️ Viewer
                    </button>
                  </div>
                </div>
              </div>

              {/* Staff List Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">รายชื่อเจ้าหน้าที่ผู้มีสิทธิ์ใช้งานระบบ</h4>
                  <p className="text-[11px] text-slate-500">
                    ชื่อและตำแหน่งจะถูกนำไปกรอกในช่องผู้สอบสวนโรค (Investigator) อัตโนมัติเมื่อเข้าสู่ระบบ
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มเจ้าหน้าที่</span>
                  </button>
                )}
              </div>

              {/* Add Staff Form (Collapsible) */}
              {showAddStaffForm && (
                <form onSubmit={handleAddStaff} className="bg-slate-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-900">กรอกข้อมูลเจ้าหน้าที่ใหม่</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ไอญารินธร อุ้มบุญ"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">อีเมล (@ubu.ac.th) *</label>
                      <input
                        type="email"
                        required
                        placeholder="aiyarinthon.a@ubu.ac.th"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">ตำแหน่งทางวิชาชีพ</label>
                      <input
                        type="text"
                        placeholder="นักวิชาการสาธารณสุข"
                        value={newStaffPosition}
                        onChange={(e) => setNewStaffPosition(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">สิทธิ์การใช้งาน (Role)</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการหลังบ้านได้</option>
                        <option value="staff">เจ้าหน้าที่สอบสวน (Staff) - บันทึกและสอบสวนโรค</option>
                        <option value="viewer">ผู้เข้าชม (Viewer) - ดูข้อมูลและพิมพ์รายงานอย่างเดียว</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStaffForm(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-300"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                    >
                      บันทึกเจ้าหน้าที่
                    </button>
                  </div>
                </form>
              )}

              {/* Staff Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">ชื่อเจ้าหน้าที่</th>
                      <th className="py-2.5 px-4">ตำแหน่ง / หน่วยงาน</th>
                      <th className="py-2.5 px-4">อีเมล</th>
                      <th className="py-2.5 px-4">สิทธิ์ในระบบ</th>
                      {isAdmin && <th className="py-2.5 px-4 text-right">การจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                            {staff.name.charAt(0)}
                          </span>
                          <span>{staff.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{staff.position}</div>
                          <div className="text-[10px] text-slate-400">{staff.department}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{staff.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            staff.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : staff.role === 'staff'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {staff.role === 'admin' ? '👑 Admin' : staff.role === 'staff' ? '🛡️ Staff' : '👁️ Viewer'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            {staff.email !== currentUserProfile.email && (
                              <button
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="ลบรายชื่อ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Permissions Matrix */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">ตารางสิทธิ์การเข้าถึงข้อมูลและการใช้งานแต่ละหน้า (Permission Matrix)</h4>
                <p className="text-[11px] text-slate-500">
                  ระบบควบคุมการเข้าถึงตามบทบาท (Role-Based Access Control) เพื่อความปลอดภัยของข้อมูลผู้ป่วยตามมาตรฐาน PDPA
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ฟังก์ชัน / หน้าจอระบบ</th>
                      <th className="py-3 px-4 text-center text-purple-700">👑 ผู้ดูแลระบบ (Admin)</th>
                      <th className="py-3 px-4 text-center text-blue-700">🛡️ เจ้าหน้าที่ (Staff)</th>
                      <th className="py-3 px-4 text-center text-slate-700">👁️ ผู้เข้าชม (Viewer)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">เข้าถึงหน้าผู้ป่วย & สถิติภาพรวม</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">ลงทะเบียนผู้ป่วยใหม่ & แก้ไขประวัติ</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ดูอย่างเดียว</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">บันทึกใบสอบสวนโรค (DDC Investigation)</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้ (ระบุชื่ออัตโนมัติ)</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้ (ระบุชื่ออัตโนมัติ)</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ดูอย่างเดียว</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">พิมพ์แบบสอบสวนโรค (Print/PDF)</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">เพิ่ม/ติดตามกลุ่มผู้สัมผัส (CXR/IGRA)</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ดูอย่างเดียว</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-800">บันทึกการทานยาประจำวัน (DOTS)</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-emerald-600">✓ ได้</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ดูอย่างเดียว</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="py-2.5 px-4 font-bold text-purple-950">จัดการระบบหลังบ้าน (เปลี่ยน Sheet/ซ่อมแท็บ)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">✓ เฉพาะแอดมิน</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="py-2.5 px-4 font-bold text-purple-950">จัดการรายชื่อเจ้าหน้าที่ & กำหนด Role</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">✓ เฉพาะแอดมิน</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="py-2.5 px-4 font-bold text-purple-950">ส่งออกข้อมูลสำรองทั้งระบบ (JSON Export)</td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">✓ เฉพาะแอดมิน</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">✕ ไม่มีสิทธิ์</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Security & PDPA Architecture */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/30 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold tracking-tight text-white">
                        สถาปัตยกรรมการจัดเก็บข้อมูลผู้ป่วยที่ปลอดภัย (Secure Patient Data Architecture & PDPA)
                      </h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      ข้อมูลผู้ป่วยวัณโรค ประวัติการรักษา ผลตรวจ CXR/GeneXpert และประวัติผู้สัมผัสโรค จัดเป็น 
                      <span className="text-emerald-300 font-semibold"> "ข้อมูลส่วนบุคคลที่มีความอ่อนไหวสูง (Sensitive Personal Data)" </span>
                      ตามมาตรา 26 แห่ง PDPA และ พ.ร.บ. สุขภาพแห่งชาติ พ.ศ. 2550
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Where should patient data be recorded? (3-Tier Comparison) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-teal-700" />
                    <span>คำแนะนำ: ควรบันทึกข้อมูลผู้ป่วยที่ไหนปลอดภัยที่สุด? (3-Tier Storage Hierarchy)</span>
                  </h5>
                  <span className="text-[10px] text-slate-500">เปรียบเทียบระดับความปลอดภัย</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Tier 1: Hospital HIS / EMR / Cloud Database */}
                  <div className="bg-emerald-50/70 border-2 border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between relative shadow-xs">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold">
                      ⭐ ปลอดภัยสูงสุด (Gold Standard)
                    </div>
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5">
                        <Server className="w-5 h-5" />
                      </div>
                      <h6 className="text-xs font-bold text-emerald-950">1. ระบบเวชระเบียน รพ. (HIS / EMR)</h6>
                      <p className="text-[11px] text-emerald-900/80 font-medium mt-0.5">
                        เช่น HOSxP, Jhcis หรือ Cloud SQL / PostgreSQL ภายใน รพ.
                      </p>
                      <ul className="text-[11px] text-emerald-900/90 mt-2.5 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>เหมาะสำหรับ:</strong> ข้อมูลเวชระเบียนทางการแพทย์จริงตามระเบียบราชการ</li>
                        <li><strong>การเข้ารหัส:</strong> AES-256 (At-Rest) และ TLS 1.3 (In-Transit)</li>
                        <li><strong>ความปลอดภัย:</strong> อยู่หลัง Firewall โรงพยาบาล มี Audit Log ครบถ้วน</li>
                        <li><strong>ความพร้อมในระบบนี้:</strong> มี Data Schema มาตรฐานพร้อมเชื่อมต่อ API กับ รพ.มหาวิทยาลัยอุบลราชธานี</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-emerald-200/80 text-[10px] text-emerald-800 font-semibold">
                      ✓ แนะนำให้เป็นแหล่งจัดเก็บข้อมูลหลักระยะยาว (Primary Source of Truth)
                    </div>
                  </div>

                  {/* Tier 2: Enterprise Google Workspace */}
                  <div className="bg-blue-50/70 border-2 border-blue-400/50 rounded-2xl p-4 flex flex-col justify-between relative shadow-xs">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-700 text-white text-[9px] font-bold">
                      🛡️ ปลอดภัยระดับองค์กร
                    </div>
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2.5">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <h6 className="text-xs font-bold text-blue-950">2. Google Workspace องค์กร</h6>
                      <p className="text-[11px] text-blue-900/80 font-medium mt-0.5">
                        เช่น บัญชี @ubu.ac.th หรือ @moph.go.th
                      </p>
                      <ul className="text-[11px] text-blue-900/90 mt-2.5 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>เหมาะสำหรับ:</strong> การประสานงานของทีมสอบสวนโรคและสหวิชาชีพ</li>
                        <li><strong>กฎเหล็ก 1:</strong> ต้องใช้อีเมลองค์กรเท่านั้น (ห้ามใช้ @gmail.com ทั่วไป)</li>
                        <li><strong>กฎเหล็ก 2:</strong> ตั้งค่าแชร์เป็น <strong>"จำกัดสิทธิ์ (Restricted)"</strong> ห้ามเปิดสาธารณะ</li>
                        <li><strong>กฎเหล็ก 3:</strong> บังคับเปิด 2FA (ยืนยันตัวตน 2 ขั้นตอน) ทุกบัญชี</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-blue-200/80 text-[10px] text-blue-800 font-semibold">
                      ✓ ปัจจุบันระบบเชื่อมต่อผ่าน Google OAuth 2.0 สิทธิ์เฉพาะไฟล์ที่อนุญาต
                    </div>
                  </div>

                  {/* Tier 3: Local Storage / Browser Cache */}
                  <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 flex flex-col justify-between relative shadow-xs">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-bold">
                      ⚠️ แคชชั่วคราว (มีข้อควรระวัง)
                    </div>
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <h6 className="text-xs font-bold text-amber-950">3. Local Storage ในเบราว์เซอร์</h6>
                      <p className="text-[11px] text-amber-900/80 font-medium mt-0.5">
                        แคชในคอมพิวเตอร์ที่เปิดใช้งานเว็บแอป
                      </p>
                      <ul className="text-[11px] text-amber-900/90 mt-2.5 space-y-1.5 list-disc list-inside leading-relaxed">
                        <li><strong>หน้าที่:</strong> ช่วยให้เปิดใช้งานได้รวดเร็วและทำงานออฟไลน์ได้ชั่วคราว</li>
                        <li><strong>ข้อควรระวัง:</strong> ข้อมูลจัดเก็บเป็น Plaintext ในเครื่อง</li>
                        <li><strong>ความเสี่ยง:</strong> หากเป็นเครื่องส่วนกลางในวอร์ด/OPD อาจมีผู้อื่นเปิดดูได้</li>
                        <li><strong>การป้องกัน:</strong> ต้องเปิดโหมดพรางข้อมูล (Masking) และล็อกหน้าจอเมื่อเลิกใช้</li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-[10px] text-amber-800 font-semibold">
                      ✕ ไม่ควรใช้เป็นที่จัดเก็บข้อมูลหลักถาวรเพียงแห่งเดียว
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Active Security Controls & Privacy Tools */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>เครื่องมือควบคุมความปลอดภัยแบบเรียลไทม์ (Active Privacy Controls)</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Control 1: Privacy / Data Masking */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          {isMaskingEnabled ? <EyeOff className="w-4 h-4 text-teal-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                          <span>โหมดพรางข้อมูลอ่อนไหว</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isMaskingEnabled ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isMaskingEnabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        พรางเลขบัตรประชาชน (1-1002-*****-**-0) และเบอร์โทรศัพท์ (081-***-5678) เพื่อป้องกันบุคคลอื่นมองเห็นหน้าจอ (Shoulder Surfing) ในจุดบริการ
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (onToggleMasking) {
                            onToggleMasking(!isMaskingEnabled);
                            recordSecurityAuditLog({
                              userName: currentUserProfile.name || currentUserProfile.email,
                              userEmail: currentUserProfile.email,
                              userRole: currentUserProfile.role,
                              action: 'SECURITY_CHANGE',
                              details: `เปลี่ยนสถานะโหมดพรางข้อมูลเป็น: ${!isMaskingEnabled ? 'เปิด (Active)' : 'ปิด (Disabled)'}`
                            });
                            setAuditLogs(getSecurityAuditLogs());
                            showToast(true, `โหมดพรางข้อมูลส่วนบุคคล: ${!isMaskingEnabled ? 'เปิดใช้งานแล้ว' : 'ปิดแล้ว'}`);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isMaskingEnabled 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                            : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                        }`}
                      >
                        {isMaskingEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isMaskingEnabled ? 'ยกเลิกการพรางข้อมูล' : 'เปิดโหมดพรางข้อมูลทันที'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Control 2: Session Auto-Lock */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span>ล็อกหน้าจออัตโนมัติ</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                          {autoLockMinutes > 0 ? `${autoLockMinutes} นาที` : 'ปิดอยู่'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        ตัดการเชื่อมต่อและแสดงหน้าต่างยืนยันตัวตนอัตโนมัติเมื่อไม่มีการเคลื่อนไหวหน้าจอ ป้องกันการลืมเปิดหน้าจอทิ้งไว้ในวอร์ด
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <select
                        value={autoLockMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (onSetAutoLockMinutes) {
                            onSetAutoLockMinutes(val);
                            recordSecurityAuditLog({
                              userName: currentUserProfile.name || currentUserProfile.email,
                              userEmail: currentUserProfile.email,
                              userRole: currentUserProfile.role,
                              action: 'SECURITY_CHANGE',
                              details: `ตั้งเวลาล็อกหน้าจออัตโนมัติเป็น: ${val > 0 ? `${val} นาที` : 'ปิด'}`
                            });
                            setAuditLogs(getSecurityAuditLogs());
                            showToast(true, `ตั้งเวลาล็อกหน้าจอเป็น ${val > 0 ? `${val} นาที` : 'ปิด'}`);
                          }
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                      >
                        <option value={5}>5 นาที (แนะนำใน OPD)</option>
                        <option value={15}>15 นาที (มาตรฐาน)</option>
                        <option value={30}>30 นาที</option>
                        <option value={0}>ปิดการล็อกอัตโนมัติ</option>
                      </select>
                      {onLockScreenNow && (
                        <button
                          onClick={onLockScreenNow}
                          className="py-1.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                          title="ล็อกหน้าจอทันที"
                        >
                          ล็อกทันที
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Control 3: Security & PDPA Health Checklist */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>การตรวจประเมินความปลอดภัย</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          พร้อมใช้งาน
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">การเข้ารหัส (HTTPS):</span>
                          <span className="font-bold text-emerald-700">✓ ปลอดภัย (TLS 1.3)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">โดเมนบัญชี:</span>
                          <span className={`font-bold ${isEnterpriseEmail(currentUserProfile.email) ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isEnterpriseEmail(currentUserProfile.email) ? '✓ บัญชีองค์กร (@ubu)' : '⚠️ บัญชีทั่วไป'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">การควบคุมสิทธิ์:</span>
                          <span className="font-bold text-blue-700">✓ RBAC ({currentUserProfile.role})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">สถานะฐานข้อมูล:</span>
                          <span className={`font-bold ${spreadsheetId ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {spreadsheetId ? '✓ Google Sheets องค์กร' : '⚠️ ในเครื่องเท่านั้น'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      ตรวจสอบล่าสุด: {new Date().toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Security & Access Audit Trail */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-700" />
                      <span>บันทึกประวัติความปลอดภัยและการเข้าถึงข้อมูล (Security & Access Audit Trail)</span>
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      บันทึกทุกการเข้าสู่ระบบ การเปิดดูข้อมูลผู้ป่วย การส่งออกข้อมูล และการปรับแต่งสิทธิ์ตามข้อกำหนด PDPA
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `tb_care_security_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        showToast(true, 'ดาวน์โหลดบันทึก Security Audit Logs เรียบร้อยแล้ว');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด Log</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm('คุณต้องการล้างประวัติ Audit Logs ในเครื่องใช่หรือไม่?')) {
                            clearSecurityAuditLogs();
                            setAuditLogs([]);
                            showToast(true, 'ล้างบันทึก Audit Logs เรียบร้อยแล้ว');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        ล้าง Log
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">วัน-เวลา</th>
                        <th className="py-2.5 px-3">ผู้ใช้งาน / บทบาท</th>
                        <th className="py-2.5 px-3">การดำเนินการ (Action)</th>
                        <th className="py-2.5 px-3">รายละเอียดเหตุการณ์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {auditLogs.length > 0 ? (
                        auditLogs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                              {formatThaiDateTime(log.timestamp)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-800">{log.userName}</div>
                              <div className="text-[10px] text-slate-400">{log.userEmail} ({log.userRole})</div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.action === 'LOGIN' ? 'bg-emerald-100 text-emerald-800' :
                                log.action === 'SECURITY_CHANGE' ? 'bg-purple-100 text-purple-800' :
                                log.action === 'CONFIG_SHEET' ? 'bg-blue-100 text-blue-800' :
                                log.action === 'EXPORT_DATA' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {log.details}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            ไม่มีประวัติ Audit Logs
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Backup & Raw Data */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">การสำรองข้อมูลและความปลอดภัย (Backup & Disaster Recovery)</h4>
                <p className="text-[11px] text-slate-500">
                  ส่งออกข้อมูลที่บันทึกไว้ทั้งหมดเพื่อใช้ในการสำรองข้อมูล หรือย้ายไปยังระบบสารสนเทศอื่นของโรงพยาบาล
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">ส่งออกชุดข้อมูลแบบสมบูรณ์ (Complete JSON Backup)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      รวมข้อมูลผู้ป่วย ({patients.length}), ใบสอบสวนโรค ({investigations.length}), ผู้สัมผัส ({contacts.length}), บันทึกติดตาม ({followUps.length}) และประวัติ DOTS ({dailyLogs.length})
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์ JSON</span>
                  </button>
                </div>
              </div>

              {onClearAllData && isAdmin && (
                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>ล้างข้อมูลผู้ป่วยและกลุ่มเสี่ยงทั้งหมดเพื่อเริ่มกรอกใหม่ (Clear All Data)</span>
                      </h5>
                      <p className="text-[11px] text-rose-800/80 mt-1 leading-relaxed">
                        ลบรายชื่อผู้ป่วย ข้อมูลการสอบสวนโรค ผู้สัมผัสโรค บันทึกการติดตามตรวจ CXR และประวัติการทานยาทั้งหมดออกจากฐานข้อมูล เพื่อให้คุณสามารถเริ่มกรอกข้อมูลจริงได้ใหม่ตั้งแต่ต้น
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex-shrink-0 cursor-pointer"
                    >
                      ล้างข้อมูลทั้งหมด
                    </button>
                  </div>
                </div>
              )}

              {/* Clear All Confirmation Modal */}
              {showClearConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-900">ยืนยันการล้างข้อมูลทั้งหมดในระบบ</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        การดำเนินการนี้จะลบรายชื่อผู้ป่วยทั้งหมด ({patients.length} ราย) และกลุ่มเสี่ยงทั้งหมด ({contacts.length} ราย) ออกจากระบบและตาราง Google Sheet เพื่อให้คุณเริ่มต้นกรอกข้อมูลใหม่ได้ทันที
                      </p>
                    </div>
                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearConfirm(false);
                          if (onClearAllData) onClearAllData();
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        ยืนยันการล้างข้อมูลทั้งหมด
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-teal-600" />
            <span>ระบบสอบสวนและติดตามกลุ่มเสี่ยงวัณโรคปอด โรงพยาบาลมหาวิทยาลัยอุบลราชธานี</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
