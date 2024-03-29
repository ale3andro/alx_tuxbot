//const { default: Konva } = require("konva");

/** FROM https://www.kevinleary.net/javascript-get-url-parameters/
 * JavaScript Get URL Parameter
 * 
 * @param String prop The specific URL parameter you want to retreive the value for
 * @return String|Object If prop is provided a string value is returned, otherwise an object of all properties is returned
 */
function getUrlParams( prop ) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );
  
    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );
  
    return ( prop && prop in params ) ? params[ prop ] : params;
}

var game_buttons = [
     {
        "class": "button",
        "img": "alx_img/go_forward.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"115",
        "y": "15"
    },
    {
        "class": "button",
        "img": "alx_img/go_back.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"115",
        "y": "115"
    },
    {
        "class": "button",
        "img": "alx_img/rotate_clockwise.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"15",
        "y": "115"
    },
    {
        "class": "button",
        "img": "alx_img/rotate_counter_clockwise.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"215",
        "y": "115"
    },
    {
        "class": "button",
        "img": "alx_img/start.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"215",
        "y": "15"
    },
    {
        "class": "button",
        "img": "alx_img/clear.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"15",
        "y": "15"
    },
    {
        "class": "button",
        "img": "alx_img/clear_one_80.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"315",
        "y": "15"
    }
];

var stage;
var layer;
var highlight_rect;
var highlight_rect_x = 5;
var highlight_rect_y = 205;
var tux;
var player_start_x;
var player_start_y;
var player_img_url;
var stage_items = [];
var stage_width = 0;
var stage_height = 0;
var stage_border_x_max;
var stage_border_x_min;
var stage_border_y_max;
var stage_border_y_min;
var stage_img = '';
var play_enabled = true;

var last_arrow_clicked = {};
var arrows_clicked = [];
var coord_x = 10;
var coord_y = 210;
var start_coord_x = 10;
var start_coord_y = 210;
var arrows_added = 0;
var max_arrows = 16;

var arrow_played = 0;

