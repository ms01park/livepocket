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
const won = value => `${Number(value || 0).toLocaleString('ko-KR')}원`;
const date = value => new Intl.DateTimeFormat('ko-KR', {
  month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const fullDate = value => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const qs = name => new URLSearchParams(location.search).get(name);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[char]);
const APP_VERSION = 'V2.7';
let me = null;

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
        <a href="/#performances">공연 찾기</a>
        <a href="/mypage.html">마이페이지</a>
        <a id="auth-link" href="/login.html">로그인</a>
      </nav>
      <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="false"><span aria-hidden="true"></span></button>
      <button class="menu" type="button" aria-label="메뉴">☰</button>
    </div>`;
    applyTheme(localStorage.getItem('lp-theme') || 'light');
  }
  const footer = $('#footer');
  if (footer) footer.innerHTML = `<div class="footer-wrap"><a class="brand light" href="/"><b>LP</b><strong>Live Pocket</strong><em>${APP_VERSION}</em></a><p>작은 무대의 큰 순간을 가장 가까이에서.</p><small>© 2026 Live Pocket ${APP_VERSION}. All rights reserved.</small></div>`;
  $('.menu')?.addEventListener('click', () => $('#header nav').classList.toggle('open'));
  $('#theme-toggle')?.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  api('/api/me').then(({ user }) => {
    me = user;
    const auth = $('#auth-link');
    if (!auth || !user) return;
    auth.textContent = '로그아웃';
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
  if (performance.is_popular) labels.push({ label: '인기 공연', className: 'secondary' });
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

const card = performance => `<article class="show-card"><a href="/concert-detail.html?id=${performance.id}">
  <div class="poster-wrap"><img src="${esc(performance.poster_url)}" alt="${esc(performance.title)} 포스터"><div class="show-badges">${availabilityBadges(performance)}</div><span class="genre-badge">${esc(performance.genre)}</span></div>
  <div class="show-info"><small class="show-date">${date(performance.start_at)}</small><h3>${esc(performance.title)}</h3><p title="${esc(performance.artists)}">${esc(compactArtistLabel(performance.artists))}</p>
  <div><span>${esc(performance.venue_name)}</span><strong>${won(performance.price)}~</strong></div>
  <div class="show-metrics"><span>남은 티켓 <b>${Number(performance.remaining || 0)}매</b></span><span>찜 <b>${Number(performance.favorite_count || 0)}</b></span></div></div>
</a></article>`;

function markPopular(performances) {
  const ranked = [...performances].sort((a, b) => Number(b.favorite_count) - Number(a.favorite_count) || Number(a.id) - Number(b.id));
  const count = Math.max(1, Math.ceil(performances.length * 0.1));
  const ids = new Set(ranked.slice(0, count).filter(item => Number(item.favorite_count) > 0).map(item => item.id));
  performances.forEach(item => { item.is_popular = ids.has(item.id); });
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
  const [banners, performances] = await Promise.all([api('/api/banners'), api('/api/performances')]);
  markPopular(performances);
  const hero = $('#hero');
  if (banners.length) {
    hero.innerHTML = `<div class="hero-stage">${banners.map((banner, index) => {
      const href = normalizeLinkUrl(banner.link_url);
      const external = /^https?:\/\//i.test(href) && !href.startsWith(location.origin);
      return `<a class="hero-slide ${index ? '' : 'active'}" href="${esc(href)}" ${external ? 'target="_blank" rel="noopener"' : ''} aria-label="${esc(banner.title)}"><img src="${esc(banner.image_url)}" alt="${esc(banner.title)}"></a>`;
    }).join('')}
      <button class="hero-arrow prev" type="button" data-hero-prev aria-label="이전 배너">‹</button><button class="hero-arrow next" type="button" data-hero-next aria-label="다음 배너">›</button>
      <div class="hero-dots">${banners.map((_, index) => `<button class="${index ? '' : 'active'}" type="button" aria-label="${index + 1}번 배너"></button>`).join('')}</div></div>`;
    bindHero(hero, banners);
  } else hero.innerHTML = '<div class="empty">노출 중인 배너가 없습니다.</div>';

  const render = list => {
    $('#performance-grid').innerHTML = list.length ? list.map(card).join('') : '<div class="empty">조건에 맞는 공연이 없습니다.</div>';
  };
  const runSearch = () => {
    const form = $('#filters');
    const data = new FormData(form);
    const query = String(data.get('q') || '').trim().toLowerCase();
    const scope = String(data.get('scope') || 'all');
    const sort = String(data.get('sort') || 'date-asc');
    const bookableOnly = data.get('bookable') === 'on';
    const fields = {
      all: item => `${item.title} ${item.artists} ${item.genre} ${item.venue_name} ${item.host_name || ''}`,
      genre: item => item.genre,
      venue: item => item.venue_name,
      artist: item => item.artists,
      host: item => item.host_name || '',
      title: item => item.title,
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
  render(performances);
}

function calendarLinks(performance) {
  const start = new Date(performance.start_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const details = `${performance.title}\n${performance.venue_name}\n${performance.address}`;
  const google = new URL('https://calendar.google.com/calendar/render');
  google.search = new URLSearchParams({ action: 'TEMPLATE', text: performance.title, dates: `${stamp(start)}/${stamp(end)}`, details, location: `${performance.venue_name} ${performance.address}` });
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Live Pocket//${APP_VERSION}//KO\nBEGIN:VEVENT\nUID:performance-${performance.id}@livepocket\nDTSTAMP:${stamp(new Date())}\nDTSTART:${stamp(start)}\nDTEND:${stamp(end)}\nSUMMARY:${performance.title}\nLOCATION:${performance.venue_name} ${performance.address}\nDESCRIPTION:${performance.description.replace(/\n/g, ' ')}\nEND:VEVENT\nEND:VCALENDAR`;
  return { google: google.toString(), ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}

function mapLinks(performance) {
  const destination = String(performance.address || performance.venue_name || '').trim();
  return {
    naver: `https://map.naver.com/v5/search/${encodeURIComponent(destination)}`,
    kakao: `https://map.kakao.com/link/search/${encodeURIComponent(destination)}`,
  };
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
  return names.map((name, index) => ({ name, avatar: avatars[index]?.avatar || avatars.find(item => item.name === name)?.avatar || '/assets/artist-avatar.svg' }));
}

function setArtistEntries(form, entries) {
  form.artists.value = entries.map(item => item.name).join(', ');
  form.artist_avatar_url.value = JSON.stringify(entries.map(item => ({ name: item.name, avatar: item.avatar || '/assets/artist-avatar.svg' })));
}

function artistCredits(performance) {
  return artistEntries(performance.artists, performance.artist_avatar_url).map(item => (
    `<span><img src="${esc(item.avatar)}" alt="">${esc(item.name)}</span>`
  )).join('');
}

function showLoginModal(next = location.href) {
  $('.login-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal login-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">LOGIN REQUIRED</span><h2>로그인이 필요합니다</h2><p>계속 진행하려면 로그인해 주세요.</p><form id="modal-login" class="stack"><label>이메일<input type="email" name="email" autocomplete="username" required></label><label>비밀번호<input type="password" name="password" autocomplete="current-password" required></label><div id="modal-login-error" class="alert error hidden"></div><button class="btn primary" type="submit">로그인</button><a class="btn outline" href="/login.html?tab=signup&next=${encodeURIComponent(next)}">회원가입</a></form></article></div>`);
  $('.login-modal .modal-close').addEventListener('click', () => $('.login-modal').remove());
  $('.login-modal').addEventListener('click', event => { if (event.target === event.currentTarget) $('.login-modal .modal-close').click(); });
  $('#modal-login').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('button[type="submit"]', event.currentTarget);
    button.disabled = true;
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      location.href = next;
    } catch (error) {
      $('#modal-login-error').textContent = error.message;
      $('#modal-login-error').classList.remove('hidden');
      button.disabled = false;
    }
  });
}

