let player;
let floor;
let countCanyons = 5;
let countCoins = 20;
let countEnemies = 8;
let canyons = [];
let coins = [];
let enemies = [];
let platforms = []; 
let eyeOpen = true;
let blinkTimer = 0;
let score = 0;
let soundVolume = 1;
let musicVolume = 0.3;
let background;
let shotSound = new Audio("shotSound.wav");
let jumpSound = new Audio("jumpSound.wav");
let backMusic = new Audio("backMusic.wav");
let coinSound = new Audio("coinSound.wav");
let clouds = [];

let cameraOffset = 0;
let cameraEdgeOffset = 200;
let worldWidth = 3000;

let soundSlider;
let musicSlider;
let soundLabel;
let musicLabel;
let restartButton;
let isGameOver = false;

const SLIDER_WIDTH = 150;
const SLIDER_HEIGHT = 10;
const LABEL_HEIGHT = 20;
const UI_MARGIN = 20;
const SCORE_WIDTH = 200;

const PLATFORM_WIDTH = 150;
const PLATFORM_HEIGHT = 20;
const COIN_SIZE = 30;
const ENEMY_WIDTH = 75;
const ENEMY_HEIGHT = 50;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;

const MIN_CANYON_DISTANCE = 400;
const MIN_PLATFORM_DISTANCE_X = 200;
const MIN_PLATFORM_DISTANCE_Y = 50;
const MIN_COIN_DISTANCE = 60;
const MIN_ENEMY_DISTANCE = 200;

function preload() {
    background = loadImage("background.jpg");
}

function setup() {
    createCanvas(windowWidth, innerHeight);
    frameRate(60);

    createControls();
    
    backMusic.volume = musicVolume;
    backMusic.loop = true;

    createWorld();
    player = createPlayer();
}

function createControls() {
    let rightX = width - SLIDER_WIDTH - UI_MARGIN;
    
    soundSlider = createSlider(0, 1, soundVolume, 0.1);
    soundSlider.position(rightX, UI_MARGIN);
    soundSlider.style('width', SLIDER_WIDTH + 'px');
    soundSlider.style('background', `linear-gradient(90deg, #4CAF50 0%, #4CAF50 ${soundVolume*100}%, #ddd ${soundVolume*100}%)`);
    soundSlider.style('border-radius', '10px');
    soundSlider.style('height', SLIDER_HEIGHT + 'px');
    soundSlider.style('-webkit-appearance', 'none');
    soundSlider.input(updateSliderStyle);

    musicSlider = createSlider(0, 1, musicVolume, 0.1);
    musicSlider.position(rightX, UI_MARGIN + LABEL_HEIGHT * 2);
    musicSlider.style('width', SLIDER_WIDTH + 'px');
    musicSlider.style('background', `linear-gradient(90deg, #2196F3 0%, #2196F3 ${musicVolume*100}%, #ddd ${musicVolume*100}%)`);
    musicSlider.style('border-radius', '10px');
    musicSlider.style('height', SLIDER_HEIGHT + 'px');
    musicSlider.style('-webkit-appearance', 'none');
    musicSlider.input(updateSliderStyle);

    soundLabel = createDiv('Звуки');
    soundLabel.position(rightX, UI_MARGIN + SLIDER_HEIGHT);
    soundLabel.style('color', 'black');
    soundLabel.style('font-family', 'Arial');
    soundLabel.style('font-size', '14px');
    soundLabel.style('margin-top', '5px');
    
    musicLabel = createDiv('Музыка');
    musicLabel.position(rightX, UI_MARGIN + LABEL_HEIGHT * 2 + SLIDER_HEIGHT);
    musicLabel.style('color', 'black');
    musicLabel.style('font-family', 'Arial');
    musicLabel.style('font-size', '14px');
    musicLabel.style('margin-top', '5px');

    restartButton = createButton('Начать заново');
    restartButton.position(width / 2 - 50, height / 2 + 100);
    restartButton.size(100, 40);
    restartButton.mousePressed(restartGame);
    restartButton.hide();
    restartButton.style('font-family', 'Arial');
    restartButton.style('font-size', '16px');
    restartButton.style('background-color', '#4CAF50');
    restartButton.style('color', 'white');
    restartButton.style('border', 'none');
    restartButton.style('border-radius', '5px');
    restartButton.style('cursor', 'pointer');
}

