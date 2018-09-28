const axios = require('axios');
const Telnet = require('telnet-client');
require('dotenv').config();

let rokuConnection = new Telnet()
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const dirkRefreshToken = process.env.DIRK_REFRESH;
const jessRefreshToken = process.env.JESS_RERFESH;
const miniRefreshToken = process.env.MINI_REFRESH;
const expiredAccessToken = 'BQB90uwLK6mkdxxkJbOraxEQt0DWcDW_k0N1Qt4TqNAXZPN3p9w_-ZXTnkqZjkxxZZm9d0FAiZsoh8ndGLuUGQw1oEf66SyEMxtDIIafm7QG-3KviANvQEbjcQzBSvq9swA9aVo9AQzAmoSSHTaLs2AJtocOdo0G7eQE';
let accessToken = 'invalid';
let songId = '';
// this the error when the access token is invalid:
//    { error: { status: 401, message: 'Invalid access token' } }
// this is the error when access token has expired:
//    { error: { status: 401, message: 'The access token expired' } }
// this is the error when the device is not found:
//    { error: { status: 404, message: 'Device not found' } }

// 1. use refresh tokens (dirk and soundbridge) to get access tokens
// 2. use the dirk access token to read the current playing song in dirk's account, every second
// 3. use the soundbridge token to play that song on the mini/soundbridge link
// 4. if either of the access tokens expire, get new ones using the refresh tokens.

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
    // console.log(response);
    return response;
  } catch (error) {
    // console.log(error);
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
      console.log('successfully set song');
    }
  }).catch(error => {
    console.log(error.response.status + ' : ' + error.response.statusText);
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
          // if it is not the same song from last pass
          if (response.data.item.id != songId) {
            // update the songId
            songId = response.data.item.id;
            // set the mini play position to the spotify play position - offset from time info pulled from spotify
            songPosition = response.data.progress_ms + 1000; // (new Date().getTime() - response.data.timestamp);
            // set the soundbridge song to the spotify song, at the correct playback postiion
            setSoundBridgeSong(miniAccessToken.data.access_token, songId, songPosition);
            // connect soundbridge to preset station 1
            rokuConnection.exec('PlayPreset 0')
          }
        } else {
          // turn off the soundbridge
          rokuConnection.exec('SetPowerState standby')
        }
      } else {
        console.log(response.response.status + ' : ' + response.response.statusText);
        if (response.response.statusText == 'The access token expired') {
          console.log('expired token');
        }
      }
    })
    .catch(error => {
      console.log("catch error " + error);
    });
}

const startApp = async () => {
  try {
    dirkAccessToken = await getAccessToken(dirkRefreshToken);
  } catch (error) {
    console.log(error);
  }
  try {
    miniAccessToken = await getAccessToken(miniRefreshToken);
  } catch (error) {
    console.log(error);
  }
  if (dirkAccessToken.status == 200 && miniAccessToken.status == 200) {
    console.log("dirk", dirkAccessToken.data.access_token);
    console.log("mini", miniAccessToken.data.access_token);
  } else {
    console.log("outer");
  }
}


let rokuParams = {
  host: '10.0.10.35',
  port: 5555,
  shellPrompt: '',
  timeout: 1500
}

startApp()
  .then(() => {
    rokuConnection.connect(rokuParams)
      .then(() => {
        setInterval(monitorPlayingSong, 2000, dirkAccessToken.data.access_token, rokuConnection);
      })
  });