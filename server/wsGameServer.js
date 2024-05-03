const WebSocket = require('ws');
const db = require('./dbConnector')

const wss = new WebSocket.Server({ port: 8081 }, () => console.log('Running server on port 8081...'));

// check to see if any connections need to be terminated (30 second intervals)
const interval = setInterval(() => {
    console.log(wss.clients.size);
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 3000);

const totalTurns = 9;
const players = { 1: { socket: null, id: 1, connected: false, weight: 1, turn: false}, 2: { socket: null, id: 2, connected: false, weight: 3, turn: false} };
const currentGame = {
    gameInProgress: false,
    gameState: [null, null, null, null, null, null, null, null, null],
    winner: 0,
    lastPlayerTurn: 1,
    turns: 0,
};

function assignPlayer(ws) {
    if (players[1].connected === false) {
        players[1].socket = ws;
        players[1].connected = true;
        return players[1];
    }
    else if (players[2].connected === false) {
        players[2].socket = ws;
        players[2].connected = true;
        return players[2];
    }
    else {
        return null;
    }
}

function heartbeat() {
    this.isAlive = true;
}

function propogateOther(wss, ws, message) {
    wss.clients.forEach((c) => {
        if (c !== ws && c.readyState === WebSocket.OPEN) {
            //const ack = { gameEvent: "Assign_Player", playerId: c.playerId };
            c.send(JSON.stringify(message));
        }
    });
}

function propogateAll(wss, ws, message) {
    wss.clients.forEach((c) => {
        if (ws && c.readyState === WebSocket.OPEN) {
            //const message = { server: "game", message: "new message recieved" };
            c.send(JSON.stringify(message));
        }
    });
}

function echo(ws, message) {
    ws.send(JSON.stringify(message));
}

function startGame() {
    if (currentGame.gameInProgress) {
        return false;
    } else {
        currentGame.gameInProgress = true;
    }
}

// without the player weight checking winning calculations are no bueno
function updateGameState(index, playerId) {
    console.log('updating game state');
    currentGame.gameState[index] = playerId * players[playerId].weight;
}

function checkWin() {
    // win conditions
    const winCons = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 4, 8],
        [2, 4, 6],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8]];

    winner = winCons.some((condition) => {
        const sum = currentGame.gameState[condition[0]] + currentGame.gameState[condition[1]] + currentGame.gameState[condition[2]];
        
        switch (sum) {
            case 3:
                currentGame.winner = 1;
                return true;
            case 18:
                currentGame.winner = 2;
                return true;
            default:
                return false;
        }
    });

    console.log(winner);
    return winner;
}

function resetGame(wss) {
    // disconnect currently connected clients
    wss.clients.forEach((ws) => {
        ws.terminate();
    });

    //reset game state
    currentGame.gameState = [null, null, null, null, null, null, null, null, null];
    currentGame.winner = 0;
    currentGame.gameInProgress = false;
    currentGame.turns = 0;
    currentGame.lastPlayerTurn = 1;


    //reset player slots
    players[1].socket = null;
    players[1].connected = false;
    players[2].socket = null;
    players[2].connected = false;

}

wss.on('connection', (ws) => {
    //We received a connection assign a player slot if one is available
    const playerAssignment = assignPlayer(ws);

    if (playerAssignment) {
        // a player was a assigned create a new game unless one is in progress
        ws.isAlive = true;
        ws.playerId = playerAssignment.id;
        
        //player is assigned, echo client:
        const message = { gameEvent: "Assign_Player", playerId: playerAssignment.id};
        echo(ws, message)

        if(wss.clients.size === 2){
            startGame();
            const gameStartMessage = {gameEvent: "Game_Start"};
            const gameTurnMessage = {gameEvent: "Game_Turn", playerTurn: true};
            players[currentGame.lastPlayerTurn].playerTurn = !players[currentGame.lastPlayerTurn].playerTurn;
            propogateAll(wss, ws, gameStartMessage);
            propogateOther(wss, ws, gameTurnMessage);
        }
        //set up heartbeat
        ws.on('pong', heartbeat);

        //We receieved a client message determine action:
        ws.on('message', (data) => {
            const clientEvent = JSON.parse(data);
            
            console.log(clientEvent);
            switch (clientEvent.gameEvent) {
                case "Player_Move":
                    currentGame.turns += 1;
                    currentGame.lastPlayerTurn = clientEvent.playerId;
                    players[currentGame.lastPlayerTurn].playerTurn = !players[currentGame.lastPlayerTurn].playerTurn;
                    updateGameState(clientEvent.move, clientEvent.playerId);
                    if (checkWin()) {
                        const message = { gameEvent: "Game_Complete", type: "Winner", winnerId: currentGame.winner, playerId: clientEvent.playerId, move: clientEvent.move };
                        const completeGame = {gameState: currentGame.gameState, winner: currentGame.winner}
                        db.storeResult(completeGame);
                        propogateAll(wss, ws, message);
                        resetGame(wss);
                    } else {
                        // Check if we have a tie
                        if(currentGame.turns === totalTurns){
                            console.log(currentGame.gameState);
                            console.log("its a tie");
                            const gameTie = {gameEvent: "Game_Complete", type: "Tie", playerId: clientEvent.playerId, move: clientEvent.move}
                            propogateAll(wss, ws, gameTie);
                            resetGame(wss);
                        } else{
                            console.log(currentGame.gameState);
                            propogateOther(wss, ws, clientEvent)
                        }  
                    }
                    break;
            }
        });

        ws.on('close', () => {
            console.log("closing connection to a client")
            players[playerAssignment.id].socket = null;
            players[playerAssignment.id].connected = false;
            ws.terminate();
        })

    } else {
        console.log("game is full");
        const closeMessage = { gameEvent: "Game_Full" }
        ws.terminate();
    }
});

wss.on('close', () => {
    clearInterval(interval)
});

