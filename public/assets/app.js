const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const api = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data;
};
const won = value => CURRENT_LANGUAGE === 'en' ? `KRW ${Number(value || 0).toLocaleString('en-US')}` : `${Number(value || 0).toLocaleString('ko-KR')}원`;
const date = value => new Intl.DateTimeFormat(CURRENT_LANGUAGE === 'en' ? 'en-US' : 'ko-KR', {
  month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const fullDate = value => new Intl.DateTimeFormat(CURRENT_LANGUAGE === 'en' ? 'en-US' : 'ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const qs = name => new URLSearchParams(location.search).get(name);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[char]);
const APP_VERSION = 'V3.2.1';
let me = null;
let meLoad = null;
const BANNER_CACHE_KEY = 'lp_banner_cache_bust';
const LANGUAGE_KEY = 'lp-language';
const CURRENT_LANGUAGE = localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ko';
const EN = {
  '요청을 처리하지 못했습니다.': 'We could not process your request.',
  'Live Pocket V3.0 — 작은 공연을 가까이': 'Live Pocket V3.0 — Intimate shows, closer to you', '공연 상세 — Live Pocket V3.0': 'Show details — Live Pocket V3.0', '예매 정보 확인 - Live Pocket V3.0': 'Booking verification — Live Pocket V3.0',
  '라이트 모드로 전환': 'Switch to light mode', '다크 모드로 전환': 'Switch to dark mode', '라이트 모드': 'Light mode', '다크 모드': 'Dark mode', '메뉴': 'Menu',
  '마이페이지': 'My page', '로그인': 'Log in', '로그아웃': 'Log out', '작은 무대의 큰 순간을 가장 가까이에서.': 'Get closer to the biggest moments on small stages.',
  '매진': 'Sold out', '예매 마감': 'Booking closed', '예매 전': 'Coming soon', '예매 중': 'Booking open', '마감 임박': 'Almost sold out',
  '노출 중인 배너가 없습니다.': 'There are no active banners.', '이전 배너': 'Previous banner', '다음 배너': 'Next banner', '조건에 맞는 공연이 없습니다.': 'No shows match your search.', '공연을 불러오는 중…': 'Loading shows…',
  '모두': 'All', '공연장': 'Venue', '아티스트': 'Artist', '호스트': 'Host', '공연명': 'Show title', '검색 범위': 'Search scope', '공연 검색': 'Search shows', '찾고 싶은 공연을 검색하세요': 'Search for a show', '검색': 'Search',
  '공연 정렬': 'Sort shows', '인기순': 'Popular', '날짜순': 'Date', '가격순': 'Price', '등록순': 'Recently added', '예매 가능': 'Available',
  '로그인 또는 간편가입': 'Log in or sign up', '현재 화면에서 계정 인증을 완료할 수 있습니다.': 'Continue without leaving this page.', '회원 인증': 'Member access', '간편가입': 'Quick sign-up', '이메일': 'Email', '비밀번호': 'Password', '닉네임': 'Nickname',
  '8자 이상, 영문과 숫자를 함께 입력해 주세요.': 'Use at least 8 characters with letters and numbers.', '비속어와 코드 형태의 문자열은 사용할 수 없습니다.': 'Profanity and code-like strings are not allowed.',
  '닫기': 'Close', '홈': 'Home', '공연 상세': 'Show details', '공연 정보를 불러오는 중…': 'Loading show details…', '캘린더에 추가': 'Add to calendar', '카카오맵에서 공연장 보기': 'View venue on Kakao Map', '카카오맵에서 보기': 'View on Kakao Map',
  '공연 일시': 'Date & time', '공연 장소': 'Venue', '티켓': 'Tickets', '찜하기': 'Add to favorites', '예매하기': 'Book now', '공연 소개': 'About the show', '예매 및 입장 안내': 'Booking & entry information',
  '결제는 무통장 입금으로 진행됩니다. 입금 확인 후 QR 티켓이 발급되며, 공연 당일 예매 상세 화면의 QR로 입장할 수 있습니다.': 'Payment is made by bank transfer. Your QR ticket is issued after payment is confirmed and can be used for entry from your booking details.',
  '추천 공연': 'You may also like', '추천할 공연을 준비 중입니다.': 'More recommendations are coming soon.', '예매하기 — Live Pocket V3.0': 'Book tickets — Live Pocket V3.0', '티켓과 예매자 정보를 확인해 주세요.': 'Review your tickets and booking details.', '불러오는 중…': 'Loading…',
  '로그인 또는 간편가입 후 예매를 계속할 수 있습니다.': 'Log in or sign up to continue booking.', '필수': 'Required', '선택해 주세요': 'Please select', '티켓 종류': 'Ticket type', '수량': 'Quantity', '예매자 이름': 'Booker name', '핸드폰번호': 'Mobile number', '추가 질문': 'Additional questions',
  '결제 방식': 'Payment method', '무통장 입금': 'Bank transfer', '신청 후 24시간 이내 입금': 'Pay within 24 hours of booking', '환불 규정': 'Refund policy', '공연 취소 및 환불 규정을 확인해 주세요.': 'Please review the cancellation and refund policy.', '예매 및 취소 규정을 확인했습니다.': 'I have reviewed the booking and cancellation policy.', '결제 안내 및 환불 규정을 확인했습니다.': 'I have reviewed the payment information and refund policy.', '예매 신청하기': 'Submit booking', '결제 금액': 'Total',
  '예매 완료 — Live Pocket V3.0': 'Booking complete — Live Pocket V3.0', '예매 신청이 완료됐어요.': 'Your booking request is complete.', '마이페이지 예매 상세에서 현장 입장용 QR 티켓을 확인할 수 있습니다.': 'Your entry QR ticket will appear in the booking details on My page.',
  '입금 계좌': 'Bank account', '신한은행 110-555-202606': 'Shinhan Bank 110-555-202606', '예금주 주식회사 라이브포켓': 'Account holder: Live Pocket Co., Ltd.', '마이페이지로 가기': 'Go to My page', '공연 더 보기': 'Browse more shows', '예매 번호': 'Booking number', '입금 기한': 'Payment deadline', '입장 QR': 'Entry QR', '입장 시 보여주세요': 'Show this at entry',
  '마이페이지에서 예매 내역을 확인해 주세요.': 'Check your bookings on My page.', '마이페이지 — Live Pocket V3.0': 'My page — Live Pocket V3.0', '내 정보를 불러오는 중…': 'Loading your account…', '로그인 또는 간편가입 후 마이페이지를 이용할 수 있습니다.': 'Log in or sign up to use My page.', '님,': ',', '반가워요.': 'welcome back.',
  '예매 내역': 'Bookings', '찜한 공연': 'Favorites', '공연 관리': 'Manage shows', '최근 예매': 'Recent bookings', '예매 확인': 'View booking', '아직 예매한 공연이 없습니다.': 'You have no bookings yet.', '찜한 공연이 없습니다.': 'You have no favorite shows yet.',
  '내 공연 관리': 'My shows', '가입한 계정으로 공연을 등록하고 운영할 수 있습니다.': 'Create and manage shows with this account.', '+ 공연 등록': '+ Add show', '입금 대기': 'Awaiting payment', '예매 완료': 'Booked', '취소': 'Cancelled', '운영 중': 'Active', '숨김': 'Hidden',
  '예매 정보 확인 QR코드': 'Booking verification QR code', '공연장 입구에서 이 QR코드를 제시해 주세요.': 'Show this QR code at the venue entrance.', '스태프가 예매 정보를 확인한 후 입장을 안내합니다.': 'Staff will verify your booking and guide you inside.', 'QR 발행 대기 중': 'QR pending', '입금 확인 후 이곳에 예매 정보 확인 QR이 표시됩니다.': 'Your booking QR will appear here after payment is confirmed.',
  '취소된 예매입니다.': 'This booking has been cancelled.', '입장 전 확인이 필요합니다.': 'Please check before entry.', '입장 확인 가능': 'Ready for entry verification', '유효하지 않은 예매 정보입니다.': 'This booking information is invalid.', 'QR코드를 다시 확인해 주세요.': 'Please check the QR code and try again.',
  '예매 정보 확인': 'Booking verification', '티켓 수량': 'Ticket quantity', '예매자명': 'Booker', '연락처': 'Contact', '예매번호': 'Booking number', '예매 상태': 'Booking status', '이 화면은 예매 정보 확인 전용입니다. 페이지를 열어도 입장 처리나 상태 변경은 일어나지 않습니다.': 'This page is for booking verification only. Opening it does not check in the guest or change the booking status.',
  '공연 정보를 찾을 수 없습니다.': 'Show information could not be found.', '공연이 삭제되었거나 조회할 수 없습니다.': 'The show was removed or is unavailable.', '문제가 계속되면 공연장 스태프에게 예매번호 또는 예매자 정보를 알려 주세요.': 'If the issue continues, give venue staff the booking number or booker details.',
  '등록된 공연이 없습니다.': 'No shows have been added.', '판매': 'Sold', '현황': 'Stats', '수정': 'Edit', '엑셀': 'Excel', '삭제': 'Delete', '예매율 · 찜 추이': 'Booking rate · Favorite trend', 'x축 날짜 · y축 수치': 'X-axis: date · Y-axis: value', '예매율 (%)': 'Booking rate (%)', '찜 횟수': 'Favorites', '예매율과 찜 횟수 추이 그래프': 'Booking rate and favorites trend chart',
  '플랫폼 대시보드': 'Platform dashboard', '회원 관리': 'Members', '전체 공연': 'All shows', '전체 예매': 'All bookings', '배너 설정': 'Banner settings', '공연 대시보드': 'Show dashboard', '예매자 관리': 'Bookings', '관리자 정보': 'Admin profile', '총 관리자': 'Super admin', '공연 관리자': 'Show manager', '플랫폼 운영': 'Platform operations',
  '데이터가 없습니다.': 'No data available.', '운영 공연': 'Active shows', '전체 찜': 'Total favorites', '예매 금액': 'Booking revenue', '담당 공연을 등록·수정하고 판매 현황을 확인합니다.': 'Create and edit your shows, and review sales.', '입금 확인과 예매 상태를 처리합니다.': 'Confirm payments and manage booking status.',
  '이름': 'Name', '권한': 'Role', '공연 등록 회원': 'Show creator', '일반 회원': 'Member', '전체 회원': 'All members', '공연 등록 경험과 계정 상태를 확인합니다.': 'Review account status and show creation history.', '구분': 'Type', '상태': 'Status', '관리': 'Actions',
  '전체 공연 관리': 'Manage all shows', '플랫폼에 등록된 공연을 관리합니다.': 'Manage every show on the platform.', '전체 예매 관리': 'Manage all bookings', '홈 롤링 배너의 내용과 노출 순서를 관리합니다.': 'Manage home banner content and display order.', '+ 신규 배너': '+ New banner', '배너 순서 이동': 'Reorder banner', '순서': 'Order', '노출 중': 'Visible',
  '공연 / 예매자': 'Show / Booker', '추가 답변': 'Additional answers', '금액': 'Amount', '처리': 'Action', '입금 확인': 'Confirm payment', '결제 완료': 'Paid',
  '공연 등록/수정 — Live Pocket V3.0': 'Create/edit show — Live Pocket V3.0', '공연 입력 화면을 불러오는 중…': 'Loading show editor…', '이미지 편집': 'Edit image', '확대/축소': 'Zoom', '적용': 'Apply', '아티스트 수정': 'Edit artist', '아티스트 추가': 'Add artist', '아티스트명': 'Artist name', '아티스트 이미지': 'Artist image', 'SNS 링크 (선택)': 'Social link (optional)', '유튜브 링크 (선택)': 'YouTube link (optional)',
  '이미지를 선택하지 않으면 기존 이미지를 유지합니다.': 'Leave this empty to keep the current image.', '기존 아티스트를 선택하면 등록된 이미지와 링크를 재사용합니다.': 'Select an existing artist to reuse their image and links.', '수정 저장': 'Save changes', '추가': 'Add', '아티스트 추가 버튼으로 출연진을 등록해 주세요.': 'Use Add artist to enter the lineup.', '장르 추가': 'Add genre', '장르명': 'Genre name',
  '일반 티켓': 'General admission', '일반티켓': 'General admission', '뒤풀이 참석 여부': 'After-party attendance', '뒤풀이 참석여부': 'After-party attendance', '뒤풀이에 참석하시나요?': 'Will you join the after-party?',
  '참석': 'Attending', '불참': 'Not attending', '예': 'Yes', '아니오': 'No', '티켓명': 'Ticket name', '선택지 입력': 'Enter an option', '질문': 'Question', '예: 뒤풀이에 참석하시나요?': 'e.g. Will you join the after-party?', '질문 삭제': 'Delete question', '선택지 추가': 'Add option', '공연 수정': 'Edit show', '공연 등록': 'Create show',
  '공연 정보, 티켓, 예매 질문을 한 화면에서 관리합니다.': 'Manage show details, tickets, and booking questions in one place.', '포스터 이미지': 'Poster image', '이미지 선택 후 포스터 비율에 맞게 확대/축소와 위치를 조정합니다.': 'After choosing an image, adjust its scale and position to fit the poster.',
  '주소': 'Address', '예매 시작': 'Booking opens', '티켓 설정': 'Ticket settings', '티켓 추가': 'Add ticket', '예매 추가 질문': 'Additional booking questions', '예매자가 선택할 질문과 선택지를 필요한 만큼 추가할 수 있습니다.': 'Add as many booking questions and options as needed.', '질문 추가': 'Add question', '결제 안내 문구': 'Payment instructions', '저장': 'Save',
  '로그인 또는 간편가입 후 공연을 등록할 수 있습니다.': 'Log in or sign up to create a show.', '아직 예매가 없습니다.': 'There are no bookings yet.', '처리 완료': 'Complete', '예매 현황': 'Booking stats', '판매 티켓': 'Tickets sold', '총 결제 금액': 'Total booking value', '입금 확인 금액': 'Confirmed payments', '예매 건수': 'Bookings',
  '배너 수정': 'Edit banner', '신규 배너': 'New banner', '관리용 제목': 'Internal title', '보조 설명': 'Supporting text', '배너 이미지': 'Banner image', '권장 크기: 1920x600px, 넓은 가로형 이미지': 'Recommended: 1920×600px landscape image', '연결 URL': 'Destination URL', '노출 순서': 'Display order', '노출하기': 'Show banner', '배너 추가': 'Add banner',
  '회원 수정': 'Edit member', '회원 이름': 'Member name', '새 비밀번호': 'New password', '변경하지 않으려면 비워두세요': 'Leave blank to keep the current password',
  '로그인 — Live Pocket V3.0': 'Log in — Live Pocket V3.0', '공연의 설렘을': 'Keep the excitement', '계속 이어가세요.': 'of live music going.', '일반 회원은 예매와 공연 등록을 같은 계정으로 이용할 수 있습니다.': 'Use one account to book tickets and create shows.', '이메일로 로그인하기': 'Log in with email', '일반 회원 계정으로 공연 예매와 공연 등록을 이용합니다.': 'Use your member account to book tickets and create shows.', '예매자 정보는 예매 단계에서 입력합니다.': 'Booker details are entered during booking.',
  '총관리자 로그인 — Live Pocket V3.0': 'Super admin login — Live Pocket V3.0', '접속': 'access', '플랫폼 운영 계정만 이 경로에서 로그인할 수 있습니다.': 'Only platform operations accounts can log in here.', '총관리자 로그인': 'Super admin login', '일반 회원은 기존 로그인 화면을 이용해 주세요.': 'Members should use the standard login page.', '총관리자 이메일': 'Super admin email', '일반 회원 로그인으로 이동': 'Go to member login',
  '가까운 소규모 공연을 발견하고 예매하는 Live Pocket V3.0': 'Discover and book intimate live shows with Live Pocket V3.0', '작은 무대, 크게 뛰는 밤': 'Small stage, electric night', '지금 가장 가까운 라이브를 만나보세요.': 'Find the live show closest to you.', '이번 주말의 재즈': 'Jazz this weekend', '좋아하는 음악을 공연장에서 듣는 시간.': 'Hear the music you love, live.', 'QR로 빠르게 확인': 'Fast entry with QR', '공연장 입구에서 예매 정보를 빠르게 확인하세요.': 'Verify your booking quickly at the venue entrance.',
  '인디록': 'Indie rock', '재즈': 'Jazz', '어쿠스틱': 'Acoustic', '힙합': 'Hip-hop', '클래식': 'Classical', '전자음악': 'Electronic', '밤의 사운드 체크': 'Night Soundcheck', '성수 재즈 나이트': 'Seongsu Jazz Night', '망원 어쿠스틱 데이': 'Mangwon Acoustic Day',
  '작은 공연장에서 가까운 거리로 생생한 사운드를 만나는 인디 라이브입니다.': 'An intimate indie show that puts you close to the stage and every detail of the sound.', '작은 바에서 만나는 따뜻한 콘트라베이스와 피아노의 밤입니다.': 'A warm evening of double bass and piano in an intimate bar.', '싱어송라이터의 목소리에 집중하는 60분 소규모 공연입니다.': 'An intimate 60-minute show centered on the voice of a singer-songwriter.',
  '이 공연을 목록에서 삭제할까요? 기존 예매 내역은 보존됩니다.': 'Remove this show from the list? Existing bookings will be kept.', '이 배너를 삭제할까요? 홈 화면에서도 더 이상 노출되지 않습니다.': 'Delete this banner? It will no longer appear on the home page.',
  '수정할 장르명을 입력해 주세요.': 'Enter the updated genre name.', '이 장르를 목록에서 삭제할까요?': 'Delete this genre from the list?', '해당 회원을 삭제 상태로 변경할까요?': 'Mark this member as deleted?',
};

function t(value) {
  if (CURRENT_LANGUAGE !== 'en') return String(value ?? '');
  const source = String(value ?? '');
  if (EN[source]) return EN[source];
  return source.replace(/^(\d+)번 배너$/, 'Banner $1').replace(/^(\d+)매$/, '$1 tickets').replace(/^(\d+)건$/, '$1 bookings').replace(/^(\d+)회 등록$/, 'Used in $1 shows').replace(/^예매번호\s+/, 'Booking no. ').replace(/^(.+)님,$/, '$1,').replace(/\s외\s(\d+)명$/, ' + $1 more').replace(/ 포스터$/, ' poster');
}

function localized(record, field) {
  if (!record) return '';
  const translated = String(record[`${field}_en`] || '').trim();
  return CURRENT_LANGUAGE === 'en' && translated ? translated : String(record[field] || '');
}

function translateNode(root) {
  if (CURRENT_LANGUAGE !== 'en' || !root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const raw = root.nodeValue;
    const trimmed = raw.trim();
    if (trimmed) {
      const translated = t(trimmed);
      if (translated !== trimmed) root.nodeValue = raw.replace(trimmed, translated);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE || root.matches('script, style')) return;
  ['aria-label', 'title', 'placeholder'].forEach(attribute => {
    if (!root.hasAttribute(attribute)) return;
    const source = root.getAttribute(attribute);
    const translated = t(source);
    if (translated !== source) root.setAttribute(attribute, translated);
  });
  [...root.childNodes].forEach(translateNode);
}

function initI18n() {
  document.documentElement.lang = CURRENT_LANGUAGE;
  document.title = t(document.title);
  document.querySelectorAll('meta[name="description"]').forEach(meta => meta.setAttribute('content', t(meta.getAttribute('content'))));
  translateNode(document.body);
  new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(translateNode))).observe(document.body, { childList: true, subtree: true });
}

function posterUrl(value, size = 'detail') {
  const source = String(value || '');
  if (!/^\/api\/performance-poster\/\d+(?:\?|$)/.test(source)) return source;
  return `${source}${source.includes('?') ? '&' : '?'}size=${encodeURIComponent(size)}`;
}

function loadMe() {
  if (!meLoad) {
    meLoad = api('/api/me')
      .then(({ user }) => {
        me = user;
        return user;
      })
      .catch(() => null);
  }
  return meLoad;
}

function bannerApiUrl() {
  const bust = localStorage.getItem(BANNER_CACHE_KEY);
  return bust ? `/api/banners?b=${encodeURIComponent(bust)}` : '/api/banners';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('lp-theme', theme);
  const button = $('#theme-toggle');
  if (button) {
    const dark = theme === 'dark';
    button.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
    button.title = dark ? '라이트 모드' : '다크 모드';
    button.setAttribute('aria-pressed', String(dark));
    $('span', button).textContent = dark ? '☾' : '☀';
  }
}

function shell() {
  applyTheme(localStorage.getItem('lp-theme') || 'light');
  const header = $('#header');
  if (header) {
    header.innerHTML = `<div class="nav-wrap">
      <a class="brand" href="/"><b>LP</b><strong>Live Pocket</strong><em>${APP_VERSION}</em></a>
      <nav>
        <a href="/mypage.html">마이페이지</a>
        <a id="auth-link" href="#login">로그인</a>
      </nav>
      <div class="language-switch" role="group" aria-label="Language"><button type="button" data-language="ko" aria-pressed="${CURRENT_LANGUAGE === 'ko'}">Ko</button><span aria-hidden="true">/</span><button type="button" data-language="en" aria-pressed="${CURRENT_LANGUAGE === 'en'}">En</button></div>
      <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false"><span aria-hidden="true"></span></button>
      <button class="menu" type="button" aria-label="메뉴">☰</button>
    </div>`;
    applyTheme(localStorage.getItem('lp-theme') || 'light');
  }
  const footer = $('#footer');
  if (footer) footer.innerHTML = `<div class="footer-wrap"><a class="brand light" href="/"><b>LP</b><strong>Live Pocket</strong><em>${APP_VERSION}</em></a><p>작은 무대의 큰 순간을 가장 가까이에서.</p><small>© 2026 Live Pocket ${APP_VERSION}. All rights reserved.</small></div>`;
  $('.menu')?.addEventListener('click', () => $('#header nav').classList.toggle('open'));
  $$('[data-language]').forEach(button => button.addEventListener('click', () => {
    const language = button.dataset.language;
    if (language === CURRENT_LANGUAGE) return;
    localStorage.setItem(LANGUAGE_KEY, language);
    location.reload();
  }));
  $('#theme-toggle')?.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  loadMe().then(user => {
    const auth = $('#auth-link');
    if (!auth) return;
    if (!user) {
      auth.addEventListener('click', event => {
        event.preventDefault();
        showLoginModal(location.href);
      });
      return;
    }
    auth.textContent = t('로그아웃');
    auth.href = '#logout';
    auth.addEventListener('click', async event => {
      event.preventDefault();
      await api('/api/auth/logout', { method: 'POST' });
      location.href = '/';
    });
  }).catch(() => {});
}

function bookingState(performance) {
  const now = new Date();
  const remaining = Number(performance.remaining || performance.remaining_quantity || 0);
  if (remaining < 1) return { key: 'soldout', label: '매진' };
  if (performance.status !== 'OPEN' || new Date(performance.booking_close_at) < now) return { key: 'closed', label: '예매 마감' };
  if (performance.booking_start_at && new Date(performance.booking_start_at) > now) return { key: 'before', label: '예매 전' };
  return { key: 'open', label: '예매 중' };
}

function availabilityBadges(performance) {
  const state = bookingState(performance);
  const labels = [{ label: state.label, className: state.key }];
  if (Number(performance.remaining) < 10 && state.key === 'open') labels.push({ label: '마감 임박', className: 'secondary' });
  return labels.map(item => `<span class="show-badge ${item.className}">${esc(item.label)}</span>`).join('');
}

function artistNames(value) {
  return String(value || '').split(',').map(name => name.trim()).filter(Boolean);
}

function compactArtistLabel(value, maxVisible = 2) {
  const names = artistNames(value);
  if (names.length <= maxVisible) return names.join(', ');
  return `${names.slice(0, maxVisible).join(', ')} 외 ${names.length - maxVisible}명`;
}

const card = performance => `<article class="show-card"><a href="/performances/${performance.id}">
  <div class="poster-wrap"><img src="${esc(posterUrl(performance.poster_url, 'card'))}" alt="${esc(localized(performance, 'title'))} 포스터" loading="lazy" decoding="async"><div class="show-badges">${availabilityBadges(performance)}</div></div>
  <div class="show-info"><small class="show-date">${date(performance.start_at)}</small><h3>${esc(localized(performance, 'title'))}</h3><p title="${esc(performance.artists)}">${esc(compactArtistLabel(performance.artists))}</p>
  <div><span>${esc(localized(performance, 'venue_name'))}</span><strong>${won(performance.price)}~</strong></div></div>
</a></article>`;

function markPopular(performances) {
  const ranked = [...performances].sort((a, b) => Number(b.favorite_count) - Number(a.favorite_count) || Number(a.id) - Number(b.id));
  const count = Math.max(1, Math.ceil(performances.length * 0.1));
  const ids = new Set(ranked.slice(0, count).filter(item => Number(item.favorite_count) > 0).map(item => item.id));
  performances.forEach(item => { item.is_popular = ids.has(item.id); });
}

const prefetchedPerformances = new Set();
function prefetchPerformanceDetails(list) {
  const ids = list.slice(0, 6).map(item => Number(item.id)).filter(Boolean).filter(id => !prefetchedPerformances.has(id));
  if (!ids.length) return;
  const run = () => ids.forEach(id => {
    prefetchedPerformances.add(id);
    fetch(`/api/performances/${id}`).catch(() => {});
  });
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
  else setTimeout(run, 300);
}

function bindHero(hero, banners) {
  let index = 0;
  let timer;
  let dragStart = null;
  let suppressClick = false;
  const show = next => {
    index = (next + banners.length) % banners.length;
    $$('.hero-slide', hero).forEach((slide, itemIndex) => slide.classList.toggle('active', itemIndex === index));
    $$('.hero-dots button', hero).forEach((dot, itemIndex) => dot.classList.toggle('active', itemIndex === index));
  };
  const roll = () => {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 5000);
  };
  $('[data-hero-prev]', hero)?.addEventListener('click', event => { event.stopPropagation(); show(index - 1); roll(); });
  $('[data-hero-next]', hero)?.addEventListener('click', event => { event.stopPropagation(); show(index + 1); roll(); });
  $$('.hero-arrow', hero).forEach(button => button.addEventListener('pointerdown', event => event.stopPropagation()));
  $$('.hero-dots button', hero).forEach((dot, itemIndex) => dot.addEventListener('click', () => { show(itemIndex); roll(); }));
  $$('.hero-slide', hero).forEach(slide => slide.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    const href = slide.getAttribute('href');
    if (!href || href === '#') return;
    event.preventDefault();
    if (slide.target === '_blank') window.open(href, '_blank', 'noopener');
    else location.assign(href);
  }));
  hero.addEventListener('pointerdown', event => {
    dragStart = event.clientX;
    hero.setPointerCapture?.(event.pointerId);
    hero.classList.add('dragging');
  });
  hero.addEventListener('pointerup', event => {
    if (dragStart !== null && Math.abs(event.clientX - dragStart) > 45) {
      suppressClick = true;
      show(index + (event.clientX < dragStart ? 1 : -1));
    }
    dragStart = null;
    hero.classList.remove('dragging');
    roll();
  });
  hero.addEventListener('pointercancel', () => { dragStart = null; hero.classList.remove('dragging'); });
  hero.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    if (event.target.closest('.hero-arrow, .hero-dots, .hero-slide')) return;
    const active = $('.hero-slide.active', hero);
    if (active) active.click();
  });
  roll();
}

