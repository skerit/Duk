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
 * 
 * @classDescription	The duk
 * @param   {string}    canvasId    The ID of the canvas to use
 * @param   {string}    url         The url of the blueprint JSON to download
 * @param   {string}    callback    The function to initialize when we downloaded everything
 * @return	{Duk.Manager}			Returns the new Manager object
 * @type	{Object}
 * @constructor
 */
Duk.Manager = function(canvasId, url, callback){

    this.me = this;
	var that = this;
	this.canvasId = canvasId;

	this.canvas = document.getElementById(canvasId);
	
	// Retrieve the canvas DOM node, this gives us access to its drawing functions
	this.ctx = this.canvas.getContext('2d');

	// Get the width and height of the element
	this.width = this.canvas.width;
	this.height = this.canvas.height;

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
			x = openDialogs[i].calc.x;
			y = openDialogs[i].calc.y;
			width = openDialogs[i].calc.width;
			height = openDialogs[i].calc.height;
			maxwidth = x+width;
			maxheight = y+height;

			for(var ty = y; ty <= maxheight; ty++){
				for(var tx = x; tx <= maxwidth; tx++){					
					if(tx > 0 && ty > 0){
						if(openMap[(ty * that.width) + tx] === undefined){
							openMap[(ty * that.width) + tx] = [];
						}
						openMap[(ty * that.width) + tx].push(openDialogs[i]);
					}
				}
			}
		}
		
		dirtyMap = false
	}

	/**
	 *  Load the JSON blueprint
	 */
	this.getBlueprint = function(url, callback){
		$.getJSON(url, function(data) {
			that.blueprint = data;

			toLoad = that.blueprint.images.length;

			echo('Need to download ' + toLoad + ' images');

			for(var image in that.blueprint.images){
				echo('Downloading ' + that.blueprint.images[image].name)
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
				callback();
			}

		});

		// Start downloading the source.
		img.src = url;
	}
	
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
		var pixel = (y * that.width) + x;
		
		if(openMap[pixel] !== undefined) {
			returnObject = openMap[pixel][0];
			
			if(click && returnObject){
				// Calculate where we clicked the object
				returnObject.calc.clickedX = x - returnObject.calc.x;
				returnObject.calc.clickedY = y - returnObject.calc.y;
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

				dialogObject.inst.x = x - dialogObject.calc.clickedX;
				dialogObject.inst.y = y - dialogObject.calc.clickedY;
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
		if(that.mouse.overDialog) that.mouse.overDialog.event.mousemove(that.mouse.x, that.mouse.y);
		
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
	
};

/**
 * Creates a new root dialog window.
 * @param {string} arg1 An argument that makes this more interesting.
 * @return {string} Some return value.
 */
Duk.Manager.prototype.openRoot = function(dimensions){
	var newRoot = new Widget(dimensions, null, this.me);
	this.roots.unshift(newRoot);
    
	this.me.draw();
	this.me.rebuildMap();
	return newRoot;
}

/**
 * Draw all open dialog windows
 */
Duk.Manager.prototype.draw = function(){
	this.me.ctx.clearRect(0,0,this.me.width, this.me.height);
	for(var i = 0; i < this.roots.length; i++){
		this.roots[i].draw();
	}
}

echoOutput = $('#output');

/**
 *Output a message to the echo div, no matter what
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last echo
 *                        (with counter enabled). Defaults to false.
 */
function echo(message){

	var text='<p>[ECHO] ' + message + '</p>';
	$('#output').append(text);
	console.log(message);


}

/**
 *Make a copy of an object, so we can use it regulary and not by reference
 *@param    obj     {object}    // The object you want
 *@returns  {object}            // The same object, but modifyable
 */
function deepCopy(obj) {
    if (typeof obj !== "object") return obj;

    var retVal = new obj.constructor();
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        retVal[key] = deepCopy(obj[key]);
    }
    return retVal;
}


/**
 * Recursively merge properties of two objects (modifies the original obj1 when not passed as a deepcopy!)
 */
merge = function(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}

/**
 * Blur function
 * @author flother
 * http://www.flother.com/blog/2010/image-blur-html5-canvas/
 */
