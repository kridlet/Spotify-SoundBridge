const axios = require('axios');

require('dotenv').config();

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const dirkRefreshToken = process.env.DIRK_REFRESH;
const jessRefreshToken = process.env.JESS_RERFESH;
const miniRefreshToken = process.env.MINI_REFRESH;

let accessToken = 'invalid';
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


function getAccessToken(refreshToken) {
  axios({
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
  })
  .then(response => {
      console.log("function", response.data.access_token);
      return response.data.access_token;  
  })
  .catch(error => {
    console.log(error.response.status + ' - ' + error.response.statusText);
    console.log(error.response.data.error + ' - ' + error.response.data.error_description);
    return 'invalid';
  });
}

accessToken = getAccessToken(dirkRefreshToken);
console.log("outer", accessToken);


// async function getCurrentSong(accessToken) {
//   try {
//     // request current playing song
//     let response = await axios({
//       method: 'get',
//       url: 'https://api.spotify.com/v1/me/player/currently-playing',
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json',
//         'Authorization': 'Bearer ' + accessToken
//       }
//     });
//     return response.data;
//   } catch (error) {
//     return error.response;
//   }
// }

// function setSoundBridgeSong(accessToken, songId) {
//   // request current playing song
//   axios({
//     method: 'put',
//     url: 'https://api.spotify.com/v1/me/player/play',
//     data: '{"uris":["spotify:track:' + songId + '"]}',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//       'Authorization': 'Bearer ' + accessToken
//     }
//   }).then(response => {
//     // console.log(response);
//   }).catch(error => {
//     console.log(error.response.status + ' : ' + error.response.statusText);
//   });
// }



// // keep checking playing song until the access token expires
//     while (accessToken != 'invalid') {
//       getCurrentSong(accessToken)
//         .then(response => {
//           if (response.status == 200) {
//             songId = response.item.id;
//             console.log(songId);
//             getAccessToken(SoundBridgeRobot_refreshToken)
//               .then(response => {
//                 accessToken = response.access_token;
//                 console.log(accessToken);
//                 console.log(songId);
//                 setSoundBridgeSong(accessToken, songId);
//               })
//               .catch(error => {
//                 console.log(error);
//               });
//           } else {
//             accessToken = 'invalid';
//             console.log(response.status + ' - ' + response.statusText);
//             console.log(response.data.error.status + ' - ' + response.data.error.message);
//             if (response.data.error.message == 'The access token expired') {
//               //get a new token

//             }
//           }
//         })
//         .catch(error => {
//           console.log(error);
//         });
//     }