async function home() {
  const hero = $('#hero');
  const grid = $('#performance-grid');
  const renderHero = banners => {
    if (!hero) return;
    if (!banners.length) {
      hero.innerHTML = '<div class="empty">노출 중인 배너가 없습니다.</div>';
      return;
    }
    hero.innerHTML = `<div class="hero-stage">${banners.map((banner, index) => {
      const href = normalizeLinkUrl(banner.link_url);
      const external = /^https?:\/\//i.test(href) && !href.startsWith(location.origin);
      return `<a class="hero-slide ${index ? '' : 'active'}" href="${esc(href)}" ${external ? 'target="_blank" rel="noopener"' : ''} aria-label="${esc(banner.title)}"><img src="${esc(banner.image_url)}" alt="${esc(banner.title)}" loading="${index ? 'lazy' : 'eager'}" fetchpriority="${index ? 'auto' : 'high'}" decoding="async"></a>`;
    }).join('')}
      <button class="hero-arrow prev" type="button" data-hero-prev aria-label="이전 배너">‹</button><button class="hero-arrow next" type="button" data-hero-next aria-label="다음 배너">›</button>
      <div class="hero-dots">${banners.map((_, index) => `<button class="${index ? '' : 'active'}" type="button" aria-label="${index + 1}번 배너"></button>`).join('')}</div></div>`;
    bindHero(hero, banners);
  };

  const render = list => {
    grid.innerHTML = list.length ? list.map(card).join('') : '<div class="empty">조건에 맞는 공연이 없습니다.</div>';
    prefetchPerformanceDetails(list);
  };
  let performances = [];
  const runSearch = () => {
    const form = $('#filters');
    const data = new FormData(form);
    const query = String(data.get('q') || '').trim().toLowerCase();
    const scope = String(data.get('scope') || 'all');
    const sort = String(data.get('sort') || 'date-asc');
    const bookableOnly = data.get('bookable') === 'on';
    const fields = {
      all: item => `${item.title} ${item.title_en || ''} ${item.artists} ${item.venue_name} ${item.venue_name_en || ''} ${item.host_name || ''}`,
      venue: item => `${item.venue_name} ${item.venue_name_en || ''}`,
      artist: item => item.artists,
      host: item => item.host_name || '',
      title: item => `${item.title} ${item.title_en || ''}`,
    };
    const canBook = item => item.status === 'OPEN' && Number(item.remaining) > 0 && new Date(item.booking_close_at) > new Date();
    const list = performances.filter(item => (!query || fields[scope](item).toLowerCase().includes(query)) && (!bookableOnly || canBook(item)));
    const sorters = {
      'popular-desc': (a, b) => Number(b.favorite_count) - Number(a.favorite_count),
      'popular-asc': (a, b) => Number(a.favorite_count) - Number(b.favorite_count),
      'date-desc': (a, b) => new Date(b.start_at) - new Date(a.start_at),
      'date-asc': (a, b) => new Date(a.start_at) - new Date(b.start_at),
      'price-desc': (a, b) => Number(b.price) - Number(a.price),
      'price-asc': (a, b) => Number(a.price) - Number(b.price),
      'registered-desc': (a, b) => new Date(b.created_at) - new Date(a.created_at),
      'registered-asc': (a, b) => new Date(a.created_at) - new Date(b.created_at),
    };
    list.sort(sorters[sort]);
    render(list);
  };
  grid.innerHTML = '<div class="loading">공연을 불러오는 중…</div>';
  $('#filters').addEventListener('submit', event => { event.preventDefault(); runSearch(); });
  $$('[data-sort-key]').forEach(button => button.addEventListener('click', () => {
    const active = button.classList.contains('active');
    const direction = active && button.dataset.direction === 'asc' ? 'desc' : 'asc';
    $$('[data-sort-key]').forEach(item => item.classList.toggle('active', item === button));
    button.dataset.direction = direction;
    button.querySelector('i').textContent = direction === 'asc' ? '↑' : '↓';
    $('[name=sort]').value = `${button.dataset.sortKey}-${direction}`;
    runSearch();
  }));
  $('[name=bookable]').addEventListener('change', runSearch);
  api('/api/performances').then(data => {
    performances = data;
    markPopular(performances);
    render(performances);
  }).catch(error => {
    grid.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
  });
}

