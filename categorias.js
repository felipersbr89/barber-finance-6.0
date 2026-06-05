/* ═══════════════════════════════════════════
   GORILAZ — categorias.js
   Gestão de categorias de receitas e despesas
   com visão de gastos/ganhos por categoria
═══════════════════════════════════════════ */
const CategoriasModule = (() => {

  // Categorias fixas padrão do sistema
  const CATS_DESPESA = [
    { nome:'Aluguel',       icon:'🏠', cor:'#ef4444' },
    { nome:'Produtos',      icon:'📦', cor:'#f97316' },
    { nome:'Energia',       icon:'⚡', cor:'#eab308' },
    { nome:'Água',          icon:'💧', cor:'#3b82f6' },
    { nome:'Internet',      icon:'📡', cor:'#8b5cf6' },
    { nome:'Transporte',    icon:'🚗', cor:'#06b6d4' },
    { nome:'Alimentação',   icon:'🍽️', cor:'#84cc16' },
    { nome:'Equipamentos',  icon:'🔧', cor:'#64748b' },
    { nome:'Marketing',     icon:'📣', cor:'#ec4899' },
    { nome:'Impostos',      icon:'📋', cor:'#f87171' },
    { nome:'Outros',        icon:'💸', cor:'#71717a' },
  ]
  const CATS_RECEITA = [
    { nome:'Corte de Cabelo', icon:'✂️',  cor:'#4ade80' },
    { nome:'Barba',           icon:'🪒',  cor:'#22c55e' },
    { nome:'Pigmentação',     icon:'🎨',  cor:'#a3e635' },
    { nome:'Sobrancelha',     icon:'✨',  cor:'#84cc16' },
    { nome:'Hidratação',      icon:'💆',  cor:'#34d399' },
    { nome:'Comissão',        icon:'💼',  cor:'#2dd4bf' },
    { nome:'Bônus',           icon:'🎁',  cor:'#facc15' },
    { nome:'Dividendos',      icon:'📈',  cor:'#fb923c' },
    { nome:'Outros',          icon:'💰',  cor:'#71717a' },
  ]

  let tabAtiva = 'despesa'
  let resumoDesp = {}, resumoRec = {}

  async function init(container) {
    container.innerHTML = renderUI()
    await carregar()
  }

  function renderUI() {
    return `
      <div class="page-header">
        <div>
          <div class="page-title">Categorias</div>
          <div class="page-sub">Veja quanto gasta e ganha por categoria</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab active" id="tab-desp" onclick="CategoriasModule.setTab('despesa')">💸 Despesas</button>
        <button class="tab"        id="tab-rec"  onclick="CategoriasModule.setTab('receita')">💰 Receitas</button>
      </div>

      <!-- KPIs da aba ativa -->
      <div class="grid-3" id="cat-kpis" style="margin-bottom:16px"></div>

      <!-- Grid de categorias com barras -->
      <div class="panel">
        <div class="panel-title" id="cat-panel-title">Despesas por categoria — mês atual</div>
        <div id="cat-bars-list"></div>
      </div>

      <!-- Histórico mensal por categoria -->
      <div class="panel">
        <div class="panel-title">Histórico dos últimos 6 meses</div>
        <div id="cat-historico"></div>
      </div>
    `
  }

  async function carregar() {
    const uid = App.user.id
    // Últimos 6 meses
    const hoje = new Date()
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
    const startStr = inicio.toISOString().split('T')[0]

    const [rD, rR] = await Promise.all([
      window.db.from('despesas').select('categoria,valor,data').eq('user_id', uid).gte('data', startStr),
      window.db.from('receitas').select('categoria,valor,data').eq('user_id', uid).gte('data', startStr),
    ])

    // Agrupa pelo mês atual
    const mesAtual = Utils.monthStr(hoje.getFullYear(), hoje.getMonth())
    const despMes  = (rD.data||[]).filter(d => d.data?.startsWith(mesAtual))
    const recMes   = (rR.data||[]).filter(r => r.data?.startsWith(mesAtual))

    // Soma por categoria — mês atual
    resumoDesp = {}
    despMes.forEach(d => {
      const k = d.categoria || 'Outros'
      resumoDesp[k] = (resumoDesp[k]||0) + Number(d.valor||0)
    })
    resumoRec = {}
    recMes.forEach(r => {
      const k = r.categoria || 'Outros'
      resumoRec[k] = (resumoRec[k]||0) + Number(r.valor||0)
    })

    // Histórico 6 meses por categoria
    window._catHistDesp = agruparHistorico(rD.data||[], 6)
    window._catHistRec  = agruparHistorico(rR.data||[], 6)

    renderTab()
  }

  function agruparHistorico(rows, nMeses) {
    const hoje = new Date()
    const meses = []
    for (let i = nMeses - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      meses.push(Utils.monthStr(d.getFullYear(), d.getMonth()))
    }
    const hist = {}
    rows.forEach(r => {
      const mes = r.data?.slice(0,7)
      if (!meses.includes(mes)) return
      const k = r.categoria || 'Outros'
      if (!hist[k]) hist[k] = {}
      hist[k][mes] = (hist[k][mes]||0) + Number(r.valor||0)
    })
    return { meses, hist }
  }

  function renderTab() {
    const isDesp = tabAtiva === 'despesa'
    const cats   = isDesp ? CATS_DESPESA : CATS_RECEITA
    const resumo = isDesp ? resumoDesp   : resumoRec
    const histData = isDesp ? window._catHistDesp : window._catHistRec

    // KPIs
    const total    = Object.values(resumo).reduce((s,v) => s+v, 0)
    const maiorK   = Object.entries(resumo).sort((a,b) => b[1]-a[1])[0]
    const qtdCats  = Object.keys(resumo).filter(k => resumo[k] > 0).length
    const kpiEl    = document.getElementById('cat-kpis')
    if (kpiEl) kpiEl.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-label">Total ${isDesp ? 'despesas' : 'receitas'}</span>
          <div class="card-icon ${isDesp ? 'bg-red-soft' : 'bg-green-soft'}">${isDesp ? iconDespesas() : iconReceitas()}</div>
        </div>
        <div class="card-value ${isDesp ? 'c-red' : 'c-green'}">${Utils.fmtShort(total)}</div>
        <div class="card-hint">mês atual</div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-label">Maior categoria</span>
          <div class="card-icon bg-lime-soft">${iconTag()}</div>
        </div>
        <div class="card-value c-lime" style="font-size:15px">${maiorK ? maiorK[0] : '—'}</div>
        <div class="card-hint">${maiorK ? Utils.fmt(maiorK[1]) : 'sem dados'}</div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-label">Categorias ativas</span>
          <div class="card-icon bg-blue-soft">${iconCategorias()}</div>
        </div>
        <div class="card-value c-blue">${qtdCats}</div>
        <div class="card-hint">com movimentação</div>
      </div>
    `

    // Painel título
    const ptEl = document.getElementById('cat-panel-title')
    if (ptEl) ptEl.textContent = `${isDesp ? 'Despesas' : 'Receitas'} por categoria — mês atual`

    // Barras por categoria
    const listEl = document.getElementById('cat-bars-list')
    if (!listEl) return
    const sorted = cats
      .map(c => ({ ...c, valor: resumo[c.nome] || 0 }))
      .filter(c => c.valor > 0)
      .sort((a,b) => b.valor - a.valor)

    if (!sorted.length) {
      listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--t4);font-size:13px">Nenhuma movimentação neste mês</div>`
    } else {
      const max = sorted[0].valor
      listEl.innerHTML = sorted.map(c => {
        const pct = total > 0 ? ((c.valor / total) * 100).toFixed(1) : 0
        const barW = max > 0 ? (c.valor / max * 100) : 0
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--b1)">
            <div style="width:36px;height:36px;border-radius:var(--r2);background:${c.cor}18;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${c.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <span style="font-size:13px;font-weight:500">${Utils.esc(c.nome)}</span>
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:11px;color:var(--t3)">${pct}%</span>
                  <span style="font-size:13px;font-weight:700;color:${c.cor}">${Utils.fmt(c.valor)}</span>
                </div>
              </div>
              <div class="progress"><div class="progress-bar" style="width:${barW}%;background:${c.cor}"></div></div>
            </div>
          </div>`
      }).join('')
    }

    // Histórico
    const histEl = document.getElementById('cat-historico')
    if (!histEl || !histData) return
    const { meses, hist } = histData
    const topCats = cats
      .map(c => c.nome)
      .filter(n => meses.some(m => hist[n]?.[m] > 0))
      .slice(0, 5)

    if (!topCats.length) {
      histEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--t4);font-size:13px">Sem histórico disponível</div>`
      return
    }

    const COLORS = ['#84cc16','#ef4444','#3b82f6','#f97316','#8b5cf6']
    const mesesLabel = meses.map(m => {
      const [y, mo] = m.split('-')
      return new Date(y, mo-1).toLocaleDateString('pt-BR', { month:'short' })
    })

    histEl.innerHTML = `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 12px;color:var(--t3);font-weight:500;white-space:nowrap">Categoria</th>
              ${mesesLabel.map(m => `<th style="text-align:right;padding:8px 12px;color:var(--t3);font-weight:500;white-space:nowrap">${m}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${topCats.map((cat, i) => `
              <tr style="border-top:1px solid var(--b1)">
                <td style="padding:10px 12px;font-weight:500;display:flex;align-items:center;gap:7px">
                  <div style="width:8px;height:8px;border-radius:50%;background:${COLORS[i%COLORS.length]};flex-shrink:0"></div>
                  ${Utils.esc(cat)}
                </td>
                ${meses.map(m => {
                  const v = hist[cat]?.[m] || 0
                  return `<td style="text-align:right;padding:10px 12px;color:${v > 0 ? 'var(--tx)' : 'var(--t4)'}">${v > 0 ? Utils.fmt(v) : '—'}</td>`
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  return {
    init,
    setTab(tab) {
      tabAtiva = tab
      document.getElementById('tab-desp')?.classList.toggle('active', tab === 'despesa')
      document.getElementById('tab-rec')?.classList.toggle('active',  tab === 'receita')
      renderTab()
    }
  }
})()
