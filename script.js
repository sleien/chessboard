document.addEventListener('DOMContentLoaded', async () => {
    let chessboard = document.getElementsByClassName('chessboard')[0];
    let chessboardSize = 8;

    for (let i = 0; i < chessboardSize; i++) {
        for (let j = 0; j < chessboardSize; j++) {
            let cell = document.createElement('div');
            cell.classList.add((i + j) % 2 === 0 ? 'dark' : 'bright')
            chessboard.appendChild(cell);
        }
    }

    let numbersContainers = document.getElementsByClassName('numbers');
    let lettersContainers = document.getElementsByClassName('letters');

    Array.from(numbersContainers).forEach((container) => {
        for (let i = 0; i < chessboardSize; i++) {
            let number = document.createElement('div');
            number.innerText = chessboardSize - i;
            container.appendChild(number);
        }
    });

    Array.from(lettersContainers).forEach((container) => {
        for (let i = 0; i < chessboardSize; i++) {
            let letter = document.createElement('div');
            letter.innerText = String.fromCharCode(65 + i);
            container.appendChild(letter);
        }
    });

    //load local storage
    let gameData = loadGameData() || getStartData();
    saveGameData(gameData);

    //initialize controls
    let resetButton = document.getElementsByClassName('reset')[0];
    let undoButton = document.getElementsByClassName('undo')[0];
    let redoButton = document.getElementsByClassName('redo')[0];
    resetButton.addEventListener('click', () => {
        clearGameData();
        location.reload();
    });
    undoButton.addEventListener('click', () => {
        let gameData = loadGameData();
        if (gameData.moves.length > 0) {
            let lastMove = gameData.moves.pop();
            gameData.undoMoves.push(lastMove);
            let [to, from] = [mapChessNotationToMove(lastMove.from), mapChessNotationToMove(lastMove.to)];
            gameData.board[from.y][from.x] = lastMove.piece;
            gameData.board[to.y][to.x] = lastMove.oldPiece;
            gameData.currentPlayer = gameData.currentPlayer === 'white' ? 'black' : 'white';
            saveGameData(gameData);
            updateBoard(from, to, lastMove.piece, null, document.querySelectorAll('.chessboard div'), lastMove.oldPiece);
            updateMoves();
        }
    });
    redoButton.addEventListener('click', () => {
        let gameData = loadGameData();
        if (gameData.undoMoves.length > 0) {
            let lastMove = gameData.undoMoves.pop();
            gameData.moves.push(lastMove);
            let [from, to] = [mapChessNotationToMove(lastMove.from), mapChessNotationToMove(lastMove.to)];
            gameData.board[from.y][from.x] = lastMove.piece;
            gameData.board[to.y][to.x] = lastMove.oldPiece;
            gameData.currentPlayer = gameData.currentPlayer === 'white' ? 'black' : 'white';
            saveGameData(gameData);
            updateBoard(from, to, lastMove.piece, lastMove.oldPiece, document.querySelectorAll('.chessboard div'));
            updateMoves();
        }
    });



    //initialize meta data
    document.getElementsByClassName('current-player')[0].innerText = ("Current Player: " + (gameData.currentPlayer === 'white' ? 'White' : 'Black'));
    document.getElementsByClassName('game-name')[0].innerText = "Game Name: " + gameData.gameName;
    document.getElementsByClassName('game-moves')[0].innerText = gameData.moves.reverse().map((move) => (move.player).charAt(0).toUpperCase() + ': ' + move.from + ' -> ' + move.to).join('\n');

    //initialize game

    let board = gameData.board;
    let cells = document.querySelectorAll('.chessboard div');

    cells.forEach((cell, index) => {
        let y = Math.floor(index / chessboardSize);
        let x = index % chessboardSize;
        let piece = board[y][x];
        cell.classList.add(piece === 'e' ? 'empty' : `icon-${piece}`);
        //select piece
        if (gameData.currentPiece && gameData.currentPiece.x === x && gameData.currentPiece.y === y) {
            cell.classList.add('selected');
        }

        //on cell click
        cell.addEventListener('click', () => {
            let y = Math.floor(index / chessboardSize);
            let x = index % chessboardSize;
            let piece = board[y][x];

            if (gameData.gameStatus === 'active') {
                if (gameData.currentPiece === null) {
                    if (piece !== 'e' && piece.includes(gameData.currentPlayer)) {
                        gameData.currentPiece = { x, y };
                        saveGameData(gameData);
                        cells[y * 8 + x].classList.add('selected');
                    }
                } else if (gameData.currentPiece.x === x && gameData.currentPiece.y === y) {
                    gameData.currentPiece = null;
                    saveGameData(gameData);
                    cells[y * 8 + x].classList.remove('selected');
                } else {
                    let [px, py] = [gameData.currentPiece.x, gameData.currentPiece.y];
                    let validMove = false;
                    let move = { x, y };

                    if (piece === 'e' || !piece.includes(gameData.currentPlayer)) {
                        validMove = true;
                    }
                    if (gameMethods[board[py][px]]) {
                        validMove = gameMethods[board[py][px]](px, py, move, board);
                    }

                    if (validMove) {
                        let piece = board[py][px];
                        let oldPiece = board[y][x];
                        board[py][px] = 'e';
                        board[y][x] = piece;
                        gameData.currentPiece = null;
                        gameData.moves.push({ 'from': mapMoveToChessNotation({ x: px, y: py }), 'to': mapMoveToChessNotation({ x, y }), 'piece': piece, 'oldPiece': oldPiece, 'player': gameData.currentPlayer });
                        updateMoves();
                        gameData.currentPlayer = gameData.currentPlayer === 'white' ? 'black' : 'white';
                        document.getElementsByClassName('current-player')[0].innerText = ("Current Player: " + (gameData.currentPlayer === 'white' ? 'White' : 'Black'));
                        gameData.undoMoves = [];
                        saveGameData(gameData);
                        // update board
                        updateBoard({ x: px, y: py }, { x, y }, piece, oldPiece, cells);
                        if (oldPiece.includes('king')) {
                            gameData.gameStatus = 'finished';
                            saveGameData(gameData);
                            alert(`${gameData.currentPlayer === 'white' ? 'Black' : 'White'} wins!`);
                        }
                    }
                }
            }
        });
    });
});

