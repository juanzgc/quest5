var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path')

// collection of hub id's
    // -> id, location, allowed key fobs, 

// collection of Fob ids
    // -> id, person's name, auth key

// collection of entries (auth/unauth)
    // -> fob_id, hub_id, time, auth (boolean)


router.get('/', function(req, res, next) {
  res.render('index')
  // var db = req.db;

  // // collections: fob, hub, entries
  // var collection = db.get('smoke');
  // console.log("in data");
  // // console.log("collection", collection);
  // collection.find().then( function (items) {
  //   console.log("items", items);
  //   res.send(items);
  // })
})

router.get('/get', function(req, res, next) {
  // res.render('index')
  var db = req.db;
  console.log("db", db);
  // collections: fob, hub, entries
  // var collection = db.get('hub');
  // console.log("in data", collection);
  // console.log("collection", collection);
  // collection.find().then( function (items) {
  //   console.log("items", items);
  //   res.send(items);
  // })
  // .catch(err => {
  //   console.log("Err");
  //   res.send([]);
  // })
  db.get('hub').find().then(function (err, items) {
    if (err) {
      console.log("error", err);
      res.send([])
    }
    else {
      console.log("items", items);
      res.send(items);
    }
  })

})

module.exports = router;