function calendarLinks(performance) {
  const start = new Date(performance.start_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const title = localized(performance, 'title');
  const venue = localized(performance, 'venue_name');
  const address = localized(performance, 'address');
  const description = localized(performance, 'description');
  const details = `${title}\n${venue}\n${address}`;
  const google = new URL('https://calendar.google.com/calendar/render');
  google.search = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${stamp(start)}/${stamp(end)}`, details, location: `${venue} ${address}` });
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Live Pocket//${APP_VERSION}//${CURRENT_LANGUAGE.toUpperCase()}\nBEGIN:VEVENT\nUID:performance-${performance.id}@livepocket\nDTSTAMP:${stamp(new Date())}\nDTSTART:${stamp(start)}\nDTEND:${stamp(end)}\nSUMMARY:${title}\nLOCATION:${venue} ${address}\nDESCRIPTION:${description.replace(/\n/g, ' ')}\nEND:VEVENT\nEND:VCALENDAR`;
  return { google: google.toString(), ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}

function mapLinks(performance) {
  const destination = String(performance.address || performance.venue_name || '').trim();
  return { kakao: `https://map.kakao.com/link/search/${encodeURIComponent(destination)}` };
}

function artistEntries(namesValue, avatarsValue) {
  const names = String(namesValue || '').split(',').map(name => name.trim()).filter(Boolean);
  let avatars = [];
  try {
    const parsed = JSON.parse(avatarsValue || '[]');
    avatars = Array.isArray(parsed) ? parsed : [];
  } catch {
    avatars = [];
  }
  if (!avatars.length && avatarsValue) avatars = names.map(name => ({ name, avatar: avatarsValue }));
  return names.map((name, index) => {
    const entry = avatars[index] || avatars.find(item => item?.name === name) || {};
    return { name, avatar: entry.avatar || '/assets/artist-avatar.svg', snsUrl: entry.snsUrl || entry.url || '', youtubeUrl: entry.youtubeUrl || '' };
  });
}

function setArtistEntries(form, entries) {
  form.artists.value = entries.map(item => item.name).join(', ');
  form.artist_avatar_url.value = JSON.stringify(entries.map(item => ({ name: item.name, avatar: item.avatar || '/assets/artist-avatar.svg', snsUrl: item.snsUrl || '', youtubeUrl: item.youtubeUrl || '' })));
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function socialService(value) {
  const host = (() => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } })();
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return { name: 'Instagram', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="social-icon-dot" cx="17.4" cy="6.7" r="1"/></svg>' };
  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com') return { name: 'Facebook', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v2H6v4h3v7h4v-7h3.4l.6-4h-4V9c0-.7.3-1 1-1Z"/></svg>' };
  if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) return { name: 'X', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.3l3.5 4.8L17 4h2l-5.3 6.3L20 20h-4.3l-4-5.5L7 20H5l5.8-7L5 4Zm3.3 2 8.4 12h1L9.3 6h-1Z"/></svg>' };
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return { name: 'TikTok', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h3c.3 2 1.5 3.2 4 3.5v3a8 8 0 0 1-4-1.2V15a6 6 0 1 1-6-6h1v3a4 4 0 0 0-1-.1 3.1 3.1 0 1 0 3 3.1V3Z"/></svg>' };
  if (host === 'threads.net' || host.endsWith('.threads.net')) return { name: 'Threads', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c5.4 0 8.5 3.2 8.5 8.8 0 5.5-3.1 9.2-8.2 9.2-4.9 0-8.8-3.5-8.8-8.8S6.7 3 12 3Zm.2 3c-3.5 0-5.6 2.2-5.6 6.1 0 3.7 2.4 5.9 5.7 5.9 2.7 0 4.5-1.4 4.8-3.6-.8.9-2.2 1.5-3.7 1.5-2.6 0-4.3-1.4-4.3-3.5 0-2 1.7-3.4 4.1-3.4 1.1 0 2.1.2 3 .7-.6-2.5-2.1-3.7-4-3.7Zm1.2 5.2c-.9 0-1.5.5-1.5 1.2 0 .8.6 1.2 1.6 1.2 1.3 0 2.3-.6 2.8-1.5-.8-.6-1.8-.9-2.9-.9Z"/></svg>' };
  if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) return { name: 'SoundCloud', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 14.5 3 11l1 3.5L5.2 9l1.1 5.5L7.7 7l1.2 7.5L10.4 5c4.2-.4 6.8 1.7 7.5 5a4 4 0 1 1 .1 8H2v-3.5Z"/></svg>' };
  return { name: 'SNS', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a1.5 1.5 0 0 0 2.1 0l3.1-3.1a2.5 2.5 0 1 0-3.5-3.5l-1.8 1.8-2.1-2.1 1.8-1.8a5.5 5.5 0 1 1 7.8 7.8l-3.1 3.1a4.5 4.5 0 0 1-6.4 0l2.1-2.2Zm2.8-2.8a1.5 1.5 0 0 0-2.1 0l-3.1 3.1a2.5 2.5 0 1 0 3.5 3.5l1.8-1.8 2.1 2.1-1.8 1.8A5.5 5.5 0 1 1 6 11.5l3.1-3.1a4.5 4.5 0 0 1 6.4 0l-2.1 2.2Z"/></svg>' };
}

function artistLinkButton(urlValue, type, artistName) {
  const url = safeExternalUrl(urlValue);
  if (!url) return '';
  const service = type === 'youtube'
    ? { name: 'YouTube', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0-2.1-.2-4-.5-5-.2-1-1-1.7-2-2C17.8 4.5 12 4.5 12 4.5S6.2 4.5 4.5 5c-1 .3-1.8 1-2 2C2.2 8 2 9.9 2 12s.2 4 .5 5c.2 1 1 1.7 2 2 1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5c1-.3 1.8-1 2-2 .3-1 .5-2.9.5-5Zm-12 3.5v-7l6 3.5-6 3.5Z"/></svg>' }
    : socialService(url);
  return `<a class="artist-social-button ${type === 'youtube' ? 'youtube' : ''}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(artistName)} ${service.name}" title="${service.name}">${service.icon}</a>`;
}

function artistCredits(performance) {
  return artistEntries(performance.artists, performance.artist_avatar_url).map(item => `<div class="artist-credit-item"><span class="artist-identity"><img src="${esc(item.avatar)}" alt="">${esc(item.name)}</span><span class="artist-social-actions">${artistLinkButton(item.snsUrl, 'sns', item.name)}${artistLinkButton(item.youtubeUrl, 'youtube', item.name)}</span></div>`).join('');
}

function showLoginModal(next = location.href) {
  $('.login-modal')?.remove();
  const destination = () => {
    try { const target = new URL(next, location.origin); return target.origin === location.origin ? `${target.pathname}${target.search}${target.hash}` : '/mypage.html'; }
    catch { return '/mypage.html'; }
  };
  document.body.insertAdjacentHTML('beforeend', `<div class="modal login-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">ACCOUNT ACCESS</span><h2>로그인 또는 간편가입</h2><p>현재 화면에서 계정 인증을 완료할 수 있습니다.</p><div class="auth-tabs" role="tablist" aria-label="회원 인증"><button class="active" type="button" role="tab" aria-selected="true" data-modal-auth-tab="login">로그인</button><button type="button" role="tab" aria-selected="false" data-modal-auth-tab="signup">간편가입</button></div><form id="modal-login" class="stack" data-modal-auth-panel="login"><label>이메일<input type="email" name="email" autocomplete="username" required></label><label>비밀번호<input type="password" name="password" autocomplete="current-password" required></label><button class="btn primary" type="submit">로그인</button></form><form id="modal-signup" class="stack hidden" data-modal-auth-panel="signup"><label>이메일<input type="email" name="email" autocomplete="email" required></label><label>비밀번호<input type="password" name="password" autocomplete="new-password" minlength="8" pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}" required><small>8자 이상, 영문과 숫자를 함께 입력해 주세요.</small></label><label>닉네임<input type="text" name="nickname" maxlength="30" required></label><button class="btn primary" type="submit">간편가입</button></form><div id="modal-login-error" class="alert error hidden"></div></article></div>`);
  $('.login-modal .modal-close').addEventListener('click', () => $('.login-modal').remove());
  $('.login-modal').addEventListener('click', event => { if (event.target === event.currentTarget) $('.login-modal .modal-close').click(); });
  $$('[data-modal-auth-tab]').forEach(button => button.addEventListener('click', () => {
    $$('[data-modal-auth-tab]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); });
    $$('[data-modal-auth-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.modalAuthPanel !== button.dataset.modalAuthTab));
    $('#modal-login-error').classList.add('hidden');
  }));
  const bindAuthForm = (selector, endpoint) => $(selector).addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('button[type="submit"]', event.currentTarget);
      button.disabled = true;
      try {
        await api(endpoint, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
        location.href = destination();
      } catch (error) {
        $('#modal-login-error').textContent = error.message;
        $('#modal-login-error').classList.remove('hidden');
        button.disabled = false;
      }
    });
  bindAuthForm('#modal-login', '/api/auth/login');
  bindAuthForm('#modal-signup', '/api/auth/register');
}

async function detail() {
  const id = qs('id') || location.pathname.match(/^\/performances\/(\d+)\/?$/)?.[1] || 1;
  const [performance, user] = await Promise.all([api(`/api/performances/${id}`), loadMe()]);
  const links = calendarLinks(performance);
  const maps = mapLinks(performance);
  me = user;
  performance.remaining = performance.tickets.reduce((sum, item) => sum + Number(item.remaining_quantity), 0);
  const displayTitle = localized(performance, 'title');
  const displayVenue = localized(performance, 'venue_name');
  const displayVenueDescription = localized(performance, 'venue_description');
  const displayAddress = localized(performance, 'address');
  const displayDescription = localized(performance, 'description');
  const displayVenueMeta = [...new Set([displayAddress, displayVenueDescription].filter(Boolean))].map(value => `<small>${esc(value)}</small>`).join('');
  const ticketSummary = performance.tickets.map(ticket => `<div class="ticket-summary-row"><span>${esc(t(ticket.name))}</span><b>${won(ticket.price)}</b></div>`).join('');
  document.title = `${displayTitle} — Live Pocket ${APP_VERSION}`;
  $('#detail').innerHTML = `<nav class="crumb"><a href="/">홈</a><span>›</span><span>공연 상세</span></nav>
    <section class="detail-grid"><div class="detail-poster"><img src="${esc(posterUrl(performance.poster_url, 'detail'))}" alt="${esc(displayTitle)} 포스터" decoding="async"></div>
    <article class="detail-info"><h1>${esc(displayTitle)}</h1>
    <dl><div><dt>공연 일시</dt><dd class="detail-row-content"><span>${date(performance.start_at)}</span><div class="calendar-wrap"><button id="calendar-button" class="map-icon-button calendar-icon-button" type="button" aria-label="캘린더에 추가" title="캘린더에 추가" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 9H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM6 6a1 1 0 0 0-1 1v2h14V7a1 1 0 0 0-1-1H6Zm6 7a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 1 1 0-2h1v-1a1 1 0 0 1 1-1Z"/></svg></button><div id="calendar-menu" class="calendar-menu hidden" role="menu"><a href="${esc(links.google)}" target="_blank" rel="noopener" role="menuitem">Google · Android</a><a href="${links.ics}" download="${esc(performance.title)}.ics" role="menuitem">Apple · iOS (.ics)</a></div></div></dd></div>
    <div><dt>공연 장소</dt><dd class="venue-row"><span class="venue-copy"><b>${esc(displayVenue)}</b>${displayVenueMeta}</span><a class="map-icon-button" href="${esc(maps.kakao)}" target="_blank" rel="noopener" aria-label="카카오맵에서 공연장 보기" title="카카오맵에서 보기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-8.7A3.3 3.3 0 1 1 12 5.7a3.3 3.3 0 0 1 0 6.6Z"/></svg></a></dd></div><div><dt>아티스트</dt><dd class="artist-credit">${artistCredits(performance)}</dd></div><div><dt>티켓</dt><dd class="ticket-summary">${ticketSummary}</dd></div></dl>
    <div class="button-row"><button id="favorite" class="btn outline" type="button" aria-label="찜하기"><span class="favorite-icon" aria-hidden="true">${performance.is_favorite ? '♥' : '♡'}</span> <b>${performance.favorite_count}</b></button><a id="booking-link" class="btn primary grow" href="/booking.html?id=${performance.id}">예매하기</a></div></article></section>
    <section class="description"><span class="kicker">ABOUT THE SHOW</span><h2>공연 소개</h2><p>${esc(displayDescription)}</p><div class="notice"><b>예매 및 입장 안내</b><span>결제는 무통장 입금으로 진행됩니다. 입금 확인 후 QR 티켓이 발급되며, 공연 당일 예매 상세 화면의 QR로 입장할 수 있습니다.</span></div></section>
    <section class="recommendations"><div class="panel-title"><div><span class="kicker">YOU MAY ALSO LIKE</span><h2>추천 공연</h2></div></div><div class="performance-grid">${performance.recommendations.length ? performance.recommendations.map(card).join('') : '<div class="empty">추천할 공연을 준비 중입니다.</div>'}</div></section>`;
  $('#calendar-button').addEventListener('click', event => {
    const hidden = $('#calendar-menu').classList.toggle('hidden');
    event.currentTarget.setAttribute('aria-expanded', String(!hidden));
  });
  const state = bookingState(performance);
  if (state.key !== 'open') {
    const link = $('#booking-link');
    link.textContent = state.label;
    link.removeAttribute('href');
    link.classList.add('disabled');
  }
  $('#favorite').addEventListener('click', async () => {
    if (!me) return showLoginModal(location.href);
    try {
      const result = await api(`/api/performances/${performance.id}/favorite`, { method: 'POST' });
      $('#favorite').innerHTML = `<span class="favorite-icon" aria-hidden="true">${result.favorite ? '♥' : '♡'}</span> <b>${result.favoriteCount}</b>`;
    } catch (error) {
      showLoginModal(location.href);
    }
  });
  $('#booking-link').addEventListener('click', event => {
    if (me) return;
    event.preventDefault();
    showLoginModal(`/booking.html?id=${performance.id}`);
  });
}

async function booking() {
  const id = qs('id') || 1;
  let performance;
  try {
    [performance, me] = await Promise.all([api(`/api/performances/${id}`), loadMe()]);
  } catch (error) {
    return $('#booking-content').innerHTML = `<div class="alert error">${esc(error.message)}</div>`;
  }
  if (!me) {
    $('#booking-content').innerHTML = '<div class="empty">로그인 또는 간편가입 후 예매를 계속할 수 있습니다.</div>';
    showLoginModal(location.href);
    return;
  }
  const ticket = performance.tickets.find(item => Number(item.remaining_quantity) > 0) || performance.tickets[0];
  const questionFields = (performance.questions || []).map(question => {
    const questionText = localized(question, 'question_text');
    const questionDescription = localized(question, 'description_text');
    const label = `<span class="booking-question-title">${esc(questionText)}${question.is_required ? ' <i>필수</i>' : ''}</span>${questionDescription ? `<small class="booking-question-description">${esc(questionDescription)}</small>` : ''}`;
    if (question.question_type === 'short_text') return `<label class="booking-question" data-question-id="${question.id}" data-question-type="short_text">${label}<input data-question-answer maxlength="200" ${question.is_required ? 'required' : ''}></label>`;
    if (question.question_type === 'long_text') return `<label class="booking-question" data-question-id="${question.id}" data-question-type="long_text">${label}<textarea data-question-answer maxlength="3000" ${question.is_required ? 'required' : ''}></textarea></label>`;
    if (question.question_type === 'checkbox_single' || question.question_type === 'checkbox_multiple') return `<div class="booking-question" data-question-id="${question.id}" data-question-type="${question.question_type}">${label}<div class="booking-option-list">${question.options.map(option => { const description = localized(option, 'description_text'); return `<label class="booking-option"><span><input type="checkbox" value="${option.id}"> ${esc(localized(option, 'option_text'))}</span>${description ? `<small>${esc(description)}</small>` : ''}</label>`; }).join('')}</div></div>`;
    return `<label class="booking-question" data-question-id="${question.id}" data-question-type="select">${label}<select data-question-answer ${question.is_required ? 'required' : ''}><option value="">선택해 주세요</option>${question.options.map(option => `<option value="${option.id}" data-description="${esc(localized(option, 'description_text'))}">${esc(localized(option, 'option_text'))}</option>`).join('')}</select><small class="selected-option-description"></small></label>`;
  }).join('');
  $('#booking-content').innerHTML = `<section class="booking-form"><form id="booking-form" class="stack"><div class="mini-show"><img src="${esc(posterUrl(performance.poster_url, 'thumb'))}" alt="" loading="lazy" decoding="async"><div><h2>${esc(localized(performance, 'title'))}</h2><p>${date(performance.start_at)} · ${esc(localized(performance, 'venue_name'))}</p></div></div><hr><label>티켓 종류<select name="ticketTypeId">${performance.tickets.map(item => `<option value="${item.id}" data-price="${item.price}" data-remaining="${item.remaining_quantity}" ${item.id === ticket.id ? 'selected' : ''} ${Number(item.remaining_quantity) < 1 ? 'disabled' : ''}>${esc(t(item.name))} · ${won(item.price)}</option>`).join('')}</select></label><label>수량<select name="quantity"></select><small>1회 최대 ${Number(performance.max_tickets_per_order || 4)}매</small></label><div class="two"><label>예매자 이름<input name="name" autocomplete="name" required></label><label>핸드폰번호<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></label></div>${questionFields ? `<fieldset class="booking-questions"><legend>추가 질문</legend>${questionFields}</fieldset>` : ''}<div class="payment"><span>결제 방식</span><b>무통장 입금</b><small>${esc(localized(performance, 'deposit_notice') || '신청 후 24시간 이내 입금')}</small><hr><span>환불 규정</span><small>${esc(localized(performance, 'refund_policy') || '공연 취소 및 환불 규정을 확인해 주세요.')}</small></div><label class="agree"><input type="checkbox" required> 결제 안내 및 환불 규정을 확인했습니다.</label><div id="form-error" class="alert error hidden"></div><button class="btn primary" type="submit">예매 신청하기</button></form></section><aside class="summary"><span>결제 금액</span><strong id="total">${won(ticket.price)}</strong></aside>`;
  const form = $('#booking-form');
  $$('.booking-question[data-question-type="checkbox_single"] input[type="checkbox"]', form).forEach(input => input.addEventListener('change', event => {
    if (event.currentTarget.checked) $$('input[type="checkbox"]', event.currentTarget.closest('.booking-question')).forEach(other => { if (other !== event.currentTarget) other.checked = false; });
  }));
  $$('.booking-question[data-question-type="select"] select', form).forEach(select => select.addEventListener('change', event => {
    event.currentTarget.closest('.booking-question').querySelector('.selected-option-description').textContent = event.currentTarget.selectedOptions[0]?.dataset.description || '';
  }));
  form.phone.addEventListener('input', event => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
    event.target.value = digits.length > 7 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  });
  const update = () => {
    const option = form.ticketTypeId.selectedOptions[0];
    const current = Number(form.quantity.value) || 1;
    const limit = Math.min(Number(performance.max_tickets_per_order || 4), Number(option.dataset.remaining || 0));
    form.quantity.innerHTML = Array.from({ length: limit }, (_, index) => index + 1).map(value => `<option ${value === Math.min(current, limit) ? 'selected' : ''}>${value}</option>`).join('');
    $('#total').textContent = won(Number(option.dataset.price) * Number(form.quantity.value || 0));
  };
  form.addEventListener('change', update);
  update();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(form));
      payload.answers = $$('.booking-question', form).map(field => {
        const questionId = Number(field.dataset.questionId), type = field.dataset.questionType;
        if (type === 'short_text' || type === 'long_text') return { questionId, answerText: $('[data-question-answer]', field).value };
        if (type === 'checkbox_multiple') return { questionId, optionIds: $$('input[type="checkbox"]:checked', field).map(input => Number(input.value)) };
        if (type === 'checkbox_single') return { questionId, optionId: Number($('input[type="checkbox"]:checked', field)?.value || 0) || null };
        return { questionId, optionId: Number($('[data-question-answer]', field).value || 0) || null };
      });
      const result = await api('/api/reservations', { method: 'POST', body: JSON.stringify(payload) });
      sessionStorage.setItem('lastReservation', JSON.stringify(result));
      location.href = `/booking-complete.html?id=${result.id}`;
    } catch (error) {
      $('#form-error').textContent = error.message;
      $('#form-error').classList.remove('hidden');
    }
  });
}

function complete() {
  const reservation = JSON.parse(sessionStorage.getItem('lastReservation') || 'null');
  $('#complete-info').innerHTML = reservation ? `<div><span>예매 번호</span><strong>${esc(reservation.reservationNo)}</strong></div><div><span>결제 금액</span><strong>${won(reservation.totalAmount)}</strong></div><div><span>입금 기한</span><strong>${date(reservation.depositDeadline)}</strong></div><div><span>입장 QR</span><strong>입장 시 보여주세요</strong></div>` : '<p>마이페이지에서 예매 내역을 확인해 주세요.</p>';
}

const stats = items => `<div class="stats">${items.map(([label, value]) => `<article><small>${label}</small><strong>${value}</strong></article>`).join('')}</div>`;
const statusName = status => ({ WAITING_DEPOSIT: '입금 대기', PAID: '예매 완료', CANCELLED: '취소', USED: '예매 완료', OPEN: '운영 중', HIDDEN: '숨김' })[status] || status;

async function mypage() {
  const user = await loadMe();
  if (!user) {
    $('#mypage').innerHTML = '<div class="empty">로그인 또는 간편가입 후 마이페이지를 이용할 수 있습니다.</div>';
    showLoginModal(location.href);
    return;
  }
  me = user;
  if (user.role === 'USER') return userPage(user);
  if (user.role === 'MANAGER') return adminPage(user, false);
  return adminPage(user, true);
}

async function userPage(user) {
  const [reservations, favorites, managed] = await Promise.all([api('/api/me/reservations'), api('/api/me/favorites'), api('/api/me/performances')]);
  markPopular(favorites);
  $('#mypage').innerHTML = `<section class="my-head"><div><span class="kicker">MY LIVE POCKET</span><h1>${esc(user.name)}님,<br>반가워요.</h1><p>${esc(user.email)}</p></div><button class="btn outline logout" type="button">로그아웃</button></section>
    <div class="tabs"><button class="active" data-tab="booking">예매 내역 <b>${reservations.length}</b></button><button data-tab="favorite">찜한 공연 <b>${favorites.length}</b></button><button data-tab="manage">공연 관리 <b>${managed.length}</b></button></div>
    <section data-panel="booking" class="tab-panel active"><h2>최근 예매</h2><div class="reservation-list">${reservations.length ? reservations.map(reservation => `<article class="reservation"><a class="reservation-show" href="/performances/${reservation.performance_id}"><img src="${esc(posterUrl(reservation.poster_url, 'thumb'))}" alt="" loading="lazy" decoding="async"><div><span class="pill">${statusName(reservation.status)}</span><h3>${esc(reservation.title)}</h3><p>${date(reservation.start_at)} · ${esc(reservation.venue_name)}</p><small>예매번호 ${esc(reservation.reservation_no)}</small></div></a><button class="reservation-confirm" type="button" data-reservation="${reservation.id}">예매 확인</button></article>`).join('') : '<div class="empty">아직 예매한 공연이 없습니다.</div>'}</div></section>
    <section data-panel="favorite" class="tab-panel"><h2>찜한 공연</h2><div class="performance-grid">${favorites.length ? favorites.map(card).join('') : '<div class="empty">찜한 공연이 없습니다.</div>'}</div></section>
    <section data-panel="manage" class="tab-panel"><div class="panel-title"><div><h2>내 공연 관리</h2><p>가입한 계정으로 공연을 등록하고 운영할 수 있습니다.</p></div><a class="btn primary" href="/performance-form.html">+ 공연 등록</a></div>${performanceTable(managed)}</section>`;
  bindTabs();
  bindLogout();
  bindShowActions();
  $$('[data-reservation]').forEach(button => button.addEventListener('click', () => {
    history.replaceState(null, '', `/mypage.html?reservation=${button.dataset.reservation}`);
    reservationModal(button.dataset.reservation);
  }));
  if (qs('reservation')) reservationModal(qs('reservation'));
}

async function reservationModal(id) {
  try {
    const reservation = await api(`/api/me/reservations/${id}`);
    const canShowQr = reservation.status === 'PAID' || reservation.status === 'USED';
    const verifyUrl = reservation.qr_verify_url || (reservation.qr_token ? `${location.origin}/tickets/verify/${encodeURIComponent(reservation.qr_token)}` : '');
    const answers = (reservation.answers || []).map(answer => `<div><dt>${esc(answer.question_text)}</dt><dd>${esc(answer.answer_text)}</dd></div>`).join('');
    document.body.insertAdjacentHTML('beforeend', `<div class="modal"><article><button class="modal-close" aria-label="닫기">×</button><span class="pill">${statusName(reservation.status)}</span><h2>${esc(reservation.title)}</h2><dl><div><dt>예매 번호</dt><dd>${esc(reservation.reservation_no)}</dd></div><div><dt>공연 일시</dt><dd>${date(reservation.start_at)}</dd></div><div><dt>결제 금액</dt><dd>${won(reservation.total_amount)}</dd></div>${answers}</dl>${canShowQr && verifyUrl ? `<img class="qr-image" src="${qrImageUrl(verifyUrl)}" alt="예매 정보 확인 QR코드"><small class="qr-token">공연장 입구에서 이 QR코드를 제시해 주세요.<br>스태프가 예매 정보를 확인한 후 입장을 안내합니다.</small>` : `<div class="notice"><b>QR 발행 대기 중</b><span>입금 확인 후 이곳에 예매 정보 확인 QR이 표시됩니다.</span></div>`}</article></div>`);
    $('.modal-close').addEventListener('click', () => { history.replaceState(null, '', '/mypage.html'); $('.modal').remove(); });
    $('.modal').addEventListener('click', event => { if (event.target === event.currentTarget) $('.modal-close').click(); });
  } catch (error) { alert(error.message); }
}

function qrImageUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(value)}`;
}

function verifyTokenFromPath() {
  const match = location.pathname.match(/^\/tickets\/verify\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function verifyStatusInfo(status) {
  if (status === 'CANCELLED') return { className: 'danger', label: '취소된 예매입니다.', help: '입장 전 확인이 필요합니다.' };
  if (status === 'PAID' || status === 'USED') return { className: 'ok', label: '예매 완료', help: '입장 확인 가능' };
  return { className: 'warning', label: statusName(status), help: '입장 전 확인이 필요합니다.' };
}

async function verifyTicket() {
  const root = $('#ticket-verify');
  const token = verifyTokenFromPath();
  if (!token) {
    root.innerHTML = verifyErrorHtml('유효하지 않은 예매 정보입니다.', 'QR코드를 다시 확인해 주세요.');
    return;
  }
  try {
    const ticket = await api(`/api/tickets/verify/${encodeURIComponent(token)}`);
    const status = verifyStatusInfo(ticket.bookingStatus);
    document.title = CURRENT_LANGUAGE === 'en' ? `${ticket.performanceTitle} booking verification — Live Pocket ${APP_VERSION}` : `${ticket.performanceTitle} 예매 정보 확인 — Live Pocket ${APP_VERSION}`;
    root.innerHTML = `<section class="verify-card ${status.className}">
      <div class="verify-top"><span class="kicker">TICKET VERIFY</span><strong>${esc(status.label)}</strong><small>${esc(status.help)}</small></div>
      <h1>${esc(ticket.performanceTitle)}</h1>
      <div class="verify-count"><span>티켓 수량</span><b>${Number(ticket.ticketCount || 0)}매</b></div>
      <dl class="verify-list">
        <div><dt>공연 일시</dt><dd>${fullDate(ticket.performanceDate)}</dd></div>
        <div><dt>공연 장소</dt><dd>${esc(ticket.venue)}</dd></div>
        <div><dt>예매자명</dt><dd>${esc(ticket.bookerName)}</dd></div>
        <div><dt>연락처</dt><dd>${esc(ticket.maskedPhone)}</dd></div>
        <div><dt>예매번호</dt><dd>${esc(ticket.bookingNumber)}</dd></div>
        <div><dt>예매 상태</dt><dd>${esc(statusName(ticket.bookingStatus))}</dd></div>
      </dl>
      <p class="verify-note">이 화면은 예매 정보 확인 전용입니다. 페이지를 열어도 입장 처리나 상태 변경은 일어나지 않습니다.</p>
    </section>`;
  } catch (error) {
    const performanceMissing = /공연 정보/.test(error.message);
    root.innerHTML = verifyErrorHtml(performanceMissing ? '공연 정보를 찾을 수 없습니다.' : '유효하지 않은 예매 정보입니다.', performanceMissing ? '공연이 삭제되었거나 조회할 수 없습니다.' : 'QR코드를 다시 확인해 주세요.');
  }
}

function verifyErrorHtml(title, message) {
  return `<section class="verify-card invalid"><div class="verify-top"><span class="kicker">TICKET VERIFY</span><strong>${esc(title)}</strong><small>${esc(message)}</small></div><p class="verify-note">문제가 계속되면 공연장 스태프에게 예매번호 또는 예매자 정보를 알려 주세요.</p></section>`;
}

function performanceTable(performances) {
  if (!performances.length) return '<div class="empty">등록된 공연이 없습니다.</div>';
  return `<div class="show-management-list">${performances.map(item => {
    const state = bookingState(item);
    const sold = Number(item.total || 0) - Number(item.remaining || 0);
    return `<article class="show-management-card"><a class="show-management-main" href="/performances/${item.id}"><img src="${esc(posterUrl(item.poster_url, 'thumb'))}" alt="" loading="lazy" decoding="async"><span><b>${esc(item.title)}</b><small>${date(item.start_at)} · ${esc(item.venue_name || '')}</small></span></a><div class="show-management-meta"><span>판매 <b>${sold}/${Number(item.total || 0)}</b></span><span><i class="favorite-icon" aria-hidden="true">♥</i> <b>${Number(item.favorite_count || 0)}</b></span><span class="pill state-${state.key}">${state.label}</span></div><div class="row-actions"><button class="tiny" data-show-stats="${item.id}" type="button">현황</button><a class="tiny secondary" href="/performance-form.html?id=${item.id}">수정</a><a class="tiny secondary" href="/api/admin/performances/${item.id}/reservations.csv" download="performance-${item.id}-reservations.csv">엑셀</a><button class="tiny danger" data-show-delete="${item.id}" type="button">삭제</button></div></article>`;
  }).join('')}</div>`;
}

function chartMarkup(data) {
  const buttons = [`<button class="active" type="button" data-chart-performance="all">모두</button>`, ...data.performances.map(item => `<button type="button" data-chart-performance="${item.id}">${esc(item.title)}</button>`)].join('');
  return `<div class="admin-card dashboard-chart"><div class="panel-title"><div><h2>예매율 · 찜 추이</h2><p>x축 날짜 · y축 수치</p></div></div><div class="chart-filter">${buttons}</div><div id="metrics-chart" class="metrics-chart"></div><div class="chart-legend"><span><i class="booking"></i>예매율 (%)</span><span><i class="favorite"></i>찜 횟수</span></div><script type="application/json" id="chart-data">${JSON.stringify(data.chart).replace(/</g, '\\u003c')}</script></div>`;
}

function renderMetricsChart(key = 'all') {
  const source = JSON.parse($('#chart-data')?.textContent || '{}');
  const rows = source[key] || [];
  const root = $('#metrics-chart');
  if (!root || !rows.length) return;
  const width = 760, height = 300, left = 44, right = 18, top = 20, bottom = 44;
  const maxFavorite = Math.max(1, ...rows.map(row => Number(row.favorites)));
  const x = index => left + index * (width - left - right) / Math.max(1, rows.length - 1);
  const yBooking = value => top + (100 - Number(value)) * (height - top - bottom) / 100;
  const yFavorite = value => top + (maxFavorite - Number(value)) * (height - top - bottom) / maxFavorite;
  const points = (field, scale) => rows.map((row, index) => `${x(index)},${scale(row[field])}`).join(' ');
  root.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="예매율과 찜 횟수 추이 그래프">
    ${[0, 25, 50, 75, 100].map(value => `<line x1="${left}" y1="${yBooking(value)}" x2="${width - right}" y2="${yBooking(value)}" class="grid-line"/><text x="${left - 8}" y="${yBooking(value) + 4}" text-anchor="end">${value}</text>`).join('')}
    <polyline class="chart-line booking" points="${points('bookingRate', yBooking)}"/><polyline class="chart-line favorite" points="${points('favorites', yFavorite)}"/>
    ${rows.map((row, index) => `<text x="${x(index)}" y="${height - 15}" text-anchor="middle">${esc(row.date.slice(5))}</text>`).join('')}
  </svg>`;
}

