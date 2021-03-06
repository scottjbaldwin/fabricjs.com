(function() {

  function getAbsolutePath(path) {
    var isAbsolute = /^https?:/.test(path);
    if (isAbsolute) { return path; };
    var imgEl = _createImageElement();
    imgEl.src = path;
    var src = imgEl.src;
    imgEl = null;
    return src;
  }

  var IMG_SRC     = fabric.isLikelyNode ? (__dirname + '/../fixtures/test_image.gif') : getAbsolutePath('../fixtures/test_image.gif'),
      IMG_WIDTH   = 276,
      IMG_HEIGHT  = 110;

  var REFERENCE_IMG_OBJECT = {
    'version':                  fabric.version,
    'type':                     'image',
    'originX':                  'left',
    'originY':                  'top',
    'left':                     0,
    'top':                      0,
    'width':                    IMG_WIDTH, // node-canvas doesn't seem to allow setting width/height on image objects
    'height':                   IMG_HEIGHT, // or does it now?
    'fill':                     'rgb(0,0,0)',
    'stroke':                   null,
    'strokeWidth':              0,
    'strokeDashArray':          null,
    'strokeLineCap':            'butt',
    'strokeLineJoin':           'miter',
    'strokeMiterLimit':         10,
    'scaleX':                   1,
    'scaleY':                   1,
    'angle':                    0,
    'flipX':                    false,
    'flipY':                    false,
    'opacity':                  1,
    'src':                      IMG_SRC,
    'shadow':                   null,
    'visible':                  true,
    'backgroundColor':          '',
    'clipTo':                   null,
    'filters':                  [],
    'fillRule':                 'nonzero',
    'paintFirst':               'fill',
    'globalCompositeOperation': 'source-over',
    'skewX':                    0,
    'skewY':                    0,
    'transformMatrix':          null,
    'crossOrigin':              '',
    'cropX':                    0,
    'cropY':                    0
  };

  function _createImageElement() {
    return fabric.isLikelyNode ? new (require(fabric.canvasModule).Image)() : fabric.document.createElement('img');
  }

  function _createImageObject(width, height, callback, options) {
    var elImage = _createImageElement();
    setSrc(elImage, IMG_SRC, function() {
      if (width != elImage.width || height != elImage.height) {
        if (fabric.isLikelyNode) {
          var Canvas = require(fabric.canvasModule);
          var canvas = new Canvas(width, height);
          canvas.getContext('2d').drawImage(elImage, 0, 0, width, height);
          elImage._src = canvas.toDataURL();
          elImage.src = elImage._src;
        }
        else {
          elImage.width = width;
          elImage.height = height;
        }
        callback(new fabric.Image(elImage, options));
      }
      else {
        callback(new fabric.Image(elImage, options));
      }
    });
  }

  function createImageObject(callback, options) {
    return _createImageObject(IMG_WIDTH, IMG_HEIGHT, callback, options);
  }

  function createSmallImageObject(callback, options) {
    return _createImageObject(IMG_WIDTH / 2, IMG_HEIGHT / 2, callback, options);
  }

  function setSrc(img, src, callback) {
    if (fabric.isLikelyNode) {
      require('fs').readFile(src, function(err, imgData) {
        if (err) { throw err; };
        img.src = imgData;
        img._src = src;
        callback && callback();
      });
    }
    else {
      img.onload = function() {
        callback && callback();
      };
      img.src = src;
    }
  }

  QUnit.module('fabric.Image');

  QUnit.test('constructor', function(assert) {
    var done = assert.async();
    assert.ok(fabric.Image);

    createImageObject(function(image) {
      assert.ok(image instanceof fabric.Image);
      assert.ok(image instanceof fabric.Object);

      assert.equal(image.get('type'), 'image');

      done();
    });
  });

  QUnit.test('toObject', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toObject === 'function');
      var toObject = image.toObject();
      // workaround for node-canvas sometimes producing images with width/height and sometimes not
      if (toObject.width === 0) {
        toObject.width = IMG_WIDTH;
      }
      if (toObject.height === 0) {
        toObject.height = IMG_HEIGHT;
      }
      assert.deepEqual(toObject, REFERENCE_IMG_OBJECT);
      done();
    });
  });

  QUnit.test('toObject with no element', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toObject === 'function');
      var toObject = image.toObject();
      // workaround for node-canvas sometimes producing images with width/height and sometimes not
      if (toObject.width === 0) {
        toObject.width = IMG_WIDTH;
      }
      if (toObject.height === 0) {
        toObject.height = IMG_HEIGHT;
      }
      assert.deepEqual(toObject, REFERENCE_IMG_OBJECT);
      done();
    });
  });

  QUnit.test('toObject with resize filter', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toObject === 'function');
      var filter = new fabric.Image.filters.Resize({resizeType: 'bilinear', scaleX: 0.3, scaleY: 0.3});
      image.resizeFilter = filter;
      assert.ok(image.resizeFilter instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
      var toObject = image.toObject();
      assert.deepEqual(toObject.resizeFilter, filter.toObject(), 'the filter is in object form now');
      fabric.Image.fromObject(toObject, function(imageFromObject) {
        var filterFromObj = imageFromObject.resizeFilter;
        assert.ok(filterFromObj instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
        assert.deepEqual(filterFromObj, filter,  'the filter has been restored');
        assert.equal(filterFromObj.scaleX, 0.3);
        assert.equal(filterFromObj.scaleY, 0.3);
        assert.equal(filterFromObj.resizeType, 'bilinear');
        done();
      });
    });
  });

  QUnit.test('toObject with applied resize filter', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toObject === 'function');
      var filter = new fabric.Image.filters.Resize({resizeType: 'bilinear', scaleX: 0.2, scaleY: 0.2});
      image.filters.push(filter);
      var width = image.width, height = image.height;
      assert.ok(image.filters[0] instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
      image.applyFilters();
      assert.equal(image.width, Math.floor(width / 5), 'width should be a fifth');
      assert.equal(image.height, Math.floor(height / 5), 'height should a fifth');
      var toObject = image.toObject();
      assert.deepEqual(toObject.filters[0], filter.toObject());
      assert.equal(toObject.width, width, 'width is stored as before filters');
      assert.equal(toObject.height, height, 'height is stored as before filters');
      fabric.Image.fromObject(toObject, function(_imageFromObject) {
        var filterFromObj = _imageFromObject.filters[0];
        assert.ok(filterFromObj instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
        assert.equal(filterFromObj.scaleY, 0.2);
        assert.equal(filterFromObj.scaleX, 0.2);
        assert.equal(_imageFromObject.width, Math.floor(width / 5), 'on image reload width is halved again');
        assert.equal(_imageFromObject.height, Math.floor(height / 5), 'on image reload width is halved again');
        done();
      });
    });
  });

  QUnit.test('toString', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toString === 'function');
      assert.equal(image.toString(), '#<fabric.Image: { src: "' + IMG_SRC + '" }>');
      done();
    });
  });

  QUnit.test('toSVG', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.toSVG === 'function');
      var expectedSVG = '<g transform="translate(138 55)">\n\t<image xlink:href="' + IMG_SRC + '" x="-138" y="-55" style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" width="276" height="110"></image>\n</g>\n';
      assert.equal(image.toSVG(), expectedSVG);
      done();
    });
  });

  QUnit.test('getSrc', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.getSrc === 'function');
      assert.equal(image.getSrc(), IMG_SRC);
      done();
    });
  });

  QUnit.test('getElement', function(assert) {
    var elImage = _createImageElement();
    var image = new fabric.Image(elImage);
    assert.ok(typeof image.getElement === 'function');
    assert.equal(image.getElement(), elImage);
  });

  QUnit.test('setElement', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.setElement === 'function');

      var elImage = _createImageElement();
      assert.equal(image.setElement(elImage), image, 'chainable');
      assert.equal(image.getElement(), elImage);
      assert.equal(image._originalElement, elImage);

      done();
    });
  });

  QUnit.test('crossOrigin', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.equal(image.crossOrigin, '', 'initial crossOrigin value should be set');

      var elImage = _createImageElement();
      elImage.crossOrigin = 'anonymous';
      image = new fabric.Image(elImage);
      assert.equal(image.crossOrigin, '', 'crossOrigin value on an instance takes precedence');

      var objRepr = image.toObject();
      assert.equal(objRepr.crossOrigin, '', 'toObject should return proper crossOrigin value');

      var elImage2 = _createImageElement();
      elImage2.crossOrigin = 'anonymous';
      image.setElement(elImage2);
      assert.equal(elImage2.crossOrigin, 'anonymous', 'setElement should set proper crossOrigin on an img element');

      // fromObject doesn't work on Node :/
      if (fabric.isLikelyNode) {
        done();
        return;
      }

      fabric.Image.fromObject(objRepr, function(img) {
        assert.equal(img.crossOrigin, '');
        done();
      });
    });
  });

  QUnit.test('clone', function(assert) {
    var done = assert.async();
    createImageObject(function(image) {
      assert.ok(typeof image.clone === 'function');
      image.clone(function(clone) {
        assert.ok(clone instanceof fabric.Image);
        assert.deepEqual(clone.toObject(), image.toObject());
        done();
      });
    });
  });

  QUnit.test('cloneWidthHeight', function(assert) {
    var done = assert.async();
    createSmallImageObject(function(image) {
      image.clone(function(clone) {
        assert.equal(clone.width, IMG_WIDTH / 2,
          'clone\'s element should have width identical to that of original image');
        assert.equal(clone.height, IMG_HEIGHT / 2,
          'clone\'s element should have height identical to that of original image');
        done();
      });
    });
  });

  QUnit.test('fromObject', function(assert) {
    var done = assert.async();
    assert.ok(typeof fabric.Image.fromObject === 'function');

    // should not throw error when no callback is given
    var obj = fabric.util.object.extend(fabric.util.object.clone(REFERENCE_IMG_OBJECT), {
      src: IMG_SRC
    });
    fabric.Image.fromObject(obj, function(instance){
      assert.ok(instance instanceof fabric.Image);
      done();
    });
  });

  QUnit.test('fromURL', function(assert) {
    var done = assert.async();
    assert.ok(typeof fabric.Image.fromURL === 'function');
    fabric.Image.fromURL(IMG_SRC, function(instance) {
      assert.ok(instance instanceof fabric.Image);
      assert.deepEqual(REFERENCE_IMG_OBJECT, instance.toObject());
      done();
    });
  });

  QUnit.test('fromElement', function(assert) {
    var done = assert.async();
    function makeImageElement(attributes) {
      var element = _createImageElement();
      if (fabric.isLikelyNode) {
        element.getAttribute = function(x) {
          return element[x];
        };
        element.setAttribute = function(x, value) {
          element[x] = value;
        };
      }
      for (var prop in attributes) {
        element.setAttribute(prop, attributes[prop]);
      }
      return element;
    }

    var IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAARCAYAAADtyJ2fAAAACXBIWXMAAAsSAAALEgHS3X78AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVBJREFUeNqMU7tOBDEMtENuy614/QE/gZBOuvJK+Et6CiQ6JP6ExxWI7bhL1vgVExYKLPmsTTIzjieHd+MZZSBIAJwEyJU0EWaum+lNljRux3O6nl70Gx/GUwUeyYcDJWZNhMK1aEXYe95Mz4iP44kDTRUZSWSq1YEHri0/HZxXfGSFBN+qDEJTrNI+QXRBviZ7eWCQgjsg+IHiHYB30MhqUxwcmH1Arc2kFDwkBldeFGJLPqs/AbbF2dWgUym6Z2Tb6RVzYxG1wUnmaNcOonZiU0++l6C7FzoQY42g3+8jz+GZ+dWMr1rRH0OjAFhPO+VJFx/vWDqPmk8H97CGBUYUiqAGW0PVe1+aX8j2Ll0tgHtvLx6AK9Tu1ZTFTQ0ojChqGD4qkOzeAuzVfgzsaTym1ClS+IdwtQCFooQMBTumNun1H6Bfcc9/MUn4R3wJMAAZH6MmA4ht4gAAAABJRU5ErkJggg==';

    assert.ok(typeof fabric.Image.fromElement === 'function', 'fromElement should exist');

    var imageEl = makeImageElement({
      width: '14',
      height: '17',
      'xlink:href': IMAGE_DATA_URL
    });

    fabric.Image.fromElement(imageEl, function(imgObject) {
      assert.ok(imgObject instanceof fabric.Image);
      assert.deepEqual(imgObject.get('width'), 14, 'width of an object');
      assert.deepEqual(imgObject.get('height'), 17, 'height of an object');
      assert.deepEqual(imgObject.getSrc(), IMAGE_DATA_URL, 'src of an object');
      done();
    });
  });

  // QUnit.test('minimumScale', function(assert) {
  //   var done = assert.async();
  //   createImageObject(function(image) {
  //     assert.ok(typeof image.toObject === 'function');
  //     var filter = new fabric.Image.filters.Resize({resizeType: 'sliceHack', scaleX: 0.2, scaleY: 0.2});
  //     image.resizeFilters.push(filter);
  //     var width = image.width, height = image.height;
  //     assert.ok(image.resizeFilters[0] instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
  //     var toObject = image.toObject();
  //     fabric.Image.fromObject(toObject, function(_imageFromObject) {
  //       var filterFromObj = _imageFromObject.resizeFilters[0];
  //       assert.ok(filterFromObj instanceof fabric.Image.filters.Resize, 'should inherit from fabric.Image.filters.Resize');
  //       assert.equal(filterFromObj.scaleY, 0.2);
  //       assert.equal(filterFromObj.scaleX, 0.2);
  //       var canvasEl = _imageFromObject.applyFilters(null, _imageFromObject.resizeFilters, _imageFromObject._originalElement, true);
  //       done();
  //     });
  //   });
  // });

})();