async function detail() {
  const id = qs('id') || 1;
  const performance = await api(`/api/performances/${id}`);
  const links = calendarLinks(performance);
  const maps = mapLinks(performance);
  const session = await api('/api/me');
  me = session.user;
  performance.remaining = performance.tickets.reduce((sum, item) => sum + Number(item.remaining_quantity), 0);
  const ticketSummary = performance.tickets.map(ticket => `<div class="ticket-summary-row"><span>${esc(ticket.name)}</span><b>${won(ticket.price)}</b><small>남은 티켓 ${Number(ticket.remaining_quantity)} / ${Number(ticket.total_quantity)}매</small></div>`).join('');
  document.title = `${performance.title} — Live Pocket ${APP_VERSION}`;
  $('#detail').innerHTML = `<nav class="crumb"><a href="/">홈</a><span>›</span><span>공연 상세</span></nav>
    <section class="detail-grid"><div class="detail-poster"><img src="${esc(performance.poster_url)}" alt="${esc(performance.title)} 포스터"></div>
    <article class="detail-info"><div class="detail-badges">${availabilityBadges(performance)}</div><small>${esc(performance.genre)}</small><h1>${esc(performance.title)}</h1>
    <dl><div><dt>공연 일시</dt><dd class="detail-row-content"><span>${date(performance.start_at)}</span><div class="calendar-wrap"><button id="calendar-button" class="text-button map-button" type="button">캘린더에 추가</button><div id="calendar-menu" class="calendar-menu hidden"><a href="${esc(links.google)}" target="_blank" rel="noopener">Google · Android</a><a href="${links.ics}" download="${esc(performance.title)}.ics">Apple · iOS (.ics)</a></div></div></dd></div>
    <div><dt>공연 장소</dt><dd class="venue-row"><span>${esc(performance.venue_name)}<small>${esc(performance.address)}</small></span><span class="map-actions"><a class="map-button" href="${esc(maps.naver)}" target="_blank" rel="noopener">네이버맵</a><a class="map-button" href="${esc(maps.kakao)}" target="_blank" rel="noopener">카카오맵</a></span></dd></div><div><dt>아티스트</dt><dd class="artist-credit">${artistCredits(performance)}</dd></div><div><dt>티켓</dt><dd class="ticket-summary">${ticketSummary}</dd></div><div><dt>총 남은 티켓</dt><dd>${performance.remaining}매</dd></div></dl>
    <div class="button-row"><button id="favorite" class="btn outline" type="button" aria-label="찜하기">${performance.is_favorite ? '♥' : '♡'} <b>${performance.favorite_count}</b></button><a id="booking-link" class="btn primary grow" href="/booking.html?id=${performance.id}">예매하기</a></div></article></section>
    <section class="description"><span class="kicker">ABOUT THE SHOW</span><h2>공연 소개</h2><p>${esc(performance.description)}</p><div class="notice"><b>예매 및 입장 안내</b><span>결제는 무통장 입금으로 진행됩니다. 입금 확인 후 QR 티켓이 발급되며, 공연 당일 예매 상세 화면의 QR로 입장할 수 있습니다.</span></div></section>
    <section class="recommendations"><div class="panel-title"><div><span class="kicker">YOU MAY ALSO LIKE</span><h2>추천 공연</h2></div></div><div class="performance-grid">${performance.recommendations.length ? performance.recommendations.map(card).join('') : '<div class="empty">추천할 공연을 준비 중입니다.</div>'}</div></section>`;
  $('#calendar-button').addEventListener('click', () => $('#calendar-menu').classList.toggle('hidden'));
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
      $('#favorite').innerHTML = `${result.favorite ? '♥' : '♡'} <b>${result.favoriteCount}</b>`;
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
    performance = await api(`/api/performances/${id}`);
    const session = await api('/api/me');
    me = session.user;
    if (!me) throw Error('LOGIN');
  } catch (error) {
    if (error.message === 'LOGIN') return location.href = `/login.html?next=${encodeURIComponent(location.href)}`;
    return $('#booking-content').innerHTML = `<div class="alert error">${esc(error.message)}</div>`;
  }
  const ticket = performance.tickets.find(item => Number(item.remaining_quantity) > 0) || performance.tickets[0];
  $('#booking-content').innerHTML = `<section class="booking-form"><form id="booking-form" class="stack"><div class="mini-show"><img src="${esc(performance.poster_url)}" alt=""><div><small>${esc(performance.genre)}</small><h2>${esc(performance.title)}</h2><p>${date(performance.start_at)} · ${esc(performance.venue_name)}</p></div></div><hr><label>티켓 종류<select name="ticketTypeId">${performance.tickets.map(item => `<option value="${item.id}" data-price="${item.price}" data-remaining="${item.remaining_quantity}" ${item.id === ticket.id ? 'selected' : ''} ${Number(item.remaining_quantity) < 1 ? 'disabled' : ''}>${esc(item.name)} · ${won(item.price)} · 남은 ${Number(item.remaining_quantity)}매</option>`).join('')}</select></label><label>수량<select name="quantity"></select></label><div class="two"><label>예매자 이름<input name="name" autocomplete="name" required></label><label>핸드폰번호<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></label></div><div class="payment"><span>결제 방식</span><b>무통장 입금</b><small>${esc(performance.deposit_notice || '신청 후 24시간 이내 입금')}</small></div><label class="agree"><input type="checkbox" required> 예매 및 취소 규정을 확인했습니다.</label><div id="form-error" class="alert error hidden"></div><button class="btn primary" type="submit">예매 신청하기</button></form></section><aside class="summary"><span>결제 금액</span><strong id="total">${won(ticket.price)}</strong><p id="ticket-remaining">선택한 티켓 잔여 수량 ${Number(ticket.remaining_quantity)}매</p></aside>`;
  const form = $('#booking-form');
  form.phone.addEventListener('input', event => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 11);
    event.target.value = digits.length > 7 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  });
  const update = () => {
    const option = form.ticketTypeId.selectedOptions[0];
    const current = Number(form.quantity.value) || 1;
    const limit = Math.min(4, Number(option.dataset.remaining || 0));
    form.quantity.innerHTML = Array.from({ length: limit }, (_, index) => index + 1).map(value => `<option ${value === Math.min(current, limit) ? 'selected' : ''}>${value}</option>`).join('');
    $('#total').textContent = won(Number(option.dataset.price) * Number(form.quantity.value || 0));
    $('#ticket-remaining').textContent = `선택한 티켓 잔여 수량 ${Number(option.dataset.remaining || 0)}매`;
  };
  form.addEventListener('change', update);
  update();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const result = await api('/api/reservations', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
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
  const { user } = await api('/api/me');
  if (!user) return location.href = '/login.html';
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
    <section data-panel="booking" class="tab-panel active"><h2>최근 예매</h2><div class="reservation-list">${reservations.length ? reservations.map(reservation => `<article class="reservation"><a class="reservation-show" href="/concert-detail.html?id=${reservation.performance_id}"><img src="${esc(reservation.poster_url)}" alt=""><div><span class="pill">${statusName(reservation.status)}</span><h3>${esc(reservation.title)}</h3><p>${date(reservation.start_at)} · ${esc(reservation.venue_name)}</p><small>예매번호 ${esc(reservation.reservation_no)}</small></div></a><button class="reservation-confirm" type="button" data-reservation="${reservation.id}">예매 확인</button></article>`).join('') : '<div class="empty">아직 예매한 공연이 없습니다.</div>'}</div></section>
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
    document.body.insertAdjacentHTML('beforeend', `<div class="modal"><article><button class="modal-close" aria-label="닫기">×</button><span class="pill">${statusName(reservation.status)}</span><h2>${esc(reservation.title)}</h2><dl><div><dt>예매 번호</dt><dd>${esc(reservation.reservation_no)}</dd></div><div><dt>공연 일시</dt><dd>${date(reservation.start_at)}</dd></div><div><dt>결제 금액</dt><dd>${won(reservation.total_amount)}</dd></div></dl>${canShowQr && verifyUrl ? `<img class="qr-image" src="${qrImageUrl(verifyUrl)}" alt="예매 정보 확인 QR코드"><small class="qr-token">공연장 입구에서 이 QR코드를 제시해 주세요.<br>스태프가 예매 정보를 확인한 후 입장을 안내합니다.</small>` : `<div class="notice"><b>QR 발행 대기 중</b><span>입금 확인 후 이곳에 예매 정보 확인 QR이 표시됩니다.</span></div>`}</article></div>`);
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
    document.title = `${ticket.performanceTitle} 예매 정보 확인 — Live Pocket ${APP_VERSION}`;
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
    return `<article class="show-management-card"><a class="show-management-main" href="/concert-detail.html?id=${item.id}"><img src="${esc(item.poster_url)}" alt=""><span><b>${esc(item.title)}</b><small>${date(item.start_at)} · ${esc(item.venue_name || '')}</small></span></a><div class="show-management-meta"><span>판매 <b>${sold}/${Number(item.total || 0)}</b></span><span>♥ <b>${Number(item.favorite_count || 0)}</b></span><span class="pill state-${state.key}">${state.label}</span></div><div class="row-actions"><button class="tiny" data-show-stats="${item.id}" type="button">현황</button><a class="tiny secondary" href="/performance-form.html?id=${item.id}">수정</a><a class="tiny secondary" href="/api/admin/performances/${item.id}/reservations.csv" download="performance-${item.id}-reservations.csv">엑셀</a><button class="tiny danger" data-show-delete="${item.id}" type="button">삭제</button></div></article>`;
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
    ? [['dashboard', '플랫폼 대시보드'], ['members', '회원 관리'], ['shows', '전체 공연'], ['reservations', '전체 예매'], ['settings', '장르 · 배너']]
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
  const genreRows = (data.genres || []).map(item => `<span data-genre-id="${item.id}">${esc(item.name)} <button class="tiny secondary" data-genre-edit="${item.id}" type="button">수정</button><button class="tiny danger" data-genre-delete="${item.id}" type="button">삭제</button></span>`).join('');
  return `<section data-admin-panel="dashboard"><div class="compact-stats">${stats([['전체 회원', data.users], ['전체 공연', data.performances], ['전체 예매', data.reservations], ['전체 찜', data.favorites]])}</div></section>
    <section data-admin-panel="members"><div class="panel-title"><div><h2>회원 관리</h2><p>공연 등록 경험과 계정 상태를 확인합니다.</p></div></div>${table(['회원', '이메일', '구분', '상태', '관리'], memberRows)}</section>
    <section data-admin-panel="shows"><div class="panel-title"><div><h2>전체 공연 관리</h2><p>플랫폼에 등록된 공연을 관리합니다.</p></div><a class="btn primary" href="/performance-form.html">+ 공연 등록</a></div>${performanceTable(data.performanceList)}</section>
    <section data-admin-panel="reservations"><div class="panel-title"><div><h2>전체 예매 관리</h2></div></div><div id="admin-reservations" class="loading">불러오는 중…</div></section>
    <section data-admin-panel="settings"><div class="panel-title"><div><h2>장르 · 배너 설정</h2><p>공연 장르와 홈 롤링 배너를 관리합니다.</p></div><button class="btn primary" type="button" data-banner-create>+ 신규 배너</button></div><div class="banner-admin" data-banner-list>${data.banners.map(banner => `<article draggable="true" data-banner-id="${banner.id}"><button class="drag-handle" type="button" aria-label="배너 순서 이동">☰</button><img src="${esc(banner.image_url)}" alt=""><div><b>${esc(banner.title)}</b><small>순서 ${banner.sort_order} · ${banner.is_active ? '노출 중' : '숨김'}</small></div><button class="tiny secondary" type="button" data-banner-edit="${banner.id}">수정</button></article>`).join('')}</div><div class="admin-card"><div class="panel-title"><div><h3>공연 장르</h3></div><button class="tiny" type="button" data-genre-create>장르 추가</button></div><div class="chips editable">${genreRows}</div></div></section>`;
}
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
      let result = canvas.toDataURL('image/png');
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
  document.body.insertAdjacentHTML('beforeend', `<div class="modal artist-add-modal"><article><button class="modal-close" type="button" aria-label="닫기">×</button><span class="kicker">ARTIST</span><h2>${editing ? '아티스트 수정' : '아티스트 추가'}</h2><form class="stack"><label class="autocomplete-field">아티스트명<input name="artist_name" autocomplete="off" required value="${esc(currentEntry?.name || '')}"><div class="artist-suggestions hidden" data-artist-suggestions></div></label><label class="file-field">아티스트 이미지<input type="file" name="artist_image" accept="image/*"><small>${editing ? '이미지를 선택하지 않으면 기존 이미지를 유지합니다.' : '기존 아티스트를 선택하면 등록된 이미지를 재사용합니다.'}</small></label><button class="btn primary" type="submit">${editing ? '수정 저장' : '추가'}</button></form></article></div>`);
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
    suggestions.classList.add('hidden');
  });
  modal.addEventListener('click', event => {
    if (!event.target.closest('.autocomplete-field')) suggestions.classList.add('hidden');
  });
  $('form', modal).addEventListener('submit', async event => {
    event.preventDefault();
    const name = String(event.currentTarget.artist_name.value || '').trim();
    if (!name) return;
    const file = event.currentTarget.artist_image.files[0];
    const matchedArtist = selectedArtist || knownArtists.find(item => item.name.toLowerCase() === name.toLowerCase());
    const avatar = file ? await cropImageFile(file, 150, 150, true) : matchedArtist?.avatar || currentEntry?.avatar || '/assets/artist-avatar.svg';
    const nextEntries = [...artistEntries(form.artists.value, form.artist_avatar_url.value)];
    const duplicateIndex = nextEntries.findIndex((item, index) => item.name.toLowerCase() === name.toLowerCase() && index !== editIndex);
    const targetIndex = editing ? editIndex : duplicateIndex;
    if (targetIndex >= 0) nextEntries[targetIndex] = { name, avatar };
    else nextEntries.push({ name, avatar });
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
  return cropImageFile(file, 1080, 1440, false);
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

function showFormHtml(item = {}) {
  const editing = Boolean(item.id);
  const localDate = value => value ? new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '';
  const tickets = item.tickets?.length ? item.tickets : [{ name: '일반 티켓', price: item.price || 0, total_quantity: item.total || 50 }];
  const ticketRow = ticket => `<div class="ticket-row"><label>티켓명<input name="ticket_name" value="${esc(ticket.name || '일반 티켓')}" placeholder="일반 티켓"></label><label>금액<input type="number" name="ticket_price" min="0" value="${ticket.price || 0}" placeholder="금액"></label><label>수량<input type="number" name="ticket_quantity" min="1" value="${ticket.total_quantity || ticket.total || 50}" placeholder="수량"></label><button class="tiny danger" type="button" data-ticket-remove>삭제</button></div>`;
  return `<section class="page-head"><span class="kicker">${editing ? 'EDIT PERFORMANCE' : 'NEW PERFORMANCE'}</span><h1>${editing ? '공연 수정' : '공연 등록'}</h1><p>공연 정보와 티켓 수량을 한 화면에서 관리합니다.</p></section><section class="show-form-page"><form id="show-form" class="stack"><div class="two"><label>공연명<input name="title" required value="${esc(item.title || '')}"></label><label>장르<div class="genre-action"><select name="genre" required></select><button class="tiny secondary" type="button" data-genre-add>추가</button></div></label></div><input type="hidden" name="poster_url" value="${esc(item.poster_url || '/assets/poster-1.svg')}"><input type="hidden" name="artist_avatar_url" value="${esc(item.artist_avatar_url || '/assets/artist-avatar.svg')}"><input type="hidden" name="artists" required value="${esc(item.artists || '')}"><label>아티스트<div class="artist-list" id="artist-list"></div><button class="tiny secondary" type="button" data-artist-add>아티스트 추가</button></label><label>공연 소개<textarea name="description" required>${esc(item.description || '')}</textarea></label><label class="file-field">포스터 이미지<input type="file" name="poster_file" accept="image/*"><small>이미지 선택 후 포스터 비율에 맞게 확대/축소와 위치를 조정합니다.</small></label><div class="two"><label>공연장<input name="venue_name" required value="${esc(item.venue_name || '')}"></label><label>주소<div class="input-action"><input name="address" required value="${esc(item.address || '')}"><button class="tiny secondary" type="button" data-address-search>검색</button></div></label></div><div class="two"><label>공연 일시<input type="datetime-local" name="start_at" required value="${localDate(item.start_at)}"></label><label>예매 시작<input type="datetime-local" name="booking_start_at" required value="${localDate(item.booking_start_at || new Date().toISOString())}"></label></div><label>예매 마감<input type="datetime-local" name="booking_close_at" required value="${localDate(item.booking_close_at)}"></label><div class="ticket-editor"><b>티켓 설정</b><div id="ticket-rows">${tickets.map(ticketRow).join('')}</div><button class="tiny secondary" type="button" data-ticket-add>티켓 추가</button></div><label>결제 안내 문구<input name="deposit_notice" required value="${esc(item.deposit_notice || '신청 후 24시간 이내 입금')}"></label><div id="show-form-error" class="alert error hidden"></div><div class="button-row"><a class="btn outline" href="/mypage.html">취소</a><button class="btn primary grow" type="submit">${editing ? '수정 저장' : '공연 등록'}</button></div></form></section>`;
}

async function bindShowForm(item = {}) {
  const editing = Boolean(item.id);
  const form = $('#show-form');
  await setGenreOptions(form.genre, item.genre);
  renderArtistList(form);
  autoGrowTextarea(form.description);
  form.description.addEventListener('input', event => autoGrowTextarea(event.currentTarget));
  $('[data-genre-add]').addEventListener('click', () => openGenreModal(form.genre));
  $('[data-artist-add]').addEventListener('click', () => openArtistAddModal(form));
  $('[data-address-search]').addEventListener('click', () => openAddressSearch(form));
  form.poster_file.addEventListener('change', async event => { if (event.currentTarget.files[0]) form.poster_url.value = await openPosterPreview(event.currentTarget.files[0]); });
  $('[data-ticket-add]').addEventListener('click', () => $('#ticket-rows').insertAdjacentHTML('beforeend', '<div class="ticket-row"><label>티켓명<input name="ticket_name" value="일반 티켓" placeholder="일반 티켓"></label><label>금액<input type="number" name="ticket_price" min="0" value="0" placeholder="금액"></label><label>수량<input type="number" name="ticket_quantity" min="1" value="50" placeholder="수량"></label><button class="tiny danger" type="button" data-ticket-remove>삭제</button></div>'));
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
  $('#show-form').addEventListener('click', event => { if (event.target.matches('[data-ticket-remove]')) event.target.closest('.ticket-row').remove(); });
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
    delete payload.poster_file; delete payload.ticket_name; delete payload.ticket_price; delete payload.ticket_quantity;
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
  const { user } = await api('/api/me');
  if (!user) return location.href = `/login.html?next=${encodeURIComponent(location.href)}`;
  me = user;
  const id = qs('id');
  const item = id ? await api(`/api/performances/${id}`) : {};
  $('#performance-form').innerHTML = showFormHtml(item);
  await bindShowForm(item);
}

function bindShowActions() {
  $$('[data-show-stats]').forEach(button => button.addEventListener('click', async () => openStatsModal(button.dataset.showStats)));
  $$('[data-show-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('이 공연을 목록에서 삭제할까요? 기존 예매 내역은 보존됩니다.')) return;
    await api(`/api/performances/${button.dataset.showDelete}`, { method: 'DELETE' });
    location.reload();
  }));
}

