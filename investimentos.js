/* GORILAZ — modules/investimentos.js */
const InvestimentosModule = (() => {
  let todos=[], tabAtiva='lista', editandoId=null, deletandoId=null
  const TIPOS=['CDB','Tesouro Direto','Poupança','Fundos','Ações','FIIs','Criptomoedas','Previdência','Outros']
  const COLORS={'CDB':'#3b82f6','Tesouro Direto':'#1d4ed8','Poupança':'#10b981','Fundos':'#f59e0b','Ações':'#ef4444','FIIs':'#8b5cf6','Criptomoedas':'#f97316','Previdência':'#06b6d4','Outros':'#6b7280'}
  const tipoOpts = TIPOS.map(t=>`<option value="${t}">${t}</option>`).join('')

  async function init(container) {
    container.innerHTML = renderUI()
    Modal.init()
    await carregar()
  }

  function renderUI() {
    return `
      <div class="page-header">
        <div><div class="page-title">Investimentos</div><div class="page-sub">Acompanhe sua carteira</div></div>
        <button class="btn btn-blue btn-sm" onclick="InvestimentosModule.toggleForm()">${iconPlus()} <span id="inv-form-lbl">Novo</span></button>
      </div>
      <div class="grid-4" style="margin-bottom:16px">
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Total investido</div><div id="k-inv" style="font-size:18px;font-weight:700;color:var(--muted)">—</div></div>
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Valor atual</div><div id="k-atual" style="font-size:18px;font-weight:700;color:var(--blue)">—</div></div>
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Ganho/Perda</div><div id="k-ganho" style="font-size:18px;font-weight:700">—</div></div>
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Rentabilidade</div><div id="k-rent" style="font-size:18px;font-weight:700">—</div></div>
      </div>
      <div id="inv-form" class="form-card hidden">
        <div class="form-title">Novo investimento</div>
        <div class="field"><label>Nome *</label><input type="text" id="if-nome" placeholder="Ex: CDB Nubank 14% a.a."></div>
        <div class="grid-2">
          <div class="field"><label>Tipo *</label><select id="if-tipo"><option value="">Selecione</option>${tipoOpts}</select></div>
          <div class="field"><label>Instituição *</label><input type="text" id="if-inst" placeholder="Ex: Nubank, XP"></div>
          <div class="field"><label>Valor investido *</label><input type="number" id="if-vinv" step="0.01" min="0" placeholder="0,00"></div>
          <div class="field"><label>Valor atual *</label><input type="number" id="if-vatu" step="0.01" min="0" placeholder="0,00"></div>
          <div class="field"><label>Data do aporte *</label><input type="date" id="if-data"></div>
          <div class="field"><label>Rentabilidade (%)</label><input type="number" id="if-rent" step="0.01" placeholder="Ex: 12.5"></div>
        </div>
        <div class="field"><label>Objetivo (opcional)</label><input type="text" id="if-obj" placeholder="Ex: Aposentadoria, reserva..."></div>
        <div class="form-actions">
          <button class="btn btn-blue" id="inv-save-btn" onclick="InvestimentosModule.salvar()"><span>Salvar</span></button>
          <button class="btn btn-ghost" onclick="InvestimentosModule.cancelarForm()">Cancelar</button>
        </div>
      </div>
      <div id="inv-tabs" class="tabs hidden">
        <button class="tab active" onclick="InvestimentosModule.setTab('lista',this)">Lista</button>
        <button class="tab" onclick="InvestimentosModule.setTab('analise',this)">Análise</button>
      </div>
      <div id="inv-view-lista"><div id="inv-list"></div></div>
      <div id="inv-view-analise" style="display:none">
        <div class="grid-2">
          <div class="panel"><div class="panel-title">Por tipo de ativo</div><div id="inv-by-tipo"></div></div>
          <div class="panel"><div class="panel-title">Por instituição</div><div id="inv-by-inst"></div></div>
        </div>
      </div>
      <!-- Modal edição -->
      <div id="modal-inv-edit" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header"><h3>Editar investimento</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-inv-edit')">✕</button></div>
          <div class="modal-body">
            <div class="field"><label>Nome *</label><input type="text" id="ime-nome"></div>
            <div class="grid-2">
              <div class="field"><label>Tipo *</label><select id="ime-tipo"><option value="">Selecione</option>${tipoOpts}</select></div>
              <div class="field"><label>Instituição *</label><input type="text" id="ime-inst"></div>
              <div class="field"><label>Valor investido *</label><input type="number" id="ime-vinv" step="0.01" min="0"></div>
              <div class="field"><label>Valor atual *</label><input type="number" id="ime-vatu" step="0.01" min="0"></div>
              <div class="field"><label>Data *</label><input type="date" id="ime-data"></div>
              <div class="field"><label>Rentabilidade (%)</label><input type="number" id="ime-rent" step="0.01"></div>
            </div>
            <div class="field"><label>Objetivo</label><input type="text" id="ime-obj"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-blue" id="ime-save-btn" onclick="InvestimentosModule.salvarEdicao()"><span>Salvar</span></button>
            <button class="btn btn-ghost" onclick="Modal.close('modal-inv-edit')">Cancelar</button>
          </div>
        </div>
      </div>
      <div id="modal-inv-del" class="modal-overlay hidden">
        <div class="modal-box modal-box-sm">
          <div class="modal-header"><h3>Excluir investimento</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-inv-del')">✕</button></div>
          <div class="modal-body"><p style="font-size:13px;color:#d4d4d4;margin-bottom:6px">Tem certeza?</p><p style="font-size:12px;color:var(--hint)" id="del-inv-desc"></p></div>
          <div class="modal-footer">
            <button class="btn btn-danger" id="del-inv-btn" onclick="InvestimentosModule.confirmarDel()"><span>Excluir</span></button>
            <button class="btn btn-ghost" onclick="Modal.close('modal-inv-del')">Cancelar</button>
          </div>
        </div>
      </div>`
  }

  async function carregar() {
    const{data}=await db.from('investimentos').select('*').eq('user_id',App.user.id).order('data_aporte',{ascending:false})
    todos=data||[]
    atualizarKPIs(); renderLista()
    if(todos.length) document.getElementById('inv-tabs')?.classList.remove('hidden')
  }

  function atualizarKPIs() {
    const ti=todos.reduce((s,i)=>s+Number(i.valor_investido||0),0)
    const ta=todos.reduce((s,i)=>s+Number(i.valor_atual||0),0)
    const g=ta-ti, r=ti>0?(g/ti)*100:0
    setText('k-inv',Utils.fmt(ti))
    setText('k-atual',Utils.fmt(ta))
    setText('k-ganho',(g>=0?'+':'')+Utils.fmt(g))
    setStyle('k-ganho','color',g>=0?'var(--green)':'var(--red)')
    setText('k-rent',(r>=0?'+':'')+r.toFixed(2)+'%')
    setStyle('k-rent','color',r>=0?'var(--lime)':'var(--red)')
  }

  function renderLista() {
    const el=document.getElementById('inv-list');if(!el)return
    if(!todos.length){el.innerHTML=`<div class="list-empty"><div class="list-empty-title">Nenhum investimento</div><div class="list-empty-sub">Clique em "+ Novo" para começar</div></div>`;return}
    const ta=todos.reduce((s,i)=>s+Number(i.valor_atual||0),0)
    el.innerHTML=todos.map(inv=>{
      const g=Number(inv.valor_atual||0)-Number(inv.valor_investido||0)
      const pct=ta>0?(Number(inv.valor_atual||0)/ta)*100:0
      const cor=COLORS[inv.tipo_investimento]||'#6b7280'
      return`<div class="list-item">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:${cor}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="width:12px;height:12px;border-radius:50%;background:${cor}"></div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(inv.nome_investimento)}</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:2px;flex-wrap:wrap">
              <span class="badge" style="background:${cor}20;color:${cor}">${Utils.esc(inv.tipo_investimento||'')}</span>
              <span style="font-size:11px;color:var(--hint)">${Utils.esc(inv.instituição||'')} · ${Utils.fmtDate(inv.data_aporte)}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="InvestimentosModule.abrirEdicao('${inv.id}')">${iconEdit()}</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="InvestimentosModule.abrirDel('${inv.id}')">${iconTrash()}</button>
          </div>
        </div>
        <div class="grid-4" style="background:var(--surface2);border-radius:10px;padding:10px;gap:8px">
          <div><div style="font-size:10px;color:var(--hint);margin-bottom:2px">Investido</div><div style="font-size:13px;font-weight:600;color:var(--muted)">${Utils.fmt(inv.valor_investido)}</div></div>
          <div><div style="font-size:10px;color:var(--hint);margin-bottom:2px">Atual</div><div style="font-size:13px;font-weight:600">${Utils.fmt(inv.valor_atual)}</div></div>
          <div><div style="font-size:10px;color:var(--hint);margin-bottom:2px">Ganho/Perda</div><div style="font-size:13px;font-weight:600;color:${g>=0?'var(--green)':'var(--red)'}">${g>=0?'+':''}${Utils.fmt(g)}</div></div>
          <div><div style="font-size:10px;color:var(--hint);margin-bottom:2px">% Carteira</div><div style="font-size:13px;font-weight:600;color:var(--muted)">${pct.toFixed(1)}%</div></div>
        </div>
        ${inv.objetivo?`<p style="font-size:11px;color:var(--hint);margin-top:8px">🎯 ${Utils.esc(inv.objetivo)}</p>`:''}
      </div>`
    }).join('')
  }

  function renderAnalise() {
    const ta=todos.reduce((s,i)=>s+Number(i.valor_atual||0),0)
    const tipoMap={}, instMap={}
    todos.forEach(i=>{const k=i.tipo_investimento||'Outros';tipoMap[k]=(tipoMap[k]||0)+Number(i.valor_atual||0)})
    todos.forEach(i=>{const k=i.instituição||'Outros';instMap[k]=(instMap[k]||0)+Number(i.valor_atual||0)})
    const renderBars=(map,colorFn)=>Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
      const pct=ta>0?(v/ta)*100:0, cor=colorFn(k)
      return`<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            ${cor?`<div style="width:8px;height:8px;border-radius:50%;background:${cor}"></div>`:''}
            <span style="font-size:13px">${Utils.esc(k)}</span>
          </div>
          <span style="font-size:13px;font-weight:600">${Utils.fmt(v)}</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${cor||'var(--blue)'}"></div></div>
      </div>`
    }).join('')
    const elTipo=document.getElementById('inv-by-tipo');if(elTipo)elTipo.innerHTML=renderBars(tipoMap,k=>COLORS[k]||'#6b7280')
    const elInst=document.getElementById('inv-by-inst');if(elInst)elInst.innerHTML=renderBars(instMap,()=>null)
  }

  async function salvar() {
    const nome=document.getElementById('if-nome')?.value.trim(), tipo=document.getElementById('if-tipo')?.value
    const inst=document.getElementById('if-inst')?.value.trim(), vi=parseFloat(document.getElementById('if-vinv')?.value)
    const va=parseFloat(document.getElementById('if-vatu')?.value), data=document.getElementById('if-data')?.value
    const rent=parseFloat(document.getElementById('if-rent')?.value||'0'), obj=document.getElementById('if-obj')?.value.trim()
    const btn=document.getElementById('inv-save-btn')
    if(!nome||!tipo||!inst||!vi||!va||!data){Toast.err('Preencha todos os campos obrigatórios.');return}
    Utils.setLoading(btn,true,'Salvando...')
    const{error}=await db.from('investimentos').insert({user_id:App.user.id,nome_investimento:nome,tipo_investimento:tipo,instituição:inst,valor_investido:vi,valor_atual:va,data_aporte:data,rentabilidade:rent||null,objetivo:obj||null})
    Utils.setLoading(btn,false,'Salvar')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Investimento salvo! ✓');cancelarForm();await carregar()}
  }

  function abrirEdicao(id) {
    const i=todos.find(x=>x.id===id);if(!i)return; editandoId=id
    document.getElementById('ime-nome').value=i.nome_investimento||''
    document.getElementById('ime-tipo').value=i.tipo_investimento||''
    document.getElementById('ime-inst').value=i.instituição||''
    document.getElementById('ime-vinv').value=i.valor_investido||''
    document.getElementById('ime-vatu').value=i.valor_atual||''
    document.getElementById('ime-data').value=i.data_aporte||''
    document.getElementById('ime-rent').value=i.rentabilidade||''
    document.getElementById('ime-obj').value=i.objetivo||''
    Modal.open('modal-inv-edit')
  }

  async function salvarEdicao() {
    const nome=document.getElementById('ime-nome')?.value.trim(), tipo=document.getElementById('ime-tipo')?.value
    const inst=document.getElementById('ime-inst')?.value.trim(), vi=parseFloat(document.getElementById('ime-vinv')?.value)
    const va=parseFloat(document.getElementById('ime-vatu')?.value), data=document.getElementById('ime-data')?.value
    const rent=parseFloat(document.getElementById('ime-rent')?.value||'0'), obj=document.getElementById('ime-obj')?.value.trim()
    const btn=document.getElementById('ime-save-btn')
    if(!nome||!tipo||!inst||!vi||!va||!data){Toast.err('Preencha os campos.');return}
    Utils.setLoading(btn,true,'Salvando...')
    const{error}=await db.from('investimentos').update({nome_investimento:nome,tipo_investimento:tipo,instituição:inst,valor_investido:vi,valor_atual:va,data_aporte:data,rentabilidade:rent||null,objetivo:obj||null}).eq('id',editandoId).eq('user_id',App.user.id)
    Utils.setLoading(btn,false,'Salvar')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Atualizado! ✓');Modal.close('modal-inv-edit');editandoId=null;await carregar()}
  }

  function abrirDel(id){const i=todos.find(x=>x.id===id);if(!i)return;deletandoId=id;const el=document.getElementById('del-inv-desc');if(el)el.textContent='"'+i.nome_investimento+'" — '+Utils.fmt(i.valor_atual);Modal.open('modal-inv-del')}
  async function confirmarDel(){if(!deletandoId)return;const btn=document.getElementById('del-inv-btn');Utils.setLoading(btn,true,'Excluindo...');const{error}=await db.from('investimentos').delete().eq('id',deletandoId).eq('user_id',App.user.id);Utils.setLoading(btn,false,'Excluir');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Excluído.');Modal.close('modal-inv-del');deletandoId=null;await carregar()}}

  function setTab(tab,btn){tabAtiva=tab;document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('inv-view-lista').style.display=tab==='lista'?'block':'none';document.getElementById('inv-view-analise').style.display=tab==='analise'?'block':'none';if(tab==='analise')renderAnalise()}
  function toggleForm(){const c=document.getElementById('inv-form'),lbl=document.getElementById('inv-form-lbl');if(c.classList.contains('hidden')){c.classList.remove('hidden');lbl.textContent='Fechar';document.getElementById('if-data').value=Utils.today();document.getElementById('if-nome').focus()}else cancelarForm()}
  function cancelarForm(){document.getElementById('inv-form')?.classList.add('hidden');const lbl=document.getElementById('inv-form-lbl');if(lbl)lbl.textContent='Novo';['if-nome','if-inst','if-vinv','if-vatu','if-rent','if-obj'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});document.getElementById('if-tipo').value='';document.getElementById('if-data').value=Utils.today()}
  function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
  function setStyle(id,prop,val){const el=document.getElementById(id);if(el)el.style[prop]=val}

  return{init,toggleForm,cancelarForm,salvar,abrirEdicao,salvarEdicao,abrirDel,confirmarDel,setTab}
})()
