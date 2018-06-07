// Texture loading ----------------------------------------------------------
// Load in the image textures as BaseTextures,
// due to Chrome security not loading ImageTextures of Authorised URL preview.

function loadTexture(url) {
    var img = new Image(),
        texture = new PIXI.Texture(new PIXI.BaseTexture(img));

    img.src = url;

    return texture;
}

var designQuery = /(?:design=)([^\&]*)/gi.exec(document.location.search),
    design = ((designQuery)? parseInt(designQuery[1], 10) : null),

    snapQuery = /(?:snap)([^\&]*)/gi.exec(document.location.search),
    snap = !!snapQuery,

    fillQuery = /(?:fill)([^\&]*)/gi.exec(document.location.search),
    fill = !!fillQuery,

    phoneOutlineQuery = /(?:phone-outline)([^\&]*)/gi.exec(document.location.search),
    phoneOutline = !!phoneOutlineQuery,

    phoneCoverQuery = /(?:phone-cover)([^\&]*)/gi.exec(document.location.search),
    phoneCover = !!phoneCoverQuery,

    gridQuery = /(?:grid)([^\&]*)/gi.exec(document.location.search),
    grid = !!gridQuery,

    overlayTexture = loadTexture(((snap && phoneOutline)?
            'imgs/overlay-phone.png'
        : ((snap && !phoneOutline)?
            'imgs/overlay.png'
        : ((!snap && phoneOutline)?
            'imgs/overlay-phone-no-snap.png'
        :   'imgs/overlay-no-snap.png')))),

    usersImageAsTexture = loadTexture('imgs/checkerUV.jpg'),

    translateTexture = loadTexture(((design === 0)?
            'imgs/translate-icon.png'
        :   'imgs/translate-handle-simple.png')),

    rotateScaleTexture = loadTexture(((design === 0)?
            'imgs/scale-rotate-icon.png'
        // :   'imgs/rotate-scale-handle-simple.png')),
        // :   'imgs/rotate-scale-handle.png')),
        :   'imgs/rotate-scale-handle-2.png')),
        // :   'imgs/rotate-scale-handle-arrows.png')),

    phoneTexture,
    gridTexture;


if(phoneCover) {
    phoneTexture = loadTexture('imgs/phone-ghost.png');
}

if(grid) {
    gridTexture = loadTexture('imgs/align-grid.png');
}


