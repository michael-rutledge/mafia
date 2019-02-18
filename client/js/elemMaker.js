// constants according to rules set in mafiaManger.js
const STATE_MESSAGES= [
    'Welcome to the lobby. Once enough players join, the host can start the game.',
    'It is now nighttime. Mafia, please choose your victim.',
    'Detective, please choose your suspect to investigate.',
    'Doctor, please who you would like to save.',
    'It is now daytime. Everyone, please deliberate and vote who to kill off.',
    'There are only two innocents left. We need a handshake to settle this...',
    'Game over. Vote on whether to play again or go to the lobby.'
];
// roles (must be consistent with serverside code in mafiaManager.js)
const DEFAULT   = 0;
const MAFIA     = 1;
const COP       = 2;
const DOCTOR    = 3;
const TOWN      = 4;
// game states (must be consistent with serverside code in mafiaManager.js)
const LOBBY         = 0;
const MAFIA_TIME    = 1;
const COP_TIME      = 2;
const DOCTOR_TIME   = 3;
const TOWN_TIME     = 4;
const SHOWDOWN      = 5;
const MAFIA_WIN     = 6;
const TOWN_WIN      = 7;


// Create div element that represents player in game.
// User will know who they are by bolded name.
// Host will be italicized.
function genPlayerBanner(name, roomState, curSocket) {
    var player = roomState.players[name];
    var curPlayer = roomState.players[roomState.socketNames[curSocket.id]];
    var divClass = 'bannerPlayer';
    name = player.socketId === curSocket.id ? '<b>'+name+'</b>' : name;
    name = roomState.gameState === LOBBY && player.socketId === roomState.host ?
        '<i>'+name+'</i>' : name;
    switch (player.role) {
        case MAFIA:
            divClass += curPlayer.role === MAFIA ? ' bannerMafia' : ' bannerDefault';
            break;
        case COP:
            divClass += curPlayer.role === COP ? ' bannerCop' : ' bannerDefault';
            break;
        case DOCTOR:
            divClass += curPlayer.role === DOCTOR ? ' bannerDoctor' : ' bannerDefault';
            break;
        case TOWN:
            divClass += player.socketId === curPlayer.socketId ? ' bannerTown' : ' bannerDefault';
            break;
        default:
            divClass += ' bannerDefault';
            break;
    }
    divClass += !player.alive ? ' bannerDead' : '';
    console.log('banner class: ' + divClass);
    return '<div class="'+divClass+'">' + name + '</div>';
}

function genStateMessage(gameState) {
    return STATE_MESSAGES[gameState];
}

function setHostAndLobbyOptions(hoptions, loptions, state, curSocket) {
    hoptions.style.display = state.gameState === LOBBY && state.host === curSocket.id ?
        '' : 'none';
    loptions.style.display = state.gameState === LOBBY &&
        state.host !== curSocket.id ? '' : 'none';
    document.getElementById('lobbyHostLabel').innerHTML = 'Host: ' + state.socketNames[state.host];
    document.getElementById('lobbyMafiaLabel').innerHTML = 'Mafia: ' + state.numMafia;
    document.getElementById('lobbyCopsLabel').innerHTML = 'Cops: ' + state.numCops;
    document.getElementById('lobbyDoctorsLabel').innerHTML = 'Doctors: ' + state.numDoctors;
    document.getElementById('numMafia').value = state.numMafia;
    document.getElementById('numCops').value = state.numCops;
    document.getElementById('numDoctors').value = state.numDoctors;
}
