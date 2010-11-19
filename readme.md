#SSLSTripWire
SSL Strip Wire is an attempt to create a browser extension to help augment
the fact that we are human when it comes to noticing encryption security
on websites. The objective is to create a plugin that will recognize when
something out of the ordinary is occuring with regards to encryption on
websites you have visited in the past in an attempt to prevent SSL Strip 
attacks.

<b>Under development (11/19/2010)</b>

## Screenshots
![Sample Popup Info](https://github.com/ameerkat/SSLSTripWire/raw/master/images/readme-popup-demo.jpg)

## TODO
* <b>Ignore any 404d or errored requests in counter</b>
* <b>Add some documentation</b>
* <b>Site whitelist to always rewrite</b>
* Success <i>and</i> error callback parameters to all functions
* Classifier for access patterns
* Improved heuristics
* Remember tab icon state
* Address the concurrency issues with db (leading to duplicates)
* Redo access pattern graphs to just be color blocks
