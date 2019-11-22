// Juan Zapata Gomez, David Abadi, Joseph

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var http = require('http');
var dgram = require('dgram');
var cookieParser = require('cookie-parser');
var indexRouter = require('./routes/index');
var app = express();

// UDP Socket
var udpSocketPort = 8080;
var udpSocketHost = "192.168.1.133"; // Juan's Computer
// var espIP = "192.168.1.141";
var espIP = "192.168.1.100";
var rasbPi = "192.168.1.144:28017"; // rasberry pi ip address and port

var monk = require('monk');
// var db = monk('192.168.1.144:27017/quest5');
var db = monk('192.168.1.144:27017/quest5', function (err) {
  if (err) {
    console.log("Err", err);
  }
  else {
    console.log("no error");
  }
});
// var db = monk('127.0.0.1:27017/quest5-test', function (err) {
//   if (err) {
//     console.log("Err", err);
//   }
//   else {
//     console.log("no error");
//   }
// });

var espPort = 8080;
var udpSocket = dgram.createSocket('udp4');

// To run be on -> http://192.168.1.133:8080/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next){
  req.db = db;
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const server = http.createServer(app)

var io = require('socket.io')(server);

io.on('connection', function (socket) {

  let entriesCol = db.get('entries');
  entriesCol.find().then(function (items) {
    console.log("db entries", items);
    socket.emit('db', items);
  })


  udpSocket.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port + ' - ' + message);

    function notAllowed(fobItem, parsedData) {
      let data = parsedData;
      data['auth'] = false;

      udpSocket.send('r', espPort, fobItem.ip, function(error) {
        if (error) {
          console.log("Error sending to esp32: ");
        }
        else {
          console.log("Message to esp32 sent okay: ");
        }
      })

      let entries = db.get('entries');
      entries.insert(data).then(function (res) {
        console.log("posting new entry", res);
        entries.find().then(function (allItems) {
          console.log("all new entries", allItems);
          socket.emit('db', allItems);
        })
      }).catch(function (err) {
        console.log("error posting", err)
      })
    }


    function postData(data) {
      let parsedData = {
        "fob_ID": data.fob_ID,
        "hub_ID": data.hub_ID,
        "code": data.code
      }

      let entries = db.get('entries');
      let fobCol = db.get('fob');
      let hubCol = db.get('hub')

      console.log("post data");
      
      hubCol.find({"ID": parsedData.hub_ID}).then(hubItem => {
        let allowed = hubItem[0].allowed;
        console.log("allowed fobs are", allowed);
        console.log("hubItem", hubItem)
        if (allowed.includes(parsedData.fob_ID)) {
          // The fob id is allowed by the hub
          console.log("Fob id is allowed", parsedData.fob_ID);
          // now check if the code key matches
          fobCol.find({"ID": parsedData.fob_ID}).then(fobItem => {
            if (fobItem[0].code === parsedData.code) {
              console.log("Fob id matches code", parsedData.fob_ID);

              // code matches succes
              udpSocket.send('g', espPort, fobItem[0].ip, function(error) {
                if (error) {
                  console.log("Error sending to esp32: " );
                }
                else {
                  console.log("Message to esp32 sent okay: ");
                }
              })

              let data = parsedData;
              data['auth'] = true;
              entries.insert(data).then(function (res) {
                console.log("posting new entry", res);
                entries.find().then(function (allItems) {
                  console.log("all new entries", allItems);
                  socket.emit('db', allItems);
                })
              }).catch(function (err) {
                console.log("error posting", err)
              })


            }
            else {
              notAllowed(fobItem[0], parsedData);
            }
          })
        }
        else {
          console.log("Not allowed fob item");
          fobCol.find({"ID": parsedData.fob_ID}).then(fobItem => {
            notAllowed(fobItem[0], parsedData);
          })
        }
      })
    }


    if (isJsonString(message)) {
      var parsedData = JSON.parse(message);
      console.log("parsed data JSON", parsedData);
      postData(parsedData)
    }
    else {
      console.log("Parsing errors with: ", message);
    }


  })
  console.log('socket connected');
});

const port = process.env.PORT || 8080;

server.listen(port)
server.on("listening", () => {
  console.log('APIs are listening on port ' + port);
})

udpSocket.bind(udpSocketPort, udpSocketHost);

module.exports = app;
