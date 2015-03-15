`"use strict";`

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


# Returns a function, that, as long as it continues to be invoked, will not
# be triggered. The function will be called after it stops being called for
# N milliseconds. If `immediate` is passed, trigger the function on the
# leading edge, instead of the trailing.
window.debounce = (func, wait, immediate) ->
  timeout = null
  ->
    args = arguments
    later = =>
      timeout = null
      unless immediate
        func.apply @, args
    callNow = immediate and not timeout
    clearTimeout timeout
    timeout = setTimeout later, wait
    if callNow
      func.apply @, args


class window.ObjectPoolFactory
  constructor: ->

    @size = 1000
    @buildOptions = {}
    @geometryFactory = (opts) -> throw "missing geometryFactory"
    @materialFactory = (geometry, opts) -> new THREE.MeshNormalMaterial()
    @meshFactory =  (geometry, material, opts)  -> new THREE.Mesh geometry, material
    @objectFactory = (obj, opts) -> obj
    @objectDestroyer = ->

    @compiled = no
    @connected = no
    @objects = []

  connectTo: (scene) ->

    console.log "ObjectPoolFactory: addToScene"
    if @connected
      console.log "ObjectPoolFactory: already added to scene!"
      return


    @connected = yes
    @scene = scene

    if !@compiled
       console.log "ObjectPoolFactory: not compiled, compiling.."
       @compile yes, yes, yes

    for obj in @objects
      @scene.add obj.mesh
    @


  update: (newConfig) ->
    console.log "ObjectPoolFactory.update:", newConfig


    forceRebuild = no
    if !newConfig?
      console.log "ObjectPoolFactory.update: called without config of any kind forcing compilation.."
      forceRebuild = yes
      newConfig = {} # create a real empty object, so the rest of the code works

    rebuild =
      size: forceRebuild
      buildOptions: forceRebuild
      geometryFactory: forceRebuild
      materialFactory: forceRebuild
      meshFactory: forceRebuild
      objectFactory: forceRebuild
      compileNeeded: forceRebuild

    if newConfig.size?
      if newConfig.size isnt @size
        console.log "ObjectPoolFactory.update: size changed"
        @size = newConfig.size
        rebuild.size = yes


    if newConfig.materialFactory? and "#{newConfig.materialFactory}" isnt "#{@materialFactory}"
      console.log "ObjectPoolFactory.update: materialFactory changed"
      @materialFactory = newConfig.materialFactory
      rebuild.materialFactory = yes
      rebuild.meshFactory = yes
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes

    if newConfig.geometryFactory? and "#{newConfig.geometryFactory}" isnt "#{@geometryFactory}"
      console.log "ObjectPoolFactory.update: geometryFactory changed"
      @geometryFactory = newConfig.geometryFactory
      rebuild.geometryFactory = yes
      rebuild.meshFactory = yes
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes


    if newConfig.meshFactory? and "#{newConfig.meshFactory}" isnt "#{@meshFactory}"
      console.log "ObjectPoolFactory.update: meshFactory changed"
      @meshFactory = newConfig.meshFactory
      rebuild.meshFactory = yes
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes


    if newConfig.objectFactory? and "#{newConfig.objectFactory}" isnt "#{@objectFactory}"
      console.log "ObjectPoolFactory.update: objectFactory changed"
      @objectFactory = newConfig.objectFactory
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes

    if newConfig.objectDestroyer? and "#{newConfig.objectDestroyer}" isnt "#{@objectDestroyer}"
      console.log "ObjectPoolFactory.update: objectDestroyer changed"
      @objectDestroyer = newConfig.objectDestroyer
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes

    if newConfig.buildOptions? and "#{JSON.stringify newConfig.buildOptions}" isnt "#{JSON.stringify @buildOptions}"
      console.log "ObjectPoolFactory.update: buildOptions changed"
      @buildOptions = newConfig.buildOptions
      rebuild.buildOptions = yes
      rebuild.geometryFactory = yes
      rebuild.materialFactory = yes
      rebuild.meshFactory = yes
      rebuild.objectFactory = yes
      rebuild.compileNeeded = yes

    if @connected and rebuild.compileNeeded
      @compile rebuild.geometryFactory, rebuild.materialFactory, rebuild.meshFactory

    rebuild


  compile: (rebuildGeometry, rebuildMaterial, rebuildMesh) ->
    # destroy former geometry
    if rebuildGeometry
      console.log "ObjectPoolFactory.compile: disposing of old geometry.."
      @geometry?.dispose?()
      console.log "ObjectPoolFactory.compile: building new geometry.."
      prom = @geometryFactory @buildOptions
      prom (geometry) =>
        @geometry = geometry
        @afterGeometryUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh)
    else
      @afterGeometryUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh)
    @

  afterMeshUpdate: (rebuildGeometry, rebuildMaterial, rebuildMesh) ->
    # next, we extend the array with new stuff
    if @objects.length >= @size
      console.log "ObjectPoolFactory.compile: no need to resize"
      @compiled = yes
    else
      len = @objects.length
      console.log "ObjectPoolFactory.compile: need to resize from #{len} to #{@size}"
      prom = @meshFactory @geometry, @material, @buildOptions
      prom (mesh) =>
        mesh.visible = no
        for i in [len...@size]

          if i > len
            mesh = mesh.clone()

          if @connected
            @scene.add mesh

          @objects.push
            mesh: mesh
            isFree: yes

        @size = @objects.length
        console.log "ObjectPoolFactory.compile: successfully resized @objects"
        console.log "ObjectPoolFactory.compile: ended"
        @compiled = yes



  afterMaterialUpdate: (rebuildGeometry, rebuildMaterial, rebuildMesh) ->

    # check if we need to migrate existing content
    if @compiled and rebuildMesh
      console.log "ObjectPoolFactory.compile: already compiled! migrating content.."
      len = @objects.length
      console.log "ObjectPoolFactory.compile: need to recompile #{len} objects.."
      for obj in @objects
        if @connected
          @scene.remove obj.mesh
        obj.mesh.dispose()
        obj.mesh = @meshFactory @geometry, @material, @buildOpts
        if @connected
          @scene.add obj.mesh
    @afterMeshUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh)

  afterGeometryUpdate: (rebuildGeometry, rebuildMaterial, rebuildMesh) ->
    if rebuildMaterial
      console.log "ObjectPoolFactory.compile: disposing of old material.."
      @material?.dispose?()
      @texture?.dispose?()
      console.log "ObjectPoolFactory.compile: building new material.."
      prom = @materialFactory @geometry, @buildOptions
      prom (material) =>
        @material = material
        @afterMaterialUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh)
    else
      @afterMaterialUpdate(rebuildGeometry, rebuildMaterial, rebuildMesh)


  getSync: (opts) ->

    # TODO remove in the prod version
    if @objects.length is 0
      throw "ObjectPoolFactory: get: cannot get object, collection is empty"

    #console.log "ObjectPoolFactory: get: popping.."
    # recycle objects
    objects = for i in [0...opts.nbInstances]
      obj = @objects.pop()

      obj.isFree = no

      #console.log "ObjectPoolFactory: get: creating a fresh instance object.."
      @objectFactory obj, opts

      #console.log "ObjectPoolFactory: get: unshifting.."
      @objects.unshift obj
      obj
    objects

  getAsync: (opts, cb) ->

    # TODO remove in the prod version
    if @objects.length is 0
      throw "ObjectPoolFactory: get: cannot get object, collection is empty"

    objects = for i in [0...opts.nbInstances]
      #console.log "ObjectPoolFactory: get: popping.."
      # recycle objects
      obj = @objects.pop()

      obj.isFree = no

      #console.log "ObjectPoolFactory: get: creating a fresh instance object.."
      @objectFactory obj, opts


      #console.log "ObjectPoolFactory: get: unshifting.."
      @objects.unshift obj
      obj
    cb objects
    undefined


  ###
  Free an object, making it available for re-use
  Note: this could be async
  ###
  free: (obj) ->
    #console.log "ObjectPoolFactory: free: asked to free ", obj

    # TODO maybe remove this check: that is a develop bug
    if typeof obj is 'undefined'
      throw "NullPointerException: ObjectPoolFactory: free: you tried to free an undefined reference"

    if obj.isFree
      #console.log "ObjectPoolFactory: free: object is already free"
      return

    #console.log "ObjectPoolFactory: free: asked to free object"

    # remove the object
    index = @objects.indexOf obj
    @objects.splice index, 1

    @objectDestroyer obj

    # note that we do not remove the object from the scene, so we do not have
    # to update the scene tree!

    # maybe here, we should do some garbage collection
    #console.log "ObjectPoolFactory: free: recycling object"


    # actual recycling
    obj.mesh.visible = no
    obj.isFree = yes

    #note: there might still be some garbage attached to the object, such as
    # private properties, but that's okay, because they are common to all
    # object of the pool
    #delete obj.mesh.tween

    @objects.push obj


    obj


