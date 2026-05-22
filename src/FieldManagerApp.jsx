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
  // 🎯 [보안 핵심 상태] 로그인 인증 상태 제어 (기본값 false = 로그인창 먼저 표출)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // 현재 로그인한 사용자 정보

  // 로그인 폼 입력값 상태
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [securityAuthCode, setSecurityAuthCode] = useState(''); // 2차 인증용 상태
  const [isSecondStep, setIsSecondStep] = useState(false); // 2차 인증 단계 진입 여부

  // 🎯 [마스터 관리자 기본 유저 DB] - 초기 마스터 계정 탑재
  const [userRoster, setUserRoster] = useState([
    { id: 'u-1', loginId: 'master', name: '최고마스터(신유섭)', role: 'master', password: '123', authKey: '7777' },
    { id: 'u-2', loginId: 'admin1', name: '본사재무팀', role: 'admin', password: '123', authKey: '1111' },
    { id: 'u-3', loginId: 'manager1', name: '증평현장소장', role: 'manager', password: '123', authKey: '2222' }
  ]);

  // 신규 계정 등록 폼 상태값 (마스터 전용)
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('manager');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAuthKey, setNewUserAuthKey] = useState('');

  // 메인 시스템 탭 제어
  const [activeTab, setActiveTab] = useState('daily');

  // 현장 마스터 정보 DB
  const [siteProperties, setSiteProperties] = useState([
    { id: 's-1', corp: '대원전기(주)', siteName: '증평 지중화 공사 현장', constType: '배전', agent: '홍길동', manager: '김철수', contractDate: '2026-01-02', startDate: '2026-01-15', endDate: '2026-12-31' },
    { id: 's-2', corp: '대원전기(주)', siteName: '청주 한전 배전단가 현장', constType: '배전', agent: '이영희', manager: '박반장', contractDate: '2026-01-01', startDate: '2026-01-01', endDate: '2026-12-31' },
    { id: 's-3', corp: '우창전력(주)', siteName: '진천 변전소 신설 공사', constType: '변전', agent: '최소장', manager: '박소장', contractDate: '2026-02-10', startDate: '2026-03-01', endDate: '2027-05-30' }
  ]);

  // 현장 등록 폼 상태값들
  const [newSiteCorp, setNewSiteCorp] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteConstType, setNewSiteConstType] = useState('');
  const [newSiteAgent, setNewSiteAgent] = useState('');
  const [newSiteManager, setNewSiteManager] = useState('');
  const [newSiteContractDate, setNewSiteContractDate] = useState('');
  const [newSiteStartDate, setNewSiteStartDate] = useState('');
  const [newSiteEndDate, setNewSiteEndDate] = useState('');
  const [editingSite, setEditingSite] = useState(null);

  // 마스터 인력 DB
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 },
  ]);

  // 인력 등록용 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); 
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); 

  const [searchQuery, setSearchQuery] = useState('');
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const cleanNumber = String(value).replace(/[^0-9]/g, ''); 
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ','); 
  };

  const removeCommas = (str) => {
    return Number(String(str).replace(/,/g, '')) || 0;
  };

  // 🎯 [보안 인증 로직] 1단계: 아이디/비밀번호 검증
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const account = userRoster.find(u => u.loginId === loginId.trim());
    
    if (!account || account.password !== loginPassword) {
      alert("⚠️ 전산 오류: 아이디 또는 비밀번호가 틀렸습니다.");
      return;
    }
    
    // 1단계 통과 ➔ 2차 보안인증 단계 활성화
    setCurrentUser(account);
    setIsSecondStep(true);
  };

  // 🎯 [보안 인증 로직] 2단계: 마스터 부여 고유 인증키 절차 검증
  const handleAuthKeySubmit = (e) => {
    e.preventDefault();
    if (currentUser.authKey === securityAuthCode.trim()) {
      setIsLoggedIn(true);
      setIsSecondStep(false);
      alert(`🔒 인증 성공: [${currentUser.name}] 등급 접속 승인 완료.`);
    } else {
      alert("⚠️ 보안 인증 실패: 지정 인증키 코드가 일치하지 않습니다.");
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginId('');
    setLoginPassword('');
    setSecurityAuthCode('');
    setActiveTab('daily');
    alert("🔐 전산망 보안 로그아웃 완료.");
  };

  // 🎯 [마스터 특권] 새로운 관리자 및 현장관리자 발급 등록부
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserName.trim() || !newUserPassword || !newUserAuthKey) {
      alert("계정 발급 필수 정보를 모두 입력해 주세요.");
      return;
    }
    if (userRoster.some(u => u.loginId === newUserId.trim())) {
      return alert("⚠️ 이미 등록된 중복 ID 입니다.");
    }

    const newUser = {
      id: `user-${Date.now()}`,
      loginId: newUserId.trim(),
      name: newUserName.trim(),
      role: newUserRole,
      password: newUserPassword,
      authKey: newUserAuthKey.trim()
    };

    setUserRoster([...userRoster, newUser]);
    setNewUserId(''); setNewUserName(''); setNewUserPassword(''); setNewUserAuthKey('');
    alert(`✅ [${newUser.name}] 계정이 ${newUserRole} 권한으로 신규 발급되었습니다.`);
  };

  // 계정 파기 삭제 함수
  const handleDeleteUser = (id, name) => {
    if (id === 'u-1') return alert("⚠️ 최고 마스터 본인 계정은 파기할 수 없습니다.");
    if (!window.confirm(`💥 [위험] '${name}' 사용자의 로그인 권한을 즉시 박탈하시겠습니까?`)) return;
    setUserRoster(userRoster.filter(u => u.id !== id));
  };

  // 현장 등록 처리
  const handleAddSite = (e) => {
    e.preventDefault();
    if (currentUser?.role === 'manager') return alert("⚠️ 권한 한계: 현장관리자는 개설 권한이 없습니다.");
    const newSite = {
      id: `site-${Date.now()}`, corp: newSiteCorp, siteName: newSiteName.trim(), constType: newSiteConstType,
      agent: newSiteAgent.trim(), manager: newSiteManager.trim(), contractDate: newSiteContractDate || '-', startDate: newSiteStartDate || '-', endDate: newSiteEndDate || '-'
    };
    setSiteProperties([...siteProperties, newSite]);
    setNewSiteName(''); setNewSiteAgent(''); setNewSiteManager('');
    alert(`🏢 [${newSite.siteName}] 현장이 전산에 개설되었습니다.`);
  };

  // 인력 수동 등록
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (currentUser?.role === 'manager') return alert("⚠️ 권한 한계: 인력 수동 등록이 제한됩니다.");
    const wageNum = removeCommas(adminWageInput);
    const allowanceNum = removeCommas(adminAllowanceInput);

    const newWorker = {
      id: `admin-${Date.now()}`, corp: adminCorp, constType: adminType, name: adminName.trim(), type: adminWorkerType, specialAllowance: allowanceNum,
      ...(adminWorkerType === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };
    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName(''); setAdminWageInput(''); setAdminAllowanceInput('');
    alert(`✅ 마스터 인력풀에 정상 등록되었습니다.`);
  };

  // 다중분할 정산 원가 계산 엔진
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

  const handleToggleSelectWorker = (worker) => {
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);
    if (isAlreadyAdded) {
      setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
    } else {
      setTodayActiveWorkers([...todayActiveWorkers, {
        ...worker, healthOk: false, signatureUrl: null,
        timeSlots: [{ slotId: `slot-${Date.now()}-1`, corp: worker.corp, siteId: '', constType: worker.constType, baseHours: 8, otHours: 0 }]
      }]);
    }
  };

  const handleAddSlot = (workerId) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => {
      if (w.id !== workerId) return w;
      if (w.timeSlots.length >= 4) return w;
      return { ...w, timeSlots: [...w.timeSlots, { slotId: `slot-${Date.now()}-${w.timeSlots.length + 1}`, corp: CORPORATIONS[0], siteId: '', constType: CONSTRUCTION_TYPES[0], baseHours: 0, otHours: 0 }] };
    }));
  };

  const handleUpdateSlotField = (workerId, slotId, field, value) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => {
      if (w.id !== workerId) return w;
      return { ...w, timeSlots: w.timeSlots.map(s => s.slotId === slotId ? { ...s, [field]: value } : s) };
    }));
  };

  const getDichotomySummary = () => {
    const corpMap = {}; CORPORATIONS.forEach(c => { corpMap[c] = 0; });
    const siteMap = {}; let totalGross = 0; let totalNet = 0;
    todayActiveWorkers.forEach(w => {
      const calc = calculateDetailedWage(w); totalNet += calc.netPay;
      calc.slots.forEach(s => {
        if (corpMap[s.corp] !== undefined) { corpMap[s.corp] += s.grossPay; totalGross += s.grossPay; }
        if (s.siteId) { if (!siteMap[s.siteId]) siteMap[s.siteId] = 0; siteMap[s.siteId] += s.grossPay; }
      });
    });
    return { corpMap, siteMap, totalGross, totalNet };
  };

  const finalSummary = getDichotomySummary();
  const dynamicSites = (corp) => siteProperties.filter(s => s.corp === corp);
  const filteredMasterPool = masterWorkerPool.filter(worker => worker.name.includes(searchQuery));

  // =========================================================
  // 🎯 [보안 렌더링 게이트웨이] 로그인 인증창 UI 모듈 구성
  // =========================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800 antialiased">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 border border-slate-700/50 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900">⚡ 대원 통합 전산인프라</h2>
            <p className="text-xs font-bold text-slate-400">지정 관리자 인증 네트워크 포털</p>
          </div>

          {!isSecondStep ? (
            // 1단계: ID / 비밀번호 입력
            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">관리자 ID</label>
                <input type="text" required placeholder="Id를 입력하세요..." className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" value={loginId} onChange={e => setLoginId(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">접속 비밀번호</label>
                <input type="password" required placeholder="••••••••" className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg mt-2">
                1차 계정 검증 단계 통과
              </button>
            </form>
          ) : (
            // 2단계: 마스터 발급 고유 보안인증 절차 키 입력
            <form onSubmit={handleAuthKeySubmit} className="space-y-3 pt-2 animate-fade-in">
              <div className="bg-blue-50 text-blue-900 p-3 rounded-xl text-[11px] font-bold border border-blue-100">
                👤 계정 소유주 확인: <span className="underline font-black">{currentUser.name} ({currentUser.role})</span><br/>
                📢 마스터가 부여한 <span className="text-blue-700 font-black">2차 지정 보안인증키</span> 4자리를 기입하세요.
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-700 uppercase mb-1">2차 보안인증 절차 키 코드</label>
                <input type="password" required maxLength={4} placeholder="보안키 4자리 입력..." className="w-full bg-slate-50 border border-blue-400 p-3 rounded-xl text-sm tracking-widest font-black text-center outline-none" value={securityAuthCode} onChange={e => setSecurityAuthCode(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsSecondStep(false)} className="flex-1 bg-slate-100 text-slate-500 text-xs font-bold py-3.5 rounded-xl">뒤로가기</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg">접속 최종 인가</button>
              </div>
            </form>
          )}

          <div className="text-center text-[10px] text-slate-400 font-mono">대원전기(주) 보안 관리 규격 시스템 v2026</div>
        </div>
      </div>
    );
  }

  // =========================================================
  // 🎯 로그인 인가 완료 후 메인 현장 시스템 UI 파트 진입
  // =========================================================
  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-72 font-sans text-slate-800 antialiased">
      
      {/* 최상단 로그인 유저 프로필 및 로그아웃 유틸 바 */}
      <div className="bg-slate-900 text-white p-2.5 text-xs flex justify-between items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 font-black">●접속자:</span>
          <span className="font-bold text-yellow-400 text-[11px]">{currentUser.name}님 [{currentUser.role.toUpperCase()}]</span>
        </div>
        <button onClick={handleLogout} className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-900 text-[10px] px-2.5 py-1 rounded font-bold transition-all">안전 로그아웃</button>
      </div>

      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex bg-black/20 p-1 rounded-xl text-[10px] font-black space-x-0.5">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>📝 일보 작성</button>
          
          {currentUser.role !== 'manager' && (
            <>
              <button onClick={() => setActiveTab('siteAdmin')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'siteAdmin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>🏢 현장 등록</button>
              <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>➕ 인력 관리</button>
            </>
          )}

          {currentUser.role === 'master' && (
            <button onClick={() => setActiveTab('security')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>🔐 권한 발급</button>
          )}
          
          <button onClick={() => setActiveTab('roster')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>📊 명부 조회</button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* 🎯 [마스터 독점권] 🔐 관리자 및 현장관리자 신규 계정 개설 창 */}
        {activeTab === 'security' && currentUser.role === 'master' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-black text-slate-800">👑 중간 관리자 및 소장용 보안 계정 발급창</h2>
              <form onSubmit={handleCreateUser} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="접속용 ID 부여 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={newUserId} onChange={e => setNewUserId(e.target.value)} />
                  <input type="text" placeholder="소유자 성명 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="password" placeholder="접속 비밀번호 *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                  <input type="text" maxLength={4} placeholder="2차 지정인증키(4자) *" className="bg-slate-50 border p-2.5 rounded-xl text-xs font-bold text-center tracking-widest outline-none" value={newUserAuthKey} onChange={e => setNewUserAuthKey(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">부여 전산 보안 등급</label>
                  <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="admin">👮 관리자 (현장 개설 및 근로자 제어 권한)</option>
                    <option value="manager">网 현장관리자 (오직 투입 일보 작성 권한만)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-900 text-white text-xs py-3 rounded-xl font-bold">전산망 정식 계정 발급 승인</button>
              </form>
            </section>

            {/* 가동 계정 명부 */}
            <section className="bg-white p-4 rounded-2xl border space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase">현재 인가된 접근 권한 Roster ({userRoster.length}개)</h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {userRoster.map(u => (
                  <div key={u.id} className="bg-slate-50 border p-2.5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-slate-900">{u.name}</span> <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded font-bold">{u.role.toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {u.loginId} | 비밀번호: {u.password} | 2차지정키: {u.authKey}</span>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="bg-red-50 text-red-600 border px-2 py-1 rounded text-[10px] font-bold">파기</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 현장 마스터 등록 및 관리 탭 */}
        {activeTab === 'siteAdmin' && currentUser.role !== 'manager' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">🏢 신규 현장 개설 등록부</h2>
              <form onSubmit={handleAddSite} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={newSiteCorp} onChange={e => setNewSiteCorp(e.target.value)}>
                    <option value="">소속 법인 선택 *</option>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border rounded-xl p-2.5 text-xs font-bold" value={newSiteConstType} onChange={e => setNewSiteConstType(e.target.value)}>
                    <option value="">대표 공종 선택 *</option>
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

        {/* 인력 추가 및 명부 관리 탭 */}
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
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg text-[10px] font-bold text-center">🔒 권한 제한: 급여 설정 권한은 마스터 전용 보안구역입니다.</div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold">등록 완료</button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* 전체 명부 조회 */}
        {activeTab === 'roster' && (
          <div className="space-y-4 animate-fade-in">
            <input type="text" placeholder="🔎 이름을 검색하세요..." className="w-full bg-white border text-xs font-bold p-3 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="space-y-2">
              {filteredMasterPool.map(w => (
                <div key={w.id} className="bg-white rounded-xl p-3 border text-xs flex justify-between items-center">
                  <div><span className="font-bold text-slate-900">{w.name}</span> <span className="text-[10px] text-slate-400">({w.corp})</span></div>
                  <button onClick={() => handleToggleSelectWorker(w)} className={`px-3 py-1 rounded-lg font-bold ${todayActiveWorkers.some(t => t.id === w.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {todayActiveWorkers.some(t => t.id === w.id) ? '✓ 선택됨' : '+ 대기'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 일보 및 현장 배치 작성 탭 */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-2">
              <span className="text-[11px] font-black text-blue-800">💡 근로자 이름 즉석 클릭 투입 명단창</span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                {masterWorkerPool.map(worker => {
                  const isSelected = todayActiveWorkers.some(w => w.id === worker.id);
                  return (
                    <button key={worker.id} onClick={() => handleToggleSelectWorker(worker)} className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      {isSelected ? '✓ ' : '+ '} {worker.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              {todayActiveWorkers.map(worker => {
                const calc = calculateDetailedWage(worker);
                return (
                  <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-md border border-blue-200/50 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div><span className="text-base font-black text-slate-900 mr-2">{worker.name}</span><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{worker.type}</span></div>
                      <button onClick={() => handleToggleSelectWorker(worker)} className="text-xs text-red-500 font-bold">제외</button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400">📍 당일 투입 현장 리스트</span>
                        {currentUser.role !== 'manager' && <button onClick={() => handleAddSlot(worker.id)} className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-black">+ 현장 추가</button>}
                      </div>

                      {worker.timeSlots.map((slot, sIdx) => {
                        const calculatedSlotAmount = calc.slots[sIdx]?.grossPay || 0;
                        const slotDynamicSites = siteProperties.filter(s => s.corp === slot.corp);

                        return (
                          <div key={slot.slotId} className="bg-slate-50 p-3 rounded-xl border space-y-2 relative">
                            {currentUser.role !== 'manager' && <button onClick={() => handleUpdateSlotField(worker.id, slot.slotId, 'REMOVE_FLAG', true)} className="absolute top-2 right-2 text-red-400 font-bold text-[10px]">X</button>}
                            <div className="text-[10px] font-black text-blue-600">현장 #{sIdx + 1} 배분</div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">투입 법인</label>
                                <select className="w-full bg-white border text-[11px] font-bold p-1.5 rounded-lg" value={slot.corp} onChange={e => handleUpdateSlotField(worker.id, slot.slotId, 'corp', e.target.value)}>
                                  {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-0.5">매핑 현장</label>
                                <select className="w-full bg-white border text-[11px] font-bold p-1.5 rounded-lg" value={slot.siteId} onChange={e => handleUpdateSlotField(worker.id, slot.slotId, 'siteId', e.target.value)}>
                                  <option value="">현장 고르기</option>
                                  {slotDynamicSites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <label className="block text-[9px] text-slate-400">투입공종</label>
                                <select className="w-full bg-white border text-[10px] font-bold p-1 rounded" value={slot.constType} onChange={e => handleUpdateSlotField(worker.id, slot.slotId, 'constType', e.target.value)}>
                                  {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400">주간(시)</label>
                                <input type="number" className="w-full bg-white border text-[11px] font-bold p-1 text-center rounded" value={slot.baseHours} onChange={e => handleUpdateSlotField(worker.id, slot.slotId, 'baseHours', Number(e.target.value))} />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400">연장(시)</label>
                                <input type="number" className="w-full bg-white border text-[11px] font-bold p-1 text-center rounded" value={slot.otHours} onChange={e => handleUpdateSlotField(worker.id, slot.slotId, 'otHours', Number(e.target.value))} />
                              </div>
                            </div>

                            {currentUser.role === 'master' && (
                              <div className="text-right text-[10px] font-mono text-slate-500 pt-1 border-t border-dashed">
                                노임 안분액: <span className="font-bold text-slate-900">{calculatedSlotAmount.toLocaleString()}원</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 종합 공제 및 실수령액 마스터 전용 상세 전산 */}
                    {currentUser.role === 'master' ? (
                      <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-400"><span>📊 오늘 총 노임 원가 합산액:</span><span className="font-bold text-white">{calc.totalGross.toLocaleString()} 원</span></div>
                        <div className="flex justify-between text-blue-400"><span>📁 하루 퇴직연금 적립금 (1/12):</span><span>+ {calc.severance.toLocaleString()} 원</span></div>
                        <div className="border-t border-slate-700 my-1"></div>
                        <div className="flex justify-between text-emerald-400 font-bold"><span>💵 오늘 당일 최종 실수령액 합계:</span><span>{calc.netPay.toLocaleString()} 원</span></div>
                      </div>
                    ) : (
                      <div className="bg-slate-800 text-slate-400 rounded-xl p-2 text-center text-[10px] font-bold">🔒 분할 정산 세무 내역 및 실수령액은 최고마스터 권한 보안 구역입니다.</div>
                    )}

                    <div className="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-2">
                      <label className="flex justify-between items-center cursor-pointer">
                        <span className={worker.healthOk ? 'text-slate-600 font-bold' : 'text-red-500 font-black'}>🩺 당일 건강 상태 정상 서명 확인</span>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={worker.healthOk} onChange={() => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? { ...w, healthOk: !w.healthOk } : w))} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>

      {/* 하단 집계 대시보드 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-30 space-y-2">
          <div className="max-w-md mx-auto space-y-2">
            {currentUser.role === 'master' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border p-2 rounded-xl text-[10px] font-mono space-y-1 max-h-24 overflow-y-auto">
                  <div className="font-black text-slate-400 pb-0.5 border-b uppercase">🏢 오늘 법인별 누계</div>
                  {Object.keys(finalSummary.corpMap).map(corpKey => {
                    if (finalSummary.corpMap[corpKey] === 0) return null;
                    return (
                      <div key={corpKey} className="flex justify-between text-slate-600"><span>{corpKey}</span><span className="font-bold text-blue-600">{finalSummary.corpMap[corpKey].toLocaleString()}원</span></div>
                    );
                  })}
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-xl text-[10px] font-mono space-y-1 max-h-24 overflow-y-auto">
                  <div className="font-black text-blue-800 pb-0.5 border-b uppercase">📍 오늘 현장별 인건비 합산</div>
                  {Object.keys(finalSummary.siteMap).map(siteIdKey => {
                    const matchedSiteObj = siteProperties.find(s => s.id === siteIdKey);
                    const displayName = matchedSiteObj ? matchedSiteObj.siteName : "미지정 현장";
                    return (
                      <div key={siteIdKey} className="flex justify-between text-slate-700"><span>• {displayName}</span><span className="font-black text-emerald-700">{finalSummary.siteMap[siteIdKey].toLocaleString()}원</span></div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-50 p-2 rounded-xl">🔒 상세 인건비 기성 합산 현황 비공개 (MASTER ONLY)</div>
            )}
            <button onClick={() => alert(`✅ [전산 마감 성공] 다중 분할 내역이 정식 승인되었습니다.`)} className="w-full bg-blue-800 text-white font-black text-xs py-3.5 rounded-xl shadow-xl">
              {currentUser.role === 'master' ? `243제 최종 승인 마감 (${finalSummary.totalNet.toLocaleString()}원 정산)` : '분할 정산 일보 데이터 본사 마감 전송'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}