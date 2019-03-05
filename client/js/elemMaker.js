const LOBBY = 0;

// Create div element that represents player in game.
// User will know who they are by bolded name.
// Host will be italicized in lobby.
function getPlayerBanner(player) {
    return '<div class="' + player.divClasses.join(' ') +
        '" onclick="' + player.onClick + '">' + player.name + '</div>';
}

function setHostAndLobbyOptions(hoptions, loptions, state, curSocket) {
    hoptions.style.display = state.gameState === LOBBY && state.host.socket === curSocket.id ?
        '' : 'none';
    loptions.style.display = state.gameState === LOBBY &&
        state.host.socket !== curSocket.id ? '' : 'none';
    document.getElementById('lobbyHostLabel').innerHTML = 'Host: ' + state.host.name;
    document.getElementById('lobbyMafiaLabel').innerHTML = 'Mafia: ' + state.numMafia;
    document.getElementById('lobbyCopsLabel').innerHTML = 'Cops: ' + state.numCops;
    document.getElementById('lobbyDoctorsLabel').innerHTML = 'Doctors: ' + state.numDoctors;
    document.getElementById('numMafia').value = state.numMafia;
    document.getElementById('numCops').value = state.numCops;
    document.getElementById('numDoctors').value = state.numDoctors;
}

function setLeaveButtonVisible(roomState) {
    // TODO: make sure leave button event cannot be triggered serverside in-game
    document.getElementById('leaveButton').style.display = roomState.gameState === LOBBY ?
        '' : 'none';
}

function setRoleHeader(roomState) {
    document.getElementById('divRole').style.display = roomState.gameState === LOBBY ? 'none' : '';
    document.getElementById('roleHeader').innerHTML = roomState.clientState.alive ?
        'Your role: ' + roomState.clientState.role : 'You are dead. :( All roles are now visible.';
}

