/* ═══════════════════════════════════════════
   GORILAZ — app.js
   Módulo compartilhado: Supabase, Auth, Layout, Utils
   Incluído em TODAS as páginas
═══════════════════════════════════════════ */

// ── 1. SUPABASE CONFIG ──────────────────────
const SUPABASE_URL  = 'https://ixgwhyaponyssvczcabn.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z3doeWFwb255c3N2Y3pjYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTA5NDYsImV4cCI6MjA5NDk4Njk0Nn0.uSyPDUn87ERrrZpzK4DmIepqO_Sbcvwt7RzlN4QB8FM'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── 2. ESTADO GLOBAL ────────────────────────
window.App = {
  user: null,
  db,
}

// FIX: expõe db globalmente para que dashboard.js e demais módulos
// sempre encontrem a variável, independente da ordem de carregamento
window.db = db

// ── 3. AUTH ─────────────────────────────────
const Auth = {
  // FIX: try/catch em getSession evita que erros de extensões do browser
  // (ex: "message channel closed") derrubem toda a Promise chain
  async getUser() {
    try {
      const { data: { session } } = await db.auth.getSession()
      return session?.user || null
    } catch (e) {
      console.warn('[Auth.getUser] erro ao obter sessão:', e.message)
      return null
    }
  },

  async signIn(email, password) {
    return db.auth.signInWithPassword({ email, password })
  },

  async signUp(email, password) {
    return db.auth.signUp({ email, password })
  },

  async signOut() {
    try { await db.auth.signOut() } catch (e) { /* ignora erro no signOut */ }
    window.location.href = 'index.html'
  },

  // Protege a página — redireciona para login se não autenticado
  async requireAuth() {
    const user = await this.getUser()
    if (!user) {
      window.location.href = 'index.html'
      return null
    }
    App.user = user
    return user
  },

  // Redireciona para dashboard se já autenticado (usado no index.html)
  async redirectIfAuth(dest = 'dashboard.html') {
    const user = await this.getUser()
    if (user) {
      App.user = user
      window.location.href = dest
    }
  },

  onAuthChange(callback) {
    db.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null)
    })
  }
}

// ── 4. LAYOUT: SIDEBAR & NAVIGATION ─────────
const Layout = {
  // FIX: quando a URL é a raiz do domínio (GitHub Pages sem path),
  // pop() retorna '' ou 'index' — normaliza sempre para 'dashboard'
  currentPage() {
    const file = window.location.pathname.split('/').pop().replace('.html', '')
    if (!file || file === 'index') return 'dashboard'
    return file
  },

  render(container) {
    const page = this.currentPage()
    const email = App.user?.email || ''
    const initials = email.charAt(0).toUpperCase()

    const navItems = [
      { id: 'dashboard',     label: 'Dashboard',    icon: iconDashboard() },
      { id: 'receitas',      label: 'Receitas',      icon: iconReceitas() },
      { id: 'despesas',      label: 'Despesas',      icon: iconDespesas() },
      { id: 'investimentos', label: 'Investimentos', icon: iconInvest() },
      { id: 'metas',         label: 'Metas',         icon: iconMetas() },
      { id: 'perfil',        label: 'Perfil',        icon: iconPerfil() },
    ]

    const navHTML = navItems.map(item => `
      <a href="${item.id}.html" class="nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
      </a>`).join('')

    const bottomNavHTML = navItems.map(item => `
      <a href="${item.id}.html" class="bottom-nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
        ${item.icon}
        <span>${item.label}</span>
        ${page === item.id ? '<div class="bottom-nav-indicator"></div>' : ''}
      </a>`).join('')

    container.innerHTML = `
      <div id="sidebar-overlay" class="sidebar-overlay"></div>

      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-box">✂</div>
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
          <div class="topbar-brand">✂ <span>GORILAZ</span></div>
          <div class="user-avatar" style="cursor:default">${initials}</div>
        </header>

        <main class="page-content" id="page-content">
          <!-- conteúdo da página vai aqui -->
        </main>
      </div>

      <nav class="bottom-nav">
        <div class="bottom-nav-items">${bottomNavHTML}</div>
      </nav>
    `

    document.getElementById('sidebar-overlay').addEventListener('click', () => Layout.closeSidebar())
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    sidebar.classList.toggle('open')
    overlay.classList.toggle('show')
  },

  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open')
    document.getElementById('sidebar-overlay')?.classList.remove('show')
  }
}

// ── 5. TOAST ─────────────────────────────────
let _toastTimer
const Toast = {
  show(msg, type = '') {
    let el = document.getElementById('toast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'toast'
      document.body.appendChild(el)
    }
    el.textContent = msg
    el.className = 'show ' + type
    clearTimeout(_toastTimer)
    _toastTimer = setTimeout(() => el.className = '', 3200)
  },
  ok(msg)  { this.show(msg, 'ok') },
  err(msg) { this.show(msg, 'err') },
}

// ── 6. MODAL HELPERS ─────────────────────────
const Modal = {
  open(id)  { document.getElementById(id)?.classList.remove('hidden') },
  close(id) { document.getElementById(id)?.classList.add('hidden') },
  init() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.add('hidden')
      })
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'))
    })
  }
}

// ── 7. UTILS ─────────────────────────────────
const Utils = {
  fmt(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  fmtShort(v) {
    v = Number(v || 0)
    if (Math.abs(v) >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k'
    return this.fmt(v)
  },
  fmtDate(s) {
    if (!s) return ''
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  },
  today() {
    return new Date().toISOString().split('T')[0]
  },
  monthStr(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`
  },
  monthStart(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}-01`
  },
  monthEnd(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}-31`
  },
  monthName(month, year) {
    return new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  },
  esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  },
  initials(name, email) {
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    return (email || '?').charAt(0).toUpperCase()
  },
  setLoading(btn, loading, label) {
    btn.disabled = loading
    btn.innerHTML = loading ? `<span class="spin"></span> ${label}` : label
  },
  showError(el, msg) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

// ── 8. SVG ICONS ─────────────────────────────
function iconDashboard() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>` }
function iconReceitas()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>` }
function iconDespesas()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>` }
function iconInvest()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` }
function iconMetas()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` }
function iconPerfil()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` }
function iconLogout()    { return `<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>` }
function iconMenu()      { return `<svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>` }
function iconPlus()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` }
function iconEdit()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` }
function iconTrash()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>` }
function iconSearch()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` }
function iconSave()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>` }
function iconKey()       { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>` }
function iconChevLeft()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>` }
function iconChevRight() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>` }
function iconCheck()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` }
function iconArrowUp()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>` }
function iconArrowDown() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>` }

// ── 9. EXPÕE GLOBALMENTE ─────────────────────
window.Auth   = Auth
window.Layout = Layout
window.Toast  = Toast
window.Modal  = Modal
window.Utils  = Utils