async function openStatsModal(id) {
  const data = await api(`/api/admin/performances/${id}/stats`);
  const max = Math.max(1, ...data.daily.map(row => Number(row.reservations)));
  const summary = data.summary || {};
  const reservationRows = data.reservations.length ? data.reservations.map(row => `<article class="stats-reservation-row"><span><b>${esc(row.reservation_no)}</b><small>${esc(row.user_name)} · ${esc(row.email)}</small></span><span class="stats-reservation-payment"><strong>${won(row.total_amount)}</strong><em>${statusName(row.status)}</em></span><span>${row.status === 'WAITING_DEPOSIT' ? `<button class="tiny" data-stats-paid="${row.id}" type="button">입금 확인</button>` : '처리 완료'}</span></article>`).join('') : '<div class="empty">아직 예매가 없습니다.</div>';
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
  $('#banner-form').banner_file.addEventListener('change', async event => { if (event.currentTarget.files[0]) $('#banner-form').image_url.value = await fileToDataUrl(event.currentTarget.files[0]); });
  $('#banner-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.link_url = normalizeLinkUrl(payload.link_url);
    payload.is_active = event.currentTarget.is_active.checked ? 1 : 0;
    delete payload.banner_file;
    try {
      await api(editing ? `/api/super-admin/banners/${item.id}` : '/api/super-admin/banners', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
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
    const name = prompt('수정할 장르명을 입력해 주세요.', button.parentElement.firstChild.textContent.trim());
    if (!name) return;
    await api(`/api/super-admin/genres/${button.dataset.genreEdit}`, { method: 'PATCH', body: JSON.stringify({ name, is_active: 1 }) });
    location.reload();
  }));
  $$('[data-genre-delete]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('이 장르를 목록에서 삭제할까요?')) return;
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
    if (!confirm('해당 회원을 삭제 상태로 변경할까요?')) return;
    await api(`/api/super-admin/users/${button.dataset.userDelete}`, { method: 'DELETE' });
    location.assign('/mypage.html#members');
  }));
}

async function bindAdminActions() {
  if ($('#admin-reservations')) {
    const rows = await api('/api/admin/reservations');
    $('#admin-reservations').innerHTML = table(['예매번호', '공연 / 예매자', '금액', '상태', '처리'], rows.map(reservation => `<tr><td>${esc(reservation.reservation_no)}</td><td><b>${esc(reservation.title)}</b><small>${esc(reservation.user_name)}</small></td><td>${won(reservation.total_amount)}</td><td>${statusName(reservation.status)}</td><td>${reservation.status === 'WAITING_DEPOSIT' ? `<button class="tiny" data-paid="${reservation.id}">입금 확인</button>` : '—'}</td></tr>`).join(''));
    $$('[data-paid]').forEach(button => button.addEventListener('click', async () => {
      await api(`/api/admin/reservations/${button.dataset.paid}`, { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }) });
      button.closest('tr').children[3].textContent = '결제 완료';
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

shell();
({ home, detail, booking, complete, mypage, login, showFormPage, verifyTicket }[document.body.dataset.page] || (() => {}))().catch(error => {
  console.error(error);
  const main = $('main');
  if (main) main.innerHTML = `<div class="wrap"><div class="alert error">${esc(error.message)}</div></div>`;
});
