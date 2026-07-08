'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const sharp = require('sharp');

loadEnv();
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const BASE = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/live_pocket';
const DEFAULT_DEPOSIT_NOTICE = '신청 후 24시간 이내 입금';
const SHOULD_INIT_DB = process.env.INIT_DB_ON_START === '1' || (!process.env.VERCEL && process.env.INIT_DB_ON_START !== '0');
const profanityFilter = loadProfanityFilter();
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.PGPOOL_MAX || 1),
  ssl: shouldUseSsl(DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

function loadEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
function shouldUseSsl(databaseUrl) {
  if (process.env.PGSSLMODE === 'disable') return false;
  if (/localhost|127\.0\.0\.1/i.test(databaseUrl)) return false;
  return /^postgres/i.test(databaseUrl);
}
function bind(sql, args = []) {
  let index = 0;
  return { text: sql.replace(/\?/g, () => `$${++index}`), values: args };
}
async function query(sql, args = [], client = pool) { return client.query(bind(sql, args)); }
async function all(sql, args = [], client = pool) { return (await query(sql, args, client)).rows; }
async function get(sql, args = [], client = pool) { return (await query(sql, args, client)).rows[0] || null; }
async function run(sql, args = [], client = pool) { return query(sql, args, client); }
async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function loadProfanityFilter() {
  const file = path.join(__dirname, 'config', 'profanity-filter.json');
  const fallback = { blockedTerms: ['시발','씨발','병신','개새끼','fuck','shit'], blockedPatterns: [] };
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      blockedTerms: Array.isArray(config.blockedTerms) ? config.blockedTerms : fallback.blockedTerms,
      blockedPatterns: Array.isArray(config.blockedPatterns) ? config.blockedPatterns : fallback.blockedPatterns,
    };
  } catch {
    return fallback;
  }
}
function hasBlockedNickname(value) {
  const text = String(value || '');
  const terms = profanityFilter.blockedTerms.map(term => String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const patterns = [...terms, ...profanityFilter.blockedPatterns].filter(Boolean);
  return patterns.length ? new RegExp(patterns.join('|'), 'i').test(text) : false;
}
function hashPassword(value, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(value, salt, 64).toString('hex')}`;
}
function verifyPassword(value, stored = '') {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(value, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', role TEXT NOT NULL CHECK(role IN ('USER','MANAGER','SUPER_ADMIN')), status TEXT DEFAULT 'ACTIVE', password_hash TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS performances (id SERIAL PRIMARY KEY, manager_id INTEGER REFERENCES users(id), title TEXT NOT NULL, genre TEXT NOT NULL, artists TEXT NOT NULL, description TEXT NOT NULL, poster_url TEXT NOT NULL, venue_name TEXT NOT NULL, address TEXT NOT NULL, start_at TEXT NOT NULL, booking_start_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT), booking_close_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN', host_avatar_url TEXT DEFAULT '/assets/host-avatar.svg', artist_avatar_url TEXT DEFAULT '/assets/artist-avatar.svg', deposit_notice TEXT DEFAULT '신청 후 24시간 이내 입금', created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS ticket_types (id SERIAL PRIMARY KEY, performance_id INTEGER NOT NULL REFERENCES performances(id), name TEXT NOT NULL, price INTEGER NOT NULL, total_quantity INTEGER NOT NULL, remaining_quantity INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS reservations (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), performance_id INTEGER NOT NULL REFERENCES performances(id), reservation_no TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'WAITING_DEPOSIT', depositor_name TEXT NOT NULL, phone TEXT NOT NULL, total_amount INTEGER NOT NULL, deposit_deadline TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS reservation_tickets (id SERIAL PRIMARY KEY, reservation_id INTEGER NOT NULL REFERENCES reservations(id), ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id), quantity INTEGER NOT NULL, price INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS qr_tickets (id SERIAL PRIMARY KEY, reservation_id INTEGER UNIQUE NOT NULL REFERENCES reservations(id), qr_token TEXT UNIQUE NOT NULL, issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, checked_in_at TIMESTAMPTZ, status TEXT DEFAULT 'ISSUED');
    CREATE TABLE IF NOT EXISTS favorites (user_id INTEGER REFERENCES users(id), performance_id INTEGER REFERENCES performances(id), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, performance_id));
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS banners (id SERIAL PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, image_url TEXT NOT NULL, link_url TEXT NOT NULL, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS taxonomy (id SERIAL PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1);
    ALTER TABLE qr_tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
    ALTER TABLE performances ADD COLUMN IF NOT EXISTS host_avatar_url TEXT DEFAULT '/assets/host-avatar.svg';
    ALTER TABLE performances ADD COLUMN IF NOT EXISTS artist_avatar_url TEXT DEFAULT '/assets/artist-avatar.svg';
    ALTER TABLE performances ADD COLUMN IF NOT EXISTS booking_start_at TEXT DEFAULT (CURRENT_TIMESTAMP::TEXT);
    ALTER TABLE performances ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE performances ADD COLUMN IF NOT EXISTS deposit_notice TEXT DEFAULT '신청 후 24시간 이내 입금';
    ALTER TABLE favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
  `);

  const adminEmail = String(process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPass = process.env.SUPER_ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.');
  await run(`INSERT INTO users(email,name,role,password_hash) VALUES(?,?,'SUPER_ADMIN',?)
    ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name, role='SUPER_ADMIN', password_hash=EXCLUDED.password_hash, status='ACTIVE'`,
    [adminEmail, 'Live Pocket 총 관리자', hashPassword(adminPass)]);
  const admin = await get('SELECT id FROM users WHERE email=?', [adminEmail]);

  if (!await get('SELECT id FROM performances LIMIT 1')) {
    const samples = [
      ['밤의 사운드 체크','인디록','슬로우 라이브 Paper Moon','작은 공연장에서 가까운 거리로 생생한 사운드를 만나는 인디 라이브입니다.','/assets/poster-1.svg','합정 사운드홀 B1','서울 마포구 독막로 21','2026-07-18T19:30:00+09:00','2026-07-18T17:30:00+09:00',33000,100,38],
      ['성수 재즈 나이트','재즈','스하리 Quartet','작은 바에서 만나는 따뜻한 콘트라베이스와 피아노의 밤입니다.','/assets/poster-2.svg','성수 블루 라운지','서울 성동구 연무장길 12','2026-07-25T20:00:00+09:00','2026-07-25T18:00:00+09:00',28000,80,51],
      ['망원 어쿠스틱 데이','어쿠스틱','소소한 바람과 여름밤','싱어송라이터의 목소리에 집중하는 60분 소규모 공연입니다.','/assets/poster-3.svg','망원 무브먼트','서울 마포구 포은로 8','2026-08-02T18:00:00+09:00','2026-08-02T16:00:00+09:00',25000,60,12],
    ];
    for (const s of samples) {
      const row = await get(`INSERT INTO performances(manager_id,title,genre,artists,description,poster_url,venue_name,address,start_at,booking_close_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id`, [admin.id, ...s.slice(0, 9), 'OPEN']);
      await run('INSERT INTO ticket_types(performance_id,name,price,total_quantity,remaining_quantity) VALUES(?,?,?,?,?)', [row.id, '일반 티켓', s[9], s[10], s[11]]);
    }
  }
  if (!await get('SELECT id FROM banners LIMIT 1')) {
    await run('INSERT INTO banners(title,subtitle,image_url,link_url,sort_order) VALUES(?,?,?,?,?)', ['작은 무대, 크게 뛰는 밤','지금 가장 가까운 라이브를 만나보세요.','/assets/banner-1.svg','/concert-detail.html?id=1',1]);
    await run('INSERT INTO banners(title,subtitle,image_url,link_url,sort_order) VALUES(?,?,?,?,?)', ['이번 주말의 재즈','좋아하는 음악을 공연장에서 듣는 시간.','/assets/banner-2.svg','/concert-detail.html?id=2',2]);
    await run('INSERT INTO banners(title,subtitle,image_url,link_url,sort_order) VALUES(?,?,?,?,?)', ['QR로 빠르게 확인','공연장 입구에서 예매 정보를 빠르게 확인하세요.','/assets/banner-3.svg','/mypage.html',3]);
  }
  if (!await get("SELECT id FROM taxonomy WHERE type='genre' LIMIT 1")) {
    for (const [index, name] of ['인디록','재즈','어쿠스틱','힙합','클래식','전자음악'].entries()) {
      await run("INSERT INTO taxonomy(type,name,sort_order,is_active) VALUES('genre',?,?,1)", [name, index + 1]);
    }
  }
  await run('UPDATE performances SET deposit_notice=? WHERE deposit_notice IS NULL OR deposit_notice=? OR deposit_notice LIKE ?', [DEFAULT_DEPOSIT_NOTICE, '', '%?%']);
  await compactStoredImages();
  await run("DELETE FROM qr_tickets WHERE reservation_id IN (SELECT id FROM reservations WHERE status='WAITING_DEPOSIT')");
  for (const row of await all("SELECT id FROM reservations WHERE status IN ('PAID','USED') AND id NOT IN (SELECT reservation_id FROM qr_tickets)")) await issueQrToken(row.id);
}

