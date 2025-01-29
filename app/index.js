const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const port = 3000;

app.use(express.static("public"));

let players = [];
let gameState = {
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
};

// Handle player connection
io.on("connection", (socket) => {
    if (players.length >= 2) {
        socket.emit("endGame");
        return;
    }

    const playerRole = players.length === 0 ? "X" : "O";
    players.push({ id: socket.id, role: playerRole });
    socket.emit("playerRole", playerRole);

    if (players.length === 2) {
        io.emit("gameStart", gameState);
    }

    // Handle move
    socket.on("makeMove", (index) => {
        if (!gameState.winner && gameState.board[index] === null) {
            gameState.board[index] = gameState.currentPlayer;
            gameState.winner = checkWinner(gameState.board);
            gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
            io.emit("updateGame", gameState);
        }
    });
    socket.on("resetGame",()=>{
        gameState = {
            board: Array(9).fill(null),
            currentPlayer: "X",
            winner: null,
        };
        io.emit("resetGameState",gameState)

    })
    // Handle disconnection
    socket.on("disconnect", () => {
        players = players.filter((player) => player.id !== socket.id);
        resetGame();
        io.emit("updateGame", gameState);
    });


    // Reset game
    function resetGame() {
        gameState = {
            board: Array(9).fill(null),
            currentPlayer: "X",
            winner: null,
        };
    }

    // Check winner
    function checkWinner(board) {
        const winningPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for (const [a, b, c] of winningPatterns) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return board.every((cell) => cell !== null) ? "DRAW" : null;
    }
});

httpServer.listen(port, () => console.log(`Server is listening on http://localhost:${port}`));
