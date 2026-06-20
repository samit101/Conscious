const STORAGE_KEY = "common-ground-v1";
const COLORS = ["#c66e4b", "#527965", "#d09a48", "#a87171"];
const prompts = [
  "What made you unexpectedly smile this week?",
  "What is something you would love to get better at?",
  "If today had a soundtrack, what song would be on it?",
  "What is one small thing you are looking forward to?",
  "What did you notice today that other people may have missed?",
  "What is a question you wish people asked you more often?",
];
const seed = {
  people: [
    { id: "p1", name: "Maya", role: "Partner", color: COLORS[0], evergreen: ["The novel on her nightstand", "Garden plans for the spring", "Her sister's new job", "Finding a weekend escape"], cultivate: ["Unhurried time for herself", "A sense of adventure", "Space to create"] },
    { id: "p2", name: "Leo", role: "Kid", color: COLORS[1], evergreen: ["Space and everything NASA", "Building elaborate LEGO worlds", "Soccer stats and highlights", "The graphic novels he devours"], cultivate: ["Confidence in his own ideas", "Following his curiosity", "Being a generous teammate"] },
    { id: "p3", name: "Noah", role: "Kid", color: COLORS[2], evergreen: ["Dinosaurs — forever", "Learning to ride without help", "Anything involving pancakes", "His growing rock collection"], cultivate: ["Patience when things are hard", "Naming his big feelings", "Wonder for small things"] },
    { id: "p4", name: "Me", role: "My notes", color: COLORS[3], evergreen: ["Being more present at dinner", "Making room for play", "Listening before fixing"], cultivate: ["A slower pace", "More questions than answers", "Small rituals that last"] },
  ],
  pulse: [
    { id: "h1", title: "Leo's science fair", detail: "Ask what he wants people to notice first about his model.", category: "School", date: "Tomorrow", color: "#527965" },
    { id: "h2", title: "Grandma is visiting", detail: "Plan one thing each kid would love to show her.", category: "Family", date: "This weekend", color: "#c66e4b" },
    { id: "h3", title: "The lost tooth", detail: "Noah finally lost the tooth he has been wiggling all week.", category: "Little win", date: "Yesterday", color: "#d09a48" },
    { id: "h4", title: "Maya's big presentation", detail: "She has been working hard on this one. Ask how the run-through went.", category: "Work", date: "Friday", color: "#a87171" },
    { id: "h5", title: "First soccer game", detail: "Leo is nervous-excited about playing midfield this season.", category: "Coming up", date: "Saturday", color: "#527965" },
  ]
};
let state = loadState();
const $ = (selector) => document.querySelector(selector);
const clone = (value) => JSON.parse(JSON.stringify(value));
function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(seed); } catch { return clone(seed); } }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(value=""){ return value.replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function renderPulse(){
  $("#pulseCount").textContent = `${state.pulse.length} notes`;
  $("#pulseGrid").innerHTML = state.pulse.length ? state.pulse.map(item => `<article class="pulse-card" style="--accent:${item.color}">
    <div class="pulse-meta"><span class="category">${esc(item.category)}</span><span class="date">${esc(item.date)}</span></div>
    <h4>${esc(item.title)}</h4><p>${esc(item.detail)}</p>
    <div class="item-actions"><button class="mini-button edit-pulse" data-id="${item.id}" title="Edit" type="button">✎</button><button class="mini-button delete-pulse" data-id="${item.id}" title="Delete" type="button">×</button></div>
  </article>`).join("") : `<div class="empty-state">Nothing hot right now. Add a moment worth coming back to.</div>`;
}
function personCard(person, type){ const items = person[type]; const title = type === "evergreen" ? `${items.length} evergreen notes` : `${items.length} seeds to tend`;
  return `<article class="${type === "cultivate" ? "cultivate-card" : "person-card"}" style="--person-color:${person.color}">
    <div class="person-header"><span class="avatar">${esc(person.name.charAt(0))}</span><div><h4>${esc(person.name)}</h4><p>${title}</p></div></div>
    <div>${items.map((item,i)=>`<div class="tag-row"><span>${esc(item)}</span><div class="item-actions"><button class="mini-button edit-note" data-person="${person.id}" data-type="${type}" data-index="${i}" title="Edit" type="button">✎</button><button class="mini-button delete-note" data-person="${person.id}" data-type="${type}" data-index="${i}" title="Delete" type="button">×</button></div></div>`).join("")}</div>
    <button class="add-row add-note" data-person="${person.id}" data-type="${type}" type="button">+ Add a note</button>
  </article>`; }
function renderPeople(){ $("#evergreenGrid").innerHTML = state.people.map(p=>personCard(p,"evergreen")).join(""); $("#cultivateGrid").innerHTML = state.people.map(p=>personCard(p,"cultivate")).join(""); }
function render(){ renderPulse(); renderPeople(); save(); }
function field(label,name,value="",kind="input"){ if(kind==="textarea") return `<label class="field"><span>${label}</span><textarea name="${name}" required>${esc(value)}</textarea></label>`; return `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" required /></label>`; }
function openDialog({eyebrow,title,fields,onSave}){ const dialog=$("#itemDialog"), form=$("#itemForm"); $("#dialogEyebrow").textContent=eyebrow; $("#dialogTitle").textContent=title; $("#dialogFields").innerHTML=fields; dialog.showModal(); form.onsubmit=(e)=>{ if(e.submitter?.value==="cancel") return; e.preventDefault(); if(!form.reportValidity()) return; onSave(Object.fromEntries(new FormData(form))); dialog.close(); render(); }; }
function openPulse(id){ const item=state.pulse.find(x=>x.id===id); openDialog({ eyebrow:item?"Edit the pulse":"Right now & coming up", title:item?"Update this moment":"Add something hot", fields:field("What's happening","title",item?.title)+field("Conversation note","detail",item?.detail,"textarea")+field("Category","category",item?.category||"Family")+field("When","date",item?.date||"This week"), onSave(data){ const next={...data,id:item?.id||`h${Date.now()}`,color:item?.color||COLORS[state.pulse.length%COLORS.length]}; if(item) Object.assign(item,next); else state.pulse.unshift(next); } }); }
function openNote(personId,type,index){ const person=state.people.find(x=>x.id===personId), existing=index!==undefined?person[type][index]:""; openDialog({eyebrow:type==="evergreen"?"Always worth returning to":"Seeds worth tending", title:existing?"Edit this note":"Add a note", fields:field(type==="evergreen"?"Interest, concern, or touchpoint":"Quality, habit, or inner resource","note",existing,"textarea"), onSave(data){ if(existing) person[type][index]=data.note; else person[type].push(data.note); }}); }
function openPeople(){ openDialog({eyebrow:"Make it yours",title:"Edit family names",fields:state.people.map((p,i)=>field(`${p.role} ${i===3?"":"name"}`,p.id,p.name)).join(""),onSave(data){state.people.forEach(p=>p.name=data[p.id]);}}); }
document.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b)return; if(b.matches(".tab")){ document.querySelectorAll(".tab,.tab-panel").forEach(el=>el.classList.remove("active")); b.classList.add("active"); $(`#${b.dataset.tab}`).classList.add("active"); } if(b.id==="addPulseBtn")openPulse(); if(b.id==="editPeopleBtn")openPeople(); if(b.matches(".edit-pulse"))openPulse(b.dataset.id); if(b.matches(".delete-pulse")){state.pulse=state.pulse.filter(x=>x.id!==b.dataset.id);render();} if(b.matches(".add-note"))openNote(b.dataset.person,b.dataset.type); if(b.matches(".edit-note"))openNote(b.dataset.person,b.dataset.type,Number(b.dataset.index)); if(b.matches(".delete-note")){ const p=state.people.find(x=>x.id===b.dataset.person);p[b.dataset.type].splice(Number(b.dataset.index),1);render(); } });
$("#newPromptBtn").addEventListener("click",()=>{ const current=$("#promptText").textContent; let next=current; while(next===current) next=prompts[Math.floor(Math.random()*prompts.length)]; $("#promptText").textContent=next; });
$("#resetBtn").addEventListener("click",()=>{ if(confirm("Reset all notes to the starter set?")){state=clone(seed);render();} });
$("#today").textContent = new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
render();
