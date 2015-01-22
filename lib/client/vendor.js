(function UMDish(name, context, definition) {  context[name] = definition.call(context);  if (typeof module !== "undefined" && module.exports) {    module.exports = context[name];  } else if (typeof define == "function" && define.amd) {    define(function reference() { return context[name]; });  }})("Primus", this, function Primus() {/*globals require, define */
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

/**
 * Context assertion, ensure that some of our public Primus methods are called
 * with the correct context to ensure that
 *
 * @param {Primus} self The context of the function.
 * @param {String} method The method name.
 * @api private
 */
function context(self, method) {
  if (self instanceof Primus) return;

  var failure = new Error('Primus#'+ method + '\'s context should called with a Primus instance');

  if ('function' !== typeof self.listeners || !self.listeners('error').length) {
    throw failure;
  }

  self.emit('error', failure);
}

//
// Sets the default connection URL, it uses the default origin of the browser
// when supported but degrades for older browsers. In Node.js, we cannot guess
// where the user wants to connect to, so we just default to localhost.
//
var defaultUrl;

try {
  if (location.origin) {
    defaultUrl = location.origin;
  } else {
    defaultUrl = location.protocol +'//'+ location.hostname + (location.port ? ':'+ location.port : '');
  }
} catch (e) {
  defaultUrl = 'http://127.0.0.1';
}

/**
 * Primus in a real-time library agnostic framework for establishing real-time
 * connections with servers.
 *
 * Options:
 * - reconnect, configuration for the reconnect process.
 * - manual, don't automatically call `.open` to start the connection.
 * - websockets, force the use of WebSockets, even when you should avoid them.
 * - timeout, connect timeout, server didn't respond in a timely manner.
 * - ping, The heartbeat interval for sending a ping packet to the server.
 * - pong, The heartbeat timeout for receiving a response to the ping.
 * - network, Use network events as leading method for network connection drops.
 * - strategy, Reconnection strategies.
 * - transport, Transport options.
 * - url, uri, The URL to use connect with the server.
 *
 * @constructor
 * @param {String} url The URL of your server.
 * @param {Object} options The configuration.
 * @api public
 */
function Primus(url, options) {
  if (!(this instanceof Primus)) return new Primus(url, options);
  if ('function' !== typeof this.client) {
    var message = 'The client library has not been compiled correctly, ' +
      'see https://github.com/primus/primus#client-library for more details';
    return this.critical(new Error(message));
  }

  if ('object' === typeof url) {
    options = url;
    url = options.url || options.uri || defaultUrl;
  } else {
    options = options || {};
  }

  var primus = this;

  // The maximum number of messages that can be placed in queue.
  options.queueSize = 'queueSize' in options ? options.queueSize : Infinity;

  // Connection timeout duration.
  options.timeout = 'timeout' in options ? options.timeout : 10e3;

  // Stores the back off configuration.
  options.reconnect = 'reconnect' in options ? options.reconnect : {};

  // Heartbeat ping interval.
  options.ping = 'ping' in options ? options.ping : 25000;

  // Heartbeat pong response timeout.
  options.pong = 'pong' in options ? options.pong : 10e3;

  // Reconnect strategies.
  options.strategy = 'strategy' in options ? options.strategy : [];

  // Custom transport options.
  options.transport = 'transport' in options ? options.transport : {};

  primus.buffer = [];                           // Stores premature send data.
  primus.writable = true;                       // Silly stream compatibility.
  primus.readable = true;                       // Silly stream compatibility.
  primus.url = primus.parse(url || defaultUrl); // Parse the URL to a readable format.
  primus.readyState = Primus.CLOSED;            // The readyState of the connection.
  primus.options = options;                     // Reference to the supplied options.
  primus.timers = {};                           // Contains all our timers.
  primus.attempt = null;                        // Current back off attempt.
  primus.socket = null;                         // Reference to the internal connection.
  primus.latency = 0;                           // Latency between messages.
  primus.stamps = 0;                            // Counter to make timestamps unqiue.
  primus.disconnect = false;                    // Did we receive a disconnect packet?
  primus.transport = options.transport;         // Transport options.
  primus.transformers = {                       // Message transformers.
    outgoing: [],
    incoming: []
  };

  //
  // Parse the reconnection strategy. It can have the following strategies:
  //
  // - timeout: Reconnect when we have a network timeout.
  // - disconnect: Reconnect when we have an unexpected disconnect.
  // - online: Reconnect when we're back online.
  //
  if ('string' === typeof options.strategy) {
    options.strategy = options.strategy.split(/\s?\,\s?/g);
  }

  if (false === options.strategy) {
    //
    // Strategies are disabled, but we still need an empty array to join it in
    // to nothing.
    //
    options.strategy = [];
  } else if (!options.strategy.length) {
    options.strategy.push('disconnect', 'online');

    //
    // Timeout based reconnection should only be enabled conditionally. When
    // authorization is enabled it could trigger.
    //
    if (!this.authorization) options.strategy.push('timeout');
  }

  options.strategy = options.strategy.join(',').toLowerCase();

  //
  // Only initialise the EventEmitter interface if we're running in a plain
  // browser environment. The Stream interface is inherited differently when it
  // runs on browserify and on Node.js.
  //
  if (!Stream) EventEmitter.call(primus);

  //
  // Force the use of WebSockets, even when we've detected some potential
  // broken WebSocket implementation.
  //
  if ('websockets' in options) {
    primus.AVOID_WEBSOCKETS = !options.websockets;
  }

  //
  // Force or disable the use of NETWORK events as leading client side
  // disconnection detection.
  //
  if ('network' in options) {
    primus.NETWORK_EVENTS = options.network;
  }

  //
  // Check if the user wants to manually initialise a connection. If they don't,
  // we want to do it after a really small timeout so we give the users enough
  // time to listen for `error` events etc.
  //
  if (!options.manual) primus.timers.open = setTimeout(function open() {
    primus.clearTimeout('open').open();
  }, 0);

  primus.initialise(options);
}

/**
 * Simple require wrapper to make browserify, node and require.js play nice.
 *
 * @param {String} name The module to require.
 * @returns {Object|Undefined} The module that we required.
 * @api private
 */
Primus.require = function requires(name) {
  if ('function' !== typeof require) return undefined;

  return !('function' === typeof define && define.amd)
    ? require(name)
    : undefined;
};

//
// It's possible that we're running in Node.js or in a Node.js compatible
// environment such as browserify. In these cases we want to use some build in
// libraries to minimize our dependence on the DOM.
//
var Stream, parse;

try {
  Primus.Stream = Stream = Primus.require('stream');
  parse = Primus.require('url').parse;

  //
  // Normally inheritance is done in the same way as we do in our catch
  // statement. But due to changes to the EventEmitter interface in Node 0.10
  // this will trigger annoying memory leak warnings and other potential issues
  // outlined in the issue linked below.
  //
  // @see https://github.com/joyent/node/issues/4971
  //
  Primus.require('util').inherits(Primus, Stream);
} catch (e) {
  Primus.Stream = EventEmitter;
  Primus.prototype = new EventEmitter();

  //
  // In the browsers we can leverage the DOM to parse the URL for us. It will
  // automatically default to host of the current server when we supply it path
  // etc.
  //
  parse = function parse(url) {
    var a = document.createElement('a')
      , data = {}
      , key;

    a.href = url;

    //
    // Transform it from a readOnly object to a read/writable object so we can
    // change some parsed values. This is required if we ever want to override
    // a port number etc. (as browsers remove port 443 and 80 from the URL's).
    //
    for (key in a) {
      if ('string' === typeof a[key] || 'number' === typeof a[key]) {
        data[key] = a[key];
      }
    }

    //
    // We need to make sure that the URL is properly encoded because IE doesn't
    // do this automatically.
    //
    data.href = encodeURI(decodeURI(data.href));

    //
    // If we don't obtain a port number (e.g. when using zombie) then try
    // and guess at a value from the 'href' value.
    //
    if (!data.port) {
      var splits = (data.href || '').split('/');
      if (splits.length > 2) {
        var host = splits[2]
          , atSignIndex = host.lastIndexOf('@');

        if (~atSignIndex) host = host.slice(atSignIndex + 1);

        splits = host.split(':');
        if (splits.length === 2) data.port = splits[1];
      }
    }

    //
    // IE quirk: The `protocol` is parsed as ":" or "" when a protocol agnostic
    // URL is used. In this case we extract the value from the `href` value.
    //
    if (!data.protocol || ':' === data.protocol) {
      data.protocol = data.href.substr(0, data.href.indexOf(':') + 1);
    }

    //
    // Safari 5.1.7 (windows) quirk: When parsing a URL without a port number
    // the `port` in the data object will default to "0" instead of the expected
    // "". We're going to do an explicit check on "0" and force it to "".
    //
    if ('0' === data.port) data.port = '';

    //
    // Browsers do not parse authorization information, so we need to extract
    // that from the URL.
    //
    if (~data.href.indexOf('@') && !data.auth) {
      var start = data.protocol.length + 2;
      data.auth = data.href.slice(start, data.href.indexOf(data.pathname, start)).split('@')[0];
    }

    return data;
  };
}

/**
 * Primus readyStates, used internally to set the correct ready state.
 *
 * @type {Number}
 * @private
 */
Primus.OPENING = 1;   // We're opening the connection.
Primus.CLOSED  = 2;   // No active connection.
Primus.OPEN    = 3;   // The connection is open.

/**
 * Are we working with a potentially broken WebSockets implementation? This
 * boolean can be used by transformers to remove `WebSockets` from their
 * supported transports.
 *
 * @type {Boolean}
 * @private
 */
Primus.prototype.AVOID_WEBSOCKETS = false;

/**
 * Some browsers support registering emitting `online` and `offline` events when
 * the connection has been dropped on the client. We're going to detect it in
 * a simple `try {} catch (e) {}` statement so we don't have to do complicated
 * feature detection.
 *
 * @type {Boolean}
 * @private
 */
Primus.prototype.NETWORK_EVENTS = false;
Primus.prototype.online = true;

try {
  if (
       Primus.prototype.NETWORK_EVENTS = 'onLine' in navigator
    && (window.addEventListener || document.body.attachEvent)
  ) {
    if (!navigator.onLine) {
      Primus.prototype.online = false;
    }
  }
} catch (e) { }

/**
 * The Ark contains all our plugins definitions. It's namespaced by
 * name => plugin.
 *
 * @type {Object}
 * @private
 */
Primus.prototype.ark = {};

/**
 * Return the given plugin.
 *
 * @param {String} name The name of the plugin.
 * @returns {Object|undefined} The plugin or undefined.
 * @api public
 */
Primus.prototype.plugin = function plugin(name) {
  context(this, 'plugin');

  if (name) return this.ark[name];

  var plugins = {};

  for (name in this.ark) {
    plugins[name] = this.ark[name];
  }

  return plugins;
};

/**
 * Checks if the given event is an emitted event by Primus.
 *
 * @param {String} evt The event name.
 * @returns {Boolean} Indication of the event is reserved for internal use.
 * @api public
 */
Primus.prototype.reserved = function reserved(evt) {
  return (/^(incoming|outgoing)::/).test(evt)
  || evt in this.reserved.events;
};

/**
 * The actual events that are used by the client.
 *
 * @type {Object}
 * @public
 */
Primus.prototype.reserved.events = {
  readyStateChange: 1,
  reconnecting: 1,
  reconnected: 1,
  reconnect: 1,
  offline: 1,
  timeout: 1,
  online: 1,
  error: 1,
  close: 1,
  open: 1,
  data: 1,
  end: 1
};

/**
 * Initialise the Primus and setup all parsers and internal listeners.
 *
 * @param {Object} options The original options object.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.initialise = function initialise(options) {
  var primus = this
    , start;

  primus.on('outgoing::open', function opening() {
    var readyState = primus.readyState;

    primus.readyState = Primus.OPENING;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'opening');
    }

    start = +new Date();
  });

  primus.on('incoming::open', function opened() {
    var readyState = primus.readyState
      , reconnect = primus.attempt;

    if (primus.attempt) primus.attempt = null;

    //
    // The connection has been openend so we should set our state to
    // (writ|read)able so our stream compatibility works as intended.
    //
    primus.writable = true;
    primus.readable = true;

    //
    // Make sure we are flagged as `online` as we've successfully opened the
    // connection.
    //
    if (!primus.online) {
      primus.online = true;
      primus.emit('online');
    }

    primus.readyState = Primus.OPEN;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'open');
    }

    primus.latency = +new Date() - start;

    primus.emit('open');
    if (reconnect) primus.emit('reconnected');

    primus.clearTimeout('ping', 'pong').heartbeat();

    if (primus.buffer.length) {
      var data = primus.buffer.slice()
        , length = data.length
        , i = 0;

      primus.buffer.length = 0;

      for (; i < length; i++) {
        primus._write(data[i]);
      }
    }
  });

  primus.on('incoming::pong', function pong(time) {
    primus.online = true;
    primus.clearTimeout('pong').heartbeat();

    primus.latency = (+new Date()) - time;
  });

  primus.on('incoming::error', function error(e) {
    var connect = primus.timers.connect
      , err = e;

    //
    // We're still doing a reconnect attempt, it could be that we failed to
    // connect because the server was down. Failing connect attempts should
    // always emit an `error` event instead of a `open` event.
    //
    if (primus.attempt) return primus.reconnect();

    //
    // When the error is not an Error instance we try to normalize it.
    //
    if ('string' === typeof e) {
      err = new Error(e);
    } else if (!(e instanceof Error) && 'object' === typeof e) {
      //
      // BrowserChannel and SockJS returns an object which contains some
      // details of the error. In order to have a proper error we "copy" the
      // details in an Error instance.
      //
      err = new Error(e.message || e.reason);
      for (var key in e) {
        if (e.hasOwnProperty(key)) err[key] = e[key];
      }
    }
    if (primus.listeners('error').length) primus.emit('error', err);

    //
    // We received an error while connecting, this most likely the result of an
    // unauthorized access to the server.
    //
    if (connect) {
      if (~primus.options.strategy.indexOf('timeout')) primus.reconnect();
      else primus.end();
    }
  });

  primus.on('incoming::data', function message(raw) {
    primus.decoder(raw, function decoding(err, data) {
      //
      // Do a "save" emit('error') when we fail to parse a message. We don't
      // want to throw here as listening to errors should be optional.
      //
      if (err) return primus.listeners('error').length && primus.emit('error', err);

      //
      // Handle all "primus::" prefixed protocol messages.
      //
      if (primus.protocol(data)) return;
      primus.transforms(primus, primus, 'incoming', data, raw);
    });
  });

  primus.on('incoming::end', function end() {
    var readyState = primus.readyState;

    //
    // This `end` started with the receiving of a primus::server::close packet
    // which indicated that the user/developer on the server closed the
    // connection and it was not a result of a network disruption. So we should
    // kill the connection without doing a reconnect.
    //
    if (primus.disconnect) {
      primus.disconnect = false;
      return primus.end();
    }

    //
    // Always set the readyState to closed, and if we're still connecting, close
    // the connection so we're sure that everything after this if statement block
    // is only executed because our readyState is set to `open`.
    //
    primus.readyState = Primus.CLOSED;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'end');
    }

    if (primus.timers.connect) primus.end();
    if (readyState !== Primus.OPEN) {
      return primus.attempt ? primus.reconnect() : false;
    }

    this.writable = false;
    this.readable = false;

    //
    // Clear all timers in case we're not going to reconnect.
    //
    for (var timeout in this.timers) {
      this.clearTimeout(timeout);
    }

    //
    // Fire the `close` event as an indication of connection disruption.
    // This is also fired by `primus#end` so it is emitted in all cases.
    //
    primus.emit('close');

    //
    // The disconnect was unintentional, probably because the server has
    // shutdown, so if the reconnection is enabled start a reconnect procedure.
    //
    if (~primus.options.strategy.indexOf('disconnect')) {
      return primus.reconnect();
    }

    primus.emit('outgoing::end');
    primus.emit('end');
  });

  //
  // Setup the real-time client.
  //
  primus.client();

  //
  // Process the potential plugins.
  //
  for (var plugin in primus.ark) {
    primus.ark[plugin].call(primus, primus, options);
  }

  //
  // NOTE: The following code is only required if we're supporting network
  // events as it requires access to browser globals.
  //
  if (!primus.NETWORK_EVENTS) return primus;

  /**
   * Handler for offline notifications.
   *
   * @api private
   */
  function offline() {
    if (!primus.online) return; // Already or still offline, bailout.

    primus.online = false;
    primus.emit('offline');
    primus.end();

    //
    // It is certainly possible that we're in a reconnection loop and that the
    // user goes offline. In this case we want to kill the existing attempt so
    // when the user goes online, it will attempt to reconnect freshly again.
    //
    primus.clearTimeout('reconnect');
    primus.attempt = null;
  }

  /**
   * Handler for online notifications.
   *
   * @api private
   */
  function online() {
    if (primus.online) return; // Already or still online, bailout

    primus.online = true;
    primus.emit('online');

    if (~primus.options.strategy.indexOf('online')) primus.reconnect();
  }

  if (window.addEventListener) {
    window.addEventListener('offline', offline, false);
    window.addEventListener('online', online, false);
  } else if (document.body.attachEvent){
    document.body.attachEvent('onoffline', offline);
    document.body.attachEvent('ononline', online);
  }

  return primus;
};

/**
 * Really dead simple protocol parser. We simply assume that every message that
 * is prefixed with `primus::` could be used as some sort of protocol definition
 * for Primus.
 *
 * @param {String} msg The data.
 * @returns {Boolean} Is a protocol message.
 * @api private
 */
Primus.prototype.protocol = function protocol(msg) {
  if (
       'string' !== typeof msg
    || msg.indexOf('primus::') !== 0
  ) return false;

  var last = msg.indexOf(':', 8)
    , value = msg.slice(last + 2);

  switch (msg.slice(8,  last)) {
    case 'pong':
      this.emit('incoming::pong', value);
    break;

    case 'server':
      //
      // The server is closing the connection, forcefully disconnect so we don't
      // reconnect again.
      //
      if ('close' === value) {
        this.disconnect = true;
      }
    break;

    case 'id':
      this.emit('incoming::id', value);
    break;

    //
    // Unknown protocol, somebody is probably sending `primus::` prefixed
    // messages.
    //
    default:
      return false;
  }

  return true;
};

/**
 * Execute the set of message transformers from Primus on the incoming or
 * outgoing message.
 * This function and it's content should be in sync with Spark#transforms in
 * spark.js.
 *
 * @param {Primus} primus Reference to the Primus instance with message transformers.
 * @param {Spark|Primus} connection Connection that receives or sends data.
 * @param {String} type The type of message, 'incoming' or 'outgoing'.
 * @param {Mixed} data The data to send or that has been received.
 * @param {String} raw The raw encoded data.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.transforms = function transforms(primus, connection, type, data, raw) {
  var packet = { data: data }
    , fns = primus.transformers[type];

  //
  // Iterate in series over the message transformers so we can allow optional
  // asynchronous execution of message transformers which could for example
  // retrieve additional data from the server, do extra decoding or even
  // message validation.
  //
  (function transform(index, done) {
    var transformer = fns[index++];

    if (!transformer) return done();

    if (1 === transformer.length) {
      if (false === transformer.call(connection, packet)) {
        //
        // When false is returned by an incoming transformer it means that's
        // being handled by the transformer and we should not emit the `data`
        // event.
        //
        return;
      }

      return transform(index, done);
    }

    transformer.call(connection, packet, function finished(err, arg) {
      if (err) return connection.emit('error', err);
      if (false === arg) return;

      transform(index, done);
    });
  }(0, function done() {
    //
    // We always emit 2 arguments for the data event, the first argument is the
    // parsed data and the second argument is the raw string that we received.
    // This allows you, for example, to do some validation on the parsed data
    // and then save the raw string in your database without the stringify
    // overhead.
    //
    if ('incoming' === type) return connection.emit('data', packet.data, raw);

    connection._write(packet.data);
  }));

  return this;
};

/**
 * Retrieve the current id from the server.
 *
 * @param {Function} fn Callback function.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.id = function id(fn) {
  if (this.socket && this.socket.id) return fn(this.socket.id);

  this._write('primus::id::');
  return this.once('incoming::id', fn);
};

/**
 * Establish a connection with the server. When this function is called we
 * assume that we don't have any open connections. If you do call it when you
 * have a connection open, it could cause duplicate connections.
 *
 * @returns {Primus}
 * @api public
 */
Primus.prototype.open = function open() {
  context(this, 'open');

  //
  // Only start a `connection timeout` procedure if we're not reconnecting as
  // that shouldn't count as an initial connection. This should be started
  // before the connection is opened to capture failing connections and kill the
  // timeout.
  //
  if (!this.attempt && this.options.timeout) this.timeout();

  this.emit('outgoing::open');
  return this;
};

/**
 * Send a new message.
 *
 * @param {Mixed} data The data that needs to be written.
 * @returns {Boolean} Always returns true as we don't support back pressure.
 * @api public
 */
Primus.prototype.write = function write(data) {
  context(this, 'write');
  this.transforms(this, this, 'outgoing', data);

  return true;
};

/**
 * The actual message writer.
 *
 * @param {Mixed} data The message that needs to be written.
 * @returns {Boolean} Successful write to the underlaying transport.
 * @api private
 */
Primus.prototype._write = function write(data) {
  var primus = this;

  //
  // The connection is closed, normally this would already be done in the
  // `spark.write` method, but as `_write` is used internally, we should also
  // add the same check here to prevent potential crashes by writing to a dead
  // socket.
  //
  if (Primus.OPEN !== primus.readyState) {
    //
    // If the buffer is at capacity, remove the first item.
    //
    if (this.buffer.length === this.options.queueSize) {
      this.buffer.splice(0, 1);
    }

    this.buffer.push(data);
    return false;
  }

  primus.encoder(data, function encoded(err, packet) {
    //
    // Do a "save" emit('error') when we fail to parse a message. We don't
    // want to throw here as listening to errors should be optional.
    //
    if (err) return primus.listeners('error').length && primus.emit('error', err);
    primus.emit('outgoing::data', packet);
  });

  return true;
};

/**
 * Send a new heartbeat over the connection to ensure that we're still
 * connected and our internet connection didn't drop. We cannot use server side
 * heartbeats for this unfortunately.
 *
 * @returns {Primus}
 * @api private
 */
Primus.prototype.heartbeat = function heartbeat() {
  var primus = this;

  if (!primus.options.ping) return primus;

  /**
   * Exterminate the connection as we've timed out.
   *
   * @api private
   */
  function pong() {
    primus.clearTimeout('pong');

    //
    // The network events already captured the offline event.
    //
    if (!primus.online) return;

    primus.online = false;
    primus.emit('offline');
    primus.emit('incoming::end');
  }

  /**
   * We should send a ping message to the server.
   *
   * @api private
   */
  function ping() {
    var value = +new Date();

    primus.clearTimeout('ping')._write('primus::ping::'+ value);
    primus.emit('outgoing::ping', value);
    primus.timers.pong = setTimeout(pong, primus.options.pong);
  }

  primus.timers.ping = setTimeout(ping, primus.options.ping);
  return this;
};

/**
 * Start a connection timeout.
 *
 * @returns {Primus}
 * @api private
 */
Primus.prototype.timeout = function timeout() {
  var primus = this;

  /**
   * Remove all references to the timeout listener as we've received an event
   * that can be used to determine state.
   *
   * @api private
   */
  function remove() {
    primus.removeListener('error', remove)
          .removeListener('open', remove)
          .removeListener('end', remove)
          .clearTimeout('connect');
  }

  primus.timers.connect = setTimeout(function expired() {
    remove(); // Clean up old references.

    if (primus.readyState === Primus.OPEN || primus.attempt) return;

    primus.emit('timeout');

    //
    // We failed to connect to the server.
    //
    if (~primus.options.strategy.indexOf('timeout')) primus.reconnect();
    else primus.end();
  }, primus.options.timeout);

  return primus.on('error', remove)
    .on('open', remove)
    .on('end', remove);
};

/**
 * Properly clean up all `setTimeout` references.
 *
 * @param {String} ..args.. The names of the timeout's we need clear.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.clearTimeout = function clear() {
  for (var args = arguments, i = 0, l = args.length; i < l; i++) {
    if (this.timers[args[i]]) clearTimeout(this.timers[args[i]]);
    delete this.timers[args[i]];
  }

  return this;
};

/**
 * Exponential back off algorithm for retry operations. It uses an randomized
 * retry so we don't DDOS our server when it goes down under pressure.
 *
 * @param {Function} callback Callback to be called after the timeout.
 * @param {Object} opts Options for configuring the timeout.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.backoff = function backoff(callback, opts) {
  opts = opts || {};

  var primus = this;

  //
  // Bailout when we already have a backoff process running. We shouldn't call
  // the callback then as it might cause an unexpected `end` event as another
  // reconnect process is already running.
  //
  if (opts.backoff) return primus;

  opts.maxDelay = 'maxDelay' in opts ? opts.maxDelay : Infinity;  // Maximum delay.
  opts.minDelay = 'minDelay' in opts ? opts.minDelay : 500;       // Minimum delay.
  opts.retries = 'retries' in opts ? opts.retries : 10;           // Allowed retries.
  opts.attempt = (+opts.attempt || 0) + 1;                        // Current attempt.
  opts.factor = 'factor' in opts ? opts.factor : 2;               // Back off factor.

  //
  // Bailout if we are about to make to much attempts. Please note that we use
  // `>` because we already incremented the value above.
  //
  if (opts.attempt > opts.retries) {
    callback(new Error('Unable to retry'), opts);
    return primus;
  }

  //
  // Prevent duplicate back off attempts using the same options object.
  //
  opts.backoff = true;

  //
  // Calculate the timeout, but make it randomly so we don't retry connections
  // at the same interval and defeat the purpose. This exponential back off is
  // based on the work of:
  //
  // http://dthain.blogspot.nl/2009/02/exponential-backoff-in-distributed.html
  //
  opts.timeout = opts.attempt !== 1
    ? Math.min(Math.round(
        (Math.random() + 1) * opts.minDelay * Math.pow(opts.factor, opts.attempt)
      ), opts.maxDelay)
    : opts.minDelay;

  primus.timers.reconnect = setTimeout(function delay() {
    opts.backoff = false;
    primus.clearTimeout('reconnect');

    callback(undefined, opts);
  }, opts.timeout);

  //
  // Emit a `reconnecting` event with current reconnect options. This allows
  // them to update the UI and provide their users with feedback.
  //
  primus.emit('reconnecting', opts);

  return primus;
};

/**
 * Start a new reconnect procedure.
 *
 * @returns {Primus}
 * @api private
 */
Primus.prototype.reconnect = function reconnect() {
  var primus = this;

  //
  // Try to re-use the existing attempt.
  //
  primus.attempt = primus.attempt || primus.clone(primus.options.reconnect);

  primus.backoff(function attempt(fail, backoff) {
    if (fail) {
      primus.attempt = null;
      return primus.emit('end');
    }

    //
    // Try to re-open the connection again.
    //
    primus.emit('reconnect', backoff);
    primus.emit('outgoing::reconnect');
  }, primus.attempt);

  return primus;
};

/**
 * Close the connection completely.
 *
 * @param {Mixed} data last packet of data.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.end = function end(data) {
  context(this, 'end');

  if (this.readyState === Primus.CLOSED && !this.timers.connect) {
    //
    // If we are reconnecting stop the reconnection procedure.
    //
    if (this.timers.reconnect) {
      this.clearTimeout('reconnect');
      this.attempt = null;
      this.emit('end');
    }

    return this;
  }

  if (data !== undefined) this.write(data);

  this.writable = false;
  this.readable = false;

  var readyState = this.readyState;
  this.readyState = Primus.CLOSED;

  if (readyState !== this.readyState) {
    this.emit('readyStateChange', 'end');
  }

  for (var timeout in this.timers) {
    this.clearTimeout(timeout);
  }

  this.emit('outgoing::end');
  this.emit('close');
  this.emit('end');

  return this;
};

/**
 * Create a shallow clone of a given object.
 *
 * @param {Object} obj The object that needs to be cloned.
 * @returns {Object} Copy.
 * @api private
 */
Primus.prototype.clone = function clone(obj) {
  return this.merge({}, obj);
};

/**
 * Merge different objects in to one target object.
 *
 * @param {Object} target The object where everything should be merged in.
 * @returns {Object} Original target with all merged objects.
 * @api private
 */
Primus.prototype.merge = function merge(target) {
  var args = Array.prototype.slice.call(arguments, 1);

  for (var i = 0, l = args.length, key, obj; i < l; i++) {
    obj = args[i];

    for (key in obj) {
      if (obj.hasOwnProperty(key)) target[key] = obj[key];
    }
  }

  return target;
};

/**
 * Parse the connection string.
 *
 * @type {Function}
 * @param {String} url Connection URL.
 * @returns {Object} Parsed connection.
 * @api private
 */
Primus.prototype.parse = parse;

/**
 * Parse a query string.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object} Parsed query string.
 * @api private
 */
Primus.prototype.querystring = function querystring(query) {
  var parser = /([^=?&]+)=([^&]*)/g
    , result = {}
    , part;

  //
  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
  // the lastIndex property so we can continue executing this loop until we've
  // parsed all results.
  //
  for (;
    part = parser.exec(query);
    result[decodeURIComponent(part[1])] = decodeURIComponent(part[2])
  );

  return result;
};

/**
 * Transform a query string object back in to string equiv.
 *
 * @param {Object} obj The query string object.
 * @returns {String}
 * @api private
 */
Primus.prototype.querystringify = function querystringify(obj) {
  var pairs = [];

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
    }
  }

  return pairs.join('&');
};

