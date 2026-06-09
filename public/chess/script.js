// Bidak Catur Unicode Filled
const PIECES = {
    'w': { 'P':'♟', 'R':'♜', 'N':'♞', 'B':'♝', 'Q':'♛', 'K':'♚' },
    'b': { 'P':'♟', 'R':'♜', 'N':'♞', 'B':'♝', 'Q':'♛', 'K':'♚' }
};

class ChessGame {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status-text');
        this.checkElement = document.getElementById('check-text');
        this.historyElement = document.getElementById('history-list');
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        document.getElementById('btn-restart').addEventListener('click', () => this.initGame());
        document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());

        this.initGame();
    }

    initGame() {
        this.board = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        this.turn = 'w';
        this.selected = null;
        this.validMoves = [];
        this.history = [];
        this.moveLog = [];
        this.state = 'playing'; // playing, checkmate, stalemate

        this.renderBoard();
        this.updateStatus();
    }

    playSound(type) {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        if (type === 'move') {
            osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.1);
        } else if (type === 'check') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
            osc.frequency.setValueAtTime(400, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.r = r;
                square.dataset.c = c;
                
                // Highlight selected
                if (this.selected && this.selected.r === r && this.selected.c === c) {
                    square.classList.add('selected');
                }
                
                // Highlight valid moves
                const isValid = this.validMoves.find(m => m.r === r && m.c === c);
                if (isValid) {
                    square.classList.add('valid');
                    if (this.board[r][c] !== '') square.classList.add('capture');
                }

                // Render Piece
                const cell = this.board[r][c];
                if (cell !== '') {
                    const color = cell[0];
                    const type = cell[1];
                    const piece = document.createElement('div');
                    piece.className = `piece ${color === 'w' ? 'white' : 'black'}`;
                    piece.textContent = PIECES[color][type];
                    square.appendChild(piece);
                }

                square.addEventListener('click', () => this.handleSquareClick(r, c));
                this.boardElement.appendChild(square);
            }
        }
        
        // Update Player Info active state
        document.getElementById('player-black').classList.toggle('active', this.turn === 'b');
        document.getElementById('player-white').classList.toggle('active', this.turn === 'w');
        
        // Update History
        this.historyElement.innerHTML = '';
        this.moveLog.forEach((log, i) => {
            const li = document.createElement('li');
            li.textContent = `${Math.floor(i/2) + 1}. ${log}`;
            this.historyElement.appendChild(li);
        });
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    handleSquareClick(r, c) {
        if (this.state !== 'playing') return;

        const cell = this.board[r][c];
        const isValidMove = this.validMoves.find(m => m.r === r && m.c === c);

        if (isValidMove) {
            this.movePiece(r, c);
        } else if (cell !== '' && cell[0] === this.turn) {
            this.selected = { r, c };
            this.validMoves = this.getLegalMoves(this.board, r, c, this.turn);
            this.renderBoard();
        } else {
            this.selected = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    movePiece(toR, toC) {
        const fromR = this.selected.r;
        const fromC = this.selected.c;
        const piece = this.board[fromR][fromC];
        const captured = this.board[toR][toC];

        // Save history
        this.history.push(JSON.parse(JSON.stringify(this.board)));
        
        // Log notation
        const files = ['a','b','c','d','e','f','g','h'];
        const logMsg = `${piece[1] !== 'P' ? piece[1] : ''}${captured ? 'x' : ''}${files[toC]}${8-toR}`;
        this.moveLog.push(logMsg);

        // Move
        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = '';

        // Promotion (Auto Queen)
        if (piece[1] === 'P' && (toR === 0 || toR === 7)) {
            this.board[toR][toC] = piece[0] + 'Q';
        }

        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.selected = null;
        this.validMoves = [];
        
        this.checkGameState();
        
        if(this.state === 'playing') {
            this.playSound(this.checkElement.textContent ? 'check' : 'move');
        }
        
        this.renderBoard();
    }

    undoMove() {
        if (this.history.length === 0) return;
        this.board = this.history.pop();
        this.moveLog.pop();
        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.selected = null;
        this.validMoves = [];
        this.state = 'playing';
        this.updateStatus();
        this.renderBoard();
    }

    checkGameState() {
        const inCheck = this.isKingInCheck(this.board, this.turn);
        let hasMoves = false;

        // Check if current player has any legal moves
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c].startsWith(this.turn)) {
                    if (this.getLegalMoves(this.board, r, c, this.turn).length > 0) {
                        hasMoves = true;
                        break;
                    }
                }
            }
            if (hasMoves) break;
        }

        this.checkElement.textContent = inCheck ? "Skak!" : "";

        if (!hasMoves) {
            this.state = inCheck ? 'checkmate' : 'stalemate';
            this.playSound('check');
        }
        this.updateStatus();
    }

    updateStatus() {
        if (this.state === 'checkmate') {
            const winner = this.turn === 'w' ? 'Hitam' : 'Putih';
            this.statusElement.textContent = `Skakmat! ${winner} Menang`;
        } else if (this.state === 'stalemate') {
            this.statusElement.textContent = "Seri (Stalemate)!";
        } else {
            this.statusElement.textContent = `Giliran: ${this.turn === 'w' ? 'Putih' : 'Hitam'}`;
        }
    }

    // Logic 
    getLegalMoves(board, r, c, color) {
        const pseudo = this.getPseudoLegalMoves(board, r, c, color);
        return pseudo.filter(m => {
            // Simulate move
            const temp = JSON.parse(JSON.stringify(board));
            temp[m.r][m.c] = temp[r][c];
            temp[r][c] = '';
            return !this.isKingInCheck(temp, color);
        });
    }

    getPseudoLegalMoves(board, r, c, color) {
        const moves = [];
        const piece = board[r][c][1];
        const dir = color === 'w' ? -1 : 1;
        const enemy = color === 'w' ? 'b' : 'w';

        const addIfValid = (nr, nc, captureOnly = false, moveOnly = false) => {
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = board[nr][nc];
                if (target === '') {
                    if (!captureOnly) moves.push({r: nr, c: nc});
                    return !captureOnly; // continue sliding if empty
                } else if (target[0] === enemy) {
                    if (!moveOnly) moves.push({r: nr, c: nc});
                    return false; // stop sliding
                }
                return false; // blocked by own
            }
            return false; // out of bounds
        };

        if (piece === 'P') {
            if (addIfValid(r + dir, c, false, true)) {
                if ((color === 'w' && r === 6) || (color === 'b' && r === 1)) {
                    addIfValid(r + dir * 2, c, false, true);
                }
            }
            addIfValid(r + dir, c - 1, true, false);
            addIfValid(r + dir, c + 1, true, false);
        }

        const slidingDirs = {
            'R': [[0,1], [0,-1], [1,0], [-1,0]],
            'B': [[1,1], [1,-1], [-1,1], [-1,-1]],
            'Q': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]
        };

        if (slidingDirs[piece]) {
            for (let [dr, dc] of slidingDirs[piece]) {
                for (let i = 1; i < 8; i++) {
                    if (!addIfValid(r + dr*i, c + dc*i)) break;
                }
            }
        }

        if (piece === 'N') {
            const jumps = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
            jumps.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
        }

        if (piece === 'K') {
            const steps = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]];
            steps.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
        }

        return moves;
    }

    isKingInCheck(board, color) {
        // Find King
        let kr = -1, kc = -1;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === color + 'K') { kr = r; kc = c; break; }
            }
            if (kr !== -1) break;
        }

        const enemy = color === 'w' ? 'b' : 'w';
        
        // Check if any enemy piece can attack king's position
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c].startsWith(enemy)) {
                    const pseudo = this.getPseudoLegalMoves(board, r, c, enemy);
                    if (pseudo.some(m => m.r === kr && m.c === kc)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

// Start game
window.onload = () => {
    new ChessGame();
};