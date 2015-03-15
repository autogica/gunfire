`"use strict"`

# standard node lib
http = require("http")
fs = require("fs")
path = require("path")
crypto = require('crypto')
util = require('util')

# third parties
Primus = require("primus")

# primus plugins
PrimusCluster    = require('primus-cluster')
PrimusResource   = require('primus-resource')
PrimusRooms      = require('primus-rooms')
PrimusEmitter    = require('primus-emitter')
PrimusMultiplex  = require('primus-multiplex')
PrimusRedis      = require('primus-redis')
PrimusRedisRooms = require('primus-redis-rooms')

# live build system
babelCore = require('babel-core');

# database
redis = require('redis')

# utilities
watch = require("watch")
simplewalk = require('simple-walk')
colors = require('colors')
open = require('open')

# gunfire libs
utils = require('./utils')

uncachedRequire = (module) ->
  delete require.cache[require.resolve module]
  return require module

resolvePath = (p) ->
  unless p[0] is '/'
    p = process.cwd() + '/' + p
  path.normalize p

app =
  # asset:
  #  - name: string
  #  - status: string
  #  - controller: instance of controller class
  #  - init: temporary init data object
  assets: {}
  clients: {}
  updateNeeded: yes
  fileIndex: {}


config = {}
try
  config = require "#{process.cwd()}/gunfire.json"

config.assetsDir ?= 'assets'
config.publicDir ?= 'public'
config.coreDir   ?= __dirname + '/../../lib/client'
config.serverPort ?= 8080


config.assetsDir = resolvePath config.assetsDir
config.publicDir = resolvePath config.publicDir
config.coreDir   = resolvePath config.coreDir

#console.log "coreDir: "+config.coreDir


importModule = (mod) ->

  return if mod.progress < 100
  mod.progress = 0

  unless mod.data.enabled
    console.log " - #{mod.data.name ? 'untitled'}".red
    return


  unless mod.data.name? and mod.data.name isnt ''
    console.log " - module has no name".red
    return

  if mod.error
    console.log " - #{mod.data.name}: " + "#{mod.error}".red
    return

  existing = app.assets[mod.data.name]

  oldServerHash = if existing? then existing.serverHash else ''
  newServerHash = mod.serverHash.digest('hex')

  oldClientHash = if existing? then existing.clientHash else ''
  newClientHash = mod.clientHash.digest('hex')

  oldClientSettingsHash = if existing? then existing.clientSettingsHash else ''
  newClientSettingsHash = mod.clientSettingsHash.digest('hex')

  if newServerHash is oldServerHash and newClientHash is oldClientHash and newClientSettingsHash is oldClientSettingsHash
    #console.log " - #{mod.data.name}: unchanged"
    return

  #console.log "mod.data: #{utils.pretty mod.data}"

  asset =
    name: mod.data.name
    client: mod.data.client
    version: mod.data.version
    clientSettings: mod.data.clientSettings
    controller: undefined
    error: undefined
    clientHash: newClientHash
    serverHash: newServerHash
    clientSettingsHash: newClientSettingsHash

  #console.log "asset: #{utils.pretty asset}"

  try
    asset.controller = new mod.data.server app, asset
  catch err
    console.log " - #{asset.name}:\n #{err}"
    asset.error = err
    return

  unless asset.controller
    return


  # define some defaults
  if asset.controller.toString() is '[object Object]'
    asset.controller.toString = -> asset.name

  asset.controller.authorize ?= -> no

  asset.controller.getClientSettings ?= -> asset.clientSettings

  asset.controller.getClient ?= -> asset.client

  asset.controller.getStatus ?= -> 'enabled'.green


  # we delete the old instance
  if existing?.controller?

    # try to call the free() method
    existing.controller.free?()

    delete existing.controller['app']
    delete existing.controller['asset']
    delete existing['name']
    delete existing['clientSettings']
    delete existing['version']
    delete existing['controller']
    delete app.assets[asset.name]

  # and store the new one
  app.assets[asset.name] = asset

  # clear the temporary init stuff
  #delete mod.data['client']
  #delete mod.data['clientSettings']
  #delete mod.data['server']
  #delete mod.data['version']
  #delete mod['data']

  console.log " - #{asset.name}".green + " (#{asset.version})"

