var test = require('tape').test;

test('Index', (assert) => {
    var index = require('../index.js').parse([
        'dx=0.1',
        'dy=0.1',
        'tile_x=100',
        'tile_y=100',
        'known_lon=-180',
        'known_lat=-90',
        'projection=regular_ll',
        'type=continuous',
        'wordsize=2'
    ].join('\n'));
    assert.ok(index.options, 'A default options object exists');
    assert.end();
});
