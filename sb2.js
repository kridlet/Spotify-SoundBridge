const Telnet = require('telnet-client')
const connection = new Telnet()

const params = {
  host: '10.0.10.90',
  port: '4444',
  shellPrompt: 'SoundBridge> ',
  timeout: 20000
}

const pixelCount = 700;

function drawAttention(iterations) {
  for (i=0; i<iterations; i++) {
    connection.exec('rect 1 1 511 31');
    connection.exec('clear');
  }
}

function displayMessage(message){
  connection.exec('font 3');
  connection.exec('marquee "' + message + '"');
}

function fillArray(elements, callback){
  const pixelArray = new Array();
  for (i=0; i<elements; i++) {
    pixelArray.push({ x : randomX(1), y : randomY(1) });
  }
  callback();
  return pixelArray;
}

function randomX(pixelSize) {
  return Math.floor(Math.random() * (512 - pixelSize)) + pixelSize;
}

function randomY(pixelSize) {
  return Math.floor(Math.random() * (32 - pixelSize)) + pixelSize;
}

function randomPixelSize() {
  return Math.floor(Math.random() * 5) + 1;
}

function drawArray(array) {
  for (i=0; i<array.length; i++) {
    connection.exec('point ' + array[i].x + ' ' + array[i].y);
  }
}

const randomArray = (length, max) => 
  Array(length).fill().map(() => Math.round(Math.random() * max))

function twinkle(pixelArray, twinkleArray, color) {
  for (i=0; i<twinkleArray.length; i++) {
    connection.exec('color ' + color);
    connection.exec('point ' + pixelArray[i].x + ' ' + pixelArray[i].y);
  }
}

function drawSomething() {
  for (var i = 0; i < 2000; i++) {
    randomWidth = 1 // randomPixelSize();
    randomHeigth = 1 // randomPixelSize();
    connection.exec('color ' + Math.round(Math.random()));
    connection.exec('rect ' + randomX(randomWidth) + ' ' + randomY(randomHeigth) + ' ' + randomWidth + ' ' + randomHeigth);  // fill the pixel with point
  }
}


connection.on('ready', function () {
  console.log('connection ready');
  connection.exec('sketch', {
      shellPrompt: 'sketch> '
    })
    .then(function () {
      drawAttention(30);
    })
    .then(function () {
      displayMessage("I <3 U");
    })
    .then(function () {
      drawAttention(30);
    })
    .then(function () {
      displayMessage("a lot");
    })
    .then(function () {
      drawSomething();
    })
    .then(function () {
      drawArray(pixelArray);
      for (i=0; i<10; i++) {
        twinkleArray = randomArray(Math.round(pixelArray.length*.1), pixelArray.length)
        console.log(twinkleArray);
        twinkle(pixelArray, twinkleArray, 0);
        twinkle(pixelArray, twinkleArray, 1);
      }
    })
})

connection.on('timeout', function () {
  console.log('socket timeout!')
  connection.end();
});

connection.on('close', function () {
  console.log('connection closed');
});

function main() {
  connection.connect(params);
}

pixelArray = fillArray(pixelCount, main);