function blur(context, element, passes) {
	var i, x, y;
	context.globalAlpha = 0.125;
	// Loop for each blur pass.
	for (i = 1; i <= passes; i += 1) {
		for (y = -1; y < 2; y += 1) {
			for (x = -1; x < 2; x += 1) {
			// Place eight versions of the image over the original
			// image, each with 1/8th of full opacity. The images are
			// placed around the original image like a square filter.
			// This gives the impression the image has been blurred,
			// but it's done at native browser speed, thus making it
			// much faster than writing a proper blur filter in
			// Javascript.
			context.drawImage(element, x, y);
			}
		}
	}
	context.globalAlpha = 1.0;
}

/**
 * Blur a canvas
 * @param   {object}    sourceElement   The canvas source element to blur
 * @param   {int}       x               The starting x position on this canvas
 * @param   {int}       y               The starting y position on this canvas
 * @param   {int}       width           The width to blur
 * @param   {int}       height          The height to blur
 * @param   {int}       blurAmount      The number of steps to blur
 * @return  {object}    An object containing element, x, and y ready to be draw on another canvas
 */
blurCanvas = function(sourceElement, x, y, width, height, blurAmount, canvasWidth, canvasHeight){

	// Blur dialog background
	if(x < 0){
		blurWidth = width + x  - blurAmount;
		blurX = 0;
	} else {

		if((x+width) > canvasWidth) {
			blurWidth = width - ((x+width)-canvasWidth) - (blurAmount/2);
			blurX = x;
		} else {
			blurWidth = width  - (blurAmount/2);
			blurX = x;
		}
	}

	if(y < 0) {
		blurHeight = height + y  - blurAmount;
		blurY = 0;
	} else {
		if((y+height) > canvasHeight){
			blurHeight = height - ((y+height) - canvasHeight)  - (blurAmount/2);
			blurY = y;
		} else {
			blurHeight = height  - (blurAmount/2);
			blurY = y;
		}
	}

	// Test blur background
	var tEl = document.createElement('canvas');
	tEl.width = width;
	tEl.height = height;

	tBuf = tEl.getContext('2d');
	tBuf.drawImage(sourceElement, blurX, blurY, blurWidth, blurHeight, 0, 0, blurWidth, blurHeight);


	//tBuf.putImageData(k.links.canvas.buffer.getImageData(x, y, width, height));

	blur(tBuf, tEl, blurAmount);

	return {'element': tEl, 'x': blurX, 'y': blurY};

}


/**
 *Return the current time in milliseconds
 */
function now(){
    return (new Date()).getTime();
}

/**
 *Output an associative array to the echo div
 *@param array {array} The array you want to show
 */
function debugArray(array){
    echo('<pre>' + dump(array) + '</pre>');
}

/**
 * Function : dump()
 * Arguments: The data - array,hash(associative array),object
 *    The level - OPTIONAL
 * Returns  : The textual representation of the array.
 * This function was inspired by the print_r function of PHP.
 * This will accept some data as the argument and return a
 * text that will be a more readable version of the
 * array/hash/object that is given.
 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 */
