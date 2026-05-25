/* GORILAZ — receitas.js — visual IDÊNTICO ao receitas-supabase.html */
const ReceitasModule = (() => {
  let todos=[], filterAtivo='todos', editandoId=null, deletandoId=null
  let fMonth=new Date().getMonth(), fYear=new Date().getFullYear()
  const CATS=['Corte de Cabelo','Barba','Pigmentação','Sobrancelha','Hidratação','Comissão','Bônus','Dividendos','Outros']
  const catOpts=CATS.map(c=>`<option value="${c}">${c}</option>`).join('')

  async function init(container) { container.innerHTML=ui(); Modal.init(); document.getElementById('rf-data').value=Utils.today(); await load() }

  function ui() { return `
    <div class="sec-header">
      <div class="sec-title">Receitas <span id="rec-total" style="font-size:13px;font-weight:400;color:var(--muted)">— Total: R$ 0,00</span></div>
      <button class="btn btn-lime btn-sm" onclick="ReceitasModule.toggleForm()">${svgPlus()} <span id="rec-form-lbl">Nova receita</span></button>
    </div>
    <div id="rec-form" class="form-card hidden">
      <div class="form-card-title">Nova receita</div>
      <div class="field"><label>Descrição *</label><input type="text" id="rf-desc" placeholder="Ex: Corte + barba VIP"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Valor (R$) *</label><input type="number" id="rf-valor" step="0.01" min="0" placeholder="0,00"></div>
        <div class="field"><label>Data *</label><input type="date" id="rf-data"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Categoria</label><select id="rf-cat"><option value="">Sem categoria</option>${catOpts}</select></div>
        <div class="field"><label>Observação</label><input type="text" id="rf-obs" placeholder="Opcional"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-lime" id="rec-save-btn" onclick="ReceitasModule.salvar()">Salvar</button>
        <button class="btn btn-ghost" onclick="ReceitasModule.cancelarForm()">Cancelar</button>
      </div>
    </div>
    <div class="month-nav">
      <button class="mnav-btn" onclick="ReceitasModule.changeMonth(-1)">‹</button>
      <span class="mnav-label" id="rec-month-lbl">—</span>
      <button class="mnav-btn" onclick="ReceitasModule.changeMonth(1)">›</button>
    </div>
    <div class="search-wrap">${svgSearch()}<input type="text" id="rec-search" placeholder="Buscar movimentacao..." oninput="ReceitasModule.render()"></div>
    <div class="filter-bar">
      <button class="filter-btn active" data-f="todos"           onclick="ReceitasModule.setFilter(this)">Todos</button>
      <button class="filter-btn"        data-f="mes"             onclick="ReceitasModule.setFilter(this)">Este mês</button>
      <button class="filter-btn"        data-f="Corte de Cabelo" onclick="ReceitasModule.setFilter(this)">Corte</button>
      <button class="filter-btn"        data-f="Barba"           onclick="ReceitasModule.setFilter(this)">Barba</button>
      <button class="filter-btn"        data-f="Comissão"        onclick="ReceitasModule.setFilter(this)">Comissão</button>
    </div>
    <div id="rec-list"></div>
    <!-- Modal edição -->
    <div id="modal-rec-edit" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header"><h3>Editar receita</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-rec-edit')">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Descrição *</label><input type="text" id="me-desc"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Valor *</label><input type="number" id="me-valor" step="0.01" min="0"></div>
            <div class="field"><label>Data *</label><input type="date" id="me-data"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Categoria</label><select id="me-cat"><option value="">Sem categoria</option>${catOpts}</select></div>
            <div class="field"><label>Observação</label><input type="text" id="me-obs"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-lime" id="me-save-btn" onclick="ReceitasModule.salvarEdicao()">Salvar alterações</button>
          <button class="btn btn-ghost" onclick="Modal.close('modal-rec-edit')">Cancelar</button>
        </div>
      </div>
    </div>
    <!-- Modal delete -->
    <div id="modal-rec-del" class="modal-overlay hidden">
      <div class="modal-box modal-box-sm">
        <div class="modal-header"><h3>Excluir receita</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-rec-del')">✕</button></div>
        <div class="modal-body"><p style="font-size:13px;color:#d4d4d4;margin-bottom:6px">Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.</p><p style="font-size:12px;color:var(--hint)" id="del-rec-desc"></p></div>
        <div class="modal-footer">
          <button class="btn btn-danger" id="del-rec-btn" onclick="ReceitasModule.confirmarDel()">Excluir</button>
          <button class="btn btn-ghost" onclick="Modal.close('modal-rec-del')">Cancelar</button>
        </div>
      </div>
    </div>`
  }

  async function load() {
    const lbl=document.getElementById('rec-month-lbl'); if(lbl) lbl.textContent=Utils.monthName(fMonth,fYear)
    const{data}=await db.from('receitas').select('*').eq('user_id',App.user.id).gte('data',Utils.monthStart(fYear,fMonth)).lte('data',Utils.monthEnd(fYear,fMonth)).order('data',{ascending:false})
    todos=data||[]
    const total=todos.reduce((s,t)=>s+Number(t.valor||0),0)
    const el=document.getElementById('rec-total'); if(el) el.textContent='— Total: '+Utils.fmt(total)
    render()
  }

  function render() {
    const busca=(document.getElementById('rec-search')?.value||'').toLowerCase()
    const mesStr=Utils.monthStr(fYear,fMonth)
    const lista=todos.filter(t=>{
      const txt=(t.descricao+' '+(t.categoria||'')+' '+(t.observacao||'')).toLowerCase()
      if(busca&&!txt.includes(busca))return false
      if(filterAtivo==='mes')return t.data?.startsWith(mesStr)
      if(filterAtivo!=='todos')return t.categoria===filterAtivo
      return true
    })
    const el=document.getElementById('rec-list'); if(!el)return
    if(!lista.length){el.innerHTML=`<div class="list-empty"><p>Nenhuma receita encontrada</p><p>Use o botão "Nova receita" para registrar</p></div>`;return}
    el.innerHTML=lista.map(t=>`
      <div class="receita-item" id="item-${t.id}">
        <div class="receita-top">
          <div class="receita-icon">${svgArrowUp()}</div>
          <div class="receita-info">
            <div class="receita-desc">${Utils.esc(t.descricao)}</div>
            <div class="receita-meta">
              ${t.categoria?`<span class="badge badge-cat">${Utils.esc(t.categoria)}</span>`:''}
              <span class="badge-date">${Utils.fmtDate(t.data)}</span>
              ${t.observacao?`<span class="badge-date">· ${Utils.esc(t.observacao)}</span>`:''}
            </div>
          </div>
          <div class="receita-right">
            <div class="receita-val">+${Utils.fmt(t.valor)}</div>
            <div class="receita-actions">
              <button class="btn btn-ghost btn-icon btn-sm" onclick="ReceitasModule.abrirEdicao('${t.id}')" title="Editar">✏️</button>
              <button class="btn btn-danger btn-icon btn-sm" onclick="ReceitasModule.abrirDel('${t.id}')" title="Excluir">🗑️</button>
            </div>
          </div>
        </div>
      </div>`).join('')
  }

  async function salvar(){
    const desc=document.getElementById('rf-desc')?.value.trim(), valor=parseFloat(document.getElementById('rf-valor')?.value)
    const data=document.getElementById('rf-data')?.value, cat=document.getElementById('rf-cat')?.value, obs=document.getElementById('rf-obs')?.value.trim()
    const btn=document.getElementById('rec-save-btn')
    if(!desc){Toast.err('Informe a descrição.');return}
    if(!valor||valor<=0){Toast.err('Informe um valor válido.');return}
    if(!data){Toast.err('Informe a data.');return}
    setLoading(btn,true,'Salvando...')
    const{error}=await db.from('receitas').insert({user_id:App.user.id,descricao:desc,valor,data,categoria:cat||null,observacao:obs||null})
    setLoading(btn,false,'Salvar')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Receita salva! ✓');cancelarForm();await load()}
  }

  function abrirEdicao(id){const t=todos.find(x=>x.id===id);if(!t)return;editandoId=id;document.getElementById('me-desc').value=t.descricao||'';document.getElementById('me-valor').value=t.valor||'';document.getElementById('me-data').value=t.data||'';document.getElementById('me-cat').value=t.categoria||'';document.getElementById('me-obs').value=t.observacao||'';Modal.open('modal-rec-edit')}

  async function salvarEdicao(){
    const desc=document.getElementById('me-desc')?.value.trim(), valor=parseFloat(document.getElementById('me-valor')?.value)
    const data=document.getElementById('me-data')?.value, cat=document.getElementById('me-cat')?.value, obs=document.getElementById('me-obs')?.value.trim()
    const btn=document.getElementById('me-save-btn')
    if(!desc||!valor||!data){Toast.err('Preencha os campos obrigatórios.');return}
    setLoading(btn,true,'Salvando...')
    const{error}=await db.from('receitas').update({descricao:desc,valor,data,categoria:cat||null,observacao:obs||null}).eq('id',editandoId).eq('user_id',App.user.id)
    setLoading(btn,false,'Salvar alterações')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Atualizado! ✓');Modal.close('modal-rec-edit');editandoId=null;await load()}
  }

  function abrirDel(id){const t=todos.find(x=>x.id===id);if(!t)return;deletandoId=id;const el=document.getElementById('del-rec-desc');if(el)el.textContent='"'+t.descricao+'" — '+Utils.fmt(t.valor);Modal.open('modal-rec-del')}

  async function confirmarDel(){if(!deletandoId)return;const btn=document.getElementById('del-rec-btn');setLoading(btn,true,'Excluindo...');const{error}=await db.from('receitas').delete().eq('id',deletandoId).eq('user_id',App.user.id);setLoading(btn,false,'Excluir');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Excluído.');Modal.close('modal-rec-del');deletandoId=null;await load()}}

  function toggleForm(){const c=document.getElementById('rec-form'),lbl=document.getElementById('rec-form-lbl');if(c.classList.contains('hidden')){c.classList.remove('hidden');lbl.textContent='Fechar';document.getElementById('rf-desc').focus()}else cancelarForm()}
  function cancelarForm(){document.getElementById('rec-form')?.classList.add('hidden');const lbl=document.getElementById('rec-form-lbl');if(lbl)lbl.textContent='Nova receita';['rf-desc','rf-valor','rf-cat','rf-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});document.getElementById('rf-data').value=Utils.today()}
  function setFilter(btn){filterAtivo=btn.dataset.f;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render()}
  function setLoading(btn,l,label){btn.disabled=l;btn.innerHTML=l?`<span class="spin"></span> ${label}`:label}

  // SVGs locais para não depender de funções globais
  function svgPlus(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`}
  function svgSearch(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`}
  function svgArrowUp(){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--green)"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`}

  return{init,toggleForm,cancelarForm,salvar,abrirEdicao,salvarEdicao,abrirDel,confirmarDel,setFilter,render,
    changeMonth(d){fMonth+=d;if(fMonth>11){fMonth=0;fYear++}if(fMonth<0){fMonth=11;fYear--}load()}}
})()
