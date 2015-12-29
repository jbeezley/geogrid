var test = require('tape').test;
var Index = require('../index.js');
var file1 = require('raw!./basic/index');

test('Index minimal file', (assert) => {
    var index = Index.parse(file1);
    assert.ok(index.options, 'A default options object exists');

    assert.same(
        index.tile2proj(0, 0),
        {x: -180, y: -90},
        'tile2proj: Lower left corner'
    );

    assert.same(
        index.proj2tile(-180, -90),
        {x: 0, y: 0},
        'proj2tile: Lower left corner'
    );

    assert.same(
        index.tile2proj(1, 1),
        {x: -170, y: -80},
        'tile2proj: (1, 1)'
    );

    assert.same(
        index.proj2tile(-170, -80),
        {x: 1, y: 1},
        'proj2tile: (-170, -80)'
    );

    assert.same(
        index.tile2proj(5, 10),
        {x: -130, y: 10},
        'tile2proj: (5, 10)'
    );

    assert.same(
        index.proj2tile(-130, 10),
        {x: 5, y: 10},
        'proj2tile: (-130, 10)'
    );

    assert.same(
        index.tile2proj(5.1, 9.9),
        {x: -129, y: 9},
        'tile2proj: (5.1, 9.9)'
    );

    assert.same(
        index.proj2tile(-129, 9),
        {x: 5.1, y: 9.9},
        'proj2tile: (-129, 9)'
    );

    assert.end();
});