/**
 * Generates a connection URI.
 *
 * @param {String} protocol The protocol that should used to crate the URI.
 * @returns {String|options} The URL.
 * @api private
 */
Primus.prototype.uri = function uri(options) {
  var url = this.url
    , server = []
    , qsa = false;

  //
  // Query strings are only allowed when we've received clearance for it.
  //
  if (options.query) qsa = true;

  options = options || {};
  options.protocol = 'protocol' in options ? options.protocol : 'http';
  options.query = url.search && 'query' in options ? (url.search.charAt(0) === '?' ? url.search.slice(1) : url.search) : false;
  options.secure = 'secure' in options ? options.secure : (url.protocol === 'https:' || url.protocol === 'wss:');
  options.auth = 'auth' in options ? options.auth : url.auth;
  options.pathname = 'pathname' in options ? options.pathname : this.pathname.slice(1);
  options.port = 'port' in options ? +options.port : +url.port || (options.secure ? 443 : 80);
  options.host = 'host' in options ? options.host : url.hostname || url.host.replace(':'+ url.port, '');

  //
  // Allow transformation of the options before we construct a full URL from it.
  //
  this.emit('outgoing::url', options);

  //
  // `url.host` might be undefined (e.g. when using zombie) so we use the
  // hostname and port defined above.
  //
  var host = (443 !== options.port && 80 !== options.port)
    ? options.host +':'+ options.port
    : options.host;

  //
  // We need to make sure that we create a unique connection URL every time to
  // prevent bfcache back forward cache of becoming an issue. We're doing this
  // by forcing an cache busting query string in to the URL.
  //
  var querystring = this.querystring(options.query || '');
  querystring._primuscb = +new Date() +'-'+ this.stamps++;
  options.query = this.querystringify(querystring);

  //
  // Automatically suffix the protocol so we can supply `ws` and `http` and it gets
  // transformed correctly.
  //
  server.push(options.secure ? options.protocol +'s:' : options.protocol +':', '');

  if (options.auth) server.push(options.auth +'@'+ host);
  else server.push(host);

  //
  // Pathnames are optional as some Transformers would just use the pathname
  // directly.
  //
  if (options.pathname) server.push(options.pathname);

  //
  // Optionally add a search query, again, not supported by all Transformers.
  // SockJS is known to throw errors when a query string is included.
  //
  if (qsa) server.push('?'+ options.query);
  else delete options.query;

  if (options.object) return options;
  return server.join('/');
};

/**
 * Simple emit wrapper that returns a function that emits an event once it's
 * called. This makes it easier for transports to emit specific events. The
 * scope of this function is limited as it will only emit one single argument.
 *
 * @param {String} event Name of the event that we should emit.
 * @param {Function} parser Argument parser.
 * @returns {Function} The wrapped function that will emit events when called.
 * @api public
 */
Primus.prototype.emits = function emits(event, parser) {
  var primus = this;

  return function emit(arg) {
    var data = parser ? parser.apply(primus, arguments) : arg;

    //
    // Timeout is required to prevent crashes on WebSockets connections on
    // mobile devices. We need to handle these edge cases in our own library
    // as we cannot be certain that all frameworks fix these issues.
    //
    setTimeout(function timeout() {
      primus.emit('incoming::'+ event, data);
    }, 0);
  };
};

/**
 * Register a new message transformer. This allows you to easily manipulate incoming
 * and outgoing data which is particularity handy for plugins that want to send
 * meta data together with the messages.
 *
 * @param {String} type Incoming or outgoing
 * @param {Function} fn A new message transformer.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.transform = function transform(type, fn) {
  context(this, 'transform');

  if (!(type in this.transformers)) {
    return this.critical(new Error('Invalid transformer type'));
  }

  this.transformers[type].push(fn);
  return this;
};

/**
 * A critical error has occurred, if we have an `error` listener, emit it there.
 * If not, throw it, so we get a stack trace + proper error message.
 *
 * @param {Error} err The critical error.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.critical = function critical(err) {
  if (this.listeners('error').length) {
    this.emit('error', err);
    return this;
  }

  throw err;
};

/**
 * Syntax sugar, adopt a Socket.IO like API.
 *
 * @param {String} url The URL we want to connect to.
 * @param {Object} options Connection options.
 * @returns {Primus}
 * @api public
 */
Primus.connect = function connect(url, options) {
  return new Primus(url, options);
};

//
// Expose the EventEmitter so it can be re-used by wrapping libraries we're also
// exposing the Stream interface.
//
Primus.EventEmitter = EventEmitter;

//
// These libraries are automatically are automatically inserted at the
// server-side using the Primus#library method.
//
Primus.prototype.client = function client() {
  var primus = this
    , socket;

  //
  // Select an available WebSocket factory.
  //
  var Factory = (function factory() {
    if ('undefined' !== typeof WebSocket) return WebSocket;
    if ('undefined' !== typeof MozWebSocket) return MozWebSocket;

    try { return Primus.require('ws'); }
    catch (e) {}

    return undefined;
  })();

  if (!Factory) return primus.critical(new Error(
    'Missing required `ws` module. Please run `npm install --save ws`'
  ));


  //
  // Connect to the given URL.
  //
  primus.on('outgoing::open', function opening() {
    primus.emit('outgoing::end');

    //
    // FireFox will throw an error when we try to establish a connection from
    // a secure page to an unsecured WebSocket connection. This is inconsistent
    // behaviour between different browsers. This should ideally be solved in
    // Primus when we connect.
    //
    try {
      var prot = primus.url.protocol === 'ws+unix:' ? 'ws+unix' : 'ws'
        , qsa = prot === 'ws';

      //
      // Only allow primus.transport object in Node.js, it will throw in
      // browsers with a TypeError if we supply to much arguments.
      //
      if (Factory.length === 3) {
        primus.socket = socket = new Factory(
          primus.uri({ protocol: prot, query: qsa }),   // URL
          [],                                           // Sub protocols
          primus.transport                              // options.
        );
      } else {
        primus.socket = socket = new Factory(primus.uri({
          protocol: prot,
          query: qsa
        }));
      }
    } catch (e) { return primus.emit('error', e); }

    //
    // Setup the Event handlers.
    //
    socket.binaryType = 'arraybuffer';
    socket.onopen = primus.emits('open');
    socket.onerror = primus.emits('error');
    socket.onclose = primus.emits('end');
    socket.onmessage = primus.emits('data', function parse(evt) {
      return evt.data;
    });
  });

  //
  // We need to write a new message to the socket.
  //
  primus.on('outgoing::data', function write(message) {
    if (!socket || socket.readyState !== Factory.OPEN) return;

    try { socket.send(message); }
    catch (e) { primus.emit('incoming::error', e); }
  });

  //
  // Attempt to reconnect the socket.
  //
  primus.on('outgoing::reconnect', function reconnect() {
    primus.emit('outgoing::open');
  });

  //
  // We need to close the socket.
  //
  primus.on('outgoing::end', function close() {
    if (!socket) return;

    socket.onerror = socket.onopen = socket.onclose = socket.onmessage = function () {};
    socket.close();
    socket = null;
  });
};
Primus.prototype.authorization = false;
Primus.prototype.pathname = "/primus";
Primus.prototype.encoder = function encoder(data, fn) {
  var err;

  try { data = JSON.stringify(data); }
  catch (e) { err = e; }

  fn(err, data);
};
Primus.prototype.decoder = function decoder(data, fn) {
  var err;

  if ('string' !== typeof data) return fn(err, data);

  try { data = JSON.parse(data); }
  catch (e) { err = e; }

  fn(err, data);
};
Primus.prototype.version = "2.4.12";

//
// Hack 1: \u2028 and \u2029 are allowed inside string in JSON. But JavaScript
// defines them as newline separators. Because no literal newlines are allowed
// in a string this causes a ParseError. We work around this issue by replacing
// these characters with a properly escaped version for those chars. This can
// cause errors with JSONP requests or if the string is just evaluated.
//
// This could have been solved by replacing the data during the "outgoing::data"
// event. But as it affects the JSON encoding in general I've opted for a global
// patch instead so all JSON.stringify operations are save.
//
if (
    'object' === typeof JSON
 && 'function' === typeof JSON.stringify
 && JSON.stringify(['\u2028\u2029']) === '["\u2028\u2029"]'
) {
  JSON.stringify = function replace(stringify) {
    var u2028 = /\u2028/g
      , u2029 = /\u2029/g;

    return function patched(value, replacer, spaces) {
      var result = stringify.call(this, value, replacer, spaces);

      //
      // Replace the bad chars.
      //
      if (result) {
        if (~result.indexOf('\u2028')) result = result.replace(u2028, '\\u2028');
        if (~result.indexOf('\u2029')) result = result.replace(u2029, '\\u2029');
      }

      return result;
    };
  }(JSON.stringify);
}

