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
         "class": "prize",
         "img": "alx_img/alx_fish.png",
         "img_width" : "70",
         "img_height": "70",
         "x":"615",
         "y": "315"
     },
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
        "img": "alx_img/replay.png",
        "img_width" : "70",
        "img_height": "70",
        "x":"15",
        "y": "15"
    }
];

var stage;
var layer;
var stage_items = [];
var stage_width = 0;
var stage_height = 0;
var stage_img = '';

var last_arrow_clicked = {};
var arrows_clicked = [];
var coord_x = 15;
var coord_y = 215;
var arrows_added = 0;

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
                        layer.batchDraw();
                    };
                    
                    imageObj.src = stage_img;
                    stage.add(layer);

                    var player = new Image();
                    player.onload = function () {
                        var token = new Konva.Image({
                            x: 415+40,
                            y: 15+40,
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
                    };
                    player.src = 'alx_img/tuxbot_80.png';

                    var walls = {};
                    var loaded_images = 0;

                    for (var q=0; q<stage_items.length; q++) {
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
                                console.log(arrows_clicked);
                                movePlayer();
                            } else if (arrow_filename.indexOf('replay')>=0) {
                                console.log('replay button');
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
                                    });
                                    layer.add(arrowObj);
                                };
                                arrow.src = last_arrow_clicked.replace(arrow_filename, arrow_filename + "_colored");
                            }
                        }
                    });
                    
                    var container = stage.container();
                    container.tabIndex = 1;
                    container.focus();
                    const DELTA = 100;

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
                        if (arrowsAdded>4) {
                            console.log('No more than 4 arrows allowed');
                        }
                        if (arrowsAdded>1) {
                            coord_x = coord_x + 100;
                            if (coord_x>400) {
                                coord_x = 15;
                                coord_y = coord_y + 100;
                            }
                        }
                    }

                    function movePlayer() {
                        var tux = stage.find('#token')[0];
                        if (arrow_played==arrows_clicked.length)
                        {
                            console.log('End of the attempt');
                        } else  {
                            if (arrows_clicked[arrow_played]=='go_forward') {
                                // move a node to the right at 100 pixels/second
                                var velocity = 100;
                                var init_x = tux.x();
                                var end_x = init_x + 100;
                                var anim = new Konva.Animation(function(frame) {
                                    var dist = velocity * (frame.timeDiff / 1000);
                                    tux.move({x: dist, y: 0});
                                    if (tux.x()-init_x >100) {
                                        stopAnimation(this);
                                        tux.x(end_x);
                                    }
                                }, layer);

                                anim.start();
                            }
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
                            }
                            if (arrows_clicked[arrow_played]=='rotate_counter_clockwise') {
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
                            }
                            arrow_played++;
                            
                        }
                    }
                    function stopAnimation(animation) {
                        animation.stop();
                        var tux = stage.find('#token')[0];
                        var walls = stage.find('.obstacle');
                        var prize = stage.find('.prize')[0];
                        if (haveIntersection(tux, walls)) 
                            console.log('Game over');
                        else if (doTheyIntersect(tux, prize))
                            console.log('Winner!');
                        else {
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