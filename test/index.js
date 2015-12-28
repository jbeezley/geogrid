var test = require('tape').test;
var Index = require('../index.js');
var file1 = [
    'dx=0.1',
    'dy=0.1',
    'tile_x=100',
    'tile_y=100',
    'known_lon=-180',
    'known_lat=-90',
    'projection=regular_ll',
    'type=continuous',
    'wordsize=2'
].join('\n');

test('Index minimal file', (assert) => {
    var index = Index.parse(file1);
    assert.ok(index.options, 'A default options object exists');

    assert.same(
        index.tile2proj(0, 0),
        {x: -180, y: -90},
        'tile2proj: Lower left corner'
    );

    assert.same(
        index.tile2proj(1, 1),
        {x: -170, y: -80},
        'tile2proj: (1, 1)'
    );

    assert.same(
        index.tile2proj(5, 10),
        {x: -130, y: 10},
        'tile2proj: (5, 10)'
    );

    assert.same(
        index.tile2proj(5.1, 9.9),
        {x: -129, y: 9},
        'tile2proj: (5.1, 9.9)'
    );
    assert.end();
});
