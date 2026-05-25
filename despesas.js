/* GORILAZ — despesas.js — visual IDÊNTICO ao despesas-supabase.html */
const DespesasModule = (() => {
  let todos=[], filterAtivo='todos', editandoId=null, deletandoId=null
  let fMonth=new Date().getMonth(), fYear=new Date().getFullYear()
  let statusForm='pago', statusModal='pago'
  const CATS=['Aluguel','Produtos','Energia','Água','Internet','Transporte','Alimentação','Equipamentos','Marketing','Impostos','Outros']
  const catOpts=CATS.map(c=>`<option value="${c}">${c}</option>`).join('')
  const ICONS={Aluguel:'🏠',Produtos:'📦',Energia:'⚡',Água:'💧',Internet:'📡',Transporte:'🚗',Alimentação:'🍽️',Equipamentos:'🔧',Marketing:'📣',Impostos:'📋'}

  async function init(container){container.innerHTML=ui();Modal.init();document.getElementById('df-data').value=Utils.today();await load()}

  function ui(){return`
    <div class="sec-header">
      <div class="sec-title">Despesas <span id="desp-total" style="font-size:13px;font-weight:400;color:var(--muted)">— Total: R$ 0,00</span></div>
      <button class="btn btn-red btn-sm" onclick="DespesasModule.toggleForm()">${svgPlus()} <span id="desp-form-lbl">Nova despesa</span></button>
    </div>
    <div id="desp-form" class="form-card hidden">
      <div class="form-card-title">Nova despesa</div>
      <div class="field"><label>Descrição *</label><input type="text" id="df-desc" placeholder="Ex: Aluguel da barbearia"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Valor (R$) *</label><input type="number" id="df-valor" step="0.01" min="0" placeholder="0,00"></div>
        <div class="field"><label>Data *</label><input type="date" id="df-data"></div>
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
      <div class="field"><label>Observação</label><input type="text" id="df-obs" placeholder="Opcional"></div>
      <div class="form-actions">
        <button class="btn btn-red" id="desp-save-btn" onclick="DespesasModule.salvar()">Salvar</button>
        <button class="btn btn-ghost" onclick="DespesasModule.cancelarForm()">Cancelar</button>
      </div>
    </div>
    <div class="month-nav">
      <button class="mnav-btn" onclick="DespesasModule.changeMonth(-1)">‹</button>
      <span class="mnav-label" id="desp-month-lbl">—</span>
      <button class="mnav-btn" onclick="DespesasModule.changeMonth(1)">›</button>
    </div>
    <div class="search-wrap">${svgSearch()}<input type="text" id="desp-search" placeholder="Buscar movimentacao..." oninput="DespesasModule.render()"></div>
    <div class="filter-bar">
      <button class="filter-btn active" data-f="todos"      onclick="DespesasModule.setFilter(this)">Todos</button>
      <button class="filter-btn"        data-f="mes"        onclick="DespesasModule.setFilter(this)">Este mês</button>
      <button class="filter-btn"        data-f="pendente"   onclick="DespesasModule.setFilter(this)">Pendentes</button>
      <button class="filter-btn"        data-f="Aluguel"    onclick="DespesasModule.setFilter(this)">Aluguel</button>
      <button class="filter-btn"        data-f="Produtos"   onclick="DespesasModule.setFilter(this)">Produtos</button>
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
        <div class="modal-body"><p style="font-size:13px;color:#d4d4d4;margin-bottom:6px">Tem certeza que deseja excluir esta despesa?</p><p style="font-size:12px;color:var(--hint)" id="del-desp-desc"></p></div>
        <div class="modal-footer">
          <button class="btn btn-danger" id="del-desp-btn" onclick="DespesasModule.confirmarDel()">Excluir</button>
          <button class="btn btn-ghost" onclick="Modal.close('modal-desp-del')">Cancelar</button>
        </div>
      </div>
    </div>`
  }

  async function load(){
    const lbl=document.getElementById('desp-month-lbl');if(lbl)lbl.textContent=Utils.monthName(fMonth,fYear)
    const{data}=await db.from('despesas').select('*').eq('user_id',App.user.id).gte('data',Utils.monthStart(fYear,fMonth)).lte('data',Utils.monthEnd(fYear,fMonth)).order('data',{ascending:false})
    todos=data||[]
    const total=todos.reduce((s,t)=>s+Number(t.valor||0),0)
    const el=document.getElementById('desp-total');if(el)el.textContent='— Total: '+Utils.fmt(total)
    render()
  }

  function render(){
    const busca=(document.getElementById('desp-search')?.value||'').toLowerCase()
    const mesStr=Utils.monthStr(fYear,fMonth)
    const lista=todos.filter(d=>{
      const txt=(d.descricao+' '+(d.categoria||'')+' '+(d.observacao||'')).toLowerCase()
      if(busca&&!txt.includes(busca))return false
      if(filterAtivo==='mes')return d.data?.startsWith(mesStr)
      if(filterAtivo==='pendente')return d.status==='pendente'
      if(filterAtivo!=='todos')return d.categoria===filterAtivo
      return true
    })
    const el=document.getElementById('desp-list');if(!el)return
    if(!lista.length){el.innerHTML=`<div class="list-empty"><p>Nenhuma despesa encontrada</p><p>Use o botão "Nova despesa" para registrar</p></div>`;return}
    el.innerHTML=lista.map(d=>{
      const isPago=d.status!=='pendente', ico=ICONS[d.categoria]||'💸'
      const statusBadge=isPago?`<span class="badge badge-pago">✓ Pago</span>`:`<span class="badge badge-pendente">⏳ Pendente</span>`
      return`<div class="desp-item" id="item-${d.id}">
        <div class="desp-top">
          <div class="desp-icon">${ico}</div>
          <div class="desp-info">
            <div class="desp-desc">${Utils.esc(d.descricao)}</div>
            <div class="desp-meta">
              ${d.categoria?`<span class="badge badge-cat">${Utils.esc(d.categoria)}</span>`:''}
              ${statusBadge}
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

  async function salvar(){
    const desc=document.getElementById('df-desc')?.value.trim(), valor=parseFloat(document.getElementById('df-valor')?.value)
    const data=document.getElementById('df-data')?.value, cat=document.getElementById('df-cat')?.value, obs=document.getElementById('df-obs')?.value.trim()
    const btn=document.getElementById('desp-save-btn')
    if(!desc){Toast.err('Informe a descrição.');return}
    if(!valor||valor<=0){Toast.err('Informe um valor válido.');return}
    if(!data){Toast.err('Informe a data.');return}
    setLoading(btn,true,'Salvando...')
    const{error}=await db.from('despesas').insert({user_id:App.user.id,descricao:desc,valor,data,categoria:cat||null,status:statusForm,observacao:obs||null})
    setLoading(btn,false,'Salvar')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Despesa salva! ✓');cancelarForm();await load()}
  }

  function abrirEdicao(id){const d=todos.find(x=>x.id===id);if(!d)return;editandoId=id;document.getElementById('dme-desc').value=d.descricao||'';document.getElementById('dme-valor').value=d.valor||'';document.getElementById('dme-data').value=d.data||'';document.getElementById('dme-cat').value=d.categoria||'';document.getElementById('dme-obs').value=d.observacao||'';statusModal=d.status||'pago';updStatusModal();Modal.open('modal-desp-edit')}
  async function salvarEdicao(){const desc=document.getElementById('dme-desc')?.value.trim(),valor=parseFloat(document.getElementById('dme-valor')?.value),data=document.getElementById('dme-data')?.value,cat=document.getElementById('dme-cat')?.value,obs=document.getElementById('dme-obs')?.value.trim(),btn=document.getElementById('dme-save-btn');if(!desc||!valor||!data){Toast.err('Preencha os campos obrigatórios.');return}setLoading(btn,true,'Salvando...');const{error}=await db.from('despesas').update({descricao:desc,valor,data,categoria:cat||null,status:statusModal,observacao:obs||null}).eq('id',editandoId).eq('user_id',App.user.id);setLoading(btn,false,'Salvar alterações');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Atualizado! ✓');Modal.close('modal-desp-edit');editandoId=null;await load()}}
  function abrirDel(id){const d=todos.find(x=>x.id===id);if(!d)return;deletandoId=id;const el=document.getElementById('del-desp-desc');if(el)el.textContent='"'+d.descricao+'" — '+Utils.fmt(d.valor);Modal.open('modal-desp-del')}
  async function confirmarDel(){if(!deletandoId)return;const btn=document.getElementById('del-desp-btn');setLoading(btn,true,'Excluindo...');const{error}=await db.from('despesas').delete().eq('id',deletandoId).eq('user_id',App.user.id);setLoading(btn,false,'Excluir');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Excluído.');Modal.close('modal-desp-del');deletandoId=null;await load()}}

  function setStatus(s){statusForm=s;document.getElementById('df-st-pago').className='status-opt'+(s==='pago'?' status-pago':'');document.getElementById('df-st-pend').className='status-opt'+(s==='pendente'?' status-pendente':'')}
  function setStatusModal(s){statusModal=s;updStatusModal()}
  function updStatusModal(){document.getElementById('dme-st-pago').className='status-opt'+(statusModal==='pago'?' status-pago':'');document.getElementById('dme-st-pend').className='status-opt'+(statusModal==='pendente'?' status-pendente':'')}
  function toggleForm(){const c=document.getElementById('desp-form'),lbl=document.getElementById('desp-form-lbl');if(c.classList.contains('hidden')){c.classList.remove('hidden');lbl.textContent='Fechar';document.getElementById('df-desc').focus()}else cancelarForm()}
  function cancelarForm(){document.getElementById('desp-form')?.classList.add('hidden');const lbl=document.getElementById('desp-form-lbl');if(lbl)lbl.textContent='Nova despesa';['df-desc','df-valor','df-cat','df-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});document.getElementById('df-data').value=Utils.today();statusForm='pago';setStatus('pago')}
  function setFilter(btn){filterAtivo=btn.dataset.f;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render()}
  function setLoading(btn,l,label){btn.disabled=l;btn.innerHTML=l?`<span class="spin"></span> ${label}`:label}
  function svgPlus(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`}
  function svgSearch(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`}

  return{init,toggleForm,cancelarForm,salvar,abrirEdicao,salvarEdicao,abrirDel,confirmarDel,setFilter,setStatus,setStatusModal,render,
    changeMonth(d){fMonth+=d;if(fMonth>11){fMonth=0;fYear++}if(fMonth<0){fMonth=11;fYear--}load()}}
})()
