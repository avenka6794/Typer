var express = require('express');
var cors = require('cors')
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express')
var mongoose = require('mongoose');
var uuid = require('uuid');
var randomWords = require('random-words');

mongoose.connect('mongodb://avenka6794:as70rv65@ds147461.mlab.com:47461/typer', {
    useNewUrlParser: true
});

var models = require('./models/models.js')(mongoose)

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var routes = require('./routes/routes.js')(models)

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.use(cors())

app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(bodyParser.json())

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');

app.set('views', path.join(__dirname, 'client'));

app.use(routes);

//socket logic

var games = [];

var lobbySpace = io.of('/lobbySpace');

lobbySpace.on('connection', function(socket) {
    lobbySpace.emit('games', games)

    socket.on("new game", function(data) {

        var hasMade = games.findIndex((game) => game.createdBy == data.user)

        if (data.isPublic) {
            if (data.user != 'anon') {
                if (hasMade == -1) {
                    games.push({
                        players: [],
                        id: uuid(),
                        type: "public",
                        createdBy: data.user,
                        status: "waiting"
                    })
                    lobbySpace.emit('games', games)
                } else {
                    socket.emit('msg', 'You have already made one public room!')
                }
            } else {
                socket.emit('msg', 'Only logged in users can create public rooms!')

            }
        } else {
            games.push({
                players: [],
                id: uuid(),
                type: "private",
                createdBy: socket.id,
                status: "waiting"
            });
            lobbySpace.emit('games', games)
        }

    })


    socket.on("join", (data) => {
        var index = games.findIndex((game) => game.id == data.id)
        if (index != -1) {
            socket.emit("join success", data.id);
        } else {
            socket.emit("msg", "Invalid game code (try reloading page)")
        }
    })
});

var gameSpace = io.of('/gameSpace');

gameSpace.on("connection", function(socket) {
    var gameIndex;

    socket.on("join room", (data) => {

        gameIndex = games.findIndex((game) => {
            return game.id == data.id
        })

        if (games[gameIndex].status == "waiting") {

            games[gameIndex].players.push({
                user: data.user,
                score: 0,
                ready: false,
                username: data.username
            })

            lobbySpace.emit("games", games);

            socket.join(data.id)

            gameSpace.to(data.id).emit("score", games[gameIndex])
        } else {
            socket.emit('msg', 'Game has already started')
        }
    })

    socket.on("player ready", (data) => {

        gameIndex = games.findIndex((game) => {
            return game.id == data.id
        })

        if (games[gameIndex].status == "waiting") {

            var gamePlayers = games[gameIndex].players;

            var playerIndex = gamePlayers.findIndex((player) => {
                return player.user == data.user
            })

            games[gameIndex].players[playerIndex].ready = true;

            gameSpace.to(data.id).emit("score", games[gameIndex])

            var allReady = true;
            for (var i = 0; i < games[gameIndex].players.length; i++) {
                if (!games[gameIndex].players[i].ready) {
                    allReady = false;
                }

                if (allReady) {
                    //change data to random word array;
                    games[gameIndex].status = "playing";
                    games[gameIndex].words = randomWords(1);
                    gameSpace.to(data.id).emit("start game", games[gameIndex])
                }
            }
        } else {
            socket.emit('msg', 'Game has already started')
        }
    })

    socket.on("update score", function(data) {
        gameIndex = games.findIndex((game) => {
            return game.id == data.id
        })

        var gamePlayers = games[gameIndex].players;

        var playerIndex = gamePlayers.findIndex((player) => {
            return player.user == data.user
        })

        games[gameIndex].players[playerIndex].score = data.score;

        var isDone = false;
        var winnerIndex = -1;
        var winnerUser = "";
        for (var i = 0; i < games[gameIndex].players.length; i++) {
            if (games[gameIndex].players[i].score == 100) {
                isDone = true;
                winnerIndex = i;
                winnerUser = games[gameIndex].players[winnerIndex].username.trim();
            }
        }

        if (isDone) {
            //remove/end game
            if (winnerUser != "anon") {
                console.log(winnerUser + " won the game")

                models.User.find({}, function(err, users) {
                    var index = users.findIndex((user) => {
                        return user.username.trim() == winnerUser.trim();
                    })
                    var temp = users[index];

                    temp.score += 5;
                    models.User.deleteOne({
                        username: temp.username
                    }, function(err) {
                        if (err) return handleError(err);
                        // deleted at most one tank document
                        var user = new models.User({
                          email: temp.email,
                          username: temp.username,
                          password: temp.password,
                          score: temp.score
                        });
                        user.save(function (err, user) {
                          if (err) return console.error(err);
                        });
                    });
                })


            }
            gameSpace.to(data.id).emit("score", games[gameIndex])
            gameSpace.to(data.id).emit("finished", {
                game: games[gameIndex],
                winner: winnerIndex
            })
            games.splice(gameIndex, 1);


        } else {
            gameSpace.to(data.id).emit("score", games[gameIndex])
        }


    })
})

var port = process.env.PORT || 3000;

http.listen(port, () => console.log(`App listening on port ${port}`))
