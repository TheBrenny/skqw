### v1.0.0-beta.3 (in progress)

#### Features
* Add remote control
* Update to Electron 1.6.7
* Update to Angular 4 & Angular Material 2.0.0-beta.3
* [Windows] Use the nsis installer rather than Squirrel (Setup exe about 20MB smaller)
* Display Three.js version in UI
* Persist param settings when reloading a visualization

#### Fixes
* Fixed closed app process persisting in background


### v1.0.0-beta.2 (2017-01-30)
#### Features
* Breaking API change: the skqw onject is no longer passed to lifecycle methods. Use `require('skqw-core')` instead
* Only load scripts on demand, rather than keeping whole library in memory
* Error messages in console when visualizations fail to load
* Automatic updating of parameters when no callback exported
* Bundle `skqw-utils` module, currently featuring an exponential smoothing implementation and crappy beat detector
* Bundle a set of default visualizations with the app
* Updated UI

### v1.0.0-beta.1 (2016-10-10)
#### Features
* OSX build now available thanks to Travis CI.
* Configurable sample rate
* Styling improvements

#### Fixes
* Gain setting is correctly persisted
* Prevent resize immediately after init call

### v1.0.0-alpha.3 (2016-08-18)
#### Features
* Improvements to default visualization
* Update Electron version to 1.3.2

#### Fixes
* Coerce param value into correct type before passing to pparamChange()
* Add try/catch around external file operations.

### v1.0.0-alpha.2 (2016-07-31)

#### Features
* Pass the skqw object to paramChange function as first argument.

#### Fixes
* Fix devtools opening when using full-screen shortcut.
* Disable text selection in settings menu.
* Fix canvas positioning to allow laying multiple canvases.
* Add try/catch blocks around lifecycle calls.


### v1.0.0-alpha.1 (2016-07-25)

First pre-release!