async function adminPage(user, superAdmin) {
  const data = superAdmin ? await api('/api/super-admin/dashboard') : await api('/api/admin/dashboard');
  const nav = superAdmin
    ? [['dashboard', '플랫폼 대시보드'], ['members', '회원 관리'], ['shows', '전체 공연'], ['reservations', '전체 예매'], ['settings', '배너 설정']]
    : [['dashboard', '공연 대시보드'], ['shows', '공연 관리'], ['reservations', '예매자 관리'], ['profile', '관리자 정보']];
  $('#mypage').classList.add('admin-page');
  $('#mypage').innerHTML = `<aside class="admin-side"><a class="brand" href="/"><b>LP</b><strong>Live Pocket</strong><em>${APP_VERSION}</em></a><span>${superAdmin ? '총 관리자' : '공연 관리자'}</span><nav>${nav.map((item, index) => `<button class="${index ? '' : 'active'}" data-admin-tab="${item[0]}" type="button">${item[1]}</button>`).join('')}</nav><button class="logout" type="button">↗ 로그아웃</button></aside><section class="admin-main"><header><div><small>${superAdmin ? 'PLATFORM ADMIN' : 'PERFORMANCE MANAGER'}</small><h1>${superAdmin ? '플랫폼 운영' : '공연 관리'}</h1></div><div class="admin-user"><i>${esc(user.name[0])}</i><span>${esc(user.name)}<small>${esc(user.email)}</small></span></div></header><div id="admin-panels"></div></section>`;
  const root = $('#admin-panels');
  root.innerHTML = superAdmin ? superPanels(data) : managerPanels(data);
  const requestedTab = location.hash.replace('#', '');
  const initialTab = nav.some(item => item[0] === requestedTab) ? requestedTab : nav[0][0];
  $$('[data-admin-panel]', root).forEach(panel => panel.classList.toggle('active', panel.dataset.adminPanel === initialTab));
  $$('[data-admin-tab]').forEach(button => button.classList.toggle('active', button.dataset.adminTab === initialTab));
  $$('[data-admin-tab]').forEach(button => button.addEventListener('click', () => {
    $$('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === button));
    $$('[data-admin-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.adminPanel === button.dataset.adminTab));
    history.replaceState(null, '', `${location.pathname}#${button.dataset.adminTab}`);
  }));
  bindLogout();
  bindAdminActions();
  bindShowActions();
  bindBannerActions();
  if (!superAdmin) {
    renderMetricsChart();
    $$('[data-chart-performance]').forEach(button => button.addEventListener('click', () => {
      $$('[data-chart-performance]').forEach(item => item.classList.toggle('active', item === button));
      renderMetricsChart(button.dataset.chartPerformance);
    }));
  }
}

function table(headers, rows) {
  return `<div class="table"><table><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">데이터가 없습니다.</td></tr>`}</tbody></table></div>`;
}

function managerPanels(data) {
  const summary = data.stats;
  return `<section data-admin-panel="dashboard">${stats([['운영 공연', summary.performances || 0], ['전체 예매', summary.reservations || 0], ['전체 찜', summary.favorites || 0], ['예매 금액', won(summary.revenue)]])}${chartMarkup(data)}</section>
    <section data-admin-panel="shows"><div class="panel-title"><div><h2>공연 관리</h2><p>담당 공연을 등록·수정하고 판매 현황을 확인합니다.</p></div><a class="btn primary" href="/performance-form.html">+ 공연 등록</a></div>${performanceTable(data.performances)}</section>
    <section data-admin-panel="reservations"><div class="panel-title"><div><h2>예매자 관리</h2><p>입금 확인과 예매 상태를 처리합니다.</p></div></div><div id="admin-reservations" class="loading">불러오는 중…</div></section>
    <section data-admin-panel="profile"><div class="admin-card"><h2>관리자 정보</h2><dl><div><dt>이름</dt><dd>${esc(me.name)}</dd></div><div><dt>이메일</dt><dd>${esc(me.email)}</dd></div><div><dt>권한</dt><dd>공연 관리자</dd></div></dl></div></section>`;
}

function memberRoleLabel(item) {
  if (item.role === 'SUPER_ADMIN') return '총 관리자';
  return Number(item.has_performances) ? '공연 등록 회원' : '일반 회원';
}

function superPanels(data) {
  const memberRows = data.members.map(item => {
    const actions = item.role === 'SUPER_ADMIN' ? '—' : `<div class="row-actions"><button class="tiny secondary" data-user-edit="${item.id}" type="button">수정</button><button class="tiny danger" data-user-delete="${item.id}" type="button">삭제</button></div>`;
    return `<tr><td><b>${esc(item.name)}</b></td><td>${esc(item.email)}</td><td>${memberRoleLabel(item)}</td><td><span class="pill">${esc(item.status)}</span></td><td>${actions}</td></tr>`;
  }).join('');
  return `<section data-admin-panel="dashboard"><div class="compact-stats">${stats([['전체 회원', data.users], ['전체 공연', data.performances], ['전체 예매', data.reservations], ['전체 찜', data.favorites]])}</div></section>
    <section data-admin-panel="members"><div class="panel-title"><div><h2>회원 관리</h2><p>공연 등록 경험과 계정 상태를 확인합니다.</p></div></div>${table(['회원', '이메일', '구분', '상태', '관리'], memberRows)}</section>
    <section data-admin-panel="shows"><div class="panel-title"><div><h2>전체 공연 관리</h2><p>플랫폼에 등록된 공연을 관리합니다.</p></div><a class="btn primary" href="/performance-form.html">+ 공연 등록</a></div>${performanceTable(data.performanceList)}</section>
    <section data-admin-panel="reservations"><div class="panel-title"><div><h2>전체 예매 관리</h2></div></div><div id="admin-reservations" class="loading">불러오는 중…</div></section>
    <section data-admin-panel="settings"><div class="panel-title"><div><h2>배너 설정</h2><p>홈 롤링 배너의 내용과 노출 순서를 관리합니다.</p></div><button class="btn primary" type="button" data-banner-create>+ 신규 배너</button></div><div class="banner-admin" data-banner-list>${data.banners.map(banner => `<article draggable="true" data-banner-id="${banner.id}"><button class="drag-handle" type="button" aria-label="배너 순서 이동">☰</button><img src="${esc(banner.image_url)}" alt=""><div><b>${esc(banner.title)}</b><small>순서 ${banner.sort_order} · ${banner.is_active ? '노출 중' : '숨김'}</small></div><div class="row-actions"><button class="tiny secondary" type="button" data-banner-edit="${banner.id}">수정</button><button class="tiny danger" type="button" data-banner-delete="${banner.id}">삭제</button></div></article>`).join('')}</div></section>`;
}
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToBannerDataUrl(file) {
  const source = await fileToDataUrl(file);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const width = 1920;
      const height = 600;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(width / img.width, height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = () => resolve(source);
    img.src = source;
  });
}

async function cropImageFile(file, width, height, round = false) {
  const source = await fileToDataUrl(file);
  return new Promise(resolve => {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal crop-modal ${round ? '' : 'poster-crop-modal'}"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">IMAGE EDIT</span><h2>이미지 편집</h2><div class="crop-stage ${round ? 'round' : 'poster'}"><canvas width="${width}" height="${height}"></canvas></div><label>확대/축소<input type="range" min="1" max="3" step="0.01" value="1"></label><button class="btn primary" type="button" data-crop-apply>적용</button></article></div>`);
    const modal = $('.crop-modal');
    const canvas = $('canvas', modal);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    let offsetX = 0;
    let offsetY = 0;
    let drag = null;
    const draw = () => {
      const zoom = Number($('input[type="range"]', modal).value);
      const scale = (round ? Math.max(width / img.width, height / img.height) : Math.min(width / img.width, height / img.height)) * zoom;
      const w = img.width * scale;
      const h = img.height * scale;
      const maxX = Math.max(0, (w - width) / 2);
      const maxY = Math.max(0, (h - height) / 2);
      offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
      offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, (width - w) / 2 + offsetX, (height - h) / 2 + offsetY, w, h);
    };
    img.onload = draw;
    img.src = source;
    $('input[type="range"]', modal).addEventListener('input', draw);
    canvas.addEventListener('pointerdown', event => {
      drag = { x: event.clientX, y: event.clientY, offsetX, offsetY };
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!drag) return;
      offsetX = drag.offsetX + event.clientX - drag.x;
      offsetY = drag.offsetY + event.clientY - drag.y;
      draw();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('pointercancel', () => { drag = null; });
    $('.modal-close', modal).addEventListener('click', () => { modal.remove(); resolve(source); });
    $('[data-crop-apply]', modal).addEventListener('click', () => {
      let result = round ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.84);
      if (round) {
        const masked = document.createElement('canvas');
        masked.width = width;
        masked.height = height;
        const maskedCtx = masked.getContext('2d');
        maskedCtx.beginPath();
        maskedCtx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        maskedCtx.clip();
        maskedCtx.drawImage(canvas, 0, 0);
        result = masked.toDataURL('image/png');
      }
      modal.remove();
      resolve(result);
    });
  });
}