function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;

	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";

	if(typeof(arr) == 'object') { //Array/Hashes/Objects
		for(var item in arr) {
			var value = arr[item];

			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}

var key = {
    'Backspace': 8,
    'Tab': 9,
    'Enter': 13,
    'Shift': 16,
    'Ctrl': 17,
    'Alt': 18,
    'Pause': 19,
    'Capslock': 20,
    'Esc': 27,
    'Pageup': 33,
    'Pagedown': 34,
    'End': 35,
    'Home': 36,
    'Leftarrow': 37,
    'Uparrow': 38,
    'Rightarrow': 39,
    'Downarrow': 40,
    'Insert': 45,
    'Delete': 46,
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    'a': 65,
    'b': 66,
    'c': 67,
    'd': 68,
    'e': 69,
    'f': 70,
    'g': 71,
    'h': 72,
    'i': 73,
    'j': 74,
    'k': 75,
    'l': 76,
    'm': 77,
    'n': 78,
    'o': 79,
    'p': 80,
    'q': 81,
    'r': 82,
    's': 83,
    't': 84,
    'u': 85,
    'v': 86,
    'w': 87,
    'x': 88,
    'y': 89,
    'z': 90,
    '0numpad': 96,
    '1numpad': 97,
    '2numpad': 98,
    '3numpad': 99,
    '4numpad': 100,
    '5numpad': 101,
    '6numpad': 102,
    '7numpad': 103,
    '8numpad': 104,
    '9numpad': 105,
    'Multiply': 106,
    'Plus': 107,
    'Minut': 109,
    'Dot': 110,
    'Slash1': 111,
    'F1': 112,
    'F2': 113,
    'F3': 114,
    'F4': 115,
    'F5': 116,
    'F6': 117,
    'F7': 118,
    'F8': 119,
    'F9': 120,
    'F10': 121,
    'F11': 122,
    'F12': 123,
    'equal': 187,
    'Coma': 188,
    'Slash': 191,
    'Backslash': 220
}

/**
* A widget class
* @classDescription	Create a new widget
* @param   {object|undefined}          parameters          An object with extra parameters
* @param   {string|boolean|undefined}  windowStyle         The style to use, or false
* @param   {int|string|undefined}      x                   The wanted starting x position of the widget
* @param   {int|string|undefined}      y                   The wanted starting y position of the widget
* @param   {int|string}                width               The wanted width of the widget
* @param   {int|string}                height              The wanted height of the widget
* @return	{Duk.Widget}				Returns the new Widget object
* @type	{Object}
* @constructor
*/
var Widget = function(parameters, windowStyles, that, x, y, width, height) {
//var Widget = function(parameters, root, style, parent) {
    //var Widget = function(parameters, windowStyles, that, x, y, width, height) {
    
   /**
	* A reference to this function
	* @type this
	*/
   var me = this;
		   
   this.ischild = parameters.widget ? true : false;

   /**
	* The instructions by which the dimensions will be calculated
	* @type object
	*/
   this.inst = {};
		   
   /**
	* The calculations of the dimensions (based on this.inst instructions
	*/
   this.calc = {};
		   
   /**
	* The z-layer of this widget. Smaller is higher
	* @type number
	*/
   this.z = 0;
		   
   this.ztime = now();     // When the z-layer was last changed
   this.type = parameters.type;
		   
   
   var z = {};

   /**
	* Some test
	* @type number
	*/
   z.test = 1;


   //me.parent = Duk.Widget();
   
   /**
	* @type {Widget}
	*/
   this.parent = {};
   
   /**
	* @type {Duk.Widget}
	*/
   //this.test = that.Widget();
   
   
   
   /*
	* @see Widget
	*/
   this.www = {};
   
   
		   
   if(parameters.widget){
	   this.ischild = true;
	   this.parent = parameters.parent;
   } else {
	   this.ischild = false;
	   this.parent.width = that.width;
	   this.parent.height = that.height;
   }

   this.echo = function(message){
	   echo(' DIALOG says: ' + message);
   }
   
   this.widgets = [];
   
   // Test
   this.value = '';
   this.textblock = false;	// Store the textblock in here after the first calculation

   // Get the basic instructions from the parameters if they exist there
   this.inst.x = parameters.x ? parameters.x : x;
   this.inst.y = parameters.y ? parameters.y : y;
   this.inst.width = parameters.width ? parameters.width : width;
   this.inst.height = parameters.height ? parameters.height : height;
   this.inst.style = parameters.style ? parameters.style : windowStyles;
   this.inst.blur = parameters.blur ? parameters.blur : 4;

   // Calculated info
   this.calc.style = {};
   this.calc.width = this.inst.width;
   this.calc.height = this.inst.height;
   this.calc.x = this.inst.x;
   this.calc.y = this.inst.y;
   this.calc.clickedX = 0;
   this.calc.clickedY = 0;
   this.ocalc = false;
   
   // Relative positions to the parent
   this.calc.rx = 0;
   this.calc.ry = 0;
   
   this.focus = false;
   this.focusWidget = false;			// The child widget that has focus will be stored here
   this.focusexitWidget = false;		// The previous child widget will be stored here
   
   // Mouse position RELATIVE to the dialog.
   this.mouse = {}
   this.mouse.x = 0;
   this.mouse.y = 0;
   this.mouse.pixel = 0;
   this.mouse.downx = 0;
   this.mouse.downy = 0;
   this.mouse.downpixel = 0;
   this.mouse.upx = 0;
   this.mouse.upy = 0;
   this.mouse.uppixel = 0;
   this.mouse.down = false;
   this.mouse.up = true;
   
   this.mouse.overDialog = false;
   this.mouse.overexitDialog = false;
   this.mouse.dialogDown = false;
   this.mouse.dialogUp = false;
   
   this.mouse.focusDialog = false;
   this.mouse.focusexitDialog = false;
   
   this.widgetMap = [];

   // Store the windowStyles
   if(typeof(this.inst.style) == "array") {
	   for(var style in this.inst.style){
		   if(that.blueprint.styles[this.inst.style[style]] !== undefined) merge(this.calc.style, that.blueprint.styles[this.inst.style[style]]);
	   }
   } else {
	   this.calc.style = that.blueprint.styles[this.inst.style] !== undefined ? deepCopy(that.blueprint.styles[this.inst.style]) : false;
   }

   // A dialog window is always clickable, unless otherwise defined in the parameters
   this.inst.clickable = parameters.clickable === undefined ? true : parameters.clickable;

   // A dialog window is always moveable, unless otherwise defined in the parameters
   this.inst.moveable = parameters.moveable === undefined ? true : parameters.moveable;
   
   // Adding a dialog widget
   this.addWidget = function(parameters) {
	   deep = deepCopy(merge(parameters, {'widget': true}));
	   deep['parent'] = me.calc;
	   
	   //var temp = new that.Widget(deep);
	   var temp = new Widget(deep, null, that);
	   me.widgets.unshift(temp);
	   me.rebuildMap();
	   that.draw();

   }

   /**
	* Draw this widget
	* @method
	* @memberOf Widget
	*/
   this.draw = function() {
	   me.recalculate();
	   me.blur();
	   me.decorate();
	   me.populate();
	   
	   // Draw widgets
	   for(var i = 0; i < me.widgets.length; i++){
		   me.widgets[i].draw();
	   }
   }
   
   /**
	* Populate the widgets with values and such
	*/
   this.populate = function() {
	   if(me.type == 'input' && me.textblock) {
		   bx = parseInt(me.calc.x) + 4;
		   by = parseInt(me.calc.y) + 4;
		   
		   that.ctx.fillStyle = 'rgb(0,0,0)';
		   that.ctx.font = "15pt 'Lucida Console', Monaco, monospace";
		   that.ctx.textBaseline = "top";

		   that.ctx.fillText(me.textblock.view, bx, by);
		   
		   that.ctx.beginPath();
		   that.ctx.moveTo(bx + me.textblock.cursorpixel, by);
		   that.ctx.lineTo(bx + me.textblock.cursorpixel, by + me.textblock.height - 4);
		   that.ctx.closePath();
		   that.ctx.stroke();
		   

	   }
   }
   
   /**
	* Build the widgetMap. Should only be run at creation since widget's
	* don't normally change position INSIDE the dialog
	*/
   this.rebuildMap = function(){
	   echo('Rebuilding widget map for ' + me.widgets.length);
	   me.widgetMap = [];
	   
	   for(var i = 0; i < me.widgets.length; i++){
		   
		   x = parseInt(me.widgets[i].calc.rx);
		   y = parseInt(me.widgets[i].calc.ry);
		   echo(x + '-' + y)
		   width = parseInt(me.widgets[i].calc.width);
		   height = parseInt(me.widgets[i].calc.height);
		   maxwidth = x+width;
		   maxheight = y+height;

		   for(var ty = y; ty <= maxheight; ty++){
			   for(var tx = x; tx <= maxwidth; tx++){
				   if(tx > 0 && ty > 0){
					   pixel = (ty * me.calc.width) + tx;
					   
					   if(me.widgetMap[pixel] === undefined){
						   me.widgetMap[pixel] = [];
					   }
					   me.widgetMap[pixel].push(me.widgets[i]);
				   }
			   }
		   }
	   }
	   
   }

   // Recalculate certain variables
   this.recalculate = function(){

	   me.calc.width = me.inst.width;
	   me.calc.height = me.inst.height;
	   me.calc.x = me.inst.x;
	   me.calc.y = me.inst.y;
	   
	   // Calculate the width and height if they're percentages
	   if(me.calc.width.indexOf('%') > 0) me.calc.width = me.parent.width * (parseInt(me.calc.width.replace('%', '')) / 100);
	   if(me.calc.height.indexOf('%') > 0) me.calc.height = me.parent.height * (parseInt(me.calc.height.replace('%', '')) / 100);

	   if(me.ischild) {
		   xbase = me.parent.x;
		   ybase = me.parent.y;
		   xextra = 0
		   yextra = 0
	   } else {
		   xbase = 0
		   ybase = 0
		   xextra = me.calc.width / 2;
		   yextra = me.calc.height / 2;
	   }

	   // Calculate the x and y if they're percentages
	   if(typeof(me.calc.x) == 'string' && me.calc.x.indexOf('%') > 0) {
		   me.calc.rx = (me.parent.width * (parseInt(me.calc.x.replace('%', '')) / 100)) - xextra;
		   me.calc.x = xbase + me.calc.rx;
	   } else {
		   me.calc.rx = parseInt(me.calc.x);
		   me.calc.x = parseInt(xbase) + me.calc.rx;
	   }

	   if(typeof(me.calc.y) == 'string' && me.calc.y.indexOf('%') > 0) {
		   me.calc.ry = (me.parent.height * (parseInt(me.calc.y.replace('%', '')) / 100)) - yextra;
		   me.calc.y = ybase + me.calc.ry;
	   } else {
		   me.calc.ry = parseInt(me.calc.y);
		   me.calc.y = parseInt(ybase) + me.calc.ry;
	   }
	   
	   if(me.ischild) {
		   //echo('Parent location: ' + me.parent.x + ',' + me.parent.y)
		   //echo('This location: ' + me.calc.x + ',' + me.calc.y)
	   }
	   
	   // Store the first calculated settings in ocalc.
	   if(!me.ocalc){
		   me.ocalc = deepCopy(me.calc);
	   }
	   
	   // Set the textblock on first calculation
	   if(!me.textblock) me.textblock = new that.Textblock('15pt Monospace', 'rgb(0,0,0)', me.calc.width, me.calc.height);
	   
   }

   // Blur the background if it's wanted
   this.blur = function() {
	   if(me.calc.style.blur && !me.ischild){
		   var result = blurCanvas(that.canvas, me.calc.x, me.calc.y, me.calc.width, me.calc.height, me.inst.blur, me.parent.width,  me.parent.height);
		   that.ctx.drawImage(result.element, result.x, result.y);
	   }
   }

   // Draw the decorations
   this.decorate = function() {

	   var dialog = me.calc.style;
	   var stack = {};

	   // Draw the background rectangle
	   if(dialog.fillstyle) {
		   if(dialog.bottomfill){
			   that.ctx.fillStyle = dialog.bottomfill;
			   that.ctx.fillRect(me.calc.x+1, me.calc.y+1, me.calc.width-2, me.calc.height-2);
		   }
		   that.ctx.fillStyle = dialog.fillstyle;
		   that.ctx.fillRect(me.calc.x+1, me.calc.y+1, me.calc.width-2, me.calc.height-2);
	   }
	   
	   // Draw the border if there is one
	   if(dialog.borderstyle) {
		   that.ctx.strokeStyle = dialog.borderstyle;
		   that.ctx.strokeRect(me.calc.x+1, me.calc.y+1, me.calc.width-2, me.calc.height-2)
	   }

	   // Render every layer
	   for(var layer in dialog.layers){

		   var d = {
			   width: dialog.layers[layer]['width'],           // The actual width of the item
			   height: dialog.layers[layer]['height'],         // The actual height of the item
			   loopWidth: 0,       // The cumulating width of the items
			   loopHeight: 0,     // The cumulating height of the items
			   useWidth: dialog.layers[layer]['width'],        // The width to use for drawing
			   useHeight: dialog.layers[layer]['height'],      // The height to use for drawing
			   repeatx: 0,
			   repeaty: 0,
			   repeatv: dialog.layers[layer].repeatv,
			   repeath: dialog.layers[layer].repeath,
			   offset: dialog.layers[layer].offset,
			   wantedWidth: dialog.layers[layer]['width'],
			   wantedHeight: dialog.layers[layer]['height']
		   }

		   if(d.repeath) d.wantedWidth = me.calc.width;
		   if(d.repeatv) d.wantedHeight = me.calc.height;

		   // Calculate the total offset
		   d.offsettop = d.offset[0];
		   d.offsetright = d.offset[1];
		   d.offsetbottom = d.offset[2];
		   d.offsetleft = d.offset[3];

		   if(dialog.layers[layer].stackw !== undefined) d.offsetleft += stack[dialog.layers[layer].stackw]['width'];
		   if(dialog.layers[layer].stackh !== undefined) d.offsettop += stack[dialog.layers[layer].stackh]['height'];

		   // Recalculate the wanted sized
		   d.wantedWidth = d.wantedWidth - (d.offsetleft + d.offsetright);
		   d.wantedHeight = d.wantedHeight - (d.offsettop + d.offsetbottom);

		   do {

			   todo = 0;

			   dx = me.calc.x + (d.repeatx * d.width) + d.offsetleft;
			   dy = me.calc.y + (d.repeaty * d.height) + d.offsettop;

			   that.ctx.drawImage(                // Draw to the buffer
					that.images[dialog['tileset']]['image'],       // The image to use
					dialog.layers[layer]['sx'],               // The source x on the image
					dialog.layers[layer]['sy'],               // The source y on the image
					d.useWidth,             // The source width
					d.useHeight,            // The source height
					dx,
					dy,
					d.useWidth,
					d.useHeight
			   );

			   if(d.repeatx == 0) d.loopWidth = d.useWidth;

			   if(dialog.layers[layer].repeath) {
				   d.wantedWidth -= d.useWidth;
				   if(d.repeatx > 0) d.loopWidth += d.useWidth;
				   d.repeatx++;
				   if(d.wantedWidth < d.useWidth) d.useWidth = d.wantedWidth;
				   todo += d.wantedWidth;
			   }

			   if(d.repeaty == 0) d.loopHeight = d.useHeight;

			   if(dialog.layers[layer].repeatv) {

				   d.wantedHeight -= d.useHeight;
				   if(d.repeaty > 0) d.loopHeight += d.useHeight;
				   d.repeaty++;
				   if(d.wantedHeight < d.useHeight) d.useHeight = d.wantedHeight;
				   todo += d.wantedHeight;
			   }

		   }while(todo > 0);

		   if(dialog.layers[layer].stackw !== undefined) {
			   d.loopWidth += stack[dialog.layers[layer].stackw]['width'];
		   }

		   if(dialog.layers[layer].stackh !== undefined) {
			   d.loopHeight += stack[dialog.layers[layer].stackh]['height'];
		   }

		   // We'll store how much space everything takes in here, needed for stacks
		   stack[layer] = {'width': d.loopWidth, 'height': d.loopHeight};

	   }

   }
   
   /**
	*  Get the widget object
	*  @param	x		{int}
	*  @param	y		{int}
	*  @param click	{bool}
	*  @returns	{object|boolean}		The object we've clicked, or false if there's nothing there
	*/
   this.getWidget = function(x, y, click){
	   
	   var returnObject = false;
	   var pixel = (y * me.calc.width) + x;
	   
	   if(me.widgetMap[pixel] !== undefined) {
		   returnObject = me.widgetMap[pixel][0];
		   
		   if(click && returnObject){
			   // Calculate where we clicked the object
			   returnObject.calc.clickedX = x - returnObject.calc.rx;
			   returnObject.calc.clickedY = y - returnObject.calc.ry;
		   }
	   }
	   
	   return returnObject;
   }
   
   /**
	* @memberOf Widget
	*/
   this.event = {};
   
   /**
	* What to do on a mousemove
	*  @param	x		{int}
	*  @param	y		{int}
	*/
   this.event.mousemove = function(x, y){
	   
	   me.mouse.x = x - me.calc.rx;
	   me.mouse.y = y - me.calc.ry;
	   me.mouse.pixel = (me.mouse.y * me.calc.width) + me.mouse.x;
	   

	   // Set the dialog window the mouse used to be over
	   me.mouse.overexitDialog = me.mouse.overDialog;
	   
	   // Get the dialog window the mouse is over
	   me.mouse.overDialog = me.getWidget(me.mouse.x, me.mouse.y);
	   

	   if(!me.ischild){ // This never gets executed in a child widget, only the top parent
		   if(me.widgetMap[me.mouse.pixel] !== undefined) {
			   me.widgetMap[me.mouse.pixel][0].event.mousemove(me.mouse.x, me.mouse.y);
		   } else {
			   if(that.mouse.down && !me.mouse.dialogDown) that.moveDialog(that.mouse.dialogDown, that.mouse.x, that.mouse.y);
		   }
		   
		   if(me.mouse.overexitDialog !== me.mouse.overDialog) {
			   if(me.mouse.overexitDialog) me.mouse.overexitDialog.event.hoverlost();
			   if(me.mouse.overDialog) me.mouse.overDialog.event.hover();
		   }
		   
		   
		   
	   } else {
		   // This only gets executed in a widget inside a parent
		   
	   }

	   
   }
   
   this.event.hoverlost = function() {
	   if(!me.focus) {
		   me.calc.style.fillstyle = me.ocalc.style.fillstyle;
		   that.draw();
	   } else {
		   
	   }
   }
   
   this.event.hover = function() {
	   if(!me.focus){
		   me.calc.style.fillstyle = 'rgba(255,0,0, 0.5)';
		   that.draw();
	   } else {
		   
	   }
   }
   
   this.event.focuslost = function() {
	   
	   // Restore my old style
	   me.calc.style.fillstyle = me.ocalc.style.fillstyle;
	   
	   // Take away my focus status
	   me.focus = false;
	   
	   // Reset the focusWidget
	   that.focusWidget = false;
	   
	   // Send the focuslost signal to my widget that has focus
	   if(me.focusWidget) me.focusWidget.event.focuslost();
	   
	   that.draw();
   }
   
   this.event.focus = function() {
	   
	   if(!me.focus){ // If we didn't have focus before
		   me.calc.style.fillstyle = 'rgba(0,200,0, 0.6)';
		   me.focus = true;
		   
		   // Only 1 thing can ever have focus, set that
		   that.focusWidget = me;
	   }
	   
	   that.draw();
   }
   
   this.event.mousedown = function(x, y){
	   me.mouse.downx = x - me.calc.rx;
	   me.mouse.downy = y - me.calc.ry;
	   me.mouse.downpixel = (me.mouse.downy * me.calc.width) + me.mouse.downx;
	   
	   me.mouse.up = false;
	   me.mouse.down = true;
	   me.mouse.dialogDown = me.getWidget(me.mouse.downx, me.mouse.downy);
	   if(me.mouse.dialogDown) me.mouse.dialogDown.event.mousedown(me.mouse.downx, me.mouse.downy);
	   
   }
   
   this.event.mouseup = function(x, y){
	   
	   // Calculate the relative positions of the up clicks
	   me.mouse.upx = x - me.calc.rx;
	   me.mouse.upy = y - me.calc.ry;
	   me.mouse.uppixel = (me.mouse.upy * me.calc.width) + me.mouse.upx;
	   
	   // Store the previous focused dialog
	   that.focusexitDialog = that.focusDialog;
	   
	   // If this isn't a child, make me the curent dialog
	   if(!me.ischild) that.focusDialog = me;
	   
	   // If the previous focussed dialog is different from the current
	   // focussed dialog, send the focuslost event
	   if(that.focusexitDialog != that.focusDialog){
		   if(that.focusexitDialog) that.focusexitDialog.event.focuslost();
	   }
	   
	   // Whatever I am, give me focus
	   me.event.focus();
	   
	   // Now for our children widgets
	   // Store our previous focused widget
	   me.focusexitWidget = me.focusWidget
	   
	   // Get the widget we clicked on now
	   me.focusWidget = me.getWidget(me.mouse.upx, me.mouse.upy);
	   
	   // If they're different, switch the focus
	   if(me.focusexitWidget != me.focusWidget){
		   
		   if(me.focusexitWidget) me.focusexitWidget.event.focuslost();
	   
		   // Send it the focus signal, too
		   if(me.focusWidget) me.focusWidget.event.focus();
		   
	   }
	   
	   me.mouse.up = true;
	   me.mouse.down = false;
	   me.mouse.dialogUp = me.getWidget(me.mouse.upx, me.mouse.upy);
	   if(me.mouse.dialogUp) me.mouse.dialogUp.event.mouseup(me.mouse.upx, me.mouse.upy);

   }
   
   this.event.keypress = function(e){	
	   me.textblock.keypress(e);
	   echo(me.textblock.value);
	   that.draw();
   }
   
   // Only the top dialog should rebuild this
   if(!this.ischild) this.rebuildMap();
   
   // Calculate everything a first time
   this.recalculate();
   

}