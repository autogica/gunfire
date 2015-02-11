

exports.pretty = pretty = (obj) -> JSON.stringify obj

exports.distance = distance = (p1, p2) ->
  throw "Not Implemented"
  Math.sqrt Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)

exports.after = after = (t, f) -> setTimeout f, t

# do -> # actually no need for do -> here

String::endsWith ?= (s) ->
  @length >= s.length and @substr(@length - s.length) is s

Array::shuffle ?= ->
  for i in [@length-1..1]
    j = Math.floor Math.random() * (i + 1)
    [@[i], @[j]] = [@[j], @[i]]
  @

exports.flatten = (obj, flat={}, p='') ->
  for k, v of obj
    kp = p + '.' + k
    if  v is 'object'
      flatten v, flat, kp
    else
      flat[kp] = v
  flat

exports.unflatten = (obj) ->
  res = {}
  for key, value of obj
    key = key.split '.'
    p = res
    while key.length
      p = p[key.shift()] = if key.length is 1 then value else {}
  res



class window.ObjectPoolFactory
  constructor: (@size = 1000, @buildOptions = {}) ->

    @geometryFactory = (opts) -> throw "missing geometryFactory"
    @materialFactory = (geometry, opts) -> new THREE.MeshNormalMaterial()
    @meshFactory =  (geometry, material, opts)  -> new THREE.Mesh geometry, material
    @objectFactory = (obj, opts) -> obj
    @objectDestroyer = ->

    @compiled = no
    @addedToScene = no
    @objects = []



  addToScene: (scene) ->
    console.log "ObjectPoolFactory: addToScene"
    if @addedToScene
      console.log "ObjectPoolFactory: already added to scene!"
      return

    unless @compiled
       console.log "ObjectPoolFactory: not compiled!"
       return

    @addedToScene = yes
    @scene = scene

    #unless @compiled
    #  console.log "ObjectPoolFactory: not compiled! compiling.."
    #  @compile()

    for obj in @objects
      @scene.add obj.mesh


  compile: (newConfig) ->
    console.log "ObjectPoolFactory: compile:", newConfig
    unless newConfig?
      throw "not implemented: compile called without config"

    sizeChanged = no
    buildOptionsChanged = no
    geometryFactoryChanged = no
    materialFactoryChanged = no
    meshFactoryChanged = no
    objectFactoryChanged = no

    if newConfig.size?
      if newConfig.size isnt @size
        console.log "ObjectPoolFactory: compile: size changed"
        @size = newConfig.size
        sizeChanged = yes

    if newConfig.materialFactory? and "#{newConfig.materialFactory}" isnt "#{@materialFactory}"
      console.log "ObjectPoolFactory: compile: materialFactory changed"
      @materialFactory = newConfig.materialFactory
      materialFactoryChanged = yes
      meshFactoryChanged = yes
      objectFactoryChanged = yes

    if newConfig.geometryFactory? and "#{newConfig.geometryFactory}" isnt "#{@geometryFactory}"
      console.log "ObjectPoolFactory: compile: geometryFactory changed"
      @geometryFactory = newConfig.geometryFactory
      geometryFactoryChanged = yes
      meshFactoryChanged = yes
      objectFactoryChanged = yes

    if newConfig.meshFactory? and "#{newConfig.meshFactory}" isnt "#{@meshFactory}"
      console.log "ObjectPoolFactory: compile: meshFactory changed"
      @meshFactory = newConfig.meshFactory
      meshFactoryChanged = yes
      objectFactoryChanged = yes

    if newConfig.objectFactory? and "#{newConfig.objectFactory}" isnt "#{@objectFactory}"
      console.log "ObjectPoolFactory: compile: objectFactory changed"
      @objectFactory = newConfig.objectFactory
      objectFactoryChanged = yes

    if newConfig.objectDestroyer? and "#{newConfig.objectDestroyer}" isnt "#{@objectDestroyer}"
      console.log "ObjectPoolFactory: compile: objectDestroyer changed"
      @objectDestroyer = newConfig.objectDestroyer
      objectFactoryChanged = yes

    if newConfig.buildOptions? and "#{JSON.stringify newConfig.buildOptions}" isnt "#{JSON.stringify @buildOptions}"
      console.log "ObjectPoolFactory: compile: buildOptions changed"
      @buildOptions = newConfig.buildOptions
      buildOptionsChanged = yes
      geometryFactoryChanged = yes
      materialFactoryChanged = yes
      meshFactoryChanged = yes
      objectFactoryChanged = yes

    # destroy former geometry
    if geometryFactoryChanged and @geometry?.dispose?
      console.log "ObjectPoolFactory: compile: disposing of old geometry.."
      @geometry.dispose()

    if materialFactoryChanged and @material?.dispose?
      console.log "ObjectPoolFactory: compile: disposing of old material.."
      @material.dispose()
      #texture.dispose();

    console.log "ObjectPoolFactory: compile: building new geometry.."
    @geometry = @geometryFactory @buildOptions

    console.log "ObjectPoolFactory: compile: building new material.."
    @material = @materialFactory @geometry, @buildOptions

    # check if we need to migrate existing content
    if @compiled and @meshChanged
      console.log "ObjectPoolFactory: compile: already compiled! migrating content.."
      len = @objects.length
      console.log "ObjectPoolFactory: compile: need to recompile #{len} objects.."
      for obj in @objects

        if @addedToScene
          @scene.remove obj.mesh

        obj.mesh.dispose()

        obj.mesh = @meshFactory @geometry, @material, @buildOpts

        if @addedToScene
          @scene.add obj.mesh


    # next, we extend the array with new stuff
    if @objects.length >= @size
      console.log "ObjectPoolFactory: compile: no need to resize"
    else
      len = @objects.length
      console.log "ObjectPoolFactory: compile: need to resize from #{len} to #{@size}"

      for i in [len...@size]
        mesh = @meshFactory @geometry, @material, @buildOptions
        mesh.visible = no
        if @addedToScene
          @scene.add mesh

        @objects.push
          mesh: mesh
          isFree: yes
          # no tween, no params: that's normal!

      @size = @objects.length
      console.log "ObjectPoolFactory: successfully resized @objects"

    console.log "ObjectPoolFactory: compile: ended"
    @compiled = yes

    @


  get: (instanceFactory, opts) ->
    if @objects.length is 0
      throw "ObjectPoolFactory: get: cannot get object, collection is empty"

    console.log "ObjectPoolFactory: get: popping.."
    # recycle objects
    obj = @objects.pop()
    obj.isFree = no

    console.log "ObjectPoolFactory: get: creating a fresh instance object.."
    @objectFactory obj, opts
    obj.mesh.visible = yes

    console.log "ObjectPoolFactory: get: unshifting.."
    @objects.unshift obj
    return obj


  ###
  Free an object

  ###
  free: (obj) ->
    console.log "ObjectPoolFactory: free: asked to free ", obj

    if typeof obj is 'undefined'
      throw "NullPointerException: ObjectPoolFactory: free: you tried to free an undefined reference"

    if obj.isFree
      console.log "ObjectPoolFactory: free: object is already free"
      return

    console.log "ObjectPoolFactory: free: asked to free object"

    # remove the object
    index = indexOf obj
    @objects.splice index, 1

    @objectDestroyer obj

    # note that we do not remove the object from the scene, so we do not have
    # to update the scene tree!

    # maybe here, we should do some garbage collection
    console.log "ObjectPoolFactory: free: recycling object"


    # actual recycling
    obj.mesh.visible = no
    obj.isFree = yes

    #note: there might still be some garbage attached to the object, such as
    # private properties, but that's okay, because they are common to all
    # object of the pool
    #delete obj.mesh.tween

    @objects.push obj


    obj
