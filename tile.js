var re = /^(\d{5})-(\d{5})\.(\d{5})-(\d{5})$/;
function parseName(name) {
    name = _.last(name.split('/'));

    var m = name.match(re);
    if (!m || m.length !== 5) {
        return null;
    }

    m = _.drop(m).map(function (i) {
        return Number(i);
    });

    if (_.all(m, Number.isInteger)) {
        return {
            x: [m[0], m[1]],
            y: [m[2], m[3]]
        };
    }
    return null;
}

function Tile(index, file) {
    var idx = parseName(file.name);
    if (!idx) {
        throw new Error('Invalid tile name "' + file.name + '"');
    }

    this.index = index;
    this.x = (idx.x[0] - 1) / index.options.tile_x;
    this.y = (idx.y[0] - 1) / index.options.tile_y;

    this.nx = index.options.tile_x;
    this.ny = index.options.tile_y;
    this.mx = this.nx + 2 * index.options.tile_bdr;
    this.my = this.ny + 2 * index.options.tile_bdr;
    this.bdr = index.options.tile_bdr;
    this.xlow = idx.x[0] - 1;
    this.xhigh = idx.x[1] - 1;
    this.ylow = idx.y[0] - 1;
    this.yhigh = idx.y[1] - 1;

    if (!(Number.isInteger(this.x) && idx.x[0] + this.nx - 1 === idx.x[1] &&
          Number.isInteger(this.y) && idx.y[0] + this.ny - 1 === idx.y[1])) {
        throw new Error('Invalid tile "' + file.name + '"');
    }

    this.data = null;
    this._file = file;
    this.name = file.name;

    return this;
}

Tile.prototype.load = function (done, error, progress) {
    var that = this;
    var r = new FileReader();
    r.onload = progress || function () {};
    r.onerror = error;
    r.onloadend = function () {
        if (that._process(r.result)) {
            done();
        } else {
            error('Could not load data');
        }
    };
    r.readAsArrayBuffer(this._file);
};

Tile.prototype._process = function (buf) {
    var s = this.index.options.scale_factor;
    var a;
    if (this.index.options.wordsize === 1 && this.index.options.signed) {
        a = new Int8Array(buf);
    } else if (this.index.options.wordsize === 1 && !this.index.options.signed) {
        a = new Uint8Array(buf);
    } else if (this.index.options.wordsize === 2 && this.index.options.signed) {
        a = new Int16Array(buf);
    } else if (this.index.options.wordsize === 2 && !this.index.options.signed) {
        a = new Uint16Array(buf);
    } else if (this.index.options.wordsize === 4 && this.index.options.signed) {
        a = new Int32Array(buf);
    } else if (this.index.options.wordsize === 4 && !this.index.options.signed) {
        a = new Uint32Array(buf);
    } else {
        return null;
    }

    if (a.length !== this.mx * this.my) {
        return null;
    }

    this.data = new Float64Array(this.nx * this.ny);

    this.min = Number.POSITIVE_INFINITY;
    this.max = Number.NEGATIVE_INFINITY;

    var i, j, k = -1, x, y, l = -1, tmp;
    // TODO: flipud
    for (j = 0; j < this.my; j += 1) {
        y = j - this.bdr;
        if (this.index.options.row_order === 'bottom_top') {
            y = this.ny - y - 1;
        }
        for (i = 0; i < this.mx; i += 1) {
            k += 1;
            x = i - this.bdr;
            if (x < 0 || x >= this.nx ||
                y < 0 || y >= this.ny) {
                continue;
            }
            l = y * this.nx + x;

            if (a[k] !== this.index.options.missing_value) {
                tmp = s * a[k];
                this.data[l] = tmp;
                if (tmp < this.min) {
                    this.min = tmp;
                } else if (tmp > this.max !== this.op) {
                    this.max = tmp;
                }
            } else {
                this.data[l] = NaN;
            }
        }
    }

    return true;
};

Tile.prototype.draw = function (ctx, color) {
    var img = ctx.createImageData(this.nx, this.ny);
    var i, k, c = 255 / (this.max - this.min), v;
    for (i = 0; i < img.data.length; i += 4) {
        k = i / 4;
        v = color(this.data[k], k);
        img.data[i + 0] = v[0];
        img.data[i + 1] = v[1];
        img.data[i + 2] = v[2];
        img.data[i + 3] = v[3];
    }

    ctx.putImageData(img, this.xlow, ctx.canvas.height - this.yhigh - 1);
};

module.exports = Tile;
