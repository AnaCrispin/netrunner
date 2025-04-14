let selectedCharacter = localStorage.getItem("selectedCharacter") || 'dino';
let dinoImg = new Image();
let autoImg = new Image();
let starImg = new Image();
let virusImg = new Image();

dinoImg.src = 'assets/dino2.png';
autoImg.src = 'assets/auto.png';
starImg.src = 'assets/star.png';
virusImg.src = 'assets/virus.png';

let stars = [];
let viruses = [];
let score = 0;
let gameTime = 90;
let timerInterval = null;

async function startGame() {
    const canvas = document.getElementById('gameCanvas');
    canvas.style.display = 'block';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');

    const video = document.getElementById('webcam-preview');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            runGame(video, canvas);
        })
        .catch(err => {
            alert('Error al acceder a la cámara: ' + err);
        });
}

function runGame(video, canvas) {
    const ctx = canvas.getContext('2d');
    let playerX = canvas.width / 2;

    spawnElements(canvas);
    startTimer();

    setInterval(async () => {
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection && detection.box) {
            const faceCenterX = detection.box.x + detection.box.width / 2;
            const normalizedX = faceCenterX / video.videoWidth;
            const targetX = canvas.width - normalizedX * canvas.width;

            playerX += (targetX - playerX) * 0.15;
            playerX = Math.max(0, Math.min(playerX, canvas.width - 60));
        }

        updateElements();
        drawElements(ctx, playerX, canvas.height);
        checkCollisions(playerX, canvas.height);
        drawHUD(ctx, canvas);
        drawGuideFrame(ctx, canvas, detection);
    }, 100);
}

function getCurrentLevel() {
    if (gameTime > 65) return 1;
    if (gameTime > 30) return 2;
    return 3;
}

function spawnElements(canvas) {
    let currentLevel = 0;
    let spawnInterval = null;

    function startLevel(level) {
        if (spawnInterval) clearInterval(spawnInterval);

        const levelText = document.getElementById('level-indicator');
        levelText.textContent = 'Nivel ' + level;
        levelText.style.display = 'block';
        setTimeout(() => {
            levelText.style.display = 'none';
        }, 2500);

        let starsToSpawn = 1;
        let virusesToSpawn = 1;
        let intervalTime = 1500;
        let totalSpawned = 0;
        let maxTotal = level === 1 ? 30 : level === 2 ? 50 : 70;

        if (level === 2) {
            starsToSpawn = 2;
            virusesToSpawn = 2;
            intervalTime = 1000;
        } else if (level === 3) {
            starsToSpawn = 3;
            virusesToSpawn = 3;
            intervalTime = 600;
        }

        spawnInterval = setInterval(() => {
            if (totalSpawned >= maxTotal) return;

            for (let i = 0; i < starsToSpawn && totalSpawned < maxTotal; i++) {
                stars.push({ x: Math.random() * canvas.width, y: 0 });
                totalSpawned++;
            }
            for (let i = 0; i < virusesToSpawn && totalSpawned < maxTotal; i++) {
                viruses.push({ x: Math.random() * canvas.width, y: 0 });
                totalSpawned++;
            }
        }, intervalTime);
    }

    const levelMonitor = setInterval(() => {
        const newLevel = getCurrentLevel();
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            startLevel(newLevel);
        }

        if (gameTime <= 0) {
            clearInterval(levelMonitor);
            clearInterval(spawnInterval);
        }
    }, 500);
}

function updateElements() {
    const level = getCurrentLevel();
    let starSpeed = 5;
    let virusSpeed = 6;

    if (level === 2) {
        starSpeed = 7;
        virusSpeed = 8;
    } else if (level === 3) {
        starSpeed = 9;
        virusSpeed = 11;
    }

    stars.forEach(star => star.y += starSpeed);
    viruses.forEach(virus => virus.y += virusSpeed);
}

function drawElements(ctx, playerX, canvasHeight) {
    const img = selectedCharacter === 'dino' ? dinoImg : autoImg;
    ctx.drawImage(img, playerX, canvasHeight - 100, 60, 60);

    stars.forEach(star => {
        ctx.drawImage(starImg, star.x, star.y, 30, 30);
    });

    viruses.forEach(virus => {
        ctx.drawImage(virusImg, virus.x, virus.y, 35, 35);
    });
}

function checkCollisions(playerX, canvasHeight) {
    const playerY = canvasHeight - 100;
    stars = stars.filter(star => {
        const caught = Math.abs(star.x - playerX) < 40 && star.y > playerY - 40;
        if (caught) score += 10;
        return !caught;
    });

    viruses = viruses.filter(virus => {
        const hit = Math.abs(virus.x - playerX) < 40 && virus.y > playerY - 40;
        if (hit) score -= 15;
        return !hit;
    });
}

function drawHUD(ctx, canvas) {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Puntaje: ' + score, 20, 30);
    ctx.fillText('Tiempo: ' + gameTime + 's', canvas.width - 140, 30);
}

function drawGuideFrame(ctx, canvas, detection) {
    const frameWidth = canvas.width * 0.85;
    const frameHeight = canvas.height * 0.8;
    const frameX = (canvas.width - frameWidth) / 2;
    const frameY = (canvas.height - frameHeight) / 2;

    let isInside = false;

    if (detection && detection.box) {
        const faceX = detection.box.x + detection.box.width / 2;
        const faceY = detection.box.y + detection.box.height / 2;
        isInside = (
            faceX >= frameX &&
            faceX <= frameX + frameWidth &&
            faceY >= frameY &&
            faceY <= frameY + frameHeight
        );
    }

    ctx.strokeStyle = isInside ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
    ctx.setLineDash([]);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Coloca tu rostro dentro del marco', frameX + 10, frameY - 10);
}

function startTimer() {
    timerInterval = setInterval(() => {
        gameTime--;
        if (gameTime <= 0) {
            clearInterval(timerInterval);
            showFinalScreen();
        }
    }, 1000);
}

function restartGame() {
    location.reload();
}

function showFinalScreen() {
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('final-score').textContent = 'Tu puntaje: ' + score;
    document.getElementById('final-screen').style.display = 'flex';
}

window.addEventListener("DOMContentLoaded", () => {
    startGame();
});
