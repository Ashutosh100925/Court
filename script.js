// ================================
// NyayaAI Dashboard Script
// Production-Ready Version
// ================================

document.addEventListener("DOMContentLoaded", function () {

    // ------------------------------
    // Helpers
    // ------------------------------
    const $ = (id) => document.getElementById(id);

    // Initialize landing state
    history.replaceState({ page: 'landing' }, 'Landing', '#');

    // ------------------------------
    // Global Cursor Tracking
    // ------------------------------
    const cursorGlow = $('cursorGlow');
    if (cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            if (!cursorGlow.classList.contains('active')) cursorGlow.classList.add('active');
        });
    }

    // ------------------------------
    // Dashboard Navigation
    // ------------------------------
    window.enterDashboard = function () {
        $('landing-page')?.classList.remove('active');

        const dashboard = $('dashboard');
        if (!dashboard) return;

        dashboard.classList.remove('hidden');
        dashboard.classList.add('active');

        initDNAVisualizer();

        history.pushState({ page: 'dashboard' }, 'NyayaAI Dashboard', '#dashboard');
    };

    // Back button handling
    window.addEventListener('popstate', function (event) {
        const dashboard = $('dashboard');
        const landing = $('landing-page');

        if (!dashboard || !landing) return;

        if (event.state && event.state.page === 'dashboard') {
            landing.classList.remove('active');
            dashboard.classList.remove('hidden');
            dashboard.classList.add('active');
        } else {
            dashboard.classList.remove('active');
            dashboard.classList.add('hidden');
            landing.classList.add('active');
        }
    });

    // ------------------------------
    // Role Switching
    // ------------------------------
    const roleData = {
        judge: {
            name: 'Hon. Justice Sharma',
            role: 'Supreme Court',
            color: 'var(--accent-emerald)',
            avatar: 'https://i.pravatar.cc/150?img=11'
        },
        lawyer: {
            name: 'Adv. Priya Patel',
            role: 'Senior Counsel',
            color: 'var(--accent-blue)',
            avatar: 'https://i.pravatar.cc/150?img=47'
        },
        clerk: {
            name: 'Amit Kumar',
            role: 'Court Researcher',
            color: 'var(--accent-yellow)',
            avatar: 'https://i.pravatar.cc/150?img=33'
        },
        business: {
            name: 'Tata Legal Team',
            role: 'Corporate Enterprise',
            color: 'var(--accent-purple)',
            avatar: 'https://i.pravatar.cc/150?img=52'
        }
    };

    window.changeRole = function () {
        const roleSelect = $('roleSelect');
        if (!roleSelect) return;

        const data = roleData[roleSelect.value];
        if (!data) return;

        $('userName').innerText = data.name;

        const roleElem = $('userRole');
        roleElem.innerText = data.role;
        roleElem.style.color = data.color;

        $('userAvatar').src = data.avatar;
    };

    // ------------------------------
    // Voice Button (Speech to Text)
    // ------------------------------
    const voiceBtn = $('voiceBtn');
    let recognition;
    let isRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const caseInput = $('caseAnalysisInput');
            if (caseInput) {
                // Append final text and show interim
                caseInput.value = caseInput.value.replace(/ \*listening\.\.\.\*$/, '') + finalTranscript;
                if (interimTranscript) {
                    caseInput.value += ' *listening...*';
                }
            }
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error", event.error);
            stopRecording();
            triggerNotification('Voice Error', 'Microphone error: ' + event.error, 'red', 'fa-microphone-slash');
        };

        recognition.onend = function () {
            if (isRecording) {
                recognition.start(); // keep listening if not manually stopped
            }
        };
    } else {
        console.warn("Speech Recognition API not supported in this browser.");
    }

    function startRecording() {
        if (!recognition) return;
        const waveform = $('waveform');
        if (waveform) waveform.classList.remove('hidden');
        voiceBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        voiceBtn.style.background = 'var(--accent-red)';

        // Add visual cue in textarea
        const caseInput = $('caseAnalysisInput');
        if (caseInput && !caseInput.value.endsWith(' *listening...*')) {
            if (caseInput.value.length > 0 && !caseInput.value.endsWith(' ')) caseInput.value += ' ';
            caseInput.value += '*listening...*';
        }

        try {
            recognition.start();
            isRecording = true;
            triggerNotification('Listening', 'Speak now to dictate case facts...', 'purple', 'fa-microphone');
        } catch (e) {
            console.log(e);
        }
    }

    function stopRecording() {
        if (!recognition) return;
        const waveform = $('waveform');
        if (waveform) waveform.classList.add('hidden');
        voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        voiceBtn.style.background = 'var(--accent-purple)';

        // Remove visual cue
        const caseInput = $('caseAnalysisInput');
        if (caseInput) {
            caseInput.value = caseInput.value.replace(/ \*listening\.\.\.\*$/, '');
        }

        try {
            recognition.stop();
            isRecording = false;
        } catch (e) {
            console.log(e);
        }
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', function () {
            if (!recognition) {
                triggerNotification('Not Supported', 'Voice dictation is not supported in this browser.', 'yellow', 'fa-triangle-exclamation');
                return;
            }

            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }

    // ------------------------------
    // Tabs Logic
    // ------------------------------
    window.switchTab = function (tabId, event) {
        document.querySelectorAll('.tab-content')
            .forEach(el => el.classList.remove('active'));

        document.querySelectorAll('.tab-btn')
            .forEach(el => el.classList.remove('active'));

        const tab = $('tab-' + tabId);
        if (tab) tab.classList.add('active');

        if (event?.currentTarget)
            event.currentTarget.classList.add('active');
    };

    // ------------------------------
    // Summary View Buttons
    // ------------------------------
    const summaryBtns = document.querySelectorAll('.summary-actions .btn-micro');
    summaryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            summaryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            triggerNotification('View Changed', `Switched to ${this.innerText}`, 'blue', 'fa-eye');
        });
    });

    // ------------------------------
    // Auto Draft Judgment
    // ------------------------------
    window.startAutoDraft = function () {
        const btn = $('btnAutoDraft');
        const content = $('draftContent');
        if (!btn || !content) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Draft...';

        setTimeout(() => {
            content.innerHTML = '<div style="font-size: 13px; line-height: 1.6; color: var(--text-muted);" id="typingText"></div>';

            const txt = "IN THE SUPREME COURT OF INDIA\n\nCIVIL APPELLATE JURISDICTION\n\nHaving perused the submitted documents and precedents, including SC 2018 (Property vs Heir), it is observed that the unregistered will lacks the statutory validation required under Section 63 of the Indian Succession Act. \n\nTherefore, the appeal is liable to be dismissed.";

            let i = 0;
            const speed = 20; // ms per typing char
            const typingElem = $('typingText');

            function typeWriter() {
                if (i < txt.length) {
                    if (txt.charAt(i) === '\n') {
                        typingElem.innerHTML += '<br>';
                    } else {
                        typingElem.innerHTML += txt.charAt(i);
                    }
                    i++;
                    setTimeout(typeWriter, speed);
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Draft Complete';
                    btn.style.background = 'var(--accent-green)';
                    triggerNotification('Draft Generated', 'Auto Draft Judgment saved securely.', 'green', 'fa-file-pen');
                }
            }

            typeWriter();

        }, 1200); // initial loading delay
    };

    // ------------------------------
    // AI Case DNA Map (Phase 4)
    // ------------------------------
    function initDNAVisualizer(customData = null) {
        const container = $('dnaVisualizer');
        if (!container) return;

        container.innerHTML = '';

        // 1. Structured Legal Features (The Genes)
        const caseFeatures = customData || [
            { id: 'f1', label: 'Intent (Mens Rea)', score: 85, weight: 8, category: 'violent', desc: 'Pre-meditated indicator' },
            { id: 'f2', label: 'Act Type', score: 92, weight: 10, category: 'violent', desc: 'Physical assault vector' },
            { id: 'f3', label: 'Victim Profile', score: 60, weight: 5, category: 'minors', desc: 'Vulnerable demographic' },
            { id: 'f4', label: 'Evidential Strength', score: 40, weight: 4, category: 'weak', desc: 'Circumstantial only' },
            { id: 'f5', label: 'Digital Footprint', score: 75, weight: 7, category: 'digital', desc: 'Location ping verified' },
            { id: 'f6', label: 'Aggravating Factors', score: 88, weight: 9, category: 'violent', desc: 'Use of deadly weapon' },
            { id: 'f7', label: 'Precedent Match', score: 65, weight: 6, category: 'economic', desc: 'Standard historical alignment' },
            { id: 'f8', label: 'Risk Probability', score: 95, weight: 12, category: 'violent', desc: 'High flight risk flag' }
        ];

        // Ensure Tooltip exists
        let tooltip = $('dnaTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dnaTooltip';
            tooltip.className = 'dna-tooltip';
            container.parentElement.appendChild(tooltip);
        }

        // Color Mapping System
        const colorMap = {
            'violent': '#ef4444',   // Deep Red
            'sexual': '#dc2626',    // Crimson
            'kidnapping': '#f97316',// Orange
            'minors': '#a855f7',    // Purple
            'economic': '#3b82f6',  // Blue
            'digital': '#14b8a6',   // Teal
            'weak': '#64748b'       // Gray
        };

        const width = 300; // viewBox relative width
        const height = 100; // viewBox relative height
        const numPairs = caseFeatures.length;
        const xStep = width / (numPairs + 1);
        const amplitude = 30; // Slightly tighter helix
        const centerY = 50;

        let svgHtml = `<svg class="dna-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;
        svgHtml += `<path class="dna-strand id-strand1" d="" />`;
        svgHtml += `<path class="dna-strand id-strand2" d="" />`;

        // Generate Links and Genes
        caseFeatures.forEach((feature, index) => {
            const linkWidth = 0.5 + (feature.score / 100) * 2;
            svgHtml += `<line class="dna-link id-link${index}" x1="0" y1="0" x2="0" y2="0" stroke-width="${linkWidth}" />`;

            const color = colorMap[feature.category] || '#ffffff';
            const radius = 2 + (feature.weight / 12) * 3;

            // Top Gene
            svgHtml += `<circle class="dna-gene id-cgL${index}" cx="0" cy="0" r="0" fill="${color}"
                data-label="${feature.label}" data-score="${feature.score}" data-desc="${feature.desc}">
                <animate attributeName="r" from="0" to="${radius}" begin="${index * 0.15}s" dur="0.5s" fill="freeze" />
            </circle>`;

            // Bottom Gene
            svgHtml += `<circle class="dna-gene id-cgR${index}" cx="0" cy="0" r="0" fill="${color}"
                data-label="${feature.label}" data-score="${feature.score}" data-desc="${feature.desc}">
                 <animate attributeName="r" from="0" to="${radius}" begin="${index * 0.15 + 0.1}s" dur="0.5s" fill="freeze" />
            </circle>`;
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;

        // Scattered Starting Positions & Animation Offsets
        const scatteredNodes = caseFeatures.map(() => ({
            L: {
                x: (Math.random() * 0.8 + 0.1) * width,
                y: (Math.random() * 0.8 + 0.1) * height,
                offX: Math.random() * Math.PI * 2,
                offY: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 1
            },
            R: {
                x: (Math.random() * 0.8 + 0.1) * width,
                y: (Math.random() * 0.8 + 0.1) * height,
                offX: Math.random() * Math.PI * 2,
                offY: Math.random() * Math.PI * 2,
                speed: Math.random() * 2 + 1
            }
        }));

        // Global State for Assembly Trigger
        window.isDnaAssembling = false;
        window.dnaAssemblyStart = 0;

        // Expose trigger globally
        window.triggerDNAAssembly = function () {
            if (!window.isDnaAssembling) {
                window.isDnaAssembling = true;
                window.dnaAssemblyStart = performance.now();

                // Start the complexity metric counter only when assembling
                const metricEl = $('dnaComplexityMetric');
                if (metricEl) {
                    const avgScore = Math.round(caseFeatures.reduce((acc, f) => acc + f.score, 0) / numPairs);
                    let currentCounts = 0;
                    const counterInterval = setInterval(() => {
                        currentCounts += Math.floor(Math.random() * 5) + 1;
                        if (currentCounts >= avgScore) {
                            currentCounts = avgScore;
                            clearInterval(counterInterval);
                        }
                        metricEl.innerHTML = `Case Complexity Index: <span>${currentCounts}%</span>`;
                    }, 30);
                }
            }
        };

        // Reset Metric text initially
        const metricEl = $('dnaComplexityMetric');
        if (metricEl) {
            metricEl.innerHTML = `Case Complexity Index: <span style="color: var(--text-muted)">Awaiting Analysis...</span>`;
        }

        // Animation Loop Setup
        const svgEl = container.querySelector('.dna-svg');
        const strand1 = svgEl.querySelector('.id-strand1');
        const strand2 = svgEl.querySelector('.id-strand2');
        let timeOffset = 0;
        let animationRequested = true;

        // Easing function for smooth assembly
        function easeInOutCubic(x) {
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        }

        function renderFrame() {
            if (!$('dnaVisualizer')) {
                animationRequested = false;
                return;
            }
            timeOffset += 0.015; // Animation speed

            // Calculate Assembly Progress (0 to 1) over 2.5 seconds
            let rawProgress = 0;
            if (window.isDnaAssembling) {
                rawProgress = Math.min((performance.now() - window.dnaAssemblyStart) / 2500, 1);
            }
            const progress = easeInOutCubic(rawProgress);

            let path1 = `M `;
            let path2 = `M `;

            for (let i = 0; i <= 60; i++) {
                const x = (i / 60) * width;
                const phase = (x / width) * Math.PI * 3 - timeOffset;
                const y1 = centerY + Math.sin(phase) * amplitude;
                const y2 = centerY + Math.sin(phase + Math.PI) * amplitude;
                path1 += `${x},${y1} `;
                path2 += `${x},${y2} `;
            }
            strand1.setAttribute('d', path1);
            strand2.setAttribute('d', path2);
            strand1.style.opacity = progress;
            strand2.style.opacity = progress;

            caseFeatures.forEach((_, index) => {
                const x = (index + 1) * xStep;
                const phase = (x / width) * Math.PI * 3 - timeOffset;
                const targetY1 = centerY + Math.sin(phase) * amplitude;
                const targetY2 = centerY + Math.sin(phase + Math.PI) * amplitude;

                const nodeData = scatteredNodes[index];

                // Add idle floating animation to scattered nodes based on timeOffset
                const driftL_X = Math.sin(timeOffset * nodeData.L.speed + nodeData.L.offX) * 15;
                const driftL_Y = Math.cos(timeOffset * nodeData.L.speed + nodeData.L.offY) * 15;

                const driftR_X = Math.sin(timeOffset * nodeData.R.speed + nodeData.R.offX) * 15;
                const driftR_Y = Math.cos(timeOffset * nodeData.R.speed + nodeData.R.offY) * 15;

                // Slowly reduce drift and snap to targets as it assembles
                const driftMult = 1 - progress;

                const scatterLX = nodeData.L.x + (driftL_X * driftMult);
                const scatterLY = nodeData.L.y + (driftL_Y * driftMult);

                const scatterRX = nodeData.R.x + (driftR_X * driftMult);
                const scatterRY = nodeData.R.y + (driftR_Y * driftMult);

                // Interpolate Positions
                const currentXL = scatterLX + (x - scatterLX) * progress;
                const currentYL = scatterLY + (targetY1 - scatterLY) * progress;

                const currentXR = scatterRX + (x - scatterRX) * progress;
                const currentYR = scatterRY + (targetY2 - scatterRY) * progress;

                const link = svgEl.querySelector(`.id-link${index}`);
                link.setAttribute('x1', currentXL);
                link.setAttribute('x2', currentXR);
                link.setAttribute('y1', currentYL);
                link.setAttribute('y2', currentYR);
                link.style.opacity = progress;

                // For 3D depth sorting (basic radius scale based on Z) - only apply fully when assembled
                const zScale1 = 1 + ((Math.cos(phase) * 0.3) - 0.2) * progress;
                const zScale2 = 1 + ((Math.cos(phase + Math.PI) * 0.3) - 0.2) * progress;

                const cL = svgEl.querySelector(`.id-cgL${index}`);
                const cR = svgEl.querySelector(`.id-cgR${index}`);

                cL.setAttribute('cx', currentXL);
                cL.setAttribute('cy', currentYL);
                cL.style.transform = `scale(${zScale1})`;
                cL.style.transformOrigin = `${currentXL}px ${currentYL}px`;

                cR.setAttribute('cx', currentXR);
                cR.setAttribute('cy', currentYR);
                cR.style.transform = `scale(${zScale2})`;
                cR.style.transformOrigin = `${currentXR}px ${currentYR}px`;
            });

            if (animationRequested) requestAnimationFrame(renderFrame);
        }

        requestAnimationFrame(renderFrame);

        // Attach Interactive Hover Logic
        // Need brief timeout to let DOM render the new innerHTML SVGs
        setTimeout(() => {
            const genes = document.querySelectorAll('.dna-gene');

            genes.forEach(gene => {
                gene.addEventListener('mouseenter', function (e) {
                    // Get data attributes
                    const label = this.getAttribute('data-label');
                    const score = this.getAttribute('data-score');
                    const desc = this.getAttribute('data-desc');

                    tooltip.innerHTML = `
                        <div class="tooltip-title">${label}</div>
                        <div class="tooltip-value">${score}% Match</div>
                        <div style="font-size: 9px; margin-top: 4px; color: var(--text-muted);">${desc}</div>
                    `;

                    // Position tooltip relative to container
                    const containerRect = container.parentElement.getBoundingClientRect();
                    const geneRect = this.getBoundingClientRect();

                    const tooltipX = geneRect.left - containerRect.left + (geneRect.width / 2);
                    const tooltipY = geneRect.top - containerRect.top;

                    tooltip.style.left = `${tooltipX}px`;
                    tooltip.style.top = `${tooltipY}px`;

                    tooltip.classList.add('active');
                    this.classList.add('hover-focus');
                });

                gene.addEventListener('mouseleave', function () {
                    tooltip.classList.remove('active');
                    this.classList.remove('hover-focus');
                });
            });
        }, 100);
    }

    // ------------------------------
    // Orb Chat
    // ------------------------------
    window.toggleOrbChat = function () {
        triggerNotification(
            "NyayaAI Assistant",
            "Initializing... Ready to summarize, draft & analyze.",
            "purple",
            "fa-robot"
        );
    };

    // ------------------------------
    // Case Analysis (RAG Model Sandbox)
    // ------------------------------
    const caseInput = $('caseAnalysisInput');
    const ipcContainer = $('ipcPredictionContainer');
    const ipcResults = $('ipcResults');

    if (caseInput && ipcContainer && ipcResults) {
        caseInput.addEventListener('keypress', async function (e) {
            // Trigger on Enter (without holding Shift for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = this.value.trim();

                if (text.length === 0) return;

                // Reset states
                const heatmapOverlay = $('heatmapOverlay');
                const toggleReasoningBtn = $('toggleReasoningBtn');
                const similarityCounterBox = $('similarityCounterBox');
                if (heatmapOverlay) heatmapOverlay.classList.add('hidden');
                if (toggleReasoningBtn) toggleReasoningBtn.classList.add('hidden');
                if (similarityCounterBox) similarityCounterBox.style.display = 'none';

                // 1. Show loading state & Trigger DNA Assembly
                ipcContainer.classList.remove('hidden');
                ipcResults.innerHTML = '<div style="text-align:center; padding: 20px;"><div class="cinematic-loader"></div><div class="mt-2 text-muted micro-text" style="font-size: 11px;">Analyzing case facts with AI Intelligence Engine...</div></div>';

                // Construct the DNA Map visually alongside the processing
                if (window.triggerDNAAssembly) {
                    window.triggerDNAAssembly();
                }

                try {
                    // Call backend API
                    const response = await fetch('/api/predict-ipc', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ description: text })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    ipcResults.innerHTML = '';

                    if (data.matches && data.matches.length > 0) {
                        // Change container layout to support cards instead of inline tags
                        ipcResults.style.display = 'flex';
                        ipcResults.style.flexDirection = 'column';
                        ipcResults.style.gap = '10px';

                        // Extract predictions
                        data.matches.forEach((match, index) => {
                            setTimeout(() => {
                                const card = document.createElement('div');
                                card.className = 'prediction-card glass-card';
                                card.style.padding = '12px';
                                card.style.borderLeft = '4px solid var(--accent-blue)';
                                card.style.marginBottom = '5px';

                                card.innerHTML = `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <h5 style="margin: 0; color: var(--accent-blue); font-size: 1.05rem;">IPC Section ${match.ipc_section}</h5>
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <svg viewBox="0 0 36 36" class="circular-chart" style="width:36px; height:36px;">
                                                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path class="circle" stroke-dasharray="${Math.round(match.confidence * 100)}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <text x="18" y="20.35" class="percentage">${Math.round(match.confidence * 100)}%</text>
                                            </svg>
                                        </div>
                                    </div>
                                    <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 6px; line-height: 1.4;">
                                        <strong style="color: var(--text-muted);">Description:</strong> ${match.description}
                                    </p>
                                    <p style="font-size: 0.85rem; color: var(--accent-red); margin: 0; line-height: 1.4; background: rgba(239, 68, 68, 0.05); padding: 5px; border-radius: 4px; border-left: 2px solid var(--accent-red);">
                                        <strong style="color: var(--accent-red);">Punishment:</strong> ${match.punishment || "Punishment details unavailable."}
                                    </p>
                                `;
                                ipcResults.appendChild(card);
                            }, index * 150);
                        });

                        // Setup Similarity Counter Animation
                        if (similarityCounterBox) {
                            similarityCounterBox.style.display = 'block';
                            const simNumber = $('simCounterValue');
                            let count = 0;
                            const targetSim = Math.floor(Math.random() * 2000) + 100;
                            const invT = setInterval(() => {
                                count += Math.floor(targetSim / 20);
                                if (count >= targetSim) {
                                    count = targetSim;
                                    clearInterval(invT);
                                }
                                simNumber.innerText = count.toLocaleString();
                            }, 30);
                        }

                        // Prepare Heatmap overlay logic
                        if (toggleReasoningBtn && heatmapOverlay) {
                            toggleReasoningBtn.classList.remove('hidden');

                            // High risk legal keywords to highlight
                            const criticalTokens = ['fraud', 'stolen', 'murder', 'assault', 'intent', 'false', 'weapon', 'illegal', 'document', 'forged', 'conspiracy', 'threat', 'injury'];
                            const modTokens = ['property', 'dispute', 'contract', 'claim', 'vehicle', 'possession', 'funds', 'transfer', 'statement'];

                            let words = text.split(' ');
                            let htmlHeat = words.map(w => {
                                let lw = w.toLowerCase().replace(/[^a-z0-9]/g, '');
                                if (criticalTokens.includes(lw)) {
                                    return `<span class="token-hlt token-red" data-influence="High Infl.: +0.89">${w}</span>`;
                                } else if (modTokens.includes(lw)) {
                                    return `<span class="token-hlt token-orange" data-influence="Med Infl.: +0.45">${w}</span>`;
                                } else if (lw.length > 5 && Math.random() > 0.8) {
                                    return `<span class="token-hlt token-yellow" data-influence="Context: +0.12">${w}</span>`;
                                }
                                return w;
                            }).join(' ');

                            heatmapOverlay.innerHTML = htmlHeat;

                            // Unbind old to prevent duplicates
                            const newBtn = toggleReasoningBtn.cloneNode(true);
                            toggleReasoningBtn.parentNode.replaceChild(newBtn, toggleReasoningBtn);
                            newBtn.addEventListener('click', () => {
                                if (heatmapOverlay.classList.contains('hidden')) {
                                    heatmapOverlay.classList.remove('hidden');
                                    newBtn.innerHTML = '<i class="fa-solid fa-pen-to-square text-blue"></i> Edit Facts';
                                } else {
                                    heatmapOverlay.classList.add('hidden');
                                    newBtn.innerHTML = '<i class="fa-solid fa-eye text-blue"></i> Show AI Reasoning';
                                }
                            });
                        }

                        // Set current predictions for Voice TTS
                        window.currentAIExplanation = `Based on your input, the model predicts IPC Section ${data.matches[0].ipc_section}. This relates to ${data.matches[0].description}.`;

                        // triggerNotification('Analysis Complete', `RAG Model predicted ${data.matches.length} applicable sections.`, 'blue', 'fa-brain');
                    } else {
                        ipcResults.innerHTML = '<span class="text-muted">No relevant IPC sections found.</span>';
                        // triggerNotification('Analysis Completed', 'No high confidence matches found.', 'yellow', 'fa-triangle-exclamation');
                    }
                } catch (error) {
                    console.error("Error predicting IPC:", error);
                    ipcResults.innerHTML = '<span class="text-red"><i class="fa-solid fa-circle-exclamation"></i> Error connecting to RAG engine.</span>';
                    triggerNotification('Connection Error', 'Could not reach the RAG prediction server.', 'red', 'fa-circle-exclamation');
                }
            }
        });
    }

    // ------------------------------
    // Notification System
    // ------------------------------
    window.triggerNotification = function (title, message, colorClass, iconClass) {
        const container = document.querySelector('.outputs-container');
        if (!container) return;

        const card = document.createElement('div');
        card.className = `output - card slide -in border - left - ${colorClass} `;

        card.innerHTML = `
                                        < div class="o-icon text-${colorClass}" >
                                            <i class="fa-solid ${iconClass}"></i>
            </div >
                                <div class="o-data">
                                    <h4>${title}</h4>
                                    <p>${message}</p>
                                </div>
                            `;

        container.prepend(card);

        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(100%)';
            setTimeout(() => card.remove(), 500);
        }, 5000);
    };

    // ------------------------------
    // Smart Search (IPC Lookups)
    // ------------------------------
    const searchInput = document.querySelector('.smart-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', async function (e) {
            if (e.key === 'Enter') {
                const val = this.value.trim();
                if (!val) return;

                this.value = '';

                triggerNotification(
                    'Search Triggered',
                    'Searching for: ' + val,
                    'purple',
                    'fa-magnifying-glass'
                );

                // Show loading state in Semantic Search Card
                const searchCardResults = document.querySelector('.module-card.search-card .smart-results');
                if (searchCardResults) {
                    searchCardResults.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Searching Database...</div>';

                    try {
                        const response = await fetch('/api/search-ipc', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ipc_section: val })
                        });

                        if (!response.ok) throw new Error("Search failed");
                        const data = await response.json();

                        if (data.matches && data.matches.length > 0) {
                            searchCardResults.innerHTML = ''; // clear loading
                            data.matches.forEach(match => {
                                const resultEl = document.createElement('div');
                                resultEl.className = 'ai-highlight glow-border-purple';
                                resultEl.style.background = 'rgba(124, 58, 237, 0.1)';
                                resultEl.style.padding = '15px';
                                resultEl.style.borderRadius = '8px';
                                resultEl.style.borderLeft = '3px solid var(--accent-purple)';
                                resultEl.style.fontSize = '13px';
                                resultEl.style.marginBottom = '10px';

                                resultEl.innerHTML = `
                                < div style = "display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;" >
                                    <mark style="background: var(--accent-purple); color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
                                        IPC Section ${match.ipc_section}
                                    </mark>
                                    </div >
                                    <p style="margin-bottom: 8px; line-height: 1.4; color: var(--text-color);">${match.description}</p>
                                    <p style="margin: 0; color: var(--accent-red); font-size: 0.85em;"><i class="fa-solid fa-gavel"></i> <strong>Punishment:</strong> ${match.punishment || "Not specified"}</p>
                            `;
                                searchCardResults.appendChild(resultEl);
                            });
                        } else {
                            searchCardResults.innerHTML = `< div style = "text-align:center; padding: 20px; color: var(--text-muted);" > No records found for '${val}'.</div > `;
                        }

                    } catch (err) {
                        console.error(err);
                        searchCardResults.innerHTML = `< div style = "text-align:center; padding: 20px; color: var(--accent-red);" > <i class="fa-solid fa-triangle-exclamation"></i> Error connecting to database.</div > `;
                    }
                }
            }
        });
    }

    // ------------------------------
    // Confidential Mode
    // ------------------------------
    window.toggleConfidentialMode = function () {
        const btn = $('confidentialToggle');
        if (!btn) return;

        document.body.classList.toggle('blur-active');
        btn.classList.toggle('active');

        if (btn.classList.contains('active')) {
            triggerNotification(
                'Confidential Mode On',
                'Sensitive information is now blurred.',
                'green',
                'fa-eye-slash'
            );
        } else {
            triggerNotification(
                'Confidential Mode Off',
                'Information visibility restored.',
                'yellow',
                'fa-eye'
            );
        }
    };

    // ------------------------------
    // Modal System
    // ------------------------------
    window.showModal = function (type) {
        const overlay = $('modalOverlay');
        const body = $('modalBody');
        if (!overlay || !body) return;

        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('active'), 10);

        if (type === 'performance') {
            body.innerHTML = `
                                < h3 >📊 Court Performance Dashboard</h3 >
                                    <div class="dashboard-stats">
                                        <div class="stat-box"><h2>84%</h2><p>Clearance Rate</p></div>
                                        <div class="stat-box"><h2>12</h2><p>Avg Months</p></div>
                                        <div class="stat-box"><h2>+15%</h2><p>Efficiency</p></div>
                                        <div class="stat-box"><h2>2410</h2><p>Pending Cases</p></div>
                                    </div>
                            `;
        }

        if (type === 'translation') {
            body.innerHTML = `
                                < h3 >🌐 Multilingual Translation</h3 >
                <p><strong>English:</strong> Injunction request denied.</p>
                <p><strong>Hindi:</strong> निषेधाज्ञा अनुरोध अस्वीकार किया जाता है।</p>
                            `;
        }
    };

    window.closeModal = function () {
        const overlay = $('modalOverlay');
        const body = $('modalBody');
        if (!overlay || !body) return;

        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            body.innerHTML = '';
        }, 300);
    };


    // ------------------------------
    // ID Card Verification System
    // ------------------------------

    let idStream = null;

    window.startIDCamera = async function () {
        const video = document.getElementById("idVideo");

        if (!navigator.mediaDevices) {
            triggerNotification("Error", "Camera not supported", "red", "fa-camera");
            return;
        }

        try {
            idStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "environment"
                }
            });

            video.srcObject = idStream;
            triggerNotification("Camera Started", "Show ID card clearly.", "blue", "fa-camera");

            const scannerText = document.getElementById('scannerText');
            if (scannerText) {
                scannerText.innerText = "Camera Active. Tracking Face & ID...";
            }
            const scannerWrapper = document.getElementById('scannerWrapper');
            if (scannerWrapper) {
                scannerWrapper.classList.add('scanning');
            }

        } catch (err) {
            triggerNotification("Camera Error", "Permission denied or no camera.", "red", "fa-triangle-exclamation");
        }
    };

    window.verifyIDCard = async function () {
        const video = document.getElementById("idVideo");
        const resultBox = document.getElementById("idResult");
        const scannerText = document.getElementById('scannerText');
        const scannerWrapper = document.getElementById('scannerWrapper');

        if (!video || !video.srcObject) {
            triggerNotification("Error", "Start camera first.", "yellow", "fa-triangle-exclamation");
            return;
        }

        if (scannerText) {
            scannerText.innerText = "Analyzing Document Authenticity...";
            scannerText.classList.add('blink');
        }
        if (scannerWrapper) {
            scannerWrapper.classList.remove('verified', 'denied');
            scannerWrapper.classList.add('scanning');
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/jpeg")
        );

        const formData = new FormData();
        formData.append("file", blob);

        resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying ID...';

        try {
            const response = await fetch("/api/verify-id/", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            console.log("Backend Response:", data);

            if (scannerWrapper) {
                scannerWrapper.classList.remove('scanning');
            }
            if (scannerText) {
                scannerText.classList.remove('blink');
            }

            if (data.status === "ID detected") {

                resultBox.innerHTML = `
                                <div style="color: var(--accent-green); font-weight:600;">
                    ✅ ID Detected - Authorized Redirecting...
                </div>
                                <div style="font-size: 0.8rem; margin-top:5px; white-space:pre-wrap;">
                                    ${data.extracted_text}
                                </div>
                            `;
                triggerNotification("Access Granted", "Valid ID detected.", "green", "fa-circle-check");

            } else {
                if (scannerWrapper) scannerWrapper.classList.add('denied');
                if (scannerText) {
                    scannerText.innerText = "Verification Failed. Potential Fraud Detected.";
                    scannerText.style.color = "var(--accent-red)";
                }

                resultBox.innerHTML = `
                                < div style = "color: var(--accent-red); font-weight:600;" >
                    ❌ ${data.status}
                </div >
                                `;
                triggerNotification("Access Denied", "No valid ID found.", "red", "fa-ban");
            }

        } catch (err) {
            if (scannerWrapper) {
                scannerWrapper.classList.remove('scanning');
                scannerWrapper.classList.add('denied');
            }
            if (scannerText) {
                scannerText.classList.remove('blink');
                scannerText.innerText = "Connection Error. Cannot Verify.";
                scannerText.style.color = "var(--accent-red)";
            }

            resultBox.innerHTML = '<span style="color:red;">Server Error</span>';
            triggerNotification("Server Error", "Could not reach verification API.", "red", "fa-circle-exclamation");
        }
    };

    // ------------------------------
    // Command Center Features
    // ------------------------------

    // 1. Live Clock
    function updateClock() {
        const timeElem = $('liveClockTime');
        const dateElem = $('liveClockDate');
        if (!timeElem || !dateElem) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

        timeElem.innerText = timeStr;
        dateElem.innerText = dateStr;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. System Activity Log
    const systemActivities = [
        "Case Metadata Loaded...",
        "AI Risk Engine Calibrated...",
        "ID Verification Module Ready...",
        "Bias Scan Completed...",
        "Connecting to Judicial DB...",
        "Precedent Network Synced...",
        "Ethical Safeguards Verified..."
    ];
    let logIndex = 0;
    function addSystemLog() {
        const container = $('activityLogContainer');
        if (!container || logIndex >= systemActivities.length) {
            // Remove spinner once done
            const spinner = document.querySelector('.activity-log h4 .fa-circle-notch');
            if (spinner) {
                spinner.classList.remove('fa-spin');
                spinner.classList.replace('fa-circle-notch', 'fa-check');
                spinner.style.color = 'var(--accent-green)';
            }
            return;
        }

        const log = document.createElement('div');
        log.className = 'log-item';
        log.innerText = systemActivities[logIndex];

        container.appendChild(log); // Add to bottom
        logIndex++;

        setTimeout(addSystemLog, Math.random() * 1500 + 800); // Random delay
    }
    setTimeout(addSystemLog, 1000);

    // 3. Neural Network Particles Canvas
    function initParticles() {
        const canvas = $('particles-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const particles = [];
        const numParticles = Math.min(Math.floor(window.innerWidth / 15), 70);
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 1.5 + 0.5
            });
        }

        function animateParticles() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dx = p.x - p2.x;
                    let dy = p.y - p2.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        // Fading lines based on distance
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - (dist / 120) * 0.1})`;
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }
    initParticles();

    // 4. Animate Semicircle Risk Meter
    setTimeout(() => {
        const fillBar = $('riskFillBar');
        const valText = $('riskValueText');
        const meterBox = document.querySelector('.gauge-container');
        if (fillBar && valText) {
            const target = parseInt(fillBar.getAttribute('data-target') || '0');
            let current = 0;
            const interval = setInterval(() => {
                current += 1;
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                    if (target > 70 && meterBox) {
                        fillBar.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.8)';
                        fillBar.style.borderColor = 'var(--accent-red)';
                    }
                }
                const degrees = 45 + (current / 100) * 180;
                fillBar.style.transform = `rotate(${degrees}deg)`;
                valText.innerText = current + '%';
            }, 20);
        }
    }, 2000);

    // 5. AI Voice TTS Synthesizer
    window.narrateExplanation = function () {
        if (!('speechSynthesis' in window)) {
            triggerNotification('Not Supported', 'Voice synthesis not supported on this browser.', 'yellow', 'fa-triangle-exclamation');
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            // triggerNotification('Voice Halted', 'Narration stopped manually.', 'yellow', 'fa-volume-xmark');
            const btn = document.getElementById('btnNarrate');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high text-blue" style="font-size:14px;"></i>';
            return;
        }

        const textToRead = window.currentAIExplanation || "No case facts have been analyzed yet. Please submit a query first.";
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95;
        utterance.pitch = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            // triggerNotification('Synthesizer Active', 'Reading explanation out loud...', 'blue', 'fa-volume-high');
            const btn = document.getElementById('btnNarrate');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-xmark text-red" style="font-size:14px;"></i>';
        };

        utterance.onend = () => {
            const btn = document.getElementById('btnNarrate');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-volume-high text-blue" style="font-size:14px;"></i>';
        };

        window.speechSynthesis.speak(utterance);
    };

    // ------------------------------
    // Judge Secure Verification System
    // ------------------------------
    window.openSecureModal = function () {
        const roleSelect = $('roleSelect');
        if (roleSelect && roleSelect.value !== 'judge') {
            triggerNotification('Access Denied', 'Only Judges can access this section.', 'red', 'fa-lock');
            return;
        }

        const overlay = $('secureModalOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('active'), 10);
    };

    window.closeSecureModal = function () {
        const overlay = $('secureModalOverlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            if (secureIdStream) {
                secureIdStream.getTracks().forEach(track => track.stop());
                secureIdStream = null;
            }
        }, 300);
    };

    let secureIdStream = null;

    window.startSecureIDCamera = async function () {
        const video = $('secureIdVideo');

        if (!navigator.mediaDevices) {
            triggerNotification("Error", "Camera not supported", "red", "fa-camera");
            return;
        }

        try {
            secureIdStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" }
            });

            video.srcObject = secureIdStream;

            const scannerText = $('secureScannerText');
            if (scannerText) scannerText.innerText = "Camera Active. Tracking Face & ID...";

            const scannerWrapper = $('secureScannerWrapper');
            if (scannerWrapper) scannerWrapper.classList.add('scanning');

        } catch (err) {
            triggerNotification("Camera Error", "Permission denied or no camera.", "red", "fa-triangle-exclamation");
        }
    };

    window.verifySecureIDCard = async function () {
        const video = $('secureIdVideo');
        const resultBox = $('secureIdResult');
        const scannerText = $('secureScannerText');
        const scannerWrapper = $('secureScannerWrapper');
        const attemptsText = $('remainingAttemptsText');
        const verifyBtn = $('secureVerifyBtn');
        const lockoutAlarm = $('lockoutAlarm');

        let remainingAttempts = parseInt(sessionStorage.getItem("remainingAttempts"));
        if (isNaN(remainingAttempts)) remainingAttempts = 5;

        // Freeze execution if already locked out
        if (remainingAttempts <= 0) {
            if (scannerText) {
                scannerText.innerText = "⚠ SYSTEM LOCKED\nJudicial Security Risk Detected.\nReauthentication Required.";
                scannerText.style.color = "var(--accent-red)";
            }
            if (scannerWrapper) {
                scannerWrapper.classList.remove('scanning', 'verified');
                scannerWrapper.classList.add('denied');
            }
            if (verifyBtn) verifyBtn.disabled = true;
            return;
        }

        if (!video || !video.srcObject) {
            triggerNotification("Error", "Start camera first.", "yellow", "fa-triangle-exclamation");
            return;
        }

        if (scannerText) {
            scannerText.innerText = "Analyzing Judicial Authenticity...";
            scannerText.classList.add('blink');
        }
        if (scannerWrapper) {
            scannerWrapper.classList.remove('verified', 'denied');
            scannerWrapper.classList.add('scanning');
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
        const formData = new FormData();
        formData.append("file", blob);

        resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying ID...';

        try {
            const response = await fetch("/api/verify-id/", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (scannerWrapper) scannerWrapper.classList.remove('scanning');
            if (scannerText) scannerText.classList.remove('blink');

            if (data.status === "ID detected") {
                // SUCCESS LOGIC
                sessionStorage.setItem("remainingAttempts", 5);
                if (attemptsText) attemptsText.innerText = "System Status: Verified";

                window.speechSynthesis.cancel();
                let utterance = new SpeechSynthesisUtterance("Access Granted.");
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);

                resultBox.innerHTML = `
                    <div style="color: var(--accent-green); font-weight:600;">
                        ✅ Verified. Securing Session...
                    </div>
                `;
                triggerNotification("Identity Verified", "Redirecting to Secure Section...", "green", "fa-shield-check");

                if ($('secureModalBody')) {
                    $('secureModalBody').style.boxShadow = "inset 0 0 50px rgba(16, 185, 129, 0.2)";
                    setTimeout(() => $('secureModalBody').style.boxShadow = "none", 1000);
                }

                // Set the token
                sessionStorage.setItem("judge_secure_token", "SECURE_JUDGE_TOKEN_999X");
                sessionStorage.setItem("judge_role_verified", "true");

                setTimeout(() => {
                    closeSecureModal();
                    window.location.href = "judge-secure-dashboard.html";
                }, 1500);

            } else {
                // FAILURE LOGIC
                remainingAttempts--;
                sessionStorage.setItem("remainingAttempts", remainingAttempts);

                if (scannerWrapper) scannerWrapper.classList.add('denied');

                window.speechSynthesis.cancel();

                if (remainingAttempts > 0) {
                    if (attemptsText) attemptsText.innerText = `Remaining Attempts: ${remainingAttempts} / 5`;
                    if (scannerText) {
                        scannerText.innerText = "Verification Failed. Unauthorized Access.";
                        scannerText.style.color = "var(--accent-red)";
                    }
                    resultBox.innerHTML = `<div style="color: var(--accent-red); font-weight:600;">❌ ${data.status}</div>`;

                    let utterance = new SpeechSynthesisUtterance(`Access denied. You have only ${remainingAttempts} chance${remainingAttempts === 1 ? '' : 's'} out of 5.`);
                    utterance.rate = 0.95;
                    utterance.pitch = 0.9;
                    window.speechSynthesis.speak(utterance);

                    triggerNotification("Access Denied", "Unauthorized ID found.", "red", "fa-ban");
                } else {
                    // LOCKOUT LOGIC
                    if (attemptsText) attemptsText.innerText = `Remaining Attempts: 0 / 5`;
                    if (scannerText) {
                        scannerText.innerText = "⚠ SYSTEM LOCKED\nJudicial Security Risk Detected.\nReauthentication Required.";
                        scannerText.style.color = "var(--accent-red)";
                    }
                    resultBox.innerHTML = `<div style="color: var(--accent-red); font-weight:600;">❌ System Locked</div>`;
                    if (verifyBtn) verifyBtn.disabled = true;

                    if (lockoutAlarm) {
                        lockoutAlarm.volume = 0.6;
                        lockoutAlarm.play().catch(e => console.log("Audio play blocked by browser:", e));
                    }

                    let utterance = new SpeechSynthesisUtterance("Risk. Security protocol activated.");
                    utterance.rate = 0.95;
                    utterance.pitch = 0.9;
                    window.speechSynthesis.speak(utterance);

                    triggerNotification("Security Lockout", "Too many failed attempts. Console locked.", "red", "fa-lock");
                }
            }
        } catch (err) {
            if (scannerWrapper) {
                scannerWrapper.classList.remove('scanning');
                scannerWrapper.classList.add('denied');
            }
            if (scannerText) {
                scannerText.classList.remove('blink');
                scannerText.innerText = "Connection Error. Cannot Verify.";
                scannerText.style.color = "var(--accent-red)";
            }
            resultBox.innerHTML = '<span style="color:red;">Server Error</span>';
            triggerNotification("Server Error", "Could not reach verification API.", "red", "fa-circle-exclamation");
        }
    };

    // ------------------------------
    // Hologram Loading Logic
    // ------------------------------
    const initOverlay = $('hologram-init-overlay');
    if (initOverlay) {
        // Force complete hide after 1.2s to match requirements
        setTimeout(() => {
            initOverlay.style.opacity = '0';
            initOverlay.style.pointerEvents = 'none';
            setTimeout(() => {
                initOverlay.remove();
            }, 800); // Wait for fade transition
        }, 1200);
    }

    // ------------------------------
    // Parallax Depth System
    // ------------------------------
    const parallaxBg = document.getElementById('parallax-bg');
    const parallaxContent = document.getElementById('parallax-content');
    const parallaxNav = document.getElementById('parallax-nav');

    if (parallaxBg && parallaxContent) {
        document.addEventListener('mousemove', (e) => {
            // Apply parallax only if on landing page
            const isLandingActive = document.getElementById('landing-page')?.classList.contains('active');
            if (!isLandingActive) return;

            const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 50;

            // Layer 1 & 2 Background Moves opposite
            parallaxBg.style.transform = `translate(${xAxis * 0.5}px, ${yAxis * 0.5}px)`;

            // Layer 4 Content Moves more (floating effect)
            parallaxContent.style.transform = `translate(${-xAxis * 0.8}px, ${-yAxis * 0.8}px)`;

            if (parallaxNav) {
                parallaxNav.style.transform = `translate(${-xAxis * 0.2}px, ${-yAxis * 0.2}px)`;
            }
        });
    }

    // ------------------------------
    // Emerging Legal Intelligence Monitor (Phase 6 - Backend Proxy)
    // ------------------------------
    let legalTrendsData = [];

    async function fetchKnowivateTrends() {
        const container = $('legalReportsContainer');
        if (!container) return;

        // Show loading state
        container.innerHTML = '<div class="loader-placeholder micro-text text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Synchronizing with live legal streams...</div>';

        try {
            // Updated to call local backend proxy for better security
            const url = `/api/latest-news`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('Backend News Proxy Error');

            const articles = await response.json();

            if (articles && articles.length > 0) {
                processNewsToLegalIntel(articles);
            } else {
                container.innerHTML = '<div class="micro-text text-muted">No fresh legal trends detected.</div>';
            }
        } catch (error) {
            console.error('Knowivate Monitor Error:', error);
            container.innerHTML = '<div class="micro-text text-red"><i class="fa-solid fa-triangle-exclamation"></i> Sync Error. Check Backend Connection.</div>';
            legalTrendsData = [];
        }
    }

    function processNewsToLegalIntel(articles) {
        legalTrendsData = articles.slice(0, 10).map(art => {
            const title = (art.title || art.headline || '').toLowerCase();
            const desc = (art.description || art.summary || art.content || '').toLowerCase();
            const fullContent = title + ' ' + desc;

            // Simple AI-Simulated Classification Logic
            let category = 'Legal Report';
            let type = 'general';
            let severity = 'medium';
            let confidence = Math.floor(Math.random() * 15) + 80; // 80-95%

            if (fullContent.includes('murder') || fullContent.includes('killed') || fullContent.includes('dead')) {
                category = 'Violent Crime';
                type = 'violent';
                severity = 'high';
            } else if (fullContent.includes('fraud') || fullContent.includes('scam') || fullContent.includes('money laundering') || fullContent.includes('shell')) {
                category = 'Economic Offence';
                type = 'economic';
                severity = 'high';
            } else if (fullContent.includes('cyber') || fullContent.includes('phishing') || fullContent.includes('hacked')) {
                category = 'Cyber Crime';
                type = 'cyber';
                severity = 'medium';
            } else if (fullContent.includes('rape') || fullContent.includes('sexual') || fullContent.includes('assault')) {
                category = 'Sexual Offence';
                type = 'sexual';
                severity = 'high';
            } else if (fullContent.includes('child') || fullContent.includes('labour') || fullContent.includes('trafficking')) {
                category = 'Crimes Against Minors';
                type = 'minors';
                severity = 'high';
            }

            // Extract Location (Simulated simple extraction)
            const locations = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Gujarat', 'UP', 'Bihar', 'Assam'];
            let foundLocation = 'India';
            for (let loc of locations) {
                if (fullContent.includes(loc.toLowerCase())) {
                    foundLocation = loc;
                    break;
                }
            }

            // Generate IPC Mapping based on category
            let mapping = [];
            if (type === 'violent') {
                mapping = [
                    { label: 'Intent', score: 90 + Math.random() * 8, weight: 10, category: 'violent', desc: 'Pre-meditated indicator' },
                    { label: 'Act Type', score: 85 + Math.random() * 10, weight: 9, category: 'violent', desc: 'Physical assault vector' }
                ];
            } else if (type === 'economic') {
                mapping = [
                    { label: 'Asset Trace', score: 80 + Math.random() * 15, weight: 9, category: 'economic', desc: 'Financial trail detect' },
                    { label: 'Forgeries', score: 90 + Math.random() * 5, weight: 10, category: 'economic', desc: 'Doc authenticity flagged' }
                ];
            } else {
                mapping = [
                    { label: 'Legal Weight', score: 75 + Math.random() * 20, weight: 8, category: 'general', desc: 'Case severity metric' }
                ];
            }

            return {
                category,
                type,
                location: foundLocation,
                severity,
                confidence,
                timestamp: formatRelativeTime(art.pubDate || art.publishedAt || art.date || new Date()),
                headline: art.title || art.headline,
                source: art.source_name || art.source?.name || art.source || 'News Stream',
                url: art.link || art.url || '#',
                mapping
            };
        });

        renderLegalMonitor();
    }

    function formatRelativeTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Recent';
        if (diffInHours === 1) return '1 hour ago';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return `${Math.floor(diffInHours / 24)} days ago`;
    }

    function renderLegalMonitor() {
        const container = $('legalReportsContainer');
        if (!container) return;

        // 1. Update Trend Summary Counts (Aggregated from live data)
        const summary = { violent: 0, sexual: 0, economic: 0, cyber: 0 };
        legalTrendsData.forEach(item => {
            if (summary[item.type] !== undefined) summary[item.type]++;
        });

        Object.keys(summary).forEach(type => {
            const pill = document.querySelector(`.trend-pill[data-type="${type}"] .count`);
            if (pill) pill.innerText = `+${summary[type] || Math.floor(Math.random() * 5)}`; // Fallback mixed with live
        });

        // 2. Render Reports
        container.innerHTML = '';
        legalTrendsData.forEach((report, index) => {
            const item = document.createElement('div');
            item.className = 'report-item';
            item.innerHTML = `
                <div class="report-header">
                    <span class="report-category">${report.category}</span>
                    <span class="report-severity severity-${report.severity}">${report.severity}</span>
                </div>
                <div class="report-meta">
                    <span><i class="fa-solid fa-location-dot"></i> ${report.location}</span>
                    <span><i class="fa-solid fa-bullseye"></i> ${report.confidence}% Conf.</span>
                    <span><i class="fa-solid fa-clock"></i> ${report.timestamp}</span>
                </div>
                <div class="report-details">
                    <p style="margin-bottom: 8px; line-height: 1.4; color: var(--text-main); font-style: italic;">
                        "${report.headline}"
                    </p>
                    <div style="font-size: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span><strong>Source:</strong> ${report.source}</span>
                        <a href="${report.url}" target="_blank" style="color: var(--accent-blue); text-decoration: none;">Read Article <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 9px;"></i></a>
                    </div>
                    <button class="map-to-dna-btn" onclick="mapReportToDNA(${index}, event)">
                        <i class="fa-solid fa-dna"></i> Map to Case DNA Engine
                    </button>
                </div>
            `;

            item.addEventListener('click', function (e) {
                if (e.target.closest('button') || e.target.closest('a')) return;
                this.classList.toggle('expanded');
            });

            container.appendChild(item);
        });
    }

    window.mapReportToDNA = function (index, event) {
        event.stopPropagation();
        const report = legalTrendsData[index];
        if (!report || !report.mapping) return;

        triggerNotification('Mapping Data', `Syncing ${report.category} data to DNA Engine...`, 'emerald', 'fa-sync fa-spin');

        if (window.isDnaAssembling) window.isDnaAssembling = false;

        setTimeout(() => {
            initDNAVisualizer(report.mapping);
            if (window.triggerDNAAssembly) window.triggerDNAAssembly();
            triggerNotification('Sync Complete', 'DNA Map updated with intelligence data.', 'emerald', 'fa-check');
        }, 800);
    };

    // Initialize Monitor with Live Fetch
    setTimeout(fetchKnowivateTrends, 1000);
});