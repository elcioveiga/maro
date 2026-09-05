let state = {
  score:0,
  answered:{},
  levelsDone:{},
  badges:{}
};
const STORAGE_KEY = 'desconfiometro-progress-v1';

async function loadState(){
  try{
    if(window.storage){
      const r = await window.storage.get(STORAGE_KEY);
      if(r && r.value){ state = Object.assign(state, JSON.parse(r.value)); }
    } else {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if(value){ state = Object.assign(state, JSON.parse(value)); }
    }
  }catch(e){ }
  renderAll();
}
async function saveState(){
  try{
    const value = JSON.stringify(state);
    if(window.storage) await window.storage.set(STORAGE_KEY, value);
    else window.localStorage.setItem(STORAGE_KEY, value);
  }
  catch(e){ }
}

document.querySelectorAll('nav.tabs button').forEach(b=>{
  b.addEventListener('click', ()=>goTo(b.dataset.view));
});
function goTo(name){
  document.querySelectorAll('section.view').forEach(s=>s.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  window.scrollTo({top:0, behavior:'smooth'});
  if(name==='progresso') renderProgress();
}

const TIPS = [
  {ic:'🔎', t:'Verifique a fonte', d:'Quem publicou isso? Um veículo conhecido, um perfil anônimo, uma corrente encaminhada?'},
  {ic:'📅', t:'Confira a data', d:'Fotos e notícias antigas voltam a circular como se fossem de hoje. Sempre olhe quando foi publicado.'},
  {ic:'📰', t:'Observe o título', d:'Títulos com "URGENTE", "NINGUÉM TE CONTOU" ou promessas absolutas pedem mais atenção.'},
  {ic:'🔗', t:'Procure em outras fontes', d:'Se for verdade relevante, outros veículos sérios provavelmente também noticiaram.'},
  {ic:'🖼️', t:'Cheque o contexto da imagem', d:'Uma imagem real pode estar sendo usada para ilustrar um fato completamente diferente.'},
  {ic:'👤', t:'Descubra quem publicou', d:'Perfis sem histórico, sem identificação clara ou criados recentemente merecem desconfiança.'},
  {ic:'🤔', t:'Pense antes de compartilhar', d:'Compartilhar é tão importante quanto publicar. Um segundo de pausa evita espalhar um boato.'}
];
function renderTips(){
  const grid = document.getElementById('tips-grid');
  grid.innerHTML = TIPS.map((t,i)=>`
    <div class="tip" onclick="this.classList.toggle('open')">
      <div class="row"><span class="ic">${t.ic}</span><div><b>${t.t}</b></div></div>
      <div class="more">${t.d}</div>
    </div>`).join('');
}

const LEVELS = [
  {id:'l1', num:1, name:'Aprendendo a desconfiar', icon:'🟢'},
  {id:'l2', num:2, name:'Detetive da informação', icon:'🟡'},
  {id:'l3', num:3, name:'Investigador', icon:'🟠'},
  {id:'l4', num:4, name:'Mestre da verificação', icon:'🔴'},
  {id:'l5', num:5, name:'Desafio final', icon:'🟣'}
];

const CHALLENGES = {
  l1:[
    {id:'l1-1', type:'mcq',
      prompt:'"Cientistas descobrem que tomar suco de limão cura QUALQUER doença em 24 horas!" — como você classificaria essa informação?',
      options:['Verdadeira, pode compartilhar','Falsa, com certeza','Precisa ser verificada antes de qualquer coisa'],
      correct:2, points:10,
      exp:'Promessas absolutas ("cura qualquer doença") e ausência de fonte são sinais de alerta. Isso não prova que é falsa — mas exige verificação antes de acreditar ou compartilhar.'},
    {id:'l1-2', type:'signals',
      prompt:'Clique nos trechos suspeitos deste post.',
      post:{headline:'URGENTE!!! Prefeitura vai cortar água da cidade inteira amanhã, ninguém está avisando!', meta:'Postado por @cidadao_alerta_2024 · compartilhe antes que apaguem'},
      flags:[
        {text:'URGENTE!!!', suspect:true, why:'Uso de caixa alta e pontos de exclamação para gerar urgência artificial.'},
        {text:'ninguém está avisando', suspect:true, why:'Alega um "segredo" sem citar nenhuma fonte oficial.'},
        {text:'@cidadao_alerta_2024', suspect:true, why:'Perfil sem identificação clara de quem é.'},
        {text:'compartilhe antes que apaguem', suspect:true, why:'Pedido de compartilhamento urgente é uma tática clássica de desinformação.'},
        {text:'Prefeitura', suspect:false, why:'Citar a instituição não é, sozinho, um sinal de alerta.'}
      ],
      points:10},
    {id:'l1-3', type:'mcq',
      prompt:'Qual destes três títulos apresenta mais características de desinformação?',
      options:[
        'Prefeitura anuncia obras de manutenção na rede de água para o próximo mês',
        'VOCÊ NÃO VAI ACREDITAR no que fizeram com a água da nossa cidade — compartilhe AGORA',
        'Secretaria de Saneamento publica cronograma de manutenção; consulte o site oficial'
      ],
      correct:1, points:10,
      exp:'Caixa alta, apelo emocional forte e pedido explícito de compartilhamento imediato são sinais clássicos de título feito para viralizar, não para informar.'}
  ],
  l2:[
    {id:'l2-1', type:'mcq',
      prompt:'Você recebeu a mesma notícia de três lugares diferentes. Qual fonte você deveria investigar primeiro?',
      options:[
        'Um portal de notícias que você nunca ouviu falar, sem seção "sobre" ou expediente',
        'Um jornal com décadas de existência e correção de erros publicada quando erra',
        'Uma agência de notícias internacional conhecida'
      ],
      correct:0, points:5,
      exp:'Fontes desconhecidas, sem identificação de quem escreve ou edita, são as que mais merecem checagem antes de qualquer coisa.'},
    {id:'l2-2', type:'mcq',
      prompt:'Um post afirma "ACONTECENDO AGORA: hospital lota após surto". As fotos, porém, têm marca d\'água de um jornal de 3 anos atrás. O que isso indica?',
      options:[
        'Que o hospital realmente está lotado agora, só usaram fotos antigas para ilustrar',
        'Que a informação está sendo apresentada fora do tempo real e precisa ser recontextualizada',
        'Que não há nada de errado, fotos antigas podem ser reaproveitadas livremente'
      ],
      correct:1, points:10,
      exp:'Conteúdo antigo reaproveitado como se fosse atual é uma das formas mais comuns de desinformação — a data é tão importante quanto o conteúdo.'},
    {id:'l2-3', type:'mcq',
      prompt:'Duas versões da "mesma" notícia circulam. A versão A cita a fonte oficial e tem data; a versão B foi encaminhada por mensagem, sem fonte nem data, com o texto reescrito de forma mais alarmista. O que fazer?',
      options:[
        'Confiar na versão B porque chegou primeiro pelo grupo da família',
        'Comparar as duas e priorizar a versão com fonte e data verificáveis',
        'Compartilhar as duas, para não correr risco'
      ],
      correct:1, points:10,
      exp:'Quando duas versões divergem, a que tem fonte identificável e data checável é a que deve orientar sua decisão.'}
  ],
  l3:[
    {id:'l3-1', type:'order',
      prompt:'Coloque as etapas da investigação na ordem correta (clique na sequência certa).',
      steps:['Receber informação','Analisar o contexto','Verificar fonte','Conferir data','Procurar outras fontes','Decidir se deve compartilhar'],
      points:20},
    {id:'l3-2', type:'mcq',
      prompt:'Uma foto de uma manifestação lotada está sendo usada com a legenda "Multidão protesta HOJE contra nova lei". Ao pesquisar a imagem, você descobre que ela é de um evento esportivo, em outro país, de anos atrás. O que isso significa?',
      options:[
        'A imagem está fora de contexto — a legenda não corresponde ao que a foto realmente mostra',
        'Não importa, o protesto pode ter mesmo acontecido',
        'A imagem só está desatualizada, mas a legenda está correta'
      ],
      correct:0, points:10,
      exp:'Buscar a origem de uma imagem (busca reversa) frequentemente revela que ela foi tirada de outro contexto, lugar ou época.'},
    {id:'l3-3', type:'mcq',
      prompt:'O texto diz: "Especialistas afirmam que o produto é 100% seguro." Nenhum nome, instituição ou estudo é citado. Como avaliar essa frase?',
      options:[
        'Confiável, porque menciona "especialistas"',
        'Suspeita — "especialistas" sem nome ou instituição não é uma fonte verificável',
        'Irrelevante, frases assim não afetam a credibilidade do texto'
      ],
      correct:1, points:10,
      exp:'Autoridade genérica ("especialistas dizem", "estudos comprovam") sem identificação é um recurso comum para dar falsa credibilidade.'}
  ],
  l4:[
    {id:'l4-1', type:'classify',
      prompt:'Analise a notícia completa abaixo e decida: ela parece confiável, precisa de mais verificação, ou apresenta sinais de desinformação?',
      news:{
        titulo:'Estudo aponta possível aumento no consumo de água em dias de calor extremo',
        texto:'Um levantamento preliminar de uma universidade regional sugere relação entre ondas de calor e maior consumo residencial de água. Os autores pedem cautela até a revisão por pares.',
        imagem:'Foto genérica de uma torneira aberta, sem relação direta com o estudo',
        data:'14 de agosto de 2026',
        autor:'Equipe de comunicação da universidade',
        fonte:'Site oficial da universidade'
      },
      correct:'y', points:20,
      exp:{
        titulo:'Título comedido, sem promessas absolutas — bom sinal.',
        texto:'O próprio texto pede cautela ("preliminar", "revisão por pares") — isso é honestidade científica, não um problema.',
        imagem:'Imagem genérica e não enganosa, mas também não agrega prova nenhuma — vale checar se há imagens mais específicas.',
        data:'Data presente e recente — bom sinal.',
        autor:'Autoria institucional identificável — bom sinal.',
        fonte:'Fonte primária (site da própria universidade) — pode ser confirmada diretamente.'
      },
      note:'Um caso "precisa de mais verificação" não é bom nem ruim — é o retrato mais comum de notícia real: séria, mas ainda em apuração.'}
  ],
  l5:[
    {id:'l5-1', type:'mcq', tag:'📰 Notícia',
      prompt:'Uma notícia sem autor, sem data e sem fonte alega uma decisão do governo que muda sua rotina amanhã. O que você faz?',
      options:['Compartilho para avisar todo mundo rápido','Paro, procuro a fonte oficial e só então decido o que fazer','Ignoro completamente, sem checar nada'],
      correct:1, points:10, exp:'Parar e verificar a fonte oficial é sempre o caminho mais seguro diante de uma informação de impacto.'},
    {id:'l5-2', type:'mcq', tag:'📱 Rede social',
      prompt:'Um amigo encaminha um áudio "de um médico" fazendo um alerta grave, sem nenhum nome ou instituição citada. O que você faz?',
      options:['Encaminho para a família, mesmo sem saber quem é o médico','Pergunto ao amigo de onde veio o áudio e busco confirmação em fonte oficial de saúde','Acredito porque a voz parece confiante'],
      correct:1, points:10, exp:'Autoridade sem identificação verificável não deve ser suficiente para confiar — buscar a fonte original é essencial.'},
    {id:'l5-3', type:'mcq', tag:'🖼️ Imagem',
      prompt:'Uma imagem chocante circula associada a um evento recente. Uma busca reversa mostra que ela é de anos atrás, em outro país. O que você faz?',
      options:['Compartilho mesmo assim, o importante é chamar atenção para a causa','Não compartilho a imagem com essa legenda, e se puder, aviso quem compartilhou','Apago a busca da minha mente e compartilho como se nada tivesse acontecido'],
      correct:1, points:10, exp:'Mesmo com boa intenção, compartilhar uma imagem fora de contexto espalha desinformação. Avisar quem compartilhou ajuda a interromper o ciclo.'},
    {id:'l5-4', type:'mcq', tag:'📊 Gráfico',
      prompt:'Um gráfico viral não mostra a fonte dos dados nem o período analisado, mas o crescimento parece dramático. O que você faz?',
      options:['Comparo com dados de fontes oficiais antes de tirar conclusões','Compartilho, gráficos costumam ser confiáveis por natureza','Uso o gráfico como argumento em uma discussão sem checar nada'],
      correct:0, points:10, exp:'Gráficos sem fonte e período claros podem distorcer a realidade — sempre vale checar a origem dos dados.'}
  ]
};

const BADGES = [
  {id:'b1', ic:'🏅', name:'Primeira verificação', check:s=>Object.keys(s.answered).length>=1},
  {id:'b2', ic:'🔎', name:'Detetive de fontes', check:s=>s.levelsDone['l2']},
  {id:'b3', ic:'📰', name:'Caçador de títulos', check:s=>s.answered['l1-3']},
  {id:'b5', ic:'🏆', name:'Mestre da verificação', check:s=>s.levelsDone['l4'] && s.levelsDone['l5']}
];

let currentLevel = null;
let currentIndex = 0;

function renderLevelTrack(){
  const track = document.getElementById('level-track');
  track.innerHTML = LEVELS.map(l=>{
    const done = state.levelsDone[l.id];
    return `<div class="level-node ${done?'done':''}" onclick="openLevel('${l.id}')">
      <div class="n">${done?'✓':l.icon}</div>
      <div class="s">Nível ${l.num}</div>
    </div>`;
  }).join('');
}

function openLevel(levelId){
  currentLevel = levelId;
  currentIndex = 0;
  renderChallenge();
}

function splitQuestion(c){
  const separator = c.prompt.indexOf('—');
  if(separator === -1){
    return {headline:'Informação viral chama atenção nas redes', question:c.prompt};
  }
  return {
    headline:c.prompt.slice(0, separator).trim().replace(/^["“]/, '').replace(/["”]$/, ''),
    question:c.prompt.slice(separator + 1).trim()
  };
}

function renderQuestionPage(c){
  const section = c.tag || 'Informação em análise';
  const question = splitQuestion(c);
  return `
    <div class="mock-post question-page">
      <div class="news-topline">
        <span class="news-brand">notícia<span>agora</span></span>
        <span class="news-live">Em análise</span>
      </div>
      <div class="news-nav">Brasil&nbsp;&nbsp;|&nbsp;&nbsp;Cotidiano&nbsp;&nbsp;|&nbsp;&nbsp;Saúde&nbsp;&nbsp;|&nbsp;&nbsp;Política&nbsp;&nbsp;|&nbsp;&nbsp;Economia</div>
      <div class="news-section">${section}</div>
      <div class="headline">${question.headline}</div>
      <div class="news-subheadline">Publicação circula rapidamente, mas ainda precisa ser conferida na fonte original.</div>
      <div class="question-page-copy">A equipe de redação reúne o contexto disponível e indica os pontos que precisam de confirmação antes de qualquer conclusão.</div>
      <div class="news-byline">Da redação · Conteúdo em análise</div>
      <div class="meta">Publicado hoje · Página simulada para investigação</div>
    </div>`;
}

function renderChallenge(){
  const panel = document.getElementById('challenge-panel');
  const list = CHALLENGES[currentLevel];
  const c = list[currentIndex];
  const question = splitQuestion(c);
  const hasQuestionPage = c.id === 'l1-1';
  panel.classList.add('active');
  const already = !!state.answered[c.id];

  let body = '';
  if(c.type==='mcq'){
    body = `
      ${c.tag?`<div class="eyebrow">${c.tag}</div>`:''}
      ${hasQuestionPage ? renderQuestionPage(c) : ''}
      ${hasQuestionPage ? '<div class="question-label">Pergunta de verificação</div>' : ''}
      <div class="chal-prompt">${hasQuestionPage ? question.question : c.prompt}</div>
      <div class="opt-list">${c.options.map((o,i)=>`<button class="opt-btn" onclick="answerMcq('${c.id}',${i},${c.correct},this)">${o}</button>`).join('')}</div>
      <div class="feedback-box" id="fb-${c.id}"></div>`;
  } else if(c.type==='signals'){
    body = `
      <div class="chal-prompt">${c.prompt}</div>
      <div class="mock-post">
        <div class="news-topline">
          <span class="news-brand">notícia<span>agora</span></span>
          <span class="news-live">Ao vivo</span>
        </div>
        <div class="news-nav">Brasil&nbsp;&nbsp;|&nbsp;&nbsp;Cotidiano&nbsp;&nbsp;|&nbsp;&nbsp;Saúde&nbsp;&nbsp;|&nbsp;&nbsp;Política&nbsp;&nbsp;|&nbsp;&nbsp;Economia</div>
        <div class="news-section">Cotidiano</div>
        <div class="headline">${c.post.headline}</div>
        <div class="news-subheadline">Mensagem alerta moradores, mas não apresenta fonte oficial nem confirmação das autoridades.</div>
        <div class="news-image">
          <img src="images.jpg" alt="Torneira aberta com uma gota de água" loading="lazy">
        </div>
        <div class="news-caption">Conteúdo compartilhado nas redes sociais; verifique a origem antes de acreditar.</div>
        <div class="meta">${c.post.meta}</div>
      </div>
      <div class="sig-list" id="siglist-${c.id}">
        ${c.flags.map((f,i)=>`
          <div class="check-row">
            <div class="box" id="sigbox-${c.id}-${i}" onclick="toggleSigBox(this)"></div>
            <div class="lbl">"${f.text}"<div class="ai-comment" id="sigwhy-${c.id}-${i}"></div></div>
          </div>`).join('')}
      </div>
      <div class="feedback-box" id="fb-${c.id}"></div>
      <div class="cta-row"><button class="btn small" onclick="checkSignals('${c.id}')">Conferir seleção</button></div>`;
  } else if(c.type==='order'){
    body = `
      <div class="chal-prompt">${c.prompt}</div>
      <div class="order-list" id="order-${c.id}"></div>
      <div class="feedback-box" id="fb-${c.id}"></div>`;
  } else if(c.type==='classify'){
    body = `
      <div class="chal-prompt">${c.prompt}</div>
      <div class="classify-card">
        <div class="field"><b>Título</b>${c.news.titulo}</div>
        <div class="field"><b>Texto</b>${c.news.texto}</div>
        <div class="field"><b>Imagem</b>${c.news.imagem}</div>
        <div class="field"><b>Data</b>${c.news.data}</div>
        <div class="field"><b>Autor</b>${c.news.autor}</div>
        <div class="field"><b>Fonte</b>${c.news.fonte}</div>
      </div>
      <div class="classify-opts">
        <button class="g" onclick="answerClassify('${c.id}','g')">🟢 Parece confiável</button>
        <button class="y" onclick="answerClassify('${c.id}','y')">🟡 Precisa verificar</button>
        <button class="r" onclick="answerClassify('${c.id}','r')">🔴 Sinais de desinformação</button>
      </div>
      <div class="feedback-box" id="fb-${c.id}"></div>`;
  }

  panel.innerHTML = `
    <div class="question-session-head">
      <div class="session-title">Sessão de perguntas</div>
      <div class="chal-progress">NÍVEL ${LEVELS.find(l=>l.id===currentLevel).num} · CASO ${currentIndex+1} DE ${list.length}${already?' · já resolvido':''}</div>
    </div>
    ${body}
    <div class="chal-nav"><button class="btn ghost small" onclick="nextChallenge()">Próximo caso →</button></div>`;

  if(c.type==='order') renderOrder(c);
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function toggleSigBox(el){
  el.classList.remove('right','miss');
  el.classList.toggle('picked');
}
function checkSignals(cid){
  const c = CHALLENGES[currentLevel].find(x=>x.id===cid);
  c.flags.forEach((f,i)=>{
    const box = document.getElementById(`sigbox-${cid}-${i}`);
    const why = document.getElementById(`sigwhy-${cid}-${i}`);
    const picked = box.classList.contains('picked');
    box.classList.remove('picked','right','miss');
    if(f.suspect && picked){ box.classList.add('right'); why.textContent = f.why; }
    else if(!f.suspect && picked){ box.classList.add('miss'); why.textContent = 'Isso não é, sozinho, um sinal de alerta.'; }
    else if(f.suspect && !picked){ box.classList.add('miss'); why.textContent = f.why; }
    else { why.textContent = ''; }
  });
  const allCorrect = c.flags.every((f,i)=>{
    const box = document.getElementById(`sigbox-${cid}-${i}`);
    return f.suspect ? box.classList.contains('right') : !box.classList.contains('miss');
  });
  if(allCorrect){
    c.flags.forEach((f,i)=>{ document.getElementById(`sigbox-${cid}-${i}`).onclick=null; });
  }
  showFeedback(c.id, allCorrect, c.points, allCorrect ? 'Você identificou todos os sinais de alerta corretamente!' : 'Alguns itens ficaram errados — veja os comentários abaixo de cada trecho e tente de novo.', !allCorrect);
}

function answerMcq(cid, chosen, correct, btn){
  const c = CHALLENGES[currentLevel].find(x=>x.id===cid);
  const buttons = btn.parentElement.children;
  if(chosen===correct){
    Array.from(buttons).forEach(b=>b.setAttribute('disabled','true'));
    btn.classList.add('correct');
    showFeedback(cid, true, c.points, c.exp);
  } else {
    btn.classList.add('wrong');
    btn.setAttribute('disabled','true');
    showFeedback(cid, false, c.points, 'Essa opção não é a mais adequada. Tente outra alternativa.');
  }
}

function renderOrder(c){
  const box = document.getElementById('order-'+c.id);
  const shuffled = [...c.steps].sort(()=>Math.random()-0.5);
  box.innerHTML = shuffled.map((s,i)=>`<div class="order-item" data-step="${s}" onclick="pickOrder(this,'${c.id}')"><div class="num"></div>${s}</div>`).join('');
  box.dataset.picks = JSON.stringify([]);
}
function pickOrder(el, cid){
  if(el.classList.contains('locked')) return;
  const box = el.parentElement;
  let picks = JSON.parse(box.dataset.picks);
  picks.push(el.dataset.step);
  box.dataset.picks = JSON.stringify(picks);
  el.classList.add('locked','picked');
  el.querySelector('.num').textContent = picks.length;
  const c = CHALLENGES[currentLevel].find(x=>x.id===cid);
  if(picks.length===c.steps.length){
    const correct = JSON.stringify(picks)===JSON.stringify(c.steps);
    showFeedback(cid, correct, c.points, correct ? 'Sequência correta! Essa é a ordem lógica de uma boa investigação.' : 'A ordem não ficou certa. Tente novamente.', !correct);
  }
}

function answerClassify(cid, choice){
  const c = CHALLENGES[currentLevel].find(x=>x.id===cid);
  const buttons = document.querySelectorAll('.classify-opts button');
  buttons.forEach(b=>b.setAttribute('disabled','true'));
  const correct = choice===c.correct;
  const expText = Object.entries(c.exp).map(([k,v])=>`<b style="text-transform:capitalize">${k}:</b> ${v}`).join('<br>');
  showFeedback(cid, correct, c.points, expText + `<br><br><i>${c.note}</i>`, !correct);
}

function showFeedback(cid, correct, points, text, allowRetry){
  const box = document.getElementById('fb-'+cid);
  box.classList.remove('ok','bad');
  box.classList.add('show', correct?'ok':'bad');
  let html = `<div>${correct?'✅ Boa investigação!':'🔎 Quase lá.'} ${text}</div>`;
  if(correct && !state.answered[cid]) html += `<div class="pts">+${points} pontos</div>`;
  if(!correct && allowRetry) html += `<div class="cta-row" style="margin-top:10px;"><button class="btn ghost small" onclick="renderChallenge()">Tentar novamente</button></div>`;
  box.innerHTML = html;
  if(correct && !state.answered[cid]){
    state.answered[cid] = true;
    state.score += points;
    checkLevelComplete(currentLevel);
    checkBadges();
    saveState();
  }
}

function checkLevelComplete(levelId){
  const list = CHALLENGES[levelId];
  const done = list.every(c=>state.answered[c.id]);
  if(done && !state.levelsDone[levelId]){
    state.levelsDone[levelId] = true;
    state.score += 20;
  }
  renderLevelTrack();
}

function nextChallenge(){
  const list = CHALLENGES[currentLevel];
  if(currentIndex < list.length-1){ currentIndex++; renderChallenge(); }
  else { renderLevelComplete(); }
}

function renderLevelComplete(){
  const panel = document.getElementById('challenge-panel');
  const idx = LEVELS.findIndex(l=>l.id===currentLevel);
  const level = LEVELS[idx];
  const next = LEVELS[idx+1];
  const doneAll = CHALLENGES[currentLevel].every(c=>state.answered[c.id]);
  panel.innerHTML = `
    <div class="chal-progress">NÍVEL ${level.num} · ${level.name}</div>
    <div class="chal-prompt">${doneAll ? '🏁 Você completou todos os casos deste nível!' : 'Você chegou ao fim dos casos deste nível.'}</div>
    <div class="cta-row">
      ${next
        ? `<button class="btn small" onclick="openLevel('${next.id}')">Ir para o nível ${next.num}: ${next.name} →</button>
           <button class="btn ghost small" onclick="goTo('progresso')">Ver meu progresso</button>`
        : `<button class="btn small" onclick="goTo('progresso')">🏆 Ver resultado final</button>`}
    </div>`;
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function checkBadges(){
  BADGES.forEach(b=>{ if(!state.badges[b.id] && b.check(state)) state.badges[b.id]=true; });
}

function renderProgress(){
  document.getElementById('stat-score').textContent = state.score;
  document.getElementById('stat-levels').textContent = Object.keys(state.levelsDone).length + '/5';
  document.getElementById('stat-badges').textContent = Object.keys(state.badges).length + '/4';

  const maxScore = Object.values(CHALLENGES).flat().reduce((s,c)=>s+c.points,0) + 20*5;
  const pct = Math.min(100, Math.round((state.score/maxScore)*100));
  const angle = -90 + (pct/100)*180;
  document.getElementById('prog-needle').style.transform = `rotate(${angle}deg)`;
  document.getElementById('prog-caption').textContent = `Nível de atenção: ${pct}/100`;

  let msg;
  if(pct===0) msg = 'Você ainda não começou nenhum desafio. Que tal investigar o primeiro caso?';
  else if(pct<30) msg = 'Você está começando a treinar o olhar crítico. Continue nos desafios para evoluir.';
  else if(pct<70) msg = 'Bom progresso — você já identifica vários sinais de alerta. Vale reforçar a verificação de fontes.';
  else msg = 'Excelente! Você costuma parar, verificar e comparar antes de decidir compartilhar.';
  document.getElementById('progress-msg').textContent = msg;

  document.getElementById('badge-grid').innerHTML = BADGES.map(b=>`
    <div class="badge ${state.badges[b.id]?'unlocked':''}">
      <span class="ic">${b.ic}</span>
      <div class="n">${b.name}</div>
    </div>`).join('');
}

async function resetProgress(){
  state = {score:0, answered:{}, levelsDone:{}, badges:{}};
  await saveState();
  renderAll();
  renderProgress();
}

function renderAll(){
  renderTips();
  renderLevelTrack();
  renderProgress();
}
loadState();