if (
     'undefined' !== typeof document
  && 'undefined' !== typeof navigator
) {
  //
  // Hack 2: If you press ESC in FireFox it will close all active connections.
  // Normally this makes sense, when your page is still loading. But versions
  // before FireFox 22 will close all connections including WebSocket connections
  // after page load. One way to prevent this is to do a `preventDefault()` and
  // cancel the operation before it bubbles up to the browsers default handler.
  // It needs to be added as `keydown` event, if it's added keyup it will not be
  // able to prevent the connection from being closed.
  //
  if (document.addEventListener) {
    document.addEventListener('keydown', function keydown(e) {
      if (e.keyCode !== 27 || !e.preventDefault) return;

      e.preventDefault();
    }, false);
  }

  //
  // Hack 3: This is a Mac/Apple bug only, when you're behind a reverse proxy or
  // have you network settings set to `automatic proxy discovery` the safari
  // browser will crash when the WebSocket constructor is initialised. There is
  // no way to detect the usage of these proxies available in JavaScript so we
  // need to do some nasty browser sniffing. This only affects Safari versions
  // lower then 5.1.4
  //
  var ua = (navigator.userAgent || '').toLowerCase()
    , parsed = ua.match(/.+(?:rv|it|ra|ie)[\/: ](\d+)\.(\d+)(?:\.(\d+))?/) || []
    , version = +[parsed[1], parsed[2]].join('.');

  if (
       !~ua.indexOf('chrome')
    && ~ua.indexOf('safari')
    && version < 534.54
  ) {
    Primus.prototype.AVOID_WEBSOCKETS = true;
  }
}
Primus.prototype.ark["emitter"] = function (){};
Primus.prototype.ark["resource"] = function client(primus) {

  var Resource = Primus.$.resource.Resource;

  /**
   * List of resources.
   *
   * @type {Object}
   * @api private
   */

  primus.resources = {};

  /**
   * Create a new resource.
   *
   * @param {String} name The resource name
   * @returns {Resource}
   * @api private
   */
   
  primus.resource = function resource(name, multiplex) {
    return this.resources[name] || Resource(this, name, multiplex);
  };
};
Primus.prototype.ark["multiplex"] = function client(primus) {

  // multiplex instance.
  var multiplex = new Primus.$.multiplex.Multiplex(primus);

  /**
   * Return a `Channel` instance.
   *
   * @param {String} name The channel name.
   * @return {multiplex.Spark}
   * @api public
   */

  primus.channel = function channel(name) {
    return multiplex.channel(name);
  };
};
 return Primus; });(function PrimusLibraryWrap(Primus) {;(function (Primus, undefined) {
function spark(Spark, Emitter) {

  'use strict';

  /**
   * `Primus#initialise` reference.
   */

  var initialise = Spark.prototype.initialise;

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function init() {
    if (!this.emitter) this.emitter = new Emitter(this);
    if (!this.__initialise) initialise.apply(this, arguments);
  };

  // Extend the Spark to add the send method if Spark.readable
  // is not supported then we set the method on the prototype instead.
  if (!Spark.readable) return Spark.prototype.send = send;
  if (!Spark.prototype.send) Spark.readable('send', send);

  /**
   * Emits to this Spark.
   *
   * @param {String} ev The event.
   * @param {Mixed} [data] The data to broadcast.
   * @param {Function} [fn] The callback function.
   * @return {Socket} this
   * @api public
   */

  function send(ev, data, fn) {
    // ignore newListener event to avoid this error in node 0.8
    // https://github.com/cayasso/primus-emitter/issues/3
    if (/^(newListener|removeListener)/.test(ev)) return this;
    this.emitter.send.apply(this.emitter, arguments);
    return this;
  }

}
function emitter() {

  'use strict';

  /**
   * Event packets.
   */

  var packets = {
    EVENT:  0,
    ACK:    1
  };

  // shortcut to slice
  var slice = [].slice;

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(conn) {
    if (!(this instanceof Emitter)) return new Emitter(conn);
    this.ids = 1;
    this.acks = {};
    this.conn = conn;
    if (this.conn) this.bind();
  }

  /**
   * Bind `Emitter` events.
   *
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.bind = function bind() {
    var em = this;
    this.conn.on('data', function ondata(data) {
      em.ondata.call(em, data);
    });
    return this;
  };

  /**
   * Called with incoming transport data.
   *
   * @param {Object} packet
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.ondata = function ondata(packet) {
    switch (packet.type) {
      case packets.EVENT:
        this.onevent(packet);
        break;
      case packets.ACK:
        this.onack(packet);
        break;
    }
  };

  /**
   * Send a message to client.
   *
   * @return {Emitter} self
   * @api public
   */

  Emitter.prototype.send = function send() {
    var args = slice.call(arguments);
    this.conn.write(this.packet(args));
    return this;
  };

  /**
   * Prepare packet for emitting.
   *
   * @param {Array} arguments
   * @return {Object} packet
   * @api private
   */

  Emitter.prototype.packet = function pack(args) {
    var packet = { type: packets.EVENT, data: args };
    // access last argument to see if it's an ACK callback
    if ('function' === typeof args[args.length - 1]) {
      var id = this.ids++;
      if (this.acks) {
        this.acks[id] = args.pop();
        packet.id = id;
      }
    }
    return packet;
  };

  /**
   * Called upon event packet.
   *
   * @param {Object} packet object
   * @api private
   */

  Emitter.prototype.onevent = function onevent(packet) {
    var args = packet.data || [];
    if (packet.id) {
      args.push(this.ack(packet.id));
    }
    if (this.conn.reserved(args[0])) return this;
    this.conn.emit.apply(this.conn, args);
    return this;
  };

  /**
   * Produces an ack callback to emit with an event.
   *
   * @param {Number} packet id
   * @return {Function}
   * @api private
   */

  Emitter.prototype.ack = function ack(id) {
    var conn = this.conn;
    var sent = false;
    return function(){      
      if (sent) return; // prevent double callbacks
      conn.write({
        id: id,
        type: packets.ACK,
        data: slice.call(arguments)
      });
    };
  };

  /**
   * Called upon ack packet.
   *
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.onack = function onack(packet) {
    var ack = this.acks[packet.id];
    if ('function' === typeof ack) {
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    } else {
      console.log('bad ack %s', packet.id);
    }
    return this;
  };

  // Expose packets
  Emitter.packets = packets;
  
  return Emitter;

}
 if (undefined === Primus) return;
 Primus.$ = Primus.$ || {};
 Primus.$.emitter = {};
 Primus.$.emitter.spark = spark;
 Primus.$.emitter.emitter = emitter;
 spark(Primus, emitter());
})(Primus);})(this["Primus"]);
(function PrimusLibraryWrap(Primus) {;(function (Primus, undefined) {
function resource(primus, options) {

  'use strict';

  var Emitter
    , slice = [].slice;

  try {
    Emitter = require('events').EventEmitter;
  } catch (e) {
    Emitter = Primus.EventEmitter;
  }

  /**
   * Initialize a new resource.
   *
   * @param {Stream} stream
   * @param {String} name
   * @param {Boolean} multiplex
   * @api public
   */

  function Resource(stream, name, multiplex) {
    if (!(this instanceof Resource)) return new Resource(stream, name, multiplex);
    Emitter.call(this);
    multiplex = ('undefined' === typeof multiplex) ? true : multiplex;
    this.ns = multiplex ? '' : name + '::';
    this.stream = multiplex ? stream.channel(name) : stream;
    stream.resources = stream.resources || {};
    stream.resources[name] = this;
    this.name = name;
    this._bind();
  }

  /**
   * Inherits from `EventEmitter`.
   */

  Resource.prototype = Object.create(Emitter.prototype);
  Resource.prototype.constructor = Resource;
  Resource.prototype._on = Resource.prototype.on;

  /**
   * Bind resource events.
   *
   * @param {String} name Namespace id
   * @return {Resource} this
   * @api private
   */

  Resource.prototype.on = function on(ev, fn) {
    if ('ready' === ev) return this._on(ev, fn);
    this.stream.on(this.ns + ev, fn);
  };

  /**
   * Bind resource events.
   *
   * @return {Resource} this
   * @api private
   */

  Resource.prototype._bind = function _bind() {
    var resource = this
      , ev = resource.ns + 'ready';
  
    // bind ready event
    resource.stream.once(ev, ready);

    // bind end event
    resource.stream.on('end', function onend() {

      // remove all listeners
      resource.stream.removeAllListeners(ev);

      // rebind onready event
      resource.stream.once(ev, ready);

    });

    /**
     * Ready event for binding.
     *
     * @param {Array} methods
     * @api private
     */

    function ready(methods) {
      resource.onready(methods);
    }

    return this;
  };

  /**
   * Called upon resource ready.
   *
   * @param {Array} methods
   * @return {Resource} this
   * @api private
   */

  Resource.prototype.onready = function onready(methods) {

    var i = 0
      , resource = this
      , ns = resource.ns
      , stream = this.stream
      , len = methods.length;

    for (; i < len; ++i) setup(methods[i]);

    // we need to setup each remote method
    // make the corresponding namespace on the
    // resource so we can call it.
    function setup(method) {
      // create the remote method
      if ('function' === typeof resource[method]) return;
      resource[method] = function () {
        var args = slice.call(arguments);
        // lets send event with the corresponding arguments
        stream.send.apply(stream, [ns + method].concat(args));
      };
    }

    // emit the ready event
    resource.emit('ready', resource.name, methods);
    return this;
  };

  return Resource;
}
 if (undefined === Primus) return;
 Primus.$ = Primus.$ || {};
 Primus.$.resource = {}
 Primus.$.resource.resource = resource;
 Primus.$.resource.Resource = resource();
})(Primus);})(this["Primus"]);
(function PrimusLibraryWrap(Primus) {;(function (Primus, undefined) {
function spark() {

  'use strict';

  var Stream
    , nextTick;

  /**
   * Module dependencies.
   */

  try {
    Stream = require('stream');
    nextTick = process.nextTick;
  } catch (e) {
    Stream = Primus.EventEmitter;
    nextTick = function tick(fn) {
      setTimeout(fn, 0);
    };
  }

  // Object create shim
  if ('undefined' === typeof Object.create) {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  // shortcut to slice
  var slice = [].slice;

  // White list events
  var events = [
    'open',
    'error',
    'online',
    'offline',
    'timeout',
    'reconnect',
    'reconnecting',
    'readyStateChange'
  ];

  /**
   * `Spark` constructor.
   *
   * @constructor
   * @param {Multiplex} Multiplex instance.
   * @param {String|Number} id
   * @param {primus.Spark} conn.
   * @api public
   */

  function Spark(mp, channel, id) {
    if (!(this instanceof Spark)) return new Spark(mp, channel, id);
    Stream.call(this);
    this.channel = channel;
    this.id = id || this.uid(13);
    this.packets = mp.packets;
    this.conn = mp.conn;
    this.readyState = mp.conn.readyState;
    this.channels = mp.channels;
    this.writable = true;
    this.readable = true;
    this.reconnect = false;
    this.initialise();
  }

  /**
   * Inherits from `EventEmitter`.
   */

  Spark.prototype = Object.create(Stream.prototype);
  Spark.prototype.constructor = Spark;

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function initialise() {
    var spark = this;

    // This listener must be registered before other ones
    // to make sure readyState is set when the others are called
    spark.conn.on('readyStateChange', onreadystatechange);

    // connect to the actuall channel
    this.connect();

    // Re-emit events from main connection.
    for (var i = 0; i < events.length; i++) {
      reemit(events[i]);
    }

    function reemit(ev) {
      spark.conn.on(ev, onevs);

      spark.on('end', function () {
        spark.conn.removeListener(ev, onevs);
      });

      function onevs() {
        spark.emit.apply(spark, [ev].concat(slice.call(arguments)));
      }
    }

    spark.conn.on('open', onopen);

    spark.conn.on('reconnect', onreconnect);

    spark.on('end', function () {
      spark.conn.removeListener('readyStateChange', onreadystatechange);
      spark.conn.removeListener('open', onopen);
      spark.conn.removeListener('reconnect', onreconnect);
    });

    function onreadystatechange() {
      spark.readyState = spark.conn.readyState;
    }

    function onopen() {
      if (spark.reconnect) spark.connect();
      spark.reconnect = false;
    }

    function onreconnect() {
      spark.reconnect = true;
    }

    return this;
  };

  /**
   * Connect to the `channel`.
   *
   * @return {Socket} self
   * @api public
   */

  Spark.prototype.connect = function connect() {
    // Subscribe to channel
    this.conn.write(this.packet.call(this, 'SUBSCRIBE'));
    return this;
  };

  /**
   * Send a new message to a given spark.
   *
   * @param {Mixed} data The data that needs to be written.
   * @returns {Boolean} Always returns true.
   * @api public
   */

  Spark.prototype.write = function write(data) {
    var payload = this.packet('MESSAGE', data);
    return this.conn.write(payload);
  };

  /**
   * End the connection.
   *
   * @param {Mixed} data Optional closing data.
   * @param {Function} fn Optional callback function.
   * @return {Channel} self
   * @api public
   */

  Spark.prototype.end = function end(data) {
    var spark = this;
    if (data) this.write(data);
    this.conn.write(this.packet('UNSUBSCRIBE'));
    nextTick(function tick() {
      spark.emit('end');
      spark.writable = false;
    });
    delete this.channels[this.channel][this.id];
    return this;
  };

  /**
   * Generate a unique id.
   *
   * @param {String} len
   * @return {String} uid.
   * @api private
   */

  Spark.prototype.uid = function uid(len) {
    return Math.random().toString(35).substr(2, len || 7);
  };

  /**
   * Encode data to return a multiplex packet.
   * @param {String} ev
   * @param {Object} data
   * @return {Object} pack
   * @api private
   */

  Spark.prototype.packet = function packet(ev, data) {
    var type = this.packets[ev];
    var pack = [type, this.id, this.channel];
    if (data) pack.push(data);
    return pack;
  };

  /**
   * Checks if the given event is an emitted event by Primus.
   *
   * @param {String} evt The event name.
   * @returns {Boolean}
   * @api public
   */

  Spark.prototype.reserved = function reserved(evt) {
    return (/^(incoming|outgoing)::/).test(evt)
      || evt in this.conn.reserved.events
      || evt in this.reserved.events;
  };

  /**
   * The reserved custom events list.
   *
   * @type {Object}
   * @api public
   */

  Spark.prototype.reserved.events = {};

  return Spark;
}
function multiplex(Spark) {

  'use strict';

  /**
   * `Multiplex` constructor.
   *
   * @constructor
   * @param {Primus} primus Primus instance.
   * @param {Object} options The options.
   * @api public
   */

  function Multiplex(primus, options) {
    if (!(this instanceof Multiplex)) return new Multiplex(primus, options);
    options = options || {};
    this.conn = primus;
    this.channels = {};
    this.reconnect = false;
    if (this.conn) this.bind();
  }

  /**
   * Message packets.
   */

  Multiplex.prototype.packets = {
    MESSAGE: 0,
    SUBSCRIBE: 1,
    UNSUBSCRIBE: 2
  };

  /**
   * Bind `Multiplex` events.
   *
   * @return {Multiplex} self
   * @api private
   */

  Multiplex.prototype.bind = function bind() {
    var mp = this;
    this.conn.on('data', function ondata(data) {
      if (isArray(data)) {
        var type = data.shift()
          , id = data.shift()
          , name = data.shift()
          , payload = data.shift()
          , channel = mp.channels[name][id];

        if (!channel) return false;

        switch (type) {
          case mp.packets.MESSAGE:
            channel.emit('data', payload);
            break;
          case mp.packets.UNSUBSCRIBE:
              channel.emit('end');
              channel.removeAllListeners();
              delete mp.channels[name][id];
            break;
        }
        return false;
      }
    });

    return this;
  };

  /**
   * Return a `Channel` instance.
   *
   * @param {String} name The channel name.
   * @return {Spark}
   * @api public
   */

  Multiplex.prototype.channel = function channel(name) {
    if (!name) return this.conn;

    // extend Spark to use emitter if this
    // the plugin its present.
    if ('emitter' in Primus.$) {
      Primus.$.emitter.spark(Spark, Primus.$.emitter.emitter());
    }

    var spark = new Spark(this, name);
    var id = spark.id;
    this.channels[name] =
    this.channels[name] || {};
    this.channels[name][id] = spark;
    return spark;
  };

  /**
   * Check if object is an array.
   */

  function isArray(obj) {
    return '[object Array]' === Object.prototype.toString.call(obj);
  }

  return Multiplex;
}
 if (undefined === Primus) return;
 var Spark = spark();
 Primus.$ = Primus.$ || {};
 Primus.$.multiplex = {}
 Primus.$.multiplex.spark = spark;
 Primus.$.multiplex.multiplex = multiplex;
 Primus.$.multiplex.Multiplex = multiplex(Spark);
})(Primus);})(this["Primus"]);
// http://mrl.nyu.edu/~perlin/noise/

var ImprovedNoise = function () {

	var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
		 23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
		 174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
		 133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
		 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
		 202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
		 248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
		 178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
		 14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
		 93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

	for (var i=0; i < 256 ; i++) {

		p[256+i] = p[i];

	}

	function fade(t) {

		return t * t * t * (t * (t * 6 - 15) + 10);

	}

	function lerp(t, a, b) {

		return a + t * (b - a);

	}

	function grad(hash, x, y, z) {

		var h = hash & 15;
		var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

	}

	return {

		noise: function (x, y, z) {

			var floorX = ~~x, floorY = ~~y, floorZ = ~~z;

			var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

			x -= floorX;
			y -= floorY;
			z -= floorZ;

			var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

			var u = fade(x), v = fade(y), w = fade(z);

			var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

			return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), 
							grad(p[BA], xMinus1, y, z)),
						lerp(u, grad(p[AB], x, yMinus1, z),
							grad(p[BB], xMinus1, yMinus1, z))),
					lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
							grad(p[BA+1], xMinus1, y, z-1)),
						lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
							grad(p[BB+1], xMinus1, yMinus1, zMinus1))));

		}
	}
}

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function ( parameters ) {

		var parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	}

};
/*!
 *
 * threeoctree.js (r60) / https://github.com/collinhover/threeoctree
 * (sparse) dynamic 3D spatial representation structure for fast searches.
 *
 * @author Collin Hover / http://collinhover.com/
 * based on Dynamic Octree by Piko3D @ http://www.piko3d.com/ and Octree by Marek Pawlowski @ pawlowski.it
 *
 */
 ( function ( THREE ) { "use strict";
	
	/*===================================================

	utility

	=====================================================*/
	
	function isNumber ( n ) {
		return !isNaN( n ) && isFinite( n );
	}
	
	function isArray ( target ) {
		return Object.prototype.toString.call( target ) === '[object Array]';
	}
	
	function toArray ( target ) {
		return target ? ( isArray ( target ) !== true ? [ target ] : target ) : [];
	}
	
	function indexOfValue( array, value ) {
		
		for ( var i = 0, il = array.length; i < il; i++ ) {
			
			if ( array[ i ] === value ) {
				
				return i;
				
			}
			
		}
		
		return -1;
		
	}
	
	function indexOfPropertyWithValue( array, property, value ) {
		
		for ( var i = 0, il = array.length; i < il; i++ ) {
			
			if ( array[ i ][ property ] === value ) {
				
				return i;
				
			}
			
		}
		
		return -1;
		
	}

	/*===================================================

	octree

	=====================================================*/

	THREE.Octree = function ( parameters ) {
		
		// handle parameters
		
		parameters = parameters || {};
		
		parameters.tree = this;
		
		// static properties ( modification is not recommended )
		
		this.nodeCount = 0;
		
		this.INDEX_INSIDE_CROSS = -1;
		this.INDEX_OUTSIDE_OFFSET = 2;
		
		this.INDEX_OUTSIDE_POS_X = isNumber( parameters.INDEX_OUTSIDE_POS_X ) ? parameters.INDEX_OUTSIDE_POS_X : 0;
		this.INDEX_OUTSIDE_NEG_X = isNumber( parameters.INDEX_OUTSIDE_NEG_X ) ? parameters.INDEX_OUTSIDE_NEG_X : 1;
		this.INDEX_OUTSIDE_POS_Y = isNumber( parameters.INDEX_OUTSIDE_POS_Y ) ? parameters.INDEX_OUTSIDE_POS_Y : 2;
		this.INDEX_OUTSIDE_NEG_Y = isNumber( parameters.INDEX_OUTSIDE_NEG_Y ) ? parameters.INDEX_OUTSIDE_NEG_Y : 3;
		this.INDEX_OUTSIDE_POS_Z = isNumber( parameters.INDEX_OUTSIDE_POS_Z ) ? parameters.INDEX_OUTSIDE_POS_Z : 4;
		this.INDEX_OUTSIDE_NEG_Z = isNumber( parameters.INDEX_OUTSIDE_NEG_Z ) ? parameters.INDEX_OUTSIDE_NEG_Z : 5;
		
		this.INDEX_OUTSIDE_MAP = [];
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_POS_X ] = { index: this.INDEX_OUTSIDE_POS_X, count: 0, x: 1, y: 0, z: 0 };
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_NEG_X ] = { index: this.INDEX_OUTSIDE_NEG_X, count: 0, x: -1, y: 0, z: 0 };
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_POS_Y ] = { index: this.INDEX_OUTSIDE_POS_Y, count: 0, x: 0, y: 1, z: 0 };
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_NEG_Y ] = { index: this.INDEX_OUTSIDE_NEG_Y, count: 0, x: 0, y: -1, z: 0 };
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_POS_Z ] = { index: this.INDEX_OUTSIDE_POS_Z, count: 0, x: 0, y: 0, z: 1 };
		this.INDEX_OUTSIDE_MAP[ this.INDEX_OUTSIDE_NEG_Z ] = { index: this.INDEX_OUTSIDE_NEG_Z, count: 0, x: 0, y: 0, z: -1 };
		
		this.FLAG_POS_X = 1 << ( this.INDEX_OUTSIDE_POS_X + 1 );
		this.FLAG_NEG_X = 1 << ( this.INDEX_OUTSIDE_NEG_X + 1 );
		this.FLAG_POS_Y = 1 << ( this.INDEX_OUTSIDE_POS_Y + 1 );
		this.FLAG_NEG_Y = 1 << ( this.INDEX_OUTSIDE_NEG_Y + 1 );
		this.FLAG_POS_Z = 1 << ( this.INDEX_OUTSIDE_POS_Z + 1 );
		this.FLAG_NEG_Z = 1 << ( this.INDEX_OUTSIDE_NEG_Z + 1 );
		
		this.utilVec31Search = new THREE.Vector3();
		this.utilVec32Search = new THREE.Vector3();
		
		// pass scene to see octree structure
		
		this.scene = parameters.scene;
		
		if ( this.scene ) {
			
			this.visualGeometry = new THREE.BoxGeometry( 1, 1, 1 );
			this.visualMaterial = new THREE.MeshBasicMaterial( { color: 0xFF0066, wireframe: true, wireframeLinewidth: 1 } );
			
		}
		
		// properties
		
		this.objects = [];
		this.objectsMap = {};
		this.objectsData = [];
		this.objectsDeferred = [];
		
		this.depthMax = isNumber( parameters.depthMax ) ? parameters.depthMax : Infinity;
		this.objectsThreshold = isNumber( parameters.objectsThreshold ) ? parameters.objectsThreshold : 8;
		this.overlapPct = isNumber( parameters.overlapPct ) ? parameters.overlapPct : 0.15;
		this.undeferred = parameters.undeferred || false;
		
		this.root = parameters.root instanceof THREE.OctreeNode ? parameters.root : new THREE.OctreeNode( parameters );
		
	};

	THREE.Octree.prototype = {
		
		update: function () {
			
			// add any deferred objects that were waiting for render cycle
			
			if ( this.objectsDeferred.length > 0 ) {
				
				for ( var i = 0, il = this.objectsDeferred.length; i < il; i++ ) {
					
					var deferred = this.objectsDeferred[ i ];
					
					this.addDeferred( deferred.object, deferred.options );
					
				}
				
				this.objectsDeferred.length = 0;
				
			}
			
		},
		
		add: function ( object, options ) {
			
			// add immediately
			
			if ( this.undeferred ) {
				
				this.updateObject( object );
				
				this.addDeferred( object, options );
				
			} else {
				
				// defer add until update called
				
				this.objectsDeferred.push( { object: object, options: options } );
				
			}
			
		},
		
		addDeferred: function ( object, options ) {
			
			var i, l,
				geometry,
				faces,
				useFaces,
				vertices,
				useVertices,
				objectData;
			
			// ensure object is not object data
			
			if ( object instanceof THREE.OctreeObjectData ) {
				
				object = object.object;
				
			}
			
			// check uuid to avoid duplicates
			
			if ( !object.uuid ) {
				
				object.uuid = THREE.Math.generateUUID();
				
			}
			
			if ( !this.objectsMap[ object.uuid ] ) {
				
				// store
				
				this.objects.push( object );
				this.objectsMap[ object.uuid ] = object;
				
				// check options
				
				if ( options ) {
					
					useFaces = options.useFaces;
					useVertices = options.useVertices;
					
				}
				
				if ( useVertices === true ) {
					
					geometry = object.geometry;
					vertices = geometry.vertices;
					
					for ( i = 0, l = vertices.length; i < l; i++ ) {
						
						this.addObjectData( object, vertices[ i ] );
						
					}
					
				} else if ( useFaces === true ) {
					
					geometry = object.geometry;
					faces = geometry.faces;
					
					for ( i = 0, l = faces.length; i < l; i++ ) {
						
						this.addObjectData( object, faces[ i ] );
						
					}
					
				} else {
					
					this.addObjectData( object );
					
				}
				
			}
			
		},
		
		addObjectData: function ( object, part ) {
			
			var objectData = new THREE.OctreeObjectData( object, part );
			
			// add to tree objects data list
			
			this.objectsData.push( objectData );
			
			// add to nodes
			
			this.root.addObject( objectData );
			
		},
		
		remove: function ( object ) {
			
			var i, l,
				objectData = object,
				index,
				objectsDataRemoved;
			
			// ensure object is not object data for index search
			
			if ( object instanceof THREE.OctreeObjectData ) {
				
				object = object.object;
				
			}
			
			// check uuid
			
			if ( this.objectsMap[ object.uuid ] ) {
				
				this.objectsMap[ object.uuid ] = undefined;
				
				// check and remove from objects, nodes, and data lists
				
				index = indexOfValue( this.objects, object );
				
				if ( index !== -1 ) {
					
					this.objects.splice( index, 1 );
					
					// remove from nodes
					
					objectsDataRemoved = this.root.removeObject( objectData );
					
					// remove from objects data list
					
					for ( i = 0, l = objectsDataRemoved.length; i < l; i++ ) {
						
						objectData = objectsDataRemoved[ i ];
						
						index = indexOfValue( this.objectsData, objectData );
						
						if ( index !== -1 ) {
							
							this.objectsData.splice( index, 1 );
							
						}
						
					}
					
				}
				
			} else if ( this.objectsDeferred.length > 0 ) {
				
				// check and remove from deferred
				
				index = indexOfPropertyWithValue( this.objectsDeferred, 'object', object );
				
				if ( index !== -1 ) {
					
					this.objectsDeferred.splice( index, 1 );
					
				}
				
			}
			
		},
		
		extend: function ( octree ) {
			
			var i, l,
				objectsData,
				objectData;
				
			if ( octree instanceof THREE.Octree ) {
				
				// for each object data
				
				objectsData = octree.objectsData;
				
				for ( i = 0, l = objectsData.length; i < l; i++ ) {
					
					objectData = objectsData[ i ];
					
					this.add( objectData, { useFaces: objectData.faces, useVertices: objectData.vertices } );
					
				}
				
			}
			
		},
		
		rebuild: function () {
			
			var i, l,
				node,
				object,
				objectData,
				indexOctant,
				indexOctantLast,
				objectsUpdate = [];
			
			// check all object data for changes in position
			// assumes all object matrices are up to date
			
			for ( i = 0, l = this.objectsData.length; i < l; i++ ) {
				
				objectData = this.objectsData[ i ];
				
				node = objectData.node;
				
				// update object
				
				objectData.update();
				
				// if position has changed since last organization of object in tree
				
				if ( node instanceof THREE.OctreeNode && !objectData.positionLast.equals( objectData.position ) ) {
					
					// get octant index of object within current node
					
					indexOctantLast = objectData.indexOctant;
					
					indexOctant = node.getOctantIndex( objectData );
					
					// if object octant index has changed
					
					if ( indexOctant !== indexOctantLast ) {
						
						// add to update list
						
						objectsUpdate.push( objectData );
						
					}
					
				}
				
			}
			
			// update changed objects
			
			for ( i = 0, l = objectsUpdate.length; i < l; i++ ) {
				
				objectData = objectsUpdate[ i ];
				
				// remove object from current node
				
				objectData.node.removeObject( objectData );
				
				// add object to tree root
				
				this.root.addObject( objectData );
				
			}
			
		},
		
		updateObject: function ( object ) {
			
			var i, l,
				parentCascade = [ object ],
				parent,
				parentUpdate;
			
			// search all parents between object and root for world matrix update
			
			parent = object.parent;
			
			while( parent ) {
				
				parentCascade.push( parent );
				parent = parent.parent;
				
			}
			
			for ( i = 0, l = parentCascade.length; i < l; i++ ) {
				
				parent = parentCascade[ i ];
				
				if ( parent.matrixWorldNeedsUpdate === true ) {
					
					parentUpdate = parent;
					
				}
				
			}
			
			// update world matrix starting at uppermost parent that needs update
			
			if ( typeof parentUpdate !== 'undefined' ) {
				
				parentUpdate.updateMatrixWorld();
				
			}
			
		},
		
		search: function ( position, radius, organizeByObject, direction ) {
			
			var i, l,
				node,
				objects,
				objectData,
				object,
				results,
				resultData,
				resultsObjectsIndices,
				resultObjectIndex,
				directionPct;
			
			// add root objects
			
			objects = [].concat( this.root.objects );
			
			// ensure radius (i.e. distance of ray) is a number
			
			if ( !( radius > 0 ) ) {
				
				radius = Number.MAX_VALUE;
				
			}
			
			// if direction passed, normalize and find pct
			
			if ( direction instanceof THREE.Vector3 ) {
				
				direction = this.utilVec31Search.copy( direction ).normalize();
				directionPct = this.utilVec32Search.set( 1, 1, 1 ).divide( direction );
				
			}
			
			// search each node of root
			
			for ( i = 0, l = this.root.nodesIndices.length; i < l; i++ ) {
				
				node = this.root.nodesByIndex[ this.root.nodesIndices[ i ] ];
				
				objects = node.search( position, radius, objects, direction, directionPct );
				
			}
			
			// if should organize results by object
			
			if ( organizeByObject === true ) {
				
				results = [];
				resultsObjectsIndices = [];
				
				// for each object data found
				
				for ( i = 0, l = objects.length; i < l; i++ ) {
					
					objectData = objects[ i ];
					object = objectData.object;
					
					resultObjectIndex = indexOfValue( resultsObjectsIndices, object );
					
					// if needed, create new result data
					
					if ( resultObjectIndex === -1 ) {
						
						resultData = {
							object: object,
							faces: [],
							vertices: []
						};
						
						results.push( resultData );
						
						resultsObjectsIndices.push( object );
						
					} else {
						
						resultData = results[ resultObjectIndex ];
						
					}
					
					// object data has faces or vertices, add to list
					
					if ( objectData.faces ) {
						
						resultData.faces.push( objectData.faces );
						
					} else if ( objectData.vertices ) {
						
						resultData.vertices.push( objectData.vertices );
						
					}
					
				}
				
			} else {
				
				results = objects;
				
			}
			
			return results;
			
		},
		
		setRoot: function ( root ) { 
			
			if ( root instanceof THREE.OctreeNode ) {
				
				// store new root
				
				this.root = root;
				
				// update properties
				
				this.root.updateProperties();
				
			}
			
		},
		
		getDepthEnd: function () {
			
			return this.root.getDepthEnd();
			
		},
		
		getNodeCountEnd: function () {
			
			return this.root.getNodeCountEnd();
			
		},
		
		getObjectCountEnd: function () {
			
			return this.root.getObjectCountEnd();
			
		},
		
		toConsole: function () {
			
			this.root.toConsole();
			
		}
		
	};

	/*===================================================

	object data

	=====================================================*/

	THREE.OctreeObjectData = function ( object, part ) {
		
		// properties
		
		this.object = object;
		
		// handle part by type
		
		if ( part instanceof THREE.Face3 ) {
			
			this.faces = part;
			this.face3 = true;
			this.utilVec31FaceBounds = new THREE.Vector3();
			
		} else if ( part instanceof THREE.Vector3 ) {
			
			this.vertices = part;
			
		}
		
		this.radius = 0;
		this.position = new THREE.Vector3();
			
		// initial update
		
		if ( this.object instanceof THREE.Object3D ) {
			
			this.update();
			
		}
		
		this.positionLast = this.position.clone();
		
	};

	THREE.OctreeObjectData.prototype = {
		
		update: function () {
			
			if ( this.face3 ) {
				
				this.radius = this.getFace3BoundingRadius( this.object, this.faces );
				this.position.copy( this.faces.centroid ).applyMatrix4( this.object.matrixWorld );
				
			} else if ( this.vertices ) {
				
				this.radius = this.object.material.size || 1;
				this.position.copy( this.vertices ).applyMatrix4( this.object.matrixWorld );
				
			} else {
				
				if ( this.object.geometry ) {
					
					if ( this.object.geometry.boundingSphere === null ) {
						
						this.object.geometry.computeBoundingSphere();
						
					}
					
					this.radius = this.object.geometry.boundingSphere.radius;
					this.position.copy( this.object.geometry.boundingSphere.center ).applyMatrix4( this.object.matrixWorld );
					
				} else {
					
					this.radius = this.object.boundRadius;
					this.position.setFromMatrixPosition( this.object.matrixWorld );
					
				}
				
			}
			
			this.radius = this.radius * Math.max( this.object.scale.x, this.object.scale.y, this.object.scale.z );
			
		},
		
		getFace3BoundingRadius: function ( object, face ) {

			if ( face.centroid === undefined ) face.centroid = new THREE.Vector3();
			
			var geometry = object.geometry || object,
				vertices = geometry.vertices,
				centroid = face.centroid,
				va = vertices[ face.a ], vb = vertices[ face.b ], vc = vertices[ face.c ],
				centroidToVert = this.utilVec31FaceBounds,
				radius;
				
			centroid.addVectors( va, vb ).add( vc ).divideScalar( 3 );
			radius = Math.max( centroidToVert.subVectors( centroid, va ).length(), centroidToVert.subVectors( centroid, vb ).length(), centroidToVert.subVectors( centroid, vc ).length() );
			
			return radius;
			
		}
		
	};

	/*===================================================

	node

	=====================================================*/

	THREE.OctreeNode = function ( parameters ) {
		
		// utility
		
		this.utilVec31Branch = new THREE.Vector3();
		this.utilVec31Expand = new THREE.Vector3();
		this.utilVec31Ray = new THREE.Vector3();
		
		// handle parameters
		
		parameters = parameters || {};
		
		// store or create tree
		
		if ( parameters.tree instanceof THREE.Octree ) {
			
			this.tree = parameters.tree;
			
		} else if ( parameters.parent instanceof THREE.OctreeNode !== true ) {
			
			parameters.root = this;
			
			this.tree = new THREE.Octree( parameters );
			
		}
		
		// basic properties
		
		this.id = this.tree.nodeCount++;
		this.position = parameters.position instanceof THREE.Vector3 ? parameters.position : new THREE.Vector3();
		this.radius = parameters.radius > 0 ? parameters.radius : 1;
		this.indexOctant = parameters.indexOctant;
		this.depth = 0;
		
		// reset and assign parent
		
		this.reset();
		this.setParent( parameters.parent );
		
		// additional properties
		
		this.overlap = this.radius * this.tree.overlapPct;
		this.radiusOverlap = this.radius + this.overlap;
		this.left = this.position.x - this.radiusOverlap;
		this.right = this.position.x + this.radiusOverlap;
		this.bottom = this.position.y - this.radiusOverlap;
		this.top = this.position.y + this.radiusOverlap;
		this.back = this.position.z - this.radiusOverlap;
		this.front = this.position.z + this.radiusOverlap;
		
		// visual
		
		if ( this.tree.scene ) {
			
			this.visual = new THREE.Mesh( this.tree.visualGeometry, this.tree.visualMaterial );
			this.visual.scale.set( this.radiusOverlap * 2, this.radiusOverlap * 2, this.radiusOverlap * 2 );
			this.visual.position.copy( this.position );
			this.tree.scene.add( this.visual );
			
		}
		
	};

	THREE.OctreeNode.prototype = {
		
		setParent: function ( parent ) {
			
			// store new parent
			
			if ( parent !== this && this.parent !== parent ) {
				
				this.parent = parent;
				
				// update properties
				
				this.updateProperties();
				
			}
			
		},
		
		updateProperties: function () {
			
			var i, l;
			
			// properties
			
			if ( this.parent instanceof THREE.OctreeNode ) {
				
				this.tree = this.parent.tree;
				this.depth = this.parent.depth + 1;
				
			} else {
				
				this.depth = 0;
				
			}
			
			// cascade
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				this.nodesByIndex[ this.nodesIndices[ i ] ].updateProperties();
				
			}
			
		},
		
		reset: function ( cascade, removeVisual ) {
			
			var i, l,
				node,
				nodesIndices = this.nodesIndices || [],
				nodesByIndex = this.nodesByIndex;
			
			this.objects = [];
			this.nodesIndices = [];
			this.nodesByIndex = {};
			
			// unset parent in nodes
			
			for ( i = 0, l = nodesIndices.length; i < l; i++ ) {
				
				node = nodesByIndex[ nodesIndices[ i ] ];
				
				node.setParent( undefined );
				
				if ( cascade === true ) {
					
					node.reset( cascade, removeVisual );
					
				}
				
			}
			
			// visual
			
			if ( removeVisual === true && this.visual && this.visual.parent ) {
				
				this.visual.parent.remove( this.visual );
				
			}
			
		},
		
		addNode: function ( node, indexOctant ) {
			
			node.indexOctant = indexOctant;
			
			if ( indexOfValue( this.nodesIndices, indexOctant ) === -1 ) {
				
				this.nodesIndices.push( indexOctant );
				
			}
			
			this.nodesByIndex[ indexOctant ] = node;
			
			if ( node.parent !== this ) {
				
				node.setParent( this );
				
			}
			
		},
		
		removeNode: function ( indexOctant ) {
			
			var index,
				node;
				
			index = indexOfValue( this.nodesIndices, indexOctant );
			
			this.nodesIndices.splice( index, 1 );
			
			node = node || this.nodesByIndex[ indexOctant ];
			
			delete this.nodesByIndex[ indexOctant ];
			
			if ( node.parent === this ) {
				
				node.setParent( undefined );
				
			}
			
		},
		
		addObject: function ( object ) {
			
			var index,
				indexOctant,
				node;
			
			// get object octant index
			
			indexOctant = this.getOctantIndex( object );
			
			// if object fully contained by an octant, add to subtree
			if ( indexOctant > -1 && this.nodesIndices.length > 0 ) {
				
				node = this.branch( indexOctant );
				
				node.addObject( object );
				
			} else if ( indexOctant < -1 && this.parent instanceof THREE.OctreeNode ) {
				
				// if object lies outside bounds, add to parent node
				
				this.parent.addObject( object );
				
			} else {
				
				// add to this objects list
				
				index = indexOfValue( this.objects, object );
				
				if ( index === -1 ) {
					
					this.objects.push( object );
					
				}
				
				// node reference
				
				object.node = this;
				
				// check if need to expand, split, or both
				
				this.checkGrow();
				
			}
			
		},
		
		addObjectWithoutCheck: function ( objects ) {
			
			var i, l,
				object;

			for ( i = 0, l = objects.length; i < l; i++ ) {
				
				object = objects[ i ];
				
				this.objects.push( object );
				
				object.node = this;
				
			}
			
		},
		
		removeObject: function ( object ) {
			
			var i, l,
				nodesRemovedFrom,
				removeData;
			
			// cascade through tree to find and remove object
			
			removeData = this.removeObjectRecursive( object, { searchComplete: false, nodesRemovedFrom: [], objectsDataRemoved: [] } );
			
			// if object removed, try to shrink the nodes it was removed from
			
			nodesRemovedFrom = removeData.nodesRemovedFrom;
			
			if ( nodesRemovedFrom.length > 0 ) {
				
				for ( i = 0, l = nodesRemovedFrom.length; i < l; i++ ) {
					
					nodesRemovedFrom[ i ].shrink();
					
				}
				
			}
			
			return removeData.objectsDataRemoved;
			
		},
		
		removeObjectRecursive: function ( object, removeData ) {
			
			var i, l,
				index = -1,
				objectData,
				node,
				objectRemoved;
			
			// find index of object in objects list
			
			// search and remove object data (fast)
			if ( object instanceof THREE.OctreeObjectData ) {
				
				// remove from this objects list
				
				index = indexOfValue( this.objects, object );
				
				if ( index !== -1 ) {
					
					this.objects.splice( index, 1 );
					object.node = undefined;
					
					removeData.objectsDataRemoved.push( object );
					
					removeData.searchComplete = objectRemoved = true;
					
				}
				
			} else {
			
				// search each object data for object and remove (slow)
				
				for ( i = this.objects.length - 1; i >= 0; i-- ) {
					
					objectData = this.objects[ i ];
					
					if ( objectData.object === object ) {
						
						this.objects.splice( i, 1 );
						objectData.node = undefined;
						
						removeData.objectsDataRemoved.push( objectData );
						
						objectRemoved = true;
						
						if ( !objectData.faces && !objectData.vertices ) {
							
							removeData.searchComplete = true;
							break;
							
						}
						
					}
					
				}
				
			}
			
			// if object data removed and this is not on nodes removed from
			
			if ( objectRemoved === true ) {
				
				removeData.nodesRemovedFrom.push( this );
				
			}
			
			// if search not complete, search nodes
			
			if ( removeData.searchComplete !== true ) {
				
				for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
					
					node = this.nodesByIndex[ this.nodesIndices[ i ] ];
					
					// try removing object from node
					
					removeData = node.removeObjectRecursive( object, removeData );
					
					if ( removeData.searchComplete === true ) {
						
						break;
						
					}
					
				}
				
			}
			
			return removeData;
			
		},
		
		checkGrow: function () {
			
			// if object count above max
			
			if ( this.objects.length > this.tree.objectsThreshold && this.tree.objectsThreshold > 0 ) {
				
				this.grow();
				
			}
			
		},
		
		grow: function () {
			
			var indexOctant,
				object,
				objectsExpand = [],
				objectsExpandOctants = [],
				objectsSplit = [],
				objectsSplitOctants = [],
				objectsRemaining = [],
				i, l;
			
			// for each object
			
			for ( i = 0, l = this.objects.length; i < l; i++ ) {
				
				object = this.objects[ i ];
				
				// get object octant index
				
				indexOctant = this.getOctantIndex( object );
				
				// if lies within octant
				if ( indexOctant > -1 ) {
					
					objectsSplit.push( object );
					objectsSplitOctants.push( indexOctant );
				
				} else if ( indexOctant < -1 ) {
					
					// lies outside radius
					
					objectsExpand.push( object );
					objectsExpandOctants.push( indexOctant );
					
				} else {
				
					// lies across bounds between octants
					
					objectsRemaining.push( object );
					
				}
				
			}
			
			// if has objects to split
			
			if ( objectsSplit.length > 0) {
				
				objectsRemaining = objectsRemaining.concat( this.split( objectsSplit, objectsSplitOctants ) );
				
			}
			
			// if has objects to expand
			
			if ( objectsExpand.length > 0) {
				
				objectsRemaining = objectsRemaining.concat( this.expand( objectsExpand, objectsExpandOctants ) );
				
			}
			
			// store remaining
			
			this.objects = objectsRemaining;
			
			// merge check
			
			this.checkMerge();
			
		},
		
		split: function ( objects, octants ) {
			
			var i, l,
				indexOctant,
				object,
				node,
				objectsRemaining;
			
			// if not at max depth
			
			if ( this.depth < this.tree.depthMax ) {
				
				objects = objects || this.objects;
				
				octants = octants || [];
				
				objectsRemaining = [];
				
				// for each object
				
				for ( i = 0, l = objects.length; i < l; i++ ) {
					
					object = objects[ i ];
					
					// get object octant index
					
					indexOctant = octants[ i ];
					
					// if object contained by octant, branch this tree
					
					if ( indexOctant > -1 ) {
						
						node = this.branch( indexOctant );
						
						node.addObject( object );
						
					} else {
						
						objectsRemaining.push( object );
						
					}
					
				}
				
				// if all objects, set remaining as new objects
				
				if ( objects === this.objects ) {
					
					this.objects = objectsRemaining;
					
				}
				
			} else {
				
				objectsRemaining = this.objects;
				
			}
			
			return objectsRemaining;
			
		},
		
		branch: function ( indexOctant ) {
			
			var node,
				overlap,
				radius,
				radiusOffset,
				offset,
				position;
			
			// node exists
			
			if ( this.nodesByIndex[ indexOctant ] instanceof THREE.OctreeNode ) {
				
				node = this.nodesByIndex[ indexOctant ];
				
			} else {
				
				// properties
				
				radius = ( this.radiusOverlap ) * 0.5;
				overlap = radius * this.tree.overlapPct;
				radiusOffset = radius - overlap;
				offset = this.utilVec31Branch.set( indexOctant & 1 ? radiusOffset : -radiusOffset, indexOctant & 2 ? radiusOffset : -radiusOffset, indexOctant & 4 ? radiusOffset : -radiusOffset );
				position = new THREE.Vector3().addVectors( this.position, offset );
				
				// node
				
				node = new THREE.OctreeNode( {
					tree: this.tree,
					parent: this,
					position: position,
					radius: radius,
					indexOctant: indexOctant
				} );
				
				// store
				
				this.addNode( node, indexOctant );
			
			}
			
			return node;
			
		},
		
		expand: function ( objects, octants ) {
			
			var i, l,
				object,
				objectsRemaining,
				objectsExpand,
				indexOctant,
				flagsOutside,
				indexOutside,
				indexOctantInverse,
				iom = this.tree.INDEX_OUTSIDE_MAP,
				indexOutsideCounts,
				infoIndexOutside1,
				infoIndexOutside2,
				infoIndexOutside3,
				indexOutsideBitwise1,
				indexOutsideBitwise2,
				infoPotential1,
				infoPotential2,
				infoPotential3,
				indexPotentialBitwise1,
				indexPotentialBitwise2,
				octantX, octantY, octantZ,
				overlap,
				radius,
				radiusOffset,
				radiusParent,
				overlapParent,
				offset = this.utilVec31Expand,
				position,
				parent;
			
			// handle max depth down tree
			
			if ( this.tree.root.getDepthEnd() < this.tree.depthMax ) {
				
				objects = objects || this.objects;
				octants = octants || [];
				
				objectsRemaining = [];
				objectsExpand = [];
				
				// reset counts
				
				for ( i = 0, l = iom.length; i < l; i++ ) {
					
					iom[ i ].count = 0;
					
				}
				
				// for all outside objects, find outside octants containing most objects
				
				for ( i = 0, l = objects.length; i < l; i++ ) {
					
					object = objects[ i ];
					
					// get object octant index
					
					indexOctant = octants[ i ] ;
					
					// if object outside this, include in calculations
					
					if ( indexOctant < -1 ) {
						
						// convert octant index to outside flags
						
						flagsOutside = -indexOctant - this.tree.INDEX_OUTSIDE_OFFSET;
						
						// check against bitwise flags
						
						// x
						
						if ( flagsOutside & this.tree.FLAG_POS_X ) {
							
							iom[ this.tree.INDEX_OUTSIDE_POS_X ].count++;
							
						} else if ( flagsOutside & this.tree.FLAG_NEG_X ) {
							
							iom[ this.tree.INDEX_OUTSIDE_NEG_X ].count++;
							
						}
						
						// y
						
						if ( flagsOutside & this.tree.FLAG_POS_Y ) {
							
							iom[ this.tree.INDEX_OUTSIDE_POS_Y ].count++;
							
						} else if ( flagsOutside & this.tree.FLAG_NEG_Y ) {
							
							iom[ this.tree.INDEX_OUTSIDE_NEG_Y ].count++;
							
						}
						
						// z
						
						if ( flagsOutside & this.tree.FLAG_POS_Z ) {
							
							iom[ this.tree.INDEX_OUTSIDE_POS_Z ].count++;
							
						} else if ( flagsOutside & this.tree.FLAG_NEG_Z ) {
							
							iom[ this.tree.INDEX_OUTSIDE_NEG_Z ].count++;
							
						}
						
						// store in expand list
						
						objectsExpand.push( object );
						
					} else {
						
						objectsRemaining.push( object );
						
					}
					
				}
				
				// if objects to expand
				
				if ( objectsExpand.length > 0 ) {
					
					// shallow copy index outside map
					
					indexOutsideCounts = iom.slice( 0 );
					
					// sort outside index count so highest is first
					
					indexOutsideCounts.sort( function ( a, b ) {
						
						return b.count - a.count;
						
					} );
					
					// get highest outside indices
					
					// first is first
					infoIndexOutside1 = indexOutsideCounts[ 0 ];
					indexOutsideBitwise1 = infoIndexOutside1.index | 1;
					
					// second is ( one of next two bitwise OR 1 ) that is not opposite of ( first bitwise OR 1 )
					
					infoPotential1 = indexOutsideCounts[ 1 ];
					infoPotential2 = indexOutsideCounts[ 2 ];
					
					infoIndexOutside2 = ( infoPotential1.index | 1 ) !== indexOutsideBitwise1 ? infoPotential1 : infoPotential2;
					indexOutsideBitwise2 = infoIndexOutside2.index | 1;
					
					// third is ( one of next three bitwise OR 1 ) that is not opposite of ( first or second bitwise OR 1 )
					
					infoPotential1 = indexOutsideCounts[ 2 ];
					infoPotential2 = indexOutsideCounts[ 3 ];
					infoPotential3 = indexOutsideCounts[ 4 ];
					
					indexPotentialBitwise1 = infoPotential1.index | 1;
					indexPotentialBitwise2 = infoPotential2.index | 1;
					
					infoIndexOutside3 = indexPotentialBitwise1 !== indexOutsideBitwise1 && indexPotentialBitwise1 !== indexOutsideBitwise2 ? infoPotential1 : indexPotentialBitwise2 !== indexOutsideBitwise1 && indexPotentialBitwise2 !== indexOutsideBitwise2 ? infoPotential2 : infoPotential3;
					
					// get this octant normal based on outside octant indices
					
					octantX = infoIndexOutside1.x + infoIndexOutside2.x + infoIndexOutside3.x;
					octantY = infoIndexOutside1.y + infoIndexOutside2.y + infoIndexOutside3.y;
					octantZ = infoIndexOutside1.z + infoIndexOutside2.z + infoIndexOutside3.z;
					
					// get this octant indices based on octant normal
					
					indexOctant = this.getOctantIndexFromPosition( octantX, octantY, octantZ );
					indexOctantInverse = this.getOctantIndexFromPosition( -octantX, -octantY, -octantZ );
					
					// properties
					
					overlap = this.overlap;
					radius = this.radius;
					
					// radius of parent comes from reversing overlap of this, unless overlap percent is 0
					
					radiusParent = this.tree.overlapPct > 0 ? overlap / ( ( 0.5 * this.tree.overlapPct ) * ( 1 + this.tree.overlapPct ) ) : radius * 2; 
					overlapParent = radiusParent * this.tree.overlapPct;
					
					// parent offset is difference between radius + overlap of parent and child
					
					radiusOffset = ( radiusParent + overlapParent ) - ( radius + overlap );
					offset.set( indexOctant & 1 ? radiusOffset : -radiusOffset, indexOctant & 2 ? radiusOffset : -radiusOffset, indexOctant & 4 ? radiusOffset : -radiusOffset );
					position = new THREE.Vector3().addVectors( this.position, offset );
					
					// parent
					
					parent = new THREE.OctreeNode( {
						tree: this.tree,
						position: position,
						radius: radiusParent
					} );
					
					// set self as node of parent
					
					parent.addNode( this, indexOctantInverse );
					
					// set parent as root
					
					this.tree.setRoot( parent );
					
					// add all expand objects to parent
					
					for ( i = 0, l = objectsExpand.length; i < l; i++ ) {
						
						this.tree.root.addObject( objectsExpand[ i ] );
						
					}
					
				}
				
				// if all objects, set remaining as new objects
				
				if ( objects === this.objects ) {
					
					this.objects = objectsRemaining;
					
				}
				
			} else {
				
				objectsRemaining = objects;
				
			}
			
			return objectsRemaining;
			
		},
		
		shrink: function () {
			
			// merge check
			
			this.checkMerge();
			
			// contract check
			
			this.tree.root.checkContract();
			
		},
		
		checkMerge: function () {
			
			var nodeParent = this,
				nodeMerge;
			
			// traverse up tree as long as node + entire subtree's object count is under minimum
			
			while ( nodeParent.parent instanceof THREE.OctreeNode && nodeParent.getObjectCountEnd() < this.tree.objectsThreshold ) {
				
				nodeMerge = nodeParent;
				nodeParent = nodeParent.parent;
				
			}
			
			// if parent node is not this, merge entire subtree into merge node
			
			if ( nodeParent !== this ) {
				
				nodeParent.merge( nodeMerge );
				
			}
			
		},
		
		merge: function ( nodes ) {
			
			var i, l,
				j, k,
				node;
			
			// handle nodes
			
			nodes = toArray( nodes );
			
			for ( i = 0, l = nodes.length; i < l; i++ ) {
				
				node = nodes[ i ];
				
				// gather node + all subtree objects
				
				this.addObjectWithoutCheck( node.getObjectsEnd() );
				
				// reset node + entire subtree
				
				node.reset( true, true );
				
				// remove node
				
				this.removeNode( node.indexOctant, node );
				
			}
			
			// merge check
			
			this.checkMerge();
			
		},
		
		checkContract: function () {
			
			var i, l,
				node,
				nodeObjectsCount,
				nodeHeaviest,
				nodeHeaviestObjectsCount,
				outsideHeaviestObjectsCount;
			
			// find node with highest object count
			
			if ( this.nodesIndices.length > 0 ) {
				
				nodeHeaviestObjectsCount = 0;
				outsideHeaviestObjectsCount = this.objects.length;
				
				for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
					
					node = this.nodesByIndex[ this.nodesIndices[ i ] ];
					
					nodeObjectsCount = node.getObjectCountEnd();
					outsideHeaviestObjectsCount += nodeObjectsCount;
					
					if ( nodeHeaviest instanceof THREE.OctreeNode === false || nodeObjectsCount > nodeHeaviestObjectsCount ) {
						
						nodeHeaviest = node;
						nodeHeaviestObjectsCount = nodeObjectsCount;
						
					}
					
				}
				
				// subtract heaviest count from outside count
				
				outsideHeaviestObjectsCount -= nodeHeaviestObjectsCount;
				
				// if should contract
				
				if ( outsideHeaviestObjectsCount < this.tree.objectsThreshold && nodeHeaviest instanceof THREE.OctreeNode ) {
					
					this.contract( nodeHeaviest );
					
				}
				
			}
			
		},
		
		contract: function ( nodeRoot ) {
			
			var i, l,
				node;
			
			// handle all nodes
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				node = this.nodesByIndex[ this.nodesIndices[ i ] ];
				
				// if node is not new root
				
				if ( node !== nodeRoot ) {
					
					// add node + all subtree objects to root
					
					nodeRoot.addObjectWithoutCheck( node.getObjectsEnd() );
					
					// reset node + entire subtree
					
					node.reset( true, true );
					
				}
				
			}
			
			// add own objects to root
			
			nodeRoot.addObjectWithoutCheck( this.objects );
			
			// reset self
			
			this.reset( false, true );
			
			// set new root
			
			this.tree.setRoot( nodeRoot );
			
			// contract check on new root
			
			nodeRoot.checkContract();
			
		},
		
		getOctantIndex: function ( objectData ) {
			
			var i, l,
				positionObj,
				radiusObj,
				position = this.position,
				radiusOverlap = this.radiusOverlap,
				overlap = this.overlap,
				deltaX, deltaY, deltaZ,
				distX, distY, distZ, 
				distance,
				indexOctant = 0;
			
			// handle type
			
			if ( objectData instanceof THREE.OctreeObjectData ) {
				
				radiusObj = objectData.radius;
				
				positionObj = objectData.position;
				
				// update object data position last
				
				objectData.positionLast.copy( positionObj );
				
			} else if ( objectData instanceof THREE.OctreeNode ) {
				
				positionObj = objectData.position;
				
				radiusObj = 0;
				
			}
			
			// find delta and distance
			
			deltaX = positionObj.x - position.x;
			deltaY = positionObj.y - position.y;
			deltaZ = positionObj.z - position.z;
			
			distX = Math.abs( deltaX );
			distY = Math.abs( deltaY );
			distZ = Math.abs( deltaZ );
			distance = Math.max( distX, distY, distZ );
			
			// if outside, use bitwise flags to indicate on which sides object is outside of
			
			if ( distance + radiusObj > radiusOverlap ) {
				
				// x
				
				if ( distX + radiusObj > radiusOverlap ) {
					
					indexOctant = indexOctant ^ ( deltaX > 0 ? this.tree.FLAG_POS_X : this.tree.FLAG_NEG_X );
					
				}
				
				// y
				
				if ( distY + radiusObj > radiusOverlap ) {
					
					indexOctant = indexOctant ^ ( deltaY > 0 ? this.tree.FLAG_POS_Y : this.tree.FLAG_NEG_Y );
					
				}
				
				// z
				
				if ( distZ + radiusObj > radiusOverlap ) {
					
					indexOctant = indexOctant ^ ( deltaZ > 0 ? this.tree.FLAG_POS_Z : this.tree.FLAG_NEG_Z );
					
				}
				
				objectData.indexOctant = -indexOctant - this.tree.INDEX_OUTSIDE_OFFSET;
				
				return objectData.indexOctant;
				
			}
			
			// return octant index from delta xyz
			
			if ( deltaX - radiusObj > -overlap ) {
				
				// x right
				
				indexOctant = indexOctant | 1;
				
			} else if ( !( deltaX + radiusObj < overlap ) ) {
				
				// x left
				
				objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
				return objectData.indexOctant;
				
			}
			
			if ( deltaY - radiusObj > -overlap ) {
				
				// y right
				
				indexOctant = indexOctant | 2;
				
			} else if ( !( deltaY + radiusObj < overlap ) ) {
				
				// y left
				
				objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
				return objectData.indexOctant;
				
			}
			
			
			if ( deltaZ - radiusObj > -overlap ) {
				
				// z right
				
				indexOctant = indexOctant | 4;
				
			} else if ( !( deltaZ + radiusObj < overlap ) ) {
				
				// z left
				
				objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
				return objectData.indexOctant;
				
			}
			
			objectData.indexOctant = indexOctant;
			return objectData.indexOctant;
			
		},
		
		getOctantIndexFromPosition: function ( x, y, z ) {
			
			var indexOctant = 0;
			
			if ( x > 0 ) {
				
				indexOctant = indexOctant | 1;
				
			}
			
			if ( y > 0 ) {
				
				indexOctant = indexOctant | 2;
				
			}
			
			if ( z > 0 ) {
				
				indexOctant = indexOctant | 4;
				
			}
			
			return indexOctant;
			
		},
		
		search: function ( position, radius, objects, direction, directionPct ) {
			
			var i, l,
				node,
				intersects;
			
			// test intersects by parameters
			
			if ( direction ) {
				
				intersects = this.intersectRay( position, direction, radius, directionPct );
				
			} else {
				
				intersects = this.intersectSphere( position, radius );
				
			}
			
			// if intersects
			
			if ( intersects === true ) {
				
				// gather objects
				
				objects = objects.concat( this.objects );
				
				// search subtree
				
				for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
					
					node = this.nodesByIndex[ this.nodesIndices[ i ] ];
					
					objects = node.search( position, radius, objects, direction );
					
				}
				
			}
			
			return objects;
			
		},
		
		intersectSphere: function ( position, radius ) {
			
			var	distance = radius * radius,
				px = position.x,
				py = position.y,
				pz = position.z;
			
			if ( px < this.left ) {
				distance -= Math.pow( px - this.left, 2 );
			} else if ( px > this.right ) {
				distance -= Math.pow( px - this.right, 2 );
			}
			
			if ( py < this.bottom ) {
				distance -= Math.pow( py - this.bottom, 2 );
			} else if ( py > this.top ) {
				distance -= Math.pow( py - this.top, 2 );
			}
			
			if ( pz < this.back ) {
				distance -= Math.pow( pz - this.back, 2 );
			} else if ( pz > this.front ) {
				distance -= Math.pow( pz - this.front, 2 );
			}
			
			return distance >= 0;
			
		},
		
		intersectRay: function ( origin, direction, distance, directionPct ) {
			
			if ( typeof directionPct === 'undefined' ) {
				
				directionPct = this.utilVec31Ray.set( 1, 1, 1 ).divide( direction );
				
			}
			
			var t1 = ( this.left - origin.x ) * directionPct.x,
				t2 = ( this.right - origin.x ) * directionPct.x,
				t3 = ( this.bottom - origin.y ) * directionPct.y,
				t4 = ( this.top - origin.y ) * directionPct.y,
				t5 = ( this.back - origin.z ) * directionPct.z,
				t6 = ( this.front - origin.z ) * directionPct.z,
				tmax = Math.min( Math.min( Math.max( t1, t2), Math.max( t3, t4) ), Math.max( t5, t6) ),
				tmin;

			// ray would intersect in reverse direction, i.e. this is behind ray
			if (tmax < 0)
			{
				return false;
			}
			
			tmin = Math.max( Math.max( Math.min( t1, t2), Math.min( t3, t4)), Math.min( t5, t6));
			
			// if tmin > tmax or tmin > ray distance, ray doesn't intersect AABB
			if( tmin > tmax || tmin > distance ) {
				return false;
			}
			
			return true;
			
		},
		
		getDepthEnd: function ( depth ) {
			
			var i, l,
				node;

			if ( this.nodesIndices.length > 0 ) {
				
				for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {

					node = this.nodesByIndex[ this.nodesIndices[ i ] ];

					depth = node.getDepthEnd( depth );

				}
				
			} else {

				depth = !depth || this.depth > depth ? this.depth : depth;

			}

			return depth;
			
		},
		
		getNodeCountEnd: function () {
			
			return this.tree.root.getNodeCountRecursive() + 1;
			
		},
		
		getNodeCountRecursive: function () {
			
			var i, l,
				count = this.nodesIndices.length;
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				count += this.nodesByIndex[ this.nodesIndices[ i ] ].getNodeCountRecursive();
				
			}
			
			return count;
			
		},
		
		getObjectsEnd: function ( objects ) {
			
			var i, l,
				node;
			
			objects = ( objects || [] ).concat( this.objects );
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				node = this.nodesByIndex[ this.nodesIndices[ i ] ];
				
				objects = node.getObjectsEnd( objects );
				
			}
			
			return objects;
			
		},
		
		getObjectCountEnd: function () {
			
			var i, l,
				count = this.objects.length;
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				count += this.nodesByIndex[ this.nodesIndices[ i ] ].getObjectCountEnd();
				
			}
			
			return count;
			
		},
		
		getObjectCountStart: function () {
			
			var count = this.objects.length,
				parent = this.parent;
			
			while( parent instanceof THREE.OctreeNode ) {
				
				count += parent.objects.length;
				parent = parent.parent;
				
			}
			
			return count;
			
		},
		
		toConsole: function ( space ) {
			
			var i, l,
				node,
				spaceAddition = '   ';
			
			space = typeof space === 'string' ? space : spaceAddition;
			
			console.log( ( this.parent ? space + ' octree NODE > ' : ' octree ROOT > ' ), this, ' // id: ', this.id, ' // indexOctant: ', this.indexOctant, ' // position: ', this.position.x, this.position.y, this.position.z, ' // radius: ', this.radius, ' // depth: ', this.depth );
			console.log( ( this.parent ? space + ' ' : ' ' ), '+ objects ( ', this.objects.length, ' ) ', this.objects );
			console.log( ( this.parent ? space + ' ' : ' ' ), '+ children ( ', this.nodesIndices.length, ' )', this.nodesIndices, this.nodesByIndex );
			
			for ( i = 0, l = this.nodesIndices.length; i < l; i++ ) {
				
				node = this.nodesByIndex[ this.nodesIndices[ i ] ];
				
				node.toConsole( space + spaceAddition );
				
			}
			
		}
		
	};

	/*===================================================

	raycaster additional functionality

	=====================================================*/
	
	THREE.Raycaster.prototype.intersectOctreeObject = function ( object, recursive ) {
		
		var intersects,
			octreeObject,
			facesAll,
			facesSearch;
		
		if ( object.object instanceof THREE.Object3D ) {
			
			octreeObject = object;
			object = octreeObject.object;
			
			// temporarily replace object geometry's faces with octree object faces
			
			facesSearch = octreeObject.faces;
			facesAll = object.geometry.faces;
			
			if ( facesSearch.length > 0 ) {
				
				object.geometry.faces = facesSearch;
				
			}
			
			// intersect
			
			intersects = this.intersectObject( object, recursive );
			
			// revert object geometry's faces
			
			if ( facesSearch.length > 0 ) {
				
				object.geometry.faces = facesAll;
				
			}
			
		} else {
			
			intersects = this.intersectObject( object, recursive );
			
		}
		
		return intersects;
		
	};
	
	THREE.Raycaster.prototype.intersectOctreeObjects = function ( objects, recursive ) {
		
		var i, il,
			intersects = [];
		
		for ( i = 0, il = objects.length; i < il; i++ ) {
			
			intersects = intersects.concat( this.intersectOctreeObject( objects[ i ], recursive ) );
		
		}
		
		return intersects;
		
	};

}( THREE ) );

