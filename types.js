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

/**
 * A collection of enums
 * @type {Object}
 */
Duk.Enums = {};

/**
 * Orientation types
 * @enum {Number}
 */
Duk.Enums.Orientation = {
	TOPLEFT: 1,
	TOPRIGHT: 2,
	BOTTOMRIGHT: 3,
	BOTTOMLEFT: 4,
	CENTER: 5
}

/**
 * A collection of type definitions
 * @type {Object}
 */
Duk.Types = {};

/**
 * The plan object's typedef
 * @typedef {Object}
 */
Duk.Types.Plan = {
	
	/**
	 * The name of the style which we have to use,
	 * which can be found in the manager's blueprints
	 * @type {String}
	 */
	style: "bordersmall",
	
	/**
	 * The width it should be, either a percentage or a number
	 * @type {String}
	 */
	width: "50%",
	
	/**
	 * The height it should be, either a percentage or a number
	 * @type {String}
	 */
	height: "50%",
	
	/**
	 * It's x-position, either as a percentage or a number
	 * @type {String}
	 */
	x: "50%",
	
	/**
	 * It's y-position, either as a percentage or a number
	 * @type {String}
	 */
	y: "50%",
	
	/**
	 * Where the starting position of this widget starts
	 * @type {Duk.Enums.Orientation}
	 */
	orientation: 5, // Duk.Enums.Orientation.CENTER
	
	/**
	 * Wether this should register clicks or not
	 * @type {Boolean}
	 */
	clickable: true,
	
	/**
	 * Wether this is moveable
	 * @type {Boolean}
	 */
	moveable: true
};

/**
 * An instructions set extrapolated from a plan
 * @typedef {Object}
 */
Duk.Types.Pattern = {
	
	/**
	 * The actual style object to use
	 * @type {Duk.Types.Style}
	 */
	style: {
		"tileset": "bordersmall",
		"layers": {"topleft": {"sx": 2, "sy": 2, "width": 21, "height": 21, "repeatv": false, "repeath": false, "offset": [0,0,0,0]},
			"topmiddle": {"sx": 37, "sy": 2, "width": 20, "height": 11, "repeatv": false, "repeath": true, "offset": [0,21,0,0], "stackw": "topleft"},
			"topright": {"sx": 71, "sy": 2, "width": 21, "height": 21,  "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackw": "topmiddle"},
			"left": {"sx": 2, "sy": 41, "width": 11, "height": 20, "repeatv": true, "repeath": false, "offset": [0,0,21,0], "stackh": "topleft"},
			"right": {"sx": 71, "sy": 41, "width": 21, "height": 20, "repeatv": true, "repeath": false, "offset": [0,0,21,0], "stackw": "topmiddle", "stackh": "topleft"},
			"bottomleft": {"sx": 2, "sy": 73, "width": 21, "height": 21, "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackh": "left"},
			"bottommiddle": {"sx": 40, "sy": 73, "width": 20, "height": 20, "repeatv": false, "repeath": true, "offset": [0,21,0,0], "stackw": "topleft", "stackh": "left"},
			"bottomright": {"sx": 71, "sy": 73, "width": 21, "height": 20, "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackw": "topmiddle", "stackh": "left"}
		},
		"fillstyle": "rgba(20, 20, 20, 0.4)",
		"focusstyle": {
			"fillstyle": "rgb(0,150,150)",
			"borderstyle": "rgb(0,0,0)"
		},
		"blur": 5
		},
	
	/**
	 * The actual width
	 * @type {Number}
	 */
	width: 200,
	
	/**
	 * The actual height
	 * @type {Number}
	 */
	height: 200,
	
	/**
	 * The actual x position (on the parent)
	 * @type {Number}
	 */
	x: 100,
	
	/**
	 * The actual y position (on the parent)
	 * @type {Number}
	 */
	y: 100,
	
	/**
	 * Wether this should register clicks or not
	 * @type {Boolean}
	 */
	clickable: true,
	
	/**
	 * Wether this is moveable
	 * @type {Boolean}
	 */
	moveable: true,
	
	/**
	 * Wether this is globally moveable (outside its parent)
	 * @type	{Boolean}
	 */
	globalmove: false
}

/**
 * An instructions set extrapolated from a pattern
 * Used for "ongoing" var
 * @typedef {Object}
 */
