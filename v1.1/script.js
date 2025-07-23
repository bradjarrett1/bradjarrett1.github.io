const landingPage = document.getElementById('landing-page');
const configPage = document.getElementById('config-page');
const breathingPage = document.getElementById('breathing-page');
const completionPage = document.getElementById('completion-page');

const startBtn = document.getElementById('start-btn');
const paceSlider = document.getElementById('pace-slider');
const paceValue = document.getElementById('pace-value');
const durationBtns = document.querySelectorAll('.duration-btn');
const musicBtns = document.querySelectorAll('.music-btn');
const startBreathingBtn = document.getElementById('start-breathing-btn');
const timeRemainingEl = document.getElementById('time-remaining');
const pacerDot = document.querySelector('.pacer-dot');
const phaseText = document.querySelector('.phase-text');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const repeatBtn = document.getElementById('repeat-btn');
const mainMenuBtn = document.getElementById('main-menu-btn');

const borders = {
    top: document.querySelector('.border.top'),
    right: document.querySelector('.border.right'),
    bottom: document.querySelector('.border.bottom'),
    left: document.querySelector('.border.left'),
};

let selectedDuration = 120;
let selectedMusic = 'gentle-piano';
let pace = 5;
let timerInterval;
let animationFrameId;
let remainingTime;
let paused = false;
let animationState = {};

const audio = {
    'gentle-piano': new Audio('../assets/audio/gentle-piano.mp3'),
    'river-sounds': new Audio('../assets/audio/river-sounds.mp3'),
    'ambient-chimes': new Audio('../assets/audio/ambient-chimes.mp3')
};

// Page Transitions
startBtn.addEventListener('click', () => {
    landingPage.style.display = 'none';
    configPage.style.display = 'flex';
});

startBreathingBtn.addEventListener('click', () => {
    configPage.style.display = 'none';
    breathingPage.style.display = 'flex';
    startBreathingSession();
});

stopBtn.addEventListener('click', () => {
    stopBreathingSession();
    breathingPage.style.display = 'none';
    completionPage.style.display = 'flex';
});

repeatBtn.addEventListener('click', () => {
    completionPage.style.display = 'none';
    breathingPage.style.display = 'flex';
    startBreathingSession();
});

mainMenuBtn.addEventListener('click', () => {
    completionPage.style.display = 'none';
    landingPage.style.display = 'flex';
});


// Config Page Logic
paceSlider.addEventListener('input', (e) => {
    pace = e.target.value;
    paceValue.textContent = pace;
});

durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        durationBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDuration = btn.dataset.duration;
    });
});

musicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        musicBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMusic = btn.dataset.music;
        Object.values(audio).forEach(a => { a.pause(); a.currentTime = 0; });
        audio[selectedMusic].play();
    });
});


// Breathing Page Logic
function startBreathingSession() {
    remainingTime = selectedDuration;
    paused = false;
    pauseBtn.textContent = 'Pause';
    updateTimerDisplay();
    audio[selectedMusic].loop = true;
    audio[selectedMusic].play();
    startTimer();
    startBreathingAnimation();
}

function stopBreathingSession() {
    clearInterval(timerInterval);
    cancelAnimationFrame(animationFrameId);
    audio[selectedMusic].pause();
    audio[selectedMusic].currentTime = 0;
    resetBorders();
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!paused) {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                stopBreathingSession();
                breathingPage.style.display = 'none';
                completionPage.style.display = 'flex';
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timeRemainingEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (paused) {
        audio[selectedMusic].pause();
        cancelAnimationFrame(animationFrameId);
    } else {
        audio[selectedMusic].play();
        startBreathingAnimation(true);
    }
});

function resetBorders() {
    Object.values(borders).forEach(border => border.style.opacity = 0.2);
}

function startBreathingAnimation(isResuming = false) {
    const square = document.querySelector('.breathing-square');
    const squareSize = square.offsetWidth;
    const dotSize = pacerDot.offsetWidth;
    const sideDuration = pace * 1000;
    const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'];
    const trailLength = 15;
    const trail = [];

    let phase = isResuming ? animationState.phase : 0;
    let startTime = isResuming ? (performance.now() - animationState.phaseProgress) : performance.now();
    let lastTime = performance.now();

    for (let i = 0; i < trailLength; i++) {
        const t = document.createElement('div');
        t.className = 'comet-trail';
        square.appendChild(t);
        trail.push(t);
    }

    function animate(currentTime) {
        if (paused) {
            animationState = {
                phase,
                phaseProgress: currentTime - startTime,
                dotPosition: { left: pacerDot.style.left, top: pacerDot.style.top },
                audioTime: audio[selectedMusic].currentTime
            };
            return;
        }

        const elapsedTime = currentTime - startTime;
        const phaseProgress = elapsedTime % sideDuration;
        const currentPhase = Math.floor(elapsedTime / sideDuration) % 4;

        if (phase !== currentPhase) {
            phase = currentPhase;
            startTime = currentTime; // Reset start time for the new phase
            resetBorders();
        }

        let x, y;
        const progress = phaseProgress / sideDuration;

        switch (phase) {
            case 0: // Inhale
                x = 0;
                y = squareSize - (squareSize * progress);
                borders.left.style.opacity = 1;
                break;
            case 1: // Hold
                x = squareSize * progress;
                y = 0;
                borders.top.style.opacity = 1;
                break;
            case 2: // Exhale
                x = squareSize;
                y = squareSize * progress;
                borders.right.style.opacity = 1;
                break;
            case 3: // Hold
                x = squareSize - (squareSize * progress);
                y = squareSize;
                borders.bottom.style.opacity = 1;
                break;
        }

        phaseText.textContent = phases[phase];
        pacerDot.style.left = `${x - (dotSize / 2)}px`;
        pacerDot.style.top = `${y - (dotSize / 2)}px`;

        // Comet Trail
        trail.forEach((t, index) => {
            setTimeout(() => {
                t.style.left = pacerDot.style.left;
                t.style.top = pacerDot.style.top;
                t.style.opacity = 1 - (index / trailLength);
            }, index * 20);
        });


        animationFrameId = requestAnimationFrame(animate);
    }

    if (isResuming) {
        pacerDot.style.left = animationState.dotPosition.left;
        pacerDot.style.top = animationState.dotPosition.top;
        audio[selectedMusic].currentTime = animationState.audioTime;
    }

    animationFrameId = requestAnimationFrame(animate);
}