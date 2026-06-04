/* ═══════════════════════════════════════════
   GORILAZ — relatorios.js
   Análise financeira senior: insights, tendências,
   exportação CSV/Excel e relatório em PDF (print)
═══════════════════════════════════════════ */
const RelatoriosModule = (() => {

  let todosRec = [], todosDesp = [], todosInv = [], todosMetas = []
  let periodoMeses = 3  // padrão: últimos 3 meses

  async function init(container) {
    container.innerHTML = renderUI()
    await carregar()
  }

  function renderUI() {
    return `
      <div class="page-header">
        <div>
          <div class="page-title">Relatórios & Análise</div>
          <div class="page-sub">Análise completa da saúde financeira da sua barbearia</div>
        </div>
      </div>

      <!-- Período -->
      <div class="panel" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">Período de análise</div>
            <div style="font-size:12px;color:var(--muted)">Selecione o período para gerar os relatórios</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="filter-btn on" id="per-1"  onclick="RelatoriosModule.setPeriodo(1)">1 mês</button>
            <button class="filter-btn"   id="per-3"  onclick="RelatoriosModule.setPeriodo(3)">3 meses</button>
            <button class="filter-btn"   id="per-6"  onclick="RelatoriosModule.setPeriodo(6)">6 meses</button>
            <button class="filter-btn"   id="per-12" onclick="RelatoriosModule.setPeriodo(12)">12 meses</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div id="rel-loading" class="panel" style="text-align:center;padding:40px">
        <span class="spin" style="width:24px;height:24px;border-width:3px;display:inline-block"></span>
        <div style="margin-top:12px;font-size:13px;color:var(--muted)">Analisando seus dados...</div>
      </div>

      <!-- Conteúdo (oculto até carregar) -->
      <div id="rel-content" style="display:none">

        <!-- KPIs principais -->
        <div class="grid-4" id="rel-kpis" style="margin-bottom:14px"></div>

        <!-- 🧠 Insights do analista sênior -->
        <div class="panel" style="margin-bottom:14px;border-color:var(--lime-border);background:linear-gradient(135deg,var(--lime-bg) 0%,var(--surface) 100%)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            ${iconBulb()}
            <div class="panel-title" style="margin:0;color:var(--lime)">Análise do seu negócio</div>
          </div>
          <div id="rel-insights"></div>
        </div>

        <!-- Receitas vs Despesas por mês -->
        <div class="panel" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="panel-title" style="margin:0">Receitas vs Despesas</div>
            <div style="display:flex;gap:10px">
              <div style="display:flex;align-items:center;gap:5px"><div style="width:8px;height:8px;border-radius:2px;background:#4ade8055"></div><span style="font-size:11px;color:var(--muted)">Receitas</span></div>
              <div style="display:flex;align-items:center;gap:5px"><div style="width:8px;height:8px;border-radius:2px;background:#f8717155"></div><span style="font-size:11px;color:var(--muted)">Despesas</span></div>
            </div>
          </div>
          <div id="rel-chart" style="overflow-x:auto"></div>
        </div>

        <!-- Duas colunas: top despesas + evolução saldo -->
        <div class="grid-2" style="margin-bottom:14px">
          <div class="panel">
            <div class="panel-title">Top 5 — maiores despesas</div>
            <div id="rel-top-desp"></div>
          </div>
          <div class="panel">
            <div class="panel-title">Evolução do saldo mensal</div>
            <div id="rel-saldo-hist"></div>
          </div>
        </div>

        <!-- Rentabilidade por serviço -->
        <div class="panel" style="margin-bottom:14px">
          <div class="panel-title">Receitas por categoria de serviço</div>
          <div id="rel-servicos"></div>
        </div>

        <!-- Exportar -->
        <div class="panel" id="rel-export-panel">
          <div class="panel-title">Exportar relatório</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-lime" onclick="RelatoriosModule.exportarCSV()">
              ${iconDownload()} Exportar para Excel (.csv)
            </button>
            <button class="btn btn-ghost" onclick="RelatoriosModule.exportarPDF()">
              ${iconDownload()} Imprimir / Salvar PDF
            </button>
          </div>
          <div style="font-size:11px;color:var(--hint);margin-top:10px">
            O arquivo CSV pode ser aberto diretamente no Excel, Google Planilhas ou qualquer editor de tabelas.<br>
            Para salvar como PDF, selecione "Salvar como PDF" na janela de impressão.
          </div>
        </div>

      </div><!-- rel-content -->
    `
  }

  async function carregar() {
    document.getElementById('rel-loading').style.display = 'block'
    document.getElementById('rel-content').style.display = 'none'

    const uid   = App.user.id
    const hoje  = new Date()
    const ini   = new Date(hoje.getFullYear(), hoje.getMonth() - (periodoMeses - 1), 1)
    const start = ini.toISOString().split('T')[0]

    const [rR, rD, rI, rM] = await Promise.all([
      window.db.from('receitas').select('*').eq('user_id', uid).gte('data', start).order('data', {ascending:true}),
      window.db.from('despesas').select('*').eq('user_id', uid).gte('data', start).order('data', {ascending:true}),
      window.db.from('investimentos').select('*').eq('user_id', uid),
      window.db.from('metas').select('*').eq('user_id', uid),
    ])

    todosRec   = rR.data || []
    todosDesp  = rD.data || []
    todosInv   = rI.data || []
    todosMetas = rM.data || []

    renderRelatorio()

    document.getElementById('rel-loading').style.display = 'none'
    document.getElementById('rel-content').style.display = 'block'
  }

  function renderRelatorio() {
    const hoje   = new Date()
    const meses  = gerarMeses(periodoMeses)

    // Agrupa por mês
    const recPorMes  = agruparPorMes(todosRec,  meses)
    const despPorMes = agruparPorMes(todosDesp, meses)

    const totalRec  = todosRec.reduce((s,r)  => s + Number(r.valor||0), 0)
    const totalDesp = todosDesp.reduce((s,d) => s + Number(d.valor||0), 0)
    const saldo     = totalRec - totalDesp
    const totalInv  = todosInv.reduce((s,i)  => s + Number(i.valor_atual||0), 0)
    const txPoupanca = totalRec > 0 ? ((saldo / totalRec) * 100) : 0

    // ── KPIs ────────────────────────────────
    const kpiEl = document.getElementById('rel-kpis')
    if (kpiEl) kpiEl.innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-label">Total receitas</span><div class="card-icon bg-green-soft">${iconReceitas()}</div></div>
        <div class="card-value c-green">${Utils.fmtShort(totalRec)}</div>
        <div class="card-hint">${periodoMeses} ${periodoMeses === 1 ? 'mês' : 'meses'}</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-label">Total despesas</span><div class="card-icon bg-red-soft">${iconDespesas()}</div></div>
        <div class="card-value c-red">${Utils.fmtShort(totalDesp)}</div>
        <div class="card-hint">${periodoMeses} ${periodoMeses === 1 ? 'mês' : 'meses'}</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-label">Saldo do período</span><div class="card-icon ${saldo >= 0 ? 'bg-lime-soft' : 'bg-red-soft'}">${iconInvest()}</div></div>
        <div class="card-value ${saldo >= 0 ? 'c-lime' : 'c-red'}">${Utils.fmtShort(saldo)}</div>
        <div class="card-hint">${saldo >= 0 ? '✓ positivo' : '⚠ negativo'}</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-label">Taxa de poupança</span><div class="card-icon bg-lime-soft">${iconMetas()}</div></div>
        <div class="card-value ${txPoupanca >= 20 ? 'c-lime' : txPoupanca >= 10 ? 'c-orange' : 'c-red'}">${txPoupanca.toFixed(1)}%</div>
        <div class="card-hint">${txPoupanca >= 20 ? 'excelente' : txPoupanca >= 10 ? 'razoável' : 'atenção'}</div>
      </div>
    `

    // ── INSIGHTS ────────────────────────────
    renderInsights(totalRec, totalDesp, saldo, txPoupanca, recPorMes, despPorMes, meses)

    // ── GRÁFICO BARRAS ──────────────────────
    renderGrafico(recPorMes, despPorMes, meses)

    // ── TOP 5 DESPESAS ──────────────────────
    renderTopDespesas()

    // ── EVOLUÇÃO SALDO ──────────────────────
    renderEvolucaoSaldo(recPorMes, despPorMes, meses)

    // ── SERVIÇOS ────────────────────────────
    renderServicos()
  }

  function renderInsights(totalRec, totalDesp, saldo, txPoupanca, recPorMes, despPorMes, meses) {
    const el = document.getElementById('rel-insights')
    if (!el) return

    const insights = []

    // 1. Situação geral
    if (saldo > 0) {
      insights.push({
        icon: '✅', tipo: 'positivo',
        titulo: 'Saldo positivo no período',
        texto: `Você terminou o período com ${Utils.fmt(saldo)} positivos. Isso mostra que sua barbearia está gerando mais dinheiro do que gasta — sinal de um negócio saudável.`
      })
    } else if (saldo < 0) {
      insights.push({
        icon: '🚨', tipo: 'alerta',
        titulo: 'Atenção: saldo negativo',
        texto: `Suas despesas superaram suas receitas em ${Utils.fmt(Math.abs(saldo))} no período. É hora de revisar seus gastos ou aumentar o faturamento.`
      })
    }

    // 2. Taxa de poupança
    if (txPoupanca >= 30) {
      insights.push({
        icon: '🏆', tipo: 'positivo',
        titulo: `Taxa de poupança excelente: ${txPoupanca.toFixed(1)}%`,
        texto: `Você está guardando mais de 30% do que ganha. Especialistas recomendam poupar pelo menos 20%. Continue assim — você tem capacidade de acelerar suas metas financeiras.`
      })
    } else if (txPoupanca >= 10 && txPoupanca < 30) {
      insights.push({
        icon: '💡', tipo: 'neutro',
        titulo: `Taxa de poupança de ${txPoupanca.toFixed(1)}% — pode melhorar`,
        texto: `Você está poupando algo, mas o ideal para uma barbearia é guardar entre 20% e 30% do faturamento. Tente reduzir uma despesa não essencial por mês.`
      })
    } else if (txPoupanca > 0 && txPoupanca < 10) {
      insights.push({
        icon: '⚠️', tipo: 'alerta',
        titulo: `Taxa de poupança baixa: ${txPoupanca.toFixed(1)}%`,
        texto: `Você está poupando menos de 10% do faturamento. Isso deixa o negócio vulnerável a imprevistos. Revise suas despesas e tente chegar a pelo menos 20%.`
      })
    }

    // 3. Tendência de receita (comparando primeiro e último mês)
    if (meses.length >= 2) {
      const recPrimeiro = recPorMes[meses[0]] || 0
      const recUltimo   = recPorMes[meses[meses.length - 1]] || 0
      if (recPrimeiro > 0 && recUltimo > recPrimeiro) {
        const crescimento = (((recUltimo - recPrimeiro) / recPrimeiro) * 100).toFixed(1)
        insights.push({
          icon: '📈', tipo: 'positivo',
          titulo: `Faturamento crescendo ${crescimento}%`,
          texto: `Suas receitas aumentaram de ${Utils.fmt(recPrimeiro)} para ${Utils.fmt(recUltimo)} entre o primeiro e o último mês analisado. Tendência de crescimento é um ótimo sinal.`
        })
      } else if (recPrimeiro > 0 && recUltimo < recPrimeiro * 0.9) {
        const queda = (((recPrimeiro - recUltimo) / recPrimeiro) * 100).toFixed(1)
        insights.push({
          icon: '📉', tipo: 'alerta',
          titulo: `Queda de ${queda}% no faturamento`,
          texto: `Suas receitas caíram de ${Utils.fmt(recPrimeiro)} para ${Utils.fmt(recUltimo)}. Verifique se houve queda no movimento, preços abaixo do mercado ou sazonalidade.`
        })
      }
    }

    // 4. Maior categoria de despesa
    const catMap = {}
    todosDesp.forEach(d => { const k = d.categoria||'Outros'; catMap[k] = (catMap[k]||0)+Number(d.valor||0) })
    const maiorCat = Object.entries(catMap).sort((a,b) => b[1]-a[1])[0]
    if (maiorCat && totalDesp > 0) {
      const pct = ((maiorCat[1] / totalDesp) * 100).toFixed(1)
      if (Number(pct) > 40) {
        insights.push({
          icon: '🔍', tipo: 'alerta',
          titulo: `${maiorCat[0]} representa ${pct}% das despesas`,
          texto: `Quando uma categoria domina mais de 40% dos gastos, vale avaliar se há como negociar melhores condições ou distribuir esse custo. No seu caso, "${maiorCat[0]}" é o maior gasto — ${Utils.fmt(maiorCat[1])}.`
        })
      } else {
        insights.push({
          icon: '📊', tipo: 'neutro',
          titulo: `Gastos bem distribuídos`,
          texto: `Seu maior gasto é "${maiorCat[0]}" com ${Utils.fmt(maiorCat[1])} (${pct}% das despesas). Essa distribuição saudável indica boa gestão de custos.`
        })
      }
    }

    // 5. Metas
    if (todosMetas.length > 0) {
      const concluidas = todosMetas.filter(m => Number(m.valor_atual||0) >= Number(m.valor_alvo||1)).length
      const progresso  = todosMetas.reduce((s,m) => s + Math.min((Number(m.valor_atual||0)/Number(m.valor_alvo||1))*100, 100), 0) / todosMetas.length
      insights.push({
        icon: '🎯', tipo: progresso >= 50 ? 'positivo' : 'neutro',
        titulo: `Metas: ${concluidas} de ${todosMetas.length} concluídas`,
        texto: `Você tem ${todosMetas.length} meta(s) cadastrada(s), com progresso médio de ${progresso.toFixed(0)}%. ${concluidas > 0 ? `Parabéns pelas ${concluidas} já concluídas!` : 'Continue depositando regularmente para atingir seus objetivos.'}`
      })
    }

    // 6. Ticket médio
    if (todosRec.length > 0) {
      const ticketMedio = totalRec / todosRec.length
      insights.push({
        icon: '💈', tipo: 'neutro',
        titulo: `Ticket médio por atendimento: ${Utils.fmt(ticketMedio)}`,
        texto: `Você realizou ${todosRec.length} atendimento(s) no período com ticket médio de ${Utils.fmt(ticketMedio)}. Para aumentar o faturamento sem aumentar o volume, foque em serviços de maior valor como pigmentação e tratamentos.`
      })
    }

    const cores = {
      positivo: { bg: 'var(--green-bg)', border: 'var(--green-border)', txt: 'var(--green)' },
      alerta:   { bg: 'var(--red-bg)',   border: 'var(--red-border)',   txt: 'var(--red)' },
      neutro:   { bg: 'var(--surface2)', border: 'var(--border)',       txt: 'var(--text2)' },
    }

    el.innerHTML = insights.map(ins => {
      const c = cores[ins.tipo]
      return `
        <div style="background:${c.bg};border:1px solid ${c.border};border-radius:var(--radius);padding:14px 16px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">${ins.icon}</span>
            <div style="font-size:13px;font-weight:600;color:${c.txt}">${ins.titulo}</div>
          </div>
          <div style="font-size:12px;color:var(--text2);line-height:1.6">${ins.texto}</div>
        </div>`
    }).join('')
  }

  function renderGrafico(recPorMes, despPorMes, meses) {
    const el = document.getElementById('rel-chart')
    if (!el) return

    const maxVal = Math.max(...meses.map(m => Math.max(recPorMes[m]||0, despPorMes[m]||0)), 1)

    el.innerHTML = `
      <div style="display:flex;align-items:flex-end;gap:4px;min-width:${meses.length * 60}px;height:120px;padding-bottom:20px">
        ${meses.map(m => {
          const r = recPorMes[m]  || 0
          const d = despPorMes[m] || 0
          const hR = Math.max((r / maxVal) * 95, r > 0 ? 3 : 0)
          const hD = Math.max((d / maxVal) * 95, d > 0 ? 3 : 0)
          const lbl = new Date(m+'-01').toLocaleDateString('pt-BR', { month:'short' })
          return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative">
              <div style="display:flex;align-items:flex-end;gap:2px;height:95px">
                <div style="width:14px;height:${hR}px;border-radius:3px 3px 0 0;background:#4ade8070" title="Receita: ${Utils.fmt(r)}"></div>
                <div style="width:14px;height:${hD}px;border-radius:3px 3px 0 0;background:#f8717170" title="Despesa: ${Utils.fmt(d)}"></div>
              </div>
              <div style="font-size:9px;color:var(--hint);text-align:center;position:absolute;bottom:-16px;white-space:nowrap">${lbl}</div>
            </div>`
        }).join('')}
      </div>
    `
  }

  function renderTopDespesas() {
    const el = document.getElementById('rel-top-desp')
    if (!el) return

    const catMap = {}
    todosDesp.forEach(d => { const k = d.descricao||'Sem descrição'; catMap[k] = (catMap[k]||0)+Number(d.valor||0) })
    const top5 = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,5)
    const total = todosDesp.reduce((s,d) => s+Number(d.valor||0), 0)

    if (!top5.length) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--hint);font-size:13px">Sem despesas no período</div>`
      return
    }

    el.innerHTML = top5.map(([desc, val], i) => {
      const pct = total > 0 ? ((val/total)*100).toFixed(1) : 0
      const COLORS = ['#ef4444','#f97316','#eab308','#84cc16','#3b82f6']
      return `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:7px;height:7px;border-radius:50%;background:${COLORS[i]};flex-shrink:0"></div>
              <span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">${Utils.esc(desc)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:10px;color:var(--muted)">${pct}%</span>
              <span style="font-size:12px;font-weight:600">${Utils.fmt(val)}</span>
            </div>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${COLORS[i]}"></div></div>
        </div>`
    }).join('')
  }

  function renderEvolucaoSaldo(recPorMes, despPorMes, meses) {
    const el = document.getElementById('rel-saldo-hist')
    if (!el) return

    el.innerHTML = meses.map(m => {
      const r = recPorMes[m]  || 0
      const d = despPorMes[m] || 0
      const s = r - d
      const lbl = new Date(m+'-01').toLocaleDateString('pt-BR', { month:'long', year:'2-digit' })
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;text-transform:capitalize">${lbl}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--muted)">${Utils.fmt(r)} - ${Utils.fmt(d)}</div>
            <div style="font-size:13px;font-weight:700;color:${s >= 0 ? 'var(--lime)' : 'var(--red)'}">${s >= 0 ? '+' : ''}${Utils.fmt(s)}</div>
          </div>
        </div>`
    }).join('')
  }

  function renderServicos() {
    const el = document.getElementById('rel-servicos')
    if (!el) return

    const catMap = {}
    todosRec.forEach(r => { const k = r.categoria||'Outros'; catMap[k] = (catMap[k]||0)+Number(r.valor||0) })
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1])
    const total  = todosRec.reduce((s,r) => s+Number(r.valor||0), 0)
    const COLORS = ['#4ade80','#84cc16','#22c55e','#34d399','#2dd4bf','#a3e635','#facc15','#fb923c','#71717a']

    if (!sorted.length) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--hint);font-size:13px">Sem receitas no período</div>`
      return
    }

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
        ${sorted.map(([cat, val], i) => {
          const pct = total > 0 ? ((val/total)*100).toFixed(1) : 0
          return `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                <div style="width:8px;height:8px;border-radius:50%;background:${COLORS[i%COLORS.length]};flex-shrink:0"></div>
                <span style="font-size:12px;font-weight:500">${Utils.esc(cat)}</span>
              </div>
              <div style="font-size:16px;font-weight:700;color:${COLORS[i%COLORS.length]}">${Utils.fmt(val)}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">${pct}% do total</div>
              <div class="progress" style="margin-top:8px"><div class="progress-bar" style="width:${pct}%;background:${COLORS[i%COLORS.length]}"></div></div>
            </div>`
        }).join('')}
      </div>
    `
  }

  // ── EXPORTAR CSV ─────────────────────────
  function exportarCSV() {
    const periodo = `${periodoMeses}m`
    const hoje    = new Date().toISOString().split('T')[0]

    // Aba receitas
    const csvRec = Utils.toCSV(todosRec, [
      { key: 'data',       label: 'Data' },
      { key: 'descricao',  label: 'Descricao' },
      { key: 'categoria',  label: 'Categoria' },
      { key: 'valor',      label: 'Valor (R$)' },
      { key: 'observacao', label: 'Observacao' },
    ])

    // Aba despesas
    const csvDesp = Utils.toCSV(todosDesp, [
      { key: 'data',       label: 'Data' },
      { key: 'descricao',  label: 'Descricao' },
      { key: 'categoria',  label: 'Categoria' },
      { key: 'valor',      label: 'Valor (R$)' },
      { key: 'status',     label: 'Status' },
      { key: 'observacao', label: 'Observacao' },
    ])

    // Resumo mensal
    const meses = gerarMeses(periodoMeses)
    const recPorMes  = agruparPorMes(todosRec,  meses)
    const despPorMes = agruparPorMes(todosDesp, meses)
    const resumoRows = meses.map(m => ({
      mes: m,
      receitas: (recPorMes[m]||0).toFixed(2),
      despesas: (despPorMes[m]||0).toFixed(2),
      saldo: ((recPorMes[m]||0)-(despPorMes[m]||0)).toFixed(2),
    }))
    const csvResumo = Utils.toCSV(resumoRows, [
      { key: 'mes',      label: 'Mes' },
      { key: 'receitas', label: 'Receitas (R$)' },
      { key: 'despesas', label: 'Despesas (R$)' },
      { key: 'saldo',    label: 'Saldo (R$)' },
    ])

    // Exporta 3 arquivos
    Utils.downloadCSV(csvResumo, `gorilaz-resumo-${periodo}-${hoje}.csv`)
    setTimeout(() => Utils.downloadCSV(csvRec,  `gorilaz-receitas-${periodo}-${hoje}.csv`),  600)
    setTimeout(() => Utils.downloadCSV(csvDesp, `gorilaz-despesas-${periodo}-${hoje}.csv`), 1200)

    Toast.ok('3 arquivos CSV exportados! Abra no Excel.')
  }

  // ── EXPORTAR PDF (via print) ─────────────
  function exportarPDF() {
    const hoje   = new Date().toLocaleDateString('pt-BR')
    const meses  = gerarMeses(periodoMeses)
    const recPM  = agruparPorMes(todosRec,  meses)
    const despPM = agruparPorMes(todosDesp, meses)
    const totalR = todosRec.reduce((s,r)  => s+Number(r.valor||0), 0)
    const totalD = todosDesp.reduce((s,d) => s+Number(d.valor||0), 0)
    const saldo  = totalR - totalD
    const tx     = totalR > 0 ? ((saldo/totalR)*100).toFixed(1) : 0

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>Relatório Gorilaz — ${hoje}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:24px;background:#fff}
        h1{font-size:20px;font-weight:900;margin-bottom:2px}
        h2{font-size:14px;font-weight:700;margin:20px 0 10px;border-bottom:2px solid #84cc16;padding-bottom:4px}
        .sub{font-size:11px;color:#555;margin-bottom:20px}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
        .kpi{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
        .kpi-label{font-size:10px;color:#555;margin-bottom:4px}
        .kpi-val{font-size:18px;font-weight:700}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
        th{background:#f9fafb;padding:7px 10px;text-align:left;font-weight:600;border:1px solid #e5e7eb}
        td{padding:7px 10px;border:1px solid #e5e7eb}
        tr:nth-child(even){background:#f9fafb}
        .pos{color:#16a34a}.neg{color:#dc2626}
        .footer{margin-top:24px;font-size:10px;color:#888;text-align:center;border-top:1px solid #e5e7eb;padding-top:10px}
        @media print{body{padding:10px}}
      </style>
    </head><body>
      <h1>✂ GORILAZ BARBER FINANCE</h1>
      <div class="sub">Relatório financeiro — Período: ${periodoMeses} ${periodoMeses===1?'mês':'meses'} | Gerado em ${hoje}</div>

      <h2>Resumo do Período</h2>
      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Total Receitas</div><div class="kpi-val pos">${Utils.fmt(totalR)}</div></div>
        <div class="kpi"><div class="kpi-label">Total Despesas</div><div class="kpi-val neg">${Utils.fmt(totalD)}</div></div>
        <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-val ${saldo>=0?'pos':'neg'}">${Utils.fmt(saldo)}</div></div>
        <div class="kpi"><div class="kpi-label">Taxa de Poupança</div><div class="kpi-val">${tx}%</div></div>
      </div>

      <h2>Evolução Mensal</h2>
      <table><thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>
        ${meses.map(m => {
          const r = recPM[m]||0, d = despPM[m]||0, s = r-d
          const lbl = new Date(m+'-01').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
          return `<tr><td style="text-transform:capitalize">${lbl}</td><td class="pos">${Utils.fmt(r)}</td><td class="neg">${Utils.fmt(d)}</td><td class="${s>=0?'pos':'neg'}">${Utils.fmt(s)}</td></tr>`
        }).join('')}
      </tbody></table>

      <h2>Receitas (${todosRec.length} registros)</h2>
      <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>
        ${todosRec.slice(0,30).map(r => `<tr><td>${Utils.fmtDate(r.data)}</td><td>${r.descricao||''}</td><td>${r.categoria||'—'}</td><td class="pos">${Utils.fmt(r.valor)}</td></tr>`).join('')}
        ${todosRec.length > 30 ? `<tr><td colspan="4" style="text-align:center;color:#555">... e mais ${todosRec.length-30} registros (exporte o CSV para ver todos)</td></tr>` : ''}
      </tbody></table>

      <h2>Despesas (${todosDesp.length} registros)</h2>
      <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Status</th><th>Valor</th></tr></thead><tbody>
        ${todosDesp.slice(0,30).map(d => `<tr><td>${Utils.fmtDate(d.data)}</td><td>${d.descricao||''}</td><td>${d.categoria||'—'}</td><td>${d.status||'pago'}</td><td class="neg">${Utils.fmt(d.valor)}</td></tr>`).join('')}
        ${todosDesp.length > 30 ? `<tr><td colspan="5" style="text-align:center;color:#555">... e mais ${todosDesp.length-30} registros (exporte o CSV para ver todos)</td></tr>` : ''}
      </tbody></table>

      <div class="footer">Gorilaz Barber Finance — gorilaz-finance.app · Relatório gerado em ${hoje}</div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  // ── HELPERS ──────────────────────────────
  function gerarMeses(n) {
    const hoje = new Date()
    const meses = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      meses.push(Utils.monthStr(d.getFullYear(), d.getMonth()))
    }
    return meses
  }

  function agruparPorMes(rows, meses) {
    const map = {}
    meses.forEach(m => { map[m] = 0 })
    rows.forEach(r => {
      const m = r.data?.slice(0,7)
      if (m && map[m] !== undefined) map[m] += Number(r.valor||0)
    })
    return map
  }

  return {
    init,
    setPeriodo(n) {
      periodoMeses = n
      ;[1,3,6,12].forEach(p => {
        const btn = document.getElementById('per-'+p)
        if (btn) btn.classList.toggle('on', p === n)
      })
      carregar()
    },
    exportarCSV,
    exportarPDF,
  }
})()
