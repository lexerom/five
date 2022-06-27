/**
 * Created by alex on 7/25/14.
 */
var path = require('path'),
    http = require('http'),
    express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    socket = require('socket.io'),
    httpRoutes = require('./routes/http'),
    socketRoutes = require('./routes/socket'),
    GameStore = require('./lib/GameStore'),
    RedisStore = require('connect-redis')(session),
    sass = require('node-sass-middleware');

var app = express(),
    server = http.Server(app),
    io = socket(server);

var DB = new GameStore();

//Settings
app.set('port', 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
var secretKey = 'some-secret';

var sessionStore = new RedisStore();
var cp = cookieParser(secretKey);
var sessionInstance = session({secret: secretKey, store: sessionStore, parser: cp, resave: false, saveUninitialized: true});
console.log(sessionInstance);
app.use(sessionInstance);
app.use(bodyParser.urlencoded({extended: null}));
app.use(cp);

var sassMiddleware = sass({
    src: __dirname + '/sass',
    dest: __dirname + '/public',
    //debug: true,
    //outputStyle: 'compressed'
});

app.use(sassMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost" || "http://127.0.0.1");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
}

app.use(allowCrossDomain);

io.use(function (socket, next) {
    var handshake = socket.handshake;
    if (handshake.headers.cookie) {
        cookieParser()(handshake, {}, function (err) {
            handshake.sessionID = cookieParser.signedCookie(handshake.cookies['connect.sid'], secretKey);
            handshake.sessionStore = sessionStore;
            handshake.sessionStore.get(handshake.sessionID, function (err, data) {
                if (err) return next(err);
                if (!data) return next(new Error('Invalid Session'));
                handshake.session = new session.Session(handshake, data);
                next();
            });
        });
    }
    else {
        next(new Error('Missing Cookies'));
    }
});

httpRoutes.attach(app, DB);
socketRoutes.attach(io, DB);

server.listen(app.get('port'), function() {
    console.log("Five has started");
});
