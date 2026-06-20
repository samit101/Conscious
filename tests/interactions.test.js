const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function makeElement(id = "") {
  return {
    id,
    classList: { add() {}, remove() {} },
    dataset: {},
    innerHTML: "",
    textContent: "",
    addEventListener(type, handler) { this[`on${type}`] = handler; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    reportValidity() { return true; },
    matches(selector) { return selector === `#${this.id}`; },
    closest() { return this; },
  };
}

const ids = ["pulseCount", "pulseGrid", "evergreenGrid", "cultivateGrid", "itemDialog", "itemForm", "dialogEyebrow", "dialogTitle", "dialogFields", "newPromptBtn", "promptText", "resetBtn", "today"];
const elements = Object.fromEntries(ids.map(id => [id, makeElement(id)]));
const document = {
  addEventListener(type, handler) { this[`on${type}`] = handler; },
  querySelector(selector) { return elements[selector.slice(1)]; },
  querySelectorAll() { return []; },
};
const localStorage = { value: null, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
const context = { document, localStorage, confirm: () => true, FormData, Intl, Date, Math, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync("app.js", "utf8"), context);

function click(button) { document.onclick({ target: button }); }
function button(id, classes = []) {
  const element = makeElement(id);
  element.matches = selector => selector === `#${id}` || classes.includes(selector);
  return element;
}

assert.match(elements.pulseGrid.innerHTML, /Leo&#39;s science fair/, "starter pulse cards render");
click(button("addPulseBtn"));
assert.equal(elements.itemDialog.open, true, "add hot-topic button opens its dialog");
assert.match(elements.dialogFields.innerHTML, /name="title" value=""/, "new hot-topic fields safely render blank values");

elements.itemDialog.open = false;
const addNote = button("", [".add-note"]);
addNote.dataset = { person: "p1", type: "evergreen" };
click(addNote);
assert.equal(elements.itemDialog.open, true, "add evergreen-note button opens its dialog");
assert.match(elements.dialogTitle.textContent, /Add a note/, "add-note dialog has the expected title");

elements.itemDialog.open = false;
click(button("editPeopleBtn"));
assert.equal(elements.itemDialog.open, true, "edit-names button opens its dialog");
assert.match(elements.dialogFields.innerHTML, /value="Maya"/, "edit-names dialog includes existing names");

const initialPulse = elements.pulseGrid.innerHTML;
const deletePulse = button("", [".delete-pulse"]);
deletePulse.dataset = { id: "h1" };
click(deletePulse);
assert.notEqual(elements.pulseGrid.innerHTML, initialPulse, "delete pulse button re-renders the card grid");
assert.doesNotMatch(elements.pulseGrid.innerHTML, /Leo&#39;s science fair/, "delete pulse button removes its card");

console.log("Interaction checks passed: render, add hot topic, add evergreen note, edit names, delete pulse");
