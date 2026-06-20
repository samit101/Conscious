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

const $ = (selector) => document.querySelector(selector);
const clone = (value) => JSON.parse(JSON.stringify(value));
let state = loadState();
let activeDialogSave = null;
let lastPromptIndex = 0;

function loadState() {
  try {
    const stored = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : clone(seed);
  } catch (error) {
    console.warn("Common Ground could not read saved notes. Starter notes are being used instead.", error);
    return clone(seed);
  }
}

function save() {
  try {
    if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Common Ground could not save notes in this browser.", error);
  }
}

function esc(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function renderPulse() {
  $("#pulseCount").textContent = `${state.pulse.length} notes`;
  $("#pulseGrid").innerHTML = state.pulse.length ? state.pulse.map((item) => `<article class="pulse-card" style="--accent:${esc(item.color)}">
    <div class="pulse-meta"><span class="category">${esc(item.category)}</span><span class="date">${esc(item.date)}</span></div>
    <h4>${esc(item.title)}</h4><p>${esc(item.detail)}</p>
    <div class="item-actions"><button class="mini-button edit-pulse" data-id="${esc(item.id)}" title="Edit" type="button">✎</button><button class="mini-button delete-pulse" data-id="${esc(item.id)}" title="Delete" type="button">×</button></div>
  </article>`).join("") : `<div class="empty-state">Nothing hot right now. Add a moment worth coming back to.</div>`;
}

function personCard(person, type) {
  const items = person[type];
  const title = type === "evergreen" ? `${items.length} evergreen notes` : `${items.length} seeds to tend`;
  return `<article class="${type === "cultivate" ? "cultivate-card" : "person-card"}" style="--person-color:${esc(person.color)}">
    <div class="person-header"><span class="avatar">${esc(person.name.charAt(0))}</span><div><h4>${esc(person.name)}</h4><p>${title}</p></div></div>
    <div>${items.map((item, index) => `<div class="tag-row"><span>${esc(item)}</span><div class="item-actions"><button class="mini-button edit-note" data-person="${esc(person.id)}" data-type="${type}" data-index="${index}" title="Edit" type="button">✎</button><button class="mini-button delete-note" data-person="${esc(person.id)}" data-type="${type}" data-index="${index}" title="Delete" type="button">×</button></div></div>`).join("")}</div>
    <button class="add-row add-note" data-person="${esc(person.id)}" data-type="${type}" type="button">+ Add a note</button>
  </article>`;
}

function renderPeople() {
  $("#evergreenGrid").innerHTML = state.people.map((person) => personCard(person, "evergreen")).join("");
  $("#cultivateGrid").innerHTML = state.people.map((person) => personCard(person, "cultivate")).join("");
}

function render() {
  renderPulse();
  renderPeople();
  save();
}

function field(label, name, value = "", kind = "input") {
  if (kind === "textarea") return `<label class="field"><span>${label}</span><textarea name="${name}" required>${esc(value)}</textarea></label>`;
  return `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" required /></label>`;
}

function openModal(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
  dialog.classList.add("dialog-fallback-open");
}

function closeModal(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
  dialog.classList.remove("dialog-fallback-open");
}

function openDialog({ eyebrow, title, fields, onSave }) {
  const dialog = $("#itemDialog");
  $("#dialogEyebrow").textContent = eyebrow;
  $("#dialogTitle").textContent = title;
  $("#dialogFields").innerHTML = fields;
  activeDialogSave = onSave;
  openModal(dialog);
}

function submitDialog(event) {
  const form = $("#itemForm");
  const dialog = $("#itemDialog");
  const submitterValue = event.submitter && event.submitter.value;
  event.preventDefault();

  if (submitterValue === "cancel") {
    closeModal(dialog);
    return;
  }

  if (!form.reportValidity()) return;
  if (typeof activeDialogSave === "function") activeDialogSave(Object.fromEntries(new FormData(form)));
  activeDialogSave = null;
  closeModal(dialog);
  render();
}

function openPulse(id) {
  const item = state.pulse.find((pulseItem) => pulseItem.id === id);
  openDialog({
    eyebrow: item ? "Edit the pulse" : "Right now & coming up",
    title: item ? "Update this moment" : "Add something hot",
    fields: field("What's happening", "title", item ? item.title : "") + field("Conversation note", "detail", item ? item.detail : "", "textarea") + field("Category", "category", item ? item.category : "Family") + field("When", "date", item ? item.date : "This week"),
    onSave(data) {
      const next = { ...data, id: item ? item.id : `h${Date.now()}`, color: item ? item.color : COLORS[state.pulse.length % COLORS.length] };
      if (item) Object.assign(item, next);
      else state.pulse.unshift(next);
    }
  });
}

function openNote(personId, type, index) {
  const person = state.people.find((candidate) => candidate.id === personId);
  if (!person) return;
  const isEditing = Number.isInteger(index);
  const existing = isEditing ? person[type][index] : "";
  openDialog({
    eyebrow: type === "evergreen" ? "Always worth returning to" : "Seeds worth tending",
    title: isEditing ? "Edit this note" : "Add a note",
    fields: field(type === "evergreen" ? "Interest, concern, or touchpoint" : "Quality, habit, or inner resource", "note", existing, "textarea"),
    onSave(data) {
      if (isEditing) person[type][index] = data.note;
      else person[type].push(data.note);
    }
  });
}

function openPeople() {
  openDialog({
    eyebrow: "Make it yours",
    title: "Edit family names",
    fields: state.people.map((person, index) => field(`${person.role} ${index === 3 ? "" : "name"}`, person.id, person.name)).join(""),
    onSave(data) { state.people.forEach((person) => { person.name = data[person.id]; }); }
  });
}

function activateTab(tabButton) {
  document.querySelectorAll(".tab,.tab-panel").forEach((element) => element.classList.remove("active"));
  tabButton.classList.add("active");
  $(`#${tabButton.dataset.tab}`).classList.add("active");
}

function handleClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.matches(".tab")) activateTab(button);
  else if (button.id === "addPulseBtn") openPulse();
  else if (button.id === "editPeopleBtn") openPeople();
  else if (button.matches(".edit-pulse")) openPulse(button.dataset.id);
  else if (button.matches(".delete-pulse")) {
    state.pulse = state.pulse.filter((item) => item.id !== button.dataset.id);
    render();
  } else if (button.matches(".add-note")) openNote(button.dataset.person, button.dataset.type);
  else if (button.matches(".edit-note")) openNote(button.dataset.person, button.dataset.type, Number(button.dataset.index));
  else if (button.matches(".delete-note")) {
    const person = state.people.find((candidate) => candidate.id === button.dataset.person);
    if (!person) return;
    person[button.dataset.type].splice(Number(button.dataset.index), 1);
    render();
  }
}

function rotatePrompt() {
  lastPromptIndex = (lastPromptIndex + 1) % prompts.length;
  $("#promptText").textContent = prompts[lastPromptIndex];
}

function resetData() {
  if (window.confirm("Reset all notes to the starter set?")) {
    state = clone(seed);
    render();
  }
}

function init() {
  document.addEventListener("click", handleClick);
  $("#itemForm").addEventListener("submit", submitDialog);
  $("#newPromptBtn").addEventListener("click", rotatePrompt);
  $("#resetBtn").addEventListener("click", resetData);
  $("#today").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  render();
}

init();
