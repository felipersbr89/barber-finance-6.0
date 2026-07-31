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

// ── 2. PERMISSIONS — Sistema de permissões centralizado ──
//
// Para adicionar novos Masters no futuro:
//   Permissions.MASTERS.add('novoemail@exemplo.com')
//
// Para verificar permissão em qualquer módulo:
//   if (Permissions.can('editarCampanha')) { ... }
//   Permissions.requireMaster(btn)  ← desabilita botão para não-masters
//
const Permissions = {
  // ── Lista de usuários Master ──
  MASTERS: new Set([
    'felipersbr@gmail.com'   // Felipe Braga — Usuário Master
  ]),

  // ── Mapa de permissões por papel ──
  // true  = qualquer usuário autenticado pode
  // false = apenas Master pode
  ACTIONS: {
    // Visualização — todos podem
    visualizarMetas:       true,
    visualizarRanking:     true,
    visualizarHistorico:   true,
    visualizarCampanhas:   true,
    // Edição — apenas Master
    editarCampanhas:       false,
    editarMetas:           false,
    cadastrarPremiacoes:   false,
    cadastrarHistoricos:   false,
    aplicarInfracoes:      false,
    aplicarBonificacoes:   false,
  },

  // Verifica se o usuário atual é Master
  isMaster() {
    const email = App.user?.email?.toLowerCase()?.trim() || ''
    return this.MASTERS.has(email)
  },

  // Verifica se o usuário atual pode executar uma ação
  // Retorna true se: ação é pública OR usuário é Master
  can(action) {
    const pub = this.ACTIONS[action]
    if (pub === true)  return true   // ação pública
    if (pub === false) return this.isMaster()  // requer Master
    // Ação não mapeada: negar por segurança
    console.warn('[Permissions] Ação não mapeada:', action)
    return false
  },

  // Inicializar após login — registra papel no App
  init() {
    App.isMaster = this.isMaster()
    console.log(`[Permissions] Usuário: ${App.user?.email} | Master: ${App.isMaster}`)
  },

  // Utilitário: desabilita elemento para não-Masters
  // Uso: Permissions.requireMaster(btnElement, 'Apenas o Master pode editar')
  requireMaster(el, tooltip = 'Apenas o administrador pode realizar esta ação') {
    if (!el) return
    if (!this.isMaster()) {
      el.disabled = true
      el.title    = tooltip
      el.style.opacity = '0.4'
      el.style.cursor  = 'not-allowed'
    }
  },

  // Utilitário: esconde elemento para não-Masters
  hiddenUnlessMaster(el) {
    if (!el) return
    if (!this.isMaster()) el.style.display = 'none'
  }
}

