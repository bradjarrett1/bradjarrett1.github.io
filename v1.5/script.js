
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const configPage = document.getElementById('config-page');
    const breathingPage = document.getElementById('breathing-page');
    const completionPage = document.getElementById('completion-page');

    const startBtn = document.getElementById('start-btn');
    const paceSlider = document.getElementById('pace-slider');
    const paceValue = document.getElementById('pace-value');
    const durationBtns = document.querySelectorAll('.duration-btn');
    const musicBtns = document.querySelectorAll('.music-btn');
    const instructionsToggle = document.getElementById('instructions-toggle');
    const startBreathingBtn = document.getElementById('start-breathing-btn');
    const timeRemainingEl = document.getElementById('time-remaining');
    const pacerDot = document.querySelector('.pacer-dot');
    const phaseText = document.querySelector('.phase-text');
    const phaseCountdown = document.querySelector('.phase-countdown');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const toggleInstructionsBtn = document.getElementById('toggle-instructions-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const breathingSquare = document.querySelector('.breathing-square');

    const borders = {
        top: document.querySelector('.border.top'),
        right: document.querySelector('.border.right'),
        bottom: document.querySelector('.border.bottom'),
        left: document.querySelector('.border.left'),
    };

    // App State
    let config = {
        duration: 120,
        pace: 5,
        music: 'none',
        instructions: false
    };

    let sessionState = {};

    const audio = {
        'gentle-piano': new Audio('../assets/audio/gentle-piano.mp3'),
        'river-sounds': new Audio('../assets/audio/river-sounds.mp3'),
        'ambient-chimes': new Audio('../assets/audio/ambient-chimes.mp3'),
        'phase-inhale': new Audio('../assets/audio/phase-sounds/Inhale.mp3'),
        'phase-hold': new Audio('../assets/audio/phase-sounds/Hold.mp3'),
        'phase-exhale': new Audio('../assets/audio/phase-sounds/Exhale.mp3'),
        'instruction-inhale': new Audio('../assets/audio/spoken-instructions/Inhale Instruction.mp3'),
        'instruction-hold': new Audio('../assets/audio/spoken-instructions/Hold Instruction.mp3'),
        'instruction-exhale': new Audio('../assets/audio/spoken-instructions/Exhale Instruction.mp3'),
    };

    const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'];

    // Event Listeners
    startBtn.addEventListener('click', () => showPage(configPage));
    startBreathingBtn.addEventListener('click', startBreathingSession);
    stopBtn.addEventListener('click', () => {
        stopBreathingSession();
        showPage(completionPage);
    });
    pauseBtn.addEventListener('click', togglePause);
    toggleInstructionsBtn.addEventListener('click', toggleInstructions);
    repeatBtn.addEventListener('click', startBreathingSession);
    mainMenuBtn.addEventListener('click', () => {
        showPage(landingPage);
        const video = document.getElementById('bg-video');
        if (video.paused) {
            video.play();
        }
    });

    paceSlider.addEventListener('input', (e) => {
        config.pace = parseInt(e.target.value, 10);
        paceValue.textContent = config.pace;
    });

    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durationBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            config.duration = parseInt(btn.dataset.duration, 10);
        });
    });

    musicBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            musicBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            config.music = btn.dataset.music;
            if (config.music !== 'none') {
                playSample(config.music);
            }
        });
    });

    instructionsToggle.addEventListener('change', (e) => {
        config.instructions = e.target.checked;
    });

    // Functions
    function showPage(pageToShow) {
        [landingPage, configPage, breathingPage, completionPage].forEach(page => {
            page.style.display = page === pageToShow ? 'flex' : 'none';
        });
    }

    function playSample(music) {
        Object.values(audio).forEach(a => { a.pause(); a.currentTime = 0; });
        if (audio[music]) {
            audio[music].play();
        }
    }

    function cleanupPreviousSession() {
        if (sessionState.animationFrameId) {
            cancelAnimationFrame(sessionState.animationFrameId);
        }
        const existingTrails = document.querySelectorAll('.comet-trail');
        existingTrails.forEach(trail => trail.remove());
    }

    function startBreathingSession() {
        cleanupPreviousSession();
        showPage(breathingPage);

        sessionState = {
            startTime: performance.now(),
            pauseStartTime: 0,
            totalPausedTime: 0,
            isPaused: false,
            animationFrameId: null,
            trail: [],
            lastPhase: -1
        };

        for (let i = 0; i < 15; i++) {
            const t = document.createElement('div');
            t.className = 'comet-trail';
            breathingSquare.appendChild(t);
            sessionState.trail.push(t);
        }

        if (config.music !== 'none') {
            const currentAudio = audio[config.music];
            currentAudio.loop = true;
            currentAudio.currentTime = 0;
            currentAudio.play();
        }

        pauseBtn.textContent = 'Pause';
        sessionState.animationFrameId = requestAnimationFrame(animationLoop);
    }

    function stopBreathingSession() {
        sessionState.isPaused = true; // Effectively stops the loop
        cancelAnimationFrame(sessionState.animationFrameId);
        
        // Stop all sounds except background music
        Object.keys(audio).forEach(key => {
            if (key !== config.music) {
                audio[key].pause();
                audio[key].currentTime = 0;
            }
        });

        if (config.music !== 'none') {
            setTimeout(() => {
                audio[config.music].pause();
            }, 20000);
        }

        cleanupPreviousSession();
    }

    function togglePause() {
        sessionState.isPaused = !sessionState.isPaused;
        if (sessionState.isPaused) {
            sessionState.pauseStartTime = performance.now();
            if (config.music !== 'none') {
                audio[config.music].pause();
            }
            pauseBtn.textContent = 'Resume';
        } else {
            sessionState.totalPausedTime += performance.now() - sessionState.pauseStartTime;
            if (config.music !== 'none') {
                audio[config.music].play();
            }
            pauseBtn.textContent = 'Pause';
            sessionState.animationFrameId = requestAnimationFrame(animationLoop);
        }
    }

    function toggleInstructions() {
        config.instructions = !config.instructions;
        toggleInstructionsBtn.textContent = config.instructions ? 'Mute Instructions' : 'Unmute Instructions';
    }

    function animationLoop(currentTime) {
        if (sessionState.isPaused) return;

        const elapsedTime = currentTime - sessionState.startTime - sessionState.totalPausedTime;
        const remaining = config.duration - Math.floor(elapsedTime / 1000);
        if (remaining <= 0) {
            stopBreathingSession();
            showPage(completionPage);
            return;
        }
        updateTimerDisplay(remaining);

        const sideDuration = config.pace * 1000;
        const totalCycleDuration = sideDuration * 4;
        const cycleProgress = elapsedTime % totalCycleDuration;
        const phase = Math.floor(cycleProgress / sideDuration);
        const phaseProgress = (cycleProgress % sideDuration) / sideDuration;

        updatePacer(phase, phaseProgress);
        updateUI(phase, sideDuration, cycleProgress);

        sessionState.animationFrameId = requestAnimationFrame(animationLoop);
    }

    function updateTimerDisplay(remainingSeconds) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        timeRemainingEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updatePacer(phase, progress) {
        const squareSize = breathingSquare.offsetWidth;
        const dotSize = pacerDot.offsetWidth;
        let x, y;

        switch (phase) {
            case 0: // Inhale (bottom-left to top-left)
                x = 0;
                y = squareSize - (squareSize * progress);
                break;
            case 1: // Hold (top-left to top-right)
                x = squareSize * progress;
                y = 0;
                break;
            case 2: // Exhale (top-right to bottom-right)
                x = squareSize;
                y = squareSize * progress;
                break;
            case 3: // Hold (bottom-right to bottom-left)
                x = squareSize - (squareSize * progress);
                y = squareSize;
                break;
        }

        const pacerX = x - (dotSize / 2);
        const pacerY = y - (dotSize / 2);
        pacerDot.style.transform = `translate(${pacerX}px, ${pacerY}px)`;

        // Update trail
        sessionState.trail.forEach((t, index) => {
            setTimeout(() => {
                t.style.transform = `translate(${pacerX}px, ${pacerY}px)`;
                t.style.opacity = 1 - (index / sessionState.trail.length);
            }, index * 25); // Stagger the trail
        });
    }

    function updateUI(currentPhase, sideDuration, cycleProgress) {
        phaseText.textContent = phases[currentPhase];
        const remainingInPhase = Math.ceil((sideDuration - (cycleProgress % sideDuration)) / 1000);
        phaseCountdown.textContent = remainingInPhase;

        const borderOrder = ['left', 'top', 'right', 'bottom'];
        Object.keys(borders).forEach(key => {
            borders[key].style.opacity = '0.2';
        });
        borders[borderOrder[currentPhase]].style.opacity = '1';

        if (sessionState.lastPhase !== currentPhase) {
            sessionState.lastPhase = currentPhase;
            playPhaseSounds(currentPhase);
        }
    }

    function playPhaseSounds(phase) {
        if (phase === 0) {
            audio['phase-inhale'].play();
            if (config.instructions) audio['instruction-inhale'].play();
        } else if (phase === 1 || phase === 3) {
            audio['phase-hold'].play();
            if (config.instructions) audio['instruction-hold'].play();
        } else if (phase === 2) {
            audio['phase-exhale'].play();
            if (config.instructions) audio['instruction-exhale'].play();
        }
    }

    // Initial setup
    showPage(landingPage);
    paceValue.textContent = config.pace;
    durationBtns[1].classList.add('selected'); // Default to 5 min
    musicBtns[0].classList.add('selected'); // Default to No Music
});
