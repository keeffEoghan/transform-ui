function Button(graphic) {
    if(graphic instanceof PIXI.DisplayObject) {
        var bounds = graphic.getBounds();

        this.radius = Math.max(bounds.width, bounds.height);
        this.graphic = graphic;
    }
    else if(graphic instanceof Object) {
        this.radius = ((graphic.radius === undefined)? 40 : graphic.radius);

        var color = ((graphic.color === undefined)? 0xff0000 : graphic.color);

        this.graphic = new PIXI.Graphics();
        this.graphic.lineStyle(graphic.lineWidth, graphic.lineColor,
                graphic.lineAlpha);
        this.graphic.beginFill(color, graphic.fillAlpha);
        this.graphic.drawCircle(0, 0, this.radius);
        this.graphic.endFill();
    }
    else {
        throw 'Button instantiated with incorrect arguments';
    }

    this.graphic.data = {};
    this.graphic.interactive = true;
    this.graphic.buttonMode = true;
    this.graphic.position.x = this.graphic.position.y = 0;
}

Button.prototype.getBounds = function () {
    return {
            x: this.graphic.position.x-this.radius,
            y: this.graphic.position.y-this.radius,
            width: this.radius*2,
            height: this.radius*2
        };
};