THREE.TypedArrayUtils = {};

/**
 * In-place quicksort for typed arrays (e.g. for Float32Array)
 * provides fast sorting
 * useful e.g. for a custom shader and/or BufferGeometry
 *
 * @author Roman Bolzern <roman.bolzern@fhnw.ch>, 2013
 * @author I4DS http://www.fhnw.ch/i4ds, 2013
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 * Complexity: http://bigocheatsheet.com/ see Quicksort
 *
 * Example: 
 * points: [x, y, z, x, y, z, x, y, z, ...]
 * eleSize: 3 //because of (x, y, z)
 * orderElement: 0 //order according to x
 */

THREE.TypedArrayUtils.quicksortIP = function ( arr, eleSize, orderElement ) {

	var stack = [];
	var sp = -1;
	var left = 0;
	var right = arr.length / eleSize - 1;
	var tmp = 0.0, x = 0, y = 0;

	var swapF = function ( a, b ) {

		a *= eleSize; b *= eleSize;

		for ( y = 0; y < eleSize; y ++ ) {

			tmp = arr[ a + y ];
			arr[ a + y ]=arr[ b + y ];
			arr[ b + y ]=tmp;

		}

	};
	
	var i, j, swap = new Float32Array( eleSize ), temp = new Float32Array( eleSize );

	while ( true ) {

		if ( right - left <= 25 ) {

			for ( j= left + 1; j <= right; j ++ ) {

				for ( x = 0; x < eleSize; x ++ ) {
			
					swap[ x ] = arr[ j * eleSize + x ];

				}
				
				i = j - 1;
				
				while ( i >= left && arr[ i * eleSize + orderElement ] > swap[orderElement ] ) {

					for ( x = 0; x < eleSize; x ++ ) {

						arr[ ( i + 1 ) * eleSize + x ] = arr[ i * eleSize + x ];

					}

					i --;

				}

				for ( x = 0; x < eleSize; x ++ ) {

					arr[ ( i + 1 ) * eleSize + x ] = swap[ x ];

				}

			}
			
			if ( sp == -1 ) break;

			right = stack[ sp -- ]; //?
			left = stack[ sp -- ];

		} else {

			var median = ( left + right ) >> 1;

			i = left + 1;
			j = right;
	
			swapF( median, i );

			if ( arr[ left * eleSize + orderElement ] > arr[ right * eleSize + orderElement ] ) {
		
				swapF( left, right );
				
			}

			if ( arr[ i * eleSize + orderElement ] > arr[ right * eleSize + orderElement ] ) {
		
				swapF( i, right );
		
			}

			if ( arr[ left * eleSize + orderElement ] > arr[ i * eleSize + orderElement ] ) {
		
				swapF( left, i );
			
			}

			for ( x = 0; x < eleSize; x ++ ) {

				temp[ x ] = arr[ i * eleSize + x ];

			}
			
			while ( true ) {
				
				do i ++; while ( arr[ i * eleSize + orderElement ] < temp[ orderElement ] );
				do j --; while ( arr[ j * eleSize + orderElement ] > temp[ orderElement ] );
				
				if ( j < i ) break;
		
				swapF( i, j );
			
			}

			for ( x = 0; x < eleSize; x ++ ) {

				arr[ ( left + 1 ) * eleSize + x ] = arr[ j * eleSize + x ];
				arr[ j * eleSize + x ] = temp[ x ];

			}

			if ( right - i + 1 >= j - left ) {

				stack[ ++ sp ] = i;
				stack[ ++ sp ] = right;
				right = j - 1;

			} else {

				stack[ ++ sp ] = left;
				stack[ ++ sp ] = j - 1;
				left = i;

			}

		}

	}

	return arr;

};



