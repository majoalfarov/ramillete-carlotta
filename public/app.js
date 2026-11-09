const $=id=>document.getElementById(id);
const KEYS=["misas","rosarios","comuniones"];
const API="/api/ofrendas";
let rows=[];
const ADMIN=location.hash==="#admin";

function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(_){return null}}
function rnd(){const a=new Uint8Array(18);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(36).padStart(2,"0")).join("").slice(0,24)}
let myId=store("ramillete_id"), myToken=store("ramillete_token");
if(!myId||!myToken){myId=rnd();myToken=rnd();store("ramillete_id",myId);store("ramillete_token",myToken)}

function clamp(v){v=parseInt(v,10);return isNaN(v)||v<0?0:Math.min(v,9999)}
document.querySelectorAll(".ctrl button").forEach(b=>b.addEventListener("click",()=>{
  const i=$(b.dataset.k); i.value=clamp(clamp(i.value)+Number(b.dataset.d));
}));
$("anonimo").addEventListener("change",e=>{$("nombre").disabled=e.target.checked});
KEYS.forEach(k=>$(k).addEventListener("blur",()=>{$(k).value=clamp($(k).value)}));

function esc(s){const d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML}
function plural(n,s,p){return n+" "+(n===1?s:p)}

function flower(x,y,s,c,o){
  let p=`<g class="flower" opacity="${o}">`;
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;p+=`<circle cx="${(x+Math.cos(a)*s*.55).toFixed(1)}" cy="${(y+Math.sin(a)*s*.55).toFixed(1)}" r="${(s*.5).toFixed(1)}" fill="${c}" opacity=".85"/>`}
  return p+`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s*.3).toFixed(1)}" fill="#fff" opacity=".9"/></g>`;
}
function drawBouquet(list){
  const cs=getComputedStyle(document.documentElement);
  const col={m:cs.getPropertyValue("--gold").trim(),r:cs.getPropertyValue("--rose").trim(),c:cs.getPropertyValue("--sage").trim()};
  const stem=col.c, muted=cs.getPropertyValue("--line").trim();
  let out=`<g stroke="${stem}" stroke-width="2" fill="none" opacity=".7">`;
  for(let i=-3;i<=3;i++) out+=`<path d="M160 290 Q${160+i*6} 220 ${160+i*22} 150"/>`;
  out+=`</g><path d="M128 262 L192 262 L178 238 L142 238 Z" fill="${col.r}" opacity=".35"/>`;
  if(!list.length){for(let i=0;i<7;i++){const a=i/7*Math.PI*2;out+=flower(160+Math.cos(a)*40,130+Math.sin(a)*34,10,muted,.6)}}
  list.slice(0,80).forEach((f,i)=>{
    const a=i*2.399, r=8*Math.sqrt(i+1)*1.6;
    const d=f.misas>=f.rosarios&&f.misas>=f.comuniones?col.m:(f.rosarios>=f.comuniones?col.r:col.c);
    const size=9+Math.min(6,Math.log2(1+f.misas+f.rosarios+f.comuniones)*1.5);
    out+=flower(160+Math.cos(a)*r,128+Math.sin(a)*r*.85,size,d,1);
  });
  $("bouquet").innerHTML=out;
}

