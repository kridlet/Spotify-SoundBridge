const osascript = require('node-osascript');
const Promise = require('bluebird');
const execute = Promise.promisify(osascript.execute);
const axios = require('axios');
const Telnet = require('telnet-client');
const fs = require('fs');

require('dotenv').config();

let rokuConnection = new Telnet()
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const dirkRefreshToken = process.env.DIRK_REFRESH;
const miniRefreshToken = process.env.NEW_MINI_REFRESH;

let songId = '';
let powerState = 'stanby';
let rokuParams = {
  host: '10.0.10.90',
  port: 5555,
  shellPrompt: '',
  timeout: 1500
}

function logText(logText, consoleLog = 1, fileLog = 1) {
  if (consoleLog) console.log(logText);
  if (fileLog) {
    fs.appendFile('soundBridge.log', logText + "\n", 'utf8', function (err) {
        if (err) console.log(err);
    });
  }
}

function logSong(logText) {
  fs.appendFile('spotifySong.log', logText + "\n", 'utf8', function (err) {
    if (err) console.log(err);
  });
}

async function getAccessToken(refreshToken) {
  try {
    let response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response;
  } catch (error) {
    return error;
  }
}

async function getSpotifyState(accessToken) {
  try {
    // request current playing song
    let response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/player',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    });
    return response;
  } catch (error) {
    logText(error,1,0);
    return error;
  }
}

async function getCurrentSong(accessToken) {
  try {
    // request current playing song
    let response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    });
    return response;
  } catch (error) {
    logText(error,1,0);
    logText("error getting currently playing song - " + error.response.status + ' : ' + error.response.statusText, 0, 1);
    main();
    return error;
  }
}

function setSoundBridgeSong(accessToken, songId, songPosition) {
  // request current playing song
  axios({
    method: 'put',
    url: 'https://api.spotify.com/v1/me/player/play',
    data: '{"uris":["spotify:track:' + songId + '"], "position_ms":' + songPosition + '}',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    }
  }).then(response => {
    if (response.status == 204) {
      logText("successfully set song on mini");
    }
  }).catch(error => {
    // if (error.response.status == 404) {
    //   logText("error setting song on mini - " + error.response.status + ' : ' + error.response.statusText, 1, 1);
    //   main();
    // }
    startSpotify()
      .then(() => {
        playSpotify(songId)
        .then(() => {
          main();
        })
        .catch(error => {
          logText(error, 1, 0);
        });
      })
      .catch(error => {
        logText(error, 1, 0);
      });
  });
}

// keep checking playing song until the access token expires
function monitorPlayingSong(accessToken, rokuConnection) {
  getCurrentSong(accessToken)
    .then(response => {
      // if the song was returned
      if (response.status == 200) {
        // if the song is currently playing
        if (response.data.is_playing == true) {
          if (powerState == 'standby') {
            // connect soundbridge to preset station 1
            rokuConnection.exec('PlayPreset 0');
            powerState = 'on';
          }
          // if it is not the same song from last check
          if (response.data.item.id != songId) {
            // update the songId
            songId = response.data.item.id;
            artistName = response.data.item.artists[0].name;
            songName = response.data.item.name;
            date = new Date();
            dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
              .toISOString()
              .split("T",2);
            logSong(songId + "\t" + dateString[0] +  "\t"  + dateString[1].slice(0, -1) +  "\t" + songName + "\t" + artistName, 1, 1);
            // set the mini play position to the spotify play position - offset from time info pulled from spotify
            songPosition = response.data.progress_ms + 800; // (new Date().getTime() - response.data.timestamp);
            // set the soundbridge song to the spotify song, at the correct playback postiion
            setSoundBridgeSong(miniAccessToken.data.access_token, songId, songPosition);
          }
        } else {
          powerState = 'standby';
          // pause the mini spotify
          pauseSpotify();
          // turn off the soundbridge
          rokuConnection.exec('SetPowerState standby');
        }
      }
      else {
        logText("error getting currently playing song - " + response.response.status + ' : ' + response.response.statusText, 0, 1);
        main();
      }
    })
    .catch(error => {
      logText(error, 1, 0);
      logText("error getting currently playing song - " + response.response.status + ' : ' + response.response.statusText, 0, 1);
      main();
    });
}

const getAccessTokens = async () => {
  try {
    dirkAccessToken = await getAccessToken(dirkRefreshToken);
  } catch (error) {
    logText(error, 1, 0);
  }
  try {
    miniAccessToken = await getAccessToken(miniRefreshToken);
  } catch (error) {
    logText(error, 1, 0);
  }
  if (dirkAccessToken.status == 200 && miniAccessToken.status == 200) {
    logText("dirk access token - " + dirkAccessToken.data.access_token, 0, 1);
    logText("mini access token - " + miniAccessToken.data.access_token, 0, 1);
  } else {
    logText("error retrieving access tokens", 1, 0);
  }
}

function startSpotify(){
	return execute('tell application "Spotify" to activate');
}

function playSpotify(uri){
		return execute('tell application "Spotify" to play track uri', {uri});
}

function pauseSpotify(){
  logText("successfully paused sopotify on mini");
  return execute('tell application "Spotify" to pause');
}

function main() {
  getAccessTokens()
    .then(() => {
      getSpotifyState(dirkAccessToken.data.access_token)
      .then(response => {
        console.log(response);
        // if there is not an active spotify client
        if (response.status == 204) {
        
        // if the song is currently playing
          if (powerState != 'standby') {
            powerState = 'standby';
            // turn off the soundbridge
            rokuConnection.exec('SetPowerState standby');
          }
        } 
        else if ((response.status == 200)) {
          rokuConnection.connect(rokuParams)
          .then(() => {
            monitorPlayingSong(dirkAccessToken.data.access_token, rokuConnection);
            setInterval(monitorPlayingSong, 2000, dirkAccessToken.data.access_token, rokuConnection);
          })
        }
        else {
          logText("error getting state of spotify account - " + response.response.status + ' : ' + response.response.statusText, 0, 1);
          if (response.response.statusText == 'The access token expired') {
            logText('expired token', 1, 0);
          }
        }
      })
      .catch(error => {
        logText(error, 1, 0);
      });
    });
}

// startSpotify()
//   .then(() => {
//     playSpotify('5ztIul377mylwHJkCnIWbn')
//     .then(() => {
      main();
  //   })
  //   .catch(error => {
  //     logText(error, 1, 0);
  //   });
  // })
  // .catch(error => {
  //   logText(error, 1, 0);
  // });