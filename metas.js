/* GORILAZ — modules/metas.js */
const MetasModule = (() => {
  let todos=[], editandoId=null, deletandoId=null

  async function init(container) { container.innerHTML=renderUI(); Modal.init(); await carregar() }

  function renderUI() {
    return `
      <div class="page-header">
        <div><div class="page-title">Metas Financeiras</div><div class="page-sub">Acompanhe seus objetivos</div></div>
        <button class="btn btn-lime btn-sm" onclick="MetasModule.toggleForm()">${iconPlus()} <span id="meta-form-lbl">Nova meta</span></button>
      </div>
      <div class="grid-3" style="margin-bottom:16px">
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Total de metas</div><div id="km-total" style="font-size:20px;font-weight:700;color:var(--muted)">0</div></div>
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Concluídas</div><div id="km-done" style="font-size:20px;font-weight:700;color:var(--green)">0</div></div>
        <div class="card card-sm"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Total economizado</div><div id="km-saved" style="font-size:20px;font-weight:700;color:var(--lime)">R$ 0</div></div>
      </div>
      <div id="meta-form" class="form-card hidden">
        <div class="form-title">Nova meta</div>
        <div class="field"><label>Nome da meta *</label><input type="text" id="mf-nome" placeholder="Ex: Máquina nova, viagem, reserva..."></div>
        <div class="grid-2">
          <div class="field"><label>Valor alvo (R$) *</label><input type="number" id="mf-alvo" step="0.01" min="0" placeholder="0,00"></div>
          <div class="field"><label>Prazo (opcional)</label><input type="date" id="mf-prazo"></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-lime" id="meta-save-btn" onclick="MetasModule.salvar()"><span>Criar meta</span></button>
          <button class="btn btn-ghost" onclick="MetasModule.cancelarForm()">Cancelar</button>
        </div>
      </div>
      <div id="metas-grid" class="grid-2"></div>
      <div id="modal-meta-edit" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header"><h3>Editar meta</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-meta-edit')">✕</button></div>
          <div class="modal-body">
            <div class="field"><label>Nome *</label><input type="text" id="mme-nome"></div>
            <div class="grid-2">
              <div class="field"><label>Valor alvo *</label><input type="number" id="mme-alvo" step="0.01" min="0"></div>
              <div class="field"><label>Valor atual</label><input type="number" id="mme-atual" step="0.01" min="0"></div>
            </div>
            <div class="field"><label>Prazo</label><input type="date" id="mme-prazo"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-lime" id="mme-save-btn" onclick="MetasModule.salvarEdicao()"><span>Salvar</span></button>
            <button class="btn btn-ghost" onclick="Modal.close('modal-meta-edit')">Cancelar</button>
          </div>
        </div>
      </div>
      <div id="modal-meta-del" class="modal-overlay hidden">
        <div class="modal-box modal-box-sm">
          <div class="modal-header"><h3>Excluir meta</h3><button class="btn btn-ghost btn-icon" onclick="Modal.close('modal-meta-del')">✕</button></div>
          <div class="modal-body"><p style="font-size:13px;color:#d4d4d4;margin-bottom:6px">Tem certeza? Todo o progresso será perdido.</p><p style="font-size:12px;color:var(--hint)" id="del-meta-desc"></p></div>
          <div class="modal-footer">
            <button class="btn btn-danger" id="del-meta-btn" onclick="MetasModule.confirmarDel()"><span>Excluir</span></button>
            <button class="btn btn-ghost" onclick="Modal.close('modal-meta-del')">Cancelar</button>
          </div>
        </div>
      </div>`
  }

  async function carregar() {
    const{data}=await db.from('metas').select('*').eq('user_id',App.user.id).order('created_at',{ascending:false})
    todos=data||[]
    const done=todos.filter(m=>Number(m.valor_atual||0)>=Number(m.valor_alvo||1)).length
    const saved=todos.reduce((s,m)=>s+Number(m.valor_atual||0),0)
    setText('km-total',todos.length)
    setText('km-done',done)
    setText('km-saved',Utils.fmtShort(saved))
    renderMetas()
  }

  function renderMetas() {
    const el=document.getElementById('metas-grid');if(!el)return
    if(!todos.length){el.outerHTML='<div id="metas-grid"><div class="list-empty"><div class="list-empty-title">Nenhuma meta cadastrada</div><div class="list-empty-sub">Crie uma meta para começar</div></div></div>';return}
    el.innerHTML=todos.map(g=>{
      const atual=Number(g.valor_atual||0), alvo=Number(g.valor_alvo||1)
      const pct=Math.min((atual/alvo)*100,100), done=pct>=100, faltam=alvo-atual
      return`<div class="card" style="${done?'border-color:var(--lime-border)':''}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            <div style="width:36px;height:36px;border-radius:10px;background:${done?'var(--lime-bg)':'var(--surface2)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${done?'🏆':'🎯'}</div>
            <div style="min-width:0">
              <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.esc(g.nome)}</div>
              ${g.prazo?`<div style="font-size:11px;color:var(--hint)">📅 ${Utils.fmtDate(g.prazo)}</div>`:''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;margin-left:8px">
            ${done?'<span class="badge badge-lime">✓ Concluída</span>':''}
            <button class="btn btn-ghost btn-icon btn-sm" onclick="MetasModule.abrirEdicao('${g.id}')">${iconEdit()}</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="MetasModule.abrirDel('${g.id}')">${iconTrash()}</button>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:12px;color:var(--muted)">${Utils.fmt(atual)}</span>
          <span style="font-size:12px;font-weight:600;color:${done?'var(--lime)':'var(--muted)'}">${Math.round(pct)}%</span>
        </div>
        <div class="progress progress-lg"><div class="progress-bar" style="width:${pct}%;background:${done?'var(--lime2)':'var(--lime)'}"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:5px;margin-bottom:10px">
          <span style="font-size:11px;color:var(--hint)">${!done?'Faltam '+Utils.fmt(faltam):''}</span>
          <span style="font-size:11px;color:var(--hint)">Meta: ${Utils.fmt(alvo)}</span>
        </div>
        ${!done?`
        <div id="dep-row-${g.id}" style="display:none;gap:8px" class="flex">
          <input type="number" step="0.01" min="0" id="dep-val-${g.id}" placeholder="Valor a depositar"
            style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none;min-width:0"
            onkeydown="if(event.key==='Enter')MetasModule.depositar('${g.id}')">
          <button class="btn btn-lime btn-sm" onclick="MetasModule.depositar('${g.id}')">OK</button>
          <button class="btn btn-ghost btn-sm" onclick="MetasModule.fecharDeposito('${g.id}')">✕</button>
        </div>
        <button class="btn btn-ghost btn-sm" id="dep-btn-${g.id}" onclick="MetasModule.abrirDeposito('${g.id}')" style="width:100%">
          ${iconPlus()} Depositar
        </button>`:''}
      </div>`
    }).join('')
  }

  async function salvar() {
    const nome=document.getElementById('mf-nome')?.value.trim(), alvo=parseFloat(document.getElementById('mf-alvo')?.value)
    const prazo=document.getElementById('mf-prazo')?.value, btn=document.getElementById('meta-save-btn')
    if(!nome){Toast.err('Informe o nome.');return}
    if(!alvo||alvo<=0){Toast.err('Informe um valor alvo.');return}
    Utils.setLoading(btn,true,'Criando...')
    const{error}=await db.from('metas').insert({user_id:App.user.id,nome,valor_alvo:alvo,valor_atual:0,prazo:prazo||null})
    Utils.setLoading(btn,false,'Criar meta')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Meta criada! ✓');cancelarForm();await carregar()}
  }

  function abrirEdicao(id){const g=todos.find(x=>x.id===id);if(!g)return;editandoId=id;document.getElementById('mme-nome').value=g.nome||'';document.getElementById('mme-alvo').value=g.valor_alvo||'';document.getElementById('mme-atual').value=g.valor_atual||'';document.getElementById('mme-prazo').value=g.prazo||'';Modal.open('modal-meta-edit')}
  async function salvarEdicao(){const nome=document.getElementById('mme-nome')?.value.trim(),alvo=parseFloat(document.getElementById('mme-alvo')?.value),atual=parseFloat(document.getElementById('mme-atual')?.value||'0'),prazo=document.getElementById('mme-prazo')?.value,btn=document.getElementById('mme-save-btn');if(!nome||!alvo){Toast.err('Preencha os campos.');return}Utils.setLoading(btn,true,'Salvando...');const{error}=await db.from('metas').update({nome,valor_alvo:alvo,valor_atual:atual,prazo:prazo||null}).eq('id',editandoId).eq('user_id',App.user.id);Utils.setLoading(btn,false,'Salvar');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Atualizado! ✓');Modal.close('modal-meta-edit');editandoId=null;await carregar()}}
  function abrirDel(id){const g=todos.find(x=>x.id===id);if(!g)return;deletandoId=id;const el=document.getElementById('del-meta-desc');if(el)el.textContent='"'+g.nome+'"';Modal.open('modal-meta-del')}
  async function confirmarDel(){if(!deletandoId)return;const btn=document.getElementById('del-meta-btn');Utils.setLoading(btn,true,'Excluindo...');const{error}=await db.from('metas').delete().eq('id',deletandoId).eq('user_id',App.user.id);Utils.setLoading(btn,false,'Excluir');if(error)Toast.err('Erro: '+error.message);else{Toast.ok('Excluído.');Modal.close('modal-meta-del');deletandoId=null;await carregar()}}

  function abrirDeposito(id){document.getElementById('dep-row-'+id).style.display='flex';document.getElementById('dep-btn-'+id).style.display='none';document.getElementById('dep-val-'+id).focus()}
  function fecharDeposito(id){document.getElementById('dep-row-'+id).style.display='none';document.getElementById('dep-btn-'+id).style.display='block';document.getElementById('dep-val-'+id).value=''}
  async function depositar(id){const meta=todos.find(x=>x.id===id);if(!meta)return;const val=parseFloat(document.getElementById('dep-val-'+id).value);if(!val||val<=0){Toast.err('Valor inválido.');return}const{error}=await db.from('metas').update({valor_atual:Number(meta.valor_atual||0)+val}).eq('id',id).eq('user_id',App.user.id);if(error)Toast.err('Erro: '+error.message);else{Toast.ok('+'+Utils.fmt(val)+' depositado!');await carregar()}}

  function toggleForm(){const c=document.getElementById('meta-form'),lbl=document.getElementById('meta-form-lbl');if(c.classList.contains('hidden')){c.classList.remove('hidden');lbl.textContent='Fechar';document.getElementById('mf-nome').focus()}else cancelarForm()}
  function cancelarForm(){document.getElementById('meta-form')?.classList.add('hidden');const lbl=document.getElementById('meta-form-lbl');if(lbl)lbl.textContent='Nova meta';['mf-nome','mf-alvo','mf-prazo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''})}
  function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}

  return{init,toggleForm,cancelarForm,salvar,abrirEdicao,salvarEdicao,abrirDel,confirmarDel,abrirDeposito,fecharDeposito,depositar}
})()
