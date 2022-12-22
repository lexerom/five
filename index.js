/**
 * Created by alex on 7/25/14.
 */
require('dotenv').config();

const path = require('path'),
    http = require('http'),
    express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    socket = require('socket.io'),
    httpRoutes = require('./routes/http'),
    socketRoutes = require('./routes/socket');

let RedisStore = require('connect-redis')(session),
    GameStore = require('./lib/GameStore');

const { createClient } = require("redis")
let redisClient = createClient({ legacyMode: true })
redisClient.connect().catch(console.error)

const app = express(),
    server = http.createServer(app),
    io = socket(server),
    db = new GameStore();

//Settings
app.set('port', process.env.app_port || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
const secretKey = process.env.session_secret;

const sessionStore = new RedisStore({client: redisClient});
const cp = cookieParser(secretKey);
const sessionInstance = session({
    secret: secretKey,
    store: sessionStore,
    parser: cp,
    resave: false,
    saveUninitialized: true
});
app.use(sessionInstance);
app.use(bodyParser.urlencoded({extended: null}));
app.use(cp);

app.use(express.static(path.join(__dirname, 'public')));

const allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost" || "http://127.0.0.1");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
};

app.use(allowCrossDomain);

io.use(function (socket, next) {
    const handshake = socket.handshake;
    if (handshake.headers.cookie) {
        cookieParser()(handshake, {}, function (err) {
            handshake.sessionID = cookieParser.signedCookie(handshake.cookies['connect.sid'], secretKey);
            handshake.sessionStore = sessionStore;
            handshake.sessionStore.get(handshake.sessionID, function (err, data) {
                if (err) {
                    return next(err);
                }

                if (!data) {
                    return next(new Error('Invalid Session'));
                }

                handshake.session = new session.Session(handshake, data);
                next();
            });
        });
    } else {
        next(new Error('Missing Cookies'));
    }
});

httpRoutes.attach(app, db);
socketRoutes.attach(io, db);

server.listen(app.get('port'), function() {
    console.log("Five has started");
});