updateAssets = (files=[]) ->

  unless app.updateNeeded
    return

  app.updateNeeded = no

  unless files.length
    files = simplewalk.match(config.assetsDir, /(\.(?:json|js|es6|coffee|ts))$/gi) or []

  modules = {}
  console.log "reparsing all assets"
  for fullPath in files

    unless fullPath[0] is '/'
      fullPath = "./#{fullPath}"

    console.log " fullPath: #{fullPath}"

    console.log "split: #{fullPath.split[config.assetsDir]}"

    [head..., dirName, fileName] = fullPath.split '/'

    unless dirName of modules
      modules[dirName] =
        progress: 0
        error: undefined
        data: {}
        clientHash: crypto.createHash('sha256')
        serverHash: crypto.createHash('sha256')
        clientSettingsHash: crypto.createHash('sha256')

    mod = modules[dirName]

    switch fileName

      when 'client.es6'
        console.log " - found client for #{dirName}"
        try
          clientCodeES6 = fs.readFileSync(fullPath, 'utf8')
          if clientCodeES6? and clientCodeES6 isnt ''
            clientCodeES5 = babelCore.transform clientCodeES6,
              # http://babeljs.io/docs/usage/options/
              filename: fullPath
              sourceMap: no # "inline"
              sourceMapName: fullPath
              sourceFileName: fullPath
              #resolveModuleSource: null
              playground: false # enable things such as ["foo", "bar"].map(#toUpperCase);
              experimental: true
              #compact: "auto"
              #ignore: //
            console.log clientCodeES5.code
            mod.data.client = clientCodeES5.code ? clientCodeES5
            mod.data.clientSourceMap = clientCodeES5.map ? []
            mod.clientHash.update mod.data.client
          else
            mod.error = 'invalid client.es6:\n '.red
        catch err

          mod.error = 'invalid client.es6:\n '.red + err
        mod.progress += 25

      when 'client.coffee'
        #console.log " - found client for #{className}"
        try
          mod.data.client = fs.readFileSync(fullPath, 'utf8')
          if mod.data.client? and mod.data.client isnt ''
            mod.clientHash.update mod.data.client
          else
            mod.error = 'invalid client.coffee:\n '.red
        catch err

          mod.error = 'invalid client.coffee:\n '.red + err
        mod.progress += 25

      when 'server.coffee'
        console.log " - found server for #{dirName}"
        try
          mod.data.server = uncachedRequire fullPath.replace('.coffee','')
          if mod.data.server?
            mod.serverHash.update fs.readFileSync(fullPath, 'utf8')
          else
            mod.error = 'bad server'
        catch err
          #console.log 'invalid server.coffee:\n '.red + err
          mod.error = 'invalid server.coffee:\n '.red + err
        mod.progress += 25

      when 'server.es6'
        #console.log " - found server for #{className}"
        try
          serverCodeES6 = fs.readFileSync(fullPath, 'utf8')
          #≈ = uncachedRequire fullPath #.replace('.es6','')

          if serverCodeES6? and serverCodeES6 isnt ''
            serverCodeES5 = babelCore.transform serverCodeES6,
              # http://babeljs.io/docs/usage/options/
              filename: fullPath
              sourceMap: no # "inline"
              sourceMapName: fullPath
              sourceFileName: fullPath
              #resolveModuleSource: null
              playground: false # enable things such as ["foo", "bar"].map(#toUpperCase);
              experimental: true
              #compact: "auto"
              #ignore: //

            src = """function(Module){
              #{serverCodeES5.code ? serverCodeES5}
              return Server;
            }"""
            console.log src
            Wrapped = eval src
            Module = {}
            mod.data.server = Wrapped(Module)
            mod.data.serverSourceMap = serverCodeES5.map ? []
          else
            mod.error = 'bad server'
        catch err
          #console.log 'invalid server.es6:\n '.red + err
          mod.error = 'invalid server.es6:\n '.red + err
        mod.progress += 25

      when 'package.json' # for migration
        #console.log " - found package.json for #{dirName} at #{fullPath}"

        try
          jsonStr = fs.readFileSync(fullPath, 'utf8')

          meta = JSON.parse jsonStr

          mod.data.name = "#{meta.name ? dirName}".trim().toLowerCase()

          #assetConfigForProject = config.assets[meta.name] ? {}

          mod.data.version = meta.version ? '0.0.0'

          mod.data.enabled = true

          ## basic version filtering for now
          #if assetConfigForProject.version isnt '*'
          #  if assetConfigForProject.version isnt mod.data.version
          #    mod.data.enabled = false


          mod.data.clientSettings = {}
          if meta.gunfire?
            if meta.gunfire.clientSettings?
              mod.data.clientSettings = meta.gunfire.clientSettings

        catch err
          mod.error = 'invalid package.json: '.red + err
        mod.progress += 50
        #mod.progress += 25

    #console.log utils.pretty mod
    importModule mod

setInterval updateAssets, 250

syncAsset = (f, del) ->
  console.log "gunfire: some files in the assets dir have been modified".grey
  app.updateNeeded = yes

# or use https://github.com/carlos8f/saw
watch.createMonitor config.assetsDir,
  ignoreDotFiles: true
, (monitor) ->

  monitor.on "created", (f, stat) ->
    #console.log("asset added: "+f);
    syncAsset f
    return

  monitor.on "changed", (f, curr, prev) ->
    #console.log("asset changed: "+f);
    syncAsset f
    return

  monitor.on "removed", (f, stat) ->

    # Handle removed files
    console.log "gunfire: asset removed: ".grey + f
    #syncAsset f, yes
    return

  return


