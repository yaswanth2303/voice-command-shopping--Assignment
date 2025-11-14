const startBtn = document.getElementById("start-btn");
const transcriptEl = document.getElementById("transcript");
const shoppingListEl = document.getElementById("shopping-list");
const suggestionsEl = document.getElementById("suggestions");

let items = JSON.parse(localStorage.getItem("shoppingList")) || [];
renderList();
renderSuggestions();

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

function renderList() {
  shoppingListEl.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.qty > 1 ? item.qty + " × " : ""}${item.name}</span>
      <button onclick="removeItem(${index})">Remove</button>
    `;
    shoppingListEl.appendChild(li);
  });
  localStorage.setItem("shoppingList", JSON.stringify(items));
}

function removeItem(index) {
  speak(`Removed ${items[index].name}`);
  items.splice(index, 1);
  renderList();
}

function handleCommand(text) {
  const lower = text.toLowerCase();
  const addMatch = lower.match(/add (\d+)?\s*(.*)/);
  const removeMatch = lower.match(/remove (.*)/);
  const findMatch = lower.match(/find (.*)/);

  if (addMatch) {
    const qty = parseInt(addMatch[1]) || 1;
    const item = addMatch[2].trim();
    if (!item) return speak("Please say what to add");
    items.push({ name: item, qty });
    transcriptEl.textContent = `✅ Added ${qty} ${item}`;
    speak(`Added ${qty} ${item}`);
    renderList();
  } else if (removeMatch) {
    const item = removeMatch[1].trim();
    const idx = items.findIndex((i) => i.name.includes(item));
    if (idx !== -1) {
      speak(`Removed ${items[idx].name}`);
      items.splice(idx, 1);
      renderList();
      transcriptEl.textContent = `🗑️ Removed ${item}`;
    } else {
      speak(`Couldn't find ${item}`);
      transcriptEl.textContent = `⚠️ Item not found: ${item}`;
    }
  } else if (findMatch) {
    const item = findMatch[1].trim();
    transcriptEl.textContent = `🔍 Searching for ${item}...`;
    speak(`I can’t search online yet, but you can check suggestions below.`);
  } else {
    speak("Please say add milk or remove bread");
    transcriptEl.textContent = "❓ Say 'add milk' or 'remove bread'";
  }
  renderSuggestions();
}

function getSeasonalSuggestions() {
  const month = new Date().getMonth() + 1;
  if ([11, 12].includes(month)) return ["pumpkin", "cranberries", "cake"];
  if ([6, 7, 8].includes(month)) return ["ice cream", "lemons", "watermelon"];
  return ["milk", "bread", "eggs"];
}

function getHistorySuggestions() {
  const history = {};
  items.forEach((it) => (history[it.name] = (history[it.name] || 0) + 1));
  return Object.keys(history).slice(0, 5);
}

function renderSuggestions() {
  const sugg = [
    ...new Set([...getSeasonalSuggestions(), ...getHistorySuggestions()]),
  ];
  suggestionsEl.innerHTML = "";
  sugg.forEach((s) => {
    const btn = document.createElement("button");
    btn.textContent = s;
    btn.onclick = () => {
      items.push({ name: s, qty: 1 });
      speak(`Added ${s}`);
      renderList();
    };
    suggestionsEl.appendChild(btn);
  });
}

startBtn.addEventListener("click", () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  transcriptEl.textContent = "🎙️ Listening...";

  recognition.onresult = (event) => {
    const speech = event.results[0][0].transcript;
    transcriptEl.textContent = `🗣️ You said: "${speech}"`;
    handleCommand(speech);
  };

  recognition.onerror = (event) => {
    transcriptEl.textContent = "❌ Error: " + event.error;
  };
});
