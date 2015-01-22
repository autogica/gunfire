(function() {
  var distance, pretty, util;

  util = require('util');

  exports.pretty = pretty = function(obj) {
    return "" + (util.inspect(obj, false, 20, true));
  };

  exports.distance = distance = function(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
  };

  String.prototype.endsWith = function(s) {
    return this.length >= s.length && this.substr(this.length - s.length) === s;
  };

}).call(this);