async function openArtistAddModal(form, editIndex = null) {
  const editing = Number.isInteger(editIndex);
  const entries = artistEntries(form.artists.value, form.artist_avatar_url.value);
  const currentEntry = editing ? entries[editIndex] : null;
  const knownArtists = await api('/api/artists').catch(() => []);
  document.body.insertAdjacentHTML('beforeend', `<div class="modal artist-add-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">ARTIST</span><h2>${editing ? '아티스트 수정' : '아티스트 추가'}</h2><form class="stack"><label class="autocomplete-field">아티스트명<input name="artist_name" autocomplete="off" required value="${esc(currentEntry?.name || '')}"><div class="artist-suggestions hidden" data-artist-suggestions></div></label><label>SNS 링크 (선택)<input type="url" name="artist_sns_url" inputmode="url" placeholder="https://instagram.com/artist" value="${esc(currentEntry?.snsUrl || '')}"></label><label>유튜브 링크 (선택)<input type="url" name="artist_youtube_url" inputmode="url" placeholder="https://youtube.com/@artist" value="${esc(currentEntry?.youtubeUrl || '')}"></label><label class="file-field">아티스트 이미지<input type="file" name="artist_image" accept="image/*"><small>${editing ? '이미지를 선택하지 않으면 기존 이미지를 유지합니다.' : '기존 아티스트를 선택하면 등록된 이미지와 링크를 재사용합니다.'}</small></label><button class="btn primary" type="submit">${editing ? '수정 저장' : '추가'}</button></form></article></div>`);
  const modal = $('.artist-add-modal');
  const artistInput = $('[name=artist_name]', modal);
  const suggestions = $('[data-artist-suggestions]', modal);
  let selectedArtist = currentEntry ? knownArtists.find(item => item.name.toLowerCase() === currentEntry.name.toLowerCase()) || null : null;
  const renderSuggestions = () => {
    const query = artistInput.value.trim().toLowerCase();
    selectedArtist = knownArtists.find(item => item.name.toLowerCase() === query) || null;
    const used = new Set(artistEntries(form.artists.value, form.artist_avatar_url.value).map((item, index) => index === editIndex ? '' : item.name.toLowerCase()));
    const matches = knownArtists.filter(item => query && item.name.toLowerCase().includes(query) && !used.has(item.name.toLowerCase())).slice(0, 6);
    suggestions.innerHTML = matches.map(item => `<button type="button" data-artist-pick="${esc(item.name)}"><img src="${esc(item.avatar)}" alt=""><span>${esc(item.name)}</span><small>${Number(item.performanceCount || 0)}회 등록</small></button>`).join('');
    suggestions.classList.toggle('hidden', !matches.length);
  };
  $('.modal-close', modal).addEventListener('click', () => modal.remove());
  artistInput.addEventListener('input', renderSuggestions);
  artistInput.addEventListener('focus', renderSuggestions);
  suggestions.addEventListener('click', event => {
    const button = event.target.closest('[data-artist-pick]');
    if (!button) return;
    selectedArtist = knownArtists.find(item => item.name === button.dataset.artistPick) || null;
    artistInput.value = selectedArtist?.name || button.dataset.artistPick;
    const artistModal = event.currentTarget.closest('.modal');
    artistModal.querySelector('[name=artist_sns_url]').value = selectedArtist?.snsUrl || '';
    artistModal.querySelector('[name=artist_youtube_url]').value = selectedArtist?.youtubeUrl || '';
    suggestions.classList.add('hidden');
  });
  modal.addEventListener('click', event => {
    if (!event.target.closest('.autocomplete-field')) suggestions.classList.add('hidden');
  });
  $('form', modal).addEventListener('submit', async event => {
    event.preventDefault();
    const name = String(event.currentTarget.artist_name.value || '').trim();
    const snsUrl = String(event.currentTarget.artist_sns_url.value || '').trim();
    const youtubeUrl = String(event.currentTarget.artist_youtube_url.value || '').trim();
    if (!name) return;
    const file = event.currentTarget.artist_image.files[0];
    const matchedArtist = selectedArtist || knownArtists.find(item => item.name.toLowerCase() === name.toLowerCase());
    const avatar = file ? await cropImageFile(file, 150, 150, true) : matchedArtist?.avatar || currentEntry?.avatar || '/assets/artist-avatar.svg';
    const nextEntries = [...artistEntries(form.artists.value, form.artist_avatar_url.value)];
    const duplicateIndex = nextEntries.findIndex((item, index) => item.name.toLowerCase() === name.toLowerCase() && index !== editIndex);
    const targetIndex = editing ? editIndex : duplicateIndex;
    const nextSnsUrl = editing ? snsUrl : snsUrl || matchedArtist?.snsUrl || '';
    const nextYoutubeUrl = editing ? youtubeUrl : youtubeUrl || matchedArtist?.youtubeUrl || '';
    if (targetIndex >= 0) nextEntries[targetIndex] = { name, avatar, snsUrl: nextSnsUrl, youtubeUrl: nextYoutubeUrl };
    else nextEntries.push({ name, avatar, snsUrl: nextSnsUrl, youtubeUrl: nextYoutubeUrl });
    setArtistEntries(form, nextEntries);
    renderArtistList(form);
    modal.remove();
  });
}