/**
 * k-d Tree for typed arrays (e.g. for Float32Array), in-place
 * provides fast nearest neighbour search
 * useful e.g. for a custom shader and/or BufferGeometry, saves tons of memory
 * has no insert and remove, only buildup and neares neighbour search
 *
 * Based on https://github.com/ubilabs/kd-tree-javascript by Ubilabs
 *
 * @author Roman Bolzern <roman.bolzern@fhnw.ch>, 2013
 * @author I4DS http://www.fhnw.ch/i4ds, 2013
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 * Requires typed array quicksort
 *
 * Example: 
 * points: [x, y, z, x, y, z, x, y, z, ...]
 * metric: function(a, b){	return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2); }  //Manhatten distance
 * eleSize: 3 //because of (x, y, z)
 *
 * Further information (including mathematical properties)
 * http://en.wikipedia.org/wiki/Binary_tree
 * http://en.wikipedia.org/wiki/K-d_tree
 *
 * If you want to further minimize memory usage, remove Node.depth and replace in search algorithm with a traversal to root node (see comments at THREE.TypedArrayUtils.Kdtree.prototype.Node)
 */

 THREE.TypedArrayUtils.Kdtree = function ( points, metric, eleSize ) {

	var self = this;
	
	var maxDepth = 0;
	
	var getPointSet = function ( points, pos ) {

		return points.subarray( pos * eleSize, pos * eleSize + eleSize );

	};
		
	function buildTree( points, depth, parent, pos ) {

		var dim = depth % eleSize,
			median,
			node,
			plength = points.length / eleSize;

		if ( depth > maxDepth ) maxDepth = depth;
		
		if ( plength === 0 ) return null;
		if ( plength === 1 ) {

			return new self.Node( getPointSet( points, 0 ), depth, parent, pos );

		}

		THREE.TypedArrayUtils.quicksortIP( points, eleSize, dim );
		
		median = Math.floor( plength / 2 );
		
		node = new self.Node( getPointSet( points, median ) , depth, parent, median + pos );
		node.left = buildTree( points.subarray( 0, median * eleSize), depth + 1, node, pos );
		node.right = buildTree( points.subarray( ( median + 1 ) * eleSize, points.length ), depth + 1, node, pos + median + 1 );

		return node;
	
	}

	this.root = buildTree( points, 0, null, 0 );
		
	this.getMaxDepth = function () { return maxDepth; };
	
	this.nearest = function ( point, maxNodes , maxDistance ) {
	
		 /* point: array of size eleSize 
			maxNodes: max amount of nodes to return 
			maxDistance: maximum distance to point result nodes should have
			condition (not implemented): function to test node before it's added to the result list, e.g. test for view frustum
		*/

		var i,
			result,
			bestNodes;

		bestNodes = new THREE.TypedArrayUtils.Kdtree.BinaryHeap(

			function ( e ) { return -e[ 1 ]; }

		);

		function nearestSearch( node ) {

			var bestChild,
				dimension = node.depth % eleSize,
				ownDistance = metric(point, node.obj),
				linearDistance = 0,
				otherChild,
				i,
				linearPoint = [];

			function saveNode( node, distance ) {

				bestNodes.push( [ node, distance ] );

				if ( bestNodes.size() > maxNodes ) {

					bestNodes.pop();

				}

			}

			for ( i = 0; i < eleSize; i += 1 ) {

				if ( i === node.depth % eleSize ) {

					linearPoint[ i ] = point[ i ];

				} else {

					linearPoint[ i ] = node.obj[ i ];

				}

			}

			linearDistance = metric( linearPoint, node.obj );

			// if it's a leaf

			if ( node.right === null && node.left === null ) {

				if ( bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[ 1 ] ) {

					saveNode( node, ownDistance );

				}

				return;

			}

			if ( node.right === null ) {

				bestChild = node.left;

			} else if ( node.left === null ) {

				bestChild = node.right;

			} else {

				if ( point[ dimension ] < node.obj[ dimension ] ) {

					bestChild = node.left;

				} else {

					bestChild = node.right;

				}

			}

			// recursive search

			nearestSearch( bestChild );

			if ( bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[ 1 ] ) {

				saveNode( node, ownDistance );

			}

			// if there's still room or the current distance is nearer than the best distance

			if ( bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[ 1 ] ) {

				if ( bestChild === node.left ) {

					otherChild = node.right;

				} else {

					otherChild = node.left;

				}

				if ( otherChild !== null ) {

					nearestSearch( otherChild );

				}

			}

		}

		if ( maxDistance ) {

			for ( i = 0; i < maxNodes; i += 1 ) {

				bestNodes.push( [ null, maxDistance ] );

			}

		}

		nearestSearch( self.root );

		result = [];

		for ( i = 0; i < maxNodes; i += 1 ) {

			if ( bestNodes.content[ i ][ 0 ] ) {

				result.push( [ bestNodes.content[ i ][ 0 ], bestNodes.content[ i ][ 1 ] ] );

			}

		}
		
		return result;
	
	};
	
};

/**
 * If you need to free up additional memory and agree with an additional O( log n ) traversal time you can get rid of "depth" and "pos" in Node:
 * Depth can be easily done by adding 1 for every parent (care: root node has depth 0, not 1)
 * Pos is a bit tricky: Assuming the tree is balanced (which is the case when after we built it up), perform the following steps:
 *   By traversing to the root store the path e.g. in a bit pattern (01001011, 0 is left, 1 is right)
 *   From buildTree we know that "median = Math.floor( plength / 2 );", therefore for each bit...
 *     0: amountOfNodesRelevantForUs = Math.floor( (pamountOfNodesRelevantForUs - 1) / 2 );
 *     1: amountOfNodesRelevantForUs = Math.ceil( (pamountOfNodesRelevantForUs - 1) / 2 );
 *        pos += Math.floor( (pamountOfNodesRelevantForUs - 1) / 2 );
 *     when recursion done, we still need to add all left children of target node:
 *        pos += Math.floor( (pamountOfNodesRelevantForUs - 1) / 2 );
 *        and I think you need to +1 for the current position, not sure.. depends, try it out ^^
 *
 * I experienced that for 200'000 nodes you can get rid of 4 MB memory each, leading to 8 MB memory saved.
 */
THREE.TypedArrayUtils.Kdtree.prototype.Node = function ( obj, depth, parent, pos ) {

	this.obj = obj;
	this.left = null;
	this.right = null;
	this.parent = parent;
	this.depth = depth;
	this.pos = pos;

}; 

/**
 * Binary heap implementation
 * @author http://eloquentjavascript.net/appendix2.htm
 */

THREE.TypedArrayUtils.Kdtree.BinaryHeap = function ( scoreFunction ) {

	this.content = [];
	this.scoreFunction = scoreFunction;

};

THREE.TypedArrayUtils.Kdtree.BinaryHeap.prototype = {

	push: function ( element ) {

		// Add the new element to the end of the array.
		this.content.push( element );

		// Allow it to bubble up.
		this.bubbleUp( this.content.length - 1 );

	},

	pop: function () {

		// Store the first element so we can return it later.
		var result = this.content[ 0 ];

		// Get the element at the end of the array.
		var end = this.content.pop();

		// If there are any elements left, put the end element at the
		// start, and let it sink down.
		if ( this.content.length > 0 ) {

			this.content[ 0 ] = end;
			this.sinkDown( 0 );

		}

		return result;

	},

	peek: function () {

		return this.content[ 0 ];

	},

	remove: function ( node ) {

		var len = this.content.length;

		// To remove a value, we must search through the array to find it.
		for ( var i = 0; i < len; i ++ ) {

			if ( this.content[ i ] == node ) {

				// When it is found, the process seen in 'pop' is repeated
				// to fill up the hole.
				var end = this.content.pop();

				if ( i != len - 1 ) {

					this.content[ i ] = end;

					if ( this.scoreFunction( end ) < this.scoreFunction( node ) ) {

						this.bubbleUp( i );

					} else {

						this.sinkDown( i );

					}

				}

				return;

			}

		}

		throw new Error( "Node not found." );

	},

	size: function () {

		return this.content.length;

	},

	bubbleUp: function ( n ) {

		// Fetch the element that has to be moved.
		var element = this.content[ n ];

		// When at 0, an element can not go up any further.
		while ( n > 0 ) {

			// Compute the parent element's index, and fetch it.
			var parentN = Math.floor( ( n + 1 ) / 2 ) - 1,
				parent = this.content[ parentN ];

			// Swap the elements if the parent is greater.
			if ( this.scoreFunction( element ) < this.scoreFunction( parent ) ) {

				this.content[ parentN ] = element;
				this.content[ n ] = parent;

				// Update 'n' to continue at the new position.
				n = parentN;

			} else {

				// Found a parent that is less, no need to move it further.
				break;

			}

		}

	},

	sinkDown: function ( n ) {

		// Look up the target element and its score.
		var length = this.content.length,
			element = this.content[ n ],
			elemScore = this.scoreFunction( element );

		while ( true ) {

			// Compute the indices of the child elements.
			var child2N = ( n + 1 ) * 2, child1N = child2N - 1;

			// This is used to store the new position of the element, if any.
			var swap = null;

			// If the first child exists (is inside the array)...
			if ( child1N < length ) {

				// Look it up and compute its score.
				var child1 = this.content[ child1N ],
					child1Score = this.scoreFunction( child1 );

				// If the score is less than our element's, we need to swap.
				if ( child1Score < elemScore ) swap = child1N;

			}

			// Do the same checks for the other child.
			if ( child2N < length ) {

				var child2 = this.content[ child2N ],
					child2Score = this.scoreFunction( child2 );

				if ( child2Score < ( swap === null ? elemScore : child1Score ) ) swap = child2N;

			}

			// If the element needs to be moved, swap it, and continue.
			if ( swap !== null ) {

				this.content[ n ] = this.content[ swap ];
				this.content[ swap ] = element;
				n = swap;

			} else {

				// Otherwise, we are done.
				break;

			}

		}

	}

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author julianwa / https://github.com/julianwa
 */

THREE.RenderableObject = function () {

	this.id = 0;

	this.object = null;
	this.z = 0;

};

//

THREE.RenderableFace = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();
	this.v3 = new THREE.RenderableVertex();

	this.normalModel = new THREE.Vector3();

	this.vertexNormalsModel = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	this.vertexNormalsLength = 0;

	this.color = new THREE.Color();
	this.material = null;
	this.uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];

	this.z = 0;

};

//

THREE.RenderableVertex = function () {

	this.position = new THREE.Vector3();
	this.positionWorld = new THREE.Vector3();
	this.positionScreen = new THREE.Vector4();

	this.visible = true;

};

THREE.RenderableVertex.prototype.copy = function ( vertex ) {

	this.positionWorld.copy( vertex.positionWorld );
	this.positionScreen.copy( vertex.positionScreen );

};

//

THREE.RenderableLine = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();

	this.vertexColors = [ new THREE.Color(), new THREE.Color() ];
	this.material = null;

	this.z = 0;

};

//

THREE.RenderableSprite = function () {

	this.id = 0;

	this.object = null;

	this.x = 0;
	this.y = 0;
	this.z = 0;

	this.rotation = 0;
	this.scale = new THREE.Vector2();

	this.material = null;

};

//

THREE.Projector = function () {

	var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
	_vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
	_face, _faceCount, _facePool = [], _facePoolLength = 0,
	_line, _lineCount, _linePool = [], _linePoolLength = 0,
	_sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,

	_renderData = { objects: [], lights: [], elements: [] },

	_vA = new THREE.Vector3(),
	_vB = new THREE.Vector3(),
	_vC = new THREE.Vector3(),

	_vector3 = new THREE.Vector3(),
	_vector4 = new THREE.Vector4(),

	_clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
	_boundingBox = new THREE.Box3(),
	_points3 = new Array( 3 ),
	_points4 = new Array( 4 ),

	_viewMatrix = new THREE.Matrix4(),
	_viewProjectionMatrix = new THREE.Matrix4(),

	_modelMatrix,
	_modelViewProjectionMatrix = new THREE.Matrix4(),

	_normalMatrix = new THREE.Matrix3(),

	_frustum = new THREE.Frustum(),

	_clippedVertex1PositionScreen = new THREE.Vector4(),
	_clippedVertex2PositionScreen = new THREE.Vector4();

	//

	this.projectVector = function ( vector, camera ) {

		console.warn( 'THREE.Projector: .projectVector() is now vector.project().' );
		vector.project( camera );

	};

	this.unprojectVector = function ( vector, camera ) {

		console.warn( 'THREE.Projector: .unprojectVector() is now vector.unproject().' );
		vector.unproject( camera );

	};

	this.pickingRay = function ( vector, camera ) {

		console.error( 'THREE.Projector: .pickingRay() is now raycaster.setFromCamera().' );

	};

	//

	var RenderList = function () {

		var normals = [];
		var uvs = [];

		var object = null;
		var material = null;

		var normalMatrix = new THREE.Matrix3();

		var setObject = function ( value ) {

			object = value;
			material = object.material;

			normalMatrix.getNormalMatrix( object.matrixWorld );

			normals.length = 0;
			uvs.length = 0;

		};

		var projectVertex = function ( vertex ) {

			var position = vertex.position;
			var positionWorld = vertex.positionWorld;
			var positionScreen = vertex.positionScreen;

			positionWorld.copy( position ).applyMatrix4( _modelMatrix );
			positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

			var invW = 1 / positionScreen.w;

			positionScreen.x *= invW;
			positionScreen.y *= invW;
			positionScreen.z *= invW;

			vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
					 positionScreen.y >= - 1 && positionScreen.y <= 1 &&
					 positionScreen.z >= - 1 && positionScreen.z <= 1;

		};

		var pushVertex = function ( x, y, z ) {

			_vertex = getNextVertexInPool();
			_vertex.position.set( x, y, z );

			projectVertex( _vertex );

		};

		var pushNormal = function ( x, y, z ) {

			normals.push( x, y, z );

		};

		var pushUv = function ( x, y ) {

			uvs.push( x, y );

		};

		var checkTriangleVisibility = function ( v1, v2, v3 ) {

			if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

			_points3[ 0 ] = v1.positionScreen;
			_points3[ 1 ] = v2.positionScreen;
			_points3[ 2 ] = v3.positionScreen;

			return _clipBox.isIntersectionBox( _boundingBox.setFromPoints( _points3 ) );

		};

		var checkBackfaceCulling = function ( v1, v2, v3 ) {

			return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
				    ( v2.positionScreen.y - v1.positionScreen.y ) -
				    ( v3.positionScreen.y - v1.positionScreen.y ) *
				    ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

		};

		var pushLine = function ( a, b ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];

			_line = getNextLineInPool();

			_line.id = object.id;
			_line.v1.copy( v1 );
			_line.v2.copy( v2 );
			_line.z = ( v1.positionScreen.z + v2.positionScreen.z ) / 2;

			_line.material = object.material;

			_renderData.elements.push( _line );

		};

		var pushTriangle = function ( a, b, c ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];
			var v3 = _vertexPool[ c ];

			if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

			if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

				_face = getNextFaceInPool();

				_face.id = object.id;
				_face.v1.copy( v1 );
				_face.v2.copy( v2 );
				_face.v3.copy( v3 );
				_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

				for ( var i = 0; i < 3; i ++ ) {

					var offset = arguments[ i ] * 3;
					var normal = _face.vertexNormalsModel[ i ];

					normal.set( normals[ offset ], normals[ offset + 1 ], normals[ offset + 2 ] );
					normal.applyMatrix3( normalMatrix ).normalize();

					var offset2 = arguments[ i ] * 2;

					var uv = _face.uvs[ i ];
					uv.set( uvs[ offset2 ], uvs[ offset2 + 1 ] );

				}

				_face.vertexNormalsLength = 3;

				_face.material = object.material;

				_renderData.elements.push( _face );

			}

		};

		return {
			setObject: setObject,
			projectVertex: projectVertex,
			checkTriangleVisibility: checkTriangleVisibility,
			checkBackfaceCulling: checkBackfaceCulling,
			pushVertex: pushVertex,
			pushNormal: pushNormal,
			pushUv: pushUv,
			pushLine: pushLine,
			pushTriangle: pushTriangle
		}

	};

	var renderList = new RenderList();

	this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

		_faceCount = 0;
		_lineCount = 0;
		_spriteCount = 0;

		_renderData.elements.length = 0;

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
		if ( camera.parent === undefined ) camera.updateMatrixWorld();

		_viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
		_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

		_frustum.setFromMatrix( _viewProjectionMatrix );

		//

		_objectCount = 0;

		_renderData.objects.length = 0;
		_renderData.lights.length = 0;

		scene.traverseVisible( function ( object ) {

			if ( object instanceof THREE.Light ) {

				_renderData.lights.push( object );

			} else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite ) {

				if ( object.material.visible === false ) return;

				if ( object.frustumCulled === false || _frustum.intersectsObject( object ) === true ) {

					_object = getNextObjectInPool();
					_object.id = object.id;
					_object.object = object;

					_vector3.setFromMatrixPosition( object.matrixWorld );
					_vector3.applyProjection( _viewProjectionMatrix );
					_object.z = _vector3.z;

					_renderData.objects.push( _object );

				}

			}

		} );

		if ( sortObjects === true ) {

			_renderData.objects.sort( painterSort );

		}

		//

		for ( var o = 0, ol = _renderData.objects.length; o < ol; o ++ ) {

			var object = _renderData.objects[ o ].object;
			var geometry = object.geometry;

			renderList.setObject( object );

			_modelMatrix = object.matrixWorld;

			_vertexCount = 0;

			if ( object instanceof THREE.Mesh ) {

				if ( geometry instanceof THREE.BufferGeometry ) {

					var attributes = geometry.attributes;
					var offsets = geometry.offsets;

					if ( attributes.position === undefined ) continue;

					var positions = attributes.position.array;

					for ( var i = 0, l = positions.length; i < l; i += 3 ) {

						renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

					}

					if ( attributes.normal !== undefined ) {

						var normals = attributes.normal.array;

						for ( var i = 0, l = normals.length; i < l; i += 3 ) {

							renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

						}

					}

					if ( attributes.uv !== undefined ) {

						var uvs = attributes.uv.array;

						for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

							renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

						}

					}

					if ( attributes.index !== undefined ) {

						var indices = attributes.index.array;

						if ( offsets.length > 0 ) {

							for ( var o = 0; o < offsets.length; o ++ ) {

								var offset = offsets[ o ];
								var index = offset.index;

								for ( var i = offset.start, l = offset.start + offset.count; i < l; i += 3 ) {

									renderList.pushTriangle( indices[ i ] + index, indices[ i + 1 ] + index, indices[ i + 2 ] + index );

								}

							}

						} else {

							for ( var i = 0, l = indices.length; i < l; i += 3 ) {

								renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

							}

						}

					} else {

						for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

							renderList.pushTriangle( i, i + 1, i + 2 );

						}

					}

				} else if ( geometry instanceof THREE.Geometry ) {

					var vertices = geometry.vertices;
					var faces = geometry.faces;
					var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

					_normalMatrix.getNormalMatrix( _modelMatrix );

					var isFaceMaterial = object.material instanceof THREE.MeshFaceMaterial;
					var objectMaterials = isFaceMaterial === true ? object.material : null;

					for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

						var vertex = vertices[ v ];
						renderList.pushVertex( vertex.x, vertex.y, vertex.z );

					}

					for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

						var face = faces[ f ];

						var material = isFaceMaterial === true
							 ? objectMaterials.materials[ face.materialIndex ]
							 : object.material;

						if ( material === undefined ) continue;

						var side = material.side;

						var v1 = _vertexPool[ face.a ];
						var v2 = _vertexPool[ face.b ];
						var v3 = _vertexPool[ face.c ];

						if ( material.morphTargets === true ) {

							var morphTargets = geometry.morphTargets;
							var morphInfluences = object.morphTargetInfluences;

							var v1p = v1.position;
							var v2p = v2.position;
							var v3p = v3.position;

							_vA.set( 0, 0, 0 );
							_vB.set( 0, 0, 0 );
							_vC.set( 0, 0, 0 );

							for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

								var influence = morphInfluences[ t ];

								if ( influence === 0 ) continue;

								var targets = morphTargets[ t ].vertices;

								_vA.x += ( targets[ face.a ].x - v1p.x ) * influence;
								_vA.y += ( targets[ face.a ].y - v1p.y ) * influence;
								_vA.z += ( targets[ face.a ].z - v1p.z ) * influence;

								_vB.x += ( targets[ face.b ].x - v2p.x ) * influence;
								_vB.y += ( targets[ face.b ].y - v2p.y ) * influence;
								_vB.z += ( targets[ face.b ].z - v2p.z ) * influence;

								_vC.x += ( targets[ face.c ].x - v3p.x ) * influence;
								_vC.y += ( targets[ face.c ].y - v3p.y ) * influence;
								_vC.z += ( targets[ face.c ].z - v3p.z ) * influence;

							}

							v1.position.add( _vA );
							v2.position.add( _vB );
							v3.position.add( _vC );

							renderList.projectVertex( v1 );
							renderList.projectVertex( v2 );
							renderList.projectVertex( v3 );

						}

						if ( renderList.checkTriangleVisibility( v1, v2, v3 ) === false ) continue;

						var visible = renderList.checkBackfaceCulling( v1, v2, v3 );

						if ( side !== THREE.DoubleSide ) {
							if ( side === THREE.FrontSide && visible === false ) continue;
							if ( side === THREE.BackSide && visible === true ) continue;
						}

						_face = getNextFaceInPool();

						_face.id = object.id;
						_face.v1.copy( v1 );
						_face.v2.copy( v2 );
						_face.v3.copy( v3 );

						_face.normalModel.copy( face.normal );

						if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

							_face.normalModel.negate();

						}

						_face.normalModel.applyMatrix3( _normalMatrix ).normalize();

						var faceVertexNormals = face.vertexNormals;

						for ( var n = 0, nl = Math.min( faceVertexNormals.length, 3 ); n < nl; n ++ ) {

							var normalModel = _face.vertexNormalsModel[ n ];
							normalModel.copy( faceVertexNormals[ n ] );

							if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

								normalModel.negate();

							}

							normalModel.applyMatrix3( _normalMatrix ).normalize();

						}

						_face.vertexNormalsLength = faceVertexNormals.length;

						var vertexUvs = faceVertexUvs[ f ];

						if ( vertexUvs !== undefined ) {

							for ( var u = 0; u < 3; u ++ ) {

								_face.uvs[ u ].copy( vertexUvs[ u ] );

							}

						}

						_face.color = face.color;
						_face.material = material;

						_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

						_renderData.elements.push( _face );

					}

				}

			} else if ( object instanceof THREE.Line ) {

				if ( geometry instanceof THREE.BufferGeometry ) {

					var attributes = geometry.attributes;

					if ( attributes.position !== undefined ) {

						var positions = attributes.position.array;

						for ( var i = 0, l = positions.length; i < l; i += 3 ) {

							renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

						}

						if ( attributes.index !== undefined ) {

							var indices = attributes.index.array;

							for ( var i = 0, l = indices.length; i < l; i += 2 ) {

								renderList.pushLine( indices[ i ], indices[ i + 1 ] );

							}

						} else {

							var step = object.mode === THREE.LinePieces ? 2 : 1;

							for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

								renderList.pushLine( i, i + 1 );

							}

						}

					}

				} else if ( geometry instanceof THREE.Geometry ) {

					_modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

					var vertices = object.geometry.vertices;

					if ( vertices.length === 0 ) continue;

					v1 = getNextVertexInPool();
					v1.positionScreen.copy( vertices[ 0 ] ).applyMatrix4( _modelViewProjectionMatrix );

					// Handle LineStrip and LinePieces
					var step = object.mode === THREE.LinePieces ? 2 : 1;

					for ( var v = 1, vl = vertices.length; v < vl; v ++ ) {

						v1 = getNextVertexInPool();
						v1.positionScreen.copy( vertices[ v ] ).applyMatrix4( _modelViewProjectionMatrix );

						if ( ( v + 1 ) % step > 0 ) continue;

						v2 = _vertexPool[ _vertexCount - 2 ];

						_clippedVertex1PositionScreen.copy( v1.positionScreen );
						_clippedVertex2PositionScreen.copy( v2.positionScreen );

						if ( clipLine( _clippedVertex1PositionScreen, _clippedVertex2PositionScreen ) === true ) {

							// Perform the perspective divide
							_clippedVertex1PositionScreen.multiplyScalar( 1 / _clippedVertex1PositionScreen.w );
							_clippedVertex2PositionScreen.multiplyScalar( 1 / _clippedVertex2PositionScreen.w );

							_line = getNextLineInPool();

							_line.id = object.id;
							_line.v1.positionScreen.copy( _clippedVertex1PositionScreen );
							_line.v2.positionScreen.copy( _clippedVertex2PositionScreen );

							_line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );

							_line.material = object.material;

							if ( object.material.vertexColors === THREE.VertexColors ) {

								_line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
								_line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );

							}

							_renderData.elements.push( _line );

						}

					}

				}

			} else if ( object instanceof THREE.Sprite ) {

				_vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
				_vector4.applyMatrix4( _viewProjectionMatrix );

				var invW = 1 / _vector4.w;

				_vector4.z *= invW;

				if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

					_sprite = getNextSpriteInPool();
					_sprite.id = object.id;
					_sprite.x = _vector4.x * invW;
					_sprite.y = _vector4.y * invW;
					_sprite.z = _vector4.z;
					_sprite.object = object;

					_sprite.rotation = object.rotation;

					_sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
					_sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

					_sprite.material = object.material;

					_renderData.elements.push( _sprite );

				}

			}

		}

		if ( sortElements === true ) {

			_renderData.elements.sort( painterSort );

		}

		return _renderData;

	};

	// Pools

	function getNextObjectInPool() {

		if ( _objectCount === _objectPoolLength ) {

			var object = new THREE.RenderableObject();
			_objectPool.push( object );
			_objectPoolLength ++;
			_objectCount ++;
			return object;

		}

		return _objectPool[ _objectCount ++ ];

	}

	function getNextVertexInPool() {

		if ( _vertexCount === _vertexPoolLength ) {

			var vertex = new THREE.RenderableVertex();
			_vertexPool.push( vertex );
			_vertexPoolLength ++;
			_vertexCount ++;
			return vertex;

		}

		return _vertexPool[ _vertexCount ++ ];

	}

	function getNextFaceInPool() {

		if ( _faceCount === _facePoolLength ) {

			var face = new THREE.RenderableFace();
			_facePool.push( face );
			_facePoolLength ++;
			_faceCount ++;
			return face;

		}

		return _facePool[ _faceCount ++ ];


	}

	function getNextLineInPool() {

		if ( _lineCount === _linePoolLength ) {

			var line = new THREE.RenderableLine();
			_linePool.push( line );
			_linePoolLength ++;
			_lineCount ++
			return line;

		}

		return _linePool[ _lineCount ++ ];

	}

	function getNextSpriteInPool() {

		if ( _spriteCount === _spritePoolLength ) {

			var sprite = new THREE.RenderableSprite();
			_spritePool.push( sprite );
			_spritePoolLength ++;
			_spriteCount ++
			return sprite;

		}

		return _spritePool[ _spriteCount ++ ];

	}

	//

	function painterSort( a, b ) {

		if ( a.z !== b.z ) {

			return b.z - a.z;

		} else if ( a.id !== b.id ) {

			return a.id - b.id;

		} else {

			return 0;

		}

	}

	function clipLine( s1, s2 ) {

		var alpha1 = 0, alpha2 = 1,

		// Calculate the boundary coordinate of each vertex for the near and far clip planes,
		// Z = -1 and Z = +1, respectively.
		bc1near =  s1.z + s1.w,
		bc2near =  s2.z + s2.w,
		bc1far =  - s1.z + s1.w,
		bc2far =  - s2.z + s2.w;

		if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

			// Both vertices lie entirely within all clip planes.
			return true;

		} else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

			// Both vertices lie entirely outside one of the clip planes.
			return false;

		} else {

			// The line segment spans at least one clip plane.

			if ( bc1near < 0 ) {

				// v1 lies outside the near plane, v2 inside
				alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

			} else if ( bc2near < 0 ) {

				// v2 lies outside the near plane, v1 inside
				alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

			}

			if ( bc1far < 0 ) {

				// v1 lies outside the far plane, v2 inside
				alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

			} else if ( bc2far < 0 ) {

				// v2 lies outside the far plane, v2 inside
				alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

			}

			if ( alpha2 < alpha1 ) {

				// The line segment spans two boundaries, but is outside both of them.
				// (This can't happen when we're only clipping against just near/far but good
				//  to leave the check here for future usage if other clip planes are added.)
				return false;

			} else {

				// Update the s1 and s2 vertices to match the clipped line segment.
				s1.lerp( s2, alpha1 );
				s2.lerp( s1, 1 - alpha2 );

				return true;

			}

		}

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Port of greggman's ThreeD version of marching cubes to Three.js
 * http://webglsamples.googlecode.com/hg/blob/blob.html
 */

