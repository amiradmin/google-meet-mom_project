console.log("Meet AI Assistant Loaded");

const BACKEND_URL = "http://127.0.0.1:8000/api/transcript/";

let transcriptBuffer = new Set();

// ========================
// SEND TO BACKEND
// ========================
async function sendTranscript(text) {
    try {
        console.log("Sending to backend:", text);
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            console.error("Backend responded with status:", response.status);
        } else {
            const data = await response.json();
            console.log("Backend response:", data);
        }
    } catch (err) {
        console.error("Backend error:", err);
    }
}

// ========================
// UI
// ========================
function createUI() {
    if (document.getElementById("meet-ai-button")) return;

    const btn = document.createElement("div");
    btn.id = "meet-ai-button";
    btn.innerHTML = "🤖 Amir AI Meeting";

    Object.assign(btn.style, {
        position: "fixed",
        bottom: "80px",
        right: "20px",
        zIndex: "999999",
        background: "#1a73e8",
        color: "white",
        padding: "12px 16px",
        borderRadius: "50px",
        cursor: "pointer",
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
    });

    const panel = document.createElement("div");
    panel.id = "meet-ai-panel";

    Object.assign(panel.style, {
        position: "fixed",
        top: "80px",
        right: "20px",
        width: "320px",
        height: "400px",
        background: "white",
        zIndex: "999999",
        borderRadius: "12px",
        padding: "10px",
        display: "none",
        overflowY: "auto",
        fontSize: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        color: "black",
        fontFamily: "Arial, sans-serif"
    });

    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0;">🤖 Meet AI</h3>
            <button id="clear-captions" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Clear</button>
        </div>
        <div id="output" style="max-height: 340px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    // Add clear button functionality
    document.getElementById("clear-captions").onclick = () => {
        const output = document.getElementById("output");
        output.innerHTML = "";
        transcriptBuffer.clear();
        console.log("Captions cleared");
    };
}

createUI();

// ========================
// CAPTION EXTRACTION (IMPROVED)
// ========================
function extractCaptions() {
    const output = document.getElementById("output");

    // Try multiple selectors for Google Meet captions
    const selectors = [
        "[aria-live='polite'] span",
        ".a4cQT",
        ".VYBDae",
        ".Zs6jO",
        ".l1gMBe span",
        "[jsname='bN97Pc'] span"
    ];

    let foundElements = [];
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            foundElements = [...foundElements, ...elements];
        }
    }

    // Also check for caption container
    const captionContainer = document.querySelector('[aria-label*="caption" i], [aria-label*="transcript" i]');
    if (captionContainer) {
        const spans = captionContainer.querySelectorAll('span');
        foundElements = [...foundElements, ...spans];
    }

    console.log(`Found ${foundElements.length} potential caption elements`);

    foundElements.forEach(el => {
        const text = el.innerText?.trim();

        const isValid =
            text &&
            text.length > 2 &&
            text.length < 200 &&
            !transcriptBuffer.has(text) &&
            !/join|rejoin|leave|copy link|add others|meeting|microphone|camera|press|button/i.test(text);

        if (isValid) {
            transcriptBuffer.add(text);

            console.log("✅ CAPTION CAPTURED:", text);

            if (output) {
                const timestamp = new Date().toLocaleTimeString();
                output.innerHTML += `<div style="padding: 5px; margin: 5px 0; background: #f0f0f0; border-radius: 5px;">🕒 ${timestamp}<br>🗣 ${text}</div>`;
                output.scrollTop = output.scrollHeight;
            }

            sendTranscript(text);
        }
    });
}

// ========================
// DEBUG - Check if on Google Meet
// ========================
if (window.location.hostname === "meet.google.com") {
    console.log("✅ Running on Google Meet");

    // Check if captions are enabled
    setInterval(() => {
        const ccButton = document.querySelector('[aria-label*="Captions" i], [aria-label*="Subtitles" i]');
        if (ccButton) {
            const isActive = ccButton.getAttribute("aria-pressed") === "true" ||
                           ccButton.classList.contains("VfPpkd-Bz112c-LgbsSe--pressed");
            if (isActive) {
                console.log("📝 Captions appear to be enabled");
            }
        }
    }, 5000);
} else {
    console.log("Not on Google Meet, extension inactive");
}

// ========================
// OBSERVER
// ========================
const observer = new MutationObserver(() => {
    extractCaptions();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

// fallback
setInterval(extractCaptions, 3000);

// Initial extraction
setTimeout(extractCaptions, 3000);
console.log("Meet AI Assistant initialized and waiting for captions...");