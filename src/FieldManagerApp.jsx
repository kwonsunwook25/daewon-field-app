import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import SignaturePadPopup from './SignaturePadPopup';

const CORPORATIONS = [
  "대원전기(주)", "우창전력(주)", "세대전력(주)", "(주)태원전력공사", "(주)정동전력",
  "보람전설(주)", "화신전기(주)", "우림전기(주)", "(주)창전사", "(주)대원전기교육원",
  "대상전력(주)", "대홍전건(주)", "태홍전력(주)", "대원산전(주)", "대명전업(주)"
];

const CONSTRUCTION_TYPES = [
  "내선공사", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  // 보안 및 계정 세션 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [securityAuthCode, setSecurityAuthCode] = useState(''); 
  const [isSecondStep, setIsSecondStep] = useState(false); 

  // [👑 1번 사수] 권세원 최고마스터 / 권선욱 현장총괄 / 권소영 재무총괄 삼각 계정 전산풀
  const [userRoster, setUserRoster] = useState([
    { id: 'u-1', loginId: 'master', name: '권세원 최고마스터', role: 'master', password: '123', authKey: '7777' },
    { id: 'u-4', loginId: 'sunwook', name: '권선욱 현장총괄', role: 'master', password: '123', authKey: '8888' }, 
    { id: 'u-5', loginId: 'soyoung', name: '권소영 재무총괄', role: 'finance', password: '123', authKey: '9999' }, 
    { id: 'u-2', loginId: 'admin1', name: '본사재무팀', role: 'admin', password: '123', authKey: '1111' },
    { id: 'u-3', loginId: 'manager1', name: '증평현장소장', role: 'manager', password: '123', authKey: '2222' }
  ]);

  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('manager');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAuthKey, setNewUserAuthKey] = useState('');

  const [activeTab, setActiveTab] = useState('daily');

  // 현장 마스터 정보 DB
  const [siteProperties, setSiteProperties] = useState([
    { id: 's-1', corp: '대원전기(주)', siteName: '증평 지중화 공사 현장', constType: '배전', agent: '홍길동', manager: '김철수', contractDate: '2026-01-02', startDate: '2026-01-15', endDate: '2026-12-31' },
    { id: 's-2', corp: '대원전기(주)', siteName: '청주 한전 배전단가 현장', constType: '배전', agent: '이영희', manager: '박반장', contractDate: '2026-01-01', startDate: '2026-01-01', endDate: '2026-12-31' },
    { id: 's-3', corp: '우창전력(주)', siteName: '진천 변전소 신설 공사', constType: '변전', agent: '최소장', manager: '박소장', contractDate: '2026-02-10', startDate: '2026-03-01', endDate: '2027-05-30' },
    { id: 's-4', corp: '세대전력(주)', siteName: '증평 구내통신망 구축 현장', constType: 'kt', agent: '이통신', manager: '최소장', contractDate: '2026-03-01', startDate: '2026-03-10', endDate: '2026-11-30' }
  ]);

  const [newSiteCorp, setNewSiteCorp] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteConstType, setNewSiteConstType] = useState('');
  const [newSiteAgent, setNewSiteAgent] = useState('');
  const [newSiteManager, setNewSiteManager] = useState('');
  const [newSiteContractDate, setNewSiteContractDate] = useState('');
  const [newSiteStartDate, setNewSiteStartDate] = useState('');
  const [newSiteEndDate, setNewSiteEndDate] = useState('');

  // 전사 인력풀 DB
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 },
  ]);

  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); 
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); 
  const [editingWorker, setEditingWorker] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSiteId, setActiveSiteId] = useState('');
  const [isZoomDashboardOpen, setIsZoomDashboardOpen] = useState(false);

  // 실시간 출역 명단 데이터셋
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([
    {
      id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000, healthOk: true, signatureUrl: 'done',
      timeSlots: [
        { slotId: 'sl-1', corp: '대원전기(주)', siteId: 's-1', constType: '배전', baseHours: 4, otHours: 0 },
        { slotId: 'sl-2', corp: '우창전력(주)', siteId: 's-3', constType: '변전', baseHours: 4, otHours: 0 }
      ]
    },
    {
      id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000, healthOk: true, signatureUrl: 'done',
      timeSlots: [
        { slotId: 'sl-4', corp: '대원전기(주)', siteId: 's-1', constType: '배전', baseHours: 4, otHours: 0 }
      ]
    },
    {
      id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0, healthOk: true, signatureUrl: 'done',
      timeSlots: [
        { slotId: 'sl-5', corp: '우창전력(주)', siteId: 's-3', constType: '변전', baseHours: 4, otHours: 0 },
        { slotId: 'sl-6', corp: '대원전기(주)', siteId: 's-1', constType: '배전', baseHours: 4, otHours: 0 }
      ]
    }
  ]);

  // 역대 적산 누적 인건비 원가 데이터
  const [historyConfig] = useState({
    systemStartDate: "2026-01-01", 
    systemCurrentDate: "2026-05-22", 
    pastAccumulatedSiteLogs: {
      's-1': 148500000, 's-2': 92400000, 's-3': 213000000, 's-4': 45000000   
    }
  });

  // 권한 변수 선언 시점 고정 (흰화면 크래시 방지 핵심 요충지)
  const isMasterOrFieldTotal = currentUser && currentUser.role === 'master';
  const isFinanceAccessible = currentUser && (currentUser.role === 'master' || currentUser.role === 'finance');

  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const cleanNumber = String(value).replace(/[^0-9]/g, ''); 
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ','); 
  };

  const removeCommas = (str) => {
    return Number(String(str).replace(/,/g, '')) || 0;
  };

  // 로그인 인증
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const account = userRoster.find(u => u.loginId === loginId.trim());
    if (!account || account.password !== loginPassword) {
      alert("⚠️ 자격 증명이 올바르지 않습니다.");
      return;
    }
    setCurrentUser(account);
    setIsSecondStep(true);
  };

  const handleAuthKeySubmit = (e) => {
    e.preventDefault();
    if (currentUser.authKey === securityAuthCode.trim()) {
      setIsLoggedIn(true);
      setIsSecondStep(false);
      alert(`🔒 인증 통과: [${currentUser.name}] 등급 접속 허가.`);
    } else {
      alert("⚠️ 보안 인증키 오류");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(null); setLoginId(''); setLoginPassword(''); setSecurityAuthCode(''); setActiveTab('daily'); setActiveSiteId('');
  };

  // 인프라 생성 로직부
  const handleCreateUser = (e) => {
    e.preventDefault();
    const newUser = { id: `user-${Date.now()}`, loginId: newUserId.trim(), name: newUserName.trim(), role: newUserRole, password: newUserPassword, authKey: newUserAuthKey.trim() };
    setUserRoster([...userRoster, newUser]);
    setNewUserId(''); setNewUserName(''); setNewUserPassword(''); setNewUserAuthKey('');
    alert("✅ 계정 발급 승인.");
  };

  const handleAddSite = (e) => {
    e.preventDefault();
    const newSite = {
      id: `site-${Date.now()}`, corp: newSiteCorp, siteName: newSiteName.trim(), constType: newSiteConstType,
      agent: newSiteAgent.trim(), manager: newSiteManager.trim(), contractDate: newSiteContractDate || '-', startDate: newSiteStartDate || '-', endDate: newSiteEndDate || '-'
    };
    setSiteProperties([...siteProperties, newSite]);
    setNewSiteName(''); setNewSiteAgent(''); setNewSiteManager('');
    alert("🏢 현장 전산 개설 완료.");
  };

  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    const wageNum = removeCommas(adminWageInput);
    const allowanceNum = removeCommas(adminAllowanceInput);
    const newWorker = {
      id: `admin-${Date.now()}`, corp: adminCorp, constType: adminType, name: adminName.trim(), type: adminWorkerType, specialAllowance: allowanceNum,
      ...(adminWorkerType === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };
    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName(''); setAdminWageInput(''); setAdminAllowanceInput('');
    alert("✅ 인력 등록 완료.");
  };

  const handleSaveEditedWorker = (e) => {
    e.preventDefault();
    const wageNum = removeCommas(editingWorker.wageInput);
    const allowanceNum = removeCommas(editingWorker.specialAllowance);
    const updatedWorker = {
      id: editingWorker.id, corp: editingWorker.corp, constType: editingWorker.constType, name: editingWorker.name.trim(), type: editingWorker.type, specialAllowance: allowanceNum,
      ...(editingWorker.type === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };
    setMasterWorkerPool(masterWorkerPool.map(w => w.id === editingWorker.id ? updatedWorker : w));
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === editingWorker.id ? { ...w, ...updatedWorker } : w));
    setEditingWorker(null);
    alert("⚙️ 근로자 정보 반영 완료.");
  };

  const handleAdminDeleteWorker = (workerId, workerName) => {
    if (!window.confirm(`⚠️ '${workerName}' 근로자를 삭제하시겠습니까?`)) return;
    setMasterWorkerPool(masterWorkerPool.filter(w => w.id !== workerId));
    setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== workerId));
  };

  const handleToggleWorkerToActiveSite = (worker) => {
    if (!activeSiteId) return alert("현장을 먼저 지정하세요.");
    const targetSiteObj = siteProperties.find(s => s.id === activeSiteId);
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);

    if (isAlreadyAdded) {
      const targetWorker = todayActiveWorkers.find(w => w.id === worker.id);
      const hasThisSiteSlot = targetWorker.timeSlots.some(s => s.siteId === activeSiteId);
      if (hasThisSiteSlot) {
        if (targetWorker.timeSlots.length === 1) {
          setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
        } else {
          setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? { ...w, timeSlots: w.timeSlots.filter(s => s.siteId !== activeSiteId) } : w));
        }
      } else {
        const currentTotalBase = targetWorker.timeSlots.reduce((sum, s) => sum + s.baseHours, 0);
        const remainingHours = 8 - currentTotalBase;
        const initialSlotBase = remainingHours > 0 ? remainingHours : 0;

        setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? { 
          ...w, 
          timeSlots: [...w.timeSlots, { slotId: `slot-${Date.now()}`, corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: initialSlotBase, otHours: 0 }] 
        } : w));
      }
    } else {
      setTodayActiveWorkers([...todayActiveWorkers, { ...worker, healthOk: false, signatureUrl: null, timeSlots: [{ slotId: `slot-${Date.now()}`, corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: 8, otHours: 0 }] }]);
    }
  };

  // 🎯 [👑 5번 사수] 243제 기본 주간 8시간 상호 배제형 중복 입력 차단 락(Lock) 엔진
  const handleUpdateSlotHours = (workerId, siteId, field, numValue) => {
    if (field === 'baseHours') {
      const targetWorker = todayActiveWorkers.find(w => w.id === workerId);
      if (targetWorker) {
        const otherSlotsTotalBase = targetWorker.timeSlots
          .filter(s => s.siteId !== siteId)
          .reduce((sum, s) => sum + s.baseHours, 0);
        
        if (otherSlotsTotalBase + numValue > 8) {
          const maxAllowable = 8 - otherSlotsTotalBase;
          alert(`⚠️ [출역 오폭 입력 차단 - 8시간 자동 락]\n\n'${targetWorker.name}' 근로자는 이미 다른 현장에서 주간 ${otherSlotsTotalBase}시간이 기입되어 있습니다.\n오늘 추가로 입력 가능한 주간 최대 근로시간은 [${maxAllowable}시간] 입니다.`);
          return; 
        }
      }
    }
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === workerId ? { ...w, timeSlots: w.timeSlots.map(s => s.siteId === siteId ? { ...s, [field]: numValue } : s) } : w));
  };

  const getDichotomySummary = () => {
    const corpMap = {}; CORPORATIONS.forEach(c => { corpMap[c] = 0; });
    const siteDailyMap = {}; 
    const siteTotalAccumMap = { ...historyConfig.pastAccumulatedSiteLogs }; 
    let totalGross = 0; let totalNet = 0;
    
    todayActiveWorkers.forEach(w => {
      const calc = calculateDetailedWage(w); totalNet += calc.netPay;
      calc.slots.forEach(s => {
        if (corpMap[s.corp] !== undefined) { corpMap[s.corp] += s.grossPay; totalGross += s.grossPay; }
        if (s.siteId) {
          if (!siteDailyMap[s.siteId]) siteDailyMap[s.siteId] = 0;
          siteDailyMap[s.siteId] += s.grossPay;
          if (!siteTotalAccumMap[s.siteId]) siteTotalAccumMap[s.siteId] = 0;
          siteTotalAccumMap[s.siteId] += s.grossPay;
        }
      });
    });
    return { corpMap, siteDailyMap, siteTotalAccumMap, totalGross, totalNet };
  };

  const finalSummary = getDichotomySummary();
  const currentSelectedSiteDetail = siteProperties.find(s => s.id === activeSiteId);
  const filteredWorkersForSearch = masterWorkerPool.filter(w => w.name.includes(searchQuery));

  return (
    // 🎯 [👑 6번 사수] 모바일 기종 구애받지 않는 가변 패딩 스냅 액체형 컨테이너
    <div className="max-w-7xl mx-auto bg-slate-100 min-h-screen pb-60 font-sans text-slate-800 antialiased shadow-xl px-2 sm:px-4 md:px-6">
      
      {/* 최고 등급 세션 바 */}
      <div className="bg-slate-900 text-white p-3 text-xs flex justify-between items-center px-4 sm:px-6 rounded-b-xl shadow-md">
        <div className="truncate max-w-[70%]">
          <span className="text-emerald-400 font-black text-[10px] sm:text-xs">● 전산망 보안 가동:</span>{' '}
          <span className="font-bold text-yellow-400 text-xs sm:text-sm truncate">
            {currentUser?.name || '미인증'} 
            {currentUser?.loginId === 'sunwook' ? ' [현장총괄 - MASTER]' : 
             currentUser?.loginId === 'soyoung' ? ' [재무총괄]' : currentUser ? ` [${currentUser.role.toUpperCase()}]` : ''}
          </span>
        </div>
        <button onClick={handleLogout} className="bg-red-950 text-red-400 border border-red-900 text-[10px] sm:text-xs px-2.5 py-1 rounded-xl font-bold hover:bg-red-900 transition-all shrink-0">로그아웃</button>
      </div>

      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white p-4 sm:p-5 rounded-2xl mt-3 shadow-lg sticky top-2 z-20">
        <div className="flex bg-black/30 p-1.5 rounded-2xl text-xs font-black space-x-1 max-w-xl mx-auto shadow-inner overflow-x-auto scrollbar-none">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2.5 rounded-lg transition-all min-w-[75px] ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
            {isFinanceAccessible ? '📋 관제부' : '📝 일보작성'}
          </button>
          {currentUser?.role !== 'manager' && (
            <>
              <button onClick={() => setActiveTab('siteAdmin')} className={`flex-1 text-center py-2.5 rounded-lg transition-all min-w-[75px] ${activeTab === 'siteAdmin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>🏢 현장등록</button>
              <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2.5 rounded-lg transition-all min-w-[75px] ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>➕ 인력관리</button>
            </>
          )}
          {isMasterOrFieldTotal && <button onClick={() => setActiveTab('security')} className={`flex-1 text-center py-2.5 rounded-lg transition-all min-w-[75px] ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>🔐 권한발급</button>}
        </div>
      </header>

      <main className="p-2 sm:p-4 md:p-6">
        
        {/* 권한 관리 발급 */}
        {activeTab === 'security' && isMasterOrFieldTotal && (
          <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
            <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border space-y-3">
              <h2 className="text-xs sm:text-sm font-black text-slate-800">👑 전산 보안 계정 발급창 (총괄 제어부)</h2>
              <form onSubmit={handleCreateUser} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" placeholder="ID 부여 *" className="bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={newUserId} onChange={e => setNewUserId(e.target.value)} />
                  <input type="text" placeholder="성명 *" className="bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="password" placeholder="비밀번호 *" className="bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                  <input type="text" maxLength={4} placeholder="2차 인증키 *" className="bg-slate-50 border p-3 rounded-xl text-xs font-bold text-center tracking-widest outline-none" value={newUserAuthKey} onChange={e => setNewUserAuthKey(e.target.value)} />
                </div>
                <select className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                  <option value="finance">💳 재무총괄 (본사 자금 및 원가 통제)</option>
                  <option value="admin">👮 관리자 (본사 중간 제어)</option>
                  <option value="manager">👷 현장관리자 (소장 일보 등록 전용)</option>
                </select>
                <button type="submit" className="w-full bg-indigo-900 text-white text-xs py-3.5 rounded-xl font-bold hover:bg-indigo-950">정식 계정 발급 승인</button>
              </form>
            </section>
          </div>
        )}

        {/* 현장 개설 */}
        {activeTab === 'siteAdmin' && currentUser?.role !== 'manager' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border space-y-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">🏢 신규 현장 개설 등록부</h2>
              <form onSubmit={handleAddSite} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={newSiteCorp} onChange={e => setNewSiteCorp(e.target.value)}>
                    <option value="">소속 법인 선택</option>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={newSiteConstType} onChange={e => setNewSiteConstType(e.target.value)}>
                    <option value="">대표 공종 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="현장명 입력 *" className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" placeholder="현장 대리인 *" className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={newSiteAgent} onChange={e => setNewSiteAgent(e.target.value)} />
                  <input type="text" placeholder="현장 소장 *" className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={newSiteManager} onChange={e => setNewSiteManager(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3.5 rounded-xl font-bold hover:bg-slate-950">신규 현장 개설</button>
              </form>
            </section>
          </div>
        )}

        {/* 인력 관리 */}
        {activeTab === 'admin' && currentUser?.role !== 'manager' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-fade-in">
            <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border space-y-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800">👤 근로자 개별 수동 등록</h2>
              <form onSubmit={handleAdminAddWorker} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={adminCorp} onChange={e => setAdminCorp(e.target.value)}><option value="">법인 선택</option>{CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={adminType} onChange={e => setAdminType(e.target.value)}><option value="">공종 선택</option>{CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input type="text" placeholder="근로자 성명" className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={adminName} onChange={e => setAdminName(e.target.value)} />
                  <select className="bg-slate-50 border rounded-xl p-3 text-xs font-bold outline-none" value={adminWorkerType} onChange={e => setAdminWorkerType(e.target.value)}><option value="정규직">정규직</option><option value="일용직">일용직</option></select>
                </div>
                <div className="space-y-2 bg-slate-50 p-3 sm:p-4 rounded-xl border">
                  {isFinanceAccessible ? (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">💡 총 계약 금액 입력 (자동 컴마)</label>
                      <input type="text" placeholder="예: 48,000,000" className="w-full bg-white border rounded-xl p-3 text-xs font-bold outline-none text-right pr-4" value={adminWageInput} onChange={e => setAdminWageInput(formatNumberWithCommas(e.target.value))} />
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 p-2.5 text-center text-[10px] font-bold rounded-lg">🔒 권한 제한: 본사 전용 보안구역</div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3.5 rounded-xl font-bold mt-2">등록 완료</button>
                </div>
              </form>
            </section>

            <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">마스터 명부 관리 및 수정부 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {masterWorkerPool.map(w => {
                  const calculatedRate = w.type === '정규직' ? Math.round(((w.annualSalary / 12) + (w.specialAllowance || 0)) / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs bg-slate-50 p-3 rounded-2xl border gap-2 hover:bg-slate-100/50 transition-all">
                      <div><span className="font-black text-slate-900 text-sm mr-1">{w.name} <span className="text-xs text-slate-400 font-normal">({w.constType})</span></span><span className="text-[10px] text-slate-400 block mt-0.5">{w.corp}</span></div>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-1.5 sm:pt-0">
                        <span className="text-xs font-bold text-blue-600 mr-1">시급: {isFinanceAccessible ? `${calculatedRate.toLocaleString()}원` : '🔒 보안'}</span>
                        <div className="flex gap-1">
                          {isMasterOrFieldTotal && <button onClick={() => setEditingWorker({...w, wageInput: formatNumberWithCommas(w.type === '정규직' ? w.annualSalary : w.hourlyWage), specialAllowance: formatNumberWithCommas(w.specialAllowance)})} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-black text-[10px]">수정</button>}
                          <button onClick={() => handleAdminDeleteWorker(w.id, w.name)} className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded font-black text-[10px]">삭제</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 일보 구역 레이아웃 */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:grid-cols-1 md:gap-5 lg:gap-6 items-start">
              
              {/* 왼쪽 섹션 (소장님 조작용 현장 선택 및 반장님 터치 패널) */}
              {!isFinanceAccessible && (
                <div className="lg:col-span-5 space-y-4 animate-fade-in">
                  <section className="bg-white p-5 rounded-3xl border-2 border-slate-300/90 shadow-md space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                        📍 1단계: 오늘의 가동 대상 현장 지정 *
                      </label>
                      {/* 🎯 [👑 2번 사수] 1단계 선택 드롭다운 내 법인 접두어 선두 결합 출력식 사수 */}
                      <select 
                        className="w-full bg-white border-2 border-slate-400 text-slate-900 text-xs font-black rounded-xl p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                        value={activeSiteId} 
                        onChange={e => setActiveSiteId(e.target.value)}
                      >
                        <option value="">출역을 작성할 현장을 지정하세요...</option>
                        {siteProperties.map(s => {
                          const shortCorp = s.corp.replace('(주)', '');
                          return (
                            <option key={s.id} value={s.id}>
                              [{shortCorp}] {s.siteName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {currentSelectedSiteDetail && (
                      <div className="bg-slate-50 rounded-2xl p-4 text-xs font-mono text-slate-800 space-y-2 border-2 border-slate-200 shadow-inner animate-fade-in">
                        <div className="flex justify-between border-b border-slate-300 pb-1"><span>🏢 계약 소속 법인:</span><span className="text-slate-900 font-black">{currentSelectedSiteDetail.corp}</span></div>
                        <div className="flex justify-between border-b border-slate-300 pb-1"><span>⚡ 대표 계약 공종:</span><span className="text-blue-700 font-black">{currentSelectedSiteDetail.constType}</span></div>
                        <div className="flex justify-between"><span>👤 관리 소장 전령:</span><span className="text-slate-900 font-black">{currentSelectedSiteDetail.manager} 소장</span></div>
                      </div>
                    )}
                  </section>

                  {activeSiteId && (
                    <section className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-300 shadow-md space-y-4 animate-fade-in">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">📍 2단계: 오늘 내 현장 출근 인원 터치 배치</span>
                      <input type="text" placeholder="🔎 이름 실시간 퀵 검색..." className="w-full bg-white border-2 border-slate-300 text-xs font-bold p-3 rounded-xl outline-none focus:border-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pt-1 pr-1">
                        {filteredWorkersForSearch.map(worker => {
                          const isAttached = todayActiveWorkers.find(w => w.id === worker.id)?.timeSlots.some(s => s.siteId === activeSiteId);
                          return (
                            <button key={worker.id} onClick={() => handleToggleWorkerToActiveSite(worker)} className={`text-xs font-black px-2 py-2.5 rounded-xl border-2 transition-all truncate text-center ${isAttached ? 'bg-blue-600 border-blue-800 text-white shadow-md' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-200'}`}>
                              {isAttached ? '✓ ' : '+ '} {worker.name}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* 오른쪽 섹션 (선택된 인원 시간 입력창 및 총괄 관제 뷰어) */}
              <div className={`${isFinanceAccessible ? 'lg:col-span-12 max-w-5xl mx-auto w-full' : 'lg:col-span-7'} space-y-3`}>
                <div className="bg-slate-200/60 rounded-2xl px-2 py-1.5 text-xs font-black text-slate-700 tracking-wider">
                  {isFinanceAccessible ? '📊 전사 실시간 분할 안분 취합 현황부' : '3단계: 투입 근로자별 시간 기입 및 최종 확인 구역'}
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {todayActiveWorkers.map(worker => {
                    if (!isFinanceAccessible && !worker.timeSlots.some(s => s.siteId === activeSiteId)) return null;

                    const calc = calculateDetailedWage(worker);
                    const slotsByCorp = {};
                    worker.timeSlots.forEach(slot => {
                      if (!slotsByCorp[slot.corp]) slotsByCorp[slot.corp] = [];
                      slotsByCorp[slot.corp].push(slot);
                    });

                    return (
                      <div key={worker.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4 hover:shadow-md transition-all animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-2.5 gap-2">
                          <div className="truncate">
                            <span className="text-lg font-black text-slate-900 mr-2">{worker.name}</span>
                            <span className="text-[10px] sm:text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px] inline-block align-middle">소속: {worker.corp}</span>
                          </div>
                          {!isFinanceAccessible && <button onClick={() => handleToggleWorkerToActiveSite(worker)} className="text-xs text-red-500 font-bold shrink-0 hover:underline">현장제외</button>}
                        </div>

                        {/* 🎯 [👑 4번 사수] 법인 소속사별 동그라미 컨테이너 팩 묶음 구조 사수 */}
                        <div className="space-y-3">
                          {Object.keys(slotsByCorp).map(corpKey => (
                            <div key={corpKey} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
                              <div className="text-xs font-black text-blue-900 flex items-center gap-1">🏢 소속 법인: <span className="text-slate-900 font-bold truncate max-w-[180px]">{corpKey}</span></div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {slotsByCorp[corpKey].map(slot => {
                                  const targetSiteObj = siteProperties.find(s => s.id === slot.siteId);
                                  const rawSiteName = targetSiteObj ? targetSiteObj.siteName : "지정외 공사 현장";
                                  
                                  // 🎯 [👑 3번 사수] 주공사명 앞 대괄호 법인 접두어 표출 로직 마감
                                  const shortCorp = corpKey.replace('(주)', '');
                                  const fullVisibleSiteName = `[${shortCorp}] ${rawSiteName}`;
                                  const origIdx = worker.timeSlots.findIndex(s => s.slotId === slot.slotId);

                                  return (
                                    <div key={slot.slotId} className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-2 relative shadow-sm">
                                      {/* 잘림 현상 없는 줄바꿈형 공사명 명시 가동 */}
                                      <div className="flex justify-between font-black text-slate-700 text-[11px] border-b pb-1 gap-2">
                                        <span className="block text-slate-800 leading-tight pr-1">📍 {fullVisibleSiteName}</span>
                                        <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded h-fit shrink-0">{slot.constType}</span>
                                      </div>
                                      
                                      {isFinanceAccessible ? (
                                        <div className="text-[10px] sm:text-[11px] font-mono text-slate-600 flex justify-between pt-1 gap-1">
                                          <span>주: <span className="text-slate-900 font-black">{slot.baseHours}H</span> | 연: <span className="text-slate-900 font-black">{slot.otHours}H</span></span>
                                          <span className="text-blue-700 font-black text-right">노임: {calc.slots[origIdx]?.grossPay.toLocaleString()}원</span>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                                          <div>
                                            <label className="block text-[9px] text-slate-500 font-bold mb-0.5 text-center">주간 시간</label>
                                            <input type="number" min={0} max={8} disabled={slot.siteId !== activeSiteId} className={`w-full text-center text-xs font-black border-2 rounded-lg p-1.5 outline-none ${slot.siteId === activeSiteId ? 'bg-white border-slate-400 focus:border-blue-500' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} value={slot.baseHours} onChange={e => handleUpdateSlotHours(worker.id, slot.siteId, 'baseHours', Number(e.target.value))} />
                                          </div>
                                          <div>
                                            <label className="block text-[9px] text-slate-500 font-bold mb-0.5 text-center">연장 시간</label>
                                            <input type="number" min={0} max={24} disabled={slot.siteId !== activeSiteId} className={`w-full text-center text-xs font-black border-2 rounded-lg p-1.5 outline-none ${slot.siteId === activeSiteId ? 'bg-white border-slate-400 focus:border-blue-500' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} value={slot.otHours} onChange={e => handleUpdateSlotHours(worker.id, slot.siteId, 'otHours', Number(e.target.value))} />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 원가 세금 지출 박스 */}
                        {isFinanceAccessible && (
                          <div className="bg-slate-900 text-slate-300 rounded-2xl p-3 sm:p-4 text-[10px] sm:text-xs grid grid-cols-3 gap-2 font-mono shadow-md border border-slate-800">
                            <div><span className="text-slate-500 block text-[9px] font-bold truncate">📊 당일 노임액</span><span className="text-white font-black sm:text-sm truncate block">{calc.totalGross.toLocaleString()}원</span></div>
                            <div><span className="text-blue-500 block text-[9px] font-bold truncate">📁 하루 퇴직적립</span><span className="text-blue-400 font-black sm:text-sm truncate block">+{calc.severance.toLocaleString()}원</span></div>
                            <div className="text-right"><span className="text-emerald-500 block text-[9px] font-bold truncate">💵 당일 실수령액</span><span className="text-emerald-400 font-black sm:text-sm truncate block">{calc.netPay.toLocaleString()}원</span></div>
                          </div>
                        )}

                        {/* 당일 건강상태 체크박스 프레임 */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-2">
                          <label className="flex justify-between items-center cursor-pointer">
                            <span className={worker.healthOk ? 'text-slate-600 font-bold' : 'text-red-500 font-black'}>🩺 당일 건강 상태 정상 서명 확인</span>
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-2" checked={worker.healthOk} onChange={() => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? { ...w, healthOk: !w.healthOk } : w))} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* 하단 집계 및 3중 파노라마 대시보드 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 backdrop-blur border-t shadow-[0_-12px_30px_rgba(0,0,0,0.08)] z-30">
          <div className="max-w-6xl mx-auto space-y-3">
            
            {isFinanceAccessible ? (
              // 🎯 [👑 7번 사수] 하단 대시보드 클릭 시 대형 전광판 팝업 확대 모달 연동 기능 보존
              <div 
                onClick={() => setIsZoomDashboardOpen(true)} 
                className="space-y-2 cursor-zoom-in hover:bg-slate-50/70 p-1 rounded-xl transition-all border border-transparent"
                title="🔍 클릭하시면 기성 집계를 큰 화면 전광판으로 확대 조회합니다."
              >
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-2.5 rounded-xl text-[10px] sm:text-xs font-mono flex flex-col sm:flex-row sm:justify-between sm:items-center shadow border gap-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1"><span className="text-blue-400 font-black">🗓️</span> <span className="text-slate-400 font-bold">역대 총 누적 기성 집계 기간 (🔍 누르면 확대):</span></div>
                  <span className="text-yellow-400 font-black tracking-wider bg-black/40 px-2 py-0.5 rounded text-[10px] sm:text-xs w-fit mx-auto sm:mx-0 font-mono">
                    {historyConfig.systemStartDate} ~ {historyConfig.systemCurrentDate} (142일 적산)
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] sm:text-xs font-mono space-y-0.5 max-h-20 overflow-y-auto shadow-inner">
                    <div className="font-black text-slate-400 pb-0.5 border-b uppercase text-[9px] sm:text-[10px] flex justify-between"><span>🏢 오늘 소속 법인별 원가 안분</span><span className="text-blue-600">[당일 발생액]</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5">
                      {Object.keys(finalSummary.corpMap).map(corpKey => {
                        if (finalSummary.corpMap[corpKey] === 0) return null;
                        return (
                          <div key={corpKey} className="flex justify-between text-slate-600 text-[10px] border-b border-dashed pb-0.5 last:border-0">
                            <span className="truncate max-w-[120px]">• {corpKey}</span>
                            <span className="font-bold text-blue-600">{finalSummary.corpMap[corpKey].toLocaleString()}원</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl text-[10px] sm:text-xs font-mono space-y-0.5 max-h-20 overflow-y-auto shadow-inner">
                    <div className="font-black text-blue-900 pb-0.5 border-b uppercase text-[9px] sm:text-[10px] flex justify-between"><span>📍 각 현장별 인건비 기성 합산 현황부</span><span className="text-emerald-700 font-black">[금일 / 누적]</span></div>
                    <div className="space-y-1 pt-0.5">
                      {Object.keys(finalSummary.siteTotalAccumMap).map(siteIdKey => {
                        const matchedSiteObj = siteProperties.find(s => s.id === siteIdKey);
                        const rawSiteName = matchedSiteObj ? matchedSiteObj.siteName : "미지정 공사";
                        const shortCorp = matchedSiteObj ? matchedSiteObj.corp.replace('(주)', '') : "미지정";
                        const fullDashSiteName = `[${shortCorp}] ${rawSiteName}`;

                        const dailyAmount = finalSummary.siteDailyMap[siteIdKey] || 0;
                        const totalAccumAmount = finalSummary.siteTotalAccumMap[siteIdKey] || 0;

                        return (
                          <div key={siteIdKey} className="flex justify-between items-start border-b border-slate-200/40 pb-0.5 text-slate-700 last:border-0 last:pb-0 gap-2">
                            <span className="block font-bold text-slate-800 text-[10px] leading-tight pr-1">• {fullDashSiteName}</span>
                            <div className="flex gap-2 text-[9px] sm:text-[10px] font-mono shrink-0">
                              <span className="text-slate-400">금일: {dailyAmount.toLocaleString()}원</span>
                              <span className="font-black text-emerald-700">누적: {totalAccumAmount.toLocaleString()}원</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-dashed">🔒 상세 인건비 기성 및 다중 분할 내역 통계 비공개 (TOTAL ADMIN ONLY)</div>
            )}

            <div className="max-w-md mx-auto">
              <button onClick={() => alert("📢 최종 전산 확정 및 ERP 자산 연동 승인이 완료되었습니다.")} className="w-full bg-blue-800 text-white font-black text-xs sm:text-sm py-3.5 rounded-xl shadow-xl hover:bg-blue-900 transition-all">
                {isMasterOrFieldTotal ? `👑 최종 마감 및 관제 승인 확정 (${finalSummary.totalNet.toLocaleString()}원)` : '당일 현장 일보 데이터 본사 마감 전송'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 대형 브리핑 전광판 모달 */}
      {isZoomDashboardOpen && isFinanceAccessible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh]">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-5 text-white flex justify-between items-center gap-2">
              <div className="truncate">
                <h3 className="font-black text-sm sm:text-lg truncate">🖥️ 대원 기성 원가 파노라마 전광판</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs truncate font-mono">가동 기점일: {historyConfig.systemStartDate}부 적산 데이터</p>
              </div>
              <button onClick={() => setIsZoomDashboardOpen(false)} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black shrink-0">닫기</button>
            </div>
            <div className="p-3 sm:p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
                <h4 className="font-black text-slate-800 text-xs sm:text-sm border-b pb-1">🏢 소속 법인별 금일 원가 안분</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
                  {Object.keys(finalSummary.corpMap).map(corpKey => {
                    const amt = finalSummary.corpMap[corpKey];
                    return (
                      <div key={corpKey} className={`p-2 rounded-lg border flex justify-between items-center ${amt > 0 ? 'bg-blue-50/60 font-bold text-blue-700' : 'text-slate-400'}`}>
                        <span>• {corpKey}</span><span>{amt.toLocaleString()}원</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2 overflow-x-auto">
                <h4 className="font-black text-slate-800 text-xs sm:text-sm border-b pb-1">📍 각 현장별 인건비 기성 합산 역대 적산 명세표</h4>
                <table className="w-full text-left border-collapse font-mono text-[11px] min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-bold border-b text-[10px]">
                      <th className="p-2.5">대상 가동 현장 제원명</th>
                      <th className="p-2.5 text-center w-28">금일 인건비</th>
                      <th className="p-2.5 text-right w-44">역대 총 누적액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {Object.keys(finalSummary.siteTotalAccumMap).map(siteIdKey => {
                      const matchedSiteObj = siteProperties.find(s => s.id === siteIdKey);
                      const rawSiteName = matchedSiteObj ? matchedSiteObj.siteName : "미지정 공사";
                      const shortCorp = matchedSiteObj ? matchedSiteObj.corp.replace('(주)', '') : "미지정";
                      const fullDashSiteName = `[${shortCorp}] ${rawSiteName}`;
                      return (
                        <tr key={siteIdKey} className="hover:bg-slate-50 text-[11px]">
                          <td className="p-2.5 font-bold text-slate-900 leading-tight">{fullDashSiteName}</td>
                          <td className="p-2.5 text-center font-bold text-slate-400">{(finalSummary.siteDailyMap[siteIdKey] || 0).toLocaleString()}원</td>
                          <td className="p-2.5 text-right font-black text-emerald-700 pr-4 bg-emerald-50/10">{(finalSummary.siteTotalAccumMap[siteIdKey] || 0).toLocaleString()}원</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 근로자 수정 모달 */}
      {editingWorker && isMasterOrFieldTotal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-4 space-y-3">
            <h3 className="font-black text-sm text-slate-900 border-b pb-1">✏️ 근로자 정보 정밀 수정</h3>
            <form onSubmit={handleSaveEditedWorker} className="space-y-3 text-xs">
              <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold" value={editingWorker.name} onChange={e => setEditingWorker({...editingWorker, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <select className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold" value={editingWorker.corp} onChange={e => setEditingWorker({...editingWorker, corp: e.target.value})}>{CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold" value={editingWorker.constType} onChange={e => setEditingWorker({...editingWorker, constType: e.target.value})}>{CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold text-right" value={editingWorker.wageInput} onChange={e => setEditingWorker({...editingWorker, wageInput: formatNumberWithCommas(e.target.value)})} />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingWorker(null)} className="flex-1 bg-slate-100 p-2.5 rounded-xl font-bold text-slate-500">취소</button>
                <button type="submit" className="flex-1 bg-blue-800 text-white p-2.5 rounded-xl font-black">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}