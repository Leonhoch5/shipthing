document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('playerBoard');
    const computerBoard = document.getElementById('computerBoard');
    const playerBoardPlacement = document.getElementById('playerBoardPlacement');
    const playerCtx = playerBoard.getContext('2d');
    const computerCtx = computerBoard.getContext('2d');
    const placementCtx = playerBoardPlacement.getContext('2d');
    const menu = document.getElementById('menu');
    const placeShipsMenu = document.getElementById('placeShips');
    const gameOverScreen = document.getElementById('gameOver');
    const pauseMenu = document.getElementById('pauseMenu');
    const startButton = document.getElementById('startButton');
    const donePlacingButton = document.getElementById('donePlacingButton');
    const restartButton = document.getElementById('restartButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const menuButton = document.getElementById('menuButton');
    const gameBoard = document.getElementById('gameBoard');
    const winnerDisplay = document.getElementById('winner');

    const boardSize = 10;
    const cellSize = playerBoard.width / boardSize;
    let playerShips = [];
    let computerShips = [];
    let playerShots = [];
    let computerShots = [];
    let playerTurn = true;
    let placingShip = null;
    let currentShipIndex = 0;
    let gamePaused = false;

    const shipTypes = [
        { name: 'Carrier', length: 5 },
        { name: 'Battleship', length: 4 },
        { name: 'Cruiser', length: 3 },
        { name: 'Submarine', length: 3 },
        { name: 'Destroyer', length: 2 }
    ];

    startButton.addEventListener('click', () => {
        menu.style.display = 'none';
        placeShipsMenu.style.display = 'flex';
        initializePlacement();
    });

    donePlacingButton.addEventListener('click', () => {
        if (playerShips.length === shipTypes.length) {
            placeShipsMenu.style.display = 'none';
            gameBoard.style.display = 'flex';
            startGame();
        } else {
            alert("You need to place all ships.");
        }
    });

    restartButton.addEventListener('click', startGame);

    pauseButton.addEventListener('click', () => {
        gamePaused = true;
        gameBoard.style.display = 'none';
        pauseMenu.style.display = 'flex';
    });

    resumeButton.addEventListener('click', () => {
        gamePaused = false;
        pauseMenu.style.display = 'none';
        gameBoard.style.display = 'flex';
    });

    menuButton.addEventListener('click', () => {
        pauseMenu.style.display = 'none';
        menu.style.display = 'flex';
    });

    function startGame() {
        gameOverScreen.style.display = 'none';
        gameBoard.style.display = 'flex';

        computerShips = placeShips();
        playerShots = [];
        computerShots = [];
        playerTurn = true;

        drawBoard(playerCtx, playerShips, playerShots);
        drawBoard(computerCtx, computerShips, playerShots, true);

        computerBoard.addEventListener('click', handlePlayerShot);
    }

    function initializePlacement() {
        playerShips = [];
        currentShipIndex = 0;
        drawBoard(placementCtx, playerShips, [], false, true);
        playerBoardPlacement.addEventListener('click', handlePlaceShip);
        document.addEventListener('keydown', handleRotateShip);
    }

    function handlePlaceShip(e) {
        const rect = playerBoardPlacement.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);

        if (placingShip === null) {
            placingShip = { x, y, length: shipTypes[currentShipIndex].length, horizontal: true };
            drawBoard(placementCtx, playerShips, [], false, true, placingShip);
        } else {
            if (canPlaceShip(placingShip.x, placingShip.y, placingShip.length, placingShip.horizontal, playerShips)) {
                const ship = [];
                for (let i = 0; i < placingShip.length; i++) {
                    if (placingShip.horizontal) {
                        ship.push({ x: placingShip.x + i, y: placingShip.y });
                    } else {
                        ship.push({ x: placingShip.x, y: placingShip.y + i });
                    }
                }
                playerShips.push(ship);
                placingShip = null;
                currentShipIndex++;
                if (currentShipIndex >= shipTypes.length) {
                    playerBoardPlacement.removeEventListener('click', handlePlaceShip);
                    document.removeEventListener('keydown', handleRotateShip);
                    drawBoard(placementCtx, playerShips, [], false, true);
                } else {
                    drawBoard(placementCtx, playerShips, [], false, true);
                }
            } else {
                placingShip = null;
                drawBoard(placementCtx, playerShips, [], false, true);
            }
        }
    }

    function handleRotateShip(e) {
        if (e.key === 'r' || e.key === 'R') {
            if (placingShip !== null) {
                placingShip.horizontal = !placingShip.horizontal;
                drawBoard(placementCtx, playerShips, [], false, true, placingShip);
            }
        }
    }

    function handlePlayerShot(e) {
        if (!playerTurn || gamePaused) return;

        const rect = computerBoard.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);

        if (!playerShots.some(shot => shot.x === x && shot.y === y)) {
            playerShots.push({ x, y });
            drawBoard(computerCtx, computerShips, playerShots, true);

            if (isHit(x, y, computerShips)) {
                if (isGameOver(computerShips, playerShots)) {
                    endGame(true);
                }
            } else {
                playerTurn = false;
                setTimeout(computerMove, 1000);
            }
        }
    }

    function computerMove() {
        if (gamePaused) return;

        let x, y;
        do {
            x = Math.floor(Math.random() * boardSize);
            y = Math.floor(Math.random() * boardSize);
        } while (computerShots.some(shot => shot.x === x && shot.y === y));

        computerShots.push({ x, y });
        drawBoard(playerCtx, playerShips, computerShots);

        if (isHit(x, y, playerShips)) {
            if (isGameOver(playerShips, computerShots)) {
                endGame(false);
            } else {
                setTimeout(computerMove, 1000);
            }
        } else {
            playerTurn = true;
        }
    }

    function drawBoard(ctx, ships, shots, hideShips = false, placementMode = false, placingShip = null) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        if (!hideShips) {
            ships.forEach(ship => {
                ship.forEach(part => {
                    ctx.fillRect(part.x * cellSize, part.y * cellSize, cellSize, cellSize);
                });
            });
        }

        shots.forEach(shot => {
            ctx.fillStyle = isHit(shot.x, shot.y, ships) ? 'red' : 'white';
            ctx.fillRect(shot.x * cellSize, shot.y * cellSize, cellSize, cellSize);
        });

        if (placementMode && placingShip !== null) {
            ctx.fillStyle = canPlaceShip(placingShip.x, placingShip.y, placingShip.length, placingShip.horizontal, ships) ? 'green' : 'red';
            for (let i = 0; i < placingShip.length; i++) {
                const x = placingShip.horizontal ? placingShip.x + i : placingShip.x;
                const y = placingShip.horizontal ? placingShip.y : placingShip.y + i;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }

    function isHit(x, y, ships) {
        return ships.some(ship => ship.some(part => part.x === x && part.y === y));
    }

    function isGameOver(ships, shots) {
        return ships.every(ship => ship.every(part => shots.some(shot => shot.x === part.x && shot.y === part.y)));
    }

    function endGame(playerWon) {
        gameOverScreen.style.display = 'flex';
        gameBoard.style.display = 'none';
        winnerDisplay.textContent = playerWon ? 'You Win!' : 'Computer Wins!';
        computerBoard.removeEventListener('click', handlePlayerShot);
    }

    function canPlaceShip(x, y, length, horizontal, ships) {
        for (let i = 0; i < length; i++) {
            const xi = horizontal ? x + i : x;
            const yi = horizontal ? y : y + i;
            if (xi < 0 || xi >= boardSize || yi < 0 || yi >= boardSize || ships.some(ship => ship.some(part => part.x === xi && part.y === yi))) {
                return false;
            }
        }
        return true;
    }

    function placeShips() {
        const ships = [];
        shipTypes.forEach(shipType => {
            let ship;
            do {
                const horizontal = Math.random() < 0.5;
                const x = Math.floor(Math.random() * (boardSize - (horizontal ? shipType.length : 0)));
                const y = Math.floor(Math.random() * (boardSize - (horizontal ? 0 : shipType.length)));
                ship = [];
                for (let i = 0; i < shipType.length; i++) {
                    if (horizontal) {
                        ship.push({ x: x + i, y });
                    } else {
                        ship.push({ x, y: y + i });
                    }
                }
            } while (!canPlaceShip(ship[0].x, ship[0].y, ship.length, ship[0].x !== ship[1].x, ships));
            ships.push(ship);
        });
        return ships;
    }
});
