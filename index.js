/**
 * Created by alex on 7/25/14.
 */
require('dotenv').config();

const path = require('path'),
    http = require('http'),
    express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    socket = require('socket.io'),
    httpRoutes = require('./routes/http'),
    socketRoutes = require('./routes/socket'),
    redis = require("redis");

const RedisStore = require('connect-redis')(session),
    GameStore = require('./lib/GameStore');

const redisClient = redis.createClient({legacyMode: true});
redisClient.on("error", (err) => console.log(err));
redisClient.connect().catch(console.error)

const app = express(),
    server = http.createServer(app),
    io = new socket.Server(server),
    db = new GameStore();

//Settings
app.set('port', process.env.app_port || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

const sessionStore = new RedisStore({client: redisClient});
const sessionInstance = session({
    secret: process.env.session_secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true
});
app.use(sessionInstance);
app.use(bodyParser.urlencoded({extended: null}));

app.use(express.static(path.join(__dirname, 'public')));

const allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost" || "http://127.0.0.1");
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
};

app.use(allowCrossDomain);

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionInstance));

httpRoutes.attach(app, db);
socketRoutes.attach(io, db);

server.listen(app.get('port'), function() {
    console.log("Five has started");
});
