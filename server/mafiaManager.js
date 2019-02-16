const Hasher = require('./hasher');


// management and constants
var roomStates = {};
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 20;
// roles
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
const DEAD      = 5;
// game states
const LOBBY         = 0;
const MAFIA_TIME    = 1;
const COP_TIME      = 2;
const DOCTOR_TIME   = 3;
const TOWN_TIME     = 4;
const SHOWDOWN      = 5;
const MAFIA_WIN     = 6;
const TOWN_WIN      = 7;


function reserveNewRoom() {
    var newRoom;
    do {
        newRoom = Hasher.genHash(ROOM_CODE_LENGTH);
    } while (getRoomState(newRoom));
    constructNewRoomState(newRoom);
    return newRoom;
}

function roomExists(room) {
    return roomStates.hasOwnProperty(room);
}

function addUserToRoom(socket, name, room) {
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        // if player name doesn't exist and we are in lobby, go for add user
        if (!roomState.players[name] && roomState.gameState === LOBBY) {
            roomState.players[name] = {
                socketId: socket.id,
                role: DEFAULT,
                alive: true
            }
            roomState.socketNames[socket.id] = name;
            return true;
        }
        // if name exists but we are in game, make sure the requested name has an open socket spot
        // then populate the open socket spot
        else if (roomState.players[name] && roomState.gameState !== LOBBY){
            if (roomState.players[name].socketId !== null) {
                roomState.players[name].socketId = socket.id;
                roomState.socketNames[socket.id] = name;
                return true;
            }
        }
    }
    // all other conditions should lead to a no-go on add user
    return false;
}

function removeUserFromRoom(socket, room) {
    if (roomExists(room)) {
        var roomState = getRoomState(room);
        var name = roomState.socketNames[socket.id];
        if (name && roomState.players[name]) {
            delete roomState.socketNames[socket.id];
            roomState.players[name].socketId = null;
            if (roomState.gameState === LOBBY) {
                delete roomState.players[name];
            }
            return true;
        }
    }
    return false;
}

function getRoomState(room) {
    return roomStates[room];
}

function touchRoomState(room) {
    console.log('TOUCH ROOM STATE');
    return getRoomState(room) ? getRoomState(room) : constructNewRoomState(room);
}

function constructNewRoomState(room) {
    roomStates[room] = {
        gameState: 0,
        players: {},
        socketNames: {}
    }
    return roomStates[room];
}

function removeRoom(room) {
    if (getRoomState(room))
        delete roomStates[room];
}


module.exports.reserveNewRoom = reserveNewRoom;
module.exports.roomExists = roomExists;
module.exports.addUserToRoom = addUserToRoom;
module.exports.removeUserFromRoom = removeUserFromRoom;
module.exports.getRoomState = getRoomState;
module.exports.touchRoomState = touchRoomState;
module.exports.removeRoom = removeRoom;
