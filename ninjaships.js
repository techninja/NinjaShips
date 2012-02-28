/*!
 * Ninja Ships! Super-Awesome HTML5 and CSS3 Spaceship flying "library"!!
 *
 * jQuery, Spritely (0.6) required
 * v0.1
 */

// Paul irishes shim!
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// TODO: break this out elsewhere
(function( $ ){
  $.fn.rotate = function(degree) {
    this.css({
      WebkitTransform: 'rotate(' + degree + 'deg)',
      '-moz-transform': 'rotate(' + degree + 'deg)'}
    );
  };
})( jQuery );


// TODO: Remove all nasty globals!
var stopanim = false;
var oneshotperscreen = false; // Just like it says!
var shipscreenwrap = true; // Wrap the ships on the screen

// TODO: Preload explosion sprite in code

/**
 * Ship primitive
 */
function shipObject(name, elementid, style, pos){
  this.name = name;

  // Velocity (speed + direction)
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.velocity_length = 0;
  this.max_speed = 10;
  this.drag = 0.03;
  this.turn = 0;
  this.thrust = 0;
  this.width = 64;
  this.height = 64;
  this.projectiles = [];// TODO: move yoffset to  projectile primitive
  this.projectile_defaults = {type: 'laser', style: 'red', yoffset: -1};
  this.rotation_speed = 5;
  this.element_name = elementid;
  this.exploding = false;
  this.element_id = '.ship_id_' + elementid;

  this.explosion_sound = new Audio("explosion.wav");

  if (style != undefined){
    this.style = style;
  }else{
    this.style = 'a';
  }

  // Set Projectile defaults per ship style
  if (this.style == 'b'){
    this.projectile_defaults.type = 'energy';
    this.projectile_defaults.style = 'blue';
    this.projectile_defaults.yoffset = 20;
  }
  if (this.style == 'c'){
    this.projectile_defaults.type = 'laser';
    this.projectile_defaults.style = 'green';
  }

  if (pos != undefined){
    this.pos = pos;
  }else{
    this.pos = {x: 0, y: 0, d: 0};
  }

  this.home = {x: this.pos.x, y: this.pos.y, d: this.pos.d};

  $('body').append('<ship class="ship_id_' + elementid + ' overlay layer2 ship_'+style+'"/>');
  this.element = $(this.element_id);

  // FUNCTION Direct visual rotation
  this.rot = function(deg){
    this.pos.d = this.pos.d + deg;
      if (this.pos.d >= 360) {
        this.pos.d = 0;
      }else if (this.pos.d <= 0) {
        this.pos.d = 360;
      }
  };

  // FUNCTION Send out a projectile
  this.fire = function(){
    // One shot on screen only!
    if (oneshotperscreen){
      if (this.projectiles[this.projectiles.length-1]){
        if (this.projectiles[this.projectiles.length-1].active) return;
      }
    }

    // Add to the projectile array for the ship object
    this.projectiles.push(
      new projectileObject(
        elementid + '_proj_' + this.projectiles.length,
        this.projectile_defaults.type,
        this.projectile_defaults.style,
        {x: this.pos.x+50, y: this.pos.y+this.projectile_defaults.yoffset, d: this.pos.d}
      )
    );
  }

  // FUNCTION remove velocity helper
  this.kill_velocity = function(){
    this.velocity_x = 0;
    this.velocity_y = 0;
    this.velocity_length = 0;
  }

  // FUNCTION Trigger ship explosion
  this.trigger_boom = function(returnhome, midcallback, endcallback){
    if (!this.exploding){
      var ship = this;
      this.exploding = true;
      ship.element.addClass('exploding');

      this.explosion_sound.play();

      $('body').append('<boom id="boom_' + ship.element_name + '" class="layer5 overlay" />');
      $('#boom_'+ ship.element_name)
      .css({left:ship.pos.x-ship.width/2-64, top:ship.pos.y+ship.height/2-128})
      .destroy()
      .sprite({
        fps: 20,
        no_of_frames: 56,
        on_frame: {26: function(obj) { // called on frame 26
            if ($.isFunction(midcallback)) midcallback(ship);
            if (returnhome){
              ship.element.fadeOut();
            }
          }
        },
        on_last_frame: function(obj) {
          obj.spStop();
          ship.element.removeClass('exploding');
          ship.exploding = false;
          obj.remove();
          if ($.isFunction(endcallback)) endcallback(ship);
          if (returnhome){
            ship.kill_velocity();
            ship.pos.x = ship.home.x;
            ship.pos.y = ship.home.y;
            ship.element.fadeIn('slow');
          }
        }
      });
    }
  }
}

function projectileObject(elementid, type, style, pos){
  this.pos = pos;
  this.element_id = '.ship_id_' + elementid;

  switch(type){
    case 'laser':
      this.speed = 20;
      this.life = 2;
      break;
    case 'energy':
      this.speed = 10;
      this.life = 20;
      break;
  }

  $('body').append('<projectile class="ship_id_' + elementid + ' overlay init layer0 ' + style + ' ' + type +'"/>');
  this.element = $(this.element_id);
  this.active = true;
  update_projectile_position();
}

function update_ship_position(){
  $.each(ships, function(){
    if (this.exploding){
      $('#boom_'+ this.element_name).css({
        left:this.pos.x - this.width/2-64, top:this.pos.y+this.height/2-128
      });
    }
    $(this.element_id).rotate(this.pos.d);
    this.element.css({
      left: this.pos.x,
      top: this.pos.y
    });
  });
}

