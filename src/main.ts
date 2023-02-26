const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const UNITS = 12;
const WIDTH = 600;
const HEIGHT = 100;
const UNIT_PX = WIDTH / UNITS;
const FPS = 60;

canvas.width = WIDTH;
canvas.height = HEIGHT;

setInterval(() => {
  update();
  draw();
}, 1000 / FPS);

// attack frame data
const ATTACK_TIME = 20;
const ATTACK_COOLDOWN = 60;

function createPlayer(x: number, y: number, isLeft: boolean) {
  return {
    x,
    y,
    leftHeld: false,
    rightHeld: false,
    lastDir: 0,
    attackHeld: false,
    isLeft,
    speedMult: 1,
    speedMultTarget: 1,
    attackFrame: ATTACK_COOLDOWN, //player is attacking if attackFrame > attack cooldown
  };
}

function createParticle(
  x: number,
  y: number,
  r: number,
  angle: number,
  isBlack: boolean,
  speed: number
) {
  return {
    x,
    y,
    r,
    angle,
    speed,
    isBlack,
  };
}

interface Player {
  x: number;
  y: number;
  leftHeld: boolean;
  rightHeld: boolean;
  attackHeld: boolean;
  lastDir: number;
  isLeft: boolean;
  attackFrame: number;
  speedMult: number;
  speedMultTarget: number;
}
const leftPlayer = createPlayer(-4, 0, true);
const rightPlayer = createPlayer(4, 0, false);

interface Particle {
  x: number;
  y: number;
  r: number;
  angle: number;
  speed: number;
  isBlack: boolean;
}
const particles: Particle[] = [...Array(30)].map((_, i) =>
  createParticle(
    Math.random() * UNITS,
    (Math.random() * UNITS * HEIGHT) / WIDTH,
    Math.random() * 0.075 + 0.075,
    Math.random() * Math.PI * 2,
    i % 2 === 0,
    Math.random() * 0.01 + 0.01
  )
);

document.onkeydown = (e) => {
  if (e.key === "a") {
    leftPlayer.leftHeld = true;
    leftPlayer.lastDir = -1;
  }
  if (e.key === "d") {
    leftPlayer.rightHeld = true;
    leftPlayer.lastDir = 1;
  }
  if (e.key === "s") {
    leftPlayer.attackHeld = true;
  }
  if (e.key === "ArrowLeft") {
    rightPlayer.leftHeld = true;
    rightPlayer.lastDir = -1;
  }
  if (e.key === "ArrowRight") {
    rightPlayer.rightHeld = true;
    rightPlayer.lastDir = 1;
  }
  if (e.key === "ArrowDown") {
    rightPlayer.attackHeld = true;
  }
};

document.onkeyup = (e) => {
  if (e.key === "a") {
    leftPlayer.leftHeld = false;
  }
  if (e.key === "d") {
    leftPlayer.rightHeld = false;
  }
  if (e.key === "s") {
    leftPlayer.attackHeld = false;
  }
  if (e.key === "ArrowLeft") {
    rightPlayer.leftHeld = false;
  }
  if (e.key === "ArrowRight") {
    rightPlayer.rightHeld = false;
  }
  if (e.key === "ArrowDown") {
    rightPlayer.attackHeld = false;
  }
};

function updatePlayer(player: Player) {
  if (player.attackHeld && player.attackFrame >= ATTACK_COOLDOWN) {
    player.attackFrame = 0;
  }
  if (player.attackFrame <= ATTACK_COOLDOWN) {
    player.attackFrame++;
  }

  if (player.attackFrame <= ATTACK_TIME) {
    player.speedMultTarget = 4;
  } else if (player.attackFrame <= ATTACK_COOLDOWN) {
    player.speedMultTarget = 0;
  } else {
    player.speedMultTarget = 1;
  }

  const lerpSpeed = 0.08;
  player.speedMult += (player.speedMultTarget - player.speedMult) * lerpSpeed;

  const multiplier = player.isLeft
    ? leftPlayer.speedMult
    : rightPlayer.speedMult;
  const PLAYER_SPEED = 0.035 * multiplier;
  if (player.leftHeld && player.rightHeld) {
    player.x += player.lastDir * PLAYER_SPEED;
  } else if (player.leftHeld) {
    player.x -= PLAYER_SPEED;
  } else if (player.rightHeld) {
    player.x += PLAYER_SPEED;
  }
  player.x = Math.max(-UNITS / 2 + 0.5, Math.min(UNITS / 2 - 0.5, player.x));
}

