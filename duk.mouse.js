
/**
 * The Mouse class
 * @param	{Duk.Widget}	owner		The mouse object's widget, its owner
 * @param	{Duk.Mouse}		[parent]	The widget's parent's mouse object
 * @return	{Duk.Mouse}			    	Returns the new mouse object
 */
Duk.Mouse = function(owner, parent){

	/**
     * The continuously used calculations. Change constantly
     * @type {Duk.Types.Mouse}
     */
	this._ongoing = {};
	
	/**
	 * The owner
	 * @type {Duk.Widget}
	 */
	this._owner = owner;
	
	/**
	 * The parent
	 * @type {Duk.Mouse}
	 */
	this._parent = parent;
	
    /**
     * Return the rx
     */
    this.__defineGetter__("rx", function(){
        return this._ongoing.rx;
    });
	
    /**
     * Return the ry
     */
    this.__defineGetter__("ry", function(){
        return this._ongoing.ry;
    });
	
    /**
     * Return the absolute x
     */
    this.__defineGetter__("ax", function(){
		return parent.ax ? this._ongoing.rx + parent.ax : this._ongoing.rx;
    });
	
    /**
     * Return the absolute x
     */
    this.__defineGetter__("ay", function(){
        return parent.ay ? this._ongoing.ry + parent.ay : this._ongoing.ry;
    });
	
    /**
     * Return the relative pixel
     */
    this.__defineGetter__("rpixel", function(){
        return this._ongoing.rpixel;
    });

    /**
     * Return the absolute pixel
     */
    this.__defineGetter__("apixel", function(){
        return this._ongoing.apixel;
    });
	
	/**
	 * For some reason, Komdo can't autocomplete these classes when they don't
	 * contain a function. So we'll make an empty one, that gets deleted at
	 * compile anyway
	 */
	this._workaround = function(){};

}

/**
 * Set position
 * @param	{Number}	px	X-position on the parent
 * @param	{Number}	py	Y-position on the parent
 */
Duk.Mouse.prototype.setPosition = function(px, py, wx, wy){
	
	// Our relative position is the position on the parent - our dialog position
	this._ongoing.rx = px - this._owner.dimensions.rx;
	this._ongoing.ry = py - this._owner.dimensions.ry;
	
	// The pixel we're over
	this._ongoing.rpixel = (this._ongoing.ry * this._owner.dimensions.width) + this._ongoing.rx;
	
	// The absolute pixel we're over
	if(parent){
		this._ongoing.apixel = this._parent.rpixel + this._ongoing.rpixel;
	} else {
		this._ongoing.apixel = this._ongoing.rpixel;
	}
	
	// Set the previous widget we were over
	this._ongoing.interaction.overPrevious = this._ongoing.interaction.over;
	
	// Set the curent widget we're over
	this._ongoing.interaction.over = this._owner.getWidget(this.rpixel);
	
	// Bubble the mousemove up to our children
	if(this._ongoing.interaction.over !== undefined) {
		this._ongoing.interaction.over.cursor.setPosition(this.rx, this.ry);
	}
	
	// If one of our children has lost hover, tell them
	if(this._ongoing.interaction.overPrevious !== this._ongoing.interaction.over){
		
		// Tell the previous one it lost hover (mouseexit)
		this._ongoing.interaction.overPrevious.cursor.setHover(false);
		
		// Tell the next one it has gained it (mouseenter)
		this._ongoing.interaction.over.cursor.setHover(true);
		
	}
}

/**
 * Set hover
 * @param	{Boolean}	hover	Are we hovering over this or not?
 */
Duk.Mouse.prototype.setHover = function(hover){
	
	// If we're just being hovered, someone has entered us.
	if(!this._ongoing.state.hover & hover){
		// Mouse enter
		
	} else {
		
		// If we had hover, but we lost it, someone has exited us
		if(this._ongoing.state.hover & !hover){
			// Mouse exit
			
		}
	}
}