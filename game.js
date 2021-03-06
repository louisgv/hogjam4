var Preloader = require('imagepreloader');
var buzz = require('buzz');
var tic = require('tic')();

var Game = require('crtrdg-gameloop');
var Mouse = require('crtrdg-mouse');
var Keyboard = require('crtrdg-keyboard');
var Scenes = require('crtrdg-scene');

var Player = require('./player');
var NPC = require('./npc');

var Sprite = require('./util/sprite');
var MathUtil = require('./util/math');

var Camera = require('./camera');
var Map = require('./map');

var game = new Game();
var mouse = new Mouse(game);
var keyboard = new Keyboard(game);
var keysDown = keyboard.keysDown;

var uiElements = [].slice.call(document.querySelectorAll('.ui'));
var loading = document.getElementById('loading');
var menuEl = document.getElementById('menu');
var playButton = document.getElementById('play');
var secondsEl = document.getElementById('seconds');
var overEl = document.getElementById('over');
var overText = document.getElementById('over-text');
var playAgainButton = document.getElementById('play-again');

// Player Properties
var score = 0;
var scoreElement = document.getElementById('points');
var LEADING_ZEROS = '0000000000';

// NPC Properties
var npcArray = [];
var NUM_OF_NPCS = 100;
var turnedBabies = 0;

// points per NPC 
var NPC_POINTS_VALUE = 100;
var babySprites = ['tan-baby.png', 'brown-baby.png', 'white-baby.png'];

game.on('start', function(){
  console.log('started');
  /* reset score onload */
  score = 0;
  scoreElement.innerText = LEADING_ZEROS;
  //console.log(menu);
  menuEl.style.display = 'none';
  uiElements.forEach(function(el, i, arr){
    el.style.display = 'initial';
  });
  song.play();
});

game.on('draw', function(context){
	map.draw(context, camera);
});

game.on('pause', function(){
  console.log('paused');
});

game.on('resume', function(){
  console.log('resumed');
});


/*
* Sounds
*/

game.musicPaused = false;
var song = new buzz.sound('./sounds/song.mp3');
var zombieNoise = new buzz.sound('./sounds/zombie-noise.mp3');

var pauseMusic = document.getElementById('pause-music');
var playMusic = document.getElementById('play-music');

pauseMusic.addEventListener('click', function(e){
  song.pause();
  playMusic.style.display = 'initial';
  pauseMusic.style.display = 'none';
  game.musicPaused = true;
});

playMusic.addEventListener('click', function(e){
  song.play().loop();
  playMusic.style.display = 'none';
  pauseMusic.style.display = 'initial';
  game.musicPaused = false;
});


/*
* THE PLAYER
*/

var player = new Player({
  game: game,
  keysDown: keysDown,
  camera: camera,
  position: { x: 100, y: 100 }
}).addTo(game);

player.on('update', function(){
  for(var i=0; i<npcArray.length; i++){
    // if player touches npc and npc has not already turned into zombie
    if (player.attacking && player.touches(npcArray[i]) && (npcArray[i].zombie !== true)){
      // add to player score
      score +=  NPC_POINTS_VALUE;
      scoreElement.innerText = new String(LEADING_ZEROS + score).slice(-10);
      //console.log('current score: ' + score);
      npcArray[i].zombie = true;
      turnedBabies += 1;
      player.attack();
    }
  }
});

player.attack =  function(){
  zombieNoise.load();
  zombieNoise.play();
};


/*
*
* MAP & CAMERA
*
*/

var map = new Map(game, 2500, 2500);
map.generate();

var camera = new Camera({
  game: game,
  follow: player,
  followPoint: { x: game.width / 2, y: game.height / 2 },
  viewport: { width: game.width, height: game.height },
  map: map
});


/*
* THE NPCs i.e. non-player characters
*/
// Why pass in game to npc objects?
for(var i = 0; i < NUM_OF_NPCS; i++){
  npcArray[i] = new NPC({
    game: game,
    map: map,
    camera: camera,
    position: { x: MathUtil.randomInt(0, (map.width - 64)), y: MathUtil.randomInt(0, (map.height - 64)) },
    path: MathUtil.randomInt(0, 3)
  }).addTo(game);
}

var preload = new Preloader();
preload
  .add('images/zombie-baby.png')
  .add('images/tan-baby.png')
  .add('images/brown-baby.png')
  .add('images/white-baby.png')
  .add('images/turned-baby.png')
  .add('images/attacking.png')
  .success(function(images){
    
    player.image = new Sprite({
      entity: player,
      image: images['zombie-baby.png'],
      frames: 4,
      fps: 16
    });

    player.attackingImage = new Sprite({
      entity: player,
      image: images['attacking.png'],
      frames: 4,
      fps: 16
    });

    for(var i = 0; i < npcArray.length; i++){
      npcArray[i].image = new Sprite({
        entity: npcArray[i],
        image: images[babySprites[MathUtil.randomInt(0,2)]],
        turnedImage: images['turned-baby.png'],
        frames: 4,
        fps: 12
      });

      npcArray[i].turnedImage = new Sprite({
        entity: npcArray[i],
        image: images['turned-baby.png'],
        frames: 4,
        fps: 12
      });
    }

    scenes.set(menu);
  })
  .error(function(err){ console.log(err); })
  .done();


/*
* SCENES 
*/

var scenes = new Scenes(game);

var menu = scenes.create({
  name: 'menu'
});

menu.on('start', function(){
  loading.style.display = 'none';
  playButton.style.display = 'initial';
});

playButton.addEventListener('click', function(e){
  scenes.set(play);
}, false);

var play = scenes.create({
  name: 'play'
});

play.on('start', function(){
  game.start();
});

play.on('update', function(dt){
  tic.tick(dt);
  if (turnedBabies === NUM_OF_NPCS) scenes.set(over);
});

var seconds = 60;

tic.interval(function(param1) {
  seconds -= 1;
  secondsEl.innerText = seconds;
  if (seconds === 0) scenes.set(over);
}, 1000, 'Every');

var over = scenes.create({
  name: 'play'
});

over.on('start', function(){
  game.pause();
  if (turnedBabies < NUM_OF_NPCS) overText.innerText = 'NOPE.'
  else overText.innerText = 'YEP.'
  overEl.style.display = 'block';
});

playAgainButton.addEventListener('click', function(e){
  document.location.reload();
}, false);
