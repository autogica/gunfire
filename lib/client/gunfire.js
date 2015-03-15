(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/sole/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/sole/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

// Date.now shim for (ahem) Internet Explo(d|r)er
if ( Date.now === undefined ) {

	Date.now = function () {

		return new Date().valueOf();

	};

}

var TWEEN = TWEEN || ( function () {

	var _tweens = [];

	return {

		REVISION: '14',

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function ( tween ) {

			_tweens.push( tween );

		},

		remove: function ( tween ) {

			var i = _tweens.indexOf( tween );

			if ( i !== -1 ) {

				_tweens.splice( i, 1 );

			}

		},

		update: function ( time ) {

			if ( _tweens.length === 0 ) return false;

			var i = 0;

			time = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );

			while ( i < _tweens.length ) {

				if ( _tweens[ i ].update( time ) ) {

					i++;

				} else {

					_tweens.splice( i, 1 );

				}

			}

			return true;

		}
	};

} )();

TWEEN.Tween = function ( object ) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	// Set all starting values present on the target object
	for ( var field in object ) {

		_valuesStart[ field ] = parseFloat(object[field], 10);

	}

	this.to = function ( properties, duration ) {

		if ( duration !== undefined ) {

			_duration = duration;

		}

		_valuesEnd = properties;

		return this;

	};

	this.start = function ( time ) {

		TWEEN.add( this );

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );
		_startTime += _delayTime;

		for ( var property in _valuesEnd ) {

			// check if an Array was provided as property value
			if ( _valuesEnd[ property ] instanceof Array ) {

				if ( _valuesEnd[ property ].length === 0 ) {

					continue;

				}

				// create a local copy of the Array with the start value at the front
				_valuesEnd[ property ] = [ _object[ property ] ].concat( _valuesEnd[ property ] );

			}

			_valuesStart[ property ] = _object[ property ];

			if( ( _valuesStart[ property ] instanceof Array ) === false ) {
				_valuesStart[ property ] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[ property ] = _valuesStart[ property ] || 0;

		}

		return this;

	};

	this.stop = function () {

		if ( !_isPlaying ) {
			return this;
		}

		TWEEN.remove( this );
		_isPlaying = false;

		if ( _onStopCallback !== null ) {

			_onStopCallback.call( _object );

		}

		this.stopChainedTweens();
		return this;

	};

	this.stopChainedTweens = function () {

		for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

			_chainedTweens[ i ].stop();

		}

	};

	this.delay = function ( amount ) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function ( times ) {

		_repeat = times;
		return this;

	};

	this.yoyo = function( yoyo ) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function ( easing ) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function ( interpolation ) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function ( callback ) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function ( callback ) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function ( callback ) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function ( callback ) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function ( time ) {

		var property;

		if ( time < _startTime ) {

			return true;

		}

		if ( _onStartCallbackFired === false ) {

			if ( _onStartCallback !== null ) {

				_onStartCallback.call( _object );

			}

			_onStartCallbackFired = true;

		}

		var elapsed = ( time - _startTime ) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		var value = _easingFunction( elapsed );

		for ( property in _valuesEnd ) {

			var start = _valuesStart[ property ] || 0;
			var end = _valuesEnd[ property ];

			if ( end instanceof Array ) {

				_object[ property ] = _interpolationFunction( end, value );

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if ( typeof(end) === "string" ) {
					end = start + parseFloat(end, 10);
				}

				// protect against non numeric properties.
				if ( typeof(end) === "number" ) {
					_object[ property ] = start + ( end - start ) * value;
				}

			}

		}

		if ( _onUpdateCallback !== null ) {

			_onUpdateCallback.call( _object, value );

		}

		if ( elapsed == 1 ) {

			if ( _repeat > 0 ) {

				if( isFinite( _repeat ) ) {
					_repeat--;
				}

				// reassign starting values, restart by making startTime = now
				for( property in _valuesStartRepeat ) {

					if ( typeof( _valuesEnd[ property ] ) === "string" ) {
						_valuesStartRepeat[ property ] = _valuesStartRepeat[ property ] + parseFloat(_valuesEnd[ property ], 10);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[ property ];
						_valuesStartRepeat[ property ] = _valuesEnd[ property ];
						_valuesEnd[ property ] = tmp;
					}

					_valuesStart[ property ] = _valuesStartRepeat[ property ];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				_startTime = time + _delayTime;

				return true;

			} else {

				if ( _onCompleteCallback !== null ) {

					_onCompleteCallback.call( _object );

				}

				for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

					_chainedTweens[ i ].start( time );

				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function ( k ) {

			return k;

		}

	},

	Quadratic: {

		In: function ( k ) {

			return k * k;

		},

		Out: function ( k ) {

			return k * ( 2 - k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
			return - 0.5 * ( --k * ( k - 2 ) - 1 );

		}

	},

	Cubic: {

		In: function ( k ) {

			return k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k + 2 );

		}

	},

	Quartic: {

		In: function ( k ) {

			return k * k * k * k;

		},

		Out: function ( k ) {

			return 1 - ( --k * k * k * k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
			return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

		}

	},

	Quintic: {

		In: function ( k ) {

			return k * k * k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

		}

	},

	Sinusoidal: {

		In: function ( k ) {

			return 1 - Math.cos( k * Math.PI / 2 );

		},

		Out: function ( k ) {

			return Math.sin( k * Math.PI / 2 );

		},

		InOut: function ( k ) {

			return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

		}

	},

	Exponential: {

		In: function ( k ) {

			return k === 0 ? 0 : Math.pow( 1024, k - 1 );

		},

		Out: function ( k ) {

			return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

		},

		InOut: function ( k ) {

			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
			return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

		}

	},

	Circular: {

		In: function ( k ) {

			return 1 - Math.sqrt( 1 - k * k );

		},

		Out: function ( k ) {

			return Math.sqrt( 1 - ( --k * k ) );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
			return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

		},

		Out: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

		},

		InOut: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
			return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

		}

	},

	Back: {

		In: function ( k ) {

			var s = 1.70158;
			return k * k * ( ( s + 1 ) * k - s );

		},

		Out: function ( k ) {

			var s = 1.70158;
			return --k * k * ( ( s + 1 ) * k + s ) + 1;

		},

		InOut: function ( k ) {

			var s = 1.70158 * 1.525;
			if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
			return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

		}

	},

	Bounce: {

		In: function ( k ) {

			return 1 - TWEEN.Easing.Bounce.Out( 1 - k );

		},

		Out: function ( k ) {

			if ( k < ( 1 / 2.75 ) ) {

				return 7.5625 * k * k;

			} else if ( k < ( 2 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

			} else if ( k < ( 2.5 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

			} else {

				return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

			}

		},

		InOut: function ( k ) {

			if ( k < 0.5 ) return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
			return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEEN.Interpolation.Utils.Linear;

		if ( k < 0 ) return fn( v[ 0 ], v[ 1 ], f );
		if ( k > 1 ) return fn( v[ m ], v[ m - 1 ], m - f );

		return fn( v[ i ], v[ i + 1 > m ? m : i + 1 ], f - i );

	},

	Bezier: function ( v, k ) {

		var b = 0, n = v.length - 1, pw = Math.pow, bn = TWEEN.Interpolation.Utils.Bernstein, i;

		for ( i = 0; i <= n; i++ ) {
			b += pw( 1 - k, n - i ) * pw( k, i ) * v[ i ] * bn( n, i );
		}

		return b;

	},

	CatmullRom: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEEN.Interpolation.Utils.CatmullRom;

		if ( v[ 0 ] === v[ m ] ) {

			if ( k < 0 ) i = Math.floor( f = m * ( 1 + k ) );

			return fn( v[ ( i - 1 + m ) % m ], v[ i ], v[ ( i + 1 ) % m ], v[ ( i + 2 ) % m ], f - i );

		} else {

			if ( k < 0 ) return v[ 0 ] - ( fn( v[ 0 ], v[ 0 ], v[ 1 ], v[ 1 ], -f ) - v[ 0 ] );
			if ( k > 1 ) return v[ m ] - ( fn( v[ m ], v[ m ], v[ m - 1 ], v[ m - 1 ], f - m ) - v[ m ] );

			return fn( v[ i ? i - 1 : 0 ], v[ i ], v[ m < i + 1 ? m : i + 1 ], v[ m < i + 2 ? m : i + 2 ], f - i );

		}

	},

	Utils: {

		Linear: function ( p0, p1, t ) {

			return ( p1 - p0 ) * t + p0;

		},

		Bernstein: function ( n , i ) {

			var fc = TWEEN.Interpolation.Utils.Factorial;
			return fc( n ) / fc( i ) / fc( n - i );

		},

		Factorial: ( function () {

			var a = [ 1 ];

			return function ( n ) {

				var s = 1, i;
				if ( a[ n ] ) return a[ n ];
				for ( i = n; i > 1; i-- ) s *= i;
				return a[ n ] = s;

			};

		} )(),

		CatmullRom: function ( p0, p1, p2, p3, t ) {

			var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
			return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

		}

	}

};

module.exports=TWEEN;
},{}],2:[function(require,module,exports){
(function (global){
var App, Audio, Mousetrap, Network, Stats, TWEEN, utils,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Audio = require('./audio').Audio;

Network = require('./network');

utils = require('./utils');

TWEEN = require('tween.js');

Stats = (typeof window !== "undefined" ? window.Stats : typeof global !== "undefined" ? global.Stats : null);

Mousetrap = (typeof window !== "undefined" ? window.Mousetrap : typeof global !== "undefined" ? global.Mousetrap : null);

App = (function() {
  function App() {
    this.animate = __bind(this.animate, this);
    this.onResize = __bind(this.onResize, this);
    this.onMouseMove = __bind(this.onMouseMove, this);
    var axisHelper;
    this.config = {
      tweenDuration: 3000,
      tweenEasing: TWEEN.Easing.Quadratic.InOut,
      renderer: {
        antialias: true
      },
      network: {
        interval: 800
      }
    };
    this.gunfire = {
      resourcesPath: window.location.origin + '/gunfire'
    };
    this.assets = {};
    this.time = Date.now() * 0.0005;
    this.clock = new THREE.Clock();
    this.mouseX = 0;
    this.mouseY = 0;
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.network = new Network(this);
    this.audio = new Audio(this);
    this.events = [];
    this.listeners = [];
    this.debug = true;
    this.market = new Market();
    this.market.lookToSell({
      product: "bar",
      callback: function(issue, sendSalesQuote) {
        console.log("dealer: somebody asked for stuff, options:", issue);
        return sendSalesQuote({
          price: 2000
        }, function(sendGoods) {
          var goods, refund, review;
          goods = [
            {
              foo: "bar"
            }
          ];
          review = function(score) {
            return console.log("dealer: buyer gave us a review:", score);
          };
          refund = function(onComplete) {
            var amountRestored, good, _i, _len;
            console.log("dealer: ok to refund, be we are going to recover good's ownership, ie. either redirect it or destroy it");
            for (_i = 0, _len = goods.length; _i < _len; _i++) {
              good = goods[_i];
              if (typeof good.destroy === "function") {
                good.destroy();
              }
            }
            console.log("dealer: give some money back");
            amountRestored = 1;
            return onComplete(amountRestored);
          };
          console.log("dealer: buyer accepted our stuff, sending goods..");
          return sendGoods(goods, review, refund);
        });
      }
    }).lookToBuy({
      product: "foo",
      options: {
        style: "great"
      },
      timeout: 3600000,
      callback: function(salesQuote, acceptQuote, stopSearch) {
        console.log("buyer: got a salesQuote:", salesQuote);
        console.log("buyer: accepting quote");
        return acceptQuote(function(goods, review, refund) {
          return console.log("buyer: received " + goods.length + " goods:", goods);
        });
      }
    });
    this.parent = document.body;
    this.container = document.createElement('div');
    this.parent.appendChild(this.container);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000000);
    this.camera.position.z = 0;
    this.camera.position.y = 1000;
    this.camera.setLens(20);
    this.scene = new THREE.Scene();
    this.scene.matrixAutoUpdate = false;
    this.renderer = new THREE.WebGLRenderer(this.config.renderer);
    this.renderer.sortObjects = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.controls = new THREE.GodControls(this);
    this.controls.movementSpeed = 100;
    this.controls.lookSpeed = 0.2;
    this.projector = new THREE.Projector();
    this.octree = new THREE.Octree({
      undeferred: false,
      depthMax: Infinity,
      objectsThreshold: 8,
      overlapPct: 0.15
    });
    axisHelper = new THREE.AxisHelper(80);
    this.scene.add(axisHelper);
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    this.stats.domElement.style.right = '0px';
    this.stats.domElement.style.zIndex = 100;
    this.container.appendChild(this.stats.domElement);
    window.addEventListener('resize', this.onResize, false);
    document.addEventListener('mousemove', this.onMouseMove, false);
  }

  App.prototype.onMouseMove = function(event) {
    this.mouseX = event.clientX - this.windowHalfX;
    return this.mouseY = event.clientY - this.windowHalfY;
  };

  App.prototype.onResize = function() {
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    return this.controls.handleResize();
  };

  App.prototype.emit = function(emitter, message, data) {
    var i, isUnused, listener, nextUnusedEvent, result, _i, _len;
    i = 0;
    listener = void 0;
    isUnused = true;
    for (_i = 0, _len = listeners.length; _i < _len; _i++) {
      listener = listeners[_i];
      result = listener(emitter, message, data);
      if (result) {
        isUnused = false;
      }
    }
    console.log("emit", emitter, message, data);
    if (isUnused) {
      0;
    }
    if (events.length) {
      nextUnusedEvent = events.shift();
      return after(1000, (function(_this) {
        return function() {
          return _this.emit(nextUnusedEvent[0], nextUnusedEvent[1], nextUnusedEvent[2]);
        };
      })(this));
    }
  };

  App.prototype.listen = function(handler) {
    return this.listeners.push(handler);
  };

  App.prototype.subscribe = function(emitter, message, callback) {
    return listeners.push(function(_emitter, _message, _p1, _p2, _p3, _p4, _p5, _p6) {
      if (emitter !== _emitter || message !== _message) {
        return false;
      }
      return callback(_p1, _p2, _p3, _p4, _p4, _p5, _p6);
    });
  };

  App.prototype.animate = function() {
    var asset, name, _ref;
    requestAnimationFrame(this.animate);
    this.time = Date.now() * 0.0005;
    this.controls.update(this.clock.getDelta());
    TWEEN.update();
    _ref = this.assets;
    for (name in _ref) {
      asset = _ref[name];
      if (typeof asset.render === "function") {
        asset.render();
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.octree.update();
    if (this.stats != null) {
      return this.stats.update();
    }
  };

  App.prototype.start = function() {
    var func;
    this.animate();
    func = (function(_this) {
      return function() {
        return _this.network.sync();
      };
    })(this);
    return setInterval((function() {
      return func();
    }), this.config.network.interval);
  };

  return App;

})();

console.log("initializing app");

window.app = new App();

window.app.start();



}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./audio":3,"./network":4,"./utils":5,"tween.js":1}],3:[function(require,module,exports){
var Audio, Sound, TWEEN;

window.AudioContext = window.AudioContext || window.webkitAudioContext || null;

TWEEN = require('tween.js');

Sound = (function() {
  function Sound(audio, opts) {
    this.audio = audio;
    console.log("creating new sound");
    this.source = this.audio.ctx.createBufferSource();
    this.volume = this.audio.ctx.createGain();
    this.source.connect(this.volume);
    if (opts.loop) {
      this.source.loop = true;
    }
    if (opts.channel === 'master') {
      this.volume.connect(this.audio.volume);
    }
    if ((opts.source != null) && opts.source !== "") {
      this.load(opts.source);
    }
  }

  Sound.prototype.load = function(source, onError) {
    var request;
    console.log("loading sound source: \"" + source + "\" ");
    request = new XMLHttpRequest();
    request.open("GET", source, true);
    request.responseType = "arraybuffer";
    request.onload = (function(_this) {
      return function(e) {
        var buffer;
        buffer = _this.audio.ctx.createBuffer(_this.response, false);
        _this.sound.buffer = buffer;
        _this.source.buffer = _this.sound.buffer;
        return _this.source.start(_this.audio.ctx.currentTime);
      };
    })(this);
    return request.send();
  };

  return Sound;

})();

Audio = (function() {
  function Audio(app) {
    this.app = app;
    if (typeof AudioContext === "undefined" || AudioContext === null) {
      throw new Error("AudioContext not supported!");
    }
    this.ctx = new AudioContext();
    this.volume = this.ctx.createGain();
    this.volume.connect(this.ctx.destination);
    this.sound = (function(_this) {
      return function(opts) {
        return new Sound(_this, opts);
      };
    })(this);
  }

  return Audio;

})();

exports.Audio = Audio;

exports.Sound = Sound;



},{"tween.js":1}],4:[function(require,module,exports){
(function (global){
var Network, Primus, TWEEN, utils,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Primus = (typeof window !== "undefined" ? window.Primus : typeof global !== "undefined" ? global.Primus : null);

utils = require('./utils');

window.utils = utils;

TWEEN = require('tween.js');

Network = (function() {
  function Network(app) {
    var updateAssetClient;
    this.app = app;
    this.sync = __bind(this.sync, this);
    this.primus = new Primus();
    this.primus.on('reconnect', function(opts) {
      return console.log('Reconnecting:', 'gunfire: we are scheduling a new reconnect attempt in ' + opts.timeout + ' ms.');
    });
    this.primus.on('reconnect', function() {
      return console.log('Reconnect:', 'gunfire: starting the reconnect attempt, hopefully we get a connection!');
    });
    this.primus.on('online', function() {
      return console.log('Online:', 'gunfire: we have regained control over our internet connection.');
    });
    this.primus.on('offline', function() {
      return console.log('Offline:', 'gunfire: we lost our internet connection.');
    });
    this.primus.on('open', (function(_this) {
      return function() {
        return console.log('Open:', 'gunfire: the connection has been established.');
      };
    })(this));
    this.primus.on('error', (function(_this) {
      return function(err) {
        return console.log('Error:', 'gunfire: an unknown error has occured: ' + err.message + '');
      };
    })(this));
    updateAssetClient = (function(_this) {
      return function(name, asset) {
        var err, err2, instance, item, module, namePath, res, tmp, tweenDuration, tweenEasing, _i, _j, _len, _len1;
        module = {
          exports: void 0
        };
        res = {};
        res = eval(CoffeeScript.compile(asset.source));
        if (module.exports == null) {
          console.log("gunfire: " + name + ": source error");
          return;
        }
        instance = {};
        try {
          instance = new module.exports(_this.app.assets[name]);
        } catch (_error) {
          err = _error;
          console.log("gunfire: " + name + ": update error:", err);
          return;
        }
        if (instance.app == null) {
          instance.app = _this.app;
        }
        if (instance.clientSettings == null) {
          instance.clientSettings = asset.clientSettings;
        }
        instance.prototype = module.exports.prototype;
        instance.clientHash = asset.clientHash;
        instance.clientSettingsHash = asset.clientSettingsHash;
        tweenDuration = _this.app.config.tweenDuration;
        tweenEasing = _this.app.config.tweenEasing;
        instance._update = function(config, opts) {
          var conf;
          if (opts == null) {
            opts = {};
          }
          conf = {};
          if (instance.config != null) {
            conf = instance.config(config);
          } else {
            conf = JSON.parse(JSON.stringify(config));
          }
          if (opts.reset == null) {
            opts.reset = false;
          }
          if (instance.conf == null) {
            instance.conf = conf;
            if (typeof instance.update === "function") {
              instance.update(opts.reset, conf);
            }
            return;
          }
          if ((instance._tween != null) && (instance._tween.stop != null)) {
            instance._tween.stop();
          }
          if (opts.duration == null) {
            opts.duration = tweenDuration;
          }
          if (opts.easing == null) {
            opts.easing = tweenEasing;
          }
          if (opts.duration === 0) {
            instance.conf = conf;
            if (typeof instance.update === "function") {
              instance.update(opts.reset);
            }
            return;
          }
          instance._tween = new TWEEN.Tween(instance.conf).to(conf, opts.duration).easing(opts.tweenEasing);
          if (instance.update != null) {
            instance._tween.onUpdate(function() {
              return instance.update(opts.reset);
            });
          }
          return instance._tween.start();
        };
        console.log("gunfire: " + name + ": calling update on", instance);
        instance._update.call(instance, instance.clientSettings, {
          duration: 0,
          reset: true
        });
        if (name in _this.app.assets) {
          console.log("gunfire: " + name + ": found previous instance");
          if (_this.app.assets[name].free != null) {
            console.log("gunfire: " + name + ": unloading previous instance..");
            try {
              _this.app.assets[name].free();
              delete _this.app.assets[name];
              try {
                namePath = name.split('-');
                tmp = window;
                for (_i = 0, _len = namePath.length; _i < _len; _i++) {
                  item = namePath[_i];
                  tmp = window[item];
                }
                tmp = instance;
              } catch (_error) {
                err2 = _error;
                console.log("gunfire: couldn't create shortcut for " + (name.replace(/-/g, '.')), err2);
              }
            } catch (_error) {
              err = _error;
              console.log("gunfire: " + name + ": cannot overwrite existing instance:", err);
            }
          }
        }
        _this.app.assets[name] = instance;
        console.log("gunfire: " + name + ": updated");
        try {
          namePath = name.split('-');
          tmp = window;
          for (_j = 0, _len1 = namePath.length; _j < _len1; _j++) {
            item = namePath[_j];
            tmp = window[item];
          }
          return tmp = instance;
        } catch (_error) {
          err = _error;
          return console.log("gunfire: couldn't create shortcut for " + (name.replace(/-/g, '.')) + ":", err);
        }
      };
    })(this);
    this.primus.on('data', (function(_this) {
      return function(data) {
        var asset, assetDeleted, assetExists, clientChanged, clientSettingsChanged, name, _ref, _results;
        if (data.pong != null) {
          _ref = data.pong;
          _results = [];
          for (name in _ref) {
            asset = _ref[name];
            clientSettingsChanged = true;
            clientChanged = true;
            assetDeleted = JSON.stringify(asset) === '{}';
            assetExists = name in _this.app.assets;
            if (assetExists) {
              clientSettingsChanged = asset.clientSettingsHash !== _this.app.assets[name].clientSettingsHash;
              clientChanged = asset.clientHash !== _this.app.assets[name].clientHash;
            }
            if (assetExists && assetDeleted) {
              delete _this.app.assets[name];
              continue;
            }
            if (clientChanged) {
              console.log("gunfire: " + name + ": updating client and clientSettings..");
              _results.push(updateAssetClient(name, asset));
            } else if (clientSettingsChanged && !assetExists) {
              console.log("gunfire: " + name + ": also updating client and clientSettings..");
              _results.push(updateAssetClient(name, asset));
            } else if (clientSettingsChanged) {
              console.log("gunfire: " + name + ": updating clientSettings only..");
              _this.app.assets[name].clientSettings = asset.clientSettings;
              _this.app.assets[name].clientSettingsHash = asset.clientSettingsHash;
              _results.push(_this.app.assets[name]._update.call(_this.app.assets[name], _this.app.assets[name].clientSettings, {
                duration: 0,
                reset: true
              }));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      };
    })(this));
    this.primus.on('end', function() {
      return console.log('End:', 'gunfire: the connection has ended.');
    });
    this.primus.on('close', function() {
      return console.log('Close:', 'gunfire: we\'ve lost the connection to the server.');
    });
  }

  Network.prototype.sync = function() {
    var asset, assets, name, _ref;
    assets = {};
    _ref = this.app.assets;
    for (name in _ref) {
      asset = _ref[name];
      assets[name] = {
        clientHash: asset.clientHash,
        clientSettingsHash: asset.clientSettingsHash
      };
    }
    return this.primus.write({
      ping: {
        position: [0, 0, 0],
        range: 10000,
        assets: assets
      }
    });
  };

  return Network;

})();

module.exports = Network;



}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils":5,"tween.js":1}],5:[function(require,module,exports){
"use strict";;
var after, distance, pretty, _base, _base1,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

exports.pretty = pretty = function(obj) {
  return JSON.stringify(obj);
};

exports.distance = distance = function(p1, p2) {
  throw "Not Implemented";
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
};

exports.after = after = function(t, f) {
  return setTimeout(f, t);
};

if ((_base = String.prototype).endsWith == null) {
  _base.endsWith = function(s) {
    return this.length >= s.length && this.substr(this.length - s.length) === s;
  };
}

if ((_base1 = Array.prototype).shuffle == null) {
  _base1.shuffle = function() {
    var i, j, _i, _ref, _ref1;
    for (i = _i = _ref = this.length - 1; _ref <= 1 ? _i <= 1 : _i >= 1; i = _ref <= 1 ? ++_i : --_i) {
      j = Math.floor(Math.random() * (i + 1));
      _ref1 = [this[j], this[i]], this[i] = _ref1[0], this[j] = _ref1[1];
    }
    return this;
  };
}

exports.flatten = function(obj, flat, p) {
  var k, kp, v;
  if (flat == null) {
    flat = {};
  }
  if (p == null) {
    p = '';
  }
  for (k in obj) {
    v = obj[k];
    kp = p + '.' + k;
    if (v === 'object') {
      flatten(v, flat, kp);
    } else {
      flat[kp] = v;
    }
  }
  return flat;
};

exports.unflatten = function(obj) {
  var key, p, res, value;
  res = {};
  for (key in obj) {
    value = obj[key];
    key = key.split('.');
    p = res;
    while (key.length) {
      p = p[key.shift()] = key.length === 1 ? value : {};
    }
  }
  return res;
};

window.debounce = function(func, wait, immediate) {
  var timeout;
  timeout = null;
  return function() {
    var args, callNow, later;
    args = arguments;
    later = (function(_this) {
      return function() {
        timeout = null;
        if (!immediate) {
          return func.apply(_this, args);
        }
      };
    })(this);
    callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      return func.apply(this, args);
    }
  };
};

window.ObjectPoolFactory = (function() {
  function ObjectPoolFactory() {
    this.size = 1000;
    this.buildOptions = {};
    this.geometryFactory = function(opts) {
      throw "missing geometryFactory";
    };
    this.materialFactory = function(geometry, opts) {
      return new THREE.MeshNormalMaterial();
    };
    this.meshFactory = function(geometry, material, opts) {
      return new THREE.Mesh(geometry, material);
    };
    this.objectFactory = function(obj, opts) {
      return obj;
    };
    this.objectDestroyer = function() {};
    this.compiled = false;
    this.connected = false;
    this.objects = [];
  }

  ObjectPoolFactory.prototype.connectTo = function(scene) {
    var obj, _i, _len, _ref;
    console.log("ObjectPoolFactory: addToScene");
    if (this.connected) {
      console.log("ObjectPoolFactory: already added to scene!");
      return;
    }
    this.connected = true;
    this.scene = scene;
    if (!this.compiled) {
      console.log("ObjectPoolFactory: not compiled, compiling..");
      this.compile(true, true, true);
    }
    _ref = this.objects;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      this.scene.add(obj.mesh);
    }
    return this;
  };

  ObjectPoolFactory.prototype.update = function(newConfig) {
    var forceRebuild, rebuild;
    console.log("ObjectPoolFactory.update:", newConfig);
    forceRebuild = false;
    if (newConfig == null) {
      console.log("ObjectPoolFactory.update: called without config of any kind forcing compilation..");
      forceRebuild = true;
      newConfig = {};
    }
    rebuild = {
      size: forceRebuild,
      buildOptions: forceRebuild,
      geometryFactory: forceRebuild,
      materialFactory: forceRebuild,
      meshFactory: forceRebuild,
      objectFactory: forceRebuild,
      compileNeeded: forceRebuild
    };
    if (newConfig.size != null) {
      if (newConfig.size !== this.size) {
        console.log("ObjectPoolFactory.update: size changed");
        this.size = newConfig.size;
        rebuild.size = true;
      }
    }
    if ((newConfig.materialFactory != null) && ("" + newConfig.materialFactory) !== ("" + this.materialFactory)) {
      console.log("ObjectPoolFactory.update: materialFactory changed");
      this.materialFactory = newConfig.materialFactory;
      rebuild.materialFactory = true;
      rebuild.meshFactory = true;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if ((newConfig.geometryFactory != null) && ("" + newConfig.geometryFactory) !== ("" + this.geometryFactory)) {
      console.log("ObjectPoolFactory.update: geometryFactory changed");
      this.geometryFactory = newConfig.geometryFactory;
      rebuild.geometryFactory = true;
      rebuild.meshFactory = true;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if ((newConfig.meshFactory != null) && ("" + newConfig.meshFactory) !== ("" + this.meshFactory)) {
      console.log("ObjectPoolFactory.update: meshFactory changed");
      this.meshFactory = newConfig.meshFactory;
      rebuild.meshFactory = true;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if ((newConfig.objectFactory != null) && ("" + newConfig.objectFactory) !== ("" + this.objectFactory)) {
      console.log("ObjectPoolFactory.update: objectFactory changed");
      this.objectFactory = newConfig.objectFactory;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if ((newConfig.objectDestroyer != null) && ("" + newConfig.objectDestroyer) !== ("" + this.objectDestroyer)) {
      console.log("ObjectPoolFactory.update: objectDestroyer changed");
      this.objectDestroyer = newConfig.objectDestroyer;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if ((newConfig.buildOptions != null) && ("" + (JSON.stringify(newConfig.buildOptions))) !== ("" + (JSON.stringify(this.buildOptions)))) {
      console.log("ObjectPoolFactory.update: buildOptions changed");
      this.buildOptions = newConfig.buildOptions;
      rebuild.buildOptions = true;
      rebuild.geometryFactory = true;
      rebuild.materialFactory = true;
      rebuild.meshFactory = true;
      rebuild.objectFactory = true;
      rebuild.compileNeeded = true;
    }
    if (this.connected && rebuild.compileNeeded) {
      this.compile(rebuild.geometryFactory, rebuild.materialFactory, rebuild.meshFactory);
    }
    return rebuild;
  };

  ObjectPoolFactory.prototype.compile = function(rebuildGeometry, rebuildMaterial, rebuildMesh) {
    var prom, _ref;
    if (rebuildGeometry) {
      console.log("ObjectPoolFactory.compile: disposing of old geometry..");
      if ((_ref = this.geometry) != null) {
        if (typeof _ref.dispose === "function") {
          _ref.dispose();
        }
      }
      console.log("ObjectPoolFactory.compile: building new geometry..");
      prom = this.geometryFactory(this.buildOptions);
      prom((function(_this) {
        return function(geometry) {
          _this.geometry = geometry;
          return _this.afterGeometryUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh);
        };
      })(this));
    } else {
      this.afterGeometryUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh);
    }
    return this;
  };

  ObjectPoolFactory.prototype.afterMeshUpdate = function(rebuildGeometry, rebuildMaterial, rebuildMesh) {
    var len, prom;
    if (this.objects.length >= this.size) {
      console.log("ObjectPoolFactory.compile: no need to resize");
      return this.compiled = true;
    } else {
      len = this.objects.length;
      console.log("ObjectPoolFactory.compile: need to resize from " + len + " to " + this.size);
      prom = this.meshFactory(this.geometry, this.material, this.buildOptions);
      return prom((function(_this) {
        return function(mesh) {
          var i, _i, _ref;
          mesh.visible = false;
          for (i = _i = len, _ref = _this.size; len <= _ref ? _i < _ref : _i > _ref; i = len <= _ref ? ++_i : --_i) {
            if (i > len) {
              mesh = mesh.clone();
            }
            if (_this.connected) {
              _this.scene.add(mesh);
            }
            _this.objects.push({
              mesh: mesh,
              isFree: true
            });
          }
          _this.size = _this.objects.length;
          console.log("ObjectPoolFactory.compile: successfully resized @objects");
          console.log("ObjectPoolFactory.compile: ended");
          return _this.compiled = true;
        };
      })(this));
    }
  };

  ObjectPoolFactory.prototype.afterMaterialUpdate = function(rebuildGeometry, rebuildMaterial, rebuildMesh) {
    var len, obj, _i, _len, _ref;
    if (this.compiled && rebuildMesh) {
      console.log("ObjectPoolFactory.compile: already compiled! migrating content..");
      len = this.objects.length;
      console.log("ObjectPoolFactory.compile: need to recompile " + len + " objects..");
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (this.connected) {
          this.scene.remove(obj.mesh);
        }
        obj.mesh.dispose();
        obj.mesh = this.meshFactory(this.geometry, this.material, this.buildOpts);
        if (this.connected) {
          this.scene.add(obj.mesh);
        }
      }
    }
    return this.afterMeshUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh);
  };

  ObjectPoolFactory.prototype.afterGeometryUpdate = function(rebuildGeometry, rebuildMaterial, rebuildMesh) {
    var prom, _ref, _ref1;
    if (rebuildMaterial) {
      console.log("ObjectPoolFactory.compile: disposing of old material..");
      if ((_ref = this.material) != null) {
        if (typeof _ref.dispose === "function") {
          _ref.dispose();
        }
      }
      if ((_ref1 = this.texture) != null) {
        if (typeof _ref1.dispose === "function") {
          _ref1.dispose();
        }
      }
      console.log("ObjectPoolFactory.compile: building new material..");
      prom = this.materialFactory(this.geometry, this.buildOptions);
      return prom((function(_this) {
        return function(material) {
          _this.material = material;
          return _this.afterMaterialUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh);
        };
      })(this));
    } else {
      return this.afterMaterialUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh);
    }
  };

  ObjectPoolFactory.prototype.getSync = function(opts) {
    var i, obj, objects;
    if (this.objects.length === 0) {
      throw "ObjectPoolFactory: get: cannot get object, collection is empty";
    }
    objects = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = opts.nbInstances; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        obj = this.objects.pop();
        obj.isFree = false;
        this.objectFactory(obj, opts);
        this.objects.unshift(obj);
        _results.push(obj);
      }
      return _results;
    }).call(this);
    return objects;
  };

  ObjectPoolFactory.prototype.getAsync = function(opts, cb) {
    var i, obj, objects;
    if (this.objects.length === 0) {
      throw "ObjectPoolFactory: get: cannot get object, collection is empty";
    }
    objects = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = opts.nbInstances; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        obj = this.objects.pop();
        obj.isFree = false;
        this.objectFactory(obj, opts);
        this.objects.unshift(obj);
        _results.push(obj);
      }
      return _results;
    }).call(this);
    cb(objects);
    return void 0;
  };


  /*
  Free an object, making it available for re-use
  Note: this could be async
   */

  ObjectPoolFactory.prototype.free = function(obj) {
    var index;
    if (typeof obj === 'undefined') {
      throw "NullPointerException: ObjectPoolFactory: free: you tried to free an undefined reference";
    }
    if (obj.isFree) {
      return;
    }
    index = this.objects.indexOf(obj);
    this.objects.splice(index, 1);
    this.objectDestroyer(obj);
    obj.mesh.visible = false;
    obj.isFree = true;
    this.objects.push(obj);
    return obj;
  };

  return ObjectPoolFactory;

})();


