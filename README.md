# gunfire

## Install

    $ npm install gunfire -g

## Usage

Go to your fork of Autogica's git repository (atgc.git),
then run:

    $ gunfire

## Developers

    $ npm install
    $ bower install
    $ gulp
    $ npm link

## Structure of a module

### client.js (or client.coffee)

#### .test()

Each module should implements its own test function.

Basically, a test should do things based on some default settings.

For instance, a test function for a "build robot part" module should
draw a part at the current's player position, 
using some default, dummy or random settings.


### server.js (or server.coffee)
