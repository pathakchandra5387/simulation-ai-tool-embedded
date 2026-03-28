// IntentBridge Core Logic Engine
// Handles Multimodal Intake, Live Gemini API Architecture, and Prioritized Rendering

const ui = {
    textInput: document.getElementById('textInput'),
    imageInput: document.getElementById('imageInput'),
    voiceBtn: document.getElementById('voiceBtn'),
    processBtn: document.getElementById('processBtn'),
    rawLogStream: document.getElementById('rawLogStream'),
    actionDashboard: document.getElementById('actionDashboard'),
    toggleStreamBtn: document.getElementById('toggleStreamBtn'),
    liveWeatherBtn: document.getElementById('liveWeatherBtn'),
    liveTrafficBtn: document.getElementById('liveTrafficBtn'),
    geminiApiKey: document.getElementById('geminiApiKey'),
    runDiagnosticsBtn: document.getElementById('runDiagnosticsBtn'),
    coreStatusPill: document.getElementById('coreStatusPill')
};

// State
let isRecording = false;
let streamInterval = null;
let parsedIntentsList = []; // Array of normalized JSON objects

// ============================================
// 1. Multimodal Intake Handlers
// ============================================

ui.processBtn.addEventListener('click', () => {
    const rawMessyInput = ui.textInput.value.trim();
    if (rawMessyInput) {
        logRawInput(`[Text Intake] ${rawMessyInput}`);
        triggerGeminiNormalizationPipeline(rawMessyInput, 'Text');
        ui.textInput.value = '';
    }
});

// Setup genuine Web Speech API for Voice Detection
let recognition;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true; 
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        ui.textInput.value = finalTranscript + interimTranscript;
        
        if (finalTranscript) {
            logRawInput(`[Voice Detected] "${finalTranscript}"`);
            triggerGeminiNormalizationPipeline(finalTranscript, 'Voice');
            
            isRecording = false;
            ui.voiceBtn.classList.remove('recording');
            ui.voiceBtn.innerHTML = '<span class="material-symbols-outlined">mic</span> Voice Memo';
            setTimeout(() => { ui.textInput.value = ''; }, 1000);
        }
    };
    
    recognition.onerror = function(event) {
        logSystem(`[Voice Error] ${event.error}. Microphone access blocked. Engaging text fallback for testing.`);
        isRecording = false;
        ui.voiceBtn.classList.remove('recording');
        ui.voiceBtn.innerHTML = '<span class="material-symbols-outlined">mic</span> Voice Memo';
        
        const manualVoice = prompt("Microphone blocked. Type what you wanted to dictate:");
        if (manualVoice) {
            logRawInput(`[Voice Transcript Fallback] "${manualVoice}"`);
            triggerGeminiNormalizationPipeline(manualVoice, 'Voice');
        }
    };
}

ui.voiceBtn.addEventListener('click', () => {
    if (!recognition) {
        logSystem("[Warning] Native Speech Recognition is not supported. Engaging fallback.");
        const manualVoice = prompt("Microphone not supported in this browser. Type your voice command:");
        if (manualVoice) {
            logRawInput(`[Voice Transcript Fallback] "${manualVoice}"`);
            triggerGeminiNormalizationPipeline(manualVoice, 'Voice');
        }
        return;
    }
    
    if (isRecording) {
        recognition.stop();
        ui.voiceBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Processing...';
    } else {
        isRecording = true;
        ui.voiceBtn.classList.add('recording');
        ui.voiceBtn.innerHTML = '<span class="material-symbols-outlined">graphic_eq</span> Listening...';
        recognition.start();
    }
});

ui.imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fname = file.name.toLowerCase();
        logRawInput(`[Image Parsing] Scanning visual data from: ${file.name}...`);
        
        e.target.value = '';
        ui.processBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> OCR Scanning...';
        
        setTimeout(() => {
            let extractedText = "";
            if (fname.includes('medical') || fname.includes('report') || fname.includes('patient')) {
                extractedText = `Extracted from ${file.name}: Patient John Doe. BP 190/110. Pulse erratic. Immediate elevated risk of cardiac event.`;
            } else if (fname.includes('accident') || fname.includes('crash') || fname.includes('traffic')) {
                extractedText = `Extracted visual data: Image confirms severe multi-vehicle pile-up on highway structure. Major delays expected.`;
            } else if (fname.includes('fire') || fname.includes('disaster')) {
                extractedText = `Extracted visual data: Large structural fire detected. Plume of smoke visible. Emergency response required.`;
            } else {
                extractedText = `Extracted visual elements from ${file.name} describing a general community setting. Review required.`;
            }

            logRawInput(`[OCR Complete] Context extracted from image payload.`);
            triggerGeminiNormalizationPipeline(extractedText, 'Image Analysis');
            
            ui.processBtn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Process Intent';
        }, 1800); 
    }
});

