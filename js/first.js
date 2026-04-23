/** FROM https://www.kevinleary.net/javascript-get-url-parameters/
 * JavaScript Get URL Parameter
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
    { "class": "button", "img": "alx_img/go_forward.png",               "img_width": "70", "img_height": "70", "x": "115", "y": "15"  },
    { "class": "button", "img": "alx_img/go_back.png",                  "img_width": "70", "img_height": "70", "x": "115", "y": "115" },
    { "class": "button", "img": "alx_img/rotate_clockwise.png",         "img_width": "70", "img_height": "70", "x": "15",  "y": "115" },
    { "class": "button", "img": "alx_img/rotate_counter_clockwise.png", "img_width": "70", "img_height": "70", "x": "215", "y": "115" },
    { "class": "button", "img": "alx_img/start.png",                    "img_width": "70", "img_height": "70", "x": "215", "y": "15"  },
    { "class": "button", "img": "alx_img/clear.png",                    "img_width": "70", "img_height": "70", "x": "15",  "y": "15"  },
    { "class": "button", "img": "alx_img/clear_one_80.png",             "img_width": "70", "img_height": "70", "x": "315", "y": "15"  }
];

var stage;
var layer;
var highlight_rect;
var highlight_rect_x = 5;
var highlight_rect_y = 205;
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

// ── Loader ────────────────────────────────────────────────────────────────────

function showLoader() {
    if ($('#alx_loader').length) return;
    if (!$('#alx_loader_style').length) {
        $('head').append(`
            <style id="alx_loader_style">
                #alx_loader {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(20, 30, 48, 0.88);
                    backdrop-filter: blur(4px);
                    transition: opacity 0.5s ease;
                }
                #alx_loader.alx_fade_out {
                    opacity: 0;
                    pointer-events: none;
                }
                .alx_loader_inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 18px;
                }
                .alx_spinner {
                    width: 64px;
                    height: 64px;
                    border: 6px solid rgba(255,255,255,0.15);
                    border-top-color: #4fc3f7;
                    border-radius: 50%;
                    animation: alx_spin 0.9s linear infinite;
                }
                @keyframes alx_spin { to { transform: rotate(360deg); } }
                .alx_loader_text {
                    color: #e0f7fa;
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    font-size: 1.1rem;
                    letter-spacing: 0.05em;
                    margin: 0;
                }
            </style>
        `);
    }
    $('body').append(`
        <div id="alx_loader">
            <div class="alx_loader_inner">
                <div class="alx_spinner"></div>
                <p class="alx_loader_text">Loading game...</p>
            </div>
        </div>
    `);
}

function hideLoader() {
    var $loader = $('#alx_loader');
    if (!$loader.length) return;
    $loader.addClass('alx_fade_out');
    setTimeout(function() { $loader.remove(); }, 550);
}

// ── Core image preloader ──────────────────────────────────────────────────────
//
// Loads ALL images in parallel and only calls onComplete once every single
// one has either loaded or errored. This guarantees Konva always has real
// pixel data before any node is added to the layer.
//
// urlMap     – { key: url, ... }
// onComplete – function(loadedMap) where loadedMap is { key: HTMLImageElement }

function preloadImages(urlMap, onComplete) {
    var keys    = Object.keys(urlMap);
    var total   = keys.length;
    var settled = 0;
    var result  = {};

    if (total === 0) { onComplete(result); return; }

    keys.forEach(function(key) {
        var img = new Image();
        result[key] = img;
        function done() {
            settled++;
            if (settled >= total) onComplete(result);
        }
        img.onload  = done;
        img.onerror = done;  // count errors so we never hang
        img.src = urlMap[key];
    });
}

// ─────────────────────────────────────────────────────────────────────────────

$( document ).ready(function() {

    if (!('id' in getUrlParams())) {
        $.ajax({
            url: "levels/all_activities",
            type: "GET",
            dataType: "text",
            success: function(result) {
                $('#container').html('<h1>Διαθέσιμες δραστηριότητες</h1><br/>');
                var alldata = result.split('\n');
                for (var i = 0; i < alldata.length; i += 2) {
                    var activity_id = alldata[i].split(".")[0];
                    if (alldata[i] !== '') {
                        var activity_title = alldata[i+1].substring(1, alldata[i+1].length - 1);
                        var url = activity_title + ' | <a href="?id=' + activity_id + '">εδώ</a> | <a href="?id=' + activity_id + '&showNextLevel">εδώ με showNextLevel (if any)</a> <br />';
                        $('#container').html( $('#container').html() + url );
                    }
                }
            },
            error: function() {
                console.log('Δεν βρέθηκε το αρχείο all_activities');
            }
        });
        return;
    }

    // ── Load the level JSON ───────────────────────────────────────────────────
    $.ajax({
        url: 'levels/' + getUrlParams('id') + '.json',
        contentType: "application/json",
        dataType: "json",
        success: function(result) {

            $.each(result, function(i, item) {
                if ("stage_img" in item) {
                    stage_width        = item.stage_width;
                    stage_height       = item.stage_height;
                    stage_img          = item.stage_img;
                    stage_border_x_max = parseInt(item.stage_border_x_max);
                    stage_border_x_min = parseInt(item.stage_border_x_min);
                    stage_border_y_max = parseInt(item.stage_border_y_max);
                    stage_border_y_min = parseInt(item.stage_border_y_min);
                    next_level         = item.next_level;
                } else if ("player_start_x" in item) {
                    player_start_x = parseInt(item.player_start_x);
                    player_start_y = parseInt(item.player_start_y);
                    player_img_url = item.player_img_url;
                } else {
                    stage_items.push(item);
                }
            });

            $.each(game_buttons, function(i, item) {
                stage_items.push(item);
            });

            // Show loader, then preload EVERY image before touching Konva
            showLoader();

            // Build a flat url map: { 'map': url, 'player': url, 'item_0': url, ... }
            var urlMap = { 'map': stage_img, 'player': player_img_url };
            stage_items.forEach(function(item, i) {
                urlMap['item_' + i] = item.img;
            });

            // ── Once ALL images are confirmed loaded, build the scene ─────────
            preloadImages(urlMap, function(loadedMap) {

                stage = new Konva.Stage({
                    container: 'container',
                    width: stage_width,
                    height: stage_height
                });
                layer = new Konva.Layer();

                // 1. Map background — added first so it sits at the bottom
                layer.add(new Konva.Image({
                    x: 0, y: 0,
                    image: loadedMap['map'],
                    width: stage_width,
                    height: stage_height
                }));

                // 2. Player token
                layer.add(new Konva.Image({
                    x: player_start_x,
                    y: player_start_y,
                    image: loadedMap['player'],
                    width: 80, height: 80,
                    id: 'token',
                    offset: { x: 40, y: 40 }
                }));

                // 3. Walls / prizes / buttons — in deterministic index order
                stage_items.forEach(function(item, i) {
                    layer.add(new Konva.Image({
                        x:      item.x,
                        y:      item.y,
                        image:  loadedMap['item_' + i],
                        width:  item.width,
                        height: item.height,
                        name:   item.class
                    }));
                });

                // One draw call after all nodes are in the layer
                stage.add(layer);
                layer.draw();

                // Everything is visible — hide the loader
                hideLoader();

                // ── Interaction ───────────────────────────────────────────────

                layer.on('click', function(e) {
                    var target = e.target;
                    if (target.getAttr('name') !== 'button') return;

                    last_arrow_clicked = target.getAttr('image').src;
                    var arrow_filename = last_arrow_clicked.split('/').pop().slice(0, -4);

                    if (arrow_filename.indexOf('start') >= 0) {
                        if (!play_enabled) return;
                        arrow_played = 0;
                        var tux = stage.find('#token')[0];
                        tux.x(player_start_x);
                        tux.y(player_start_y);
                        tux.rotation(0);
                        play_enabled = false;
                        movePlayer();

                    } else if (arrow_filename.indexOf('clear') >= 0) {
                        if (arrow_filename.indexOf('one') >= 0) {
                            if (!play_enabled) return;
                            if (arrows_clicked.length > 0) {
                                stage.find('.gameArrow' + arrows_clicked.length)[0].destroy();
                                arrows_clicked.pop();
                                --arrows_added;
                            }
                        } else {
                            location.reload();
                        }

                    } else {
                        if (arrows_added >= max_arrows) return;
                        arrows_clicked.push(arrow_filename);
                        var arrow = new Image();
                        arrow.onload = function() {
                            updateArrowCoordinates(++arrows_added);
                            layer.add(new Konva.Image({
                                x: coord_x, y: coord_y,
                                image: arrow,
                                width: 80, height: 80,
                                name: 'gameArrow' + arrows_clicked.length
                            }));
                        };
                        arrow.src = last_arrow_clicked.replace(
                            arrow_filename,
                            arrow_filename + "_colored"
                        );
                    }
                });

                stage.container().tabIndex = 1;
                stage.container().focus();

                // ── Helpers ───────────────────────────────────────────────────

                function haveIntersection(tux, obstacles) {
                    for (var q = 0; q < obstacles.length; q++) {
                        if (doTheyIntersect(tux, obstacles[q])) return true;
                    }
                    return false;
                }

                function doTheyIntersect(r1, r2) {
                    return !(
                        parseInt(r2.x()) >  (r1.x() - r1.offsetX()) + r1.width()  ||
                        parseInt(r2.x()) +   r2.width()  < (r1.x() - r1.offsetX()) ||
                        parseInt(r2.y()) >  (r1.y() - r1.offsetY()) + r1.height() ||
                        parseInt(r2.y()) +   r2.height() < (r1.y() - r1.offsetY())
                    );
                }

                function updateArrowCoordinates(arrowsAdded) {
                    var Row = Math.floor((arrowsAdded - 1) / 4);
                    var Col = arrowsAdded - 4 * Row - 1;
                    coord_x = start_coord_x + Col * 100;
                    coord_y = start_coord_y + Row * 100;
                }

                function movePlayer() {
                    if (arrows_clicked.length === 0) { play_enabled = true; return; }

                    var tux = stage.find('#token')[0];

                    if (!highlight_rect) {
                        highlight_rect = new Konva.Rect({
                            x: highlight_rect_x, y: highlight_rect_y,
                            width: 90, height: 90,
                            stroke: 'red', strokeWidth: 2,
                            shadowBlur: 5, cornerRadius: 10
                        });
                        layer.add(highlight_rect);
                    }

                    if (arrow_played === 0) {
                        highlight_rect.x(highlight_rect_x);
                        highlight_rect.y(highlight_rect_y);
                    } else if (arrow_played < arrows_clicked.length) {
                        var new_x = highlight_rect.x() + 100;
                        var new_y = highlight_rect.y();
                        if (new_x > 400) { new_x = 5; new_y += 100; }
                        highlight_rect.x(new_x);
                        highlight_rect.y(new_y);
                    }

                    if (arrow_played === arrows_clicked.length) {
                        play_enabled = true;
                        return;
                    }

                    var action = arrows_clicked[arrow_played];

                    if (action === 'rotate_clockwise' || action === 'rotate_counter_clockwise') {
                        var dir   = (action === 'rotate_clockwise') ? 1 : -1;
                        var speed = 90;
                        var i0    = tux.rotation();
                        var anim  = new Konva.Animation(function(frame) {
                            tux.rotate(dir * frame.timeDiff * speed / 1000);
                            if (Math.abs(tux.rotation() - i0) >= 90) {
                                stopAnimation(this);
                                tux.rotation(i0 + dir * 90);
                            }
                        }, layer);
                        anim.start();

                    } else {
                        var velocity = 100;
                        var ix = tux.x(), iy = tux.y();
                        var mx = (action === 'go_forward') ?  1 : -1;
                        var my = (action === 'go_forward') ? -1 :  1;
                        var rad   = tux.rotation() * Math.PI / 180;
                        var end_x = ix + 100 * Math.sin(rad) * mx;
                        var end_y = iy + 100 * Math.cos(rad) * my;
                        var anim  = new Konva.Animation(function(frame) {
                            tux.move({
                                x: velocity * frame.timeDiff / 1000 * Math.sin(rad) * mx,
                                y: velocity * frame.timeDiff / 1000 * Math.cos(rad) * my
                            });
                            if (Math.abs(tux.x() - ix) > 100 || Math.abs(tux.y() - iy) > 100) {
                                stopAnimation(this);
                                tux.x(end_x);
                                tux.y(end_y);
                            }
                        }, layer);
                        anim.start();
                    }

                    arrow_played++;
                }

                function stopAnimation(animation) {
                    animation.stop();
                    var tux   = stage.find('#token')[0];
                    var walls = stage.find('.obstacle');
                    var prize = stage.find('.prize')[0];

                    if (haveIntersection(tux, walls)) {
                        showMessage('Πάνω σε εμπόδιο...<br /><img onclick="location.reload();" src="alx_img/run_again.png"><img id="alx_close" src="alx_img/close.png">', true);
                    } else if (doTheyIntersect(tux, prize)) {
                        if ('showNextLevel' in getUrlParams()) {
                            if (next_level!='null')
                                showMessage('Μπράβο!!<br /><img onclick="location.reload();" src="alx_img/run_again.png"><img onclick="window.location.href=\'' + window.location.origin + window.location.pathname + '?id=' + next_level + '&showNextLevel' + '\';" src="alx_img/next_level.png">', false);
                            else 
                                showMessage('Μπράβο!!<br /><img onclick="location.reload();" src="alx_img/run_again.png">', false);
                        }
                        else
                            showMessage('Μπράβο!!<br /><img onclick="location.reload();" src="alx_img/run_again.png">', false);
                            
                    } else if (
                        tux.x() > stage_border_x_max || tux.x() < stage_border_x_min ||
                        tux.y() > stage_border_y_max || tux.y() < stage_border_y_min
                    ) {
                        showMessage('Εκτός πίστας...<br /><img onclick="location.reload();" src="alx_img/run_again.png"><img id="alx_close" src="alx_img/close.png">', true);
                    } else {
                        setTimeout(movePlayer, 500);
                    }
                }

                function showMessage(html, closeable) {
                    $('#alx_msg').html(html);
                    if (closeable) {
                        $('#alx_close').on('click', function() {
                            $('#alx_msg').hide();
                            play_enabled = true;
                        });
                    }
                    $('#alx_msg').show();
                    animateCSS('#alx_msg', 'bounce');
                }

            }); // end preloadImages callback

        },
        error: function() {
            window.location.href = 'http://sxoleio.pw/alx_code/alx_tuxbot/';
        }
    });

});

// ── CSS animation helper ──────────────────────────────────────────────────────

const animateCSS = (element, animation, prefix = 'animate__') =>
    new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);
        node.classList.add(`${prefix}animated`, animationName);
        node.addEventListener('animationend', function handler(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }, { once: true });
    });