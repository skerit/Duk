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
	Created on: 2011/05/11 10:28
	Last Modified: Trunk
*/

/**
 * A collection of useful functions used in several projects
 * @type {Object}
 */
Penseel = {};

/**
 * A function inspired the the print_r function of PHP.
 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 * @param	{Array|Object}	arr			The object/array to print
 * @param	{Number}		[level]		The optional amount of levels to print
 * @returns	{String}		The textual representation of the array
 */
Penseel.dump = function(arr,level) {
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
				dumped_text += this.dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}

/**
 *Output an associative array to the echo div
 *@param array {array} The array you want to show
 */
Penseel.debugArray = function(array){
    this.echo('<pre>' + this.dump(array) + '</pre>');
}

/**
 * Output a message to the echo div, no matter what
 * @param {String}	message	The string you want to show
 */
Penseel.echo = function(message){
	var text='<p>[ECHO] ' + message + '</p>';
	$('#output').prepend(text);
}

/**
 * Make a copy of an object, so we can use it regulary and not by reference
 * @param    obj     {object}    The object you want to create a hard copy of
 * @returns  {object}            The same object, but modifyable
 */
Penseel.deepCopy = function(obj) {
	
	// If it's not an object, return the original parameter
    if (typeof obj !== "object" || !obj) return obj;

    var retVal = new obj.constructor();
	
	// Loop through every key in the object
    for (var key in obj) {
		
        if (!obj.hasOwnProperty(key)) continue;
		
		// Set the key by recursively applying another deepCopy
        retVal[key] = this.deepCopy(obj[key]);
    }
    return retVal;
}

/**
 * Make a copy of an object, so we can use it regulary and not by reference,
 * but only so many levels deep. (The rest will be by reference)
 * @param    obj     {object}    The object you want to create a hard copy of
 * @returns  {object}            The same object, but modifyable
 */
Penseel.shallowCopy = function(obj, depth) {
	
	// If it's not an object, return the original parameter
    if (typeof obj !== "object" || !obj) return obj;

    var retVal = new obj.constructor();
	
	var run = 0;
	
	// Loop through every key in the object
    for (var key in obj) {
		
        if (!obj.hasOwnProperty(key)) continue;
		
		if(run < depth){
			// Set the key by recursively applying another deepCopy
			retVal[key] = this.deepCopy(obj[key]);
		} else {
			retVal[key] = obj[key];
		}
		
		run++;
    }
    return retVal;
}

/**
 * Turn an object into an array (very simple)
 * @param    obj     {object}    The object you want to create a hard copy of
 * @returns  {Array}             The array
 */
Penseel.makeArray = function(obj) {
	
	// If it's not an object, return the original parameter
    if (typeof obj !== "object" || !obj) return obj;

    var retVal = [];
	
	// Loop through every key in the object
    for (var key in obj) {
		
        if (!obj.hasOwnProperty(key)) continue;
		
		retVal.push(obj[key]);

    }
    return retVal;
}

/**
 * Recursively merge properties of two objects
 * @param	{Object}	obj1	The first object, which will be modified if not passed as a deepcopy
 * @param	{Object}	obj2	The second object
 */
Penseel.merge = function(obj1, obj2) {

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
 * @author flother http://www.flother.com/blog/2010/image-blur-html5-canvas/
 * @param 	{CanvasRenderingContext2D}	context		The destination
 * @param	{nsIDOMElement}				element		The source
 * @param	{Number}					passes		The blur strength (only works when destination and source are the same)
 */
Penseel.blur = function(destinationElement, sourceElement, passes) {

	var i, x, y;
	context = destinationElement.getContext('2d');
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
			context.drawImage(sourceElement, x, y);
			}
		}
	}
	context.globalAlpha = 1.0;
}

/**
 * Blur a (piece of a) canvas, and return that blurred part for drawing.
 * @param   {object}    sourceElement   The canvas source element to blur
 * @param   {int}       x               The starting x position on this canvas
 * @param   {int}       y               The starting y position on this canvas
 * @param   {int}       width           The width to blur
 * @param   {int}       height          The height to blur
 * @param   {int}       blurAmount      The number of steps to blur
 * @return  {object}    An object containing element, x, and y ready to be draw on another canvas
 */
Penseel.blurRegion = function(sourceElement, x, y, width, height, blurAmount, canvasWidth, canvasHeight){

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

	// Create a new canvas element
	var tEl = document.createElement('canvas');
	
	// Set the correct widths
	tEl.width = width;
	tEl.height = height;

	// Get the context for a first draw
	tBuf = tEl.getContext('2d');
	tBuf.drawImage(sourceElement, blurX, blurY, blurWidth, blurHeight, 0, 0, blurWidth, blurHeight);

	p.blur(tEl, tEl, blurAmount);

	return {'element': tEl, 'x': blurX, 'y': blurY};

}

/**
 * Return the current time in milliseconds
 * @returns	{Number}	The seconds passed since the epoch
 */
Penseel.now = function(){
    return (new Date()).getTime();
}