/////////////////////////////////////
// Marching cubes lookup tables
/////////////////////////////////////

// These tables are straight from Paul Bourke's page:
// http://local.wasp.uwa.edu.au/~pbourke/geometry/polygonise/
// who in turn got them from Cory Gene Bloyd.

THREE.edgeTable = new Int32Array([
0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0])

THREE.triTable = new Int32Array([
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);

'use strict';
window.ThreeBSP = (function() {
	
	var ThreeBSP,
		EPSILON = 1e-5,
		COPLANAR = 0,
		FRONT = 1,
		BACK = 2,
		SPANNING = 3;
	
	ThreeBSP = function( geometry ) {
		// Convert THREE.Geometry to ThreeBSP
		var i, _length_i,
			face, vertex, faceVertexUvs, uvs,
			polygon,
			polygons = [],
			tree;
	
		if ( geometry instanceof THREE.Geometry ) {
			this.matrix = new THREE.Matrix4;
		} else if ( geometry instanceof THREE.Mesh ) {
			// #todo: add hierarchy support
			geometry.updateMatrix();
			this.matrix = geometry.matrix.clone();
			geometry = geometry.geometry;
		} else if ( geometry instanceof ThreeBSP.Node ) {
			this.tree = geometry;
			this.matrix = new THREE.Matrix4;
			return this;
		} else {
			throw 'ThreeBSP: Given geometry is unsupported';
		}
	
		for ( i = 0, _length_i = geometry.faces.length; i < _length_i; i++ ) {
			face = geometry.faces[i];
			faceVertexUvs = geometry.faceVertexUvs[0][i];
			polygon = new ThreeBSP.Polygon;
			
			if ( face instanceof THREE.Face3 ) {
				vertex = geometry.vertices[ face.a ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[0].x, faceVertexUvs[0].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
				
				vertex = geometry.vertices[ face.b ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[1].x, faceVertexUvs[1].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
				
				vertex = geometry.vertices[ face.c ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[2].x, faceVertexUvs[2].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
			} else if ( typeof THREE.Face4 ) {
				vertex = geometry.vertices[ face.a ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[0].x, faceVertexUvs[0].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[0], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
				
				vertex = geometry.vertices[ face.b ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[1].x, faceVertexUvs[1].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[1], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
				
				vertex = geometry.vertices[ face.c ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[2].x, faceVertexUvs[2].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[2], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
				
				vertex = geometry.vertices[ face.d ];
                                uvs = faceVertexUvs ? new THREE.Vector2( faceVertexUvs[3].x, faceVertexUvs[3].y ) : null;
                                vertex = new ThreeBSP.Vertex( vertex.x, vertex.y, vertex.z, face.vertexNormals[3], uvs );
				vertex.applyMatrix4(this.matrix);
				polygon.vertices.push( vertex );
			} else {
				throw 'Invalid face type at index ' + i;
			}
			
			polygon.calculateProperties();
			polygons.push( polygon );
		};
	
		this.tree = new ThreeBSP.Node( polygons );
	};
	ThreeBSP.prototype.subtract = function( other_tree ) {
		var a = this.tree.clone(),
			b = other_tree.tree.clone();
		
		a.invert();
		a.clipTo( b );
		b.clipTo( a );
		b.invert();
		b.clipTo( a );
		b.invert();
		a.build( b.allPolygons() );
		a.invert();
		a = new ThreeBSP( a );
		a.matrix = this.matrix;
		return a;
	};
	ThreeBSP.prototype.union = function( other_tree ) {
		var a = this.tree.clone(),
			b = other_tree.tree.clone();
		
		a.clipTo( b );
		b.clipTo( a );
		b.invert();
		b.clipTo( a );
		b.invert();
		a.build( b.allPolygons() );
		a = new ThreeBSP( a );
		a.matrix = this.matrix;
		return a;
	};
	ThreeBSP.prototype.intersect = function( other_tree ) {
		var a = this.tree.clone(),
			b = other_tree.tree.clone();
		
		a.invert();
		b.clipTo( a );
		b.invert();
		a.clipTo( b );
		b.clipTo( a );
		a.build( b.allPolygons() );
		a.invert();
		a = new ThreeBSP( a );
		a.matrix = this.matrix;
		return a;
	};
	ThreeBSP.prototype.toGeometry = function() {
		var i, j,
			matrix = new THREE.Matrix4().getInverse( this.matrix ),
			geometry = new THREE.Geometry(),
			polygons = this.tree.allPolygons(),
			polygon_count = polygons.length,
			polygon, polygon_vertice_count,
			vertice_dict = {},
			vertex_idx_a, vertex_idx_b, vertex_idx_c,
			vertex, face,
			verticeUvs;
	
		for ( i = 0; i < polygon_count; i++ ) {
			polygon = polygons[i];
			polygon_vertice_count = polygon.vertices.length;
			
			for ( j = 2; j < polygon_vertice_count; j++ ) {
				verticeUvs = [];
				
				vertex = polygon.vertices[0];
				verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
				vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
				vertex.applyMatrix4(matrix);
				
				if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
					vertex_idx_a = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
				} else {
					geometry.vertices.push( vertex );
					vertex_idx_a = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
				}
				
				vertex = polygon.vertices[j-1];
				verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
				vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
				vertex.applyMatrix4(matrix);
				if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
					vertex_idx_b = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
				} else {
					geometry.vertices.push( vertex );
					vertex_idx_b = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
				}
				
				vertex = polygon.vertices[j];
				verticeUvs.push( new THREE.Vector2( vertex.uv.x, vertex.uv.y ) );
				vertex = new THREE.Vector3( vertex.x, vertex.y, vertex.z );
				vertex.applyMatrix4(matrix);
				if ( typeof vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] !== 'undefined' ) {
					vertex_idx_c = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ];
				} else {
					geometry.vertices.push( vertex );
					vertex_idx_c = vertice_dict[ vertex.x + ',' + vertex.y + ',' + vertex.z ] = geometry.vertices.length - 1;
				}
				
				face = new THREE.Face3(
					vertex_idx_a,
					vertex_idx_b,
					vertex_idx_c,
					new THREE.Vector3( polygon.normal.x, polygon.normal.y, polygon.normal.z )
				);
				
				geometry.faces.push( face );
				geometry.faceVertexUvs[0].push( verticeUvs );
			}
			
		}
		return geometry;
	};
	ThreeBSP.prototype.toMesh = function( material ) {
		var geometry = this.toGeometry(),
			mesh = new THREE.Mesh( geometry, material );
		
		mesh.position.setFromMatrixPosition( this.matrix );
		mesh.rotation.setFromRotationMatrix( this.matrix );
		
		return mesh;
	};
	
	
	ThreeBSP.Polygon = function( vertices, normal, w ) {
		if ( !( vertices instanceof Array ) ) {
			vertices = [];
		}
		
		this.vertices = vertices;
		if ( vertices.length > 0 ) {
			this.calculateProperties();
		} else {
			this.normal = this.w = undefined;
		}
	};
	ThreeBSP.Polygon.prototype.calculateProperties = function() {
		var a = this.vertices[0],
			b = this.vertices[1],
			c = this.vertices[2];
			
		this.normal = b.clone().subtract( a ).cross(
			c.clone().subtract( a )
		).normalize();
		
		this.w = this.normal.clone().dot( a );
		
		return this;
	};
	ThreeBSP.Polygon.prototype.clone = function() {
		var i, vertice_count,
			polygon = new ThreeBSP.Polygon;
		
		for ( i = 0, vertice_count = this.vertices.length; i < vertice_count; i++ ) {
			polygon.vertices.push( this.vertices[i].clone() );
		};
		polygon.calculateProperties();
		
		return polygon;
	};
	
	ThreeBSP.Polygon.prototype.flip = function() {
		var i, vertices = [];
		
		this.normal.multiplyScalar( -1 );
		this.w *= -1;
		
		for ( i = this.vertices.length - 1; i >= 0; i-- ) {
			vertices.push( this.vertices[i] );
		};
		this.vertices = vertices;
		
		return this;
	};
	ThreeBSP.Polygon.prototype.classifyVertex = function( vertex ) {  
		var side_value = this.normal.dot( vertex ) - this.w;
		
		if ( side_value < -EPSILON ) {
			return BACK;
		} else if ( side_value > EPSILON ) {
			return FRONT;
		} else {
			return COPLANAR;
		}
	};
	ThreeBSP.Polygon.prototype.classifySide = function( polygon ) {
		var i, vertex, classification,
			num_positive = 0,
			num_negative = 0,
			vertice_count = polygon.vertices.length;
		
		for ( i = 0; i < vertice_count; i++ ) {
			vertex = polygon.vertices[i];
			classification = this.classifyVertex( vertex );
			if ( classification === FRONT ) {
				num_positive++;
			} else if ( classification === BACK ) {
				num_negative++;
			}
		}
		
		if ( num_positive > 0 && num_negative === 0 ) {
			return FRONT;
		} else if ( num_positive === 0 && num_negative > 0 ) {
			return BACK;
		} else if ( num_positive === 0 && num_negative === 0 ) {
			return COPLANAR;
		} else {
			return SPANNING;
		}
	};
	ThreeBSP.Polygon.prototype.splitPolygon = function( polygon, coplanar_front, coplanar_back, front, back ) {
		var classification = this.classifySide( polygon );
		
		if ( classification === COPLANAR ) {
			
			( this.normal.dot( polygon.normal ) > 0 ? coplanar_front : coplanar_back ).push( polygon );
			
		} else if ( classification === FRONT ) {
			
			front.push( polygon );
			
		} else if ( classification === BACK ) {
			
			back.push( polygon );
			
		} else {
			
			var vertice_count,
				i, j, ti, tj, vi, vj,
				t, v,
				f = [],
				b = [];
			
			for ( i = 0, vertice_count = polygon.vertices.length; i < vertice_count; i++ ) {
				
				j = (i + 1) % vertice_count;
				vi = polygon.vertices[i];
				vj = polygon.vertices[j];
				ti = this.classifyVertex( vi );
				tj = this.classifyVertex( vj );
				
				if ( ti != BACK ) f.push( vi );
				if ( ti != FRONT ) b.push( vi );
				if ( (ti | tj) === SPANNING ) {
					t = ( this.w - this.normal.dot( vi ) ) / this.normal.dot( vj.clone().subtract( vi ) );
					v = vi.interpolate( vj, t );
					f.push( v );
					b.push( v );
				}
			}
			
			
			if ( f.length >= 3 ) front.push( new ThreeBSP.Polygon( f ).calculateProperties() );
			if ( b.length >= 3 ) back.push( new ThreeBSP.Polygon( b ).calculateProperties() );
		}
	};
	
	ThreeBSP.Vertex = function( x, y, z, normal, uv ) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.normal = normal || new THREE.Vector3;
		this.uv = uv || new THREE.Vector2;
	};
	ThreeBSP.Vertex.prototype.clone = function() {
		return new ThreeBSP.Vertex( this.x, this.y, this.z, this.normal.clone(), this.uv.clone() );
	};
	ThreeBSP.Vertex.prototype.add = function( vertex ) {
		this.x += vertex.x;
		this.y += vertex.y;
		this.z += vertex.z;
		return this;
	};
	ThreeBSP.Vertex.prototype.subtract = function( vertex ) {
		this.x -= vertex.x;
		this.y -= vertex.y;
		this.z -= vertex.z;
		return this;
	};
	ThreeBSP.Vertex.prototype.multiplyScalar = function( scalar ) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	};
	ThreeBSP.Vertex.prototype.cross = function( vertex ) {
		var x = this.x,
			y = this.y,
			z = this.z;

		this.x = y * vertex.z - z * vertex.y;
		this.y = z * vertex.x - x * vertex.z;
		this.z = x * vertex.y - y * vertex.x;
		
		return this;
	};
	ThreeBSP.Vertex.prototype.normalize = function() {
		var length = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
		
		this.x /= length;
		this.y /= length;
		this.z /= length;
		
		return this;
	};
	ThreeBSP.Vertex.prototype.dot = function( vertex ) {
		return this.x * vertex.x + this.y * vertex.y + this.z * vertex.z;
	};
	ThreeBSP.Vertex.prototype.lerp = function( a, t ) {
		this.add(
			a.clone().subtract( this ).multiplyScalar( t )
		);
		
		this.normal.add(
			a.normal.clone().sub( this.normal ).multiplyScalar( t )
		);
		
		this.uv.add(
			a.uv.clone().sub( this.uv ).multiplyScalar( t )
		);
		
		return this;
	};
	ThreeBSP.Vertex.prototype.interpolate = function( other, t ) {
		return this.clone().lerp( other, t );
	};
	ThreeBSP.Vertex.prototype.applyMatrix4 = function ( m ) {

		// input: THREE.Matrix4 affine matrix

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8]  * z + e[12];
		this.y = e[1] * x + e[5] * y + e[9]  * z + e[13];
		this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

		return this;

	}
	
	
	ThreeBSP.Node = function( polygons ) {
		var i, polygon_count,
			front = [],
			back = [];

		this.polygons = [];
		this.front = this.back = undefined;
		
		if ( !(polygons instanceof Array) || polygons.length === 0 ) return;

		this.divider = polygons[0].clone();
		
		for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
			this.divider.splitPolygon( polygons[i], this.polygons, this.polygons, front, back );
		}   
		
		if ( front.length > 0 ) {
			this.front = new ThreeBSP.Node( front );
		}
		
		if ( back.length > 0 ) {
			this.back = new ThreeBSP.Node( back );
		}
	};
	ThreeBSP.Node.isConvex = function( polygons ) {
		var i, j;
		for ( i = 0; i < polygons.length; i++ ) {
			for ( j = 0; j < polygons.length; j++ ) {
				if ( i !== j && polygons[i].classifySide( polygons[j] ) !== BACK ) {
					return false;
				}
			}
		}
		return true;
	};
	ThreeBSP.Node.prototype.build = function( polygons ) {
		var i, polygon_count,
			front = [],
			back = [];
		
		if ( !this.divider ) {
			this.divider = polygons[0].clone();
		}

		for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
			this.divider.splitPolygon( polygons[i], this.polygons, this.polygons, front, back );
		}   
		
		if ( front.length > 0 ) {
			if ( !this.front ) this.front = new ThreeBSP.Node();
			this.front.build( front );
		}
		
		if ( back.length > 0 ) {
			if ( !this.back ) this.back = new ThreeBSP.Node();
			this.back.build( back );
		}
	};
	ThreeBSP.Node.prototype.allPolygons = function() {
		var polygons = this.polygons.slice();
		if ( this.front ) polygons = polygons.concat( this.front.allPolygons() );
		if ( this.back ) polygons = polygons.concat( this.back.allPolygons() );
		return polygons;
	};
	ThreeBSP.Node.prototype.clone = function() {
		var node = new ThreeBSP.Node();
		
		node.divider = this.divider.clone();
		node.polygons = this.polygons.map( function( polygon ) { return polygon.clone(); } );
		node.front = this.front && this.front.clone();
		node.back = this.back && this.back.clone();
		
		return node;
	};
	ThreeBSP.Node.prototype.invert = function() {
		var i, polygon_count, temp;
		
		for ( i = 0, polygon_count = this.polygons.length; i < polygon_count; i++ ) {
			this.polygons[i].flip();
		}
		
		this.divider.flip();
		if ( this.front ) this.front.invert();
		if ( this.back ) this.back.invert();
		
		temp = this.front;
		this.front = this.back;
		this.back = temp;
		
		return this;
	};
	ThreeBSP.Node.prototype.clipPolygons = function( polygons ) {
		var i, polygon_count,
			front, back;

		if ( !this.divider ) return polygons.slice();
		
		front = [], back = [];
		
		for ( i = 0, polygon_count = polygons.length; i < polygon_count; i++ ) {
			this.divider.splitPolygon( polygons[i], front, back, front, back );
		}

		if ( this.front ) front = this.front.clipPolygons( front );
		if ( this.back ) back = this.back.clipPolygons( back );
		else back = [];

		return front.concat( back );
	};
	
	ThreeBSP.Node.prototype.clipTo = function( node ) {
		this.polygons = node.clipPolygons( this.polygons );
		if ( this.front ) this.front.clipTo( node );
		if ( this.back ) this.back.clipTo( node );
	};
	
	
	return ThreeBSP;
})();
/**
 * @author Slayvin / http://slayvin.net
 */

THREE.ShaderLib['mirror'] = {

	uniforms: { "mirrorColor": { type: "c", value: new THREE.Color(0x7F7F7F) },
				"mirrorSampler": { type: "t", value: null },
				"textureMatrix" : { type: "m4", value: new THREE.Matrix4() }
	},

	vertexShader: [

		"uniform mat4 textureMatrix;",

		"varying vec4 mirrorCoord;",

		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"mirrorCoord = textureMatrix * worldPosition;",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform vec3 mirrorColor;",
		"uniform sampler2D mirrorSampler;",

		"varying vec4 mirrorCoord;",

		"float blendOverlay(float base, float blend) {",
			"return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
		"}",
		
		"void main() {",

			"vec4 color = texture2DProj(mirrorSampler, mirrorCoord);",
			"color = vec4(blendOverlay(mirrorColor.r, color.r), blendOverlay(mirrorColor.g, color.g), blendOverlay(mirrorColor.b, color.b), 1.0);",

			"gl_FragColor = color;",

		"}"

	].join("\n")

};

THREE.Mirror = function ( renderer, camera, options ) {

	THREE.Object3D.call( this );

	this.name = 'mirror_' + this.id;

	options = options || {};

	this.matrixNeedsUpdate = true;

	var width = options.textureWidth !== undefined ? options.textureWidth : 512;
	var height = options.textureHeight !== undefined ? options.textureHeight : 512;

	this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;

	var mirrorColor = options.color !== undefined ? new THREE.Color(options.color) : new THREE.Color(0x7F7F7F);

	this.renderer = renderer;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3(0, 0, -1);
	this.clipPlane = new THREE.Vector4();
	
	// For debug only, show the normal and plane of the mirror
	var debugMode = options.debugMode !== undefined ? options.debugMode : false;

	if ( debugMode ) {

		var arrow = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 10, 0xffff80 );
		var planeGeometry = new THREE.Geometry();
		planeGeometry.vertices.push( new THREE.Vector3( -10, -10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, -10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( 10, 10, 0 ) );
		planeGeometry.vertices.push( new THREE.Vector3( -10, 10, 0 ) );
		planeGeometry.vertices.push( planeGeometry.vertices[0] );
		var plane = new THREE.Line( planeGeometry, new THREE.LineBasicMaterial( { color: 0xffff80 } ) );

		this.add(arrow);
		this.add(plane);

	}

	if ( camera instanceof THREE.PerspectiveCamera ) {

		this.camera = camera;

	} else {

		this.camera = new THREE.PerspectiveCamera();
		console.log( this.name + ': camera is not a Perspective Camera!' );

	}

	this.textureMatrix = new THREE.Matrix4();

	this.mirrorCamera = this.camera.clone();

	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );

	var mirrorShader = THREE.ShaderLib[ "mirror" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: mirrorUniforms

	} );

	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.mirrorColor.value = mirrorColor;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;

	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo( height ) ) {

		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;

	}

	this.updateTextureMatrix();
	this.render();

};

THREE.Mirror.prototype = Object.create( THREE.Object3D.prototype );

