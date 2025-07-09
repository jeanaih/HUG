// Store selected mode and bunny count globally
window.GAME_MODE = {
  mode: null,
  bunnyCount: 0
};

// Store player name globally
window.PLAYER_NAME = "";

// --- SOUND EFFECTS & MUSIC ---
const SOUNDS = {
  bgm: new Audio('audio/bgmusic loop.mp3'),
  click: new Audio('audio/start.mp3'), // Start button
  mode: new Audio('audio/game mode.wav'), // Mode select
  hug: new Audio('audio/hug.mp3'), // Bunny hug
  win: new Audio('audio/itp-hooray.mp3'), // Win/mission complete (use hooray for win)
  gameover: new Audio('audio/gameover.mp3'), // Game over
  share: new Audio('audio/start.mp3'), // Share/copy link (reuse start)
  coffee: new Audio('audio/coffee.mp3'), // Coffee modal open
  close: new Audio('audio/coffee.mp3'), // Modal close (reuse coffee)
  walk: new Audio('audio/walk.mp3'), // Walking sound
  tutorial: new Audio('audio/tutorialbutton.mp3') // Tutorial button sound
};
// Loop background music and walking sound
SOUNDS.bgm.loop = true;
SOUNDS.walk.loop = true;
SOUNDS.bgm.volume = 0.15; // Lower BGM volume
SOUNDS.walk.volume = 0.8; // Increase walk volume
SOUNDS.hug.volume = 0.8;
SOUNDS.win.volume = 1.0; // Full volume for hooray
SOUNDS.gameover.volume = 0.8;

// Start background music after user interaction (required by browsers)
let bgmStarted = false;

// Enhance BGM start function for better autoplay handling
function startBGM() {
  if (!bgmStarted) {
    // Reset and configure BGM
    SOUNDS.bgm.currentTime = 0;
    SOUNDS.bgm.loop = true;
    SOUNDS.bgm.volume = 0.15; // Adjust volume to not be too loud

    // Function to actually start playback
    const playBGM = () => {
      const promise = SOUNDS.bgm.play();
      if (promise !== undefined) {
        promise.then(() => {
          bgmStarted = true;
          console.log('BGM started successfully');
        }).catch(error => {
          // If autoplay fails, we'll rely on user interaction to start
          console.log('Autoplay prevented:', error);
        });
      }
    };

    // Try to play immediately if loaded, otherwise wait for load
    if (SOUNDS.bgm.readyState >= 3) {
      playBGM();
    } else {
      SOUNDS.bgm.addEventListener('canplaythrough', playBGM, { once: true });
      SOUNDS.bgm.load();
    }
  }
}

// Try to start BGM as soon as possible
document.addEventListener('DOMContentLoaded', startBGM);

// Fallback for browsers that block autoplay
document.addEventListener('click', startBGM, { once: true });
document.addEventListener('touchstart', startBGM, { once: true });
document.addEventListener('keydown', startBGM, { once: true });

function showModeOverlay() {
  document.body.classList.add('mode-selecting');
  const overlay = document.querySelector('.mode-overlay');
  overlay.style.display = 'flex';
  // Hide start overlay while mode is picked
  document.querySelector('.start-overlay').style.display = 'none';
  // Hide end message if visible
  const endMsg = document.querySelector('.end-message');
  if (endMsg) endMsg.classList.add('d-none');
}

function hideModeOverlay() {
  document.body.classList.remove('mode-selecting');
  document.querySelector('.mode-overlay').style.display = 'none';
}

function playLoadingAnimation(onDone) {
  // Start background music as soon as loading starts
  startBGM();

  const overlay = document.querySelector('.loading-overlay');
  const bear = overlay.querySelector('.loading-bear.sprite-container');
  const bunny = overlay.querySelector('.loading-bunny.sprite-container');
  const barFill = overlay.querySelector('.loading-bar-fill');
  const barBg = overlay.querySelector('.loading-bar-bg');

  overlay.style.display = 'flex';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '100002';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.minWidth = '100vw';
  overlay.style.minHeight = '100vh';
  document.body.style.overflow = 'hidden';

  // Reset bunny and bear state for loading hug animation
  bunny.className = 'loading-bunny sprite-container sad';
  bear.className = 'loading-bear sprite-container';
  barFill.style.width = '0%';
  // Reset opacity in case it was faded out previously
  bear.style.opacity = '';
  bunny.style.opacity = '';
  barFill.style.opacity = '';
  barBg.style.opacity = '';

  // Animate loading bar
  let duration = 1800; // match CSS animation duration
  let start = null;
  function animateBar(ts) {
    if (!start) start = ts;
    let elapsed = ts - start;
    let percent = Math.min(elapsed / duration, 1);
    barFill.style.width = (percent * 100) + '%';
    if (percent < 1) {
      requestAnimationFrame(animateBar);
    }
  }
  requestAnimationFrame(animateBar);

  // Step 1: Bear walks to bunny (handled by CSS animation)
  // Step 2: Trigger hug animation (like in-game: add hug-bear-bunny class)
  setTimeout(() => {
    bunny.className = 'loading-bunny sprite-container hug-bear-bunny';
    // Step 3: After hug, fade out both bear, bunny, and HP bar for smooth finish
    setTimeout(() => {
      overlay.classList.add('hide');
      bear.style.opacity = '0';
      bunny.style.opacity = '0';
      barFill.style.opacity = '0';
      barBg.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        // Reset opacity for next time
        bear.style.opacity = '';
        bunny.style.opacity = '';
        barFill.style.opacity = '';
        barBg.style.opacity = '';
        if (typeof onDone === 'function') onDone();
      }, 600);
    }, 1300); // match hug duration + a bit for smoothness
  }, 1200);
}

// --- PAUSE FEATURE ---
let isPaused = false;
let pauseBefore = {};
function showPauseModal() {
  if (isPaused) return;
  isPaused = true;
  // Pause timer
  if (typeof stopTimer === 'function') stopTimer();
  // Pause walk sound
  if (typeof stopWalkSound === 'function') stopWalkSound();
  // Pause all bunny walking intervals
  if (window._pauseBunnyIntervals) window._pauseBunnyIntervals();
  // Pause player walking
  if (window._pausePlayerInterval) window._pausePlayerInterval();
  // Blur game UI
  document.body.classList.add('game-paused');
  document.querySelector('.pause-modal').style.display = 'flex';
}
function hidePauseModal() {
  if (!isPaused) return;
  isPaused = false;
  document.body.classList.remove('game-paused');
  document.querySelector('.pause-modal').style.display = 'none';
  // Resume timer
  if (typeof startTimer === 'function') startTimer();
  // Resume bunny walking intervals
  if (window._resumeBunnyIntervals) window._resumeBunnyIntervals();
  // Resume player walking
  if (window._resumePlayerInterval) window._resumePlayerInterval();
}