async function setGenreOptions(select, current) {
  const genres = await api('/api/taxonomy/genres').catch(() => []);
  select.innerHTML = genres.map(item => `<option value="${esc(item.name)}">${esc(item.name)}</option>`).join('');
  if (current) select.value = current;
}

function artistChipHtml(item, index) {
  return `<span><img src="${esc(item.avatar)}" alt="">${esc(item.name)}<button type="button" data-artist-edit="${index}" aria-label="${esc(item.name)} 수정">수정</button><button type="button" data-artist-delete="${index}" aria-label="${esc(item.name)} 삭제">삭제</button></span>`;
}

function renderExpandedArtistList(root, entries) {
  root.innerHTML = entries.map(artistChipHtml).join('');
}

function renderArtistList(form) {
  const entries = artistEntries(form.artists.value, form.artist_avatar_url.value);
  const root = $('#artist-list');
  if (!root) return;
  root.classList.remove('expanded');
  if (!entries.length) {
    root.innerHTML = '<small>아티스트 추가 버튼으로 출연진을 등록해 주세요.</small>';
    return;
  }
  renderExpandedArtistList(root, entries);
}

function autoGrowTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function normalizeDateTimeInput(value) {
  const text = String(value || '').trim().replace('T', ' ');
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+09:00` : value;
}

function openGenreModal(select, afterSave) {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal genre-add-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">GENRE</span><h2>장르 추가</h2><form class="stack"><label>장르명<input name="genre_name" required></label><div class="alert error hidden"></div><button class="btn primary" type="submit">추가</button></form></article></div>`);
  const modal = $('.genre-add-modal');
  $('.modal-close', modal).addEventListener('click', () => modal.remove());
  $('form', modal).addEventListener('submit', async event => {
    event.preventDefault();
    const name = String(event.currentTarget.genre_name.value || '').trim();
    if (!name) return;
    try {
      await api('/api/super-admin/genres', { method: 'POST', body: JSON.stringify({ name }) });
      await setGenreOptions(select, name);
      afterSave?.(name);
      modal.remove();
    } catch (error) {
      $('.alert', modal).textContent = error.message;
      $('.alert', modal).classList.remove('hidden');
    }
  });
}

async function openPosterPreview(file) {
  return cropImageFile(file, 520, 694, false);
}