Duk.Types.Patternuse = {
	
	/**
	 * The actual style object to use
	 * @type {Duk.Types.Style}
	 */
	style: {
		"tileset": "bordersmall",
		"layers": {"topleft": {"sx": 2, "sy": 2, "width": 21, "height": 21, "repeatv": false, "repeath": false, "offset": [0,0,0,0]},
			"topmiddle": {"sx": 37, "sy": 2, "width": 20, "height": 11, "repeatv": false, "repeath": true, "offset": [0,21,0,0], "stackw": "topleft"},
			"topright": {"sx": 71, "sy": 2, "width": 21, "height": 21,  "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackw": "topmiddle"},
			"left": {"sx": 2, "sy": 41, "width": 11, "height": 20, "repeatv": true, "repeath": false, "offset": [0,0,21,0], "stackh": "topleft"},
			"right": {"sx": 71, "sy": 41, "width": 21, "height": 20, "repeatv": true, "repeath": false, "offset": [0,0,21,0], "stackw": "topmiddle", "stackh": "topleft"},
			"bottomleft": {"sx": 2, "sy": 73, "width": 21, "height": 21, "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackh": "left"},
			"bottommiddle": {"sx": 40, "sy": 73, "width": 20, "height": 20, "repeatv": false, "repeath": true, "offset": [0,21,0,0], "stackw": "topleft", "stackh": "left"},
			"bottomright": {"sx": 71, "sy": 73, "width": 21, "height": 20, "repeatv": false, "repeath": false, "offset": [0,0,0,0], "stackw": "topmiddle", "stackh": "left"}
		},
		"fillstyle": "rgba(20, 20, 20, 0.4)",
		"focusstyle": {
			"fillstyle": "rgb(0,150,150)",
			"borderstyle": "rgb(0,0,0)"
		},
		"hoverstyle": {
			"fillstyle": "rgba(100,0,0,0.9)"
		},
		"blur": 5
		},
	
	/**
	 * The actual width
	 * @type {Number}
	 */
	width: 200,
	
	/**
	 * The actual height
	 * @type {Number}
	 */
	height: 200,
	
	/**
	 * The actual x position (on the parent)
	 * @type {Number}
	 */
	rx: 100,
	
	/**
	 * The actual y position (on the parent)
	 * @type {Number}
	 */
	ry: 100,
	
	/**
	 * The absolute x position (on the manager)
	 * @type {Number}
	 */
	ax: 100,
	
	/**
	 * The absolute y position (on the manager)
	 * @type {Number}
	 */
	ay: 100,
	
	/**
	 * The Z position (in microseconds)
	 * @type	{Number}
	 */
	z: 0,
	
	/**
	 * The absolute pixel this resides on
	 * @type	{Number}
	 */
	apixel: 0,
	
	/**
	 * The relative pixel this resides on
	 * @type	{Number}
	 */
	rpixel: 0,
	
	/**
	 * Wether this should register clicks or not
	 * @type {Boolean}
	 */
	clickable: true,
	
	/**
	 * Wether this is moveable
	 * @type {Boolean}
	 */
	moveable: true,
	
	/**
	 * Wether this is globally moveable (outside its parent)
	 * @type	{Boolean}
	 */
	globalmove: false,
	
	/**
	 * Does this widget have focus?
	 * @type	{Boolean}
	 */
	focus: false,
	
	/**
	 * Does this widget have hover?
	 * @type	{Boolean}
	 */
	hover: false
}

/**
 * The mouse type
 * @typedef {Object}
 */
Duk.Types.Mouse = {
	
	/**
	 * The relative x position. Read-only.
	 * @type {Number}
	 */
	rx: 0,
	
	/**
	 * The relative y position. Read-only.
	 * @type {Number}
	 */
	ry: 0,
	
	/**
	 * The absolute x position. Read-only.
	 * @type {Number}
	 */
	ax: 0,
	
	/**
	 * The absolute y position. Read-only.
	 * @type {Number}
	 */
	ay: 0,
	
	/**
	 * The relative pixel we're on. Read-only.
	 * @type {Number}
	 */
	rpixel: 0,
	
	/**
	 * The absolute pixel we're on. Read-only.
	 * @type {Number}
	 */
	ypixel: 0,
	
	/**
	 * References to widgets our has interacted with
	 * @type {Object}
	 */
	interaction: {
		
		/**
		 * The widget the mouse is over
		 * @type {Duk.Widget}
		 */
		over: undefined,
		
		/**
		 * The widget the mouse was over previously
		 * @type {Duk.Widget}
		 */
		overPrevious: undefined,
		
		/**
		 * The widget the mouse clicked down on
		 * @type {Duk.Widget}
		 */
		down: undefined,
		
		/**
		 * The widget where the mouse was released
		 * @type {Duk.Widget}
		 */
		up: undefined
		
	},
	
	/**
	 * The rx pixel we clicked down on
	 * @type	{Number}
	 */
	downpixelx: 0,
	
	/**
	 * The ry pixel we clicked down on
	 * @type	{Number}
	 */
	downpixely: 0,
	
	/**
	 * The state of the object
	 * @type {Object}
	 */
	state: {
		
		/**
		 * Do we have focus?
		 * @type {Boolean}
		 */
		focus: false,
		
		/**
		 * Do we have a click down?
		 * @type {Boolean}
		 */
		down: false
		
	}
	
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