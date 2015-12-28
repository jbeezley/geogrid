var d3 = require('d3');
var _ = require('lodash');

function normalize(key, val) {
    switch (key) {
        case 'projection':
        case 'type':
        case 'signed':
        case 'row_order':
            return val.toLowerCase();

        case 'dx':
        case 'dy':
        case 'known_x':
        case 'known_y':
        case 'known_lat':
        case 'known_lon':
        case 'stdlon':
        case 'truelat1':
        case 'truelat2':
        case 'wordsize':
        case 'tile_x':
        case 'tile_y':
        case 'tile_z':
        case 'tile_z_start':
        case 'tile_z_end':
        case 'category_min':
        case 'category_max':
        case 'tile_bdr':
        case 'missing_value':
        case 'scale_factor':
            return (+val);
    }
    return val;
}

function Index() {}

/**
 * Create a new index object
 * @param {object} opts
 * @param {"continuous"|"categorical"} opts.type
 * @param {1|2|4} opts.wordsize
 * @param {number} opts.dx
 * @param {number} opts.dy
 * @param {number} opts.tile_x
 * @param {number} opts.tile_y
 * @param {number} opts.known_lon
 * @param {number} opts.known_lat
 * @param {string} opts.projection
 * @param {number?} opts.truelat1
 * @param {number?} opts.truelat2
 * @param {number?} opts.stdlat
 * @param {number?} opts.stdlon
 * @param {number} [opts.known_x=1]
 * @param {number} [opts.known_y=1]
 */
Index.create = function (opts) {
    index = new Index();

    index.options = _.extend({}, Index.defaults, opts);

    if (!_.has(Index.projections, index.options.projection)) {
        throw new Error('Invalid projection "' + index.options.projection + '"');
    }

    index.dtilex = index.options.dx * index.options.tile_x;
    index.dtiley = index.options.dy * index.options.tile_y;
    index.originx = index.options.known_lon -
        (index.options.known_x - 1) * index.options.dx;
    index.originy = index.options.known_lat -
        (index.options.known_y - 1) * index.options.dy;

    stdlat = 0;
    if (index.options.projection === 'polar') {
        stdlat = index.options.truelat1;
    }
    index.projection = Index.projections[index.options.projection]()
        .rotate([index.stdlon, stdlat]);

    if (index.options.projection === 'mercator') {
        index.projection.parallels([
            index.options.truelat1,
            index.options.truelat2
        ]);
    }

    index.dtilex = index.options.dx * index.options.tile_x;
    index.dtiley = index.options.dy * index.options.tile_y;
    index.originx = index.options.known_lon -
        (index.options.known_x - 1) * index.options.dx;
    index.originy = index.options.known_lat -
        (index.options.known_y - 1) * index.options.dy;

    stdlat = 0;
    if (index.options.projection === 'polar') {
        stdlat = index.options.truelat1;
    }
    index.projection = Index.projections[index.options.projection]()
        .rotate([index.stdlon, stdlat]);


    if (index.options.projection === 'mercator') {
        index.projection.parallels([
            index.options.truelat1,
            index.options.truelat2
        ]);
    }
    index.validate();
    return index;
};

Index.projections = {
    lambert: d3.geo.conicConformal,
    polar: d3.stereographic,
    mercator: d3.geo.mercator,
    regular_ll: d3.geo.equirectangular
};

Index.defaults = {
    signed: 'no',
    known_x: 1,
    known_y: 1,
    tile_bdr: 0,
    scale_factor: 1,
    row_order: 'bottom_top'
};

Index.parse = function (str) {
    var lines = str.split(/\r\n?|\n/);
    var options = {};
    var stdlat;
    var index;

    lines.forEach(function (line) {
        var keyval, key, val;

        line = line.replace(/#.*/, '').trim();
        if (line === '') {
            return;
        }

        keyval = line.split('=');

        if (keyval.length < 2) {
            console.warn('Invalid line found in index: ' + line);
            return;
        }

        key = keyval[0].trim().toLowerCase();
        val = line.replace(/[^=]*=/, '').trim();

        val = normalize(key, val);

        options[key] = val;
    });

    return Index.create(options);
};

Index.prototype.validate = function () {
    var o = this.options;
    var v;

    v = Index.projections.hasOwnProperty(o.projection);
    v = v && (o.type === 'categorical' || o.type === 'continuous');
    v = v && isFinite(o.dx) && isFinite(o.dy);
    v = v && isFinite(o.known_x) && isFinite(o.known_y);
    v = v && isFinite(o.known_lat) && isFinite(o.known_lon);
    v = v && (o.wordsize === 1 || o.wordsize === 2 || o.wordsize === 4);
    v = v && isFinite(o.tile_x) && isFinite(o.tile_y);
    v = v && (o.row_order === 'bottom_top' || o.row_order === 'top_bottom');
    if (!v) {
        console.log(JSON.stringify(o, null, '  '));
        throw new Error('Invalid index file');
    }
};

/**
 * Convert from tile coordinates to projection coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.tile2proj = function (x, y) {
    return {
        x: x * this.options.dtilex + this.options.originx,
        y: y * this.options.dtiley + this.options.originy
    };
};

/**
 * Convert from projected coordinates to world coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.proj2world = function (x, y) {
    var val = this.projection([x, y]);
    return {
        x: val[0],
        y: val[1]
    };
};

/**
 * Convert from projection coordinates to tile coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.proj2tile = function (x, y) {
    return {
        x: (x - this.options.originx) / this.options.dtilex,
        y: (y - this.options.originy) / this.options.dtiley
    };
};

/**
 * Convert from world coordinates to projected coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.world2proj = function (x, y) {
    var val = this.projection.invert([x, y]);
    return {
        x: val[0],
        y: val[1]
    };
};

/**
 * Convert from world coordinates to tile coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.world2tile = function (x, y) {
    var val = this.world2proj(x, y);
    return this.proj2tile(val.x, val.y);
};

/**
 * Convert from tile coordinates to world coordinates.
 *
 * @param {Number} x x-coordinate
 * @param {Number} y y-coordinate
 */
Index.prototype.tile2world = function (x, y) {
    var val = this.tile2proj(x, y);
    return this.proj2world(val.x, val.y);
};

module.exports = Index;
