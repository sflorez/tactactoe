# tactactoe
tic tac toe demo using webhooks and react frontend, completed games with wins are stored in postgresdb

## dependencies:
- postgres
  - postgres.sql file depends on a user named postgres to exist in postgres server
- nodejs
- react


## run instructions:
- import tactactoedb.sql file into postgres
  - use pgsql cmd interface and run:
  - \i <path/to/tactactodb.sql>
- update .env file with information related to your postgres setup
- run 'npm start' in 'tac-client' directory
- run 'node wsGameServer.js' in 'server' directory

## playing the game:
- after running tac-client and node server:
  - open 2 browser instances 
  - play the game to completion
  - refresh to play again
- the game server only accepts 2 players to a single game instance a third browser will get disconnected from the game server.
- upon completion of the game (win, or tie) the gameserver will disconnect all players and reset its game instance.
  - upon a game win the server will upload the gamestate and winnerId (1 for player1 and 2 for player2) to postgres