const json = (res, status, data, headers = {}) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(data)); };
const publicCache = seconds => ({'Cache-Control':`public, s-maxage=${seconds}, stale-while-revalidate=600`});
const cookieMap = req => Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>x.trim().split('=').map(decodeURIComponent)));
async function currentUser(req) { const sid = cookieMap(req).lp_session; return sid ? get(`SELECT u.id,u.email,u.name,u.phone,u.role,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP`, [sid]) : null; }
async function sessionCookie(userId) { const id = crypto.randomBytes(32).toString('hex'), expires = new Date(Date.now() + 7 * 864e5); await run('INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)', [id, userId, expires.toISOString()]); return `lp_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${BASE.startsWith('https:')?'; Secure':''}`; }
async function requireRole(req, res, roles = ['USER','MANAGER','SUPER_ADMIN']) { const u = await currentUser(req); if (!u) { json(res, 401, {error:'로그인이 필요합니다.'}); return null; } if (!roles.includes(u.role)) { json(res, 403, {error:'접근 권한이 없습니다.'}); return null; } return u; }
async function body(req){let raw='';for await(const c of req){raw+=c;if(raw.length>12e6)throw Error('too large');}return raw?JSON.parse(raw):{};}
const safeUser = u => u && ({id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role,status:u.status});

const performanceSelect = `SELECT p.*,owner.name host_name,
  COALESCE((SELECT MIN(price) FROM ticket_types WHERE performance_id=p.id),0) price,
  COALESCE((SELECT SUM(total_quantity) FROM ticket_types WHERE performance_id=p.id),0) total,
  COALESCE((SELECT SUM(remaining_quantity) FROM ticket_types WHERE performance_id=p.id),0) remaining,
  COALESCE((SELECT COUNT(*) FROM favorites WHERE performance_id=p.id),0) favorite_count
  FROM performances p LEFT JOIN users owner ON owner.id=p.manager_id`;
