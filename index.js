import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { createServer as createHttpServer } from 'http';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { Server as SocketServer } from 'socket.io';
import httpRoutes from './routes/http.js';
import socketRoutes from './routes/socket.js';
import { createClient as createRedisClient } from "redis";
import RedisStoreFactory from 'connect-redis';
import GameStore from './lib/game-store.js';
import chalk from "chalk";

const redisClient = createRedisClient({legacyMode: true});
redisClient.on("error", (err) => console.log(err));
redisClient.connect().catch(console.error)

const app = express(),
    server = createHttpServer(app),
    io = new SocketServer(server),
    db = new GameStore();

//Settings
const port = process.env.app_port || 8080;
app.set('port', port);
app.set('views', './views');
app.set('view engine', 'pug');

const RedisStore = RedisStoreFactory(session);
const sessionStore = new RedisStore({client: redisClient});
const sessionInstance = session({
    secret: process.env.session_secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true
});
app.use(sessionInstance);
app.use(bodyParser.urlencoded({extended: null}));

app.use(express.static(path.resolve('public')));

const host = process.env.app_host || 'http://127.0.0.1';

const allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", host);
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
};

app.use(allowCrossDomain);

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionInstance));

httpRoutes(app, db);
socketRoutes(io, db);

server.listen(app.get('port'), function() {
    console.log(chalk.yellowBright("Five game has started"));
    console.log("Open - " + chalk.blueBright(host + ':' + port));
});
