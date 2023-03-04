const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const UNITS = 10;
const WIDTH = 700;
const HEIGHT = 150;
const UNIT_PX = WIDTH / UNITS;
const FPS = 60;
const SLOW_MO = 0.1;
const ATTACK_COOLDOWN = 60;
const ROUND_OVER_TIME = 60;

const roundStartSound = new Audio("round-start.wav");
const roundWinSound = new Audio("win.wav");
const attackSound = new Audio("attack.wav");
const tieSound = new Audio("tie.wav");
const tickSound = new Audio("tick.wav");

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
  momentum: number;
  gameOverDir: number;
}

function createPlayer(
  x: number,
  y: number,
  isLeft: boolean,
  oldPlayer?: Player
) {
  return {
    x,
    y,
    leftHeld: oldPlayer ? oldPlayer.leftHeld : false,
    rightHeld: oldPlayer ? oldPlayer.rightHeld : false,
    lastDir: oldPlayer ? oldPlayer.lastDir : 0,
    attackHeld: false,
    isLeft,
    speedMult: 1,
    attackFrame: ATTACK_COOLDOWN,
    momentum: 0,
    gameOverDir: 0,
  };
}

function updatePlayer(player: Player) {
  const timeMult = gameState == "roundOver" ? SLOW_MO : 1;

  if (
    player.attackHeld &&
    player.attackFrame >= ATTACK_COOLDOWN &&
    gameState == "playing"
  ) {
    player.attackFrame = 0;
    attackSound.load();
    attackSound.play();
  }
  if (player.attackFrame <= ATTACK_COOLDOWN) {
    player.attackFrame += 1 * timeMult;
  }

  const playerAttackHandicap = Math.min(
    1,
    player.attackFrame / ATTACK_COOLDOWN
  );
  player.speedMult = playerAttackHandicap ** 4;

  player.x += player.momentum * 0.15;
  if (player.momentum > 0)
    player.momentum -= Math.abs(Math.min(player.momentum, 0.05));
  if (player.momentum < 0)
    player.momentum += Math.abs(Math.max(player.momentum, -0.05));

  const multiplier = player.isLeft
    ? leftPlayer.speedMult
    : rightPlayer.speedMult;
  const PLAYER_SPEED = 0.035 * multiplier;

  if (gameState == "roundOver") {
    player.x += player.gameOverDir * PLAYER_SPEED * timeMult;
  } else {
    if (player.leftHeld && player.rightHeld) {
      player.x += player.lastDir * PLAYER_SPEED * timeMult;
    } else if (player.leftHeld) {
      player.x -= PLAYER_SPEED * timeMult;
    } else if (player.rightHeld) {
      player.x += PLAYER_SPEED * timeMult;
    }
  }

  player.x = Math.max(-UNITS / 2 + 0.5, Math.min(UNITS / 2 - 0.5, player.x));
}

function update() {
  updatePlayer(leftPlayer);
  updatePlayer(rightPlayer);

  if (gameState == "pregame") {
    if (leftPlayer.attackHeld && rightPlayer.attackHeld) {
      gameState = "roundOver";
      roundOverTimer = 0;
    }
    return;
  }

  const playerDistance = Math.abs(leftPlayer.x - rightPlayer.x);
  const playersTouching = playerDistance < 1;

  if (gameState === "playing") {
    if (playersTouching) {
      const leftAttacking = leftPlayer.attackFrame === 1;
      const rightAttacking = rightPlayer.attackFrame === 1;
      if (leftAttacking && rightAttacking) {
        leftPlayer.momentum = -1;
        rightPlayer.momentum = 1;
        tieSound.load();
        tieSound.play();
      } else if (leftAttacking) {
        leftWins += 1;
        winner = "left";
        document.getElementById("left-score")!.innerText = leftWins.toString();
        gameState = "roundOver";
        setGameOverDirs();
        roundWinSound.load();
        roundWinSound.play();
      } else if (rightAttacking) {
        rightWins += 1;
        winner = "right";
        document.getElementById("right-score")!.innerText =
          rightWins.toString();
        gameState = "roundOver";
        setGameOverDirs();
        roundWinSound.load();
        roundWinSound.play();
      }
    }
  } else if (gameState === "roundOver") {
    roundOverTimer++;

    if (roundOverTimer == ROUND_OVER_TIME) {
      newRound();
    } else if (roundOverTimer % 20 == 0) {
      tickSound.load();
      tickSound.play();
    }
  }
}