async function performanceRows(where = "p.status!='HIDDEN'", args = [], client = pool) { return (await all(`${performanceSelect} WHERE ${where} ORDER BY p.start_at`, args, client)).map(publicPerformance); }
function canManagePerformance(user, performance) { return user && performance && (user.role === 'SUPER_ADMIN' || Number(performance.manager_id) === Number(user.id)); }
function artistEntries(namesValue, avatarsValue) {
  const names = String(namesValue || '').split(',').map(name => name.trim()).filter(Boolean);
  let avatars = [];
  try { const parsed = JSON.parse(avatarsValue || '[]'); avatars = Array.isArray(parsed) ? parsed : []; } catch { avatars = []; }
  if (!avatars.length && avatarsValue) avatars = names.map(name => ({ name, avatar: avatarsValue }));
  return names.map((name, index) => ({ name, avatar: avatars[index]?.avatar || avatars.find(item => item.name === name)?.avatar || '/assets/artist-avatar.svg' }));
}
function normalizePerformance(input) {
  const required = ['title','genre','artists','description','poster_url','venue_name','address','start_at','booking_start_at','booking_close_at'];
  for (const field of required) if (!String(input[field] || '').trim()) throw new Error(`${field} 값이 필요합니다.`);
  const tickets = Array.isArray(input.tickets) && input.tickets.length ? input.tickets : [{ name: input.ticket_name || '일반 티켓', price: input.price, total_quantity: input.total_quantity }];
  const normalizedTickets = tickets.map((ticket, index) => {
    const name = String(ticket.name || `티켓 ${index + 1}`).trim();
    const price = Math.max(0, Number(ticket.price));
    const total = Math.max(1, Number(ticket.total_quantity));
    if (!name || !Number.isFinite(price) || !Number.isFinite(total)) throw new Error('티켓명, 가격, 수량을 확인해 주세요.');
    return { name, price: Math.round(price), total_quantity: Math.round(total) };
  });
  return {
    title:String(input.title).trim(), genre:String(input.genre).trim(), artists:String(input.artists).trim(),
    description:String(input.description).trim(), poster_url:String(input.poster_url).trim(), venue_name:String(input.venue_name).trim(),
    address:String(input.address).trim(), start_at:String(input.start_at), booking_start_at:String(input.booking_start_at), booking_close_at:String(input.booking_close_at),
    host_avatar_url:String(input.host_avatar_url || '/assets/host-avatar.svg').trim(), artist_avatar_url:String(input.artist_avatar_url || '/assets/artist-avatar.svg').trim(),
    deposit_notice:String(input.deposit_notice || DEFAULT_DEPOSIT_NOTICE).trim(),
    tickets: normalizedTickets,
  };
}
async function accessiblePerformanceIds(user) { const rows = user.role === 'SUPER_ADMIN' ? await all("SELECT id FROM performances WHERE status!='HIDDEN'") : await all("SELECT id FROM performances WHERE manager_id=? AND status!='HIDDEN'", [user.id]); return rows.map(row => Number(row.id)); }
async function normalizeBannerSortOrders(client = pool) { const rows = await all('SELECT id FROM banners ORDER BY sort_order,id', [], client); for (const [index, row] of rows.entries()) await run('UPDATE banners SET sort_order=? WHERE id=?', [index + 1, row.id], client); }
function normalizeLinkUrl(value) { const url = String(value || '').trim(); if (!url || url.startsWith('/') || url.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(url)) return url; if (url.startsWith('//')) return `https:${url}`; if (/^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url)) return `http://${url}`; return `https://${url}`; }
function dataImageParts(source) {
  const match = String(source || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return null;
  return {type:match[1]||'application/octet-stream',body:match[2]?Buffer.from(match[3], 'base64'):Buffer.from(decodeURIComponent(match[3]))};
}
function publicImageUrl(value, pathPrefix, id) { return /^data:/i.test(String(value||'')) ? `${pathPrefix}/${id}` : value; }
function publicBanner(row) { return {...row,image_url:publicImageUrl(row.image_url,'/api/banner-image',row.id),link_url:normalizeLinkUrl(row.link_url)}; }
function publicPerformance(row) { return {...row,poster_url:publicImageUrl(row.poster_url,'/api/performance-poster',row.id)}; }
async function compressDataImageUrl(source, width, height, quality = 82) {
  const data = dataImageParts(source);
  if (!data || !/^image\/(png|jpe?g|webp)$/i.test(data.type)) return source;
  const body = await sharp(data.body).resize(width, height, {fit:'cover'}).flatten({background:'#fff'}).jpeg({quality, mozjpeg:true}).toBuffer();
  return `data:image/jpeg;base64,${body.toString('base64')}`;
}
async function compactStoredImages() {
  for (const row of await all("SELECT id,image_url FROM banners WHERE image_url LIKE 'data:image/%' AND image_url NOT LIKE 'data:image/jpeg%'")) {
    await run('UPDATE banners SET image_url=? WHERE id=?', [await compressDataImageUrl(row.image_url, 1920, 600, 82), row.id]);
  }
  for (const row of await all("SELECT id,poster_url FROM performances WHERE poster_url LIKE 'data:image/%' AND poster_url NOT LIKE 'data:image/jpeg%'")) {
    await run('UPDATE performances SET poster_url=? WHERE id=?', [await compressDataImageUrl(row.poster_url, 1080, 1440, 84), row.id]);
  }
}
async function sendStoredImage(res, row, column, width, height, quality = 82) {
  const source = String(row?.image_url || '');
  if (!source) { res.writeHead(404); return res.end('Not found'); }
  if (!/^data:/i.test(source)) { res.writeHead(302, {Location: normalizeLinkUrl(source)}); return res.end(); }
  const data = dataImageParts(source);
  if (!data) { res.writeHead(404); return res.end('Not found'); }
  let body = data.body;
  let type = data.type;
  if (/^image\/(png|jpe?g|webp)$/i.test(type)) {
    body = await sharp(body).resize(width, height, {fit:'cover'}).flatten({background:'#fff'}).jpeg({quality, mozjpeg:true}).toBuffer();
    type = 'image/jpeg';
  }
  res.writeHead(200, {'Content-Type':type,'Cache-Control':'public, max-age=31536000, s-maxage=31536000, immutable'});
  return res.end(body);
}
async function sendBannerImage(res, row) { return sendStoredImage(res, row, 'image_url', 1920, 600, 82); }
async function sendPerformancePoster(res, row) { return sendStoredImage(res, row && {image_url:row.poster_url}, 'poster_url', 1080, 1440, 84); }
async function issueQrToken(reservationId, client = pool) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = crypto.randomBytes(24).toString('base64url');
    const result = await run('INSERT INTO qr_tickets(reservation_id,qr_token) VALUES(?,?) ON CONFLICT(reservation_id) DO NOTHING', [reservationId, token], client);
    if (result.rowCount) return token;
    if (await get('SELECT qr_token FROM qr_tickets WHERE reservation_id=?', [reservationId], client)) return null;
  }
  throw new Error('QR 토큰을 발급하지 못했습니다.');
}
function qrVerifyUrl(token) { return `${BASE.replace(/\/$/, '')}/tickets/verify/${encodeURIComponent(token)}`; }
function maskPhone(value) { const digits = String(value || '').replace(/\D/g, ''); if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`; if (digits.length >= 7) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`; return '연락처 미등록'; }
async function metricSeries(user) {
  const accessible = await accessiblePerformanceIds(user);
  const keys = ['all', ...accessible.map(String)];
  const today = new Date();
  const days = Array.from({length:14}, (_, index) => { const current = new Date(today); current.setDate(today.getDate() - (13 - index)); return current.toISOString().slice(0, 10); });
  const result = {};
  for (const key of keys) {
    const ids = key === 'all' ? accessible : [Number(key)];
    if (!ids.length) { result[key] = days.map(date => ({date,bookingRate:0,favorites:0})); continue; }
    const placeholders = ids.map(() => '?').join(',');
    const total = Number((await get(`SELECT COALESCE(SUM(total_quantity),0) total FROM ticket_types WHERE performance_id IN (${placeholders})`, ids)).total);
    result[key] = [];
    for (const day of days) {
      const booked = Number((await get(`SELECT COALESCE(SUM(rt.quantity),0) n FROM reservation_tickets rt JOIN reservations r ON r.id=rt.reservation_id WHERE r.performance_id IN (${placeholders}) AND r.status!='CANCELLED' AND r.created_at::date<=?::date`, [...ids, day])).n);
      const favorites = Number((await get(`SELECT COUNT(*) n FROM favorites WHERE performance_id IN (${placeholders}) AND COALESCE(created_at,CURRENT_TIMESTAMP)::date<=?::date`, [...ids, day])).n);
      result[key].push({date:day,bookingRate:total?Math.round(booked/total*100):0,favorites});
    }
  }
  return result;
}

