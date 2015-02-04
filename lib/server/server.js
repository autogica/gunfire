(function() {
  "use strict";
  var Primus, PrimusCluster, PrimusEmitter, PrimusMultiplex, PrimusRedis, PrimusRedisRooms, PrimusResource, PrimusRooms, app, colors, config, crypto, fs, getRedisClient, http, importModule, open, path, primus, redis, resolvePath, server, simplewalk, syncAsset, uncachedRequire, updateAssets, util, utils, watch,
    __slice = [].slice;

  http = require("http");

  fs = require("fs");

  path = require("path");

  crypto = require('crypto');

  util = require('util');

  Primus = require("primus");

  PrimusCluster = require('primus-cluster');

  PrimusResource = require('primus-resource');

  PrimusRooms = require('primus-rooms');

  PrimusEmitter = require('primus-emitter');

  PrimusMultiplex = require('primus-multiplex');

  PrimusRedis = require('primus-redis');

  PrimusRedisRooms = require('primus-redis-rooms');

  redis = require('redis');

  watch = require("watch");

  simplewalk = require('simple-walk');

  colors = require('colors');

  open = require('open');

  utils = require('./utils');

  uncachedRequire = function(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
  };

  resolvePath = function(p) {
    if (p[0] !== '/') {
      p = process.cwd() + '/' + p;
    }
    return path.normalize(p);
  };

  app = {
    assets: {},
    clients: {},
    updateNeeded: true
  };

  config = {};

  try {
    config = require("" + (process.cwd()) + "/gunfire.json");
  } catch (_error) {}

  if (config.assetsDir == null) {
    config.assetsDir = 'assets';
  }

  if (config.publicDir == null) {
    config.publicDir = 'public';
  }

  if (config.coreDir == null) {
    config.coreDir = __dirname + '/../../lib/client';
  }

  if (config.serverPort == null) {
    config.serverPort = 8080;
  }

  config.assetsDir = resolvePath(config.assetsDir);

  config.publicDir = resolvePath(config.publicDir);

  config.coreDir = resolvePath(config.coreDir);

  importModule = function(mod) {
    var asset, err, existing, newClientHash, newClientSettingsHash, newServerHash, oldClientHash, oldClientSettingsHash, oldServerHash, _base, _base1, _base2, _base3, _base4, _ref;
    if (mod.progress < 100) {
      return;
    }
    mod.progress = 0;
    if (!mod.data.enabled) {
      console.log((" - " + ((_ref = mod.data.name) != null ? _ref : 'untitled')).red);
      return;
    }
    if (!((mod.data.name != null) && mod.data.name !== '')) {
      console.log(" - module has no name".red);
      return;
    }
    if (mod.error) {
      console.log((" - " + mod.data.name + ": ") + ("" + mod.error).red);
      return;
    }
    existing = app.assets[mod.data.name];
    oldServerHash = existing != null ? existing.serverHash : '';
    newServerHash = mod.serverHash.digest('hex');
    oldClientHash = existing != null ? existing.clientHash : '';
    newClientHash = mod.clientHash.digest('hex');
    oldClientSettingsHash = existing != null ? existing.clientSettingsHash : '';
    newClientSettingsHash = mod.clientSettingsHash.digest('hex');
    if (newServerHash === oldServerHash && newClientHash === oldClientHash && newClientSettingsHash === oldClientSettingsHash) {
      return;
    }
    asset = {
      name: mod.data.name,
      client: mod.data.client,
      version: mod.data.version,
      clientSettings: mod.data.clientSettings,
      controller: void 0,
      error: void 0,
      clientHash: newClientHash,
      serverHash: newServerHash,
      clientSettingsHash: newClientSettingsHash
    };
    try {
      asset.controller = new mod.data.server(app, asset);
    } catch (_error) {
      err = _error;
      console.log(" - " + asset.name + ":\n " + err);
      asset.error = err;
      return;
    }
    if (!asset.controller) {
      return;
    }
    if (asset.controller.toString() === '[object Object]') {
      asset.controller.toString = function() {
        return asset.name;
      };
    }
    if ((_base = asset.controller).authorize == null) {
      _base.authorize = function() {
        return false;
      };
    }
    if ((_base1 = asset.controller).getClientSettings == null) {
      _base1.getClientSettings = function() {
        return asset.clientSettings;
      };
    }
    if ((_base2 = asset.controller).getClient == null) {
      _base2.getClient = function() {
        return asset.client;
      };
    }
    if ((_base3 = asset.controller).getStatus == null) {
      _base3.getStatus = function() {
        return 'enabled'.green;
      };
    }
    if ((existing != null ? existing.controller : void 0) != null) {
      if (typeof (_base4 = existing.controller).free === "function") {
        _base4.free();
      }
      delete existing.controller['app'];
      delete existing.controller['asset'];
      delete existing['name'];
      delete existing['clientSettings'];
      delete existing['version'];
      delete existing['controller'];
      delete app.assets[asset.name];
    }
    app.assets[asset.name] = asset;
    return console.log((" - " + asset.name).green + (" (" + asset.version + ")"));
  };

  updateAssets = function(files) {
    var dirName, err, fileName, fullPath, head, jsonStr, meta, mod, modules, _i, _j, _len, _ref, _ref1, _ref2, _results;
    if (files == null) {
      files = [];
    }
    if (!app.updateNeeded) {
      return;
    }
    app.updateNeeded = false;
    if (!files.length) {
      files = simplewalk.match(config.assetsDir, /(\.json)|(\.coffee)$/gi) || [];
    }
    modules = {};
    console.log("reparsing all assets");
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      fullPath = files[_i];
      if (fullPath[0] !== '/') {
        fullPath = "./" + fullPath;
      }
      _ref = fullPath.split('/'), head = 3 <= _ref.length ? __slice.call(_ref, 0, _j = _ref.length - 2) : (_j = 0, []), dirName = _ref[_j++], fileName = _ref[_j++];
      if (!(dirName in modules)) {
        modules[dirName] = {
          progress: 0,
          error: void 0,
          data: {},
          clientHash: crypto.createHash('sha256'),
          serverHash: crypto.createHash('sha256'),
          clientSettingsHash: crypto.createHash('sha256')
        };
      }
      mod = modules[dirName];
      switch (fileName) {
        case 'client.coffee':
          try {
            mod.data.client = fs.readFileSync(fullPath, 'utf8');
            if ((mod.data.client != null) && mod.data.client !== '') {
              mod.clientHash.update(mod.data.client);
            } else {
              mod.error = 'invalid client.coffee:\n '.red;
            }
          } catch (_error) {
            err = _error;
            mod.error = 'invalid client.coffee:\n '.red + err;
          }
          mod.progress += 25;
          break;
        case 'server.coffee':
          try {
            mod.data.server = uncachedRequire(fullPath.replace('.coffee', ''));
            if (mod.data.server != null) {
              mod.serverHash.update(fs.readFileSync(fullPath, 'utf8'));
            } else {
              mod.error = 'bad server';
            }
          } catch (_error) {
            err = _error;
            mod.error = 'invalid server.coffee:\n '.red + err;
          }
          mod.progress += 25;
          break;
        case 'package.json':
          try {
            jsonStr = fs.readFileSync(fullPath, 'utf8');
            meta = JSON.parse(jsonStr);
            mod.data.name = ("" + ((_ref1 = meta.name) != null ? _ref1 : dirName)).trim().toLowerCase();
            mod.data.version = (_ref2 = meta.version) != null ? _ref2 : '0.0.0';
            mod.data.enabled = true;
            mod.data.clientSettings = {};
            if (meta.gunfire != null) {
              if (meta.gunfire.clientSettings != null) {
                mod.data.clientSettings = meta.gunfire.clientSettings;
              }
            }
          } catch (_error) {
            err = _error;
            mod.error = 'invalid package.json: '.red + err;
          }
          mod.progress += 25;
          mod.progress += 25;
      }
      _results.push(importModule(mod));
    }
    return _results;
  };

  setInterval(updateAssets, 250);

  syncAsset = function(f, del) {
    console.log("gunfire: some files in the assets dir have been modified".grey);
    return app.updateNeeded = true;
  };

  watch.createMonitor(config.assetsDir, {
    ignoreDotFiles: true
  }, function(monitor) {
    monitor.on("created", function(f, stat) {
      syncAsset(f);
    });
    monitor.on("changed", function(f, curr, prev) {
      syncAsset(f);
    });
    monitor.on("removed", function(f, stat) {
      console.log("gunfire: asset removed: ".grey + f);
    });
  });

  server = http.createServer(function(req, res) {
    var contentType, resource, url;
    console.log("got request: " + req.url);
    contentType = "text/html";
    resource = config.publicDir + "/404.html";
    url = path.normalize(req.url);
    if (url === '/favicon.ico') {
      contentType = "image/x-icon";
      resource = config.publicDir + "/favicon.ico";
    } else if (url === '/bundle.js') {
      contentType = "application/javascript";
      resource = "/builds/bundle.js";
    } else if (/^\/gunfire\//.test(url)) {
      contentType = "application/javascript";
      resource = config.coreDir + '/' + url.replace('/gunfire/', '');
    } else if (/^\/assets\//.test(url)) {
      if (url.endsWith(".js")) {
        contentType = "application/javascript";
      }
      if (url.endsWith(".json")) {
        contentType = "application/json";
      } else {
        if (url.endsWith(".mp3")) {
          contentType = "audio/mp3";
        }
      }
      resource = url;
    } else if (/^\/textures\//.test(url)) {
      if (url.endsWith(".jpg")) {
        contentType = "image/jpeg";
      }
      if (url.endsWith(".png")) {
        contentType = "image/png";
      }
      resource = config.publicDir + url;
    } else {
      contentType = "text/html";
      resource = config.publicDir + "/index.html";
    }
    res.setHeader("Content-Type", contentType);
    fs.createReadStream(resource).pipe(res);
  });

  getRedisClient = function() {
    var client;
    client = redis.createClient();
    client.select(1);
    return client;
  };

  primus = new Primus(server, {
    transformer: "websockets",
    pathname: "/primus",
    parser: "JSON",
    redis: {
      host: 'localhost',
      port: 6379,
      channel: 'autogica'
    }
  });

  primus.use('rooms', PrimusRooms);

  primus.use('emitter', PrimusEmitter);

  primus.use('resource', PrimusResource);

  primus.use('multiplex', PrimusMultiplex);

  primus.on("connection", function(spark) {
    console.log("gunfire: new connection".grey);
    spark.on("data", function(packet) {
      var client, clientAsset, clientAssets, name, serverAsset, __, _ref, _ref1;
      if (packet === "end") {
        spark.end();
      }
      if (packet.pipe) {
        fs.createReadStream(config.publicDir + "/index.html").pipe(spark, {
          end: false
        });
      }
      if (packet.ping) {
        client = packet.ping;
        clientAssets = {};
        _ref = client.assets;
        for (name in _ref) {
          __ = _ref[name];
          serverAsset = app.assets[name];
          if (serverAsset == null) {
            clientAssets[name] = {};
            continue;
          }
        }
        _ref1 = app.assets;
        for (name in _ref1) {
          serverAsset = _ref1[name];
          if (!serverAsset.controller.authorize(client)) {
            if (name in clientAssets) {
              clientAssets[name] = {};
              continue;
            } else {
              continue;
            }
          }
          if (client.assets[name] != null) {
            if (client.assets[name].clientHash === serverAsset.clientHash) {
              if (client.assets[name].clientSettingsHash === serverAsset.clientSettingsHash) {
                continue;
              }
            }
          }
          console.log("gunfire: sending " + name);
          clientAsset = {
            name: name,
            version: serverAsset.version,
            clientHash: serverAsset.clientHash,
            clientSettingsHash: serverAsset.clientSettingsHash,
            source: serverAsset.controller.getClient(),
            clientSettings: serverAsset.controller.getClientSettings()
          };
          clientAssets[serverAsset.name] = clientAsset;
        }
        spark.write({
          pong: clientAssets
        });
      }
      if (packet === "kill") {
        primus.write("Spark: " + spark.id + " asked for a full server kill.");
        setTimeout(process.exit, 5000);
      }
    });
  });

  console.log("gunfire: now listening to " + config.serverPort);

  server.listen(config.serverPort);


  /*
  bowerModules = []
  bowerConfig = {}
  cmdConfig = save: yes
  bower.commands
    .install(bowerModulesmodules, cmdConfig, bowerConfig)
    .on 'end', (installed) ->
      console.log installed
      server.listen config.serverPort
   */

}).call(this);