/*
Instead of a message/promise queue, we use an issue/proposal pool
An issue pool differs from a message queue:
- the pool has no particular sort dimension, it can use time, or priority etc..
- thus the pool could be split into chunks for parallel processing
- an issue is not just a message, it expect one or more Proposal
- it can accept one or many proposal
- it can reject one or many proposals
 */

window.Market = (function() {
  function Market() {
    this["delete"] = __bind(this["delete"], this);
    this.issuesByTimestamp = [];
    this.issuesByReward = [];
    this.issuesByProduct = {};
    this.dealersByProduct = [];
    this.totalIssues = 0;
  }


  /*
  low-level method
   */

  Market.prototype.lookToBuy = function(userSubmittedIssue) {
    var issue, _base2, _name;
    console.log("Market.submit:", userSubmittedIssue);
    issue = {
      timestamp: +new Date(),
      timeout: Math.abs(userSubmittedIssue.timeout),
      expired: false,
      options: Object.freeze(userSubmittedIssue.options),
      product: "" + userSubmittedIssue.product,
      submitOfferCallback: userSubmittedIssue.callback
    };
    this.issuesByTimestamp.push(issue);
    if ((_base2 = this.issuesByProduct)[_name = issue.product] == null) {
      _base2[_name] = [];
    }
    this.issuesByProduct[issue.product].push(issue);
    this.issuesByReward.push(issue);
    this.issuesByReward.sort(function(a, b) {
      return a.price - b.price;
    });
    this.totalIssues = this.totalIssues + 1;
    console.log("Market.submit: totalIssues: ", this.totalIssues);
    return this;
  };


  /*
  delete an issue
   */

  Market.prototype["delete"] = function(issue) {
    issue.expired = true;
    return this;
  };

  Market.prototype.lookToSell = function(req) {
    var _base2, _name;
    console.log("Market.advertise:", req);
    if ((_base2 = this.dealersByProduct)[_name = req.product] == null) {
      _base2[_name] = [];
    }
    this.dealersByProduct[req.product].push(req.callback);
    return this;
  };


  /*
  called at each frame cycle
   */

  Market.prototype.update = function() {
    var currentTimestamp, dealer, issue, issues, product, _fn, _i, _j, _len, _len1, _ref, _ref1;
    console.log("Market.update:");
    console.log("Market.update: iterating over issues..");
    currentTimestamp = +new Date();
    _ref = this.issuesByProduct;
    for (product in _ref) {
      issues = _ref[product];
      _ref1 = this.dealersByProduct[product];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        dealer = _ref1[_i];
        _fn = function(product, dealer, issue) {
          return after(0, function() {
            return dealer(issue.content, function(salesQuote, buyFunction) {
              if ((salesQuote == null) || (buyFunction != null)) {
                throw "Market.update:    - dealer replied with nothing! it's an error in the dealer's code..";
              }
              console.log("Market.update:    - dealer in category " + product + " has a salesQuote and a buyFunction!");
              return issue.submitOfferCallback(salesQuote, buyFunction, function() {
                console.log("Market.update:    - abandonning future buying order..");
                issue.expired = true;
                return void 0;
              });
            });
          });
        };
        for (_j = 0, _len1 = issues.length; _j < _len1; _j++) {
          issue = issues[_j];
          if (issue.timeout < (currentTimestamp - issue.timestamp)) {
            issue.expired = true;
            this.totalIssues = this.totalIssues - 1;
          }
          if (issue.expired) {
            continue;
          }
          console.log("Market.update: - dealing with issue", issue);
          _fn(product, dealer, issue);
        }
      }
    }
    return this.cleanExpiredIssues();
  };

  Market.prototype.cleanExpiredIssues = function(onComplete) {
    var issue, issues, newArray, product, _ref;
    console.log("Market.cleanExpiredIssues:");
    newArray = (function() {
      var _i, _len, _ref, _results;
      _ref = this.issuesByTimestamp;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        issue = _ref[_i];
        if (issue.expired) {
          continue;
        } else {
          _results.push(issue);
        }
      }
      return _results;
    }).call(this);
    this.issuesByTimestamp = newArray;
    _ref = this.issuesByProduct;
    for (product in _ref) {
      issues = _ref[product];
      newArray = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = issues.length; _i < _len; _i++) {
          issue = issues[_i];
          if (issue.expired) {
            continue;
          } else {
            _results.push(issue);
          }
        }
        return _results;
      })();
      this.issuesByProduct[product] = newArray;
    }
    newArray = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.issuesByReward;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        issue = _ref1[_i];
        if (issue.expired) {
          continue;
        } else {
          _results.push(issue);
        }
      }
      return _results;
    }).call(this);
    this.issuesByReward = newArray;
    console.log("Market.cleanExpiredIssues: new number of isses: " + this.totalIssues);
    return this;
  };

  return Market;

})();



},{}]},{},[2])