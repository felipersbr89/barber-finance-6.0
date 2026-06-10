/* GORILAZ — modules/perfil.js */
const PerfilModule = (() => {
  async function init(container) {
    container.innerHTML = renderUI()
    await carregar()
  }

  function renderUI() {
    return `
      <div class="page-title" style="margin-bottom:4px">Perfil</div>
      <div class="page-sub" style="margin-bottom:20px">Gerencie suas informações</div>
      <div class="card" style="text-align:center;padding:28px;margin-bottom:16px">
        <div style="position:relative;width:80px;height:80px;margin:0 auto 14px;cursor:pointer" onclick="document.getElementById('avatar-input-perfil').click()" title="Trocar foto de perfil">
          <div id="av-big" style="width:80px;height:80px;border-radius:50%;background:var(--ac-dim);border:2px solid var(--ac-bdr);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:var(--ac);overflow:hidden">
            <img id="perfil-avatar-img" src="" alt="Foto de perfil" style="display:none;width:100%;height:100%;object-fit:cover">
            <span id="av-big-initials">?</span>
          </div>
          <div style="position:absolute;bottom:0;right:0;width:26px;height:26px;background:var(--ac);border-radius:50%;border:2px solid var(--s1);display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" style="width:12px;height:12px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
        <input type="file" id="avatar-input-perfil" accept="image/*" style="display:none" onchange="Avatar.upload(this)">
        <div id="av-name" style="font-size:17px;font-weight:700">—</div>
        <div id="av-shop" style="font-size:13px;color:var(--t3);margin-top:3px">—</div>
        <div id="av-email" style="font-size:12px;color:var(--t4);margin-top:2px">—</div>
        <div id="av-since" style="font-size:11px;color:var(--t4);margin-top:6px;display:none">—</div>
      </div>
      <div class="grid-4" style="margin-bottom:16px">
        <div class="card card-sm"><div class="card-icon bg-green-soft" style="margin-bottom:8px">${iconReceitas()}</div><div id="s-rec" style="font-size:14px;font-weight:700;color:var(--gr)">—</div><div style="font-size:10px;color:var(--t4);margin-top:2px">Total receitas</div></div>
        <div class="card card-sm"><div class="card-icon bg-red-soft" style="margin-bottom:8px">${iconDespesas()}</div><div id="s-desp" style="font-size:14px;font-weight:700;color:var(--rd)">—</div><div style="font-size:10px;color:var(--t4);margin-top:2px">Total despesas</div></div>
        <div class="card card-sm"><div class="card-icon bg-lime-soft" style="margin-bottom:8px">${iconInvest()}</div><div id="s-saldo" style="font-size:14px;font-weight:700;color:var(--ac)">—</div><div style="font-size:10px;color:var(--t4);margin-top:2px">Saldo geral</div></div>
        <div class="card card-sm"><div class="card-icon bg-blue-soft" style="margin-bottom:8px">${iconInvest()}</div><div id="s-inv" style="font-size:14px;font-weight:700;color:var(--bl)">—</div><div style="font-size:10px;color:var(--t4);margin-top:2px">Investimentos</div></div>
      </div>
      <div class="panel" style="margin-bottom:12px">
        <div class="panel-title">Editar dados</div>
        <div class="grid-2">
          <div class="field"><label>Nome completo</label><div class="input-icon-wrap"><span class="input-prefix">👤</span><input type="text" id="pf-nome" placeholder="Seu nome completo"></div></div>
          <div class="field"><label>Nome da barbearia</label><div class="input-icon-wrap"><span class="input-prefix">✂</span><input type="text" id="pf-barbearia" placeholder="Nome da barbearia"></div></div>
          <div class="field"><label>Telefone fixo</label><div class="input-icon-wrap"><span class="input-prefix">📞</span><input type="tel" id="pf-tel" placeholder="(00) 0000-0000"></div></div>
          <div class="field"><label>Celular / WhatsApp</label><div class="input-icon-wrap"><span class="input-prefix">📱</span><input type="tel" id="pf-cel" placeholder="(00) 00000-0000"></div></div>
        </div>
        <div class="field"><label>Email</label><div class="input-icon-wrap"><span class="input-prefix">📧</span><input type="email" id="pf-email" disabled></div></div>
        <button class="btn btn-lime" id="pf-save-btn" onclick="PerfilModule.salvarPerfil()">${iconSave()} <span id="pf-save-lbl">Salvar dados</span></button>
      </div>
      <div class="panel" style="margin-bottom:12px">
        <div class="panel-title">Segurança</div>
        <button class="btn btn-ghost btn-sm" onclick="PerfilModule.toggleSenha()">${iconKey()} <span id="senha-lbl">Alterar senha</span></button>
        <div id="senha-form" style="display:none;margin-top:16px;background:var(--s2);border-radius:var(--r2);padding:16px">
          <div class="field"><label>Nova senha</label>
            <div style="position:relative"><input type="password" id="nova-senha" placeholder="Mínimo 6 caracteres" style="padding-right:44px">
            <button onclick="PerfilModule.togglePw('nova-senha',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px">👁</button></div>
          </div>
          <div class="field"><label>Confirmar</label>
            <div style="position:relative"><input type="password" id="conf-senha" placeholder="Repita a senha" style="padding-right:44px">
            <button onclick="PerfilModule.togglePw('conf-senha',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px">👁</button></div>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-lime" id="senha-save-btn" onclick="PerfilModule.alterarSenha()"><span>Salvar senha</span></button>
            <button class="btn btn-ghost" onclick="PerfilModule.toggleSenha()">Cancelar</button>
          </div>
        </div>
      </div>
      <div class="danger-zone">
        <div class="danger-title">⚠️ Zona de perigo</div>
        <div class="danger-desc">Ações irreversíveis da conta</div>
        <button class="btn btn-danger" onclick="Auth.signOut()">Sair da conta</button>
      </div>`
  }

  async function carregar() {
    document.getElementById('pf-email').value = App.user.email||''
    const[pRes,rRes,dRes,iRes]=await Promise.all([
      window.db.from('profiles').select('*').eq('user_id',App.user.id).maybeSingle(),
      window.db.from('receitas').select('valor').eq('user_id',App.user.id),
      window.db.from('despesas').select('valor').eq('user_id',App.user.id),
      window.db.from('investimentos').select('valor_atual').eq('user_id',App.user.id),
    ])
    const p=pRes.data
    if(p){
      document.getElementById('pf-nome').value=p.full_name||''
      document.getElementById('pf-barbearia').value=p.barbershop_name||''
      document.getElementById('pf-tel').value=p.phone||''
      document.getElementById('pf-cel').value=p.celular||''
      const ini=Utils.initials(p.full_name, App.user.email)
      const initSpan=document.getElementById('av-big-initials')
      if(initSpan) initSpan.textContent=ini
      document.getElementById('av-name').textContent=p.full_name||'Sem nome'
      document.getElementById('av-shop').textContent=p.barbershop_name||'Barbearia'
      if(p.created_at){const since=document.getElementById('av-since');since.textContent='📅 Membro desde '+new Date(p.created_at).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});since.style.display='block'}
      // Carregar foto de perfil (usa mesma fonte de verdade do sistema)
      // Avatar carregado por Avatar.load() — fonte de verdade: profiles.avatar_url
      if(p.avatar_url) window.Avatar?._apply(p.avatar_url)
    } else {
      const ini=Utils.initials('',App.user.email)
      const initSpan=document.getElementById('av-big-initials')
      if(initSpan) initSpan.textContent=ini
      document.getElementById('av-name').textContent='Sem nome'

    }
    document.getElementById('av-email').textContent=App.user.email||''
    const tr=(rRes.data||[]).reduce((s,x)=>s+Number(x.valor||0),0)
    const td=(dRes.data||[]).reduce((s,x)=>s+Number(x.valor||0),0)
    const ti=(iRes.data||[]).reduce((s,x)=>s+Number(x.valor_atual||0),0)
    const ts=tr-td
    setText('s-rec',Utils.fmtShort(tr))
    setText('s-desp',Utils.fmtShort(td))
    setText('s-saldo',Utils.fmtShort(ts))
    setText('s-inv',Utils.fmtShort(ti))
    document.getElementById('s-saldo').style.color=ts>=0?'var(--ac)':'var(--rd)'
  }

  async function salvarPerfil(){
    const nome=document.getElementById('pf-nome')?.value.trim(), barbearia=document.getElementById('pf-barbearia')?.value.trim(), tel=document.getElementById('pf-tel')?.value.trim(), cel=document.getElementById('pf-cel')?.value.trim(), btn=document.getElementById('pf-save-btn')
    Utils.setLoading(btn,true,'Salvando...')
    const{error}=await window.db.from('profiles').upsert({user_id:App.user.id,full_name:nome||null,barbershop_name:barbearia||null,phone:tel||null,celular:cel||null,updated_at:new Date().toISOString()},{onConflict:'user_id'})
    Utils.setLoading(btn,false,iconSave()+' Salvar dados')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Perfil salvo! ✓');await carregar()}
  }

  async function alterarSenha(){
    const nova=document.getElementById('nova-senha')?.value, conf=document.getElementById('conf-senha')?.value, btn=document.getElementById('senha-save-btn')
    if(!nova||nova.length<6){Toast.err('Senha mínimo 6 caracteres.');return}
    if(nova!==conf){Toast.err('Senhas não coincidem.');return}
    Utils.setLoading(btn,true,'Salvando...')
    const{error}=await window.db.auth.updateUser({password:nova})
    Utils.setLoading(btn,false,'Salvar senha')
    if(error)Toast.err('Erro: '+error.message)
    else{Toast.ok('Senha alterada! ✓');toggleSenha();document.getElementById('nova-senha').value='';document.getElementById('conf-senha').value=''}
  }

  function toggleSenha(){const f=document.getElementById('senha-form'),lbl=document.getElementById('senha-lbl');if(f.style.display==='none'){f.style.display='block';lbl.textContent='Fechar'}else{f.style.display='none';lbl.textContent='Alterar senha'}}
  function togglePw(id,btn){const inp=document.getElementById(id);inp.type=inp.type==='password'?'text':'password';btn.textContent=inp.type==='password'?'👁':'🙈'}
  function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}

  return{init,salvarPerfil,alterarSenha,toggleSenha,togglePw}
})()