function updateSliderStyle() {
    soundSlider.style('background', `linear-gradient(90deg, #4CAF50 0%, #4CAF50 ${soundSlider.value()*100}%, #ddd ${soundSlider.value()*100}%)`);
    musicSlider.style('background', `linear-gradient(90deg, #2196F3 0%, #2196F3 ${musicSlider.value()*100}%, #ddd ${musicSlider.value()*100}%)`);
}

function createWorld() {
    createClouds();
    createFloor();
    createCanyonsAndPlatforms();
    createAdditionalPlatforms();
    createCoins();
    createEnemies();
}

function createClouds() {
    for (let i = 0; i < 15; i++) {
        clouds.push({
            x: random(worldWidth),
            y: random(50, 200),
            speed: random(1, 3),
            size: random(50, 150),
            draw: function() {
                noStroke();
                fill(255, 255, 255, 200);
                ellipse(this.x, this.y, this.size, this.size * 0.6);
                ellipse(this.x + this.size * 0.3, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.5);
                ellipse(this.x - this.size * 0.3, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.5);
            },
            move: function() {
                this.x += this.speed;
                if (this.x > worldWidth + this.size) {
                    this.x = -this.size;
                }
            }
        });
    }
}

function createFloor() {
    floor = {
        x: 0,
        height: 200,
        color: color(0, 128, 0),
        draw: function() {
            fill(this.color);
            rect(this.x, height - this.height, worldWidth, this.height);
        }
    };
}

