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

  oldGenomeHash = if existing? then existing.genomeHash else ''
  newGenomeHash = mod.genomeHash.digest('hex')

  if newServerHash is oldServerHash and newClientHash is oldClientHash and newGenomeHash is oldGenomeHash
    #console.log " - #{mod.data.name}: unchanged"
    return

  asset =
    name: mod.data.name
    client: mod.data.client
    version: mod.data.version
    genome: mod.data.genome
    controller: undefined
    error: undefined
    clientHash: newClientHash
    serverHash: newServerHash
    genomeHash: newGenomeHash

  try
    asset.controller = new mod.data.server app, asset
  catch err
    console.log " - #{asset.name}: #{err}"
    asset.error = err
    return

  unless asset.controller
    return


  # define some defaults
  if asset.controller.toString() is '[object Object]'
    asset.controller.toString = -> asset.name

  asset.controller.authorize ?= -> no

  asset.controller.getGenome ?= -> asset.genome

  asset.controller.getClient ?= -> asset.client

  asset.controller.getStatus ?= -> 'enabled'.green


  # we delete the old instance
  if existing?.controller?

    # try to call the free() method
    existing.controller.free?()

    delete existing.controller['app']
    delete existing.controller['asset']
    delete existing['name']
    delete existing['genome']
    delete existing['version']
    delete existing['controller']
    delete app.assets[asset.name]

  # and store the new one
  app.assets[asset.name] = asset

  # clear the temporary init stuff
  #delete mod.data['client']
  #delete mod.data['genome']
  #delete mod.data['server']
  #delete mod.data['version']
  #delete mod['data']

  console.log " - #{asset.name}".green + " (#{asset.version})"

updateAssets = (files=[]) ->

  unless app.updateNeeded
    return

  app.updateNeeded = no

  unless files.length
    files = simplewalk.match(config.assetsDir, /(\.json)|(\.coffee)$/gi) or []
    #console.log files

  modules = {}
  console.log "reparsing all assets"
  for fullPath in files

    unless fullPath[0] is '/'
      fullPath = "./#{fullPath}"

    [head..., dirName, fileName] = fullPath.split '/'

    unless dirName of modules
      modules[dirName] =
        progress: 0
        error: undefined
        data: {}
        clientHash: crypto.createHash('sha256')
        serverHash: crypto.createHash('sha256')
        genomeHash: crypto.createHash('sha256')

    mod = modules[dirName]

    switch fileName
      when 'client.coffee'
        #console.log " - found client for #{className}"
        try
          mod.data.client = fs.readFileSync(fullPath, 'utf8')
          if mod.data.client? and mod.data.client isnt ''
            mod.clientHash.update mod.data.client
          else
            mod.error = 'bad client'
        catch err
          mod.error = 'bad client: ' + err
        mod.progress += 25

      when 'server.coffee'
        #console.log " - found server for #{className}"
        try
          mod.data.server = uncachedRequire fullPath.replace('.coffee','')
          if mod.data.server?
            mod.serverHash.update fs.readFileSync(fullPath, 'utf8')
          else
            mod.error = 'bad server'
        catch err
          console.log "server.coffee error"
          mod.error = 'bad server: ' + err
        mod.progress += 25

      when 'package.json' # for migration
        #console.log " - found package.json for #{dirName} at #{fullPath}"

        try
          jsonStr = fs.readFileSync(fullPath, 'utf8')

          meta = JSON.parse jsonStr

          mod.data.name = "#{meta.name ? dirName}".trim().toLowerCase()

          assetConfigForProject = config.assets[meta.name] ? {}

          mod.data.version = meta.version ? '0.0.0'

          mod.data.enabled = assetConfigForProject.enabled ? false

          # basic version filtering for now
          if assetConfigForProject.version isnt '*'
            if assetConfigForProject.version isnt mod.data.version
              mod.data.enabled = false


          mod.data.genome = {}
          if meta.gunfire?
            if meta.gunfire.config?
              mod.data.genome = meta.gunfire.config

        catch err
          mod.error = 'bad meta: ' + err
        mod.progress += 25

        mod.progress += 25

    #console.log utils.pretty mod
    importModule mod

setInterval updateAssets, 250

syncAsset = (f, del) ->
  console.log "assets has been modified"
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
    console.log "asset removed: " + f
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

    if url.endsWith(".png")
      contentType = "image/png"
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
  console.log "new connection"
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
            if client.assets[name].genomeHash is serverAsset.genomeHash
              continue

        console.log " -> sending #{name}"

        clientAsset =
          name: name
          version: serverAsset.version
          clientHash: serverAsset.clientHash
          genomeHash: serverAsset.genomeHash
          source: serverAsset.controller.getClient()
          genome: serverAsset.controller.getGenome()

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
console.log "listening to #{config.serverPort}"
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
