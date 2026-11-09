const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');

let flowers = [];
let confetti = [];
let ripples = [];
let audioContext;
let animationActive = false;
let revealTriggered = false;

const tapMessages = [
    "You are wonderful",
    "Keep shining bright",
    "Have an amazing day!",
    "You bring pure good vibes",
    "Always stay awesome",
    "A wonderful friend!"
];
let currentMsgIndex = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- SFX AUDIO LOGIC BLOCK ---
function playWhooshSFX() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        const bufferSize = audioContext.sampleRate * 0.5;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        filter.Q.setValueAtTime(4, now);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        noiseSource.start(now);
        noiseSource.stop(now + 0.5);
    } catch (e) { console.log(e); }
}

function playFlowerRustleSFX() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        const bufferSize = audioContext.sampleRate * 3.0;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.04, now + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        noiseSource.start(now);
        noiseSource.stop(now + 4.0);
    } catch (e) { console.log(e); }
}

// --- FEATURE 3: UPGRADED FADING GLITTER TRAIL ENGINE ---
class RippleParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2.5 + 1.5; // Shimmering glitter sizing
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.025; // Continuous clean decay rate
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        const colors = ['#ffffff', '#f472b6', '#9333ea', '#fef08a'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function handlePointerTrail(e) {
    let clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
    
    if (clientX && clientY) {
        for (let i = 0; i < 4; i++) {
            ripples.push(new RippleParticle(clientX, clientY));
        }
        if (!animationActive && ripples.length > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ripples.forEach((r, idx) => {
                r.update();
                r.draw();
                if (r.alpha <= 0) ripples.splice(idx, 1);
            });
        }
    }
}

// Automatically flushes and drops glitter trails out when input breaks off screen limits
function clearPointerTrail() {
    ripples.forEach(r => { r.decay = 0.09; });
}

window.addEventListener('mousemove', handlePointerTrail);
window.addEventListener('touchmove', handlePointerTrail, { passive: true });
window.addEventListener('mouseleave', clearPointerTrail);
window.addEventListener('touchend', clearPointerTrail);
window.addEventListener('touchcancel', clearPointerTrail);

// --- REBALANCED PARALLAX FLOWERS ENGINE BLOCK ---
class Flower {
    constructor() {
        this.reset();
        this.y = Math.random() * -canvas.height - 20;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.zLayer = Math.random() * 3 + 1; 
        
        // INCREASING FLOWER PERSPECTIVE SIZES slightly for elegant balance
        const screenFactor = window.innerWidth < 768 ? 6 : 10;
        this.baseSize = Math.random() * (screenFactor - 4) + 4;
        this.size = this.baseSize * (this.zLayer * 0.5); 
        
        this.speedY = (Math.random() * 1.4 + 0.9) * (this.zLayer * 0.6);
        this.speedX = (Math.random() - 0.5) * 0.9;
        this.windForce = 0.5 * (this.zLayer * 0.4); 
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        const colors = ['#ffb7c5', '#ff9ebb', '#ffc0cb', '#fef08a', '#f472b6'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX + this.windForce + (Math.sin(this.y / 40) * 0.6);
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height + 20 || this.x > canvas.width + 20) { this.reset(); }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        if (this.zLayer > 3.0) { ctx.filter = 'blur(1px)'; }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5);
            ctx.ellipse(0, this.size / 2, this.size / 4, this.size / 2, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
        ctx.filter = 'none';
    }
}

// --- INTERACTIVE CONFETTI BURST ---
class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 4 + 3;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 3;
        this.speedX = Math.cos(angle) * velocity;
        this.speedY = Math.sin(angle) * velocity - 2; 
        this.gravity = 0.2;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        const colors = ['#f472b6', '#db2777', '#9333ea', '#a855f7', '#fef08a', '#eab308'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function triggerConfettiBurst() {
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;
    for (let i = 0; i < 90; i++) {
        confetti.push(new ConfettiParticle(midX, midY));
    }
}

// --- CORE CONTROL ENGINE LOOP ---
function startReveal() {
    if (revealTriggered) return;
    revealTriggered = true;
    
    window.removeEventListener('mousemove', handlePointerTrail);
    window.removeEventListener('touchmove', handlePointerTrail);
    window.removeEventListener('mouseleave', clearPointerTrail);
    window.removeEventListener('touchend', clearPointerTrail);
    window.removeEventListener('touchcancel', clearPointerTrail);
    
    playWhooshSFX();
    playFlowerRustleSFX();
    
    document.getElementById('triggerBtn').classList.add('hide');
    
    if (!animationActive) {
        // INCREASING FLOWER VOLUME COUNT slightly for optimal presentation density
        const count = window.innerWidth < 768 ? 35 : 60;
        for (let i = 0; i < count; i++) { flowers.push(new Flower()); }
        animationActive = true;
        animateMasterScreen();
    }

    setTimeout(() => {
        document.getElementById('mainContainer').classList.add('revealed');
        document.getElementById('nameDisplay').classList.add('show');
        triggerConfettiBurst();
    }, 500);
}

function animateMasterScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ripples.forEach((r, idx) => {
        r.update(); r.draw();
        if (r.alpha <= 0) ripples.splice(idx, 1);
    });

    flowers.sort((a, b) => a.zLayer - b.zLayer);
    flowers.forEach(flower => { flower.update(); flower.draw(); });
    
confetti.forEach((c, idx) => {
c.update(); c.draw();
if (c.alpha <= 0) confetti.splice(idx, 1);
});
requestAnimationFrame(animateMasterScreen);
}
// --- LIVE MESSAGE TAP INTERACTION ---
const messageElement = document.getElementById('messageTap');
if (messageElement) {
messageElement.addEventListener('click', () => {
messageElement.style.opacity = 0;
messageElement.style.transform = 'translateY(5px)';
setTimeout(() => {
currentMsgIndex = (currentMsgIndex + 1) % tapMessages.length;
messageElement.textContent = tapMessages[currentMsgIndex];
messageElement.style.opacity = 1;
messageElement.style.transform = 'translateY(0)';
}, 300);
});
}
const triggerBtn = document.getElementById('triggerBtn');
if (triggerBtn) {
triggerBtn.addEventListener('click', startReveal);
triggerBtn.addEventListener('touchstart', startReveal, { passive: true });
}