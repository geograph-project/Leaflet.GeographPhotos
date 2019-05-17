/**
 * GeoGraph geographic photo archive project
 * This file copyright (C) 2018  Barry Hunter (geo@barryhunter.co.uk)
 *

The MIT License (MIT)

Copyright (c) 2018  Barry Hunter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

 */

/* Plots Geograph Photos on a Leaflet Map!
*
* Prerequisites:
*   https://github.com/ded/reqwest
*   https://github.com/turban/Leaflet.Photo/
*      https://github.com/Leaflet/Leaflet.markercluster/
*   https://github.com/domoritz/leaflet-maskcanvas/
*      uses reworked copy of https://github.com/jsmarkus/ExamplesByMesh/tree/master/JavaScript/QuadTree 
**/  


if (L.MarkerClusterGroup && L.Photo.Cluster) {

	L.GeographPhotos = L.Photo.Cluster.extend({
		options: {
			//MarkerClusterGroup options, NOTE: PLEASE dont make maxClusterRadius than 60 as loads lots of thumbnails!
			maxClusterRadius:80, showCoverageOnHover: true, spiderfyDistanceMultiplier: 2,

			project: 'britire',  //britire/germany/islands
			//Note: can narrow the bounds, but please dont make wider, we dont have photos outside these bounds!
        	        bi_bounds: L.latLngBounds([49.863788, -13.688451], [60.860395, 1.795260]),
                	ci_bounds: L.latLngBounds([49.150211,-2.702359], [49.731385,  -2.005734]),
	                de_bounds: L.latLngBounds([47.170071,5.766899], [55.138900, 15.120222]),

			//geographPhotos options, shouldnt need to change these, except the api_key
			api_key: 'geograph_demo', //get your own key: https://www.geograph.org.uk/admin/apikey.php
			endpoint: 'https://api.geograph.org.uk/api-facetql.php',
			select: "id,realname,wgs84_lat+as+lat,wgs84_long+as+lng,hash,title", //shouldnt need changing!

			showPhotoLayer: true, //can turn off the images, but that would be unusual!
			showDotsLayer: false, //if turn this on, need to load leaflet-maskcanvas first
			autoZoomOnAdd: false,

			//can filter the layer
			query: '',
			user_id: null, //todo, not implemented yet!

			//general. Note: can narrow the bounds, but please dont make wider, we dont have photos outside these bounds!
			bounds: L.latLngBounds(L.latLng(49.863788, -13.688451), L.latLng(60.860395, 1.795260)), 
			minZoom: 4, maxZoom: 21
		},

		initialize: function (options) {
			L.setOptions(this, options);
			L.Photo.Cluster.prototype.initialize.call(this);

			if (this.options.showDotsLayer && L.TileLayer.maskCanvas) {
				this._masklayer = L.TileLayer.maskCanvas({noMask:true, radius: 2, useAbsoluteRadius: false });
				this._layerData = new Array();
			}

			//simple associative array to avoid adding the same thumbnail to photo data
			/// ... note we just keep adding data to photoLayer as zoom, we dont remove the out of view data (no point!) 
			this._done = new Array();

			if (!this.options.showPhotoLayer)
				this.options.select = "wgs84_lat+as+lat,wgs84_long+as+lng";

			this.on('click', function (evt) {
		                var photo = evt.layer.photo,
		                        template = '<a href="{link}" target=newwin><img src="{url}"/></a><p>{caption}</p>';

		                evt.layer.bindPopup(L.Util.template(template, photo), {
		                        className: 'leaflet-popup-photo',
		                        minWidth: 300
		                }).openPopup();
		        });

			this._request = null; //the currently running reqwest

			//is the a fetch in progress?
			this._running = false;

			//these are for zoomin optimization (if prev zoom had all markers then no need to load them again for zooming in)
			this._prevZoom = -1;
			this._shownall = false;
			this._sentBounds = '';
			this._prevPoint = null;
			this._totalImages = null;
		},

	///////////////////////////////////////////////

	        onAdd: function (map) {
                    L.Photo.Cluster.prototype.onAdd.call(this,map);
	            this._map = map;

			if (this.options.project == 'islands') {
				this.options.domain = "http://www.geograph.org.gg"
				this.options.bounds = this.options.ci_bounds;
				this.options.extra = "&is=1";
			}
			if (this.options.project == 'germany') {
				this.options.domain = "https://geo-en.hlipp.de"
				this.options.bounds = this.options.de_bounds;
				this.options.extra = "&gg=1";
			}
			if (this.options.project == 'britire') {
				this.options.domain = "https://www.geograph.org.uk"
				this.options.bounds = this.options.bi_bounds;
				this.options.extra = "";
			}

		    if (this._totalImages) { //there are images to show (initialRequest already called)
			map.on('moveend', this.requestData, this);
	                this.requestData();
		    } else if (!this._initialDone) { //just in case it was called, but found no results
  	                this.initialRequest(); //will add moveend if needed!

			//we already zoomed in, then should make a detailed request too
			if (!this.options.autoZoomOnAdd && map.getZoom() > 8) {
				var that = this;
				setTimeout(function () { that.requestData.call(that); } , 600);
			}
                    }

		    if (this._masklayer)
			map.addLayer(this._masklayer);
	        },

	        /**
	            Remove the 'moveend' event listener and clear all the markers.
        	    @private
	        */
	        onRemove: function (map) {
                    L.Photo.Cluster.prototype.onRemove.call(this,map);

	            map.off('moveend', this.requestData, this);
	            this.clear();
		    this._done = new Array(); //need to clear these so the layer will work if/when re-added
		    this._shownall = false;
   		    this._prevPoint = null;
 
                    if (this._masklayer) {
                        this._layerData = new Array();
			this._masklayer.setData(this._layerData);
			map.removeLayer(this._masklayer);
                    }

		    this.outputStatus('');
	        },


	        /**
	            Redraws the data, clear current state, and starts a fresh initial request
	            @public
	        */
       		Reset: function () {
			this.clear();
                        this._done = new Array(); //need to clear these so the layer will work if/when re-added
                        this._shownall = false;
                        this._prevPoint = null;

                        if (this._masklayer) {
                            this._layerData = new Array();
                            this._masklayer.setData(this._layerData);
                        }

	                this.initialRequest();

                        //we already zoomed in, then should make a detailed request too
                        if (!this.options.autoZoomOnAdd && this._map.getZoom() > 8) {
                                var that = this;
                                setTimeout(function () { that.requestData.call(that); } , 600);
                        }
	        },


		outputStatus: function (text) {
			if (document.getElementById('message')) //todo make this optional!
				document.getElementById('message').innerHTML = text;
		},

	///////////////////////////////////////////////

		initialRequest: function() {

			//make the initial request, that calls fitBounds to zoom map to extent of query results. The 'order=sequence' is magic in that results should be relatively evenly distributed over the whole map
			query = encodeURIComponent(this.options.query+(this.options.user_id?' @user user'+this.options.user_id:''));

			var that = this; //enclosure!
			this._request = reqwest({
				url: this.options.endpoint+'?match='+query+'&select='+this.options.select+'&order=sequence+asc&limit=1000&callback=bar&key='+this.options.api_key+this.options.extra,
				type: 'jsonp',
				jsonpCallbackName: 'bar', //we use a specific callback name, so it has consistent name, and hence the server can cache this API call. 
				success: function (data) {
					if (!data.rows || data.meta.total ==0) {
						alert("no results found");
						return;
					}

					that.outputStatus("Loading "+data.rows.length+" images");

					//add results to the map
					that.addRows(data.rows);

					if (that.options.autoZoomOnAdd && that._map.hasLayer(that))
						that._map.fitBounds(that.getBounds());

					if (data.meta.total_found > data.rows.length) {
						var message = data.rows.length+' of '+data.meta.total_found+' images';
						that._totalImages = data.meta.total_found;

						//there are more results than displayed, so update the map when zoom
						that._map.on('moveend', that.requestData, that);
					} else {
						var message = data.meta.total_found+' images';

						//we've displayed all matching images, so dont need to update fetch more results when zoom
					}

					that.outputStatus("Loaded "+message);
					this._initialDone = true;
				}
			});
		},

	///////////////////////////////////////////////

	        /**
	            Send a query request for JSONP data.
	            @private
	        */
	        requestData: function () {
			var map = this._map;

	                //if ((!this._masklayer || !map.hasLayer(this._masklayer)) && !map.hasLayer(this)) //shouldn't happen, but just in case!
        	        //        return;

			if (!map.getBounds().intersects(this.options.bounds))
				return;

			var center = map.getCenter();
			var point1 = map.getPixelOrigin();
			if (this._prevPoint && map.getZoom() == this._prevZoom) {
				if (Math.abs(point1.x-this._prevPoint.x) <10 && Math.abs(point1.y-this._prevPoint.y) <10) {
					return false;
				}
			}
			this._prevPoint = point1;

			if (this._running) {
				if (this._request) this._request.abort();
				this._running = false;
			}

			if (this._shownall == false || map.getZoom() <= this._prevZoom) {
				var bounds = map.getBounds();
				var zoom = map.getZoom();
				this._sentBounds = bounds.toBBoxString();

				this.outputStatus("Making request...")
				this._running = true;

				var query = encodeURIComponent(this.options.query+(this.options.user_id?' @user user'+this.options.user_id:''));
				var that = this; //enclosure!
				this._request =  reqwest({
	                		url: this.options.endpoint+'?match='+query+'&olbounds='+this._sentBounds+'&select='+this.options.select+'&order=rand()&limit=500&callback=?&key='+this.options.api_key+this.options.extra,
			                type: 'jsonp',
			                success: function (data) {
						that._running = false;
		        	                if (!data.rows || data.meta.total ==0) {
		                          	      return;
			                        }
						that.outputStatus("Loading "+data.rows.length+" images");

						//add the results to map
			                        that.addRows(data.rows);

			                        if (data.meta.total_found > data.rows.length) {
							that.outputStatus("Loaded "+data.rows.length+" of "+data.meta.total_found+" images in current view");
							that._shownall = false;
			                        } else {
							that.outputStatus("Loaded all "+data.rows.length+" images in current view");
							that._shownall = true;
			                        }
	               		 	}
			        });
			}
			this._prevZoom = map.getZoom();
		},

	///////////////////////////////////////////////

 		addRows: function(rows) {
			var newRows = new Array();

		        for(q=0;q<rows.length;q++) {
				if (!this._done[rows[q].id]) {
					//add the thumbnail to the clusterer data
                		        row = rows[q];
		                        row.link = this.options.domain+"photo/"+row.id; //todo make this use an option!
                		        row.thumbnail = this.getGeographUrl(row.id, row.hash, 'small');
		                        row.url = this.getGeographUrl(row.id, row.hash, 'full');
                		        row.caption = row.title+' by '+row.realname;
		                        row.lat = this.rad2deg(row.lat);
		                        row.lng = this.rad2deg(row.lng);
					newRows.push(row);
					this._done[row.id] = 1;

					//just add the location to the dots layer
					if (this._masklayer)
						this._layerData.push([row.lat,row.lng]);
				}
		        }

			//add the new photos
			if (this.options.showPhotoLayer) //we are the photo layer, so it can't be not added
			        this.add(newRows);

			//update the dots layer
			if (this._masklayer) {
				this._masklayer.setData(this._layerData);
			}
		},

	///////////////////////////////////////////////

		rad2deg: function(angle) {
		    // Converts the radian number to the equivalent number in degrees  
		    // 
		    // version: 1109.2015
		    // discuss at: http://phpjs.org/functions/rad2deg
		    // +   original by: Enrique Gonzalez
		    // +      improved by: Brett Zamir (http://brett-zamir.me)
		    // *     example 1: rad2deg(3.141592653589793);
		    // *     returns 1: 180
		    return angle * 57.29577951308232; // angle / Math.PI * 180
		},

		getGeographUrl: function(gridimage_id, hash, size) { 

			yz=this.zeroFill(Math.floor(gridimage_id/1000000),2); 
			ab=this.zeroFill(Math.floor((gridimage_id%1000000)/10000),2); 
			cd=this.zeroFill(Math.floor((gridimage_id%10000)/100),2);
			abcdef=this.zeroFill(gridimage_id,6); 

			if (yz == '00') {
				fullpath="/photos/"+ab+"/"+cd+"/"+abcdef+"_"+hash; 
			} else {
				fullpath="/geophotos/"+yz+"/"+ab+"/"+cd+"/"+abcdef+"_"+hash; 
			}
			if (this.options.domain.indexOf('.org.uk') > -1) {
				switch(size) {
					case 'full': return "https://s0.geograph.org.uk"+fullpath+".jpg"; break;
					case 'med': return "https://s"+(gridimage_id%4)+".geograph.org.uk"+fullpath+"_213x160.jpg"; break;
					case 'small':
					default: return "https://s"+(gridimage_id%4)+".geograph.org.uk"+fullpath+"_120x120.jpg";
				}
			} else {
				switch(size) {
					case 'full': return this.options.domain+fullpath+".jpg"; break;
					case 'med': return this.options.domain+fullpath+"_213x160.jpg"; break;
					case 'small':
					default: return this.options.domain+fullpath+"_120x120.jpg";
				}
			}
	
		},

		zeroFill: function(number, width) {
			width -= number.toString().length;
			if (width > 0) {
				return new Array(width + (/\./.test(number)?2:1)).join('0') + number;
			}
			return number + "";
		}

	});

	L.geographPhotos = function (options) {
		return new L.GeographPhotos(options);	
	};

}
