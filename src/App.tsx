import React, { useState, useEffect, useCallback } from 'react';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './lib/auth';
import { User } from 'firebase/auth';
import { 
  fetchAllPatients, 
  fetchAllDailyLogs, 
  fetchAllInvestigations,
  fetchAllContacts,
  fetchAllFollowUps,
  appendPatientToSheet, 
  updatePatientInSheet, 
  appendDailyLogToSheet, 
  saveInvestigationToSheet,
  saveContactToSheet,
  saveFollowUpToSheet,
  createTBSheet 
} from './lib/sheetsApi';
import { 
  Patient, 
  DailyLog, 
  InvestigationForm, 
  ContactPerson, 
  ContactFollowUp,
  UserProfile 
} from './types';
import { resolveUserProfile, Permissions, DEFAULT_STAFF_LIST } from './lib/userStore';
import { SheetConfigBanner } from './components/SheetConfigBanner';
import { PatientList } from './components/PatientList';
import { PatientDetailView } from './components/PatientDetailView';
import { PatientFormModal } from './components/PatientFormModal';
import { DailyLogModal } from './components/DailyLogModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { InvestigationModal } from './components/InvestigationModal';
import { ContactFormModal } from './components/ContactFormModal';
import { ContactFollowUpModal } from './components/ContactFollowUpModal';
import { ContactsView } from './components/ContactsView';
import { BackendAdminModal } from './components/BackendAdminModal';
import { 
  Activity, 
  Users, 
  BarChart3, 
  Pill, 
  FileSpreadsheet, 
  LogOut, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Stethoscope, 
  HeartHandshake,
  ExternalLink,
  RefreshCw,
  FileText,
  FileKey,
  Home,
  Shield,
  ShieldCheck,
  Crown,
  Settings,
  UserCheck,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import {
  INITIAL_PATIENTS,
  INITIAL_DAILY_LOGS,
  INITIAL_INVESTIGATIONS,
  INITIAL_CONTACTS,
  INITIAL_FOLLOWUPS
} from './data/initialData';

const STORAGE_SHEET_KEY = 'tb_care_spreadsheet_config';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | any>(() => {
    const saved = localStorage.getItem('tb_care_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default active staff: ไอญารินธร อุ้มบุญ (aiyarinthon.a@ubu.ac.th)
    return {
      uid: 'STAFF-UBU-001',
      email: 'aiyarinthon.a@ubu.ac.th',
      displayName: 'ไอญารินธร อุ้มบุญ',
      photoURL: ''
    };
  });

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    return resolveUserProfile({
      uid: 'STAFF-UBU-001',
      email: 'aiyarinthon.a@ubu.ac.th',
      displayName: 'ไอญารินธร อุ้มบุญ'
    });
  });

  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBackendAdminModalOpen, setIsBackendAdminModalOpen] = useState(false);

  // Spreadsheet State
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_SHEET_KEY}_id`) || null;
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_SHEET_KEY}_url`) || null;
  });
  const [spreadsheetName, setSpreadsheetName] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_SHEET_KEY}_name`) || null;
  });

  // App Data State (Initialized with comprehensive records so dashboard & contacts are always functional)
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(INITIAL_DAILY_LOGS);
  const [investigations, setInvestigations] = useState<InvestigationForm[]>(INITIAL_INVESTIGATIONS);
  const [contacts, setContacts] = useState<ContactPerson[]>(INITIAL_CONTACTS);
  const [followUps, setFollowUps] = useState<ContactFollowUp[]>(INITIAL_FOLLOWUPS);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'contacts' | 'analytics'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Patient Modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Daily Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logTargetPatient, setLogTargetPatient] = useState<Patient | null>(null);

  // Investigation Modal
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [investigationTargetPatient, setInvestigationTargetPatient] = useState<Patient | null>(null);

  // Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [contactDefaultPatient, setContactDefaultPatient] = useState<Patient | null>(null);
  const [contactDefaultType, setContactDefaultType] = useState<'household' | 'non_household'>('household');

  // Follow-up Modal
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetContact, setFollowUpTargetContact] = useState<ContactPerson | null>(null);
  const [followUpDefaultStep, setFollowUpDefaultStep] = useState<ContactFollowUp['stepType'] | undefined>(undefined);

  // Notification helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 4500);
  };

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
        if (user) {
          setCurrentUserProfile(resolveUserProfile(user));
        }
        setIsAuthLoading(false);
      },
      () => {
        // If not signed in with Google OAuth, preserve current staff session
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        const profile = resolveUserProfile(res.user);
        setCurrentUserProfile(profile);
        showToast('success', `ยินดีต้อนรับ ${profile.displayName} (${profile.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : profile.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้เข้าชม'})`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'การเข้าสู่ระบบด้วย Google ล้มเหลว');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffLogin = (email: string) => {
    const staffMatch = DEFAULT_STAFF_LIST.find(s => s.email.toLowerCase() === email.toLowerCase());
    const mockUser = {
      uid: staffMatch?.id || 'STAFF-UBU-001',
      email: staffMatch?.email || email,
      displayName: staffMatch?.name || 'ไอญารินธร อุ้มบุญ',
      photoURL: ''
    };
    setCurrentUser(mockUser);
    const profile = resolveUserProfile(mockUser);
    setCurrentUserProfile(profile);
    localStorage.setItem('tb_care_active_user', JSON.stringify(mockUser));
    showToast('success', `เข้าสู่ระบบในฐานะ ${profile.displayName} (${profile.position}) เรียบร้อยแล้ว`);
  };

  const handleSignOut = async () => {
    await logout();
    setToken(null);
    setCurrentUser(null);
    setCurrentUserProfile(null);
    localStorage.removeItem('tb_care_active_user');
    showToast('success', 'ออกจากระบบเรียบร้อยแล้ว');
  };

  // Load Data from Google Sheet across all 5 tabs
  const loadSheetData = useCallback(async () => {
    if (!token || !spreadsheetId) return;
    setIsDataLoading(true);
    try {
      const [
        fetchedPatients, 
        fetchedLogs, 
        fetchedInvestigations, 
        fetchedContacts, 
        fetchedFollowUps
      ] = await Promise.all([
        fetchAllPatients(token, spreadsheetId),
        fetchAllDailyLogs(token, spreadsheetId),
        fetchAllInvestigations(token, spreadsheetId),
        fetchAllContacts(token, spreadsheetId),
        fetchAllFollowUps(token, spreadsheetId),
      ]);

      setPatients(fetchedPatients);
      setDailyLogs(fetchedLogs);
      setInvestigations(fetchedInvestigations);
      setContacts(fetchedContacts);
      setFollowUps(fetchedFollowUps);
      
      // Update selected patient if currently viewing
      if (selectedPatient) {
        const updated = fetchedPatients.find(p => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    } catch (err: any) {
      console.error('Error fetching sheet data:', err);
      showToast('error', `ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้: ${err.message}`);
    } finally {
      setIsDataLoading(false);
    }
  }, [token, spreadsheetId, selectedPatient?.id]);

  useEffect(() => {
    if (token && spreadsheetId) {
      loadSheetData();
    }
  }, [token, spreadsheetId]);

  // Handle Sheet Config Change
  const handleConfigChange = (id: string, url: string, name: string) => {
    setSpreadsheetId(id);
    setSpreadsheetUrl(url);
    setSpreadsheetName(name);

    localStorage.setItem(`${STORAGE_SHEET_KEY}_id`, id);
    localStorage.setItem(`${STORAGE_SHEET_KEY}_url`, url);
    localStorage.setItem(`${STORAGE_SHEET_KEY}_name`, name);

    showToast('success', 'บันทึกการเชื่อมโยง Google Sheet สำเร็จแล้ว');
  };

  // 1. Save/Update Patient
  const handleSavePatient = async (patientData: Patient) => {
    if (!token || !spreadsheetId) throw new Error('ยังไม่ได้เชื่อมต่อ Google Sheet หรือหมดอายุการเชื่อมต่อ');

    const isEdit = patients.some(p => p.id === patientData.id);
    if (isEdit) {
      await updatePatientInSheet(token, spreadsheetId, patientData);
      setPatients(prev => prev.map(p => p.id === patientData.id ? patientData : p));
      if (selectedPatient?.id === patientData.id) setSelectedPatient(patientData);
      showToast('success', `อัปเดตข้อมูลผู้ป่วย ${patientData.fullName} (HN: ${patientData.hn}) ลง Google Sheet เรียบร้อยแล้ว`);
    } else {
      await appendPatientToSheet(token, spreadsheetId, patientData);
      setPatients(prev => [patientData, ...prev]);
      showToast('success', `ลงทะเบียนผู้ป่วย ${patientData.fullName} (HN: ${patientData.hn}) ลง Google Sheet สำเร็จ`);
    }
  };

  // 2. Save Daily Log
  const handleSaveDailyLog = async (logData: DailyLog) => {
    if (!token || !spreadsheetId) throw new Error('ยังไม่ได้เชื่อมต่อ Google Sheet หรือหมดอายุการเชื่อมต่อ');

    await appendDailyLogToSheet(token, spreadsheetId, logData);
    setDailyLogs(prev => [logData, ...prev]);
    showToast('success', `บันทึกข้อมูลการทานยาวันที่ ${logData.date} สำเร็จ`);
  };

  // 3. Save Investigation Form
  const handleSaveInvestigation = async (invData: InvestigationForm) => {
    if (!token || !spreadsheetId) throw new Error('ยังไม่ได้เชื่อมต่อ Google Sheet หรือหมดอายุการเชื่อมต่อ');

    await saveInvestigationToSheet(token, spreadsheetId, invData);
    setInvestigations(prev => {
      const idx = prev.findIndex(i => i.id === invData.id || i.patientId === invData.patientId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = invData;
        return copy;
      }
      return [invData, ...prev];
    });

    // Update patient investigationStatus & contact counts
    setPatients(prev => prev.map(p => {
      if (p.id === invData.patientId || p.hn === invData.patientHN) {
        return {
          ...p,
          investigationStatus: 'completed',
          householdContactsCount: invData.householdContactsCount,
          nonHouseholdContactsCount: invData.nonHouseholdContactsCount,
        };
      }
      return p;
    }));

    showToast('success', `บันทึกข้อมูลการสอบสวนโรคผู้ป่วย ${invData.patientName} ลง Google Sheet สำเร็จ`);
  };

  // 4. Save/Update Contact Person
  const handleSaveContact = async (contactData: ContactPerson) => {
    if (!token || !spreadsheetId) throw new Error('ยังไม่ได้เชื่อมต่อ Google Sheet หรือหมดอายุการเชื่อมต่อ');

    await saveContactToSheet(token, spreadsheetId, contactData);
    const isEdit = contacts.some(c => c.id === contactData.id);
    if (isEdit) {
      setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
      showToast('success', `อัปเดตข้อมูลผู้สัมผัส ${contactData.fullName} ลง Google Sheet เรียบร้อยแล้ว`);
    } else {
      setContacts(prev => [contactData, ...prev]);
      showToast('success', `เพิ่มข้อมูลผู้สัมผัส ${contactData.fullName} (HN: ${contactData.hn}) ลง Google Sheet สำเร็จ`);
    }
  };

  // 5. Save Follow-up
  const handleSaveFollowUp = async (followUpData: ContactFollowUp) => {
    if (!token || !spreadsheetId) throw new Error('ยังไม่ได้เชื่อมต่อ Google Sheet หรือหมดอายุการเชื่อมต่อ');

    await saveFollowUpToSheet(token, spreadsheetId, followUpData);
    setFollowUps(prev => {
      const idx = prev.findIndex(f => f.id === followUpData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = followUpData;
        return copy;
      }
      return [followUpData, ...prev];
    });

    // Update contact screeningStatus, CXR data, and NTIP data
    let contactToUpdate: ContactPerson | null = null;
    setContacts(prev => prev.map(c => {
      if (c.id === followUpData.contactId) {
        const isCxrStep = followUpData.stepType.startsWith('cxr_');
        const updated: ContactPerson = {
          ...c,
          screeningStatus: followUpData.testResult === 'normal' ? 'screened_normal' :
                           followUpData.testResult === 'abnormal_suspect_tb' ? 'abnormal_investigating' :
                           c.screeningStatus,
          ntipKeyCode: followUpData.ntipKeyCode || c.ntipKeyCode,
          ntipStatus: followUpData.ntipKeyCode ? 'entered' : c.ntipStatus,
          ntipNotes: followUpData.ntipNotes || c.ntipNotes,
          cxrStatus: isCxrStep 
            ? (followUpData.status === 'completed' ? 'done' : 'pending')
            : c.cxrStatus,
          cxrRound: isCxrStep ? (followUpData.stepType as any) : c.cxrRound,
          cxrDate: isCxrStep ? (followUpData.actualDate || followUpData.scheduledDate || c.cxrDate) : c.cxrDate,
          cxrResult: isCxrStep ? (followUpData.testResult as any || c.cxrResult) : c.cxrResult,
          cxrResultDetail: isCxrStep ? (followUpData.resultDetail || c.cxrResultDetail) : c.cxrResultDetail,
          cxrHospital: followUpData.hospitalOrFacility || c.cxrHospital,
          nextCxrDate: followUpData.nextAppointmentDate || c.nextCxrDate,
          updatedAt: new Date().toISOString(),
        };
        contactToUpdate = updated;
        return updated;
      }
      return c;
    }));

    if (contactToUpdate) {
      try {
        await saveContactToSheet(token, spreadsheetId, contactToUpdate);
      } catch (err) {
        console.error('Failed to sync contact status to sheet:', err);
      }
    }

    showToast('success', `บันทึกผลการติดตามตรวจ (${followUpData.stepType}) ลง Google Sheet สำเร็จ`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-100">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  ระบบสอบสวนและติดตามกลุ่มเสี่ยงวัณโรคปอด
                </h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Admin / Role Badge & Quick Backend button */}
                <button
                  onClick={() => setIsBackendAdminModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border ${
                    currentUserProfile?.role === 'admin'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : currentUserProfile?.role === 'staff'
                      ? 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="คลิกเพื่อเปิดระบบจัดการหลังบ้าน, สิทธิ์ผู้ใช้งาน, และฐานข้อมูล Google Sheet"
                >
                  {currentUserProfile?.role === 'admin' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                  ) : currentUserProfile?.role === 'staff' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>
                    {currentUserProfile?.role === 'admin'
                      ? '⚙️ จัดการหลังบ้าน (Admin)'
                      : currentUserProfile?.role === 'staff'
                      ? '🛡️ เจ้าหน้าที่ (Staff)'
                      : '👁️ ผู้เข้าชม (Viewer)'}
                  </span>
                </button>

                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {currentUserProfile?.displayName || currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[10px] text-teal-800 font-medium flex items-center justify-end gap-1">
                    <span className="truncate max-w-[160px] text-slate-500">{currentUserProfile?.position}</span>
                  </div>
                </div>

                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Notification */}
        {statusNotification && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-semibold ${
            statusNotification.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : 'bg-rose-800 text-white border-rose-600'
          }`}>
            {statusNotification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-200 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-200 flex-shrink-0" />
            )}
            <span>{statusNotification.message}</span>
          </div>
        )}

        {/* Not Logged In State */}
        {!currentUser ? (
          <div className="py-12 px-4 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-600 to-emerald-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-600/20">
              <Stethoscope className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              ระบบสอบสวนและติดตามกลุ่มเสี่ยงวัณโรคปอด
            </h2>
            <div className="text-base font-bold text-teal-800 mb-8">
              โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
            </div>

            {/* Google Sign-in Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn || isAuthLoading}
              className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google Account'}</span>
            </button>

            {/* Quick Staff Login Option */}
            <div className="mt-5 pt-5 border-t border-slate-200">
              <div className="text-xs text-slate-500 mb-2">หรือเข้าใช้งานด้วยบัญชีเจ้าหน้าที่ประจำการ:</div>
              <button
                onClick={() => handleStaffLogin('aiyarinthon.a@ubu.ac.th')}
                className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>เข้าใช้งานในฐานะ คุณไอญารินธร อุ้มบุญ (แอดมิน / นักวิชาการสาธารณสุข)</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Google Sheets Connection Banner */}
            <SheetConfigBanner
              accessToken={token!}
              spreadsheetId={spreadsheetId}
              spreadsheetUrl={spreadsheetUrl}
              spreadsheetName={spreadsheetName}
              onConfigChange={handleConfigChange}
              onRefreshData={loadSheetData}
              isLoading={isDataLoading}
            />

            {/* Primary Navigation Tabs - Always Accessible */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex flex-wrap gap-2">
                {/* 1. Dashboard Tab */}
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedPatient(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    (activeTab === 'dashboard' || activeTab === 'analytics') && !selectedPatient
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  <span>แดชบอร์ด (Dashboard)</span>
                </button>

                {/* 2. Patients Tab */}
                <button
                  onClick={() => {
                    setActiveTab('patients');
                    setSelectedPatient(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'patients' && !selectedPatient
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>ผู้ป่วยวัณโรครายใหม่</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'patients' && !selectedPatient
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {patients.length}
                  </span>
                </button>

                {/* 3. Contact Tracing Tab */}
                <button
                  onClick={() => {
                    setActiveTab('contacts');
                    setSelectedPatient(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'contacts' && !selectedPatient
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  <span>แถบการติดตามกลุ่มเสี่ยง (Contact Tracing)</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'contacts' && !selectedPatient
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {contacts.length}
                  </span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setContactDefaultPatient(null);
                    setIsContactModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มผู้สัมผัสโรค</span>
                </button>

                <button
                  onClick={() => {
                    setEditingPatient(null);
                    setIsPatientModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ลงทะเบียนผู้ป่วยใหม่</span>
                </button>
              </div>
            </div>

            {/* Breadcrumb banner when patient is selected */}
            {selectedPatient && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-teal-50 border border-teal-200/80 rounded-2xl px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 px-2.5 py-1 bg-white rounded-lg border border-teal-200 shadow-2xs transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับสู่รายชื่อผู้ป่วย</span>
                  </button>
                  <span className="text-teal-300">/</span>
                  <span className="font-semibold text-slate-800">
                    ข้อมูลผู้ป่วย: <span className="font-bold text-teal-900">{selectedPatient.fullName}</span> (HN: {selectedPatient.hn})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('contacts');
                      setSelectedPatient(null);
                    }}
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-medium underline cursor-pointer"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>ดูผู้สัมผัสเสี่ยงทั้งหมด ({contacts.length} ราย)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Views */}
            {selectedPatient ? (
              <PatientDetailView
                patient={selectedPatient}
                logs={dailyLogs.filter(l => l.patientId === selectedPatient.id)}
                investigation={investigations.find(i => i.patientId === selectedPatient.id || i.patientHN === selectedPatient.hn)}
                contacts={contacts.filter(c => c.indexPatientId === selectedPatient.id || c.indexPatientHN === selectedPatient.hn)}
                onOpenLogModal={() => {
                  setLogTargetPatient(selectedPatient);
                  setIsLogModalOpen(true);
                }}
                onEditPatient={() => {
                  setEditingPatient(selectedPatient);
                  setIsPatientModalOpen(true);
                }}
                onOpenInvestigationModal={() => {
                  setInvestigationTargetPatient(selectedPatient);
                  setIsInvestigationModalOpen(true);
                }}
                onOpenNewContact={(p, type) => {
                  setEditingContact(null);
                  setContactDefaultPatient(p);
                  setContactDefaultType(type || 'household');
                  setIsContactModalOpen(true);
                }}
                onEditContact={(c) => {
                  setEditingContact(c);
                  setIsContactModalOpen(true);
                }}
                onClose={() => setSelectedPatient(null)}
                spreadsheetUrl={spreadsheetUrl}
                currentUserProfile={currentUserProfile}
              />
            ) : activeTab === 'patients' ? (
              <PatientList
                patients={patients}
                logs={dailyLogs}
                investigations={investigations}
                contacts={contacts}
                currentUserProfile={currentUserProfile}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onOpenNewPatient={() => {
                  setEditingPatient(null);
                  setIsPatientModalOpen(true);
                }}
                onOpenQuickLog={(p) => {
                  setLogTargetPatient(p);
                  setIsLogModalOpen(true);
                }}
                onOpenInvestigation={(p) => {
                  setInvestigationTargetPatient(p);
                  setIsInvestigationModalOpen(true);
                }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            ) : activeTab === 'contacts' ? (
              <ContactsView
                contacts={contacts}
                followUps={followUps}
                patients={patients}
                currentUserProfile={currentUserProfile}
                onOpenNewContact={(p, type) => {
                  setEditingContact(null);
                  setContactDefaultPatient(p || null);
                  setContactDefaultType(type || 'household');
                  setIsContactModalOpen(true);
                }}
                onEditContact={(c) => {
                  setEditingContact(c);
                  setIsContactModalOpen(true);
                }}
                onOpenFollowUpModal={(c, step) => {
                  setFollowUpTargetContact(c);
                  setFollowUpDefaultStep(step);
                  setIsFollowUpModalOpen(true);
                }}
                spreadsheetUrl={spreadsheetUrl}
              />
            ) : (
              <AnalyticsDashboard 
                patients={patients} 
                logs={dailyLogs}
                contacts={contacts}
                followUps={followUps}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setSelectedPatient(null);
                }}
              />
            )}
          </div>
        )}

        {/* Modal: Patient Registration */}
        {isPatientModalOpen && (
          <PatientFormModal
            isOpen={isPatientModalOpen}
            onClose={() => setIsPatientModalOpen(false)}
            onSave={handleSavePatient}
            initialData={editingPatient}
            currentUserProfile={currentUserProfile}
          />
        )}

        {/* Modal: Daily DOTS Medication Log */}
        {isLogModalOpen && logTargetPatient && (
          <DailyLogModal
            isOpen={isLogModalOpen}
            onClose={() => {
              setIsLogModalOpen(false);
              setLogTargetPatient(null);
            }}
            onSave={handleSaveDailyLog}
            patient={logTargetPatient}
            currentUserName={currentUserProfile?.displayName || currentUser?.displayName || currentUser?.email || 'เจ้าหน้าที่'}
          />
        )}

        {/* Modal: DDC Investigation Form */}
        {isInvestigationModalOpen && investigationTargetPatient && (
          <InvestigationModal
            isOpen={isInvestigationModalOpen}
            onClose={() => {
              setIsInvestigationModalOpen(false);
              setInvestigationTargetPatient(null);
            }}
            onSave={handleSaveInvestigation}
            patient={investigationTargetPatient}
            existingInvestigation={investigations.find(i => i.patientId === investigationTargetPatient.id || i.patientHN === investigationTargetPatient.hn)}
            currentUserProfile={currentUserProfile}
            onOpenAddContacts={(p, type) => {
              setIsInvestigationModalOpen(false);
              setEditingContact(null);
              setContactDefaultPatient(p);
              setContactDefaultType(type || 'household');
              setIsContactModalOpen(true);
            }}
          />
        )}

        {/* Modal: Contact Registration */}
        {isContactModalOpen && (
          <ContactFormModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            onSave={handleSaveContact}
            patients={patients}
            initialData={editingContact}
            defaultPatient={contactDefaultPatient}
            defaultContactType={contactDefaultType}
            currentUserProfile={currentUserProfile}
          />
        )}

        {/* Modal: Contact Follow-Up Record */}
        {isFollowUpModalOpen && followUpTargetContact && (
          <ContactFollowUpModal
            isOpen={isFollowUpModalOpen}
            onClose={() => {
              setIsFollowUpModalOpen(false);
              setFollowUpTargetContact(null);
              setFollowUpDefaultStep(undefined);
            }}
            onSave={handleSaveFollowUp}
            contact={followUpTargetContact}
            defaultStep={followUpDefaultStep}
            currentUserName={currentUserProfile?.displayName || currentUser?.displayName || currentUser?.email || 'เจ้าหน้าที่'}
          />
        )}

        {/* Modal: Backend Admin Management & RBAC */}
        {isBackendAdminModalOpen && (
          <BackendAdminModal
            isOpen={isBackendAdminModalOpen}
            onClose={() => setIsBackendAdminModalOpen(false)}
            accessToken={token || ''}
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            spreadsheetName={spreadsheetName}
            onConfigChange={handleConfigChange}
            onRefreshData={loadSheetData}
            currentUserProfile={currentUserProfile}
            onUpdateUserProfile={(profile) => {
              setCurrentUserProfile(profile);
              showToast('success', `อัปเดตสิทธิ์เป็น ${profile.displayName} (${profile.role}) เรียบร้อยแล้ว`);
            }}
            allPatients={patients}
            allDailyLogs={dailyLogs}
            allInvestigations={investigations}
            allContacts={contacts}
            allFollowUps={followUps}
          />
        )}
      </main>
    </div>
  );
}
