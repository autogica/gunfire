util = require 'util'

exports.pretty = pretty = (obj) -> "#{util.inspect obj, no, 20, yes}"

exports.distance = distance = (p1, p2) ->
  Math.sqrt Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)

String::endsWith = (s) ->
  @length >= s.length and @substr(@length - s.length) is s