// Patch bunny/player interval pause/resume (for robustness)
window._pauseBunnyIntervals = function () {
  if (!window._bunnyIntervals) window._bunnyIntervals = [];
  document.querySelectorAll('.sprite-container.sad').forEach(el => {
    if (el._interval) {
      window._bunnyIntervals.push({ el, timer: el._interval });
      clearInterval(el._interval);
      el._interval = null;
    }
  });
};
window._resumeBunnyIntervals = function () {
  if (!window._bunnyIntervals) return;
  window._bunnyIntervals.forEach(({ el, timer }) => {
    if (!el._interval && typeof timer === 'number') {
      el._interval = setInterval(() => { }, 999999); // dummy, real bunny walk will restart on next move
    }
  });
  window._bunnyIntervals = [];
};
window._pausePlayerInterval = function () {
  if (window._playerInterval) {
    clearInterval(window._playerInterval);
    window._playerInterval = null;
  }
};
window._resumePlayerInterval = function () {
  // No-op, player interval resumes on input
};

function init() {

  const elements = {
    wrapper: document.querySelector('.wrapper'),
    mapCover: document.querySelector('.map-cover'),
    indicator: document.querySelector('.indicator'),
    player: document.querySelector('.player'),
    bunnyRadar: document.querySelector('.circle'),
    bunnyPos: [],
    endMessage: document.querySelector('.end-message'),
    button: document.querySelector('button'),
    joystickBase: document.querySelector('.joystick-base'),
    joystickStick: document.querySelector('.joystick-stick'),
    controlButtons: document.querySelectorAll('.control-btn'),
    playerNameDisplay: document.querySelector('.player-name-display')
  }

  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const distanceBetween = (a, b) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)))
  const randomN = max => Math.ceil(Math.random() * max)
  const px = n => `${n}px`
  const setPos = ({ el, x, y }) => Object.assign(el.style, { left: `${x}px`, top: `${y}px` })

  const setSize = ({ el, w, h, d }) => {
    const m = d || 1
    if (w) el.style.width = px(w * m)
    if (h) el.style.height = px(h * m)
  }

  const player = {
    id: 'bear',
    x: 0, y: 0,
    z: 0, // add z-index property for player
    frameOffset: 1,
    animationTimer: null,
    el: elements.player,
    sprite: {
      el: document.querySelector('.player').childNodes[1],
      x: 0, y: 0
    },
    walkingDirection: '',
    walkingInterval: null,
    pause: false,
    buffer: 20,
    move: { x: 0, y: 0 }
  }

  const settings = {
    d: 20,
    offsetPos: {
      x: 0, y: 0,
    },
    elements: [],
    bunnies: [],
    map: {
      el: document.querySelector('.map'),
      walls: [],
      w: 20 * 200,
      h: 20 * 200,
      x: 0, y: 0,
    },
    transitionTimer: null,
    isWindowActive: true,
    controlPos: { x: 0, y: 0 },
    bunnyRadarSize: 0,
    sadBunnies: []
  }

  const resizeBunnyRadar = () => {
    const { innerWidth: w, innerHeight: h } = window
    const size = w > h ? h : w
    settings.bunnyRadarSize = size - 20
      ;['width', 'height'].forEach(param => {
        elements.bunnyRadar.style[param] = px(settings.bunnyRadarSize)
      })
  }

  const triggerBunnyWalk = bunny => {
    bunny.animationTimer = setInterval(() => {
      if (!settings.isWindowActive) return
      const dir = ['up', 'down', 'right', 'left'][Math.floor(Math.random() * 4)]
      const { d } = settings

      bunny.move = {
        down: { x: 0, y: d },
        up: { x: 0, y: -d },
        right: { x: d, y: 0 },
        left: { x: -d, y: 0 }
      }[dir]

      walk(bunny, dir)
      setTimeout(() => walk(bunny, dir), 300)
      setTimeout(() => walk(bunny, dir), 600)
      setTimeout(() => stopSprite(bunny), 900)
    }, 2000)
  }

  const getRandomPos = key => 20 * randomN((settings.map[key] / 20) - 1)

  const addBunny = () => {
    const bunny = {
      id: `bunny-${settings.bunnies.length + 1}`,
      x: getRandomPos('w'), y: getRandomPos('h'),
      frameOffset: 1,
      animationTimer: null,
      el: Object.assign(document.createElement('div'),
        {
          className: 'sprite-container sad',
          innerHTML: '<div class="bunny sprite"></div>'
        }),
      sprite: {
        el: null,
        x: 0, y: 0
      },
      sad: true,
      buffer: 30,
    }
    settings.bunnies.push(bunny);
    // Add to global for sad thoughts loop
    if (!window._bunnyList) window._bunnyList = [];
    window._bunnyList.push(bunny);
    settings.map.el.appendChild(bunny.el)
    bunny.sprite.el = bunny.el.childNodes[0]
    bunny.el.style.zIndex = bunny.y
    setPos(bunny)
    if (randomN(2) === 2) triggerBunnyWalk(bunny)
  }

  const addTree = () => {
    const treeType = randomN(3); // Random number between 1-3
    const tree = {
      id: `tree-${settings.elements.length + 1}`,
      x: getRandomPos('w'),
      y: getRandomPos('h'),
      el: Object.assign(document.createElement('div'),
        {
          className: `tree tree-type-${treeType}`,
          innerHTML: '<div class="tree-sprite"></div>'
        }),
      buffer: 0, // no blocking
      isObstacle: false, // not an obstacle anymore
      treeType: treeType,
      z: 0 // add z-index property for tree
    }
    settings.elements.push(tree)
    settings.map.el.appendChild(tree.el)
    setPos(tree)
  }

  const addStone = () => {
    const stone = {
      id: `stone-${settings.elements.length + 1}`,
      x: getRandomPos('w'),
      y: getRandomPos('h'),
      el: Object.assign(document.createElement('div'),
        {
          className: 'stone',
          innerHTML: '<div></div>'
        }),
      buffer: 0, // no blocking
      isObstacle: false, // not an obstacle anymore
      z: 0 // add z-index property for stone
    }
    settings.elements.push(stone)
    settings.map.el.appendChild(stone.el)
    setPos(stone)
  }

  const setBackgroundPos = ({ el, x, y }) => {
    el.style.setProperty('--bx', px(x))
    el.style.setProperty('--by', px(y))
  }

  const animateSprite = (actor, dir) => {
    const h = -32 * 2
    actor.sprite.y = {
      down: 0,
      up: h,
      right: h * 2,
      left: h * 3
    }[dir]
    actor.frameOffset = actor.frameOffset === 1 ? 2 : 1
    actor.sprite.x = actor.frameOffset * (2 * -20)
    setBackgroundPos(actor.sprite)
  }

  const triggerBunnyMessage = (bunny, classToAdd) => {
    // Remove any previous chat bubble
    let oldBubble = bunny.el.querySelector('.bunny-chat-bubble');
    if (oldBubble) oldBubble.remove();

    // Bunny happy responses
    const happyResponses = [
      'thanks!',
      'Salamat Bossing!',
      'yeah!',
      'thank you!',
      'Bossing!'
    ];

    // Bunny sad thoughts/problems
    const sadThoughts = [
      "Mga manloloko 😭",
      "I miss u 🥲",
      "Balik ka na!! 😭",
      "Di pa ba sapat 😭",
      "Ako nalang kasi",
      "Wala na ba talagang pag-asa?",
      "Bakit ganon...",
      "Sana all may ka-hug",
      "Napagod na ako",
      "Puyat na naman ako",
      "Hindi ako pinili",
      "Ang lungkot ko",
      "Kailan kaya ako magiging masaya?",
      "Sana masaya ka na",
      "Iniwan na naman ako",
      "Walang nagmamahal sakin",
      "Sana may mag-hug sakin",
      "Bakit ako nalang lagi?",
      "Kulang pa ba?",
      "Sana bumalik ka"
    ];

    // Show happy response if bunny is happy, else sad thought
    let msg;
    if (!bunny.sad) {
      msg = happyResponses[Math.floor(Math.random() * happyResponses.length)];
    } else {
      msg = sadThoughts[Math.floor(Math.random() * sadThoughts.length)];
    }

    // Create chat bubble (top of bunny)
    const bubble = document.createElement('div');
    bubble.className = 'bunny-chat-bubble';
    bubble.innerHTML = `<span class="bunny-chat-text">${msg}</span>`;
    bubble.style.position = 'absolute';
    bubble.style.left = '50%';
    bubble.style.top = '-90px';
    bubble.style.transform = 'translateX(-50%)';
    bubble.style.background = bunny.sad ? '#ffe9b3' : '#fff7fa';
    bubble.style.border = '2px solid #b7e3b0';
    bubble.style.borderRadius = '12px';
    bubble.style.padding = '7px 16px';
    bubble.style.fontFamily = "'Press Start 2P', Arial, sans-serif";
    bubble.style.fontSize = '13px';
    bubble.style.color = bunny.sad ? '#b97a56' : '#36a36a';
    bubble.style.boxShadow = '0 2px 8px #b7e3b0, 0 0 0 2px #e6f9e0';
    bubble.style.zIndex = '100';
    bubble.style.pointerEvents = 'none';
    bubble.style.animation = 'bunny-bubble-pop 0.18s cubic-bezier(.77,0,.18,1)';

    // Add hearts around bunny only if happy
    if (!bunny.sad) {
      const heartPositions = [
        { left: '50%', top: '-38px', transform: 'translate(-50%, -100%)' }, // top
        { left: '10%', top: '-18px', transform: 'translate(-50%, -100%)' }, // top-left
        { left: '90%', top: '-18px', transform: 'translate(-50%, -100%)' }, // top-right
        { left: '0%', top: '10px', transform: 'translate(-50%, 0)' },       // left
        { left: '100%', top: '10px', transform: 'translate(-50%, 0)' },     // right
        { left: '50%', top: '44px', transform: 'translate(-50%, 0)' }       // bottom
      ];
      heartPositions.forEach((pos, i) => {
        const heart = document.createElement('span');
        heart.textContent = '💖';
        heart.className = 'bunny-heart-effect';
        heart.style.position = 'absolute';
        heart.style.left = pos.left;
        heart.style.top = pos.top;
        heart.style.transform = pos.transform;
        heart.style.fontSize = '15px';
        heart.style.opacity = '0.85';
        heart.style.pointerEvents = 'none';
        heart.style.animation = `bunny-heart-float 1.2s ${0.08 * i}s cubic-bezier(.77,0,.18,1) forwards`;
        bunny.el.appendChild(heart);
        setTimeout(() => { heart.remove(); }, 1200);
      });
    }

    // Insert bubble into bunny.el
    bunny.el.appendChild(bubble);

    // Remove bubble after animation
    setTimeout(() => {
      bubble.remove();
    }, 1200);

    // Old class-based animation for happy
    if (!bunny.sad && classToAdd) {
      bunny.el.classList.add(classToAdd);
      setTimeout(() => {
        bunny.el.classList.remove(classToAdd);
      }, 800);
    }
  };

  // --- Make sad bunnies express their thoughts every 5 seconds, staggered ---
  (function bunnySadThoughtsLoop() {
    function scheduleSadThoughts() {
      if (!window._bunnyList) return;
      const sadBunnies = window._bunnyList.filter(b => b.sad);
      sadBunnies.forEach((bunny, idx) => {
        // Clear any previous interval
        if (bunny._sadThoughtInterval) clearInterval(bunny._sadThoughtInterval);
        // Stagger: each bunny starts after idx * 800ms, then every 5s
        setTimeout(() => {
          triggerBunnyMessage(bunny, '');
          bunny._sadThoughtInterval = setInterval(() => {
            if (bunny.sad) triggerBunnyMessage(bunny, '');
          }, 5000);
        }, idx * 800);
      });
    }
    // Run on spawn and whenever a bunny is hugged (to update intervals)
    setInterval(scheduleSadThoughts, 6000);
    // Also run once on load
    setTimeout(scheduleSadThoughts, 1000);
  })();

  const updateSadBunnyCount = () => {
    const sadBunnyCount = settings.bunnies.filter(b => b.sad).length;
    const huggedCount = settings.bunnies.length - sadBunnyCount;

    elements.indicator.innerHTML = sadBunnyCount ? `x ${sadBunnyCount}` : '';

    if (!sadBunnyCount) {
      stopTimer();
      timerEl.style.display = 'none';
      showEndStats(huggedCount, timeUsed);
      elements.indicator.classList.add('happy');
    }
  }

  function showEndStats(huggedCount, timeUsed) {
    const endMsg = elements.endMessage;
    endMsg.classList.remove('d-none');

    const timeStr = formatTime(timeUsed);
    const msgP = endMsg.querySelector('p');
    // Get mode label
    const modeLabel = (window.GAME_MODE && window.GAME_MODE.mode)
      ? window.GAME_MODE.mode.charAt(0).toUpperCase() + window.GAME_MODE.mode.slice(1)
      : 'Easy';

    msgP.innerHTML = `
      <div style="background:#e6f9e0;padding:20px 12px 12px 12px;border-radius:8px;width:320px;max-width:90vw;margin:0 auto;box-shadow:0 0 0 4px #b7e3b0,0 0 0 8px #e6f9e0;">
        <div style="font-size:24px;color:#36a36a;margin-bottom:16px;text-shadow:2px 2px 0 #fff;">
          🎉 Mission Complete!
        </div>
        <div style="font-size:13px;color:#57280f;margin-bottom:8px;">
          <b>Game Mode:</b> <span style="color:#0084ff">${modeLabel}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;margin:12px 0;font-size:14px;color:#57280f;">
          <div style="padding:8px;background:#fff;border-radius:6px;border:2px solid #b7e3b0;">
            <div style="font-size:12px;color:#9ab49a;">Time</div>
            <div style="font-size:18px;margin-top:4px;color:#36a36a;">${timeStr}</div>
          </div>
          <div style="padding:8px;background:#fff;border-radius:6px;border:2px solid #b7e3b0;">
            <div style="font-size:12px;color:#9ab49a;">Bunnies Hugged</div>
            <div style="font-size:18px;margin-top:4px;color:#36a36a;">${huggedCount}</div>
          </div>
        </div>
        <div class="copy-success" style="display:none;margin-top:10px;color:#36a36a;font-size:13px;font-family:'Press Start 2P',Arial,sans-serif;">Link copied!</div>
      </div>
    `;

    SOUNDS.win.currentTime = 0; SOUNDS.win.play();

    endMsg.querySelector('.end-actions').innerHTML = `
      <div class="end-action-btn">
        <button class="play-again-btn icon-btn" title="Play Again">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#57280f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5,3 19,12 5,21 5,3" fill="#b7e3b0" stroke="#57280f"/>
            </svg>
          </span>
        </button>
        <div class="end-action-label">Play Again</div>
      </div>
      <div class="end-action-btn">
        <button class="coffee-btn icon-btn" title="Buy Me a Coffee">
          <span>
            <img src="images/coffee.png" alt="Buy Me a Coffee" style="width:28px;height:28px;border-radius:50%;object-fit:cover;"/>
          </span>
        </button>
        <div class="end-action-label">Buy Me a Coffee</div>
      </div>
      <div class="end-action-btn">
        <button class="share-btn icon-btn" title="Copy Link">
          <span>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#0084ff"/>
              <g>
                <path d="M14 8V20" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M9 13l5-5 5 5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </g>
            </svg>
          </span>
        </button>
        <div class="end-action-label">Copy Link</div>
      </div>
    `;

    // Share button: copy link to clipboard and show success message
    const shareBtn = endMsg.querySelector('.share-btn');
    const copySuccess = endMsg.querySelector('.copy-success');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText('https://jeanaih.github.io/HUG/');
          shareBtn.title = "Copied!";
          shareBtn.classList.add('copied');
          SOUNDS.share.currentTime = 0; SOUNDS.share.play();
          if (copySuccess) {
            copySuccess.style.display = "block";
          }
          setTimeout(() => {
            shareBtn.title = "Copy Link";
            shareBtn.classList.remove('copied');
            if (copySuccess) {
              copySuccess.style.display = "none";
            }
          }, 1200);
        } catch (err) {
          alert('Failed to copy link.');
        }
      });
    }

    // Add coffee button click handler
    endMsg.querySelector('.coffee-btn').addEventListener('click', () => {
      SOUNDS.coffee.currentTime = 0;
      SOUNDS.coffee.play();
      document.querySelector('.coffee-modal').style.display = 'flex';
    });

    // Play Again handler only (no change mode)
    endMsg.querySelector('.play-again-btn').addEventListener('click', () => {
      SOUNDS.win.currentTime = 0; SOUNDS.win.play();
      location.reload();
    });

    // --- Achievements/Leaderboard: Dispatch win event for stats update ---
    setTimeout(() => {
      try {
        const name = (window.PLAYER_NAME || '').trim();
        const event = new CustomEvent('hugBunnyGameWin', {
          detail: { name, hugs: huggedCount }
        });
        window.dispatchEvent(event);
      } catch (e) { }
    }, 500);
  }

  const hugBunny = bunny => {
    const classToAdd = bunny.x > player.x ? 'hug-bear-bunny' : 'hug-bunny-bear'
    player.el.classList.add('d-none')
    bunny.el.classList.add(classToAdd)
    clearInterval(bunny.animationTimer)
    player.pause = true
    bunny.sad = false

    SOUNDS.hug.currentTime = 0; SOUNDS.hug.play();

    player.y = bunny.y
    if (classToAdd === 'hug-bear-bunny') {
      player.x = bunny.x - 40
      animateSprite(player, 'right')
      animateSprite(bunny, 'left')
    } else {
      player.x = bunny.x + 40
      animateSprite(player, 'left')
      animateSprite(bunny, 'right')
    }
    positionMap()
    settings.map.el.classList.add('slow-transition')
    setPos(settings.map)
    player.el.parentNode.style.zIndex = player.y

    setTimeout(() => {
      player.el.classList.remove('d-none')
        ;[classToAdd, 'sad'].forEach(c => bunny.el.classList.remove(c))
      stopSprite(bunny)
      triggerBunnyWalk(bunny)
      player.pause = false
      settings.map.el.classList.remove('slow-transition')
      triggerBunnyMessage(bunny, classToAdd === 'hug-bear-bunny' ? 'happy-left' : 'happy-right')
      updateSadBunnyCount();
      // Play win sound if last bunny
      if (settings.bunnies.filter(b => b.sad).length === 0) {
        SOUNDS.win.currentTime = 0; SOUNDS.win.play();
      }
    }, 1800)
  }

  const noWall = actor => {
    const newPos = { ...actor }
    newPos.x += actor.move.x
    newPos.y += actor.move.y

    // Check bunny hugging first
    if (actor === player && !player.pause) {
      const bunnyToHug = settings.bunnies.find(el =>
        el.sad &&
        el.id !== actor.id &&
        distanceBetween(el, newPos) <= el.buffer
      )
      if (bunnyToHug) {
        hugBunny(bunnyToHug)
        stopSprite(player)
        return
      }
    }

    // Remove tree and stone collision checks

    // Prevent bunnies from overlapping each other
    if (actor !== player) {
      const hasBunnyCollision = settings.bunnies
        .filter(el => el.id !== actor.id)
        .some(el => distanceBetween(el, newPos) <= el.buffer)
      if (hasBunnyCollision) return false
    }

    // Check map boundaries
    const buffer = 40
    const noWallX = actor.move.x > 0
      ? newPos.x + buffer < settings.map.w
      : newPos.x - buffer > 0
    const noWallY = actor.move.y > 0
      ? newPos.y < settings.map.h - buffer
      : newPos.y - buffer > 0

    return noWallX && noWallY
  }

  // Helper to update z-index for player and trees/stones based on vertical overlap with tree's upper part
  const updateZIndexes = () => {
    // Trees and stones
    settings.elements.forEach(el => {
      if (el.el.classList.contains('tree') || el.el.classList.contains('stone')) {
        el.el.style.zIndex = el.y; // default: z-index by y
      }
    });

    // Player z-index logic for trees: if player is standing on the upper part of any tree, player goes behind
    let playerZ = player.y;
    let isBehindTree = false;
    settings.elements.forEach(el => {
      if (el.el.classList.contains('tree')) {
        // Tree sprite size (CSS): width 32px, height 48px, but visually, upper part is top 24px
        // We'll use ±16px for x overlap, and y < tree.y - 8 for upper part (adjust as needed)
        const treeWidth = 32, treeHeight = 48, upperPart = 24;
        if (
          Math.abs(player.x - el.x) < treeWidth / 2 &&
          player.y < el.y - (treeHeight / 2) + upperPart // player is on upper part of tree
        ) {
          isBehindTree = true;
          // Set player z-index just behind this tree
          playerZ = el.y - 2;
        }
      }
    });
    player.el.parentNode.style.zIndex = playerZ;
  };

  // --- WALKING SOUND LOGIC ---
  let walkSoundPlaying = false;
  function playWalkSound() {
    if (!walkSoundPlaying) {
      SOUNDS.walk.currentTime = 0;
      SOUNDS.walk.play();
      walkSoundPlaying = true;
    }
  }
  function stopWalkSound() {
    if (walkSoundPlaying) {
      SOUNDS.walk.pause();
      SOUNDS.walk.currentTime = 0;
      walkSoundPlaying = false;
    }
  }

  const walk = (actor, dir) => {
    if (!dir || player.pause || !settings.isWindowActive) return
    if (noWall(actor)) {
      animateSprite(actor, dir)
      actor.x += actor.move.x
      actor.y += actor.move.y
      if (actor === player) {
        positionMap()
        setPos(settings.map)
        updateZIndexes()
        playWalkSound();
      } else {
        setPos(actor)
        actor.el.style.zIndex = actor.y
      }
    } else {
      stopSprite(actor)
    }
  }

  const updateOffset = () => {
    const { width, height } = elements.wrapper.getBoundingClientRect()
    settings.offsetPos = {
      x: (width / 2),
      y: (height / 2),
    }
  }

  const positionMap = () => {
    settings.map.x = settings.offsetPos.x - player.x
    settings.map.y = settings.offsetPos.y - player.y
    // Position name above player, always centered and higher
    if (elements.playerNameDisplay && player.el) {
      // Player's center in map coordinates
      const bearWidth = 40; // adjust if bear sprite width changes
      const nameOffsetY = 38; // raise higher above bear (was 18)
      const playerX = player.x + settings.map.x;
      const playerY = player.y + settings.map.y;
      // Move name a bit more to the left (subtract a few more px)
      elements.playerNameDisplay.style.left = `${playerX + bearWidth / 2 - 16}px`;
      elements.playerNameDisplay.style.top = `${playerY - nameOffsetY}px`;
      elements.playerNameDisplay.style.transform = 'translate(-50%, -100%)';
    }
  }

  const resizeAndRepositionMap = () => {
    settings.map.el.classList.add('transition')
    clearTimeout(settings.transitionTimer)
    settings.transitionTimer = setTimeout(() => {
      settings.map.el.classList.remove('transition')
    }, 500)
    updateOffset()
    positionMap()
    setPos(settings.map)
  }

  const stopSprite = actor => {
    actor.sprite.x = 0
    setBackgroundPos(actor.sprite)
    clearInterval(actor.walkingInterval)
    if (actor === player) stopWalkSound();
  }

  const handleWalk = () => {
    let dir = 'right'
    const { d } = settings

    player.walkingInterval = setInterval(() => {
      if (Math.abs(player.y - settings.controlPos.y) > 20) {
        player.move.y = player.y > settings.controlPos.y ? -d : d
        dir = player.move.y === -d ? 'up' : 'down'
      } else {
        player.move.y = 0
      }
      if (Math.abs(player.x - settings.controlPos.x) > 20) {
        player.move.x = player.x > settings.controlPos.x ? -d : d
        dir = player.move.x === -d ? 'left' : 'right'
      } else {
        player.move.x = 0
      }

      player.move.x || player.move.y
        ? walk(player, dir)
        : stopSprite(player)
    }, 150)
  }

  const keys = {
    w: false,
    a: false,
    s: false,
    d: false
  }

  document.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
      keys[e.key.toLowerCase()] = true
      handleWASDWalk()
    }
  })

  document.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
      keys[e.key.toLowerCase()] = false
      handleWASDWalk()
    }
  })

  const handleWASDWalk = () => {
    stopSprite(player)
    let dir = null
    const { d } = settings

    player.move.x = 0
    player.move.y = 0

    if (keys.w || keys.s || keys.a || keys.d) {
      if (keys.w) {
        player.move.y = -d
        dir = 'up'
      } else if (keys.s) {
        player.move.y = d
        dir = 'down'
      }

      if (keys.a) {
        player.move.x = -d
        dir = 'left'
      } else if (keys.d) {
        player.move.x = d
        dir = 'right'
      }

      if ((keys.w || keys.s) && (keys.a || keys.d)) {
        player.move.x *= 0.707
        player.move.y *= 0.707
      }
    }

    if (dir) {
      clearInterval(player.walkingInterval)
      player.walkingInterval = setInterval(() => walk(player, dir), 150)
      walk(player, dir)
      playWalkSound();
    } else {
      stopWalkSound();
    }
  }

  let isDragging = false

  const handleJoystick = (e) => {
    if (!isDragging) return

    const touch = e.touches ? e.touches[0] : e
    const bounds = elements.joystickBase.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2

    let x = touch.clientX - centerX
    let y = touch.clientY - centerY

    const distance = Math.sqrt(x * x + y * y)
    const maxDistance = bounds.width / 2

    // Calculate speed multiplier based on joystick distance
    let speedMultiplier = 1; // Default walking speed
    if (distance > maxDistance * 0.85) {
      speedMultiplier = 3; // Sprint speed (85-100% distance)
    } else if (distance > maxDistance * 0.6) {
      speedMultiplier = 2; // Run speed (60-85% distance)
    } else if (distance > maxDistance * 0.3) {
      speedMultiplier = 1.5; // Jog speed (30-60% distance)
    }

    const { d } = settings
    const speed = d * speedMultiplier

    if (distance > maxDistance) {
      x = (x / distance) * maxDistance
      y = (y / distance) * maxDistance
    }

    elements.joystickStick.style.transform = `translate(${x}px, ${y}px)`

    // Update joystick visual feedback based on speed
    const colors = {
      1: 'linear-gradient(135deg, #ffffff, #e6f9e0)',    // Walk
      1.5: 'linear-gradient(135deg, #e6f9e0, #b7e3b0)',  // Jog
      2: 'linear-gradient(135deg, #ffd700, #ffa500)',    // Run
      3: 'linear-gradient(135deg, #ff4500, #ff0000)'     // Sprint
    }

    elements.joystickStick.style.background = colors[speedMultiplier]

    const angle = Math.atan2(y, x)

    settings.controlPos = {
      x: player.x + Math.cos(angle) * 100,
      y: player.y + Math.sin(angle) * 100
    }

    // Update player movement speed
    player.move = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    }

    if (!player.walkingInterval) {
      handleJoystickMovement()
    }
  }

  const handleJoystickMovement = () => {
    let dir = 'right'

    player.walkingInterval = setInterval(() => {
      if (!isDragging) {
        stopSprite(player)
        return
      }

      // Determine direction based on movement vector
      if (Math.abs(player.move.y) > Math.abs(player.move.x)) {
        dir = player.move.y < 0 ? 'up' : 'down'
      } else {
        dir = player.move.x < 0 ? 'left' : 'right'
      }

      walk(player, dir)
      playWalkSound();
    }, 150)
  }

  elements.joystickBase.addEventListener('mousedown', () => isDragging = true)
  elements.joystickBase.addEventListener('touchstart', () => isDragging = true)

  document.addEventListener('mousemove', handleJoystick)
  document.addEventListener('touchmove', handleJoystick, { passive: false })

  document.addEventListener('mouseup', () => {
    isDragging = false
    elements.joystickStick.style.transform = 'translate(-50%, -50%)'
    elements.joystickStick.style.background = 'linear-gradient(135deg, #ffffff, #e6f9e0)'
    clearInterval(player.walkingInterval)
    player.walkingInterval = null
    player.move = { x: 0, y: 0 }
    stopSprite(player)
    stopWalkSound();
  })

  document.addEventListener('touchend', () => {
    isDragging = false
    elements.joystickStick.style.transform = 'translate(-50%, -50%)'
    elements.joystickStick.style.background = 'linear-gradient(135deg, #ffffff, #e6f9e0)'
    clearInterval(player.walkingInterval)
    player.walkingInterval = null
    player.move = { x: 0, y: 0 }
    stopSprite(player)
    stopWalkSound();
  })

  elements.controlButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.controlButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const controlType = btn.dataset.control;
      if (controlType === 'joystick') {
        elements.joystickBase.classList.add('active');
      } else {
        elements.joystickBase.classList.remove('active');
      }
    });
  });

  // --- Detect mobile and set joystick as default ---
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth <= 900 && 'ontouchstart' in window);
  }

  // --- Set joystick as default if on mobile ---
  if (isMobileDevice()) {
    // Activate joystick control
    elements.controlButtons.forEach(b => b.classList.remove('active'));
    const joystickBtn = Array.from(elements.controlButtons).find(b => b.dataset.control === 'joystick');
    if (joystickBtn) {
      joystickBtn.classList.add('active');
    }
    elements.joystickBase.classList.add('active');
  }

  const toolBtn = document.querySelector('.tool-btn');
  const controlMenu = document.querySelector('.control-menu');

  toolBtn.addEventListener('click', () => {
    controlMenu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-controls')) {
      controlMenu.classList.remove('show');
    }
  });

  player.x = getRandomPos('w')
  player.y = getRandomPos('h')
  player.el.style.zIndex = player.y
  setSize(settings.map)

  // Set player name display if available
  if (window.PLAYER_NAME && elements.playerNameDisplay) {
    elements.playerNameDisplay.textContent = window.PLAYER_NAME;
    elements.playerNameDisplay.style.display = 'block';
  } else if (elements.playerNameDisplay) {
    elements.playerNameDisplay.textContent = '';
    elements.playerNameDisplay.style.display = 'none';
  }

  document.addEventListener('click', e => {
    if (e.target.closest('.mobile-controls')) return

    if (window.innerWidth <= 768 && elements.joystickBase.classList.contains('active')) {
      return;
    }

    stopSprite(player)
    const { left, top } = settings.map.el.getBoundingClientRect()

    if (e.targetTouches) {
      settings.controlPos = {
        x: e.targetTouches[0].offsetX - left,
        y: e.targetTouches[0].offsetY - top
      }
    } else {
      settings.controlPos = {
        x: e.pageX - left,
        y: e.pageY - top
      }
    }

    handleWalk()
  })

  const elAngle = pos => {
    const { x, y } = pos
    const angle = radToDeg(Math.atan2(y - player.y, x - player.x)) - 90
    return Math.round(angle)
  }

  new Array(5).fill('').forEach(() => {
    const bunnyPos = Object.assign(document.createElement('div'), { className: 'bunny-pos' })
    elements.bunnyPos.push(bunnyPos)
    elements.bunnyRadar.appendChild(bunnyPos)
  })

  const findSadBunnies = () => {
    settings.sadBunnies = settings.bunnies.filter(el => el.sad).map(el => {
      return {
        el,
        distance: distanceBetween(el, player)
      }
    }).sort((a, b) => a.distance - b.distance)
    if (settings.sadBunnies.length > 5) settings.sadBunnies.length = 5
  }

  setInterval(() => {
    findSadBunnies()
    elements.bunnyPos.forEach((indicator, i) => {
      const bunny = settings.sadBunnies[i]?.el
      if (bunny) {
        const angle = elAngle(bunny)
        const distance = distanceBetween(bunny, player)
        indicator.innerHTML = `<div class="bunny-indicator" style="transform: rotate(${angle * -1}deg)">${distance - 40}px</div>`
        indicator.style.setProperty('--size', px(distance > (settings.bunnyRadarSize / 2) ? settings.bunnyRadarSize : distance))
        indicator.style.transform = `rotate(${angle}deg)`
      }
      indicator.classList[bunny ? 'remove' : 'add']('d-none')
    })
  }, 500)

  window.addEventListener('focus', () => settings.isWindowActive = true)
  window.addEventListener('blur', () => settings.isWindowActive = false)
  window.addEventListener('resize', () => {
    resizeAndRepositionMap()
    resizeBunnyRadar()
  })
  resizeAndRepositionMap()
  resizeBunnyRadar()

  elements.button.addEventListener('click', () => {
    SOUNDS.win.currentTime = 0; SOUNDS.win.play();
    location.reload()
  })

  // TIMER SETUP
  let timerInterval = null;
  let timeLeft = 5 * 60; // 5 minutes in seconds
  let timeUsed = 0; // seconds used to finish

  // Create timer UI if not present
  let timerEl = document.querySelector('.game-timer');
  if (!timerEl) {
    timerEl = document.createElement('div');
    timerEl.className = 'game-timer';
    // Pixel/8bit style, top left
    timerEl.style.position = 'fixed';
    timerEl.style.top = '12px';  // Moved up slightly
    timerEl.style.left = '12px'; // Moved left slightly
    timerEl.style.transform = 'none';
    timerEl.style.zIndex = '1002';
    timerEl.style.background = '#fff7fa';
    timerEl.style.border = '2px solid #b7e3b0'; // Thinner border
    timerEl.style.borderRadius = '0';
    timerEl.style.padding = '4px 12px'; // Smaller padding
    timerEl.style.fontFamily = "'Press Start 2P', Arial, Helvetica, sans-serif";
    timerEl.style.fontSize = '12px'; // Smaller font
    timerEl.style.letterSpacing = '1px'; // Tighter spacing
    timerEl.style.color = '#57280f';
    timerEl.style.boxShadow = '0 2px 4px #b7e3b0, 0 0 0 2px #e6f9e0, 0 0 0 4px #b7e3b0'; // Smaller shadow
    timerEl.style.textShadow = '1px 1px 0 #fff';
    timerEl.style.display = 'none';
    timerEl.style.userSelect = 'none';
    timerEl.style.pointerEvents = 'none';
    document.body.appendChild(timerEl);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimerUI() {
    timerEl.innerHTML = `<span style="font-size:10px;letter-spacing:1px;">⏰</span> <span style="font-family:'Press Start 2P',monospace;font-size:12px;letter-spacing:1px;">${formatTime(timeLeft)}</span>`;
  }

  function showGameOverUI() {
    // Hide win UI if visible
    elements.endMessage.classList.add('d-none');
    // Show Game Over UI (styled like end message)
    let gameOverEl = document.querySelector('.game-over-message');
    if (!gameOverEl) {
      gameOverEl = document.createElement('div');
      gameOverEl.className = 'game-over-message';
      gameOverEl.style.position = 'fixed';
      gameOverEl.style.zIndex = '100002';
      gameOverEl.style.top = '0';
      gameOverEl.style.left = '0';
      gameOverEl.style.width = '100vw';
      gameOverEl.style.height = '100vh';
      gameOverEl.style.display = 'flex';
      gameOverEl.style.alignItems = 'center';
      gameOverEl.style.justifyContent = 'center';
      gameOverEl.innerHTML = `
        <div class="end-message">
          <img class="end-icon" 
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAgElEQVR4nO3WsQ2AMBBDwXdp2IeajbJ/KEAUkC+4k9ybwJLlygEAAAAAAOCvZmZdHbFo7Zl5XR2xYrfGl9URi3ZrXFtH/N3TGkfvhNk74XfWrXFsnTB7JwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPCND6YnB20M5g5TAAAAAElFTkSuQmCC" 
            alt="Bunny sad" />
          <p>
            <div style="background:#e6f9e0;padding:20px 12px 12px 12px;border-radius:8px;width:320px;max-width:90vw;margin:0 auto;box-shadow:0 0 0 4px #b7e3b0,0 0 0 8px #e6f9e0;">
              <div style="font-size:24px;color:#57280f;margin-bottom:16px;text-shadow:2px 2px 0 #fff;">
                Game Over!
              </div>
              <div style="font-size:13px;color:#57280f;margin-bottom:8px;line-height:1.5;">
                Time's up! The bunnies are still waiting for their hugs.
                <br><br>
                Would you like to try again?
              </div>
            </div>
          </p>
          <div class="end-actions">
            <div class="end-action-btn">
              <button class="retry-btn icon-btn" title="Play Again">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#57280f" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <polygon points="5,3 19,12 5,21 5,3" fill="#b7e3b0" stroke="#57280f"/>
                  </svg>
                </span>
              </button>
              <div class="end-action-label">Play Again</div>
            </div>
            <div class="end-action-btn">
              <button class="coffee-btn icon-btn" title="Buy Me a Coffee">
                <span>
                  <img src="images/coffee.png" alt="Buy Me a Coffee" 
                    style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />
                </span>
              </button>
              <div class="end-action-label">Buy Me a Coffee</div>
            </div>
            <div class="end-action-btn">
              <button class="share-btn icon-btn" title="Copy Link">
                <span>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#0084ff"/>
                    <g>
                      <path d="M14 8V20" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M9 13l5-5 5 5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" 
                        stroke-linejoin="round" fill="none"/>
                    </g>
                  </svg>
                </span>
              </button>
              <div class="end-action-label">Copy Link</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(gameOverEl);

      // Event Listeners
      gameOverEl.querySelector('.retry-btn').addEventListener('click', () => {
        SOUNDS.win.currentTime = 0;
        SOUNDS.win.play();
        location.reload();
      });

      gameOverEl.querySelector('.coffee-btn').addEventListener('click', () => {
        SOUNDS.coffee.currentTime = 0;
        SOUNDS.coffee.play();
        document.querySelector('.coffee-modal').style.display = 'flex';
      });

      const shareBtn = gameOverEl.querySelector('.share-btn');
      shareBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText('https://jeanaih.github.io/HUG/');
          shareBtn.title = "Copied!";
          shareBtn.classList.add('copied');
          SOUNDS.share.currentTime = 0;
          SOUNDS.share.play();
          setTimeout(() => {
            shareBtn.title = "Copy Link";
            shareBtn.classList.remove('copied');
          }, 1200);
        } catch (err) {
          alert('Failed to copy link.');
        }
      });
    } else {
      gameOverEl.style.display = 'flex';
    }
    timerEl.style.display = 'none';
    SOUNDS.gameover.currentTime = 0;
    SOUNDS.gameover.play();
  }

  let _timerPaused = false;
  function stopTimer() {
    _timerPaused = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function startTimer() {
    if (_timerPaused && isPaused) return;
    _timerPaused = false;
    updateTimerUI();
    timerEl.style.display = 'block';
    stopTimer();
    timerInterval = setInterval(() => {
      if (isPaused) return;
      timeLeft--;
      timeUsed++;
      updateTimerUI();
      if (timeLeft <= 0) {
        stopTimer();
        showGameOverUI();
      }
    }, 1000);
  }

  // Start timer
  startTimer();

  // Use bunny count from selected mode
  const bunnyCount = window.GAME_MODE && window.GAME_MODE.bunnyCount ? window.GAME_MODE.bunnyCount : 10;

  // Replace bunny creation with selected count
  new Array(bunnyCount).fill('').forEach(() => addBunny())
  new Array(100).fill('').forEach(() => addTree())
  new Array(30).fill('').forEach(() => addStone())

  // Patch updateSadBunnyCount to stop timer and hide timer on win, and show time completed
  const origUpdateSadBunnyCount = updateSadBunnyCount;
  updateSadBunnyCount = function () {
    origUpdateSadBunnyCount();
    const sadBunnyCount = settings.bunnies.filter(b => b.sad).length;
    // Update indicator to show correct count for mode
    if (sadBunnyCount) {
      elements.indicator.innerHTML = `Sad Bunnies: <b>${sadBunnyCount}</b> / <b>${bunnyCount}</b>`;
    } else {
      elements.indicator.innerHTML = '';
    }
    if (!sadBunnyCount) {
      stopTimer();
      timerEl.style.display = 'none';
      // Show time completed in end message
      const endMsg = elements.endMessage;
      const timeStr = formatTime(timeUsed);
      const msgP = endMsg.querySelector('p');
      if (msgP && !msgP.innerHTML.includes('You completed')) {
        msgP.innerHTML += `<br><span style="font-size:13px;display:block;margin-top:10px;color:#36a36a;">You completed this in <b>${timeStr}</b>!</span>`;
      }
    }
  };

  updateSadBunnyCount()
  updateZIndexes() // initial z-index setup
}

function showStartOverlay() {
  document.body.classList.add('starting')
  document.querySelector('.start-overlay').style.display = 'flex'
}

function hideStartOverlay() {
  const overlay = document.querySelector('.start-overlay');
  overlay.classList.add('hiding');
  document.body.classList.remove('starting');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 500);
}

function showTutorial() {
  const tutorialOverlay = document.querySelector('.tutorial-overlay');
  const steps = tutorialOverlay.querySelectorAll('.tutorial-step');
  let currentStep = 1;

  tutorialOverlay.style.display = 'flex';
  steps[0].classList.add('active');

  // Add sound to all tutorial buttons
  tutorialOverlay.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      SOUNDS.tutorial.currentTime = 0;
      SOUNDS.tutorial.play();
    });
  });

  tutorialOverlay.addEventListener('click', (e) => {
    if (e.target.classList.contains('tutorial-next')) {
      steps[currentStep - 1].classList.remove('active');
      currentStep++;
      steps[currentStep - 1].classList.add('active');
    }

    if (e.target.classList.contains('tutorial-start')) {
      tutorialOverlay.style.display = 'none';
      init();
    }
  });
}

// Add CSS for chat bubble and effects (inject if not present)
(function addBunnyBubbleCSS() {
  if (document.getElementById('bunny-bubble-css')) return;
  const style = document.createElement('style');
  style.id = 'bunny-bubble-css';
  style.textContent = `
    @keyframes bunny-bubble-pop {
      0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
      80% { opacity: 1; transform: translateX(-50%) scale(1.08); }
      100% { opacity: 1; transform: translateX(-50%) scale(1); }
    }
    @keyframes bunny-heart-float {
      0% { opacity: 0; transform: scale(0.8) translateY(0); }
      50% { opacity: 1; transform: scale(1.2) translateY(-10px); }
      100% { opacity: 0; transform: scale(1) translateY(-20px); }
    }
    .bunny-chat-bubble {
      pointer-events: none;
      user-select: none;
      min-width: 60px;
      min-height: 28px;
      position: absolute;
      left: 50%;
      top: -54px;
      transform: translateX(-50%);
      z-index: 100;
      background: #fff7fa;
      border: 2px solid #b7e3b0;
      border-radius: 12px;
      padding: 7px 16px;
      font-family: 'Press Start 2P', Arial, sans-serif;
      font-size: 13px;
      color: #36a36a;
      box-shadow: 0 2px 8px #b7e3b0, 0 0 0 2px #e6f9e0;
      animation: bunny-bubble-pop 0.18s cubic-bezier(.77,0,.18,1);
    }
    .bunny-chat-bubble .bunny-chat-text {
      z-index: 2;
      position: relative;
      text-shadow: 1px 1px 0 #fff, 0 2px 0 #e6f9e0;
    }
    .bunny-heart-effect {
      pointer-events: none;
      user-select: none;
      z-index: 99;
      text-shadow: 0 2px 4px #fff7fa;
    }
  `;
  document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', function () {
  const shareBtns = document.querySelectorAll('.share-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const url = 'https://jeanaih.github.io/HUG/';
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 1200);
        });
      } else {
        // fallback for older browsers
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1200);
      }
    });
  });

  const pauseBtn = document.querySelector('.pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      showPauseModal();
    });
  }
  // Pause modal buttons
  const pauseModal = document.querySelector('.pause-modal');
  if (pauseModal) {
    pauseModal.querySelector('.resume-btn').addEventListener('click', () => {
      hidePauseModal();
    });
    pauseModal.querySelector('.restart-btn').addEventListener('click', () => {
      location.reload();
    });
    pauseModal.querySelector('.back-btn').addEventListener('click', () => {
      hidePauseModal();
      // Show start overlay, reset game
      document.querySelector('.start-overlay').style.display = 'flex';
      window.location.reload();
    });
  }
  // Pause on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !isPaused) {
      showPauseModal();
    } else if (e.key === 'Escape' && isPaused) {
      hidePauseModal();
    }
  });

  // --- Player Name Dropdown Logic (integrated input/dropdown + button) ---
  function getLeaderboardNames() {
    try {
      const LB_KEY = 'hug_bunny_leaderboard';
      const lb = JSON.parse(localStorage.getItem(LB_KEY)) || [];
      // Only unique, non-empty names
      return [...new Set(lb.map(row => row.name).filter(n => n && n.trim()))];
    } catch { return []; }
  }
  function updateNameDropdown(filter = "") {
    const dropdown = document.querySelector('.player-name-dropdown');
    const input = document.querySelector('.player-name-input');
    if (!dropdown) return;
    const names = getLeaderboardNames();
    // Filter by input value (case-insensitive, startsWith)
    const filtered = names.filter(n =>
      !input.value || n.toLowerCase().startsWith(input.value.toLowerCase())
    );
    dropdown.innerHTML = "";
    if (filtered.length) {
      filtered.forEach(n => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = n;
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector('.player-name-input');
    const dropdown = document.querySelector('.player-name-dropdown');
    const btn = document.querySelector('.player-name-dropdown-btn');
    if (!input || !dropdown) return;

    // Show dropdown on focus or input
    input.addEventListener('focus', function () {
      updateNameDropdown();
    });
    input.addEventListener('input', function () {
      updateNameDropdown();
    });

    // Hide dropdown on blur (with timeout to allow click)
    input.addEventListener('blur', function () {
      setTimeout(() => { dropdown.style.display = 'none'; }, 120);
    });

    // Handle click on dropdown item
    dropdown.addEventListener('mousedown', function (e) {
      if (e.target.classList.contains('dropdown-item')) {
        input.value = e.target.textContent;
        dropdown.style.display = 'none';
      }
    });

    // Button to toggle dropdown (default hide if no names)
    if (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        // Only show if there are names to show
        updateNameDropdown();
        if (dropdown.innerHTML.trim()) {
          dropdown.style.display = 'block';
          input.focus();
        } else {
          dropdown.style.display = 'none';
        }
      });
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  // Show loading animation, then show start overlay
  playLoadingAnimation(() => {
    showStartOverlay();
  });

  // Mode selection logic
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SOUNDS.mode.currentTime = 0; SOUNDS.mode.play();
      const mode = btn.dataset.mode;
      let bunnyCount = 10;
      if (mode === 'easy') bunnyCount = Math.floor(Math.random() * 6) + 10;      // 10-15
      else if (mode === 'medium') bunnyCount = Math.floor(Math.random() * 6) + 25; // 25-30
      else if (mode === 'hard') bunnyCount = Math.floor(Math.random() * 6) + 45;   // 45-50

      window.GAME_MODE = { mode, bunnyCount };

      hideModeOverlay();
      setTimeout(showTutorial, 100);
    });
  });

  const clickSound = new Audio('data:audio/wav;base64,UklGRl9vT19VQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');

  document.querySelector('.start-btn').addEventListener('click', () => {
    // Get name from input and store globally
    const nameInput = document.querySelector('.player-name-input');
    window.PLAYER_NAME = nameInput && nameInput.value.trim() ? nameInput.value.trim().slice(0, 16) : "";
    SOUNDS.click.currentTime = 0; SOUNDS.click.play();
    hideStartOverlay();
    setTimeout(showModeOverlay, 500);
  });

  // Buy Me a Coffee modal logic
  function showCoffeeModal() {
    SOUNDS.coffee.currentTime = 0; SOUNDS.coffee.play();
    document.querySelector('.coffee-modal').style.display = 'flex';
  }
  function hideCoffeeModal() {
    SOUNDS.close.currentTime = 0; SOUNDS.close.play();
    document.querySelector('.coffee-modal').style.display = 'none';
  }
  // Start overlay button
  document.querySelector('.start-overlay .coffee-btn').addEventListener('click', showCoffeeModal);
  // End message button (will be replaced on win, so delegate after showEndStats)
  document.querySelector('.coffee-modal-close').addEventListener('click', hideCoffeeModal);

  // Play Again and Change Game Mode buttons for WIN UI
  document.querySelector('.end-message .play-again-btn').addEventListener('click', () => {
    SOUNDS.win.currentTime = 0; SOUNDS.win.play();
    location.reload();
  });
  document.querySelector('.end-message .change-mode-btn').addEventListener('click', () => {
    document.querySelector('.end-message').classList.add('d-none');
    showModeOverlay();
  });

  // Delegate for dynamically created coffee button in end message
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('.end-message .coffee-btn')) {
      SOUNDS.coffee.currentTime = 0; SOUNDS.coffee.play();
      showCoffeeModal();
    }
    if (e.target.closest('.coffee-modal-close')) {
      SOUNDS.close.currentTime = 0; SOUNDS.close.play();
      hideCoffeeModal();
    }
  });

  // Also start BGM on any user interaction if not started
  document.body.addEventListener('pointerdown', startBGM, { once: true });
  document.body.addEventListener('keydown', startBGM, { once: true });
});

// ESC key toggles pause modal and timer (desktop only)
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (!isPaused) {
      showPauseModal(); // This will also stop the timer
    } else {
      hidePauseModal(); // This will also resume the timer
    }
  }
});