// The main Prototype Controller.
// Creates the PIXI canvas and all the UI elements within this.
function Controller() {
    var rotateScaleGraphic = new PIXI.Sprite(rotateScaleTexture);

    rotateScaleGraphic.anchor.x = rotateScaleGraphic.anchor.y = 0.5;
    rotateScaleGraphic.hitArea = new PIXI.Circle(0, 0, 44);


    var translateGraphic = new PIXI.Sprite(translateTexture);

    translateGraphic.anchor.x = translateGraphic.anchor.y = 0.5;
    translateGraphic.hitArea = new PIXI.Circle(0, 0, 44);


    var scope = this,
        canvas = document.getElementById('canvas'),
        stage = new PIXI.Stage(0x000000, true);

    stage.interactive = true;

    var rendererOptions = {
            antialias: true,
            transparent: false,
            // resolution: (self.devicePixelRatio || 1)
        },
        rendererSize = {
            w: 510,
            h: 800
        },
        renderer = new PIXI.autoDetectRenderer(rendererSize.w, rendererSize.h,
            rendererOptions);

    // add render view to DOM
    canvas.appendChild(renderer.view);

    // To Set the width height of the original image dimensions, this has to be calculated. Assuming fitting image height.
    // 500X270 are hardcoded values for the actual rendering area. The renderer allocates space for UI too.

    var actualViewportHeight = 500,
        usersImageAspectRatio = usersImageAsTexture.width/
            usersImageAsTexture.height,

        elW = actualViewportHeight*usersImageAspectRatio,
        elH = actualViewportHeight,
        elOW = elW,
        elOH = elH,

        scale = 1,

        center = {
            x: renderer.width/2,
            y: renderer.height/2
        },
        anchor = {
            x: center.x,
            y: center.y
        },
        currentRotation = {
            x: 0,
            y: 0,
            rad: 0
        },
        pBounds = new PIXI.Rectangle(118, 180, 270, 500),
        // hitBounds = new PIXI.Rectangle(100, 170, 300, 520),
        hitBounds = pBounds,
        drag = {
            x: 0,
            y: 0
        },

        touchIDs = [],

        orientation = 0,
        scaleFactor = 0,

        // Default distance between rotator and translate circles.
        // Save original touch distance so it can reset.

        defaultSecondaryOffset = 130,
        secondaryOffset = defaultSecondaryOffset,

        defaultSecondaryRotation = 0,
        secondaryRotation = defaultSecondaryRotation,

        tweentime = 0.5,
        imgTransformed = false,
        count = 0,
        // Value to counter for the rotate dial position (initial set at the top : 1.57)
        rotatePointValue = -Math.PI*0.5,
        uiAlpha = 0,


        controls = new PIXI.DisplayObjectContainer(),
        outerControls = new PIXI.DisplayObjectContainer(),

        translateHandle = new Button(translateGraphic);

    translateGraphic.defaultCursor = 'move';


    var rotateScaleHandle = new Button(rotateScaleGraphic);

    // rotateScaleHandle.graphic.defaultCursor = 'grab';
    rotateScaleHandle.graphic.defaultCursor = 'pointer';


    var ringWidth = 5,
        ringHitWidth = 44,
        outerRing = new Button(new PIXI.Graphics());

    outerRing.graphic.hitArea = new PIXI.Circle(0, 0, 0);
    drawRing();

    outerControls.addChild(outerRing.graphic);
    outerControls.addChild(rotateScaleHandle.graphic);

    controls.addChild(outerControls);
    controls.addChild(translateHandle.graphic);


    var uiBtn1,
        uiBtn2,
        uiBtn3,
        uiHelp,
        uiContainer,

        centerLabel,
        scaleLabel,
        rotateLabel,
        helpLabel;

    var hitLayer = new PIXI.Graphics();

    // Used to interact as the background.
    hitLayer.beginFill(0x00ff00, 1);
    hitLayer.drawRect(hitBounds.x, hitBounds.y,
        hitBounds.width, hitBounds.height);
    hitLayer.endFill();
    hitLayer.alpha = 0;
    hitLayer.interactive = true;
    hitLayer.buttonMode = true;
    hitLayer.hitArea = hitBounds;
    hitLayer.defaultCursor = 'crosshair';


    var phoneBounds = new PIXI.Graphics(),

        // create a new Sprite using the texture
        usersImageAsSprite = new PIXI.Sprite(usersImageAsTexture),
        overlay = new PIXI.Sprite(overlayTexture),

        phoneOverlay,
        gridOverlay;

    if(phoneCover) {
        phoneOverlay = new PIXI.Sprite(phoneTexture);
    }

    if(grid) {
        gridOverlay = new PIXI.Sprite(gridTexture);
    }

    function makeLabel(text, style, minBounds, border) {
        var label = new PIXI.DisplayObjectContainer(),
            sprite = new PIXI.Text(text, style),
            surface = new PIXI.Graphics(),
            bounds = sprite.getBounds();

        // Might need to use individual 'safe' values if the text sprite doesn't
        // reliably size itself given just the font and size on each
        // platform/font.
        minBounds = (minBounds || new PIXI.Rectangle());

        bounds.x = Math.min(minBounds.x, bounds.x)-(border*2);
        bounds.y = Math.min(minBounds.y, bounds.y)-border;
        bounds.width = Math.max(minBounds.width, bounds.width)+(border*4);
        // bounds.height = Math.max(minBounds.height, bounds.height)+(border*2);
        bounds.height = Math.max(minBounds.height, bounds.height)+border;

        surface.beginFill(style.background, style.backgroundAlpha);
        surface.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
        // surface.drawRoundedRect(0, 0, bounds.width, bounds.height,
        //     style.radius);
        surface.endFill();

        label.addChild(surface);
        label.addChild(sprite);

        label.alpha = 0;
        label.data = {};

        return label;
    }

    function hideLabel(label, delay) {
        clearTimeout(label.data.show);
        clearTimeout(label.data.hide);

        label.data.hide = setTimeout(function() {
                label.data.hide = null;
                label.alpha = 0;
            },
            ((delay || delay === 0)? delay : 4000));
    }

    function showLabel(label, delay) {
        clearTimeout(label.data.hide);
        clearTimeout(label.data.show);
        label.alpha = 0;

        label.data.show = setTimeout(function() {
                label.data.show = null;
                label.alpha = 1;

                hideLabel(label);
            },
            ((delay || delay === 0)? delay : 1000));
    }

    var textSize = 15,
        labelStyle = {
            font: 'lighter '+textSize+'px sans-serif',
            fill: '#ffffff',

            background: 0x2196f3,
            backgroundAlpha: 1
        },
        moveLabel = makeLabel('move', labelStyle, null, 3),
        ringLabel = makeLabel('rotate/scale', labelStyle, null, 3),
        pivotLabel = makeLabel('place pivot', labelStyle, null, 3);

    moveLabel.position = ringLabel.position = controls.position;

    ringLabel.pivot = rotateScaleHandle.graphic.pivot;


    usersImageAsSprite.texture.scaleMode = PIXI.scaleModes.LINEAR;

    // STAGE & CONTAINER LAYERING ---------------------------------------------
    // ------------------------------------------------------------------------

    stage.addChild(usersImageAsSprite);
    // stage.addChild(phoneBounds);

    if(phoneCover) {
        phoneOverlay.width = renderer.width;
        phoneOverlay.height = renderer.height;
        stage.addChild(phoneOverlay);
    }

    if(grid) {
        gridOverlay.alpha = 0;
        gridOverlay.width = renderer.width;
        gridOverlay.height = renderer.height;
        stage.addChild(gridOverlay);
    }

    stage.addChild(overlay);
    stage.addChild(hitLayer);
    stage.addChild(controls);

    stage.addChild(pivotLabel);
    stage.addChild(moveLabel);
    stage.addChild(ringLabel);

    if(snap) {
        uiBtn1 = new Button({
                color: 0xffff00,
                radius: 30,
                fillAlpha: 1
            });

        uiBtn2 = new Button({
                color: 0xffff00,
                radius: 30,
                fillAlpha: 1
            });

        uiBtn3 = new Button({
                color: 0xffff00,
                radius: 30,
                fillAlpha: 1
            });

        uiHelp = new Button({
                color: 0xffff00,
                radius: 30,
                fillAlpha: 1
            });

        uiContainer = new PIXI.DisplayObjectContainer();

        uiContainer.addChild(uiBtn1.graphic);
        uiContainer.addChild(uiBtn2.graphic);
        uiContainer.addChild(uiBtn3.graphic);
        uiContainer.addChild(uiHelp.graphic);


        uiBtn1.graphic.position.x = uiBtn2.graphic.position.x =
            uiBtn3.graphic.position.x = uiHelp.graphic.position.x =
            renderer.width-63;

        uiHelp.graphic.position.y = 218;


        var y = 304,
            dy = 112;

        uiBtn1.graphic.position.y = (y);
        uiBtn2.graphic.position.y = (y += dy);
        uiBtn3.graphic.position.y = (y += dy);

        uiBtn1.graphic.alpha = uiBtn2.graphic.alpha = uiBtn3.graphic.alpha =
            uiHelp.graphic.alpha = uiAlpha;

        stage.addChild(uiContainer);


        centerLabel = makeLabel('snap center', labelStyle, null, 3);
        scaleLabel = makeLabel('snap scale', labelStyle, null, 3);
        rotateLabel = makeLabel('snap rotate', labelStyle, null, 3);
        helpLabel = makeLabel('help', labelStyle, null, 3);

        centerLabel.position = uiBtn1.graphic.position;
        scaleLabel.position = uiBtn2.graphic.position;
        rotateLabel.position = uiBtn3.graphic.position;

        centerLabel.pivot.x = centerLabel.getBounds().width+
            (0.5*uiBtn1.getBounds().width)+10;
        scaleLabel.pivot.x = scaleLabel.getBounds().width+
            (0.5*uiBtn2.getBounds().width)+10;
        rotateLabel.pivot.x = rotateLabel.getBounds().width+
            (0.5*uiBtn3.getBounds().width)+10;
        helpLabel.pivot.x = rotateLabel.getBounds().width+
            (0.5*uiHelp.getBounds().width)+10;

        centerLabel.pivot.y = scaleLabel.pivot.y = rotateLabel.pivot.y =
            helpLabel.pivot.y = 0.5*textSize;

        stage.addChild(centerLabel);
        stage.addChild(scaleLabel);
        stage.addChild(rotateLabel);
        stage.addChild(helpLabel);
    }

    // Draw Phone Bounding Box
    phoneBounds.beginFill(0xff0000, 1);
    phoneBounds.drawRect(pBounds.x, pBounds.y, pBounds.width, pBounds.height);
    phoneBounds.endFill();
    phoneBounds.alpha = 0;
    phoneBounds.hitArea = pBounds;

    stage.addChild(phoneBounds);

    // Inital setup  ----------------------------------------------------------
    // ------------------------------------------------------------------------

    hitLayer.data = {};

    // position circle
    resetControls();
    hideControls();

    // center the sprites anchor point
    usersImageAsSprite.interactive = true;
    usersImageAsSprite.buttonMode = false;
    usersImageAsSprite.width = elW;
    usersImageAsSprite.height = elH;

    usersImageAsSprite.anchor.x = 0.5;
    usersImageAsSprite.anchor.y = 0.5;
    usersImageAsSprite.position.x = center.x;
    usersImageAsSprite.position.y = center.y+30;

    overlay.width = renderer.width;
    overlay.height = renderer.height;
    overlay.alpha = 1;
    overlay.interactive = true;
    overlay.buttonMode = true;
    overlay.defaultCursor = 'default';

    // phone.width = renderer.width;
    // phone.height = renderer.height;

    // ARTWORK INTERACTIONS ---------------------------------------------------
    // ------------------------------------------------------------------------

    overlay.mousedown = overlay.touchstart = function() {
            if(!hitLayer.hovering) {
                resetControls();
                hideControls();
                hitLayer.data.e = null;
            }
        };


    hitLayer.mouseover = function(data) {
            if(!this.data.ignore) {
                this.data.hovering = true;

                if(!this.data.e) {
                    var pos = data.getLocalPosition(stage);

                    controls.position.x = pos.x;
                    controls.position.y = pos.y;

                    controls.alpha = 0.6;
                    outerControls.alpha = 0.4;
                }
            }
        };

    hitLayer.mousedown = function(data) {
            hideLabel(pivotLabel, 0);
            hideLabel(moveLabel, 0);
            hideLabel(ringLabel, 0);

            if(!this.data.ignore) {
                if(this.data.hovering) {
                    data.originalEvent.preventDefault();

                    this.data.e = data;

                    this.data.dragging = true;
                    imgTransformed = false;

                    var newPosition = data.getLocalPosition(this.parent);

                    placeUIAnchor(newPosition);

                    showLabel(moveLabel);
                }
            }
        };

    hitLayer.touchstart = function(data) {
            data.originalEvent.preventDefault();
            this.data.ignore = true;

            this.data.e = data;

            this.data.dragging = true;
            imgTransformed = false;

            var t = 0,
                touch0 = event.touches[t];

            if(!getTouchByID(event.touches, touchIDs[0]) && touch0) {
                touchIDs[0] = touch0.identifier;

                var position0 = {
                        x: (touch0.clientX-renderer.view.offsetLeft)*scale,
                        y: (touch0.clientY-renderer.view.offsetTop)*scale
                    };

                placeUIAnchor(position0);
            }

            if(touchIDs[0] === touch0.identifier) {
                ++t;
            }


            var touch1 = event.touches[t];

            if(!getTouchByID(event.touches, touchIDs[1]) && touch1) {
                touchIDs[1] = touch1.identifier;

                // Calculate new distance to be used as the base rotator/scale
                // distance.
                var position1 = {
                        x: (touch1.clientX-renderer.view.offsetLeft)*scale,
                        y: (touch1.clientY-renderer.view.offsetTop)*scale
                    },

                    dx = controls.x-position1.x,
                    dy = controls.y-position1.y,

                    dist = Math.max(Math.floor(Math.sqrt((dx*dx)+(dy*dy))), 30);

                secondaryOffset = rotateScaleHandle.graphic.pivot.y = dist;
                drawRing();

                var rx = position1.x-controls.x,
                    ry = position1.y-controls.y,

                    rotation = Math.atan2(ry, rx);

                secondaryRotation = rotateScaleHandle.graphic.rotation =
                    rotation-rotatePointValue;

                rotatePointValue = rotation;

                outerControls.alpha = Math.max(outerControls.alpha, 1);
            }
        };

    hitLayer.mousemove = function(data) {
            if(!this.data.ignore) {
                var pos;

                if(this.data.dragging) {
                    pos = this.data.e.getLocalPosition(stage);

                    if(this.data.dragging) {
                        translateElement(pos);
                    }
                    else {
                        transformScaleRotate(pos);
                        rotateScaleHandle.graphic.data.dragging = true;
                    }

                    if(imgTransformed) {
                        resetOuterControls();
                    }
                }
                else if(this.data.hovering) {
                    pos = data.getLocalPosition(stage);

                    pivotLabel.position.x = pos.x;
                    pivotLabel.position.y = pos.y;

                    showLabel(pivotLabel);

                    if(this.data.e) {
                        if(translateGraphic.data.hovering ||
                            outerRing.graphic.data.hovering) {
                            hideLabel(pivotLabel, 0);
                        }
                    }
                    else {
                        controls.position.x = pos.x;
                        controls.position.y = pos.y;
                    }
                }
                else {
                    hideLabel(pivotLabel, 0);
                }
            }
        };

    hitLayer.mouseout = function(data) {
            if(!this.data.ignore) {
                this.data.hovering = false;

                if(!this.data.e) {
                    hideControls();
                }

                hideLabel(pivotLabel, 0);
            }
        };

    hitLayer.touchmove = function(data) {
            data.originalEvent.preventDefault();
            this.data.ignore = true;

            var touch0 = getTouchByID(event.touches, touchIDs[0]);

            if(touch0) {
                var position0 = {
                        x: (touch0.clientX-renderer.view.offsetLeft)*scale,
                        y: (touch0.clientY-renderer.view.offsetTop)*scale
                    };

                translateElement(position0);
            }


            var touch1 = getTouchByID(event.touches, touchIDs[1]);

            if(touch1) {
                var position1 = {
                        x: (touch1.clientX-renderer.view.offsetLeft)*scale,
                        y: (touch1.clientY-renderer.view.offsetTop)*scale
                    };

                transformScaleRotate(position1);
                rotateScaleHandle.graphic.data.dragging = true;
            }
        };

    //

    hitLayer.mouseup = function() {
            if(!this.data.ignore) {
                this.data.dragging = false;

                if(imgTransformed) {
                    // Set the interaction data to null
                    this.data.e = null;
                    rotateScaleHandle.graphic.data.dragging = false;
                    scaleFactor = 0;
                    elW = usersImageAsSprite.width;
                    elH = usersImageAsSprite.height;
                    currentRotation.rad = usersImageAsSprite.rotation;

                    resetControls();
                }
            }

            this.data.ignore = false;
        };

    hitLayer.mouseupoutside = function() {
            this.mouseup();
            this.mouseout();
        };

    hitLayer.touchendoutside = hitLayer.touchend = function(data) {
            data.originalEvent.preventDefault();
            this.data.ignore = true;

            for(var t = touchIDs.length; t >= 0; --t) {
                if(!getTouchByID(event.touches, touchIDs[t])) {
                    touchIDs.splice(t, 1);
                }
            }

            if(touchIDs.length > 0) {
                rotateScaleHandle.graphic.data.dragging = false;
                scaleFactor = 0;
                elW = usersImageAsSprite.width;
                elH = usersImageAsSprite.height;
                currentRotation.rad = usersImageAsSprite.rotation;
                resetOuterControls();

                var touch0 = getTouchByID(event.touches, touchIDs[0]),
                    position0 = {
                        x: (touch0.clientX-renderer.view.offsetLeft)*scale,
                        y: (touch0.clientY-renderer.view.offsetTop)*scale
                    };

                placeUIAnchor(position0);
            }
            else {
                // Set the interaction data to null
                this.data.e = null;
                this.data.dragging = false;
                this.data.ignore = false;

                // Checks image has been move (imgTransformed set), if so then remove tools
                if(imgTransformed) {
                    hideControls();
                }
                else {
                    outerControls.alpha = Math.max(outerControls.alpha, 1);
                }
            }
        };


    translateGraphic.mouseover = function(data) {
            hitLayer.mouseover(data);

            this.data.hovering = true;
            showLabel(moveLabel);
        };

    translateGraphic.mousemove = function(data) {
            hitLayer.mousemove(data);

            if(this.data.hovering) {
                showLabel(moveLabel);
            }
        };

    translateGraphic.mouseout = function(data) {
            hitLayer.mouseout(data);

            this.data.hovering = false;
            hideLabel(moveLabel, 0);
        };

    translateGraphic.mousedown = function(data) {
            hitLayer.mousedown(data);

            this.data.hovering = false;
            hideLabel(moveLabel, 0);
        };


    // Approximate passing the events through to their delegate targets.
    function throughOuterRing(data, hit, miss) {
        var position = data.getLocalPosition(stage),

            delta = new PIXI.Point(position.x-controls.x,
                    position.y-controls.y),

            dist = Math.sqrt((delta.x*delta.x)+(delta.y*delta.y));

        if(withinRing(dist, outerRing.radius, ringHitWidth)) {
            outerRing.graphic.data.hovering = true;
            hit(data, position, delta, dist);
        }
        else {
            outerRing.graphic.data.hovering = false;
            miss(data, position, delta, dist);
        }
    }

    outerRing.graphic.mousedown = outerRing.graphic.touchstart = function(data) {
            throughOuterRing(data, function(data, pos, delta) {
                    // Kill any multitouch, so the two interactions don't clash.
                    data.originalEvent.stopPropagation();
                    touchIDs.length = 0;

                    var rotation = Math.atan2(delta.y, delta.x);

                    secondaryRotation = rotateScaleHandle.graphic.rotation =
                        rotation-rotatePointValue;

                    rotatePointValue = rotation;

                    // Ensure any tranformations that were in progress are applied.
                    scaleFactor = 0;
                    elW = usersImageAsSprite.width;
                    elH = usersImageAsSprite.height;
                    currentRotation.rad = usersImageAsSprite.rotation;

                    data.originalEvent.preventDefault();
                    outerRing.graphic.data.e = data;
                    rotateScaleGraphic.alpha = 0.9;
                    outerRing.graphic.data.dragging = true;

                    // outerRing.graphic.defaultCursor = 'grabbing';

                    // Hrrm, this isn't right, but it results in the expected behaiour.
                    imgTransformed = true;
                },
                function(data, pos) {
                    if(hitLayer.hitArea.contains(pos.x, pos.y)) {
                        hitLayer.mouseover(data);
                        hitLayer.mousedown(data);
                    }
                    else {
                        hitLayer.mouseout(data);
                        overlay.mousedown(data);
                    }
                });

            hideLabel(pivotLabel, 0);
            hideLabel(moveLabel, 0);
            hideLabel(ringLabel, 0);
        };

    outerRing.graphic.mousemove = outerRing.graphic.touchmove = function(data) {
            function move(data) {
                outerRing.graphic.defaultCursor =
                    rotateScaleGraphic.defaultCursor;

                if(outerRing.graphic.data.dragging && outerRing.graphic.data.e) {
                    // Kill any multitouch, so the two interactions don't clash.
                    data.originalEvent.stopPropagation();
                    touchIDs.length = 0;

                    var newPosition = outerRing.graphic.data.e.getLocalPosition(stage);

                    transformScaleRotate(newPosition);
                }

                showLabel(ringLabel);
                hideLabel(pivotLabel, 0);
            }

            if(outerRing.graphic.data.dragging) {
                move(data);
            }
            else {
                throughOuterRing(data, move,
                    function(data, pos) {
                        if(hitLayer.hitArea.contains(pos.x, pos.y)) {
                            outerRing.graphic.defaultCursor = hitLayer.defaultCursor;
                            hitLayer.mouseover(data);
                        }
                        else {
                            outerRing.graphic.defaultCursor = overlay.defaultCursor;
                            hitLayer.mouseout(data);
                        }

                        hitLayer.mousemove(data);

                        hideLabel(ringLabel, 0);
                    });
            }
        };

    // Not so sure about this one...
    outerRing.graphic.mouseup = outerRing.graphic.touchend =
        outerRing.graphic.mouseupoutside = outerRing.graphic.touchendoutside =
        function(data) {
            var hitDelegate = ((data.originalEvent.type.match(/touch/gi)?
                        function(data, pos) {
                            if(hitLayer.hitArea.contains(pos.x, pos.y)) {
                                hitLayer.touchend(data);
                            }
                            else {
                                hitLayer.touchendoutside(data);
                            }
                        }
                    :   function(data, pos) {
                            if(hitLayer.hitArea.contains(pos.x, pos.y)) {
                                hitLayer.mouseover(data);
                                hitLayer.mouseup(data);
                            }
                            else {
                                hitLayer.mouseout(data);
                                hitLayer.mouseupoutside(data);
                            }
                        }));

            throughOuterRing(data, function(data, pos) {
                    if(outerRing.graphic.data.dragging) {
                        // Kill any multitouch, so the two interactions don't clash.
                        data.originalEvent.stopPropagation();
                        touchIDs.length = 0;

                        outerRing.graphic.data.dragging = false;
                        rotateScaleGraphic.alpha = 1;

                        scaleFactor = 0;
                        // set the interaction data to null
                        outerRing.graphic.data.e = null;
                        currentRotation.rad = usersImageAsSprite.rotation;
                        // position circle
                        resetControls();
                        elW = usersImageAsSprite.width;
                        elH = usersImageAsSprite.height;

                        // checkFittingBounds();
                        // hideControls();

                        // outerRing.graphic.defaultCursor = 'grab';

                        hitDelegate(data, pos);
                    }
                },
                hitDelegate);
        };



    // UI BUTTON EVENTS  ------------------------------------------------------
    // ------------------------------------------------------------------------

    if(snap) {
        // Position.
        // Currently resets the phone to the central position.
        uiBtn1.graphic.mousedown = uiBtn1.graphic.touchstart = function(data) {
                data.originalEvent.preventDefault();

                resetOuterControls();
                hideControls();

                this.data.e = data;
                this.alpha = 0.9;

                TweenMax.to(usersImageAsSprite.pivot, tweentime, {
                        x: 0,
                        y: 0
                    });

                TweenMax.to(usersImageAsSprite.position, tweentime, {
                        x: center.x,
                        y: center.y+30
                    });

                showLabel(centerLabel, 0);
            };

        uiBtn1.graphic.mouseup = uiBtn1.graphic.mouseupoutside =
            uiBtn1.graphic.touchend = uiBtn1.graphic.touchendoutside =
                function(data) {
                    this.alpha = uiAlpha;
                    // set the interaction data to null
                    this.data.e = null;
                };

        //  Scaler Button.
        //  Toggles the image scale through the preset scaleFactor's
        uiBtn2.graphic.mousedown = uiBtn2.graphic.touchstart = function(data) {
                data.originalEvent.preventDefault();

                resetOuterControls();
                hideControls();

                this.data.e = data;
                this.alpha = 0.9;
                TweenMax.killTweensOf(usersImageAsSprite);

                scaleFactor = (scaleFactor+0.5)%3;

                var sc = 1+scaleFactor;

                tweenScale = TweenMax.fromTo(usersImageAsSprite, tweentime,
                    {
                        width: usersImageAsSprite.width,
                        height: usersImageAsSprite.height
                    },
                    {
                        width: elOW*sc,
                        height:elOH*sc,
                        onComplete: function() {
                            elW = elOW*sc;
                            elH = elOH*sc;
                        }
                    });

                scaleLabel.getChildAt(1).setText('scale '+Math.round(sc*100)+'%');
                showLabel(scaleLabel, 0);
            };

        uiBtn2.graphic.mouseup = uiBtn2.graphic.mouseupoutside =
            uiBtn2.graphic.touchend = uiBtn2.graphic.touchendoutside =
            function(data) {
                this.alpha = uiAlpha;
                // set the interaction data to null
                this.data.e = null;
            };

        // Orientation Button.
        // Spins the image 45 degrees to rotate through the different orientations.
        uiBtn3.graphic.mousedown = uiBtn3.graphic.touchstart = function(data) {
                data.originalEvent.preventDefault();

                resetOuterControls();
                hideControls();

                this.data.e = data;
                this.alpha = 0.9;

                TweenMax.killTweensOf(usersImageAsSprite);

                orientation += Math.PI*0.25;

                TweenMax.fromTo(usersImageAsSprite, tweentime, {
                        rotation: usersImageAsSprite.rotation
                    },
                    {
                        rotation: orientation,
                        onComplete: function() {
                            usersImageAsSprite.rotation %= 2*Math.PI;
                            orientation %= 2*Math.PI;
                        }
                    });

                currentRotation.rad = orientation;

                rotateLabel.getChildAt(1).setText('rotate '+
                    Math.round(orientation%(2*Math.PI)*180/Math.PI)+' deg');
                showLabel(rotateLabel, 0);
            };

        uiBtn3.graphic.mouseup = uiBtn3.graphic.mouseupoutside =
            uiBtn3.graphic.touchend = uiBtn3.graphic.touchendoutside =
            function(data) {
                this.alpha = uiAlpha;
                this.data.e = null;
            };

        // Help/hint Button - displays all labels.
        uiHelp.graphic.mousedown = uiHelp.graphic.touchstart = function(data) {
                data.originalEvent.preventDefault();
                data.originalEvent.stopPropagation();

                this.data.e = data;
                this.alpha = 0.9;

                intro();
            };

        uiHelp.graphic.mouseup = uiHelp.graphic.mouseupoutside =
            uiHelp.graphic.touchend = uiHelp.graphic.touchendoutside =
            function(data) {
                this.alpha = uiAlpha;
                this.data.e = null;
            };
    }

    // HIT BOUNDS DETECION ----------------------------------------------------
    //  -----------------------------------------------------------------------

    // Check if artwork within the bounds
    function checkBounds(r1, r2) {
        return !(r2.position.x > r2.width ||
            r2.width < r1.position.x ||
            r2.position.y > r2.height ||
            r2.height < r1.position.y);

    }

    // GENERAL FUNCTIONS  -----------------------------------------------------
    // ------------------------------------------------------------------------

    // Used for calculating differences.
    function difference(a, b) {
        return Math.abs(a-b);
    }

    // Set the Anchor UI Tool into Touch position and Set the Pivot Point.
    function placeUIAnchor(position) {
        controls.position.x = position.x;
        controls.position.y = position.y;

        // Sets the Pivot point of the image usersImageAsSprite in local co-ordinates.
        // Very important fix to stop the transformation issues with changing registration points.
        usersImageAsSprite.pivot = usersImageAsSprite.toLocal(position);
        usersImageAsSprite.position = position;

        resetControls();

        controls.alpha = 0.9;
        outerControls.alpha = 1;

        if(grid) {
            gridOverlay.alpha = 0.3;
        }
    }

    // Handles the movement of the Scale & Rotation transformation
    function transformScaleRotate(position) {
        // Calculate distance
        var dx = controls.x-position.x,
            dy = controls.y-position.y,

            dist = Math.max(Math.floor(Math.sqrt((dx*dx)+(dy*dy))), 30);

        rotateScaleHandle.graphic.pivot.y = dist;

        // Calculate new scale percentage
        // including the default distance of the pointer
        // var newScale = (dist-rotateScaleHandle.graphic.pivot.y)/100;
        // newScale = newScale +1;
        var newScale = dist/secondaryOffset;
        // console.log('scale ', newScale);

        // Limit the scaling amount
        if(newScale > 0.2) {
            usersImageAsSprite.width = elW*newScale;
            usersImageAsSprite.height = elH*newScale;
        }

        var rx = position.x-controls.x,
            ry = position.y-controls.y,
            rotation = Math.atan2(ry, rx),
            offsetRotation = rotatePointValue-rotation;

        usersImageAsSprite.rotation = currentRotation.rad-offsetRotation;
        rotateScaleHandle.graphic.rotation = secondaryRotation-offsetRotation;

        drawRing();

        imgTransformed = true;
    }

    // Handles movement of the image usersImageAsSprite.
    function translateElement(position) {
        // hideControls()
        // rotateScaleHandle.graphic.alpha = 0;
        // console.log(position)

        var dx = difference(controls.x, position.x),
            dy = difference(controls.y, position.y),

            px = controls.x,
            py = controls.y;

        controls.x = position.x;
        controls.y = position.y;
        // resetOuterControls();

        if(controls.x < px) {
            dx = -dx;
        }

        if(controls.y < py) {
            dy = -dy;
        }

        usersImageAsSprite.x = usersImageAsSprite.x+dx;
        usersImageAsSprite.y = usersImageAsSprite.y+dy;

        imgTransformed = true;
    }

    function drawRing() {
        outerRing.radius = rotateScaleHandle.graphic.pivot.y;

        outerRing.graphic.clear();

        outerRing.graphic.hitArea.radius = outerRing.radius+(ringHitWidth*0.5);

        outerRing.graphic.lineStyle(ringWidth, 0xffffff, 0.3);
        outerRing.graphic.beginFill(0x000000, 0);
        outerRing.graphic.drawCircle(0, 0, outerRing.radius+(ringWidth*0.5));
        outerRing.graphic.endFill();
    }

    function withinRing(dist, radius, width) {
        return (Math.abs(radius-dist) <= width*0.5);
    }

    function hideControls() {
        controls.alpha = 0;
        translateGraphic.interactive = rotateScaleGraphic.interactive =
            outerRing.graphic.interactive = false;

        hitLayer.data.e = rotateScaleGraphic.data.e = null;
        hitLayer.data.dragging = rotateScaleGraphic.data.dragging = null;

        if(grid) {
            gridOverlay.alpha = 0;
        }

        hideLabel(moveLabel, 0);
        hideLabel(ringLabel, 0);
        hideLabel(pivotLabel, 0);
    }

    function resetOuterControls() {
        rotateScaleGraphic.pivot.x = 0;
        rotateScaleGraphic.pivot.y = secondaryOffset = defaultSecondaryOffset;

        rotateScaleGraphic.rotation = secondaryRotation = defaultSecondaryRotation;

        rotatePointValue = -Math.PI*0.5;

        drawRing();

        outerControls.alpha = 0.4;
    }

    function resetControls() {
        controls.alpha = 0.6;
        translateGraphic.interactive = rotateScaleGraphic.interactive =
            outerRing.graphic.interactive = true;

        resetOuterControls();
        drawRing();

        if(grid) {
            gridOverlay.alpha = 0;
        }
    }

    function getTouchByID(touchList, id) {
        if(!id && id !== 0) {
            return null;
        }
        else {
            for(var t = 0, tL = touchList.length; t < tL; ++t) {
                var touch = touchList[t];

                if(touch.identifier === id) {
                    return touch;
                }
            }
        }
    }


    // ANIMATION FRAME  -------------------------------------------------------
    // ------------------------------------------------------------------------

    // run the render loop
    requestAnimFrame(animate);

    function animate() {
        // checkBounds(el3, el2)
        // if(checkBounds(el3, el2)) {
        //     console.log('check bounds')
        //     var px = el3.position.x+el3.width;
        //     var py = el3.position.y+el3.height;
        //     var bx = el2.position.x+el2.width;
        //     var by = el2.position.y+el2.height;
        //     if((px < bx)&&(py < by)) {
        //         console.log('inside')
        //     }else{
        //         console.log('touch', px, py, bx, by )
        //     }
        // }

        renderer.render(stage);
        requestAnimFrame( animate );
    }


    if(fill) {
        // Scale the canvas using CSS to fill the viewport (quick win, rather
        // than messing with all the hardcoded values above; all needs to be
        // rebuilt anyway).
        (function() {
            var child = renderer.view,
                parent = child.parentNode,

                style = child.style;

            function resize() {
                var w = parent.clientWidth/child.clientWidth,
                    h = parent.clientHeight/child.clientHeight;

                s = Math.min(w, h);

                style.transform = style.msTransform = style.webkitTransform =
                    style.mozTransform = style.oTransform = 'scale('+s+')';

                // scale = s*(rendererSize.w/child.offsetWidth);
                scale = rendererSize.w/child.getBoundingClientRect().width;
            }

            self.addEventListener('resize', resize);

            resize();
        })();
    }

    self.scale = scale;


    function intro() {
        // @todo: Could all be in a tween

        // if(snap) {
        //     showLabel(centerLabel, 0);

        //     scaleLabel.getChildAt(1).setText('snap scale');
        //     showLabel(scaleLabel, 0);

        //     rotateLabel.getChildAt(1).setText('snap rotate');
        //     showLabel(rotateLabel, 0);
        // }


        // Pretend a click has happened in the center.

        var pos = ((controls.alpha === 0)?
                    new PIXI.Point(
                        hitLayer.hitArea.x+(hitLayer.hitArea.width*0.5),
                        hitLayer.hitArea.y+(hitLayer.hitArea.height*0.5))
                :   controls.position);

        resetControls();
        placeUIAnchor(pos);

        showLabel(moveLabel, 0);
        showLabel(ringLabel, 0);
        // showLabel(pivotLabel, 0);

        // Misusing this flag, pretty bad... sorry about that.
        hitLayer.data.e = true;
    }

    // intro();

    (function() {
        var pos = ((controls.alpha === 0)?
                    new PIXI.Point(
                        hitLayer.hitArea.x+(hitLayer.hitArea.width*0.5),
                        hitLayer.hitArea.y+(hitLayer.hitArea.height*0.5))
                :   controls.position);

        resetControls();
        placeUIAnchor(pos);

        // Misusing this flag, pretty bad... sorry about that.
        hitLayer.data.e = true;

        clearTimeout(moveLabel.data.show);
        clearTimeout(moveLabel.data.hide);
        clearTimeout(ringLabel.data.show);
        clearTimeout(ringLabel.data.hide);

        moveLabel.alpha = ringLabel.alpha = 1;
    })();
}


self.onload = function() {
        var controller = new Controller();
    };
