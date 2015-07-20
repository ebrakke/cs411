var express = require('express');
var room = express.Router();
var Room = require('../models/Room');
var format = require('../middlewares/format');
var auth = require('../middlewares/auth').auth;
var envelope = require('../middlewares/envelope');
var validate = require('../middlewares/validate');

var ROOM_NOT_FOUND = {msg: 'Room not found', code: 404};
var ROOM_CREATION_ERROR = {msg: 'Room not created properly', code: 500};
room.get('/:id/comments', function(req, res, next) {
    var room = new Room({rid: req.params.id});
    room.getComments().then(function(comments) {
        res.locals.data = comments;
        next();
    }).fail(function() {
        next(ROOM_NOT_FOUND);
    });
}, format.getRoomComments, envelope);

room.get('/:id', auth, function(req, res, next) {
    var uid = res.locals.user.uid;
    var room = new Room({rid: req.params.id});
    room.get(uid).then(function() {
        res.locals.data = room;
        next();
    }).fail(function() {
        next(ROOM_NOT_FOUND);
    });
}, format.getRoom, envelope);

room.post('/', auth, function(req, res, next) {
    var room = new Room(req.body);
    room.author = res.locals.user;
    room.create().then(function() {
        return room.author.joinRoom(room.rid);
    }).then(function() {
        return room.get(room.author.uid);
    }).then(function() {
        res.locals.data = room;
        next();
    }).fail(function() {
        next(ROOM_CREATION_ERROR);
    });
}, format.postRoom, envelope);

room.post('/:id/join', auth, function(req, res, next) {
    var room = new Room({rid: req.params.id});
    res.locals.user.joinRoom(room.rid).then(function() {
        return room.get();
    }).then(function() {
        room.member = true;
        res.locals.data = room;
        next();
    }).fail(function() {
        next(ROOM_NOT_FOUND);
    });
}, format.getRoom, envelope);

module.exports = room;