async function api(req,res,url){
  const parts=url.pathname.split('/').filter(Boolean);
  if(req.method==='GET'&&parts[1]==='banner-image'&&parts[2])return await sendBannerImage(res,await get('SELECT image_url FROM banners WHERE id=? AND is_active=1',[parts[2]]));
  if(req.method==='GET'&&parts[1]==='performance-poster'&&parts[2])return await sendPerformancePoster(res,await get("SELECT poster_url FROM performances WHERE id=? AND status!='HIDDEN'",[parts[2]]));
  if(req.method==='GET'&&url.pathname==='/api/banners')return json(res,200,(await all('SELECT * FROM banners WHERE is_active=1 ORDER BY sort_order')).map(publicBanner),publicCache(300));
  if(req.method==='GET'&&url.pathname==='/api/taxonomy/genres')return json(res,200,await all("SELECT * FROM taxonomy WHERE type='genre' AND is_active=1 ORDER BY sort_order,name"));
  if(req.method==='GET'&&url.pathname==='/api/artists'){const map=new Map();for(const row of await all("SELECT artists,artist_avatar_url FROM performances WHERE status!='HIDDEN' ORDER BY created_at DESC,id DESC")){for(const artist of artistEntries(row.artists,row.artist_avatar_url)){const key=artist.name.toLowerCase();const current=map.get(key);if(current)current.performanceCount+=1;else map.set(key,{name:artist.name,avatar:artist.avatar,performanceCount:1});}}return json(res,200,[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko')));}
  if(req.method==='GET'&&url.pathname==='/api/performances')return json(res,200,await performanceRows(),publicCache(300));
  if(req.method==='GET'&&parts[1]==='performances'&&parts[2]){let p=await get(`${performanceSelect} WHERE p.id=?`,[parts[2]]);if(!p)return json(res,404,{error:'공연을 찾을 수 없습니다.'});p.tickets=await all('SELECT * FROM ticket_types WHERE performance_id=?',[p.id]);p.is_favorite=false;p.recommendations=(await all(`${performanceSelect} WHERE p.id!=? AND p.status!='HIDDEN' ORDER BY CASE WHEN p.genre=? THEN 0 ELSE 1 END,p.start_at LIMIT 3`,[p.id,p.genre])).map(publicPerformance);return json(res,200,publicPerformance(p),publicCache(300));}
  if(req.method==='GET'&&parts[1]==='tickets'&&parts[2]==='verify'&&parts[3]){const row=await get(`SELECT q.qr_token,r.reservation_no,r.status booking_status,r.depositor_name,r.phone,p.title performance_title,p.start_at performance_date,p.venue_name venue,p.status performance_status,(SELECT COALESCE(SUM(quantity),0) FROM reservation_tickets WHERE reservation_id=r.id) ticket_count FROM qr_tickets q JOIN reservations r ON r.id=q.reservation_id LEFT JOIN performances p ON p.id=r.performance_id WHERE q.qr_token=?`,[parts[3]]);if(!row)return json(res,404,{error:'유효하지 않은 예매 정보입니다.',code:'INVALID_QR'});if(!row.performance_title||row.performance_status==='HIDDEN')return json(res,404,{error:'공연 정보를 찾을 수 없습니다.',code:'PERFORMANCE_NOT_FOUND'});return json(res,200,{performanceTitle:row.performance_title,performanceDate:row.performance_date,venue:row.venue,bookerName:row.depositor_name,maskedPhone:maskPhone(row.phone),ticketCount:Number(row.ticket_count||0),bookingNumber:row.reservation_no,bookingStatus:row.booking_status});}
  if(req.method==='GET'&&url.pathname==='/api/me')return json(res,200,{user:safeUser(await currentUser(req))});
  if(req.method==='POST'&&url.pathname==='/api/auth/register'){const d=await body(req),email=String(d.email||'').trim().toLowerCase(),password=String(d.password||''),nickname=String(d.nickname||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'올바른 이메일 주소를 입력해 주세요.'});if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return json(res,400,{error:'비밀번호는 8자 이상이며 영문과 숫자를 함께 포함해야 합니다.'});if(!nickname)return json(res,400,{error:'닉네임을 입력해 주세요.'});if(hasBlockedNickname(nickname))return json(res,400,{error:'비속어 또는 코드 형태가 포함된 닉네임은 사용할 수 없습니다.'});if(await get('SELECT 1 FROM users WHERE email=?',[email]))return json(res,409,{error:'이미 가입된 이메일입니다.'});const user=await get("INSERT INTO users(email,name,role,password_hash) VALUES(?,?,'USER',?) RETURNING *",[email,nickname,hashPassword(password)]);return json(res,201,{user:safeUser(user)},{'Set-Cookie':await sessionCookie(user.id)});}
  if(req.method==='POST'&&url.pathname==='/api/auth/login'){const d=await body(req),email=String(d.email||'').trim().toLowerCase(),password=String(d.password||'');const user=await get("SELECT * FROM users WHERE email=? AND role IN ('USER','MANAGER','SUPER_ADMIN') AND status='ACTIVE'",[email]);if(!user||!verifyPassword(password,user.password_hash))return json(res,401,{error:'이메일 또는 비밀번호가 올바르지 않습니다.'});return json(res,200,{user:safeUser(user)},{'Set-Cookie':await sessionCookie(user.id)});}
  if(req.method==='POST'&&url.pathname==='/api/auth/admin-login'){const d=await body(req),u=await get("SELECT * FROM users WHERE email=? AND role='SUPER_ADMIN' AND status='ACTIVE'",[String(d.email||'').toLowerCase()]);if(!u||!verifyPassword(d.password,u.password_hash))return json(res,401,{error:'총관리자 계정 정보가 올바르지 않습니다.'});return json(res,200,{user:safeUser(u)},{'Set-Cookie':await sessionCookie(u.id)});}
  if(req.method==='POST'&&url.pathname==='/api/auth/logout'){const sid=cookieMap(req).lp_session;if(sid)await run('DELETE FROM sessions WHERE id=?',[sid]);return json(res,200,{ok:true},{'Set-Cookie':'lp_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});}
  if(req.method==='POST'&&parts[1]==='performances'&&parts[3]==='favorite'){const u=await requireRole(req,res);if(!u)return;const existing=await get('SELECT 1 FROM favorites WHERE user_id=? AND performance_id=?',[u.id,parts[2]]);if(existing)await run('DELETE FROM favorites WHERE user_id=? AND performance_id=?',[u.id,parts[2]]);else await run('INSERT INTO favorites(user_id,performance_id,created_at) VALUES(?,?,CURRENT_TIMESTAMP)',[u.id,parts[2]]);const favoriteCount=(await get('SELECT COUNT(*) n FROM favorites WHERE performance_id=?',[parts[2]])).n;return json(res,200,{favorite:!existing,favoriteCount:Number(favoriteCount)});}
  if(req.method==='GET'&&url.pathname==='/api/me/performances'){const u=await requireRole(req,res);if(!u)return;return json(res,200,u.role==='SUPER_ADMIN'?await performanceRows('1=1'):await performanceRows('p.manager_id=?',[u.id]));}
  if(req.method==='POST'&&url.pathname==='/api/performances'){const u=await requireRole(req,res);if(!u)return;let d;try{d=normalizePerformance(await body(req));}catch(e){return json(res,400,{error:e.message});}const id=await transaction(async client=>{const r=await get(`INSERT INTO performances(manager_id,title,genre,artists,description,poster_url,venue_name,address,start_at,booking_start_at,booking_close_at,status,host_avatar_url,artist_avatar_url,deposit_notice) VALUES(?,?,?,?,?,?,?,?,?,?,?,'OPEN',?,?,?) RETURNING id`,[u.id,d.title,d.genre,d.artists,d.description,d.poster_url,d.venue_name,d.address,d.start_at,d.booking_start_at,d.booking_close_at,d.host_avatar_url,d.artist_avatar_url,d.deposit_notice],client);for(const ticket of d.tickets)await run('INSERT INTO ticket_types(performance_id,name,price,total_quantity,remaining_quantity) VALUES(?,?,?,?,?)',[r.id,ticket.name,ticket.price,ticket.total_quantity,ticket.total_quantity],client);return r.id;});return json(res,201,{id});}
  if(req.method==='PATCH'&&parts[1]==='performances'&&parts[2]){const u=await requireRole(req,res);if(!u)return;const performance=await get('SELECT * FROM performances WHERE id=?',[parts[2]]);if(!canManagePerformance(u,performance))return json(res,403,{error:'이 공연을 수정할 권한이 없습니다.'});let d;try{d=normalizePerformance(await body(req));}catch(e){return json(res,400,{error:e.message});}if(d.poster_url===`/api/performance-poster/${performance.id}`)d.poster_url=performance.poster_url;const existing=await all('SELECT * FROM ticket_types WHERE performance_id=? ORDER BY id',[performance.id]);const soldTotal=existing.reduce((sum,ticket)=>sum+Number(ticket.total_quantity-ticket.remaining_quantity),0);const nextTotal=d.tickets.reduce((sum,ticket)=>sum+Number(ticket.total_quantity),0);if(nextTotal<soldTotal)return json(res,400,{error:`이미 판매된 ${soldTotal}매보다 전체 수량을 적게 설정할 수 없습니다.`});await transaction(async client=>{await run('UPDATE performances SET title=?,genre=?,artists=?,description=?,poster_url=?,venue_name=?,address=?,start_at=?,booking_start_at=?,booking_close_at=?,host_avatar_url=?,artist_avatar_url=?,deposit_notice=? WHERE id=?',[d.title,d.genre,d.artists,d.description,d.poster_url,d.venue_name,d.address,d.start_at,d.booking_start_at,d.booking_close_at,d.host_avatar_url,d.artist_avatar_url,d.deposit_notice,performance.id],client);await run('DELETE FROM ticket_types WHERE performance_id=? AND id NOT IN (SELECT ticket_type_id FROM reservation_tickets)',[performance.id],client);const current=await all('SELECT * FROM ticket_types WHERE performance_id=? ORDER BY id',[performance.id],client);for(const [index,ticket] of d.tickets.entries()){const prev=current[index];if(prev){const sold=Number(prev.total_quantity)-Number(prev.remaining_quantity);await run('UPDATE ticket_types SET name=?,price=?,total_quantity=?,remaining_quantity=? WHERE id=?',[ticket.name,ticket.price,ticket.total_quantity,Math.max(0,ticket.total_quantity-sold),prev.id],client);}else await run('INSERT INTO ticket_types(performance_id,name,price,total_quantity,remaining_quantity) VALUES(?,?,?,?,?)',[performance.id,ticket.name,ticket.price,ticket.total_quantity,ticket.total_quantity],client);}});return json(res,200,{ok:true});}
  if(req.method==='DELETE'&&parts[1]==='performances'&&parts[2]){const u=await requireRole(req,res);if(!u)return;const performance=await get('SELECT * FROM performances WHERE id=?',[parts[2]]);if(!canManagePerformance(u,performance))return json(res,403,{error:'이 공연을 삭제할 권한이 없습니다.'});await run("UPDATE performances SET status='HIDDEN' WHERE id=?",[performance.id]);return json(res,200,{ok:true});}
  if(req.method==='POST'&&url.pathname==='/api/reservations'){const u=await requireRole(req,res,['USER']);if(!u)return;const d=await body(req),reserverName=String(d.name||'').trim(),digits=String(d.phone||'').replace(/\D/g,''),phone=digits.length===11?`${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`:'',ticket=await get('SELECT t.*,p.booking_start_at,p.booking_close_at,p.status FROM ticket_types t JOIN performances p ON p.id=t.performance_id WHERE t.id=?',[d.ticketTypeId]),qty=Math.max(1,Math.min(10,Number(d.quantity)));if(!reserverName||!phone)return json(res,400,{error:'예매자 이름과 11자리 휴대전화번호를 입력해 주세요.'});if(!ticket||ticket.remaining_quantity<qty)return json(res,400,{error:'선택한 티켓의 잔여 수량이 부족합니다.'});const now=Date.now();if(ticket.status!=='OPEN'||new Date(ticket.booking_start_at).getTime()>now||new Date(ticket.booking_close_at).getTime()<now)return json(res,400,{error:'현재 예매 가능한 시간이 아닙니다.'});const no=`LP${new Date().toISOString().slice(2,10).replaceAll('-','')}-${crypto.randomInt(100000,999999)}`,deadline=new Date(Date.now()+24*3600e3).toISOString(),totalAmount=ticket.price*qty;const id=await transaction(async client=>{const r=await get('INSERT INTO reservations(user_id,performance_id,reservation_no,depositor_name,phone,total_amount,deposit_deadline) VALUES(?,?,?,?,?,?,?) RETURNING id',[u.id,ticket.performance_id,no,reserverName,phone,totalAmount,deadline],client);await run('INSERT INTO reservation_tickets(reservation_id,ticket_type_id,quantity,price) VALUES(?,?,?,?)',[r.id,ticket.id,qty,ticket.price],client);await run('UPDATE ticket_types SET remaining_quantity=remaining_quantity-? WHERE id=?',[qty,ticket.id],client);return r.id;});return json(res,201,{id,reservationNo:no,depositDeadline:deadline,totalAmount});}
  if(req.method==='GET'&&url.pathname==='/api/me/reservations'){const u=await requireRole(req,res);if(!u)return;return json(res,200,(await all(`SELECT r.*,p.title,p.poster_url,p.start_at,p.venue_name FROM reservations r JOIN performances p ON p.id=r.performance_id WHERE r.user_id=? ORDER BY r.created_at DESC`,[u.id])).map(row=>({...row,poster_url:publicImageUrl(row.poster_url,'/api/performance-poster',row.performance_id)})));}
  if(req.method==='GET'&&parts[1]==='me'&&parts[2]==='reservations'&&parts[3]){const u=await requireRole(req,res);if(!u)return;const r=await get(`SELECT r.*,p.title,p.poster_url,p.start_at,p.venue_name,CASE WHEN r.status IN ('PAID','USED') THEN q.qr_token ELSE NULL END qr_token,q.status qr_status FROM reservations r JOIN performances p ON p.id=r.performance_id LEFT JOIN qr_tickets q ON q.reservation_id=r.id WHERE r.id=? AND (r.user_id=? OR ? IN ('MANAGER','SUPER_ADMIN'))`,[parts[3],u.id,u.role]);if(r&&r.qr_token)r.qr_verify_url=qrVerifyUrl(r.qr_token);if(r)r.poster_url=publicImageUrl(r.poster_url,'/api/performance-poster',r.performance_id);return r?json(res,200,r):json(res,404,{error:'예매를 찾을 수 없습니다.'});}
  if(req.method==='GET'&&url.pathname==='/api/me/favorites'){const u=await requireRole(req,res);if(!u)return;return json(res,200,(await all(`${performanceSelect} JOIN favorites f ON f.performance_id=p.id WHERE f.user_id=? AND p.status!='HIDDEN' ORDER BY f.created_at DESC`,[u.id])).map(publicPerformance));}
  if(req.method==='GET'&&url.pathname==='/api/admin/dashboard'){const u=await requireRole(req,res,['MANAGER','SUPER_ADMIN']);if(!u)return;const performances=u.role==='SUPER_ADMIN'?await performanceRows():await performanceRows("p.manager_id=? AND p.status!='HIDDEN'",[u.id]);const ids=performances.map(item=>item.id);let reservations=0,revenue=0,favorites=0;if(ids.length){const placeholders=ids.map(()=>'?').join(',');const rs=await get(`SELECT COUNT(*) reservations,COALESCE(SUM(total_amount),0) revenue FROM reservations WHERE performance_id IN (${placeholders})`,ids);reservations=Number(rs.reservations);revenue=Number(rs.revenue);favorites=Number((await get(`SELECT COUNT(*) n FROM favorites WHERE performance_id IN (${placeholders})`,ids)).n);}return json(res,200,{stats:{performances:performances.length,reservations,revenue,favorites},performances,chart:await metricSeries(u)});}
  if(req.method==='GET'&&url.pathname==='/api/admin/reservations'){const u=await requireRole(req,res,['MANAGER','SUPER_ADMIN']);if(!u)return;return json(res,200,await all(`SELECT r.*,p.title,r.depositor_name user_name FROM reservations r JOIN performances p ON p.id=r.performance_id JOIN users u ON u.id=r.user_id WHERE (?='SUPER_ADMIN' OR p.manager_id=?) ORDER BY r.created_at DESC`,[u.role,u.id]));}
  if(req.method==='PATCH'&&parts[1]==='admin'&&parts[2]==='reservations'){const u=await requireRole(req,res);if(!u)return;const d=await body(req),r=await get('SELECT r.*,p.manager_id FROM reservations r JOIN performances p ON p.id=r.performance_id WHERE r.id=?',[parts[3]]);if(!r||(u.role!=='SUPER_ADMIN'&&Number(r.manager_id)!==Number(u.id)))return json(res,404,{error:'예매를 찾을 수 없습니다.'});await run('UPDATE reservations SET status=? WHERE id=?',[d.status,r.id]);if(d.status==='PAID')await issueQrToken(r.id);return json(res,200,{ok:true});}
  if(req.method==='POST'&&url.pathname==='/api/admin/qr/checkin'){const u=await requireRole(req,res,['MANAGER','SUPER_ADMIN']);if(!u)return;const d=await body(req),q=await get(`SELECT q.*,r.status reservation_status,p.manager_id,p.title FROM qr_tickets q JOIN reservations r ON r.id=q.reservation_id JOIN performances p ON p.id=r.performance_id WHERE q.qr_token=?`,[d.token]);if(!q||(u.role==='MANAGER'&&Number(q.manager_id)!==Number(u.id)))return json(res,404,{error:'유효한 티켓이 아닙니다.'});if(q.reservation_status!=='PAID'&&q.reservation_status!=='USED')return json(res,409,{error:'입금 확인 전 티켓입니다.'});if(q.checked_in_at)return json(res,409,{error:'이미 입장 처리된 티켓입니다.',checkedInAt:q.checked_in_at});await run("UPDATE qr_tickets SET checked_in_at=CURRENT_TIMESTAMP,status='USED' WHERE id=?",[q.id]);await run("UPDATE reservations SET status='USED' WHERE id=?",[q.reservation_id]);return json(res,200,{ok:true,title:q.title});}
  const reservationCsvMatch = req.method === 'GET' && url.pathname.match(/^\/api\/admin\/performances\/(\d+)\/reservations\.csv$/);
  if(reservationCsvMatch){const u=await requireRole(req,res);if(!u)return;const performance=await get('SELECT * FROM performances WHERE id=?',[reservationCsvMatch[1]]);if(!canManagePerformance(u,performance))return json(res,404,{error:'공연을 찾을 수 없습니다.'});const rows=await all(`SELECT r.reservation_no,p.title,r.depositor_name,u.email,r.phone,r.total_amount,r.status,r.created_at,CASE WHEN r.status IN ('PAID','USED') THEN q.qr_token ELSE '' END qr_token FROM reservations r JOIN performances p ON p.id=r.performance_id JOIN users u ON u.id=r.user_id LEFT JOIN qr_tickets q ON q.reservation_id=r.id WHERE r.performance_id=? ORDER BY r.created_at DESC`,[performance.id]);const header=['예매번호','공연명','예매자','이메일','연락처','결제금액','상태','예매일','QR확인URL'];const cell=value=>`"${String(value??'').replaceAll('"','""')}"`;const csv='\uFEFF'+[header.map(cell).join(','),...rows.map(row=>[row.reservation_no,row.title,row.depositor_name,row.email,row.phone,row.total_amount,row.status,row.created_at,row.qr_token?qrVerifyUrl(row.qr_token):''].map(cell).join(','))].join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="performance-${performance.id}-reservations.csv"`});return res.end(csv);}
  if(req.method==='GET'&&url.pathname==='/api/super-admin/dashboard'){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;await normalizeBannerSortOrders();return json(res,200,{users:Number((await get("SELECT COUNT(*) n FROM users WHERE status!='DELETED'")).n),performances:Number((await get("SELECT COUNT(*) n FROM performances WHERE status!='HIDDEN'")).n),reservations:Number((await get('SELECT COUNT(*) n FROM reservations')).n),favorites:Number((await get('SELECT COUNT(*) n FROM favorites')).n),members:await all(`SELECT u.id,u.email,u.name,u.role,u.status,u.created_at,EXISTS(SELECT 1 FROM performances p WHERE p.manager_id=u.id AND p.status!='HIDDEN') has_performances FROM users u WHERE u.status!='DELETED' ORDER BY u.created_at DESC`),genres:await all("SELECT * FROM taxonomy WHERE type='genre' AND is_active=1 ORDER BY sort_order,name"),banners:(await all('SELECT * FROM banners ORDER BY sort_order,id')).map(publicBanner),performanceList:await performanceRows()});}
  if(req.method==='GET'&&parts[1]==='super-admin'&&parts[2]==='banners'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const banner=await get('SELECT * FROM banners WHERE id=?',[parts[3]]);return banner?json(res,200,{...banner,link_url:normalizeLinkUrl(banner.link_url)}):json(res,404,{error:'배너를 찾을 수 없습니다.'});}
  if(req.method==='POST'&&url.pathname==='/api/super-admin/banners'){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const d=await body(req);if(!d.title||!d.image_url||!d.link_url)return json(res,400,{error:'제목, 이미지 URL, 연결 URL이 필요합니다.'});const order=Number.isFinite(Number(d.sort_order))?Number(d.sort_order):Number((await get('SELECT COALESCE(MAX(sort_order),0)+1 n FROM banners')).n);const result=await get('INSERT INTO banners(title,subtitle,image_url,link_url,sort_order,is_active) VALUES(?,?,?,?,?,?) RETURNING id',[String(d.title),String(d.subtitle||''),String(d.image_url),normalizeLinkUrl(d.link_url),order,Number(d.is_active)!==0?1:0]);await normalizeBannerSortOrders();return json(res,201,{id:result.id});}
  if(req.method==='PATCH'&&url.pathname==='/api/super-admin/banners/reorder'){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const d=await body(req),ids=Array.isArray(d.ids)?d.ids.map(Number).filter(Boolean):[];const known=new Set((await all('SELECT id FROM banners')).map(row=>Number(row.id)));if(ids.length!==known.size||ids.some(id=>!known.has(id)))return json(res,400,{error:'배너 순서 정보가 올바르지 않습니다.'});await transaction(async client=>{for(const [index,id] of ids.entries())await run('UPDATE banners SET sort_order=? WHERE id=?',[index+1,id],client);});return json(res,200,{ok:true});}
  if(req.method==='PATCH'&&parts[1]==='super-admin'&&parts[2]==='banners'&&parts[3]&&parts.length===4){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const d=await body(req);const banner=await get('SELECT * FROM banners WHERE id=?',[parts[3]]);if(!banner)return json(res,404,{error:'배너를 찾을 수 없습니다.'});if(!d.title||!d.image_url||!d.link_url)return json(res,400,{error:'제목, 이미지 URL, 연결 URL이 필요합니다.'});await run('UPDATE banners SET title=?,subtitle=?,image_url=?,link_url=?,sort_order=?,is_active=? WHERE id=?',[String(d.title),String(d.subtitle||''),String(d.image_url),normalizeLinkUrl(d.link_url),Number(d.sort_order)||0,Number(d.is_active)!==0?1:0,banner.id]);return json(res,200,{ok:true});}
  if(req.method==='DELETE'&&parts[1]==='super-admin'&&parts[2]==='banners'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const banner=await get('SELECT id FROM banners WHERE id=?',[parts[3]]);if(!banner)return json(res,404,{error:'배너를 찾을 수 없습니다.'});await run('DELETE FROM banners WHERE id=?',[banner.id]);await normalizeBannerSortOrders();return json(res,200,{ok:true});}
  if(req.method==='PATCH'&&parts[1]==='super-admin'&&parts[2]==='banners'&&parts[4]==='move'){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;await normalizeBannerSortOrders();const d=await body(req),rows=await all('SELECT * FROM banners ORDER BY sort_order,id'),index=rows.findIndex(row=>Number(row.id)===Number(parts[3]));if(index<0)return json(res,404,{error:'배너를 찾을 수 없습니다.'});const next=index+(Number(d.direction)<0?-1:1);if(next<0||next>=rows.length)return json(res,200,{ok:true});await run('UPDATE banners SET sort_order=? WHERE id=?',[rows[next].sort_order,rows[index].id]);await run('UPDATE banners SET sort_order=? WHERE id=?',[rows[index].sort_order,rows[next].id]);await normalizeBannerSortOrders();return json(res,200,{ok:true});}
  if(req.method==='POST'&&url.pathname==='/api/super-admin/genres'){const u=await requireRole(req,res);if(!u)return;const d=await body(req),name=String(d.name||'').trim();if(!name)return json(res,400,{error:'장르명을 입력해 주세요.'});if(hasBlockedNickname(name))return json(res,400,{error:'비속어 또는 코드 형태가 포함된 장르는 사용할 수 없습니다.'});const existing=await get("SELECT id FROM taxonomy WHERE type='genre' AND name=?",[name]);if(existing)return json(res,200,{id:existing.id});const order=Number((await get("SELECT COALESCE(MAX(sort_order),0)+1 n FROM taxonomy WHERE type='genre'")).n);const result=await get("INSERT INTO taxonomy(type,name,sort_order,is_active) VALUES('genre',?,?,1) RETURNING id",[name,order]);return json(res,201,{id:result.id});}
  if(req.method==='PATCH'&&parts[1]==='super-admin'&&parts[2]==='genres'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const d=await body(req),name=String(d.name||'').trim();if(!name)return json(res,400,{error:'장르명을 입력해 주세요.'});if(hasBlockedNickname(name))return json(res,400,{error:'비속어 또는 코드 형태가 포함된 장르는 사용할 수 없습니다.'});await run("UPDATE taxonomy SET name=?,is_active=? WHERE id=? AND type='genre'",[name,Number(d.is_active)!==0?1:0,parts[3]]);return json(res,200,{ok:true});}
  if(req.method==='DELETE'&&parts[1]==='super-admin'&&parts[2]==='genres'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;await run("UPDATE taxonomy SET is_active=0 WHERE id=? AND type='genre'",[parts[3]]);return json(res,200,{ok:true});}
  if(req.method==='PATCH'&&parts[1]==='super-admin'&&parts[2]==='users'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const d=await body(req);const user=await get('SELECT * FROM users WHERE id=?',[parts[3]]);if(!user||user.role==='SUPER_ADMIN')return json(res,404,{error:'수정 가능한 회원을 찾을 수 없습니다.'});const name=String(d.name||user.name).trim();if(d.password){const password=String(d.password);if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return json(res,400,{error:'비밀번호는 8자 이상이며 영문과 숫자를 함께 포함해야 합니다.'});await run('UPDATE users SET name=?,status=?,password_hash=? WHERE id=?',[name,String(d.status||user.status),hashPassword(password),user.id]);}else await run('UPDATE users SET name=?,status=? WHERE id=?',[name,String(d.status||user.status),user.id]);return json(res,200,{ok:true});}
  if(req.method==='DELETE'&&parts[1]==='super-admin'&&parts[2]==='users'&&parts[3]){const u=await requireRole(req,res,['SUPER_ADMIN']);if(!u)return;const user=await get('SELECT * FROM users WHERE id=?',[parts[3]]);if(!user||user.role==='SUPER_ADMIN')return json(res,404,{error:'삭제 가능한 회원을 찾을 수 없습니다.'});await run("UPDATE users SET status='DELETED' WHERE id=?",[user.id]);return json(res,200,{ok:true});}
  if(req.method==='GET'&&parts[1]==='admin'&&parts[2]==='performances'&&parts[4]==='stats'){const u=await requireRole(req,res);if(!u)return;const performance=await get('SELECT * FROM performances WHERE id=?',[parts[3]]);if(!canManagePerformance(u,performance))return json(res,404,{error:'공연을 찾을 수 없습니다.'});const daily=await all(`SELECT DATE(created_at) date,COUNT(*) reservations,COALESCE(SUM(total_amount),0) amount FROM reservations WHERE performance_id=? GROUP BY DATE(created_at) ORDER BY DATE(created_at)`,[performance.id]);const reservations=await all(`SELECT r.*,r.depositor_name user_name,u.email FROM reservations r JOIN users u ON u.id=r.user_id WHERE r.performance_id=? ORDER BY r.created_at DESC`,[performance.id]);const ticketStats=await get('SELECT COALESCE(SUM(total_quantity),0) total,COALESCE(SUM(total_quantity-remaining_quantity),0) sold FROM ticket_types WHERE performance_id=?',[performance.id]);const amountStats=await get(`SELECT COALESCE(SUM(total_amount),0) total_amount,COALESCE(SUM(CASE WHEN status='PAID' THEN total_amount ELSE 0 END),0) paid_amount FROM reservations WHERE performance_id=? AND status!='CANCELLED'`,[performance.id]);return json(res,200,{daily,reservations,summary:{totalTickets:Number(ticketStats.total),soldTickets:Number(ticketStats.sold),totalAmount:Number(amountStats.total_amount),paidAmount:Number(amountStats.paid_amount)}});}
  return json(res,404,{error:'API 경로를 찾을 수 없습니다.'});
}

const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,BASE);if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(url.pathname==='/admin'||url.pathname==='/admin/'){res.writeHead(302,{Location:'/login.html'});return res.end();}let file=url.pathname==='/'?'/index.html':url.pathname;if(/^\/tickets\/verify\/[^/]+$/.test(url.pathname))file='/ticket-verify.html';file=path.normalize(file).replace(/^(\.\.[/\\])+/, '');const full=path.join(ROOT,file);if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':MIME[path.extname(full)]||'application/octet-stream','Cache-Control':path.extname(full)==='.html'?'no-cache':'public, max-age=3600'});fs.createReadStream(full).pipe(res);}catch(e){console.error(e);if(!res.headersSent)json(res,500,{error:'서버 오류가 발생했습니다.'});}});

const ready = SHOULD_INIT_DB ? initDb() : Promise.resolve();

if (require.main === module) {
  ready
    .then(() => server.listen(PORT, () => console.log(`Live Pocket: ${BASE}`)))
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = (req, res) => {
  ready
    .then(() => server.emit('request', req, res))
    .catch(error => {
      console.error('Database initialization failed:', error);
      if (!res.headersSent) json(res, 500, { error: '서버 초기화에 실패했습니다.' });
    });
};
