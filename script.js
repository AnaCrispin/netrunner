
let selectedCharacter = 'dino';
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
let gameTime = 30;
let timerInterval = null;

function selectCharacter(character) {
    selectedCharacter = character;
    console.log("Personaje seleccionado:", selectedCharacter);
}
document.getElementById("preview-character").src = selectedCharacter === 'dino' ? 'assets/dino2.png' : 'assets/auto.png';

async function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    const canvas = document.getElementById('gameCanvas');
    canvas.style.display = 'block';

    await faceapi.nets.tinyFaceDetector.loadFromUri('models/');
    await faceapi.nets.faceLandmark68Net.loadFromUri('models/');

    const video = document.createElement('video');
    video.style.display = 'none';
    document.body.appendChild(video);

    navigator.mediaDevices.getUserMedia({ video: {} })
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

    spawnElements();  // 👍 solo esto

    startTimer();

    setInterval(async () => {
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
            const { x } = detection.detection.box;
            playerX = x + 50;
        }

        updateElements();
        drawElements(ctx, playerX, canvas.height);
        checkCollisions(playerX, canvas.height);
        drawHUD(ctx, canvas);
    }, 100);
}


function spawnElements() {
    // Nivel 1
    setInterval(() => {
        stars.push({ x: Math.random() * 750, y: 0 });
    }, 1500);

    setInterval(() => {
        viruses.push({ x: Math.random() * 750, y: 0 });
    }, 2500);

    // Nivel 2 - Aumenta dificultad
    setTimeout(() => {
        setInterval(() => {
            viruses.push({ x: Math.random() * 750, y: 0 });
        }, 1500);
    }, 5000);

    // Nivel 3 - Más rápido
    setTimeout(() => {
        setInterval(() => {
            stars.push({ x: Math.random() * 750, y: 0 });
        }, 1000);
    }, 15000);
}


function updateElements() {
    stars.forEach(star => star.y += 5);
    viruses.forEach(virus => virus.y += 6);
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

function startTimer() {
    timerInterval = setInterval(() => {
        gameTime--;
        if (gameTime <= 0) {
            clearInterval(timerInterval);
            showFinalScreen(); // en vez de alert()
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