function openAddressSearch(form) {
  const fallback = () => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(form.address.value || form.venue_name.value || '')}`, '_blank', 'noopener');
  if (!window.daum?.Postcode) return fallback();
  new daum.Postcode({
    oncomplete(data) {
      form.address.value = data.roadAddress || data.jibunAddress || '';
      if (!form.venue_name.value) form.venue_name.value = data.buildingName || data.bname || '';
    },
  }).open();
}

const questionTypeOptions = [
  ['select', '셀렉트박스 (단일 선택)'],
  ['short_text', '단답형'],
  ['long_text', '장문형'],
  ['checkbox_single', '체크박스 (단일 선택)'],
  ['checkbox_multiple', '체크박스 (다중 선택)'],
];
const questionOptionRowHtml = option => {
  const item = typeof option === 'object' && option ? option : { option_text: option || '' };
  return `<div class="question-option-row"><div class="localized-option-fields"><div><b class="locale-badge">KO · 국문</b><label>선택지<input name="question_option" value="${esc(item.option_text || '')}" placeholder="선택지 입력"></label><label>선택지 설명<textarea name="question_option_description" placeholder="선택지에 대한 설명을 입력하세요.">${esc(item.description_text || '')}</textarea></label></div><div class="english-field"><b class="locale-badge">EN · English</b><label>Option<input name="question_option_en" value="${esc(item.option_text_en || '')}" placeholder="Enter an option"></label><label>Option description<textarea name="question_option_description_en" placeholder="Enter an optional description.">${esc(item.description_text_en || '')}</textarea></label></div></div><button class="tiny danger" type="button" data-option-remove>삭제</button></div>`;
};
const questionRowHtml = (question = {}) => {
  const type = question.question_type || 'select';
  const options = question.options?.length ? question.options : ['', ''];
  return `<div class="question-row" data-question-row><div class="question-row-head"><div class="localized-fields"><label><span class="default-field-label">질문</span><span class="locale-badge">KO · 국문 질문</span><input name="question_text" value="${esc(question.question_text || '')}" placeholder="예: 뒤풀이에 참석하시나요?" required></label><label class="english-field"><span class="locale-badge">EN · English question</span><input name="question_text_en" value="${esc(question.question_text_en || '')}" placeholder="e.g. Will you join the after-party?"></label></div><label>답변 형식<select name="question_type">${questionTypeOptions.map(([value, label]) => `<option value="${value}" ${value === type ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="question-required"><input type="checkbox" name="question_required" ${question.is_required === false ? '' : 'checked'}> 필수</label><button class="tiny danger" type="button" data-question-remove>질문 삭제</button></div><div class="localized-fields question-description-field"><label><span class="default-field-label">질문 설명 (선택)</span><span class="locale-badge">KO · 국문 설명</span><textarea name="question_description" placeholder="질문에 대한 설명을 입력하세요.">${esc(question.description_text || '')}</textarea></label><label class="english-field"><span class="locale-badge">EN · English description</span><textarea name="question_description_en" placeholder="Enter an optional description.">${esc(question.description_text_en || '')}</textarea></label></div><div class="question-options">${options.map(questionOptionRowHtml).join('')}</div><button class="tiny secondary" type="button" data-option-add>선택지 추가</button></div>`;
};

function showFormHtml(item = {}) {
  const editing = Boolean(item.id);
  const localDate = value => value ? new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '';
  const tickets = item.tickets?.length ? item.tickets : [{ name: '일반 티켓', price: item.price || 0, total_quantity: item.total || 50 }];
  const questions = Array.isArray(item.questions) ? item.questions : [];
  const ticketRow = ticket => `<div class="ticket-row"><label>티켓명<input name="ticket_name" value="${esc(ticket.name || '일반 티켓')}" placeholder="일반 티켓"></label><label>금액<input type="number" name="ticket_price" min="0" value="${ticket.price || 0}" placeholder="금액"></label><label>수량<input type="number" name="ticket_quantity" min="1" value="${ticket.total_quantity || ticket.total || 50}" placeholder="수량"></label><button class="tiny danger" type="button" data-ticket-remove>삭제</button></div>`;
  return `<section class="page-head"><span class="kicker">${editing ? 'EDIT PERFORMANCE' : 'NEW PERFORMANCE'}</span><h1>${editing ? '공연 수정' : '공연 등록'}</h1><p>공연 정보, 티켓, 예매 질문을 한 화면에서 관리합니다.</p></section>
    <section class="show-form-page"><form id="show-form" class="stack">
      <div class="english-fields-control"><button class="tiny secondary" type="button" data-english-toggle aria-pressed="false">Eng 추가</button></div>
      <div class="localized-fields"><label><span class="default-field-label">공연명</span><span class="locale-badge">KO · 국문 공연명</span><input name="title" required value="${esc(item.title || '')}"></label><label class="english-field"><span class="locale-badge">EN · English title</span><input name="title_en" value="${esc(item.title_en || '')}"></label></div>
      <input type="hidden" name="poster_url" value="${esc(item.poster_url || '/assets/poster-1.svg')}"><input type="hidden" name="artist_avatar_url" value="${esc(item.artist_avatar_url || '/assets/artist-avatar.svg')}"><input type="hidden" name="artists" required value="${esc(item.artists || '')}">
      <label>아티스트<div class="artist-list" id="artist-list"></div><button class="tiny secondary" type="button" data-artist-add>아티스트 추가</button></label>
      <div class="localized-fields"><label><span class="default-field-label">공연 소개</span><span class="locale-badge">KO · 국문 공연 소개</span><textarea name="description" required>${esc(item.description || '')}</textarea></label><label class="english-field"><span class="locale-badge">EN · English show description</span><textarea name="description_en">${esc(item.description_en || '')}</textarea></label></div>
      <label class="file-field">포스터 이미지<input type="file" name="poster_file" accept="image/*"><small>이미지 선택 후 포스터 비율에 맞게 확대/축소와 위치를 조정합니다.</small></label>
      <div class="localized-fields venue-form-row"><div class="locale-block"><b class="locale-badge">KO · 국문 공연장 정보</b><label>공연장<input name="venue_name" required value="${esc(item.venue_name || '')}"></label><label>주소<div class="input-action"><input name="address" required value="${esc(item.address || '')}"><button class="tiny secondary" type="button" data-address-search>검색</button></div></label><label class="venue-description-field">공연장 설명 <small>(선택)</small><textarea name="venue_description" placeholder="공연장 위치, 층수, 입장 방법 등을 입력하세요.">${esc(item.venue_description || '')}</textarea></label></div><div class="locale-block english-field"><b class="locale-badge">EN · English venue information</b><label>Venue<input name="venue_name_en" value="${esc(item.venue_name_en || '')}"></label><label>Address<input name="address_en" value="${esc(item.address_en || '')}"></label><label class="venue-description-field">Venue description <small>(optional)</small><textarea name="venue_description_en" placeholder="Enter location, floor, or entry directions.">${esc(item.venue_description_en || '')}</textarea></label></div></div>
      <div class="two"><label>공연 일시<input type="datetime-local" name="start_at" required value="${localDate(item.start_at)}"></label><label>예매 시작<input type="datetime-local" name="booking_start_at" required value="${localDate(item.booking_start_at || new Date().toISOString())}"></label></div>
      <div class="two"><label>예매 마감<input type="datetime-local" name="booking_close_at" required value="${localDate(item.booking_close_at)}"></label><label>1회 최대 구매 수량<input type="number" name="max_tickets_per_order" min="1" max="100" required value="${Number(item.max_tickets_per_order || 4)}"><small>예매자 한 명이 한 번에 구매할 수 있는 최대 티켓 수입니다.</small></label></div>
      <div class="ticket-editor"><b>티켓 설정</b><div id="ticket-rows">${tickets.map(ticketRow).join('')}</div><button class="tiny secondary" type="button" data-ticket-add>티켓 추가</button></div>
      <div class="question-editor"><div><b>예매 추가 질문</b><small>답변 형식과 질문·선택지별 설명을 설정할 수 있습니다.</small></div><div id="question-rows">${questions.map(questionRowHtml).join('')}</div><button class="tiny secondary" type="button" data-question-add>질문 추가</button></div>
      <div class="localized-fields"><label><span class="default-field-label">결제 안내 문구</span><span class="locale-badge">KO · 국문 결제 안내</span><textarea name="deposit_notice" required>${esc(item.deposit_notice || '신청 후 24시간 이내 입금')}</textarea></label><label class="english-field"><span class="locale-badge">EN · English payment information</span><textarea name="deposit_notice_en">${esc(item.deposit_notice_en || '')}</textarea></label></div><div class="localized-fields"><label><span class="default-field-label">환불 규정</span><span class="locale-badge">KO · 국문 환불 규정</span><textarea name="refund_policy" required>${esc(item.refund_policy || '공연 취소 및 환불 규정을 확인해 주세요.')}</textarea></label><label class="english-field"><span class="locale-badge">EN · English refund policy</span><textarea name="refund_policy_en">${esc(item.refund_policy_en || '')}</textarea></label></div>
      <div id="show-form-error" class="alert error hidden"></div><div class="button-row"><a class="btn outline" href="/mypage.html">취소</a><button class="btn primary grow" type="submit">${editing ? '수정 저장' : '공연 등록'}</button></div>
    </form></section>`;
}

async function bindShowForm(item = {}) {
  const editing = Boolean(item.id);
  const form = $('#show-form');
  const syncQuestionRow = row => {
    const usesOptions = !row.querySelector('[name=question_type]').value.includes('text');
    row.classList.toggle('text-question', !usesOptions);
    $$('[name=question_option]', row).forEach(input => { input.required = usesOptions; input.disabled = !usesOptions; });
    $$('[name=question_option_en], [name=question_option_description], [name=question_option_description_en]', row).forEach(input => { input.disabled = !usesOptions; });
    $('[data-option-add]', row).disabled = !usesOptions;
  };
  renderArtistList(form);
  $$('textarea', form).forEach(textarea => autoGrowTextarea(textarea));
  $('[data-english-toggle]', form).addEventListener('click', event => {
    const page = form.closest('.show-form-page');
    const expanded = page.classList.toggle('show-english-fields');
    event.currentTarget.setAttribute('aria-pressed', String(expanded));
    event.currentTarget.textContent = expanded ? 'Eng 닫기' : 'Eng 추가';
    if (expanded) $$('.english-field textarea', form).forEach(textarea => autoGrowTextarea(textarea));
  });
  form.addEventListener('input', event => { if (event.target.matches('textarea')) autoGrowTextarea(event.target); });
  $$('[data-question-row]', form).forEach(syncQuestionRow);
  $('[data-artist-add]').addEventListener('click', () => openArtistAddModal(form));
  $('[data-address-search]').addEventListener('click', () => openAddressSearch(form));
  form.poster_file.addEventListener('change', async event => { if (event.currentTarget.files[0]) form.poster_url.value = await openPosterPreview(event.currentTarget.files[0]); });
  $('[data-ticket-add]').addEventListener('click', () => $('#ticket-rows').insertAdjacentHTML('beforeend', '<div class="ticket-row"><label>티켓명<input name="ticket_name" value="일반 티켓" placeholder="일반 티켓"></label><label>금액<input type="number" name="ticket_price" min="0" value="0" placeholder="금액"></label><label>수량<input type="number" name="ticket_quantity" min="1" value="50" placeholder="수량"></label><button class="tiny danger" type="button" data-ticket-remove>삭제</button></div>'));
  $('[data-question-add]').addEventListener('click', () => { $('#question-rows').insertAdjacentHTML('beforeend', questionRowHtml()); syncQuestionRow($('#question-rows').lastElementChild); });
  $('#artist-list').addEventListener('click', event => {
    const editButton = event.target.closest('[data-artist-edit]');
    const deleteButton = event.target.closest('[data-artist-delete]');
    if (editButton) return openArtistAddModal(form, Number(editButton.dataset.artistEdit));
    if (!deleteButton) return;
    const entries = artistEntries(form.artists.value, form.artist_avatar_url.value);
    entries.splice(Number(deleteButton.dataset.artistDelete), 1);
    setArtistEntries(form, entries);
    renderArtistList(form);
  });
  window.addEventListener('resize', () => renderArtistList(form));
  $('#show-form').addEventListener('click', event => {
    if (event.target.matches('[data-ticket-remove]')) event.target.closest('.ticket-row').remove();
    if (event.target.matches('[data-question-remove]')) event.target.closest('.question-row').remove();
    if (event.target.matches('[data-option-remove]')) event.target.closest('.question-option-row').remove();
    if (event.target.matches('[data-option-add]')) event.target.closest('.question-row').querySelector('.question-options').insertAdjacentHTML('beforeend', questionOptionRowHtml(''));
  });
  $('#show-form').addEventListener('change', event => { if (event.target.matches('[name=question_type]')) syncQuestionRow(event.target.closest('.question-row')); });
  $('#show-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.start_at = normalizeDateTimeInput(payload.start_at);
    payload.booking_start_at = normalizeDateTimeInput(payload.booking_start_at);
    payload.booking_close_at = normalizeDateTimeInput(payload.booking_close_at);
    payload.tickets = $$('.ticket-row', event.currentTarget).map(row => ({
      name: $('[name=ticket_name]', row).value,
      price: $('[name=ticket_price]', row).value,
      total_quantity: $('[name=ticket_quantity]', row).value,
    }));
    payload.questions = $$('.question-row', event.currentTarget).map(row => ({
      question_text: $('[name=question_text]', row).value,
      question_text_en: $('[name=question_text_en]', row).value,
      description_text: $('[name=question_description]', row).value,
      description_text_en: $('[name=question_description_en]', row).value,
      question_type: $('[name=question_type]', row).value,
      is_required: $('[name=question_required]', row).checked,
      options: $$('[name=question_option]', row).map((input, index) => ({ option_text: input.value, option_text_en: $$('[name=question_option_en]', row)[index]?.value || '', description_text: $$('[name=question_option_description]', row)[index]?.value || '', description_text_en: $$('[name=question_option_description_en]', row)[index]?.value || '' })),
    }));
    delete payload.poster_file; delete payload.ticket_name; delete payload.ticket_price; delete payload.ticket_quantity; delete payload.question_text; delete payload.question_text_en; delete payload.question_description; delete payload.question_description_en; delete payload.question_type; delete payload.question_required; delete payload.question_option; delete payload.question_option_en; delete payload.question_option_description; delete payload.question_option_description_en;
    try {
      await api(editing ? `/api/performances/${item.id}` : '/api/performances', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      location.href = '/mypage.html';
    } catch (error) {
      $('#show-form-error').textContent = error.message;
      $('#show-form-error').classList.remove('hidden');
    }
  });
}

async function showFormPage() {
  const user = await loadMe();
  if (!user) {
    $('#performance-form').innerHTML = '<div class="empty">로그인 또는 간편가입 후 공연을 등록할 수 있습니다.</div>';
    showLoginModal(location.href);
    return;
  }
  me = user;
  const id = qs('id');
  const item = id ? await api(`/api/performances/${id}`) : {};
  $('#performance-form').innerHTML = showFormHtml(item);
  await bindShowForm(item);
}

function bindShowActions() {
  $$('[data-show-stats]').forEach(button => button.addEventListener('click', async () => openStatsModal(button.dataset.showStats)));
  $$('[data-show-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm(t('이 공연을 목록에서 삭제할까요? 기존 예매 내역은 보존됩니다.'))) return;
    await api(`/api/performances/${button.dataset.showDelete}`, { method: 'DELETE' });
    location.reload();
  }));
}

