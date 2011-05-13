/**
 * The Duk Widget class
 * @classDescription	A new widget
 * @param	{object|undefined}          parameters		An object with extra parameters
 * @param	{Duk.Manager}				manager			The main manager instance
 * @param	{Duk.Widget}				root            The root widget, aka "dialog"
 * @param	{Duk.Widget}      			parent          The parent widget
 * @return	{Duk.Widget}				Returns the new Widget object
 */
Duk.Widget = function(parameters, manager, root, parent) {

	var me = this;

	/**
	 * A reference to this function
	 * @type {Duk.Widget}
	 */
	this.me = this;

	/**
	 * Reference to the manager
	 * @type	{Duk.Manager}
	 */
	this.manager = manager;

	/**
	 * The calculations of the dimensions (based on this.inst instructions
	 */
	this.calc = {};
	
	// Up the idLast of the manager
	manager.idLast++;
	
	// Set this number in the widget itself
	this.id = manager.idLast;
	
	// Add the widget to the list
	manager.widgets[this.id] = this;

	this.type = parameters.type;

	/**
	 * The parent of this widget (if it exists)
	 * @type {Duk.Widget|null}
	 */
	this.parent = parent ? parent : {};

	/**
	 * The top parent of this widget (if it exists)
	 * @type {Duk.Widget|null}
	 */
	this.root = root ? root : null;

	/**
	 * Are we a widget, a child of a dialog?
	 */
	this.isChild = parent ? true : false;

	if (!this.isChild) {
		this.parent.width = manager.dimensions.width;
		this.parent.height = manager.dimensions.height;
	}

	/**
	 * Our children widgets
	 * @type {Array.<Duk.Widget>}
	 */
	this.widgets = [];

	this.textblock = false; // Store the textblock in here after the first calculation
	// Get the basic instructions from the parameters if they exist there
	/**
	 * The instructions by which the dimensions will be calculated
	 * @type object
	 */
	this.inst = {};

	/**
	 * @type	{Duk.Instructions}
	 */
	this.dimensions = new Duk.Instructions(parameters, manager, parent ? parent.dimensions : manager.dimensions);

	/**
	 * @type	{Duk.Mouse}
	 */
	this.cursor = new Duk.Mouse(this, parent ? parent.cursor : manager.cursor);

	/**
	 * The instructions by which we'll calculate the x position
	 * @type {string|number}
	 * @example 10
	 * @example 10%
	 */
	this.inst.x = parameters.x ? parameters.x : x;

	/**
	 * The instructions by which we'll calculate the y position
	 * @type {string|number}
	 */
	this.inst.y = parameters.y ? parameters.y : y;

	/**
	 * The instructions by which we'll calculate the width of the widget
	 * @type {string|number}
	 */
	this.inst.width = parameters.width ? parameters.width : width;

	/**
	 * The instructions by which we'll calculate the height of the widget
	 * @type {string|number}
	 */
	this.inst.height = parameters.height ? parameters.height : height;
	this.inst.style = parameters.style ? parameters.style : windowStyles;
	this.inst.blur = parameters.blur ? parameters.blur : 4;

	this.style = {};

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

	/**
	 * Does this widget have the focus or not?
	 * @type {Boolean}
	 */
	this.focus = false;

	this.__defineGetter__("focus", function() {
		return this.dimensions.focus;
	});

	this.__defineSetter__("focus", function(val) {
		this.dimensions.focus = val;
	});

	this.focusWidget = false; // The child widget that has focus will be stored here
	this.focusexitWidget = false; // The previous child widget will be stored here
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
	if (typeof(this.inst.style) == "array") {
		for (var tstyle in this.inst.style) {
			if (manager.blueprint.styles[this.inst.style[tstyle]] !== undefined) p.merge(this.style, manager.blueprint.styles[this.inst.style[tstyle]]);
		}
	} else {
		this.style = manager.blueprint.styles[this.inst.style] !== undefined ? p.deepCopy(manager.blueprint.styles[this.inst.style]) : false;
	}

	// A dialog window is always clickable, unless otherwise defined in the parameters
	this.inst.clickable = parameters.clickable === undefined ? true : parameters.clickable;

	// A dialog window is always moveable, unless otherwise defined in the parameters
	this.inst.moveable = parameters.moveable === undefined ? true : parameters.moveable;

	// Adding a dialog widget
	this.addWidget = function(parameters) {
		deep = p.deepCopy(p.merge(parameters, {
			'widget': true
		}));
		deep['parent'] = me.calc;

		//var temp = new that.Widget(deep);
		var temp = new Duk.Widget(deep, manager, root, me);
		me.widgets.unshift(temp);
		me.rebuildMap();
		manager.draw();

	}

	/**
	 * Move a window
	 * @param dialogObject {object}
	 */
	this.move = function(x, y) {


		if (this.dimensions.moveable && !x && !y) {

			// @FIXME: Mouse should also be transfered to dimensions
			this.dimensions.ongoing.x = manager.mouse.x - this.calc.clickedX;
			this.dimensions.ongoing.y = manager.mouse.y - this.calc.clickedY;

		}


		manager.dirtyMap = true;

		// Redraw
		manager.draw();

	}

	/**
	 * Move this dialog. If an x and y position is provided it will be put there,
	 * if not the mouse position will be used of the parent
	 * @param   {Number}    [rx]     The x position we want to move it to (relative)
	 * @param   {Number}    [ry]     The y position we want to move it to (relative)
	 * @param   {Duk.Enums.Orientation} [orientation] The orientation of the move
	 */
	this.move = function(rx, ry, orientation) {
		me.dimensions.rx = rx;
		me.dimensions.ry = ry;
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
		for (var i = 0; i < me.widgets.length; i++) {
			me.widgets[i].draw();
		}
	}

	/**
	 * Populate the widgets with values and such
	 */
	this.populate = function() {
		if (me.type == 'input' && me.textblock) {
			bx = parseInt(me.dimensions.ax) + 4;
			by = parseInt(me.dimensions.ay) + 4;

			manager.ctx.fillStyle = 'rgb(0,0,0)';
			manager.ctx.font = "15pt 'Lucida Console', Monaco, monospace";
			manager.ctx.textBaseline = "top";

			manager.ctx.fillText(me.textblock.view, bx, by);

			manager.ctx.beginPath();
			manager.ctx.moveTo(bx + me.textblock.cursorpixel, by);
			manager.ctx.lineTo(bx + me.textblock.cursorpixel, by + me.textblock.height - 4);
			manager.ctx.closePath();
			manager.ctx.stroke();
		}
	}

	/**
	 * Build the widgetMap. Should only be run at creation since widget's
	 * don't normally change position INSIDE the dialog
	 */
	this.rebuildMap = function() {

		me.widgetMap = [];

		for (var i = 0; i < me.widgets.length; i++) {
			
			// What to do when the widget is over the parent's edge?
			if(me.dimensions.width < (me.widgets[i].dimensions.rx + me.widgets[i].dimensions.width) ){
				var correctedWidth = me.widgets[i].dimensions.width - ((me.widgets[i].dimensions.rx + me.widgets[i].dimensions.width) - me.dimensions.width) +1;
			} else {
				var correctedWidth = 0;
			}

			x = parseInt(me.widgets[i].dimensions.rx);
			y = parseInt(me.widgets[i].dimensions.ry);

			width = parseInt(me.widgets[i].dimensions.width) - correctedWidth;
			height = parseInt(me.widgets[i].dimensions.height);
			maxwidth = x + width;
			maxheight = y + height;

			for (var ty = y; ty <= maxheight; ty++) {
				for (var tx = x; tx <= maxwidth; tx++) {
					if (tx > 0 && ty > 0) {
						pixel = (ty * me.dimensions.width) + tx;

						if (me.widgetMap[pixel] === undefined) {
							me.widgetMap[pixel] = [];
						}
						me.widgetMap[pixel].push(me.widgets[i]);
					}
				}
			}
		}
	}

	// Recalculate certain variables
	this.recalculate = function() {

		// Store the first calculated settings in ocalc.
		if (!me.ocalc) {
			me.ocalc = p.deepCopy(me.calc);
		}

		// Set the textblock on first calculation
		if (!me.textblock) me.textblock = new manager.Textblock('15pt Monospace', 'rgb(0,0,0)', me.dimensions.width, me.dimensions.height);

	}

	// Blur the background if it's wanted
	this.blur = function() {
		if (me.dimensions.style.blur && !me.ischild) {
			var result = p.blurRegion(manager.canvas, me.dimensions.ax, me.dimensions.ay, me.dimensions.width, me.dimensions.height, me.dimensions.blur, me.dimensions.parent.width, me.dimensions.parent.height);
			manager.ctx.drawImage(result.element, result.x, result.y);
		}
	}

	// Draw the decorations
	this.decorate = function() {

		var dialog = me.dimensions.style;
		var stack = {};

		// Draw the background rectangle
		if (dialog.fillstyle &&	// If it has a regular fillstyle
			!(dialog.focusstyle && me.dimensions.focus) && // If it doesn't have a focusstyle and focus
			!(dialog.hoverstyle && me.dimensions.hover)) {
			if (dialog.bottomfill) {
				manager.ctx.fillStyle = dialog.bottomfill;
				manager.ctx.fillRect(me.dimensions.ax + 1, me.dimensions.ay + 1, me.dimensions.width - 2, me.dimensions.height - 2);
			}
			manager.ctx.fillStyle = dialog.fillstyle;
			manager.ctx.fillRect(me.dimensions.ax + 1, me.dimensions.ay + 1, me.dimensions.width - 2, me.dimensions.height - 2);
		}
		
		// Draw the background rectangle
		if (dialog.hoverstyle && me.dimensions.hover) {
			manager.ctx.fillStyle = dialog.hoverstyle.fillstyle;
			manager.ctx.fillRect(me.dimensions.ax + 1, me.dimensions.ay + 1, me.dimensions.width - 2, me.dimensions.height - 2);
		}
		
		// Draw the background rectangle
		if ((dialog.focusstyle && me.dimensions.focus) && // If it does have a focusstyle and focus
			!(dialog.hoverstyle && me.dimensions.hover)) {

			manager.ctx.fillStyle = dialog.focusstyle.fillstyle;
			manager.ctx.fillRect(me.dimensions.ax + 1, me.dimensions.ay + 1, me.dimensions.width - 2, me.dimensions.height - 2);
		}

		// Draw the border if there is one
		if (dialog.borderstyle) {
			manager.ctx.strokeStyle = dialog.borderstyle;
			manager.ctx.strokeRect(me.dimensions.ax + 1, me.dimensions.ay + 1, me.dimensions.width - 2, me.dimensions.height - 2)
		}

		// Render every layer
		for (var layer in dialog.layers) {

			var d = {
				width: dialog.layers[layer]['width'],
				// The actual width of the item
				height: dialog.layers[layer]['height'],
				// The actual height of the item
				loopWidth: 0,
				// The cumulating width of the items
				loopHeight: 0,
				// The cumulating height of the items
				useWidth: dialog.layers[layer]['width'],
				// The width to use for drawing
				useHeight: dialog.layers[layer]['height'],
				// The height to use for drawing
				repeatx: 0,
				repeaty: 0,
				repeatv: dialog.layers[layer].repeatv,
				repeath: dialog.layers[layer].repeath,
				offset: dialog.layers[layer].offset,
				wantedWidth: dialog.layers[layer]['width'],
				wantedHeight: dialog.layers[layer]['height']
			}

			if (d.repeath) d.wantedWidth = me.dimensions.width;
			if (d.repeatv) d.wantedHeight = me.dimensions.height;

			// Calculate the total offset
			d.offsettop = d.offset[0];
			d.offsetright = d.offset[1];
			d.offsetbottom = d.offset[2];
			d.offsetleft = d.offset[3];

			if (dialog.layers[layer].stackw !== undefined) d.offsetleft += stack[dialog.layers[layer].stackw]['width'];
			if (dialog.layers[layer].stackh !== undefined) d.offsettop += stack[dialog.layers[layer].stackh]['height'];

			// Recalculate the wanted sized
			d.wantedWidth = d.wantedWidth - (d.offsetleft + d.offsetright);
			d.wantedHeight = d.wantedHeight - (d.offsettop + d.offsetbottom);

			do {

				todo = 0;

				dx = me.dimensions.ax + (d.repeatx * d.width) + d.offsetleft;
				dy = me.dimensions.ay + (d.repeaty * d.height) + d.offsettop;

				manager.ctx.drawImage( // Draw to the buffer
				manager.images[dialog['tileset']]['image'], // The image to use
				dialog.layers[layer]['sx'], // The source x on the image
				dialog.layers[layer]['sy'], // The source y on the image
				d.useWidth, // The source width
				d.useHeight, // The source height
				dx, dy, d.useWidth, d.useHeight);

				if (d.repeatx == 0) d.loopWidth = d.useWidth;

				if (dialog.layers[layer].repeath) {
					d.wantedWidth -= d.useWidth;
					if (d.repeatx > 0) d.loopWidth += d.useWidth;
					d.repeatx++;
					if (d.wantedWidth < d.useWidth) d.useWidth = d.wantedWidth;
					todo += d.wantedWidth;
				}

				if (d.repeaty == 0) d.loopHeight = d.useHeight;

				if (dialog.layers[layer].repeatv) {

					d.wantedHeight -= d.useHeight;
					if (d.repeaty > 0) d.loopHeight += d.useHeight;
					d.repeaty++;
					if (d.wantedHeight < d.useHeight) d.useHeight = d.wantedHeight;
					todo += d.wantedHeight;
				}

			} while (todo > 0);

			if (dialog.layers[layer].stackw !== undefined) {
				d.loopWidth += stack[dialog.layers[layer].stackw]['width'];
			}

			if (dialog.layers[layer].stackh !== undefined) {
				d.loopHeight += stack[dialog.layers[layer].stackh]['height'];
			}

			// We'll store how much space everything takes in here, needed for stacks
			stack[layer] = {
				'width': d.loopWidth,
				'height': d.loopHeight
			};

		}

	}

	/**
	 *  Get the widget object
	 *  @param	x		{int}	The x position or calculated pixel
	 *  @param	y		{int}
	 *  @param click	{bool}
	 *  @returns	{object|boolean}		The object we've clicked, or false if there's nothing there
	 */
	this.getWidget = function(x, y, click) {

		var returnObject = false;
		
		if(y === undefined) {
			var pixel = x;
		} else {
			var pixel = (y * me.dimensions.width) + x;
		}

		if (me.widgetMap[pixel] !== undefined) {
			returnObject = me.widgetMap[pixel][0];

			if (click && returnObject) {
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
	 * @param	x		{int}
	 * @param	y		{int}
	 */
	this.event.mousemove = function(x, y) {

		me.mouse.x = x - me.calc.rx;
		me.mouse.y = y - me.calc.ry;
		me.mouse.pixel = (me.mouse.y * me.dimensions.width) + me.mouse.x;



		if (!me.ischild) { // This never gets executed in a child widget, only the top parent
			if (me.widgetMap[me.mouse.pixel] !== undefined) {
				me.widgetMap[me.mouse.pixel][0].event.mousemove(me.mouse.x, me.mouse.y);
			} else {
				if (manager.mouse.down && !me.mouse.dialogDown) {
					manager.moveDialog(manager.mouse.dialogDown, manager.mouse.x, manager.mouse.y);
					//manager.mouse.dialogDown.dimensions.move(manager.mouse.x, manager.mouse.y);
					//me.move();
				}
			}

			if (me.mouse.overexitDialog !== me.mouse.overDialog) {
				if (me.mouse.overexitDialog) me.mouse.overexitDialog.event.hoverlost();
				if (me.mouse.overDialog) me.mouse.overDialog.event.hover();
			}



		} else {
			// This only gets executed in a widget inside a parent
		}


	}

	this.event.hoverlost = function() {
		if (!me.focus) {
			me.style.fillstyle = me.ocalc.style.fillstyle;
			manager.draw();
		} else {

		}
	}

	this.event.hover = function() {
		if (!me.focus) {
			me.style.fillstyle = 'rgba(255,0,0, 0.5)';
			manager.draw();
		} else {

		}
	}

	this.event.focuslost = function() {

		// Take away my focus status
		me.focus = false;

		// Reset the focusWidget
		manager.focusWidget = false;

		// Send the focuslost signal to my widget that has focus
		if (me.focusWidget) me.focusWidget.event.focuslost();

		manager.draw();
	}

	this.event.focus = function() {

		if (!me.focus) { // If we didn't have focus before
			me.focus = true;

			// Only 1 thing can ever have focus, set that
			manager.focusWidget = me;
		}

		manager.draw();
	}

	this.event.mousedown = function(x, y) {
		me.mouse.downx = x - me.dimensions.rx;
		me.mouse.downy = y - me.dimensions.ry;
		me.mouse.downpixel = (me.mouse.downy * me.dimensions.width) + me.mouse.downx;

		me.mouse.up = false;
		me.mouse.down = true;
		me.mouse.dialogDown = me.getWidget(me.mouse.downx, me.mouse.downy);
		if (me.mouse.dialogDown) me.mouse.dialogDown.event.mousedown(me.mouse.downx, me.mouse.downy);

	}

	this.event.mouseup = function(x, y) {

		// Calculate the relative positions of the up clicks
		me.mouse.upx = x - me.dimensions.rx;
		me.mouse.upy = y - me.dimensions.ry;
		me.mouse.uppixel = (me.mouse.upy * me.calc.width) + me.mouse.upx;

		// Store the previous focused dialog
		manager.focusexitDialog = manager.focusDialog;

		// If this isn't a child, make me the curent dialog
		if (!me.ischild) manager.focusDialog = me;

		// If the previous focussed dialog is different from the current
		// focussed dialog, send the focuslost event
		if (manager.focusexitDialog != manager.focusDialog) {
			if (manager.focusexitDialog) manager.focusexitDialog.event.focuslost();
		}

		// Whatever I am, give me focus
		me.event.focus();

		// Now for our children widgets
		// Store our previous focused widget
		me.focusexitWidget = me.focusWidget

		// Get the widget we clicked on now
		me.focusWidget = me.getWidget(me.mouse.upx, me.mouse.upy);

		// If they're different, switch the focus
		if (me.focusexitWidget != me.focusWidget) {

			if (me.focusexitWidget) me.focusexitWidget.event.focuslost();

			// Send it the focus signal, too
			if (me.focusWidget) me.focusWidget.event.focus();

		}

		me.mouse.up = true;
		me.mouse.down = false;
		me.mouse.dialogUp = me.getWidget(me.mouse.upx, me.mouse.upy);
		if (me.mouse.dialogUp) me.mouse.dialogUp.event.mouseup(me.mouse.upx, me.mouse.upy);

	}

	this.event.keypress = function(e) {
		me.textblock.keypress(e);

		manager.draw();
	}

	// Only the top dialog should rebuild this
	if (!this.ischild) this.rebuildMap();
	
	// Let the manager rebuild it too
	if(manager) manager.rebuildMap();

	// Calculate everything a first time
	this.recalculate();

}