function setGameOverDirs() {
  leftPlayer.gameOverDir = 0;
  if (leftPlayer.leftHeld && leftPlayer.rightHeld)
    leftPlayer.gameOverDir = leftPlayer.lastDir;
  else if (leftPlayer.rightHeld) leftPlayer.gameOverDir += 1;
  else if (leftPlayer.leftHeld) leftPlayer.gameOverDir -= 1;

  rightPlayer.gameOverDir = 0;
  if (rightPlayer.leftHeld && rightPlayer.rightHeld)
    rightPlayer.gameOverDir = rightPlayer.lastDir;
  else if (rightPlayer.rightHeld) rightPlayer.gameOverDir += 1;
  else if (rightPlayer.leftHeld) rightPlayer.gameOverDir -= 1;
}

function newRound() {
  gameState = "playing";
  roundOverTimer = 0;

  leftPlayer = createPlayer(-3, 0, true, leftPlayer);
  rightPlayer = createPlayer(3, 0, false, rightPlayer);

  roundStartSound.load();
  roundStartSound.play();
}

function drawPlayer(player: Player) {
  ctx.globalCompositeOperation = "lighter";
  if (player.isLeft) ctx.fillStyle = "blue";
  else ctx.fillStyle = "red";

  if (player.attackFrame < ATTACK_COOLDOWN) {
    const brightness = (ATTACK_COOLDOWN - player.attackFrame) / ATTACK_COOLDOWN;
    const val = Math.floor(brightness * 255);
    const red = player.isLeft ? 0 : 255;
    const blue = player.isLeft ? 255 : 0;
    ctx.fillStyle = `rgb(${val + red}, ${val}, ${val + blue})`;
  }

  ctx.fillRect(
    player.x * UNIT_PX - UNIT_PX / 2,
    player.y * UNIT_PX - UNIT_PX / 2,
    UNIT_PX,
    UNIT_PX
  );
  ctx.globalCompositeOperation = "source-over";
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.translate(WIDTH / 2, HEIGHT / 2);

  drawPlayer(leftPlayer);
  drawPlayer(rightPlayer);

  if (gameState == "pregame") {
    ctx.fillStyle = "black";
    if (leftPlayer.attackHeld) {
      ctx.fillText("✓", leftPlayer.x * UNIT_PX, leftPlayer.y * UNIT_PX);
    } else {
      ctx.fillText("S", leftPlayer.x * UNIT_PX, leftPlayer.y * UNIT_PX);
    }

    ctx.fillStyle = "white";
    if (rightPlayer.attackHeld) {
      ctx.fillText("✓", rightPlayer.x * UNIT_PX, rightPlayer.y * UNIT_PX);
    } else {
      ctx.fillText("↓", rightPlayer.x * UNIT_PX, rightPlayer.y * UNIT_PX);
    }
    ctx.font = `bold ${UNIT_PX * 0.8}px sans-serif`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font;
  }

  ctx.resetTransform();

  if (winner == "left") ctx.fillStyle = "blue";
  else ctx.strokeStyle = "red";
  ctx.lineWidth = UNIT_PX / 10;
  if (gameState == "roundOver") {
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
  }
  if (gameState == "pregame") {
    ctx.strokeStyle = "white";
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
  }

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

// setup
let leftPlayer = createPlayer(-3, 0, true);
let rightPlayer = createPlayer(3, 0, false);
let leftWins = 0;
let rightWins = 0;
let gameState: "pregame" | "playing" | "roundOver" = "playing";
let roundOverTimer = 0;
let winner = "";

canvas.width = WIDTH;
canvas.height = HEIGHT;

setInterval(() => {
  update();
  draw();
}, 1000 / FPS);

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

export {};
