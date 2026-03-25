const badge = document.getElementById("statusBadge");
const chatLog = document.getElementById("chatLog");
const messageInput = document.getElementById("messageInput");
const systemPromptInput = document.getElementById("systemPrompt");
const tempInput = document.getElementById("tempInput");
const topKInput = document.getElementById("topKInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

let chatApi = null;
let session = null;
let isBusy = false;

function setStatus(text, level) {
  badge.textContent = text;
  badge.className = "badge" + (level ? " " + level : "");
}

function appendMessage(role, text) {
  const node = document.createElement("div");
  node.className = `message ${role}`;
  node.textContent = text;
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function clearMessages() {
  chatLog.innerHTML = "";
}

function setControlsEnabled(enabled) {
  sendBtn.disabled = !enabled || isBusy;
  newChatBtn.disabled = !enabled || isBusy;
}

function getChatAPI() {
  if (typeof LanguageModel !== "undefined") return LanguageModel;
  if (typeof self !== "undefined" && self.ai?.languageModel) return self.ai.languageModel;
  if (typeof window !== "undefined" && window.ai?.languageModel) return window.ai.languageModel;
  return null;
}

async function resolveAvailability(api) {
  if (typeof api.availability === "function") {
    return api.availability();
  }
  if (typeof api.capabilities === "function") {
    const caps = await api.capabilities();
    return caps.available;
  }
  return "available";
}

function getSessionOptions() {
  const temp = Number(tempInput.value);
  const topK = Number(topKInput.value);

  const options = {
    systemPrompt: systemPromptInput.value.trim() || undefined,
  };

  if (Number.isFinite(temp)) options.temperature = temp;
  if (Number.isFinite(topK)) options.topK = topK;

  return options;
}

async function destroySessionIfNeeded() {
  if (!session) return;

  try {
    if (typeof session.destroy === "function") {
      session.destroy();
    }
  } catch (err) {
    console.warn("Session destroy failed:", err);
  } finally {
    session = null;
  }
}

async function createSessionIfNeeded(forceNew = false) {
  if (!chatApi) {
    throw new Error("Nano chat API is not available in this browser instance.");
  }

  if (session && !forceNew) return session;
  await destroySessionIfNeeded();
  session = await chatApi.create(getSessionOptions());
  return session;
}

async function checkAvailability() {
  console.log("typeof LanguageModel:", typeof LanguageModel);
  console.log("self.ai:", typeof self !== "undefined" ? self.ai : "N/A");
  console.log("window.ai:", typeof window !== "undefined" ? window.ai : "N/A");

  chatApi = getChatAPI();
  if (!chatApi) {
    setStatus("Nano Chat API not found", "err");
    appendMessage(
      "assistant",
      "No LanguageModel API was detected.\n\n" +
        "Try Chrome Dev/Canary with AI flags enabled, then restart the browser."
    );
    setControlsEnabled(false);
    return;
  }

  const status = await resolveAvailability(chatApi);
  const unavailable = ["no", "unavailable"];
  const downloading = ["after-download", "downloadable", "downloading"];

  if (unavailable.includes(status)) {
    setStatus("Model unavailable", "warn");
    appendMessage(
      "assistant",
      "The API exists but the on-device model is unavailable.\n" +
        "Open chrome://components and update 'Optimization Guide On Device Model', then restart Chrome."
    );
    setControlsEnabled(false);
    return;
  }

  if (downloading.includes(status)) {
    setStatus("Model downloading…", "warn");
    appendMessage("assistant", "The model is still downloading. You can try again in a few minutes.");
    setControlsEnabled(true);
    return;
  }

  setStatus("Ready for chat", "");
  setControlsEnabled(true);
  appendMessage("assistant", "Chat session is ready. Send your first message.");
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isBusy) return;

  isBusy = true;
  setControlsEnabled(true);
  appendMessage("user", text);
  messageInput.value = "";

  try {
    const activeSession = await createSessionIfNeeded(false);
    const response = await activeSession.prompt(text);
    appendMessage("assistant", response);
  } catch (err) {
    console.error("Chat error:", err);
    appendMessage("assistant", "Error: " + (err?.message || String(err)));
  } finally {
    isBusy = false;
    setControlsEnabled(true);
    messageInput.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

clearBtn.addEventListener("click", () => {
  clearMessages();
  appendMessage("assistant", "Messages cleared. Your current chat session context is still active.");
});

newChatBtn.addEventListener("click", async () => {
  if (isBusy) return;

  isBusy = true;
  setControlsEnabled(true);
  try {
    await createSessionIfNeeded(true);
    clearMessages();
    appendMessage("assistant", "Started a fresh chat session with your current settings.");
  } catch (err) {
    console.error("New session error:", err);
    appendMessage("assistant", "Could not start a new session: " + (err?.message || String(err)));
  } finally {
    isBusy = false;
    setControlsEnabled(true);
  }
});

checkAvailability();
