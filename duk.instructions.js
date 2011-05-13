
/**
 * The Instructions class
 * @param	{Duk.Types.Plan}    plan		Plan for position and dimension
 * @param	{Duk.Manager}               manager		    The manager
 * @param	{Duk.Instructions} 	[parent]	    This widget's parent's instructions
 * @return	{Duk.Instructions}			        Returns the new instructions object
 */
Duk.Instructions = function(plan, manager, parent){

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
    if(!this.parent) {
    
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
    
    ongoing.focus = false;
    this.ongoing = ongoing;
    this.moveable = ongoing.moveable;
	
    this.__defineGetter__("focus", function(){
            return ongoing.focus;
    });
    
    this.__defineSetter__("focus", function(val){
            
            ongoing.focus = val;
            
            if(ongoing.focus){
                    ongoing.style.fillstyle = ongoing.style.focusstyle.fillstyle;
            } else {
                    ongoing.style.fillstyle = original.style.fillstyle;
            }
    });

   /**
    * Return the calculated style object
    */
    this.__defineGetter__("style", function(){
        
        if(!ongoing.style) {
                if(typeof(pattern.style) == "array") {
                        for(var tstyle in pattern.style){
                                if(manager.blueprint.styles[pattern.style[tstyle]] !== undefined) p.merge(ongoing.style, manager.blueprint.styles[pattern.style[tstyle]]);
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
    this.__defineGetter__("rx", function(){
        
        if(!original.rx) {
    
                // Calculate the x and y if they're percentages
                if(typeof(pattern.x) == 'string' && pattern.x.indexOf('%') > 0) {
                        xextra = 0;
                        ongoing.rx = (this.parent.width * (parseInt(pattern.x.replace('%', '')) / 100)) - xextra;
                } else { // They're not percentages, so get their value
                        ongoing.rx = parseInt(pattern.x);
                }
        }
        
        return ongoing.rx;
    });
   
   /**
    * Return the calculated ax
    */
    this.__defineGetter__("ax", function(){
        
        // If this doesn't have a parent, the ry is the rx
        if(!parent){
            ongoing.ax = this.rx;
        } else {
	    ongoing.ax = this.rx + parent.rx;
        }
	
        return ongoing.ax;
    });
	
    /**
     * Return the calculated ry
     */
    this.__defineGetter__("ry", function(){
        
        if(!original.ry) {
    
                // Calculate if it's a percentage
                if(typeof(pattern.y) == 'string' && pattern.y.indexOf('%') > 0) {
                        yextra = 0;
                        
                        ongoing.ry = (this.parent.height * (parseInt(pattern.y.replace('%', '')) / 100)) - yextra;
                } else { // They're not percentages, so get their value
                        ongoing.ry = parseInt(pattern.y);
                }
        }
        
        return ongoing.ry;
    });

    /**
     * Return the calculated ay
     */
    this.__defineGetter__("ay", function(){
        
        // If this doesn't have a parent, the ry is the rx
        if(!parent){
            ongoing.ay = this.ry;
        } else {
            ongoing.ay = this.ry + parent.ry;
        }
        
        return ongoing.ay;
    });
    
    /**
     * Return the calculated width
     */
    this.__defineGetter__("width", function(){
        var width = String(pattern.width);
        if(width.indexOf('%') > 0) {
                ongoing.width = this.parent.width * (parseInt(width.replace('%', '')) / 100);
        } else {
                ongoing.width = parseInt(width);
        }
        return ongoing.width;
    });
    
    /**
     * Return the calculated width
     */
    this.__defineGetter__("height", function(){
        var height = String(pattern.height);
        if(height.indexOf('%') > 0) {
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
    * For some reason, Komdo can't autocomplete these classes when they don't
    * contain a function. So we'll make an empty one, that gets deleted at
    * compile anyway
    */
   this._workaround = function(){};
   
}