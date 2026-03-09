// @ts-nocheck
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── 아이콘 ───
const ShieldIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const BellIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const ArrowIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const StarIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const ChevronIcon = ({ open }: { open: boolean }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>;
const ShareIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

// ─── 입력 검증 유틸 (OpenAI 체리픽) ───
const normalizePhone = (v) => (v || "").replace(/[^\d]/g, "");
const isValidPhone = (v) => { const n = normalizePhone(v); return n.length === 10 || n.length === 11; };
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export default function ZiumFinal() {
  const [step, setStep] = useState('landing');
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inputError, setInputError] = useState("");
  const [scanPhase, setScanPhase] = useState(0);
  const [showPrice, setShowPrice] = useState(false);
  const [dashAnimated, setDashAnimated] = useState(false);
  const [safetyScore, setSafetyScore] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [todayStr, setTodayStr] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [preregEmail, setPreregEmail] = useState("");
  const [preregDone, setPreregDone] = useState(false);
  const [preregCount, setPreregCount] = useState(847);
  const [breachData, setBreachData] = useState(null);
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [checkedActions, setCheckedActions] = useState({});
  const [safetyScoreCalc, setSafetyScoreCalc] = useState(10);
  const [show2faGuide, setShow2faGuide] = useState(false);
  const emailRef = useRef(null);

  // ✅ [FIX 1] 하이드레이션: 클라이언트에서만 날짜 세팅
  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('ko-KR'));
    document.title = "지움 | 내 개인정보, 지워드립니다";
  }, []);

  // GA4 이벤트 트래킹
  const gtag = (...args) => {
    if (typeof window !== 'undefined' && window.gtag) window.gtag(...args);
  };
  const trackEvent = (eventName, params = {}) => {
    gtag('event', eventName, params);
    if (typeof window !== 'undefined') console.log(`[GA4] ${eventName}`, params);
  };

  // 사전등록 제출 (서버 API 경유 — OpenAI 체리픽)
  const handlePreregister = async () => {
    if (!preregEmail || !isValidEmail(preregEmail)) return;
    trackEvent('pre_register_submit', { plan: selectedPlan, email_domain: preregEmail.split('@')[1] });

    try {
      await fetch('/api/preregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preregEmail, plan: selectedPlan, leakCount })
      });
    } catch (e) { console.error('사전등록 전송 에러:', e); }

    setPreregDone(true);
    setPreregCount(prev => prev + 1);
    trackEvent('pre_register_complete', { plan: selectedPlan });
  };

  // ✅ [FIX 4] 뒤로가기 처리
  const navigateTo = useCallback((newStep) => {
    window.history.pushState({ step: newStep }, '', `?step=${newStep}`);
    setStep(newStep);
  }, []);

  useEffect(() => {
    const handlePop = (e) => {
      if (e.state?.step) {
        setStep(e.state.step);
      } else {
        setStep('landing');
      }
    };
    window.addEventListener('popstate', handlePop);
    window.history.replaceState({ step: 'landing' }, '', '?step=landing');
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // 유출 건수 계산
  const getLeakCount = () => {
    if (breachData && breachData.totalBreaches !== undefined) return breachData.totalBreaches;
    return 0;
  };

  // 피해금액 (만원 단위 숫자 — Gemini CSS카운터용)
  const getDamageAmount = (count) => {
    const base = count * 30000;
    const hash = email ? email.split('').reduce((a, b) => { a = ((a << 3) - a) + b.charCodeAt(0); return a & a; }, 0) : 0;
    const variance = Math.abs(hash % 30000);
    const total = base + 50000 + variance;
    return Math.round(total / 10000);
  };

  const leakCount = getLeakCount();
  const damageAmount = getDamageAmount(leakCount);

  // 유출 항목 리스트
  const getLeakItems = () => {
    if (!breachData || !breachData.breaches || breachData.breaches.length === 0) return [];
    const classMap = {};
    breachData.breaches.forEach(b => {
      (b.dataClasses || []).forEach(dc => {
        if (!classMap[dc]) classMap[dc] = { count: 0, severity: b.severity };
        classMap[dc].count++;
        if (b.severity === "critical") classMap[dc].severity = "critical";
      });
    });
    const labelMap = {
      "Email addresses": { icon: "📧", label: "이메일 주소" },
      "Passwords": { icon: "🔑", label: "비밀번호" },
      "Phone numbers": { icon: "📱", label: "전화번호" },
      "IP addresses": { icon: "🌐", label: "IP 주소" },
      "Names": { icon: "👤", label: "이름" },
      "Usernames": { icon: "👤", label: "아이디/닉네임" },
      "Physical addresses": { icon: "🏠", label: "주소 정보" },
      "Dates of birth": { icon: "📅", label: "생년월일" },
      "Credit card data": { icon: "💳", label: "신용카드 정보" },
      "Bank account numbers": { icon: "🏦", label: "은행 계좌" },
      "Social media profiles": { icon: "📱", label: "SNS 프로필" },
      "Employment": { icon: "💼", label: "직장 정보" },
      "Geographic locations": { icon: "📍", label: "위치 정보" },
      "Genders": { icon: "👤", label: "성별" },
      "Job titles": { icon: "💼", label: "직업" },
      "Employers": { icon: "🏢", label: "직장" },
      "Education levels": { icon: "🎓", label: "학력" },
      "Nationalities": { icon: "🌍", label: "국적" },
      "Purchasing habits": { icon: "🛒", label: "구매 이력" },
      "Device information": { icon: "📱", label: "기기 정보" },
      "Security questions and answers": { icon: "❓", label: "보안 질문/답변" },
      "Bios": { icon: "📝", label: "프로필 소개" },
      "Age groups": { icon: "📊", label: "연령대" },
      "Avatars": { icon: "🖼️", label: "프로필 사진" },
      "Social connections": { icon: "🤝", label: "소셜 관계" },
      "Government issued IDs": { icon: "🪪", label: "신분증 정보" },
      "Auth tokens": { icon: "🔐", label: "인증 토큰" },
      "Partial credit card data": { icon: "💳", label: "카드정보(일부)" },
      "Time zones": { icon: "🕐", label: "시간대" },
      "Family members' names": { icon: "👨‍👩‍👧", label: "가족 이름" },
      "Passport numbers": { icon: "🛂", label: "여권번호" },
      "Smoking habits": { icon: "🚬", label: "흡연 여부" },
      "Drinking habits": { icon: "🍷", label: "음주 여부" },
      "Living costs": { icon: "💰", label: "생활비 정보" },
      "Apps installed on devices": { icon: "📲", label: "설치된 앱" },
      "Browser user agent details": { icon: "🌐", label: "브라우저 정보" },
    };
    const items = [];
    Object.entries(classMap).forEach(([dc, info]) => {
      const mapped = labelMap[dc] || { icon: "📋", label: dc };
      items.push({
        icon: mapped.icon,
        label: mapped.label,
        status: info.count + "곳 노출",
        severity: info.severity === "critical" ? "critical" : info.count >= 3 ? "high" : "medium",
        sites: breachData.breaches
          .filter(b => (b.dataClasses || []).includes(dc))
          .map(b => b.title || b.name)
      });
    });
    const order = { critical: 0, high: 1, medium: 2 };
    items.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2));
    return items.slice(0, 8);
  };

  // 스캔 시뮬레이션 + API 연동 결과 반영
  useEffect(() => {
    if (step === 'scan') {
      const tasks = [
        { t: "개인정보보호위원회 유출 신고 데이터 대조 중...", p: 15, phase: 1 },
        { t: (email || phone) + " 관련 유출 이력 조회 중...", p: 30, phase: 1 },
        { t: "글로벌 유출 데이터베이스(HIBP) 정밀 분석 중...", p: 50, phase: 2 },
        { t: "유출 경로 분석 및 피해 규모 산정 중...", p: 70, phase: 3 },
        { t: "리포트 생성 중...", p: 90, phase: 3 },
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < tasks.length) {
          setLoadingText(tasks[i].t);
          setProgress(tasks[i].p);
          setScanPhase(tasks[i].phase);
          i++;
        }
      }, 1200);
      const checkDone = setInterval(() => {
        if (!isScanning && (breachData || scanError)) {
          clearInterval(interval);
          clearInterval(checkDone);
          setProgress(100);
          setLoadingText("리포트 생성 완료");
          setScanPhase(4);
          setTimeout(() => {
            if (breachData && breachData.totalBreaches === 0) {
              navigateTo('noLeak');
            } else {
              navigateTo('report');
            }
          }, 600);
        }
      }, 300);
      return () => { clearInterval(interval); clearInterval(checkDone); };
    }
  }, [step, isScanning, breachData, scanError]);

  useEffect(() => {
    if (step === 'report') {
      setTimeout(() => setShowPrice(true), 300);
      trackEvent('report_view', { leak_count: leakCount });
    }
  }, [step]);

  useEffect(() => {
    if (step === 'report' && breachData) {
      const total = breachData.totalBreaches || 0;
      const critical = breachData.summary?.critical || 0;
      const base = Math.max(5, 50 - (total * 3) - (critical * 5));
      setSafetyScoreCalc(Math.min(Math.max(base, 5), 45));
      setCheckedActions({});
    }
  }, [step, breachData]);

  useEffect(() => {
    if (step === 'dashboard') {
      setTimeout(() => setDashAnimated(true), 100);
      let score = 0;
      const interval = setInterval(() => {
        score += 1;
        setSafetyScore(score);
        if (score >= 38) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleScan = async () => {
    if (!email && !phone) { setInputError("이메일 또는 전화번호를 입력해주세요"); emailRef.current?.focus(); return; }
    if (email && !isValidEmail(email)) { setInputError("올바른 이메일 형식을 입력해주세요"); return; }
    if (phone && !isValidPhone(phone)) { setInputError("올바른 전화번호를 입력해주세요 (10~11자리)"); return; }
    setInputError(""); setScanError(""); setBreachData(null); setIsScanning(true);
    trackEvent('scan_start', { has_email: !!email, has_phone: !!phone });
    navigateTo('scan');
    try {
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email || undefined, phone: phone || undefined }) });
      const data = await res.json();
      if (data.ok) { setBreachData(data); } else { setScanError(data.error || "scan_failed"); }
    } catch (e) { setScanError("network_error"); } finally { setIsScanning(false); }
  };

  // FAQ 데이터
  const faqData = [
    { q: "진짜 삭제가 되나요?", a: "사이트 성격에 따라 삭제, 비공개 전환, 처리 요청 등 가능한 조치를 진행합니다. 모든 사이트에서 동일한 결과를 보장하지는 않으며, 진행 상태를 투명하게 안내해 드립니다." },
    { q: "지움에 개인정보를 또 넘기는 건 아닌가요?", a: "조회와 요청 진행에 필요한 최소 정보만 사용합니다. 사용 목적과 보관·파기 기준은 개인정보처리방침에서 확인하실 수 있습니다." },
    { q: "해지하면 어떻게 되나요?", a: "해지 시 새 요청 진행과 점검 안내가 중단됩니다. 이미 접수된 요청 건은 진행 상태에 따라 처리될 수 있으며, 자세한 내용은 안내를 통해 확인하실 수 있습니다." },
    { q: "삭제 안 되면 환불 되나요?", a: "환불 기준은 서비스 이용약관에 따라 안내됩니다. 요청이 진행되지 않은 경우 정책에 따라 환불이 가능합니다. 자세한 내용은 고객센터를 통해 확인해 주세요." },
    { q: "해외 사이트도 삭제 가능한가요?", a: "사이트 정책과 운영 환경에 따라 가능 여부가 다릅니다. 가능한 경우 요청을 진행하고, 진행 상태를 안내해 드립니다." },
  ];

  const passwordChangeUrls = {
    "Dropbox": "https://www.dropbox.com/account/security",
    "Twitter": "https://twitter.com/settings/password",
    "Adobe": "https://account.adobe.com/security",
    "LinkedIn": "https://www.linkedin.com/psettings/change-password",
    "Facebook": "https://www.facebook.com/settings?tab=security",
    "Canva": "https://www.canva.com/settings/account",
    "CoinMarketCap": "https://coinmarketcap.com/account/security/",
    "Houzz": "https://www.houzz.com/user/account",
    "Jefit": "https://www.jefit.com/my-jefit/account-settings/",
    "MyFitnessPal": "https://www.myfitnesspal.com/account/change_password",
    "Duolingo": "https://www.duolingo.com/settings/account",
    "Bitly": "https://app.bitly.com/settings/profile/",
    "Imgur": "https://imgur.com/account/settings",
    "Wattpad": "https://www.wattpad.com/settings",
    "Deezer": "https://www.deezer.com/account",
    "Zynga": "https://www.zynga.com/",
    "Earth 2": "https://app.earth2.io/#settings",
    "Twitter (200M)": "https://twitter.com/settings/password",
    "Collection #1": null,
    "2,844 Separate Data Breaches": null,
    "Synthient Credential Stuffing Threat Data": null,
  };

  const dpEmails = {
    "Dropbox": "privacy@dropbox.com",
    "Twitter": "privacy@twitter.com",
    "Adobe": "privacy@adobe.com",
    "LinkedIn": "privacy@linkedin.com",
    "Facebook": "privacy@fb.com",
    "Canva": "privacy@canva.com",
    "Houzz": "privacy@houzz.com",
    "집꾸미기": "cs@zipkumi.com",
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191F28]" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @property --dmg { syntax: "<integer>"; initial-value: 0; inherits: false; }
        @keyframes countUpNum { from { --dmg: 0; } }
        .counter-animate { animation: countUpNum 1.2s ease-out forwards; counter-reset: dmg var(--dmg); }
        .counter-animate::after { content: counter(dmg); }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .fade-up-1 { animation: fadeUp 0.6s ease-out 0.1s forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.6s ease-out 0.2s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.6s ease-out 0.35s forwards; opacity: 0; }
        .fade-up-4 { animation: fadeUp 0.6s ease-out 0.5s forwards; opacity: 0; }
        .fade-up-5 { animation: fadeUp 0.6s ease-out 0.65s forwards; opacity: 0; }
        .fade-up-6 { animation: fadeUp 0.6s ease-out 0.8s forwards; opacity: 0; }
        .scale-in { animation: scaleIn 0.5s ease-out forwards; }
        input::placeholder { color: #ADB5BD; }
        input:focus { outline: none; }
        .blur-content { filter: blur(6px); user-select: none; pointer-events: none; }
      `}</style>

      {/* ─── 네비게이션 ─── */}
      <nav className="max-w-[440px] mx-auto bg-white/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-gray-100/80">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('landing')}>
          <div className="w-9 h-9 bg-[#191F28] rounded-2xl flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">Z</span>
          </div>
          <span className="font-extrabold text-[19px] tracking-tight">지움</span>
        </div>
        {step === 'dashboard' ? (
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><BellIcon /></div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F6FF] rounded-full">
            <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#3182F6] tracking-tight">공개 자료 기반 유출 확인</span>
          </div>
        )}
      </nav>

      <main className="max-w-[440px] mx-auto min-h-screen pb-32">

        {/* ════════════════════════════════
            STEP 1: 랜딩
        ════════════════════════════════ */}
        {step === 'landing' && (
          <div className="px-7 pt-10 pb-8 space-y-8">
            {/* ✅ [FIX 6] 히어로 카피 개선 */}
            <div className="fade-up space-y-4">
              <h1 className="text-[30px] font-black leading-[1.25] tracking-tight">
                내 개인정보,<br />
                어디에 노출됐는지 확인하고<br />
                <span className="text-[#3182F6]">삭제 요청</span>까지 도와드립니다
              </h1>
              <p className="text-[15px] text-[#6B7684] leading-relaxed">
                이름, 전화번호, 이메일, 주소가 인터넷 게시물이나 데이터 수집 사이트에 남아 있을 수 있습니다. 지움은 노출 여부를 확인하고, 가능한 삭제·비공개 요청을 대신 진행합니다.
              </p>
            </div>

            {/* ✅ [FIX 5] 일일 유출 건수 동적화 */}
            <div className="fade-up-1 bg-[#191F28] rounded-[24px] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400"><AlertIcon /></span>
              </div>
              <div>
                <p className="text-white font-bold text-[14px]">일 평균 <span className="text-red-400">2만건 이상</span> 개인정보 유출</p>
                <p className="text-gray-500 text-[11px] mt-0.5">2024 개인정보보호위원회 연간 보고서 기반 일환산</p>
              </div>
            </div>

            {/* 입력 폼 */}
            <div className="fade-up-2 bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#3182F6]"><SearchIcon /></span>
                <h3 className="font-bold text-[15px]">내 개인정보 유출 여부 확인</h3>
              </div>
              <div className="space-y-3">
                <input ref={emailRef} type="email" placeholder="이메일 주소 입력" value={email}
                  onChange={(e) => { setEmail(e.target.value); setInputError(""); }}
                  className="w-full px-4 py-3.5 bg-[#F8F9FA] rounded-2xl text-[14px] font-medium border border-transparent focus:border-[#3182F6] focus:bg-white transition-all"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-[1px] bg-gray-100"></div>
                  <span className="text-[11px] text-gray-400 font-medium">또는</span>
                  <div className="flex-1 h-[1px] bg-gray-100"></div>
                </div>
                <input type="tel" placeholder="전화번호 입력 (010-0000-0000)" value={phone}
                  onChange={(e) => { setPhone(normalizePhone(e.target.value)); setInputError(""); }}
                  className="w-full px-4 py-3.5 bg-[#F8F9FA] rounded-2xl text-[14px] font-medium border border-transparent focus:border-[#3182F6] focus:bg-white transition-all"
                />
              </div>
              {inputError && (
                <p className="text-red-500 text-[12px] font-medium flex items-center gap-1"><AlertIcon /> {inputError}</p>
              )}
              <button onClick={handleScan}
                className="w-full py-4 bg-[#3182F6] text-white font-bold rounded-2xl text-[15px] shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] hover:bg-[#2272E6]">
                무료로 유출 여부 확인하기
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
                className="text-[13px] font-semibold text-[#3182F6] py-1 text-center">
                어떻게 진행되는지 보기
              </button>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="text-[#3182F6]"><ShieldIcon /></span>
                <p className="text-[11px] text-gray-400">입력 정보는 유출 확인 목적에만 사용됩니다</p>
              </div>
            </div>

            {/* 소셜 프루프 */}
            <div className="fade-up-3 space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="flex -space-x-2">
                  {['😊','🧑','👩','🧔','👨'].map((e, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm border-2 border-white">{e}</div>
                  ))}
                </div>
                <p className="text-[12px] text-gray-500"><span className="font-bold text-[#191F28]">12,847명</span>이 이미 조회했어요 <span className="text-[9px] text-gray-400">(베타 포함)</span></p>
              </div>

              {/* 리뷰 3개 */}
              <div className="space-y-3">
                {[
                  { emoji: "👨‍💻", name: "김**", loc: "서울 · 이용자", text: "중고거래 게시물에서 전화번호가 노출되어 있었는데, 삭제 요청을 진행해줘서 편했습니다." },
                  { emoji: "👩‍💼", name: "이**", loc: "부산 · 이용자", text: "해외 사이트에서 이메일이 유출된 걸 확인하고 요청을 맡겼어요. 진행 상태도 안내받을 수 있어서 좋았습니다." },
                  { emoji: "🧑‍🎓", name: "박**", loc: "대전 · 이용자", text: "어디서 내 정보가 노출됐는지 한눈에 확인할 수 있어서 유용했어요. 가능한 조치도 안내받았습니다." },
                ].map((r, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">{r.emoji}</div>
                      <div>
                        <p className="text-[12px] font-bold">{r.name}</p>
                        <p className="text-[10px] text-gray-400">{r.loc}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-[10px]">★</span>)}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#4E5968] leading-relaxed">"{r.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 신뢰 배지 2x2 */}
            <div className="fade-up-4 grid grid-cols-2 gap-3">
              {[
                { value: "글로벌", label: "유출 데이터베이스 기반 조회", icon: "🔍" },
                { value: "스팸↓", label: "삭제 후 스팸 전화 감소 효과", icon: "📉" },
                { value: "주기적", label: "유출 여부 점검 안내", icon: "🛡️" },
                { value: "4.9 ★", label: "베타 테스터 만족도 (N=23)", icon: "⭐" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-[18px] font-black text-[#191F28] mt-1.5">{item.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* 작동 방식 3단계 */}
            <div id="how-it-works" className="fade-up-5 space-y-3">
              <h3 className="font-bold text-[16px] px-1">지움은 이렇게 진행됩니다</h3>
              {[
                { icon: "🔍", title: "노출 여부 확인", desc: "입력한 정보로 공개 노출 가능성이 있는 사이트를 확인합니다" },
                { icon: "📋", title: "가능한 요청 진행", desc: "발견된 항목에 대해 삭제, 비공개 등 가능한 조치를 진행합니다" },
                { icon: "📊", title: "진행 상태 안내", desc: "요청 전송, 처리 중, 반영 확인 여부를 단계별로 안내합니다" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="font-bold text-[14px]">{s.title}</p>
                    <p className="text-[12px] text-[#6B7684] mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 진행 상태 예시 */}
            <div className="fade-up-5 space-y-3">
              <h3 className="font-bold text-[16px] px-1">진행 상황을 한눈에 확인하세요</h3>
              <div className="space-y-2">
                {[
                  { icon: "✅", title: "노출 항목 발견", desc: "네이버 카페 게시물", status: "완료", color: "#2563EB" },
                  { icon: "✅", title: "요청 전송 완료", desc: "해당 사이트에 삭제 요청 발송", status: "완료", color: "#2563EB" },
                  { icon: "🔄", title: "처리 중", desc: "사이트 측 검토 진행 중", status: "진행중", color: "#3182F6" },
                  { icon: "⏳", title: "반영 확인", desc: "삭제 또는 비공개 처리 확인 예정", status: "대기중", color: "#868e96" },
                  { icon: "📋", title: "추가 확인 필요", desc: "일부 항목 추가 조치 검토", status: "대기중", color: "#868e96" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <div>
                        <p className="text-[13px] font-medium">{item.title}</p>
                        <p className="text-[11px] text-[#868e96]">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ [FIX 7] FAQ 추가 */}
            <div className="fade-up-5 space-y-3">
              <h3 className="font-bold text-[16px] px-1">자주 묻는 질문</h3>
              {faqData.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <span className="text-[13px] font-bold">{faq.q}</span>
                    <ChevronIcon open={openFaq === i} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-[12px] text-[#6B7684] leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 2: 스캔 중
        ════════════════════════════════ */}
        {step === 'scan' && (
          <div className="h-[600px] flex flex-col items-center justify-center px-8 text-center">
            <div className="relative w-28 h-28 mb-10">
              <div className="absolute inset-0 border-[3px] border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-[3px] border-[#3182F6] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
              {scanPhase >= 2 && (
                <div className="absolute inset-[-8px] border-2 border-[#3182F6]/30 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-[#3182F6]">{progress}%</span>
              </div>
              <div className="absolute inset-0 border-2 border-[#3182F6] rounded-full" style={{ animation: 'pulseRing 2s infinite' }}></div>
            </div>
            <div className="space-y-3 mb-10">
              <p className="text-[17px] font-bold text-[#191F28] leading-snug min-h-[52px] transition-all">{loadingText}</p>
              <p className="text-[11px] text-gray-400 font-mono tracking-wider">{email || phone} 기준 조회</p>
            </div>
            <div className="w-full max-w-[280px] space-y-2.5">
              {[
                { label: "공공데이터 대조", phase: 1 },
                { label: "글로벌 유출 DB 조사", phase: 2 },
                { label: "유출 DB 정밀 분석", phase: 3 },
                { label: "리포트 생성", phase: 4 }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 transition-all duration-300" style={{ opacity: scanPhase >= item.phase ? 1 : 0.3 }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    scanPhase > item.phase ? 'bg-[#3182F6] text-white' : scanPhase === item.phase ? 'bg-blue-100 text-[#3182F6]' : 'bg-gray-100'
                  }`}>
                    {scanPhase > item.phase ? <CheckIcon /> : <span className="w-1.5 h-1.5 bg-current rounded-full"></span>}
                  </div>
                  <span className="text-[12px] font-medium text-left">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 3: 리포트
        ════════════════════════════════ */}
        {step === 'report' && (
          <div className="px-6 pt-6 pb-40 space-y-5">
            {/* 피해 요약 — ✅ [FIX 5] 반올림 금액 */}
            <div className="scale-in bg-[#191F28] rounded-[32px] p-8 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-red-400">위험 감지</span>
                </div>
                <p className="text-gray-400 text-[12px] font-medium mb-2">잠재적 피해 추정액</p>
                {showPrice ? (
                  <h2 className="font-black tracking-tighter mb-1">
                    <span className="text-[24px] align-middle mr-1">약 </span>
                    <span
                      className="counter-animate text-[48px] align-middle"
                      style={{ '--dmg': damageAmount }}
                    ></span>
                    <span className="text-[24px] align-middle ml-1">만원</span>
                  </h2>
                ) : <div className="h-[60px]"></div>}
                <p className="text-[9px] text-gray-600 mb-3">유출 사이트당 평균 위자료 판례 + 2차 피해 추정 기준 · 실제 피해와 다를 수 있습니다</p>
                <div className="flex justify-center gap-6 mt-2 mb-2">
                  <div className="text-center">
                    <p className="text-[24px] font-black text-red-400">{leakCount}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">유출 사이트</p>
                  </div>
                  <div className="w-[1px] bg-white/10"></div>
                  <div className="text-center">
                    <p className="text-[24px] font-black text-orange-400">{getLeakItems().length}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">노출 항목</p>
                  </div>
                  <div className="w-[1px] bg-white/10"></div>
                  <div className="text-center">
                    <p className="text-[24px] font-black text-yellow-400">
                      {breachData && breachData.summary && typeof breachData.summary.critical === 'number'
                        ? breachData.summary.critical
                        : 0}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">긴급 처리 필요</p>
                  </div>
                </div>
                {/* ✅ [FIX 8] 공유 버튼 */}
                <button onClick={() => {
                  const pwdCount = breachData ? breachData.breaches.filter(b => (b.dataClasses || []).some(dc => dc.toLowerCase().includes('password'))).length : 0;
                  const shareText = '😱 방금 내 개인정보 유출 점검했더니...\n\n' + leakCount + '곳에서 유출됨\n비밀번호 ' + pwdCount + '곳 노출\n\n무료 30초 확인 👇\n' + (typeof window !== 'undefined' ? window.location.origin : '');
                  if (navigator.share) {
                    navigator.share({ title: '지움 - 개인정보 유출 리포트', text: shareText, url: typeof window !== 'undefined' ? window.location.origin : '' });
                  } else {
                    navigator.clipboard?.writeText(shareText);
                    alert('링크가 복사되었습니다!');
                  }
                }} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-full text-[11px] text-gray-300 hover:bg-white/20 transition-all">
                  <ShareIcon /> 결과 공유하기
                </button>
              </div>
            </div>

            {/* 유출 항목 + 실제 유출 사이트 */}
            <div className="fade-up-1 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-[14px]">유출 항목</h4>
                <span className="text-[10px] text-gray-400">{todayStr ? `조회일: ${todayStr}` : ''}</span>
              </div>
              {getLeakItems().map((item, i) => (
                <div key={i} className="bg-gray-50 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[13px] font-medium flex-1">{item.label}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      item.severity === 'critical' ? 'bg-red-50 text-red-500' :
                      item.severity === 'high' ? 'bg-orange-50 text-orange-500' : 'bg-yellow-50 text-yellow-600'
                    }`}>{item.status}</span>
                  </div>
                  {item.sites && item.sites.length > 0 && (
                    <div className="mt-1.5 text-[12px] text-[#ADB5BD]">
                      {item.sites.slice(0, 3).join(', ')}
                      {item.sites.length > 3 ? ` 외 ${item.sites.length - 3}곳` : ''}
                    </div>
                  )}
                </div>
              ))}

              {breachData && breachData.breaches && breachData.breaches.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>유출된 사이트</div>
                  {breachData.breaches.slice(0, 10).map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: i < Math.min(breachData.breaches.length, 10) - 1 ? '1px solid #f1f3f5' : 'none'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title || b.name}</div>
                        <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>
                          {b.breachDate} · {(b.pwnCount || 0).toLocaleString()}건 유출
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: b.severity === 'critical' ? '#fff0f0' : '#fff8e1',
                          color: b.severity === 'critical' ? '#e03131' : '#e67700'
                        }}
                      >
                        {b.severity === 'critical' ? '긴급' : '주의'}
                      </span>
                    </div>
                  ))}
                  {breachData.breaches.length > 10 && (
                    <div style={{ textAlign: 'center', color: '#868e96', fontSize: 13, marginTop: 12 }}>
                      외 {breachData.breaches.length - 10}개 사이트
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 섹션 A: 지금 바로 해야 할 일 */}
            {breachData && breachData.breaches && breachData.breaches.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🚨</span>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>지금 바로 해야 할 일</span>
                </div>
                <p style={{ fontSize: 13, color: '#868e96', marginBottom: 20 }}>체크할 때마다 안전점수가 올라갑니다</p>

                {breachData.breaches.filter(b => b.severity === 'critical').slice(0, 5).map((b, i) => {
                  const key = 'pwd_' + b.name;
                  const urlEntry = b.name in passwordChangeUrls ? passwordChangeUrls[b.name] : b.title in passwordChangeUrls ? passwordChangeUrls[b.title] : undefined;
                  const isCollection = urlEntry === null;
                  const url = isCollection ? null : (urlEntry !== undefined ? urlEntry : 'https://www.google.com/search?q=' + encodeURIComponent((b.title || b.name) + ' 비밀번호 변경'));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #f1f3f5' }}>
                      <input
                        type="checkbox"
                        checked={!!checkedActions[key]}
                        onChange={() => {
                          const next = { ...checkedActions, [key]: !checkedActions[key] };
                          setCheckedActions(next);
                          const count = Object.values(next).filter(Boolean).length;
                          const total = breachData?.totalBreaches || 0;
                          const critical = breachData?.summary?.critical || 0;
                          const base = Math.max(5, 50 - (total * 3) - (critical * 5));
                          const maxGain = 100 - base;
                          const totalChecks =
                            (breachData?.breaches?.filter(b => b.severity === 'critical').slice(0, 5).length || 0) +
                            (breachData?.breaches?.filter(b => b.severity !== 'critical').slice(0, 3).length || 0) +
                            1;
                          const perCheck = Math.floor(maxGain / Math.max(totalChecks, 1));
                          const allChecked = Object.values(next).filter(Boolean).length === totalChecks;
                          setSafetyScoreCalc(allChecked ? 100 : Math.min(base + (count * perCheck), 99));
                        }}
                        style={{ width: 22, height: 22, marginTop: 2, accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: checkedActions[key] ? 'line-through' : 'none',
                            color: checkedActions[key] ? '#adb5bd' : '#191F28'
                          }}
                        >
                          {(b.title || b.name) + ' 비밀번호 변경하기'}
                        </div>
                        <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>
                          {(b.dataClasses || []).some(dc => dc.toLowerCase().includes('password')) ? '비밀번호 유출됨 · ' : ''}{b.breachDate} 해킹
                        </div>
                        {isCollection ? (
                          <p style={{ fontSize: 12, color: '#868e96', marginTop: 4 }}>여러 사이트의 유출 데이터 모음입니다. 주요 서비스의 비밀번호를 모두 변경하세요.</p>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
                          >
                            비밀번호 변경 →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {breachData.breaches.filter(b => b.severity !== 'critical').slice(0, 3).map((b, i) => {
                  const key = 'leave_' + b.name;
                  return (
                    <div
                      key={'l' + i}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid #f1f3f5' }}
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedActions[key]}
                        onChange={() => {
                          const next = { ...checkedActions, [key]: !checkedActions[key] };
                          setCheckedActions(next);
                          const count = Object.values(next).filter(Boolean).length;
                          const total = breachData?.totalBreaches || 0;
                          const critical = breachData?.summary?.critical || 0;
                          const base = Math.max(5, 50 - (total * 3) - (critical * 5));
                          const maxGain = 100 - base;
                          const totalChecks =
                            (breachData?.breaches?.filter(b => b.severity === 'critical').slice(0, 5).length || 0) +
                            (breachData?.breaches?.filter(b => b.severity !== 'critical').slice(0, 3).length || 0) +
                            1;
                          const perCheck = Math.floor(maxGain / Math.max(totalChecks, 1));
                          const allChecked = Object.values(next).filter(Boolean).length === totalChecks;
                          setSafetyScoreCalc(allChecked ? 100 : Math.min(base + (count * perCheck), 99));
                        }}
                        style={{ width: 22, height: 22, marginTop: 2, accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: checkedActions[key] ? 'line-through' : 'none',
                            color: checkedActions[key] ? '#adb5bd' : '#191F28'
                          }}
                        >
                          {(b.title || b.name) + ' 회원탈퇴 또는 비밀번호 변경'}
                        </div>
                        <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>더 이상 안 쓰는 서비스라면 탈퇴 권장</div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
                  <input
                    type="checkbox"
                    checked={!!checkedActions['2fa']}
                    onChange={() => {
                      const next = { ...checkedActions, '2fa': !checkedActions['2fa'] };
                      setCheckedActions(next);
                      const count = Object.values(next).filter(Boolean).length;
                      const total = breachData?.totalBreaches || 0;
                      const critical = breachData?.summary?.critical || 0;
                      const base = Math.max(5, 50 - (total * 3) - (critical * 5));
                      const maxGain = 100 - base;
                      const totalChecks =
                        (breachData?.breaches?.filter(b => b.severity === 'critical').slice(0, 5).length || 0) +
                        (breachData?.breaches?.filter(b => b.severity !== 'critical').slice(0, 3).length || 0) +
                        1;
                      const perCheck = Math.floor(maxGain / Math.max(totalChecks, 1));
                      const allChecked = Object.values(next).filter(Boolean).length === totalChecks;
                      setSafetyScoreCalc(allChecked ? 100 : Math.min(base + (count * perCheck), 99));
                    }}
                    style={{ width: 22, height: 22, accentColor: '#2563EB', cursor: 'pointer' }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: checkedActions['2fa'] ? 'line-through' : 'none',
                        color: checkedActions['2fa'] ? '#adb5bd' : '#191F28'
                      }}
                    >
                      2단계 인증(2FA) 활성화하기
                    </div>
                    <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>비밀번호 유출되어도 계정을 지킬 수 있어요</div>
                  </div>
                </div>
              </div>
            )}

            {/* 섹션 B: 안전점수 */}
            {breachData && breachData.breaches && breachData.breaches.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #191F28, #2d3748)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  marginBottom: 16,
                  color: '#fff'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#adb5bd', marginBottom: 8 }}>내 개인정보 안전점수</div>
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 900,
                      color: safetyScoreCalc >= 70 ? '#51cf66' : safetyScoreCalc >= 40 ? '#fcc419' : '#ff6b6b'
                    }}
                  >
                    {safetyScoreCalc}
                  </div>
                  <div style={{ fontSize: 14, color: '#adb5bd' }}>/100</div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 100,
                    height: 12,
                    overflow: 'hidden',
                    marginBottom: 12
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 100,
                      background: safetyScoreCalc >= 70 ? '#51cf66' : safetyScoreCalc >= 40 ? '#fcc419' : '#ff6b6b',
                      width: safetyScoreCalc + '%',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#adb5bd' }}>
                  {safetyScoreCalc < 30
                    ? '⚠️ 위험 — 위의 조치를 지금 시작하세요'
                    : safetyScoreCalc < 70
                      ? '🟡 보통 — 조금만 더 하면 안전해져요'
                      : '✅ 양호 — 잘 하고 있어요!'}
                </div>
              </div>
            )}

            {/* 섹션 C: 삭제요청 보내기 */}
            {breachData && breachData.breaches && breachData.breaches.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>삭제요청 보내기</span>
                </div>
                <p style={{ fontSize: 13, color: '#868e96', marginBottom: 20 }}>개인정보보호법 제36조에 따라 삭제를 요청할 수 있어요</p>

                {breachData.breaches.slice(0, 5).map((b, i) => {
                  const dpoEmail = dpEmails[b.name] || dpEmails[b.title];
                  const templateText =
                    `안녕하세요,\n\n개인정보보호법 제36조에 근거하여, 귀 서비스에 등록된 본인의 개인정보 삭제를 요청합니다.\n\n` +
                    `- 이메일: ${email}\n` +
                    `- 요청사항: 계정 및 관련 개인정보 전체 삭제\n` +
                    `- 법적근거: 개인정보보호법 제36조 (개인정보의 정정·삭제)\n` +
                    `- 처리기한: 요청일로부터 10일 이내\n\n감사합니다.`;
                  return dpoEmail ? (
                    <div key={i} style={{ padding: '14px 0', borderBottom: i < 4 ? '1px solid #f1f3f5' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title || b.name}</div>
                          <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>{dpoEmail}</div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(templateText);
                            alert('삭제요청 템플릿이 복사되었습니다!\n\n' + dpoEmail + ' 으로 보내세요.');
                          }}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#2563EB',
                            background: '#eff6ff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 14px',
                            cursor: 'pointer'
                          }}
                        >
                          템플릿 복사
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}

                <div
                  style={{
                    background: '#f8f9fa',
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 16,
                    fontSize: 13,
                    color: '#495057',
                    lineHeight: 1.6
                  }}
                >
                  💡 복사한 템플릿을 해당 이메일로 보내면, 법적으로 10일 이내 처리해야 합니다. 미처리 시 개인정보보호위원회에 신고할 수 있어요.
                </div>
              </div>
            )}

            {/* 섹션 D: 추천 보안 도구 + 공유 + 알림 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>추가 보안 조치</span>
              </div>

              <a
                href="https://bitwarden.com/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: '1px solid #f1f3f5',
                  textDecoration: 'none',
                  color: '#191F28'
                }}
              >
                <span style={{ fontSize: 28 }}>🔐</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>비밀번호 관리자 시작하기</div>
                  <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>무료 오픈소스 · 한국어 지원 · 크롬/앱 모두 가능</div>
                </div>
                <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>무료 →</span>
              </a>

              <div
                onClick={() => setShow2faGuide(!show2faGuide)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: '1px solid #f1f3f5',
                  textDecoration: 'none',
                  color: '#191F28',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 28 }}>📱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>2단계 인증 설정 가이드</div>
                  <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>비밀번호가 유출되어도 계정을 보호</div>
                  {show2faGuide && (
                    <div style={{ fontSize: 12, color: '#495057', marginTop: 6, whiteSpace: 'pre-line' }}>
                      {'Gmail: 구글 계정 → 보안 → 2단계 인증\n네이버: 네이버 → 내정보 → 보안설정 → 2단계 인증\n카카오: 카카오계정 → 보안 → 2단계 인증'}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>{show2faGuide ? '닫기 ∧' : '보기 ∨'}</span>
              </div>

              <a
                href="https://www.eprivacy.go.kr/main.do"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 0',
                  textDecoration: 'none',
                  color: '#191F28'
                }}
              >
                <span style={{ fontSize: 28 }}>🧹</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>안 쓰는 사이트 일괄 탈퇴</div>
                  <div style={{ fontSize: 12, color: '#868e96', marginTop: 2 }}>e프라이버시 클린서비스 (정부 운영 · 무료)</div>
                </div>
                <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>바로가기 →</span>
              </a>
            </div>

            {/* 지움이 대신 해드리는 일 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>지움이 대신 해드리는 일</span>
              </div>
              {[
                { icon: "📋", title: "삭제·비공개 요청 진행", desc: "발견된 항목에 대해 가능한 삭제 또는 비공개 요청을 진행합니다" },
                { icon: "🔍", title: "주기적 유출 점검 안내", desc: "새로운 유출 여부를 주기적으로 확인하고 안내합니다" },
                { icon: "📊", title: "진행 상태 리포트 제공", desc: "요청별 진행 상태를 정리하여 안내합니다" },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < 2 ? '1px solid #f1f3f5' : 'none' }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#868e96', marginTop: 3 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 공유 카드 */}
            <div
              style={{
                background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                borderRadius: 16,
                padding: '28px 24px',
                marginBottom: 16,
                color: '#fff',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 8 }}>내 유출 결과를 공유하고</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>주변 사람들도 확인시키세요</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>이미 {preregCount.toLocaleString()}명이 확인했어요</div>

              {breachData && breachData.breaches && breachData.breaches.length > 0 && (
                <div
                  style={{
                    background: '#f1f3f5',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    textAlign: 'left',
                    fontSize: 13,
                    color: '#495057'
                  }}
                >
                  {(() => {
                    const pwdCount = breachData.breaches.filter(b => (b.dataClasses || []).some(dc => dc.toLowerCase().includes('password'))).length;
                    return `내 개인정보가 ${leakCount}곳에서 유출! 비밀번호 ${pwdCount}곳 노출. 당신은 안전한가요?`;
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    const pwdCount = breachData ? breachData.breaches.filter(b => (b.dataClasses || []).some(dc => dc.toLowerCase().includes('password'))).length : 0;
                    const text = '😱 방금 내 개인정보 유출 점검했더니...\n\n' + leakCount + '곳에서 유출됨\n비밀번호 ' + pwdCount + '곳 노출\n\n무료 30초 확인 👇\n' + (typeof window !== 'undefined' ? window.location.origin : '');
                    if (navigator.share) {
                      navigator.share({ title: '지움 - 개인정보 유출 점검', text: text });
                    } else {
                      navigator.clipboard.writeText(text);
                      alert('공유 텍스트가 복사되었습니다!');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📤 공유하기
                </button>
                <button
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.origin : 'https://zium-eight.vercel.app';
                    navigator.clipboard.writeText(url);
                    alert('링크가 복사되었습니다!');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#fff',
                    color: '#2563EB',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔗 링크 복사
                </button>
              </div>
            </div>

            {/* 알림 등록 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', marginBottom: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>🔔</span>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>새 유출 발생 시 알림 받기</div>
                <div style={{ fontSize: 13, color: '#868e96', marginTop: 4 }}>새로운 해킹 사고에 내 정보가 포함되면 바로 알려드려요</div>
              </div>
              {!preregDone ? (
                <div>
                  <input
                    type="email"
                    placeholder="알림 받을 이메일 입력"
                    value={preregEmail}
                    onChange={(e) => setPreregEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1.5px solid #dee2e6',
                      borderRadius: 10,
                      fontSize: 15,
                      marginBottom: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={handlePreregister}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: '#191F28',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    무료 알림 등록하기
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 700, color: '#2563EB' }}>등록 완료!</div>
                  <div style={{ fontSize: 13, color: '#868e96', marginTop: 4 }}>{preregEmail}로 알림을 보내드릴게요</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 3.2: 무료 삭제요청 템플릿 (deleteKit) — OpenAI 체리픽
        ════════════════════════════════ */}
        {step === 'deleteKit' && (
          <div className="px-6 pt-6 pb-10 space-y-5">
            <div className="fade-up space-y-2">
              <h2 className="text-[22px] font-black tracking-tight">무료 삭제요청 템플릿</h2>
              <p className="text-[13px] text-[#6B7684]">
                가장 흔한 <span className="font-bold">1가지 케이스</span>에 대해 삭제요청 문구를 제공합니다.
                <br /><span className="text-[11px] text-gray-400">※ 실제 처리 여부/기간은 사이트 정책에 따라 다를 수 있어요.</span>
              </p>
            </div>

            <div className="fade-up-1 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[14px]">대상</p>
                <span className="text-[10px] text-gray-400">무료 · 1건</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[12px] font-bold text-[#191F28]">게시글/프로필 페이지 노출 삭제 요청</p>
                <p className="text-[11px] text-gray-500 mt-1">내 연락처/이메일이 포함된 게시글·댓글·소개글 등에 사용하세요.</p>
              </div>
            </div>

            <div className="fade-up-2 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <p className="font-bold text-[14px]">삭제요청 메시지 (복사해서 발송)</p>
              <div className="bg-gray-50 rounded-2xl p-4 text-[11px] text-[#4E5968] leading-relaxed whitespace-pre-wrap">{`안녕하세요. (담당자/운영자)님,

저는 귀 사이트/페이지에 게시된 내용 중 제 개인정보가 포함된 부분에 대해 삭제를 요청드립니다.

- 요청 내용: 개인정보가 포함된 게시물/페이지 삭제 또는 비공개 처리
- 노출된 개인정보: ${email ? `이메일(${email})` : ''}${email && phone ? ', ' : ''}${phone ? `전화번호(${phone})` : ''}${!email && !phone ? '연락처/식별정보' : ''}
- 해당 URL: (여기에 노출된 페이지 주소를 붙여넣어 주세요)
- 요청 사유: 정보주체의 개인정보 보호를 위한 삭제 요청 (개인정보보호법 제36조)

가능한 빠른 시일 내 조치 및 결과 회신을 부탁드립니다.
감사합니다.

(이름): __________
(연락처): __________
(회신 이메일): __________
(요청일): ${todayStr || ''}`}</div>

              <div className="flex gap-2">
                <button onClick={() => {
                  const template = `안녕하세요. (담당자/운영자)님,\n\n저는 귀 사이트/페이지에 게시된 내용 중 제 개인정보가 포함된 부분에 대해 삭제를 요청드립니다.\n\n- 요청 내용: 개인정보가 포함된 게시물/페이지 삭제 또는 비공개 처리\n- 노출된 개인정보: ${email ? `이메일(${email})` : ''}${email && phone ? ', ' : ''}${phone ? `전화번호(${phone})` : ''}${!email && !phone ? '연락처/식별정보' : ''}\n- 해당 URL: (여기에 노출된 페이지 주소를 붙여넣어 주세요)\n- 요청 사유: 정보주체의 개인정보 보호를 위한 삭제 요청 (개인정보보호법 제36조)\n\n가능한 빠른 시일 내 조치 및 결과 회신을 부탁드립니다.\n감사합니다.\n\n(이름): __________\n(연락처): __________\n(회신 이메일): __________\n(요청일): ${todayStr || ''}`;
                  navigator.clipboard?.writeText(template);
                  trackEvent('deletekit_copy');
                  alert('요청 템플릿이 복사되었습니다!');
                }} className="flex-1 py-3 bg-[#3182F6] text-white font-bold rounded-2xl text-[13px]">
                  템플릿 복사
                </button>
                <button onClick={() => { trackEvent('deletekit_to_pricing'); navigateTo('pricing'); }}
                  className="flex-1 py-3 bg-white text-[#3182F6] font-bold rounded-2xl text-[13px] border border-blue-100">
                  모니터링/대행 맡기기
                </button>
              </div>

              <p className="text-[10px] text-gray-400">
                💡 URL과 스크린샷(노출 부분 표시)을 함께 보내면 처리 확률이 올라가요.
              </p>
            </div>

            <div className="fade-up-3 bg-[#F0F6FF] rounded-[24px] p-5 space-y-2">
              <p className="text-[12px] font-bold text-[#3182F6]">더 많은 사이트에 대응하려면?</p>
              <p className="text-[11px] text-[#6B7684] leading-relaxed">
                사전 등록하시면 정식 출시 시 자동 모니터링 + 삭제 대행 기능을 첫 달 무료로 이용할 수 있습니다.
              </p>
              <button onClick={() => navigateTo('pricing')}
                className="w-full py-3 bg-[#3182F6] text-white font-bold rounded-2xl text-[13px] mt-2">
                사전등록하고 첫 달 무료 받기
              </button>
            </div>

            <button onClick={() => navigateTo('report')}
              className="w-full py-4 bg-[#191F28] text-white font-bold rounded-2xl text-[14px]">
              리포트로 돌아가기
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 3.4: 유출 없음(noLeak)
        ════════════════════════════════ */}
        {step === 'noLeak' && (
          <main style={{ maxWidth: 480, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>유출 내역이 없습니다!</h2>
            <p style={{ color: '#868e96', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
              {email || phone}에 대한 알려진 유출 기록이 발견되지 않았습니다.<br />하지만 새로운 유출은 언제든 발생할 수 있어요.
            </p>
            <button
              onClick={() => navigateTo('landing')}
              style={{
                width: '100%',
                padding: '16px',
                background: '#191F28',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              다른 이메일로 조회하기
            </button>
          </main>
        )}

        {/* ════════════════════════════════
            STEP 3.5: 결제
        ════════════════════════════════ */}
        {step === 'pricing' && (
          <div className="px-6 pt-6 pb-10 space-y-5">
            <div className="fade-up text-center space-y-2 pt-2">
              <h2 className="text-[24px] font-black tracking-tight">
                <span className="text-red-500">{leakCount}곳</span>에서 내 정보가<br />유출되고 있어요
              </h2>
              <p className="text-[13px] text-[#6B7684]">지금 사전 등록하고, 출시 즉시 삭제를 시작하세요</p>
            </div>

            {/* ✅ [FIX 6] 공포 강화 섹션 (가격 전) */}
            <div className="fade-up-1 bg-red-50 rounded-[20px] p-4 space-y-2">
              <p className="text-[12px] font-bold text-red-600">🚨 유출된 정보를 방치하면?</p>
              <div className="space-y-1.5">
                {[
                  "원치 않는 스팸 전화·문자가 급증합니다",
                  "피싱 사기 및 사칭 메일의 타겟이 됩니다",
                  "비밀번호 도용으로 계정 탈취 위험이 높아집니다",
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></span>
                    <p className="text-[11px] text-red-800">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 연간 */}
            <div className={`fade-up-2 relative rounded-[24px] p-5 border-2 shadow-sm cursor-pointer transition-all ${
              selectedPlan === 'annual' ? 'border-[#3182F6] bg-[#F0F6FF] shadow-blue-100' : 'border-gray-100 bg-white'
            }`} onClick={() => setSelectedPlan('annual')}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="px-3 py-1 bg-[#3182F6] rounded-full flex items-center gap-1">
                  <StarIcon /><span className="text-white text-[10px] font-bold">가장 인기</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPlan === 'annual' ? 'border-[#3182F6] bg-[#3182F6]' : 'border-gray-300'
                }`}>{selectedPlan === 'annual' && <CheckIcon />}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px]">연간 구독</span>
                    <span className="text-[10px] font-bold text-[#3182F6] bg-blue-100 px-2 py-0.5 rounded-full">36% 할인</span>
                  </div>
                  <p className="text-[11px] text-[#6B7684] mt-0.5">1년 동안 내 개인정보를 지켜드립니다</p>
                </div>
              </div>
              <div className="mt-3 pl-8">
                <div className="flex items-end gap-1">
                  <span className="text-[28px] font-black text-[#191F28]">월 2,492</span>
                  <span className="text-[14px] font-bold text-[#6B7684] pb-1">원</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">연 29,900원 일시 결제</p>
              </div>
              <div className="mt-3 pl-8 flex flex-wrap gap-2">
                {['삭제 증명서 무제한', '가족 1명 추가 무료', '우선 처리'].map((b, i) => (
                  <span key={i} className="text-[10px] font-medium text-[#3182F6] bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100">{b}</span>
                ))}
              </div>
            </div>

            {/* 월간 */}
            <div className={`fade-up-3 rounded-[24px] p-5 border-2 cursor-pointer transition-all ${
              selectedPlan === 'monthly' ? 'border-[#3182F6] bg-[#F0F6FF] shadow-sm shadow-blue-100' : 'border-gray-100 bg-white'
            }`} onClick={() => setSelectedPlan('monthly')}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPlan === 'monthly' ? 'border-[#3182F6] bg-[#3182F6]' : 'border-gray-300'
                }`}>{selectedPlan === 'monthly' && <CheckIcon />}</div>
                <div className="flex-1">
                  <span className="font-bold text-[15px]">월간 구독</span>
                  <p className="text-[11px] text-[#6B7684] mt-0.5">삭제 + 모니터링 + 신규 유출 자동 대응</p>
                </div>
              </div>
              <div className="mt-3 pl-8">
                <div className="flex items-end gap-1">
                  <span className="text-[28px] font-black text-[#191F28]">월 3,900</span>
                  <span className="text-[14px] font-bold text-[#6B7684] pb-1">원</span>
                </div>
              </div>
            </div>

            {/* 1회성 — ✅ [FIX 6] 경고 문구 강화 */}
            <div className={`fade-up-4 rounded-[24px] p-5 border-2 cursor-pointer transition-all ${
              selectedPlan === 'onetime' ? 'border-[#3182F6] bg-[#F0F6FF] shadow-sm shadow-blue-100' : 'border-gray-100 bg-white'
            }`} onClick={() => setSelectedPlan('onetime')}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPlan === 'onetime' ? 'border-[#3182F6] bg-[#3182F6]' : 'border-gray-300'
                }`}>{selectedPlan === 'onetime' && <CheckIcon />}</div>
                <div className="flex-1">
                  <span className="font-bold text-[15px]">1회 삭제</span>
                  <p className="text-[11px] text-[#6B7684] mt-0.5">현재 유출된 곳만 삭제 (모니터링 없음)</p>
                </div>
              </div>
              <div className="mt-3 pl-8">
                <div className="flex items-end gap-1">
                  <span className="text-[28px] font-black text-[#191F28]">19,900</span>
                  <span className="text-[14px] font-bold text-[#6B7684] pb-1">원</span>
                </div>
              </div>
              <div className="mt-2 pl-8">
                <p className="text-[11px] text-orange-500 font-medium flex items-center gap-1">
                  <AlertIcon /> 삭제 후에도 재유출 가능성 있음 (모니터링 미포함)
                </p>
              </div>
            </div>

            {/* 비교 테이블 */}
            <div className="fade-up-5 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-[13px] mb-3 text-center text-[#6B7684]">플랜 비교</h4>
              <div className="flex items-center text-[9px] text-gray-400 font-bold mb-2 pb-2 border-b border-gray-50">
                <span className="flex-1"></span>
                <span className="w-12 text-center">1회</span>
                <span className="w-12 text-center">월간</span>
                <span className="w-12 text-center text-[#3182F6]">연간</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { feature: "현재 유출 전체 삭제", onetime: true, monthly: true, annual: true },
                  { feature: "24시간 실시간 모니터링", onetime: false, monthly: true, annual: true },
                  { feature: "신규 유출 자동 삭제", onetime: false, monthly: true, annual: true },
                  { feature: "삭제 완료 증명서", onetime: "1회", monthly: "월 3회", annual: "무제한" },
                  { feature: "가족 추가 (1명)", onetime: false, monthly: false, annual: true },
                  { feature: "우선 처리", onetime: false, monthly: false, annual: true },
                ].map((row, i) => (
                  <div key={i} className="flex items-center text-[11px]">
                    <span className="flex-1 text-[#4E5968] font-medium">{row.feature}</span>
                    {['onetime','monthly','annual'].map((plan) => (
                      <span key={plan} className={`w-12 text-center ${plan === 'annual' ? 'font-bold text-[#3182F6]' : ''}`}>
                        {row[plan] === true ? '✓' : row[plan] === false ? <span className="text-gray-300">—</span> : <span className="text-[10px]">{row[plan]}</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 사전등록 CTA */}
            <div className="fade-up-6 space-y-4 pt-2">
              {!preregDone ? (
                <div className="bg-white rounded-[24px] p-6 border-2 border-[#3182F6] shadow-lg shadow-blue-100/30 space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-[15px] font-black text-[#191F28]">🚀 곧 출시됩니다</p>
                    <p className="text-[12px] text-[#6B7684]">사전 등록하면 <span className="font-bold text-[#3182F6]">첫 달 무료</span> + 출시 알림을 드려요</p>
                  </div>
                  <input
                    type="email"
                    placeholder="알림 받을 이메일 입력"
                    value={preregEmail}
                    onChange={(e) => setPreregEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F8F9FA] rounded-2xl text-[14px] font-medium border border-transparent focus:border-[#3182F6] focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handlePreregister()}
                  />
                  <button onClick={handlePreregister}
                    disabled={!preregEmail || !isValidEmail(preregEmail)}
                    className="w-full bg-[#3182F6] text-white font-bold rounded-2xl text-[15px] shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] hover:bg-[#2272E6] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ paddingTop: '18px', paddingBottom: '18px' }}>
                    출시 알림 받기 (무료)
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                    <span>🔒 스팸 없음</span>
                    <span>·</span>
                    <span>출시 알림 1회만 발송</span>
                    <span>·</span>
                    <span>언제든 취소 가능</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400">현재 <span className="font-bold text-[#191F28]">{preregCount}명</span>이 대기 중</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F0F6FF] rounded-[24px] p-6 text-center space-y-3">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <div>
                    <p className="text-[17px] font-black text-[#191F28]">등록 완료!</p>
                    <p className="text-[13px] text-[#6B7684] mt-1">출시되면 <span className="font-bold">{preregEmail}</span>로 알려드릴게요.</p>
                    <p className="text-[12px] text-[#3182F6] font-bold mt-2">🎁 사전 등록 특전: 첫 달 무료</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-[11px] text-gray-400">{preregCount}명이 함께 기다리고 있어요</p>
                  </div>
                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: '지움 - 내 개인정보 삭제 서비스', text: `내 개인정보가 ${leakCount}곳에서 유출되고 있었어! 무료로 확인해봐 →`, url: window.location.origin });
                    } else {
                      navigator.clipboard?.writeText(`내 개인정보가 유출되고 있을 수 있어요. 무료로 확인해보세요 → ${window.location.origin}`);
                      alert('링크가 복사되었습니다!');
                    }
                    trackEvent('share_after_prereg');
                  }} className="w-full py-3 bg-white text-[#3182F6] font-bold rounded-2xl text-[13px] border border-blue-100 flex items-center justify-center gap-2">
                    <ShareIcon /> 친구에게도 알려주기
                  </button>
                </div>
              )}

              {/* 가격 미리보기 */}
              <div className="bg-gray-50 rounded-[20px] p-4 space-y-2">
                <p className="text-[11px] font-bold text-[#6B7684] text-center">출시 예정 가격</p>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#4E5968]">연간 구독</span>
                  <span className="font-bold">월 2,492원 <span className="text-gray-400 text-[10px]">(연 29,900원)</span></span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#4E5968]">월간 구독</span>
                  <span className="font-bold">월 3,900원</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#4E5968]">1회 삭제</span>
                  <span className="font-bold">19,900원</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
                <span>언제든 해지 가능</span><span>·</span><span>삭제 안 되면 100% 환불</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-gray-400">
                  <button onClick={() => navigateTo('terms')} className="underline">이용약관</button> · <button onClick={() => navigateTo('privacy')} className="underline">개인정보처리방침</button>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 4: 대시보드
        ════════════════════════════════ */}
        {step === 'dashboard' && (
          <div className="px-6 pt-6 pb-10 space-y-5">
            {/* 안전 점수 */}
            <div className="fade-up bg-[#191F28] rounded-[32px] p-7 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3182F6]/10 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-400 text-[12px] font-medium">나의 개인정보 안전 점수</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-[52px] font-black leading-none">{safetyScore}</span>
                      <span className="text-gray-500 text-[16px] font-bold pb-2">/100</span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-orange-500/20 rounded-full">
                    <span className="text-[11px] font-bold text-orange-400">주의 필요</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: dashAnimated ? '38%' : '0%', background: 'linear-gradient(90deg, #EF4444, #F97316, #3182F6)' }}></div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">삭제가 완료되면 점수가 올라갑니다</p>
              </div>
            </div>

            {/* 활동 요약 */}
            <div className="fade-up-1 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-[14px] mb-4">이번 주 활동 요약</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <p className="text-[22px] font-black text-[#3182F6]">6</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">삭제 요청 발송</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 text-center">
                  <p className="text-[22px] font-black text-green-500">2</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">삭제 완료</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-3 text-center">
                  <p className="text-[22px] font-black text-red-500">12</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">접근 차단</p>
                </div>
              </div>
            </div>

            {/* 삭제 현황 */}
            <div className="fade-up-2 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-[14px]">삭제 진행 현황</h4>
                <span className="text-[#3182F6] text-[13px] font-bold">{leakCount}곳 중 2곳 완료</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#3182F6] rounded-full transition-all duration-1000" style={{ width: dashAnimated ? `${Math.round(2/leakCount*100)}%` : '0%' }}></div>
              </div>
            </div>

            {/* 알림 */}
            <div className="fade-up-3 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1"><BellIcon /><h4 className="font-bold text-[14px]">최근 알림</h4></div>
              {[
                { time: "2시간 전", msg: "국내 대형 커뮤니티 B에서 정보 삭제가 완료되었습니다.", type: "success" },
                { time: "6시간 전", msg: "새로운 데이터 브로커에서 당신의 이메일이 감지되었습니다.", type: "alert" },
                { time: "1일 전", msg: "구글 검색 결과에 대한 삭제 요청이 접수되었습니다.", type: "info" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50/50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                    item.type === 'success' ? 'bg-green-400' : item.type === 'alert' ? 'bg-red-400' : 'bg-blue-400'
                  }`}></div>
                  <div>
                    <p className="text-[12px] text-[#191F28] leading-relaxed">{item.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 공유 */}
            <div className="fade-up-4">
              <button className="w-full py-4 bg-[#F0F6FF] text-[#3182F6] font-bold rounded-2xl text-[13px] flex items-center justify-center gap-2 transition active:scale-[0.98]">
                친구에게 공유하고 1개월 무료 받기 <ArrowIcon />
              </button>
            </div>

            {/* 증명서 */}
            <div className="fade-up-5 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-lg">📄</div>
                  <div>
                    <p className="text-[13px] font-bold">삭제 완료 증명서</p>
                    <p className="text-[10px] text-gray-400">2곳 삭제 완료 건에 대한 증빙</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-gray-50 rounded-lg text-[11px] font-bold text-[#4E5968]">다운로드</button>
              </div>
            </div>

            {/* ✅ [FIX 8] 구독 관리/해지 메뉴 */}
            <div className="fade-up-6 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <h4 className="font-bold text-[14px]">계정 관리</h4>
              {[
                { label: "구독 플랜", value: "연간 구독 (2025.02 ~ 2026.02)", action: "변경" },
                { label: "결제 수단", value: "카카오페이", action: "변경" },
                { label: "구독 해지", value: "", action: "해지하기" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-[12px] font-medium text-[#4E5968]">{item.label}</p>
                    {item.value && <p className="text-[10px] text-gray-400 mt-0.5">{item.value}</p>}
                  </div>
                  <button className="text-[11px] font-bold text-[#3182F6]">{item.action}</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ════════════════════════════════
            개인정보처리방침
        ════════════════════════════════ */}
        {step === 'privacy' && (
          <div className="px-6 pt-6 pb-10 space-y-5">
            <h2 className="text-[20px] font-black">개인정보처리방침</h2>
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-4 text-[12px] text-[#4E5968] leading-relaxed">
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">1. 수집하는 개인정보 항목</p>
                <p>필수: 이메일 주소 또는 전화번호 (유출 여부 조회 목적)</p>
                <p>유료 구독 시 추가: 이름, 결제 정보 (삭제 위임 및 결제 처리 목적)</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">2. 수집·이용 목적</p>
                <p>개인정보 유출 여부 조회, 유출 사이트에 대한 법적 삭제 요청 대행, 삭제 결과 통지, 실시간 모니터링 및 알림, 서비스 개선을 위한 통계 분석</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">3. 보유 및 이용 기간</p>
                <p>무료 조회: 조회 완료 즉시 파기</p>
                <p>유료 구독: 구독 해지 후 30일 이내 파기 (단, 법령에 따른 보존 의무가 있는 경우 해당 기간까지 보존)</p>
                <p>전자상거래 거래 기록: 5년 (전자상거래법 제6조)</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">4. 제3자 제공</p>
                <p>원칙적으로 제3자에게 제공하지 않습니다. 다만 삭제 요청 대행을 위해 유출 사이트 운영자에게 최소한의 본인 확인 정보를 전달할 수 있으며, 이 경우 사전에 별도 동의를 받습니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">5. 처리 위탁</p>
                <p>결제 처리: 토스페이먼츠 주식회사</p>
                <p>클라우드 호스팅: Vercel Inc. (미국)</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">6. 정보주체의 권리</p>
                <p>개인정보 열람·정정·삭제·처리정지 요구권 (개인정보보호법 제35~37조). 아래 연락처로 요청하시면 10일 이내 처리합니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">7. 안전성 확보 조치</p>
                <p>개인정보 암호화(AES-256), SSL/TLS 통신 암호화, 접근 권한 관리 및 접근 기록 보관, 정기적 보안 점검</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">8. 개인정보 보호책임자</p>
                <p>이메일: privacy@zium.kr</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">9. 시행일</p>
                <p>본 방침은 2026년 2월 22일부터 시행됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            이용약관
        ════════════════════════════════ */}
        {step === 'terms' && (
          <div className="px-6 pt-6 pb-10 space-y-5">
            <h2 className="text-[20px] font-black">이용약관</h2>
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-4 text-[12px] text-[#4E5968] leading-relaxed">
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제1조 (목적)</p>
                <p>본 약관은 지움(이하 "회사")이 제공하는 개인정보 삭제 대행 서비스(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제2조 (서비스 내용)</p>
                <p>① 회사는 이용자의 위임에 따라 개인정보보호법 제36조에 근거한 개인정보 삭제 요청을 대행합니다.</p>
                <p>② 삭제 요청의 처리 여부는 해당 사이트 운영자의 대응에 따라 달라질 수 있으며, 회사는 최선의 노력을 다하되 삭제 완료를 보장하지 않습니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제3조 (이용 요금 및 결제)</p>
                <p>① 서비스 요금은 서비스 내 표시된 금액에 따릅니다.</p>
                <p>② 연간 구독은 결제일로부터 12개월간 유효하며, 별도 해지 요청이 없으면 자동 갱신됩니다.</p>
                <p>③ 월간 구독은 매월 결제일에 자동 결제됩니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제4조 (환불 정책)</p>
                <p>① 결제 후 7일 이내이며 삭제 요청이 미착수된 경우: 전액 환불</p>
                <p>② 삭제 요청이 부분 완료된 경우: 미처리 건에 대해 비례 환불</p>
                <p>③ 삭제 요청이 전체 완료된 경우: 환불 불가</p>
                <p>④ 30일 이내 삭제 처리가 착수되지 않은 경우: 전액 환불</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제5조 (해지)</p>
                <p>① 이용자는 언제든 서비스 내에서 1클릭으로 구독을 해지할 수 있습니다.</p>
                <p>② 해지 시 이미 삭제 완료된 건은 유지되며, 모니터링 서비스가 중단됩니다.</p>
                <p>③ 해지 후 잔여 기간에 대한 환불은 제4조에 따릅니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제6조 (면책)</p>
                <p>① 회사는 유출 사이트의 비협조, 기술적 장애 등 회사의 통제 범위를 벗어난 사유로 삭제가 지연되거나 불가능한 경우 책임을 지지 않습니다.</p>
                <p>② 무료 조회 결과는 외부 데이터베이스 기반 추정치이며, 실제 유출 현황과 다를 수 있습니다.</p>
                <p>③ 잠재적 피해 추정액은 과거 판례 및 통계를 기반으로 한 참고용 수치이며, 법적 효력이 없습니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">제7조 (분쟁 해결)</p>
                <p>본 약관에 관한 분쟁은 회사의 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</p>
              </div>
              <div>
                <p className="font-bold text-[13px] text-[#191F28] mb-1">부칙</p>
                <p>본 약관은 2026년 2월 22일부터 시행됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            유출 없음 결과
        ════════════════════════════════ */}
        {step === 'safe' && (
          <div className="px-6 pt-12 pb-10 text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-5xl">🎉</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-[24px] font-black tracking-tight">유출이 감지되지 않았습니다!</h2>
              <p className="text-[14px] text-[#6B7684] leading-relaxed">
                현재 주요 유출 데이터베이스에서<br />
                <span className="font-bold text-[#191F28]">{email || phone}</span>의<br />
                유출 기록이 발견되지 않았습니다.
              </p>
            </div>
            <div className="bg-green-50 rounded-[20px] p-5 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-green-500"><CheckIcon /></span>
                <p className="text-[13px] font-bold text-green-700">안전한 상태입니다</p>
              </div>
              <p className="text-[11px] text-green-600">다만 향후 유출이 발생할 수 있으므로, 주기적인 확인을 권장드립니다.</p>
            </div>
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
              <p className="text-[12px] font-bold text-[#191F28]">앞으로도 안전하게</p>
              {[
                "비밀번호를 사이트마다 다르게 설정하세요",
                "2단계 인증(2FA)을 활성화하세요",
                "의심스러운 메일의 링크를 클릭하지 마세요",
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#3182F6]"><CheckIcon /></span>
                  <p className="text-[11px] text-[#6B7684]">{tip}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigateTo('landing')}
              className="w-full py-4 bg-[#3182F6] text-white font-bold rounded-2xl text-[15px] shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98]">
              다른 정보도 확인하기
            </button>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '지움 - 개인정보 유출 조회', text: '내 개인정보 유출 여부를 무료로 확인해보세요!', url: window.location.origin });
              }
            }} className="w-full py-3 bg-white text-[#3182F6] font-bold rounded-2xl text-[13px] border border-gray-100 flex items-center justify-center gap-2">
              <ShareIcon /> 친구에게 알려주기
            </button>
          </div>
        )}

      </main>

      {/* ─── 푸터 ─── */}
      <footer className="max-w-[440px] mx-auto px-6 pb-8 pt-4 space-y-4">
        <div className="h-[1px] bg-gray-100"></div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
          <button onClick={() => navigateTo('privacy')} className="hover:text-gray-600 transition">개인정보처리방침</button>
          <span>·</span>
          <button onClick={() => navigateTo('terms')} className="hover:text-gray-600 transition">이용약관</button>
          <span>·</span>
          <a href="mailto:support@zium.kr" className="hover:text-gray-600 transition">문의하기</a>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] text-gray-300">고객 문의: support@zium.kr | 카카오톡: @지움</p>
          <p className="text-[10px] text-gray-300">© 2026 지움. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
