var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express')
var mongoose = require('mongoose');
var uuid = require('uuid');

mongoose.connect('mongodb://avenka6794:as70rv65@ds147461.mlab.com:47461/typer', { useNewUrlParser: true });

var routes = require('./routes/routes.js')(mongoose)

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


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
                  createdBy: data.user
              })
              io.emit('games', games)
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
          createdBy: socket.id
      });
      lobbySpace.emit('games', games)
  }

  })


  socket.on("join", (data) => {
      var index = games.findIndex((game) => game.id == data.id)
      if(index != -1){
          if(data.user != "anon"){
              var userIndex = games.findIndex((game) => {
                  var playerIndex = game.players.findIndex((player) => {
                      return player == data.user;
                  })

                  return playerIndex != -1;
              })

              console.log(userIndex)

              if(userIndex == -1){
                  games[index].players.push(data.user);
                  socket.emit("join success", data.id);
              }else{
                  socket.emit("msg","You are already part of a game!")

              }
          }else{
              games[index].players.push(data.user);
              socket.emit("join success", data.id);
          }
      }else{
          socket.emit("msg","Invalid game code (try reloading page)")
      }
  })
});

var gameSpace = io.of('/gameSpace');

gameSpace.on("connection", function(socket){
    socket.on("join room", (id) => {

    })
})

var port = process.env.PORT || 3000;

http.listen(port, () => console.log(`App listening on port ${port}`))