function update() {
  updatePlayer(leftPlayer);
  updatePlayer(rightPlayer);
  const playersOverlap = Math.abs(leftPlayer.x - rightPlayer.x) < 1;
  if (playersOverlap) {
    const overlapAmount = Math.abs(leftPlayer.x - rightPlayer.x) - 1;
    leftPlayer.x += overlapAmount / 2;
    rightPlayer.x -= overlapAmount / 2;
  }

  particles.forEach((p) => {
    const speed = p.isBlack
      ? p.speed * rightPlayer.speedMult
      : p.speed * leftPlayer.speedMult;
    p.x += Math.cos(p.angle) * speed;
    p.y += Math.sin(p.angle) * speed;
    if (p.x + p.r < 0) {
      p.x = UNITS + p.r;
    }
    if (p.x - p.r > UNITS) {
      p.x = -p.r;
    }
    if (p.y + p.r < 0) {
      p.y = (UNITS * HEIGHT) / WIDTH + p.r;
    }
    if (p.y - p.r > (UNITS * HEIGHT) / WIDTH) {
      p.y = -p.r;
    }
  });
}

function drawPlayer(player: Player) {
  if (player.isLeft) ctx.fillStyle = "white";
  else ctx.fillStyle = "black";

  ctx.fillRect(
    player.x * UNIT_PX - UNIT_PX / 2,
    player.y * UNIT_PX - UNIT_PX / 2,
    UNIT_PX,
    UNIT_PX
  );
}

function drawAttacks() {
  if (leftPlayer.attackFrame <= ATTACK_TIME) {
    ctx.fillStyle = "white";
    ctx.fillRect(
      leftPlayer.x * UNIT_PX + UNIT_PX / 2,
      leftPlayer.y * UNIT_PX - UNIT_PX / 2,
      UNIT_PX,
      UNIT_PX / 2
    );
  }
  if (rightPlayer.attackFrame <= ATTACK_TIME) {
    ctx.fillStyle = "black";
    ctx.fillRect(
      rightPlayer.x * UNIT_PX - UNIT_PX / 2,
      rightPlayer.y * UNIT_PX,
      -UNIT_PX,
      UNIT_PX / 2
    );
  }
}

function draw() {
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  particles.forEach((p) => {
    if (p.isBlack) {
      ctx.fillStyle = "black";
    } else {
      ctx.fillStyle = "white";
    }
    ctx.beginPath();
    ctx.arc(p.x * UNIT_PX, p.y * UNIT_PX, p.r * UNIT_PX, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.translate(WIDTH / 2, HEIGHT / 2);

  drawPlayer(leftPlayer);
  drawPlayer(rightPlayer);
  drawAttacks();
  // ctx.fillStyle = "green";
  // ctx.fillRect(
  //   (-platformLength / 2) * UNIT_PX,
  //   0.5 * UNIT_PX,
  //   platformLength * UNIT_PX,
  //   UNIT_PX
  // );

  ctx.resetTransform();

  document.getElementById("control-display")!.innerHTML = `
    <div>
      <kbd class="${leftPlayer.leftHeld ? "pressed" : ""}">A</kbd>
      <kbd class="${leftPlayer.attackHeld ? "pressed" : ""}">S</kbd>
      <kbd class="${leftPlayer.rightHeld ? "pressed" : ""}">D</kbd>
    </div>
    <div>
      <kbd class="${rightPlayer.leftHeld ? "pressed" : ""}">←</kbd>
      <kbd class="${rightPlayer.attackHeld ? "pressed" : ""}">↓</kbd>
      <kbd class="${rightPlayer.rightHeld ? "pressed" : ""}">→</kbd>
    </div>
    `;
}

export {};
