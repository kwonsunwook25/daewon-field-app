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
  // 보안 및 계정 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [securityAuthCode, setSecurityAuthCode] = useState(''); 
  const [isSecondStep, setIsSecondStep] = useState(false); 

  // 사용자 권한 DB
  const [userRoster, setUserRoster] = useState([
    { id: 'u-1', loginId: 'master', name: '최고마스터(신유섭)', role: 'master', password: '123', authKey: '7777' },
    { id: 'u-2', loginId: 'admin1', name: '본사재무팀', role: 'admin', password: '123', authKey: '1111' },
    { id: 'u-3', loginId: 'manager1', name: '증평현장소장', role: 'manager', password: '123', authKey: '2222' }
  ]);

  // 신규 계정 폼
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

  // 현장 등록 폼
  const [newSiteCorp, setNewSiteCorp] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteConstType, setNewSiteConstType] = useState('');
  const [newSiteAgent, setNewSiteAgent] = useState('');
  const [newSiteManager, setNewSiteManager] = useState('');
  const [newSiteContractDate, setNewSiteContractDate] = useState('');
  const [newSiteStartDate, setNewSiteStartDate] = useState('');
  const [newSiteEndDate, setNewSiteEndDate] = useState('');

  // 전사 전산 인력풀 DB
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 },
  ]);

  // 인력 등록용 폼
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); 
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); 

  const [searchQuery, setSearchQuery] = useState('');

  // 🎯 [현장 실무 최적화] 소장님이 "선택한 오늘의 가동 현장 ID"
  const [activeSiteId, setActiveSiteId] = useState('');
  // 당일 최종 매집 정산 기록 보관소
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);

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
      alert("⚠️ 전산 오류: 자격 증명이 틀렸습니다.");
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
      alert(`🔒 인증 승인: [${currentUser.name}] 등급 로그인 완료.`);
    } else {
      alert("⚠️ 보안키 코드가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(null); setLoginId(''); setLoginPassword(''); setSecurityAuthCode(''); setActiveTab('daily'); setActiveSiteId(''); setTodayActiveWorkers([]);
  };

  // 계정 발급
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserName.trim() || !newUserPassword || !newUserAuthKey) return alert("필수값을 다 기입하세요.");
    const newUser = { id: `user-${Date.now()}`, loginId: newUserId.trim(), name: newUserName.trim(), role: newUserRole, password: newUserPassword, authKey: newUserAuthKey.trim() };
    setUserRoster([...userRoster, newUser]);
    setNewUserId(''); setNewUserName(''); setNewUserPassword(''); setNewUserAuthKey('');
    alert(`✅ ${newUserName} 계정 발급 성공.`);
  };

  // 현장 신설
  const handleAddSite = (e) => {
    e.preventDefault();
    const newSite = {
      id: `site-${Date.now()}`, corp: newSiteCorp, siteName: newSiteName.trim(), constType: newSiteConstType,
      agent: newSiteAgent.trim(), manager: newSiteManager.trim(), contractDate: newSiteContractDate || '-', startDate: newSiteStartDate || '-', endDate: newSiteEndDate || '-'
    };
    setSiteProperties([...siteProperties, newSite]);
    setNewSiteName(''); setNewSiteAgent(''); setNewSiteManager('');
    alert(`🏢 [${newSite.siteName}] 개설 완료.`);
  };

  // 인력 수동 추가
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
    alert(`✅ 인력 등록 완료.`);
  };

  // 🎯 [실무형 안분 로직] 243제 기반 정산 비용 스캔 엔진
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

  // 🎯 [직관적 동선 변혁] 2단계: 특정 근로자를 현재 고정된 현장에 투입/해제 처리
  const handleToggleWorkerToActiveSite = (worker) => {
    if (!activeSiteId) {
      alert("⚠️ 조작 순서 에러: 화면 상단에서 [1단계: 오늘의 대상 현장]을 먼저 선택해 주세요!");
      return;
    }

    const targetSiteObj = siteProperties.find(s => s.id === activeSiteId);
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);

    if (isAlreadyAdded) {
      // 이미 들어와 있다면, 현재 선택된 현장 슬롯이 있는지 확인
      const targetWorker = todayActiveWorkers.find(w => w.id === worker.id);
      const hasThisSiteSlot = targetWorker.timeSlots.some(s => s.siteId === activeSiteId);

      if (hasThisSiteSlot) {
        if (targetWorker.timeSlots.length === 1) {
          // 투입된 현장이 여기뿐이면 아래 정산 명단에서 완전히 제외
          setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
        } else {
          // 다른 현장 투입 내역도 섞여 있다면 현재 현장 슬롯만 쏙 빼기
          setTodayActiveWorkers(todayActiveWorkers.map(w => {
            if (w.id !== worker.id) return w;
            return { ...w, timeSlots: w.timeSlots.filter(s => s.siteId !== activeSiteId) };
          }));
        }
      } else {
        // 명단에는 있으나 현재 현장 슬롯이 없다면 다중 현장(최대 4개) 분할 슬롯으로 강제 탑재 추가
        setTodayActiveWorkers(todayActiveWorkers.map(w => {
          if (w.id !== worker.id) return w;
          return {
            ...w,
            timeSlots: [...w.timeSlots, {
              slotId: `slot-${Date.now()}-${w.timeSlots.length + 1}`,
              corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: 8, otHours: 0
            }]
          };
        }));
      }
    } else {
      // 아예 오늘 첫 출근 체크라면 명단에 신설 생성하면서 선택한 현장/법인을 기본 박아주기
      setTodayActiveWorkers([...todayActiveWorkers, {
        ...worker, healthOk: false, signatureUrl: null,
        timeSlots: [{
          slotId: `slot-${Date.now()}-1`,
          corp: targetSiteObj.corp, siteId: targetSiteObj.id, constType: targetSiteObj.constType, baseHours: 8, otHours: 0
        }]
      }]);
    }
  };

  // 시간 조정 유틸
  const handleUpdateSlotHours = (workerId, siteId, field, numValue) => {
    setTodayActiveWorkers(todayActiveWorkers.map(w => {
      if (w.id !== workerId) return w;
      return {
        ...w,
        timeSlots: w.timeSlots.map(s => s.siteId === siteId ? { ...s, [field]: numValue } : s)
      };
    }));
  };

  // 다차원 원가 종합 집계
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
  const currentSelectedSiteDetail = siteProperties.find(s => s.id === activeSiteId);
  const filteredWorkersForSearch = masterWorkerPool.filter(w => w.name.includes(searchQuery));

  // 로그인 게이트웨이 뷰
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800 antialiased">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
          <div className="text-center"><h2 className="text-xl font-black text-slate-900">⚡ 대원 통합 전산인프라</h2><p className="text-xs text-slate-400 font-bold">지정 관리자 인증 네트워크 포털</p></div>
          {!isSecondStep ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div><label className="block text-[10px] font-black text-slate-400 mb-1">관리자 ID</label><input type="text" required className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={loginId} onChange={e => setLoginId(e.target.value)} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 mb-1">비밀번호</label><input type="password" required className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></div>
              <button type="submit" className="w-full bg-blue-700 text-white font-black text-xs py-3.5 rounded-xl mt-2">1차 계정 검증 단계 통과</button>
            </form>
          ) : (
            <form onSubmit={handleAuthKeySubmit} className="space-y-3">
              <div className="bg-blue-50 text-blue-900 p-3 rounded-xl text-[11px] font-bold">👤 소유주: {currentUser.name}<br/>📢 2차 지정 보안인증키 4자리를 기입하세요.</div>
              <input type="password" required maxLength={4} className="w-full bg-slate-50 border p-3 rounded-xl text-sm font-black text-center tracking-widest outline-none" value={securityAuthCode} onChange={e => setSecurityAuthCode(e.target.value)} />
              <button type="submit" className="w-full bg-emerald-600 text-white font-black text-xs py-3.5 rounded-xl">접속 최종 인가</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-72 font-sans text-slate-800 antialiased">
      
      {/* 상단 프로필 바 */}
      <div className="bg-slate-900 text-white p-2.5 text-xs flex justify-between items-center px-4">
        <div><span className="text-emerald-400 font-black">●접속:</span> <span className="font-bold text-yellow-400">{currentUser.name} [{currentUser.role.toUpperCase()}]</span></div>
        <button onClick={handleLogout} className="bg-red-950 text-red-400 border border-red-900 text-[10px] px-2.5 py-1 rounded font-bold">로그아웃</button>
      </div>

      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex bg-black/20 p-1 rounded-xl text-[10px] font-black space-x-0.5">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>📝 일보 입력 (실무형)</button>
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
        
        {/* 권한 발급 */}
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
                  <option value="admin">👮 관리자 (현장/근로자 제어)</option>
                  <option value="manager">👷 현장관리자 (오직 투입 일보 작성만)</option>
                </select>
                <button type="submit" className="w-full bg-indigo-900 text-white text-xs py-3 rounded-xl font-bold">계정 정식 발급 승인</button>
              </form>
            </section>
          </div>
        )}

        {/* 현장 등록 */}
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
                  {userRole === 'master' ? (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">💡 총 계약 금액 입력 (자동 컴마)</label>
                      <input type="text" placeholder="예: 48,000,000" className="w-full bg-white border rounded-xl p-2.5 text-xs font-bold outline-none text-right pr-4" value={adminWageInput} onChange={e => setAdminWageInput(formatNumberWithCommas(e.target.value))} />
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 p-2 text-center text-[10px] font-bold">🔒 권한 제한: 급여 설정 구역 보안 차단</div>
                  )}
                  <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold">등록 완료</button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* 🎯 [대개편] 일보 작성 모드 (현장 실무 최적 동선 배치) */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            
            {/* 🎯 1단계: [어디서?] 소장님이 관리하는 현장 먼저 고정 픽스 */}
            <section className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3">
              <div>
                <label className="block text-[10px] font-black text-blue-300 uppercase tracking-wider mb-1">1단계: 오늘의 가동 대상 현장 지정 *</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-black rounded-xl p-3 outline-none focus:border-blue-400"
                  value={activeSiteId} onChange={e => setActiveSiteId(e.target.value)}
                >
                  <option value="">출역을 작성할 현장을 선택하세요...</option>
                  {siteProperties.map(s => <option key={s.id} value={s.id}>{s.siteName} ({s.corp})</option>)}
                </select>
              </div>

              {/* 현장 고정 시 제원 요약 알림창 노출 */}
              {currentSelectedSiteDetail && (
                <div className="bg-black/30 rounded-xl p-3 text-[11px] font-mono text-slate-300 space-y-0.5 border border-white/10 animate-fade-in">
                  <div>🏢 계약법인: <span className="text-white font-bold">{currentSelectedSiteDetail.corp}</span></div>
                  <div>⚡ 대표공종: <span className="text-yellow-400 font-bold">{currentSelectedSiteDetail.constType}</span></div>
                  <div>👤 담당대리/소장: <span className="text-white font-bold">{currentSelectedSiteDetail.agent} / {currentSelectedSiteDetail.manager} 소장</span></div>
                </div>
              )}
            </section>

            {/* 🎯 2단계: [누가?] 이 현장에 출근한 반장님들 터치해서 간편 배치 담기 */}
            {activeSiteId && (
              <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-400 uppercase">2단계: 오늘 현장 출근 인원 터치 체크 (바둑판식)</span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">전사 인력풀</span>
                </div>
                
                <input type="text" placeholder="🔎 반장님 성명 실시간 통합 검색..." className="w-full bg-slate-50 border text-xs font-bold p-2.5 rounded-xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {filteredWorkersForSearch.map(worker => {
                    // 현재 선택된 현장에 이 반장님이 들어가 있는지 검증
                    const isAttachedToThisSite = todayActiveWorkers.find(w => w.id === worker.id)?.timeSlots.some(s => s.siteId === activeSiteId);
                    
                    return (
                      <button 
                        key={worker.id} onClick={() => handleToggleWorkerToActiveSite(worker)} 
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${isAttachedToThisSite ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {isAttachedToThisSite ? '✓ ' : '+ '} {worker.name} <span className="text-[9px] opacity-60 font-normal">({worker.type})</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 🎯 3단계: [얼마나?] 선택된 근로자별로 일한 '시간'만 조절하면 243제 안분 자동 완결 */}
            {activeSiteId && todayActiveWorkers.length > 0 && (
              <section className="space-y-3 animate-fade-in">
                <h3 className="text-xs font-black text-slate-500 px-1">3단계: 투입 근로자별 당일 근무 시간 기입 단계</h3>
                
                {todayActiveWorkers.map(worker => {
                  // 현재 선택 중인 현장의 타임슬롯 매핑 추적
                  const targetSlot = worker.timeSlots.find(s => s.siteId === activeSiteId);
                  if (!targetSlot) return null; // 타 현장 입력 대상자는 이 현장 뷰에서 잠시 패스

                  const calc = calculateDetailedWage(worker);
                  // 전체 슬롯 중 현재 슬롯의 안분 비용 인덱스 추적
                  const slotIdx = worker.timeSlots.findIndex(s => s.siteId === activeSiteId);
                  const currentSlotGross = calc.slots[slotIdx]?.grossPay || 0;

                  return (
                    <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <span className="text-base font-black text-slate-900 mr-2">{worker.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({worker.corp} / {worker.constType})</span>
                        </div>
                        <button onClick={() => handleToggleWorkerToActiveSite(worker)} className="text-xs text-red-400 font-bold">현장제외</button>
                      </div>

                      {/* 시간 입력 슬라이드 바 기능부 */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">주간 공사 시간 (시)</label>
                          <input type="number" min={0} max={24} className="w-full text-center text-sm font-black bg-white border rounded-lg p-2 outline-none focus:border-blue-500" value={targetSlot.baseHours} onChange={e => handleUpdateSlotHours(worker.id, activeSiteId, 'baseHours', Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">연장 공사 시간 (1.5배)</label>
                          <input type="number" min={0} max={24} className="w-full text-center text-sm font-black bg-white border rounded-lg p-2 outline-none focus:border-blue-500" value={targetSlot.otHours} onChange={e => handleUpdateSlotHours(worker.id, activeSiteId, 'otHours', Number(e.target.value))} />
                        </div>
                      </div>

                      {/* 다중 현장 투입 상태 오버레이 알림 */}
                      {worker.timeSlots.length > 1 && (
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg p-2 text-[10px] font-medium font-mono">
                          🔀 다중투입 감지: 이 근로자는 오늘 총 <span className="font-black text-indigo-700">{worker.timeSlots.length}개 현장</span>에 분할 투입 상태입니다.
                        </div>
                      )}

                      {/* 마스터 전용 권한별 실시간 노무 원가 안분 보드 */}
                      {currentUser.role === 'master' ? (
                        <div className="bg-slate-900 text-slate-300 rounded-xl p-3 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between text-white font-bold"><span>• 현 현장 노임 배분액:</span><span>{currentSlotGross.toLocaleString()} 원</span></div>
                          <div className="flex justify-between text-slate-400"><span>• 오늘 당일 총 실수령액(합산):</span><span>{calc.netPay.toLocaleString()} 원</span></div>
                        </div>
                      ) : (
                        <div className="text-right text-[10px] font-bold text-slate-400">🔒 시급 단가 및 기성 배분액 보안 비공개</div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {/* 단순 인력 조회 */}
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

      {/* 🎯 하단 전산 마감 및 실시간 이원화 다차원 기성 합산 대시보드 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-30 space-y-2">
          <div className="max-w-md mx-auto space-y-2">
            
            {currentUser.role === 'master' ? (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                {/* 1. 법인 중심 원가 안분 데이터 */}
                <div className="bg-slate-50 border p-2 rounded-xl text-[10px] font-mono space-y-0.5 max-h-24 overflow-y-auto">
                  <div className="font-black text-slate-400 pb-0.5 border-b uppercase">🏢 오늘 법인별 안분 누계</div>
                  {Object.keys(finalSummary.corpMap).map(corpKey => {
                    if (finalSummary.corpMap[corpKey] === 0) return null;
                    return (
                      <div key={corpKey} className="flex justify-between text-slate-600"><span>{corpKey}</span><span className="font-bold text-blue-600">{finalSummary.corpMap[corpKey].toLocaleString()}원</span></div>
                    );
                  })}
                </div>
                {/* 2. 각 현장 중심 원가 합산 누계 (순살님 핵심 오더 완료) */}
                <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-xl text-[10px] font-mono space-y-0.5 max-h-24 overflow-y-auto">
                  <div className="font-black text-blue-800 pb-0.5 border-b uppercase">📍 오늘 현장별 기성 합산</div>
                  {Object.keys(finalSummary.siteMap).map(siteIdKey => {
                    const matchedSiteObj = siteProperties.find(s => s.id === siteIdKey);
                    const displayName = matchedSiteObj ? matchedSiteObj.siteName : "미지정 현장";
                    return (
                      <div key={siteIdKey} className="flex justify-between text-slate-700">
                        <span className="truncate max-w-[85px]">• {displayName}</span>
                        <span className="font-black text-emerald-700">{finalSummary.siteMap[siteIdKey].toLocaleString()}원</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-50 p-2 rounded-xl">🔒 상세 인건비 기성 합산 통계 비공개 (MASTER ONLY)</div>
            )}

            <button onClick={() => alert(`✅ [243시간제 일보 마감 대성공] 법인 안분 및 현장별 기성 합산액 본사 정산 데이터 연동이 승인되었습니다.`)} className="w-full bg-blue-800 text-white font-black text-xs py-3.5 rounded-xl shadow-xl hover:bg-blue-900 transition-all">
              {currentUser.role === 'master' ? `243제 최종 승인 마감 (${finalSummary.totalNet.toLocaleString()}원 정산)` : '당일 현장 일보 데이터 본사 전송 마감'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}