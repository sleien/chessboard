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

    //load local storage
    let gameData = loadGameData() || getStartData();
    saveGameData(gameData);

    let board = gameData.board;
    let cells = document.querySelectorAll('.chessboard div');

    cells.forEach((cell, index) => {
        let x = Math.floor(index / chessboardSize);
        let y = index % chessboardSize;
        let piece = board[x][y];
        cell.classList.add(piece === 'e' ? 'empty' : `icon-${piece}`);
        //select piece
        if (gameData.currentPiece && gameData.currentPiece.x === x && gameData.currentPiece.y === y) {
            cell.classList.add('selected');
        }

        //on cell click
        cell.addEventListener('click', () => {
            let x = Math.floor(index / chessboardSize);
            let y = index % chessboardSize;
            let piece = board[x][y];

            if (gameData.gameStatus === 'active') {
                if (gameData.currentPiece === null) {
                    if (piece !== 'e' && piece.includes(gameData.currentPlayer)) {
                        gameData.currentPiece = { x, y };
                        saveGameData(gameData);
                        cells[x * 8 + y].classList.add('selected');
                    }
                } else if (gameData.currentPiece.x === x && gameData.currentPiece.y === y) {
                    gameData.currentPiece = null;
                    saveGameData(gameData);
                    cells[x * 8 + y].classList.remove('selected');
                } else {
                    let [px, py] = [gameData.currentPiece.x, gameData.currentPiece.y];
                    let validMove = false;
                    let move = { x, y };

                    if (piece === 'e' || !piece.includes(gameData.currentPlayer)) {
                        validMove = true;
                    }
                    if(gameMethods[board[px][py]]) {
                        console.log(board[px][py]);
                        validMove = gameMethods[board[px][py]](px, py, move, board);
                    }

                    console.log('validMove', validMove);

                    if (validMove) {
                        let piece = board[px][py];
                        board[px][py] = 'e';
                        board[x][y] = piece;
                        gameData.currentPiece = null;
                        gameData.currentPlayer = gameData.currentPlayer === 'white' ? 'black' : 'white';
                        saveGameData(gameData);
                        // update board
                        cells[px * 8 + py].classList.remove(`icon-${piece}`);
                        cells[px * 8 + py].classList.add('empty');
                        cells[x * 8 + y].classList.add(`icon-${piece}`);
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

//gameMethods

let gameMethods = {
    'black-pawn': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x && py === y - 1 && board[x][y] === 'e') {
            validMove = true;
        } else if (px === x && py === y - 2 && py === 6 && board[x][y] === 'e' && board[x][y - 1] === 'e') {
            validMove = true;
        } else if (px === x - 1 && py === y - 1 && board[x][y].includes('white')) {
            validMove = true;
        } else if (px === x + 1 && py === y - 1 && board[x][y].includes('white')) {
            validMove = true;
        }

        return validMove;
    },
    'white-pawn': (px, py, move, board) => {
        let [x, y] = [move.x, move.y];
        let validMove = false;

        console.log('px', px, 'py', py, 'x', x, 'y', y);

        if (px === x && py === y) {
            validMove = false;
        } else if (px === x && py === y + 1 && board[x][y] === 'e') {
            validMove = true;
        } else if (px === x && py === y + 2 && py === 1 && board[x][y] === 'e' && board[x][y + 1] === 'e') {
            validMove = true;
        } else if (px === x - 1 && py === y + 1 && board[x][y].includes('black')) {
            validMove = true;
        } else if (px === x + 1 && py === y + 1 && board[x][y].includes('black')) {
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