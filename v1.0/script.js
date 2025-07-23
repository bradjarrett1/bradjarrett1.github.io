
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

let selectedDuration = 120;
let selectedMusic = 'gentle-piano';
let pace = 5;
let timerInterval;
let breathingInterval;
let remainingTime;
let paused = false;

const audio = {
    'gentle-piano': new Audio('assets/audio/gentle-piano.mp3'),
    'river-sounds': new Audio('assets/audio/river-sounds.mp3'),
    'ambient-chimes': new Audio('assets/audio/ambient-chimes.mp3')
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
        // Play a sample
        Object.values(audio).forEach(a => a.pause());
        audio[selectedMusic].currentTime = 0;
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
    clearInterval(breathingInterval);
    audio[selectedMusic].pause();
    audio[selectedMusic].currentTime = 0;
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
        clearInterval(breathingInterval);
    } else {
        audio[selectedMusic].play();
        startBreathingAnimation(true);
    }
});


function startBreathingAnimation(resumed = false) {
    const square = document.querySelector('.breathing-square');
    const squareSize = square.offsetWidth;
    const dotSize = pacerDot.offsetWidth;
    let phase = 0; // 0: inhale, 1: hold, 2: exhale, 3: hold
    let phaseProgress = 0;
    const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'];
    const sideDuration = pace * 1000;

    // If resuming, determine current phase and progress
    if (resumed) {
        // This is a simplified resume, a more accurate one would need to store phase and progress
    }


    const animate = () => {
        if (paused) return;

        phaseProgress += 10; // update every 10ms

        let x = 0;
        let y = 0;
        const progress = phaseProgress / sideDuration;

        switch (phase) {
            case 0: // Inhale (bottom-left to top-left)
                x = 0;
                y = squareSize - (squareSize * progress);
                phaseText.textContent = phases[phase];
                break;
            case 1: // Hold (top-left to top-right)
                x = squareSize * progress;
                y = 0;
                phaseText.textContent = phases[phase];
                break;
            case 2: // Exhale (top-right to bottom-right)
                x = squareSize;
                y = squareSize * progress;
                phaseText.textContent = phases[phase];
                break;
            case 3: // Hold (bottom-right to bottom-left)
                x = squareSize - (squareSize * progress);
                y = squareSize;
                phaseText.textContent = phases[phase];
                break;
        }

        pacerDot.style.left = `${x - (dotSize / 2)}px`;
        pacerDot.style.top = `${y - (dotSize / 2)}px`;


        if (phaseProgress >= sideDuration) {
            phaseProgress = 0;
            phase = (phase + 1) % 4;
        }
    }

    breathingInterval = setInterval(animate, 10);
}
