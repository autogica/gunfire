{Audio} = require './audio'
Network = require './network'
utils = require './utils'
TWEEN = require 'tween.js'
Stats = require 'stats.js'

class App

  constructor: ->

    @config =

      tweenDuration: 3000
      tweenEasing: TWEEN.Easing.Quadratic.InOut

      renderer:
        antialias: yes
        #precision: 'mediump' # for low-end mobiles

      network:
        interval: 800 # how frequently we should try to sync content with
                      # the server. Should be a few seconds. Also the server
                      # should enforce some quotas for cheaters or DoS attackers

    @gunfire =
      resourcesPath: window.location.origin + '/gunfire'

    @assets = {}
    @time = Date.now() * 0.0005
    @clock = new THREE.Clock()

    @mouseX = 0
    @mouseY = 0

    @windowHalfX = window.innerWidth / 2
    @windowHalfY = window.innerHeight / 2

    # network pipeline
    @network = new Network @

    # audio pipeline
    @audio = new Audio @

    # internal message queue
    @events = []
    @listeners = []


    @parent = document.body
    @container = document.createElement('div')
    @parent.appendChild @container

    @camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.5, 2000000 );
    #@camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 15000)
    @camera.position.z = 0
    @camera.position.y = 1000
    @camera.setLens 20


    @scene = new THREE.Scene()

    @scene.matrixAutoUpdate = no

    @renderer = new THREE.WebGLRenderer @config.renderer

    @renderer.sortObjects = yes


    # renderer.setClearColor( 0xafaadf, 1 )
    @renderer.setSize window.innerWidth, window.innerHeight
    # renderer.sortObjects = false
    @container.appendChild @renderer.domElement

    @controls = new THREE.GodControls @
    @controls.movementSpeed = 800
    @controls.lookSpeed     = 0.2

    @projector = new THREE.Projector()
    # see http://threejs.org/examples/webgl_octree_raycasting.html
    @octree = new THREE.Octree
      # uncomment below to see the octree (may kill the fps)
      #scene: @scene

      # when undeferred = yes, objects are inserted immediately
      # instead of being deferred until next octree.update() call
      # this may decrease performance as it forces a matrix update
      undeferred: no

      # set the max depth of tree
      depthMax: Infinity

      # max number of objects before nodes split or merge
      objectsThreshold: 8

      # percent between 0 and 1 that nodes will overlap each other
      # helps insert objects that lie over more than one node
      overlapPct: 0.15

    axisHelper = new THREE.AxisHelper( 80 )
    @scene.add axisHelper

    @stats = new Stats()
    @stats.domElement.style.position = 'absolute'
    @stats.domElement.style.top = '0px'
    @stats.domElement.style.zIndex = 100
    @container.appendChild @stats.domElement

    window.addEventListener   'resize', @onResize, no
    document.addEventListener 'mousemove', @onMouseMove, no

  onMouseMove: (event) =>
    @mouseX = event.clientX - @windowHalfX
    @mouseY = event.clientY - @windowHalfY

  onResize: =>
    @windowHalfX = window.innerWidth / 2
    @windowHalfY = window.innerHeight / 2

    @camera.aspect = window.innerWidth / window.innerHeight
    @camera.updateProjectionMatrix()

    @renderer.setSize window.innerWidth, window.innerHeight
    @controls.handleResize()


  emit: (emitter, message, data) ->
    i = 0
    listener = undefined
    isUnused = true
    for listener in listeners
      result = listener emitter, message, data
      if result
        isUnused = false

    console.log "emit", emitter, message, data

    if isUnused
      #events.push([emitter, message, data]);
      0

    if events.length
      nextUnusedEvent = events.shift()
      after 1000, =>
        @emit nextUnusedEvent[0], nextUnusedEvent[1], nextUnusedEvent[2]


  listen: (handler) ->
    @listeners.push handler


  subscribe: (emitter, message, callback) ->
    listeners.push (_emitter, _message, _p1, _p2, _p3, _p4, _p5, _p6) ->
      if emitter isnt _emitter or message isnt _message
        return no
      return callback _p1, _p2, _p3, _p4, _p4, _p5, _p6



  animate: =>
    requestAnimationFrame @animate

    # find a way to synchronize this between clients
    @time = Date.now() * 0.0005

    # update controls
    @controls.update @clock.getDelta()

    # update transitions
    TWEEN.update()

    # update assets
    for name, asset of @assets
      asset.render?()

    # draw screen
    @renderer.render @scene, @camera

    # update octree post render
    # this ensures any objects being added
    # have already had their matrices updated
    @octree.update()

    if @stats?
      @stats.update()


  #
  # Every N seconds, we ask the server to see if we need to update our objects
  # objects are json stuff, with code (serialied functions) inside
  #  Objects can be anything: ground, robots..
  # TODO: if there is an exception, we should wait a bit more before trying again
  start: ->

    @animate()

    func = =>
      @network.sync()

    setInterval (-> func()), @config.network.interval


console.log "initializing app"
# we expose to window for easier browser console debugging
window.app = new App()
window.app.start()
