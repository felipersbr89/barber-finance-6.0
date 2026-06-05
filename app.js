/* ═══════════════════════════════════════════
   GORILAZ — app.js  v4.0
   Core: Supabase, Auth, Layout, Toast, Modal, Utils, Icons
═══════════════════════════════════════════ */

// ── 1. SUPABASE CONFIG ──────────────────────
const SUPABASE_URL  = 'https://ixgwhyaponyssvczcabn.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z3doeWFwb255c3N2Y3pjYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTA5NDYsImV4cCI6MjA5NDk4Njk0Nn0.uSyPDUn87ERrrZpzK4DmIepqO_Sbcvwt7RzlN4QB8FM'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON)

window.App = { user: null, db }
window.db  = db

// ── 2. AUTH ─────────────────────────────────
const Auth = {
  async getUser() {
    try {
      const { data: { session } } = await db.auth.getSession()
      return session?.user || null
    } catch (e) { console.warn('[Auth.getUser]', e.message); return null }
  },
  async signIn(email, password) {
    try { return await db.auth.signInWithPassword({ email, password }) }
    catch (e) { return { error: { message: 'Erro de conexão. Verifique sua internet.' } } }
  },
  async signUp(email, password) {
    try { return await db.auth.signUp({ email, password }) }
    catch (e) { return { error: { message: 'Erro de conexão. Verifique sua internet.' } } }
  },
  async signOut() {
    try { await db.auth.signOut() } catch (_) {}
    window.location.href = 'index.html'
  },
  async resetPassword(email) {
    try {
      // IMPORTANTE: esta URL deve estar na whitelist do Supabase
      // Authentication → URL Configuration → Redirect URLs
      const redirectTo = 'https://felipersbr89.github.io/barber-finance-6.0/reset-password.html'
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) console.error('[Auth.resetPassword] erro Supabase:', error.message, '| status:', error.status)
      return { error }
    } catch (e) {
      console.error('[Auth.resetPassword] exception:', e.message)
      return { error: { message: 'Erro de conexão. Verifique sua internet.' } }
    }
  },
  async updatePassword(newPassword) {
    try { const { error } = await db.auth.updateUser({ password: newPassword }); return { error } }
    catch (e) { return { error: { message: 'Erro ao atualizar senha.' } } }
  },
  async requireAuth() {
    const user = await this.getUser()
    if (!user) { window.location.href = 'index.html'; return null }
    App.user = user; return user
  },
  async redirectIfAuth(dest = 'dashboard.html') {
    const user = await this.getUser()
    if (user) { App.user = user; window.location.href = dest }
  },
  onAuthChange(callback) {
    db.auth.onAuthStateChange((_e, s) => callback(s?.user || null))
  }
}

// ── 3. LAYOUT ────────────────────────────────
const Layout = {
  currentPage() {
    const file = window.location.pathname.split('/').pop().replace('.html', '')
    if (!file || file === 'index') return 'dashboard'
    return file
  },
  render(container) {
    const page     = this.currentPage()
    const email    = App.user?.email || ''
    const initials = email.charAt(0).toUpperCase()

    const navItems = [
      { id: 'dashboard',     label: 'Dashboard',     icon: iconDashboard() },
      { id: 'receitas',      label: 'Receitas',       icon: iconReceitas() },
      { id: 'despesas',      label: 'Despesas',       icon: iconDespesas() },
      { id: 'investimentos', label: 'Investimentos',  icon: iconInvest() },
      { id: 'metas',         label: 'Metas',          icon: iconMetas() },
      { id: 'categorias',    label: 'Categorias',     icon: iconCategorias() },
      { id: 'relatorios',    label: 'Relatórios',     icon: iconRelatorios() },
      { id: 'perfil',        label: 'Perfil',         icon: iconPerfil() },
    ]

    const navHTML = navItems.map(item => `
      <a href="${item.id}.html" class="nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
      </a>`).join('')

    // Bottom nav só mostra os 6 principais (sem categorias/relatórios para caber)
    const bottomItems = navItems.filter(i => !['categorias','relatorios'].includes(i.id))
    const bottomNavHTML = bottomItems.map(item => `
      <a href="${item.id}.html" class="bottom-nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
        ${item.icon}
        <span>${item.label}</span>
        ${page === item.id ? '<div class="bottom-nav-indicator"></div>' : ''}
      </a>`).join('')

    container.innerHTML = `
      <div id="sidebar-overlay" class="sidebar-overlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <img src="data:image/png;base64,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" alt="Gorilaz" class="sidebar-logo-img">
          <div>
            <div class="logo-text">GORILAZ</div>
            <div class="logo-sub">Barber Finance</div>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="user-avatar" id="sidebar-avatar">${initials}</div>
            <div class="user-email" id="sidebar-email">${email}</div>
          </div>
          <button class="btn-logout" onclick="Auth.signOut()">
            ${iconLogout()} Sair da conta
          </button>
        </div>
      </aside>
      <div class="main-area">
        <header class="topbar-mobile">
          <button class="btn-hamburger" id="hamburger-btn" onclick="Layout.toggleSidebar()">
            ${iconMenu()}
          </button>
          <div class="topbar-brand"><img src="data:image/png;base64,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" alt="" class="topbar-logo-img"> <span>GORILAZ</span></div>
          <div class="user-avatar" style="cursor:default">${initials}</div>
        </header>
        <main class="page-content" id="page-content"></main>
      </div>
      <nav class="bottom-nav">
        <div class="bottom-nav-items">${bottomNavHTML}</div>
      </nav>
    `
    document.getElementById('sidebar-overlay').addEventListener('click', () => Layout.closeSidebar())
  },
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open')
    document.getElementById('sidebar-overlay')?.classList.toggle('show')
  },
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open')
    document.getElementById('sidebar-overlay')?.classList.remove('show')
  }
}

