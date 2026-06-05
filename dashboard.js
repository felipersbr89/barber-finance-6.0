/* ═══════════════════════════════════════════
   GORILAZ — modules/dashboard.js
   Dashboard: KPIs, gráfico diário, metas, últimas movimentações
═══════════════════════════════════════════ */
const DashboardModule = (() => {

  let viewMonth = new Date().getMonth()
  let viewYear  = new Date().getFullYear()

  // ── INIT ────────────────────────────────
  async function init(container) {
    container.innerHTML = renderSkeleton()
    await load()
  }

  // ── SKELETON ────────────────────────────
  function renderSkeleton() {
    return `
      <div class="gb-greeting" id="dash-greeting">
        <div class="gb-greeting-period" id="dash-greet-period">Carregando...</div>
        <div class="gb-greeting-name" id="dash-greet-name">Olá!</div>
        <div class="gb-greeting-msg"  id="dash-greet-msg"></div>
      </div>
      <div class="page-header">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-sub" id="dash-sub">Carregando...</div>
        </div>
        <div id="dash-mpicker"></div>
      </div>
      <!-- Hero Card (estilo DEMO) -->
      <div class="hero-card" id="dash-hero" style="display:none;animation:none">
        <div class="hero-card-deco"></div>
        <div class="hero-card-deco2"></div>
        <div class="hero-card-label">Saldo do mês</div>
        <div class="hero-card-value" id="hero-balance">—</div>
        <div class="hero-card-sub" id="hero-sub">Receitas — Despesas</div>
        <div class="hero-card-badge" id="hero-badge" style="display:none">
          ${iconArrowUp()} <span id="hero-badge-txt"></span>
        </div>
      </div>

      <!-- KPI Cards com barra colorida na base (estilo DEMO) -->
      <div class="grid-3" style="margin-bottom:14px">
        <div class="card" style="padding:16px 18px">
          <div class="card-icon bg-green-soft" style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px">${iconReceitas()}</div>
          <div class="card-label">RECEITAS</div>
          <div class="card-value c-green" id="kpi-income">—</div>
          <div class="card-hint" id="kpi-income-hint"></div>
          <div class="card-kpi-bar green"></div>
        </div>
        <div class="card" style="padding:16px 18px">
          <div class="card-icon bg-red-soft" style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px">${iconDespesas()}</div>
          <div class="card-label">DESPESAS</div>
          <div class="card-value c-red" id="kpi-expense">—</div>
          <div class="card-hint" id="kpi-expense-hint"></div>
          <div class="card-kpi-bar red"></div>
        </div>
        <div class="card" style="padding:16px 18px">
          <div class="card-icon bg-lime-soft" style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px">${iconInvest()}</div>
          <div class="card-label">SALDO</div>
          <div class="card-value c-lime" id="kpi-balance">—</div>
          <div class="card-hint" id="kpi-balance-hint"></div>
          <div class="card-kpi-bar lime"></div>
        </div>
      </div>
      <div class="grid-2" style="margin-bottom:16px">
        <div class="panel">
          <div class="panel-title" style="display:flex;align-items:center;justify-content:space-between">Últimas movimentações <a href="receitas.html" class="panel-link">Ver tudo</a></div>
          <div id="recent-list"><div class="loading-state"><span class="spin"></span> Carregando...</div></div>
        </div>
        <div class="panel">
          <div class="panel-title" style="display:flex;align-items:center;justify-content:space-between">Metas financeiras <a href="metas.html" class="panel-link">Ver tudo</a></div>
          <div id="goals-list"><div class="loading-state"><span class="spin"></span> Carregando...</div></div>
        </div>
      </div>
      <div class="panel hidden" id="chart-panel" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          <div class="panel-title" style="margin-bottom:0">Movimentação diária</div>
          <div class="bar-legend">
            <div style="display:flex;align-items:center;gap:6px"><div class="bar-leg-dot" style="background:#4ade8070"></div><span class="bar-leg-txt">Receitas</span></div>
            <div style="display:flex;align-items:center;gap:6px"><div class="bar-leg-dot" style="background:#f8717170"></div><span class="bar-leg-txt">Despesas</span></div>
          </div>
        </div>
        <div class="bar-chart" id="chart-bars" style="height:90px"></div>
      </div>
      <div class="panel hidden" id="pie-panel">
        <div class="panel-title">Despesas por categoria</div>
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <svg id="pie-svg" width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0"></svg>
          <div id="pie-legend" style="flex:1;min-width:180px"></div>
        </div>
      </div>`
  }

  function kpiCard(id, label, bg, icon, color) {
    return `
      <div class="card">
        <div class="card-header">
          <span class="card-label">${label}</span>
          <div class="card-icon ${bg}">${icon}</div>
        </div>
        <div class="card-value ${color}" id="${id}">—</div>
        <div class="card-hint" id="${id}-hint"></div>
      </div>`
  }

  // ── LOAD DATA ───────────────────────────
  async function load() {
    const uid = App.user.id
    const start = Utils.monthStart(viewYear, viewMonth)
    const end   = Utils.monthEnd(viewYear, viewMonth)

    // Atualiza label do mês
    const nome = Utils.monthName(viewMonth, viewYear)

    const sub = document.getElementById('dash-sub')
    if (sub) sub.textContent = nome

    // Renderiza MonthPicker com dropdown de mês+ano
    MonthPicker.render('dash-mpicker', viewYear, viewMonth, (y, m) => {
      viewYear = y; viewMonth = m
      MonthPicker.closeAll()
      load()
    })

    // Saudação
    // Busca nome do perfil no Supabase
    if (window._greet) {
      const gp = document.getElementById('dash-greet-period')
      const gm = document.getElementById('dash-greet-msg')
      if (gp) gp.textContent = window._greet.period + ','
      if (gm) gm.textContent = window._greet.msg
    }
    // Carrega primeiro nome do perfil cadastrado
    ;(async () => {
      const gn = document.getElementById('dash-greet-name')
      if (!gn) return
      try {
        const { data: prof } = await window.db
          .from('profiles')
          .select('full_name')
          .eq('user_id', App.user.id)
          .maybeSingle()
        const fullName = prof?.full_name?.trim()
        let firstName
        if (fullName) {
          firstName = fullName.split(' ')[0]
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        } else {
          // fallback: parte do email antes do @
          const emailPart = App.user?.email?.split('@')[0] || 'usuário'
          firstName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
        }
        gn.textContent = 'Olá, ' + firstName + '!'
        // Guarda para reusar em outros lugares
        window._firstName = firstName
      } catch(e) {
        const emailPart = App.user?.email?.split('@')[0] || 'usuário'
        gn.textContent = 'Olá, ' + emailPart.charAt(0).toUpperCase() + emailPart.slice(1) + '!'
      }
    })()

    const [rInc, rExp, rRecent, rGoals, rInvest] = await Promise.all([
      window.db.from('receitas').select('valor').eq('user_id', uid).gte('data', start).lte('data', end),
      window.db.from('despesas').select('valor,categoria').eq('user_id', uid).gte('data', start).lte('data', end),
      Promise.all([
        window.db.from('receitas').select('descricao,valor,data,categoria').eq('user_id', uid).gte('data', start).lte('data', end).order('data',{ascending:false}).limit(5),
        window.db.from('despesas').select('descricao,valor,data,categoria').eq('user_id', uid).gte('data', start).lte('data', end).order('data',{ascending:false}).limit(5),
      ]),
      window.db.from('metas').select('nome,valor_alvo,valor_atual').eq('user_id', uid).order('created_at',{ascending:false}).limit(3),
      window.db.from('investimentos').select('valor_atual').eq('user_id', uid),
    ])

    const totalInc = (rInc.data||[]).reduce((s,r) => s + Number(r.valor||0), 0)
    const totalExp = (rExp.data||[]).reduce((s,r) => s + Number(r.valor||0), 0)
    const balance  = totalInc - totalExp
    const savings  = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0

    // Hero card
    const heroEl = document.getElementById('dash-hero')
    if (heroEl) { heroEl.style.display = ''; }
    setText('hero-balance', Utils.fmt(balance))
    const heroSub = document.getElementById('hero-sub')
    if (heroSub) heroSub.textContent = 'Receitas — Despesas de ' + Utils.monthName(viewMonth, viewYear)
    if (savings > 0) {
      const heroBadge = document.getElementById('hero-badge')
      if (heroBadge) heroBadge.style.display = 'flex'
      setText('hero-badge-txt', savings.toFixed(1) + '% taxa de poupança')
    }

    // KPI cards
    setText('kpi-income',       Utils.fmt(totalInc))
    setText('kpi-expense',      Utils.fmt(totalExp))
    setText('kpi-balance',      Utils.fmt(balance))
    const kpiBalEl = document.getElementById('kpi-balance')
    if (kpiBalEl) kpiBalEl.className = 'card-value ' + (balance >= 0 ? 'c-lime' : 'c-red')
    const kpiBar = document.querySelector('.card-kpi-bar.lime, .card-kpi-bar.red')
    if (kpiBar) { kpiBar.className = 'card-kpi-bar ' + (balance >= 0 ? 'lime' : 'red') }
    setText('kpi-balance-hint', balance >= 0 ? 'positivo ✓' : 'negativo ⚠')
    if (totalInc > 0) setText('kpi-income-hint', Utils.fmt(totalInc))
    if (totalInc > 0) setText('kpi-expense-hint', ((totalExp/totalInc)*100).toFixed(1)+'% da receita')

    // Últimas movimentações
    const receitas = (rRecent[0].data||[]).map(r => ({...r, _tipo:'receita'}))
    const despesas = (rRecent[1].data||[]).map(d => ({...d, _tipo:'despesa'}))
    const all = [...receitas, ...despesas].sort((a,b) => b.data.localeCompare(a.data)).slice(0,5)
    renderRecent(all)

    // Metas
    renderGoals(rGoals.data||[])

    // Gráfico diário
    await loadChart(uid, start, end)

    // Pie despesas
    renderPie(rExp.data||[], totalExp)
  }

  async function loadChart(uid, start, end) {
    const [rR, rD] = await Promise.all([
      window.db.from('receitas').select('data,valor').eq('user_id',uid).gte('data',start).lte('data',end),
      window.db.from('despesas').select('data,valor').eq('user_id',uid).gte('data',start).lte('data',end),
    ])
    const map = {}
    ;(rR.data||[]).forEach(r => { if(!map[r.data]) map[r.data]={i:0,e:0}; map[r.data].i+=Number(r.valor||0) })
    ;(rD.data||[]).forEach(r => { if(!map[r.data]) map[r.data]={i:0,e:0}; map[r.data].e+=Number(r.valor||0) })
    const dias = Object.keys(map).sort()
    if (!dias.length) return
    const maxVal = Math.max(...dias.flatMap(d => [map[d].i, map[d].e]), 1)
    const panel = document.getElementById('chart-panel')
    if (panel) panel.classList.remove('hidden')
    const bars = document.getElementById('chart-bars')
    if (bars) bars.innerHTML = dias.map(d => {
      const hi = (map[d].i / maxVal) * 75
      const he = (map[d].e / maxVal) * 75
      const day = d.split('-')[2]
      return `<div class="bar-col">
        <div class="b-income"  style="height:${hi}px" title="Receita: ${Utils.fmt(map[d].i)}"></div>
        <div class="b-expense" style="height:${he}px" title="Despesa: ${Utils.fmt(map[d].e)}"></div>
        <div class="bar-day">${day}</div>
      </div>`
    }).join('')
  }

  function renderRecent(all) {
    const el = document.getElementById('recent-list')
    if (!el) return
    if (!all.length) { el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">Nenhuma movimentação este mês</div>'; return }
    el.innerHTML = all.map(t => {
      const isR = t._tipo === 'receita'
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px;border-radius:10px;cursor:default" onmouseover="this.style.background='var(--s2)'" onmouseout="this.style.background=''">
        <div style="width:34px;height:34px;border-radius:10px;background:${isR?'var(--gr-dim)':'var(--rd-dim)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${isR ? iconArrowUp() : iconArrowDown()}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(t.descricao)}</div>
          <div style="font-size:11px;color:var(--t3);margin-top:2px;display:flex;align-items:center;gap:5px">
            ${t.categoria ? `<span style="background:var(--s2);padding:1px 6px;border-radius:999px;font-size:10px">${Utils.esc(t.categoria)}</span>` : ''}
            <span>${Utils.fmtDate(t.data)}</span>
          </div>
        </div>
        <div style="font-size:13px;font-weight:600;color:${isR?'var(--gr)':'var(--rd)'};flex-shrink:0">${isR?'+':'-'}${Utils.fmt(t.valor)}</div>
      </div>`
    }).join('')
  }

  function renderGoals(metas) {
    const el = document.getElementById('goals-list')
    if (!el) return
    if (!metas.length) { el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">Nenhuma meta cadastrada</div>'; return }
    el.innerHTML = metas.map(g => {
      const pct  = g.valor_alvo>0 ? Math.min((Number(g.valor_atual||0)/Number(g.valor_alvo))*100, 100) : 0
      const done = pct >= 100
      return `<div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;gap:8px">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;min-width:0;flex:1">
            <div style="width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--ac)">${iconMetas()}</div>
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">${Utils.esc(g.nome)}</span>
            ${done ? '<span class="badge badge-lime" style="flex-shrink:0">✓</span>' : ''}
          </div>
          <span style="font-size:12px;color:var(--t2);flex-shrink:0">${Math.round(pct)}%</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${done?'var(--ac2)':'var(--ac)'}"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px">
          <span style="font-size:11px;color:var(--t3)">${Utils.fmt(g.valor_atual||0)}</span>
          <span style="font-size:11px;color:var(--t3)">${Utils.fmt(g.valor_alvo)}</span>
        </div>
      </div>`
    }).join('')
  }

  function renderPie(despesas, total) {
    if (!despesas.length || total === 0) return
    const COLORS = ['#ef4444','#f97316','#8b5cf6','#3b82f6','#06b6d4','#6b7280','#10b981','#f59e0b']
    const catMap = {}
    despesas.forEach(d => { const k = d.categoria||'Outros'; catMap[k] = (catMap[k]||0) + Number(d.valor||0) })
    const cats = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,6)

    let cumAngle = -Math.PI/2
    const cx=70, cy=70, r=60, ir=34
    const paths = cats.map(([,val], i) => {
      const angle = (val/total)*2*Math.PI
      const x1=cx+r*Math.cos(cumAngle), y1=cy+r*Math.sin(cumAngle)
      cumAngle += angle
      const x2=cx+r*Math.cos(cumAngle), y2=cy+r*Math.sin(cumAngle)
      const ix1=cx+ir*Math.cos(cumAngle-angle), iy1=cy+ir*Math.sin(cumAngle-angle)
      const ix2=cx+ir*Math.cos(cumAngle), iy2=cy+ir*Math.sin(cumAngle)
      const la = angle>Math.PI?1:0
      return `<path d="M${x1} ${y1} A${r} ${r} 0 ${la} 1 ${x2} ${y2} L${ix2} ${iy2} A${ir} ${ir} 0 ${la} 0 ${ix1} ${iy1}Z" fill="${COLORS[i%COLORS.length]}" stroke="var(--s1)" stroke-width="2"/>`
    })

    const psvg = document.getElementById('pie-svg')
    if (psvg) psvg.innerHTML = paths.join('') + `<circle cx="${cx}" cy="${cy}" r="${ir}" fill="var(--s1)"/>`

    const pleg = document.getElementById('pie-legend')
    if (pleg) pleg.innerHTML = cats.map(([name,val], i) => {
      const pct = (val/total*100).toFixed(1)
      return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${COLORS[i%COLORS.length]};flex-shrink:0"></div>
          <span style="font-size:12px;color:var(--t2)">${Utils.esc(name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:11px;color:var(--t2)">${pct}%</span>
          <span style="font-size:12px;font-weight:600">${Utils.fmt(val)}</span>
        </div>
      </div>`
    }).join('')

    document.getElementById('pie-panel')?.classList.remove('hidden')
  }

  // Helpers
  function setText(id, val) { const el = document.getElementById(id); if(el) el.textContent = val }
  function setClass(id, cls) { const el = document.getElementById(id); if(el) el.className = cls }

  return {
    init,
    changeMonth(delta) {
      viewMonth += delta
      if (viewMonth > 11) { viewMonth = 0; viewYear++ }
      if (viewMonth < 0)  { viewMonth = 11; viewYear-- }
      MonthPicker.closeAll()
      load()
    }
  }
})()
