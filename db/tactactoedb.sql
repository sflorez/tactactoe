-- Database: tactactoe

DROP DATABASE IF EXISTS tactactoe;

CREATE DATABASE tactactoe
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE tactactoe
    IS 'tactactoe db to store wins and gamestate';

-- Connect to database to create table
\connect tactactoe

-- Table: public.complete_games

DROP TABLE IF EXISTS public.complete_games;

CREATE TABLE IF NOT EXISTS public.complete_games
(
    id SERIAL PRIMARY KEY,
    gamestate json,
    playerid integer
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.complete_games
    OWNER to postgres;