#
# TODO we should regularly reload JSON assets in-memory,
# and serve them to players being around
#
server = http.createServer (req, res) ->
  console.log "got request: " + req.url

  # default resource
  contentType = "text/html"
  resource = config.publicDir + "/404.html"
  url = path.normalize(req.url)

  if url is '/favicon.ico'
    contentType = "image/x-icon"
    resource = config.publicDir + "/favicon.ico"

  else if url is '/bundle.js'
    contentType = "application/javascript"
    resource = "/builds/bundle.js"

  else if /^\/gunfire\//.test(url)
    contentType = "application/javascript"
    resource = config.coreDir + '/' + url.replace('/gunfire/','')

  else if /^\/assets\//.test(url)

    # content-type checking

    if url.endsWith(".js")
      contentType = "application/javascript"
    if url.endsWith(".json")
      contentType = "application/json"
    else contentType = "audio/mp3"  if url.endsWith(".mp3")
    resource = url

  else if /^\/textures\//.test(url)

    # content-type checking
    if url.endsWith(".jpg")
      contentType = "image/jpeg"
    else if url.endsWith(".png")
      contentType = "image/png"
    resource = config.publicDir + url

  else if /^\/maps\//.test(url)
    if url.endsWith(".json")
      contentType = "aplication/json"
    resource = config.publicDir + url

  else if /^\/models\//.test(url)
    if url.endsWith(".json")
      contentType = "aplication/json"
    resource = config.publicDir + url

  else
    contentType = "text/html"
    resource = config.publicDir + "/index.html"

  # send resource
  res.setHeader "Content-Type", contentType
  fs.createReadStream(resource).pipe res
  return

#
# Now that we've setup our basic server, we can setup our Primus server.
#

getRedisClient = ->

  client = redis.createClient()
  client.select(1)
  client

primus = new Primus server,
  transformer: "websockets"
  pathname: "/primus"
  parser: "JSON"
  redis:
    host: 'localhost',
    port: 6379,
    channel: 'autogica' # Optional, defaults to `'primus`'

  #cluster:
  #  redis: getRedisClient
  #   channel: 'autogica'
  #   ttl: 86400 # 1 day

primus.use('rooms', PrimusRooms)
primus.use('emitter', PrimusEmitter)
primus.use('resource', PrimusResource)
primus.use('multiplex', PrimusMultiplex)
#primus.use('cluster', PrimusCluster)

# Listen for new connections and send data
#
primus.on "connection", (spark) ->
  console.log "gunfire: new connection".grey
  spark.on "data", (packet) ->
    #console.log "incoming:", packet

    if packet is "end"
      spark.end()

    if packet.pipe
      fs.createReadStream(config.publicDir + "/index.html").pipe(spark, end: no)

    # replies to client localization pings with localized assets
    if packet.ping
      #console.log "got a ping! " + utils.pretty packet.ping
      client = packet.ping

      clientAssets = {}
      for name, __ of client.assets
        serverAsset = app.assets[name]

        # if the client has an asset not existing on the server side
        unless serverAsset?
          clientAssets[name] = {} # delete
          continue


      for name, serverAsset of app.assets
        # TODO check if client has access to the assets

        # if client is authorized
        unless serverAsset.controller.authorize client

          # if the asset is unauthorized, but still exists on client side
          if name of clientAssets
            clientAssets[name] = {} # delete
            continue

          # else we just skip
          else
            continue

        # do not send assets already synchronized
        if client.assets[name]?
          if client.assets[name].clientHash is serverAsset.clientHash
            if client.assets[name].clientSettingsHash is serverAsset.clientSettingsHash
              continue

        console.log "gunfire: sending #{name}"

        clientAsset =
          name: name
          version: serverAsset.version
          clientHash: serverAsset.clientHash
          clientSettingsHash: serverAsset.clientSettingsHash
          source: serverAsset.controller.getClient()
          clientSettings: serverAsset.controller.getClientSettings()

        clientAssets[serverAsset.name] = clientAsset

      spark.write
        pong: clientAssets

    if packet is "kill"
      primus.write "Spark: #{spark.id} asked for a full server kill."
      setTimeout process.exit, 5000
    return
  return

# we upgrading the version of Primus in package.js, uncomment this line,
# run the server, then copy primus.to to lib/client/primus.js (overwrite the file)
# then go back here and re-comment the line. I know, this is clunky..
# primus.save "primus.js"

# setTimeout((-> open 'http://localhost:8080'), 1000)
console.log "gunfire: now listening to #{config.serverPort}"
server.listen config.serverPort
###
bowerModules = []
bowerConfig = {}
cmdConfig = save: yes
bower.commands
  .install(bowerModulesmodules, cmdConfig, bowerConfig)
  .on 'end', (installed) ->
    console.log installed
    server.listen config.serverPort
###
