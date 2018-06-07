
var difference = function(a, b) { return Math.abs(a - b); };

var Controller = function() {

    var scope = this;
    // var gui = new dat.GUI();
    var canvas = document.getElementById('canvas');
    var stage = new PIXI.Stage(0x252525, true);
    // make it interactive
    stage.interactive = true;

    var renderer = PIXI.autoDetectRenderer(800, 600);

    // add render view to DOM
    canvas.appendChild(renderer.view);

    var center = {
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

        circle2dist = 100,
        circle1 = new PIXI.Graphics(),
        circle2 = new PIXI.Graphics(),
        hitLayer = new PIXI.Graphics();

    // set a fill and line style
    circle1.beginFill(0xFF3300);
    circle1.lineStyle(10, 0xffd900, 1);

    // draw a circle
    circle1.lineStyle(0);
    circle1.beginFill(0xFF0000, 0.5);
    circle1.drawCircle(0, 0,50);
    circle1.endFill();
    circle1.position.x = -999;
    circle1.position.y = -999;
    circle1.interactive = true;
    circle1.buttonMode = true;

    // set a fill and line style
    circle2.beginFill(0xFF0000);
    circle2.lineStyle(10, 0xffd900, 0);

    // draw a circle. Used for Rotation / Scale
    circle2.lineStyle(0);
    circle2.beginFill(0xFF0000, 0.5);
    circle2.drawCircle(0, 0,20);
    circle2.endFill();
    // position circle
    resetCircle2();
    circle2.dragging = false;
    circle2.interactive = true;
    circle2.buttonMode = true;

    // Draw Hit Layer, used to interacitce background.
    hitLayer.lineStyle(0, 0x0000FF, 0);
    hitLayer.beginFill(0xFF0000, 0);
    hitLayer.drawRect(0, 0, renderer.width, renderer.height);
    hitLayer.interactive = true;
    hitLayer.buttonMode = true;

     // create a texture from an image path
    var texture = PIXI.Texture.fromImage("imgs/merry_xmas.jpg");
    var texture2 = PIXI.Texture.fromImage("imgs/merry_xmas2.jpg");
    // create a new Sprite using the texture
    var element = new PIXI.Sprite(texture);
    var count = 0;
    var firstTouch = true;

    element.interactive = true;
    element.buttonMode = true;

    element.position.set(center.x, center.y);
    element.scale.set(600/2560);
    element.anchor.set(0.5, 0.5);
    element.pivot.set(-100, 0);
    // element.rotation = Math.PI/6;

    var elW = element.width,
        elH = element.height;

    // Holder for the element to fix positioning
    var elContainer = new PIXI.DisplayObjectContainer();

    elContainer.addChild(element);
    stage.addChild(elContainer);
    stage.addChild(hitLayer);
    stage.addChild(circle1);
    stage.addChild(circle2);


    function resetCircle2() {
        circle2.position.x = circle1.position.x;
        circle2.position.y = circle1.position.y-circle2dist;
    }

    function animate() {
        renderer.render(stage);
        requestAnimFrame(animate);
    }


    hitLayer.mousedown = hitLayer.touchstart = function(data) {
            data.originalEvent.preventDefault();

            circle1.position.set(data.global.x, data.global.y);
            resetCircle2();

            var local = element.toLocal(data.global),
                localPivot = new PIXI.Point(element.pivot.x-local.x,
                        element.pivot.y-local.y),
                globalPivot = element.toGlobal(localPivot);

            // var globalPivot = new PIXI.Point(element.position.x-data.global.x,
            //             element.position.y-data.global.y),
            //     localPivot = element.toLocal(globalPivot);

            // Work with vectors on the transformation components.
            // The transformation properties are defined in global space.

            // `o` = pivot = `element.toGlobal(element.pivot)`
            // `n` = new pivot = `globalPivot`
            // `po` = position under `o`
            // `pn` = new position under `n`
            //
            // pn = n-(po-o); po == o;
            // pn = n;
            element.position.set(globalPivot.x, globalPivot.y);

            // console.log(element.rotation,
            //     Math.atan2(element.y, element.x));
            // element.rotation = Math.atan2(y, x);

            // The pivot is defined in local space.
            element.pivot.set(localPivot.x, localPivot.y);

            console.log(data.global, element.pivot, element.position);
        };

    element.mouseup = element.mouseupoutside = element.touchend = element.touchendoutside = function(data) {
        // set the interaction data to null
        this.data = null;
    };

    // use the mousedown and touchstart
    circle1.mousedown = circle1.touchstart = function(data)
    {
       if(circle2.dragging === false){
            // stop the default event...
            data.originalEvent.preventDefault();

            // store a reference to the data
            // The reason for this is because of multitouch
            // we want to track the movement of this particular touch
            this.data = data;
            this.alpha = 0.9;
            this.dragging = true;
            // console.log('hit', data);
       }
    };

    // set the events for when the mouse is released or a touch is released
    circle1.mouseup = circle1.mouseupoutside = circle1.touchend = circle1.touchendoutside = function(data) {
        this.alpha = 1;
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        // position circle
        resetCircle2();
    };

    // set the callbacks for when the mouse or a touch moves
    circle1.mousemove = circle1.touchmove = function(data) {
        if(this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);

            var dx = difference(this.position.x, newPosition.x);
            var dy = difference(this.position.y, newPosition.y);

            var px = this.position.x;
            var py = this.position.y;

            this.position.x = newPosition.x;
            this.position.y = newPosition.y;

            if(this.position.x < px){
                dx =  -dx;
            }

            if(this.position.y < py){
                dy =  -dy;
            }

            element.position.x = element.position.x + dx;
            element.position.y = element.position.y + dy;
        }
    };


    // use the mousedown and touchstart
    circle2.mousedown = circle2.touchstart = function(data) {
        // stop the default event...
        data.originalEvent.preventDefault();

        // store a reference to the data
        // The reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = data;
        this.alpha = 0.9;
        this.dragging = true;
        // console.log('2 touch');
    };

    // set the events for when the mouse is released or a touch is released
    circle2.mouseup = circle2.mouseupoutside = circle2.touchend = circle1.touchendoutside = function(data) {
        this.alpha = 1;
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        currentRotation.rad = element.rotation;
        // position circle
        resetCircle2();
        elW = element.width;
        elH = element.height;
    };

    // set the callbacks for when the mouse or a touch moves
    circle2.mousemove = circle2.touchmove = function(data) {
        if(this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);

            // Calculate distance
            var dx = circle1.x - newPosition.x;
            var dy = circle1.y - newPosition.y;
            var dist = Math.floor(Math.sqrt(dx * dx + dy * dy));

            // Calculate new scale percentage
            // including the default distance of the pointer
            var newScale = (dist - circle2dist)/100 ;
            // console.log('scale ', newScale)
            newScale = newScale +1;

            if(newScale > 0.5){
                element.width = elW * newScale;
                element.height = elH * newScale;
            }

            // console.log(element.width, element.height);

           // Update position
            circle2.x = newPosition.x;
            circle2.y = newPosition.y;

            rx = circle2.x - circle1.x;
            ry = circle2.y - circle1.y;

            // Calculate rotation + 1.57 (as anchor at top initially)
            var newRotation = Math.atan2(ry, rx) + 1.57;
            // var rotationDiff = difference(currentRotation.rad, newRotation)
            // element.rotation = newRotation + currentRotation.rad;
        }
    };


    // run the render loop
    requestAnimFrame(animate);
};

window.onload = function() {
    var controller = new Controller();
    // console.log('win load');
};
