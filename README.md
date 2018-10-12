# Leaflet.GeographPhotos
Plots Geograph Photos on a Leaflet Map!

Extends the most excellent (and very tiny!) Leaflet.Photo plugin,
http://blog.mastermaps.com/2014/08/showing-geotagged-photos-on-leaflet-map.html
 but intergrates calling the Geograph API to load photos. Including dynamically loading more as zoom the map. 

Please contact Geograph before using, you also need a API key
https://www.geograph.org.uk/help/api

At the moment, hard coded to work with Geograph Britain and Ireland, with minor adaptations should be able to work with other projects. 


Note: This plugin is heavily inspired by the demos from Leaflet.Photo, and as such uses its image popup styling. 
as such have moved the leaflet-popup-photo CSS class from Leaflet.Photo/examples/css/map.css, to Leaflet.Photo/Leaflet.Photo.css, 
so this project can just import one .css file

## Demo
https://www.geograph.org/leaflet/GeographPhotos-example.html


## Prerequisites:
*   https://github.com/Leaflet/Leaflet/    (obviouslly!)
*   https://github.com/turban/Leaflet.Photo/    (a copy is bunded)
*   https://github.com/ded/reqwest/              (the copy that Leaflet.Photo used is bunded) 
*   https://github.com/Leaflet/Leaflet.markercluster/   (copy loaded from CDN in example) 

## Optional: (can also display a layer of dots highlighting where photos are located)
*   https://github.com/domoritz/leaflet-maskcanvas/
*      uses reworked copy of https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree

## Clearly inspired by and draws ideas from:
*   https://github.com/bill-chadwick/Leaflet.MetricGrid/
*   https://github.com/MatthewBarker/leaflet-wikipedia/
*   https://github.com/turban/Leaflet.Photo/

## See Also 
*   https://leafletjs.com/examples/quick-start/
*   https://github.com/bill-chadwick/Leaflet.MetricGrid/    (Display a dynamic OSGB and Irish Grid on map) 
*   https://github.com/barryhunter/Leaflet.GeographCoverage/    (Displays a coverage aggrigated by squares)


## Options

* **apiKey**: Get your own API key! https://www.geograph.org.uk/admin/apikey.php
* **endPoint**: The Geograph API endpoint to use, shouldnt need changing
* **fieldSelect**: The values to pull from API, shouldnt need to change, unless make a more elaborate popupl and want more detail
* **initialLimit**: default 500. How many photos to load initially. All will show as dots, but due to clustering, usually many less thumbnails show
* **refreshLimit**: default 100. How many photos to load each time zoom/move the map


* **showPhotoLayer**: default true, but can disable the Photo layer (but will stil need to load Leaflet.Photo even though its 'unused'
* **showDotsLayer**: default false. can enable to show a preview of dots coverage. leaflet-maskcanvas is only needed if enabled
* **autoZoomOnAdd**: default false. should the map be zoomed to extent of photos when first loaded (or query is changed) 

* **searchQuery**: Full-text query to filter imagses. Same syntax as https://www.geograph.org.uk/article/Keyword-Searching-in-the-Browser
* **userID**: Can optionally filter by a Geograph User/Contributor ID.  

as extends BOTH Leaflet.Photo and Leaflet.markercluster, most options from those plugins can be used too. For example: 

* **showCoverageOnHover**: default true. When you mouse over a cluster it shows the bounds of its markers.

NOTE: PLEASE don't make maxClusterRadius less than 60, as loads lots of thumbnails!

