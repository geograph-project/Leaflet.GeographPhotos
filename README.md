# Leaflet.GeographPhotos
Plots Geograph Photos on a Leaflet Map!

Extends the most excellent (and very tiny!) Leaflet.Photo plugin,
http://blog.mastermaps.com/2014/08/showing-geotagged-photos-on-leaflet-map.html
 but intergrates calling the Geograph API to load photos. Including dynamically loading more as zoom the map. 

Please contact Geograph before using, you also need a API key
https://www.geograph.org.uk/help/api

* works with Geograph Britain, Ireland, Germany and Channel Islands. Specify which project with a single option. 
https://www.geograph.org.uk/ , http://geo-en.hlipp.de/ , http://www.geograph.org.gg/

Note: This plugin is heavily inspired by the demos from Leaflet.Photo, and as such uses its image popup styling. 
as such have moved the leaflet-popup-photo CSS class from Leaflet.Photo/examples/css/map.css, to Leaflet.Photo/Leaflet.Photo.css, 
so this project can just import one .css file


## Demo
https://www.geograph.org/leaflet/Leaflet.GeographPhotos/GeographPhotos-example.html


## Prerequisites:
*   https://github.com/Leaflet/Leaflet/    (obviouslly!)
*   https://github.com/turban/Leaflet.Photo/    (a copy is bunded - fixing issues to work in leaflet v1+)
*   https://github.com/ded/reqwest/              (the copy that Leaflet.Photo used is bunded) 
*   https://github.com/Leaflet/Leaflet.markercluster/   (copy loaded from CDN in example) 

## Optional: (can also display a layer of dots highlighting where photos are located)
*   https://github.com/domoritz/leaflet-maskcanvas/  (a copy is bunded - fixing issues to work in leaflet v1+)
*   https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree (a slightly tweaked version is bundled)

## Clearly inspired by and draws ideas from:
*   https://github.com/bill-chadwick/Leaflet.MetricGrid/
*   https://github.com/MatthewBarker/leaflet-wikipedia/
*   https://github.com/turban/Leaflet.Photo/

## See Also 
*   https://leafletjs.com/examples/quick-start/
*   https://github.com/bill-chadwick/Leaflet.MetricGrid/    (Display a dynamic OSGB and Irish Grid on map) 
*   https://github.com/barryhunter/Leaflet.GeographCoverage/    (Displays coverage aggrigated by squares)
*   https://github.com/barryhunter/Leaflet.GeographClickLayer/    (Displays thumbnails when click on the map instead)


## Options

* **api_key**: Get your own API key! https://www.geograph.org.uk/admin/apikey.php

* **project**: which Geograph Project to load. Defaults to 'britire', can also use 'germany' or 'islands' (for Channel Islands!) 

* **query**: Full-text query to filter images. A raw text query in SphinxSearch 'Extended Syntax' format. http://sphinxsearch.com/docs/current.html#extended-syntax . But see also https://www.geograph.org.uk/article/Keyword-Searching-in-the-Browser for a list/names of Fields that supported in the index. (but need to still use Sphinxes field syntax, eg `@myriad SH50` or `@tags river`)
* **user_id**: Can optionally filter by a Geograph User/Contributor ID.  
* **geo**: do a geographically centered search on a specific lat/long, format 'lat,long,distance', eg `52.950583,-3.936389,2000`

* **showPhotoLayer**: default true, but can disable the Photo layer (but will stil need to load Leaflet.Photo even though its 'unused'
* **showDotsLayer**: default false. can enable to show a preview of dots coverage. leaflet-maskcanvas is only needed if enabled
* **autoZoomOnAdd**: default false. should the map be zoomed to extent of photos when first loaded (or query is changed) 
* **autoLoadOnMove**: default true. normally will load more images as pan/zoom the map. but in particular might want to disable this if loading all images on initial load (eg when using 'geo')

as extends BOTH Leaflet.Photo and Leaflet.markercluster, most options from those plugins can be used too. For example: 

* **showCoverageOnHover**: default true. When you mouse over a cluster it shows the bounds of its markers.

NOTE: PLEASE don't make maxClusterRadius less than about 60, as it can load lots of thumbnails!


## Use


CSS: 

        <link href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/leaflet.css" rel="stylesheet" type="text/css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="Leaflet.Photo/Leaflet.Photo.css" />

JS (best loaded AFTER leaflet core):

        <script src="Leaflet.Photo/examples/lib/reqwest.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/leaflet-src.js"></script>
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
        <script src="Leaflet.Photo/Leaflet.Photo.js"></script>
        <script src="Leaflet.GeographPhotos.js"></script>

And add it to map... 

        var gph = L.geographPhotos({api_key:'enter-your-key-here', autoZoomOnAdd: true, query:'canal'}).addTo(map);


See the example html for fuller example, as well as loading for other projects