function update_projectile_movement(){
  for(var s=0; s<ships.length; s++) {
    for(var p=0; p<ships[s].projectiles.length; p++) {
      proj = ships[s].projectiles[p];

      var theta = proj.pos.d * (Math.PI / 180);
      proj.pos.x+= Math.sin(theta) * proj.speed;
      proj.pos.y+= Math.cos(theta) * -proj.speed;
      // TODO: Pay attention to projectile "life"
      //console.log(proj.pos); stopanim=true;
    }
  }
}

function update_projectile_position(){
  for(var s=0; s<ships.length; s++) {
    for(var p=0; p<ships[s].projectiles.length; p++) {
      // TODO: Remove projectile element completely!
      proj = ships[s].projectiles[p];
      if (proj.active) {
        $(proj.element_id).rotate(proj.pos.d);
          proj.element.css({
            left: proj.pos.x,
            top: proj.pos.y
        }).removeClass('init');
      }else if(proj.element.length){ // Cull inactive projectile elements
        proj.element.remove();
      }

      if (proj.pos.x > $(window).width() ||
          proj.pos.y > $(window).height() ||
          proj.pos.x + proj.element.width() < 0 ||
          proj.pos.y + proj.element.height() < 0){
        proj.element.remove();
        proj.active = false;
      }

    }
  }
}

function detect_collision(){
  /*
    * Pseudo:
    *
    * ship to ship collision
    *
    * ship to projectile collision
    *
    *
    *
    *
    */
}

function update_ship_movement(){
  $.each(ships, function(){
    if (this.turn != 0){
      this.rot(this.turn);
    }

    if (this.exploding){
      $(this.element_id).removeClass('thrusting thrusting_back')
      //return;
    }

    // find the overall velocity length
    this.velocity_length = Math.sqrt(Math.pow(this.velocity_x, 2) + Math.pow(this.velocity_y, 2)) - this.drag;

    // if exploding, double the drag!
    if (this.exploding){
      this.velocity_length = this.velocity_length - this.drag;
    }

    if (this.velocity_length < 0) {
      this.velocity_length = 0;
    } else {
      if (this.velocity_length > this.max_speed){
        this.velocity_length = this.max_speed;
      }

      // find the current velocity rotation
      var rot = Math.atan2(this.velocity_y, this.velocity_x) * (180 / Math.PI);

      // recalculate the vVelelocities by multiplying the new rotation by the overall velocity length
      var theta = rot * (Math.PI / 180);
      this.velocity_x = Math.cos(theta) * this.velocity_length;
      this.velocity_y = Math.sin(theta) * this.velocity_length;

      // update position
      this.pos.y += this.velocity_x;
      this.pos.x += this.velocity_y;
    }

    if(this.thrust != 0){
      theta = this.pos.d * (Math.PI / 180);
      this.velocity_x += Math.cos(theta) * -this.thrust;
      this.velocity_y += Math.sin(theta) * this.thrust;
    }

    if (this.thrust > 0){
      this.element.addClass('thrusting');
    }else if (this.thrust < 0){
      this.element.addClass('thrusting_back');
    }else if (this.thrust == 0){
      this.element.removeClass('thrusting thrusting_back')
    }

    // Wraparound ==========================================================
    // WRAP TOP -------===========------------=============
    // (only update if we're moving or turning)
    if ((this.velocity_length != 0 || this.turn != 0) && shipscreenwrap) {
      if (this.pos.y < 0){
        // Create Clone
        if ($(this.element_id).length == 1)
          this.element.clone().appendTo('body');

        // Move to Bottom if past top
        if (-this.pos.y >= 64)
          this.pos.y = $(window).height() - 64;

        // Position Clone
        $(this.element_id + ':last').css({
          left: this.pos.x + 'px', top: ($(window).height() + this.pos.y) + 'px'
        })
      }

      // WRAP LEFT -------===========------------=============
      if (this.pos.x < 0){

        // Create Clone
        if ($(this.element_id).length == 1)
          this.element.clone().appendTo('body');

        // Move to Right if past left
        if (this.pos.x <= -64)
          this.pos.x = $(window).width() - 64;

        // Position Clone
        $(this.element_id + ':last').css({
        left: ($(window).width() + this.pos.x) + 'px', top: this.pos.y + 'px'
        })
      }

      //*
      // WRAP BOTTOM -------===========------------=============
      if (this.pos.y + 64 > $(window).height()){
        // Create Clone
        if ($(this.element_id).length == 1)
          this.element.clone().appendTo('body');

        // Move to Top if past bottom
        if (this.pos.y > $(window).height())
          this.pos.y = 0;

        // Position Clone
        $(this.element_id + ':last').css({
          left: this.pos.x + 'px', top: -($(window).height() - this.pos.y) + 'px'
        })
      }

      // WRAP RIGHT -------===========------------=============
      if (this.pos.x + 62 >= $(window).width()){
        // Create Clone
        if ($(this.element_id).length == 1){
          this.element.clone().appendTo('body');
        }

        // Move to left if past right
        if (this.pos.x >= $(window).width())
          this.pos.x = 0;

        // Position Clone
        $(this.element_id + ':last').css({
          left: (this.pos.x - $(window).width()) + 'px', top: this.pos.y + 'px'
        })
      }
      //*/

      // Clean up leftover clone
      if (this.pos.x > 0 && this.pos.y > 0 &&
          this.pos.x+64 < $(window).width() &&
          this.pos.y+64 < $(window).height() && $(this.element_id).length > 1){
          $(this.element_id + ':last').remove();
      }
    }
  });
}

/**
 *  Main loop function
 */
function run_ship_anim_frame(){
  detect_collision();
  update_ship_position();
  update_ship_movement();
  update_projectile_movement();
  update_projectile_position();
}