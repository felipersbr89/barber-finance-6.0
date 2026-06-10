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
    const iconFaturamento = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`
    const iconServicos    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    const iconProdutos    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
    const iconLock        = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

    const iconCopa = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`

    const barberMetasHTML = `
      <div class="nav-section-label nav-section-premium">
        BARBER METAS
        <span class="nav-section-badge">NOVO</span>
      </div>
      <a href="copa-gorilaz.html" class="nav-item nav-item-copa" style="color:var(--ac);background:var(--ac-dim);border-color:var(--ac-bdr)">
        <span class="nav-icon">${iconCopa()}</span>
        Copa Gorilaz 🏆
      </a>
      <div class="nav-item nav-item-coming" onclick="ComingSoon.show('Meta de Faturamento', 'Acompanhe em tempo real o faturamento da sua barbearia e defina metas mensais para crescer de forma consistente.')">
        <span class="nav-icon">${iconFaturamento()}</span>
        Meta de Faturamento
        <span class="nav-coming-lock">${iconLock()}</span>
      </div>
      <div class="nav-item nav-item-coming" onclick="ComingSoon.show('Meta de Serviços', 'Defina metas de quantidade de serviços realizados por dia, semana ou mês e acompanhe sua produtividade.')">
        <span class="nav-icon">${iconServicos()}</span>
        Meta de Serviços
        <span class="nav-coming-lock">${iconLock()}</span>
      </div>
      <div class="nav-item nav-item-coming" onclick="ComingSoon.show('Meta de Produtos', 'Monitore as vendas de produtos da sua barbearia e estabeleça metas para maximizar sua receita adicional.')">
        <span class="nav-icon">${iconProdutos()}</span>
        Meta de Produtos
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
            <div class="user-avatar-wrap" id="sidebar-avatar-wrap" onclick="document.getElementById('gb-avatar-input').click()" title="Trocar foto de perfil" style="cursor:pointer">
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
          <input type="file" id="gb-avatar-input" accept="image/*" style="display:none" onchange="Layout.updateAvatar(this)">
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
          <label for="gb-avatar-input-mobile" style="cursor:pointer;display:block">
            <div class="user-avatar" id="topbar-avatar" title="Trocar foto de perfil" style="cursor:pointer;position:relative">${initials}</div>
          </label>
          <input type="file" id="gb-avatar-input-mobile" accept="image/*" style="display:none" onchange="Layout.updateAvatar(this)">
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
  // ════════════════════════════════════════════════
  // AVATAR SYSTEM — fonte de verdade: profiles.avatar_url
  // ════════════════════════════════════════════════

  // Chave única no localStorage
  _AVATAR_KEY: 'gb_avatar_url',

  // Retorna a URL do avatar atual (de qualquer fonte)
  _getAvatarUrl() {
    return window._gbAvatarUrl || localStorage.getItem('gb_avatar_url') || null
  },

  // updateUserAvatar() — função global, chamada por qualquer componente
  // Atualiza TODOS os avatares visíveis na tela imediatamente
  updateUserAvatar(src) {
    if (!src) return
    window._gbAvatarUrl = src
    try { localStorage.setItem('gb_avatar_url', src) } catch(_) {}

    const img = `<img src="${src}" alt="Foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`

    // 1. Sidebar desktop
    const sav = document.getElementById('sidebar-avatar')
    if (sav) { sav.innerHTML = img; sav.style.padding='0'; sav.style.fontSize='0' }

    // 2. Topbar mobile
    const tav = document.getElementById('topbar-avatar')
    if (tav) { tav.innerHTML = img; tav.style.padding='0'; tav.style.fontSize='0' }

    // 3. Página Perfil (se estiver aberta)
    const pimg = document.getElementById('perfil-avatar-img')
    if (pimg) { pimg.src=src; pimg.style.display='' }
    const pinit = document.getElementById('av-big-initials')
    if (pinit) pinit.style.display='none'

    // 4. Copa Gorilaz — todos os avatares do usuário logado
    document.querySelectorAll('.copa-rank-avatar[data-own="true"]').forEach(el => {
      el.innerHTML = img; el.style.padding='0'; el.style.fontSize='0'
    })
  },

  // Carrega avatar do Supabase (fonte de verdade) e propaga
  async loadSavedAvatar() {
    // Aplicar cache local imediatamente (sem latência)
    const cached = this._getAvatarUrl()
    if (cached) this.updateUserAvatar(cached)

    // Buscar do Supabase (fonte de verdade)
    try {
      if (!App.user?.id || !window.db) return
      const { data: prof } = await window.db
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', App.user.id)
        .maybeSingle()

      if (prof?.avatar_url && prof.avatar_url !== cached) {
        this.updateUserAvatar(prof.avatar_url)
      }
    } catch(err) {
      console.warn('[Avatar] loadSavedAvatar:', err.message)
    }
  },

  // Chamado pelo input file (desktop sidebar, mobile topbar, página perfil)
  async updateAvatar(input) {
    const file = input.files[0]
    if (!file) return

    // Preview imediato com base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = e.target.result

      // 1. Aplica imediatamente em toda a tela
      this.updateUserAvatar(b64)

      // 2. Upload para Supabase Storage
      try {
        const uid = App.user?.id
        if (!uid || !window.db) return
        const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${uid}/avatar.${ext}`

        const { error: upErr } = await window.db.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type })

        if (upErr) {
          console.warn('[Avatar] Storage error:', upErr.message)
          // Mantém o base64 no localStorage como fallback
          return
        }

        // 3. Obter URL pública
        const { data: urlData } = window.db.storage.from('avatars').getPublicUrl(path)
        const publicUrl = urlData?.publicUrl
        if (!publicUrl) return

        // 4. Persistir URL pública no profile (sobrescreve base64 no cache)
        await window.db.from('profiles')
          .upsert({ user_id: uid, avatar_url: publicUrl }, { onConflict: 'user_id' })

        // 5. Atualizar cache com URL pública (mais leve que base64)
        this.updateUserAvatar(publicUrl)

      } catch(err) {
        console.warn('[Avatar] Upload error:', err.message)
      }
    }
    reader.readAsDataURL(file)
  },

  // Expõe globalmente para ser chamado de qualquer módulo
  // Ex: window.updateUserAvatar(src)

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

// ── 8. EXPÕE GLOBALMENTE ─────────────────────
window.Auth   = Auth
window.Layout = Layout
window.Toast  = Toast
window.Modal  = Modal
window.Utils       = Utils
window.MonthPicker      = MonthPicker
window.updateUserAvatar = (src) => Layout.updateUserAvatar(src)
window.ComingSoon   = ComingSoon