THREE.Mirror.prototype.renderWithMirror = function ( otherMirror ) {

	// update the mirror matrix to mirror the current view
	this.updateTextureMatrix();
	this.matrixNeedsUpdate = false;

	// set the camera of the other mirror so the mirrored view is the reference view
	var tempCamera = otherMirror.camera;
	otherMirror.camera = this.mirrorCamera;

	// render the other mirror in temp texture
	otherMirror.renderTemp();
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.tempTexture;

	// render the current mirror
	this.render();
	this.matrixNeedsUpdate = true;

	// restore material and camera of other mirror
	otherMirror.material.uniforms.mirrorSampler.value = otherMirror.texture;
	otherMirror.camera = tempCamera;

	// restore texture matrix of other mirror
	otherMirror.updateTextureMatrix();
};

THREE.Mirror.prototype.updateTextureMatrix = function () {

	var sign = THREE.Math.sign;

	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );

	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );

	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate();
	target.add( this.mirrorWorldPosition );

	this.up.set( 0, -1, 0 );
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse( this.mirrorCamera.matrixWorld );

	// Update the texture matrix
	this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );
	this.textureMatrix.multiply( this.mirrorCamera.projectionMatrix );
	this.textureMatrix.multiply( this.mirrorCamera.matrixWorldInverse );

	// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.mirrorPlane.applyMatrix4( this.mirrorCamera.matrixWorldInverse );

	this.clipPlane.set( this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;

	q.x = ( sign(this.clipPlane.x) + projectionMatrix.elements[8] ) / projectionMatrix.elements[0];
	q.y = ( sign(this.clipPlane.y) + projectionMatrix.elements[9] ) / projectionMatrix.elements[5];
	q.z = - 1.0;
	q.w = ( 1.0 + projectionMatrix.elements[10] ) / projectionMatrix.elements[14];

	// Calculate the scaled plane vector
	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot(q) );

	// Replacing the third row of the projection matrix
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
	projectionMatrix.elements[14] = c.w;

};

THREE.Mirror.prototype.render = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== undefined ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene) {

		this.renderer.render( scene, this.mirrorCamera, this.texture, true );

	}

};

THREE.Mirror.prototype.renderTemp = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

	this.matrixNeedsUpdate = true;

	// Render the mirrored view of the current scene into the target texture
	var scene = this;

	while ( scene.parent !== undefined ) {

		scene = scene.parent;

	}

	if ( scene !== undefined && scene instanceof THREE.Scene) {

		this.renderer.render( scene, this.mirrorCamera, this.tempTexture, true );

	}

};

/**
 * @author jbouny / https://github.com/jbouny
 *
 * Work based on :
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

THREE.ShaderLib['water'] = {

	uniforms: { "normalSampler":	{ type: "t", value: null },
				"mirrorSampler":	{ type: "t", value: null },
				"alpha":			{ type: "f", value: 1.0 },
				"time":				{ type: "f", value: 0.0 },
				"distortionScale":	{ type: "f", value: 20.0 },
				"textureMatrix" :	{ type: "m4", value: new THREE.Matrix4() },
				"sunColor":			{ type: "c", value: new THREE.Color( 0x7F7F7F ) },
				"sunDirection":		{ type: "v3", value: new THREE.Vector3( 0.70707, 0.70707, 0 ) },
				"eye":				{ type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
				"waterColor":		{ type: "c", value: new THREE.Color( 0x555555 ) }
	},

	vertexShader: [
		'uniform mat4 textureMatrix;',
		'uniform float time;',

		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',
		
		'void main()',
		'{',
		'	mirrorCoord = modelMatrix * vec4( position, 1.0 );',
		'	worldPosition = mirrorCoord.xyz;',
		'	mirrorCoord = textureMatrix * mirrorCoord;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join('\n'),

	fragmentShader: [
		'precision highp float;',
		
		'uniform sampler2D mirrorSampler;',
		'uniform float alpha;',
		'uniform float time;',
		'uniform float distortionScale;',
		'uniform sampler2D normalSampler;',
		'uniform vec3 sunColor;',
		'uniform vec3 sunDirection;',
		'uniform vec3 eye;',
		'uniform vec3 waterColor;',

		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',
		
		'vec4 getNoise( vec2 uv )',
		'{',
		'	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);',
		'	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );',
		'	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );',
		'	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );',
		'	vec4 noise = ( texture2D( normalSampler, uv0 ) ) +',
        '		( texture2D( normalSampler, uv1 ) ) +',
        '		( texture2D( normalSampler, uv2 ) ) +',
		'		( texture2D( normalSampler, uv3 ) );',
		'	return noise * 0.5 - 1.0;',
		'}',
		
		'void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor )',
		'{',
		'	vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );',
		'	float direction = max( 0.0, dot( eyeDirection, reflection ) );',
		'	specularColor += pow( direction, shiny ) * sunColor * spec;',
		'	diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;',
		'}',
		
		'void main()',
		'{',
		'	vec4 noise = getNoise( worldPosition.xz );',
		'	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );',

		'	vec3 diffuseLight = vec3(0.0);',
		'	vec3 specularLight = vec3(0.0);',

		'	vec3 worldToEye = eye-worldPosition;',
		'	vec3 eyeDirection = normalize( worldToEye );',
		'	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',
		
		'	float distance = length(worldToEye);',

		'	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;',
		'	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.z + distortion ) );',

		'	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );',
		'	float rf0 = 0.3;',
		'	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );',
		'	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;',
		'	vec3 albedo = mix( sunColor * diffuseLight * 0.3 + scatter, ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance );',
		'	gl_FragColor = vec4( albedo, alpha );',
		'}'
	].join('\n')

};

THREE.Water = function ( renderer, camera, scene, options ) {

	THREE.Object3D.call( this );
	this.name = 'water_' + this.id;

	function optionalParameter ( value, defaultValue ) {
		return value !== undefined ? value : defaultValue;
	};

	options = options || {};
	
	this.matrixNeedsUpdate = true;
	
	var width = optionalParameter( options.textureWidth, 512 );
	var height = optionalParameter( options.textureHeight, 512 );
	this.clipBias = optionalParameter( options.clipBias, 0.0 );
	this.alpha = optionalParameter( options.alpha, 1.0 );
	this.time = optionalParameter( options.time, 0.0 );
	this.normalSampler = optionalParameter( options.waterNormals, null );
	this.sunDirection = optionalParameter( options.sunDirection, new THREE.Vector3( 0.70707, 0.70707, 0.0 ) );
	this.sunColor = new THREE.Color( optionalParameter( options.sunColor, 0xffffff ) );
	this.waterColor = new THREE.Color( optionalParameter( options.waterColor, 0x7F7F7F ) );
	this.eye = optionalParameter( options.eye, new THREE.Vector3( 0, 0, 0 ) );
	this.distortionScale = optionalParameter( options.distortionScale, 20.0 );
	
	this.renderer = renderer;
	this.scene = scene;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3( 0, 0, -1 );
	this.clipPlane = new THREE.Vector4();
	
	if ( camera instanceof THREE.PerspectiveCamera )
		this.camera = camera;
	else 
	{
		this.camera = new THREE.PerspectiveCamera();
		console.log(this.name + ': camera is not a Perspective Camera!')
	}

	this.textureMatrix = new THREE.Matrix4();

	this.mirrorCamera = this.camera.clone();
	
	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );
	
	var mirrorShader = THREE.ShaderLib[ "water" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	this.material = new THREE.ShaderMaterial( { 
		fragmentShader: mirrorShader.fragmentShader, 
		vertexShader: mirrorShader.vertexShader, 
		uniforms: mirrorUniforms,
		transparent: true
	} );

	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;
	this.material.uniforms.alpha.value = this.alpha;
	this.material.uniforms.time.value = this.time;
	this.material.uniforms.normalSampler.value = this.normalSampler;
	this.material.uniforms.sunColor.value = this.sunColor;
	this.material.uniforms.waterColor.value = this.waterColor;
	this.material.uniforms.sunDirection.value = this.sunDirection;
	this.material.uniforms.distortionScale.value = this.distortionScale;
	
	this.material.uniforms.eye.value = this.eye;
	
	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo(height) )
	{
		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;
	}

	this.updateTextureMatrix();
	this.render();
};

THREE.Water.prototype = Object.create( THREE.Mirror.prototype );


THREE.Water.prototype.updateTextureMatrix = function () {

	function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );

	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );

	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate();
	target.add( this.mirrorWorldPosition );

	this.up.set(0, -1, 0);
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );
	this.mirrorCamera.aspect = this.camera.aspect;

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse(this.mirrorCamera.matrixWorld);

	// Update the texture matrix
	this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );
	this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
	this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);

	// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
	// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
	this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);

	this.clipPlane.set(this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );

	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;

	q.x = (sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
	q.y = (sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
	q.z = -1.0;
	q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

	// Calculate the scaled plane vector
	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot(q) );

	// Replacing the third row of the projection matrix
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
	projectionMatrix.elements[14] = c.w;
	
	var worldCoordinates = new THREE.Vector3();
	worldCoordinates.setFromMatrixPosition( this.camera.matrixWorld );
	this.eye = worldCoordinates;
	this.material.uniforms.eye.value = this.eye;
};

/**
 * @author zz85 / https://github.com/zz85
 *
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard analytic skydome model
 * http://www.cs.utah.edu/~shirley/papers/sunsky/sunsky.pdf
 *
 * First implemented by Simon Wallner
 * http://www.simonwallner.at/projects/atmospheric-scattering
 *
 * Improved by Martin Upitis
 * http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
 *
 * Three.js integration by zz85 http://twitter.com/blurspline
*/

THREE.ShaderLib['sky'] = {

	uniforms: {

		luminance:	 { type: "f", value:1 },
		turbidity:	 { type: "f", value:2 },
		reileigh:	 { type: "f", value:1 },
		mieCoefficient:	 { type: "f", value:0.005 },
		mieDirectionalG: { type: "f", value:0.8 },
		sunPosition: 	 { type: "v3", value: new THREE.Vector3() }

	},

	vertexShader: [

		"varying vec3 vWorldPosition;",
		"varying vec2 vUv;",

		"void main() {",

			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"vWorldPosition = worldPosition.xyz;",
			"vUv = uv;",

			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}",

	].join("\n"),

	fragmentShader: [


		"uniform sampler2D skySampler;",
		"uniform vec3 sunPosition;",
		"varying vec3 vWorldPosition;",
		"varying vec2 vUv;",


		"vec3 cameraPos = vec3(0., 0., 0.);",
		"// uniform sampler2D sDiffuse;",
		"//const float turbidity = 10.0; //",
		"//const float reileigh = 2.; //",
		"//const float luminance = 1.0; //",
		"//const float mieCoefficient = 0.005;",
		"//const float mieDirectionalG = 0.8;",

		"uniform float luminance;",
		"uniform float turbidity;",
		"uniform float reileigh;",
		"uniform float mieCoefficient;",
		"uniform float mieDirectionalG;",


		"vec3 sunDirection = normalize(sunPosition);",
		"float reileighCoefficient = reileigh;",

		"// constants for atmospheric scattering",
		"const float e = 2.71828182845904523536028747135266249775724709369995957;",
		"const float pi = 3.141592653589793238462643383279502884197169;",

		"const float n = 1.0003; // refractive index of air",
		"const float N = 2.545E25; // number of molecules per unit volume for air at",
								"// 288.15K and 1013mb (sea level -45 celsius)",
		"const float pn = 0.035;	// depolatization factor for standard air",

		"// wavelength of used primaries, according to preetham",
		"const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);",

		"// mie stuff",
		"// K coefficient for the primaries",
		"const vec3 K = vec3(0.686, 0.678, 0.666);",
		"const float v = 4.0;",

		"// optical length at zenith for molecules",
		"const float rayleighZenithLength = 8.4E3;",
		"const float mieZenithLength = 1.25E3;",
		"const vec3 up = vec3(0.0, 1.0, 0.0);",

		"const float EE = 1000.0;",
		"const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;",
		"// 66 arc seconds -> degrees, and the cosine of that",

		"// earth shadow hack",
		"const float cutoffAngle = pi/1.95;",
		"const float steepness = 1.5;",


		"vec3 totalRayleigh(vec3 lambda)",
		"{",
			"return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));",
		"}",

		"float rayleighPhase(float cosTheta)",
		"{	 ",
			"return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));",
		"//	return (1.0 / (3.0*pi)) * (1.0 + pow(cosTheta, 2.0));",
		"//	return (3.0 / 4.0) * (1.0 + pow(cosTheta, 2.0));",
		"}",

		"vec3 totalMie(vec3 lambda, vec3 K, float T)",
		"{",
			"float c = (0.2 * T ) * 10E-18;",
			"return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;",
		"}",

		"float hgPhase(float cosTheta, float g)",
		"{",
			"return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));",
		"}",

		"float sunIntensity(float zenithAngleCos)",
		"{",
			"return EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos))/steepness)));",
		"}",

		"// float logLuminance(vec3 c)",
		"// {",
		"// 	return log(c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722);",
		"// }",

		"// Filmic ToneMapping http://filmicgames.com/archives/75",
		"float A = 0.15;",
		"float B = 0.50;",
		"float C = 0.10;",
		"float D = 0.20;",
		"float E = 0.02;",
		"float F = 0.30;",
		"float W = 1000.0;",

		"vec3 Uncharted2Tonemap(vec3 x)",
		"{",
		   "return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;",
		"}",


		"void main() ",
		"{",
			"float sunfade = 1.0-clamp(1.0-exp((sunPosition.y/450000.0)),0.0,1.0);",

			"// luminance =  1.0 ;// vWorldPosition.y / 450000. + 0.5; //sunPosition.y / 450000. * 1. + 0.5;",

			 "// gl_FragColor = vec4(sunfade, sunfade, sunfade, 1.0);",

			"reileighCoefficient = reileighCoefficient - (1.0* (1.0-sunfade));",

			"float sunE = sunIntensity(dot(sunDirection, up));",

			"// extinction (absorbtion + out scattering) ",
			"// rayleigh coefficients",
			"vec3 betaR = totalRayleigh(lambda) * reileighCoefficient;",

			"// mie coefficients",
			"vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;",

			"// optical length",
			"// cutoff angle at 90 to avoid singularity in next formula.",
			"float zenithAngle = acos(max(0.0, dot(up, normalize(vWorldPosition - cameraPos))));",
			"float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));",
			"float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));",



			"// combined extinction factor	",
			"vec3 Fex = exp(-(betaR * sR + betaM * sM));",

			"// in scattering",
			"float cosTheta = dot(normalize(vWorldPosition - cameraPos), sunDirection);",

			"float rPhase = rayleighPhase(cosTheta*0.5+0.5);",
			"vec3 betaRTheta = betaR * rPhase;",

			"float mPhase = hgPhase(cosTheta, mieDirectionalG);",
			"vec3 betaMTheta = betaM * mPhase;",


			"vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));",
			"Lin *= mix(vec3(1.0),pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex,vec3(1.0/2.0)),clamp(pow(1.0-dot(up, sunDirection),5.0),0.0,1.0));",

			"//nightsky",
			"vec3 direction = normalize(vWorldPosition - cameraPos);",
			"float theta = acos(direction.y); // elevation --> y-axis, [-pi/2, pi/2]",
			"float phi = atan(direction.z, direction.x); // azimuth --> x-axis [-pi/2, pi/2]",
			"vec2 uv = vec2(phi, theta) / vec2(2.0*pi, pi) + vec2(0.5, 0.0);",
			"// vec3 L0 = texture2D(skySampler, uv).rgb+0.1 * Fex;",
			"vec3 L0 = vec3(0.1) * Fex;",

			"// composition + solar disc",
			"//if (cosTheta > sunAngularDiameterCos)",
			"float sundisk = smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);",
			"// if (normalize(vWorldPosition - cameraPos).y>0.0)",
			"L0 += (sunE * 19000.0 * Fex)*sundisk;",


			"vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));",

			"vec3 texColor = (Lin+L0);   ",
			"texColor *= 0.04 ;",
			"texColor += vec3(0.0,0.001,0.0025)*0.3;",

			"float g_fMaxLuminance = 1.0;",
			"float fLumScaled = 0.1 / luminance;     ",
			"float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled); ",

			"float ExposureBias = fLumCompressed;",

			"vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);",
			"vec3 color = curr*whiteScale;",

			"vec3 retColor = pow(color,vec3(1.0/(1.2+(1.2*sunfade))));",


			"gl_FragColor.rgb = retColor;",

			"gl_FragColor.a = 1.0;",
		"}",

	].join("\n")

};

THREE.Sky = function () {

	var skyShader = THREE.ShaderLib[ "sky" ];
	var skyUniforms = THREE.UniformsUtils.clone( skyShader.uniforms );

	var skyMat = new THREE.ShaderMaterial( {
		fragmentShader: skyShader.fragmentShader,
		vertexShader: skyShader.vertexShader,
		uniforms: skyUniforms,
		side: THREE.BackSide
	} );

	var skyGeo = new THREE.SphereGeometry( 450000, 32, 15 );
	var skyMesh = new THREE.Mesh( skyGeo, skyMat );


	// Expose variables
	this.mesh = skyMesh;
	this.uniforms = skyUniforms;


};

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Based on Nvidia Cg tutorial
 */

THREE.FresnelShader = {

	uniforms: {

		"mRefractionRatio": { type: "f", value: 1.02 },
		"mFresnelBias": { type: "f", value: 0.1 },
		"mFresnelPower": { type: "f", value: 2.0 },
		"mFresnelScale": { type: "f", value: 1.0 },
		"tCube": { type: "t", value: null }

	},

	vertexShader: [

		"uniform float mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",

		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

			"vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vReflect = reflect( I, worldNormal );",
			"vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );",
			"vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.99 );",
			"vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.98 );",
			"vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform samplerCube tCube;",

		"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",

		"void main() {",

			"vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );",
			"vec4 refractedColor = vec4( 1.0 );",

			"refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;",
			"refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;",
			"refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;",

			"gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",

		"}"

	].join("\n")

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.GodControls = function ( app, jet ) {

  this.object = app.camera;
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.domElement = document;

  this.movementSpeed = 1.0;
  this.lookSpeed = 0.005;

  this.lookVertical = true;
  this.autoForward = false;
  // this.invertVertical = false;

  this.activeLook = true;

  this.heightSpeed = false;
  this.heightCoef = 1.0;
  this.heightMin = 0.0;
  this.heightMax = 1.0;

  this.constrainVertical = false;
  this.verticalMin = 0;
  this.verticalMax = Math.PI;

  this.autoSpeedFactor = 0.0;

  this.mouseX = 0;
  this.mouseY = 0;

  this.lat = 0;
  this.lon = 0;
  this.phi = 0;
  this.theta = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.freeze = false;

  this.mouseDragOn = false;

  this.viewHalfX = 0;
  this.viewHalfY = 0;

  if ( this.domElement !== document ) {

    this.domElement.setAttribute( 'tabindex', -1 );

  }

  //

  this.handleResize = function () {

    if ( this.domElement === document ) {

      this.viewHalfX = window.innerWidth / 2;
      this.viewHalfY = window.innerHeight / 2;

    } else {

      this.viewHalfX = this.domElement.offsetWidth / 2;
      this.viewHalfY = this.domElement.offsetHeight / 2;

    }

  };

  this.onMouseDown = function ( event ) {

    if ( this.domElement !== document ) {

      this.domElement.focus();

    }

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = true; break;
        case 2: this.moveBackward = true; break;

      }

    }

    this.mouseDragOn = true;

  };

  this.onMouseUp = function ( event ) {

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = false; break;
        case 2: this.moveBackward = false; break;

      }

    }

    this.mouseDragOn = false;

  };

  this.onMouseMove = function ( event ) {

    if ( this.domElement === document ) {

      this.mouseX = event.pageX - this.viewHalfX;
      this.mouseY = event.pageY - this.viewHalfY;

    } else {

      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

    }

  };

  this.onKeyDown = function ( event ) {

    //event.preventDefault();

    switch ( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 82: /*R*/ this.moveUp = true; break;
      case 70: /*F*/ this.moveDown = true; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;

    }

  };

  this.onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 82: /*R*/ this.moveUp = false; break;
      case 70: /*F*/ this.moveDown = false; break;

    }

  };

  this.update = function( delta ) {

    if ( this.freeze ) {

      return;

    }

    if ( this.heightSpeed ) {

      var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
      var heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

    } else {

      this.autoSpeedFactor = 0.0;

    }

    var actualMoveSpeed = delta * this.movementSpeed;

    if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

    if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

    var actualLookSpeed = delta * this.lookSpeed;

    if ( !this.activeLook ) {

      actualLookSpeed = 0;

    }

    var verticalLookRatio = 1;

    if ( this.constrainVertical ) {

      verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

    }

    this.lon += this.mouseX * actualLookSpeed;
    if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

    this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
    this.phi = THREE.Math.degToRad( 90 - this.lat );

    this.theta = THREE.Math.degToRad( this.lon );

    if ( this.constrainVertical ) {

      this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

    }

    var targetPosition = this.target,
      position = this.object.position;

    targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
    targetPosition.y = position.y + 100 * Math.cos( this.phi );
    targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

    this.object.lookAt( targetPosition );

  };

  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.listeners = {
    contextmenu: function ( event ) { event.preventDefault(); },
    mousemove: bind( this, this.onMouseMove ),
    mousedown: bind( this, this.onMouseDown ),
    mouseup: bind( this, this.onMouseUp ),
    keydown: bind( this, this.onKeyDown ),
    keyup: bind( this, this.onKeyUp )
  };

  this.addListeners = function() {

    this.domElement.addEventListener( 'contextmenu', this.listeners.contextmenu, false );

    this.domElement.addEventListener( 'mousemove', this.listeners.mousemove, false );
    this.domElement.addEventListener( 'mousedown', this.listeners.mousedown, false );
    this.domElement.addEventListener( 'mouseup', this.listeners.mouseup, false );

    window.addEventListener( 'keydown', this.listeners.keydown, false );
    window.addEventListener( 'keyup', this.listeners.keyup, false );

  }

this.removeListeners = function() {

  this.domElement.removeEventListener( 'contextmenu', this.listeners.contextmenu, false );

  this.domElement.removeEventListener( 'mousemove', this.listeners.mousemove, false );
  this.domElement.removeEventListener( 'mousedown', this.listeners.mousedown, false );
  this.domElement.removeEventListener( 'mouseup', this.listeners.mouseup, false );

  window.removeEventListener( 'keydown', this.listeners.keydown, false );
  window.removeEventListener( 'keyup', this.listeners.keyup, false );

}

  this.addListeners();

  this.handleResize();

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.WalkControls = function ( app, jet ) {

	this.object = app.camera;
	this.target = new THREE.Vector3( 0, 0, 0 );

	this.domElement = document;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.lookVertical = true;
	this.autoForward = false;
	// this.invertVertical = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.freeze = false;

	this.mouseDragOn = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', -1 );

	}

	//

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	};

	this.onMouseDown = function ( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	};

	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	};

	this.onMouseMove = function ( event ) {

		if ( this.domElement === document ) {

			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;

		} else {

			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

		}

	};

	this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

			case 81: /*Q*/ this.freeze = !this.freeze; break;

		}

	};

	this.onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	};

	this.update = function( delta ) {

		if ( this.freeze ) {

			return;

		}

		if ( this.heightSpeed ) {

			var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
			var heightDelta = y - this.heightMin;

			this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

		} else {

			this.autoSpeedFactor = 0.0;

		}

		var actualMoveSpeed = delta * this.movementSpeed;

		if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
		if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

		if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
		if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

		if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

		var actualLookSpeed = delta * this.lookSpeed;

		if ( !this.activeLook ) {

			actualLookSpeed = 0;

		}

		var verticalLookRatio = 1;

		if ( this.constrainVertical ) {

			verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

		}

		this.lon += this.mouseX * actualLookSpeed;
		if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		this.phi = THREE.Math.degToRad( 90 - this.lat );

		this.theta = THREE.Math.degToRad( this.lon );

		if ( this.constrainVertical ) {

			this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

		}

		var targetPosition = this.target,
			position = this.object.position;

		targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 100 * Math.cos( this.phi );
		targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.object.lookAt( targetPosition );

	};


  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.listeners = {
    contextmenu: function ( event ) { event.preventDefault(); },
    mousemove: bind( this, this.onMouseMove ),
    mousedown: bind( this, this.onMouseDown ),
    mouseup: bind( this, this.onMouseUp ),
    keydown: bind( this, this.onKeyDown ),
    keyup: bind( this, this.onKeyUp )
  };

  this.addListeners = function() {

    this.domElement.addEventListener( 'contextmenu', this.listeners.contextmenu, false );

    this.domElement.addEventListener( 'mousemove', this.listeners.mousemove, false );
    this.domElement.addEventListener( 'mousedown', this.listeners.mousedown, false );
    this.domElement.addEventListener( 'mouseup', this.listeners.mouseup, false );

    window.addEventListener( 'keydown', this.listeners.keydown, false );
    window.addEventListener( 'keyup', this.listeners.keyup, false );

  }

