/* GORILAZ — despesas.js — com suporte a compras parceladas */
const DespesasModule = (() => {
  let todos=[], filterAtivo='todos', editandoId=null, deletandoId=null
  let fMonth=new Date().getMonth(), fYear=new Date().getFullYear()
  let statusForm='pago', statusModal='pago'
  let isParcelado=false  // toggle parcelamento no form
  const CATS=['Alimentação','Aluguel','Água','Energia','Equipamentos','Impostos','Internet','Marketing','Produtos','Transporte','Outros']
  const catOpts=CATS.map(c=>`<option value="${c}">${c}</option>`).join('')
  const ICONS={Aluguel:'🏠',Produtos:'📦',Energia:'⚡',Água:'💧',Internet:'📡',Transporte:'🚗',Alimentação:'🍽️',Equipamentos:'🔧',Marketing:'📣',Impostos:'📋'}

  async function init(container){container.innerHTML=ui();Modal.init();document.getElementById('df-data').value=Utils.today();await load()}

  function ui(){return`
    <div class="sec-header">
      <div class="sec-title">Despesas <span id="desp-total" style="font-size:13px;font-weight:400;color:var(--t2)">— Total: R$ 0,00</span></div>
      <button class="btn btn-red btn-sm" onclick="DespesasModule.toggleForm()">${svgPlus()} <span id="desp-form-lbl">Nova despesa</span></button>
    </div>
    <div id="desp-form" class="form-card hidden">
      <div class="form-card-title">Nova despesa</div>
      <div class="field"><label>Descrição *</label><input type="text" id="df-desc" placeholder="Ex: Aluguel da barbearia"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Valor (R$) *</label><input type="number" id="df-valor" step="0.01" min="0" placeholder="0,00"></div>
        <div class="field"><label>Data da 1ª parcela *</label><input type="date" id="df-data"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Categoria</label><select id="df-cat"><option value="">Sem categoria</option>${catOpts}</select></div>
        <div class="field"><label>Status</label>
          <div class="status-row">
            <button type="button" id="df-st-pago" class="status-opt status-pago" onclick="DespesasModule.setStatus('pago')">✓ Pago</button>
            <button type="button" id="df-st-pend" class="status-opt" onclick="DespesasModule.setStatus('pendente')">⏳ Pendente</button>
          </div>
        </div>
      </div>

      <!-- Toggle parcelamento -->
      <div class="field">
        <div class="parcel-toggle" onclick="DespesasModule.toggleParcelado()">
          <div class="parcel-toggle-icon" id="parcel-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <span id="parcel-toggle-lbl">Compra parcelada?</span>
          <div class="parcel-toggle-switch" id="parcel-switch"></div>
        </div>
      </div>

      <!-- Campos de parcela (ocultos por padrão) -->
      <div id="parcel-fields" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field">
            <label>Nº de parcelas *</label>
            <input type="number" id="df-parcelas" min="2" max="120" placeholder="Ex: 12" oninput="DespesasModule.previewParcelas()">
          </div>
          <div class="field">
            <label>Valor por parcela</label>
            <input type="number" id="df-valor-parcela" step="0.01" min="0" placeholder="Calculado auto" readonly style="opacity:0.6">
          </div>
        </div>
        <div id="parcel-preview" class="parcel-preview" style="display:none"></div>
      </div>

      <div class="field"><label>Observação</label><input type="text" id="df-obs" placeholder="Opcional"></div>
      <div class="form-actions">
        <button class="btn btn-red" id="desp-save-btn" onclick="DespesasModule.salvar()">Salvar</button>
        <button class="btn btn-ghost" onclick="DespesasModule.cancelarForm()">Cancelar</button>
      </div>
    </div>
    <div id="desp-mpicker" style="margin-bottom:14px"></div>
    <div class="search-wrap">${svgSearch()}<input type="text" id="desp-search" placeholder="Buscar movimentacao..." oninput="DespesasModule.render()"></div>
    <div class="filter-bar">
      <button class="filter-btn active" data-f="todos"      onclick="DespesasModule.setFilter(this)">Todos</button>
      <button class="filter-btn"        data-f="mes"        onclick="DespesasModule.setFilter(this)">Este mês</button>
      <button class="filter-btn"        data-f="pendente"   onclick="DespesasModule.setFilter(this)">Pendentes</button>
      <button class="filter-btn"        data-f="parcelado"  onclick="DespesasModule.setFilter(this)">Parceladas</button>
      <button class="filter-btn"        data-f="Aluguel"    onclick="DespesasModule.setFilter(this)">Aluguel</button>
      <button class="filter-btn"        data-f="Transporte" onclick="DespesasModule.setFilter(this)">Transporte</button>
    </div>
    <div id="desp-list"></div>
    <!-- Modal edição -->
    <div id="modal-desp-edit" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header"><h3>Editar despesa</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-desp-edit')">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Descrição *</label><input type="text" id="dme-desc"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Valor *</label><input type="number" id="dme-valor" step="0.01" min="0"></div>
            <div class="field"><label>Data *</label><input type="date" id="dme-data"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Categoria</label><select id="dme-cat"><option value="">Sem categoria</option>${catOpts}</select></div>
            <div class="field"><label>Status</label>
              <div class="status-row">
                <button type="button" id="dme-st-pago" class="status-opt" onclick="DespesasModule.setStatusModal('pago')">✓ Pago</button>
                <button type="button" id="dme-st-pend" class="status-opt" onclick="DespesasModule.setStatusModal('pendente')">⏳ Pendente</button>
              </div>
            </div>
          </div>
          <div class="field"><label>Observação</label><input type="text" id="dme-obs"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-red" id="dme-save-btn" onclick="DespesasModule.salvarEdicao()">Salvar alterações</button>
          <button class="btn btn-ghost" onclick="Modal.close('modal-desp-edit')">Cancelar</button>
        </div>
      </div>
    </div>
    <!-- Modal delete -->
    <div id="modal-desp-del" class="modal-overlay hidden">
      <div class="modal-box modal-box-sm">
        <div class="modal-header"><h3>Excluir despesa</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-desp-del')">✕</button></div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--t2);margin-bottom:6px">Tem certeza que deseja excluir esta despesa?</p>
          <p style="font-size:12px;color:var(--t3)" id="del-desp-desc"></p>
          <div id="del-parcel-warn" style="display:none;margin-top:10px;background:var(--or-dim);border:1px solid rgba(251,146,60,0.25);border-radius:var(--r-sm);padding:10px 12px;font-size:12px;color:var(--or)">
            ⚠️ Esta é uma despesa parcelada. Deseja excluir apenas esta parcela ou todas as parcelas restantes?
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn btn-sm btn-ghost" id="del-only-btn" onclick="DespesasModule.confirmarDel(false)">Só esta</button>
              <button class="btn btn-sm btn-danger" id="del-all-btn" onclick="DespesasModule.confirmarDel(true)">Todas as restantes</button>
            </div>
          </div>
        </div>
        <div class="modal-footer" id="del-footer-normal">
          <button class="btn btn-danger" id="del-desp-btn" onclick="DespesasModule.confirmarDel(false)">Excluir</button>
          <button class="btn btn-ghost" onclick="Modal.close('modal-desp-del')">Cancelar</button>
        </div>
      </div>
    </div>`
  }

  // ── LOAD ────────────────────────────────────────────────
  async function load(){
    MonthPicker.render('desp-mpicker', fYear, fMonth, (y, m) => {
      fYear = y; fMonth = m; load()
    })
    const start = Utils.monthStart(fYear, fMonth)
    const end   = Utils.monthEnd(fYear, fMonth)
    const { data, error } = await window.db
      .from('despesas').select('*')
      .eq('user_id', App.user.id)
      .gte('data', start).lte('data', end)
      .order('data', { ascending: false })
    if (error) { Toast.err('Erro ao carregar: ' + error.message); return }
    todos = data || []
    const total = todos.reduce((s,t) => s + Number(t.valor||0), 0)
    const el = document.getElementById('desp-total')
    if (el) el.textContent = '— Total: ' + Utils.fmt(total)
    render()
  }

  // ── RENDER ───────────────────────────────────────────────
  function render(){
    const busca=(document.getElementById('desp-search')?.value||'').toLowerCase()
    const mesStr=Utils.monthStr(fYear,fMonth)
    const lista=todos.filter(d=>{
      const txt=(d.descricao+' '+(d.categoria||'')+' '+(d.observacao||'')).toLowerCase()
      if(busca&&!txt.includes(busca))return false
      if(filterAtivo==='mes')return d.data?.startsWith(mesStr)
      if(filterAtivo==='pendente')return d.status==='pendente'
      if(filterAtivo==='parcelado')return d.parcela_total>1
      if(filterAtivo!=='todos')return d.categoria===filterAtivo
      return true
    })
    const el=document.getElementById('desp-list');if(!el)return
    if(!lista.length){el.innerHTML=`<div class="list-empty"><p>Nenhuma despesa encontrada</p><p>Use o botão "Nova despesa" para registrar</p></div>`;return}
    el.innerHTML=lista.map(d=>{
      const isPago=d.status!=='pendente', ico=ICONS[d.categoria]||'💸'
      const isParc=d.parcela_total>1
      const statusBadge=isPago
        ?`<span class="badge badge-pago">✓ Pago</span>`
        :`<span class="badge badge-pendente">⏳ Pendente</span>`
      const parcelBadge=isParc
        ?`<span class="badge badge-parcel">💳 ${d.parcela_atual}/${d.parcela_total}</span>`
        :''
      return`<div class="desp-item${isParc?' desp-item-parcel':''}" id="item-${d.id}">
        <div class="desp-top">
          <div class="desp-icon">${ico}</div>
          <div class="desp-info">
            <div class="desp-desc">${Utils.esc(d.descricao)}</div>
            <div class="desp-meta">
              ${d.categoria?`<span class="badge badge-cat">${Utils.esc(d.categoria)}</span>`:''}
              ${statusBadge}
              ${parcelBadge}
              <span class="badge-date">${Utils.fmtDate(d.data)}</span>
              ${d.observacao?`<span class="badge-date">· ${Utils.esc(d.observacao)}</span>`:''}
            </div>
          </div>
          <div class="desp-right">
            <div class="desp-val">-${Utils.fmt(d.valor)}</div>
            <div class="desp-actions">
              <button class="btn btn-ghost btn-icon btn-sm" onclick="DespesasModule.abrirEdicao('${d.id}')" title="Editar">✏️</button>
              <button class="btn btn-danger btn-icon btn-sm" onclick="DespesasModule.abrirDel('${d.id}')" title="Excluir">🗑️</button>
            </div>
          </div>
        </div>
      </div>`
    }).join('')
  }

  // ── SALVAR (simples ou parcelado) ────────────────────────
  async function salvar(){
    const desc    = document.getElementById('df-desc')?.value.trim()
    const valor   = parseFloat(document.getElementById('df-valor')?.value)
    const dataVal = document.getElementById('df-data')?.value
    const cat     = document.getElementById('df-cat')?.value
    const obs     = document.getElementById('df-obs')?.value.trim()
    const btn     = document.getElementById('desp-save-btn')

    if(!desc)    { Toast.err('Informe a descrição.'); return }
    if(!valor||valor<=0) { Toast.err('Informe um valor válido.'); return }
    if(!dataVal) { Toast.err('Informe a data.'); return }

    // ── Parcelado ──
    if(isParcelado) {
      const nParc = parseInt(document.getElementById('df-parcelas')?.value)
      if(!nParc || nParc < 2) { Toast.err('Informe ao menos 2 parcelas.'); return }

      setLoading(btn, true, `Salvando ${nParc} parcelas...`)

      // Gera UUID do grupo (usando crypto.randomUUID se disponível, senão fallback)
      const grupoId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2)

      const valorParc = Math.round((valor / nParc) * 100) / 100

      // Monta array de todas as parcelas
      const parcelas = []
      const [yBase, mBase, dBase] = dataVal.split('-').map(Number)

      for(let i = 0; i < nParc; i++) {
        // Avança mês a mês mantendo o mesmo dia
        let mParcela = mBase - 1 + i  // 0-indexed
        let yParcela = yBase + Math.floor(mParcela / 12)
        mParcela = mParcela % 12

        // Último dia do mês (ex: 31 de fev → 28/29)
        const ultimoDia = new Date(yParcela, mParcela + 1, 0).getDate()
        const diaParcela = Math.min(dBase, ultimoDia)

        const dataParcela = `${yParcela}-${String(mParcela+1).padStart(2,'0')}-${String(diaParcela).padStart(2,'0')}`

        // 1ª parcela: status conforme selecionado; demais: pendente
        const statusParcela = i === 0 ? statusForm : 'pendente'

        parcelas.push({
          user_id:          App.user.id,
          descricao:        desc,
          valor:            valorParc,
          data:             dataParcela,
          categoria:        cat || null,
          status:           statusParcela,
          observacao:       obs || null,
          parcela_atual:    i + 1,
          parcela_total:    nParc,
          parcela_grupo_id: grupoId
        })
      }

      const { error } = await window.db.from('despesas').insert(parcelas)
      setLoading(btn, false, 'Salvar')
      if(error) { Toast.err('Erro: ' + error.message); return }
      Toast.ok(`${nParc} parcelas salvas! ✓`)
      cancelarForm()
      await load()
      return
    }

    // ── Despesa simples ──
    setLoading(btn, true, 'Salvando...')
    const { error } = await window.db.from('despesas').insert({
      user_id: App.user.id, descricao: desc, valor,
      data: dataVal, categoria: cat||null,
      status: statusForm, observacao: obs||null
    })
    setLoading(btn, false, 'Salvar')
    if(error) Toast.err('Erro: ' + error.message)
    else { Toast.ok('Despesa salva! ✓'); cancelarForm(); await load() }
  }

  // ── TOGGLE PARCELADO ─────────────────────────────────────
  function toggleParcelado(){
    isParcelado = !isParcelado
    const fields = document.getElementById('parcel-fields')
    const sw     = document.getElementById('parcel-switch')
    const lbl    = document.getElementById('parcel-toggle-lbl')
    const btn    = document.getElementById('desp-save-btn')
    if(isParcelado){
      fields.style.display = ''
      sw.classList.add('on')
      lbl.textContent = 'Compra parcelada'
      btn.textContent = 'Salvar parcelas'
      document.getElementById('df-parcelas')?.focus()
    } else {
      fields.style.display = 'none'
      sw.classList.remove('on')
      lbl.textContent = 'Compra parcelada?'
      btn.textContent = 'Salvar'
      document.getElementById('parcel-preview').style.display = 'none'
    }
  }

  // ── PREVIEW PARCELAS ─────────────────────────────────────
  function previewParcelas(){
    const valor  = parseFloat(document.getElementById('df-valor')?.value)
    const nParc  = parseInt(document.getElementById('df-parcelas')?.value)
    const dataV  = document.getElementById('df-data')?.value
    const prev   = document.getElementById('parcel-preview')
    const vpEl   = document.getElementById('df-valor-parcela')

    if(!valor||!nParc||nParc<2||!dataV){ if(prev) prev.style.display='none'; return }

    const valorParc = Math.round((valor/nParc)*100)/100
    if(vpEl) vpEl.value = valorParc.toFixed(2)

    // Mostra preview das 3 primeiras + última
    const [yBase, mBase, dBase] = dataV.split('-').map(Number)
    let rows = []
    const show = nParc <= 6 ? nParc : 4
    for(let i=0; i<Math.min(nParc, show); i++){
      if(i===3 && nParc>6){ rows.push(`<div class="parcel-row parcel-row-dots">···  mais ${nParc-5} parcelas</div>`); continue }
      let m = mBase-1+i, y = yBase+Math.floor(m/12); m=m%12
      const ld = new Date(y,m+1,0).getDate()
      const dia = Math.min(dBase,ld)
      const dt = `${String(dia).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`
      rows.push(`<div class="parcel-row">
        <span class="parcel-num">${i+1}/${nParc}</span>
        <span class="parcel-date">${dt}</span>
        <span class="parcel-val">R$ ${valorParc.toFixed(2).replace('.',',')}</span>
      </div>`)
    }
    if(nParc>6){
      let m=mBase-1+(nParc-1), y=yBase+Math.floor(m/12); m=m%12
      const ld=new Date(y,m+1,0).getDate(), dia=Math.min(dBase,ld)
      const dt=`${String(dia).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`
      rows.push(`<div class="parcel-row">
        <span class="parcel-num">${nParc}/${nParc}</span>
        <span class="parcel-date">${dt}</span>
        <span class="parcel-val">R$ ${valorParc.toFixed(2).replace('.',',')}</span>
      </div>`)
    }

    if(prev){
      prev.style.display=''
      prev.innerHTML=`<div class="parcel-preview-title">📋 Parcelas geradas</div>${rows.join('')}
        <div class="parcel-preview-total">Total: R$ ${(valorParc*nParc).toFixed(2).replace('.',',')} em ${nParc}x</div>`
    }
  }

  // ── EDIÇÃO ───────────────────────────────────────────────
  function abrirEdicao(id){
    const d=todos.find(x=>Number(x.id)===Number(id));if(!d)return
    editandoId=id
    document.getElementById('dme-desc').value=d.descricao||''
    document.getElementById('dme-valor').value=d.valor||''
    document.getElementById('dme-data').value=d.data||''
    document.getElementById('dme-cat').value=d.categoria||''
    document.getElementById('dme-obs').value=d.observacao||''
    statusModal=d.status||'pago';updStatusModal()
    Modal.open('modal-desp-edit')
  }

  async function salvarEdicao(){
    const desc=document.getElementById('dme-desc')?.value.trim()
    const valor=parseFloat(document.getElementById('dme-valor')?.value)
    const data=document.getElementById('dme-data')?.value
    const cat=document.getElementById('dme-cat')?.value
    const obs=document.getElementById('dme-obs')?.value.trim()
    const btn=document.getElementById('dme-save-btn')
    if(!desc||!valor||!data){Toast.err('Preencha os campos obrigatórios.');return}
    setLoading(btn,true,'Salvando...')
    const{error}=await window.db.from('despesas')
      .update({descricao:desc,valor,data,categoria:cat||null,status:statusModal,observacao:obs||null})
      .eq('id',editandoId).eq('user_id',App.user.id)
    setLoading(btn,false,'Salvar alterações')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Atualizado! ✓');Modal.close('modal-desp-edit');editandoId=null;await load()}
  }

  // ── EXCLUSÃO (simples ou todo o grupo parcelado) ─────────
  function abrirDel(id){
    const d=todos.find(x=>Number(x.id)===Number(id));if(!d)return
    deletandoId=id
    const el=document.getElementById('del-desp-desc')
    if(el) el.textContent='"'+d.descricao+'" — '+Utils.fmt(d.valor)

    const warn = document.getElementById('del-parcel-warn')
    const footer = document.getElementById('del-footer-normal')

    if(d.parcela_total>1 && d.parcela_grupo_id){
      // Parcelada: mostra opção de excluir só esta ou todas as restantes
      if(warn) warn.style.display=''
      if(footer) footer.style.display='none'
    } else {
      if(warn) warn.style.display='none'
      if(footer) footer.style.display=''
    }
    Modal.open('modal-desp-del')
  }

  async function confirmarDel(deletarRestantes=false){
    if(!deletandoId)return
    const d=todos.find(x=>Number(x.id)===Number(deletandoId))
    const btn=document.getElementById(deletarRestantes?'del-all-btn':'del-only-btn')||document.getElementById('del-desp-btn')
    setLoading(btn,true,'Excluindo...')

    let error=null
    if(deletarRestantes && d?.parcela_grupo_id){
      // Exclui esta parcela e todas as seguintes do grupo
      const res = await window.db.from('despesas')
        .delete()
        .eq('parcela_grupo_id', d.parcela_grupo_id)
        .gte('parcela_atual', d.parcela_atual)
        .eq('user_id', App.user.id)
      error = res.error
    } else {
      // Exclui só esta
      const res = await window.db.from('despesas')
        .delete().eq('id',deletandoId).eq('user_id',App.user.id)
      error = res.error
    }

    setLoading(btn,false,'Excluir')
    if(error)Toast.err('Erro: '+error.message)
    else{
      Toast.ok(deletarRestantes?'Parcelas restantes excluídas.':'Excluído.')
      Modal.close('modal-desp-del')
      deletandoId=null
      await load()
    }
  }

  // ── HELPERS ──────────────────────────────────────────────
  function setStatus(s){statusForm=s;document.getElementById('df-st-pago').className='status-opt'+(s==='pago'?' status-pago':'');document.getElementById('df-st-pend').className='status-opt'+(s==='pendente'?' status-pendente':'')}
  function setStatusModal(s){statusModal=s;updStatusModal()}
  function updStatusModal(){document.getElementById('dme-st-pago').className='status-opt'+(statusModal==='pago'?' status-pago':'');document.getElementById('dme-st-pend').className='status-opt'+(statusModal==='pendente'?' status-pendente':'')}
  function toggleForm(){
    const c=document.getElementById('desp-form'),lbl=document.getElementById('desp-form-lbl')
    if(c.classList.contains('hidden')){c.classList.remove('hidden');lbl.textContent='Fechar';document.getElementById('df-desc').focus()}
    else cancelarForm()
  }
  function cancelarForm(){
    document.getElementById('desp-form')?.classList.add('hidden')
    const lbl=document.getElementById('desp-form-lbl');if(lbl)lbl.textContent='Nova despesa'
    ;['df-desc','df-valor','df-cat','df-obs','df-parcelas','df-valor-parcela'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})
    document.getElementById('df-data').value=Utils.today()
    document.getElementById('parcel-preview').style.display='none'
    if(isParcelado){isParcelado=false;toggleParcelado()}
    statusForm='pago';setStatus('pago')
  }
  function setFilter(btn){filterAtivo=btn.dataset.f;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render()}
  function setLoading(btn,l,label){if(!btn)return;btn.disabled=l;btn.innerHTML=l?`<span class="spin"></span> ${label}`:label}
  function svgPlus(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`}
  function svgSearch(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`}

  return{init,toggleForm,cancelarForm,salvar,abrirEdicao,salvarEdicao,abrirDel,confirmarDel,setFilter,setStatus,setStatusModal,render,toggleParcelado,previewParcelas,
    changeMonth(d){fMonth+=d;if(fMonth>11){fMonth=0;fYear++}if(fMonth<0){fMonth=11;fYear--}MonthPicker.closeAll();load()}}
})()