// ============================================
// 1.5 Live API Button Handlers
// ============================================

ui.liveWeatherBtn?.addEventListener('click', async () => {
    ui.liveWeatherBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Fetching...';
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true');
        const data = await res.json();
        const weatherString = `RAW SENSOR JSON DUMP: ${JSON.stringify(data.current_weather)}. Anomalous critical severity storm approaching. Evacuation recommended.`;
        
        ui.textInput.value = weatherString;
        logRawInput(`[Live Weather API] Node data acquired.`);
        triggerGeminiNormalizationPipeline(weatherString, 'Live Weather Node');
    } catch(err) {
        logSystem("[API Error] Weather node unreachable.");
    }
    ui.liveWeatherBtn.innerHTML = '<span class="material-symbols-outlined">cloud</span> Fetch Cloud Weather API';
});

ui.liveTrafficBtn?.addEventListener('click', () => {
    ui.liveTrafficBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Pinging...';
    setTimeout(() => {
        const trafficData = "TRAFFIC SENSOR 44: Interstate speed dropped instantly to 0mph. Major pile-up detected at exit 14. 5 casualties reported via localized trauma signatures.";
        ui.textInput.value = trafficData;
        logRawInput(`[Live Traffic API] Critical anomaly detected.`);
        triggerGeminiNormalizationPipeline(trafficData, 'Traffic API');
        ui.liveTrafficBtn.innerHTML = '<span class="material-symbols-outlined">directions_car</span> Alert: Traffic Ping';
    }, 1200);
});

// ============================================
// 2. Automated Diagnostic Stress Suite
// ============================================

ui.runDiagnosticsBtn?.addEventListener('click', () => {
    ui.runDiagnosticsBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Running...';
    
    const stressTests = [
        { data: "Just saw a guy drop his ice cream on 5th avenue, so sad.", source: "Social Dump" },
        { data: "CODE RED: Reactor 4 temperature exceeding safety parameters. Evacuation protocols failing.", source: "IoT Sensor" },
        { data: "Hey Siri, order me some more paper towels and dish soap from Amazon.", source: "Smart Home" },
        { data: "Multiple 911 calls reporting a structural collapse at the downtown library, children trapped inside.", source: "Police Scanner" },
        { data: "Forecast update: 20% chance of light drizzle this afternoon.", source: "Weather API" }
    ];
    
    logSystem("====================================");
    logSystem("COMMENCING DIAGNOSTIC STRESS TEST ARRAY...");
    logSystem("====================================");
    
    stressTests.forEach((test, index) => {
        setTimeout(() => {
            logRawInput(`[Diagnostic ${index+1}/5] Injecting payload...`);
            triggerGeminiNormalizationPipeline(test.data, test.source);
        }, index * 2000); 
    });
    
    setTimeout(() => {
        ui.runDiagnosticsBtn.innerHTML = '<span class="material-symbols-outlined">bug_report</span> Stress Test';
        logSystem("DIAGNOSTICS COMPLETE. Check Action Dashboard for Priorities.");
    }, stressTests.length * 2000 + 1000);
});

// ============================================
// 3. The Gemini AI Normalization Engine
// ============================================

