require('dotenv').config();
const { Pool } = require('pg');


// const pool = new Pool(
//     {
//         user: 'postgres',
//         database: 'tactactoe',
//         password: 'toor',
//         port:5432,
//     }
// )

const pool = new Pool(
    {
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    }
)

module.exports = {
    storeResult: (completeGame) => {
        const gameState = completeGame.gameState;
        const playerId = completeGame.winner;
        const query = {
            text: 'INSERT INTO complete_games(gameState, playerId) VALUES($1, $2)',
            values: [JSON.stringify(gameState), playerId],
        }

        pool
            .query(query)
            .then(res => { console.log(res.rows[0])})
            .catch(e => console.log(e.stack))

    }
}

