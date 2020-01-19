const Telnet = require('telnet-client');
const connection = new Telnet();
const params = {
  host: '10.0.10.90',
  port: 4444,
  shellPrompt: 'SoundBridge> ',
  timeout: 1500
}

connection.connect(params)
.then(function() {
  connection.exec('sketch')
  .then(function(res) {
    connection.exec('font 3')
    .then(function(res) {
      connection.exec('hello')
    })
  })
})
.error(function(error) {
  console.log('promises reject:', error)
})

// connection.exec('sketch');
// connection.exec('font 3');
// connection.exec('hello');
// connection.exec('exit');