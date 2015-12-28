(function (GLOBAL) {
    'use strict';

    var geogrid = GLOBAL.geogrid || {};
    GLOBAL.geogrid = geogrid;

    function getIndex(file) {
        var d = new $.Deferred();
        var r = new FileReader();
        r.onloadend = function () {
            var index = new geogrid.Index();
            try {
                index.parse(r.result);
            } catch (e) {
                d.rejext(e);
                return;
            }
            d.resolve(index);
        };
        r.onerror = function (e) {
            d.reject(e);
        };
        r.readAsText(file);
        return d.promise();
    }

    geogrid.handleDrag = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    };

    geogrid.handleDrop = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.originalEvent.dataTransfer.items;
        var file, i;
        var index = null;
        var tiles = [];
        var toload = [];
        var p, q = new $.Deferred();
        for (i = 0; i < files.length; i += 1) {
            file = files[i].getAsFile();
            if (file.name === 'index') {
                index = file;
            } else {
                toload.push(file);
            }
        }
        if (index) {
            p = getIndex(index)
                .done(function (idx) {
                    var dset = new geogrid.Dataset(idx);
                    toload.forEach(function (f) {
                        try {
                            dset.addTile(f);
                        } catch (e) {
                            console.log('ignoring invalid ' + f.name);
                        }
                    });
                    dset.load().progress(function (e) {
                        console.log(e);
                        q.notify(e);
                    }).done(function (d) {
                        window.data = d;
                        console.log('loaded');
                        q.resolve(d);
                    });
                }).fail(function () {
                    console.log('could not load index');
                    q.fail();
                });
        } else {
            console.log('no index found');
        }
        return q.promise();
    };
})(window);
