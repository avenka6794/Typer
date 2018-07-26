var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express')
var mongoose = require('mongoose');
var uuid = require('uuid');

mongoose.connect('mongodb://avenka6794:as70rv65@ds147461.mlab.com:47461/typer', { useNewUrlParser: true });



var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var routes = require('./routes/routes.js')(mongoose)

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');

app.set('views', path.join(__dirname, 'client'));

app.use(routes);

//socket logic

var games = [];

var lobbySpace = io.of('/lobbySpace');

lobbySpace.on('connection', function(socket){
    lobbySpace.emit('games', games)

  socket.on("new game", function(data){

      var hasMade = games.findIndex((game) => game.createdBy == data.user)

      if(data.isPublic){
          if(data.user != 'anon'){
          if(hasMade == -1){
              games.push({
                  players: [],
                  id: uuid(),
                  type: "public",
                  createdBy: data.user,
                  status: "waiting"
              })
              lobbySpace.emit('games', games)
          }else{
              socket.emit('msg', 'You have already made one public room!')
          }
      }else{
          socket.emit('msg', 'Only logged in users can create public rooms!')

      }
  }else{
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
      if(index != -1){
          socket.emit("join success", data.id);
      }else{
          socket.emit("msg","Invalid game code (try reloading page)")
      }
  })
});

var gameSpace = io.of('/gameSpace');

gameSpace.on("connection", function(socket){
    var gameIndex;

    socket.on("join room", (data) => {

        gameIndex = games.findIndex((game)=>{
            return game.id == data.id
        })

        if(games[gameIndex].status == "waiting"){

            games[gameIndex].players.push({user: data.user, score: 0, ready: false})

            lobbySpace.emit("games", games);

            socket.join(data.id)

            gameSpace.to(data.id).emit("score", games[gameIndex])
        }else{
            socket.emit('msg', 'Game has already started')
        }
    })

    socket.on("player ready", (data)=>{

      gameIndex = games.findIndex((game)=>{
          return game.id == data.id
      })

      if(games[gameIndex].status == "waiting"){

        var gamePlayers = games[gameIndex].players;

          var playerIndex =  gamePlayers.findIndex((player) => {
            return player.user == data.user
          })

          games[gameIndex].players[playerIndex].ready = true;

          gameSpace.to(data.id).emit("score", games[gameIndex])

          var allReady = true;
          for(var i = 0; i < games[gameIndex].players.length; i++){
            if(!games[gameIndex].players[i].ready){
              allReady = false;
            }

          if(allReady){
            //change data to random word array;
              games[gameIndex].status = "playing";
              gameSpace.to(data.id).emit("start game", games[gameIndex])
          }
          }
      }else{
          socket.emit('msg', 'Game has already started')
      }
    })
})

var port = process.env.PORT || 3000;

http.listen(port, () => console.log(`App listening on port ${port}`))
