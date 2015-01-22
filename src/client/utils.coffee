

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
