console.log("Meet AI Assistant Loaded");

const BACKEND_URL = "http://127.0.0.1:8000/api/transcript/";

let transcriptBuffer = new Set();

// ========================
// HELPER FUNCTION - Encode for selector (not needed anymore but kept for compatibility)
// ========================
function encodeForSelector(text) {
    return 'mom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

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
// GENERATE MINUTES OF MEETING WITH PROGRESS BAR
// ========================
async function generateMoM() {
    const output = document.getElementById("output");

    // Check if there are any captions
    if (transcriptBuffer.size === 0) {
        output.innerHTML += `
            <div style="padding: 10px; margin: 10px 0; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                <strong>⚠️ No Captures Yet</strong><br>
                <small>Please enable captions in Google Meet and wait for some text to appear.</small>
            </div>
        `;
        output.scrollTop = output.scrollHeight;
        return;
    }

    // Create progress container
    const progressContainer = document.createElement("div");
    progressContainer.id = "mom-progress";
    progressContainer.style.cssText = `
        padding: 15px;
        margin: 10px 0;
        background: white;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    progressContainer.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong style="color: #1a73e8;">📋 Generating Minutes of Meeting</strong>
        </div>
        <div style="margin-bottom: 8px;">
            <div style="background: #e0e0e0; border-radius: 10px; overflow: hidden; height: 8px;">
                <div id="progress-bar-fill" style="width: 0%; background: linear-gradient(90deg, #28a745, #1a73e8); height: 100%; transition: width 0.3s ease;"></div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666;">
            <span id="progress-status">🔄 Connecting to AI...</span>
            <span id="progress-percent">0%</span>
        </div>
        <div id="progress-detail" style="font-size: 10px; color: #999; margin-top: 8px;">
            Step 1 of 4: Preparing transcript...
        </div>
    `;

    output.appendChild(progressContainer);
    output.scrollTop = output.scrollHeight;

    // Function to update progress
    const updateProgress = (percent, status, detail) => {
        const fill = document.getElementById("progress-bar-fill");
        const percentSpan = document.getElementById("progress-percent");
        const statusSpan = document.getElementById("progress-status");
        const detailSpan = document.getElementById("progress-detail");

        if (fill) fill.style.width = `${percent}%`;
        if (percentSpan) percentSpan.innerHTML = `${percent}%`;
        if (statusSpan) statusSpan.innerHTML = status;
        if (detailSpan) detailSpan.innerHTML = detail;
    };

    // Simulate progress steps
    updateProgress(10, "📝 Preparing transcript...", "Step 1 of 4: Reading captured captions");
    await new Promise(r => setTimeout(r, 500));

    updateProgress(25, "📤 Sending to AI...", "Step 2 of 4: Sending transcript to Ollama AI");
    await new Promise(r => setTimeout(r, 500));

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

        updateProgress(40, "🤖 AI is analyzing...", "Step 3 of 4: Llama 3.2 is processing your meeting");

        // Simulate progress while waiting for response
        let progressInterval = setInterval(() => {
            const currentFill = document.getElementById("progress-bar-fill");
            if (currentFill) {
                const currentWidth = parseInt(currentFill.style.width) || 40;
                if (currentWidth < 85) {
                    const newWidth = currentWidth + 2;
                    currentFill.style.width = `${newWidth}%`;
                    const percentSpan = document.getElementById("progress-percent");
                    if (percentSpan) percentSpan.innerHTML = `${newWidth}%`;

                    // Update status messages based on progress
                    if (newWidth < 60) {
                        document.getElementById("progress-status").innerHTML = "🧠 AI is reading transcript...";
                    } else if (newWidth < 75) {
                        document.getElementById("progress-status").innerHTML = "📊 Analyzing key points...";
                    } else {
                        document.getElementById("progress-status").innerHTML = "✍️ Generating minutes...";
                    }
                }
            }
        }, 2000);

        const response = await fetch("http://127.0.0.1:8000/api/transcript/summary/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearInterval(progressInterval);

        updateProgress(90, "✅ Processing complete!", "Step 4 of 4: Formatting your meeting minutes");
        await new Promise(r => setTimeout(r, 300));

        const data = await response.json();

        // Remove progress container
        document.getElementById("mom-progress")?.remove();

        if (data.summary) {
            // Format the summary with markdown-like styling
            const formattedSummary = data.summary
                .replace(/#/g, '📌')
                .replace(/\*\*/g, '')
                .replace(/\n/g, '<br>');

            // Create unique IDs for this MoM
            const momId = 'mom-' + Date.now();
            const copyBtnId = 'copy-btn-' + Date.now();
            const saveBtnId = 'save-btn-' + Date.now();

            // Store the summary text for this mom
            window.momSummaries = window.momSummaries || new Map();
            window.momSummaries.set(momId, data.summary);

            // Add the MoM to the output
            output.innerHTML += `
                <div id="${momId}" style="padding: 15px; margin: 10px 0; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745; animation: slideIn 0.5s ease-out;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <strong style="font-size: 14px;">📋 MINUTES OF MEETING</strong>
                        <div style="display: flex; gap: 5px;">
                            <button id="${saveBtnId}" class="save-mom-btn" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">💾 Save as File</button>
                            <button id="${copyBtnId}" class="copy-mom-btn" style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;">📋 Copy</button>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; line-height: 1.6;">
                        ${formattedSummary}
                    </div>
                    <hr style="margin: 10px 0;">
                    <small style="color: #666;">✅ Generated using AI (llama3.2:1b) at ${new Date().toLocaleString()}</small>
                </div>
            `;

            // Add slide-in animation if not exists
            if (!document.querySelector('#mom-animation-style')) {
                const style = document.createElement('style');
                style.id = 'mom-animation-style';
                style.textContent = `
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }

            output.scrollTop = output.scrollHeight;

            // Add save functionality to the button
            const saveBtn = document.getElementById(saveBtnId);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const summary = window.momSummaries.get(momId);
                    if (summary) {
                        saveMomToFile(summary);
                    }
                });
            }

            // Add copy functionality - using ID instead of data attribute
            const copyBtn = document.getElementById(copyBtnId);
            if (copyBtn) {
                copyBtn.addEventListener('click', async () => {
                    try {
                        const summary = window.momSummaries.get(momId);
                        if (summary) {
                            await navigator.clipboard.writeText(summary);
                            const originalText = copyBtn.innerHTML;
                            copyBtn.innerHTML = '✅ Copied!';
                            copyBtn.style.background = '#28a745';
                            setTimeout(() => {
                                copyBtn.innerHTML = originalText;
                                copyBtn.style.background = '#6c757d';
                            }, 2000);
                        }
                    } catch (err) {
                        console.error('Failed to copy:', err);
                    }
                });
            }

            console.log("✅ MoM generated successfully");
        } else {
            throw new Error("No summary in response");
        }
    } catch (err) {
        document.getElementById("mom-progress")?.remove();
        console.error("Error generating MoM:", err);

        let errorMessage = err.message;
        let errorSuggestion = "Make sure you have captured some captions first!";

        if (err.name === 'AbortError') {
            errorMessage = "Request timed out";
            errorSuggestion = "The transcript might be too long. Try clearing old captions and keeping the meeting shorter.";
        } else if (err.message.includes("Failed to fetch")) {
            errorMessage = "Cannot connect to backend";
            errorSuggestion = "Make sure the backend server is running (docker-compose up -d)";
        }

        output.innerHTML += `
            <div style="padding: 10px; margin: 10px 0; background: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
                <strong>❌ Error generating Minutes of Meeting</strong><br>
                ${errorMessage}<br>
                <small>${errorSuggestion}</small>
            </div>
        `;
        output.scrollTop = output.scrollHeight;
    }
}

// ========================
// SAVE MOM TO FILE
// ========================
function saveMomToFile(momText) {
    // Create a formatted filename with date and time
    const now = new Date();
    const filename = `Meeting_Minutes_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.txt`;

    // Create a blob with the content
    const blob = new Blob([momText], { type: 'text/plain;charset=utf-8' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ MoM saved to file: ${filename}`);

    // Show confirmation message
    const output = document.getElementById("output");
    const confirmationDiv = document.createElement("div");
    confirmationDiv.style.cssText = `
        padding: 5px;
        margin: 5px 0;
        background: #d4edda;
        border-radius: 5px;
        text-align: center;
        font-size: 11px;
        animation: fadeOut 2s ease-out;
    `;
    confirmationDiv.innerHTML = `💾 File saved: ${filename}`;
    output.appendChild(confirmationDiv);

    // Add fade out animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; display: none; }
        }
    `;
    document.head.appendChild(style);

    // Remove confirmation after 2 seconds
    setTimeout(() => {
        confirmationDiv.remove();
    }, 2000);

    output.scrollTop = output.scrollHeight;
}

// ========================
// UI CREATION
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
        width: "400px",
        height: "550px",
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 5px;">
            <h3 style="margin: 0;">🤖 Amir AI Meeting</h3>
            <div style="display: flex; gap: 5px;">
                <button id="generate-mom" style="background: #28a745; color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">📋 Generate MoM</button>
                <button id="clear-captions" style="background: #dc3545; color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold;">🗑️ Clear</button>
            </div>
        </div>
        <div id="output" style="max-height: 470px; overflow-y: auto;"></div>
        <div style="margin-top: 8px; padding: 5px; background: #f8f9fa; border-radius: 5px; font-size: 10px; color: #666; text-align: center;">
            💡 Enable CC in Google Meet to capture captions
        </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.onclick = () => {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    };

    // Add generate MoM button functionality
    document.getElementById("generate-mom").onclick = generateMoM;

    // Add clear button functionality
    document.getElementById("clear-captions").onclick = () => {
        const output = document.getElementById("output");
        output.innerHTML = `
            <div style="text-align: center; color: #999; padding: 20px;">
                🎤 Ready to capture meeting captions
            </div>
        `;
        transcriptBuffer.clear();
        console.log("Captions cleared from UI");

        // Also clear on backend
        fetch("http://127.0.0.1:8000/api/transcript/summary/", {
            method: "DELETE"
        }).catch(err => console.error("Error clearing backend:", err));
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

    foundElements.forEach(el => {
        const text = el.innerText?.trim();

        const isValid =
            text &&
            text.length > 2 &&
            text.length < 200 &&
            !transcriptBuffer.has(text) &&
            !/join|rejoin|leave|copy link|add others|meeting|microphone|camera|press|button|cast|expand_less|expand_more|mic_none|videocam|mood|back_hand|arrow_drop_down|keyboard_arrow_up|computer_arrow_up|exclamation|default|companion/i.test(text);

        if (isValid) {
            transcriptBuffer.add(text);

            // Detect Persian text
            const isPersian = /[\u0600-\u06FF]/.test(text);
            const langIcon = isPersian ? "🇮🇷" : "🇬🇧";

            console.log(`✅ CAPTION CAPTURED ${langIcon}:`, text);

            if (output) {
                const timestamp = new Date().toLocaleTimeString();
                // Remove welcome message if present
                if (output.children.length === 1 && output.children[0].innerText.includes("Ready to capture")) {
                    output.innerHTML = "";
                }
                output.innerHTML += `<div style="padding: 6px; margin: 5px 0; background: ${isPersian ? '#e8f5e9' : '#f0f0f0'}; border-radius: 5px; border-left: 3px solid ${isPersian ? '#4caf50' : '#1a73e8'};">🕒 ${timestamp} ${langIcon}<br>🗣 ${text}</div>`;
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
                console.log("📝 Captions are enabled");
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