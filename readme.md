#SSLSTripWire
SSL Strip Wire is an attempt to create a browser extension to help augment
the fact that we are human when it comes to noticing encryption security
on websites. The objective is to create a plugin that will recognize when
something out of the ordinary is occuring with regards to encryption on
websites you have visited in the past in an attempt to prevent SSL Strip 
attacks.

<b>Under development (11/17/2010)</b>

## Screenshots
![Sample Popup Info](https://github.com/ameerkat/SSLSTripWire/raw/master/images/readme-popup-demo.jpg)

## TODO
* Success <i>and</i> error callback parameters to all functions
* Classifier for access patterns
* Add some documentation
* Improved heuristics
* Site whitelist to always rewrite
* Remember tab icon state
* Address the concurrency issues with db (leading to duplicates)
* Redo access pattern graphs to just be color blocks
* Ignore any 404d requests in counter