window.Permissions = Permissions


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
    App.user = user; Permissions.init(); return user
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

    // ── Saudação por horário ──
    const h = new Date().getHours()
    const greetPeriod = h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'
    const greetMsg = h >= 5 && h < 12
      ? 'Que seu dia seja produtivo e cheio de resultados!'
      : h >= 12 && h < 18
      ? 'Continue acompanhando suas finanças.'
      : 'Hora de revisar o dia e planejar o amanhã.'

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

    // Grupos com labels (da DEMO)
    const navGroups = [
      { label: 'Principal', items: navItems.slice(0, 4) },
      { label: 'Gestão',    items: navItems.slice(4) },
    ]
    const navHTML = navGroups.map(g => `
      <div class="nav-section-label">${g.label}</div>
      ${g.items.map(item => `
        <a href="${item.id}.html" class="nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>`).join('')}`).join('')

    // ── Seção BARBER METAS (Em Breve) ──
    const iconLock = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

    const iconCopa = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`
    const iconMetaColetiva = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`
    const iconPerformance  = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
    const iconHighTicket   = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`
    const iconRoyalTicket  = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`

    const barberMetasHTML = `
      <div class="nav-section-label nav-section-premium">
        BARBER METAS
        <span class="nav-section-badge">NOVO</span>
      </div>
      <a href="copa-gorilaz.html" class="nav-item nav-item-copa" style="color:var(--ac);background:var(--ac-dim);border-color:var(--ac-bdr)">
        <span class="nav-icon">${iconCopa()}</span>
        Copa Gorilaz 🏆
      </a>
      <a href="faturamento-coletivo.html" class="nav-item" style="color:var(--tx)">
        <span class="nav-icon">${iconMetaColetiva()}</span>
        Faturamento Coletivo
      </a>
      <a href="performance-elite.html" class="nav-item" style="color:var(--tx)">
        <span class="nav-icon">${iconPerformance()}</span>
        Performance Elite
      </a>
      <a href="high-ticket.html" class="nav-item" style="color:var(--tx)">
        <span class="nav-icon">${iconHighTicket()}</span>
        High Ticket
      </a>
      <div class="nav-item nav-item-coming" onclick="ComingSoon.show('Royal Ticket', 'O programa de fidelidade e experiência VIP da Gorilaz. Recompense seus melhores clientes com benefícios exclusivos.')">
        <span class="nav-icon">${iconRoyalTicket()}</span>
        Royal Ticket
        <span class="nav-coming-lock">${iconLock()}</span>
      </div>`

    const bottomItems = navItems.filter(i => !['categorias','relatorios'].includes(i.id))
    const bottomNavHTML = bottomItems.map(item => `
      <a href="${item.id}.html" class="bottom-nav-item ${page === item.id ? 'active' : ''}" data-page="${item.id}">
        ${item.icon}
        <span>${item.label}</span>
        ${page === item.id ? '<div class="bottom-nav-indicator"></div>' : ''}
      </a>`).join('')

    // ── Saudação armazenada para acesso global ──
    window._greet = { period: greetPeriod, msg: greetMsg }

    container.innerHTML = `
      <div id="sidebar-overlay" class="sidebar-overlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="logo-wordmark">
            <div class="logo-text">GORILAZ</div>
            <div class="logo-sub">BARBER FINANCE</div>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}${barberMetasHTML}</nav>
        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="user-avatar-wrap" id="sidebar-avatar-wrap" onclick="document.getElementById('avatar-input').click()" title="Trocar foto de perfil" style="cursor:pointer">
              <div class="user-avatar" id="sidebar-avatar">${initials}</div>
              <div class="avatar-cam-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:8px;height:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div class="user-info-block">
              <div class="user-name" id="sidebar-name">${initials}</div>
              <div class="user-email" id="sidebar-email">${email}</div>
            </div>
          </div>
          <input type="file" id="avatar-input" accept="image/*" style="display:none" onchange="Avatar.upload(this)">
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
          <div class="topbar-brand">
            <div class="topbar-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span class="topbar-brand-text">GORILAZ</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <label for="avatar-input" style="cursor:pointer;display:block;line-height:0">
              <div class="user-avatar" id="topbar-avatar" title="Trocar foto de perfil" style="cursor:pointer">${initials}</div>
            </label>
          </div>
        </header>
        <main class="page-content" id="page-content"></main>
      </div>
      <nav class="bottom-nav">
        <div class="bottom-nav-items">${bottomNavHTML}</div>
      </nav>
    `
    document.getElementById('sidebar-overlay').addEventListener('click', () => Layout.closeSidebar())
    // Carrega avatar salvo
    setTimeout(() => Layout.loadSavedAvatar(), 50)
    setTimeout(() => {
      Privacy._applyValues()
      Privacy._updateBtns()
    }, 40)
    // _bindBtns após botões serem injetados (desktop + mobile)
    setTimeout(() => Privacy._bindBtns(), 200)
    // Carrega nome do perfil na sidebar
    setTimeout(() => Layout.loadProfileName(), 80)
    // Injeta saudação na page-content via evento
    window._greetInjected = false
  },
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open')
    document.getElementById('sidebar-overlay')?.classList.toggle('show')
  },
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open')
    document.getElementById('sidebar-overlay')?.classList.remove('show')
  },
  // ════════════════════════════════════════════
  // DELEGAÇÃO — Avatar gerenciado pelo objeto Avatar
  // ════════════════════════════════════════════
  updateAvatar(input) { Avatar.upload(input) },
  loadSavedAvatar()   { return Avatar.load()  },


  async loadProfileName() {
    try {
      const nameEl = document.getElementById('sidebar-name')
      if (!nameEl || !App.user) return
      const { data: prof } = await window.db
        .from('profiles')
        .select('full_name')
        .eq('user_id', App.user.id)
        .maybeSingle()
      const fullName = prof?.full_name?.trim()
      if (fullName) {
        const firstName = fullName.split(' ')[0]
        nameEl.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        window._firstName = firstName
      }
    } catch(e) {}
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
  monthEnd(y,m)   { const d=new Date(y,m+1,0); return `${y}-${String(m+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` },

  // Ordena opções de categoria: Sem categoria 1º · Outros último · resto alfabético PT-BR
  sortCats(cats) {
    const outros = cats.filter(c => c.toLowerCase() === 'outros')
    const mid    = cats.filter(c => c.toLowerCase() !== 'outros')
      .sort((a,b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    return [...mid, ...outros]
  },
  monthName(m,y)  { const d=new Date(y,m); const mes=d.toLocaleDateString('pt-BR',{month:'long'}); return mes.charAt(0).toUpperCase()+mes.slice(1)+' '+y },
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


// ── 9. MONTH PICKER ──────────────────────────────────────────
const MonthPicker = {
  _instances: {},
  _meses:     ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  _mesesFull: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],

  render(containerId, year, month, callback) {
    const wrap = document.getElementById(containerId)
    if (!wrap) return
    this._instances[containerId] = { year, month, cb: callback }
    const hoje = new Date()
    const labelText = this._mesesFull[month].charAt(0).toUpperCase() + this._mesesFull[month].slice(1) + ' ' + year
    wrap.innerHTML = `
      <div class="mpicker-wrap" id="mpw-${containerId}">
        <button class="mpicker-btn" onclick="MonthPicker._step('${containerId}',-1)">&#8249;</button>
        <span class="mpicker-label" onclick="MonthPicker._toggle('${containerId}')">${labelText}</span>
        <button class="mpicker-btn" onclick="MonthPicker._step('${containerId}',1)">&#8250;</button>
        <div class="mpicker-dropdown" id="mpd-${containerId}">
          <div class="mpicker-year-row">
            <button class="mpicker-year-btn" onclick="MonthPicker._stepYear('${containerId}',-1)">&#8249;</button>
            <span class="mpicker-year-label" id="mpy-${containerId}">${year}</span>
            <button class="mpicker-year-btn" onclick="MonthPicker._stepYear('${containerId}',1)">&#8250;</button>
          </div>
          <div class="mpicker-months" id="mpm-${containerId}">
            ${this._meses.map((m, i) => {
              const isActive  = i === month
              const isCurrent = i === hoje.getMonth() && year === hoje.getFullYear()
              const cls = isActive ? 'mpicker-month active' : isCurrent ? 'mpicker-month current-month' : 'mpicker-month'
              return `<button class="${cls}" onclick="MonthPicker._pick('${containerId}',${i})">${m}</button>`
            }).join('')}
          </div>
        </div>
      </div>`
    this._bindOutsideClick(containerId)
  },

  _step(id, delta) {
    const s = this._instances[id]; if (!s) return
    s.month += delta
    if (s.month > 11) { s.month = 0; s.year++ }
    if (s.month < 0)  { s.month = 11; s.year-- }
    s.cb(s.year, s.month)
  },

  _stepYear(id, delta) {
    const s = this._instances[id]; if (!s) return
    s.year += delta
    const yLbl = document.getElementById('mpy-' + id)
    if (yLbl) yLbl.textContent = s.year
    const grid = document.getElementById('mpm-' + id)
    if (grid) {
      const hoje = new Date()
      grid.innerHTML = this._meses.map((m, i) => {
        const isActive  = i === s.month
        const isCurrent = i === hoje.getMonth() && s.year === hoje.getFullYear()
        const cls = isActive ? 'mpicker-month active' : isCurrent ? 'mpicker-month current-month' : 'mpicker-month'
        return `<button class="${cls}" onclick="MonthPicker._pick('${id}',${i})">${m}</button>`
      }).join('')
    }
  },

  _pick(id, month) {
    const s = this._instances[id]; if (!s) return
    s.month = month
    this._close(id)
    s.cb(s.year, s.month)
  },

  _toggle(id) {
    const dd = document.getElementById('mpd-' + id); if (!dd) return
    const isOpen = dd.classList.contains('open')
    this.closeAll()
    if (!isOpen) dd.classList.add('open')
  },

  _close(id)  { document.getElementById('mpd-' + id)?.classList.remove('open') },
  closeAll()  { document.querySelectorAll('.mpicker-dropdown.open').forEach(el => el.classList.remove('open')) },

  _bindOutsideClick(id) {
    const key = '_mpOutside_' + id
    if (this[key]) document.removeEventListener('click', this[key])
    this[key] = (e) => {
      const wrap = document.getElementById('mpw-' + id)
      if (wrap && !wrap.contains(e.target)) this._close(id)
    }
    setTimeout(() => document.addEventListener('click', this[key]), 50)
  }
}


// ── COMING SOON MODAL ────────────────────────────────────────
// Reutilizável: ComingSoon.show('Nome', 'Descrição específica')
const ComingSoon = {
  show(featureName, featureDesc) {
    // Remove modal existente se houver
    document.getElementById('coming-soon-modal')?.remove()

    const modal = document.createElement('div')
    modal.id = 'coming-soon-modal'
    modal.className = 'modal-overlay'
    modal.style.cssText = 'z-index:9000'
    modal.innerHTML = `
      <div class="modal-box cs-modal-box" role="dialog" aria-modal="true" aria-label="Funcionalidade em breve">
        <div class="cs-header">
          <div class="cs-rocket-wrap">
            <div class="cs-rocket-glow"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="cs-rocket-icon" aria-hidden="true">
              <path d="M4.5 16.5c-1.5 1.5-2 4-2 4s2.5-.5 4-2l8-8c.5-.5.5-1.5 0-2l-2-2c-.5-.5-1.5-.5-2 0l-8 8z"/>
              <path d="M15 5s2 0 4 2-2 4-2 4"/>
              <path d="M9 11l4 4"/>
              <circle cx="18" cy="6" r="1" fill="currentColor"/>
            </svg>
          </div>
          <button class="btn btn-ghost btn-icon cs-close-btn" onclick="ComingSoon.close()" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="cs-body">
          <div class="cs-badge-em-breve">🚀 EM BREVE</div>
          <div class="cs-title">${featureName}</div>
          <div class="cs-desc">${featureDesc}</div>
          <div class="cs-divider"></div>
          <div class="cs-promo">
            <div class="cs-promo-icon">🔥</div>
            <div>
              <div class="cs-promo-title">Em breve no Barber Finance</div>
              <div class="cs-promo-text">Acompanhe metas de faturamento, quantidade de serviços realizados e vendas de produtos em tempo real.</div>
              <div class="cs-promo-launch">Lançamento previsto para as próximas versões.</div>
            </div>
          </div>
        </div>
        <div class="cs-footer">
          <button class="btn btn-lime btn-full" onclick="ComingSoon.close()">Entendido</button>
        </div>
      </div>`

    document.body.appendChild(modal)
    // Fecha ao clicar fora
    modal.addEventListener('click', (e) => { if (e.target === modal) ComingSoon.close() })
    // Fecha com Esc
    modal._escHandler = (e) => { if (e.key === 'Escape') ComingSoon.close() }
    document.addEventListener('keydown', modal._escHandler)
    // Foco no modal
    requestAnimationFrame(() => modal.querySelector('.cs-close-btn')?.focus())
  },

  close() {
    const modal = document.getElementById('coming-soon-modal')
    if (!modal) return
    document.removeEventListener('keydown', modal._escHandler)
    modal.style.opacity = '0'
    modal.style.transition = 'opacity 0.15s'
    setTimeout(() => modal.remove(), 150)
  }
}


// ════════════════════════════════════════════════════════
// AVATAR — fonte de verdade ÚNICA: profiles.avatar_url
// Todas as telas usam as mesmas duas funções:
//   Avatar.load()         — carrega do Supabase e aplica
//   Avatar.upload(input)  — faz upload e salva no Supabase
// ════════════════════════════════════════════════════════
const Avatar = {

  // Aplica a foto em TODOS os .user-avatar da tela
  // Regra: qualquer elemento que exiba foto DO USUÁRIO deve ter classe .user-avatar
  _apply(src) {
    if (!src) return
    const img = `<img src="${src}" alt="Foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    document.querySelectorAll('.user-avatar').forEach(el => {
      el.innerHTML = img
      el.style.padding   = '0'
      el.style.fontSize  = '0'
      el.style.lineHeight = '0'
    })
    // Perfil: img tag separada
    const pimg = document.getElementById('perfil-avatar-img')
    if (pimg) { pimg.src = src; pimg.style.display = '' }
    const pinit = document.getElementById('av-big-initials')
    if (pinit) pinit.style.display = 'none'
    // Copa ranking (página separada, não tem .user-avatar do sistema)
    document.querySelectorAll('.copa-rank-avatar[data-own="true"]').forEach(el => {
      el.innerHTML = img; el.style.padding='0'; el.style.fontSize='0'
    })
    // Guardar em memória para componentes que renderizarem depois
    window.__avatarUrl = src
  },

  // loadUserAvatar() — busca profiles.avatar_url e aplica em toda a tela
  async load() {
    try {
      if (!App?.user?.id || !window.db) return
      const { data: prof } = await window.db
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', App.user.id)
        .maybeSingle()
      if (prof?.avatar_url) {
        this._apply(prof.avatar_url)
      }
    } catch(e) {
      console.warn('[Avatar.load]', e.message)
    }
  },

  // uploadAvatar() — única função de upload, funciona em desktop e mobile
  async upload(input) {
    const file = input?.files?.[0]
    if (!file || !App?.user?.id || !window.db) return

    const uid = App.user.id

    // 1. Comprimir para 200×200 JPEG ~20KB via canvas
    const b64 = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          const MAX = 200
          let w = img.width, h = img.height
          if (w > h) { if (w > MAX) { h = Math.round(h*MAX/w); w = MAX } }
          else       { if (h > MAX) { w = Math.round(w*MAX/h); h = MAX } }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    })

    // 2. Aplicar preview imediato na tela
    this._apply(b64)

    // 3. Salvar em profiles.avatar_url — fonte de verdade para todos os devices
    const { error } = await window.db.from('profiles')
      .upsert({ user_id: uid, avatar_url: b64 }, { onConflict: 'user_id' })

    if (error) {
      console.warn('[Avatar.upload] DB error:', error.message)
      return
    }
    console.log('[Avatar.upload] Salvo em profiles.avatar_url ✓')

    // 4. (Opcional) Tentar Storage para URL pública mais leve
    try {
      const blob = await fetch(b64).then(r => r.blob())
      const path = `${uid}/avatar.jpg`
      const { error: upErr } = await window.db.storage
        .from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (!upErr) {
        const { data } = window.db.storage.from('avatars').getPublicUrl(path)
        if (data?.publicUrl) {
          await window.db.from('profiles')
            .upsert({ user_id: uid, avatar_url: data.publicUrl }, { onConflict: 'user_id' })
          this._apply(data.publicUrl)
          console.log('[Avatar.upload] URL pública atualizada ✓')
        }
      }
    } catch(_) { /* Storage não configurado — base64 no banco é suficiente */ }
  }
}

// Expor globalmente
window.Avatar          = Avatar
window.loadUserAvatar  = ()  => Avatar.load()
window.updateUserAvatar = (src) => Avatar._apply(src)


// ════════════════════════════════════════════════════════
// PRIVACY — Ocultar/exibir valores financeiros
//
// REGRA CENTRAL:
//   Cada .financial-value deve ter data-real-value preenchido
//   pelo módulo que gerou o valor (dashboard, receitas, etc.)
//   Privacy NUNCA captura textContent — só lê data-real-value.
//
// FLUXO:
//   1. Módulo escreve valor → chama Privacy.register(el, valor)
//   2. Clique no olho → Privacy.toggle()
//   3. toggle() → salva no localStorage → chama apply()
//   4. apply() → lê data-real-value (não textContent)
//      → se hidden: textContent = '••••••'
//      → se visible: textContent = data-real-value
// ════════════════════════════════════════════════════════
const Privacy = {
  KEY:  'financeVisibility',
  MASK: '••••••',

  isHidden() {
    return localStorage.getItem(this.KEY) === 'hidden'
  },

  // Registrar um valor em um elemento — chamado pelos módulos ao escrever valores
  // Salva o valor real em data-real-value e aplica o estado atual
  register(el, valorTexto) {
    if (!el) return
    el.setAttribute('data-real-value', valorTexto)
    el.textContent = this.isHidden() ? this.MASK : valorTexto
  },

  // Aplicar estado atual a todos os .financial-value que já têm data-real-value
  apply() {
    const hidden = this.isHidden()
    document.querySelectorAll('.financial-value[data-real-value]').forEach(el => {
      el.textContent = hidden ? this.MASK : el.getAttribute('data-real-value')
    })
    this._updateBtns()
  },

  // Alternar visibilidade
  toggle() {
    localStorage.setItem(this.KEY, this.isHidden() ? 'visible' : 'hidden')
    this.apply()
  },

  // Atualizar ícone dos botões sem trocar o innerHTML do botão inteiro
  _updateBtns() {
    const hidden = this.isHidden()
    const label  = hidden ? 'Mostrar valores' : 'Ocultar valores'
    document.querySelectorAll('[data-toggle-finance-visibility]').forEach(btn => {
      const svg = btn.querySelector('svg')
      if (svg) svg.innerHTML = hidden
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      btn.title = label
      btn.setAttribute('aria-label',   label)
      btn.setAttribute('aria-pressed', String(hidden))
    })
  },

  // Bind nos botões — UMA vez, com proteção anti-duplicata
  _bindBtns() {
    document.querySelectorAll('[data-toggle-finance-visibility]').forEach(btn => {
      if (btn.dataset.privacyBound) return
      btn.dataset.privacyBound = '1'
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        Privacy.toggle()
      })
    })
  },

  // Gera HTML do botão
  btnHTML() {
    const hidden  = this.isHidden()
    const label   = hidden ? 'Mostrar valores' : 'Ocultar valores'
    const svgPath = hidden
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    return `<button type="button" class="privacy-btn" data-toggle-finance-visibility title="${label}" aria-label="${label}" aria-pressed="${hidden}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;pointer-events:none">${svgPath}</svg></button>`
  }
}

// Funções globais
function toggleFinanceVisibility()  { Privacy.toggle() }
function updateFinanceVisibility()  { Privacy.apply()  }

// ── 8. EXPÕE GLOBALMENTE ─────────────────────
window.Auth   = Auth
window.Layout = Layout
window.Toast  = Toast
window.Modal  = Modal
window.Utils       = Utils
window.MonthPicker      = MonthPicker
window.ComingSoon   = ComingSoon
window.Privacy      = Privacy
window.toggleFinanceVisibility = toggleFinanceVisibility
window.updateFinanceVisibility = updateFinanceVisibility
