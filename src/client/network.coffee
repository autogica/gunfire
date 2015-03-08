Primus = require 'primus'
utils = require './utils'
window.utils = utils

TWEEN = require 'tween.js'


class Network

  constructor: (@app) ->

    @primus = new Primus()

    @primus.on 'reconnect', (opts) ->
      console.log('Reconnecting:', 'gunfire: we are scheduling a new reconnect attempt in '+opts.timeout+' ms.')


    @primus.on 'reconnect', ->
      console.log('Reconnect:', 'gunfire: starting the reconnect attempt, hopefully we get a connection!')


    @primus.on 'online', ->
      console.log('Online:', 'gunfire: we have regained control over our internet connection.')


    @primus.on 'offline', ->
      console.log('Offline:', 'gunfire: we lost our internet connection.')


    @primus.on 'open', =>
      console.log('Open:', 'gunfire: the connection has been established.')

    @primus.on 'error', (err) =>
      console.log('Error:', 'gunfire: an unknown error has occured: '+err.message+'')


    updateAssetClient = (name, asset) =>
      module = exports: undefined
      res = {}
      #try
      res = eval CoffeeScript.compile asset.source
      #catch err
      #  console.log " - #{name}: compile error:", err
      #  return

      unless module.exports?
        console.log "gunfire: #{name}: source error"
        return

      instance = {}

      try
        instance = new module.exports @app.assets[name]
      catch err
        console.log "gunfire: #{name}: update error:", err
        return

      #console.log " - #{name}: asset:", asset
      instance.app ?= @app
      instance.clientSettings ?= asset.clientSettings
      instance.prototype = module.exports.prototype

      # inject some properties
      instance.clientHash = asset.clientHash
      instance.clientSettingsHash = asset.clientSettingsHash

      #instance.update

      tweenDuration = @app.config.tweenDuration
      tweenEasing = @app.config.tweenEasing


      instance._update = (config, opts={}) ->


        conf = {}
        if instance.config?
          conf = instance.config config
        else
          conf = JSON.parse JSON.stringify config

        opts.reset ?= no

        # initial setup
        unless instance.conf?
          instance.conf = conf
          instance.update? opts.reset, conf
          return

        if instance._tween? and instance._tween.stop?
          instance._tween.stop()

        opts.duration ?= tweenDuration
        opts.easing   ?= tweenEasing

        if opts.duration is 0
          instance.conf = conf
          instance.update? opts.reset
          return

        # morphing
        # TODO convert instance.conf to a flatten function
        # then in update, unflatten it!
        instance._tween = new TWEEN.Tween instance.conf
          .to conf, opts.duration
          .easing opts.tweenEasing

        if instance.update?
          instance._tween.onUpdate ->
            instance.update opts.reset

        instance._tween.start()

      # update immediately
      console.log "gunfire: #{name}: calling update on", instance
      instance._update.call instance, instance.clientSettings,
        duration: 0
        reset: yes

      # try to free existing instance
      if name of @app.assets
        console.log "gunfire: #{name}: found previous instance"
        if @app.assets[name].free?
          console.log "gunfire: #{name}: unloading previous instance.."
          try
            @app.assets[name].free()
            delete @app.assets[name]
            try
              namePath = name.split '-'
              tmp = window
              for item in namePath
                tmp = window[item]
              tmp = instance
            catch err2
              console.log "gunfire: couldn't create shortcut for #{name.replace(/-/g, '.')}", err2
          catch err
            console.log "gunfire: #{name}: cannot overwrite existing instance:", err


      @app.assets[name] = instance

      console.log "gunfire: #{name}: updated"
      # TODO: create a shortcut
      try
        namePath = name.split '-'
        tmp = window
        for item in namePath
          tmp = window[item]
        tmp = instance
      catch err
        console.log "gunfire: couldn't create shortcut for #{name.replace(/-/g, '.')}:", err


    @primus.on 'data', (data) =>
      #console.log('Received data')
      #console.log(data)
      if data.pong?
        #console.log("got ponged with assets:")
        for name, asset of data.pong

          # try to fdetect changes
          clientSettingsChanged = yes
          clientChanged = yes
          assetDeleted = JSON.stringify(asset) is '{}'
          assetExists = name of @app.assets
          if assetExists
            clientSettingsChanged = asset.clientSettingsHash isnt @app.assets[name].clientSettingsHash
            clientChanged = asset.clientHash isnt @app.assets[name].clientHash

          if assetExists and assetDeleted
            delete @app.assets[name]
            continue

          if clientChanged
            console.log "gunfire: #{name}: updating client and clientSettings.."
            updateAssetClient name, asset

          else if clientSettingsChanged and not assetExists
            console.log "gunfire: #{name}: also updating client and clientSettings.."
            updateAssetClient name, asset

          else if clientSettingsChanged
            console.log "gunfire: #{name}: updating clientSettings only.."
            @app.assets[name].clientSettings = asset.clientSettings
            @app.assets[name].clientSettingsHash = asset.clientSettingsHash

            # update using morphing, but no reset
            @app.assets[name]._update.call @app.assets[name], @app.assets[name].clientSettings,
              duration: 0
              reset: yes

    @primus.on 'end', ->
      console.log('End:', 'gunfire: the connection has ended.')


    @primus.on 'close', ->
      console.log('Close:', 'gunfire: we\'ve lost the connection to the server.')

  sync: =>
    # server will verify that ware roughtly at the right place
    # this is not a very strict enforcing
    assets = {}
    for name, asset of @app.assets
      #console.log "asset: " + name
      assets[name] =
        clientHash: asset.clientHash
        clientSettingsHash: asset.clientSettingsHash
    #console.log JSON.stringify assets
    @primus.write
      ping:
        position: [0, 0, 0]
        range: 10000
        assets: assets

module.exports = Network
