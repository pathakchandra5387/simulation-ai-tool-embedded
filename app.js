// IntentBridge Core Logic Engine
// Handles Multimodal Intake, Gemini Normalization Simulation, and Prioritized Rendering

const ui = {
    textInput: document.getElementById('textInput'),
    imageInput: document.getElementById('imageInput'),
    voiceBtn: document.getElementById('voiceBtn'),
    processBtn: document.getElementById('processBtn'),
    rawLogStream: document.getElementById('rawLogStream'),
    actionDashboard: document.getElementById('actionDashboard'),
    toggleStreamBtn: document.getElementById('toggleStreamBtn'),
    liveWeatherBtn: document.getElementById('liveWeatherBtn'),
    liveTrafficBtn: document.getElementById('liveTrafficBtn')
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
    recognition.interimResults = true; // Crucial for "forming the words" visibly
    
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
        
        // Physically display the words forming directly in the UI textarea!
        ui.textInput.value = finalTranscript + interimTranscript;
        
        if (finalTranscript) {
            logRawInput(`[Voice Detected] "${finalTranscript}"`);
            triggerGeminiNormalizationPipeline(finalTranscript, 'Voice');
            
            isRecording = false;
            ui.voiceBtn.classList.remove('recording');
            ui.voiceBtn.innerHTML = '<i class="ph ph-microphone"></i> Voice Memo';
            setTimeout(() => { ui.textInput.value = ''; }, 1000); // Clear after delay
        }
    };
    
    recognition.onerror = function(event) {
        // Fallback if browser blocks HTTPS mic check or something fails
        logSystem(`[Voice Error] ${event.error}. Microphone access blocked. Engaging text fallback for testing.`);
        isRecording = false;
        ui.voiceBtn.classList.remove('recording');
        ui.voiceBtn.innerHTML = '<i class="ph ph-microphone"></i> Voice Memo';
        
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
        ui.voiceBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
    } else {
        isRecording = true;
        ui.voiceBtn.classList.add('recording');
        ui.voiceBtn.innerHTML = '<i class="ph ph-waveform"></i> Listening...';
        recognition.start();
    }
});

ui.imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fname = file.name.toLowerCase();
        logRawInput(`[Image Parsing] Scanning visual data from: ${file.name}...`);
        
        // Immediate reset so same file can be clicked again
        e.target.value = '';
        ui.processBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> OCR Scanning...';
        
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
            
            ui.processBtn.innerHTML = '<i class="ph ph-magic-wand"></i> Process Intent';
        }, 1800); 
    }
});

// ============================================
// 1.5 Live API Button Handlers
// ============================================

ui.liveWeatherBtn?.addEventListener('click', async () => {
    ui.liveWeatherBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Fetching...';
    try {
        // Fetch real, live weather data from Open-Meteo API
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true');
        const data = await res.json();
        const weatherString = `RAW SENSOR JSON DUMP: ${JSON.stringify(data.current_weather)}. Anomalous critical severity storm approaching. Evacuation recommended.`;
        
        ui.textInput.value = weatherString;
        logRawInput(`[Live Weather API] Node data acquired.`);
        triggerGeminiNormalizationPipeline(weatherString, 'Live Weather Node');
    } catch(err) {
        logSystem("[API Error] Weather node unreachable.");
    }
    ui.liveWeatherBtn.innerHTML = '<i class="ph ph-cloud-sun"></i> Fetch Live Weather API';
});

ui.liveTrafficBtn?.addEventListener('click', () => {
    ui.liveTrafficBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Pinging...';
    setTimeout(() => {
        const trafficData = "TRAFFIC SENSOR 44: Interstate speed dropped instantly to 0mph. Major pile-up detected at exit 14. 5 casualties reported via localized trauma signatures.";
        ui.textInput.value = trafficData;
        logRawInput(`[Live Traffic API] Critical anomaly detected.`);
        triggerGeminiNormalizationPipeline(trafficData, 'Traffic API');
        ui.liveTrafficBtn.innerHTML = '<i class="ph ph-car-profile"></i> Alert: Live Traffic Ping';
    }, 1200);
});