###
Instead of a message/promise queue, we use an issue/proposal pool
An issue pool differs from a message queue:
- the pool has no particular sort dimension, it can use time, or priority etc..
- thus the pool could be split into chunks for parallel processing
- an issue is not just a message, it expect one or more Proposal
- it can accept one or many proposal
- it can reject one or many proposals

###
class window.Market
  constructor: ->

    @issuesByTimestamp = []
    @issuesByReward = []

    @issuesByProduct = {} # indexed by key (topics)

    @dealersByProduct = []

    @totalIssues = 0


  ###
  low-level method
  ###
  lookToBuy: (userSubmittedIssue) ->
    console.log "Market.submit:", userSubmittedIssue
    issue =
      timestamp: + new Date()
      timeout: Math.abs userSubmittedIssue.timeout
      expired: no

      options: Object.freeze userSubmittedIssue.options
      product: ""+userSubmittedIssue.product
      submitOfferCallback: userSubmittedIssue.callback

    @issuesByTimestamp.push issue

    @issuesByProduct[issue.product] ?= []
    @issuesByProduct[issue.product].push issue

    @issuesByReward.push issue
    @issuesByReward.sort (a, b) -> a.price - b.price

    @totalIssues = @totalIssues + 1
    console.log "Market.submit: totalIssues: ", @totalIssues
    @


  ###
  delete an issue
  ###
  delete: (issue) =>
    issue.expired = yes
    @

  # used by issue solvers (proposal emitters)
  lookToSell: (req) ->
    console.log "Market.advertise:", req
    @dealersByProduct[req.product] ?= []
    @dealersByProduct[req.product].push req.callback
    @

  ###
  called at each frame cycle
  ###
  update: ->
    console.log "Market.update:"
    # TODO simplify the code by only iterating over


    console.log "Market.update: iterating over issues.."
    currentTimestamp = + new Date()

    for product, issues of @issuesByProduct
      for dealer in @dealersByProduct[product]

        for issue in issues
          if issue.timeout < (currentTimestamp - issue.timestamp)
            issue.expired = yes
            @totalIssues = @totalIssues - 1

          continue if issue.expired

          console.log "Market.update: - dealing with issue", issue

          # detach the heavy work
          do (product, dealer, issue) -> after 0, ->
            dealer issue.content, (salesQuote, buyFunction) ->
              if !salesQuote? or buyFunction?
                throw "Market.update:    - dealer replied with nothing! it's an error in the dealer's code.."

              console.log "Market.update:    - dealer in category #{product} has a salesQuote and a buyFunction!"

              # now we submit the offer to the buyer
              issue.submitOfferCallback salesQuote, buyFunction, ->
                console.log "Market.update:    - abandonning future buying order.."
                issue.expired = yes
                undefined

    @cleanExpiredIssues()

  cleanExpiredIssues: (onComplete) ->
    console.log "Market.cleanExpiredIssues:"

    # deleting in all the indexes is a bit expensive..
    # fortunately in call all be done in async, and even split into 3 steps,
    # all because it is really just garbage-cleaning

    newArray = for issue in @issuesByTimestamp
      if issue.expired
        continue
      else
        issue
    @issuesByTimestamp = newArray

    for product, issues of @issuesByProduct
      newArray = for issue in issues
        if issue.expired
          continue
        else
          issue
      @issuesByProduct[product] = newArray

    newArray = for issue in @issuesByReward
      if issue.expired
        continue
      else
        issue
    @issuesByReward = newArray

    console.log "Market.cleanExpiredIssues: new number of isses: #{@totalIssues}"
    @
