let player;
let floor;
let countCanyons = 1;
let countCoins = 10;
let countEnemies = 4;
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

let soundSlider;
let musicSlider;
let sliderY = 50;
let sliderX = 50;
let sliderWidth = 150;
let sliderHeight = 20;

let restartButton;
let isGameOver = false;

function preload() {
    background = loadImage("background.jpg");
}

function setup() {
    createCanvas(windowWidth, innerHeight);

    soundSlider = createSlider(0, 1, soundVolume, 0.1);
    soundSlider.position(sliderX, sliderY);
    soundSlider.style('width', sliderWidth + 'px');

    musicSlider = createSlider(0, 1, musicVolume, 0.1);
    musicSlider.position(sliderX, sliderY + 40);
    musicSlider.style('width', sliderWidth + 'px');

    let soundLabel = createDiv('Громкость звуков');
    soundLabel.position(sliderX, sliderY + 13);
    soundLabel.style('color', 'black');
    soundLabel.style('font-family', 'Arial');
    soundLabel.style('font-size', '14px');
    soundLabel.style('margin-top', '5px');
    
    let musicLabel = createDiv('Громкость музыки');
    musicLabel.position(sliderX, sliderY + 53);
    musicLabel.style('color', 'black');
    musicLabel.style('font-family', 'Arial');
    musicLabel.style('font-size', '14px');
    musicLabel.style('margin-top', '5px');

    restartButton = createButton('Начать заново');
    restartButton.position(width / 2 - 50, height / 2 + 100);
    restartButton.size(100, 40);
    restartButton.mousePressed(restartGame);
    restartButton.hide();

    backMusic.volume = musicVolume;

    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: random(width),
            y: random(50, 200),
            speed: random(1, 3),
            size: random(50, 150),
            draw: function () {
                noStroke();
                fill(255, 255, 255, 200);
                ellipse(this.x, this.y, this.size, this.size * 0.6);
                ellipse(this.x + this.size * 0.3, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.5);
                ellipse(this.x - this.size * 0.3, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.5);
            },
            move: function () {
                this.x += this.speed;
                if (this.x > width + this.size) {
                    this.x = -this.size;
                }
            }
        });
    }

    floor = {
        x: 0,
        height: 200,
        color: color(0, 128, 0),
        draw: function () {
            fill(this.color);
            rect(this.x, innerHeight - this.height, width, this.height);
        }
    };

    for (let i = 0; i < countCanyons; i++) {
        canyons.push({
            x: 250 + i * 400,
            y: innerHeight - floor.height,
            width: 100,
            height: floor.height,
            draw: function () {
                fill(139, 69, 19);
                rect(this.x, this.y, this.width, this.height);
            }
        });
    }

    for (let i = 0; i < 7; i++) {
        platforms.push({
            x: 160 + i * 250,
            y: innerHeight - floor.height - 100 - i * 50,
            width: 150,
            height: 20,
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
        });
    }

    for (let i = 0; i < countEnemies; i++) {
        enemies.push({
            x: 300 + i * 200,
            y: innerHeight - floor.height - 50,
            Left: 400 + i * 200,
            Right: 700 + i * 200,
            direction: 1,
            random: 0,
            dead: false,

            draw: function () {
                if (this.dead) return;
                stroke(0);
                strokeWeight(2);
                fill(230, 117, 164);
                rect(this.x, this.y, 75, 50);
                fill(255);
                ellipse(this.x + 20, this.y + 15, 10, 10);
                ellipse(this.x + 50, this.y + 15, 10, 10);
                fill(0);
                ellipse(this.x + 20, this.y + 15, 5, 5);
                ellipse(this.x + 50, this.y + 15, 5, 5);
            },
            move: function () {
                if (this.dead) return;
                this.x += this.random * this.direction;
                if (this.x <= this.Left) {
                    this.x += this.Left - this.x;
                    this.direction *= -1;
                } else if (this.x >= this.Right) {
                    this.x -= this.x - this.Right;
                    this.direction *= -1;
                }
            }
        });
    }

    for (let i = 0; i < countCoins; i++) {
        coins.push({
            x: 350 + i * 3,
            y: innerHeight - floor.height - 50,
            size: 30,
            random: Math.floor(Math.random() * (7 - 1)) + 1,
            collected: false,

            draw: function () {
                if (this.collected) return;
                strokeWeight(2);
                stroke("orange");
                fill("yellow");
                circle(this.x * this.random, this.y, this.size);
            }
        });
    }

    player = {
        x: 100,
        y: innerHeight - floor.height,
        width: 60,
        height: 60,
        speedGravity: -5,
        color: "#a49797",
        grounded: false,
        dead: false,
        bullets: [],
        lastShotTime: 0,
        shootingCooldown: 500,
        facingRight: true,
        onPlatform: false,

        draw: function () {
            fill(this.color);
            rect(this.x, this.y, this.width, this.height);
            this.drawEyes();
            this.gunDraw();
            this.drawEars();
        },

        drawEars: function () {
            fill(this.color);
            triangle(this.x, this.y, this.x + 10, this.y - 20, this.x + 20, this.y);
            triangle(this.x + this.width - 20, this.y, this.x + this.width - 10, this.y - 20, this.x + this.width, this.y);
        },

        drawEyes: function () {
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

        updateEyes: function () {
            blinkTimer++;
            if (blinkTimer > 60) {
                eyeOpen = !eyeOpen;
                blinkTimer = 0;
            }
        },

        gravity: function (floorHeight) {
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
                    this.y = floorHeight;
                    this.x = 100;
                    this.dead = false;
                }
            } else if (!this.onPlatform && this.y + this.height > height - floorHeight) {
                this.y = height - floorHeight - this.height;
                this.grounded = true;
            } else if (!this.onPlatform) {
                this.grounded = false;
            }
        },

        jump: function () {
            if (this.grounded) {
                this.speedGravity = -20;
                this.grounded = false;
                jumpSound.play();
            }
        },

        moveLeft: function () {
            this.x -= 4;
            this.facingRight = false;
        },

        moveRight: function () {
            this.x += 4;
            this.facingRight = true;
        },

        movement: function () {
            if (this.dead) return;
            if (this.x < -10) this.x = innerWidth + 5;
            if (this.x > innerWidth + 10) this.x = -5;
            if (this.grounded && keyIsDown(87)) this.jump();
            if (keyIsDown(68)) this.moveRight();
            if (keyIsDown(65)) this.moveLeft();
        },

        checkCanyon: function () {
            for (let i = 0; i < canyons.length; i++) {
                if (
                    this.y + this.height >= height - floor.height &&
                    this.x > canyons[i].x &&
                    this.x + this.width < canyons[i].x + canyons[i].width
                ) {
                    this.grounded = false;
                    this.dead = true;
                    this.speedGravity = 3;
                    isGameOver = true;
                }
            }
        },

        checkCollisionWithCoins: function () {
            for (let coin of coins) {
                if (!coin.collected) {
                    let coinX = coin.x * coin.random;
                    let coinY = coin.y;
                    let d = dist(this.x + this.width / 2, this.y + this.height / 2, coinX, coinY);

                    if (d < (coin.size + this.width) / 2) {
                        coin.collected = true;
                        score += 5;
                        coinSound.play();
                    }
                }
            }
        },

        gunDraw: function () {
            noStroke();
            fill(0);
            if (this.facingRight) {
                rect(this.x + this.width, this.y + this.height / 2 - 5, 10, 10);
                rect(this.x + this.width + 10, this.y + this.height / 2 - 2, 30, 4);
            } else {
                rect(this.x - 10, this.y + this.height / 2 - 5, 10, 10);
                rect(this.x - 40, this.y + this.height / 2 - 2, 30, 4);
            }
        },

        canShoot: function () {
            const currentTime = millis();
            return currentTime - this.lastShotTime >= this.shootingCooldown;
        },

        gunShot: function () {
            if (this.canShoot()) {
                let newBullet = {
                    x: this.facingRight ? this.x + this.width + 40 : this.x - 40,
                    y: this.y + this.height / 2,
                    speed: this.facingRight ? 10 : -10,
                    size: 5,
                    color: color(0)
                };
                this.bullets.push(newBullet);
                this.lastShotTime = millis();
                shotSound.play();
            }
        },

        bulletUpdate: function () {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                b.x += b.speed;

                for (let enemy of enemies) {
                    if (b.x > enemy.x && b.x < enemy.x + 75 && b.y > enemy.y && b.y < enemy.y + 50 && !enemy.dead) {
                        enemy.dead = true;
                        score += 10;
                        this.bullets.splice(i, 1);
                        break;
                    }
                }

                if (b.x > width || b.x < 0) {
                    this.bullets.splice(i, 1);
                }
            }
        },

        bulletDraw: function () {
            fill(0);
            noStroke();
            for (let bullet of this.bullets) {
                ellipse(bullet.x, bullet.y, bullet.size, bullet.size);
            }
        },

        checkCollisionWithEnemies: function () {
            if (this.dead) return;

            for (let enemy of enemies) {
                if (
                    !enemy.dead &&
                    this.x < enemy.x + 75 &&
                    this.x + this.width > enemy.x &&
                    this.y < enemy.y + 50 &&
                    this.y + this.height > enemy.y
                ) {
                    this.dead = true;
                    this.speedGravity = 3;
                    isGameOver = true;
                    break;
                }
            }
        }
    };
}

