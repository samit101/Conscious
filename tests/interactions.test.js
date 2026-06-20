const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function makeClassList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
  };
}

function makeElement(id = "") {
  return {
    id,
    attributes: {},
    classList: makeClassList(),
    dataset: {},
    innerHTML: "",
    textContent: "",
    value: "",
    addEventListener(type, handler) { this[`on${type}`] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; this[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; delete this[name]; },
    reportValidity() { return true; },
    matches(selector) { return selector === `#${this.id}`; },
    closest() { return this; },
  };
}

function createHarness({ storageThrows = false, nativeDialog = true } = {}) {
  const ids = ["pulse", "evergreen", "cultivate", "pulseCount", "pulseGrid", "evergreenGrid", "cultivateGrid", "itemDialog", "itemForm", "dialogEyebrow", "dialogTitle", "dialogFields", "newPromptBtn", "promptText", "resetBtn", "today"];
  const elements = Object.fromEntries(ids.map((id) => [id, makeElement(id)]));
  if (nativeDialog) {
    elements.itemDialog.showModal = function showModal() { this.open = true; };
    elements.itemDialog.close = function close() { this.open = false; };
  }

  const tabButtons = ["pulse", "evergreen", "cultivate"].map((tab) => {
    const button = makeElement(`${tab}Tab`);
    button.dataset = { tab };
    button.matches = (selector) => selector === ".tab";
    return button;
  });
  const panels = [elements.pulse, elements.evergreen, elements.cultivate];
  const allTabElements = [...tabButtons, ...panels];

  const document = {
    addEventListener(type, handler) { this[`on${type}`] = handler; },
    querySelector(selector) { return elements[selector.slice(1)]; },
    querySelectorAll(selector) { return selector === ".tab,.tab-panel" ? allTabElements : []; },
  };
  const localStorage = {
    value: null,
    getItem() { if (storageThrows) throw new Error("blocked getItem"); return this.value; },
    setItem(_, value) { if (storageThrows) throw new Error("blocked setItem"); this.value = value; },
  };
  const context = { document, window: { localStorage, confirm: () => true }, localStorage, console, FormData, Intl, Date, Math };
  context.confirm = context.window.confirm;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("app.js", "utf8"), context);

  return { document, elements, tabButtons };
}

function click(document, button) { document.onclick({ target: button }); }
function button(id, classes = []) {
  const element = makeElement(id);
  element.matches = (selector) => selector === `#${id}` || classes.includes(selector);
  return element;
}

{
  const { document, elements, tabButtons } = createHarness();
  assert.match(elements.pulseGrid.innerHTML, /Leo&#39;s science fair/, "starter pulse cards render");

  click(document, button("addPulseBtn"));
  assert.equal(elements.itemDialog.open, true, "add hot-topic button opens its dialog");
  assert.match(elements.dialogFields.innerHTML, /name="title" value=""/, "new hot-topic fields safely render blank values");

  elements.itemDialog.open = false;
  const addNote = button("", [".add-note"]);
  addNote.dataset = { person: "p1", type: "evergreen" };
  click(document, addNote);
  assert.equal(elements.itemDialog.open, true, "add evergreen-note button opens its dialog");
  assert.match(elements.dialogTitle.textContent, /Add a note/, "add-note dialog has the expected title");

  elements.itemDialog.open = false;
  click(document, button("editPeopleBtn"));
  assert.equal(elements.itemDialog.open, true, "edit-names button opens its dialog");
  assert.match(elements.dialogFields.innerHTML, /value="Maya"/, "edit-names dialog includes existing names");

  click(document, tabButtons[1]);
  assert.equal(elements.evergreen.classList.contains("active"), true, "evergreen tab activates its panel");

  const initialPulse = elements.pulseGrid.innerHTML;
  const deletePulse = button("", [".delete-pulse"]);
  deletePulse.dataset = { id: "h1" };
  click(document, deletePulse);
  assert.notEqual(elements.pulseGrid.innerHTML, initialPulse, "delete pulse button re-renders the card grid");
  assert.doesNotMatch(elements.pulseGrid.innerHTML, /Leo&#39;s science fair/, "delete pulse button removes its card");
}

{
  const { document, elements } = createHarness({ storageThrows: true, nativeDialog: false });
  assert.match(elements.pulseGrid.innerHTML, /Leo&#39;s science fair/, "app still renders when localStorage is unavailable");
  click(document, button("addPulseBtn"));
  assert.equal(elements.itemDialog.open, "", "fallback modal opens without native dialog support");
  assert.equal(elements.itemDialog.classList.contains("dialog-fallback-open"), true, "fallback modal receives visible class");
}

console.log("Interaction checks passed: startup, tabs, dialogs, storage fallback, dialog fallback, delete flow");
