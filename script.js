let userScore = 0;
let compScore = 0;
let gameActive = true;

// Three.js scene setup
let scene, camera, renderer;
let userHand, compHand;

const msg = document.querySelector("#msg");
const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#comp-score");

const handColors = {
    user: 0xff6b9d,    // Pink
    comp: 0x00ffff     // Cyan
};

// Initialize Three.js
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 500);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 10;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xff00ff, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);
    
    // Add background stars
    addStars();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.1,
        sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starsVertices), 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create a simplified 3D hand model
function createHand(color) {
    const handGroup = new THREE.Group();
    handGroup.castShadow = true;
    handGroup.receiveShadow = true;
    
    // Wrist/Palm
    const palmGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.3);
    const palmMaterial = new THREE.MeshPhongMaterial({
        color: color,
        wireframe: false,
        shininess: 50
    });
    const palm = new THREE.Mesh(palmGeometry, palmMaterial);
    palm.castShadow = true;
    palm.receiveShadow = true;
    handGroup.add(palm);
    
    // Store finger data for later animation
    handGroup.fingerBones = [];
    
    // Create 4 fingers
    const fingerPositions = [-0.3, -0.1, 0.1, 0.3];
    
    fingerPositions.forEach((xPos, index) => {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.x = xPos;
        fingerGroup.position.y = 0.9;
        
        let parentBone = fingerGroup;
        const fingerBones = [];
        
        // Create 3 segments per finger
        for (let i = 0; i < 3; i++) {
            const segmentGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8);
            const segmentMaterial = new THREE.MeshPhongMaterial({
                color: color,
                wireframe: false,
                shininess: 50
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.y = i * 0.35;
            segment.castShadow = true;
            segment.receiveShadow = true;
            
            parentBone.add(segment);
            fingerBones.push(segment);
            parentBone = segment;
        }
        
        palm.add(fingerGroup);
        handGroup.fingerBones.push({
            group: fingerGroup,
            bones: fingerBones
        });
    });
    
    return handGroup;
}

// Set hand gesture
function setHandGesture(hand, gesture) {
    if (!hand || !hand.fingerBones) return;
    
    hand.fingerBones.forEach((finger, index) => {
        const group = finger.group;
        
        switch(gesture) {
            case 'rock':
                // Close all fingers (curl inward)
                group.rotation.x = 1.5;
                group.rotation.y = 0;
                group.rotation.z = 0;
                break;
                
            case 'paper':
                // Open all fingers (extend outward)
                group.rotation.x = -0.4;
                group.rotation.y = 0;
                group.rotation.z = 0;
                break;
                
            case 'scissors':
                // Open index and middle (0,1), close others (2,3)
                if (index < 2) {
                    group.rotation.x = -0.4;
                } else {
                    group.rotation.x = 1.5;
                }
                group.rotation.y = 0;
                group.rotation.z = 0;
                break;
        }
    });
}

function displayHandGestures(userChoice, compChoice) {
    try {
        // Remove old hands
        if (userHand) scene.remove(userHand);
        if (compHand) scene.remove(compHand);
        
        // Create new hands
        userHand = createHand(handColors.user);
        compHand = createHand(handColors.comp);
        
        // Position hands
        userHand.position.x = -4;
        userHand.position.y = 0;
        userHand.position.z = 0;
        userHand.scale.set(0.8, 0.8, 0.8);
        
        compHand.position.x = 4;
        compHand.position.y = 0;
        compHand.position.z = 0;
        compHand.scale.set(0.8, 0.8, 0.8);
        compHand.rotation.y = Math.PI; // Flip computer hand
        
        // Set gestures
        setHandGesture(userHand, userChoice);
        setHandGesture(compHand, compChoice);
        
        scene.add(userHand);
        scene.add(compHand);
        
        console.log("Hands created successfully for:", userChoice, "vs", compChoice);
    } catch (error) {
        console.error("Error displaying hand gestures:", error);
        msg.innerText = "Error: " + error.message;
    }
}

function genCompChoice() {
    const options = ["rock", "paper", "scissors"];
    const choice = options[Math.floor(Math.random() * 3)];
    console.log("Computer chose:", choice);
    return choice;
}

function determineWinner(userChoice, compChoice) {
    if (userChoice === compChoice) return "draw";
    
    if (userChoice === "rock") return compChoice === "scissors" ? "win" : "lose";
    if (userChoice === "paper") return compChoice === "rock" ? "win" : "lose";
    if (userChoice === "scissors") return compChoice === "paper" ? "win" : "lose";
    
    return "draw";
}

function getGestureEmoji(gesture) {
    const emojis = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };
    return emojis[gesture] || gesture;
}

function showResult(userChoice, compChoice, result) {
    gameActive = true;
    msg.classList.remove('win', 'lose', 'draw');
    
    if (result === "win") {
        msg.innerText = `🎉 You Win! ${getGestureEmoji(userChoice)} beats ${getGestureEmoji(compChoice)}`;
        msg.classList.add('win');
        userScore++;
        userScorePara.innerText = userScore;
    } else if (result === "lose") {
        msg.innerText = `😢 You Lose! ${getGestureEmoji(compChoice)} beats ${getGestureEmoji(userChoice)}`;
        msg.classList.add('lose');
        compScore++;
        compScorePara.innerText = compScore;
    } else {
        msg.innerText = `🤝 It's a Draw! Both chose ${getGestureEmoji(userChoice)}`;
        msg.classList.add('draw');
    }
    
    console.log("Result:", result);
}

function playGame(userChoice) {
    console.log("Game started with choice:", userChoice);
    
    if (!gameActive) {
        console.log("Game not active, ignoring click");
        return;
    }
    
    gameActive = false;
    msg.innerText = "Playing...";
    
    const compChoice = genCompChoice();
    console.log("Displaying gestures...");
    displayHandGestures(userChoice, compChoice);
    
    setTimeout(() => {
        console.log("Showing result...");
        const result = determineWinner(userChoice, compChoice);
        showResult(userChoice, compChoice, result);
    }, 1500);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Gentle rotation of hands when game is not active
    if (userHand && gameActive) {
        userHand.rotation.z += 0.003;
    }
    if (compHand && gameActive) {
        compHand.rotation.z -= 0.003;
    }
    
    renderer.render(scene, camera);
}

// Event listeners
document.getElementById('rockBtn').addEventListener('click', () => {
    console.log("Rock button clicked");
    playGame('rock');
});

document.getElementById('paperBtn').addEventListener('click', () => {
    console.log("Paper button clicked");
    playGame('paper');
});

document.getElementById('scissorsBtn').addEventListener('click', () => {
    console.log("Scissors button clicked");
    playGame('scissors');
});

document.getElementById('resetBtn').addEventListener('click', () => {
    console.log("Reset button clicked");
    userScore = 0;
    compScore = 0;
    userScorePara.innerText = '0';
    compScorePara.innerText = '0';
    msg.innerText = 'Choose your move!';
    msg.classList.remove('win', 'lose', 'draw');
    gameActive = true;
    
    if (userHand) scene.remove(userHand);
    if (compHand) scene.remove(compHand);
    userHand = null;
    compHand = null;
});

// Initialize
console.log("Initializing Three.js...");
initThreeJS();
console.log("Initialization complete");