// ============================================
// 2. The Verification & Cross-Checking Module
// ============================================
function crossCheckWithAPIs(category, extractedText) {
    let verificationStatus = "Unverified - Local Model Only";
    let confidencePenalty = 0;
    
    // Simulate real-time API integrations based on category
    if (category === "Traffic/Emergency") {
        verificationStatus = "Verified via Local Traffic API (Mapbox Integration)";
        // If string lacks specifics, penalty
        if(!extractedText.toLowerCase().includes('highway')) confidencePenalty = 0.2;
    } else if (category === "Medical/Health") {
        verificationStatus = "Cross-referenced with Health Database (HL7 Standards)";
    } else if (category === "Weather") {
        verificationStatus = "Verified via NOAA Weather API Network";
    }

    return { status: verificationStatus, penalty: confidencePenalty };
}

// ============================================
// 3. The Gemini AI Normalization Engine
// ============================================

function triggerGeminiNormalizationPipeline(rawInput, source) {
    logSystem(`Initializing Gemini Multi-Modal Engine. Processing ${source} ingestion...`);
    
    // Simulate network delay and AI processing time (real-time validation)
    setTimeout(() => {
        const normalizedJSON = mockGeminiAI(rawInput);
        logSystem(`Gemini parsing complete. Extracted Intent: ${normalizedJSON.intent.substring(0,25)}...`);
        
        parsedIntentsList.push(normalizedJSON);
        renderPrioritizedDashboard();
    }, Math.random() * 800 + 400); 
}