function render(){
  const t={misas:0,rosarios:0,comuniones:0};
  rows.forEach(r=>KEYS.forEach(k=>t[k]+=clamp(r[k])));
  $("tMisas").textContent=t.misas.toLocaleString("es-MX");
  $("tRos").textContent=t.rosarios.toLocaleString("es-MX");
  $("tCom").textContent=t.comuniones.toLocaleString("es-MX");
  $("people").textContent=rows.length?plural(rows.length,"persona reza","personas rezan")+" por Carlotta":"Sé la primera persona en ofrecer algo por Carlotta";
  const sorted=[...rows].sort((a,b)=>(b.ts||0)-(a.ts||0));
  $("list").innerHTML=sorted.length?sorted.map(r=>{
    const parts=[];
    if(clamp(r.misas))parts.push(plural(clamp(r.misas),"misa","misas"));
    if(clamp(r.rosarios))parts.push(plural(clamp(r.rosarios),"rosario","rosarios"));
    if(clamp(r.comuniones))parts.push(plural(clamp(r.comuniones),"comunión","comuniones"));
    const del=ADMIN?`<button class="del" data-id="${esc(r.id)}" type="button">Borrar</button>`:"";
    return `<div class="item"><span class="who">${r.anonimo?"Anónimo":esc(r.nombre||"Alguien")}${r.id===myId?' <small class="you">(tú)</small>':""}</span><span class="what">${esc(parts.join(" · "))}</span>${r.intencion?`<span class="int">${esc(r.intencion)}</span>`:""}${del}</div>`;
  }).join(""):`<p class="empty">Aún no hay ofrendas. La primera flor puede ser la tuya.</p>`;
  drawBouquet([...rows].sort((a,b)=>(a.creada||0)-(b.creada||0)).map(r=>({misas:clamp(r.misas),rosarios:clamp(r.rosarios),comuniones:clamp(r.comuniones)})));
  if(rows.some(r=>r.id===myId)){$("formTitle").textContent="Tu ofrenda";$("save").textContent="Actualizar mi ofrenda"}
}

let filled=false;
function fillMine(){
  if(filled)return; const m=rows.find(r=>r.id===myId); if(!m)return; filled=true;
  $("nombre").value=m.nombre||""; $("anonimo").checked=!!m.anonimo; $("nombre").disabled=!!m.anonimo;
  $("intencion").value=m.intencion||""; KEYS.forEach(k=>$(k).value=clamp(m[k]));
}

function setMsg(t,cls){const m=$("msg");m.textContent=t;m.className="msg"+(cls?" "+cls:"")}

async function load(){
  try{
    const r=await fetch(API,{cache:"no-store"});
    if(!r.ok)throw 0;
    rows=await r.json(); render(); fillMine();
  }catch(_){ if(!rows.length)$("people").textContent="No se pudieron cargar las ofrendas. Revisa tu conexión." }
}

$("form").addEventListener("submit",async e=>{
  e.preventDefault();
  const anonimo=$("anonimo").checked, nombre=$("nombre").value.trim();
  const v={}; KEYS.forEach(k=>v[k]=clamp($(k).value));
  if(!nombre&&!anonimo){setMsg("Escribe tu nombre o marca la opción de anónimo.","err");$("nombre").focus();return}
  if(!v.misas&&!v.rosarios&&!v.comuniones){setMsg("Agrega al menos una misa, un rosario o una comunión.","err");return}
  $("save").disabled=true; setMsg("Guardando…");
  try{
    const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({id:myId,token:myToken,nombre,anonimo,intencion:$("intencion").value.trim(),...v})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){setMsg(data.error||"No se pudo guardar. Inténtalo de nuevo.","err");return}
    const i=rows.findIndex(x=>x.id===myId); if(i>=0)rows[i]=data; else rows.push(data);
    filled=true; render(); setMsg("Gracias. Tu ofrenda ya está en el ramillete.","ok");
  }catch(_){setMsg("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.","err")}
  finally{$("save").disabled=false}
});

if(ADMIN){
  $("admin").hidden=false;
  $("list").addEventListener("click",async e=>{
    const b=e.target.closest(".del"); if(!b)return;
    if(b.dataset.confirm!=="1"){b.dataset.confirm="1";b.textContent="Toca otra vez para borrar";return}
    const key=$("adminKey").value.trim(); if(!key){$("adminMsg").textContent="Escribe la clave de administración.";return}
    b.disabled=true;
    const r=await fetch(API+"?id="+encodeURIComponent(b.dataset.id),{method:"DELETE",headers:{"x-admin-key":key}}).catch(()=>null);
    if(r&&r.ok){rows=rows.filter(x=>x.id!==b.dataset.id);render();$("adminMsg").textContent="Ofrenda borrada."}
    else{$("adminMsg").textContent=r&&r.status===401?"La clave no es correcta.":"No se pudo borrar.";b.disabled=false}
  });
}

render(); load(); setInterval(load,30000);
