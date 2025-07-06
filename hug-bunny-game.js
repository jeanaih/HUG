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
    controlButtons: document.querySelectorAll('.control-btn')
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
    settings.bunnies.push(bunny)
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
      buffer: treeType === 1 ? 45 : treeType === 2 ? 55 : 35, // Different buffers for each tree type
      isObstacle: true,
      treeType: treeType
    }
    settings.elements.push(tree)
    settings.map.el.appendChild(tree.el)
    tree.el.style.zIndex = tree.y
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
      buffer: 30,
      isObstacle: true
    }
    settings.elements.push(stone)
    settings.map.el.appendChild(stone.el)
    stone.el.style.zIndex = stone.y
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
    bunny.el.setAttribute('message', ['thanks!', 'Salamat Bossing!', 'yeah!', '^ _ ^', 'thank you!', 'Bossing!'][randomN(5) - 1])
    bunny.el.classList.add(classToAdd)
    setTimeout(() => {
      bunny.el.classList.remove(classToAdd)
    }, 800)
  }

  const updateSadBunnyCount = () => {
    const sadBunnyCount = settings.bunnies.filter(b => b.sad).length
    elements.indicator.innerHTML = sadBunnyCount ? `x ${sadBunnyCount}` : ''
    if (!sadBunnyCount) {
      elements.endMessage.classList.remove('d-none')
      elements.indicator.classList.add('happy')
    }
  }

  const hugBunny = bunny => {
    const classToAdd = bunny.x > player.x ? 'hug-bear-bunny' : 'hug-bunny-bear'
    player.el.classList.add('d-none')
    bunny.el.classList.add(classToAdd)
    clearInterval(bunny.animationTimer)
    player.pause = true
    bunny.sad = false

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
      updateSadBunnyCount()
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

    // Separate tree collision detection
    const hasTreeCollision = settings.elements
      .filter(el => el.isObstacle && el.treeType)
      .some(tree => {
        // Calculate distance from player to tree center
        const dx = Math.abs(tree.x - newPos.x);
        const dy = Math.abs(tree.y - newPos.y);

        // Tree-specific hitbox based on type
        const baseBuffer = tree.treeType === 1 ? 35 :
          tree.treeType === 2 ? 45 : 30;

        // Wider collision for side approaches
        const horizontalBuffer = baseBuffer * 1.5; // 50% wider on sides
        const verticalBuffer = baseBuffer;

        return dx < horizontalBuffer && dy < verticalBuffer;
      });

    // Check other obstacles (stones etc)
    const hasOtherCollision = settings.elements
      .filter(el => el.isObstacle && !el.treeType)
      .some(el => distanceBetween(el, newPos) <= el.buffer);

    if (hasTreeCollision || hasOtherCollision) return false;

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

  const walk = (actor, dir) => {
    if (!dir || player.pause || !settings.isWindowActive) return
    if (noWall(actor)) {
      animateSprite(actor, dir)
      actor.x += actor.move.x
      actor.y += actor.move.y
      if (actor === player) {
        positionMap()
        setPos(settings.map)
        player.el.parentNode.style.zIndex = player.y
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

  // Add WASD controls
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

    // Calculate direction with normalized speed
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

      // Normalize diagonal movement
      if ((keys.w || keys.s) && (keys.a || keys.d)) {
        player.move.x *= 0.707 // Math.cos(45 degrees)
        player.move.y *= 0.707 // Math.sin(45 degrees)
      }
    }

    if (dir) {
      clearInterval(player.walkingInterval)
      player.walkingInterval = setInterval(() => walk(player, dir), 150)
      walk(player, dir)
    }
  }

  // Add joystick controls
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

    if (distance > maxDistance) {
      x = (x / distance) * maxDistance
      y = (y / distance) * maxDistance
    }

    elements.joystickStick.style.transform = `translate(${x}px, ${y}px)`

    // Convert joystick position to player movement
    const angle = Math.atan2(y, x)
    const { d } = settings

    settings.controlPos = {
      x: player.x + Math.cos(angle) * 100,
      y: player.y + Math.sin(angle) * 100
    }

    if (!player.walkingInterval) {
      handleWalk()
    }
  }

  elements.joystickBase.addEventListener('mousedown', () => isDragging = true)
  elements.joystickBase.addEventListener('touchstart', () => isDragging = true)

  document.addEventListener('mousemove', handleJoystick)
  document.addEventListener('touchmove', handleJoystick, { passive: false })

  document.addEventListener('mouseup', () => {
    isDragging = false
    elements.joystickStick.style.transform = 'translate(-50%, -50%)'
    clearInterval(player.walkingInterval)
    player.walkingInterval = null
    stopSprite(player)
  })

  document.addEventListener('touchend', () => {
    isDragging = false
    elements.joystickStick.style.transform = 'translate(-50%, -50%)'
    clearInterval(player.walkingInterval)
    player.walkingInterval = null
    stopSprite(player)
  })

  // Add control switching logic
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

  // Add tool button handler
  const toolBtn = document.querySelector('.tool-btn');
  const controlMenu = document.querySelector('.control-menu');

  toolBtn.addEventListener('click', () => {
    controlMenu.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-controls')) {
      controlMenu.classList.remove('show');
    }
  });

  player.x = getRandomPos('w')
  player.y = getRandomPos('h')
  player.el.style.zIndex = player.y
  setSize(settings.map)

  document.addEventListener('click', e => {
    if (e.target.closest('.mobile-controls')) return

    // Check if we're on mobile and using joystick
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

  elements.button.addEventListener('click', () => location.reload())

  new Array(45).fill('').forEach(() => addBunny())
  new Array(100).fill('').forEach(() => addTree())
  new Array(30).fill('').forEach(() => addStone())
  updateSadBunnyCount()
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

  // Show first step
  tutorialOverlay.style.display = 'flex';
  steps[0].classList.add('active');

  // Handle next buttons
  tutorialOverlay.addEventListener('click', (e) => {
    if (e.target.classList.contains('tutorial-next')) {
      steps[currentStep - 1].classList.remove('active');
      currentStep++;
      steps[currentStep - 1].classList.add('active');
    }

    if (e.target.classList.contains('tutorial-start')) {
      tutorialOverlay.style.display = 'none';
      init(); // Start the game
    }
  });
}

// Only start game after clicking start
window.addEventListener('DOMContentLoaded', () => {
  showStartOverlay();

  // Add click sound effect
  const clickSound = new Audio('data:audio/wav;base64,UklGRl9vT19VQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');

  document.querySelector('.start-btn').addEventListener('click', () => {
    clickSound.play();
    hideStartOverlay();
    setTimeout(showTutorial, 500); // Show tutorial after start animation
  });
});

