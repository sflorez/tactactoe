
import './App.css';
import { useState, useEffect, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App() {
  const [socketUrl, setSocketUrl] = useState('ws://localhost:8081');
  const [gameState, setGameState] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [playerId, setPlayerId] = useState(-1);
  const [playerTurn, setPlayerTurn] = useState(false);
  const [gameStart, setGameStart] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [winner, setWinner] = useState(false);
  const [gameTie, setGameTie] = useState(false);

  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      const gameEvent = JSON.parse(lastMessage.data);
      console.log(gameEvent);
      switch (gameEvent.gameEvent) {
        case "Assign_Player":
          setPlayerId(gameEvent.playerId);
          break;
        case "Game_Start":
          setGameStart(true);
          break;
        case "Game_Turn":
          setPlayerTurn(gameEvent.playerTurn);
          break;
        case "Player_Move":
          let newState = [...gameState];
          newState[gameEvent.move] = gameEvent.playerId;
          setPlayerTurn(gameEvent.nextPlayerTurn);
          setGameState(newState);
          break;
        case "Game_Complete":
          let completeState = [...gameState];
          completeState[gameEvent.move] = gameEvent.playerId;
          setGameState(completeState);
          setGameComplete(true);
          if (gameEvent.type === "Tie") {
            setGameTie(true);
          }
          else {
            const winnerId = gameEvent.winnerId;
            setWinner(playerId === winnerId);
          }
          break;
      }
    }
  }, [lastMessage, setPlayerId, setGameState, setWinner, playerId]);

  const handleClickSendMessage = useCallback((index) => {
    console.log("clicked: " + index);
    let newState = [...gameState];
    newState[index] = playerId;
    setGameState(newState);
    const message = { gameEvent: "Player_Move", playerId: playerId, move: index, nextPlayerTurn: playerTurn };
    sendMessage(JSON.stringify(message));
    setPlayerTurn(!playerTurn);
  }, [playerId, gameState, playerTurn, sendMessage]);

  // not sure if ill use it but just in case
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const renderSquareText = (index) => {
    switch (gameState[index]) {
      case 1:
        return "X"
      case 2:
        return "O"
      default:
        return ""
    }
  }

  const Square = (props) => {
    return (
      <button disabled={gameState[props.index] === 0 ? false : true} className="square" onClick={() => handleClickSendMessage(props.index)}>
        {renderSquareText(props.index)}
      </button>
    )
  };

  const RenderPlayerTurn = () => {
    if (gameStart && playerTurn) {
      return <p>It's your turn to move!</p>
    } else {
      return <p>It's not your turn yet!</p>
    }
  };

  const RenderGameComplete = () => {
    if (gameComplete && winner) {
      return <div><p className='winner'>You are the winner!... (confetti)!</p><p>Refresh to play again!</p></div>
    }
    else if (gameComplete && gameTie){
      return <div><p>Well that is disappointing... it's a Tie!</p><p>Refresh to play again!</p></div>
    } 
    else if (gameComplete && !winner) {
      return <div><p className='not-winner'>You are NOT the winner!... (confetti)!</p><p>Refresh to play again!</p></div>
    }
    else {
      return <p></p>
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>
            <RenderGameComplete />
          </h1>
          <h2 className="Game Header">
            <p>{!gameStart ? "Waiting for another player to Join..." : "Game Start!"}</p>
          </h2>
          <h3>
            <RenderPlayerTurn></RenderPlayerTurn>
          </h3>
        </div>
        <div>
          <p className="player">{playerId}</p>
        </div>
        <div className={"game-container" + (playerTurn ? "" : " disabled")}>
          <div className="tac-row">
            <Square index={0} />
            <Square index={1} />
            <Square index={2} />
          </div>
          <div className="tac-row">
            <Square index={3} />
            <Square index={4} />
            <Square index={5} />
          </div>
          <div className="tac-row">
            <Square index={6} />
            <Square index={7} />
            <Square index={8} />
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