this.removeListeners = function() {

  this.domElement.removeEventListener( 'contextmenu', this.listeners.contextmenu, false );

  this.domElement.removeEventListener( 'mousemove', this.listeners.mousemove, false );
  this.domElement.removeEventListener( 'mousedown', this.listeners.mousedown, false );
  this.domElement.removeEventListener( 'mouseup', this.listeners.mouseup, false );

  window.removeEventListener( 'keydown', this.listeners.keydown, false );
  window.removeEventListener( 'keyup', this.listeners.keyup, false );

}

  this.addListeners();

  this.handleResize();

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.DriveControls = function ( app, jet ) {

  this.object = app.camera;
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.domElement = document;

  this.movementSpeed = 1.0;
  this.lookSpeed = 0.005;

  this.lookVertical = true;
  this.autoForward = false;
  // this.invertVertical = false;

  this.activeLook = true;

  this.heightSpeed = false;
  this.heightCoef = 1.0;
  this.heightMin = 0.0;
  this.heightMax = 1.0;

  this.constrainVertical = false;
  this.verticalMin = 0;
  this.verticalMax = Math.PI;

  this.autoSpeedFactor = 0.0;

  this.mouseX = 0;
  this.mouseY = 0;

  this.lat = 0;
  this.lon = 0;
  this.phi = 0;
  this.theta = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.freeze = false;

  this.mouseDragOn = false;

  this.viewHalfX = 0;
  this.viewHalfY = 0;

  if ( this.domElement !== document ) {

    this.domElement.setAttribute( 'tabindex', -1 );

  }

  //

  this.handleResize = function () {

    if ( this.domElement === document ) {

      this.viewHalfX = window.innerWidth / 2;
      this.viewHalfY = window.innerHeight / 2;

    } else {

      this.viewHalfX = this.domElement.offsetWidth / 2;
      this.viewHalfY = this.domElement.offsetHeight / 2;

    }

  };

  this.onMouseDown = function ( event ) {

    if ( this.domElement !== document ) {

      this.domElement.focus();

    }

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = true; break;
        case 2: this.moveBackward = true; break;

      }

    }

    this.mouseDragOn = true;

  };

  this.onMouseUp = function ( event ) {

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = false; break;
        case 2: this.moveBackward = false; break;

      }

    }

    this.mouseDragOn = false;

  };

  this.onMouseMove = function ( event ) {

    if ( this.domElement === document ) {

      this.mouseX = event.pageX - this.viewHalfX;
      this.mouseY = event.pageY - this.viewHalfY;

    } else {

      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

    }

  };

  this.onKeyDown = function ( event ) {

    //event.preventDefault();

    switch ( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 82: /*R*/ this.moveUp = true; break;
      case 70: /*F*/ this.moveDown = true; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;

    }

  };

  this.onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 82: /*R*/ this.moveUp = false; break;
      case 70: /*F*/ this.moveDown = false; break;

    }

  };

  this.update = function( delta ) {

    if ( this.freeze ) {

      return;

    }

    if ( this.heightSpeed ) {

      var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
      var heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

    } else {

      this.autoSpeedFactor = 0.0;

    }

    var actualMoveSpeed = delta * this.movementSpeed;

    if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

    if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

    var actualLookSpeed = delta * this.lookSpeed;

    if ( !this.activeLook ) {

      actualLookSpeed = 0;

    }

    var verticalLookRatio = 1;

    if ( this.constrainVertical ) {

      verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

    }

    this.lon += this.mouseX * actualLookSpeed;
    if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

    this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
    this.phi = THREE.Math.degToRad( 90 - this.lat );

    this.theta = THREE.Math.degToRad( this.lon );

    if ( this.constrainVertical ) {

      this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

    }

    var targetPosition = this.target,
      position = this.object.position;

    targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
    targetPosition.y = position.y + 100 * Math.cos( this.phi );
    targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

    this.object.lookAt( targetPosition );

  };



  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.listeners = {
    contextmenu: function ( event ) { event.preventDefault(); },
    mousemove: bind( this, this.onMouseMove ),
    mousedown: bind( this, this.onMouseDown ),
    mouseup: bind( this, this.onMouseUp ),
    keydown: bind( this, this.onKeyDown ),
    keyup: bind( this, this.onKeyUp )
  };

  this.addListeners = function() {

    this.domElement.addEventListener( 'contextmenu', this.listeners.contextmenu, false );

    this.domElement.addEventListener( 'mousemove', this.listeners.mousemove, false );
    this.domElement.addEventListener( 'mousedown', this.listeners.mousedown, false );
    this.domElement.addEventListener( 'mouseup', this.listeners.mouseup, false );

    window.addEventListener( 'keydown', this.listeners.keydown, false );
    window.addEventListener( 'keyup', this.listeners.keyup, false );

  }

this.removeListeners = function() {

  this.domElement.removeEventListener( 'contextmenu', this.listeners.contextmenu, false );

  this.domElement.removeEventListener( 'mousemove', this.listeners.mousemove, false );
  this.domElement.removeEventListener( 'mousedown', this.listeners.mousedown, false );
  this.domElement.removeEventListener( 'mouseup', this.listeners.mouseup, false );

  window.removeEventListener( 'keydown', this.listeners.keydown, false );
  window.removeEventListener( 'keyup', this.listeners.keyup, false );

}

  this.addListeners();

  this.handleResize();

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.JetControls = function ( app, jet ) {

  this.object = app.camera;
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.domElement = document;

  this.movementSpeed = 1.0;
  this.lookSpeed = 0.005;

  this.lookVertical = true;
  this.autoForward = false;
  // this.invertVertical = false;

  this.activeLook = true;

  this.heightSpeed = false;
  this.heightCoef = 1.0;
  this.heightMin = 0.0;
  this.heightMax = 1.0;

  this.constrainVertical = false;
  this.verticalMin = 0;
  this.verticalMax = Math.PI;

  this.autoSpeedFactor = 0.0;

  this.mouseX = 0;
  this.mouseY = 0;

  this.lat = 0;
  this.lon = 0;
  this.phi = 0;
  this.theta = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.freeze = false;

  this.mouseDragOn = false;

  this.viewHalfX = 0;
  this.viewHalfY = 0;

  if ( this.domElement !== document ) {

    this.domElement.setAttribute( 'tabindex', -1 );

  }

  //

  this.handleResize = function () {

    if ( this.domElement === document ) {

      this.viewHalfX = window.innerWidth / 2;
      this.viewHalfY = window.innerHeight / 2;

    } else {

      this.viewHalfX = this.domElement.offsetWidth / 2;
      this.viewHalfY = this.domElement.offsetHeight / 2;

    }

  };

  this.onMouseDown = function ( event ) {

    if ( this.domElement !== document ) {

      this.domElement.focus();

    }

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = true; break;
        case 2: this.moveBackward = true; break;

      }

    }

    this.mouseDragOn = true;

  };

  this.onMouseUp = function ( event ) {

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = false; break;
        case 2: this.moveBackward = false; break;

      }

    }

    this.mouseDragOn = false;

  };

  this.onMouseMove = function ( event ) {

    if ( this.domElement === document ) {

      this.mouseX = event.pageX - this.viewHalfX;
      this.mouseY = event.pageY - this.viewHalfY;

    } else {

      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

    }

  };

  this.onKeyDown = function ( event ) {

    //event.preventDefault();

    switch ( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 82: /*R*/ this.moveUp = true; break;
      case 70: /*F*/ this.moveDown = true; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;

    }

  };

  this.onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 82: /*R*/ this.moveUp = false; break;
      case 70: /*F*/ this.moveDown = false; break;

    }

  };

  this.update = function( delta ) {

    if ( this.freeze ) {

      return;

    }

    if ( this.heightSpeed ) {

      var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
      var heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

    } else {

      this.autoSpeedFactor = 0.0;

    }

    var actualMoveSpeed = delta * this.movementSpeed;

    if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

    if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

    var actualLookSpeed = delta * this.lookSpeed;

    if ( !this.activeLook ) {

      actualLookSpeed = 0;

    }

    var verticalLookRatio = 1;

    if ( this.constrainVertical ) {

      verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

    }

    this.lon += this.mouseX * actualLookSpeed;
    if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

    this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
    this.phi = THREE.Math.degToRad( 90 - this.lat );

    this.theta = THREE.Math.degToRad( this.lon );

    if ( this.constrainVertical ) {

      this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

    }

    var targetPosition = this.target,
      position = this.object.position;

    targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
    targetPosition.y = position.y + 100 * Math.cos( this.phi );
    targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

    this.object.lookAt( targetPosition );

  };


  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.listeners = {
    contextmenu: function ( event ) { event.preventDefault(); },
    mousemove: bind( this, this.onMouseMove ),
    mousedown: bind( this, this.onMouseDown ),
    mouseup: bind( this, this.onMouseUp ),
    keydown: bind( this, this.onKeyDown ),
    keyup: bind( this, this.onKeyUp )
  };

  this.addListeners = function() {

    this.domElement.addEventListener( 'contextmenu', this.listeners.contextmenu, false );

    this.domElement.addEventListener( 'mousemove', this.listeners.mousemove, false );
    this.domElement.addEventListener( 'mousedown', this.listeners.mousedown, false );
    this.domElement.addEventListener( 'mouseup', this.listeners.mouseup, false );

    window.addEventListener( 'keydown', this.listeners.keydown, false );
    window.addEventListener( 'keyup', this.listeners.keyup, false );

  }

this.removeListeners = function() {

  this.domElement.removeEventListener( 'contextmenu', this.listeners.contextmenu, false );

  this.domElement.removeEventListener( 'mousemove', this.listeners.mousemove, false );
  this.domElement.removeEventListener( 'mousedown', this.listeners.mousedown, false );
  this.domElement.removeEventListener( 'mouseup', this.listeners.mouseup, false );

  window.removeEventListener( 'keydown', this.listeners.keydown, false );
  window.removeEventListener( 'keyup', this.listeners.keyup, false );

}

  this.addListeners();

  this.handleResize();

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.HoverControls = function ( app, jet ) {

  this.object = app.camera;
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.domElement = document;

  this.movementSpeed = 1.0;
  this.lookSpeed = 0.005;

  this.lookVertical = true;
  this.autoForward = false;
  // this.invertVertical = false;

  this.activeLook = true;

  this.heightSpeed = false;
  this.heightCoef = 1.0;
  this.heightMin = 0.0;
  this.heightMax = 1.0;

  this.constrainVertical = false;
  this.verticalMin = 0;
  this.verticalMax = Math.PI;

  this.autoSpeedFactor = 0.0;

  this.mouseX = 0;
  this.mouseY = 0;

  this.lat = 0;
  this.lon = 0;
  this.phi = 0;
  this.theta = 0;

  this.moveForward = false;
  this.moveBackward = false;
  this.moveLeft = false;
  this.moveRight = false;
  this.freeze = false;

  this.mouseDragOn = false;

  this.viewHalfX = 0;
  this.viewHalfY = 0;

  if ( this.domElement !== document ) {

    this.domElement.setAttribute( 'tabindex', -1 );

  }

  //

  this.handleResize = function () {

    if ( this.domElement === document ) {

      this.viewHalfX = window.innerWidth / 2;
      this.viewHalfY = window.innerHeight / 2;

    } else {

      this.viewHalfX = this.domElement.offsetWidth / 2;
      this.viewHalfY = this.domElement.offsetHeight / 2;

    }

  };

  this.onMouseDown = function ( event ) {

    if ( this.domElement !== document ) {

      this.domElement.focus();

    }

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = true; break;
        case 2: this.moveBackward = true; break;

      }

    }

    this.mouseDragOn = true;

  };

  this.onMouseUp = function ( event ) {

    event.preventDefault();
    event.stopPropagation();

    if ( this.activeLook ) {

      switch ( event.button ) {

        case 0: this.moveForward = false; break;
        case 2: this.moveBackward = false; break;

      }

    }

    this.mouseDragOn = false;

  };

  this.onMouseMove = function ( event ) {

    if ( this.domElement === document ) {

      this.mouseX = event.pageX - this.viewHalfX;
      this.mouseY = event.pageY - this.viewHalfY;

    } else {

      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

    }

  };

  this.onKeyDown = function ( event ) {

    //event.preventDefault();

    switch ( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      case 82: /*R*/ this.moveUp = true; break;
      case 70: /*F*/ this.moveDown = true; break;

      case 81: /*Q*/ this.freeze = !this.freeze; break;

    }

  };

  this.onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      case 82: /*R*/ this.moveUp = false; break;
      case 70: /*F*/ this.moveDown = false; break;

    }

  };

  this.update = function( delta ) {

    if ( this.freeze ) {

      return;

    }

    if ( this.heightSpeed ) {

      var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
      var heightDelta = y - this.heightMin;

      this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

    } else {

      this.autoSpeedFactor = 0.0;

    }

    var actualMoveSpeed = delta * this.movementSpeed;

    if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
    if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

    if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
    if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

    var actualLookSpeed = delta * this.lookSpeed;

    if ( !this.activeLook ) {

      actualLookSpeed = 0;

    }

    var verticalLookRatio = 1;

    if ( this.constrainVertical ) {

      verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

    }

    this.lon += this.mouseX * actualLookSpeed;
    if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

    this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
    this.phi = THREE.Math.degToRad( 90 - this.lat );

    this.theta = THREE.Math.degToRad( this.lon );

    if ( this.constrainVertical ) {

      this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

    }

    var targetPosition = this.target,
      position = this.object.position;

    targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
    targetPosition.y = position.y + 100 * Math.cos( this.phi );
    targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

    this.object.lookAt( targetPosition );

  };


  function bind( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.listeners = {
    contextmenu: function ( event ) { event.preventDefault(); },
    mousemove: bind( this, this.onMouseMove ),
    mousedown: bind( this, this.onMouseDown ),
    mouseup: bind( this, this.onMouseUp ),
    keydown: bind( this, this.onKeyDown ),
    keyup: bind( this, this.onKeyUp )
  };

  this.addListeners = function() {

    this.domElement.addEventListener( 'contextmenu', this.listeners.contextmenu, false );

    this.domElement.addEventListener( 'mousemove', this.listeners.mousemove, false );
    this.domElement.addEventListener( 'mousedown', this.listeners.mousedown, false );
    this.domElement.addEventListener( 'mouseup', this.listeners.mouseup, false );

    window.addEventListener( 'keydown', this.listeners.keydown, false );
    window.addEventListener( 'keyup', this.listeners.keyup, false );

  }

this.removeListeners = function() {

  this.domElement.removeEventListener( 'contextmenu', this.listeners.contextmenu, false );

  this.domElement.removeEventListener( 'mousemove', this.listeners.mousemove, false );
  this.domElement.removeEventListener( 'mousedown', this.listeners.mousedown, false );
  this.domElement.removeEventListener( 'mouseup', this.listeners.mouseup, false );

  window.removeEventListener( 'keydown', this.listeners.keydown, false );
  window.removeEventListener( 'keyup', this.listeners.keyup, false );

}

  this.addListeners();

  this.handleResize();

};

  /**
   * @author qiao / https://github.com/qiao
   * @author mrdoob / http://mrdoob.com
   * @author alteredq / http://alteredqualia.com/
   * @author WestLangley / http://github.com/WestLangley
   * @author erich666 / http://erichaines.com
   */
  /*global THREE, console */

  // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
  // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
  // supported.
  //
  //    Orbit - left mouse / touch: one finger move
  //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
  //    Pan - right mouse, or arrow keys / touch: three finter swipe
  //
  // This is a drop-in replacement for (most) TrackballControls used in examples.
  // That is, include this js file and wherever you see:
  //    	controls = new THREE.TrackballControls( camera );
  //      controls.target.z = 150;
  // Simple substitute "OrbitControls" and the control should work as-is.

  THREE.SatControls = function ( app, jet ) {

    this.object = app.camera;

    this.domElement = document;

    // API

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the control orbits around
    // and where it pans with respect to.
    this.target = new THREE.Vector3();

    // center is old, deprecated; use "target" instead
    this.center = this.target;

    // This option actually enables dollying in and out; left as "zoom" for
    // backwards compatibility
    this.noZoom = false;
    this.zoomSpeed = 1.0;

    // Limits to how far you can dolly in and out
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // Set to true to disable this control
    this.noRotate = false;
    this.rotateSpeed = 1.0;

    // Set to true to disable this control
    this.noPan = false;
    this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // Set to true to disable use of the keys
    this.noKeys = false;

    // The four arrow keys
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    ////////////
    // internals

    var scope = this;

    var EPS = 0.000001;

    var rotateStart = new THREE.Vector2();
    var rotateEnd = new THREE.Vector2();
    var rotateDelta = new THREE.Vector2();

    var panStart = new THREE.Vector2();
    var panEnd = new THREE.Vector2();
    var panDelta = new THREE.Vector2();
    var panOffset = new THREE.Vector3();

    var offset = new THREE.Vector3();

    var dollyStart = new THREE.Vector2();
    var dollyEnd = new THREE.Vector2();
    var dollyDelta = new THREE.Vector2();

    var phiDelta = 0;
    var thetaDelta = 0;
    var scale = 1;
    var pan = new THREE.Vector3();

    var lastPosition = new THREE.Vector3();

    var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

    var state = STATE.NONE;

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();

    // so camera.up is the orbit axis

    var quat = new THREE.Quaternion().setFromUnitVectors( this.object.up, new THREE.Vector3( 0, 1, 0 ) );
    var quatInverse = quat.clone().inverse();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start'};
    var endEvent = { type: 'end'};

    this.rotateLeft = function ( angle ) {

      if ( angle === undefined ) {

        angle = getAutoRotationAngle();

      }

      thetaDelta -= angle;

    };

    this.rotateUp = function ( angle ) {

      if ( angle === undefined ) {

        angle = getAutoRotationAngle();

      }

      phiDelta -= angle;

    };

    // pass in distance in world space to move left
    this.panLeft = function ( distance ) {

      var te = this.object.matrix.elements;

      // get X column of matrix
      panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
      panOffset.multiplyScalar( - distance );

      pan.add( panOffset );

    };

    // pass in distance in world space to move up
    this.panUp = function ( distance ) {

      var te = this.object.matrix.elements;

      // get Y column of matrix
      panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
      panOffset.multiplyScalar( distance );

      pan.add( panOffset );

    };

    // pass in x,y of change desired in pixel space,
    // right and down are positive
    this.pan = function ( deltaX, deltaY ) {

      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      if ( scope.object.fov !== undefined ) {

        // perspective
        var position = scope.object.position;
        var offset = position.clone().sub( scope.target );
        var targetDistance = offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

        // we actually don't use screenWidth, since perspective camera is fixed to screen height
        scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
        scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

      } else if ( scope.object.top !== undefined ) {

        // orthographic
        scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
        scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

      } else {

        // camera neither orthographic or perspective
        console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

      }

    };

    this.dollyIn = function ( dollyScale ) {

      if ( dollyScale === undefined ) {

        dollyScale = getZoomScale();

      }

      scale /= dollyScale;

    };

    this.dollyOut = function ( dollyScale ) {

      if ( dollyScale === undefined ) {

        dollyScale = getZoomScale();

      }

      scale *= dollyScale;

    };

    this.update = function () {

      var position = this.object.position;

      offset.copy( position ).sub( this.target );

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion( quat );

      // angle from z-axis around y-axis

      var theta = Math.atan2( offset.x, offset.z );

      // angle from y-axis

      var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

      if ( this.autoRotate ) {

        this.rotateLeft( getAutoRotationAngle() );

      }

      theta += thetaDelta;
      phi += phiDelta;

      // restrict phi to be between desired limits
      phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

      // restrict phi to be betwee EPS and PI-EPS
      phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

      var radius = offset.length() * scale;

      // restrict radius to be between desired limits
      radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

      // move target to panned location
      this.target.add( pan );

      offset.x = radius * Math.sin( phi ) * Math.sin( theta );
      offset.y = radius * Math.cos( phi );
      offset.z = radius * Math.sin( phi ) * Math.cos( theta );

      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion( quatInverse );

      position.copy( this.target ).add( offset );

      this.object.lookAt( this.target );

      thetaDelta = 0;
      phiDelta = 0;
      scale = 1;
      pan.set( 0, 0, 0 );

      if ( lastPosition.distanceToSquared( this.object.position ) > EPS ) {

        this.dispatchEvent( changeEvent );

        lastPosition.copy( this.object.position );

      }

    };


    this.reset = function () {

      state = STATE.NONE;

      this.target.copy( this.target0 );
      this.object.position.copy( this.position0 );

      this.update();

    };

    function getAutoRotationAngle() {

      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

    }

    function getZoomScale() {

      return Math.pow( 0.95, scope.zoomSpeed );

    }

    function onMouseDown( event ) {

      if ( scope.enabled === false ) return;
      event.preventDefault();

      if ( event.button === 0 ) {
        if ( scope.noRotate === true ) return;

        state = STATE.ROTATE;

        rotateStart.set( event.clientX, event.clientY );

      } else if ( event.button === 1 ) {
        if ( scope.noZoom === true ) return;

        state = STATE.DOLLY;

        dollyStart.set( event.clientX, event.clientY );

      } else if ( event.button === 2 ) {
        if ( scope.noPan === true ) return;

        state = STATE.PAN;

        panStart.set( event.clientX, event.clientY );

      }

      scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
      scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
      scope.dispatchEvent( startEvent );

    }

    function onMouseMove( event ) {

      if ( scope.enabled === false ) return;

      event.preventDefault();

      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      if ( state === STATE.ROTATE ) {

        if ( scope.noRotate === true ) return;

        rotateEnd.set( event.clientX, event.clientY );
        rotateDelta.subVectors( rotateEnd, rotateStart );

        // rotating across whole screen goes 360 degrees around
        scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

        // rotating up and down along whole screen attempts to go 360, but limited to 180
        scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

        rotateStart.copy( rotateEnd );

      } else if ( state === STATE.DOLLY ) {

        if ( scope.noZoom === true ) return;

        dollyEnd.set( event.clientX, event.clientY );
        dollyDelta.subVectors( dollyEnd, dollyStart );

        if ( dollyDelta.y > 0 ) {

          scope.dollyIn();

        } else {

          scope.dollyOut();

        }

        dollyStart.copy( dollyEnd );

      } else if ( state === STATE.PAN ) {

        if ( scope.noPan === true ) return;

        panEnd.set( event.clientX, event.clientY );
        panDelta.subVectors( panEnd, panStart );

        scope.pan( panDelta.x, panDelta.y );

        panStart.copy( panEnd );

      }

      scope.update();

    }

    function onMouseUp( /* event */ ) {

      if ( scope.enabled === false ) return;

      scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
      scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
      scope.dispatchEvent( endEvent );
      state = STATE.NONE;

    }

    function onMouseWheel( event ) {

      if ( scope.enabled === false || scope.noZoom === true ) return;

      event.preventDefault();
      event.stopPropagation();

      var delta = 0;

      if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

        delta = event.wheelDelta;

      } else if ( event.detail !== undefined ) { // Firefox

        delta = - event.detail;

      }

      if ( delta > 0 ) {

        scope.dollyOut();

      } else {

        scope.dollyIn();

      }

      scope.update();
      scope.dispatchEvent( startEvent );
      scope.dispatchEvent( endEvent );

    }

    function onKeyDown( event ) {

      if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

      switch ( event.keyCode ) {

        case scope.keys.UP:
          scope.pan( 0, scope.keyPanSpeed );
          scope.update();
          break;

        case scope.keys.BOTTOM:
          scope.pan( 0, - scope.keyPanSpeed );
          scope.update();
          break;

        case scope.keys.LEFT:
          scope.pan( scope.keyPanSpeed, 0 );
          scope.update();
          break;

        case scope.keys.RIGHT:
          scope.pan( - scope.keyPanSpeed, 0 );
          scope.update();
          break;

      }

    }

    function touchstart( event ) {

      if ( scope.enabled === false ) return;

      switch ( event.touches.length ) {

        case 1:	// one-fingered touch: rotate

          if ( scope.noRotate === true ) return;

          state = STATE.TOUCH_ROTATE;

          rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
          break;

        case 2:	// two-fingered touch: dolly

          if ( scope.noZoom === true ) return;

          state = STATE.TOUCH_DOLLY;

          var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
          var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
          var distance = Math.sqrt( dx * dx + dy * dy );
          dollyStart.set( 0, distance );
          break;

        case 3: // three-fingered touch: pan

          if ( scope.noPan === true ) return;

          state = STATE.TOUCH_PAN;

          panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
          break;

        default:

          state = STATE.NONE;

      }

      scope.dispatchEvent( startEvent );

    }

    function touchmove( event ) {

      if ( scope.enabled === false ) return;

      event.preventDefault();
      event.stopPropagation();

      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      switch ( event.touches.length ) {

        case 1: // one-fingered touch: rotate

          if ( scope.noRotate === true ) return;
          if ( state !== STATE.TOUCH_ROTATE ) return;

          rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
          rotateDelta.subVectors( rotateEnd, rotateStart );

          // rotating across whole screen goes 360 degrees around
          scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
          // rotating up and down along whole screen attempts to go 360, but limited to 180
          scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

          rotateStart.copy( rotateEnd );

          scope.update();
          break;

        case 2: // two-fingered touch: dolly

          if ( scope.noZoom === true ) return;
          if ( state !== STATE.TOUCH_DOLLY ) return;

          var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
          var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
          var distance = Math.sqrt( dx * dx + dy * dy );

          dollyEnd.set( 0, distance );
          dollyDelta.subVectors( dollyEnd, dollyStart );

          if ( dollyDelta.y > 0 ) {

            scope.dollyOut();

          } else {

            scope.dollyIn();

          }

          dollyStart.copy( dollyEnd );

          scope.update();
          break;

        case 3: // three-fingered touch: pan

          if ( scope.noPan === true ) return;
          if ( state !== STATE.TOUCH_PAN ) return;

          panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
          panDelta.subVectors( panEnd, panStart );

          scope.pan( panDelta.x, panDelta.y );

          panStart.copy( panEnd );

          scope.update();
          break;

        default:

          state = STATE.NONE;

      }

    }

    function touchend( /* event */ ) {

      if ( scope.enabled === false ) return;

      scope.dispatchEvent( endEvent );
      state = STATE.NONE;

    }

    var onContextMenu = function ( event ) { event.preventDefault(); };

    this.addListeners = function() {
      this.domElement.addEventListener( 'contextmenu', onContextMenu, false );
      this.domElement.addEventListener( 'mousedown', onMouseDown, false );
      this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
      this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

      this.domElement.addEventListener( 'touchstart', touchstart, false );
      this.domElement.addEventListener( 'touchend', touchend, false );
      this.domElement.addEventListener( 'touchmove', touchmove, false );

      window.addEventListener( 'keydown', onKeyDown, false );
    }

    this.removeListeners = function() {
      this.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
      this.domElement.removeEventListener( 'mousedown', onMouseDown, false );
      this.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
      this.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

      this.domElement.removeEventListener( 'touchstart', touchstart, false );
      this.domElement.removeEventListener( 'touchend', touchend, false );
      this.domElement.removeEventListener( 'touchmove', touchmove, false );

      window.removeEventListener( 'keydown', onKeyDown, false );
    }

    this.addListeners();

    // force an update at start
    this.update();

  };

  THREE.SatControls.prototype = Object.create( THREE.EventDispatcher.prototype );
