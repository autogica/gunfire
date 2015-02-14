var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var pagespeed = require('psi');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var cmq = require('gulp-combine-media-queries');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
//var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var coffee = require('gulp-coffee');
var concatsourcemap = require('gulp-concat-sourcemap');

gulp.task('build-server', function() {
  gulp.src('src/server/*.coffee')
    .pipe(coffee({bare: false}).on('error', gutil.log))
    .pipe(gulp.dest('lib/server'))
});

gulp.task('build-dependencies', function(){
    gulp.src([
      // we use the primus.js file generated by primus.node
      'lib/client/primus.js',
      // otherwise we would need to include all plugins ourselves
      //'bower_components/primus/primus.js'
      'bower_components/coffee-script/extras/coffee-script.js',
      'bower_components/threejs/build/three.min.js',

      'lib/client/threejs/PRNG.js',
      'lib/client/threejs/ImprovedNoise.js',
      'lib/client/threejs/Detector.js',
      'lib/client/threejs/Octree.js',
      'lib/client/threejs/TypedArrayUtils.js',
      'lib/client/threejs/Projector.js',
      'lib/client/threejs/SceneUtils.js',
      'lib/client/threejs/ParametricGeometries.js',

    // marching cubes tables and CSG library
      'lib/client/marching/MarchingCubesData.js',
      'lib/client/csg/ThreeCSG.js',


      // shaders (mirror must be loaded before water)
      'lib/client/shaders/Mirror.js',
      'lib/client/shaders/WaterShader.js',
      'lib/client/shaders/SkyShader.js',
      'lib/client/shaders/FresnelShader.js',


      // default camera controls -->
      'lib/client/controls/GodControls.js',

      // controls should be provided by assets (maybe physics and tweets too?)
      'lib/client/controls/WalkControls.js',
      'lib/client/controls/DriveControls.js',
      'lib/client/controls/JetControls.js',
      'lib/client/controls/HoverControls.js',
      'lib/client/controls/SatControls.js',

      // for now all the music comes from Soundcloud streaming servers
      'lib/client/audio/soundcloud.js',

      'bower_components/Oimo.js/build/Oimo.min.js',
      'bower_components/threex.oimo/threex.oimo.js',
      // browserified: 'bower_components/tweejs/Tween.js',
      'bower_components/stats.js/build/stats.min.js',
      'bower_components/operative/dist/operative.js',
      //'bower_components/dat-gui/build/dat.gui.js',
      'bower_components/ect/lib/ect.js',
      //'bower_components/Keypress/keypress-2.1.0.min.js',
      'bower_components/wagner/Wagner.js',
      'bower_components/odometer/odometer.js',
      'bower_components/howler.js/howler.min.js',

      // mousetrap is managed by npm
      'bower_components/mousetrap/mousetrap.min.js'

     ])
      .pipe(concat('vendor.js'))
      //.pipe(uglify())
      .pipe(gulp.dest('lib/client'));
});

gulp.task('build-client', function() {
  gulp.src('src/client/app.coffee', { read: false })
    .pipe(browserify({
      transform: ['coffeeify'],
      extensions: ['.coffee']
    }))
    .pipe(rename('gunfire.js'))
    .pipe(gulp.dest('lib/client'))
});

// TODO maybe we could concatenate everything:
//  .pipe(concat('all.js'))

gulp.task('default', [], function () {
    gulp.start(['build-server', 'build-dependencies', 'build-client']);
});