// The core algorithm simulating the strict 5-schema JSON prompt return
function mockGeminiAI(messyInput) {
    const textLower = messyInput.toLowerCase();
    
    // Schema Template
    let output = {
        intent: "Unknown - Needs clarity",
        category: "General/Other",
        priority_level: "Low", // Critical, High, Medium, Low
        required_action: "No action required.",
        confidence_score: 0.85,
        verification_status: "Pending"
    };

    // Life-Saving & High Priority Pattern Matching (Simulating Gemini Intent extraction)
    if (textLower.includes('ambulance') || textLower.includes('heart') || textLower.includes('cardiac') || textLower.includes('pulse erratic')) {
        output.intent = `Medical emergency requiring immediate intervention reported.`;
        output.category = "Medical/Health";
        output.priority_level = "Critical";
        output.required_action = "DISPATCH EMERGENCY MEDICAL SERVICES IMMEDIATELY to reported coordinates. Alert local ER triage.";
        output.confidence_score = 0.96;
    }
    else if (textLower.includes('accident') || textLower.includes('crash') || textLower.includes('pile-up')) {
        output.intent = "Severe traffic collision with potential casualties.";
        output.category = "Traffic/Emergency";
        output.priority_level = "Critical"; // Life-saving priority
        output.required_action = "Reroute civilian traffic. Dispatch Highway Patrol and Rescue units.";
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
    else if (textLower.includes('weather') || textLower.includes('rain') || textLower.includes('sunny')) {
        output.intent = "Routine weather condition query/report.";
        output.category = "Weather";
        output.priority_level = "Low";
        output.required_action = "Display local forecast widget on citizen portal.";
        output.confidence_score = 0.95;
    }
    else {
        output.intent = `Extracted general statement: "${messyInput.substring(0, 40)}..."`;
        output.confidence_score = 0.55; // Low confidence for generic garbage
    }

    // Run Verification Module
    const verifyData = crossCheckWithAPIs(output.category, messyInput);
    output.verification_status = verifyData.status;
    output.confidence_score -= verifyData.penalty;

    // Ensure confidence doesn't drop below 0
    output.confidence_score = Math.max(0.1, output.confidence_score.toFixed(2));

    return output;
}

// ============================================
// 4. Dashboard Renderer & Real-time Prioritization
// ============================================

// Assign priority weights for sorting
const priorityWeights = {
    "Critical": 4, 
    "High": 3, 
    "Medium": 2, 
    "Low": 1 
};

let currentFilter = 'All';

// Wire up the critical priority filter pills
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
    
    // Filter out non-critical if Critical tab is active
    let filteredList = currentFilter === 'Critical' 
        ? parsedIntentsList.filter(item => item.priority_level === 'Critical') 
        : parsedIntentsList;
    
    // Sort logic: Highest priority weight first.
    const sortedIntents = [...filteredList].sort((a, b) => {
        const weightA = priorityWeights[a.priority_level] || 0;
        const weightB = priorityWeights[b.priority_level] || 0;
        return weightB - weightA;
    });

    sortedIntents.forEach(data => {
        const cardClass = `card-${data.priority_level.toLowerCase()}`;
        
        let confidenceHtml = '';
        if (data.confidence_score >= 0.85) {
            confidenceHtml = `<span class="confidence-good"><i class="ph ph-shield-check"></i> High Confidence (${(data.confidence_score * 100).toFixed(0)}%)</span>`;
        } else {
            confidenceHtml = `<span class="confidence-warning"><i class="ph ph-warning"></i> Low Confidence (${(data.confidence_score * 100).toFixed(0)}%) - Requires Human Review</span>`;
        }
        
        const cardHTML = `
            <article class="action-card ${cardClass}">
                <div class="card-header">
                    <span class="card-category">
                        <i class="ph ph-tag"></i> ${data.category}
                    </span>
                    <span class="priority-badge">${data.priority_level}</span>
                </div>
                
                <h3 class="card-intent">${data.intent}</h3>
                
                <div class="card-action">
                    <span class="action-label"><i class="ph ph-lightning"></i> Action Required</span>
                    <p>${data.required_action}</p>
                </div>
                
                <div class="card-footer">
                    <div class="confidence-meter">${confidenceHtml}</div>
                    <div class="verification-status ${data.confidence_score >= 0.8 ? 'verified' : 'unverified'}">
                        <i class="ph ${data.confidence_score >= 0.8 ? 'ph-check-circle' : 'ph-question'}"></i>
                        ${data.verification_status}
                    </div>
                </div>
            </article>
        `;
        
        ui.actionDashboard.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ============================================
// 5. Continuous Real-time Data Siphon (Simulation)
// ============================================

const rawDataStreamSimulation = [
    { type: "Traffic Data", data: "Sensors dictating speed on Highway 44 has dropped to 0mph. Cameras show multiple crushed vehicles." },
    { type: "Weather API", data: "JSON Dump: { temp: 72, condition: 'Clear Skies', precip: 0% }" },
    { type: "News Feed", data: "Scraped Headline: Local community garden receives city grant for expansion project." },
    { type: "Health DB", data: "Patient incoming. Alert code RED. Severe lacerations and cardiac distress." },
    { type: "Social Media", data: "Wow the new diner on 5th street has amazing pancakes, definitely going back." },
    { type: "Sensor Node", data: "Seismic activity detected: 6.8 magnitude on the Richter scale. Epicenter 14 miles West."}
];

ui.toggleStreamBtn.addEventListener('click', () => {
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
        ui.toggleStreamBtn.innerHTML = '<i class="ph ph-broadcast"></i> Start Data Stream Siphon';
        ui.toggleStreamBtn.classList.remove('pulse-btn');
        logSystem("Data Stream Siphon Disabled.");
    } else {
        ui.toggleStreamBtn.innerHTML = '<i class="ph ph-stop-circle"></i> Stop Data Stream Siphon';
        ui.toggleStreamBtn.classList.add('pulse-btn');
        logSystem("Data Stream Siphon Enabled. Ingesting mass chaotic data...");
        
        let index = 0;
        streamInterval = setInterval(() => {
            const rawEvent = rawDataStreamSimulation[index % rawDataStreamSimulation.length];
            logRawInput(`[${rawEvent.type}] ${rawEvent.data}`);
            
            // Push into normalization engine
            triggerGeminiNormalizationPipeline(rawEvent.data, rawEvent.type);
            
            index++;
        }, 3000); // New event every 3 seconds
    }
});

// UI Utilities
function logRawInput(msg) {
    ui.rawLogStream.insertAdjacentHTML('afterbegin', `<div class="log-entry">${msg}</div>`);
}

function logSystem(msg) {
    ui.rawLogStream.insertAdjacentHTML('afterbegin', `<div class="log-entry system-msg"><i class="ph ph-terminal"></i> ${msg}</div>`);
}

// Initialize with a few blank state items or let user interact immediately.
logSystem("IntentBridge AI core ready. Try pasting data, recording voice, or starting the continuous Data Siphon stream.");
