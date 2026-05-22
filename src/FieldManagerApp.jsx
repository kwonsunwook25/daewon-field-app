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

  // 사용자 보안 자격 명부 데이터베이스
  const [userRoster, setUserRoster] = useState([
    { id: 'u-1', loginId: 'master', name: '최고마스터(신유섭)', role: 'master', password: '123', authKey: '7777' },
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

  // 🎯 [실무 데이터베이스 확장] 
  // 당일 실시간 출역 명단 상태값
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([
    {
      id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000, healthOk: true, signatureUrl: 'done',
      timeSlots: [
        { slotId: 'sl-1', corp: '대원전기(주)', siteId: 's-1', constType: '배전', baseHours: 4, otHours: 0 },
        { slotId: 'sl-2', corp: '우창전력(주)', siteId: 's-3', constType: '변전', baseHours: 4, otHours: 2 }
      ]
    },
    {
      id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0, healthOk: true, signatureUrl: 'done',
      timeSlots: [
        { slotId: 'sl-3', corp: '대원전기(주)', siteId: 's-2', constType: '배전', baseHours: 8, otHours: 0 }
      ]
    }
  ]);

  // 🎯 [신규 동적 가상 마스터 원가 누적 보관소] 
  // 시스템 가동 기간 및 현장별 역대 누적 데이터베이스 시뮬레이터 (추후 DB 연결 확장 규격)
  const [historyConfig] = useState({
    systemStartDate: "2026-01-01", // 누적 집계 시작 기점일
    systemCurrentDate: "2026-05-22", // 오늘 날짜 기점 (142일간 누적 상태)
    // 이전까지 적산되어 넘어온 각 현장별 역대 누적 인건비 원가 (단위: 원)
    pastAccumulatedSiteLogs: {
      's-1': 148500000, // 증평 지중화 공사 현장 과거 누적분
      's-2': 92400000,  // 청주 한전 배전단가 현장 과거 누적분
      's-3': 213000000, // 진천 변전소 신설 공사 과거 누적분
      's-4': 45000000   // 증평 구내통신망 구축 현장 과거 누적분
    }
  });

  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const cleanNumber = String(value).replace(/[^0-9]/g, ''); 
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ','); 
  };

  const removeCommas = (str) => {
    return Number(String(str).replace(/,/g, '')) || 0;
  };

  // 로그인 및 인증
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const account = userRoster.find(u => u.loginId === loginId.trim());
    if (!account || account.password !== loginPassword) {
      alert("⚠️ 전산 오류: 자격 증명이 올바르지 않습니다.");
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
      alert(`🔒 인증 통과: [${currentUser.name}] 프로필로 접속 승인.`);
    } else {
      alert("⚠️ 보안 인증키 오류");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(null); setLoginId(''); setLoginPassword(''); setSecurityAuthCode(''); setActiveTab('daily'); setActiveSiteId('');
  };

  // 계정 생성
  const handleCreateUser = (e) => {
    e.preventDefault();
    const newUser = { id: `user-${Date.now()}`, loginId: newUserId.trim(), name: newUserName.trim(), role: newUserRole, password: newUserPassword, authKey: newUserAuthKey.trim() };
    setUserRoster([...userRoster, newUser]);
    setNewUserId(''); setNewUserName(''); setNewUserPassword(''); setNewUserAuthKey('');
    alert(`✅ 계정 발급 승인.`);
  };

  // 현장 개설
  const handleAddSite = (e) => {
    e.preventDefault();
    const newSite = {
      id: `site-${Date.now()}`, corp: newSiteCorp, siteName: newSiteName.trim(), constType: newSiteConstType,
      agent: newSiteAgent.trim(), manager: newSiteManager.trim(), contractDate: newSiteContractDate || '-', startDate: newSiteStartDate || '-', endDate: newSiteEndDate || '-'
    };
    setSiteProperties([...siteProperties, newSite]);
    setNewSiteName(''); setNewSiteAgent(''); setNewSiteManager('');
    alert(`🏢 현장 전산 개설 완료.`);
  };

  // 인력 등록
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    const wageNum = removeCommas(adminWageInput);
    const allowanceNum = removeCommas(adminAllowanceInput);
    const newWorker = {
      id: `admin-${Date.now()}`, corp: adminCorp, constType: adminType, name: adminName.trim(), type: adminWorkerType, specialAllowance: allowanceNum,
      ...(adminWorkerType === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };
    masterWorkerPool.push(newWorker);
    setAdminName(''); setAdminWageInput(''); setAdminAllowanceInput('');
    alert(`✅ 인력 등록 완료.`);
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
    alert(`⚙️ 근로자 정보 실시간 반영 완료.`);
  };

  const handleAdminDeleteWorker = (workerId, workerName) => {
    if (!window.confirm(`⚠️ '${workerName}' 근로자를 삭제하시겠습니까?`)) return;
    setMasterWorkerPool(masterWorkerPool.filter(w => w.id !== workerId));
    setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== workerId));
  };

  // 243제 인건비 계산 엔진
  const calculateDetailedWage = (worker) => {
    let baseHourlyRate = 0;
    const allowance = worker.specialAllowance || 0;
    if (worker.type === '정규직') {
      baseHourlyRate = Math.round(((worker.annualSalary || 0) / 12 + allowance) / 243);
    } else {
      baseHourlyRate = (worker.hourlyWage || 0);
    }
    let totalGross = 0;
    const slotsCalculated = worker.timeSlots.map(slot => {
      const slotGross = Math.round((slot.baseHours * baseHourlyRate) + (slot.otHours * baseHourlyRate * 1.5));
      totalGross += slotGross;
      return { ...slot, grossPay: slotGross };
    });
    return {
      hourlyRate: baseHourlyRate, slots: slotsCalculated, totalGross: totalGross,
      severance: Math.round(totalGross / 12), tax: Math.round(totalGross * 0.0165), insurance: Math.round(totalGross * 0.093),
      netPay: totalGross - (Math.round(totalGross * 0.0165) + Math.round(totalGross * 0.093))
    };
  };

  // 소장용 투입 인터페이스 모듈
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
        setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? { ...w, timeSlots: [...w.timeSlots, { slotId: `slot-${Date.now()}`, corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: 8, otHours: 0 }] } : w));
      }
    } else {
      setTodayActiveWorkers([...todayActiveWorkers, { ...worker, healthOk: false, signatureUrl: null, timeSlots: [{ slotId: `slot-${Date.now()}`, corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: 8, otHours: 0 }] }]);
    }
  };

  const handleUpdateSlotHours = (workerId, siteId, field, numValue) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === workerId ? { ...w, timeSlots: w.timeSlots.map(s => s.siteId === siteId ? { ...s, [field]: numValue } : s) } : w));
  };

  // 🎯 [다차원 전산 고도화] 법인별 당일 / 현장별 당일 및 "역대 누적 인건비"까지 종합 3트랙 파싱 집계 엔진
  const getDichotomySummary = () => {
    const corpMap = {}; CORPORATIONS.forEach(c => { corpMap[c] = 0; });
    
    const siteDailyMap = {}; // 당일 현장 분량
    const siteTotalAccumMap = { ...historyConfig.pastAccumulatedSiteLogs }; // 역대 누적용 마스터 맵 (과거값 복사로 초기화)
    
    let totalGross = 0; let totalNet = 0;
    
    todayActiveWorkers.forEach(w => {
      const calc = calculateDetailedWage(w); totalNet += calc.netPay;
      calc.slots.forEach(s => {
        if (corpMap[s.corp] !== undefined) { corpMap[s.corp] += s.grossPay; totalGross += s.grossPay; }
        if (s.siteId) {
          // 가. 당일 현장 비용 가산
          if (!siteDailyMap[s.siteId]) siteDailyMap[s.siteId] = 0;
          siteDailyMap[s.siteId] += s.grossPay;

          // 나. 역대 누적 마스터 맵에 오늘 실시간 발생한 단가 실시간 가산 누계 (오늘 공사비 실시간 적산)
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
          <div className="text-center"><h2 className="text-xl font-black text-slate-900">⚡ 대원 통합 전산인프라</h2></div>
          {!isSecondStep ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <input type="text" placeholder="ID 입력" required className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold" value={loginId} onChange={e => setLoginId(e.target.value)} />
              <input type="password" placeholder="비밀번호" required className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <button type="submit" className="w-full bg-blue-700 text-white font-black text-xs py-3.5 rounded-xl">1차 자격 검증</button>
            </form>
          ) : (
            <form onSubmit={handleAuthKeySubmit} className="space-y-3">
              <div className="bg-blue-50 text-blue-900 p-3 rounded-xl text-xs font-bold">👤 소유주: {currentUser.name}</div>
              <input type="password" required maxLength={4} className="w-full bg-slate-50 border p-3 rounded-xl text-sm font-black text-center tracking-widest" value={securityAuthCode} onChange={e => setSecurityAuthCode(e.target.value)} />
              <button type="submit" className="w-full bg-emerald-600 text-white font-black text-xs py-3.5 rounded-xl">2차 최종 승인</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-80 font-sans text-slate-800 antialiased">
      
      {/* 최고 등급 세션 정보 바 */}
      <div className="bg-slate-900 text-white p-2.5 text-xs flex justify-between items-center px-4">
        <div><span className="text-emerald-400 font-black">● 전산망 접속:</span> <span className="font-bold text-yellow-400">{currentUser.name} [{currentUser.role.toUpperCase()}]</span></div>
        <button onClick={handleLogout} className="bg-red-950 text-red-400 border border-red-900 text-[10px] px-2.5 py-1 rounded font-bold">로그아웃</button>
      </div>

      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex bg-black/20 p-1 rounded-xl text-[10px] font-black space-x-0.5">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
            {currentUser.role === 'master' ? '📋 실시간 일보 취합 관제부' : '📝 일보 입력 (실무형)'}
          </button>
          {currentUser.role !== 'manager' && (
            <>
              <button onClick={() => setActiveTab('siteAdmin')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'siteAdmin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>🏢 현장 등록</button>
              <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>➕ 인력 관리</button>
            </>
          )}
          {currentUser.role === 'master' && <button onClick={() => setActiveTab('security')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>🔐 권한 발급</button>}
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* 권한 관리 발급 */}
        {activeTab === 'security' && currentUser.role === 'master' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-black text-slate-800">👑 전산 보안 계정 발급창</h2>
              <form onSubmit={handleCreateUser} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="ID 부여 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" value={newUserId} onChange={e => setNewUserId(e.target.value)} />
                  <input type="text" placeholder="성명 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="password" placeholder="비밀번호 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                  <input type="text" maxLength={4} placeholder="2차 인증키 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold text-center tracking-widest" value={newUserAuthKey} onChange={e => setNewUserAuthKey(e.target.value)} />
                </div>
                <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                  <option value="admin">👮 관리자 (본사 중간 제어)</option>
                  <option value="manager">👷 현장관리자 (소장 일보 등록 전용)</option>
                </select>
                <button type="submit" className="w-full bg-indigo-900 text-white text-xs py-3 rounded-xl font-bold">정식 계정 발급 승인</button>
              </form>
            </section>
          </div>
        )}

        {/* 현장 개설 */}
        {activeTab === 'siteAdmin' && currentUser.role !== 'manager' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">🏢 신규 현장 개설 등록부</h2>
              <form onSubmit={handleAddSite} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={newSiteCorp} onChange={e => setNewSiteCorp(e.target.value)}>
                    <option value="">소속 법인 선택</option>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={newSiteConstType} onChange={e => setNewSiteConstType(e.target.value)}>
                    <option value="">대표 공종 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="현장명 입력 *" className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="현장 대리인 *" className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none" value={newSiteAgent} onChange={e => setNewSiteAgent(e.target.value)} />
                  <input type="text" placeholder="현장 소장 *" className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none" value={newSiteManager} onChange={e => setNewSiteManager(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold">신규 현장 개설</button>
              </form>
            </section>
          </div>
        )}

        {/* 인력 관리 */}
        {activeTab === 'admin' && currentUser.role !== 'manager' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">👤 근로자 개별 수동 등록</h2>
              <form onSubmit={handleAdminAddWorker} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={adminCorp} onChange={e => setAdminCorp(e.target.value)}><option value="">법인 선택</option>{CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={adminType} onChange={e => setAdminType(e.target.value)}><option value="">공종 선택</option>{CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="근로자 성명" className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold outline-none" value={adminName} onChange={e => setAdminName(e.target.value)} />
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={adminWorkerType} onChange={e => setAdminWorkerType(e.target.value)}><option value="정규직">정규직</option><option value="일용직">일용직</option></select>
                </div>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
                  {currentUser.role === 'master' ? (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">💡 총 계약 금액 입력 (자동 컴마)</label>
                      <input type="text" placeholder="예: 48,000,000" className="w-full bg-white border rounded-xl p-2.5 text-xs font-bold outline-none text-right pr-4" value={adminWageInput} onChange={e => setAdminWageInput(formatNumberWithCommas(e.target.value))} />
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 p-2 text-center text-[10px] font-bold">🔒 권한 제한: 본사 전용 보안구역</div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold">등록 완료</button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-2xl shadow-sm border">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">마스터 명부 관리 및 수정부 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {masterWorkerPool.map(w => {
                  const calculatedRate = w.type === '정규직' ? Math.round(((w.annualSalary / 12) + (w.specialAllowance || 0)) / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                      <div><span className="font-black text-slate-900 mr-1">{w.name} <span className="text-[9px] text-slate-400 font-normal">({w.constType})</span></span><span className="text-[10px] text-slate-400 block">{w.corp}</span></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-600 mr-1">시급: {currentUser.role === 'master' ? `${calculatedRate.toLocaleString()}원` : '🔒 보안'}</span>
                        {currentUser.role === 'master' && <button onClick={() => setEditingWorker({...w, wageInput: formatNumberWithCommas(w.type === '정규직' ? w.annualSalary : w.hourlyWage), specialAllowance: formatNumberWithCommas(w.specialAllowance)})} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-black text-[10px]">수정</button>}
                        <button onClick={() => handleAdminDeleteWorker(w.id, w.name)} className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded font-black text-[10px]">삭제</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 일보 메인 구역 (권한별 동적 분기) */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            
            {/* 마스터 등급일 때는 상단 입력 상자 차단 ➔ 오직 관제판 상태 노출 */}
            {currentUser.role === 'master' ? (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md text-center space-y-1 border border-blue-800 animate-fade-in">
                <div className="text-xs font-black text-blue-300 flex justify-center items-center gap-1">📡 전사 실시간 출역 종합 관제 네트워크 가동 중</div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                  소장님들이 각 현장에서 작성한 투입 명세가 실시간 수집 집계됩니다.<br/>
                  <span className="text-yellow-400 font-bold">본사 마스터 계정은 데이터 정산 무결성을 위해 읽기 전용으로 제어됩니다.</span>
                </p>
              </div>
            ) : (
              // 소장님 등급 인터페이스 노출
              <>
                <section className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-4 rounded-2xl shadow-md space-y-2">
                  <label className="block text-[10px] font-black text-blue-300 uppercase mb-1">1단계: 오늘의 가동 대상 현장 지정 *</label>
                  <select className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-black rounded-xl p-3 outline-none" value={activeSiteId} onChange={e => setActiveSiteId(e.target.value)}>
                    <option value="">출역을 작성할 현장을 골라주세요...</option>
                    {siteProperties.map(s => <option key={s.id} value={s.id}>{s.siteName} ({s.corp})</option>)}
                  </select>
                </section>

                {activeSiteId && (
                  <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3 animate-fade-in">
                    <span className="text-[11px] font-black text-slate-400 block">2단계: 오늘 현장 출근 인원 터치 체크</span>
                    <input type="text" placeholder="🔎 반장님 성명 실시간 검색..." className="w-full bg-slate-50 border text-xs font-bold p-2.5 rounded-xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {filteredWorkersForSearch.map(worker => {
                        const isAttached = todayActiveWorkers.find(w => w.id === worker.id)?.timeSlots.some(s => s.siteId === activeSiteId);
                        return (
                          <button key={worker.id} onClick={() => handleToggleWorkerToActiveSite(worker)} className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${isAttached ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            {isAttached ? '✓ ' : '+ '} {worker.name}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* 취합 리스트 뷰 프레임 */}
            <section className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 px-1">
                {currentUser.role === 'master' ? '📊 전사 실시간 취합 근로자 현황' : '3단계: 선택된 인원 시간 기입창'}
              </h3>
              
              {todayActiveWorkers.map(worker => {
                if (currentUser.role !== 'master' && !worker.timeSlots.some(s => s.siteId === activeSiteId)) return null;

                const calc = calculateDetailedWage(worker);
                return (
                  <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="text-base font-black text-slate-900 mr-2">{worker.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({worker.corp} / {worker.type})</span>
                      </div>
                      {currentUser.role !== 'master' && <button onClick={() => handleToggleWorkerToActiveSite(worker)} className="text-xs text-red-400 font-bold">제외</button>}
                    </div>

                    <div className="space-y-2">
                      {worker.timeSlots.map((slot, sIdx) => {
                        const targetSiteObj = siteProperties.find(s => s.id === slot.siteId);
                        const displayName = targetSiteObj ? targetSiteObj.siteName : "지정외 현장";

                        return (
                          <div key={slot.slotId} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                              <span>📍 #{sIdx + 1} {displayName}</span>
                              <span className="text-blue-600 text-[10px]">{slot.corp}</span>
                            </div>
                            
                            {currentUser.role === 'master' ? (
                              <div className="text-[11px] font-mono text-slate-500 flex justify-between bg-white border p-2 rounded-lg mt-1">
                                <span>⏰ 일일근무: <span className="text-slate-900 font-black">{slot.baseHours}시간</span> | 연장근무: <span className="text-slate-900 font-black">{slot.otHours}시간</span></span>
                                <span className="text-emerald-700 font-black">노임: {calc.slots[sIdx]?.grossPay.toLocaleString()}원</span>
                              </div>
                            ) : (
                              slot.siteId === activeSiteId && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div>
                                    <label className="block text-[9px] text-slate-400 mb-0.5">주간 근무(시)</label>
                                    <input type="number" className="w-full text-center text-xs font-black bg-white border rounded p-1.5 outline-none" value={slot.baseHours} onChange={e => handleUpdateSlotHours(worker.id, activeSiteId, 'baseHours', Number(e.target.value))} />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-slate-400 mb-0.5">연장 근무(시)</label>
                                    <input type="number" className="w-full text-center text-xs font-black bg-white border rounded p-1.5 outline-none" value={slot.otHours} onChange={e => handleUpdateSlotHours(worker.id, activeSiteId, 'otHours', Number(e.target.value))} />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {currentUser.role === 'master' && (
                      <div className="bg-slate-900 text-slate-300 rounded-xl p-3 text-[11px] font-mono space-y-0.5">
                        <div className="flex justify-between text-white font-bold"><span>• 당일 노임 원가 합산:</span><span>{calc.totalGross.toLocaleString()} 원</span></div>
                        <div className="flex justify-between text-blue-400"><span>• 하루 퇴직연금 적립액:</span><span>+ {calc.severance.toLocaleString()} 원</span></div>
                        <div className="flex justify-between text-emerald-400 font-bold"><span>• 최종 실수령액 지출예정:</span><span>{calc.netPay.toLocaleString()} 원</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* 인력 명부 단순 조회 */}
        {activeTab === 'roster' && (
          <div className="space-y-4 animate-fade-in">
            <input type="text" placeholder="🔎 이름을 통합 검색하세요..." className="w-full bg-white border text-xs font-bold p-3 rounded-xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="space-y-2">
              {filteredWorkersForSearch.map(worker => (
                <div key={worker.id} className="bg-white rounded-2xl p-4 border space-y-1">
                  <div className="flex justify-between font-black text-slate-900"><span>{worker.name}</span><span className="text-xs text-blue-600 font-bold">{worker.type}</span></div>
                  <div className="text-[11px] text-slate-400 font-medium">원천소속: {worker.corp} | 지정공종: {worker.constType}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 🎯 하단 집계 및 3중 다차원 실시간 누적 안분 기성 대시보드 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-30 space-y-2">
          <div className="max-w-md mx-auto space-y-2">
            
            {currentUser.role === 'master' ? (
              <div className="space-y-2 animate-fade-in">
                {/* 🎯 상단 레이어: 가동 누적 기간 안내 표식 (2026년 기점 기준 연동) */}
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-mono flex justify-between items-center border border-slate-800">
                  <span className="text-slate-400 font-bold">🗓️ 전산망 총 누적 집계 기간:</span>
                  <span className="text-yellow-400 font-black font-mono">
                    {historyConfig.systemStartDate} ~ {historyConfig.systemCurrentDate} (총 142일간 적산)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* 가. 법인별 당일 안분 누계 */}
                  <div className="bg-slate-50 border p-2 rounded-xl text-[9px] font-mono space-y-0.5 max-h-24 overflow-y-auto">
                    <div className="font-black text-slate-400 pb-0.5 border-b uppercase">🏢 오늘 법인별 안분</div>
                    {Object.keys(finalSummary.corpMap).map(corpKey => {
                      if (finalSummary.corpMap[corpKey] === 0) return null;
                      return (
                        <div key={corpKey} className="flex justify-between text-slate-600"><span>{corpKey}</span><span className="font-bold text-blue-600">{finalSummary.corpMap[corpKey].toLocaleString()}원</span></div>
                      );
                    })}
                  </div>

                  {/* 나. 💥 [최고 마스터 전용 확장] 각 현장별 당일 발생액 및 "역대 총 누적 인건비" 동시 안분 차트 */}
                  <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-xl text-[9px] font-mono space-y-1 max-h-24 overflow-y-auto">
                    <div className="font-black text-blue-900 pb-0.5 border-b uppercase flex justify-between">
                      <span>📍 각 현장별 인건비 합산</span>
                      <span className="text-emerald-700 font-black">[금일 / 역대누적]</span>
                    </div>
                    {Object.keys(finalSummary.siteTotalAccumMap).map(siteIdKey => {
                      const matchedSiteObj = siteProperties.find(s => s.id === siteIdKey);
                      const displayName = matchedSiteObj ? matchedSiteObj.siteName : "미지정 현장";
                      const dailyAmount = finalSummary.siteDailyMap[siteIdKey] || 0;
                      const totalAccumAmount = finalSummary.siteTotalAccumMap[siteIdKey] || 0;

                      return (
                        <div key={siteIdKey} className="border-b border-slate-200/50 pb-0.5 last:border-0 text-slate-700">
                          <div className="truncate font-bold text-[9px] text-slate-800">• {displayName}</div>
                          <div className="flex justify-between text-[8.5px] font-mono pt-0.5 pl-1.5">
                            <span className="text-slate-400">금일: {dailyAmount.toLocaleString()}원</span>
                            <span className="font-black text-emerald-700">누적: {totalAccumAmount.toLocaleString()}원</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-50 p-2 rounded-xl">🔒 상세 인건비 기성 합산 현황 비공개 (MASTER ONLY)</div>
            )}

            <button onClick={() => alert("📢 마스터 권한 승인: 당일 발생 및 역대 누적 데이터 마감이 ERP 자산화로 원천 락(Lock) 보관되었습니다.")} className="w-full bg-blue-800 text-white font-black text-xs py-3.5 rounded-xl shadow-xl hover:bg-blue-900 transition-all">
              {currentUser.role === 'master' ? `👑 243제 최종 마감 및 승인 확정 (${finalSummary.totalNet.toLocaleString()}원)` : '당일 현장 일보 데이터 본사 전송 마감'}
            </button>
          </div>
        </div>
      )}

      {/* 근로자 정보 정밀 수정 모달 팝업 */}
      {editingWorker && currentUser.role === 'master' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 p-4 text-white">
              <h3 className="font-black text-sm">✏️ 근로자 정보 정밀 수정 패널</h3>
            </div>
            <form onSubmit={handleSaveEditedWorker} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">근로자 이름</label>
                <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.name} onChange={e => setEditingWorker({...editingWorker, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">소속 법인</label>
                  <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.corp} onChange={e => setEditingWorker({...editingWorker, corp: e.target.value})}>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">담당 공종</label>
                  <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.constType} onChange={e => setEditingWorker({...editingWorker, constType: e.target.value})}>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{editingWorker.type === '정규직' ? '계약 연봉금액 (자동 컴마)' : '약정 통상 시급 (자동 컴마)'}</label>
                <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none text-right pr-4" value={editingWorker.wageInput} onChange={e => setEditingWorker({...editingWorker, wageInput: formatNumberWithCommas(e.target.value)})} />
              </div>
              {editingWorker.type === '정규직' && (
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 mb-1">매월 고정 특별수당 (자동 컴마)</label>
                  <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none text-right pr-4" value={editingWorker.specialAllowance} onChange={e => setEditingWorker({...editingWorker, specialAllowance: formatNumberWithCommas(e.target.value)})} />
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingWorker(null)} className="flex-1 bg-slate-100 border text-slate-500 font-bold text-xs py-3 rounded-xl">취소</button>
                <button type="submit" className="flex-1 bg-blue-800 text-white font-black text-xs py-3 rounded-xl">수정본 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}