function saveGameData(gameData) {
    //save game data to local storage
    localStorage.setItem('gameData', JSON.stringify(gameData));
}

function loadGameData() {
    //load game data from local storage
    return JSON.parse(localStorage.getItem('gameData'));
}

function clearGameData() {
    //clear game data from local storage
    let currentTimestamp = new Date().getTime();
    localStorage.setItem('gameData_' + currentTimestamp, localStorage.getItem('gameData'));
    localStorage.removeItem('gameData');
}

function getStartData() {
    //get start data
    return {
        'player1': {
            'name': 'Player 1',
            'score': 0,
            'color': 'white'
        },
        'player2': {
            'name': 'Player 2',
            'score': 0,
            'color': 'black'
        },
        'currentPlayer': 'white',
        'currentPiece': null,
        'gameStatus': 'active',
        'gameId': uuidv4(),
        'gameName': 'Chess Game',
        'moves': [],
        'undoMoves': [],
        'board': [
            ['black-rook', 'black-knight', 'black-bishop', 'black-queen', 'black-king', 'black-bishop', 'black-knight', 'black-rook'],
            ['black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn', 'black-pawn'],
            ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
            ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
            ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
            ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
            ['white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn', 'white-pawn'],
            ['white-rook', 'white-knight', 'white-bishop', 'white-queen', 'white-king', 'white-bishop', 'white-knight', 'white-rook']
        ]
    }
}

function uuidv4() {
    //generate uuid
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function mapMoveToChessNotation(move) {
    //map move to chess notation
    let x = String.fromCharCode(65 + move.x);
    let y = 8 - move.y;
    return x + y;
}

function mapChessNotationToMove(chessNotation) {
    //map chess notation to move
    let x = chessNotation.charCodeAt(0) - 65;
    let y = 8 - parseInt(chessNotation[1]);
    return { x, y };
}

function updateBoard(from, to, piece, oldPiece, cells, ancientPiece = null) {
    let [px, py] = [from.x, from.y];
    let [x, y] = [to.x, to.y];
    cells[py * 8 + px].classList.remove(`icon-${piece}`);
    cells[py * 8 + px].classList.remove('selected');
    cells[py * 8 + px].classList.add('empty');
    cells[y * 8 + x].classList.add(`icon-${piece}`);
    cells[y * 8 + x].classList.remove(`icon-${oldPiece}`);
    if (ancientPiece) {
        cells[py * 8 + px].classList.add(`icon-${ancientPiece}`);
    }
}

function updateMoves() {
    let gameData = loadGameData();
    document.getElementsByClassName('game-moves')[0].innerText = gameData.moves.reverse().map((move) => (move.player).charAt(0).toUpperCase() + ': ' + move.from + ' -> ' + move.to).join('\n');
}

//gameMethods
let gameMethods = {
    'black-pawn': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x && py === y - 1 && board[y][x] === 'e') {
            validMove = true;
        } else if (px === x && py === y - 2 && py === 1 && board[y][x] === 'e' && board[x][y - 1] === 'e') {
            validMove = true;
        } else if (px === x - 1 && py === y - 1 && board[y][x].includes('white')) {
            validMove = true;
        } else if (px === x + 1 && py === y - 1 && board[y][x].includes('white')) {
            validMove = true;
        }

        return validMove;
    },
    'white-pawn': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x && py === y + 1 && board[y][x] === 'e') {
            validMove = true;
        } else if (px === x && py === y + 2 && py === 6 && board[y][x] === 'e' && board[x][y + 1] === 'e') {
            validMove = true;
        } else if (px === x - 1 && py === y + 1 && board[y][x].includes('black')) {
            validMove = true;
        } else if (px === x + 1 && py === y + 1 && board[y][x].includes('black')) {
            validMove = true;
        }

        return validMove;
    },
    'black-rook': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x || py === y) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'white-rook': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x || py === y) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'black-knight': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if ((px === x + 2 || px === x - 2) && (py === y + 1 || py === y - 1)) {
            validMove = true;
        } else if ((px === x + 1 || px === x - 1) && (py === y + 2 || py === y - 2)) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'white-knight': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if ((px === x + 2 || px === x - 2) && (py === y + 1 || py === y - 1)) {
            validMove = true;
        } else if ((px === x + 1 || px === x - 1) && (py === y + 2 || py === y - 2)) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'black-bishop': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) === Math.abs(py - y)) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'white-bishop': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) === Math.abs(py - y)) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'black-queen': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) === Math.abs(py - y) || px === x || py === y) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'white-queen': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) === Math.abs(py - y) || px === x || py === y) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'black-king': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) <= 1 && Math.abs(py - y) <= 1) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    },
    'white-king': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (Math.abs(px - x) <= 1 && Math.abs(py - y) <= 1) {
            validMove = true;
        } else {
            validMove = false;
        }

        return validMove;
    }
}
