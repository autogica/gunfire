# http://www.html5rocks.com/en/tutorials/webaudio/positional_audio/

# Detect if the audio context is supported.
window.AudioContext = (window.AudioContext || window.webkitAudioContext || null)

TWEEN = require 'tween.js'


class Sound
  constructor: (@audio, opts) ->

    console.log "creating new sound"

    @source = @audio.ctx.createBufferSource()
    @volume = @audio.ctx.createGain()


    # Connect the sound source to the volume control.
    @source.connect @volume

    if opts.loop
      # Make the sound source loop.
       @source.loop = yes

    if opts.channel is 'master'
      # Hook up the sound volume control to the main volume.
      @volume.connect @audio.volume

    if opts.source? and opts.source != ""
      @load opts.source


  load: (source, onError) ->
    # Load a sound file using an ArrayBuffer XMLHttpRequest.
    console.log """loading sound source: "#{source}" """
    request = new XMLHttpRequest()
    request.open "GET", source, yes
    request.responseType = "arraybuffer"
    request.onload = (e) =>

      # Create a buffer from the response ArrayBuffer.

      buffer = @audio.ctx.createBuffer this.response, false
      @sound.buffer = buffer

      # Make the sound source use the buffer and start playing it.
      @source.buffer = @sound.buffer
      @source.start @audio.ctx.currentTime

    request.send()


class Audio
  constructor: (@app) ->

    unless AudioContext?
      throw new Error "AudioContext not supported!"

    # Create a new audio context.
    @ctx = new AudioContext()

    # Create a AudioGainNode to control the main volume.
    @volume = @ctx.createGain()

    # Connect the main volume node to the context destination.
    @volume.connect @.ctx.destination

    # factory
    @sound = (opts) => new Sound @, opts

exports.Audio = Audio
exports.Sound = Sound