function createCanyonsAndPlatforms() {
    let lastCanyonX = -MIN_CANYON_DISTANCE;
    const MAX_ATTEMPTS = 100;
    
    for (let i = 0; i < countCanyons; i++) {
        let canyonWidth = random(150, 250);
        let canyonX;
        let attempts = 0;
        let validPosition = false;
        
        while (!validPosition && attempts < MAX_ATTEMPTS) {
            attempts++;
            canyonX = random(300, worldWidth - canyonWidth - 300);
            validPosition = true;
            
            if (abs(canyonX - lastCanyonX) < MIN_CANYON_DISTANCE) {
                validPosition = false;
                continue;
            }
            
            for (let canyon of canyons) {
                if (abs(canyonX - canyon.x) < MIN_CANYON_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (!validPosition) continue;
        
        lastCanyonX = canyonX;
        
        canyons.push({
            x: canyonX,
            y: height - floor.height,
            width: canyonWidth,
            height: floor.height,
            draw: function() {
                fill(139, 69, 19);
                rect(this.x, this.y, this.width, this.height);
            }
        });
        
        if (random() > 0.3) {
            platforms.push(createPlatform(
                canyonX + canyonWidth/2 - PLATFORM_WIDTH/2,
                height - floor.height - 150 - random(0, 100)
            ));
        }
    }
}

function createAdditionalPlatforms() {
    const MAX_PLATFORMS = 15;
    const MAX_ATTEMPTS = 200;
    let attempts = 0;
    
    while (platforms.length < MAX_PLATFORMS && attempts < MAX_ATTEMPTS) {
        attempts++;
        let platformX = random(200, worldWidth - 200);
        let platformY = height - floor.height - 100 - random(0, 300);
        let validPosition = true;
        
        for (let canyon of canyons) {
            if (platformX < canyon.x + canyon.width && 
                platformX + PLATFORM_WIDTH > canyon.x && 
                platformY + PLATFORM_HEIGHT > height - floor.height) {
                validPosition = false;
                break;
            }
        }
        
        if (!validPosition) continue;
        
        for (let platform of platforms) {
            if (abs(platformX - platform.x) < MIN_PLATFORM_DISTANCE_X && 
                abs(platformY - platform.y) < MIN_PLATFORM_DISTANCE_Y) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            platforms.push(createPlatform(platformX, platformY));
        }
    }
}

function createPlatform(x, y) {
    return {
        x: x,
        y: y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        color: color(41, 105, 39),
        draw: function() {
            fill(this.color);
            rect(this.x, this.y, this.width, this.height);
        },
        checkCollision: function(player) {
            return (
                player.x < this.x + this.width &&
                player.x + player.width > this.x &&
                player.y + player.height > this.y &&
                player.y < this.y + this.height &&
                player.speedGravity > 0 &&
                player.y + player.height < this.y + this.height + 10
            );
        }
    };
}

function createCoins() {
    const MAX_ATTEMPTS = 500;
    let attempts = 0;
    
    while (coins.length < countCoins && attempts < MAX_ATTEMPTS) {
        attempts++;
        let coinX = random(50, worldWidth - 50);
        let coinY = random(100, height - floor.height - 100);
        let validPosition = true;
        
        for (let canyon of canyons) {
            if (coinX > canyon.x && coinX < canyon.x + canyon.width && 
                coinY > height - floor.height - 50) {
                validPosition = false;
                break;
            }
        }
        
        if (!validPosition) continue;
        
        for (let coin of coins) {
            if (dist(coinX, coinY, coin.x, coin.y) < MIN_COIN_DISTANCE) {
                validPosition = false;
                break;
            }
        }
        
        if (!validPosition) continue;
        
        let onGround = (coinY >= height - floor.height - 30 && coinY <= height - floor.height - 10);
        let onPlatform = false;
        
        for (let platform of platforms) {
            if (coinX > platform.x - 15 && coinX < platform.x + platform.width + 15 &&
                coinY > platform.y - 30 && coinY < platform.y) {
                onPlatform = true;
                break;
            }
        }
        
        if (onGround || onPlatform) {
            coins.push({
                x: coinX,
                y: coinY,
                size: COIN_SIZE,
                collected: false,
                draw: function() {
                    if (this.collected) return;
                    strokeWeight(2);
                    stroke("orange");
                    fill("yellow");
                    circle(this.x, this.y, this.size);
                }
            });
        }
    }
}

function createEnemies() {
    const MAX_ATTEMPTS = 200;
    let attempts = 0;
    
    while (enemies.length < countEnemies && attempts < MAX_ATTEMPTS) {
        attempts++;
        let enemyX = random(300, worldWidth - 300);
        let patrolRange = random(50, 150);
        let enemyLeft = enemyX - patrolRange;
        let enemyRight = enemyX + patrolRange;
        let validPosition = true;
        
        for (let canyon of canyons) {
            if ((enemyLeft < canyon.x + canyon.width && enemyRight > canyon.x) ||
                (enemyX > canyon.x && enemyX < canyon.x + canyon.width)) {
                validPosition = false;
                break;
            }
        }
        
        if (!validPosition) continue;
        
        for (let enemy of enemies) {
            if ((enemyLeft < enemy.Right && enemyRight > enemy.Left) ||
                (enemyX > enemy.Left && enemyX < enemy.Right)) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            enemies.push({
                x: enemyX,
                y: height - floor.height - ENEMY_HEIGHT,
                Left: enemyLeft,
                Right: enemyRight,
                direction: random([-1, 1]),
                speed: random(1, 3),
                dead: false,
                draw: function() {
                    if (this.dead) return;
                    stroke(0);
                    strokeWeight(2);
                    fill(230, 117, 164);
                    rect(this.x, this.y, ENEMY_WIDTH, ENEMY_HEIGHT);
                    fill(255);
                    ellipse(this.x + 20, this.y + 15, 10, 10);
                    ellipse(this.x + 50, this.y + 15, 10, 10);
                    fill(0);
                    ellipse(this.x + 20, this.y + 15, 5, 5);
                    ellipse(this.x + 50, this.y + 15, 5, 5);
                },
                move: function() {
                    if (this.dead) return;
                    this.x += this.speed * this.direction;
                    if (this.x <= this.Left) {
                        this.direction = 1;
                    } else if (this.x >= this.Right) {
                        this.direction = -1;
                    }
                }
            });
        }
    }
}

function createPlayer() {
    return {
        x: 100,
        y: height - floor.height - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speedGravity: 0,
        color: "#a49797",
        grounded: false,
        dead: false,
        bullets: [],
        lastShotTime: 0,
        shootingCooldown: 500,
        facingRight: true,
        onPlatform: false,

        draw: function() {
            fill(this.color);
            rect(this.x, this.y, this.width, this.height);
            this.drawEyes();
            this.gunDraw();
            this.drawEars();
        },

        drawEars: function() {
            fill(this.color);
            triangle(this.x, this.y, this.x + 10, this.y - 20, this.x + 20, this.y);
            triangle(this.x + this.width - 20, this.y, this.x + this.width - 10, this.y - 20, this.x + this.width, this.y);
        },

        drawEyes: function() {
            fill(0);
            let eyeWidth = 10;
            let eyeHeight = 10;
            let eyeYOffset = 15;
            let eyeXOffset = 12;

            if (this.dead) {
                fill(200);
                ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
            } else {
                if (eyeOpen) {
                    ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                    ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                } else {
                    fill(200);
                    ellipse(this.x + eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                    ellipse(this.x + this.width - eyeXOffset, this.y + eyeYOffset, eyeWidth, eyeHeight);
                }
            }
        },

        updateEyes: function() {
            blinkTimer++;
            if (blinkTimer > 60) {
                eyeOpen = !eyeOpen;
                blinkTimer = 0;
            }
        },

        gravity: function() {
            if (this.speedGravity < 15) {
                this.speedGravity++;
            }
            this.y += this.speedGravity;

            this.onPlatform = false;
            for (let platform of platforms) {
                if (platform.checkCollision(this)) {
                    this.y = platform.y - this.height;
                    this.grounded = true;
                    this.onPlatform = true;
                    this.speedGravity = 0;
                    break;
                }
            }
            
            if (this.dead) {
                if (this.y > height) {
                    this.y = height - floor.height - this.height;
                    this.x = 100;
                    this.dead = false;
                    isGameOver = true;
                }
            } else if (!this.onPlatform && this.y + this.height > height - floor.height) {
                this.y = height - floor.height - this.height;
                this.grounded = true;
                this.speedGravity = 0;
            } else if (!this.onPlatform) {
                this.grounded = false;
            }
        },

        jump: function() {
            if (this.grounded) {
                this.speedGravity = -20;
                this.grounded = false;
                jumpSound.volume = soundVolume;
                jumpSound.play();
            }
        },

        moveLeft: function() {
            this.x -= 5;
            this.facingRight = false;
        },

        moveRight: function() {
            this.x += 5;
            this.facingRight = true;
        },

        movement: function() {
            if (this.dead) return;
            
            if (this.x < 0) this.x = 0;
            if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
            
            if (this.grounded && keyIsDown(87)) this.jump();
            if (keyIsDown(68)) this.moveRight();
            if (keyIsDown(65)) this.moveLeft();
        },

        checkCanyon: function() {
            for (let canyon of canyons) {
                if (
                    this.y + this.height >= height - floor.height &&
                    this.x > canyon.x &&
                    this.x + this.width < canyon.x + canyon.width
                ) {
                    this.grounded = false;
                    this.dead = true;
                    this.speedGravity = 3;
                    isGameOver = true;
                    backMusic.pause();
                }
            }
        },

        checkCollisionWithCoins: function() {
            for (let i = coins.length - 1; i >= 0; i--) {
                let coin = coins[i];
                if (!coin.collected) {
                    let d = dist(this.x + this.width/2, this.y + this.height/2, coin.x, coin.y);
                    if (d < (coin.size + this.width)/2) {
                        coin.collected = true;
                        score += 5;
                        coinSound.volume = soundVolume;
                        coinSound.play();
                    }
                }
            }
        },

        gunDraw: function() {
            noStroke();
            fill(0);
            if (this.facingRight) {
                rect(this.x + this.width, this.y + this.height/2 - 5, 10, 10);
                rect(this.x + this.width + 10, this.y + this.height/2 - 2, 30, 4);
            } else {
                rect(this.x - 10, this.y + this.height/2 - 5, 10, 10);
                rect(this.x - 40, this.y + this.height/2 - 2, 30, 4);
            }
        },

        canShoot: function() {
            return millis() - this.lastShotTime >= this.shootingCooldown;
        },

        gunShot: function() {
            if (this.canShoot()) {
                let newBullet = {
                    x: this.facingRight ? this.x + this.width + 40 : this.x - 40,
                    y: this.y + this.height/2,
                    speed: this.facingRight ? 10 : -10,
                    size: 5
                };
                this.bullets.push(newBullet);
                this.lastShotTime = millis();
                shotSound.volume = soundVolume;
                shotSound.play();
            }
        },

        bulletUpdate: function() {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                b.x += b.speed;

                for (let enemy of enemies) {
                    if (!enemy.dead && 
                        b.x > enemy.x && b.x < enemy.x + ENEMY_WIDTH && 
                        b.y > enemy.y && b.y < enemy.y + ENEMY_HEIGHT) {
                        enemy.dead = true;
                        score += 10;
                        this.bullets.splice(i, 1);
                        break;
                    }
                }

                if (b.x < 0 || b.x > worldWidth) {
                    this.bullets.splice(i, 1);
                }
            }
        },

        bulletDraw: function() {
            fill(0);
            noStroke();
            for (let bullet of this.bullets) {
                ellipse(bullet.x, bullet.y, bullet.size);
            }
        },

        checkCollisionWithEnemies: function() {
            if (this.dead) return;

            for (let enemy of enemies) {
                if (!enemy.dead &&
                    this.x < enemy.x + ENEMY_WIDTH &&
                    this.x + this.width > enemy.x &&
                    this.y < enemy.y + ENEMY_HEIGHT &&
                    this.y + this.height > enemy.y) {
                    this.dead = true;
                    this.speedGravity = 3;
                    isGameOver = true;
                    backMusic.pause();
                    break;
                }
            }
        }
    };
}

function updateCamera() {
    let leftEdge = cameraOffset + cameraEdgeOffset;
    let rightEdge = cameraOffset + width - cameraEdgeOffset;

    if (player.x < leftEdge) {
        cameraOffset = player.x - cameraEdgeOffset;
    } else if (player.x > rightEdge) {
        cameraOffset = player.x - width + cameraEdgeOffset;
    }

    cameraOffset = constrain(cameraOffset, 0, worldWidth - width);
}

function restartGame() {
    isGameOver = false;
    cameraOffset = 0;
    score = 0;
    
    player.dead = false;
    player.x = 100;
    player.y = height - floor.height - PLAYER_HEIGHT;
    player.speedGravity = 0;
    player.bullets = [];
    
    canyons = [];
    coins = [];
    enemies = [];
    platforms = [];
    clouds = [];
    
    createWorld();
    
    restartButton.hide();
    backMusic.currentTime = 0;
    backMusic.play();
}

function drawGameOverScreen() {
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    stroke(255, 0, 0);
    strokeWeight(3);
    rect(width/2 - 200, height/2 - 120, 400, 200, 15);
    
    fill(255, 0, 0);
    textSize(48);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width/2, height/2 - 80);
    
    fill(0);
    textSize(32);
    textStyle(NORMAL);
    text("Счет: " + score, width/2, height/2 - 20);
    
    soundSlider.hide();
    musicSlider.hide();
    soundLabel.hide();
    musicLabel.hide();
}

function draw() {
    if (isGameOver) {
        drawGameOverScreen();
        restartButton.show();
        return;
    }

    updateCamera();
    
    push();
    translate(-cameraOffset, 0);
    
    image(background, 0, 0, worldWidth, height);
    
    soundVolume = soundSlider.value();
    musicVolume = musicSlider.value();
    backMusic.volume = musicVolume;
    
    if (backMusic.paused) backMusic.play();

    for (let cloud of clouds) {
        cloud.move();
        cloud.draw();
    }

    floor.draw();
    for (let canyon of canyons) canyon.draw();
    for (let platform of platforms) platform.draw();
    for (let coin of coins) coin.draw();

    for (let enemy of enemies) {
        enemy.move();
        enemy.draw();
    }

    player.updateEyes();
    player.gravity();
    player.movement();
    player.checkCanyon();
    player.checkCollisionWithEnemies();
    player.checkCollisionWithCoins();

    if (keyIsDown(70)) player.gunShot();
    player.bulletUpdate();
    player.bulletDraw();
    player.draw();

    pop();
    
    drawScore();
    
    soundSlider.show();
    musicSlider.show();
    soundLabel.show();
    musicLabel.show();
}

function drawScore() {
    fill(0);
    noStroke();
    textSize(32);
    textAlign(LEFT, TOP);
    text("Счет: " + score, UI_MARGIN, UI_MARGIN);
}

function windowResized() {
    resizeCanvas(windowWidth, innerHeight);
    
    let rightX = width - SLIDER_WIDTH - UI_MARGIN;
    
    soundSlider.position(rightX, UI_MARGIN);
    musicSlider.position(rightX, UI_MARGIN + LABEL_HEIGHT * 2);
    soundLabel.position(rightX, UI_MARGIN + SLIDER_HEIGHT);
    musicLabel.position(rightX, UI_MARGIN + LABEL_HEIGHT * 2 + SLIDER_HEIGHT);
    
    restartButton.position(width / 2 - 50, height / 2 + 100);
}