// ── 4. TOAST ─────────────────────────────────
let _toastTimer
const Toast = {
  show(msg, type = '') {
    let el = document.getElementById('toast')
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el) }
    el.textContent = msg
    el.className = 'show ' + type
    clearTimeout(_toastTimer)
    _toastTimer = setTimeout(() => el.className = '', 3200)
  },
  ok(msg)  { this.show(msg, 'ok') },
  err(msg) { this.show(msg, 'err') },
}

// ── 5. MODAL ─────────────────────────────────
const Modal = {
  open(id)  { document.getElementById(id)?.classList.remove('hidden') },
  close(id) { document.getElementById(id)?.classList.add('hidden') },
  init() {
    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.addEventListener('click', e => { if (e.target === o) o.classList.add('hidden') })
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'))
    })
  }
}

// ── 6. UTILS ─────────────────────────────────
const Utils = {
  fmt(v) { return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) },
  fmtShort(v) {
    v = Number(v||0)
    if (Math.abs(v) >= 1_000_000) return 'R$ '+(v/1_000_000).toFixed(1).replace('.',',')+' M'
    if (Math.abs(v) >= 1000)      return 'R$ '+(v/1000).toFixed(1).replace('.',',')+' k'
    return this.fmt(v)
  },
  fmtDate(s) {
    if (!s) return ''
    const [y,m,d] = s.split('-')
    return `${d}/${m}/${y}`
  },
  today()    { return new Date().toISOString().split('T')[0] },
  monthStr(y,m)   { return `${y}-${String(m+1).padStart(2,'0')}` },
  monthStart(y,m) { return `${y}-${String(m+1).padStart(2,'0')}-01` },
  monthEnd(y,m)   { const d = new Date(y, m+1, 0); return `${y}-${String(m+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` },
  monthName(m,y)  { return new Date(y,m).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}) },
  esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') },
  initials(name, email) {
    if (name) return name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()
    return (email||'?').charAt(0).toUpperCase()
  },
  setLoading(btn, loading, label) {
    btn.disabled = loading
    btn.innerHTML = loading ? `<span class="spin"></span> ${label}` : label
  },
  showError(el, msg) { el.textContent = msg; el.classList.remove('hidden') },
  hideError(el) { el.classList.add('hidden') },
  // Gera CSV a partir de array de objetos
  toCSV(rows, cols) {
    const header = cols.map(c=>c.label).join(';')
    const body   = rows.map(r => cols.map(c => {
      const v = r[c.key] ?? ''
      return typeof v === 'string' && v.includes(';') ? `"${v}"` : v
    }).join(';')).join('\n')
    return header + '\n' + body
  },
  downloadCSV(csv, filename) {
    const bom  = '\uFEFF' // BOM para Excel abrir com acentos corretos
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }
}

// ── 7. ICONS ─────────────────────────────────
function iconDashboard()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>` }
function iconReceitas()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>` }
function iconDespesas()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>` }
function iconInvest()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` }
function iconMetas()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` }
function iconCategorias() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>` }
function iconRelatorios() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` }
function iconPerfil()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` }
function iconLogout()     { return `<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>` }
function iconMenu()       { return `<svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>` }
function iconPlus()       { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` }
function iconEdit()       { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` }
function iconTrash()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>` }
function iconSearch()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` }
function iconSave()       { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>` }
function iconKey()        { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>` }
function iconChevLeft()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>` }
function iconChevRight()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>` }
function iconCheck()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` }
function iconArrowUp()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>` }
function iconArrowDown()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>` }
function iconDownload()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>` }
function iconBulb()       { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>` }
function iconTag()        { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>` }

// ── 8. EXPÕE GLOBALMENTE ─────────────────────
window.Auth   = Auth
window.Layout = Layout
window.Toast  = Toast
window.Modal  = Modal
window.Utils  = Utils