function restartGame() {
    isGameOver = false;
    player.dead = false;
    player.x = 100;
    player.y = innerHeight - floor.height;
    player.speedGravity = -5;
    player.bullets = [];
    score = 0;

    for (let enemy of enemies) {
        enemy.dead = false;
    }

    for (let coin of coins) {
        coin.collected = false;
    }

    restartButton.hide();
}

function drawGameOverScreen() {
    fill(0, 150);
    rect(0, 0, width, height);

    fill(255);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 50);
}

function draw() {
    if (isGameOver) {
        drawGameOverScreen();
        restartButton.show();
        return;
    }

    soundVolume = soundSlider.value();
    musicVolume = musicSlider.value();
    
    backMusic.volume = musicVolume;
    shotSound.volume = soundVolume;
    coinSound.volume = soundVolume;
    jumpSound.volume = soundVolume;

    image(background, 0, 0, width, height);
    backMusic.play();

    for (let cloud of clouds) {
        cloud.move();
        cloud.draw();
    }

    floor.draw();

    for (let platform of platforms) {
        platform.draw();
    }

    for (let canyon of canyons) {
        canyon.draw();
    }

    for (let coin of coins) {
        coin.draw();
    }

    for (let enemy of enemies) {
        enemy.random = Math.floor(Math.random() * (7 - 1)) + 1;
        enemy.move();
        enemy.draw();
    }

    player.updateEyes();
    player.gravity(floor.height);
    player.movement();
    player.checkCanyon();
    player.checkCollisionWithEnemies();
    player.checkCollisionWithCoins();

    if (keyIsDown(70)) {
        player.gunShot();
    }

    player.bulletUpdate();
    player.bulletDraw();
    player.draw();

    drawScore();
}

function drawScore() {
    fill(0);
    noStroke();
    textSize(32);
    textAlign(LEFT, TOP);
    text("Score: " + score, 50, 10);
}

function windowResized() {
    resizeCanvas(windowWidth, innerHeight);
}