$( document ).ready(function() {
    if ('id' in getUrlParams()) {
        var questId = getUrlParams('id');
        if ( (questId==undefined) || (questId=='') ) {
            console.log('Undefined or empty string');
            
        } else {
            $.ajax({
                url: 'levels/' + questId + '.json',
                contentType: "application/json",
                dataType: "json",
                success: function(result){
                    
                    $.each(result, function(i, item) {
                        if ("stage_img" in item) {
                            stage_width = item.stage_width;
                            stage_height = item.stage_height;
                            stage_img = item.stage_img;
                            stage_border_x_max = parseInt(item.stage_border_x_max);
                            stage_border_x_min = parseInt(item.stage_border_x_min);
                            stage_border_y_max = parseInt(item.stage_border_y_max);
                            stage_border_y_min = parseInt(item.stage_border_y_min);
                        } else if ("player_start_x" in item) {
                            player_start_x = parseInt(item.player_start_x);
                            player_start_y = parseInt(item.player_start_y);
                            player_img_url = item.player_img_url;
                        } else
                            stage_items.push(item);
                    });
                    $.each(game_buttons, function(i, item) {
                        stage_items.push(item);
                    });

                    // first we need to create a stage
                    stage = new Konva.Stage({
                        container: 'container',   // id of container <div>
                        width: stage_width,
                        height: stage_height
                    });


                    // then create layer
                    layer = new Konva.Layer();
        
                    var imageObj = new Image();
                    imageObj.onload = function() {
                        var map = new Konva.Image({
                            x: 0,
                            y: 0,
                            image: imageObj,
                            width: stage_width,
                            height: stage_height
                        });
        
                        // add the shape to the layer
                        layer.add(map);
                        //layer.batchDraw();
                    };
                    
                    imageObj.src = stage_img;
                    stage.add(layer);
                    
                    var player = new Image();
                    player.onload = function () {
                        var token = new Konva.Image({
                            //x: 415+40,
                            x: player_start_x,
                            //y: 415+40,
                            y: player_start_y,
                            image: player,
                            width: 80,
                            height: 80,
                            id: 'token',
                            offset: {
                                x: 40,
                                y: 40,
                              },
                        });
                        layer.add(token);
                        console.log('token added to Konva layer');
                    };
                    player.src = player_img_url;
                    
                    var walls = {};
                    var loaded_images = 0;

                    for (var q=0; q<stage_items.length; q++) {
                        console.log('one');
                        walls[q] = new Image();
                        walls[q].x = stage_items[q].x;
                        walls[q].onload = function () {
                            if (++loaded_images >= stage_items.length) {
                               for (var u=0; u<stage_items.length; u++) {
                                    var wall_ci = new Konva.Image({
                                        x: stage_items[u].x,
                                        y: stage_items[u].y,
                                        image: walls[u],
                                        width: stage_items[u].width,
                                        height: stage_items[u].height,
                                        name: stage_items[u].class,
                                    });
                                    layer.add(wall_ci);
                                    console.log('stage item added to Konva layer');
                               }
                            }
                        };
                        walls[q].src = stage_items[q].img;
                    }

                    stage.add(layer);
                    layer.draw();

                    // Click function
                    layer.on('click', function(e) {
                        var target = e.target;
                        if (target.getAttr('name')=='button') {
                            last_arrow_clicked = target.getAttr('image').src;
                            var arrow_filename = last_arrow_clicked.split('/')[last_arrow_clicked.split('/').length-1].slice(0, -4);
                            if (arrow_filename.indexOf('start')>=0) {
                                if (play_enabled) {
                                    arrow_played = 0;
                                    var tux = stage.find('#token')[0];
                                    tux.x(player_start_x);
                                    tux.y(player_start_y);
                                    tux.rotation(0);
                                    play_enabled=false;
                                    movePlayer();
                                } else 
                                    console.log('play button is not enabled');
                            } else if (arrow_filename.indexOf('clear')>=0) {
                                if (arrow_filename.indexOf('one')>=0) {
                                    if (play_enabled) {
                                        console.log('Delete the last arrow, if any');
                                        if (arrows_clicked.length>0){
                                            // Find the image
                                            node = stage.find('.gameArrow' + arrows_clicked.length);
                                            // Delete it
                                            node[0].destroy();
                                            // Remove it from the array of arrows
                                            arrows_clicked.pop();
                                            // Decrease the corresponding counter
                                            --arrows_added;
                                        }
                                    } else 
                                        console.log('delete one button is not enabled');
                                } else 
                                    location.reload();
                            } else {
                                if (arrows_added>=max_arrows){
                                    console.log('No more arrows please');
                                } else {
                                    arrows_clicked.push(arrow_filename);
                                    var arrow = new Image();
                                    arrow.onload = function () { 
                                        updateArrowCoordinates(++arrows_added);
                                        var arrowObj = new Konva.Image({
                                            x: coord_x,
                                            y: coord_y,
                                            image: arrow,
                                            width: 80,
                                            height: 80,
                                            name: 'gameArrow' + arrows_clicked.length,
                                        });
                                        layer.add(arrowObj);
                                    };
                                    arrow.src = last_arrow_clicked.replace(arrow_filename, arrow_filename + "_colored");
                                }
                            }
                        }
                    });
                    var container = stage.container();
                    container.tabIndex = 1;
                    container.focus();
                    const DELTA = 100;
                    /*
                    container.addEventListener('keydown', function (e) {
                        var tux = stage.find('#token')[0];
                        var walls = stage.find('.obstacle');
                        var prize = stage.find('.prize')[0];
                        if (e.keyCode === 37) {
                            if ( (tux.x() - DELTA)<0 ) 
                                alert('out of bounds');
                            else {
                                tux.x(tux.x() - DELTA);
                            }
                        } else if (e.keyCode === 38) {
                            if ( (tux.y() - DELTA) < 0 ) 
                                alert('out of bounds');
                            else {
                                tux.y(tux.y() - DELTA);
                            }
                        } else if (e.keyCode === 39) {
                            if ( (tux.x()+DELTA)> stage_width ) 
                                alert('out of bounds');
                            else {
                                tux.x(tux.x() + DELTA);
                            }
                        } else if (e.keyCode === 40) {
                            if ( (tux.y() + DELTA) > stage_height ) 
                                alert('out of bounds');
                            else {
                                tux.y(tux.y() + DELTA);
                            }
                        } else if (e.keyCode === 65) {
                            console.log('Tux x:', tux.x(), 'and y:', tux.y(), " width:", tux.width(), " height:", tux.height(), " rotation: ", tux.rotation());
                            for (var q=0; q<walls.length; q++) {
                                console.log('Wall:', q, ' x:', walls[q].x(), 'and y:', walls[q].y(), " width:", walls[q].width(), " height:", walls[q].height());
                            }
                        } else {
                            return;
                        }
                        if (haveIntersection(tux, walls)) 
                            console.log('Game over');
                        if (doTheyIntersect(tux, prize))
                            console.log('Winner!');
                        e.preventDefault();
                    });
                    */
                    function haveIntersection(tux, obstacles) {
                        for (var q=0; q<obstacles.length; q++) {
                            var check = doTheyIntersect(tux, obstacles[q])
                            if (check==true)
                                return true;
                        }
                        return false;
                    }
                    function doTheyIntersect(r1, r2) {
                        return !(
                          parseInt(r2.x()) > (r1.x()-r1.offsetX()) + r1.width() ||
                          parseInt(r2.x()) + r2.width() < (r1.x()-r1.offsetX()) ||
                          parseInt(r2.y()) > (r1.y()-r1.offsetY()) + r1.height() ||
                          parseInt(r2.y()) + r2.height() < (r1.y()-r1.offsetY())
                        );
                    }
                    function updateArrowCoordinates(arrowsAdded) {
                        Row = Math.floor((arrowsAdded-1)/4);
                        Col = arrowsAdded-4*Row-1;
                        console.log('Row: ', Row, ' Col: ', Col);
                        coord_x = start_coord_x + Col*100;
                        coord_y = start_coord_y + Row*100;
                    }

                    function movePlayer() {
                        if (arrows_clicked.length==0) {
                            play_enabled=true;
                            return;
                        }
                        var tux = stage.find('#token')[0];
                        if (highlight_rect==undefined) {
                            highlight_rect = new Konva.Rect({
                                x: highlight_rect_x,
                                y: highlight_rect_y,
                                width: 90,
                                height: 90,
                                stroke: 'red',
                                strokeWidth: 2,
                                shadowBlur: 5,
                                cornerRadius: 10,
                              });
                              // add the shape to the layer
                            layer.add(highlight_rect);
                        }
                        if (arrow_played==0) {
                            //coord_y = 210; // This is a bug
                            highlight_rect.x(highlight_rect_x);
                            highlight_rect.y(highlight_rect_y);
                        } else if (arrow_played<arrows_clicked.length) {
                            var new_x = highlight_rect.x() + 100;
                            var new_y = highlight_rect.y();
                            if (new_x>400) {
                                new_x = 5;
                                new_y = highlight_rect.y() + 100;
                            }
                            highlight_rect.x(new_x);
                            highlight_rect.y(new_y);
                        }
                        if (arrow_played==arrows_clicked.length)
                        {
                            console.log('End of the attempt');
                            play_enabled=true;
                        } else  {
                            if (arrows_clicked[arrow_played]=='rotate_clockwise') {
                                var angularSpeed = 90;
                                var init_angle = tux.rotation();
                                var anim = new Konva.Animation(function (frame) {
                                    var angleDiff = (frame.timeDiff * angularSpeed) / 1000;
                                    tux.rotate(angleDiff);
                                    if (tux.rotation()-init_angle>=90) {
                                        stopAnimation(this);
                                        tux.rotation(init_angle+90);
                                    }
                                    
                                  }, layer);
                                  anim.start();
                            } else if (arrows_clicked[arrow_played]=='rotate_counter_clockwise') {
                                var angularSpeed = 90;
                                var init_angle = tux.rotation();
                                var anim = new Konva.Animation(function (frame) {
                                    var angleDiff = (-1)*(frame.timeDiff * angularSpeed) / 1000;
                                    tux.rotate(angleDiff);
                                    if (tux.rotation()-init_angle<=-90) {
                                        stopAnimation(this);
                                        tux.rotation(init_angle-90);
                                    }
                                    
                                  }, layer);
                                  anim.start();
                            } else {
                                // move a node to the right at 100 pixels/second
                                var velocity = 100;
                                var init_x = tux.x();
                                var init_y = tux.y();
                                // Mutliplicators for the forward and the backward move of tux
                                // if moving backword is the default and with the following if
                                // the values are changed as needed
                                var multiplicator_x = -1;
                                var multiplicator_y = 1;
                                if (arrows_clicked[arrow_played]=='go_forward') {
                                    multiplicator_x = 1;
                                    multiplicator_y = -1;
                                }
                                var end_x = init_x + 100 * Math.sin(tux.rotation() * Math.PI / 180) * multiplicator_x;
                                var end_y = init_y + 100 * Math.cos(tux.rotation() * Math.PI / 180) * multiplicator_y;
                                var anim = new Konva.Animation(function(frame) {
                                    var dist_x = velocity * (frame.timeDiff / 1000) * Math.sin(tux.rotation() * Math.PI / 180) * multiplicator_x;
                                    var dist_y = velocity * (frame.timeDiff / 1000) * Math.cos(tux.rotation() * Math.PI / 180) * multiplicator_y;
                                    tux.move({x: dist_x, y: dist_y});
                                    if ( (Math.abs(tux.x()-init_x) >100) || (Math.abs(tux.y()-init_y)>100) ) {
                                        stopAnimation(this);
                                        tux.x(end_x);
                                        tux.y(end_y);
                                    }
                                }, layer);

                                anim.start();
                            }
                            arrow_played++;
                        }
                    }
                    function stopAnimation(animation) {
                        animation.stop();
                        var tux = stage.find('#token')[0];
                        var walls = stage.find('.obstacle');
                        var prize = stage.find('.prize')[0];
                        if (haveIntersection(tux, walls)) {
                            $('#alx_msg').html('Πάνω σε εμπόδιο...<br /><img onclick="location.reload();" src="alx_img/run_again.png"><img id="alx_close" src="alx_img/close.png">')
                            $('#alx_close').on( "click", function() {
                                $('#alx_msg').hide();
                                play_enabled=true;
                              } );
                             $('#alx_msg').show();
                             animateCSS('#alx_msg', 'bounce').then((message) => {
                                // Do something after the animation ends                                /*
                                /*
                                setTimeout(function() {
                                    $('#alx_msg').hide();
                                }, 5000);
                                */
                              });
                        }
                        else if (doTheyIntersect(tux, prize)) {
                            console.log('Winner!');
                            console.log('out of bounds');
                             $('#alx_msg').html('Μπράβο!!<br /><img onclick="location.reload();" src="alx_img/run_again.png">');
                             $('#alx_msg').show();
                             animateCSS('#alx_msg', 'bounce').then((message) => {
                                // Do something after the animation ends
                              });
                        }
                        else if ( (tux.x()>stage_border_x_max) || (tux.x()<stage_border_x_min) || (tux.y()>stage_border_y_max) || (tux.y()<stage_border_y_min) ) {
                             console.log('out of bounds');
                             $('#alx_msg').html('Εκτός πίστας...<br /><img onclick="location.reload();" src="alx_img/run_again.png"><img id="alx_close" src="alx_img/close.png">');
                             $('#alx_close').on( "click", function() {
                                $('#alx_msg').hide();
                                play_enabled=true;
                              } );
                              
                             $('#alx_msg').show();
                             animateCSS('#alx_msg', 'bounce').then((message) => {
                                // Do something after the animation ends
                              });
                        } else {
                            setTimeout(function() {
                                movePlayer();
                            }, 500)
                        }
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log('Error parsing quest!');
                }
            });
        }
    // if id is not in the argument list
    } else {
      $('#alx_msg').html('Πρέπει να οριστεί το id του quest');
    }
});

const animateCSS = (element, animation, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove(`${prefix}animated`, animationName);
        resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
});