async function openStatsModal(id) {
  const data = await api(`/api/admin/performances/${id}/stats`);
  const max = Math.max(1, ...data.daily.map(row => Number(row.reservations)));
  const summary = data.summary || {};
  const reservationRows = data.reservations.length ? data.reservations.map(row => `<article class="stats-reservation-row"><span><b>${esc(row.reservation_no)}</b><small>${esc(row.user_name)} · ${esc(row.email)}</small>${(row.answers || []).map(answer => `<small class="reservation-answer"><b>${esc(answer.question_text)}</b> ${esc(answer.answer_text)}</small>`).join('')}</span><span class="stats-reservation-payment"><strong>${won(row.total_amount)}</strong><em>${statusName(row.status)}</em></span><span>${row.status === 'WAITING_DEPOSIT' ? `<button class="tiny" data-stats-paid="${row.id}" type="button">입금 확인</button>` : '처리 완료'}</span></article>`).join('') : '<div class="empty">아직 예매가 없습니다.</div>';
  document.body.insertAdjacentHTML('beforeend', `<div class="modal stats-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><div class="panel-title"><div><span class="kicker">BOOKING STATUS</span><h2>예매 현황</h2></div></div><div class="compact-stats">${stats([['판매 티켓', `${Number(summary.soldTickets || 0)}/${Number(summary.totalTickets || 0)}매`], ['총 결제 금액', won(summary.totalAmount)], ['입금 확인 금액', won(summary.paidAmount)], ['예매 건수', `${data.reservations.length}건`]])}</div><div class="daily-chart compact">${data.daily.length ? data.daily.map(row => `<div><i style="height:${Math.max(4, Number(row.reservations) / max * 72)}px"></i><small>${esc(row.date.slice(5))}</small><b>${Number(row.reservations)}</b></div>`).join('') : '<p class="empty">아직 예매가 없습니다.</p>'}</div><div class="stats-reservation-list">${reservationRows}</div></article></div>`);
  $('.stats-modal .modal-close').addEventListener('click', () => $('.stats-modal').remove());
  $$('[data-stats-paid]').forEach(button => button.addEventListener('click', async () => {
    await api(`/api/admin/reservations/${button.dataset.statsPaid}`, { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }) });
    $('.stats-modal')?.remove();
    openStatsModal(id);
  }));
}

function normalizeLinkUrl(value) {
  const url = String(value || '').trim();
  if (!url || url.startsWith('/') || url.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url)) return `http://${url}`;
  return `https://${url}`;
}

function openBannerForm(item = {}) {
  const editing = Boolean(item.id);
  document.body.insertAdjacentHTML('beforeend', `<div class="modal form-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">${editing ? 'EDIT BANNER' : 'NEW BANNER'}</span><h2>${editing ? '배너 수정' : '신규 배너'}</h2><form id="banner-form" class="stack"><label>관리용 제목<input name="title" required value="${esc(item.title || '')}"></label><label>보조 설명<input name="subtitle" value="${esc(item.subtitle || '')}"></label><input type="hidden" name="image_url" required value="${esc(item.image_url || '/assets/banner-1.svg')}"><label>배너 이미지<input type="file" name="banner_file" accept="image/*"><small>권장 크기: 1920x600px, 넓은 가로형 이미지</small></label><label>연결 URL<input name="link_url" required value="${esc(item.link_url || '/')}"></label><div class="two"><label>노출 순서<input type="number" name="sort_order" min="0" value="${item.sort_order ?? 0}"></label><label class="check-label"><input type="checkbox" name="is_active" ${item.is_active === 0 ? '' : 'checked'}> 노출하기</label></div><div id="banner-form-error" class="alert error hidden"></div><button class="btn primary" type="submit">${editing ? '수정 저장' : '배너 추가'}</button></form></article></div>`);
  $('.modal-close').addEventListener('click', () => $('.modal').remove());
  $('#banner-form').banner_file.addEventListener('change', async event => { if (event.currentTarget.files[0]) $('#banner-form').image_url.value = await fileToBannerDataUrl(event.currentTarget.files[0]); });
  $('#banner-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.link_url = normalizeLinkUrl(payload.link_url);
    payload.is_active = event.currentTarget.is_active.checked ? 1 : 0;
    delete payload.banner_file;
    try {
      await api(editing ? `/api/super-admin/banners/${item.id}` : '/api/super-admin/banners', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      localStorage.setItem(BANNER_CACHE_KEY, String(Date.now()));
      location.reload();
    } catch (error) {
      $('#banner-form-error').textContent = error.message;
      $('#banner-form-error').classList.remove('hidden');
    }
  });
}

function bindBannerActions() {
  $('[data-banner-create]')?.addEventListener('click', () => openBannerForm());
  $$('[data-banner-edit]').forEach(button => button.addEventListener('click', async () => openBannerForm(await api(`/api/super-admin/banners/${button.dataset.bannerEdit}`))));
  $$('[data-banner-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm(t('이 배너를 삭제할까요? 홈 화면에서도 더 이상 노출되지 않습니다.'))) return;
    await api(`/api/super-admin/banners/${button.dataset.bannerDelete}`, { method: 'DELETE' });
    location.assign('/mypage.html#settings');
  }));
  const bannerList = $('[data-banner-list]');
  let draggedBanner = null;
  if (bannerList) {
    bannerList.addEventListener('dragstart', event => {
      draggedBanner = event.target.closest('[data-banner-id]');
      event.dataTransfer.effectAllowed = 'move';
      draggedBanner?.classList.add('dragging');
    });
    bannerList.addEventListener('dragover', event => {
      event.preventDefault();
      const target = event.target.closest('[data-banner-id]');
      if (!target || target === draggedBanner) return;
      const after = event.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2;
      bannerList.insertBefore(draggedBanner, after ? target.nextSibling : target);
    });
    bannerList.addEventListener('dragend', async () => {
      draggedBanner?.classList.remove('dragging');
      draggedBanner = null;
      const ids = $$('[data-banner-id]', bannerList).map(item => Number(item.dataset.bannerId));
      await api('/api/super-admin/banners/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) });
      location.assign('/mypage.html#settings');
    });
  }
  $('[data-genre-create]')?.addEventListener('click', async () => {
    const select = document.createElement('select');
    openGenreModal(select, () => location.assign('/mypage.html#settings'));
  });
  $$('[data-genre-edit]').forEach(button => button.addEventListener('click', async () => {
    const name = prompt(t('수정할 장르명을 입력해 주세요.'), button.parentElement.firstChild.textContent.trim());
    if (!name) return;
    await api(`/api/super-admin/genres/${button.dataset.genreEdit}`, { method: 'PATCH', body: JSON.stringify({ name, is_active: 1 }) });
    location.reload();
  }));
  $$('[data-genre-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm(t('이 장르를 목록에서 삭제할까요?'))) return;
    await api(`/api/super-admin/genres/${button.dataset.genreDelete}`, { method: 'DELETE' });
    location.reload();
  }));
  $$('[data-user-edit]').forEach(button => button.addEventListener('click', async () => {
    const row = button.closest('tr');
    document.body.insertAdjacentHTML('beforeend', `<div class="modal form-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">MEMBER</span><h2>회원 수정</h2><form id="user-edit-form" class="stack"><label>회원 이름<input name="name" required value="${esc(row.children[0].innerText.trim())}"></label><label>새 비밀번호<input type="password" name="password" minlength="8" placeholder="변경하지 않으려면 비워두세요"><small>8자 이상, 영문과 숫자를 함께 입력해 주세요.</small></label><div id="user-edit-error" class="alert error hidden"></div><button class="btn primary" type="submit">저장</button></form></article></div>`);
    $('.modal-close').addEventListener('click', () => $('.modal').remove());
    $('#user-edit-form').addEventListener('submit', async event => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.currentTarget));
      if (!payload.password) delete payload.password;
      try {
        await api(`/api/super-admin/users/${button.dataset.userEdit}`, { method: 'PATCH', body: JSON.stringify(payload) });
        location.assign('/mypage.html#members');
      } catch (error) {
        $('#user-edit-error').textContent = error.message;
        $('#user-edit-error').classList.remove('hidden');
      }
    });
  }));
  $$('[data-user-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm(t('해당 회원을 삭제 상태로 변경할까요?'))) return;
    await api(`/api/super-admin/users/${button.dataset.userDelete}`, { method: 'DELETE' });
    location.assign('/mypage.html#members');
  }));
}

async function bindAdminActions() {
  if ($('#admin-reservations')) {
    const rows = await api('/api/admin/reservations');
    $('#admin-reservations').innerHTML = table(['예매번호', '공연 / 예매자', '추가 답변', '금액', '상태', '처리'], rows.map(reservation => `<tr><td>${esc(reservation.reservation_no)}</td><td><b>${esc(reservation.title)}</b><small>${esc(reservation.user_name)}</small></td><td>${(reservation.answers || []).length ? reservation.answers.map(answer => `<small class="reservation-answer"><b>${esc(answer.question_text)}</b><br>${esc(answer.answer_text)}</small>`).join('') : '—'}</td><td>${won(reservation.total_amount)}</td><td>${statusName(reservation.status)}</td><td>${reservation.status === 'WAITING_DEPOSIT' ? `<button class="tiny" data-paid="${reservation.id}">입금 확인</button>` : '—'}</td></tr>`).join(''));
    $$('[data-paid]').forEach(button => button.addEventListener('click', async () => {
      await api(`/api/admin/reservations/${button.dataset.paid}`, { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }) });
      button.closest('tr').children[4].textContent = '결제 완료';
      button.remove();
    }));
  }
}

function bindTabs() {
  $$('[data-tab]').forEach(button => button.addEventListener('click', () => {
    $$('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
    $$('[data-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab));
  }));
}
function bindLogout() { $$('.logout').forEach(button => button.addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; })); }

async function login() {
  const error = qs('error');
    const destination = () => {
      const next = qs('next');
      if (!next) return '/mypage.html';
      try { const target = new URL(next, location.origin); return target.origin === location.origin ? `${target.pathname}${target.search}${target.hash}` : '/mypage.html'; }
      catch { return '/mypage.html'; }
    };
    $$('[data-auth-tab]').forEach(button => button.addEventListener('click', () => {
      $$('[data-auth-tab]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); });
      $$('[data-auth-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.authPanel !== button.dataset.authTab));
      $('#auth-error').classList.add('hidden');
    }));
    const submitMemberAuth = (selector, path) => {
      const form = $(selector);
      if (!form) return;
      form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('button[type="submit"]', event.currentTarget);
      button.disabled = true;
      try {
        const payload = Object.fromEntries(new FormData(event.currentTarget));
        await api(path, { method: 'POST', body: JSON.stringify(payload) });
        location.href = destination();
      } catch (submitError) {
        $('#auth-error').textContent = submitError.message;
        $('#auth-error').classList.remove('hidden');
        button.disabled = false;
      }
      });
    };
    submitMemberAuth('#member-login', '/api/auth/login');
    submitMemberAuth('#member-signup', '/api/auth/register');
    if (qs('tab') === 'signup') $('[data-auth-tab="signup"]')?.click();
  if (error) { $('#auth-error').textContent = error; $('#auth-error').classList.remove('hidden'); }
  $('#admin-login')?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('button', event.currentTarget);
    button.disabled = true;
    try {
      await api('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      location.href = '/mypage.html';
    } catch (submitError) {
      $('#auth-error').textContent = submitError.message;
      $('#auth-error').classList.remove('hidden');
      button.disabled = false;
    }
  });
}

initI18n();
shell();
({ home, detail, booking, complete, mypage, login, showFormPage, verifyTicket }[document.body.dataset.page] || (() => {}))().catch(error => {
  console.error(error);
  const main = $('main');
  if (main) main.innerHTML = `<div class="wrap"><div class="alert error">${esc(error.message)}</div></div>`;
});
