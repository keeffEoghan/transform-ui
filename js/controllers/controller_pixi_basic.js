
var difference = function(a, b) { return Math.abs(a - b); };

var Controller = function() {

	var scope = this;
	// var gui = new dat.GUI();
	var canvas = document.getElementById('canvas');
    var stage = new PIXI.Stage(0x252525, true);
    // make it interactive
    stage.interactive = true;
 
    var renderer = PIXI.autoDetectRenderer(700, 700);
     
    // add render view to DOM
    canvas.appendChild(renderer.view);
    
    var center = {
	    	x:renderer.width/2,
	    	y:renderer.height/2
	    },
	    anchor = {
	    	x:center.x,
	    	y:center.y
	    },
	    currentRotation = {
			x:0,
			y:0,
			rad:0
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
    resetCircle2()
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
    var img1 = document.getElementById('img1')
    var texture = PIXI.Texture.fromCanvas(img1);
    var texture2 = PIXI.Texture.fromImage("imgs/checkerUV.jpg");
    // create a new Sprite using the texture
    var element = new PIXI.Sprite(texture2);
    var count = 0;
    var firstTouch = true;
    var elW = 600,
    	elH = 400,
    	ox = 0,
    	oy = 0,
    	el3;

    // var matrix;
    // center the sprites anchor point
    element.anchor.x = 0;
    element.anchor.y = 0;
    element.interactive = true;
    element.buttonMode = true;
    element.width = renderer.width;
    element.height = renderer.height;
    // move the sprite to the center of the screen
    element.position.x = 0;
    element.position.y = 0;

    // Holder for the element to fix positioning
    var elContainer = new PIXI.DisplayObjectContainer();
    elContainer.position.x = center.x;
    elContainer.position.y = center.y;
	console.log('containter', elContainer.width, elContainer.height)

    console.log('ORIGINAL is ', ox, oy, element.scale.x)

    var fullW = 2560,
        fullH = 1600;
    var el2 = new PIXI.Sprite(texture);
    el2.interactive = true;
    el2.buttonMode = true;
    el2.width = 300;
    el2.height = 200;
    console.log(el2.pivot, el2.anchor, ' pos ', el2.position.x, el2.position.y)
    // elContainer.addChild(el2);

    console.log('containter added', elContainer.width, elContainer.height, elContainer.position)

    stage.addChild(element);
    stage.addChild(el2);

    stage.addChild(hitLayer);
    stage.addChild(circle1);
    stage.addChild(circle2);

   	// use the mousedown and touchstart
    hitLayer.mousedown = hitLayer.touchstart = function(data)
    {
        // stop the default event...
        data.originalEvent.preventDefault();
        this.data = data;

        var newPosition = this.data.getLocalPosition(this.parent);

        var px = difference(elContainer.position.x, center.x);
        var py = elContainer.position.y;

        var cx = circle1.position.x;
        var cy = circle1.position.y;
        var ox = element.position.x;
        var oy = element.position.y;

        circle1.position.x = newPosition.x;
        circle1.position.y = newPosition.y;
        circle2.position.x = circle1.position.x
		circle2.position.y = circle1.position.y - circle2dist;
		
		var dx = difference(newPosition.x, el2.position.x)
		var dy = difference(newPosition.y, el2.position.y)
		var pcx = dx / (element.width/100) /100;
		var pcy = dy / (element.height/100) /100;

		var dcx = difference(circle1.position.x, cx)
		var dcy = difference(circle1.position.y, cy)

		console.log(newPosition.x, dx, pcx, pcy, element)

        el2.pivot = el2.toLocal(newPosition);
        el2.position = newPosition;

     //    el2.pivot.set(pivotXpc, pivotYpc)
     //    el2.position.x = el2.position.x - dx;
     //    el2.position.y = el2.position.x - dy;
	    // console.log('diff ', dx, dy)
		// console.log(element.worldTransform)
		// var prx = element.position.x
		// var pry = element.position.y
		// move the sprite to the center of the screen
	    // elContainer.position.x = center.x - elContainer.width/2;
	    // elContainer.position.y = center.y - elContainer.height/2;
		

		// if(firstTouch){
		// 	firstTouch = false
		// 	elContainer.position.x = elContainer.position.x + dx
		// 	elContainer.position.y = elContainer.position.y + dy
		// }
		// else{
		// 	elContainer.position.x = newPosition.x 
		// 	elContainer.position.y = newPosition.y

		// 	// elContainer.position.x = elContainer.position.x + dx;
		//  //    elContainer.position.y = elContainer.position.y + dy;
		// 	// element.worldTransform.ty =  0.5;
		// 	// element.updateTransform()
		// 	// element.position.y = element.position.y - dcy
		// 	console.log('old x ', ox)
		// 	console.log('new x ', elContainer.position.x)
		// }
		
    };

    element.mouseup = element.mouseupoutside = element.touchend = element.touchendoutside = function(data)
    {
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
	        console.log('hit', data)
       }
        
    };

    // set the events for when the mouse is released or a touch is released
    circle1.mouseup = circle1.mouseupoutside = circle1.touchend = circle1.touchendoutside = function(data)
    {
        this.alpha = 1
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        // position circle
	    resetCircle2()
    };

    // set the callbacks for when the mouse or a touch moves
    circle1.mousemove = circle1.touchmove = function(data)
    {
        if(this.dragging)
        {
            var newPosition = this.data.getLocalPosition(this.parent);

            var dx = difference(this.position.x, newPosition.x)
            var dy = difference(this.position.y, newPosition.y)

            var px = this.position.x;
			var py = this.position.y;

			this.position.x = newPosition.x;
            this.position.y = newPosition.y;

			if(this.position.x < px){
				dx =  -dx 
			}
			
			if(this.position.y < py){
				dy =  -dy 
			}

            el2.position.x = el2.position.x + dx;
            el2.position.y = el2.position.y + dy;
        }
    }


    // use the mousedown and touchstart
    circle2.mousedown = circle2.touchstart = function(data)
    {
        // stop the default event...
        data.originalEvent.preventDefault();

        // store a reference to the data
        // The reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = data;
        this.alpha = 0.9;
        this.dragging = true;
        console.log('2 touch')
    };

    // set the events for when the mouse is released or a touch is released
    circle2.mouseup = circle2.mouseupoutside = circle2.touchend = circle1.touchendoutside = function(data)
    {
        this.alpha = 1
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        currentRotation.rad = element.rotation;
        // position circle
	    resetCircle2()
	    elW = element.width;
	    elH = element.height;
    };

    // set the callbacks for when the mouse or a touch moves
    circle2.mousemove = circle2.touchmove = function(data)
    {
        if(this.dragging)
        {
            var newPosition = this.data.getLocalPosition(this.parent);

            // Calculate distance
			var dx = circle1.x - newPosition.x;
            var dy = circle1.y - newPosition.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
	            dist = Math.floor(dist)

            // Calculate new scale percentage
            // including the default distance of the pointer
            var newScale = (dist - circle2dist)/100 ;
            // console.log('scale ', newScale)
            newScale = newScale +1
            
			if(newScale > 0.5){
				// element.width = elW * newScale
				// element.height = elH * newScale
			}

			console.log(element.width, element.height)

		   // Update position
			circle2.x = newPosition.x;
			circle2.y = newPosition.y;
			
			rx = circle2.x - circle1.x;
			ry = circle2.y - circle1.y;
     
            // Calculate rotation + 1.57 (as anchor at top initially)
	        var newRotation = Math.atan2(ry, rx) + 1.57;
	        // var rotationDiff = difference(currentRotation.rad, newRotation)
	        el2.rotation = newRotation + currentRotation.rad;
        }
    }

    // run the render loop
    requestAnimFrame(animate);

    function resetCircle2(){
    	circle2.position.x = circle1.position.x;
		circle2.position.y = circle1.position.y - circle2dist;
    }

    function animate() {
        // console.log('tik')
        // console.log(circle2.dragging)
        // elContainer.rotation = elContainer.rotation + 0.01;

        // element.updateTransform()
        renderer.render(stage);
        requestAnimFrame( animate );
    }

};


window.onload = function() {
	
	var controller = new Controller();
	console.log('win load');

};