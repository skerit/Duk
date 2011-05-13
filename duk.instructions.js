/**
 * The Instructions class
 * @param	{Duk.Types.Plan}    plan		Plan for position and dimension
 * @param	{Duk.Manager}               manager		    The manager
 * @param	{Duk.Instructions} 	[parent]	    This widget's parent's instructions
 * @return	{Duk.Instructions}			        Returns the new instructions object
 */
Duk.Instructions = function(plan, manager, parent) {

    /**
     * Instructions deviated from the original plan. Will not be modified.
     * @type {Duk.Types.Pattern}
     */
    var pattern = {};

    /**
     * The instructions by which we'll calculate the x position
     * @type {String|Number}
     * @example 10
     * @example 10%
     */
    pattern.x = plan.x ? plan.x : 0;

    /**
     * The instructions by which we'll calculate the y position
     * @type {String|Number}
     */
    pattern.y = plan.y ? plan.y : 0;

    /**
     * The instructions by which we'll calculate the width of the widget
     * @type {String|Number}
     */
    pattern.width = plan.width ? plan.width : 0;
    
    /**
     * Is this widget moveable or not?
     * @type {Boolean}
     */
    this.moveable = plan.moveable;
    
    /**
     * Is this widget clickable or not?
     * @type {Boolean}
     */
    this.clickable = plan.clickable;

    /**
     * The instructions by which we'll calculate the height of the widget
     * @type {String|Number}
     */
    pattern.height = plan.height ? plan.height : 0;
    pattern.style = plan.style ? plan.style : null;
    pattern.blur = plan.blur ? plan.blur : 4;

    this.blur = pattern.blur;

    /**
     * The first calculation (the opening coördinates)
     * @type {Duk.Types.Patternuse}
     */
    var original = {};

    /**
     * The previous used calculations.
     * @type {Duk.Types.Patternuse}
     */
    var previous = {};

    /**
     * The continuously used calculations. Change constantly
     * @type {Duk.Types.Patternuse}
     */
    var ongoing = {};

    /**
     * The widget's relative x position to its parent
     * @type {Number}
     */
    ongoing.rx = 0;

    /**
     * The widget's absolute x position on the manager
     * @type {Number}
     */
    ongoing.ax = 0;

    /**
     * The widget's relative y position to its parent
     * @type {Number}
     */
    ongoing.ry = 0;

    /**
     * The widget's absolute y position on the manager
     * @type {Number}
     */
    ongoing.ay = 0;

    /**
     * The widget's width
     * @type {Number}
     */
    this.width = 0;

    /**
     * The widget's height
     * @type {Number}
     */
    this.height = 0;

    /**
     * The parent instructions set
     * @type {Duk.Instructions}
     */
    this.parent = parent;

    /**
     * If this instructions does not have a parent, it's the manager.
     * The manager is not a widget, but does have an instructions object
     * to ease coding
     */
    if (!this.parent) {

    }

    /**
     * The object containing the style
     * @type {Object}
     */
    this.style = undefined;

    /**
     * The object containing the calculated style
     * @type {Object}
     */
    ongoing.style = undefined;

    /**
     * Does this widget have focus or not?
     * @type {Boolean}
     */
    this.focus = false;

    /**
     * Does this widget have hover or not?
     * @type    {Boolean}
     */
    this.hover = false;
    
	/**
	 * Is this widget globally moveable?
	 * @type	{Boolean}
	 */
	this.globalmove = plan.globalmove;

    ongoing.focus = false;
    ongoing.hover = false;

    this.ongoing = ongoing;
    
	/**
	 * Get the rpixel
	 */
    this.__defineGetter__("rpixel", function() {
        ongoing.rpixel = (ongoing.ry * (this.parent ? this.parent.rpixel : 0)) + ongoing.rx;
        return ongoing.rpixel;
    });
    
	/**
	 * Get the apixel
	 */
    this.__defineGetter__("apixel", function() {
        return this.rpixel + parent.rpixel;
    });
    
	/**
	 * Get the Z position.
	 * If it's a child, get the root's Z
	 */
    this.__defineGetter__("z", function() {
        
        // If the parent is the manager, return our Z
        if(this.parent == manager.dimensions) return ongoing.z;
		else return this.parent.z - 1; // Always subtract 1. This will then happen for each "layer"
    });
    
	/**
	 * Set the Z position.
	 * If it's a child, set the parent's Z
	 */
    this.__defineSetter__("z", function(val) {
        
        // If there is no parent, or the parent is the manager, set this z
        if(!this.parent || this.parent == manager.dimensions) ongoing.z = val;
		else this.parent.z = val;
    });

    this.__defineGetter__("focus", function() {
        return ongoing.focus;
    });

    /**
     * Set focus true or false
     */
    this.__defineSetter__("focus", function(val) {

        ongoing.focus = val;

		/**
		 * No longer needed: fillstyles are handled at decorating
        if (ongoing.focus) {
            ongoing.style.fillstyle = ongoing.style.focusstyle.fillstyle;
        } else {
            ongoing.style.fillstyle = original.style.fillstyle;
        }*/
    });

    this.__defineGetter__("hover", function() {
        return ongoing.hover;
    });

    /**
     * Set focus true or false
     */
    this.__defineSetter__("hover", function(val) {

        ongoing.hover = val;

		/**
		 * No longer needed: fillstyles are handled at decorating
        if (ongoing.hover && ongoing.style.hoverstyle) {
            ongoing.style.fillstyle = ongoing.style.hoverstyle.fillstyle
        } else {
            ongoing.style.fillstyle = original.style.fillstyle;
        }*/
        
        manager.draw();
    });

    /**
     * Return the calculated style object
     */
    this.__defineGetter__("style", function() {

        if (!ongoing.style) {
            if (typeof(pattern.style) == "array") {
                for (var tstyle in pattern.style) {
                    if (manager.blueprint.styles[pattern.style[tstyle]] !== undefined) p.merge(ongoing.style, manager.blueprint.styles[pattern.style[tstyle]]);
                }
            } else {
                ongoing.style = manager.blueprint.styles[pattern.style] !== undefined ? p.deepCopy(manager.blueprint.styles[pattern.style]) : false;
                previous = p.deepCopy(ongoing);
            }
        }

        return ongoing.style;
    });

    /**
     * Return the calculated rx
     */
    this.__defineGetter__("rx", function() {

        if (!original.rx) {

            // Calculate the x and y if they're percentages
            if (typeof(pattern.x) == 'string' && pattern.x.indexOf('%') > 0) {
                xextra = 0;
                ongoing.rx = parseInt((this.parent.width * (parseInt(pattern.x.replace('%', '')) / 100)) - xextra);
            } else { // They're not percentages, so get their value
                ongoing.rx = parseInt(pattern.x);
            }
        }

        return ongoing.rx;
    });
    
    /**
     * Set the rx
     */
    this.__defineSetter__("rx", function(val) {
        
        // Set the rx
        ongoing.rx = val;

    });
    
    /**
     * Set the ry
     */
    this.__defineSetter__("ry", function(val) {
        
        // Set the rx
        ongoing.ry = val;
        
    });

    /**
     * Return the calculated ax
     */
    this.__defineGetter__("ax", function() {

        // If this doesn't have a parent, the ry is the rx
        if (!parent) {
            ongoing.ax = this.rx;
        } else {
            ongoing.ax = this.rx + parent.rx;
        }

        return ongoing.ax;
    });

    /**
     * Return the calculated ry
     */
    this.__defineGetter__("ry", function() {

        if (!original.ry) {

            // Calculate if it's a percentage
            if (typeof(pattern.y) == 'string' && pattern.y.indexOf('%') > 0) {
                yextra = 0;

                ongoing.ry = parseInt((this.parent.height * (parseInt(pattern.y.replace('%', '')) / 100)) - yextra);
            } else { // They're not percentages, so get their value
                ongoing.ry = parseInt(pattern.y);
            }
        }

        return ongoing.ry;
    });

    /**
     * Return the calculated ay
     */
    this.__defineGetter__("ay", function() {

        // If this doesn't have a parent, the ry is the rx
        if (!parent) {
            ongoing.ay = this.ry;
        } else {
            ongoing.ay = this.ry + parent.ry;
        }

        return ongoing.ay;
    });

    /**
     * Return the calculated width
     */
    this.__defineGetter__("width", function() {
        var width = String(pattern.width);
        if (width.indexOf('%') > 0) {
            ongoing.width = this.parent.width * (parseInt(width.replace('%', '')) / 100);
        } else {
            ongoing.width = parseInt(width);
        }
        return ongoing.width;
    });

    /**
     * Return the calculated width
     */
    this.__defineGetter__("height", function() {
        var height = String(pattern.height);
        if (height.indexOf('%') > 0) {
            ongoing.height = this.parent.height * (parseInt(height.replace('%', '')) / 100);
        } else {
            ongoing.height = parseInt(height);
        }
        return ongoing.height;
    });

    // Do a first calculation
    original.clickable = plan.clickable;
    original.height = this.height;
    original.moveable = plan.moveable;
    original.style = p.deepCopy(this.style);
    original.width = this.width;
    original.rx = this.rx;
    original.ry = this.ry;
    original.ax = this.ax;
    original.ay = this.ay;
    
    /**
     * Set the beginning Z (if it sticks, maybe the parent already has one.)
     * @FIXME   Anytime a child is added to the parent, the entire root will get focus
     */
    this.z = p.now();

    /**
     * For some reason, Komdo can't autocomplete these classes when they don't
     * contain a function. So we'll make an empty one, that gets deleted at
     * compile anyway
     */
    this._workaround = function() {};

}