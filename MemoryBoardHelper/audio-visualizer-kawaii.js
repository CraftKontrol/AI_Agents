// Kawaii Neon Audio Visualizer
// Visual feedback for TTS with animated kawaii face

class KawaiiAudioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById('kawaii-visualizer-container');
        this.ctx = null;
        
        // Audio context
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        
        // Animation state
        this.isActive = false;
        this.animationId = null;
        
        // Emotion state
        this.currentEmotion = 'normal';
        
        // Eye blink state
        this.leftEyeBlinkProgress = 0;
        this.rightEyeBlinkProgress = 0;
        this.leftEyeBlinkTarget = 0;
        this.rightEyeBlinkTarget = 0;
        this.nextBlinkTime = 0;
        
        // Animation time
        this.time = 0;
        
        // Canvas dimensions
        this.width = 0;
        this.height = 0;
        
        // Face positions (calculated on resize)
        this.faceCenter = { x: 0, y: 0 };
        this.leftEyePos = { x: 0, y: 0 };
        this.rightEyePos = { x: 0, y: 0 };
        this.eyeRadius = 0;
        this.browY = 0;
        this.mouthY = 0;
        this.mouthWidth = 0;
        this.ringRadius = 0;

        // FFT simulation (for Browser TTS where audio cannot be tapped)
        this.isSimulatingFFT = false;
        this.simulatedFFT = new Uint8Array(256);

        // Speech energy envelope for simulated FFT
        this.speechEnergy = 0;
        this.speechDecay = 0.85; // faster decay to rest state

        // Brow wiggle seeds
        this.browNoiseLeftPhase = Math.random() * Math.PI * 2;
        this.browNoiseRightPhase = Math.random() * Math.PI * 2;
        this.browNoiseLeftSpeed = 0.0015 + Math.random() * 0.0015;
        this.browNoiseRightSpeed = 0.0015 + Math.random() * 0.0015;
        
        // Colors
        this.colors = {
            background: '#0A0A14',
            eyeNormal: '#00FFFF',
            eyeSuccess: '#00FF88',
            eyeWarning: '#FFAA44',
            eyeError: '#FF4444',
            eyeQuestion: '#4A9EFF',
            browGradient: ['#00D9FF', '#4A9EFF'],
            mouthGradient: ['#FF00FF', '#8B00FF', '#4A9EFF'],
            stars: '#FFFFFF'
        };
        
        // Stars for background
        this.stars = [];
        this.generateStars(50);
        
        if (this.canvas && this.container) {
            this.setupCanvas();
            this.setupClickHandler();
            console.log('[KawaiiVisualizer] Initialized');
        } else {
            console.error('[KawaiiVisualizer] Canvas or container not found');
        }
    }
    
    setupCanvas() {
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('[KawaiiVisualizer] Failed to get 2D context');
            return;
        }
        console.log('[KawaiiVisualizer] Canvas context obtained');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = rect.width;
        this.height = rect.height;
        
        console.log('[KawaiiVisualizer] Canvas dimensions:', this.width, 'x', this.height);

        // Set canvas internal dimensions with DPR
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        // Reset transform and scale for HiDPI
        if (this.ctx) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
        }

        // Calculate face layout from center and ring radius
        this.faceCenter = {
            x: this.width / 2,
            y: this.height / 2
        };

        this.ringRadius = Math.min(this.width, this.height) * 0.35;

        this.eyeRadius = this.ringRadius * 0.17;
        const eyeSpacing = this.ringRadius * 0.40;

        this.leftEyePos = {
            x: this.faceCenter.x - eyeSpacing,
            y: this.faceCenter.y - this.ringRadius * 0.1
        };

        this.rightEyePos = {
            x: this.faceCenter.x + eyeSpacing,
            y: this.faceCenter.y - this.ringRadius * 0.1
        };

        this.browY = this.leftEyePos.y - this.eyeRadius * 1.2;
            this.mouthY = this.faceCenter.y + this.ringRadius * 0.6;
        this.mouthWidth = this.ringRadius * 1.3;

        console.log('[KawaiiVisualizer] Face positions calculated:', {
            center: this.faceCenter,
            ringRadius: this.ringRadius,
            eyeRadius: this.eyeRadius,
            leftEye: this.leftEyePos,
            rightEye: this.rightEyePos,
            mouthY: this.mouthY,
            mouthWidth: this.mouthWidth
        });
    }
    
    generateStars(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 1,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    setupClickHandler() {
        this.container.addEventListener('click', () => {
            this.close();
        });
    }
    
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.75;
            
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            console.log('[KawaiiVisualizer] Audio context initialized');
        } catch (error) {
            console.error('[KawaiiVisualizer] Failed to initialize audio context:', error);
        }
    }
    
    connectAudioElement(audioElement) {
        if (!this.audioContext || !this.analyser) {
            console.warn('[KawaiiVisualizer] Audio context not initialized');
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.isSimulatingFFT = false;
            console.log('[KawaiiVisualizer] Connected to audio element');
        } catch (error) {
            // Source might already be connected
            console.log('[KawaiiVisualizer] Audio element connection skipped (already connected)');
        }
    }
    
    startFFTSimulation() {
        // For Browser TTS where we can't connect to audio
        this.isSimulatingFFT = true;
        console.log('[KawaiiVisualizer] Started FFT simulation for Browser TTS');
    }
    
    stopFFTSimulation() {
        this.isSimulatingFFT = false;
        console.log('[KawaiiVisualizer] Stopped FFT simulation');
    }
    
    updateSimulatedFFT() {
        // Create realistic speech-like FFT data
        const t = this.time * 0.05;
        
        for (let i = 0; i < this.simulatedFFT.length; i++) {
            // Speech has more energy in lower frequencies
            const freqFactor = 1 - (i / this.simulatedFFT.length);
            
            // Base energy with speech-like rhythm
            const rhythm = Math.sin(t + i * 0.1) * 0.5 + 0.5;
            const pulse = Math.sin(t * 3 + i * 0.05) * 0.3 + 0.7;
            
            // Random variations for natural feel
            const noise = Math.random() * 0.15; // reduce idle noise floor
            
            // Combine all factors
            const baseEnergy = (freqFactor * 0.55 + 0.2) * rhythm * pulse + noise;
            const energy = baseEnergy * (0.35 + this.speechEnergy); // lower idle energy, boost only on speech
            
            this.simulatedFFT[i] = Math.floor(energy * 200 + 55);
        }
    }

    triggerSpeechBeat(strength = 1) {
        // Boost speech envelope when boundaries fire
        this.speechEnergy = Math.min(2.5, this.speechEnergy + strength * 0.35);
    }
    
    setEmotion(emotion) {
        this.currentEmotion = emotion;
        console.log(`[KawaiiVisualizer] Emotion set to: ${emotion}`);
    }
    
    start(messageType = 'normal') {
        this.container.classList.remove('hiding');
        this.container.classList.add('active');
        
        this.setEmotion(messageType);
        
        if (this.isActive) return;
        
        this.isActive = true;
        this.time = 0;
        this.scheduleNextBlink();
        
        console.log(`[KawaiiVisualizer] Started with emotion: ${messageType}`);
        console.log('[KawaiiVisualizer] Canvas dimensions:', this.width, 'x', this.height);
        console.log('[KawaiiVisualizer] isActive:', this.isActive);
        
        // Force a resize to ensure dimensions are correct
        this.resize();
        
        // Start animation
        this.animate();
    }
    
    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('[KawaiiVisualizer] Stopped');
    }
    
    close() {
        this.isSimulatingFFT = false;
        this.container.classList.add('hiding');
        this.stop();
        
        setTimeout(() => {
            this.container.classList.remove('active', 'hiding');
        }, 300);
        
        console.log('[KawaiiVisualizer] Closed by user');
    }
    
    scheduleNextBlink() {
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        this.nextBlinkTime = this.time + delay;
    }
    
    updateBlinks() {
        const now = this.time;
        
        // Check if it's time to blink
        if (now >= this.nextBlinkTime) {
            // Random: blink one or both eyes
            const blinkBoth = Math.random() > 0.3;
            
            this.leftEyeBlinkTarget = 1;
            this.rightEyeBlinkTarget = blinkBoth ? 1 : 0;
            
            this.scheduleNextBlink();
        }
        
        // Animate blink progress
        const blinkSpeed = 0.15;
        
        if (this.leftEyeBlinkProgress < this.leftEyeBlinkTarget) {
            this.leftEyeBlinkProgress = Math.min(1, this.leftEyeBlinkProgress + blinkSpeed);
        } else if (this.leftEyeBlinkProgress > this.leftEyeBlinkTarget) {
            this.leftEyeBlinkProgress = Math.max(0, this.leftEyeBlinkProgress - blinkSpeed);
        }
        
        if (this.rightEyeBlinkProgress < this.rightEyeBlinkTarget) {
            this.rightEyeBlinkProgress = Math.min(1, this.rightEyeBlinkProgress + blinkSpeed);
        } else if (this.rightEyeBlinkProgress > this.rightEyeBlinkTarget) {
            this.rightEyeBlinkProgress = Math.max(0, this.rightEyeBlinkProgress - blinkSpeed);
        }
        
        // Reset targets when fully closed
        if (this.leftEyeBlinkProgress >= 1) {
            this.leftEyeBlinkTarget = 0;
        }
        if (this.rightEyeBlinkProgress >= 1) {
            this.rightEyeBlinkTarget = 0;
        }
    }
    
    animate() {
        if (!this.isActive) {
            console.log('[KawaiiVisualizer] Animation stopped - isActive is false');
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        this.time += 16; // ~60fps
        // Decay speech energy for simulated FFT envelope
        this.speechEnergy *= this.speechDecay;
        this.updateBlinks();
        this.draw();
    }
    
    draw() {
        if (!this.ctx || this.width === 0 || this.height === 0) {
            console.warn('[KawaiiVisualizer] Cannot draw: invalid canvas dimensions');
            return;
        }
        
        // Gather FFT stats once per frame
        const fftStats = this.computeFFTStats();

        // Clear canvas and add energy-driven background glow
        this.drawBackground(fftStats.energyLevel);

        // Draw face components
        // Stars removed
        this.drawFaceRing();
        this.drawBrows();
        this.drawEyes();
        this.drawMouth(fftStats);
    }

    computeFFTStats() {
        // Get FFT data (real or simulated) and derive energy levels
        let fftData = null;
        if (this.isSimulatingFFT) {
            this.updateSimulatedFFT();
            fftData = this.simulatedFFT;
        } else if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            fftData = this.dataArray;
        }

        let energyBoost = 1;
        let energyLevel = 0; // 0..1
        if (fftData) {
            let sum = 0;
            const len = Math.min(fftData.length, 128);
            for (let i = 0; i < len; i++) sum += fftData[i];
            const avg = sum / len;
            energyBoost = 0.4 + Math.min(1.6, avg / 110); // softer baseline and clamp
            energyLevel = Math.min(1, avg / 180); // normalized energy to flatten curve when loud
        }

        return { fftData, energyBoost, energyLevel };
    }

    drawBackground(energyLevel = 0) {
        this.ctx.save();

        // Base fill
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Central radial gradient that grows/intensifies with energy
        const cx = this.faceCenter.x;
        const cy = this.faceCenter.y;
        const baseRadius = this.ringRadius || Math.min(this.width, this.height) * 0.48;
        const dynamicRadius = baseRadius * (1.1 + energyLevel * 0.6);
        const intensity = Math.min(1, 0.25 + energyLevel * 1.2);

        const gradient = this.ctx.createRadialGradient(
            cx, cy, baseRadius * 0.05,
            cx, cy, dynamicRadius
        );

        gradient.addColorStop(0, `rgba(74, 158, 255, ${0.45 * intensity})`);
        gradient.addColorStop(0.45, `rgba(255, 0, 255, ${0.25 * intensity})`);
        gradient.addColorStop(1, 'rgba(10, 10, 20, 0)');

        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';

        this.ctx.restore();
    }

    drawFaceRing() {
        this.ctx.save();
        const radius = this.ringRadius || Math.min(this.width, this.height) * 0.48;
        const grad = this.ctx.createLinearGradient(
            this.faceCenter.x - radius,
            this.faceCenter.y - radius,
            this.faceCenter.x + radius,
            this.faceCenter.y + radius
        );
        grad.addColorStop(0, 'rgba(74, 158, 255, 0.45)');
        grad.addColorStop(0.5, 'rgba(255, 0, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 255, 136, 0.25)');

        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = 6;
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = 'rgba(74, 158, 255, 0.6)';

        this.ctx.beginPath();
        this.ctx.arc(this.faceCenter.x, this.faceCenter.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawStars() {
        this.ctx.save();
        
        for (const star of this.stars) {
            const alpha = (Math.sin(this.time * star.twinkleSpeed + star.twinklePhase) + 1) / 2 * 0.3;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(
                star.x * this.width,
                star.y * this.height,
                star.size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawBrows() {
        this.ctx.save();
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        // Gradient for brows
        const gradient = this.ctx.createLinearGradient(
            this.leftEyePos.x - this.eyeRadius * 2,
            this.browY,
            this.rightEyePos.x + this.eyeRadius * 2,
            this.browY
        );
        gradient.addColorStop(0, this.colors.browGradient[0]);
        gradient.addColorStop(1, this.colors.browGradient[1]);
        
        this.ctx.strokeStyle = gradient;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.colors.browGradient[0];
        
        const { leftInner, leftOuter, rightInner, rightOuter } = this.getBrowOffsets();

        // Left brow (start = outer, end = inner)
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.leftEyePos.x - this.eyeRadius * 1.5,
            this.browY + leftOuter
        );
        this.ctx.lineTo(
            this.leftEyePos.x + this.eyeRadius * 1.5,
            this.browY + leftInner
        );
        this.ctx.stroke();
        
        // Right brow (start = inner, end = outer)
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.rightEyePos.x - this.eyeRadius * 1.5,
            this.browY + rightInner
        );
        this.ctx.lineTo(
            this.rightEyePos.x + this.eyeRadius * 1.5,
            this.browY + rightOuter
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    getBrowOffsets() {
        // Returns individual offsets for inner/outer of each brow
        const now = this.time;
        const wiggle = (phase, speed) => Math.sin(now * speed + phase) * 2; // subtle wiggle

        let leftInner = 0, leftOuter = 0, rightInner = 0, rightOuter = 0;

        switch (this.currentEmotion) {
            case 'success':
                // intérieur haut, extérieur moitié
                leftInner = -12; leftOuter = -6;
                rightInner = -12; rightOuter = -6;
                break;
            case 'error':
                // intérieur bas, extérieur moitié
                leftInner = 12; leftOuter = 6;
                rightInner = 12; rightOuter = 6;
                break;
            case 'warning': {
                // intérieur oscillant moitié-haut, extérieur oscillant bas-milieu
                const inOsc = -6 + Math.sin(now * 0.004) * 4; // up to -10 .. -2
                const outOsc = 4 + Math.sin(now * 0.003 + Math.PI / 3) * 3; // 1 .. 7
                leftInner = inOsc; leftOuter = outOsc;
                rightInner = inOsc; rightOuter = outOsc;
                break;
            }
            case 'question':
                // gauche: intérieur haut, extérieur milieu ; droite: intérieur moyen, extérieur bas
                leftInner = -12; leftOuter = -4;
                rightInner = -4; rightOuter = 8;
                break;
            default:
                // normal : très petite inclinaison
                leftInner = -2; leftOuter = 0;
                rightInner = -2; rightOuter = 0;
                break;
        }

        // Apply small random wiggle per side
        leftInner += wiggle(this.browNoiseLeftPhase, this.browNoiseLeftSpeed);
        leftOuter += wiggle(this.browNoiseLeftPhase + 0.7, this.browNoiseLeftSpeed);
        rightInner += wiggle(this.browNoiseRightPhase, this.browNoiseRightSpeed);
        rightOuter += wiggle(this.browNoiseRightPhase + 0.7, this.browNoiseRightSpeed);

        return { leftInner, leftOuter, rightInner, rightOuter };
    }
    
    drawEyes() {
        this.ctx.save();
        
        // Get eye color based on emotion
        const eyeColor = this.getEyeColor();
        
        // Draw left eye
        this.drawEye(this.leftEyePos.x, this.leftEyePos.y, eyeColor, this.leftEyeBlinkProgress);
        
        // Draw right eye
        this.drawEye(this.rightEyePos.x, this.rightEyePos.y, eyeColor, this.rightEyeBlinkProgress);
        
        this.ctx.restore();
    }
    
    getEyeColor() {
        switch (this.currentEmotion) {
            case 'success':
                return this.colors.eyeSuccess;
            case 'error':
                return this.colors.eyeError;
            case 'warning':
                return this.colors.eyeWarning;
            case 'question':
                return this.colors.eyeQuestion;
            default:
                return this.colors.eyeNormal;
        }
    }
    
    drawEye(x, y, color, blinkProgress) {
        this.ctx.save();
        
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = color;
        
        if (blinkProgress > 0) {
            // Blinking - draw horizontal line
            const lineHeight = this.eyeRadius * 2 * (1 - blinkProgress);
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - this.eyeRadius, y);
            this.ctx.lineTo(x + this.eyeRadius, y);
            this.ctx.stroke();
        } else {
            // Open eye - draw shape based on emotion
            this.ctx.fillStyle = color;
            
            switch (this.currentEmotion) {
                case 'success':
                    this.drawStar(x, y, this.eyeRadius * 1.1, 5);
                    break;
                case 'error':
                    this.drawX(x, y, this.eyeRadius * 0.8);
                    break;
                case 'warning':
                    this.drawTriangle(x, y, this.eyeRadius * 0.9);
                    break;
                case 'question':
                    // Slight vertical stretch and bigger heart for better readability
                    this.ctx.save();
                    this.ctx.translate(x, y+15);
                    this.ctx.scale(1, 1.5);
                    this.drawHeart(0, 0, this.eyeRadius * 1.5);
                    this.ctx.restore();
                    break;
                default:
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, this.eyeRadius, 0, Math.PI * 2);
                    this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }
    
    drawStar(x, y, radius, points) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
            const r = i % 2 === 0 ? radius : radius * 0.5;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawX(x, y, size) {
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.ctx.fillStyle;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y - size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + size, y - size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.stroke();
    }
    
    drawTriangle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size * 0.3);
        
        // Left curve
        this.ctx.bezierCurveTo(
            x - size, y - size * 0.2,
            x - size, y - size * 0.8,
            x, y - size * 0.5
        );
        
        // Right curve
        this.ctx.bezierCurveTo(
            x + size, y - size * 0.8,
            x + size, y - size * 0.2,
            x, y + size * 0.3
        );
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawMouth(fftStats = { fftData: null, energyBoost: 1, energyLevel: 0 }) {
        this.ctx.save();
        
        const { fftData, energyBoost, energyLevel } = fftStats;
        
        // Create gradient for mouth
        const gradient = this.ctx.createLinearGradient(
            this.faceCenter.x - this.mouthWidth / 2,
            this.mouthY,
            this.faceCenter.x + this.mouthWidth / 2,
            this.mouthY
        );
        gradient.addColorStop(0, this.colors.mouthGradient[0]);
        gradient.addColorStop(0.5, this.colors.mouthGradient[1]);
        gradient.addColorStop(1, this.colors.mouthGradient[2]);
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.colors.mouthGradient[1];
        
        // Draw mouth arc with emotion variants and FFT, mirrored from center to sides
        const startX = this.faceCenter.x - this.mouthWidth / 2;
        const samples = 64;

        this.ctx.beginPath();

        for (let i = 0; i <= samples; i++) {
            // t in [-1, 1] so 0 is center; absolute value drives symmetric amplitude
            const t = (i / samples) * 2 - 1;
            const x = startX + (t + 1) * (this.mouthWidth / 2);
            
            // Base mouth curve per emotion
            const centerCurve = (() => {
                switch (this.currentEmotion) {
                    case 'success':
                        return { depth: this.ringRadius * 0.28 * (1 - energyLevel), tilt: 0 }; // big smile
                    case 'error':
                        return { depth: -this.ringRadius * 0.08 * (1 - energyLevel), tilt: this.ringRadius * 0.02 }; // softer frown, slight lift on right
                    case 'warning':
                        return { depth: this.ringRadius * 0.02 * (1 - energyLevel), tilt: 0 }; // near-flat
                    case 'question':
                        return { depth: this.ringRadius * 0.2 * (1 - energyLevel), tilt: this.ringRadius * 0.06 }; // slight tilt
                    default:
                        return { depth: this.ringRadius * 0.12 * (1 - energyLevel), tilt: 0 }; // flatter neutral smile
                }
            })();

            const depthScale = Math.max(0, 1 - energyLevel); // louder = fully flat at high energy
            const smileDepth = centerCurve.depth * depthScale;
            const tilt = centerCurve.tilt;

            // Parabola plus possible tilt (skewed up on right if tilt>0)
            const baseY = this.mouthY - Math.pow(t, 2) * smileDepth + (t * tilt) - energyLevel * 50;
            
            // Add FFT amplitude
            let amplitude = 0;
            if (fftData) {
                const fftIndex = Math.floor((Math.abs(t)) * (fftData.length / 2));
                const raw = fftData[fftIndex];
                // Logarithmic scaling base 5 for more natural visual response
                const logAmp = (Math.log(1 + raw) / Math.log(100)) / (Math.log(256) / Math.log(5));
                // Gradient: full power at center, 0 at edges
                const centerWeight = 1 - Math.abs(t); // t in [-1,1]
                const emotionAmp = (() => {
                    switch (this.currentEmotion) {
                        case 'success': return 32;
                        case 'error': return 26;
                        case 'warning': return 18;
                        case 'question': return 30;
                        default: return 24;
                    }
                })();
                amplitude = logAmp * emotionAmp * energyBoost * centerWeight;
                // If simulated and low energy, damp further to avoid moving in silence
                if (this.isSimulatingFFT && this.speechEnergy < 0.12) {
                    amplitude *= 0.25;
                }
            } else {
                // Idle animation (gentle wave) - keep subtle and centered
                const idleAmp = (() => {
                    switch (this.currentEmotion) {
                        case 'success': return 5.5;
                        case 'error': return 3.5;
                        case 'warning': return 2.5;
                        case 'question': return 4.5;
                        default: return 3.5;
                    }
                })();
                amplitude = Math.sin(this.time * 0.01 + t * Math.PI * 2) * idleAmp;
            }
            
            // Invert amplitude vertically for overlay
            const y = baseY - amplitude * 0.2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();

        // Secondary overlay curve (softer and thinner)
        this.ctx.save();
        this.ctx.strokeStyle = this.ctx.strokeStyle;
        this.ctx.lineWidth = this.ctx.lineWidth;
        this.ctx.shadowBlur = this.ctx.shadowBlur;
        this.ctx.shadowColor = this.ctx.shadowColor;

        this.ctx.beginPath();

        for (let i = 0; i <= samples; i++) {
            const t = (i / samples) * 2 - 1;
            const x = startX + (t + 1) * (this.mouthWidth / 2);

            // Reuse exactly the same curve as primary
            // Base mouth curve per emotion (same as above)
            const centerCurve = (() => {
                switch (this.currentEmotion) {
                    case 'success':
                        return { depth: this.ringRadius * 0.28 * (1 - energyLevel), tilt: 0 }; // big smile
                    case 'error':
                        return { depth: -this.ringRadius * 0.08 * (1 - energyLevel), tilt: this.ringRadius * 0.02 }; // softer frown, slight lift on right
                    case 'warning':
                        return { depth: this.ringRadius * 0.02 * (1 - energyLevel), tilt: 0 }; // near-flat
                    case 'question':
                        return { depth: this.ringRadius * 0.2 * (1 - energyLevel), tilt: this.ringRadius * 0.06 }; // slight tilt
                    default:
                        return { depth: this.ringRadius * 0.12 * (1 - energyLevel), tilt: 0 }; // flatter neutral smile
                }
            })();

            const depthScale = Math.max(0, 1 - energyLevel); // louder = fully flat at high energy
            const smileDepth = centerCurve.depth * depthScale;
            const tilt = centerCurve.tilt;

            // Parabola plus possible tilt (skewed up on right if tilt>0)
            const baseY = this.mouthY - Math.pow(t, 2) * smileDepth + (t * tilt) - energyLevel * 50;
            
            // Add FFT amplitude (same as above)
            let amplitude = 0;
            if (fftData) {
                const fftIndex = Math.floor((Math.abs(t)) * (fftData.length / 2));
                const raw = fftData[fftIndex];
                // Logarithmic scaling base 5 for more natural visual response
                const logAmp = (Math.log(1 + raw) / Math.log(100)) / (Math.log(256) / Math.log(5));
                // Gradient: full power at center, 0 at edges
                const centerWeight = 1 - Math.abs(t); // t in [-1,1]
                const emotionAmp = (() => {
                    switch (this.currentEmotion) {
                        case 'success': return 32;
                        case 'error': return 26;
                        case 'warning': return 18;
                        case 'question': return 30;
                        default: return 24;
                    }
                })();
                amplitude = logAmp * emotionAmp * energyBoost * centerWeight;
                // If simulated and low energy, damp further to avoid moving in silence
                if (this.isSimulatingFFT && this.speechEnergy < 0.12) {
                    amplitude *= 0.25;
                }
            } else {
                // Idle animation (gentle wave) - keep subtle and centered
                const idleAmp = (() => {
                    switch (this.currentEmotion) {
                        case 'success': return 5.5;
                        case 'error': return 3.5;
                        case 'warning': return 2.5;
                        case 'question': return 4.5;
                        default: return 3.5;
                    }
                })();
                amplitude = Math.sin(this.time * 0.01 + t * Math.PI * 2) * idleAmp;
            }
            
            // Amplitude moves down from baseline
            const y = baseY + amplitude;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
        this.ctx.restore();
        
        this.ctx.restore();
    }
}

// Global instance
let kawaiiVisualizer = null;

// Initialize on page load
window.addEventListener('load', async () => {
    console.log('[KawaiiVisualizer] Page loaded, initializing...');
    
    kawaiiVisualizer = new KawaiiAudioVisualizer('kawaii-visualizer-canvas');
    if (kawaiiVisualizer.canvas) {
        await kawaiiVisualizer.initialize();
        console.log('[KawaiiVisualizer] Ready');
        
        // Test drawing immediately (for debugging)
        // Uncomment to test if drawing works at all
        // setTimeout(() => {
        //     console.log('[KawaiiVisualizer] TEST: Starting test animation');
        //     kawaiiVisualizer.start('success');
        // }, 2000);
    } else {
        console.error('[KawaiiVisualizer] Canvas element not found!');
    }
});
