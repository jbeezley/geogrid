
var _ = require('lodash');
var Dataset = function (index) {
    this.index = index;
    this.tiles = {};
    this.min = Number.POSITIVE_INFINITY;
    this.max = Number.NEGATIVE_INFINITY;
};

Dataset.prototype.addTile = function (file) {
    var tile = new geogrid.Tile(this.index, file);
    this.tiles[tile.name] = tile;
};

Dataset.prototype.load = function () {
    var d = new $.Deferred(), a = [];
    var that = this;

    _.each(this.tiles, function (t, i) {
        var d0 = new $.Deferred();
        a.push(d0);
        t.load(function () {
            that.min = Math.min(that.min, t.min);
            that.max = Math.max(that.max, t.max);
            d0.resolve();
        }, function () {
            console.log('ignoring invalid file ' + t.name);
            delete that.tiles[t.name];
            d0.resolve();
            d.notify({
                name: t.name,
                index: i,
                total: this.tiles.length
            });
        });
    });
    $.when.apply($, a).done(function () {
        d.resolve(that);
    });
    return d.promise();
};

Dataset.prototype.bounds = function () {
    var xlow = Number.POSITIVE_INFINITY,
        xhigh = Number.NEGATIVE_INFINITY,
        ylow = Number.POSITIVE_INFINITY,
        yhigh = Number.NEGATIVE_INFINITY;

    _.each(this.tiles, function (tile, name) {
        xlow = Math.min(xlow, tile.xlow);
        ylow = Math.min(ylow, tile.ylow);
        xhigh = Math.max(xhigh, tile.xhigh);
        yhigh = Math.max(yhigh, tile.yhigh);
    });

    return {
        x: [xlow, xhigh],
        y: [ylow, yhigh]
    };
};

Dataset.prototype.draw = function (ctx) {
    var that = this;
    var min = this.min;
    var max = this.max;
    var s = 255 / (max - min);
    function color(v) {
        var c;
        if (Number.isFinite(v)) {
            c = Math.floor((v - min) * s);
            return [c, c, c, 255];
        } else {
            return [0, 0, 0, 0];
        }
    }
    _.each(this.tiles, function (tile) {
        tile.draw(ctx, color);
    });
};

module.exports = Dataset;
