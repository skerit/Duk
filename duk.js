/*
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

	Author: Jelle De Loecker
	Version: Trunk
	Created on: 2011/01/08 20:34
	Last Modified: Trunk
*/

function cut(str, cutStart, cutEnd){
  return str.substr(0,cutStart) + str.substr(cutEnd+1);
}

/**
 * @namespace Holds the Duk functions and classes
 */
var Duk = {};

/**
 * Create an alias for Penseel
 */
var p = Penseel;

/**
 * Create an alias for now
 */
function now(){	return p.now(); }

/**
 * 
 * @classDescription	The duk
 * @param   {string}    canvasId    The ID of the canvas to use
 * @param   {string}    url         The url of the blueprint JSON to download
 * @param   {string}    callback    The function to initialize when we downloaded everything
 * @return	{Duk.Manager}			Returns the new Manager object 
 */
Duk.Manager = function(canvasId, url, callback){

	/**
	 * A reference for subclasses
	 */
	this.me = this;
	
	/** @deprecated */
	var that = this;

	/**
	 * The canvaselement. Must be passed for blur() usage
	 * @type {Object}
	 */
	this.canvas = document.getElementById(canvasId);
	
	/**
	 * Retrieve the canvas drawing functions
	 * @type {Object}
	 */
	this.ctx = this.canvas.getContext('2d');

	// Store the image to use here
	this.images = {};
	this.blueprint = {};

	var toLoad = 0;
	var loaded = 0;
	this.loaded = false;

	// Mouse settings
	this.mouse = {};
	this.mouse.x = 0;               // Where is the cursor now?
	this.mouse.y = 0;               // Where is the cursor now?
	this.mouse.down = false;        // Is the mouse pressed down?
	this.mouse.downx = 0;           // Where was the mouse pressed down?
	this.mouse.downy = 0;           // Where was the mouse pressed down?
	this.mouse.upx = 0;             // Where was the mouse last released?
	this.mouse.upy = 0;             // Where was the mouse last released?
	this.mouse.dialogDown = false;  // The dialog window we have under our cursor when pressing down
	this.mouse.dialogUp = false;    // The dialog window we have under our cursor when releasing the mouse button
	this.mouse.underType;           // What is beneath the mouse now?
	this.mouse.focus = false;       // What has focus right now?
	
	this.mouse.overexitDialog = {};
	this.mouse.overDialog = {};
	
	this.mouse.focusexitDialog = {};
	this.mouse.focusDialog = {};
	this.focusWidget = {};
	this.focusexitWidget = {};

	// Open dialogs
	var openDialogs = [];
	this.roots = openDialogs;
	var openMap = [];
	this.openMap = [];
	var dirtyMap = true;
	this.dirtyMap = true;

	/**
	 * Rebuild the openMap, a map for every pixel of the canvas where references
	 * are made to the dialog underneath them.
	 * This is only rebuilt AFTER a dialog has been dropped, not while moving.
	 * A dialog also has a rebuildMap function for its underlying widget, but
	 * that should only be run once: at creation.
	 */
	this.rebuildMap = function(){
		openMap = [];
		
		for(var i = 0; i < this.roots.length; i++){
			x = openDialogs[i].dimensions.ax;
			y = openDialogs[i].dimensions.ay;
			width = openDialogs[i].dimensions.width;
			height = openDialogs[i].dimensions.height;
			maxwidth = x+width;
			maxheight = y+height;

			for(var ty = y; ty <= maxheight; ty++){
				for(var tx = x; tx <= maxwidth; tx++){					
					if(tx > 0 && ty > 0){
						if(openMap[(ty * that.dimensions.width) + tx] === undefined){
							openMap[(ty * that.dimensions.width) + tx] = [];
						}
						openMap[(ty * that.dimensions.width) + tx].push(openDialogs[i]);
					}
				}
			}
		}
		
		dirtyMap = false
	}
	
	/**
	* The manager's instructions set
	* @type {Duk.Instructions}
	*/
   this.dimensions = {};

	/**
	 *  Load the JSON blueprint
	 */
	this.getBlueprint = function(url, callback){
		$.getJSON(url, function(data) {
			that.blueprint = data;

			toLoad = that.blueprint.images.length;

			p.echo('Need to download ' + toLoad + ' images');

			for(var image in that.blueprint.images){
				p.echo('Downloading ' + that.blueprint.images[image].name)
				that.getImage(that.blueprint.images[image].url, that.blueprint.images[image].name, callback);
			}
		});
	}

	/**
	 * Download dialog images
	 * @param    url          {string}    The url of the tileset
	 * @param    name         {string}    The name of the tileset
	 * @param   {string}    callback    The function to initialize when we downloaded everything
	 */
	this.getImage = function(url, name, callback) {

		// Create a new image variable where we'll load the image in.
		var img = new Image();

		// When the image has been downloaded we can execute these functions
		img.onload = (function () {

			that.images[name] = {
				"image": img
			};

			loaded++; // Increase our loaded counter

			// Do this only if we've loaded every image:
			if(loaded == toLoad) {
				if(callback) callback();
				// And load our variables, too
				
				/**
				 * The manager's instructions set
				 * @type {Duk.Instructions}
				 */
				that.dimensions = new Duk.Instructions({
					"style": null,
					"width": that.canvas.width,
					"height": that.canvas.height,
					"x": 0,
					"y": 0,
					"clickable": true,
					"moveable": false
				}, that);
				
				/**
				 * The manager's mouse set
				 * @type	{Duk.Mouse}
				 */
				that.cursor = new Duk.Mouse(that);
			}
		});

		// Start downloading the source.
		img.src = url;
	}
	
	this.getBlueprint(url);
	
	/**
	 * A textblock class
	 * @constructor
	 */
	this.Textblock = function(font, fillstyle, width, height){
		
		var t = this;
		
		t.font = font;
		t.width = width - 8;
		t.height = height - 4;
		
		t.bufferElement = document.createElement('canvas');
	
		// Set the resolution of the buffer element
		t.bufferElement.width = t.width;
		t.bufferElement.height = t.height;
	
		// Get the buffer context
		t.b = t.bufferElement.getContext('2d');

		t.b.fillStyle = fillstyle;
		t.b.font = font; // 15pt 'Lucida Console', Monaco, monospace
		t.b.textBaseline = "top";
		
		// Store the size of a random char
		t.charsize = t.b.measureText('a');
		
		// How many chars fir in the input?
		t.fitchar = Math.floor(t.width / t.charsize.width);
		
		// What char index is first visible?
		t.index = 0;
		
		// Where is the cursor?
		t.cursor = 0;
		t.rcursor = 0;	// Relative
		t.cursorpixel = 0;
		
		// What's the value of the text?
		t.value = '';
		
		// What text is currently visible?
		t.view = '';
		
		t.keypress = function(e){
			
			switch (e.keyCode) {
				
				case key.Backspace:
					if(t.value.length > 0 && t.cursor > 0) {
						t.value = cut(t.value, t.cursor-1, t.cursor-1);
						
						// If the value is now the size of the allowed width
						if(t.value.length == t.fitchar) {
							t.rcursor = t.cursor;
						}
					}
					t.curdown();
					break;
				
				case key.Delete:		
					if(t.value.length > 0 && t.cursor < t.value.length) {
						t.value = cut(t.value, t.cursor, t.cursor);
						
						// If the value is now the size of the allowed width
						if(t.value.length == t.fitchar) {
							t.rcursor = t.cursor;
						}
					}
					break;
				
				case key.Leftarrow:
					t.curdown();
					break;
			
				case key.Rightarrow:
					t.curup();
					break;
				
				case key.Home:
					t.cursor = 0;
					t.rcursor = 0;
					t.index = 0;
					break;
				
				case key.End:
					t.cursor = t.value.length;
					t.rcursor = t.fitchar;
					t.index = t.value.length;
					break;
				
				default:
					begin = t.value.substr(0, t.cursor);
					after = t.value.substr(t.cursor, t.value.length);
					t.value = begin + String.fromCharCode(e.keyCode) + after;
					//t.value = t.value.substr(0, t.cursor) + String.fromCharCode(e.keyCode) + t.value.substr(t.cursor+1, tl - t.value.substr(0, t.cursor+1).length);
					t.curup();
					break;
			}
			
			t.refreshview();
			
			console.log('Index: ' + t.index + ' - End Value length:' + t.value.length + ' - cursor:' + t.cursor + ' - charsize:' + t.charsize.width + ' - input width:' + t.width + ' - fitchar:' + t.fitchar + ' - rcursor:' + t.rcursor + ' - pixel:' +  t.cursorpixel);
			//echo('Begin: ' + begin + '[' + String.fromCharCode(e.keyCode) + ']' + after);
			//echo('View: ' + t.view);
		}
		
		t.curup = function(){
			if(t.cursor < t.value.length) t.cursor++;
			if(t.rcursor < t.fitchar) t.rcursor++;
		}
		
		t.curdown = function(){
			if(t.cursor > 0) t.cursor--;
			if(t.rcursor > 0) t.rcursor--;

		}
		
		t.refreshview = function(){
			tl = t.value.length;
			t.index = t.cursor - t.rcursor;
			
			// If the text is too big for the input
			if(t.value.length > t.fitchar) {
				t.view = t.value.substr(t.index, t.fitchar)
				/*
				// And if the cursor is bigger than the fit width
				if(t.cursor > t.fitchar){
					t.view = t.value.substr(t.value.length - t.fitchar, t.cursor);
				} /*else {
					t.view = t.value.substr(0, t.fitchar);
				}*/
				
			} else {
				t.view = t.value;
			}
			
			t.cursorpixel = (t.rcursor * t.charsize.width) + 0;
		}
		
	}

	/**
	 *  Get the dialog object by searching through the layers
	 *  @param	x		{int}
	 *  @param	y		{int}
	 *  @param click	{bool}
	 *  @returns	{object|boolean}		The layer we've clicked, or false if there's nothing there
	 */
	this.getDialogFromLayers = function(x, y, click){

		// Declarations
		var v = openDialogs;     // A by-reference link to the current visible hud layers
		var returnObject = false;	    // The value to return
		var vl;                         // A by-reference link to the layer we inspect in the for-loop

		// Loop through the layers, even if we've already found a match (because
		// you can only click on the top layer, which comes last in this case)
		for(var layer = 0; layer < v.length; layer++){

			// Create a link to the current layer we're inspecting
			vl = v[layer];

			// Calculate 'til what X and Y location this element goes
			var endX = vl.calc.x + vl.calc.width;
			var endY = vl.calc.y + vl.calc.height;

			// Now see if our clicked X and Y coordinates fall in between these ranges
			if((x >= vl.calc.x && x <= endX) && (y >= vl.calc.y && y <= endY)){

				// Save it for sending later (by reference)
				returnObject = vl;

				if(click){
					// Calculate where we clicked the object
					returnObject.calc.clickedX = x - vl.calc.x;
					returnObject.calc.clickedY = y - vl.calc.y;
				}

			}
		}
		
		return returnObject;

	}
	
	/**
	 *  Get the dialog object through the map
	 *  @param	x		{int}
	 *  @param	y		{int}
	 *  @param click	{bool}
	 *  @returns	{object|boolean}		The layer we've clicked, or false if there's nothing there
	 */
	this.getDialog = function(x, y, click){
		
		var returnObject = false;
		var pixel = (y * that.dimensions.width) + x;
		
		if(openMap[pixel] !== undefined) {
			returnObject = openMap[pixel][0];
			
			if(click && returnObject){
				// Calculate where we clicked the object
				returnObject.calc.clickedX = x - returnObject.dimensions.ax;
				returnObject.calc.clickedY = y - returnObject.dimensions.ay;
			}
		}
		
		return returnObject;
	}

	/**
	 * Move a window
	 * @param dialogObject {object}
	 */
	this.moveDialog = function(dialogObject, x, y){

		if(typeof(dialogObject) == 'object') {
			if(dialogObject.inst.moveable) {

				//dialogObject.inst.x = x - dialogObject.calc.clickedX;
				//dialogObject.inst.y = y - dialogObject.calc.clickedY;
				
				dialogObject.dimensions.ongoing.rx = x - dialogObject.calc.clickedX;
				dialogObject.dimensions.ongoing.ry = y - dialogObject.calc.clickedY;
			}
		}
		
		dirtyMap = true;

		// Redraw
		that.draw();

	}
	
	// What to do when the mouse moves over this canvas
	$('#'+canvasId).mousemove( function(e) {

		// Store the cursor position
		that.mouse.x = e.pageX-this.offsetLeft;
		that.mouse.y = e.pageY-this.offsetTop;
		
		// Send a mousemove to the dialog it's over
		that.mouse.overDialog = that.getDialog(that.mouse.x, that.mouse.y);
		if(that.mouse.overDialog){
			that.mouse.overDialog.event.mousemove(that.mouse.x, that.mouse.y);
			that.mouse.overDialog.cursor.setPosition(that.mouse.x, that.mouse.y);
		}
		
		
		
		// Send a mousemove to the dialog we're dragging
		if(that.mouse.down && that.mouse.dialogDown){
			that.mouse.dialogDown.event.mousemove(that.mouse.x, that.mouse.y);
		}
		
		/*
		// If the mouse is pressed down while moving
		if(that.mouse.down && that.mouse.dialogDown){
			
			that.mouse.overDialog = that.mouse.dialogDown;
		} else {
		
			// Set the dialog window the mouse used to be over
			that.mouse.overexitDialog = that.mouse.overDialog;
			
			// Get the dialog window the mouse is over
			that.mouse.overDialog = that.getDialog(that.mouse.x, that.mouse.y);
			
			if(that.mouse.overexitDialog !== that.mouse.overDialog && that.mouse.down == false) {
				
				if(that.mouse.overexitDialog) that.mouse.overexitDialog.event.hoverlost();
				if(that.mouse.overDialog) that.mouse.overDialog.event.hover();
			}
	
			if(that.mouse.down && that.mouse.dialogDown) {
	
				that.moveDialog(that.mouse.dialogDown, that.mouse.x, that.mouse.y);

			} else {
				o = that.getDialog(that.mouse.x, that.mouse.y);
				if(o) o.event.mousemove(that.mouse.x, that.mouse.y);
			}
		}*/

	});

	// Store the mouse position when pressing down a button
	$('#'+canvasId).mousedown(function(e){

		// The mouse has been pressed down
		that.mouse.down = true;
		
		// Calculate the mouse positions
		that.mouse.downx = e.pageX-this.offsetLeft;
		that.mouse.downy = e.pageY-this.offsetTop;

		// Remove the reference to the dialog in dialogup
		that.mouse.dialogUp = false;
		
		// Send the mousedown to the correct master dialog
		that.mouse.dialogDown = that.getDialog(that.mouse.downx, that.mouse.downy, true);
		if(that.mouse.dialogDown) that.mouse.dialogDown.event.mousedown(that.mouse.downx, that.mouse.downy);

	});

	// Store the mouse position when releasing (clicking) down a button
	$('#'+canvasId).mouseup(function(e){
		
		// If something has changed to the position of a dialog, rebuild the map
		if(dirtyMap) that.rebuildMap();

		// The mouse has been released, so it's not "down" anymore
		that.mouse.down = false;
		
		// Calculate the mouse positions
		that.mouse.upx = e.pageX-this.offsetLeft;
		that.mouse.upy = e.pageY-this.offsetTop;

		// Remove the reference to the dialog in dialogDown
		that.mouse.dialogDown = false;
		
		// Send the mouseup to the correct master dialog
		that.mouse.dialogUp = that.getDialog(that.mouse.upx, that.mouse.upy, true);
		if(that.mouse.dialogUp) that.mouse.dialogUp.event.mouseup(that.mouse.upx, that.mouse.upy);

	});
	
	$('body').keyup(function(e){
		that.focusWidget.event.keypress(e);
	});

	// Start downloading needed files, and execute the callback when finished
	this.getBlueprint(url, callback);
	
}

/**
 * Creates a new root dialog window.
 * @param   {object} 	dimensions		The dimension and layout instructions
 * @return  {Duk.Widget}	            A new Duk.Widget instance
 */
Duk.Manager.prototype.openRoot = function(dimensions){
	
	var newRoot = new Duk.Widget(dimensions, this.blueprint.styles[dimensions['style']], this.me);
	this.roots.unshift(newRoot);
    
	this.me.draw();
	this.me.rebuildMap();
	return newRoot;
}

/**
 * Draw all open dialog windows
 */
Duk.Manager.prototype.draw = function(){

	this.ctx.clearRect(0,0,this.dimensions.width, this.dimensions.height);
	for(var i = 0; i < this.roots.length; i++){
		this.roots[i].draw();
	}
}