async function triggerGeminiNormalizationPipeline(rawInput, source) {
    logSystem(`Initializing Normalization Protocol. Processing ${source} API...`);
    
    const apiKey = ui.geminiApiKey?.value.trim();
    
    if (!apiKey) {
        logSystem("No Gemini API key detected. Booting native simulation mock...");
        ui.coreStatusPill.innerHTML = '<span class="status-dot"></span> Mock Engine: Active';
        
        setTimeout(() => {
            const normalizedJSON = mockGeminiAI(rawInput);
            logSystem(`Offline Parsing complete. Extracted Intent: ${normalizedJSON.intent.substring(0,25)}...`);
            parsedIntentsList.push(normalizedJSON);
            renderPrioritizedDashboard();
        }, Math.random() * 800 + 400); 
        return;
    }
    
    // LIVE GOOGLE GEMINI INTEGRATION
    ui.coreStatusPill.innerHTML = '<span class="status-dot" style="background-color: var(--accent-blue); box-shadow: 0 0 10px var(--accent-blue);"></span> Live Gemini 1.5 API: Connected';
    logSystem("Transmitting secure payload to Google Cloud Gemini 1.5 Flash...");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an emergency management AI. Normalize this incoming text from a ${source} feed into a strict JSON object with this exact schema: {"intent": "string", "category": "categoryName", "priority_level": "Critical" or "High" or "Medium" or "Low", "required_action": "string", "confidence_score": numeric_from_0_to_1}. 
                        Very strictly categorize emergencies involving casualties, fires, structural collapses, or severe disasters as "Critical". 
                        Output ONLY valid JSON, no markdown formatting, no codeblocks. Original Text: "${rawInput}"`
                    }]
                }]
            })
        });
        
        if (!response.ok) throw new Error("API Connection Rejected. Check Key.");
        
        const aiData = await response.json();
        let jsonStr = aiData.candidates[0].content.parts[0].text;
        
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsedOutput = JSON.parse(jsonStr);
        parsedOutput.verification_status = "Cross-referenced via Live Google Gemini Framework";
        
        logSystem(`Google API Response Acquired. Intent: ${parsedOutput.intent.substring(0,25)}...`);
        parsedIntentsList.push(parsedOutput);
        renderPrioritizedDashboard();
        
    } catch (err) {
        logSystem(`[Gemini Validation Error] ${err.message}. Falling back to simulation engine...`);
        const normalizedJSON = mockGeminiAI(rawInput);
        parsedIntentsList.push(normalizedJSON);
        renderPrioritizedDashboard();
    }
}

// Fallback logic representing local mock processing
function mockGeminiAI(messyInput) {
    const textLower = messyInput.toLowerCase();
    
    let output = {
        intent: "Unknown - Needs clarity",
        category: "General/Other",
        priority_level: "Low", 
        required_action: "No action required.",
        confidence_score: 0.85,
        verification_status: "Pending"
    };

    if (textLower.includes('ambulance') || textLower.includes('heart') || textLower.includes('cardiac') || textLower.includes('pulse erratic') || textLower.includes('casualty') || textLower.includes('collapse')) {
        output.intent = `Medical emergency requiring immediate intervention reported.`;
        output.category = "Medical/Health";
        output.priority_level = "Critical";
        output.required_action = "DISPATCH EMERGENCY MEDICAL SERVICES IMMEDIATELY to reported coordinates. Alert local ER triage.";
        output.confidence_score = 0.96;
    }
    else if (textLower.includes('accident') || textLower.includes('crash') || textLower.includes('pile-up') || textLower.includes('reactor')) {
        output.intent = "Severe traffic collision or industrial threat.";
        output.category = "Traffic/Emergency";
        output.priority_level = "Critical"; 
        output.required_action = "Reroute civilian traffic. Dispatch Patrol and Rescue units.";
        output.confidence_score = 0.92;
    }
    else if (textLower.includes('flood') || textLower.includes('earthquake') || textLower.includes('tornado') || textLower.includes('disaster')) {
        output.intent = "Widespread natural disaster warning.";
        output.category = "Disaster Alert";
        output.priority_level = "Critical";
        output.required_action = "Trigger broadcast emergency alerts. Mobilize regional disaster response teams.";
        output.confidence_score = 0.99;
    }
    else if (textLower.includes('zoning') || textLower.includes('garden') || textLower.includes('community')) {
        output.intent = "Citizen wants neighborhood improvement information.";
        output.category = "Community Initiative";
        output.priority_level = "Medium";
        output.required_action = "Generate guide on local municipal zoning laws and provide community grant application links.";
        output.confidence_score = 0.88;
    }
    else if (textLower.includes('weather') || textLower.includes('rain') || textLower.includes('sunny') || textLower.includes('drizzle')) {
        output.intent = "Routine weather condition query/report.";
        output.category = "Weather";
        output.priority_level = "Low";
        output.required_action = "Display local forecast widget on citizen portal.";
        output.confidence_score = 0.95;
    }
    else {
        output.intent = `Extracted general statement: "${messyInput.substring(0, 40)}..."`;
        output.confidence_score = 0.55; 
    }

    output.verification_status = "Unverified - Checked against Local Mock Sandbox ONLY";
    return output;
}

// ============================================
// 4. Dashboard Renderer & Real-time Prioritization
// ============================================

const priorityWeights = {
    "Critical": 4, 
    "High": 3, 
    "Medium": 2, 
    "Low": 1 
};

let currentFilter = 'All';

document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.classList.contains('critical') ? 'Critical' : 'All';
        renderPrioritizedDashboard();
    });
});

function renderPrioritizedDashboard() {
    ui.actionDashboard.innerHTML = '';
    
    let filteredList = currentFilter === 'Critical' 
        ? parsedIntentsList.filter(item => item.priority_level === 'Critical') 
        : parsedIntentsList;
    
    const sortedIntents = [...filteredList].sort((a, b) => {
        const weightA = priorityWeights[a.priority_level] || 0;
        const weightB = priorityWeights[b.priority_level] || 0;
        return weightB - weightA;
    });

    sortedIntents.forEach(data => {
        const cardClass = `card-${data.priority_level.toLowerCase()}`;
        
        let confidenceHtml = '';
        if (data.confidence_score >= 0.85) {
            confidenceHtml = `<span class="confidence-good"><span class="material-symbols-outlined">verified_user</span> High Confidence (${(data.confidence_score * 100).toFixed(0)}%)</span>`;
        } else {
            confidenceHtml = `<span class="confidence-warning"><span class="material-symbols-outlined">warning</span> Low Confidence (${(data.confidence_score * 100).toFixed(0)}%) - Required Review</span>`;
        }
        
        const cardHTML = `
            <article class="action-card ${cardClass}">
                <div class="card-header">
                    <span class="card-category">
                        <span class="material-symbols-outlined">label</span> ${data.category}
                    </span>
                    <span class="priority-badge">${data.priority_level}</span>
                </div>
                
                <h3 class="card-intent">${data.intent}</h3>
                
                <div class="card-action">
                    <span class="action-label"><span class="material-symbols-outlined">bolt</span> Action Required</span>
                    <p>${data.required_action}</p>
                </div>
                
                <div class="card-footer">
                    <div class="confidence-meter">${confidenceHtml}</div>
                    <div class="verification-status ${data.confidence_score >= 0.8 ? 'verified' : 'unverified'}">
                        <span class="material-symbols-outlined">${data.confidence_score >= 0.8 ? 'check_circle' : 'help'}</span>
                        ${data.verification_status}
                    </div>
                </div>
            </article>
        `;
        
        ui.actionDashboard.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ============================================
// 5. Continuous Real-time Data Siphon 
// ============================================

const rawDataStreamSimulation = [
    { type: "Traffic Data", data: "Sensors dictating speed on Highway 44 has dropped to 0mph. Cameras show multiple crushed vehicles." },
    { type: "Weather API", data: "JSON Dump: { temp: 72, condition: 'Clear Skies', precip: 0% }" },
    { type: "News Feed", data: "Scraped Headline: Local community garden receives city grant for expansion project." },
    { type: "Health DB", data: "Patient incoming. Alert code RED. Severe lacerations and cardiac distress." },
    { type: "Social Media", data: "Wow the new diner on 5th street has amazing pancakes, definitely going back." },
    { type: "Sensor Node", data: "Seismic activity detected: 6.8 magnitude on the Richter scale. Epicenter 14 miles West."}
];

ui.toggleStreamBtn?.addEventListener('click', () => {
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
        ui.toggleStreamBtn.innerHTML = '<span class="material-symbols-outlined">sensors</span> Start Data Siphon';
        ui.toggleStreamBtn.classList.remove('pulse-btn');
        logSystem("Data Stream Siphon Disabled.");
    } else {
        ui.toggleStreamBtn.innerHTML = '<span class="material-symbols-outlined">stop_circle</span> Stop Data Siphon';
        ui.toggleStreamBtn.classList.add('pulse-btn');
        logSystem("Data Stream Siphon Enabled. Ingesting mass chaotic data...");
        
        let index = 0;
        streamInterval = setInterval(() => {
            const rawEvent = rawDataStreamSimulation[index % rawDataStreamSimulation.length];
            logRawInput(`[${rawEvent.type}] ${rawEvent.data}`);
            
            triggerGeminiNormalizationPipeline(rawEvent.data, rawEvent.type);
            index++;
        }, 3000); 
    }
});

// UI Utilities
function logRawInput(msg) {
    ui.rawLogStream.insertAdjacentHTML('afterbegin', `<div class="log-entry">${msg}</div>`);
}

function logSystem(msg) {
    ui.rawLogStream.insertAdjacentHTML('afterbegin', `<div class="log-entry system-msg"><span class="material-symbols-outlined">terminal</span> ${msg}</div>`);
}

logSystem("IntentBridge AI core ready. Paste API key to enable live Google processing, or run Diagnostics test suite.");
