/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The list widget displays the data of a model in a list.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *
 *    // Data for the list
 *    var data = [
 *       {title : "Row1", subtitle : "Sub1"},
 *       {title : "Row2", subtitle : "Sub2"},
 *       {title : "Row3", subtitle : "Sub3"}
 *   ];
 *
 *   // Create the list with a delegate that
 *   // configures the list item.
 *   var list = new qx.ui.mobile.list.List({
 *     configureItem : function(item, data, row)
 *     {
 *       item.setTitle(data.title);
 *       item.setSubtitle(data.subtitle);
 *       item.setShowArrow(true);
 *     }
 *   });
 *
 *   // Set the model of the list
 *   list.setModel(new qx.data.Array(data));
 *
 *   // Add an changeSelection event
 *   list.addListener("changeSelection", function(evt) {
 *     alert("Index: " + evt.getData())
 *   }, this);
 *
 *   this.getRoot().add(list);
 * </pre>
 *
 * This example creates a list with a delegate that configures the list item with
 * the given data. A listener for the event {@link #changeSelection} is added.
 */
qx.Class.define("qx.ui.mobile.list.List",
{
  extend : qx.ui.mobile.core.Widget,


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param delegate {Object?null} The {@link #delegate} to use
   */
  construct : function(delegate)
  {
    this.base(arguments);
    this.addListener("tap", this._onTap, this);
    this.__provider = new qx.ui.mobile.list.provider.Provider(this);
    if (delegate) {
      this.setDelegate(delegate);
    }

    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this._onChangeLocale, this);
    }

    this._setLayout(new qx.ui.mobile.layout.VBox());
  },


 /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the selection is changed.
     */
    changeSelection : "qx.event.type.Data"
  },


  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "list"
    },


    /**
     * Delegation object which can have one or more functions defined by the
     * {@link qx.ui.mobile.list.IListDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      event: "changeDelegate",
      init: null,
      nullable: true
    },


    /**
     * The model to use to render the list.
     */
    model :
    {
      check : "qx.data.Array",
      apply : "_applyModel",
      event: "changeModel",
      nullable : true,
      init : null
    },


    /**
     * Number of items to display. Auto set by model.
     * Reset to limit the amount of data that should be displayed.
     */
    itemCount : {
      check : "Integer",
      init : 0
    }
  },


 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __provider : null,


    // overridden
    _getTagName : function()
    {
      return "ul";
    },


    /**
     * Event handler for the "tap" event.
     *
     * @param evt {qx.event.type.Tap} The tap event
     */
    _onTap : function(evt)
    {
      var element = evt.getOriginalTarget();
      var index = -1;

      // Click on border: do nothing.
      if(element.tagName == "UL") {
        return;
      }

      while (element.tagName != "LI") {
        element = element.parentNode;
      }
      if (qx.bom.element.Attribute.get(element, "data-selectable") != "false"
          && qx.dom.Element.hasChild(this.getContainerElement(), element))
      {
        index = qx.dom.Hierarchy.getElementIndex(element);
      }
      if (index != -1) {
        this.fireDataEvent("changeSelection", index);
      }
    },


    // property apply
    _applyModel : function(value, old)
    {
      if (old != null) {
        old.removeListener("changeBubble", this.__onModelChangeBubble, this);
      }
      if (value != null) {
        value.addListener("changeBubble", this.__onModelChangeBubble, this);
      }

      if (old != null) {
        old.removeListener("change", this.__onModelChange, this);
      }
      if (value != null) {
        value.addListener("change", this.__onModelChange, this);
      }

      if (old != null) {
        old.removeListener("changeLength", this.__onModelChangeLength, this);
      }
      if (value != null) {
        value.addListener("changeLength", this.__onModelChangeLength, this);
      }


      this.__render();
    },


    // property apply
    _applyDelegate : function(value, old) {
      this.__provider.setDelegate(value);
    },


    /**
     * Listen on model 'changeLength' event.
     * @param evt {qx.event.type.Data} data event which contains model change data.
     */
    __onModelChangeLength : function(evt) {
      this.__render();
    },

    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        this.__render();
      },

      "false" : null
    }),


    /**
     * Reacts on model 'change' event.
     * @param evt {qx.event.type.Data} data event which contains model change data.
     */
    __onModelChange : function(evt) {
      if(evt && evt.getData() && evt.getData().type == "order") {
        this.__render();
      }
    },


    /**
     * Reacts on model 'changeBubble' event.
     * @param evt {qx.event.type.Data} data event which contains model changeBubble data.
     */
    __onModelChangeBubble : function(evt)
    {
      if(evt) {
        var data = evt.getData();
        var isArray = (qx.lang.Type.isArray(data.old) && qx.lang.Type.isArray(data.value));
        if(!isArray || (isArray && data.old.length == data.value.length)) {
          var rows = this._extractRowsToRender(data.name);

          for (var i=0; i < rows.length; i++) {
            this.__renderRow(rows[i]);
          }
        }
      }
    },


    /**
     * Extracts all rows, which should be rendered from "changeBubble" event's
     * data.name.
     * @param name {String} The 'data.name' String of the "changeBubble" event,
     *    which contains the rows that should be rendered.
     * @return {Integer[]} An array with integer values, representing the rows which should
     *  be rendered.
     */
    _extractRowsToRender : function(name) {
      var rows = [];

      if(!name) {
        return rows;
      }

      // "[0-2].propertyName" | "[0].propertyName" | "0"
      var containsPoint = (name.indexOf(".")!=-1);
      if(containsPoint) {
        // "[0-2].propertyName" | "[0].propertyName"
        var candidate = name.split(".")[0];

        // Normalize
        candidate = candidate.replace("[","");
        candidate = candidate.replace("]","");
        // "[0-2]" | "[0]"
        var isRange = (candidate.indexOf("-") != -1);

        if(isRange) {
          var rangeMembers = candidate.split("-");
          // 0
          var startRange = parseInt(rangeMembers[0],10);
          // 2
          var endRange = parseInt(rangeMembers[1],10);

          for(var i = startRange; i <= endRange; i++) {
            rows.push(i);
          }
        } else {
          // "[0]"
          rows.push(parseInt(candidate.match(/\d+/)[0], 10));
        }
      } else {
        // "0"
        var match = name.match(/\d+/);
        if(match.length == 1) {
          rows.push(parseInt(match[0], 10));
        }
      }

      return rows;
    },


    /**
     * Renders a specific row identified by its index.
     * @param index {Integer} index of the row which should be rendered.
     */
    __renderRow : function(index) {
      var model = this.getModel();
      var element = this.getContentElement();
      var itemElement = this.__provider.getItemElement(model.getItem(index), index);

      var oldNode = element.childNodes[index];

      element.replaceChild(itemElement, oldNode);

      this._domUpdated();
    },


    /**
    * @internal
    * Returns the height of one single list item.
    * @return {Integer} the height of a list item in px.
    */
    getListItemHeight : function() {
      var listItemHeight = 0;
      if (this.getModel() != null && this.getModel().length > 0) {
        var listHeight = qx.bom.element.Style.get(this.getContentElement(), "height");
        listItemHeight = parseInt(listHeight) / this.getModel().length;
      }
      return listItemHeight;
    },


    /**
     * Renders the list.
     */
    __render : function()
    {
      this._setHtml("");

      var model = this.getModel();
      this.setItemCount(model ? model.getLength() : 0);

      var itemCount = this.getItemCount();

      var element = this.getContentElement();
      for (var index = 0; index < itemCount; index++) {
        var itemElement = this.__provider.getItemElement(model.getItem(index), index);
        element.appendChild(itemElement);
      }
      this._domUpdated();
    }
  },


 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__provider");
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * Provides a list item element for a certain row and its data.
 * Uses the {@link qx.ui.mobile.list.renderer.Default} list item renderer as a
 * default renderer when no other renderer is given by the {@link qx.ui.mobile.list.List#delegate}.
 */
qx.Class.define("qx.ui.mobile.list.provider.Provider",
{
  extend : qx.core.Object,


 /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties:
  {
    /**
     * Delegation object which can have one or more functions defined by the
     * {@link qx.ui.mobile.list.IListDelegate} interface. Set by the list.
     *
     * @internal
     */
    delegate :
    {
      event: "changeDelegate",
      init: null,
      nullable: true,
      apply : "_applyDelegate"
    }
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __itemRenderer : null,


    /**
     * Sets the item renderer.
     *
     * @param renderer {qx.ui.mobile.list.renderer.Abstract} The used item renderer
     */
    _setItemRenderer : function(renderer) {
      this.__itemRenderer = renderer;
    },


    /**
     * Returns the set item renderer.
     *
     * @return {qx.ui.mobile.list.renderer.Abstract} The used item renderer
     */
    _getItemRenderer : function() {
      return this.__itemRenderer;
    },


    /**
     * Returns the list item element for a given row.
     *
     * @param data {var} The data of the row.
     * @param row {Integer} The row index.
     *
     * @return {Element} the list item element.
     */
    getItemElement : function(data, row)
    {
      this.__itemRenderer.reset();
      this._configureItem(data, row);
      // Clone the element and all it's events
      return qx.bom.Element.clone(this.__itemRenderer.getContainerElement(), true);
    },


    /**
     * Configure the list item renderer with the given data.
     *
     * @param data {var} The data of the row.
     * @param row {Integer} The row index.
     */
    _configureItem : function(data, row)
    {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.configureItem != null) {
        delegate.configureItem(this.__itemRenderer, data, row);
      }
    },



    /**
     * Creates an instance of the item renderer to use. When no delegate method
     * is given the function will return an instance of {@link qx.ui.mobile.list.renderer.Default}.
     *
     * @return {qx.ui.mobile.list.renderer.Abstract} An instance of the item renderer.
     *
     */
    _createItemRenderer : function()
    {
      var createItemRenderer = qx.util.Delegate.getMethod(this.getDelegate(), "createItemRenderer");
      var itemRenderer = null;
      if (createItemRenderer == null)
      {
        itemRenderer = new qx.ui.mobile.list.renderer.Default();
      } else {
        itemRenderer = createItemRenderer();
      }

      return itemRenderer;
    },


    // property apply
    _applyDelegate : function(value, old)
    {
      this._setItemRenderer(this._createItemRenderer());
    }
  },

 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__itemRenderer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This class supports typical DOM element inline events like scroll,
 * change, select, ...
 */
qx.Class.define("qx.event.handler.Element",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    this._manager = manager;
    this._registeredEvents = {};
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      abort : true,    // Image elements
      load : true, // Image elements
      scroll : true,
      select : true,
      reset : true,    // Form Elements
      submit : true   // Form Elements
    },

    /** @type {MAP} Whether the event is cancelable */
    CANCELABLE :
    {
      selectstart: true
    },

    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE,

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type)
    {
      // Don't handle "load" event of Iframe. Unfortunately, both Element and
      // Iframe handler support "load" event. Should be handled by
      // qx.event.handler.Iframe only. Fixes [#BUG 4587].
      if (type === "load") {
        return target.tagName.toLowerCase() !== "iframe";
      } else {
        return true;
      }
    },


    // interface implementation
    registerEvent : function(target, type, capture)
    {
      var elementId = qx.core.ObjectRegistry.toHashCode(target);
      var eventId = elementId + "-" + type;

      var listener = qx.lang.Function.listener(this._onNative, this, eventId);
      qx.bom.Event.addNativeListener(target, type, listener);

      this._registeredEvents[eventId] =
      {
        element : target,
        type : type,
        listener : listener
      };
    },


    // interface implementation
    unregisterEvent : function(target, type, capture)
    {
      var events = this._registeredEvents;
      if (!events) {
        return;
      }

      var elementId = qx.core.ObjectRegistry.toHashCode(target);
      var eventId = elementId + "-" + type;

      var eventData = this._registeredEvents[eventId];
      if(eventData) {
        qx.bom.Event.removeNativeListener(target, type, eventData.listener);
      }

      delete this._registeredEvents[eventId];
    },



    /*
    ---------------------------------------------------------------------------
      EVENT-HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Default event handler.
     *
     * @signature function(nativeEvent, eventId)
     * @param nativeEvent {Event} Native event
     * @param eventId {Integer} ID of the event (as stored internally)
     */
    _onNative : qx.event.GlobalError.observeMethod(function(nativeEvent, eventId)
    {
      var events = this._registeredEvents;
      if (!events) {
        return;
      }

      var eventData = events[eventId];
      var isCancelable = this.constructor.CANCELABLE[eventData.type];

      qx.event.Registration.fireNonBubblingEvent(
        eventData.element, eventData.type,
        qx.event.type.Native, [nativeEvent, undefined, undefined, undefined, isCancelable]
      );
    })
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    var entry;
    var events = this._registeredEvents;

    for (var id in events)
    {
      entry = events[id];
      qx.bom.Event.removeNativeListener(entry.element, entry.type, entry.listener);
    }

    this._manager = this._registeredEvents = null;
  },






  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This class provides an unified mouse event handler for Internet Explorer,
 * Firefox, Opera and Safari
 *
 * @require(qx.event.handler.UserAction)
 * @ignore(qx.event.handler.DragDrop)
 */
qx.Class.define("qx.event.handler.Mouse",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this.__manager = manager;
    this.__window = manager.getWindow();
    this.__root = this.__window.document;

    // Initialize observers
    if (!(qx.core.Environment.get("event.touch") &&
        qx.event.handler.MouseEmulation.ON))
    {
      this._initButtonObserver();
      this._initMoveObserver();
      this._initWheelObserver();
    }

    // Include the dependency to the emulatemouse handler
    if (qx.core.Environment.get("qx.emulatemouse")) {
      qx.event.handler.MouseEmulation;
    }
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      mousemove : 1,
      mouseover : 1,
      mouseout : 1,
      mousedown : 1,
      mouseup : 1,
      click : 1,
      dblclick : 1,
      contextmenu : 1,
      mousewheel : 1
    },

    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE + qx.event.IEventHandler.TARGET_DOCUMENT + qx.event.IEventHandler.TARGET_WINDOW,

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __onButtonEventWrapper : null,
    __onMoveEventWrapper : null,
    __onWheelEventWrapper : null,
    __lastEventType : null,
    __lastMouseDownTarget : null,
    __manager : null,
    __window : null,
    __root : null,
    __preventNextClick: null,



    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    // The iPhone requires for attaching mouse events natively to every element which
    // should react on mouse events. As of version 3.0 it also requires to keep the
    // listeners as long as the event should work. In 2.0 it was enough to attach the
    // listener once.
    registerEvent : qx.core.Environment.get("os.name") === "ios" ?
      function(target, type, capture) {
        target["on" + type] = (function() {return null;});
      } : (function() {return null;}),


    // interface implementation
    unregisterEvent : qx.core.Environment.get("os.name") === "ios" ?
      function(target, type, capture) {
        target["on" + type] = undefined;
      } : (function() {return null;}),




    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */


    /**
     * Fire a mouse event with the given parameters
     *
     * @param domEvent {Event} DOM event
     * @param type {String} type of the event
     * @param target {Element} event target
     */
    __fireEvent : function(domEvent, type, target)
    {
      if (!target) {
        target = qx.bom.Event.getTarget(domEvent);
      }

      // we need a true node for the fireEvent
      // e.g. when hovering over text of disabled textfields IE is returning
      // an empty object as "srcElement"
      if (target && target.nodeType)
      {
        qx.event.Registration.fireEvent(
          target,
          type||domEvent.type,
          type == "mousewheel" ? qx.event.type.MouseWheel : qx.event.type.Mouse,
          [domEvent, target, null, true, true]
        );
      }

      // Fire user action event
      qx.event.Registration.fireEvent(this.__window, "useraction", qx.event.type.Data, [type||domEvent.type]);
    },


    /**
     * Internal target for checking the target and mouse type for mouse
     * scrolling on a feature detection base.
     *
     * @return {Map} A map containing two keys, target and type.
     */
    __getMouseWheelTarget: function(){
      // Fix for bug #3234
      var targets = [this.__window, this.__root, this.__root.body];
      var target = this.__window;
      var type = "DOMMouseScroll";

      for (var i = 0; i < targets.length; i++) {
        if (qx.bom.Event.supportsEvent(targets[i], "mousewheel")) {
          type = "mousewheel";
          target = targets[i];
          break;
        }
      };

      return {type: type, target: target};
    },


    /**
     * Helper to prevent the next click.
     * @internal
     */
    preventNextClick : function() {
      this.__preventNextClick = true;
    },



    /*
    ---------------------------------------------------------------------------
      OBSERVER INIT
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes the native mouse button event listeners.
     *
     * @signature function()
     */
    _initButtonObserver : function()
    {
      this.__onButtonEventWrapper = qx.lang.Function.listener(this._onButtonEvent, this);

      var Event = qx.bom.Event;

      Event.addNativeListener(this.__root, "mousedown", this.__onButtonEventWrapper);
      Event.addNativeListener(this.__root, "mouseup", this.__onButtonEventWrapper);
      // do not register click events on IE with emulate mouse on
      if (!(
        qx.event.handler.MouseEmulation.ON &&
        qx.core.Environment.get("event.mspointer") &&
        qx.core.Environment.get("device.touch")
      )) {
        Event.addNativeListener(this.__root, "click", this.__onButtonEventWrapper);
      }
      Event.addNativeListener(this.__root, "dblclick", this.__onButtonEventWrapper);
      Event.addNativeListener(this.__root, "contextmenu", this.__onButtonEventWrapper);
    },


    /**
     * Initializes the native mouse move event listeners.
     *
     * @signature function()
     */
    _initMoveObserver : function()
    {
      this.__onMoveEventWrapper = qx.lang.Function.listener(this._onMoveEvent, this);

      var Event = qx.bom.Event;

      Event.addNativeListener(this.__root, "mousemove", this.__onMoveEventWrapper);
      Event.addNativeListener(this.__root, "mouseover", this.__onMoveEventWrapper);
      Event.addNativeListener(this.__root, "mouseout", this.__onMoveEventWrapper);
    },


    /**
     * Initializes the native mouse wheel event listeners.
     *
     * @signature function()
     */
    _initWheelObserver : function()
    {
      this.__onWheelEventWrapper = qx.lang.Function.listener(this._onWheelEvent, this);
      var data = this.__getMouseWheelTarget();
      qx.bom.Event.addNativeListener(
        data.target, data.type, this.__onWheelEventWrapper
      );
    },






    /*
    ---------------------------------------------------------------------------
      OBSERVER STOP
    ---------------------------------------------------------------------------
    */

    /**
     * Disconnects the native mouse button event listeners.
     *
     * @signature function()
     */
    _stopButtonObserver : function()
    {
      var Event = qx.bom.Event;

      Event.removeNativeListener(this.__root, "mousedown", this.__onButtonEventWrapper);
      Event.removeNativeListener(this.__root, "mouseup", this.__onButtonEventWrapper);
      // do not unregister click events on IE with emulate mouse on
      if (!(
        qx.event.handler.MouseEmulation.ON &&
        qx.core.Environment.get("event.mspointer") &&
        qx.core.Environment.get("device.touch")
      )) {
        Event.removeNativeListener(this.__root, "click", this.__onButtonEventWrapper);
      }
      Event.removeNativeListener(this.__root, "dblclick", this.__onButtonEventWrapper);
      Event.removeNativeListener(this.__root, "contextmenu", this.__onButtonEventWrapper);
    },


    /**
     * Disconnects the native mouse move event listeners.
     *
     * @signature function()
     */
    _stopMoveObserver : function()
    {
      var Event = qx.bom.Event;

      Event.removeNativeListener(this.__root, "mousemove", this.__onMoveEventWrapper);
      Event.removeNativeListener(this.__root, "mouseover", this.__onMoveEventWrapper);
      Event.removeNativeListener(this.__root, "mouseout", this.__onMoveEventWrapper);
    },


    /**
     * Disconnects the native mouse wheel event listeners.
     *
     * @signature function()
     */
    _stopWheelObserver : function()
    {
      var data = this.__getMouseWheelTarget();
      qx.bom.Event.removeNativeListener(
        data.target, data.type, this.__onWheelEventWrapper
      );
    },






    /*
    ---------------------------------------------------------------------------
      NATIVE EVENT OBSERVERS
    ---------------------------------------------------------------------------
    */

    /**
     * Global handler for all mouse move related events like "mousemove",
     * "mouseout" and "mouseover".
     *
     * @signature function(domEvent)
     * @param domEvent {Event} DOM event
     */
    _onMoveEvent : qx.event.GlobalError.observeMethod(function(domEvent) {
      this.__fireEvent(domEvent);
    }),


    /**
     * Global handler for all mouse button related events like "mouseup",
     * "mousedown", "click", "dblclick" and "contextmenu".
     *
     * @signature function(domEvent)
     * @param domEvent {Event} DOM event
     */
    _onButtonEvent : qx.event.GlobalError.observeMethod(function(domEvent)
    {
      var type = domEvent.type;
      var target = qx.bom.Event.getTarget(domEvent);

      if (type == "click" && this.__preventNextClick) {
        delete this.__preventNextClick;
        return;
      }

      // Safari (and maybe gecko) takes text nodes as targets for events
      // See: http://www.quirksmode.org/js/events_properties.html
      if (
        qx.core.Environment.get("engine.name") == "gecko" ||
        qx.core.Environment.get("engine.name") == "webkit"
      ) {
        if (target && target.nodeType == 3) {
          target = target.parentNode;
        }
      }

      // prevent click events on drop during Drag&Drop [BUG #6846]
      var isDrag = qx.event.handler.DragDrop &&
        this.__manager.getHandler(qx.event.handler.DragDrop).isSessionActive();
      if (isDrag && type == "click") {
        return;
      }

      if (this.__rightClickFixPre) {
        this.__rightClickFixPre(domEvent, type, target);
      }

      if (this.__doubleClickFixPre) {
        this.__doubleClickFixPre(domEvent, type, target);
      }

      this.__fireEvent(domEvent, type, target);

      if (this.__rightClickFixPost) {
        this.__rightClickFixPost(domEvent, type, target);
      }

      if (this.__differentTargetClickFixPost && !isDrag) {
        this.__differentTargetClickFixPost(domEvent, type, target);
      }

      this.__lastEventType = type;
    }),


    /**
     * Global handler for the mouse wheel event.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} DOM event
     */
    _onWheelEvent : qx.event.GlobalError.observeMethod(function(domEvent) {
      this.__fireEvent(domEvent, "mousewheel");
    }),







    /*
    ---------------------------------------------------------------------------
      CROSS BROWSER SUPPORT FIXES
    ---------------------------------------------------------------------------
    */

    /**
     * Normalizes the click sequence of right click events in Webkit and Opera.
     * The normalized sequence is:
     *
     *  1. mousedown  <- not fired by Webkit
     *  2. mouseup  <- not fired by Webkit
     *  3. contextmenu <- not fired by Opera
     *
     * @param domEvent {Event} original DOM event
     * @param type {String} event type
     * @param target {Element} event target of the DOM event.
     *
     * @signature function(domEvent, type, target)
     */
    __rightClickFixPre : qx.core.Environment.select("engine.name",
    {
      "webkit" : function(domEvent, type, target)
      {
        // The webkit bug has been fixed in Safari 4
        if (parseFloat(qx.core.Environment.get("engine.version")) < 530)
        {
          if (type == "contextmenu") {
            this.__fireEvent(domEvent, "mouseup", target);
          }
        }
      },

      "default" : null
    }),


    /**
     * Normalizes the click sequence of right click events in Webkit and Opera.
     * The normalized sequence is:
     *
     *  1. mousedown  <- not fired by Webkit
     *  2. mouseup  <- not fired by Webkit
     *  3. contextmenu <- not fired by Opera
     *
     * @param domEvent {Event} original DOM event
     * @param type {String} event type
     * @param target {Element} event target of the DOM event.
     *
     * @signature function(domEvent, type, target)
     */
    __rightClickFixPost : qx.core.Environment.select("engine.name",
    {
      "opera" : function(domEvent, type, target)
      {
        if (type =="mouseup" && domEvent.button == 2) {
          this.__fireEvent(domEvent, "contextmenu", target);
        }
      },

      "default" : null
    }),


    /**
     * Normalizes the click sequence of double click event in the Internet
     * Explorer. The normalized sequence is:
     *
     *  1. mousedown
     *  2. mouseup
     *  3. click
     *  4. mousedown  <- not fired by IE
     *  5. mouseup
     *  6. click  <- not fired by IE
     *  7. dblclick
     *
     *  Note: This fix is only applied, when the IE event model is used, otherwise
     *  the fix is ignored.
     *
     * @param domEvent {Event} original DOM event
     * @param type {String} event type
     * @param target {Element} event target of the DOM event.
     *
     * @signature function(domEvent, type, target)
     */
    __doubleClickFixPre : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent, type, target)
      {
        // Do only apply the fix when the event is from the IE event model,
        // otherwise do not apply the fix.
        if (domEvent.target !== undefined) {
          return;
        }

        if (type == "mouseup" && this.__lastEventType == "click") {
          this.__fireEvent(domEvent, "mousedown", target);
        } else if (type == "dblclick") {
          this.__fireEvent(domEvent, "click", target);
        }
      },

      "default" : null
    }),


    /**
     * If the mouseup event happens on a different target than the corresponding
     * mousedown event the internet explorer dispatches a click event on the
     * first common ancestor of both targets. The presence of this click event
     * is essential for the qooxdoo widget system. All other browsers don't fire
     * the click event so it must be emulated.
     *
     * @param domEvent {Event} original DOM event
     * @param type {String} event type
     * @param target {Element} event target of the DOM event.
     *
     * @signature function(domEvent, type, target)
     */
    __differentTargetClickFixPost : qx.core.Environment.select("engine.name",
    {
      "mshtml" : null,

      "default" : function(domEvent, type, target)
      {
        switch (type)
        {
          case "mousedown":
            this.__lastMouseDownTarget = target;
            break;

          case "mouseup":
            if (target !== this.__lastMouseDownTarget)
            {
              var commonParent = qx.dom.Hierarchy.getCommonParent(target, this.__lastMouseDownTarget);
              if (commonParent) {
                this.__fireEvent(domEvent, "click", commonParent);
              }
            }
        }
      }
    })
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (!(qx.core.Environment.get("event.touch") &&
        qx.event.handler.MouseEmulation.ON))
    {
      this._stopButtonObserver();
      this._stopMoveObserver();
      this._stopWheelObserver();
    }

    this.__manager = this.__window = this.__root =
      this.__lastMouseDownTarget = null;
  },





  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This handler is responsible for emulating mouse events based on touch events.
 * The emulation is enabled by the environment key 'qx.emulatemouse' and the
 * availability of touch events. If that's the case, the regular mouse handler will
 * be disabled and this handler takes it's place. It fakes, based on 'touchstart', 'touchmove'
 * 'touchend' and 'tap' the events for 'mousedown', 'mousemove', 'mouseup' and 'click'.
 * As additional feature, it fakes 'mousewheel' events for swipe gestures including the
 * momentum scrolling.
 *
 * @require(qx.event.handler.Touch)
 * @require(qx.event.handler.TouchCore)
 */
qx.Class.define("qx.event.handler.MouseEmulation",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,

  /**
   * @param manager {qx.event.Manager} Event manager for the window to use.
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this.__manager = manager;
    this.__window = manager.getWindow();
    this.__root = this.__window.document;

    // Initialize observers
    if (qx.event.handler.MouseEmulation.ON) {
      this._initObserver();
      document.documentElement.style.msTouchAction = "none";
    }
  },


  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_FIRST,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      mousedown : 1,
      mouseup : 1,
      mousemove : 1,
      click : 1,
      contextmenu : 1
    },

    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE + qx.event.IEventHandler.TARGET_DOCUMENT + qx.event.IEventHandler.TARGET_WINDOW,

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true,


    /** @type {Boolean} Flag which indicates if the mouse emulation should be on */
    ON : qx.core.Environment.get("qx.emulatemouse") &&
         ((qx.core.Environment.get("event.mspointer") && qx.core.Environment.get("device.touch")) ||
         (qx.core.Environment.get("event.touch") && qx.core.Environment.get("os.name") !== "win"))
  },


  members :
  {
    __manager : null,
    __window : null,
    __root : null,

    __startPos : null,
    __lastPos : null,
    __impulseTimerId : null,
    __impulseRequestId : null,


    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },



    /**
     * Fire a mouse event with the given parameters
     *
     * @param evt {Event} qooxdoo touch event
     * @param type {String} type of the event
     * @param target {var} The target of the event.
     * @return {Boolean} <code>true</code>, if the event was stoped
     */
    __fireEvent : function(evt, type, target) {
      var mouseEvent = type == "mousewheel" ?
        new qx.event.type.MouseWheel() :
        new qx.event.type.Mouse();
      mouseEvent.init(evt, target, null, true, true);
      mouseEvent.setType(type);
      return qx.event.Registration.getManager(target).dispatchEvent(target, mouseEvent);
    },


    /**
     * Helper to fire a mouse wheel event.
     * @param deltaX {Number} The delta in x direction of the wheel event.
     * @param deltaY {Number} The delta in y direction of the wheel event.
     * @param finger {Map} The first item of the fingers array of a touch event.
     * @param target {var} The target of the event.
     */
    __fireWheelEvent : function(deltaX, deltaY, finger, target) {
      // change the native fake event to include the wheel delta's
      var wheelEvent = this.__getDefaultFakeEvent(target, finger);
      wheelEvent.wheelDelta = deltaX;
      wheelEvent.wheelDeltaY = deltaY;
      wheelEvent.wheelDeltaX = deltaX;

      this.__fireEvent(wheelEvent, "mousewheel", target);
    },


    /**
     * Helper for momentum scrolling.
     * @param deltaX {Number} The deltaX from the last scrolling.
     * @param deltaY {Number} The deltaY from the last scrolling.
     * @param finger {Map} The first item of the fingers array of a touch event.
     * @param target {var} The target of the event.
     * @param time {Number} The passed time since the impulse was handle the last time.
     */
    __handleScrollImpulse : function(deltaX, deltaY, finger, target, time) {
      // delete the old timer id
      this.__impulseTimerId = null;
      this.__impulseRequestId = null;

      // do nothing if we don't need to scroll
      if (deltaX == 0 && deltaY == 0) {
        return;
      }

      var change = parseInt((time || 20) / 10);

      // linear momentum calculation for X
      if (deltaX > 0) {
        deltaX = Math.max(0, deltaX - change);
      } else {
        deltaX = Math.min(0, deltaX + change);
      }

      // linear momentum calculation for Y
      if (deltaY > 0) {
        deltaY = Math.max(0, deltaY - change);
      } else {
        deltaY = Math.min(0, deltaY + change);
      }

      // set up a new timer with the new delta
      var start = +(new Date());
      this.__impulseRequestId = qx.bom.AnimationFrame.request(qx.lang.Function.bind(function(deltaX, deltaY, finger, target, time) {
        this.__handleScrollImpulse(deltaX, deltaY, finger, target, time - start);
      }, this, deltaX, deltaY, finger, target));

      // scroll the desired new delta
      this.__fireWheelEvent(deltaX, deltaY, finger, target);
    },


    /**
     * Helper to find out if there has been a move gesture or not.
     *
     * @param nativeEvent {var} The native touch event.
     * @return {Boolean} <code>true</code>, if a move has been detected.
     */
    __hasMoved : function(nativeEvent) {
      var endPos = {x: nativeEvent.screenX, y: nativeEvent.screenY};
      var moved = false;

      var offset = 20;
      if (Math.abs(endPos.x - this.__startPos.x) > offset) {
        moved = true;
      }
      if (Math.abs(endPos.y - this.__startPos.y) > offset) {
        moved = true;
      }
      return moved;
    },


    /**
     * Initializes the native mouse button event listeners.
     */
    _initObserver : function() {
      qx.event.Registration.addListener(this.__root, "touchstart", this.__onTouchStart, this);
      qx.event.Registration.addListener(this.__root, "touchmove", this.__onTouchMove, this);
      qx.event.Registration.addListener(this.__root, "touchend", this.__onTouchEnd, this);
      qx.event.Registration.addListener(this.__root, "tap", this.__onTap, this);
      qx.event.Registration.addListener(this.__root, "longtap", this.__onLongTap, this);

      qx.bom.Event.addNativeListener(this.__window, "touchmove", this.__stopScrolling);
    },


    /**
     * Disconnects the native mouse button event listeners.
     */
    _stopObserver : function() {
      qx.event.Registration.removeListener(this.__root, "touchstart", this.__onTouchStart, this);
      qx.event.Registration.removeListener(this.__root, "touchmove", this.__onTouchMove, this);
      qx.event.Registration.removeListener(this.__root, "touchend", this.__onTouchEnd, this);
      qx.event.Registration.removeListener(this.__root, "tap", this.__onTap, this);
      qx.event.Registration.removeListener(this.__root, "longtap", this.__onLongTap, this);

      qx.bom.Event.removeNativeListener(this.__window, "touchmove", this.__stopScrolling);
    },


    /**
     * Handler for the native 'touchstart' on the window which prevents
     * the native page scrolling.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __stopScrolling : function(e) {
      var node = e.target;
      while (node) {
        if (node.style && node.style.WebkitOverflowScrolling == "touch") {
          return;
        }
        node = node.parentNode;
      }
      e.preventDefault();
    },


    /**
     * Handler for 'touchstart' which converts the touch start event to a mouse down event.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __onTouchStart : function(e) {
      var target = e.getTarget();
      var nativeEvent = this.__getDefaultFakeEvent(target, e.getAllTouches()[0]);
      // do not fake mousedown on IE (Mouse Handler can take original event)
      if (qx.core.Environment.get("event.touch")) {
        if (!this.__fireEvent(nativeEvent, "mousedown", target)) {
          e.preventDefault();
        }
      }
      this.__lastPos = {x: nativeEvent.screenX, y: nativeEvent.screenY};
      this.__startPos = {x: nativeEvent.screenX, y: nativeEvent.screenY};

      // stop scrolling if any is happening
      if (this.__impulseRequestId && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(this.__impulseRequestId);
        this.__impulseRequestId = null;
      }
    },


    /**
     * Handler for 'touchmove' which converts the touch move event to a mouse move event.
     * Additionally, the mouse wheel events will be generated in this handler.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __onTouchMove : function(e) {
      var target = e.getTarget();
      var nativeEvent = this.__getDefaultFakeEvent(target, e.getChangedTargetTouches()[0]);

      // do not fake mousemove on IE (Mouse Handler can take original event)
      if (qx.core.Environment.get("event.touch")) {
        if (!this.__fireEvent(nativeEvent, "mousemove", target)) {
          e.preventDefault();
        }
      }

      // calculate the delta for the wheel event
      var deltaY = -parseInt(this.__lastPos.y - nativeEvent.screenY);
      var deltaX = -parseInt(this.__lastPos.x - nativeEvent.screenX);

      // take a new position. wheel events require the delta to the last event
      this.__lastPos = {x: nativeEvent.screenX, y: nativeEvent.screenY};

      // only react on touch events
      // http://www.w3.org/Submission/pointer-events/#pointerevent-interface
      if (e.getNativeEvent().pointerType != 4) {
        var finger = e.getChangedTargetTouches()[0];
        this.__fireWheelEvent(deltaX, deltaY, finger, target);

        // if we have an old timeout for the current direction, clear it
        if (this.__impulseTimerId) {
          clearTimeout(this.__impulseTimerId);
          this.__impulseTimerId = null;
        }

        // set up a new timer for the current direction
        this.__impulseTimerId =
          setTimeout(qx.lang.Function.bind(function(deltaX, deltaY, finger, target) {
            this.__handleScrollImpulse(deltaX, deltaY, finger, target);
          }, this, deltaX, deltaY, finger, target), 100);
      }
    },


    /**
     * Handler for 'touchend' which converts the touch end event to a mouse up event.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __onTouchEnd : function(e) {
      var target = e.getTarget();
      var nativeEvent = this.__getDefaultFakeEvent(target, e.getChangedTargetTouches()[0]);

      // do not fake mouseup on IE (Mouse Handler can take original event)
      if (qx.core.Environment.get("event.touch")) {
        if (!this.__fireEvent(nativeEvent, "mouseup", target)) {
          e.preventDefault();
        }
      }
    },


    /**
     * Handler for 'tap' which converts the tap event to a click event.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __onTap : function(e) {
      var target = e.getTarget();
      var nativeEvent = this.__getDefaultFakeEvent(target, e.getChangedTargetTouches()[0]);

      if (!this.__hasMoved(nativeEvent)) {
        this.__fireEvent(nativeEvent, "click", target);
      }
    },


    /**
     * Handler for 'longtap' which converts the longtap event to a contextmenu event.
     * @param e {qx.event.type.Touch} The qooxdoo touch event.
     */
    __onLongTap : function(e) {
      var target = e.getTarget();
      var nativeEvent = this.__getDefaultFakeEvent(target, e.getChangedTargetTouches()[0]);

      this.__fireEvent(nativeEvent, "contextmenu", target);
    },


    /**
     * Returns a fake native mouse event, based on the the given target and finger.
     * @param target {var} The event target.
     * @param finger {Map} The first item of the native touch events fingers array.
     * @return {Map} A fake event as a simple Map containing the necessary keys and values.
     */
    __getDefaultFakeEvent : function(target, finger) {
      var nativeEvent = {};

      nativeEvent.button = 0; // for left button
      nativeEvent.wheelDelta = 0;
      nativeEvent.wheelDeltaX = 0;
      nativeEvent.wheelDeltaY = 0;
      nativeEvent.wheelX = 0;
      nativeEvent.wheelY = 0;
      nativeEvent.target = target;

      nativeEvent.clientX = finger.clientX;
      nativeEvent.clientY = finger.clientY;
      nativeEvent.pageX = finger.pageX;
      nativeEvent.pageY = finger.pageY;
      nativeEvent.screenX = finger.screenX;
      nativeEvent.screenY = finger.screenY;

      nativeEvent.shiftKey = false;
      nativeEvent.ctrlKey = false;
      nativeEvent.altKey = false;
      nativeEvent.metaKey = false;

      return nativeEvent;
    }
  },



  destruct : function()
  {
    if (qx.event.handler.MouseEmulation.ON) {
      this._stopObserver();
    }

    this.__manager = this.__window = this.__root = null;
  },



  defer : function(statics) {
    if (statics.ON) {
      qx.event.Registration.addHandler(statics);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Mouse event object.
 *
 * the interface of this class is based on the DOM Level 2 mouse event
 * interface: http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-eventgroupings-mouseevents
 */
qx.Class.define("qx.event.type.Mouse",
{
  extend : qx.event.type.Dom,




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    _cloneNativeEvent : function(nativeEvent, clone)
    {
      var clone = this.base(arguments, nativeEvent, clone);

      clone.button = nativeEvent.button;
      clone.clientX = Math.round(nativeEvent.clientX);
      clone.clientY = Math.round(nativeEvent.clientY);
      clone.pageX = Math.round(nativeEvent.pageX);
      clone.pageY = Math.round(nativeEvent.pageY);
      clone.screenX = Math.round(nativeEvent.screenX);
      clone.screenY = Math.round(nativeEvent.screenY);
      clone.wheelDelta = nativeEvent.wheelDelta;
      clone.wheelDeltaX = nativeEvent.wheelDeltaX;
      clone.wheelDeltaY = nativeEvent.wheelDeltaY;
      clone.detail = nativeEvent.detail;
      clone.axis = nativeEvent.axis;
      clone.wheelX = nativeEvent.wheelX;
      clone.wheelY = nativeEvent.wheelY;
      clone.HORIZONTAL_AXIS = nativeEvent.HORIZONTAL_AXIS;
      clone.srcElement = nativeEvent.srcElement;
      clone.target = nativeEvent.target;

      return clone;
    },


    /**
     * @type {Map} Contains the button ID to identifier data.
     *
     * @lint ignoreReferenceField(__buttonsDom2EventModel)
     */
    __buttonsDom2EventModel :
    {
      0 : "left",
      2 : "right",
      1 : "middle"
    },


    /**
     * @type {Map} Contains the button ID to identifier data.
     *
     * @lint ignoreReferenceField(__buttonsMshtmlEventModel)
     */
    __buttonsMshtmlEventModel :
    {
      1 : "left",
      2 : "right",
      4 : "middle"
    },


    // overridden
    stop : function() {
      this.stopPropagation();
    },


    /**
     * During mouse events caused by the depression or release of a mouse button,
     * this method can be used to check which mouse button changed state.
     *
     * Only internet explorer can compute the button during mouse move events. For
     * all other browsers the button only contains sensible data during
     * "click" events like "click", "dblclick", "mousedown", "mouseup" or "contextmenu".
     *
     * But still, browsers act different on click:
     * <pre>
     * <- = left mouse button
     * -> = right mouse button
     * ^  = middle mouse button
     *
     * Browser | click, dblclick | contextmenu
     * ---------------------------------------
     * Firefox | <- ^ ->         | ->
     * Chrome  | <- ^            | ->
     * Safari  | <- ^            | ->
     * IE      | <- (^ is <-)    | ->
     * Opera   | <-              | -> (twice)
     * </pre>
     *
     * @return {String} One of "left", "right", "middle" or "none"
     */
    getButton : function()
    {
      switch(this._type)
      {
        case "contextmenu":
          return "right";

        case "click":
          // IE does not support buttons on click --> assume left button
          if (qx.core.Environment.get("browser.name") === "ie" &&
          qx.core.Environment.get("browser.documentmode") < 9)
          {
            return "left";
          }

        default:
          if (this._native.target !== undefined) {
            return this.__buttonsDom2EventModel[this._native.button] || "none";
          } else {
            return this.__buttonsMshtmlEventModel[this._native.button] || "none";
          }
      }
    },


    /**
     * Whether the left button is pressed
     *
     * @return {Boolean} true when the left button is pressed
     */
    isLeftPressed : function() {
      return this.getButton() === "left";
    },


    /**
     * Whether the middle button is pressed
     *
     * @return {Boolean} true when the middle button is pressed
     */
    isMiddlePressed : function() {
      return this.getButton() === "middle";
    },


    /**
     * Whether the right button is pressed
     *
     * @return {Boolean} true when the right button is pressed
     */
    isRightPressed : function() {
      return this.getButton() === "right";
    },


    /**
     * Get a secondary event target related to an UI event. This attribute is
     * used with the mouseover event to indicate the event target which the
     * pointing device exited and with the mouseout event to indicate the
     * event target which the pointing device entered.
     *
     * @return {Element} The secondary event target.
     * @signature function()
     */
    getRelatedTarget : function() {
      return this._relatedTarget;
    },


    /**
     * Get the he horizontal coordinate at which the event occurred relative
     * to the viewport.
     *
     * @return {Integer} The horizontal mouse position
     */
    getViewportLeft : function() {
      return Math.round(this._native.clientX);
    },


    /**
     * Get the vertical coordinate at which the event occurred relative
     * to the viewport.
     *
     * @return {Integer} The vertical mouse position
     * @signature function()
     */
    getViewportTop : function() {
      return Math.round(this._native.clientY);
    },


    /**
     * Get the horizontal position at which the event occurred relative to the
     * left of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Integer} The horizontal mouse position in the document.
     */
    getDocumentLeft : function()
    {
      if (this._native.pageX !== undefined) {
        return Math.round(this._native.pageX);
      } else {
        var win = qx.dom.Node.getWindow(this._native.srcElement);
        return Math.round(this._native.clientX) + qx.bom.Viewport.getScrollLeft(win);
      }
    },


    /**
     * Get the vertical position at which the event occurred relative to the
     * top of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Integer} The vertical mouse position in the document.
     */
    getDocumentTop : function()
    {
      if (this._native.pageY !== undefined) {
        return Math.round(this._native.pageY);
      } else {
        var win = qx.dom.Node.getWindow(this._native.srcElement);
        return Math.round(this._native.clientY) + qx.bom.Viewport.getScrollTop(win);
      }
    },


    /**
     * Get the horizontal coordinate at which the event occurred relative to
     * the origin of the screen coordinate system.
     *
     * Note: This value is usually not very useful unless you want to
     * position a native popup window at this coordinate.
     *
     * @return {Integer} The horizontal mouse position on the screen.
     */
    getScreenLeft : function() {
      return Math.round(this._native.screenX);
    },


    /**
     * Get the vertical coordinate at which the event occurred relative to
     * the origin of the screen coordinate system.
     *
     * Note: This value is usually not very useful unless you want to
     * position a native popup window at this coordinate.
     *
     * @return {Integer} The vertical mouse position on the screen.
     */
    getScreenTop : function() {
      return Math.round(this._native.screenY);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mouse wheel event object.
 */
qx.Class.define("qx.event.type.MouseWheel",
{
  extend : qx.event.type.Mouse,

  statics : {
    /**
     * The maximal mesured scroll wheel delta.
     * @internal
     */
    MAXSCROLL : null,

    /**
     * The minimal mesured scroll wheel delta.
     * @internal
     */
    MINSCROLL : null,

    /**
     * The normalization factor for the speed calculation.
     * @internal
     */
    FACTOR : 1
  },

  members :
  {
    // overridden
    stop : function()
    {
      this.stopPropagation();
      this.preventDefault();
    },


    /**
     * Normalizer for the mouse wheel data.
     *
     * @param delta {Number} The mouse delta.
     * @return {Number} The normalized delta value
     */
    __normalize : function(delta) {
      var absDelta = Math.abs(delta);

      // store the min value
      if (
        qx.event.type.MouseWheel.MINSCROLL == null ||
        qx.event.type.MouseWheel.MINSCROLL > absDelta
      ) {
        qx.event.type.MouseWheel.MINSCROLL = absDelta;
        this.__recalculateMultiplicator();
      }

      // store the max value
      if (
        qx.event.type.MouseWheel.MAXSCROLL == null ||
        qx.event.type.MouseWheel.MAXSCROLL < absDelta
      ) {
        qx.event.type.MouseWheel.MAXSCROLL = absDelta;
        this.__recalculateMultiplicator();
      }

      // special case for systems not speeding up
      if (
        qx.event.type.MouseWheel.MAXSCROLL === absDelta &&
        qx.event.type.MouseWheel.MINSCROLL === absDelta
      ) {
        return 2 * (delta / absDelta);
      }

      var range =
        qx.event.type.MouseWheel.MAXSCROLL - qx.event.type.MouseWheel.MINSCROLL;
      var ret = (delta / range) * Math.log(range) * qx.event.type.MouseWheel.FACTOR;

      // return at least 1 or -1
      return ret < 0 ? Math.min(ret, -1) : Math.max(ret, 1);
    },


    /**
     * Recalculates the factor with which the calculated delta is normalized.
     */
    __recalculateMultiplicator : function() {
      var max = qx.event.type.MouseWheel.MAXSCROLL || 0;
      var min = qx.event.type.MouseWheel.MINSCROLL || max;
      if (max <= min) {
        return;
      }
      var range = max - min;
      var maxRet = (max / range) * Math.log(range);
      if (maxRet == 0) {
        maxRet = 1;
      }
      qx.event.type.MouseWheel.FACTOR = 6 / maxRet;
    },


    /**
     * Get the amount the wheel has been scrolled
     *
     * @param axis {String?} Optional parameter which definex the scroll axis.
     *   The value can either be <code>"x"</code> or <code>"y"</code>.
     * @return {Integer} Scroll wheel movement for the given axis. If no axis
     *   is given, the y axis is used.
     */
    getWheelDelta : function(axis) {
      var e = this._native;

      // default case
      if (axis === undefined) {
        if (delta === undefined) {
          // default case
          var delta = -e.wheelDelta;
          if (e.wheelDelta === undefined) {
            delta = e.detail;
          }
        }
        return this.__convertWheelDelta(delta);
      }

      // get the x scroll delta
      if (axis === "x") {
        var x = 0;
        if (e.wheelDelta !== undefined) {
          if (e.wheelDeltaX !== undefined) {
            x = e.wheelDeltaX ? this.__convertWheelDelta(-e.wheelDeltaX) : 0;
          }
        } else {
          if (e.axis && e.axis == e.HORIZONTAL_AXIS) {
            x = this.__convertWheelDelta(e.detail);
          }
        }
        return x;
      }

      // get the y scroll delta
      if (axis === "y") {
        var y = 0;
        if (e.wheelDelta !== undefined) {
          if (e.wheelDeltaY !== undefined) {
            y = e.wheelDeltaY ? this.__convertWheelDelta(-e.wheelDeltaY) : 0;
          } else {
            y = this.__convertWheelDelta(-e.wheelDelta);
          }
        } else {
          if (!(e.axis && e.axis == e.HORIZONTAL_AXIS)) {
            y = this.__convertWheelDelta(e.detail);
          }
        }
        return y;
      }

      // default case, return 0
      return 0;
    },


    /**
     * Get the amount the wheel has been scrolled
     *
     * @param delta {Integer} The delta which is given by the mouse event.
     * @return {Integer} Scroll wheel movement
     */
    __convertWheelDelta : function(delta) {
      if (qx.event.handler.MouseEmulation.ON) {
        return delta;
      }
      // new feature detecting behavior
      else if (qx.core.Environment.get("qx.dynamicmousewheel")) {
        return this.__normalize(delta);

      // old, browser detecting behavior
      } else {
        var handler = qx.core.Environment.select("engine.name", {
          "default" : function() {
            return delta / 40;
          },

          "gecko" : function() {
            return delta;
          },

          "webkit" : function()
          {
            if (qx.core.Environment.get("browser.name") == "chrome") {
              // mac has a much higher sppedup during scrolling
              if (qx.core.Environment.get("os.name") == "osx") {
                return delta / 60;
              } else {
                return delta / 120;
              }

            } else {
              // windows safaris behave different than on OSX
              if (qx.core.Environment.get("os.name") == "win") {
                var factor = 120;
                // safari 5.0 and not 5.0.1
                if (parseFloat(qx.core.Environment.get("engine.version")) == 533.16) {
                  factor = 1200;
                }
              } else {
                factor = 40;
                // Safari 5.0 or 5.0.1
                if (
                  parseFloat(qx.core.Environment.get("engine.version")) == 533.16 ||
                  parseFloat(qx.core.Environment.get("engine.version")) == 533.17 ||
                  parseFloat(qx.core.Environment.get("engine.version")) == 533.18
                ) {
                  factor = 1200;
                }
              }
              return delta / factor;
            }
          }
        });
        return handler.call(this);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * This is a cross browser wrapper for requestAnimationFrame. For further
 * information about the feature, take a look at spec:
 * http://www.w3.org/TR/animation-timing/
 *
 * This class offers two ways of using this feature. First, the plain
 * API the spec describes.
 *
 * Here is a sample usage:
 * <pre class='javascript'>var start = +(new Date());
 * var clb = function(time) {
 *   if (time >= start + duration) {
 *     // ... do some last tasks
 *   } else {
 *     var timePassed = time - start;
 *     // ... calculate the current step and apply it
 *     qx.bom.AnimationFrame.request(clb, this);
 *   }
 * };
 * qx.bom.AnimationFrame.request(clb, this);
 * </pre>
 *
 * Another way of using it is to use it as an instance emitting events.
 *
 * Here is a sample usage of that API:
 * <pre class='javascript'>var frame = new qx.bom.AnimationFrame();
 * frame.on("end", function() {
 *   // ... do some last tasks
 * }, this);
 * frame.on("frame", function(timePassed) {
 *   // ... calculate the current step and apply it
 * }, this);
 * frame.startSequence(duration);
 * </pre>
 *
 * @require(qx.lang.normalize.Date)
 */
qx.Bootstrap.define("qx.bom.AnimationFrame",
{
  extend : qx.event.Emitter,

  events : {
    /** Fired as soon as the animation has ended. */
    "end" : undefined,

    /**
     * Fired on every frame having the passed time as value
     * (might be a float for higher precision).
     */
    "frame" : "Number"
  },

  members : {
    __canceled : false,

    /**
     * Method used to start a series of animation frames. The series will end as
     * soon as the given duration is over.
     *
     * @param duration {Number} The duration the sequence should take.
     */
    startSequence : function(duration) {
      this.__canceled = false;

      var start = +(new Date());
      var clb = function(time) {
        if (this.__canceled) {
          this.id = null;
          return;
        }

        // final call
        if (time >= start + duration) {
          this.emit("end");
          this.id = null;
        } else {
          var timePassed = Math.max(time - start, 0);
          this.emit("frame", timePassed);
          this.id = qx.bom.AnimationFrame.request(clb, this);
        }
      }

      this.id = qx.bom.AnimationFrame.request(clb, this);
    },


    /**
     * Cancels a started sequence of frames. It will do nothing if no
     * sequence is running.
     */
    cancelSequence : function() {
      this.__canceled = true;
    }
  },

  statics :
  {
    /**
     * The default time in ms the timeout fallback implementation uses.
     */
    TIMEOUT : 30,


    /**
     * Calculation of the predefined timing functions. Approximation of the real
     * bezier curves has been used for easier calculation. This is good and close
     * enough for the predefined functions like <code>ease</code> or
     * <code>linear</code>.
     *
     * @param func {String} The defined timing function. One of the following values:
     *   <code>"ease-in"</code>, <code>"ease-out"</code>, <code>"linear"</code>,
     *   <code>"ease-in-out"</code>, <code>"ease"</code>.
     * @param x {Integer} The percent value of the function.
     * @return {Integer} The calculated value
     */
    calculateTiming : function(func, x) {
      if (func == "ease-in") {
        var a = [3.1223e-7, 0.0757, 1.2646, -0.167, -0.4387, 0.2654];
      } else if (func == "ease-out") {
        var a = [-7.0198e-8, 1.652, -0.551, -0.0458, 0.1255, -0.1807];
      } else if (func == "linear") {
        return x;
      } else if (func == "ease-in-out") {
        var a = [2.482e-7, -0.2289, 3.3466, -1.0857, -1.7354, 0.7034];
      } else {
        // default is 'ease'
        var a = [-0.0021, 0.2472, 9.8054, -21.6869, 17.7611, -5.1226];
      }

      // A 6th grade polynomial has been used as approximation of the original
      // bezier curves  described in the transition spec
      // http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
      // (the same is used for animations as well)
      var y = 0;
      for (var i=0; i < a.length; i++) {
        y += a[i] * Math.pow(x, i);
      };
      return y;
    },


    /**
     * Request for an animation frame. If the native <code>requestAnimationFrame</code>
     * method is supported, it will be used. Otherwise, we use timeouts with a
     * 30ms delay. The HighResolutionTime will be used if supported but the time given
     * to the callback will still be a timestamp starting at 1 January 1970 00:00:00 UTC.
     *
     * @param callback {Function} The callback function which will get the current
     *   time as argument (which could be a float for higher precision).
     * @param context {var} The context of the callback.
     * @return {Number} The id of the request.
     */
    request : function(callback, context) {
      var req = qx.core.Environment.get("css.animation.requestframe");

      var clb = function(time) {
        // check for high resolution time
        if (time < 1e10) {
          time = this.__start + time;
        }

        time = time || +(new Date());
        callback.call(context, time);
      };
      if (req) {
        return window[req](clb);
      } else {
        // make sure to use an indirection because setTimeout passes a
        // number as first argument as well
        return window.setTimeout(function() {
          clb();
        }, qx.bom.AnimationFrame.TIMEOUT);
      }
    }
  },

  /**
   * @ignore(performance.timing.*)
   */
  defer : function(statics) {
    // check and use the high resolution start time if available
    statics.__start = window.performance && performance.timing && performance.timing.navigationStart;
    // if not, simply use the current time
    if (!statics.__start) {
      statics.__start = Date.now();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Andreas Junghans (lucidcake)

************************************************************************ */

/**
 * Cross-browser wrapper to work with CSS stylesheets.
 */
qx.Bootstrap.define("qx.bom.Stylesheet",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Include a CSS file
     *
     * <em>Note:</em> Using a resource ID as the <code>href</code> parameter
     * will no longer be supported. Call
     * <code>qx.util.ResourceManager.getInstance().toUri(href)</code> to get
     * valid URI to be used with this method.
     *
     * @param href {String} Href value
     * @param doc {Document?} Document to modify
     */
    includeFile : function(href, doc)
    {
      if (!doc) {
        doc = document;
      }

      var el = doc.createElement("link");
      el.type = "text/css";
      el.rel = "stylesheet";
      el.href = href;

      var head = doc.getElementsByTagName("head")[0];
      head.appendChild(el);
    },


    /**
     * Create a new Stylesheet node and append it to the document
     *
     * @param text {String?} optional string of css rules
     * @return {Stylesheet} the generates stylesheet element
     */
    createElement : function(text)
    {
      if (qx.core.Environment.get("html.stylesheet.createstylesheet")) {
        var sheet = document.createStyleSheet();

        if (text) {
          sheet.cssText = text;
        }

        return sheet;
      }
      else {
        var elem = document.createElement("style");
        elem.type = "text/css";

        if (text) {
          elem.appendChild(document.createTextNode(text));
        }

        document.getElementsByTagName("head")[0].appendChild(elem);
        return elem.sheet;
      }
    },


    /**
     * Insert a new CSS rule into a given Stylesheet
     *
     * @param sheet {Object} the target Stylesheet object
     * @param selector {String} the selector
     * @param entry {String} style rule
     */
    addRule : function(sheet, selector, entry)
    {
      if (qx.core.Environment.get('qx.debug')) {
        var msg = "qx.bom.Stylesheet.addRule: The rule '" + entry + "' for the selector '" + selector +
        "' must not be enclosed in braces";
        qx.core.Assert.assertFalse(/^\s*?\{.*?\}\s*?$/.test(entry), msg);
      }

      if (qx.core.Environment.get("html.stylesheet.insertrule")) {
        sheet.insertRule(selector + "{" + entry + "}", sheet.cssRules.length);
      }
      else {
        sheet.addRule(selector, entry);
      }
    },


    /**
     * Remove a CSS rule from a stylesheet
     *
     * @param sheet {Object} the Stylesheet
     * @param selector {String} the Selector of the rule to remove
     */
    removeRule : function(sheet, selector)
    {
      if (qx.core.Environment.get("html.stylesheet.deleterule")) {
        var rules = sheet.cssRules;
        var len = rules.length;

        for (var i=len-1; i>=0; --i)
        {
          if (rules[i].selectorText == selector) {
            sheet.deleteRule(i);
          }
        }
      }
      else {
        var rules = sheet.rules;
        var len = rules.length;

        for (var i=len-1; i>=0; --i)
        {
          if (rules[i].selectorText == selector) {
            sheet.removeRule(i);
          }
        }
      }
    },


    /**
     * Remove the given sheet from its owner.
     * @param sheet {Object} the stylesheet object
     */
    removeSheet : function(sheet) {
      var owner = sheet.ownerNode ? sheet.ownerNode : sheet.owningElement;
      qx.dom.Element.removeChild(owner, owner.parentNode);
    },


    /**
     * Remove all CSS rules from a stylesheet
     *
     * @param sheet {Object} the stylesheet object
     */
    removeAllRules : function(sheet)
    {
      if (qx.core.Environment.get("html.stylesheet.deleterule")) {
        var rules = sheet.cssRules;
        var len = rules.length;

        for (var i=len-1; i>=0; i--) {
          sheet.deleteRule(i);
        }
      } else {
        var rules = sheet.rules;
        var len = rules.length;

        for (var i=len-1; i>=0; i--) {
          sheet.removeRule(i);
        }
      }
    },


    /**
     * Add an import of an external CSS file to a stylesheet
     *
     * @param sheet {Object} the stylesheet object
     * @param url {String} URL of the external stylesheet file
     */
    addImport : function(sheet, url)
    {
      if (qx.core.Environment.get("html.stylesheet.addimport")) {
        sheet.addImport(url);
      }
      else {
        sheet.insertRule('@import "' + url + '";', sheet.cssRules.length);
      }
    },


    /**
     * Removes an import from a stylesheet
     *
     * @param sheet {Object} the stylesheet object
     * @param url {String} URL of the imported CSS file
     */
    removeImport : function(sheet, url)
    {
      if (qx.core.Environment.get("html.stylesheet.removeimport")) {
        var imports = sheet.imports;
        var len = imports.length;

        for (var i=len-1; i>=0; i--)
        {
          if (imports[i].href == url ||
          imports[i].href == qx.util.Uri.getAbsolute(url))
          {
            sheet.removeImport(i);
          }
        }
      }
      else {
        var rules = sheet.cssRules;
        var len = rules.length;

        for (var i=len-1; i>=0; i--)
        {
          if (rules[i].href == url) {
            sheet.deleteRule(i);
          }
        }
      }
    },


    /**
     * Remove all imports from a stylesheet
     *
     * @param sheet {Object} the stylesheet object
     */
    removeAllImports : function(sheet)
    {
      if (qx.core.Environment.get("html.stylesheet.removeimport")) {
        var imports = sheet.imports;
        var len = imports.length;

        for (var i=len-1; i>=0; i--) {
          sheet.removeImport(i);
        }
      }
      else {
        var rules = sheet.cssRules;
        var len = rules.length;

        for (var i=len-1; i>=0; i--)
        {
          if (rules[i].type == rules[i].IMPORT_RULE) {
            sheet.deleteRule(i);
          }
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Daniel Wagner (d_wagner)

************************************************************************ */
/**
 * Internal class which contains the checks used by {@link qx.core.Environment}.
 * All checks in here are marked as internal which means you should never use
 * them directly.
 *
 * This class contains checks related to Stylesheet objects.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Stylesheet",
{
  statics:
  {
    /**
     * Returns a stylesheet to be used for feature checks
     *
     * @return {Stylesheet} Stylesheet element
     */
    __getStylesheet : function()
    {
      if (!qx.bom.client.Stylesheet.__stylesheet) {
        qx.bom.client.Stylesheet.__stylesheet = qx.bom.Stylesheet.createElement();
      }
      return qx.bom.client.Stylesheet.__stylesheet;
    },


    /**
     * Check for IE's non-standard document.createStyleSheet function.
     * In IE9 (standards mode), the typeof check returns "function" so false is
     * returned. This is intended since IE9 supports the DOM-standard
     * createElement("style") which should be used instead.
     *
     * @internal
     * @return {Boolean} <code>true</code> if the browser supports
     * document.createStyleSheet
     */
    getCreateStyleSheet : function()
    {
      return typeof document.createStyleSheet === "object";
    },


    /**
     * Check for stylesheet.insertRule. Legacy IEs do not support this.
     *
     * @internal
     * @return {Boolean} <code>true</code> if insertRule is supported
     */
    getInsertRule : function()
    {
      return typeof qx.bom.client.Stylesheet.__getStylesheet().insertRule === "function";
    },


    /**
     * Check for stylesheet.deleteRule. Legacy IEs do not support this.
     *
     * @internal
     * @return {Boolean} <code>true</code> if deleteRule is supported
     */
    getDeleteRule : function()
    {
      return typeof qx.bom.client.Stylesheet.__getStylesheet().deleteRule === "function";
    },


    /**
     * Decides whether to use the legacy IE-only stylesheet.addImport or the
     * DOM-standard stylesheet.insertRule('@import [...]')
     *
     * @internal
     * @return {Boolean} <code>true</code> if stylesheet.addImport is supported
     */
    getAddImport : function()
    {
      return (typeof qx.bom.client.Stylesheet.__getStylesheet().addImport === "object");
    },


    /**
     * Decides whether to use the legacy IE-only stylesheet.removeImport or the
     * DOM-standard stylesheet.deleteRule('@import [...]')
     *
     * @internal
     * @return {Boolean} <code>true</code> if stylesheet.removeImport is supported
     */
    getRemoveImport : function()
    {
      return (typeof qx.bom.client.Stylesheet.__getStylesheet().removeImport === "object");
    }
  },



  defer : function (statics) {
    qx.core.Environment.add("html.stylesheet.createstylesheet", statics.getCreateStyleSheet);
    qx.core.Environment.add("html.stylesheet.insertrule", statics.getInsertRule);
    qx.core.Environment.add("html.stylesheet.deleterule", statics.getDeleteRule);
    qx.core.Environment.add("html.stylesheet.addimport", statics.getAddImport);
    qx.core.Environment.add("html.stylesheet.removeimport", statics.getRemoveImport);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * Responsible for checking all relevant animation properties.
 *
 * Spec: http://www.w3.org/TR/css3-animations/
 *
 * @require(qx.bom.Stylesheet)
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.CssAnimation",
{
  statics : {
    /**
     * Main check method which returns an object if CSS animations are
     * supported. This object contains all necessary keys to work with CSS
     * animations.
     * <ul>
     *  <li><code>name</code> The name of the css animation style</li>
     *  <li><code>play-state</code> The name of the play-state style</li>
     *  <li><code>start-event</code> The name of the start event</li>
     *  <li><code>iternation-event</code> The name of the iternation event</li>
     *  <li><code>end-event</code> The name of the end event</li>
     *  <li><code>fill-mode</code> The fill-mode style</li>
     *  <li><code>keyframes</code> The name of the keyframes selector.</li>
     * </ul>
     *
     * @internal
     * @return {Object|null} The described object or null, if animations are
     *   not supported.
     */
    getSupport : function() {
      var name = qx.bom.client.CssAnimation.getName();
      if (name != null) {
        return {
          "name" : name,
          "play-state" : qx.bom.client.CssAnimation.getPlayState(),
          "start-event" : qx.bom.client.CssAnimation.getAnimationStart(),
          "iteration-event" : qx.bom.client.CssAnimation.getAnimationIteration(),
          "end-event" : qx.bom.client.CssAnimation.getAnimationEnd(),
          "fill-mode" : qx.bom.client.CssAnimation.getFillMode(),
          "keyframes" : qx.bom.client.CssAnimation.getKeyFrames()
        };
      }
      return null;
    },


    /**
     * Checks for the 'animation-fill-mode' CSS style.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getFillMode : function() {
      return qx.bom.Style.getPropertyName("AnimationFillMode");
    },



    /**
     * Checks for the 'animation-play-state' CSS style.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getPlayState : function() {
      return qx.bom.Style.getPropertyName("AnimationPlayState");
    },


    /**
     * Checks for the style name used for animations.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getName : function() {
      return qx.bom.Style.getPropertyName("animation");
    },


    /**
     * Checks for the event name of animation start.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationStart : function() {
      var mapping = {
        "msAnimation" : "MSAnimationStart",
        "WebkitAnimation" : "webkitAnimationStart",
        "MozAnimation" : "animationstart",
        "OAnimation" : "oAnimationStart",
        "animation" : "animationstart"
      };

      return mapping[this.getName()];
    },


    /**
     * Checks for the event name of animation end.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationIteration : function() {
      var mapping = {
        "msAnimation" : "MSAnimationIteration",
        "WebkitAnimation" : "webkitAnimationIteration",
        "MozAnimation" : "animationiteration",
        "OAnimation" : "oAnimationIteration",
        "animation" : "animationiteration"
      }

      return mapping[this.getName()];
    },


    /**
     * Checks for the event name of animation end.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationEnd : function() {
      var mapping = {
        "msAnimation" : "MSAnimationEnd",
        "WebkitAnimation" : "webkitAnimationEnd",
        "MozAnimation" : "animationend",
        "OAnimation" : "oAnimationEnd",
        "animation" : "animationend"
      }

      return mapping[this.getName()];
    },


    /**
     * Checks what selector should be used to add keyframes to stylesheets.
     * @internal
     * @return {String|null} The name of the selector or null, if the selector
     *   is not supported.
     */
    getKeyFrames : function() {
      var prefixes = qx.bom.Style.VENDOR_PREFIXES;
      var keyFrames = [];
      for (var i=0; i < prefixes.length; i++) {
        var key = "@" + qx.bom.Style.getCssName(prefixes[i]) + "-keyframes";
        keyFrames.push(key);
      };
      keyFrames.unshift("@keyframes");

      var sheet = qx.bom.Stylesheet.createElement();
      for (var i=0; i < keyFrames.length; i++) {
        try {
          qx.bom.Stylesheet.addRule(sheet, keyFrames[i] + " name", "");
          return keyFrames[i];
        } catch (e) {}
      };

      return null;
    },


    /**
     * Checks for the requestAnimationFrame method and return the prefixed name.
     * @internal
     * @return {String|null} A string the method name or null, if the method
     *   is not supported.
     */
    getRequestAnimationFrame : function() {
      var choices = [
        "requestAnimationFrame",
        "msRequestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "oRequestAnimationFrame" // currently unspecified, so we guess the name!
      ];
      for (var i=0; i < choices.length; i++) {
        if (window[choices[i]] != undefined) {
          return choices[i];
        }
      };

      return null;
    }
  },


  defer : function(statics) {
    qx.core.Environment.add("css.animation", statics.getSupport);
    qx.core.Environment.add("css.animation.requestframe", statics.getRequestAnimationFrame);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

   ======================================================================

   This class contains code based on the following work:

   * Prototype JS
     http://www.prototypejs.org/
     Version 1.5

     Copyright:
       (c) 2006-2007, Prototype Core Team

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Prototype Core Team

   ----------------------------------------------------------------------

     Copyright (c) 2005-2008 Sam Stephenson

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without restriction,
     including without limitation the rights to use, copy, modify, merge,
     publish, distribute, sublicense, and/or sell copies of the Software,
     and to permit persons to whom the Software is furnished to do so,
     subject to the following conditions:

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.

************************************************************************ */

/**
 * Methods to operate on nodes and elements on a DOM tree. This contains
 * special getters to query for child nodes, siblings, etc. This class also
 * supports to operate on one element and reorganize the content with
 * the insertion of new HTML or nodes.
 */
qx.Bootstrap.define("qx.dom.Hierarchy",
{
  statics :
  {
    /**
     * Returns the DOM index of the given node
     *
     * @param node {Node} Node to look for
     * @return {Integer} The DOM index
     */
    getNodeIndex : function(node)
    {
      var index = 0;

      while (node && (node = node.previousSibling)) {
        index++;
      }

      return index;
    },


    /**
     * Returns the DOM index of the given element (ignoring non-elements)
     *
     * @param element {Element} Element to look for
     * @return {Integer} The DOM index
     */
    getElementIndex : function(element)
    {
      var index = 0;
      var type = qx.dom.Node.ELEMENT;

      while (element && (element = element.previousSibling))
      {
        if (element.nodeType == type) {
          index++;
        }
      }

      return index;
    },


    /**
     * Return the next element to the supplied element
     *
     * "nextSibling" is not good enough as it might return a text or comment element
     *
     * @param element {Element} Starting element node
     * @return {Element | null} Next element node
     */
    getNextElementSibling : function(element)
    {
      while (element && (element = element.nextSibling) && !qx.dom.Node.isElement(element)) {
        continue;
      }

      return element || null;
    },


    /**
     * Return the previous element to the supplied element
     *
     * "previousSibling" is not good enough as it might return a text or comment element
     *
     * @param element {Element} Starting element node
     * @return {Element | null} Previous element node
     */
    getPreviousElementSibling : function(element)
    {
      while (element && (element = element.previousSibling) && !qx.dom.Node.isElement(element)) {
        continue;
      }

      return element || null;
    },


    /**
     * Whether the first element contains the second one
     *
     * Uses native non-standard contains() in Internet Explorer,
     * Opera and Webkit (supported since Safari 3.0 beta)
     *
     * @param element {Element} Parent element
     * @param target {Node} Child node
     * @return {Boolean}
     */
    contains : function(element, target)
    {
      if (qx.core.Environment.get("html.element.contains")) {
        if (qx.dom.Node.isDocument(element))
        {
          var doc = qx.dom.Node.getDocument(target);
          return element && doc == element;
        }
        else if (qx.dom.Node.isDocument(target))
        {
          return false;
        }
        else
        {
          return element.contains(target);
        }
      }
      else if (qx.core.Environment.get("html.element.compareDocumentPosition")) {
        // https://developer.mozilla.org/en-US/docs/DOM:Node.compareDocumentPosition
        return !!(element.compareDocumentPosition(target) & 16);
      }
      else {
        while(target)
        {
          if (element == target) {
            return true;
          }

          target = target.parentNode;
        }

        return false;
      }
    },

    /**
     * Whether the element is inserted into the document
     * for which it was created.
     *
     * @param element {Element} DOM element to check
     * @return {Boolean} <code>true</code> when the element is inserted
     *    into the document.
     */
    isRendered : function(element)
    {
      var doc = element.ownerDocument || element.document;

      if (qx.core.Environment.get("html.element.contains")) {
        // Fast check for all elements which are not in the DOM
        if (!element.parentNode || !element.offsetParent) {
          return false;
        }

        return doc.body.contains(element);
      }
      else if (qx.core.Environment.get("html.element.compareDocumentPosition")) {
        // Gecko way, DOM3 method
        return !!(doc.compareDocumentPosition(element) & 16);
      }
      else {
        while(element)
        {
          if (element == doc.body) {
            return true;
          }

          element = element.parentNode;
        }

        return false;
      }
    },


    /**
     * Checks if <code>element</code> is a descendant of <code>ancestor</code>.
     *
     * @param element {Element} first element
     * @param ancestor {Element} second element
     * @return {Boolean} Element is a descendant of ancestor
     */
    isDescendantOf : function(element, ancestor) {
      return this.contains(ancestor, element);
    },


    /**
     * Get the common parent element of two given elements. Returns
     * <code>null</code> when no common element has been found.
     *
     * Uses native non-standard contains() in Opera and Internet Explorer
     *
     * @param element1 {Element} First element
     * @param element2 {Element} Second element
     * @return {Element} the found parent, if none was found <code>null</code>
     */
    getCommonParent : function(element1, element2)
    {
      if (element1 === element2) {
        return element1;
      }

      if (qx.core.Environment.get("html.element.contains")) {
        while (element1 && qx.dom.Node.isElement(element1))
        {
          if (element1.contains(element2)) {
            return element1;
          }

          element1 = element1.parentNode;
        }

        return null;
      }
      else {
        var known = [];

        while (element1 || element2)
        {
          if (element1)
          {
            if (qx.lang.Array.contains(known, element1)) {
              return element1;
            }

            known.push(element1);
            element1 = element1.parentNode;
          }

          if (element2)
          {
            if (qx.lang.Array.contains(known, element2)) {
              return element2;
            }

            known.push(element2);
            element2 = element2.parentNode;
          }
        }

        return null;
      }
    },


    /**
     * Collects all of element's ancestors and returns them as an array of
     * elements.
     *
     * @param element {Element} DOM element to query for ancestors
     * @return {Array} list of all parents
     */
    getAncestors : function(element) {
      return this._recursivelyCollect(element, "parentNode");
    },


    /**
     * Returns element's children.
     *
     * @param element {Element} DOM element to query for child elements
     * @return {Array} list of all child elements
     */
    getChildElements : function(element)
    {
      element = element.firstChild;

      if (!element) {
        return [];
      }

      var arr = this.getNextSiblings(element);

      if (element.nodeType === 1) {
        arr.unshift(element);
      }

      return arr;
    },


    /**
     * Collects all of element's descendants (deep) and returns them as an array
     * of elements.
     *
     * @param element {Element} DOM element to query for child elements
     * @return {Array} list of all found elements
     */
    getDescendants : function(element) {
      return qx.lang.Array.fromCollection(element.getElementsByTagName("*"));
    },


    /**
     * Returns the first child that is an element. This is opposed to firstChild DOM
     * property which will return any node (whitespace in most usual cases).
     *
     * @param element {Element} DOM element to query for first descendant
     * @return {Element} the first descendant
     */
    getFirstDescendant : function(element)
    {
      element = element.firstChild;

      while (element && element.nodeType != 1) {
        element = element.nextSibling;
      }

      return element;
    },


    /**
     * Returns the last child that is an element. This is opposed to lastChild DOM
     * property which will return any node (whitespace in most usual cases).
     *
     * @param element {Element} DOM element to query for last descendant
     * @return {Element} the last descendant
     */
    getLastDescendant : function(element)
    {
      element = element.lastChild;

      while (element && element.nodeType != 1) {
        element = element.previousSibling;
      }

      return element;
    },


    /**
     * Collects all of element's previous siblings and returns them as an array of elements.
     *
     * @param element {Element} DOM element to query for previous siblings
     * @return {Array} list of found DOM elements
     */
    getPreviousSiblings : function(element) {
      return this._recursivelyCollect(element, "previousSibling");
    },


    /**
     * Collects all of element's next siblings and returns them as an array of
     * elements.
     *
     * @param element {Element} DOM element to query for next siblings
     * @return {Array} list of found DOM elements
     */
    getNextSiblings : function(element) {
      return this._recursivelyCollect(element, "nextSibling");
    },


    /**
     * Recursively collects elements whose relationship is specified by
     * property.  <code>property</code> has to be a property (a method won't
     * do!) of element that points to a single DOM node. Returns an array of
     * elements.
     *
     * @param element {Element} DOM element to start with
     * @param property {String} property to look for
     * @return {Array} result list
     */
    _recursivelyCollect : function(element, property)
    {
      var list = [];

      while (element = element[property])
      {
        if (element.nodeType == 1) {
          list.push(element);
        }
      }

      return list;
    },


    /**
     * Collects all of element's siblings and returns them as an array of elements.
     *
     * @param element {var} DOM element to start with
     * @return {Array} list of all found siblings
     */
    getSiblings : function(element) {
      return this.getPreviousSiblings(element).reverse().concat(this.getNextSiblings(element));
    },


    /**
     * Whether the given element is empty.
     * Inspired by Base2 (Dean Edwards)
     *
     * @param element {Element} The element to check
     * @return {Boolean} true when the element is empty
     */
    isEmpty : function(element)
    {
      element = element.firstChild;

      while (element)
      {
        if (element.nodeType === qx.dom.Node.ELEMENT || element.nodeType === qx.dom.Node.TEXT) {
          return false;
        }

        element = element.nextSibling;
      }

      return true;
    },


    /**
     * Removes all of element's text nodes which contain only whitespace
     *
     * @param element {Element} Element to cleanup
     */
    cleanWhitespace : function(element)
    {
      var node = element.firstChild;

      while (node)
      {
        var nextNode = node.nextSibling;

        if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) {
          element.removeChild(node);
        }

        node = nextNode;
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class provides unified key event handler for Internet Explorer,
 * Firefox, Opera and Safari.
 *
 * @require(qx.event.handler.UserAction)
 */
qx.Class.define("qx.event.handler.Keyboard",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,





  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this.__manager = manager;
    this.__window = manager.getWindow();

    // Gecko ignores key events when not explicitly clicked in the document.
    if ((qx.core.Environment.get("engine.name") == "gecko")) {
      this.__root = this.__window;
    } else {
      this.__root = this.__window.document.documentElement;
    }

    // Internal sequence cache
    this.__lastUpDownType = {};

    // Initialize observer
    this._initKeyObserver();
  },





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      keyup : 1,
      keydown : 1,
      keypress : 1,
      keyinput : 1
    },


    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE,


    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __onKeyUpDownWrapper  : null,
    __manager : null,
    __window : null,
    __root : null,
    __lastUpDownType : null,
    __lastKeyCode : null,
    __inputListeners : null,
    __onKeyPressWrapper : null,


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },




    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */


    /**
     * Fire a key input event with the given parameters
     *
     * @param domEvent {Event} DOM event
     * @param charCode {Integer} character code
     */
    _fireInputEvent : function(domEvent, charCode)
    {
      var target = this.__getEventTarget();

      // Only fire when target is defined and visible
      if (target && target.offsetWidth != 0)
      {
        var event = qx.event.Registration.createEvent("keyinput", qx.event.type.KeyInput, [domEvent, target, charCode]);
        this.__manager.dispatchEvent(target, event);
      }

      // Fire user action event
      // Needs to check if still alive first
      if (this.__window) {
        qx.event.Registration.fireEvent(this.__window, "useraction", qx.event.type.Data, ["keyinput"]);
      }
    },


    /**
     * Fire a key up/down/press event with the given parameters
     *
     * @param domEvent {Event} DOM event
     * @param type {String} type og the event
     * @param keyIdentifier {String} key identifier
     */
    _fireSequenceEvent : function(domEvent, type, keyIdentifier)
    {
      var target = this.__getEventTarget();
      var keyCode = domEvent.keyCode;

      // Fire key event
      var event = qx.event.Registration.createEvent(type, qx.event.type.KeySequence, [domEvent, target, keyIdentifier]);
      this.__manager.dispatchEvent(target, event);

      // IE and Safari suppress a "keypress" event if the "keydown" event's
      // default action was prevented. In this case we emulate the "keypress"
      if (
        qx.core.Environment.get("engine.name") == "mshtml" ||
        qx.core.Environment.get("engine.name") == "webkit"
      )
      {
        if (type == "keydown" && event.getDefaultPrevented())
        {
          // some key press events are already emulated. Ignore these events.
          if (!qx.event.util.Keyboard.isNonPrintableKeyCode(keyCode) && !this._emulateKeyPress[keyCode]) {
            this._fireSequenceEvent(domEvent, "keypress", keyIdentifier);
          }
        }
      }

      // Fire user action event
      // Needs to check if still alive first
      if (this.__window) {
        qx.event.Registration.fireEvent(this.__window, "useraction", qx.event.type.Data, [type]);
      }
    },


    /**
     * Get the target element for mouse events
     *
     * @return {Element} the event target element
     */
    __getEventTarget : function()
    {
      var focusHandler = this.__manager.getHandler(qx.event.handler.Focus);
      var target = focusHandler.getActive();

      // Fallback to focused element when active is null or invisible
      if (!target || target.offsetWidth == 0) {
        target = focusHandler.getFocus();
      }

      // Fallback to body when focused is null or invisible
      if (!target || target.offsetWidth == 0) {
        target = this.__manager.getWindow().document.body;
      }

      return target;
    },




    /*
    ---------------------------------------------------------------------------
      OBSERVER INIT/STOP
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes the native key event listeners.
     *
     * @signature function()
     */
    _initKeyObserver : function()
    {
      this.__onKeyUpDownWrapper = qx.lang.Function.listener(this.__onKeyUpDown, this);
      this.__onKeyPressWrapper = qx.lang.Function.listener(this.__onKeyPress, this);

      var Event = qx.bom.Event;

      Event.addNativeListener(this.__root, "keyup", this.__onKeyUpDownWrapper);
      Event.addNativeListener(this.__root, "keydown", this.__onKeyUpDownWrapper);
      Event.addNativeListener(this.__root, "keypress", this.__onKeyPressWrapper);
    },


    /**
     * Stops the native key event listeners.
     *
     * @signature function()
     */
    _stopKeyObserver : function()
    {
      var Event = qx.bom.Event;

      Event.removeNativeListener(this.__root, "keyup", this.__onKeyUpDownWrapper);
      Event.removeNativeListener(this.__root, "keydown", this.__onKeyUpDownWrapper);
      Event.removeNativeListener(this.__root, "keypress", this.__onKeyPressWrapper);

      for (var key in (this.__inputListeners || {}))
      {
        var listener = this.__inputListeners[key];
        Event.removeNativeListener(listener.target, "keypress", listener.callback);
      }
      delete(this.__inputListeners);
    },





    /*
    ---------------------------------------------------------------------------
      NATIVE EVENT OBSERVERS
    ---------------------------------------------------------------------------
    */

    /**
     * Low level handler for "keyup" and "keydown" events
     *
     * @internal
     * @signature function(domEvent)
     * @param domEvent {Event} DOM event object
     */
    __onKeyUpDown : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        domEvent = window.event || domEvent;

        var keyCode = domEvent.keyCode;
        var charCode = 0;
        var type = domEvent.type;

        // Ignore the down in such sequences dp dp dp
        if (!(this.__lastUpDownType[keyCode] == "keydown" && type == "keydown")) {
          this._idealKeyHandler(keyCode, charCode, type, domEvent);
        }

        // On non print-able character be sure to add a keypress event
        if (type == "keydown")
        {
          // non-printable, backspace or tab
          if (qx.event.util.Keyboard.isNonPrintableKeyCode(keyCode) || this._emulateKeyPress[keyCode]) {
            this._idealKeyHandler(keyCode, charCode, "keypress", domEvent);
          }
        }

        // Store last type
        this.__lastUpDownType[keyCode] = type;
      },

      "gecko" : function(domEvent)
      {
        var charCode = 0;
        var keyCode = domEvent.keyCode;
        var type = domEvent.type;
        var kbUtil = qx.event.util.Keyboard;

        // FF repeats under windows keydown events like IE
        if (qx.core.Environment.get("os.name") == "win")
        {
          var keyIdentifier = keyCode ? kbUtil.keyCodeToIdentifier(keyCode) : kbUtil.charCodeToIdentifier(charCode);

          if (!(this.__lastUpDownType[keyIdentifier] == "keydown" && type == "keydown")) {
            this._idealKeyHandler(keyCode, charCode, type, domEvent);
          }

          // Store last type
          this.__lastUpDownType[keyIdentifier] = type;
        }

        // all other OSes
        else
        {
          this._idealKeyHandler(keyCode, charCode, type, domEvent);
        }

        this.__firefoxInputFix(domEvent.target, type, keyCode);
      },

      "webkit" : function(domEvent)
      {
        var keyCode = 0;
        var charCode = 0;
        var type = domEvent.type;

        keyCode = domEvent.keyCode;

        this._idealKeyHandler(keyCode, charCode, type, domEvent);

        // On non print-able character be sure to add a keypress event
        if (type == "keydown")
        {
          // non-printable, backspace or tab
          if (qx.event.util.Keyboard.isNonPrintableKeyCode(keyCode) || this._emulateKeyPress[keyCode]) {
            this._idealKeyHandler(keyCode, charCode, "keypress", domEvent);
          }
        }

        // Store last type
        this.__lastUpDownType[keyCode] = type;
      },

      "opera" : function(domEvent)
      {
        this.__lastKeyCode = domEvent.keyCode;
        this._idealKeyHandler(domEvent.keyCode, 0, domEvent.type, domEvent);
      }
    })),


    /**
     * some keys like "up", "down", "pageup", "pagedown" do not bubble a
     * "keypress" event in Firefox. To work around this bug we attach keypress
     * listeners directly to the input events.
     *
     * https://bugzilla.mozilla.org/show_bug.cgi?id=467513
     *
     * @signature function(target, type, keyCode)
     * @param target {Element} The event target
     * @param type {String} The event type
     * @param keyCode {Integer} the key code
     */
    __firefoxInputFix : qx.core.Environment.select("engine.name",
    {
      "gecko" : function(target, type, keyCode)
      {
        if (
          type === "keydown" &&
          (keyCode == 33 || keyCode == 34 || keyCode == 38 || keyCode == 40) &&
          target.type == "text" &&
          target.tagName.toLowerCase() === "input" &&
          target.getAttribute("autoComplete") !== "off"
        )
        {
          if (!this.__inputListeners) {
            this.__inputListeners = {};
          }
          var hash = qx.core.ObjectRegistry.toHashCode(target);
          if (this.__inputListeners[hash]) {
            return;
          }
          var self = this;
          this.__inputListeners[hash] = {
            target: target,
            callback : function(domEvent)
            {
              qx.bom.Event.stopPropagation(domEvent);
              self.__onKeyPress(domEvent);
            }
          };
          var listener = qx.event.GlobalError.observeMethod(this.__inputListeners[hash].callback);
          qx.bom.Event.addNativeListener(target, "keypress", listener);
        }
      },

      "default" : null
    }),


    /**
     * Low level key press handler
     *
     * @signature function(domEvent)
     * @param domEvent {Event} DOM event object
     */
    __onKeyPress : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        domEvent = window.event || domEvent;

        if (this._charCode2KeyCode[domEvent.keyCode]) {
          this._idealKeyHandler(this._charCode2KeyCode[domEvent.keyCode], 0, domEvent.type, domEvent);
        } else {
          this._idealKeyHandler(0, domEvent.keyCode, domEvent.type, domEvent);
        }
      },

      "gecko" : function(domEvent)
      {
        var charCode = domEvent.charCode;
        var type = domEvent.type;

        this._idealKeyHandler(domEvent.keyCode, charCode, type, domEvent);
      },

      "webkit" : function(domEvent)
      {
        if (this._charCode2KeyCode[domEvent.keyCode]) {
          this._idealKeyHandler(this._charCode2KeyCode[domEvent.keyCode], 0, domEvent.type, domEvent);
        } else {
          this._idealKeyHandler(0, domEvent.keyCode, domEvent.type, domEvent);
        }
      },

      "opera" : function(domEvent)
      {
        var keyCode = domEvent.keyCode;
        var type = domEvent.type;

        // Some keys are identified differently for key up/down and keypress
        // (e.g. "v" gets identified as "F7").
        // So we store the last key up/down keycode and compare it to the
        // current keycode.
        // See http://bugzilla.qooxdoo.org/show_bug.cgi?id=603
        if(keyCode != this.__lastKeyCode)
        {
          this._idealKeyHandler(0, this.__lastKeyCode, type, domEvent);
        }
        else
        {
          if (qx.event.util.Keyboard.keyCodeToIdentifierMap[domEvent.keyCode]) {
            this._idealKeyHandler(domEvent.keyCode, 0, domEvent.type, domEvent);
          } else {
            this._idealKeyHandler(0, domEvent.keyCode, domEvent.type, domEvent);
          }
        }

      }
    })),





    /*
    ---------------------------------------------------------------------------
      IDEAL KEY HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Key handler for an idealized browser.
     * Runs after the browser specific key handlers have normalized the key events.
     *
     * @param keyCode {String} keyboard code
     * @param charCode {String} character code
     * @param eventType {String} type of the event (keydown, keypress, keyup)
     * @param domEvent {Element} DomEvent
     */
    _idealKeyHandler : function(keyCode, charCode, eventType, domEvent)
    {
      var keyIdentifier;

      // Use: keyCode
      if (keyCode || (!keyCode && !charCode))
      {
        keyIdentifier = qx.event.util.Keyboard.keyCodeToIdentifier(keyCode);

        this._fireSequenceEvent(domEvent, eventType, keyIdentifier);
      }

      // Use: charCode
      else
      {
        keyIdentifier = qx.event.util.Keyboard.charCodeToIdentifier(charCode);

        this._fireSequenceEvent(domEvent, "keypress", keyIdentifier);
        this._fireInputEvent(domEvent, charCode);
      }
    },






    /*
    ---------------------------------------------------------------------------
      KEY MAPS
    ---------------------------------------------------------------------------
    */


    /**
     * @type {Map} maps the charcodes of special keys for key press emulation
     *
     * @lint ignoreReferenceField(_emulateKeyPress)
     */
    _emulateKeyPress : qx.core.Environment.select("engine.name",
    {
      "mshtml" : {
        8: true,
        9: true
      },

      "webkit" : {
        8: true,
        9: true,
        27: true
      },

      "default" : {}
    }),




    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * converts a key identifier back to a keycode
     *
     * @param keyIdentifier {String} The key identifier to convert
     * @return {Integer} keyboard code
     */
    _identifierToKeyCode : function(keyIdentifier) {
      return qx.event.util.Keyboard.identifierToKeyCodeMap[keyIdentifier] || keyIdentifier.charCodeAt(0);
    }
  },






  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._stopKeyObserver();
    this.__lastKeyCode = this.__manager = this.__window = this.__root = this.__lastUpDownType = null;
  },





  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics, members)
  {
    // register at the event handler
    qx.event.Registration.addHandler(statics);

    if ((qx.core.Environment.get("engine.name") == "mshtml") ||
      qx.core.Environment.get("engine.name") == "webkit")
    {
      members._charCode2KeyCode =
      {
        13 : 13,
        27 : 27
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Keyboard input event object.
 *
 * the interface of this class is based on the DOM Level 3 keyboard event
 * interface: http://www.w3.org/TR/DOM-Level-3-Events/#events-keyboardevents
 */
qx.Class.define("qx.event.type.KeyInput",
{
  extend : qx.event.type.Dom,




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Initialize the fields of the event.
     *
     * @param domEvent {Event} DOM event
     * @param target {Object} The event target
     * @param charCode {Integer} the character code
     * @return {qx.event.type.KeyInput} The initialized key event instance
     */
    init : function(domEvent, target, charCode)
    {
      this.base(arguments, domEvent, target, null, true, true);

      this._charCode = charCode;

      return this;
    },


    // overridden
    clone : function(embryo)
    {
      var clone = this.base(arguments, embryo);

      clone._charCode = this._charCode;

      return clone;
    },


    /**
     * Unicode number of the pressed character.
     *
     * @return {Integer} Unicode number of the pressed character
     */
    getCharCode : function() {
      return this._charCode;
    },


    /**
     * Returns the pressed character
     *
     * @return {String} The character
     */
    getChar : function() {
      return String.fromCharCode(this._charCode);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Keyboard event object.
 *
 * the interface of this class is based on the DOM Level 3 keyboard event
 * interface: http://www.w3.org/TR/DOM-Level-3-Events/#events-keyboardevents
 */
qx.Class.define("qx.event.type.KeySequence",
{
  extend : qx.event.type.Dom,




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Initialize the fields of the event.
     *
     * @param domEvent {Event} DOM event
     * @param target {Object} The event target
     * @param identifier {String} Key identifier
     * @return {qx.event.type.KeySequence} The initialized key event instance
     */
    init : function(domEvent, target, identifier)
    {
      this.base(arguments, domEvent, target, null, true, true);

      this._keyCode = domEvent.keyCode;
      this._identifier = identifier;

      return this;
    },


    // overridden
    clone : function(embryo)
    {
      var clone = this.base(arguments, embryo);

      clone._keyCode = this._keyCode;
      clone._identifier = this._identifier;

      return clone;
    },


    /**
     * Identifier of the pressed key. This property is modeled after the <em>KeyboardEvent.keyIdentifier</em> property
     * of the W3C DOM 3 event specification
     * (http://www.w3.org/TR/2003/NOTE-DOM-Level-3-Events-20031107/events.html#Events-KeyboardEvent-keyIdentifier).
     *
     * Printable keys are represented by an unicode string, non-printable keys
     * have one of the following values:
     *
     * <table>
     * <tr><th>Backspace</th><td>The Backspace (Back) key.</td></tr>
     * <tr><th>Tab</th><td>The Horizontal Tabulation (Tab) key.</td></tr>
     * <tr><th>Space</th><td>The Space (Spacebar) key.</td></tr>
     * <tr><th>Enter</th><td>The Enter key. Note: This key identifier is also used for the Return (Macintosh numpad) key.</td></tr>
     * <tr><th>Shift</th><td>The Shift key.</td></tr>
     * <tr><th>Control</th><td>The Control (Ctrl) key.</td></tr>
     * <tr><th>Alt</th><td>The Alt (Menu) key.</td></tr>
     * <tr><th>CapsLock</th><td>The CapsLock key</td></tr>
     * <tr><th>Meta</th><td>The Meta key. (Apple Meta and Windows key)</td></tr>
     * <tr><th>Escape</th><td>The Escape (Esc) key.</td></tr>
     * <tr><th>Left</th><td>The Left Arrow key.</td></tr>
     * <tr><th>Up</th><td>The Up Arrow key.</td></tr>
     * <tr><th>Right</th><td>The Right Arrow key.</td></tr>
     * <tr><th>Down</th><td>The Down Arrow key.</td></tr>
     * <tr><th>PageUp</th><td>The Page Up key.</td></tr>
     * <tr><th>PageDown</th><td>The Page Down (Next) key.</td></tr>
     * <tr><th>End</th><td>The End key.</td></tr>
     * <tr><th>Home</th><td>The Home key.</td></tr>
     * <tr><th>Insert</th><td>The Insert (Ins) key. (Does not fire in Opera/Win)</td></tr>
     * <tr><th>Delete</th><td>The Delete (Del) Key.</td></tr>
     * <tr><th>F1</th><td>The F1 key.</td></tr>
     * <tr><th>F2</th><td>The F2 key.</td></tr>
     * <tr><th>F3</th><td>The F3 key.</td></tr>
     * <tr><th>F4</th><td>The F4 key.</td></tr>
     * <tr><th>F5</th><td>The F5 key.</td></tr>
     * <tr><th>F6</th><td>The F6 key.</td></tr>
     * <tr><th>F7</th><td>The F7 key.</td></tr>
     * <tr><th>F8</th><td>The F8 key.</td></tr>
     * <tr><th>F9</th><td>The F9 key.</td></tr>
     * <tr><th>F10</th><td>The F10 key.</td></tr>
     * <tr><th>F11</th><td>The F11 key.</td></tr>
     * <tr><th>F12</th><td>The F12 key.</td></tr>
     * <tr><th>NumLock</th><td>The Num Lock key.</td></tr>
     * <tr><th>PrintScreen</th><td>The Print Screen (PrintScrn, SnapShot) key.</td></tr>
     * <tr><th>Scroll</th><td>The scroll lock key</td></tr>
     * <tr><th>Pause</th><td>The pause/break key</td></tr>
     * <tr><th>Win</th><td>The Windows Logo key</td></tr>
     * <tr><th>Apps</th><td>The Application key (Windows Context Menu)</td></tr>
     * </table>
     *
     * @return {String} The key identifier
     */
    getKeyIdentifier : function() {
      return this._identifier;
    },


    /**
     * Returns the native keyCode and is best used on keydown/keyup events to
     * check which physical key was pressed.
     * Don't use this on keypress events because it's erroneous and
     * inconsistent across browsers. But it can be used to detect which key is
     * exactly pressed (e.g. for num pad keys).
     * In any regular case, you should use {@link #getKeyIdentifier} which
     * takes care of all cross browser stuff.
     *
     * The key codes are not character codes, they are just ASCII codes to
     * identify the keyboard (or other input devices) keys.
     *
     * @return {Number} The key code.
     */
    getKeyCode : function() {
      return this._keyCode;
    },


    /**
     * Checks whether the pressed key is printable.
     *
     * @return {Boolean} Whether the pressed key is printable.
     */
    isPrintable : function() {
      return qx.event.util.Keyboard.isPrintableKeyIdentifier(this._identifier);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Utilities for working with character codes and key identifiers
 */
qx.Bootstrap.define("qx.event.util.Keyboard", {

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      KEY MAPS
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Map} maps the charcodes of special printable keys to key identifiers
     *
     * @lint ignoreReferenceField(specialCharCodeMap)
     */
    specialCharCodeMap :
    {
      8  : "Backspace",   // The Backspace (Back) key.
      9  : "Tab",         // The Horizontal Tabulation (Tab) key.

      //   Note: This key identifier is also used for the
      //   Return (Macintosh numpad) key.
      13 : "Enter",       // The Enter key.
      27 : "Escape",      // The Escape (Esc) key.
      32 : "Space"        // The Space (Spacebar) key.
    },

    /**
     * @type {Map} maps the keycodes of the numpad keys to the right charcodes
     *
     * @lint ignoreReferenceField(numpadToCharCode)
     */
    numpadToCharCode :
    {
       96 : "0".charCodeAt(0),
       97 : "1".charCodeAt(0),
       98 : "2".charCodeAt(0),
       99 : "3".charCodeAt(0),
      100 : "4".charCodeAt(0),
      101 : "5".charCodeAt(0),
      102 : "6".charCodeAt(0),
      103 : "7".charCodeAt(0),
      104 : "8".charCodeAt(0),
      105 : "9".charCodeAt(0),
      106 : "*".charCodeAt(0),
      107 : "+".charCodeAt(0),
      109 : "-".charCodeAt(0),
      110 : ",".charCodeAt(0),
      111 : "/".charCodeAt(0)
    },

    /**
     * @type {Map} maps the keycodes of non printable keys to key identifiers
     *
     * @lint ignoreReferenceField(keyCodeToIdentifierMap)
     */
    keyCodeToIdentifierMap :
    {
       16 : "Shift",        // The Shift key.
       17 : "Control",      // The Control (Ctrl) key.
       18 : "Alt",          // The Alt (Menu) key.
       20 : "CapsLock",     // The CapsLock key
      224 : "Meta",         // The Meta key. (Apple Meta and Windows key)

       37 : "Left",         // The Left Arrow key.
       38 : "Up",           // The Up Arrow key.
       39 : "Right",        // The Right Arrow key.
       40 : "Down",         // The Down Arrow key.

       33 : "PageUp",       // The Page Up key.
       34 : "PageDown",     // The Page Down (Next) key.

       35 : "End",          // The End key.
       36 : "Home",         // The Home key.

       45 : "Insert",       // The Insert (Ins) key. (Does not fire in Opera/Win)
       46 : "Delete",       // The Delete (Del) Key.

      112 : "F1",           // The F1 key.
      113 : "F2",           // The F2 key.
      114 : "F3",           // The F3 key.
      115 : "F4",           // The F4 key.
      116 : "F5",           // The F5 key.
      117 : "F6",           // The F6 key.
      118 : "F7",           // The F7 key.
      119 : "F8",           // The F8 key.
      120 : "F9",           // The F9 key.
      121 : "F10",          // The F10 key.
      122 : "F11",          // The F11 key.
      123 : "F12",          // The F12 key.

      144 : "NumLock",      // The Num Lock key.
       44 : "PrintScreen",  // The Print Screen (PrintScrn, SnapShot) key.
      145 : "Scroll",       // The scroll lock key
       19 : "Pause",        // The pause/break key
       // The left Windows Logo key or left cmd key
       91 : qx.core.Environment.get("os.name") == "osx" ? "cmd" : "Win",
       92 : "Win",          // The right Windows Logo key or left cmd key
       // The Application key (Windows Context Menu) or right cmd key
       93 : qx.core.Environment.get("os.name") == "osx" ? "cmd" : "Apps"
    },


    /** char code for capital A */
    charCodeA : "A".charCodeAt(0),
    /** char code for capital Z */
    charCodeZ : "Z".charCodeAt(0),
    /** char code for 0 */
    charCode0 : "0".charCodeAt(0),
    /** char code for 9 */
    charCode9 : "9".charCodeAt(0),

    /**
     * converts a keyboard code to the corresponding identifier
     *
     * @param keyCode {Integer} key code
     * @return {String} key identifier
     */
    keyCodeToIdentifier : function(keyCode)
    {
      if (this.isIdentifiableKeyCode(keyCode))
      {
        var numPadKeyCode = this.numpadToCharCode[keyCode];

        if (numPadKeyCode) {
          return String.fromCharCode(numPadKeyCode);
        }

        return (this.keyCodeToIdentifierMap[keyCode] || this.specialCharCodeMap[keyCode] || String.fromCharCode(keyCode));
      }
      else
      {
        return "Unidentified";
      }
    },


    /**
     * converts a character code to the corresponding identifier
     *
     * @param charCode {String} character code
     * @return {String} key identifier
     */
    charCodeToIdentifier : function(charCode) {
      return this.specialCharCodeMap[charCode] || String.fromCharCode(charCode).toUpperCase();
    },


    /**
     * Check whether the keycode can be reliably detected in keyup/keydown events
     *
     * @param keyCode {String} key code to check.
     * @return {Boolean} Whether the keycode can be reliably detected in keyup/keydown events.
     */
    isIdentifiableKeyCode : function(keyCode)
    {
      if (keyCode >= this.charCodeA && keyCode <= this.charCodeZ) {
        return true;
      }

      // 0-9
      if (keyCode >= this.charCode0 && keyCode <= this.charCode9) {
        return true;
      }

      // Enter, Space, Tab, Backspace
      if (this.specialCharCodeMap[keyCode]) {
        return true;
      }

      // Numpad
      if (this.numpadToCharCode[keyCode]) {
        return true;
      }

      // non printable keys
      if (this.isNonPrintableKeyCode(keyCode)) {
        return true;
      }

      return false;
    },


    /**
     * Checks whether the keyCode represents a non printable key
     *
     * @param keyCode {String} key code to check.
     * @return {Boolean} Whether the keyCode represents a non printable key.
     */
    isNonPrintableKeyCode : function(keyCode) {
      return this.keyCodeToIdentifierMap[keyCode] ? true : false;
    },


    /**
     * Checks whether a given string is a valid keyIdentifier
     *
     * @param keyIdentifier {String} The key identifier.
     * @return {Boolean} whether the given string is a valid keyIdentifier
     */
    isValidKeyIdentifier : function(keyIdentifier)
    {
      if (this.identifierToKeyCodeMap[keyIdentifier]) {
        return true;
      }

      if (keyIdentifier.length != 1) {
        return false;
      }

      if (keyIdentifier >= "0" && keyIdentifier <= "9") {
        return true;
      }

      if (keyIdentifier >= "A" && keyIdentifier <= "Z") {
        return true;
      }

      switch(keyIdentifier)
      {
        case "+":
        case "-":
        case "*":
        case "/":
          return true;

        default:
          return false;
      }
    },


    /**
     * Checks whether a given string is a printable keyIdentifier.
     *
     * @param keyIdentifier {String} The key identifier.
     * @return {Boolean} whether the given string is a printable keyIdentifier.
     */
    isPrintableKeyIdentifier : function(keyIdentifier)
    {
      if (keyIdentifier === "Space") {
        return true;
      } else {
        return this.identifierToKeyCodeMap[keyIdentifier] ? false : true;
      }
    }
  },

  defer : function(statics, members)
  {
    // construct inverse of keyCodeToIdentifierMap
    if (!statics.identifierToKeyCodeMap)
    {
      statics.identifierToKeyCodeMap = {};

      for (var key in statics.keyCodeToIdentifierMap) {
        statics.identifierToKeyCodeMap[statics.keyCodeToIdentifierMap[key]] = parseInt(key, 10);
      }

      for (var key in statics.specialCharCodeMap) {
        statics.identifierToKeyCodeMap[statics.specialCharCodeMap[key]] = parseInt(key, 10);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This handler is used to normalize all focus/activation requirements
 * and normalize all cross browser quirks in this area.
 *
 * Notes:
 *
 * * Webkit and Opera (before 9.5) do not support tabIndex for all elements
 * (See also: https://bugs.webkit.org/show_bug.cgi?id=7138)
 *
 * * TabIndex is normally 0, which means all naturally focusable elements are focusable.
 * * TabIndex > 0 means that the element is focusable and tabable
 * * TabIndex < 0 means that the element, even if naturally possible, is not focusable.
 *
 * @use(qx.event.dispatch.DomBubbling)
 */
qx.Class.define("qx.event.handler.Focus",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this._manager = manager;
    this._window = manager.getWindow();
    this._document = this._window.document;
    this._root = this._document.documentElement;
    this._body = this._document.body;

    // abstraction
    var useTouch = qx.core.Environment.get("event.touch") && qx.event.handler.MouseEmulation.ON;
    this.__down = useTouch ? "touchstart" : "mousedown";
    this.__up = useTouch ? "touchend" : "mouseup";

    // Initialize
    this._initObserver();
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The active DOM element */
    active :
    {
      apply : "_applyActive",
      nullable : true
    },

    /** The focussed DOM element */
    focus :
    {
      apply : "_applyFocus",
      nullable : true
    }
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      focus : 1,
      blur : 1,
      focusin : 1,
      focusout : 1,
      activate : 1,
      deactivate : 1
    },

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true,

    /**
     * @type {Map} See: http://msdn.microsoft.com/en-us/library/ms534654(VS.85).aspx
     */
    FOCUSABLE_ELEMENTS : qx.core.Environment.select("engine.name",
    {
      "mshtml|gecko" :
      {
        a : 1,
        body : 1,
        button : 1,
        frame : 1,
        iframe : 1,
        img : 1,
        input : 1,
        object : 1,
        select : 1,
        textarea : 1
      },

      "opera|webkit" :
      {
        button : 1,
        input : 1,
        select : 1,
        textarea : 1
      }
    })
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __onNativeMouseDownWrapper : null,
    __onNativeMouseUpWrapper : null,
    __onNativeFocusWrapper : null,
    __onNativeBlurWrapper : null,
    __onNativeDragGestureWrapper : null,
    __onNativeSelectStartWrapper : null,
    __onNativeFocusInWrapper : null,
    __onNativeFocusOutWrapper : null,
    __previousFocus : null,
    __previousActive : null,
    __down : "",
    __up : "",

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},

    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },

    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },

    /*
    ---------------------------------------------------------------------------
      FOCUS/BLUR USER INTERFACE
    ---------------------------------------------------------------------------
    */

    /**
     * Focuses the given DOM element
     *
     * @param element {Element} DOM element to focus
     */
    focus : function(element)
    {
      // Fixed timing issue with IE, see [BUG #3267]
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        window.setTimeout(function()
        {
          try {
            // focus element before set cursor position
            element.focus();

            // Fixed cursor position issue with IE, only when nothing is selected.
            // See [BUG #3519] for details.
            var selection = qx.bom.Selection.get(element);
            if (selection.length == 0) {
              var textRange = element.createTextRange();
              textRange.moveStart('character', element.value.length);
              textRange.collapse();
              textRange.select();
            }
          } catch(ex) {};
        }, 0);
      }
      else
      {
        try {
          element.focus();
        } catch(ex) {};
      }

      this.setFocus(element);
      this.setActive(element);
    },

    /**
     * Activates the given DOM element
     *
     * @param element {Element} DOM element to activate
     */
    activate : function(element) {
      this.setActive(element);
    },

    /**
     * Blurs the given DOM element
     *
     * @param element {Element} DOM element to focus
     */
    blur : function(element)
    {
      try {
        element.blur();
      } catch(ex) {};

      if (this.getActive() === element) {
        this.resetActive();
      }

      if (this.getFocus() === element) {
        this.resetFocus();
      }
    },

    /**
     * Deactivates the given DOM element
     *
     * @param element {Element} DOM element to activate
     */
    deactivate : function(element)
    {
      if (this.getActive() === element) {
        this.resetActive();
      }
    },

    /**
     * Tries to activate the given element. This checks whether
     * the activation is allowed first.
     *
     * @param element {Element} DOM element to activate
     */
    tryActivate : function(element)
    {
      var active = this.__findActivatableElement(element);
      if (active) {
        this.setActive(active);
      }
    },

    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Shorthand to fire events from within this class.
     *
     * @param target {Element} DOM element which is the target
     * @param related {Element} DOM element which is the related target
     * @param type {String} Name of the event to fire
     * @param bubbles {Boolean} Whether the event should bubble
     */
    __fireEvent : function(target, related, type, bubbles)
    {
      var Registration = qx.event.Registration;

      var evt = Registration.createEvent(type, qx.event.type.Focus, [target, related, bubbles]);
      Registration.dispatchEvent(target, evt);
    },

    /*
    ---------------------------------------------------------------------------
      WINDOW FOCUS/BLUR SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Whether the window is focused currently */
    _windowFocused : true,

    /**
     * Helper for native event listeners to react on window blur
     */
    __doWindowBlur : function()
    {
      // Omit doubled blur events
      // which is a common behavior at least for gecko based clients
      if (this._windowFocused)
      {
        this._windowFocused = false;
        this.__fireEvent(this._window, null, "blur", false);
      }
    },


    /**
     * Helper for native event listeners to react on window focus
     */
    __doWindowFocus : function()
    {
      // Omit doubled focus events
      // which is a common behavior at least for gecko based clients
      if (!this._windowFocused)
      {
        this._windowFocused = true;
        this.__fireEvent(this._window, null, "focus", false);
      }
    },

    /*
    ---------------------------------------------------------------------------
      NATIVE OBSERVER
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes event listeners.
     *
     * @signature function()
     */
    _initObserver : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        // Bind methods
        this.__onNativeMouseDownWrapper = qx.lang.Function.listener(this.__onNativeMouseDown, this);
        this.__onNativeMouseUpWrapper = qx.lang.Function.listener(this.__onNativeMouseUp, this);

        this.__onNativeFocusWrapper = qx.lang.Function.listener(this.__onNativeFocus, this);
        this.__onNativeBlurWrapper = qx.lang.Function.listener(this.__onNativeBlur, this);

        this.__onNativeDragGestureWrapper = qx.lang.Function.listener(this.__onNativeDragGesture, this);

        // Register events
        qx.bom.Event.addNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.addNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);

        // Capturing is needed for gecko to correctly
        // handle focus of input and textarea fields
        qx.bom.Event.addNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);

        // Capture drag events
        qx.bom.Event.addNativeListener(this._window, "draggesture", this.__onNativeDragGestureWrapper, true);
      },

      "mshtml" : function()
      {
        // Bind methods
        this.__onNativeMouseDownWrapper = qx.lang.Function.listener(this.__onNativeMouseDown, this);
        this.__onNativeMouseUpWrapper = qx.lang.Function.listener(this.__onNativeMouseUp, this);

        this.__onNativeFocusInWrapper = qx.lang.Function.listener(this.__onNativeFocusIn, this);
        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);

        this.__onNativeSelectStartWrapper = qx.lang.Function.listener(this.__onNativeSelectStart, this);


        // Register events
        qx.bom.Event.addNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper);
        qx.bom.Event.addNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper);

        // MSHTML supports their own focusin and focusout events
        // To detect which elements get focus the target is useful
        // The window blur can detected using focusout and look
        // for the toTarget property which is empty in this case.
        qx.bom.Event.addNativeListener(this._document, "focusin", this.__onNativeFocusInWrapper);
        qx.bom.Event.addNativeListener(this._document, "focusout", this.__onNativeFocusOutWrapper);

        // Add selectstart to prevent selection
        qx.bom.Event.addNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper);
      },

      "webkit" : function()
      {
        // Bind methods
        this.__onNativeMouseDownWrapper = qx.lang.Function.listener(this.__onNativeMouseDown, this);
        this.__onNativeMouseUpWrapper = qx.lang.Function.listener(this.__onNativeMouseUp, this);

        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);

        this.__onNativeFocusWrapper = qx.lang.Function.listener(this.__onNativeFocus, this);
        this.__onNativeBlurWrapper = qx.lang.Function.listener(this.__onNativeBlur, this);

        this.__onNativeSelectStartWrapper = qx.lang.Function.listener(this.__onNativeSelectStart, this);


        // Register events
        qx.bom.Event.addNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.addNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);
        qx.bom.Event.addNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper, false);

        qx.bom.Event.addNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);

        qx.bom.Event.addNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);
      },

      "opera" : function()
      {
        // Bind methods
        this.__onNativeMouseDownWrapper = qx.lang.Function.listener(this.__onNativeMouseDown, this);
        this.__onNativeMouseUpWrapper = qx.lang.Function.listener(this.__onNativeMouseUp, this);

        this.__onNativeFocusInWrapper = qx.lang.Function.listener(this.__onNativeFocusIn, this);
        this.__onNativeFocusOutWrapper = qx.lang.Function.listener(this.__onNativeFocusOut, this);


        // Register events
        qx.bom.Event.addNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.addNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);

        qx.bom.Event.addNativeListener(this._window, "DOMFocusIn", this.__onNativeFocusInWrapper, true);
        qx.bom.Event.addNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);
      }
    }),

    /**
     * Disconnects event listeners.
     *
     * @signature function()
     */
    _stopObserver : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        qx.bom.Event.removeNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.removeNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "draggesture", this.__onNativeDragGestureWrapper, true);
      },

      "mshtml" : function()
      {
        qx.bom.Event.removeNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper);
        qx.bom.Event.removeNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper);
        qx.bom.Event.removeNativeListener(this._document, "focusin", this.__onNativeFocusInWrapper);
        qx.bom.Event.removeNativeListener(this._document, "focusout", this.__onNativeFocusOutWrapper);
        qx.bom.Event.removeNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper);
      },

      "webkit" : function()
      {
        qx.bom.Event.removeNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.removeNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);
        qx.bom.Event.removeNativeListener(this._document, "selectstart", this.__onNativeSelectStartWrapper, false);

        qx.bom.Event.removeNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "focus", this.__onNativeFocusWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "blur", this.__onNativeBlurWrapper, true);
      },

      "opera" : function()
      {
        qx.bom.Event.removeNativeListener(this._document, this.__down, this.__onNativeMouseDownWrapper, true);
        qx.bom.Event.removeNativeListener(this._document, this.__up, this.__onNativeMouseUpWrapper, true);

        qx.bom.Event.removeNativeListener(this._window, "DOMFocusIn", this.__onNativeFocusInWrapper, true);
        qx.bom.Event.removeNativeListener(this._window, "DOMFocusOut", this.__onNativeFocusOutWrapper, true);
      }
    }),

    /*
    ---------------------------------------------------------------------------
      NATIVE LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Native event listener for <code>draggesture</code> event
     * supported by gecko. Used to stop native drag and drop when
     * selection is disabled.
     *
     * @see https://developer.mozilla.org/en-US/docs/Drag_and_Drop
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeDragGesture : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (!this.__isSelectable(target)) {
          qx.bom.Event.preventDefault(domEvent);
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>DOMFocusIn</code> or <code>focusin</code>
     * depending on the client's engine.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocusIn : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        // Force window focus to be the first
        this.__doWindowFocus();

        // Update internal data
        var target = qx.bom.Event.getTarget(domEvent);

        // IE focusin is also fired on elements which are not focusable at all
        // We need to look up for the next focusable element.
        var focusTarget = this.__findFocusableElement(target);
        if (focusTarget) {
          this.setFocus(focusTarget);
        }

        // Make target active
        this.tryActivate(target);
      },

      "opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target == this._document || target == this._window)
        {
          this.__doWindowFocus();

          if (this.__previousFocus)
          {
            this.setFocus(this.__previousFocus);
            delete this.__previousFocus;
          }

          if (this.__previousActive)
          {
            this.setActive(this.__previousActive);
            delete this.__previousActive;
          }
        }
        else
        {
          this.setFocus(target);
          this.tryActivate(target);

          // Clear selection
          if (!this.__isSelectable(target))
          {
            target.selectionStart = 0;
            target.selectionEnd = 0;
          }
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>DOMFocusOut</code> or <code>focusout</code>
     * depending on the client's engine.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocusOut : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        var relatedTarget = qx.bom.Event.getRelatedTarget(domEvent);

        // If the focus goes to nowhere (the document is blurred)
        if (relatedTarget == null)
        {
          // Update internal representation
          this.__doWindowBlur();

          // Reset active and focus
          this.resetFocus();
          this.resetActive();
        }
      },

      "webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);

        if (target === this.getFocus()) {
          this.resetFocus();
        }

        if (target === this.getActive()) {
          this.resetActive();
        }
      },

      "opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target == this._document)
        {
          this.__doWindowBlur();

          // Store old focus/active elements
          // Opera do not fire focus events for them
          // when refocussing the window (in my opinion an error)
          this.__previousFocus = this.getFocus();
          this.__previousActive = this.getActive();

          this.resetFocus();
          this.resetActive();
        }
        else
        {
          if (target === this.getFocus()) {
            this.resetFocus();
          }

          if (target === this.getActive()) {
            this.resetActive();
          }
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>blur</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeBlur : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowBlur();

          this.resetActive();
          this.resetFocus();
        }
      },

      "webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowBlur();

          // Store old focus/active elements
          // Opera do not fire focus events for them
          // when refocussing the window (in my opinion an error)
          this.__previousFocus = this.getFocus();
          this.__previousActive = this.getActive();

          this.resetActive();
          this.resetFocus();
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>focus</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeFocus : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "gecko" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);

        if (target === this._window || target === this._document)
        {
          this.__doWindowFocus();

          // Always speak of the body, not the window or document
          target = this._body;
        }

        this.setFocus(target);
        this.tryActivate(target);
      },

      "webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target === this._window || target === this._document)
        {
          this.__doWindowFocus();

          if (this.__previousFocus)
          {
            this.setFocus(this.__previousFocus);
            delete this.__previousFocus;
          }

          if (this.__previousActive)
          {
            this.setActive(this.__previousActive);
            delete this.__previousActive;
          }
        }
        else
        {
          this.setFocus(target);
          this.tryActivate(target);
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>mousedown</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeMouseDown : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);

        // Stop events when no focus element available (or blocked)
        var focusTarget = this.__findFocusableElement(target);
        if (focusTarget)
        {
          // Add unselectable to keep selection
          if (!this.__isSelectable(target))
          {
            // The element is not selectable. Block selection.
            target.unselectable = "on";

            // Unselectable may keep the current selection which
            // is not what we like when changing the focus element.
            // So we clear it
            try {
              document.selection.empty();
            } catch (ex) {
              // ignore 'Unknown runtime error'
            }

            // The unselectable attribute stops focussing as well.
            // Do this manually.
            try {
              focusTarget.focus();
            } catch (ex) {
              // ignore "Can't move focus of this control" error
            }
          }
        }
        else
        {
          // Stop event for blocking support
          qx.bom.Event.preventDefault(domEvent);

          // Add unselectable to keep selection
          if (!this.__isSelectable(target)) {
            target.unselectable = "on";
          }
        }
      },

      "webkit|gecko" : function(domEvent) {
        var target = qx.bom.Event.getTarget(domEvent);
        var focusTarget = this.__findFocusableElement(target);

        if (focusTarget) {
          this.setFocus(focusTarget);
          if (qx.core.Environment.get("event.touch") && qx.event.handler.MouseEmulation.ON) {
            // use a timeout to make sure the kex inputs are working [#7867]
            qx.event.GlobalError.observeMethod(window.setTimeout(function() {
              try {
                // if the element is already focused, blur and refocus
                // it to make sure the keyboard is shown on tap
                if (document.activeElement == focusTarget) {
                  focusTarget.blur();
                }
                focusTarget.focus();
              } catch(ex) {};
            }, 200));
          }
        } else {
          qx.bom.Event.preventDefault(domEvent);
        }
      },

      "opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        var focusTarget = this.__findFocusableElement(target);

        if (!this.__isSelectable(target)) {
          // Prevent the default action for all non-selectable
          // targets. This prevents text selection and context menu.
          qx.bom.Event.preventDefault(domEvent);

          // The stopped event keeps the selection
          // of the previously focused element.
          // We need to clear the old selection.
          if (focusTarget)
          {
            var current = this.getFocus();
            if (current && current.selectionEnd)
            {
              current.selectionStart = 0;
              current.selectionEnd = 0;
              current.blur();
            }

            // The prevented event also stop the focus, do
            // it manually if needed.
            if (focusTarget) {
              this.setFocus(focusTarget);
            }
          }
        } else if (focusTarget) {
          this.setFocus(focusTarget);
        }
      },

      "default" : null
    })),

    /**
     * Native event listener for <code>mouseup</code>.
     *
     * @signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeMouseUp : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (target.unselectable) {
          target.unselectable = "off";
        }

        this.tryActivate(this.__fixFocus(target));
      },

      "gecko" : function(domEvent)
      {
        // As of Firefox 3.0:
        // Gecko fires mouseup on XUL elements
        // We only want to deal with real HTML elements
        var target = qx.bom.Event.getTarget(domEvent);
        while (target && target.offsetWidth === undefined) {
          target = target.parentNode;
        }

        if (target) {
          this.tryActivate(target);
        }

      },

      "webkit|opera" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        this.tryActivate(this.__fixFocus(target));
      },

      "default" : null
    })),

    /**
     * Fix for bug #2602.
     *
     * @signature function(target)
     * @param target {Element} target element from mouse up event
     * @return {Element} Element to activate;
     */
    __fixFocus : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml|webkit" : function(target)
      {
        var focusedElement = this.getFocus();
        if (focusedElement && target != focusedElement &&
            (focusedElement.nodeName.toLowerCase() === "input" ||
            focusedElement.nodeName.toLowerCase() === "textarea")) {
          target = focusedElement;
        }

        return target;
      },

      "default" : function(target) {
        return target;
      }
    })),

    /**
     * Native event listener for <code>selectstart</code>.
     *
     *@signature function(domEvent)
     * @param domEvent {Event} Native event
     */
    __onNativeSelectStart : qx.event.GlobalError.observeMethod(qx.core.Environment.select("engine.name",
    {
      "mshtml|webkit" : function(domEvent)
      {
        var target = qx.bom.Event.getTarget(domEvent);
        if (!this.__isSelectable(target)) {
          qx.bom.Event.preventDefault(domEvent);
        }
      },

      "default" : null
    })),

    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the given element is focusable. This is perfectly modeled to the
     * browsers behavior and this way may differ in the various clients.
     *
     * @param el {Element} DOM Element to query
     * @return {Boolean} Whether the element is focusable
     */
    __isFocusable : function(el)
    {
      var index = qx.bom.element.Attribute.get(el, "tabIndex");
      if (index >= 1) {
        return true;
      }

      var focusable = qx.event.handler.Focus.FOCUSABLE_ELEMENTS;
      if (index >= 0 && focusable[el.tagName]) {
        return true;
      }

      return false;
    },


    /**
     * Returns the next focusable parent element of an activated DOM element.
     *
     * @param el {Element} Element to start lookup with.
     * @return {Element|null} The next focusable element.
     */
    __findFocusableElement : function(el)
    {
      while (el && el.nodeType === 1)
      {
        if (el.getAttribute("qxKeepFocus") == "on") {
          return null;
        }

        if (this.__isFocusable(el)) {
          return el;
        }

        el = el.parentNode;
      }

      // This should be identical to the one which is selected when
      // clicking into an empty page area. In mshtml this must be
      // the body of the document.
      return this._body;
    },

    /**
     * Returns the next activatable element. May be the element itself.
     * Works a bit different than the method {@link #__findFocusableElement}
     * as it looks up for a parent which is has a keep focus flag. When
     * there is such a parent it returns null otherwise the original
     * incoming element.
     *
     * @param el {Element} Element to start lookup with.
     * @return {Element} The next activatable element.
     */
    __findActivatableElement : function(el)
    {
      var orig = el;

      while (el && el.nodeType === 1)
      {
        if (el.getAttribute("qxKeepActive") == "on") {
          return null;
        }

        el = el.parentNode;
      }

      return orig;
    },

    /**
     * Whether the given el (or its content) should be selectable
     * by the user.
     *
     * @param node {Element} Node to start lookup with
     * @return {Boolean} Whether the content is selectable.
     */
    __isSelectable : function(node)
    {
      while(node && node.nodeType === 1)
      {
        var attr = node.getAttribute("qxSelectable");
        if (attr != null) {
          return attr === "on";
        }

        node = node.parentNode;
      }

      return true;
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // apply routine
    _applyActive : function(value, old)
    {
      // Fire events
      if (old) {
        this.__fireEvent(old, value, "deactivate", true);
      }

      if (value) {
        this.__fireEvent(value, old, "activate", true);
      }
    },

    // apply routine
    _applyFocus : function(value, old)
    {
      // Fire bubbling events
      if (old) {
        this.__fireEvent(old, value, "focusout", true);
      }

      if (value) {
        this.__fireEvent(value, old, "focusin", true);
      }

      // Fire after events
      if (old) {
        this.__fireEvent(old, value, "blur", false);
      }

      if (value) {
        this.__fireEvent(value, old, "focus", false);
      }
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._stopObserver();
    this._manager = this._window = this._document = this._root = this._body =
      this.__mouseActive = null;
  },

  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    qx.event.Registration.addHandler(statics);

    // For faster lookups generate uppercase tag names dynamically
    var focusable = statics.FOCUSABLE_ELEMENTS;
    for (var entry in focusable) {
      focusable[entry.toUpperCase()] = 1;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Alexander Steitz (aback)

************************************************************************ */



/**
 * Low-level selection API to select elements like input and textarea elements
 * as well as text nodes or elements which their child nodes.
 *
 * @ignore(qx.bom.Element, qx.bom.Element.blur)
 */
qx.Bootstrap.define("qx.bom.Selection",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Returns the native selection object.
     *
     * @signature function(documentNode)
     * @param documentNode {document} Document node to retrieve the connected selection from
     * @return {Selection} native selection object
     */
    getSelectionObject : qx.core.Environment.select("html.selection",
    {
      "selection" : function(documentNode) {
        return documentNode.selection;
      },

      // suitable for gecko, opera, webkit and mshtml >= 9
      "default" : function(documentNode) {
        return qx.dom.Node.getWindow(documentNode).getSelection();
      }
    }),


    /**
     * Returns the current selected text.
     *
     * @signature function(node)
     * @param node {Node} node to retrieve the selection for
     * @return {String|null} selected text as string
     */
    get : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        // to get the selected text in legacy IE you have to work with the TextRange
        // of the selection object. So always pass the document node to the
        // Range class to get this TextRange object.
        var rng = qx.bom.Range.get(qx.dom.Node.getDocument(node));
        return rng.text;
      },

      // suitable for gecko, opera and webkit
      "default" : function(node)
      {
        if (this.__isInputOrTextarea(node)) {
          return node.value.substring(node.selectionStart, node.selectionEnd);
        } else {
          return this.getSelectionObject(qx.dom.Node.getDocument(node)).toString();
        }
      }
    }),


    /**
     * Returns the length of the selection
     *
     * @signature function(node)
     * @param node {Node} Form node or document/window to check.
     * @return {Integer|null} length of the selection or null
     */
    getLength : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        var selectedValue = this.get(node);
        // get the selected part and split it by linebreaks
        var split = qx.util.StringSplit.split(selectedValue, /\r\n/);

        // return the length substracted by the count of linebreaks
        // legacy IE counts linebreaks as two chars
        // -> harmonize this to one char per linebreak
        return selectedValue.length - (split.length - 1);
      },

      "default" : function(node)
      {
        if (qx.core.Environment.get("engine.name") == "opera") {
          var selectedValue, selectedLength, split;

          if (this.__isInputOrTextarea(node))
          {
            var start = node.selectionStart;
            var end = node.selectionEnd;

            selectedValue = node.value.substring(start, end);
            selectedLength = end - start;
          }
          else
          {
            selectedValue = qx.bom.Selection.get(node);
            selectedLength = selectedValue.length;
          }

          // get the selected part and split it by linebreaks
          split = qx.util.StringSplit.split(selectedValue, /\r\n/);

          // substract the count of linebreaks
          // Opera counts each linebreak as two chars
          // -> harmonize this to one char per linebreak
          return selectedLength - (split.length - 1);
        }

        // suitable for gecko and webkit
        if (this.__isInputOrTextarea(node)) {
          return node.selectionEnd - node.selectionStart;
        } else {
          return this.get(node).length;
        }
      }
    }),


    /**
     * Returns the start of the selection
     *
     * @signature function(node)
     * @param node {Node} node to check for
     * @return {Integer} start of current selection or "-1" if the current
     *                   selection is not within the given node
     */
    getStart : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        if (this.__isInputOrTextarea(node))
        {
          var documentRange = qx.bom.Range.get();

          // Check if the document.selection is the text range inside the input element
          if (!node.contains(documentRange.parentElement())) {
            return -1;
          }

          var range = qx.bom.Range.get(node);
          var len = node.value.length;

          // Synchronize range start and end points
          range.moveToBookmark(documentRange.getBookmark());
          range.moveEnd('character', len);

          return len - range.text.length;
        }
        else
        {
          var range = qx.bom.Range.get(node);
          var parentElement = range.parentElement();

          // get a range which holds the text of the parent element
          var elementRange = qx.bom.Range.get();
          try {
            // IE throws an invalid argument error when the document has no selection
            elementRange.moveToElementText(parentElement);
          } catch(ex) {
            return 0;
          }

          // Move end points of full range so it starts at the user selection
          // and ends at the end of the element text.
          var bodyRange = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
          bodyRange.setEndPoint("StartToStart", range);
          bodyRange.setEndPoint("EndToEnd", elementRange);

          // selection is at beginning
          if (elementRange.compareEndPoints("StartToStart", bodyRange) == 0) {
            return 0;
          }

          var moved;
          var steps = 0;
          while (true)
          {
            moved = bodyRange.moveStart("character", -1);

            // Starting points of both ranges are equal
            if (elementRange.compareEndPoints("StartToStart", bodyRange) == 0) {
              break;
            }

            // Moving had no effect -> range is at begin of body
            if (moved == 0) {
              break;
            } else {
              steps++;
            }
          }

          return ++steps;
        }
      },

      "default" : function(node)
      {
        if (qx.core.Environment.get("engine.name") === "gecko" ||
            qx.core.Environment.get("engine.name") === "webkit")
        {
          if (this.__isInputOrTextarea(node)) {
            return node.selectionStart;
          }
          else
          {
            var documentElement = qx.dom.Node.getDocument(node);
            var documentSelection = this.getSelectionObject(documentElement);

            // gecko and webkit do differ how the user selected the text
            // "left-to-right" or "right-to-left"
            if (documentSelection.anchorOffset < documentSelection.focusOffset) {
              return documentSelection.anchorOffset;
            } else {
              return documentSelection.focusOffset;
            }
          }
        }

        if (this.__isInputOrTextarea(node)) {
          return node.selectionStart;
        } else {
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).anchorOffset;
        }
      }
    }),


    /**
     * Returns the end of the selection
     *
     * @signature function(node)
     * @param node {Node} node to check
     * @return {Integer} end of current selection
     */
    getEnd : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        if (this.__isInputOrTextarea(node))
        {
          var documentRange = qx.bom.Range.get();

          // Check if the document.selection is the text range inside the input element
          if (!node.contains(documentRange.parentElement())) {
            return -1;
          }

          var range = qx.bom.Range.get(node);
          var len = node.value.length;

          // Synchronize range start and end points
          range.moveToBookmark(documentRange.getBookmark());
          range.moveStart('character', -len);

          return range.text.length;
        }
        else
        {
          var range = qx.bom.Range.get(node);
          var parentElement = range.parentElement();

          // get a range which holds the text of the parent element
          var elementRange = qx.bom.Range.get();
          try {
            // IE throws an invalid argument error when the document has no selection
            elementRange.moveToElementText(parentElement);
          } catch(ex) {
            return 0;
          }
          var len = elementRange.text.length;

          // Move end points of full range so it ends at the user selection
          // and starts at the start of the element text.
          var bodyRange = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
          bodyRange.setEndPoint("EndToEnd", range);
          bodyRange.setEndPoint("StartToStart", elementRange);

          // selection is at beginning
          if (elementRange.compareEndPoints("EndToEnd", bodyRange) == 0) {
            return len-1;
          }

          var moved;
          var steps = 0;
          while (true)
          {
            moved = bodyRange.moveEnd("character", 1);

            // Ending points of both ranges are equal
            if (elementRange.compareEndPoints("EndToEnd", bodyRange) == 0) {
              break;
            }

            // Moving had no effect -> range is at begin of body
            if (moved == 0) {
              break;
            } else {
              steps++;
            }
          }

          return len - (++steps);
        }
      },

      "default" : function(node)
      {
        if (qx.core.Environment.get("engine.name") === "gecko" ||
            qx.core.Environment.get("engine.name") === "webkit")
        {
          if (this.__isInputOrTextarea(node)) {
            return node.selectionEnd;
          }
          else
          {
            var documentElement = qx.dom.Node.getDocument(node);
            var documentSelection = this.getSelectionObject(documentElement);

            // gecko and webkit do differ how the user selected the text
            // "left-to-right" or "right-to-left"
            if (documentSelection.focusOffset > documentSelection.anchorOffset) {
              return documentSelection.focusOffset;
            } else {
              return documentSelection.anchorOffset;
            }
          }
        }

        if (this.__isInputOrTextarea(node)) {
          return node.selectionEnd;
        } else {
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).focusOffset;
        }
      }
    }),


    /**
     * Utility method to check for an input or textarea element
     *
     * @param node {Node} node to check
     * @return {Boolean} Whether the given nodt is an input or textarea element
     */
    __isInputOrTextarea : function(node) {
      return qx.dom.Node.isElement(node) &&
            (node.nodeName.toLowerCase() == "input" ||
             node.nodeName.toLowerCase() == "textarea");
    },


    /**
     * Sets a selection at the given node with the given start and end.
     * For text nodes, input and textarea elements the start and end parameters
     * set the boundaries at the text.
     * For element nodes the start and end parameters are used to select the
     * childNodes of the given element.
     *
     * @signature function(node, start, end)
     * @param node {Node} node to set the selection at
     * @param start {Integer} start of the selection
     * @param end {Integer} end of the selection
     * @return {Boolean} whether a selection is drawn
     */
    set : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node, start, end)
      {
        var rng;

        // if the node is the document itself then work on with the body element
        if (qx.dom.Node.isDocument(node)) {
          node = node.body;
        }

        if (qx.dom.Node.isElement(node) || qx.dom.Node.isText(node))
        {
          switch(node.nodeName.toLowerCase())
          {
            case "input":
            case "textarea":
            case "button":
              if (end === undefined)
              {
                end = node.value.length;
              }

              if (start >= 0 && start <= node.value.length && end >= 0 && end <= node.value.length)
              {
                rng = qx.bom.Range.get(node);
                rng.collapse(true);

                rng.moveStart("character", start);
                rng.moveEnd("character", end - start);
                rng.select();

                return true;
              }
              break;

            case "#text":
              if (end === undefined)
              {
                end = node.nodeValue.length;
              }

              if (start >= 0 && start <= node.nodeValue.length && end >= 0 && end <= node.nodeValue.length)
              {
                // get a range of the body element
                rng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));

                // use the parent node -> "moveToElementText" expects an element
                rng.moveToElementText(node.parentNode);
                rng.collapse(true);

                rng.moveStart("character", start);
                rng.moveEnd("character", end - start);
                rng.select();

                return true;
              }
              break;

            default:
              if (end === undefined)
              {
                end = node.childNodes.length - 1;
              }

             // check start and end -> childNodes
             if (node.childNodes[start] && node.childNodes[end])
             {
               // get the TextRange of the body element
               // IMPORTANT: only with a range of the body the method "moveElementToText" is available
               rng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
               // position it at the given node
               rng.moveToElementText(node.childNodes[start]);
               rng.collapse(true);

               // create helper range
               var newRng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
               newRng.moveToElementText(node.childNodes[end]);

               // set the end of the range to the end of the helper range
               rng.setEndPoint("EndToEnd", newRng);
               rng.select();

               return true;
             }
          }
        }

        return false;
      },

      // suitable for gecko, opera, webkit and mshtml >=9
      "default" : function(node, start, end)
      {
        // special handling for input and textarea elements
        var nodeName = node.nodeName.toLowerCase();
        if (qx.dom.Node.isElement(node) && (nodeName == "input" || nodeName == "textarea"))
        {
          // if "end" is not given set it to the end
          if (end === undefined) {
            end = node.value.length;
          }

          // check boundaries
          if (start >= 0 && start <= node.value.length && end >= 0 && end <= node.value.length)
          {
            node.focus();
            node.select();
            node.setSelectionRange(start, end);
            return true;
          }
        }
        else
        {
          var validBoundaries = false;
          var sel = qx.dom.Node.getWindow(node).getSelection();

          var rng = qx.bom.Range.get(node);

          // element or text node?
          // for elements nodes the offsets are applied to childNodes
          // for text nodes the offsets are applied to the text content
          if (qx.dom.Node.isText(node))
          {
            if (end === undefined) {
              end = node.length;
            }

            if (start >= 0 && start < node.length && end >= 0 && end <= node.length) {
              validBoundaries = true;
            }
          }
          else if (qx.dom.Node.isElement(node))
          {
            if (end === undefined) {
              end = node.childNodes.length - 1;
            }

            if (start >= 0 && node.childNodes[start] && end >= 0 && node.childNodes[end]) {
              validBoundaries = true;
            }
          }
          else if (qx.dom.Node.isDocument(node))
          {
            // work on with the body element
            node = node.body;

            if (end === undefined) {
              end = node.childNodes.length - 1;
            }

            if (start >= 0 && node.childNodes[start] && end >= 0 && node.childNodes[end]) {
              validBoundaries = true;
            }
          }

          if (validBoundaries)
          {
            // collapse the selection if needed
            if (!sel.isCollapsed) {
             sel.collapseToStart();
            }

            // set start and end of the range
            rng.setStart(node, start);

            // for element nodes set the end after the childNode
            if (qx.dom.Node.isText(node)) {
              rng.setEnd(node, end);
            } else {
              rng.setEndAfter(node.childNodes[end]);
            }

            // remove all existing ranges and add the new one
            if (sel.rangeCount > 0) {
              sel.removeAllRanges();
            }

            sel.addRange(rng);

            return true;
          }
        }

        return false;
      }
    }),


    /**
     * Selects all content/childNodes of the given node
     *
     * @param node {Node} text, element or document node
     * @return {Boolean} whether a selection is drawn
     */
    setAll : function(node) {
      return qx.bom.Selection.set(node, 0);
    },


    /**
     * Clears the selection on the given node.
     *
     * @param node {Node} node to clear the selection for
     */
    clear : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        var sel = qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node));
        var rng = qx.bom.Range.get(node);
        var parent = rng.parentElement();

        var documentRange = qx.bom.Range.get(qx.dom.Node.getDocument(node));

        // only collapse if the selection is really on the given node
        // -> compare the two parent elements of the ranges with each other and
        // the given node
        if (parent == documentRange.parentElement() && parent == node) {
          sel.empty();
        }
      },

      "default" : function(node)
      {
        var sel = qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node));
        var nodeName = node.nodeName.toLowerCase();

        // if the node is an input or textarea element use the specialized methods
        if (qx.dom.Node.isElement(node) && (nodeName == "input" || nodeName == "textarea"))
        {
          node.setSelectionRange(0, 0);
          if (qx.bom.Element && qx.bom.Element.blur) {
            qx.bom.Element.blur(node);
          }
        }
        // if the given node is the body/document node -> collapse the selection
        else if (qx.dom.Node.isDocument(node) || nodeName == "body")
        {
          sel.collapse(node.body ? node.body : node, 0);
        }
        // if an element/text node is given the current selection has to
        // encompass the node. Only then the selection is cleared.
        else
        {
          var rng = qx.bom.Range.get(node);
          if (!rng.collapsed)
          {
            var compareNode;
            var commonAncestor = rng.commonAncestorContainer;

            // compare the parentNode of the textNode with the given node
            // (if this node is an element) to decide whether the selection
            // is cleared or not.
            if (qx.dom.Node.isElement(node) && qx.dom.Node.isText(commonAncestor)) {
              compareNode = commonAncestor.parentNode;
            } else {
              compareNode = commonAncestor;
            }

            if (compareNode == node) {
              sel.collapse(node,0);
            }
          }
        }
      }
    })
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Alexander Steitz (aback)

************************************************************************ */



/**
 * Low-level Range API which is used together with the low-level Selection API.
 * This is especially useful whenever a developer want to work on text level,
 * e.g. for an editor.
 */
qx.Bootstrap.define("qx.bom.Range",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Returns the range object of the given node.
     *
     * @signature function(node)
     * @param node {Node} node to get the range of
     * @return {Range} valid range of given selection
     */
    get : qx.core.Environment.select("html.selection",
    {
      "selection" : function(node)
      {
        // check for the type of the given node
        // for legacy IE the nodes input, textarea, button and body
        // have access to own TextRange objects. Everything else is
        // gathered via the selection object.
        if (qx.dom.Node.isElement(node))
        {
          switch(node.nodeName.toLowerCase())
          {
            case "input":

              switch(node.type)
              {
                case "text":
                case "password":
                case "hidden":
                case "button":
                case "reset":
                case "file":
                case "submit":
                  return node.createTextRange();

                default:
                  return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();
              }
            break;

            case "textarea":
            case "body":
            case "button":
              return node.createTextRange();

            default:
              return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();
          }
        }
        else
        {
          if (node == null) {
            node = window;
          }

          // need to pass the document node to work with multi-documents
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();
        }
      },

      // suitable for gecko, opera and webkit
      "default" : function(node)
      {
        var doc = qx.dom.Node.getDocument(node);

        // get the selection object of the corresponding document
        var sel = qx.bom.Selection.getSelectionObject(doc);

        if (sel.rangeCount > 0)
        {
          return sel.getRangeAt(0);
        }
        else
        {
          return doc.createRange();
        }
      }
    })
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Adrian Olaru (adrianolaru)

   ======================================================================

   This class contains code based on the following work:

   * Cross-Browser Split
     http://blog.stevenlevithan.com/archives/cross-browser-split
     Version 1.0.1

     Copyright:
       (c) 2006-2007, Steven Levithan <http://stevenlevithan.com>

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Steven Levithan

************************************************************************ */

/**
 * Implements an ECMA-compliant, uniform cross-browser split method
 */
qx.Bootstrap.define("qx.util.StringSplit",
{
  statics :
  {
    /**
     * ECMA-compliant, uniform cross-browser split method
     *
     * @param str {String} Incoming string to split
     * @param separator {RegExp} Specifies the character to use for separating the string.
     *   The separator is treated as a string or a  regular expression. If separator is
     *   omitted, the array returned contains one element consisting of the entire string.
     * @param limit {Integer?} Integer specifying a limit on the number of splits to be found.
     * @return {String[]} split string
     */
    split : function (str, separator, limit)
    {
      // if `separator` is not a regex, use the native `split`
      if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return String.prototype.split.call(str, separator, limit);
      }

      var output = [],
          lastLastIndex = 0,
          flags = (separator.ignoreCase ? "i" : "") +
                  (separator.multiline  ? "m" : "") +
                  (separator.sticky     ? "y" : ""),
          separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
          separator2, match, lastIndex, lastLength,
          compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group

      str = str + ""; // type conversion

      if (!compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
      }

      /* behavior for `limit`: if it's...
      - `undefined`: no limit.
      - `NaN` or zero: return an empty array.
      - a positive number: use `Math.floor(limit)`.
      - a negative number: no limit.
      - other: type-convert, then use the above rules. */
      if (limit === undefined || +limit < 0) {
        limit = Infinity;
      } else {
        limit = Math.floor(+limit);
        if (!limit) {
          return [];
        }
      }

      while (match = separator.exec(str))
      {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
          output.push(str.slice(lastLastIndex, match.index));

          // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
          if (!compliantExecNpcg && match.length > 1)
          {
            match[0].replace(separator2, function () {
              for (var i = 1; i < arguments.length - 2; i++)
              {
                if (arguments[i] === undefined) {
                  match[i] = undefined;
                }
              }
            });
          }

          if (match.length > 1 && match.index < str.length) {
            Array.prototype.push.apply(output, match.slice(1));
          }

          lastLength = match[0].length;
          lastLastIndex = lastIndex;

          if (output.length >= limit) {
            break;
          }
        }

        if (separator.lastIndex === match.index) {
          separator.lastIndex++; // avoid an infinite loop
        }
      }

      if (lastLastIndex === str.length)
      {
        if (lastLength || !separator.test("")) {
          output.push("");
        }
      } else {
        output.push(str.slice(lastLastIndex));
      }

      return output.length > limit ? output.slice(0, limit) : output;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Common base class for all focus events.
 */
qx.Class.define("qx.event.type.Focus",
{
  extend : qx.event.type.Event,

  members :
  {
    /**
     * Initialize the fields of the event. The event must be initialized before
     * it can be dispatched.
     *
     * @param target {Object} Any possible event target
     * @param relatedTarget {Object} Any possible event target
     * @param canBubble {Boolean?false} Whether or not the event is a bubbling event.
     *     If the event is bubbling, the bubbling can be stopped using
     *     {@link qx.event.type.Event#stopPropagation}
     * @return {qx.event.type.Event} The initialized event instance
     */
    init : function(target, relatedTarget, canBubble)
    {
      this.base(arguments, canBubble, false);

      this._target = target;
      this._relatedTarget = relatedTarget;

      return this;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

// Original behavior:
// ================================================================
// Normally a "change" event should occour on blur of the element
// (http://www.w3.org/TR/DOM-Level-2-Events/events.html)

// However this is not true for "file" upload fields

// And this is also not true for checkboxes and radiofields (all non mshtml)
// And this is also not true for select boxes where the selections
// happens in the opened popup (Gecko + Webkit)

// Normalized behavior:
// ================================================================
// Change on blur for textfields, textareas and file
// Instant change event on checkboxes, radiobuttons

// Select field fires on select (when using popup or size>1)
// but differs when using keyboard:
// mshtml+opera=keypress; mozilla+safari=blur

// Input event for textareas does not work in Safari 3 beta (WIN)
// Safari 3 beta (WIN) repeats change event for select box on blur when selected using popup

// Opera fires "change" on radio buttons two times for each change

/**
 * This handler provides an "change" event for all form fields and an
 * "input" event for form fields of type "text" and "textarea".
 *
 * To let these events work it is needed to create the elements using
 * {@link qx.bom.Input}
 */
qx.Class.define("qx.event.handler.Input",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this._onChangeCheckedWrapper = qx.lang.Function.listener(this._onChangeChecked, this);
    this._onChangeValueWrapper = qx.lang.Function.listener(this._onChangeValue, this);
    this._onInputWrapper = qx.lang.Function.listener(this._onInput, this);
    this._onPropertyWrapper = qx.lang.Function.listener(this._onProperty, this);

    // special event handler for opera
    if ((qx.core.Environment.get("engine.name") == "opera")) {
      this._onKeyDownWrapper = qx.lang.Function.listener(this._onKeyDown, this);
      this._onKeyUpWrapper = qx.lang.Function.listener(this._onKeyUp, this);
      this._onBlurWrapper = qx.lang.Function.listener(this._onBlur, this);
    }
  },






  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      input : 1,
      change : 1
    },

    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE,

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // special handling for opera
    __enter : false,
    __onInputTimeoutId : null,

    // stores the former set value for opera and IE
    __oldValue : null,

    // stores the former set value for IE
    __oldInputValue : null,

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type)
    {
      var lower = target.tagName.toLowerCase();

      if (type === "input" && (lower === "input" || lower === "textarea")) {
        return true;
      }

      if (type === "change" && (lower === "input" || lower === "textarea" || lower === "select")) {
        return true;
      }

      return false;
    },


    // interface implementation
    registerEvent : function(target, type, capture)
    {
      if (
        qx.core.Environment.get("engine.name") == "mshtml" &&
        (qx.core.Environment.get("engine.version") < 9 ||
        (qx.core.Environment.get("engine.version") >= 9 && qx.core.Environment.get("browser.documentmode") < 9))
      )
      {
        if (!target.__inputHandlerAttached)
        {
          var tag = target.tagName.toLowerCase();
          var elementType = target.type;

          if (elementType === "text" || elementType === "password" || tag === "textarea" || elementType === "checkbox" || elementType === "radio") {
            qx.bom.Event.addNativeListener(target, "propertychange", this._onPropertyWrapper);
          }

          if (elementType !== "checkbox" && elementType !== "radio") {
            qx.bom.Event.addNativeListener(target, "change", this._onChangeValueWrapper);
          }

          if (elementType === "text" || elementType === "password") {
            this._onKeyPressWrapped = qx.lang.Function.listener(this._onKeyPress, this, target);
            qx.bom.Event.addNativeListener(target, "keypress", this._onKeyPressWrapped);
          }

          target.__inputHandlerAttached = true;
        }
      }
      else
      {
        if (type === "input")
        {
          this.__registerInputListener(target);
        }
        else if (type === "change")
        {
          if (target.type === "radio" || target.type === "checkbox") {
            qx.bom.Event.addNativeListener(target, "change", this._onChangeCheckedWrapper);
          } else {
            qx.bom.Event.addNativeListener(target, "change", this._onChangeValueWrapper);
          }

          // special enter bugfix for opera
          if ((qx.core.Environment.get("engine.name") == "opera") || (qx.core.Environment.get("engine.name") == "mshtml")) {
            if (target.type === "text" || target.type === "password") {
              this._onKeyPressWrapped = qx.lang.Function.listener(this._onKeyPress, this, target);
              qx.bom.Event.addNativeListener(target, "keypress", this._onKeyPressWrapped);
            }
          }
        }
      }
    },


    __registerInputListener : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(target)
      {
        if (
          qx.core.Environment.get("engine.version") >= 9 &&
          qx.core.Environment.get("browser.documentmode") >= 9
        ) {
          qx.bom.Event.addNativeListener(target, "input", this._onInputWrapper);

          if (target.type === "text" || target.type === "password" || target.type === "textarea")
          {
            // Fixed input for delete and backspace key
            this._inputFixWrapper = qx.lang.Function.listener(this._inputFix, this, target);
            qx.bom.Event.addNativeListener(target, "keyup", this._inputFixWrapper);
          }
        }
      },

      "webkit" : function(target)
      {
        var tag = target.tagName.toLowerCase();

        // the change event is not fired while typing
        // this has been fixed in the latest nightlies
        if (parseFloat(qx.core.Environment.get("engine.version")) < 532 && tag == "textarea") {
          qx.bom.Event.addNativeListener(target, "keypress", this._onInputWrapper);
        }
        qx.bom.Event.addNativeListener(target, "input", this._onInputWrapper);
      },

      "opera" : function(target) {
        // register key events for filtering "enter" on input events
        qx.bom.Event.addNativeListener(target, "keyup", this._onKeyUpWrapper);
        qx.bom.Event.addNativeListener(target, "keydown", this._onKeyDownWrapper);
        // register an blur event for preventing the input event on blur
        qx.bom.Event.addNativeListener(target, "blur", this._onBlurWrapper);

        qx.bom.Event.addNativeListener(target, "input", this._onInputWrapper);
      },

      "default" : function(target) {
        qx.bom.Event.addNativeListener(target, "input", this._onInputWrapper);
      }
    }),


    // interface implementation
    unregisterEvent : function(target, type)
    {
      if (
        qx.core.Environment.get("engine.name") == "mshtml" &&
        qx.core.Environment.get("engine.version") < 9 &&
        qx.core.Environment.get("browser.documentmode") < 9
      )
      {
        if (target.__inputHandlerAttached)
        {
          var tag = target.tagName.toLowerCase();
          var elementType = target.type;

          if (elementType === "text" || elementType === "password" || tag === "textarea" || elementType === "checkbox" || elementType === "radio") {
            qx.bom.Event.removeNativeListener(target, "propertychange", this._onPropertyWrapper);
          }

          if (elementType !== "checkbox" && elementType !== "radio") {
            qx.bom.Event.removeNativeListener(target, "change", this._onChangeValueWrapper);
          }

          if (elementType === "text" || elementType === "password") {
            qx.bom.Event.removeNativeListener(target, "keypress", this._onKeyPressWrapped);
          }

          try {
            delete target.__inputHandlerAttached;
          } catch(ex) {
            target.__inputHandlerAttached = null;
          }
        }
      }
      else
      {
        if (type === "input")
        {
          this.__unregisterInputListener(target);
        }
        else if (type === "change")
        {
          if (target.type === "radio" || target.type === "checkbox")
          {
            qx.bom.Event.removeNativeListener(target, "change", this._onChangeCheckedWrapper);
          }
          else
          {
            qx.bom.Event.removeNativeListener(target, "change", this._onChangeValueWrapper);
          }
        }

        if ((qx.core.Environment.get("engine.name") == "opera") || (qx.core.Environment.get("engine.name") == "mshtml")) {
          if (target.type === "text" || target.type === "password") {
            qx.bom.Event.removeNativeListener(target, "keypress", this._onKeyPressWrapped);
          }
        }
      }
    },


    __unregisterInputListener : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(target)
      {
        if (
          qx.core.Environment.get("engine.version") >= 9 &&
          qx.core.Environment.get("browser.documentmode") >= 9
        ) {
          qx.bom.Event.removeNativeListener(target, "input", this._onInputWrapper);

          if (target.type === "text" || target.type === "password" || target.type === "textarea") {
            // Fixed input for delete and backspace key
            qx.bom.Event.removeNativeListener(target, "keyup", this._inputFixWrapper);
          }
        }
      },

      "webkit" : function(target)
      {
        var tag = target.tagName.toLowerCase();

        // the change event is not fired while typing
        // this has been fixed in the latest nightlies
        if (parseFloat(qx.core.Environment.get("engine.version")) < 532 && tag == "textarea") {
          qx.bom.Event.removeNativeListener(target, "keypress", this._onInputWrapper);
        }
        qx.bom.Event.removeNativeListener(target, "input", this._onInputWrapper);
      },

      "opera" : function(target) {
        // unregister key events for filtering "enter" on input events
        qx.bom.Event.removeNativeListener(target, "keyup", this._onKeyUpWrapper);
        qx.bom.Event.removeNativeListener(target, "keydown", this._onKeyDownWrapper);
        // unregister the blur event (needed for preventing input event on blur)
        qx.bom.Event.removeNativeListener(target, "blur", this._onBlurWrapper);


        qx.bom.Event.removeNativeListener(target, "input", this._onInputWrapper);
      },

      "default" : function(target) {
        qx.bom.Event.removeNativeListener(target, "input", this._onInputWrapper);
      }
    }),


    /*
    ---------------------------------------------------------------------------
      FOR OPERA AND IE (KEYPRESS TO SIMULATE CHANGE EVENT)
    ---------------------------------------------------------------------------
    */
    /**
     * Handler for fixing the different behavior when pressing the enter key.
     *
     * FF and Safari fire a "change" event if the user presses the enter key.
     * IE and Opera fire the event only if the focus is changed.
     *
     * @signature function(e, target)
     * @param e {Event} DOM event object
     * @param target {Element} The event target
     */
    _onKeyPress : qx.core.Environment.select("engine.name",
    {
      "mshtml|opera" : function(e, target)
      {
        if (e.keyCode === 13) {
          if (target.value !== this.__oldValue) {
            this.__oldValue = target.value;
            qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [target.value]);
          }
        }
      },

      "default" : null
    }),


    /*
    ---------------------------------------------------------------------------
      FOR IE (KEYUP TO SIMULATE INPUT EVENT)
    ---------------------------------------------------------------------------
    */
    /**
     * Handler for fixing the different behavior when pressing the backspace or
     * delete key.
     *
     * The other browsers fire a "input" event if the user presses the backspace
     * or delete key.
     * IE fire the event only for other keys.
     *
     * @signature function(e, target)
     * @param e {Event} DOM event object
     * @param target {Element} The event target
     */
    _inputFix : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(e, target)
      {
        if (e.keyCode === 46 || e.keyCode === 8)
        {
          if (target.value !== this.__oldInputValue)
          {
            this.__oldInputValue = target.value;
            qx.event.Registration.fireEvent(target, "input", qx.event.type.Data, [target.value]);
          }
        }
      },

      "default" : null
    }),


    /*
    ---------------------------------------------------------------------------
      FOR OPERA ONLY LISTENER (KEY AND BLUR)
    ---------------------------------------------------------------------------
    */
    /**
     * Key event listener for opera which recognizes if the enter key has been
     * pressed.
     *
     * @signature function(e)
     * @param e {Event} DOM event object
     */
    _onKeyDown : qx.core.Environment.select("engine.name",
    {
      "opera" : function(e)
      {
        // enter is pressed
        if (e.keyCode === 13) {
          this.__enter = true;
        }
      },

      "default" : null
    }),


    /**
     * Key event listener for opera which recognizes if the enter key has been
     * pressed.
     *
     * @signature function(e)
     * @param e {Event} DOM event object
     */
    _onKeyUp : qx.core.Environment.select("engine.name",
    {
      "opera" : function(e)
      {
        // enter is pressed
        if (e.keyCode === 13) {
          this.__enter = false;
        }
      },

      "default" : null
    }),


    /**
     * Blur event listener for opera cancels the timeout of the input event.
     *
     * @signature function(e)
     * @param e {Event} DOM event object
     */
    _onBlur : qx.core.Environment.select("engine.name",
    {
      "opera" : function(e)
      {
        if (this.__onInputTimeoutId && qx.core.Environment.get("browser.version") < 10.6) {
          window.clearTimeout(this.__onInputTimeoutId);
        }
      },

      "default" : null
    }),


    /*
    ---------------------------------------------------------------------------
      NATIVE EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Internal function called by input elements created using {@link qx.bom.Input}.
     *
     * @signature function(e)
     * @param e {Event} Native DOM event
     */
    _onInput : qx.event.GlobalError.observeMethod(function(e)
    {
      var target = qx.bom.Event.getTarget(e);
      var tag = target.tagName.toLowerCase();
      // ignore native input event when triggered by return in input element
      if (!this.__enter || tag !== "input") {
        // opera lower 10.6 needs a special treatment for input events because
        // they are also fired on blur
        if ((qx.core.Environment.get("engine.name") == "opera") &&
            qx.core.Environment.get("browser.version") < 10.6) {
          this.__onInputTimeoutId = window.setTimeout(function() {
            qx.event.Registration.fireEvent(target, "input", qx.event.type.Data, [target.value]);
          }, 0);
        } else {
          qx.event.Registration.fireEvent(target, "input", qx.event.type.Data, [target.value]);
        }
      }
    }),


    /**
     * Internal function called by input elements created using {@link qx.bom.Input}.
     *
     * @signature function(e)
     * @param e {Event} Native DOM event
     */
    _onChangeValue : qx.event.GlobalError.observeMethod(function(e)
    {
      var target = qx.bom.Event.getTarget(e);
      var data = target.value;

      if (target.type === "select-multiple")
      {
        var data = [];
        for (var i=0, o=target.options, l=o.length; i<l; i++)
        {
          if (o[i].selected) {
            data.push(o[i].value);
          }
        }
      }

      qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [data]);
    }),


    /**
     * Internal function called by input elements created using {@link qx.bom.Input}.
     *
     * @signature function(e)
     * @param e {Event} Native DOM event
     */
    _onChangeChecked : qx.event.GlobalError.observeMethod(function(e)
    {
      var target = qx.bom.Event.getTarget(e);

      if (target.type === "radio")
      {
        if (target.checked) {
          qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [target.value]);
        }
      }
      else
      {
        qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [target.checked]);
      }
    }),


    /**
     * Internal function called by input elements created using {@link qx.bom.Input}.
     *
     * @signature function(e)
     * @param e {Event} Native DOM event
     */
    _onProperty : qx.core.Environment.select("engine.name",
    {
      "mshtml" : qx.event.GlobalError.observeMethod(function(e)
      {
        var target = qx.bom.Event.getTarget(e);
        var prop = e.propertyName;

        if (prop === "value" && (target.type === "text" || target.type === "password" || target.tagName.toLowerCase() === "textarea"))
        {
          if (!target.$$inValueSet) {
            qx.event.Registration.fireEvent(target, "input", qx.event.type.Data, [target.value]);
          }
        }
        else if (prop === "checked")
        {
          if (target.type === "checkbox") {
            qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [target.checked]);
          } else if (target.checked) {
            qx.event.Registration.fireEvent(target, "change", qx.event.type.Data, [target.value]);
          }
        }
      }),

      "default" : function() {}
    })
  },





  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This class provides capture event support at DOM level.
 */
qx.Class.define("qx.event.handler.Capture",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      capture : true,
      losecapture : true
    },


    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE,


    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    }
  },






  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Event handler, which supports drag events on DOM elements.
 *
 * @require(qx.event.handler.Mouse)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Capture)
 */
qx.Class.define("qx.event.handler.DragDrop",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this.__manager = manager;
    this.__root = manager.getWindow().document.documentElement;

    // Initialize mousedown listener
    this.__manager.addListener(this.__root, "mousedown", this._onMouseDown, this);

    // Initialize data structures
    this.__rebuildStructures();
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      dragstart : 1,
      dragend : 1,
      dragover : 1,
      dragleave : 1,
      drop : 1,
      drag : 1,
      dragchange : 1,
      droprequest : 1
    },

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true,

    /**
     * Array of strings holding the names of the allowed mouse buttons
     * for Drag & Drop. The default is "left" but could be extended with
     * "middle" or "right"
     */
    ALLOWED_BUTTONS: ["left"]
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __manager : null,
    __root : null,
    __dropTarget : null,
    __dragTarget : null,
    __types : null,
    __actions : null,
    __keys : null,
    __cache : null,
    __currentType : null,
    __currentAction : null,
    __sessionActive : false,
    __startLeft : 0,
    __startTop : 0,

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },





    /*
    ---------------------------------------------------------------------------
      PUBLIC METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Registers a supported type
     *
     * @param type {String} The type to add
     */
    addType : function(type) {
      this.__types[type] = true;
    },

    /**
     * Registers a supported action. One of <code>move</code>,
     * <code>copy</code> or <code>alias</code>.
     *
     * @param action {String} The action to add
     */
    addAction : function(action) {
      this.__actions[action] = true;
    },


    /**
     * Whether the current drag target supports the given type
     *
     * @param type {String} Any type
     * @return {Boolean} Whether the type is supported
     */
    supportsType : function(type) {
      return !!this.__types[type];
    },


    /**
     * Whether the current drag target supports the given action
     *
     * @param type {String} Any type
     * @return {Boolean} Whether the action is supported
     */
    supportsAction : function(type) {
      return !!this.__actions[type];
    },


    /**
     * Returns the data of the given type during the <code>drop</code> event
     * on the drop target. This method fires a <code>droprequest</code> at
     * the drag target which should be answered by calls to {@link #addData}.
     *
     * @param type {String} Any supported type
     * @return {var} The result data
     */
    getData : function(type)
    {
      if (!this.__validDrop || !this.__dropTarget) {
        throw new Error("This method must not be used outside the drop event listener!");
      }

      if (!this.__types[type]) {
        throw new Error("Unsupported data type: " + type + "!");
      }

      if (!this.__cache[type])
      {
        this.__currentType = type;
        this.__fireEvent("droprequest", this.__dragTarget, this.__dropTarget, false);
      }

      if (!this.__cache[type]) {
        throw new Error("Please use a droprequest listener to the drag source to fill the manager with data!");
      }

      return this.__cache[type] || null;
    },


    /**
     * Returns the currently selected action (by user keyboard modifiers)
     *
     * @return {String} One of <code>move</code>, <code>copy</code> or
     *    <code>alias</code>
     */
    getCurrentAction : function() {
      return this.__currentAction;
    },


    /**
     * Adds data of the given type to the internal storage. The data
     * is available until the <code>dragend</code> event is fired.
     *
     * @param type {String} Any valid type
     * @param data {var} Any data to store
     */
    addData : function(type, data) {
      this.__cache[type] = data;
    },


    /**
     * Returns the type which was requested last.
     *
     * @return {String} The last requested data type
     */
    getCurrentType : function() {
      return this.__currentType;
    },


    /**
     * Returns if a drag session is currently active
     *
     * @return {Boolean} active drag session
     */
    isSessionActive : function() {
      return this.__sessionActive;
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL UTILS
    ---------------------------------------------------------------------------
    */

    /**
     * Rebuilds the internal data storage used during a drag&drop session
     */
    __rebuildStructures : function()
    {
      this.__types = {};
      this.__actions = {};
      this.__keys = {};
      this.__cache = {};
    },


    /**
     * Detects the current action and stores it under the private
     * field <code>__currentAction</code>. Also fires the event
     * <code>dragchange</code> on every modification.
     */
    __detectAction : function()
    {
      if (this.__dragTarget == null) {
        return;
      }

      var actions = this.__actions;
      var keys = this.__keys;
      var current = null;

      if (this.__validDrop)
      {
        if (keys.Shift && keys.Control && actions.alias) {
          current = "alias";
        } else if (keys.Shift && keys.Alt && actions.copy) {
          current = "copy";
        } else if (keys.Shift && actions.move) {
          current = "move";
        } else if (keys.Alt && actions.alias) {
          current = "alias";
        } else if (keys.Control && actions.copy) {
          current = "copy";
        } else if (actions.move) {
          current = "move";
        } else if (actions.copy) {
          current = "copy";
        } else if (actions.alias) {
          current = "alias";
        }
      }

      var old = this.__currentAction;
      if (current != old) {

        if (this.__dropTarget) {
          this.__currentAction = current;
          this.__validAction = this.__fireEvent("dragchange", this.__dropTarget, this.__dragTarget, true);
          if (!this.__validAction) {
            current = null;
          }
        }

        if (current != old) {
          this.__currentAction = current;
          this.__fireEvent("dragchange", this.__dragTarget, this.__dropTarget, false);
        }
      }
    },


    /**
     * Wrapper for {@link qx.event.Registration#fireEvent} for drag&drop events
     * needed in this class.
     *
     * @param type {String} Event type
     * @param target {Object} Target to fire on
     * @param relatedTarget {Object} Related target, i.e. drag or drop target
     *    depending on the drag event
     * @param cancelable {Boolean} Whether the event is cancelable
     * @param original {qx.event.type.Mouse} Original mouse event
     * @return {Boolean} <code>true</code> if the event's default behavior was
     * not prevented
     */
    __fireEvent : function(type, target, relatedTarget, cancelable, original)
    {
      var Registration = qx.event.Registration;
      var dragEvent = Registration.createEvent(type, qx.event.type.Drag, [ cancelable, original ]);

      if (target !== relatedTarget) {
        dragEvent.setRelatedTarget(relatedTarget);
      }

      return Registration.dispatchEvent(target, dragEvent);
    },


    /**
     * Finds next draggable parent of the given element. Maybe the element itself as well.
     *
     * Looks for the attribute <code>qxDraggable</code> with the value <code>on</code>.
     *
     * @param elem {Element} The element to query
     * @return {Element} The next parent element which is draggable. May also be <code>null</code>
     */
    __findDraggable : function(elem)
    {
      while (elem && elem.nodeType == 1)
      {
        if (elem.getAttribute("qxDraggable") == "on") {
          return elem;
        }

        elem = elem.parentNode;
      }

      return null;
    },


    /**
     * Finds next droppable parent of the given element. Maybe the element itself as well.
     *
     * Looks for the attribute <code>qxDroppable</code> with the value <code>on</code>.
     *
     * @param elem {Element} The element to query
     * @return {Element} The next parent element which is droppable. May also be <code>null</code>
     */
    __findDroppable : function(elem)
    {
      while (elem && elem.nodeType == 1)
      {
        if (elem.getAttribute("qxDroppable") == "on") {
          return elem;
        }

        elem = elem.parentNode;
      }

      return null;
    },


    /**
     * Clean up event listener and structures when a drag was ended without ever starting into session mode
     * (e.g. not reaching the required offset before)
     */
    __clearInit : function()
    {
      // Clear drag target
      this.__dragTarget = null;

      // Deregister from root events
      this.__manager.removeListener(this.__root, "mousemove", this._onMouseMove, this, true);
      this.__manager.removeListener(this.__root, "mouseup", this._onMouseUp, this, true);

      // Deregister from window's blur
      qx.event.Registration.removeListener(window, "blur", this._onWindowBlur, this);

      // Clear structures
      this.__rebuildStructures();
    },


    /**
     * Cleans up a drag&drop session when <code>dragstart</code> was fired before.
     */
    clearSession : function()
    {
      if (this.__sessionActive)
      {
        // Deregister from root events
        this.__manager.removeListener(this.__root, "mouseover", this._onMouseOver, this, true);
        this.__manager.removeListener(this.__root, "mouseout", this._onMouseOut, this, true);
        this.__manager.removeListener(this.__root, "keydown", this._onKeyDown, this, true);
        this.__manager.removeListener(this.__root, "keyup", this._onKeyUp, this, true);
        this.__manager.removeListener(this.__root, "keypress", this._onKeyPress, this, true);

        // Fire dragend event
        this.__fireEvent("dragend", this.__dragTarget, this.__dropTarget, false);

        // Clear flag
        this.__sessionActive = false;
      }

      // Cleanup
      this.__validDrop = false;
      this.__dropTarget = null;

      // Clear init
      this.__clearInit();
    },


    /** @type {Boolean} Whether a valid drop object / action exists */
    __validDrop : false,
    __validAction : false,







    /*
    ---------------------------------------------------------------------------
      EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for window's <code>blur</code> event
     *
     * @param e {qx.event.type.Event} Event object
     */
    _onWindowBlur : function(e) {
      this.clearSession();
    },


    /**
     * Event listener for root's <code>keydown</code> event
     *
     * @param e {qx.event.type.KeySequence} Event object
     */
    _onKeyDown : function(e)
    {
      var iden = e.getKeyIdentifier();
      switch(iden)
      {
        case "Alt":
        case "Control":
        case "Shift":
          if (!this.__keys[iden])
          {
            this.__keys[iden] = true;
            this.__detectAction();
          }
      }
    },


    /**
     * Event listener for root's <code>keyup</code> event
     *
     * @param e {qx.event.type.KeySequence} Event object
     */
    _onKeyUp : function(e)
    {
      var iden = e.getKeyIdentifier();
      switch(iden)
      {
        case "Alt":
        case "Control":
        case "Shift":
          if (this.__keys[iden])
          {
            this.__keys[iden] = false;
            this.__detectAction();
          }
      }
    },


    /**
     * Event listener for root's <code>keypress</code> event
     *
     * @param e {qx.event.type.KeySequence} Event object
     */
    _onKeyPress : function(e)
    {
      var iden = e.getKeyIdentifier();
      switch(iden)
      {
        case "Escape":
          this.clearSession();
      }
    },


    /**
     * Event listener for root's <code>mousedown</code> event
     *
     * @param e {qx.event.type.Mouse} Event object
     */
    _onMouseDown : function(e)
    {
      var isButtonOk = qx.event.handler.DragDrop.ALLOWED_BUTTONS.indexOf(e.getButton()) !== -1;
      if (this.__sessionActive || !isButtonOk) {
        return;
      }

      var dragable = this.__findDraggable(e.getTarget());
      if (dragable)
      {
        // Cache coordinates for offset calculation
        this.__startLeft = e.getDocumentLeft();
        this.__startTop = e.getDocumentTop();

        // This is the source target
        this.__dragTarget = dragable;

        // Register move event to manager
        this.__manager.addListener(this.__root, "mousemove", this._onMouseMove, this, true);
        this.__manager.addListener(this.__root, "mouseup", this._onMouseUp, this, true);

        // Register window blur listener
        qx.event.Registration.addListener(window, "blur", this._onWindowBlur, this);
      }
    },


    /**
     * Event listener for root's <code>mouseup</code> event
     *
     * @param e {qx.event.type.Mouse} Event object
     */
    _onMouseUp : function(e)
    {
      // Fire drop event in success case
      if (this.__validDrop && this.__validAction) {
        this.__fireEvent("drop", this.__dropTarget, this.__dragTarget, false, e);
      }

      // Stop event
      if (this.__sessionActive && e.getTarget() == this.__dragTarget) {
        e.stopPropagation();
        this.__preventNextClick();
      }

      // Clean up
      this.clearSession();
    },


    /**
     * Event listener for root's <code>mousemove</code> event
     *
     * @param e {qx.event.type.Mouse} Event object
     */
    _onMouseMove : function(e)
    {
      // Whether the session is already active
      if (this.__sessionActive)
      {
        // Fire specialized move event
        if (!this.__fireEvent("drag", this.__dragTarget, this.__dropTarget, true, e)) {
          this.clearSession();
        }
      }
      else
      {
        if (Math.abs(e.getDocumentLeft()-this.__startLeft) > 3 || Math.abs(e.getDocumentTop()-this.__startTop) > 3)
        {
          if (this.__fireEvent("dragstart", this.__dragTarget, this.__dropTarget, true, e))
          {
            // Flag session as active
            this.__sessionActive = true;

            // Register to root events
            this.__manager.addListener(this.__root, "mouseover", this._onMouseOver, this, true);
            this.__manager.addListener(this.__root, "mouseout", this._onMouseOut, this, true);
            this.__manager.addListener(this.__root, "keydown", this._onKeyDown, this, true);
            this.__manager.addListener(this.__root, "keyup", this._onKeyUp, this, true);
            this.__manager.addListener(this.__root, "keypress", this._onKeyPress, this, true);

            // Reevaluate current action
            var keys = this.__keys;
            keys.Control = e.isCtrlPressed();
            keys.Shift = e.isShiftPressed();
            keys.Alt = e.isAltPressed();
            this.__detectAction();
          }
          else
          {
            // Fire dragend event
            this.__fireEvent("dragend", this.__dragTarget, this.__dropTarget, false);

            // Clean up
            this.__clearInit();
          }
        }
      }
    },


    /**
     * Event listener for root's <code>mouseover</code> event
     *
     * @param e {qx.event.type.Mouse} Event object
     */
    _onMouseOver : function(e)
    {
      var target = e.getTarget();
      var cursor = qx.ui.core.DragDropCursor.getInstance();
      var cursorEl = cursor.getContentElement().getDomElement();
      // don't fire dragover on the cursor
      if (target === cursorEl) {
        return;
      }

      var dropable = this.__findDroppable(target);

      if (dropable && dropable != this.__dropTarget)
      {
        this.__validDrop = this.__fireEvent("dragover", dropable, this.__dragTarget, true, e);
        this.__dropTarget = dropable;

        this.__detectAction();
      }
    },


    /**
     * Event listener for root's <code>mouseout</code> event
     *
     * @param e {qx.event.type.Mouse} Event object
     */
    _onMouseOut : function(e)
    {
      var cursor = qx.ui.core.DragDropCursor.getInstance();
      var cursorEl = cursor.getContentElement().getDomElement();
      // prevent dragleave if the target is the cursor
      if (e.getTarget() === cursorEl) {
        return;
      }
      // also prevent dragleave if the the pointer moves out of the widget to the cursor
      if (e.getRelatedTarget() === cursorEl) {
        return;
      }

      var dropable = this.__findDroppable(e.getTarget());
      var newDropable = this.__findDroppable(e.getRelatedTarget());

      if (dropable && dropable !== newDropable && dropable == this.__dropTarget)
      {
        this.__fireEvent("dragleave", this.__dropTarget, newDropable, false, e);
        this.__dropTarget = null;
        this.__validDrop = false;

        qx.event.Timer.once(this.__detectAction, this, 0);
      }
    },


    /**
     * Tells the mouse handler to prevent the next click.
     */
    __preventNextClick : function() {
      var mouseHandler = qx.event.Registration.getManager(window).getHandler(
        qx.event.handler.Mouse
      );
      mouseHandler.preventNextClick();
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    // Clear fields
    this.__dragTarget = this.__dropTarget = this.__manager = this.__root =
      this.__types = this.__actions = this.__keys = this.__cache = null;
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    if (!qx.event.handler.MouseEmulation.ON) {
      qx.event.Registration.addHandler(statics);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Event object class for drag events
 */
qx.Class.define("qx.event.type.Drag",
{
  extend : qx.event.type.Event,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Initialize the fields of the event. The event must be initialized before
     * it can be dispatched.
     *
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link qx.event.type.Event#preventDefault}
     * @param originalEvent {qx.event.type.Mouse} The original (mouse) event to use
     * @return {qx.event.type.Event} The initialized event instance
     */
    init : function(cancelable, originalEvent)
    {
      this.base(arguments, true, cancelable);

      if (originalEvent)
      {
        this._native = originalEvent.getNativeEvent() || null;
        this._originalTarget = originalEvent.getTarget() || null;
      }
      else
      {
        this._native = null;
        this._originalTarget = null;
      }

      return this;
    },


    // overridden
    clone : function(embryo)
    {
      var clone = this.base(arguments, embryo);

      clone._native = this._native;

      return clone;
    },


    /**
     * Get the horizontal position at which the event occurred relative to the
     * left of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Integer} The horizontal mouse position in the document.
     */
    getDocumentLeft : function()
    {
      if (this._native == null) {
        return 0;
      }

      if (this._native.pageX !== undefined) {
        return Math.round(this._native.pageX);
      } else {
        var win = qx.dom.Node.getWindow(this._native.srcElement);
        return Math.round(this._native.clientX) + qx.bom.Viewport.getScrollLeft(win);
      }
    },


    /**
     * Get the vertical position at which the event occurred relative to the
     * top of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Integer} The vertical mouse position in the document.
     */
    getDocumentTop : function()
    {
      if (this._native == null) {
        return 0;
      }

      if (this._native.pageY !== undefined) {
        return Math.round(this._native.pageY);
      } else {
        var win = qx.dom.Node.getWindow(this._native.srcElement);
        return Math.round(this._native.clientY) + qx.bom.Viewport.getScrollTop(win);
      }
    },


    /**
     * Returns the drag&drop event handler responsible for the target
     *
     * @return {qx.event.handler.DragDrop} The drag&drop handler
     */
    getManager : function() {
      return qx.event.Registration.getManager(this.getTarget()).getHandler(qx.event.handler.DragDrop);
    },


    /**
     * Used during <code>dragstart</code> listener to
     * inform the manager about supported data types.
     *
     * @param type {String} Data type to add to list of supported types
     */
    addType : function(type) {
      this.getManager().addType(type);
    },


    /**
     * Used during <code>dragstart</code> listener to
     * inform the manager about supported drop actions.
     *
     * @param action {String} Action to add to the list of supported actions
     */
    addAction : function(action) {
      this.getManager().addAction(action);
    },


    /**
     * Whether the given type is supported by the drag
     * target (source target).
     *
     * This is used in the event listeners for <code>dragover</code>
     * or <code>dragdrop</code>.
     *
     * @param type {String} The type to look for
     * @return {Boolean} Whether the given type is supported
     */
    supportsType : function(type) {
      return this.getManager().supportsType(type);
    },


    /**
     * Whether the given action is supported by the drag
     * target (source target).
     *
     * This is used in the event listeners for <code>dragover</code>
     * or <code>dragdrop</code>.
     *
     * @param action {String} The action to look for
     * @return {Boolean} Whether the given action is supported
     */
    supportsAction : function(action) {
      return this.getManager().supportsAction(action);
    },


    /**
     * Adds data of the given type to the internal storage. The data
     * is available until the <code>dragend</code> event is fired.
     *
     * @param type {String} Any valid type
     * @param data {var} Any data to store
     */
    addData : function(type, data) {
      this.getManager().addData(type, data);
    },


    /**
     * Returns the data of the given type. Used in the <code>drop</code> listener.
     *
     * @param type {String} Any of the supported types.
     * @return {var} The data for the given type
     */
    getData : function(type) {
      return this.getManager().getData(type);
    },


    /**
     * Returns the type which was requested last, to be used
     * in the <code>droprequest</code> listener.
     *
     * @return {String} The last requested data type
     */
    getCurrentType : function() {
      return this.getManager().getCurrentType();
    },


    /**
     * Returns the currently selected action. Depends on the
     * supported actions of the source target and the modification
     * keys pressed by the user.
     *
     * Used in the <code>droprequest</code> listener.
     *
     * @return {String} The action. May be one of <code>move</code>,
     *    <code>copy</code> or <code>alias</code>.
     */
    getCurrentAction : function() {
      return this.getManager().getCurrentAction();
    },


    /**
     * Stops the drag&drop session and fires a <code>dragend</code> event.
     */
    stopSession : function() {
      this.getManager().clearSession();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Martin Wittemann (martinwittemann)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Methods to place popup like widgets to other widgets, points,
 * mouse event coordinates, etc.
 */
qx.Mixin.define("qx.ui.core.MPlacement",
{

  statics : {
    __visible : null,
    __direction : "left",

    /**
     * Set the always visible element. If an element is set, the
     * {@link #moveTo} method takes care of every move and tries not to cover
     * the given element with a movable widget like a popup or context menu.
     *
     * @param elem {qx.ui.core.Widget} The widget which should always be visible.
     */
    setVisibleElement : function(elem) {
      this.__visible = elem;
    },

    /**
     * Returns the given always visible element. See {@link #setVisibleElement}
     * for more details.
     *
     * @return {qx.ui.core.Widget|null} The given widget.
     */
    getVisibleElement : function() {
      return this.__visible;
    },

    /**
     * Set the move direction for an element which hides always visible element.
     * The value has only an effect when the {@link #setVisibleElement} is set.
     *
     * @param direction {String} The direction <code>left</code> or <code>top</code>.
     */
    setMoveDirection : function(direction)
    {
      if (direction === "top" || direction === "left") {
        this.__direction = direction;
      } else {
        throw new Error("Invalid value for the parameter 'direction' " +
          "[qx.ui.core.MPlacement.setMoveDirection()], the value was '" + direction + "' " +
          "but 'top' or 'left' are allowed.");
      }
    },

    /**
     * Returns the move direction for an element which hides always visible element.
     * See {@link #setMoveDirection} for more details.
     *
     * @return {String} The move direction.
     */
    getMoveDirection : function() {
      return this.__direction;
    }
  },


  properties :
  {
    /**
     * Position of the aligned object in relation to the opener.
     *
     * Please note than changes to this property are only applied
     * when re-aligning the widget.
     *
     * The first part of the value is the edge to attach to. The second
     * part the alignment of the orthogonal edge after the widget
     * has been attached.
     *
     * The default value "bottom-left" for example means that the
     * widget should be shown directly under the given target and
     * then should be aligned to be left edge:
     *
     * <pre>
     * +--------+
     * | target |
     * +--------+
     * +-------------+
     * |   widget    |
     * +-------------+
     * </pre>
     */
    position :
    {
      check :
      [
        "top-left", "top-center", "top-right",
        "bottom-left", "bottom-center", "bottom-right",
        "left-top", "left-middle", "left-bottom",
        "right-top", "right-middle", "right-bottom"
      ],
      init : "bottom-left",
      themeable : true
    },

    /**
     * Whether the widget should be placed relative to an other widget or to
     * the mouse cursor.
     */
    placeMethod :
    {
      check : ["widget", "mouse"],
      init : "mouse",
      themeable: true
    },

    /** Whether the widget should moved using DOM methods. */
    domMove :
    {
      check : "Boolean",
      init : false
    },

    /**
     * Selects the algorithm to place the widget horizontally. <code>direct</code>
     * uses {@link qx.util.placement.DirectAxis}, <code>keep-align</code>
     * uses {@link qx.util.placement.KeepAlignAxis} and <code>best-fit</code>
     * uses {@link qx.util.placement.BestFitAxis}.
     */
    placementModeX :
    {
      check : ["direct", "keep-align", "best-fit"],
      init : "keep-align",
      themeable : true
    },

    /**
     * Selects the algorithm to place the widget vertically. <code>direct</code>
     * uses {@link qx.util.placement.DirectAxis}, <code>keep-align</code>
     * uses {@link qx.util.placement.KeepAlignAxis} and <code>best-fit</code>
     * uses {@link qx.util.placement.BestFitAxis}.
     */
    placementModeY :
    {
      check : ["direct", "keep-align", "best-fit"],
      init : "keep-align",
      themeable : true
    },

    /** Left offset of the mouse pointer (in pixel) */
    offsetLeft :
    {
      check : "Integer",
      init : 0,
      themeable : true
    },

    /** Top offset of the mouse pointer (in pixel) */
    offsetTop :
    {
      check : "Integer",
      init : 0,
      themeable : true
    },

    /** Right offset of the mouse pointer (in pixel) */
    offsetRight :
    {
      check : "Integer",
      init : 0,
      themeable : true
    },

    /** Bottom offset of the mouse pointer (in pixel) */
    offsetBottom :
    {
      check : "Integer",
      init : 0,
      themeable : true
    },

    /** Offsets in one group */
    offset :
    {
      group : [ "offsetTop", "offsetRight", "offsetBottom", "offsetLeft" ],
      mode  : "shorthand",
      themeable : true
    }
  },


  members :
  {
    __ptwLiveUpdater : null,
    __ptwLiveDisappearListener : null,
    __ptwLiveUpdateDisappearListener : null,


    /**
     * Returns the location data like {qx.bom.element.Location#get} does,
     * but does not rely on DOM elements coordinates to be rendered. Instead,
     * this method works with the available layout data available in the moment
     * when it is executed.
     * This works best when called in some type of <code>resize</code> or
     * <code>move</code> event which are supported by all widgets out of the
     * box.
     *
     * @param widget {qx.ui.core.Widget} Any widget
     * @return {Map} Returns a map with <code>left</code>, <code>top</code>,
     *   <code>right</code> and <code>bottom</code> which contains the distance
     *   of the widget relative coords the document.
     */
    getLayoutLocation : function(widget)
    {
      // Use post-layout dimensions
      // which do not rely on the final rendered DOM element
      var insets, bounds, left, top;

      // Add bounds of the widget itself
      bounds = widget.getBounds();

      if (!bounds) {
        return null;
      }

      left = bounds.left;
      top = bounds.top;

      // Keep size to protect it for loop
      var size = bounds;

      // Now loop up with parents until reaching the root
      widget = widget.getLayoutParent();
      while (widget && !widget.isRootWidget())
      {
        // Add coordinates
        bounds = widget.getBounds();
        left += bounds.left;
        top += bounds.top;

        // Add insets
        insets = widget.getInsets();
        left += insets.left;
        top += insets.top;

        // Next parent
        widget = widget.getLayoutParent();
      }

      // Add the rendered location of the root widget
      if (widget.isRootWidget())
      {
        var rootCoords = widget.getContentLocation();
        if (rootCoords)
        {
          left += rootCoords.left;
          top += rootCoords.top;
        }
      }

      // Build location data
      return {
        left : left,
        top : top,
        right : left + size.width,
        bottom : top + size.height
      };
    },


    /**
     * Sets the position. Uses low-level, high-performance DOM
     * methods when the property {@link #domMove} is enabled.
     * Checks if an always visible element is set and moves the widget to not
     * overlay the always visible widget if possible. The algorithm tries to
     * move the widget as far left as necessary but not of the screen.
     * ({@link #setVisibleElement})
     *
     * @param left {Integer} The left position
     * @param top {Integer} The top position
     */
    moveTo : function(left, top)
    {
      var visible = qx.ui.core.MPlacement.getVisibleElement();

      // if we have an always visible element
      if (visible) {

        var bounds = this.getBounds();
        var elemLocation = visible.getContentLocation();

        // if we have bounds for both elements
        if (bounds && elemLocation) {
          var bottom = top + bounds.height;
          var right = left + bounds.width;

          // horizontal placement wrong
          // each number is for the upcomming check (huge element is
          // the always visible, eleme prefixed)
          //     | 3 |
          //   ---------
          //   | |---| |
          //   |       |
          // --|-|   |-|--
          // 1 | |   | | 2
          // --|-|   |-|--
          //   |       |
          //   | |---| |
          //   ---------
          //     | 4 |
          if (
            (right > elemLocation.left && left < elemLocation.right) &&
            (bottom > elemLocation.top && top < elemLocation.bottom)
          ) {
            var direction = qx.ui.core.MPlacement.getMoveDirection();

            if (direction === "left") {
              left = Math.max(elemLocation.left - bounds.width, 0);
            } else {
              top = Math.max(elemLocation.top - bounds.height, 0);
            }
          }
        }
      }

      if (this.getDomMove()) {
        this.setDomPosition(left, top);
      } else {
        this.setLayoutProperties({left: left, top: top});
      }
    },


    /**
     * Places the widget to another (at least laid out) widget. The DOM
     * element is not needed, but the bounds are needed to compute the
     * location of the widget to align to.
     *
     * @param target {qx.ui.core.Widget} Target coords align coords
     * @param liveupdate {Boolean} Flag indicating if the position of the
     * widget should be checked and corrected automatically.
     * @return {Boolean} true if the widget was successfully placed
     */
    placeToWidget : function(target, liveupdate)
    {

      // Use the idle event to make sure that the widget's position gets
      // updated automatically (e.g. the widget gets scrolled).
      if (liveupdate)
      {
        this.__cleanupFromLastPlaceToWidgetLiveUpdate();

        // Bind target and livupdate to placeToWidget
        this.__ptwLiveUpdater = qx.lang.Function.bind(this.placeToWidget, this, target, false);

        qx.event.Idle.getInstance().addListener("interval", this.__ptwLiveUpdater);

        // Remove the listener when the element disappears.
        this.__ptwLiveUpdateDisappearListener = function()
        {
          this.__cleanupFromLastPlaceToWidgetLiveUpdate();
        }

        this.addListener("disappear", this.__ptwLiveUpdateDisappearListener, this);

      }

      var coords = target.getContentLocation() || this.getLayoutLocation(target);

      if(coords != null) {
        this._place(coords);
        return true;
      } else {
        return false;
      }
    },


    /**
     * Removes all resources allocated by the last run of placeToWidget with liveupdate=true
     */
    __cleanupFromLastPlaceToWidgetLiveUpdate : function()
    {
      if (this.__ptwLiveUpdater)
      {
        qx.event.Idle.getInstance().removeListener("interval", this.__ptwLiveUpdater);
        this.__ptwLiveUpdater = null;
      }

      if (this.__ptwLiveUpdateDisappearListener){
        this.removeListener("disappear", this.__ptwLiveUpdateDisappearListener, this);
        this.__ptwLiveUpdateDisappearListener = null;
      }

    },


    /**
     * Places the widget to the mouse cursor position.
     *
     * @param event {qx.event.type.Mouse} Mouse event to align to
     */
    placeToMouse : function(event)
    {
      var left = Math.round(event.getDocumentLeft());
      var top = Math.round(event.getDocumentTop());

      var coords =
      {
        left: left,
        top: top,
        right: left,
        bottom: top
      };

      this._place(coords);
    },


    /**
     * Places the widget to any (rendered) DOM element.
     *
     * @param elem {Element} DOM element to align to
     * @param liveupdate {Boolean} Flag indicating if the position of the
     * widget should be checked and corrected automatically.
     */
    placeToElement : function(elem, liveupdate)
    {
      var location = qx.bom.element.Location.get(elem);
      var coords =
      {
        left: location.left,
        top: location.top,
        right: location.left + elem.offsetWidth,
        bottom: location.top + elem.offsetHeight
      };

      // Use the idle event to make sure that the widget's position gets
      // updated automatically (e.g. the widget gets scrolled).
      if (liveupdate)
      {
        // Bind target and livupdate to placeToWidget
        this.__ptwLiveUpdater = qx.lang.Function.bind(this.placeToElement, this, elem, false);

        qx.event.Idle.getInstance().addListener("interval", this.__ptwLiveUpdater);

        // Remove the listener when the element disappears.
        this.addListener("disappear", function()
        {
          if (this.__ptwLiveUpdater)
          {
            qx.event.Idle.getInstance().removeListener("interval", this.__ptwLiveUpdater);
            this.__ptwLiveUpdater = null;
          }
        }, this);
      }

      this._place(coords);
    },


    /**
     * Places the widget in relation to the given point
     *
     * @param point {Map} Coordinate of any point with the keys <code>left</code>
     *   and <code>top</code>.
     */
    placeToPoint : function(point)
    {
      var coords =
      {
        left: point.left,
        top: point.top,
        right: point.left,
        bottom: point.top
      };

      this._place(coords);
    },


    /**
     * Returns the placement offsets as a map
     *
     * @return {Map} The placement offsets
     */
    _getPlacementOffsets : function()
    {
      return {
        left : this.getOffsetLeft(),
        top : this.getOffsetTop(),
        right : this.getOffsetRight(),
        bottom : this.getOffsetBottom()
      }
    },


    /**
     * Get the size of the object to place. The callback will be called with
     * the size as first argument. This methods works asynchronously.
     *
     * The size of the object to place is the size of the widget. If a widget
     * including this mixin needs a different size it can implement the method
     * <code>_computePlacementSize</code>, which returns the size.
     *
     *  @param callback {Function} This function will be called with the size as
     *    first argument
     */
    __getPlacementSize : function(callback)
    {
      var size = null;

      if (this._computePlacementSize) {
        var size = this._computePlacementSize();
      } else if (this.isVisible()) {
        var size = this.getBounds();
      }

      if (size == null)
      {
        this.addListenerOnce("appear", function() {
          this.__getPlacementSize(callback);
        }, this);
      } else {
        callback.call(this, size);
      }
    },


    /**
     * Internal method to read specific this properties and
     * apply the results to the this afterwards.
     *
     * @param coords {Map} Location of the object to align the this to. This map
     *   should have the keys <code>left</code>, <code>top</code>, <code>right</code>
     *   and <code>bottom</code>.
     */
    _place : function(coords)
    {
      this.__getPlacementSize(function(size)
      {
        var result = qx.util.placement.Placement.compute(
          size,
          this.getLayoutParent().getBounds(),
          coords,
          this._getPlacementOffsets(),
          this.getPosition(),
          this.getPlacementModeX(),
          this.getPlacementModeY()
        );

        // state handling for tooltips e.g.
        this.removeState("placementLeft");
        this.removeState("placementRight");
        this.addState(coords.left < result.left ? "placementRight" : "placementLeft");

        this.moveTo(result.left, result.top);
      });
    }
  },


  destruct : function()
  {
    this.__cleanupFromLastPlaceToWidgetLiveUpdate();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * A generic singleton that fires an "interval" event all 100 miliseconds. It
 * can be used whenever one needs to run code periodically. The main purpose of
 * this class is reduce the number of timers.
 */

qx.Class.define("qx.event.Idle",
{
  extend : qx.core.Object,
  type : "singleton",

  construct : function()
  {
    this.base(arguments);

    var timer = new qx.event.Timer(this.getTimeoutInterval());
    timer.addListener("interval", this._onInterval, this);
    timer.start();

    this.__timer = timer;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** This event if fired each time the interval time has elapsed */
    "interval" : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Interval for the timer, which periodically fires the "interval" event,
     * in milliseconds.
     */
    timeoutInterval :
    {
      check: "Number",
      init : 100,
      apply : "_applyTimeoutInterval"
    }
  },



  members :
  {

    __timer : null,

    // property apply
    _applyTimeoutInterval : function(value) {
      this.__timer.setInterval(value);
    },

    /**
     * Fires an "interval" event
     */
    _onInterval : function() {
      this.fireEvent("interval");
    }

  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__timer) {
      this.__timer.stop();
    }

    this.__timer = null;
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Global timer support.
 *
 * This class can be used to periodically fire an event. This event can be
 * used to simulate e.g. a background task. The static method
 * {@link #once} is a special case. It will call a function deferred after a
 * given timeout.
 */
qx.Class.define("qx.event.Timer",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param interval {Number} initial interval in milliseconds of the timer.
   */
  construct : function(interval)
  {
    this.base(arguments);

    this.setEnabled(false);

    if (interval != null) {
      this.setInterval(interval);
    }

    // don't use qx.lang.Function.bind because this function would add a
    // disposed check, which could break the functionality. In IE the handler
    // may get called after "clearInterval" (i.e. after the timer is disposed)
    // and we must be able to handle this.
    var self = this;
    this.__oninterval = function() {
      self._oninterval.call(self);
    }
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** This event if fired each time the interval time has elapsed */
    "interval" : "qx.event.type.Event"
  },





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Start a function after a given timeout.
     *
     * @param func {Function} Function to call
     * @param obj {Object} context (this), the function is called with
     * @param timeout {Number} Number of milliseconds to wait before the
     *   function is called.
     * @return {qx.event.Timer} The timer object used for the timeout. This
     *    object can be used to cancel the timeout. Note that the timer is
     *    only valid until the timer has been executed.
     */
    once : function(func, obj, timeout)
    {
      if (qx.core.Environment.get("qx.debug")) {
        // check the given parameter
        qx.core.Assert.assertFunction(func, "func is not a function");
        qx.core.Assert.assertNotUndefined(timeout, "No timeout given");
      }

      // Create time instance
      var timer = new qx.event.Timer(timeout);

      // Bug #3481: append original function to timer instance so it can be
      // read by a debugger
      timer.__onceFunc = func;

      // Add event listener to interval
      timer.addListener("interval", function(e)
      {
        timer.stop();
        func.call(obj, e);
        timer.dispose();

        obj = null;
      },
      obj);

      // Directly start timer
      timer.start();
      return timer;
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * With the enabled property the Timer can be started and suspended.
     * Setting it to "true" is equivalent to {@link #start}, setting it
     * to "false" is equivalent to {@link #stop}.
     */
    enabled :
    {
      init : true,
      check : "Boolean",
      apply : "_applyEnabled"
    },

    /**
     * Time in milliseconds between two callback calls.
     * This property can be set to modify the interval of
     * a running timer.
     */
    interval :
    {
      check : "Integer",
      init : 1000,
      apply : "_applyInterval"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __intervalHandler : null,
    __oninterval : null,



    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    /**
     * Apply the interval of the timer.
     *
     * @param value {var} Current value
     * @param old {var} Previous value
     */
    _applyInterval : function(value, old)
    {
      if (this.getEnabled()) {
        this.restart();
      }
    },


    /**
     * Apply the enabled state of the timer.
     *
     * @param value {var} Current value
     * @param old {var} Previous value
     */
    _applyEnabled : function(value, old)
    {
      if (old)
      {
        window.clearInterval(this.__intervalHandler);
        this.__intervalHandler = null;
      }
      else if (value)
      {
        this.__intervalHandler = window.setInterval(this.__oninterval, this.getInterval());
      }
    },




    /*
    ---------------------------------------------------------------------------
      USER-ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Start the timer
     *
     */
    start : function() {
      this.setEnabled(true);
    },


    /**
     * Start the timer with a given interval
     *
     * @param interval {Integer} Time in milliseconds between two callback calls.
     */
    startWith : function(interval)
    {
      this.setInterval(interval);
      this.start();
    },


    /**
     * Stop the timer.
     *
     */
    stop : function() {
      this.setEnabled(false);
    },


    /**
     * Restart the timer.
     * This makes it possible to change the interval of a running timer.
     *
     */
    restart : function()
    {
      this.stop();
      this.start();
    },


    /**
     * Restart the timer. with a given interval.
     *
     * @param interval {Integer} Time in milliseconds between two callback calls.
     */
    restartWith : function(interval)
    {
      this.stop();
      this.startWith(interval);
    },




    /*
    ---------------------------------------------------------------------------
      EVENT-MAPPER
    ---------------------------------------------------------------------------
    */

    /**
     * timer callback
     *
     * @signature function()
     */
    _oninterval : qx.event.GlobalError.observeMethod(function()
    {
      if (this.$$disposed) {
        return;
      }

      if (this.getEnabled()) {
        this.fireEvent("interval");
      }
    })
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__intervalHandler) {
      window.clearInterval(this.__intervalHandler);
    }

    this.__intervalHandler = this.__oninterval = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Contains methods to compute a position for any object which should
 * be positioned relative to another object.
 */
qx.Class.define("qx.util.placement.Placement",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);
    this.__defaultAxis = qx.util.placement.DirectAxis;
  },


  properties :
  {
    /**
     * The axis object to use for the horizontal placement
     */
    axisX : {
      check: "Class"
    },

    /**
     * The axis object to use for the vertical placement
     */
    axisY : {
      check: "Class"
    },

    /**
     * Specify to which edge of the target object, the object should be attached
     */
    edge : {
      check: ["top", "right", "bottom", "left"],
      init: "top"
    },

    /**
     * Specify with which edge of the target object, the object should be aligned
     */
    align : {
      check: ["top", "right", "bottom", "left", "center", "middle"],
      init: "right"
    }
  },


  statics :
  {
    __instance : null,

    /**
     * DOM and widget independent method to compute the location
     * of an object to make it relative to any other object.
     *
     * @param size {Map} With the keys <code>width</code> and <code>height</code>
     *   of the object to align
     * @param area {Map} Available area to position the object. Has the keys
     *   <code>width</code> and <code>height</code>. Normally this is the parent
     *   object of the one to align.
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>left</code>, <code>top</code>, <code>right</code>
     *   and <code>bottom</code>.
     * @param offsets {Map} Map with all offsets for each direction.
     *   Comes with the keys <code>left</code>, <code>top</code>,
     *   <code>right</code> and <code>bottom</code>.
     * @param position {String} Alignment of the object on the target, any of
     *   "top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right",
     *   "left-top", "left-middle", "left-bottom", "right-top", "right-middle", "right-bottom".
     * @param modeX {String} Horizontal placement mode. Valid values are:
     *   <ul>
     *   <li><code>direct</code>: place the object directly at the given
     *   location.</li>
     *   <li><code>keep-align</code>: if parts of the object is outside of the visible
     *   area it is moved to the best fitting 'edge' and 'alignment' of the target.
     *   It is guaranteed the the new position attaches the object to one of the
     *   target edges and that that is aligned with a target edge.</li>
     *   <li>best-fit</li>: If parts of the object are outside of the visible
     *   area it is moved into the view port ignoring any offset, and position
     *   values.
     *   </ul>
     * @param modeY {String} Vertical placement mode. Accepts the same values as
     *   the 'modeX' argument.
     * @return {Map} A map with the final location stored in the keys
     *   <code>left</code> and <code>top</code>.
     */
    compute: function(size, area, target, offsets, position, modeX, modeY)
    {
      this.__instance = this.__instance || new qx.util.placement.Placement();

      var splitted = position.split("-");
      var edge = splitted[0];
      var align = splitted[1];

      if (qx.core.Environment.get("qx.debug"))
      {
        if (align === "center" || align === "middle")
        {
          var expected = "middle";
          if (edge === "top" || edge === "bottom") {
            expected = "center";
          }
          qx.core.Assert.assertEquals(expected, align, "Please use '" + edge + "-" + expected + "' instead!");
        }
      }

      this.__instance.set({
        axisX: this.__getAxis(modeX),
        axisY: this.__getAxis(modeY),
        edge: edge,
        align: align
      });

      return this.__instance.compute(size, area, target, offsets);
    },


    __direct : null,
    __keepAlign : null,
    __bestFit : null,

    /**
     * Get the axis implementation for the given mode
     *
     * @param mode {String} One of <code>direct</code>, <code>keep-align</code> or
     *   <code>best-fit</code>
     * @return {qx.util.placement.AbstractAxis}
     */
    __getAxis : function(mode)
    {
      switch(mode)
      {
        case "direct":
          this.__direct = this.__direct || qx.util.placement.DirectAxis;
          return this.__direct;

        case "keep-align":
          this.__keepAlign = this.__keepAlign || qx.util.placement.KeepAlignAxis;
          return this.__keepAlign;

        case "best-fit":
          this.__bestFit = this.__bestFit || qx.util.placement.BestFitAxis;
          return this.__bestFit;

        default:
          throw new Error("Invalid 'mode' argument!'");
      }
    }
  },


  members :
  {
    __defaultAxis : null,

    /**
     * DOM and widget independent method to compute the location
     * of an object to make it relative to any other object.
     *
     * @param size {Map} With the keys <code>width</code> and <code>height</code>
     *   of the object to align
     * @param area {Map} Available area to position the object. Has the keys
     *   <code>width</code> and <code>height</code>. Normally this is the parent
     *   object of the one to align.
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>left</code>, <code>top</code>, <code>right</code>
     *   and <code>bottom</code>.
     * @param offsets {Map} Map with all offsets for each direction.
     *   Comes with the keys <code>left</code>, <code>top</code>,
     *   <code>right</code> and <code>bottom</code>.
     * @return {Map} A map with the final location stored in the keys
     *   <code>left</code> and <code>top</code>.
     */
    compute : function(size, area, target, offsets)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertObject(size, "size");
        this.assertNumber(size.width, "size.width");
        this.assertNumber(size.height, "size.height");

        this.assertObject(area, "area");
        this.assertNumber(area.width, "area.width");
        this.assertNumber(area.height, "area.height");

        this.assertObject(target, "target");
        this.assertNumber(target.top, "target.top");
        this.assertNumber(target.right, "target.right");
        this.assertNumber(target.bottom, "target.bottom");
        this.assertNumber(target.left, "target.left");

        this.assertObject(offsets, "offsets");
        this.assertNumber(offsets.top, "offsets.top");
        this.assertNumber(offsets.right, "offsets.right");
        this.assertNumber(offsets.bottom, "offsets.bottom");
        this.assertNumber(offsets.left, "offsets.left");
      }

      var axisX = this.getAxisX() || this.__defaultAxis;
      var left = axisX.computeStart(
        size.width,
        {start: target.left, end: target.right},
        {start: offsets.left, end: offsets.right},
        area.width,
        this.__getPositionX()
      );

      var axisY = this.getAxisY() || this.__defaultAxis;
      var top = axisY.computeStart(
        size.height,
        {start: target.top, end: target.bottom},
        {start: offsets.top, end: offsets.bottom},
        area.height,
        this.__getPositionY()
      );

      return {
        left: left,
        top: top
      }
    },


    /**
     * Get the position value for the horizontal axis
     *
     * @return {String} the position
     */
    __getPositionX : function()
    {
      var edge = this.getEdge();
      var align = this.getAlign();

      if (edge == "left") {
        return "edge-start";
      } else if (edge == "right") {
        return "edge-end";
      } else if (align == "left") {
        return "align-start";
      } else if (align == "center") {
        return "align-center";
      } else if (align == "right") {
        return "align-end";
      }
    },


    /**
     * Get the position value for the vertical axis
     *
     * @return {String} the position
     */
    __getPositionY : function()
    {
      var edge = this.getEdge();
      var align = this.getAlign();

      if (edge == "top") {
        return "edge-start";
      } else if (edge == "bottom") {
        return "edge-end";
      } else if (align == "top") {
        return "align-start";
      } else if (align == "middle") {
        return "align-center";
      } else if (align == "bottom") {
        return "align-end";
      }
    }
  },


  destruct : function()
  {
    this._disposeObjects('__defaultAxis');
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Abstract class to compute the position of an object on one axis.
 */
qx.Bootstrap.define("qx.util.placement.AbstractAxis",
{
  extend : Object,

  statics :
  {
    /**
     * Computes the start of the object on the axis
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param areaSize {Integer} Size of the axis.
     * @param position {String} Alignment of the object on the target. Valid values are
     *   <ul>
     *   <li><code>edge-start</code> The object is placed before the target</li>
     *   <li><code>edge-end</code> The object is placed after the target</li>
     *   <li><code>align-start</code>The start of the object is aligned with the start of the target</li>
     *   <li><code>align-center</code>The center of the object is aligned with the center of the target</li>
     *   <li><code>align-end</code>The end of the object is aligned with the end of the object</li>
     *   </ul>
     * @return {Integer} The computed start position of the object.
     * @abstract
     */
    computeStart : function(size, target, offsets, areaSize, position) {
      throw new Error("abstract method call!");
    },


    /**
     * Computes the start of the object by taking only the attachment and
     * alignment into account. The object by be not fully visible.
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param position {String} Accepts the same values as the <code> position</code>
     *   argument of {@link #computeStart}.
     * @return {Integer} The computed start position of the object.
     */
    _moveToEdgeAndAlign : function(size, target, offsets, position)
    {
      switch(position)
      {
        case "edge-start":
          return target.start - offsets.end - size;

        case "edge-end":
          return target.end + offsets.start;

        case "align-start":
          return target.start + offsets.start;

        case "align-center":
          return target.start + parseInt((target.end - target.start - size) / 2, 10) + offsets.start;

        case "align-end":
          return target.end - offsets.end - size;
      }
    },


    /**
     * Whether the object specified by <code>start</code> and <code>size</code>
     * is completely inside of the axis' range..
     *
     * @param start {Integer} Computed start position of the object
     * @param size {Integer} Size of the object
     * @param areaSize {Integer} The size of the axis
     * @return {Boolean} Whether the object is inside of the axis' range
     */
    _isInRange : function(start, size, areaSize) {
      return start >= 0 && start + size <= areaSize;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Places the object directly at the specified position. It is not moved if
 * parts of the object are outside of the axis' range.
 */
qx.Bootstrap.define("qx.util.placement.DirectAxis",
{
  statics :
  {
    /**
     * Computes the start of the object by taking only the attachment and
     * alignment into account. The object by be not fully visible.
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param position {String} Accepts the same values as the <code> position</code>
     *   argument of {@link #computeStart}.
     * @return {Integer} The computed start position of the object.
     */
    _moveToEdgeAndAlign : qx.util.placement.AbstractAxis._moveToEdgeAndAlign,

    /**
     * Computes the start of the object on the axis
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param areaSize {Integer} Size of the axis.
     * @param position {String} Alignment of the object on the target. Valid values are
     *   <ul>
     *   <li><code>edge-start</code> The object is placed before the target</li>
     *   <li><code>edge-end</code> The object is placed after the target</li>
     *   <li><code>align-start</code>The start of the object is aligned with the start of the target</li>
     *   <li><code>align-center</code>The center of the object is aligned with the center of the target</li>
     *   <li><code>align-end</code>The end of the object is aligned with the end of the object</li>
     *   </ul>
     * @return {Integer} The computed start position of the object.
     */
    computeStart : function(size, target, offsets, areaSize, position) {
      return this._moveToEdgeAndAlign(size, target, offsets, position);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Places the object to the target. If parts of the object are outside of the
 * range this class places the object at the best "edge", "alignment"
 * combination so that the overlap between object and range is maximized.
 */
qx.Bootstrap.define("qx.util.placement.KeepAlignAxis",
{
  statics :
  {
    /**
     * Computes the start of the object by taking only the attachment and
     * alignment into account. The object by be not fully visible.
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param position {String} Accepts the same values as the <code> position</code>
     *   argument of {@link #computeStart}.
     * @return {Integer} The computed start position of the object.
     */
    _moveToEdgeAndAlign : qx.util.placement.AbstractAxis._moveToEdgeAndAlign,

    /**
     * Whether the object specified by <code>start</code> and <code>size</code>
     * is completely inside of the axis' range..
     *
     * @param start {Integer} Computed start position of the object
     * @param size {Integer} Size of the object
     * @param areaSize {Integer} The size of the axis
     * @return {Boolean} Whether the object is inside of the axis' range
     */
    _isInRange : qx.util.placement.AbstractAxis._isInRange,

    /**
     * Computes the start of the object on the axis
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param areaSize {Integer} Size of the axis.
     * @param position {String} Alignment of the object on the target. Valid values are
     *   <ul>
     *   <li><code>edge-start</code> The object is placed before the target</li>
     *   <li><code>edge-end</code> The object is placed after the target</li>
     *   <li><code>align-start</code>The start of the object is aligned with the start of the target</li>
     *   <li><code>align-center</code>The center of the object is aligned with the center of the target</li>
     *   <li><code>align-end</code>The end of the object is aligned with the end of the object</li>
     *   </ul>
     * @return {Integer} The computed start position of the object.
     */
    computeStart : function(size, target, offsets, areaSize, position)
    {
      var start = this._moveToEdgeAndAlign(size, target, offsets, position);
      var range1End, range2Start;

      if (this._isInRange(start, size, areaSize)) {
        return start;
      }

      if (position == "edge-start" || position == "edge-end")
      {
        range1End = target.start - offsets.end;
        range2Start = target.end + offsets.start;
      }
      else
      {
        range1End = target.end - offsets.end;
        range2Start = target.start + offsets.start;
      }

      if (range1End > areaSize - range2Start) {
        start = range1End - size;
      } else {
        start = range2Start;
      }

      return start;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Places the object according to the target. If parts of the object are outside
 * of the axis' range the object's start is adjusted so that the overlap between
 * the object and the axis is maximized.
 */
qx.Bootstrap.define("qx.util.placement.BestFitAxis",
{
  statics :
  {
    /**
     * Whether the object specified by <code>start</code> and <code>size</code>
     * is completely inside of the axis' range..
     *
     * @param start {Integer} Computed start position of the object
     * @param size {Integer} Size of the object
     * @param areaSize {Integer} The size of the axis
     * @return {Boolean} Whether the object is inside of the axis' range
     */
    _isInRange : qx.util.placement.AbstractAxis._isInRange,

    /**
     * Computes the start of the object by taking only the attachment and
     * alignment into account. The object by be not fully visible.
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param position {String} Accepts the same values as the <code> position</code>
     *   argument of {@link #computeStart}.
     * @return {Integer} The computed start position of the object.
     */
    _moveToEdgeAndAlign : qx.util.placement.AbstractAxis._moveToEdgeAndAlign,

    /**
     * Computes the start of the object on the axis
     *
     * @param size {Integer} Size of the object to align
     * @param target {Map} Location of the object to align the object to. This map
     *   should have the keys <code>start</code> and <code>end</code>.
     * @param offsets {Map} Map with all offsets on each side.
     *   Comes with the keys <code>start</code> and <code>end</code>.
     * @param areaSize {Integer} Size of the axis.
     * @param position {String} Alignment of the object on the target. Valid values are
     *   <ul>
     *   <li><code>edge-start</code> The object is placed before the target</li>
     *   <li><code>edge-end</code> The object is placed after the target</li>
     *   <li><code>align-start</code>The start of the object is aligned with the start of the target</li>
     *   <li><code>align-center</code>The center of the object is aligned with the center of the target</li>
     *   <li><code>align-end</code>The end of the object is aligned with the end of the object</li>
     *   </ul>
     * @return {Integer} The computed start position of the object.
     */
    computeStart : function(size, target, offsets, areaSize, position)
    {
      var start = this._moveToEdgeAndAlign(size, target, offsets, position);

      if (this._isInRange(start, size, areaSize)) {
        return start;
      }

      if (start < 0) {
        start = Math.min(0, areaSize - size);
      }

      if (start + size > areaSize) {
        start = Math.max(0, areaSize - size);
      }

      return start;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The base class of all items, which should be laid out using a layout manager
 * {@link qx.ui.layout.Abstract}.
 */
qx.Class.define("qx.ui.core.LayoutItem",
{
  type : "abstract",
  extend : qx.core.Object,

  construct : function() {
    this.base(arguments);

    // dynamic theme switch
    if (qx.core.Environment.get("qx.dyntheme")) {
      qx.theme.manager.Appearance.getInstance().addListener(
        "changeTheme", this._onChangeTheme, this
      );
      qx.theme.manager.Color.getInstance().addListener(
        "changeTheme", this._onChangeTheme, this
      );
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      DIMENSION
    ---------------------------------------------------------------------------
    */

    /**
     * The user provided minimal width.
     *
     * Also take a look at the related properties {@link #width} and {@link #maxWidth}.
     */
    minWidth :
    {
      check : "Integer",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },


    /**
     * The <code>LayoutItem</code>'s preferred width.
     *
     * The computed width may differ from the given width due to
     * stretching. Also take a look at the related properties
     * {@link #minWidth} and {@link #maxWidth}.
     */
    width :
    {
      check : "Integer",
      event : "changeWidth",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },


    /**
     * The user provided maximal width.
     *
     * Also take a look at the related properties {@link #width} and {@link #minWidth}.
     */
    maxWidth :
    {
      check : "Integer",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },


    /**
     * The user provided minimal height.
     *
     * Also take a look at the related properties {@link #height} and {@link #maxHeight}.
     */
    minHeight :
    {
      check : "Integer",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },


    /**
     * The item's preferred height.
     *
     * The computed height may differ from the given height due to
     * stretching. Also take a look at the related properties
     * {@link #minHeight} and {@link #maxHeight}.
     */
    height :
    {
      check : "Integer",
      event : "changeHeight",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },


    /**
     * The user provided maximum height.
     *
     * Also take a look at the related properties {@link #height} and {@link #minHeight}.
     */
    maxHeight :
    {
      check : "Integer",
      nullable : true,
      apply : "_applyDimension",
      init : null,
      themeable : true
    },





    /*
    ---------------------------------------------------------------------------
      STRETCHING
    ---------------------------------------------------------------------------
    */

    /** Whether the item can grow horizontally. */
    allowGrowX :
    {
      check : "Boolean",
      apply : "_applyStretching",
      init : true,
      themeable : true
    },


    /** Whether the item can shrink horizontally. */
    allowShrinkX :
    {
      check : "Boolean",
      apply : "_applyStretching",
      init : true,
      themeable : true
    },


    /** Whether the item can grow vertically. */
    allowGrowY :
    {
      check : "Boolean",
      apply : "_applyStretching",
      init : true,
      themeable : true
    },


    /** Whether the item can shrink vertically. */
    allowShrinkY :
    {
      check : "Boolean",
      apply : "_applyStretching",
      init : true,
      themeable : true
    },


    /** Growing and shrinking in the horizontal direction */
    allowStretchX :
    {
      group : [ "allowGrowX", "allowShrinkX" ],
      mode : "shorthand",
      themeable: true
    },


    /** Growing and shrinking in the vertical direction */
    allowStretchY :
    {
      group : [ "allowGrowY", "allowShrinkY" ],
      mode : "shorthand",
      themeable: true
    },





    /*
    ---------------------------------------------------------------------------
      MARGIN
    ---------------------------------------------------------------------------
    */

    /** Margin of the widget (top) */
    marginTop :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMargin",
      themeable : true
    },


    /** Margin of the widget (right) */
    marginRight :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMargin",
      themeable : true
    },


    /** Margin of the widget (bottom) */
    marginBottom :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMargin",
      themeable : true
    },


    /** Margin of the widget (left) */
    marginLeft :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMargin",
      themeable : true
    },


    /**
     * The 'margin' property is a shorthand property for setting 'marginTop',
     * 'marginRight', 'marginBottom' and 'marginLeft' at the same time.
     *
     * If four values are specified they apply to top, right, bottom and left respectively.
     * If there is only one value, it applies to all sides, if there are two or three,
     * the missing values are taken from the opposite side.
     */
    margin :
    {
      group : [ "marginTop", "marginRight", "marginBottom", "marginLeft" ],
      mode  : "shorthand",
      themeable : true
    },




    /*
    ---------------------------------------------------------------------------
      ALIGN
    ---------------------------------------------------------------------------
    */

    /**
     * Horizontal alignment of the item in the parent layout.
     *
     * Note: Item alignment is only supported by {@link LayoutItem} layouts where
     * it would have a visual effect. Except for {@link Spacer}, which provides
     * blank space for layouts, all classes that inherit {@link LayoutItem} support alignment.
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      nullable : true,
      apply : "_applyAlign",
      themeable: true
    },


    /**
     * Vertical alignment of the item in the parent layout.
     *
     * Note: Item alignment is only supported by {@link LayoutItem} layouts where
     * it would have a visual effect. Except for {@link Spacer}, which provides
     * blank space for layouts, all classes that inherit {@link LayoutItem} support alignment.
     */
    alignY :
    {
      check : [ "top", "middle", "bottom", "baseline" ],
      nullable : true,
      apply : "_applyAlign",
      themeable: true
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      DYNAMIC THEME SWITCH SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Handler for the dynamic theme change.
     * @signature function()
     */
    _onChangeTheme : qx.core.Environment.select("qx.dyntheme",
    {
      "true" : function() {
        // reset all themeable properties
        var props = qx.util.PropertyUtil.getAllProperties(this.constructor);
        for (var name in props) {
          var desc = props[name];
          // only themeable properties not having a user value
          if (desc.themeable) {
            var userValue = qx.util.PropertyUtil.getUserValue(this, name);
            if (userValue == null) {
              qx.util.PropertyUtil.resetThemed(this, name);
            }
          }
        }
      },
      "false" : null
    }),




    /*
    ---------------------------------------------------------------------------
      LAYOUT PROCESS
    ---------------------------------------------------------------------------
    */

    /** @type {Integer} The computed height */
    __computedHeightForWidth : null,

    /** @type {Map} The computed size of the layout item */
    __computedLayout : null,

    /** @type {Boolean} Whether the current layout is valid */
    __hasInvalidLayout : null,

    /** @type {Map} Cached size hint */
    __sizeHint : null,

    /** @type {Boolean} Whether the margins have changed and must be updated */
    __updateMargin : null,

    /** @type {Map} user provided bounds of the widget, which override the layout manager */
    __userBounds : null,

    /** @type {Map} The item's layout properties */
    __layoutProperties : null,


    /**
     * Get the computed location and dimension as computed by
     * the layout manager.
     *
     * @return {Map} The location and dimensions in pixel
     *    (if the layout is valid). Contains the keys
     *    <code>width</code>, <code>height</code>, <code>left</code> and
     *    <code>top</code>.
     */
    getBounds : function() {
      return this.__userBounds || this.__computedLayout || null;
    },


    /**
     * Reconfigure number of separators
     */
    clearSeparators : function() {
      // empty template
    },


    /**
     * Renders a separator between two children
     *
     * @param separator {Decorator} The separator to render
     * @param bounds {Map} Contains the left and top coordinate and the width and height
     *    of the separator to render.
     */
    renderSeparator : function(separator, bounds) {
      // empty template
    },


    /**
     * Used by the layout engine to apply coordinates and dimensions.
     *
     * @param left {Integer} Any integer value for the left position,
     *   always in pixels
     * @param top {Integer} Any integer value for the top position,
     *   always in pixels
     * @param width {Integer} Any positive integer value for the width,
     *   always in pixels
     * @param height {Integer} Any positive integer value for the height,
     *   always in pixels
     * @return {Map} A map of which layout sizes changed.
     */
    renderLayout : function(left, top, width, height)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Something went wrong with the layout of " + this.toString() + "!";
        this.assertInteger(left, "Wrong 'left' argument. " + msg);
        this.assertInteger(top, "Wrong 'top' argument. " + msg);
        this.assertInteger(width, "Wrong 'width' argument. " + msg);
        this.assertInteger(height, "Wrong 'height' argument. " + msg);

        // this.assertInRange(width, this.getMinWidth() || -1, this.getMaxWidth() || 32000);
        // this.assertInRange(height, this.getMinHeight() || -1, this.getMaxHeight() || 32000);
      }



      // Height for width support
      // Results into a relayout which means that width/height is applied in the next iteration.
      var flowHeight = null;
      if (this.getHeight() == null && this._hasHeightForWidth()) {
        var flowHeight = this._getHeightForWidth(width);
      }

      if (flowHeight != null && flowHeight !== this.__computedHeightForWidth)
      {
        // This variable is used in the next computation of the size hint
        this.__computedHeightForWidth = flowHeight;

        // Re-add to layout queue
        qx.ui.core.queue.Layout.add(this);

        return null;
      }

      // Detect size changes

      // Dynamically create data structure for computed layout
      var computed = this.__computedLayout;
      if (!computed) {
        computed = this.__computedLayout = {};
      }

      // Detect changes
      var changes = {};

      if (left !== computed.left || top !== computed.top)
      {
        changes.position = true;

        computed.left = left;
        computed.top = top;
      }

      if (width !== computed.width || height !== computed.height)
      {
        changes.size = true;

        computed.width = width;
        computed.height = height;
      }

      // Clear invalidation marker
      if (this.__hasInvalidLayout)
      {
        changes.local = true;
        delete this.__hasInvalidLayout;
      }

      if (this.__updateMargin)
      {
        changes.margin = true;
        delete this.__updateMargin;
      }

      // Returns changes, especially for deriving classes
      return changes;
    },


    /**
     * Whether the item should be excluded from the layout
     *
     * @return {Boolean} Should the item be excluded by the layout
     */
    isExcluded : function() {
      return false;
    },


    /**
     * Whether the layout of this item (to layout the children)
     * is valid.
     *
     * @return {Boolean} Returns <code>true</code>
     */
    hasValidLayout : function() {
      return !this.__hasInvalidLayout;
    },


    /**
     * Indicate that the item has layout changes and propagate this information
     * up the item hierarchy.
     *
     */
    scheduleLayoutUpdate : function() {
      qx.ui.core.queue.Layout.add(this);
    },


    /**
     * Called by the layout manager to mark this item's layout as invalid.
     * This function should clear all layout relevant caches.
     */
    invalidateLayoutCache : function()
    {
      // this.debug("Mark layout invalid!");

      this.__hasInvalidLayout = true;
      this.__sizeHint = null;
    },


    /**
     * A size hint computes the dimensions of a widget. It returns
     * the recommended dimensions as well as the min and max dimensions.
     * The min and max values already respect the stretching properties.
     *
     * <h3>Wording</h3>
     * <ul>
     * <li>User value: Value defined by the widget user, using the size properties</li>
     *
     * <li>Layout value: The value computed by {@link qx.ui.core.Widget#_getContentHint}</li>
     * </ul>
     *
     * <h3>Algorithm</h3>
     * <ul>
     * <li>minSize: If the user min size is not null, the user value is taken,
     *     otherwise the layout value is used.</li>
     *
     * <li>(preferred) size: If the user value is not null the user value is used,
     *     otherwise the layout value is used.</li>
     *
     * <li>max size: Same as the preferred size.</li>
     * </ul>
     *
     * @param compute {Boolean?true} Automatically compute size hint if currently not
     *   cached?
     * @return {Map} The map with the preferred width/height and the allowed
     *   minimum and maximum values in cases where shrinking or growing
     *   is required.
     */
    getSizeHint : function(compute)
    {
      var hint = this.__sizeHint;
      if (hint) {
        return hint;
      }

      if (compute === false) {
        return null;
      }

      // Compute as defined
      hint = this.__sizeHint = this._computeSizeHint();

      // Respect height for width
      if (this._hasHeightForWidth() && this.__computedHeightForWidth && this.getHeight() == null) {
        hint.height = this.__computedHeightForWidth;
      }


      // normalize width
      if (hint.minWidth > hint.width) {
        hint.width = hint.minWidth;
      }
      if (hint.maxWidth < hint.width) {
        hint.width = hint.maxWidth;
      }

      if (!this.getAllowGrowX()) {
        hint.maxWidth = hint.width;
      }
      if (!this.getAllowShrinkX()) {
        hint.minWidth = hint.width;
      }


      // normalize height
      if (hint.minHeight > hint.height) {
        hint.height = hint.minHeight;
      }
      if (hint.maxHeight < hint.height) {
        hint.height = hint.maxHeight;
      }

      if (!this.getAllowGrowY()) {
        hint.maxHeight = hint.height;
      }
      if (!this.getAllowShrinkY()) {
        hint.minHeight = hint.height;
      }


      // Finally return
      return hint;
    },


    /**
     * Computes the size hint of the layout item.
     *
     * @return {Map} The map with the preferred width/height and the allowed
     *   minimum and maximum values.
     */
    _computeSizeHint : function()
    {
      var minWidth = this.getMinWidth() || 0;
      var minHeight = this.getMinHeight() || 0;

      var width = this.getWidth() || minWidth;
      var height = this.getHeight() || minHeight;

      var maxWidth = this.getMaxWidth() || Infinity;
      var maxHeight = this.getMaxHeight() || Infinity;

      return {
        minWidth : minWidth,
        width : width,
        maxWidth : maxWidth,
        minHeight : minHeight,
        height : height,
        maxHeight : maxHeight
      };
    },


    /**
     * Whether the item supports height for width.
     *
     * @return {Boolean} Whether the item supports height for width
     */
    _hasHeightForWidth : function()
    {
      var layout = this._getLayout();
      if (layout) {
        return layout.hasHeightForWidth();
      }
      return false;
    },


    /**
     * If an item wants to trade height for width it has to implement this
     * method and return the preferred height of the item if it is resized to
     * the given width. This function returns <code>null</code> if the item
     * do not support height for width.
     *
     * @param width {Integer} The computed width
     * @return {Integer} The desired height
     */
    _getHeightForWidth : function(width)
    {
      var layout = this._getLayout();
      if (layout && layout.hasHeightForWidth()) {
        return layout.getHeightForWidth(width);
      }

      return null;
    },


    /**
     * Get the widget's layout manager.
     *
     * @return {qx.ui.layout.Abstract} The widget's layout manager
     */
    _getLayout : function() {
      return null;
    },


    // property apply
    _applyMargin : function()
    {
      this.__updateMargin = true;

      var parent = this.$$parent;
      if (parent) {
        parent.updateLayoutProperties();
      }
    },


    // property apply
    _applyAlign : function()
    {
      var parent = this.$$parent;
      if (parent) {
        parent.updateLayoutProperties();
      }
    },


    // property apply
    _applyDimension : function() {
      qx.ui.core.queue.Layout.add(this);
    },


    // property apply
    _applyStretching : function() {
      qx.ui.core.queue.Layout.add(this);
    },






    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR USER BOUNDARIES
    ---------------------------------------------------------------------------
    */

    /**
     * Whether user bounds are set on this layout item
     *
     * @return {Boolean} Whether user bounds are set on this layout item
     */
    hasUserBounds : function() {
      return !!this.__userBounds;
    },


    /**
     * Set user bounds of the widget. Widgets with user bounds are sized and
     * positioned manually and are ignored by any layout manager.
     *
     * @param left {Integer} left position (relative to the parent)
     * @param top {Integer} top position (relative to the parent)
     * @param width {Integer} width of the layout item
     * @param height {Integer} height of the layout item
     */
    setUserBounds : function(left, top, width, height)
    {
      this.__userBounds = {
        left: left,
        top: top,
        width: width,
        height: height
      };

      qx.ui.core.queue.Layout.add(this);
    },


    /**
     * Clear the user bounds. After this call the layout item is laid out by
     * the layout manager again.
     *
     */
    resetUserBounds : function()
    {
      delete this.__userBounds;
      qx.ui.core.queue.Layout.add(this);
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT PROPERTIES
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Map} Empty storage pool
     *
     * @lint ignoreReferenceField(__emptyProperties)
     */
    __emptyProperties : {},


    /**
     * Stores the given layout properties
     *
     * @param props {Map} Incoming layout property data
     */
    setLayoutProperties : function(props)
    {
      if (props == null) {
        return;
      }

      var storage = this.__layoutProperties;
      if (!storage) {
        storage = this.__layoutProperties = {};
      }

      // Check values through parent
      var parent = this.getLayoutParent();
      if (parent) {
        parent.updateLayoutProperties(props);
      }

      // Copy over values
      for (var key in props)
      {
        if (props[key] == null) {
          delete storage[key];
        } else {
          storage[key] = props[key];
        }
      }
    },


    /**
     * Returns currently stored layout properties
     *
     * @return {Map} Returns a map of layout properties
     */
    getLayoutProperties : function() {
      return this.__layoutProperties || this.__emptyProperties;
    },


    /**
     * Removes all stored layout properties.
     *
     */
    clearLayoutProperties : function() {
      delete this.__layoutProperties;
    },


    /**
     * Should be executed on every change of layout properties.
     *
     * This also includes "virtual" layout properties like margin or align
     * when they have an effect on the parent and not on the widget itself.
     *
     * This method is always executed on the parent not on the
     * modified widget itself.
     *
     * @param props {Map?null} Optional map of known layout properties
     */
    updateLayoutProperties : function(props)
    {
      var layout = this._getLayout();
      if (layout)
      {
        // Verify values through underlying layout
        if (qx.core.Environment.get("qx.debug"))
        {
          if (props)
          {
            for (var key in props) {
              if (props[key] !== null) {
                layout.verifyLayoutProperty(this, key, props[key]);
              }
            }
          }
        }

        // Precomputed and cached children data need to be
        // rebuild on upcoming (re-)layout.
        layout.invalidateChildrenCache();
      }

      qx.ui.core.queue.Layout.add(this);
    },





    /*
    ---------------------------------------------------------------------------
      HIERARCHY SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the application root
     *
     * @return {qx.ui.root.Abstract} The currently used root
     */
    getApplicationRoot : function() {
      return qx.core.Init.getApplication().getRoot();
    },


    /**
     * Get the items parent. Even if the item has been added to a
     * layout, the parent is always a child of the containing item. The parent
     * item may be <code>null</code>.
     *
     * @return {qx.ui.core.Widget|null} The parent.
     */
    getLayoutParent : function() {
      return this.$$parent || null;
    },


    /**
     * Set the parent
     *
     * @param parent {qx.ui.core.Widget|null} The new parent.
     */
    setLayoutParent : function(parent)
    {
      if (this.$$parent === parent) {
        return;
      }

      this.$$parent = parent || null;
      qx.ui.core.queue.Visibility.add(this);
    },


    /**
     * Whether the item is a root item and directly connected to
     * the DOM.
     *
     * @return {Boolean} Whether the item a root item
     */
    isRootWidget : function() {
      return false;
    },


    /**
     * Returns the root item. The root item is the item which
     * is directly inserted into an existing DOM node at HTML level.
     * This is often the BODY element of a typical web page.
     *
     * @return {qx.ui.core.Widget} The root item (if available)
     */
    _getRoot : function()
    {
      var parent = this;

      while (parent)
      {
        if (parent.isRootWidget()) {
          return parent;
        }

        parent = parent.$$parent;
      }

      return null;
    },





    /*
    ---------------------------------------------------------------------------
      CLONE SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    clone : function()
    {
      var clone = this.base(arguments);

      var props = this.__layoutProperties;
      if (props) {
        clone.__layoutProperties = qx.lang.Object.clone(props);
      }

      return clone;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    // remove dynamic theme listener
    if (qx.core.Environment.get("qx.dyntheme")) {
      qx.theme.manager.Appearance.getInstance().removeListener(
        "changeTheme", this._onChangeTheme, this
      );
      qx.theme.manager.Color.getInstance().removeListener(
        "changeTheme", this._onChangeTheme, this
      );
    }
    this.$$parent = this.$$subparent = this.__layoutProperties =
      this.__computedLayout = this.__userBounds = this.__sizeHint = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Manager for appearance themes
 */
qx.Class.define("qx.theme.manager.Appearance",
{
  type : "singleton",
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.__styleCache = {};
    this.__aliasMap = {};
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** currently used appearance theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      event : "changeTheme",
      apply : "_applyTheme"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * @lint ignoreReferenceField(__defaultStates)
     */
    __defaultStates : {},
    __styleCache : null,
    __aliasMap : null,


    // property apply
    _applyTheme : function() {
      // empty the caches
      this.__aliasMap = {};
      this.__styleCache = {};
    },


    /*
    ---------------------------------------------------------------------------
      THEME HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the appearance entry ID to use
     * when all aliases etc. are processed.
     *
     * @param id {String} ID to resolve.
     * @param theme {Theme} Theme to use for lookup.
     * @param defaultId {String} ID for a fallback.
     * @param chain {Array} The appearance id chain.
     * @return {String} Resolved ID
     */
    __resolveId : function(id, theme, defaultId, chain)
    {
      var db = theme.appearances;
      var entry = db[id];

      if (!entry)
      {
        var divider = "/";
        var end = [];
        var splitted = id.split(divider);
        var chainCopy = qx.lang.Array.clone(splitted);
        var alias;

        while (!entry && splitted.length > 0)
        {
          end.unshift(splitted.pop());
          var baseid = splitted.join(divider);
          entry = db[baseid];

          if (entry)
          {
            alias = entry.alias || entry;

            if (typeof alias === "string")
            {
              var mapped = alias + divider + end.join(divider);
              return this.__resolveId(mapped, theme, defaultId, chainCopy);
            }
          }
        }

        // check if we find a control fitting in the appearance [BUG #4020]
        for (var i = 0; i < end.length - 1; i++) {
          // remove the first id, it has already been checked at startup
          end.shift();
          // build a new subid without the former first id
          var subId = end.join(divider);
          var resolved = this.__resolveId(subId, theme, null, chainCopy);
          if (resolved) {
            return resolved;
          }
        }

        // check for the fallback
        if (defaultId != null) {
          return this.__resolveId(defaultId, theme, null, chainCopy);
        }

        // it's safe to output this message here since we can be sure that the return
        // value is 'null' and something went wrong with the id lookup.
        if (qx.core.Environment.get("qx.debug"))
        {
          if (typeof chain !== "undefined") {
            this.debug("Cannot find a matching appearance for '" + chain.join("/") + "'.");

            if (chain.length > 1) {
              this.info("Hint: This may be an issue with nested child controls and a missing alias definition in the appearance theme.");
            }
          }
        }

        return null;
      }
      else if (typeof entry === "string")
      {
        return this.__resolveId(entry, theme, defaultId, chainCopy);
      }
      else if (entry.include && !entry.style)
      {
        return this.__resolveId(entry.include, theme, defaultId, chainCopy);
      }

      return id;
    },


    /**
     * Get the result of the "state" function for a given id and states
     *
     * @param id {String} id of the appearance (e.g. "button", "label", ...)
     * @param states {Map} hash map defining the set states
     * @param theme {Theme?} appearance theme
     * @param defaultId {String} fallback id.
     * @return {Map} map of widget properties as returned by the "state" function
     */
    styleFrom : function(id, states, theme, defaultId)
    {
      if (!theme) {
        theme = this.getTheme();
      }

      // Resolve ID
      var aliasMap = this.__aliasMap;
      var resolved = aliasMap[id];
      if (!resolved) {
        resolved = aliasMap[id] = this.__resolveId(id, theme, defaultId);
      }

      // Query theme for ID
      var entry = theme.appearances[resolved];
      if (!entry)
      {
        this.warn("Missing appearance: " + id);
        return null;
      }

      // Entries with includes, but without style are automatically merged
      // by the ID handling in {@link #getEntry}. When there is no style method in the
      // final object the appearance is empty and null could be returned.
      if (!entry.style) {
        return null;
      }

      // Build an unique cache name from ID and state combination
      var unique = resolved;
      if (states)
      {
        // Create data fields
        var bits = entry.$$bits;
        if (!bits)
        {
          bits = entry.$$bits = {};
          entry.$$length = 0;
        }

        // Compute sum
        var sum = 0;
        for (var state in states)
        {
          if (!states[state]) {
            continue;
          }

          if (bits[state] == null) {
            bits[state] = 1<<entry.$$length++;
          }

          sum += bits[state];
        }

        // Only append the sum if it is bigger than zero
        if (sum > 0) {
          unique += ":" + sum;
        }
      }

      // Using cache if available
      var cache = this.__styleCache;
      if (cache[unique] !== undefined) {
        return cache[unique];
      }

      // Fallback to default (empty) states map
      if (!states) {
        states = this.__defaultStates;
      }

      // Compile the appearance
      var result;

      // If an include or base is defined, too, we need to merge the entries
      if (entry.include || entry.base)
      {

        // Gather included data
        var incl;
        if (entry.include) {
          incl = this.styleFrom(entry.include, states, theme, defaultId);
        }

        // This process tries to insert the original data first, and
        // append the new data later, to higher prioritize the local
        // data above the included/inherited data. This is especially needed
        // for property groups or properties which includes other
        // properties when modified.
        var local = entry.style(states, incl);

        // Create new map
        result = {};

        // Copy base data, but exclude overwritten local and included stuff
        if (entry.base)
        {
          var base = this.styleFrom(resolved, states, entry.base, defaultId);

          if (entry.include)
          {
            for (var baseIncludeKey in base)
            {
              if (!incl.hasOwnProperty(baseIncludeKey) && !local.hasOwnProperty(baseIncludeKey)) {
                result[baseIncludeKey] = base[baseIncludeKey];
              }
            }
          }
          else
          {
            for (var baseKey in base)
            {
              if (!local.hasOwnProperty(baseKey)) {
                result[baseKey] = base[baseKey];
              }
            }
          }
        }

        // Copy include data, but exclude overwritten local stuff
        if (entry.include)
        {
          for (var includeKey in incl)
          {
            if (!local.hasOwnProperty(includeKey)) {
              result[includeKey] = incl[includeKey];
            }
          }
        }

        // Append local data
        for (var localKey in local) {
          result[localKey] = local[localKey];
        }
      }
      else
      {
        result = entry.style(states);
      }

      // Cache new entry and return
      return cache[unique] = result || null;
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__styleCache = this.__aliasMap = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Abstract base class for all managers of themed values.
 */
qx.Class.define("qx.util.ValueManager",
{
  type : "abstract",
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Create empty dynamic map
    this._dynamic = {};
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    _dynamic : null,

    /**
     * Returns the dynamically interpreted result for the incoming value
     *
     * @param value {String} dynamically interpreted identifier
     * @return {var} return the (translated) result of the incoming value
     */
    resolveDynamic : function(value) {
      return this._dynamic[value];
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns true if the value is interpreted dynamically
     */
    isDynamic : function(value) {
      return !!this._dynamic[value];
    },

    /**
     * Returns the dynamically interpreted result for the incoming value,
     * (if available), otherwise returns the original value
     * @param value {String} Value to resolve
     * @return {var} either returns the (translated) result of the incoming
     * value or the value itself
     */
    resolve : function(value)
    {
      if (value && this._dynamic[value]) {
        return this._dynamic[value];
      }

      return value;
    },

     /**
      * Sets the dynamics map.
      * @param value {Map} The map.
      */
    _setDynamic : function(value) {
      this._dynamic = value;
    },

    /**
     * Returns the dynamics map.
     * @return {Map} The map.
     */
    _getDynamic : function() {
      return this._dynamic;
    }

  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._dynamic = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Manager for color themes
 */
qx.Class.define("qx.theme.manager.Color",
{
  type : "singleton",
  extend : qx.util.ValueManager,




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** the currently selected color theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      apply : "_applyTheme",
      event : "changeTheme"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    _applyTheme : function(value)
    {
      var dest = {};

      if (value) {
        var colors = value.colors;

        for (var name in colors) {
          dest[name] = this.__parseColor(colors, name);
        }
      }

      this._setDynamic(dest);
    },


    /**
     * Helper to take a color stored in the theme and returns the string color value.
     * In most of the times that means it just returns the string stored in the theme.
     * It additionally checks if its a valid color at all.
     *
     * @param colors {Map} The map of color definitions.
     * @param name {String} The name of the color to check.
     * @return {String} The resolved color as string.
     */
    __parseColor : function(colors, name) {
      var color = colors[name];
      if (typeof color === "string") {
        if (!qx.util.ColorUtil.isCssString(color)) {
          // check for references to in theme colors
          if (colors[color] != undefined) {
            return this.__parseColor(colors, color);
          }
          throw new Error("Could not parse color: " + color);
        }
        return color;

      } else if (color instanceof Array) {
        return qx.util.ColorUtil.rgbToRgbString(color);
      }

      throw new Error("Could not parse color: " + color);
    },


    /**
     * Returns the dynamically interpreted result for the incoming value,
     * (if available), otherwise returns the original value
     * @param value {String} Value to resolve
     * @return {var} either returns the (translated) result of the incoming
     * value or the value itself
     */
    resolve : function(value)
    {
      var cache = this._dynamic;
      var resolved = cache[value];

      if (resolved)
      {
        return resolved;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && theme.colors[value])
      {
        return cache[value] = theme.colors[value];
      }

      return value;
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns true if the value is interpreted dynamically
     */
    isDynamic : function(value) {
      var cache = this._dynamic;

      if (value && (cache[value] !== undefined))
      {
        return true;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && value && (theme.colors[value] !== undefined))
      {
        cache[value] = theme.colors[value];
        return true;
      }

      return false;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Christian Hagendorn (cs)

************************************************************************ */

/**
 * Methods to convert colors between different color spaces.
 *
 * @ignore(qx.theme.*)
 * @ignore(qx.Class)
 * @ignore(qx.Class.*)
 */
qx.Bootstrap.define("qx.util.ColorUtil",
{
  statics :
  {
    /**
     * Regular expressions for color strings
     */
    REGEXP :
    {
      hex3 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex6 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      rgb : /^rgb\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/,
      rgba : /^rgba\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/
    },


    /**
     * CSS3 system color names.
     */
    SYSTEM :
    {
      activeborder        : true,
      activecaption       : true,
      appworkspace        : true,
      background          : true,
      buttonface          : true,
      buttonhighlight     : true,
      buttonshadow        : true,
      buttontext          : true,
      captiontext         : true,
      graytext            : true,
      highlight           : true,
      highlighttext       : true,
      inactiveborder      : true,
      inactivecaption     : true,
      inactivecaptiontext : true,
      infobackground      : true,
      infotext            : true,
      menu                : true,
      menutext            : true,
      scrollbar           : true,
      threeddarkshadow    : true,
      threedface          : true,
      threedhighlight     : true,
      threedlightshadow   : true,
      threedshadow        : true,
      window              : true,
      windowframe         : true,
      windowtext          : true
    },


    /**
     * Named colors, only the 16 basic colors plus the following ones:
     * transparent, grey, magenta, orange and brown
     */
    NAMED :
    {
      black       : [ 0, 0, 0 ],
      silver      : [ 192, 192, 192 ],
      gray        : [ 128, 128, 128 ],
      white       : [ 255, 255, 255 ],
      maroon      : [ 128, 0, 0 ],
      red         : [ 255, 0, 0 ],
      purple      : [ 128, 0, 128 ],
      fuchsia     : [ 255, 0, 255 ],
      green       : [ 0, 128, 0 ],
      lime        : [ 0, 255, 0 ],
      olive       : [ 128, 128, 0 ],
      yellow      : [ 255, 255, 0 ],
      navy        : [ 0, 0, 128 ],
      blue        : [ 0, 0, 255 ],
      teal        : [ 0, 128, 128 ],
      aqua        : [ 0, 255, 255 ],

      // Additional values
      transparent : [ -1, -1, -1 ],
      magenta     : [ 255, 0, 255 ],   // alias for fuchsia
      orange      : [ 255, 165, 0 ],
      brown       : [ 165, 42, 42 ]
    },


    /**
     * Whether the incoming value is a named color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a named color
     */
    isNamedColor : function(value) {
      return this.NAMED[value] !== undefined;
    },


    /**
     * Whether the incoming value is a system color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a system color
     */
    isSystemColor : function(value) {
      return this.SYSTEM[value] !== undefined;
    },


    /**
     * Whether the color theme manager is loaded. Generally
     * part of the GUI of qooxdoo.
     *
     * @return {Boolean} <code>true</code> when color theme support is ready.
     **/
    supportsThemes : function() {
      if (qx.Class) {
        return qx.Class.isDefined("qx.theme.manager.Color");
      }
      return false;
    },


    /**
     * Whether the incoming value is a themed color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a themed color
     */
    isThemedColor : function(value)
    {
      if (!this.supportsThemes()) {
        return false;
      }

      if (qx.theme && qx.theme.manager && qx.theme.manager.Color) {
        return qx.theme.manager.Color.getInstance().isDynamic(value);
      }
      return false;
    },


    /**
     * Try to convert an incoming string to an RGB array.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws {Error} if the string could not be parsed
     */
    stringToRgb : function(str)
    {
      if (this.supportsThemes() && this.isThemedColor(str)) {
        str = qx.theme.manager.Color.getInstance().resolveDynamic(str);
      }

      if (this.isNamedColor(str))
      {
        return this.NAMED[str].concat();
      }
      else if (this.isSystemColor(str))
      {
        throw new Error("Could not convert system colors to RGB: " + str);
      }
      else if (this.isRgbaString(str)) {
        return this.__rgbaStringToRgb(str);
      }
      else if (this.isRgbString(str))
      {
        return this.__rgbStringToRgb();
      }
      else if (this.isHex3String(str))
      {
        return this.__hex3StringToRgb();
      }
      else if (this.isHex6String(str))
      {
        return this.__hex6StringToRgb();
      }

      throw new Error("Could not parse color: " + str);
    },


    /**
     * Try to convert an incoming string to an RGB array.
     * Support named colors, RGB strings, hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws {Error} if the string could not be parsed
     */
    cssStringToRgb : function(str)
    {
      if (this.isNamedColor(str))
      {
        return this.NAMED[str];
      }
      else if (this.isSystemColor(str))
      {
        throw new Error("Could not convert system colors to RGB: " + str);
      }
      else if (this.isRgbString(str))
      {
        return this.__rgbStringToRgb();
      }
      else if (this.isRgbaString(str))
      {
        return this.__rgbaStringToRgb();
      }
      else if (this.isHex3String(str))
      {
        return this.__hex3StringToRgb();
      }
      else if (this.isHex6String(str))
      {
        return this.__hex6StringToRgb();
      }

      throw new Error("Could not parse color: " + str);
    },


    /**
     * Try to convert an incoming string to an RGB string, which can be used
     * for all color properties.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {String} a RGB string
     * @throws {Error} if the string could not be parsed
     */
    stringToRgbString : function(str) {
      return this.rgbToRgbString(this.stringToRgb(str));
    },


    /**
     * Converts a RGB array to an RGB string
     *
     * @param rgb {Array} an array with red, green and blue values and optionally
     * an alpha value
     * @return {String} an RGB string
     */
    rgbToRgbString : function(rgb) {
      return "rgb" + (rgb[3] ? "a" : "") +  "(" + rgb.join(",") + ")";
    },


    /**
     * Converts a RGB array to an hex6 string
     *
     * @param rgb {Array} an array with red, green and blue
     * @return {String} a hex6 string (#xxxxxx)
     */
    rgbToHexString : function(rgb)
    {
      return (
        "#" +
        qx.lang.String.pad(rgb[0].toString(16).toUpperCase(), 2) +
        qx.lang.String.pad(rgb[1].toString(16).toUpperCase(), 2) +
        qx.lang.String.pad(rgb[2].toString(16).toUpperCase(), 2)
      );
    },


    /**
     * Detects if a string is a valid qooxdoo color
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid qooxdoo color
     */
    isValidPropertyValue : function(str) {
      return (
        this.isThemedColor(str) ||
        this.isNamedColor(str) ||
        this.isHex3String(str) ||
        this.isHex6String(str) ||
        this.isRgbString(str) ||
        this.isRgbaString(str));
    },


    /**
     * Detects if a string is a valid CSS color string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid CSS color string
     */
    isCssString : function(str) {
      return (
        this.isSystemColor(str) ||
        this.isNamedColor(str) ||
        this.isHex3String(str) ||
        this.isHex6String(str) ||
        this.isRgbString(str) ||
        this.isRgbaString(str));
    },


    /**
     * Detects if a string is a valid hex3 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex3 string
     */
    isHex3String : function(str) {
      return this.REGEXP.hex3.test(str);
    },


    /**
     * Detects if a string is a valid hex6 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex6 string
     */
    isHex6String : function(str) {
      return this.REGEXP.hex6.test(str);
    },


    /**
     * Detects if a string is a valid RGB string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGB string
     */
    isRgbString : function(str) {
      return this.REGEXP.rgb.test(str);
    },


    /**
     * Detects if a string is a valid RGBA string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGBA string
     */
    isRgbaString : function(str) {
      return this.REGEXP.rgba.test(str);
    },


    /**
     * Converts a regexp object match of a rgb string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __rgbStringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);

      return [red, green, blue];
    },

   /**
    * Converts a regexp object match of a rgba string to an RGB array.
    *
    * @return {Array} an array with red, green, blue
    */
    __rgbaStringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);
      var alpha = parseInt(RegExp.$4, 10);

      if (red === 0 && green === 0 & blue === 0 && alpha === 0) {
        return [-1, -1, -1];
      }

      return [red, green, blue];
    },


    /**
     * Converts a regexp object match of a hex3 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex3StringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 16) * 17;
      var green = parseInt(RegExp.$2, 16) * 17;
      var blue = parseInt(RegExp.$3, 16) * 17;

      return [red, green, blue];
    },


    /**
     * Converts a regexp object match of a hex6 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex6StringToRgb : function()
    {
      var red = (parseInt(RegExp.$1, 16) * 16) + parseInt(RegExp.$2, 16);
      var green = (parseInt(RegExp.$3, 16) * 16) + parseInt(RegExp.$4, 16);
      var blue = (parseInt(RegExp.$5, 16) * 16) + parseInt(RegExp.$6, 16);

      return [red, green, blue];
    },


    /**
     * Converts a hex3 string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) string
     * @return {Array} an array with red, green, blue
     */
    hex3StringToRgb : function(value)
    {
      if (this.isHex3String(value)) {
        return this.__hex3StringToRgb(value);
      }

      throw new Error("Invalid hex3 value: " + value);
    },


    /**
     * Converts a hex3 (#xxx) string to a hex6 (#xxxxxx) string.
     *
     * @param value {String} a hex3 (#xxx) string
     * @return {String} The hex6 (#xxxxxx) string or the passed value when the
     *   passed value is not an hex3 (#xxx) value.
     */
    hex3StringToHex6String : function(value)
    {
      if (this.isHex3String(value)) {
        return this.rgbToHexString(this.hex3StringToRgb(value));
      }
      return value;
    },


    /**
     * Converts a hex6 string to an RGB array
     *
     * @param value {String} a hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hex6StringToRgb : function(value)
    {
      if (this.isHex6String(value)) {
        return this.__hex6StringToRgb(value);
      }

      throw new Error("Invalid hex6 value: " + value);
    },


    /**
     * Converts a hex string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) or hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hexStringToRgb : function(value)
    {
      if (this.isHex3String(value)) {
        return this.__hex3StringToRgb(value);
      }

      if (this.isHex6String(value)) {
        return this.__hex6StringToRgb(value);
      }

      throw new Error("Invalid hex value: " + value);
    },


    /**
     * Convert RGB colors to HSB
     *
     * @param rgb {Number[]} red, blue and green as array
     * @return {Array} an array with hue, saturation and brightness
     */
    rgbToHsb : function(rgb)
    {
      var hue, saturation, brightness;

      var red = rgb[0];
      var green = rgb[1];
      var blue = rgb[2];

      var cmax = (red > green) ? red : green;

      if (blue > cmax) {
        cmax = blue;
      }

      var cmin = (red < green) ? red : green;

      if (blue < cmin) {
        cmin = blue;
      }

      brightness = cmax / 255.0;

      if (cmax != 0) {
        saturation = (cmax - cmin) / cmax;
      } else {
        saturation = 0;
      }

      if (saturation == 0)
      {
        hue = 0;
      }
      else
      {
        var redc = (cmax - red) / (cmax - cmin);
        var greenc = (cmax - green) / (cmax - cmin);
        var bluec = (cmax - blue) / (cmax - cmin);

        if (red == cmax) {
          hue = bluec - greenc;
        } else if (green == cmax) {
          hue = 2.0 + redc - bluec;
        } else {
          hue = 4.0 + greenc - redc;
        }

        hue = hue / 6.0;

        if (hue < 0) {
          hue = hue + 1.0;
        }
      }

      return [ Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100) ];
    },


    /**
     * Convert HSB colors to RGB
     *
     * @param hsb {Number[]} an array with hue, saturation and brightness
     * @return {Integer[]} an array with red, green, blue
     */
    hsbToRgb : function(hsb)
    {
      var i, f, p, r, t;

      var hue = hsb[0] / 360;
      var saturation = hsb[1] / 100;
      var brightness = hsb[2] / 100;

      if (hue >= 1.0) {
        hue %= 1.0;
      }

      if (saturation > 1.0) {
        saturation = 1.0;
      }

      if (brightness > 1.0) {
        brightness = 1.0;
      }

      var tov = Math.floor(255 * brightness);
      var rgb = {};

      if (saturation == 0.0)
      {
        rgb.red = rgb.green = rgb.blue = tov;
      }
      else
      {
        hue *= 6.0;

        i = Math.floor(hue);

        f = hue - i;

        p = Math.floor(tov * (1.0 - saturation));
        r = Math.floor(tov * (1.0 - (saturation * f)));
        t = Math.floor(tov * (1.0 - (saturation * (1.0 - f))));

        switch(i)
        {
          case 0:
            rgb.red = tov;
            rgb.green = t;
            rgb.blue = p;
            break;

          case 1:
            rgb.red = r;
            rgb.green = tov;
            rgb.blue = p;
            break;

          case 2:
            rgb.red = p;
            rgb.green = tov;
            rgb.blue = t;
            break;

          case 3:
            rgb.red = p;
            rgb.green = r;
            rgb.blue = tov;
            break;

          case 4:
            rgb.red = t;
            rgb.green = p;
            rgb.blue = tov;
            break;

          case 5:
            rgb.red = tov;
            rgb.green = p;
            rgb.blue = r;
            break;
        }
      }

      return [rgb.red, rgb.green, rgb.blue];
    },


    /**
     * Creates a random color.
     *
     * @return {String} a valid qooxdoo/CSS rgb color string.
     */
    randomColor : function()
    {
      var r = Math.round(Math.random() * 255);
      var g = Math.round(Math.random() * 255);
      var b = Math.round(Math.random() * 255);

      return this.rgbToRgbString([r, g, b]);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The layout queue manages all widgets, which need a recalculation of their
 * layout. The {@link #flush} method computes the layout of all queued widgets
 * and their dependent widgets.
 */
qx.Class.define("qx.ui.core.queue.Layout",
{
  statics :
  {
    /** @type {Map} This contains all the queued widgets for the next flush. */
    __queue : {},


    /** Nesting level cache **/
    __nesting : {},


    /**
     * Clears the widget from the internal queue. Normally only used
     * during interims disposes of one or a few widgets.
     *
     * @param widget {qx.ui.core.Widget} The widget to clear
     */
    remove : function(widget) {
      delete this.__queue[widget.$$hash];
    },


    /**
     * Mark a widget's layout as invalid and add its layout root to
     * the queue.
     *
     * Should only be used by {@link qx.ui.core.Widget}.
     *
     * @param widget {qx.ui.core.Widget} Widget to add.
     */
    add : function(widget)
    {
      this.__queue[widget.$$hash] = widget;
      qx.ui.core.queue.Manager.scheduleFlush("layout");
    },

    /**
    * Check whether the queue has scheduled changes for a widget.
    * Note that the layout parent can have changes scheduled that
    * affect the children widgets.
    *
    * @param widget {qx.ui.core.Widget} Widget to check.
    * @return {Boolean} Whether the widget given has layout changes queued.
    */
    isScheduled : function(widget) {
      return !!this.__queue[widget.$$hash];
    },

    /**
     * Update the layout of all widgets, which layout is marked as invalid.
     *
     * This is used exclusively by the {@link qx.ui.core.queue.Manager}.
     *
     */
    flush : function()
    {
      // get sorted widgets to (re-)layout
      var queue = this.__getSortedQueue();

      // iterate in reversed order to process widgets with the smallest nesting
      // level first because these may affect the inner lying children
      for (var i=queue.length-1; i>=0; i--)
      {
        var widget = queue[i];

        // continue if a relayout of one of the root's parents has made the
        // layout valid
        if (widget.hasValidLayout()) {
          continue;
        }

        // overflow areas or qx.ui.root.*
        if (widget.isRootWidget() && !widget.hasUserBounds())
        {
          // This is a real root widget. Set its size to its preferred size.
          var hint = widget.getSizeHint();
          widget.renderLayout(0, 0, hint.width, hint.height);
        }
        else
        {
          // This is an inner item of layout changes. Do a relayout of its
          // children without changing its position and size.
          var bounds = widget.getBounds();
          widget.renderLayout(bounds.left, bounds.top, bounds.width, bounds.height);
        }
      }
    },


    /**
     * Get the widget's nesting level. Top level widgets have a nesting level
     * of <code>0</code>.
     *
     * @param widget {qx.ui.core.Widget} The widget to query.
     * @return {Integer} The nesting level
     */
    getNestingLevel : function(widget)
    {
      var cache = this.__nesting;
      var level = 0;
      var parent = widget;

      // Detecting level
      while (true)
      {
        if (cache[parent.$$hash] != null)
        {
          level += cache[parent.$$hash];
          break;
        }

        if (!parent.$$parent) {
          break;
        }

        parent = parent.$$parent;
        level += 1;
      }

      // Update the processed hierarchy (runs from inner to outer)
      var leveldown = level;
      while (widget && widget !== parent)
      {
        cache[widget.$$hash] = leveldown--;
        widget = widget.$$parent;
      }

      return level;
    },


    /**
     * Group widget by their nesting level.
     *
     * @return {Map[]} A sparse array. Each entry of the array contains a widget
     *     map with all widgets of the same level as the array index.
     */
    __getLevelGroupedWidgets : function()
    {
      var VisibilityQueue = qx.ui.core.queue.Visibility;

      // clear cache
      this.__nesting = {};

      // sparse level array
      var levels = [];
      var queue = this.__queue;
      var widget, level;

      for (var hash in queue)
      {
        widget = queue[hash];

        if (VisibilityQueue.isVisible(widget))
        {
          level = this.getNestingLevel(widget);

          // create hierarchy
          if (!levels[level]) {
            levels[level] = {};
          }

          // store widget in level map
          levels[level][hash] = widget;

          // remove widget from layout queue
          delete queue[hash];
        }
      }

      return levels;
    },


    /**
     * Compute all layout roots of the given widgets. Layout roots are either
     * root widgets or widgets, which preferred size has not changed by the
     * layout changes of its children.
     *
     * This function returns the roots ordered by their nesting factors. The
     * layout with the largest nesting level comes first.
     *
     * @return {qx.ui.core.Widget[]} Ordered list or layout roots.
     */
    __getSortedQueue : function()
    {
      var sortedQueue = [];
      var levels = this.__getLevelGroupedWidgets();

      for (var level=levels.length-1; level>=0; level--)
      {
        // Ignore empty levels (levels is an sparse array)
        if (!levels[level]) {
          continue;
        }

        for (var hash in levels[level])
        {
          var widget = levels[level][hash];

          // This is a real layout root. Add it directly to the list
          if (level == 0 || widget.isRootWidget() || widget.hasUserBounds())
          {
            sortedQueue.push(widget);
            widget.invalidateLayoutCache();
            continue;
          }

          // compare old size hint to new size hint
          var oldSizeHint = widget.getSizeHint(false);

          if (oldSizeHint)
          {
            widget.invalidateLayoutCache();
            var newSizeHint = widget.getSizeHint();

            var hintChanged = (
              !widget.getBounds() ||
              oldSizeHint.minWidth !== newSizeHint.minWidth ||
              oldSizeHint.width !== newSizeHint.width ||
              oldSizeHint.maxWidth !== newSizeHint.maxWidth ||
              oldSizeHint.minHeight !== newSizeHint.minHeight ||
              oldSizeHint.height !== newSizeHint.height ||
              oldSizeHint.maxHeight !== newSizeHint.maxHeight
            );
          }
          else
          {
            hintChanged = true;
          }

          if (hintChanged)
          {
            // Since the level is > 0, the widget must
            // have a parent != null.
            var parent = widget.getLayoutParent();
            if (!levels[level-1]) {
              levels[level-1] = {};
            }

            levels[level-1][parent.$$hash] = parent;
          }
          else
          {
            // this is an internal layout root since its own preferred size
            // has not changed.
            sortedQueue.push(widget);
          }
        }
      }

      return sortedQueue;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

   ======================================================================

   This class uses ideas and code snipplets presented at
   http://webreflection.blogspot.com/2008/05/habemus-array-unlocked-length-in-ie8.html
   http://webreflection.blogspot.com/2008/05/stack-and-arrayobject-how-to-create.html

   Author:
     Andrea Giammarchi

   License:
     MIT: http://www.opensource.org/licenses/mit-license.php

   ======================================================================

   This class uses documentation of the native Array methods from the MDC
   documentation of Mozilla.

   License:
     CC Attribution-Sharealike License:
     http://creativecommons.org/licenses/by-sa/2.5/

************************************************************************ */

/**
 * This class is the common superclass for most array classes in
 * qooxdoo. It supports all of the shiny 1.6 JavaScript array features
 * like <code>forEach</code> and <code>map</code>.
 *
 * This class may be instantiated instead of the native Array if
 * one wants to work with a feature-unified Array instead of the native
 * one. This class uses native features whereever possible but fills
 * all missing implementations with custom ones.
 *
 * Through the ability to extend from this class one could add even
 * more utility features on top of it.
 *
 * @require(qx.bom.client.Engine)
 * @require(qx.lang.normalize.Array)
 */
qx.Bootstrap.define("qx.type.BaseArray",
{
  extend : Array,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a new Array with the given length or the listed elements.
   *
   * <pre class="javascript">
   * var arr1 = new qx.type.BaseArray(arrayLength);
   * var arr2 = new qx.type.BaseArray(item0, item1, ..., itemN);
   * </pre>
   *
   * * <code>arrayLength</code>: The initial length of the array. You can access
   * this value using the length property. If the value specified is not a
   * number, an array of length 1 is created, with the first element having
   * the specified value. The maximum length allowed for an
   * array is 2^32-1, i.e. 4,294,967,295.
   * * <code>itemN</code>:  A value for the element in that position in the
   * array. When this form is used, the array is initialized with the specified
   * values as its elements, and the array's length property is set to the
   * number of arguments.
   *
   * @param length_or_items {Integer|var?null} The initial length of the array
   *        OR an argument list of values.
   */
  construct : function(length_or_items) {},


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Converts a base array to a native Array
     *
     * @signature function()
     * @return {Array} The native array
     */
    toArray : null,

    /**
     * Returns the current number of items stored in the Array
     *
     * @signature function()
     * @return {Integer} number of items
     */
    valueOf : null,

    /**
     * Removes the last element from an array and returns that element.
     *
     * This method modifies the array.
     *
     * @signature function()
     * @return {var} The last element of the array.
     */
    pop : null,

    /**
     * Adds one or more elements to the end of an array and returns the new length of the array.
     *
     * This method modifies the array.
     *
     * @signature function(varargs)
     * @param varargs {var} The elements to add to the end of the array.
     * @return {Integer} The new array's length
     */
    push : null,

    /**
     * Reverses the order of the elements of an array -- the first becomes the last, and the last becomes the first.
     *
     * This method modifies the array.
     *
     * @signature function()
     * @return {Array} Returns the modified array (works in place)
     */
    reverse : null,

    /**
     * Removes the first element from an array and returns that element.
     *
     * This method modifies the array.
     *
     * @signature function()
     * @return {var} The first element of the array.
     */
    shift : null,

    /**
     * Sorts the elements of an array.
     *
     * This method modifies the array.
     *
     * @signature function(compareFunction)
     * @param compareFunction {Function?null} Specifies a function that defines the sort order. If omitted,
     *   the array is sorted lexicographically (in dictionary order) according to the string conversion of each element.
     * @return {Array} Returns the modified array (works in place)
     */
    sort : null,

    /**
     * Adds and/or removes elements from an array.
     *
     * @signature function(index, howMany, varargs)
     * @param index {Integer} Index at which to start changing the array. If negative, will begin
     *   that many elements from the end.
     * @param howMany {Integer} An integer indicating the number of old array elements to remove.
     *   If <code>howMany</code> is 0, no elements are removed. In this case, you should specify
     *   at least one new element.
     * @param varargs {var?null} The elements to add to the array. If you don't specify any elements,
     *   splice simply removes elements from the array.
     * @return {BaseArray} New array with the removed elements.
     */
    splice : null,

    /**
     * Adds one or more elements to the front of an array and returns the new length of the array.
     *
     * This method modifies the array.
     *
     * @signature function(varargs)
     * @param varargs {var} The elements to add to the front of the array.
     * @return {Integer} The new array's length
     */
    unshift : null,

    /**
     * Returns a new array comprised of this array joined with other array(s) and/or value(s).
     *
     * This method does not modify the array and returns a modified copy of the original.
     *
     * @signature function(varargs)
     * @param varargs {Array|var} Arrays and/or values to concatenate to the resulting array.
     * @return {qx.type.BaseArray} New array built of the given arrays or values.
     */
    concat : null,

    /**
     * Joins all elements of an array into a string.
     *
     * @signature function(separator)
     * @param separator {String} Specifies a string to separate each element of the array. The separator is
     *   converted to a string if necessary. If omitted, the array elements are separated with a comma.
     * @return {String} The stringified values of all elements divided by the given separator.
     */
    join : null,

    /**
     * Extracts a section of an array and returns a new array.
     *
     * @signature function(begin, end)
     * @param begin {Integer} Zero-based index at which to begin extraction. As a negative index, start indicates
     *   an offset from the end of the sequence. slice(-2) extracts the second-to-last element and the last element
     *   in the sequence.
     * @param end {Integer?length} Zero-based index at which to end extraction. slice extracts up to but not including end.
     *   <code>slice(1,4)</code> extracts the second element through the fourth element (elements indexed 1, 2, and 3).
     *   As a negative index, end indicates an offset from the end of the sequence. slice(2,-1) extracts the third element through the second-to-last element in the sequence.
     *   If end is omitted, slice extracts to the end of the sequence.
     * @return {BaseArray} An new array which contains a copy of the given region.
     */
    slice : null,

    /**
     * Returns a string representing the array and its elements. Overrides the Object.prototype.toString method.
     *
     * @signature function()
     * @return {String} The string representation of the array.
     */
    toString : null,

    /**
     * Returns the first (least) index of an element within the array equal to the specified value, or -1 if none is found.
     *
     * @signature function(searchElement, fromIndex)
     * @param searchElement {var} Element to locate in the array.
     * @param fromIndex {Integer?0} The index at which to begin the search. Defaults to 0, i.e. the
     *   whole array will be searched. If the index is greater than or equal to the length of the
     *   array, -1 is returned, i.e. the array will not be searched. If negative, it is taken as
     *   the offset from the end of the array. Note that even when the index is negative, the array
     *   is still searched from front to back. If the calculated index is less than 0, the whole
     *   array will be searched.
     * @return {Integer} The index of the given element
     */
    indexOf : null,

    /**
     * Returns the last (greatest) index of an element within the array equal to the specified value, or -1 if none is found.
     *
     * @signature function(searchElement, fromIndex)
     * @param searchElement {var} Element to locate in the array.
     * @param fromIndex {Integer?length} The index at which to start searching backwards. Defaults to
     *   the array's length, i.e. the whole array will be searched. If the index is greater than
     *   or equal to the length of the array, the whole array will be searched. If negative, it
     *   is taken as the offset from the end of the array. Note that even when the index is
     *   negative, the array is still searched from back to front. If the calculated index is
     *   less than 0, -1 is returned, i.e. the array will not be searched.
     * @return {Integer} The index of the given element
     */
    lastIndexOf : null,

    /**
     * Executes a provided function once per array element.
     *
     * <code>forEach</code> executes the provided function (<code>callback</code>) once for each
     * element present in the array.  <code>callback</code> is invoked only for indexes of the array
     * which have assigned values; it is not invoked for indexes which have been deleted or which
     * have never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index
     * of the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>forEach</code>, it will be used
     * as the <code>this</code> for each invocation of the <code>callback</code>.  If it is not
     * provided, or is <code>null</code>, the global object associated with <code>callback</code>
     * is used instead.
     *
     * <code>forEach</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>forEach</code> is set before the first invocation of
     * <code>callback</code>.  Elements which are appended to the array after the call to
     * <code>forEach</code> begins will not be visited by <code>callback</code>. If existing elements
     * of the array are changed, or deleted, their value as passed to <code>callback</code> will be
     * the value at the time <code>forEach</code> visits them; elements that are deleted are not visited.
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to execute for each element.
     * @param obj {Object} Object to use as this when executing callback.
     */
    forEach : null,

    /**
     * Creates a new array with all elements that pass the test implemented by the provided
     * function.
     *
     * <code>filter</code> calls a provided <code>callback</code> function once for each
     * element in an array, and constructs a new array of all the values for which
     * <code>callback</code> returns a true value.  <code>callback</code> is invoked only
     * for indexes of the array which have assigned values; it is not invoked for indexes
     * which have been deleted or which have never been assigned values.  Array elements which
     * do not pass the <code>callback</code> test are simply skipped, and are not included
     * in the new array.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the
     * index of the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>filter</code>, it will
     * be used as the <code>this</code> for each invocation of the <code>callback</code>.
     * If it is not provided, or is <code>null</code>, the global object associated with
     * <code>callback</code> is used instead.
     *
     * <code>filter</code> does not mutate the array on which it is called. The range of
     * elements processed by <code>filter</code> is set before the first invocation of
     * <code>callback</code>. Elements which are appended to the array after the call to
     * <code>filter</code> begins will not be visited by <code>callback</code>. If existing
     * elements of the array are changed, or deleted, their value as passed to <code>callback</code>
     * will be the value at the time <code>filter</code> visits them; elements that are deleted
     * are not visited.
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to test each element of the array.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {BaseArray} The newly created array with all matching elements
     */
    filter : null,

    /**
     * Creates a new array with the results of calling a provided function on every element in this array.
     *
     * <code>map</code> calls a provided <code>callback</code> function once for each element in an array,
     * in order, and constructs a new array from the results.  <code>callback</code> is invoked only for
     * indexes of the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of the
     * element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>map</code>, it will be used as the
     * <code>this</code> for each invocation of the <code>callback</code>. If it is not provided, or is
     * <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>map</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>map</code> is set before the first invocation of
     * <code>callback</code>. Elements which are appended to the array after the call to <code>map</code>
     * begins will not be visited by <code>callback</code>.  If existing elements of the array are changed,
     * or deleted, their value as passed to <code>callback</code> will be the value at the time
     * <code>map</code> visits them; elements that are deleted are not visited.
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function produce an element of the new Array from an element of the current one.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {BaseArray} A new array which contains the return values of every item executed through the given function
     */
    map : null,

    /**
     * Tests whether some element in the array passes the test implemented by the provided function.
     *
     * <code>some</code> executes the <code>callback</code> function once for each element present in
     * the array until it finds one where <code>callback</code> returns a true value. If such an element
     * is found, <code>some</code> immediately returns <code>true</code>. Otherwise, <code>some</code>
     * returns <code>false</code>. <code>callback</code> is invoked only for indexes of the array which
     * have assigned values; it is not invoked for indexes which have been deleted or which have never
     * been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of the
     * element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>some</code>, it will be used as the
     * <code>this</code> for each invocation of the <code>callback</code>. If it is not provided, or is
     * <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>some</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>some</code> is set before the first invocation of
     * <code>callback</code>.  Elements that are appended to the array after the call to <code>some</code>
     * begins will not be visited by <code>callback</code>. If an existing, unvisited element of the array
     * is changed by <code>callback</code>, its value passed to the visiting <code>callback</code> will
     * be the value at the time that <code>some</code> visits that element's index; elements that are
     * deleted are not visited.
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to test for each element.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Boolean} Whether at least one elements passed the test
     */
    some : null,

    /**
     * Tests whether all elements in the array pass the test implemented by the provided function.
     *
     * <code>every</code> executes the provided <code>callback</code> function once for each element
     * present in the array until it finds one where <code>callback</code> returns a false value. If
     * such an element is found, the <code>every</code> method immediately returns <code>false</code>.
     * Otherwise, if <code>callback</code> returned a true value for all elements, <code>every</code>
     * will return <code>true</code>.  <code>callback</code> is invoked only for indexes of the array
     * which have assigned values; it is not invoked for indexes which have been deleted or which have
     * never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of
     * the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>every</code>, it will be used as
     * the <code>this</code> for each invocation of the <code>callback</code>. If it is not provided,
     * or is <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>every</code> does not mutate the array on which it is called. The range of elements processed
     * by <code>every</code> is set before the first invocation of <code>callback</code>. Elements which
     * are appended to the array after the call to <code>every</code> begins will not be visited by
     * <code>callback</code>.  If existing elements of the array are changed, their value as passed
     * to <code>callback</code> will be the value at the time <code>every</code> visits them; elements
     * that are deleted are not visited.
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to test for each element.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Boolean} Whether all elements passed the test
     */
    every : null
  }
});

(function() {

function createStackConstructor(stack)
{
  // In IE don't inherit from Array but use an empty object as prototype
  // and copy the methods from Array
  if ((qx.core.Environment.get("engine.name") == "mshtml"))
  {
    Stack.prototype = {
      length : 0,
      $$isArray : true
    };

    var args = "pop.push.reverse.shift.sort.splice.unshift.join.slice".split(".");

    for (var length = args.length; length;) {
      Stack.prototype[args[--length]] = Array.prototype[args[length]];
    }
  };

  // Remember Array's slice method
  var slice = Array.prototype.slice;

  // Fix "concat" method
  Stack.prototype.concat = function()
  {
    var constructor = this.slice(0);

    for (var i=0, length=arguments.length; i<length; i++)
    {
      var copy;

      if (arguments[i] instanceof Stack) {
        copy = slice.call(arguments[i], 0);
      } else if (arguments[i] instanceof Array) {
        copy = arguments[i];
      } else {
        copy = [arguments[i]];
      }

      constructor.push.apply(constructor, copy);
    }

    return constructor;
  };

  // Fix "toString" method
  Stack.prototype.toString = function(){
    return slice.call(this, 0).toString();
  };

  // Fix "toLocaleString"
  Stack.prototype.toLocaleString = function() {
    return slice.call(this, 0).toLocaleString();
  };

  // Fix constructor
  Stack.prototype.constructor = Stack;


  // Add JS 1.6 Array features
  Stack.prototype.indexOf = Array.prototype.indexOf;
  Stack.prototype.lastIndexOf = Array.prototype.lastIndexOf;
  Stack.prototype.forEach = Array.prototype.forEach;
  Stack.prototype.some = Array.prototype.some;
  Stack.prototype.every = Array.prototype.every;

  var filter = Array.prototype.filter;
  var map = Array.prototype.map;


  // Fix methods which generates a new instance
  // to return an instance of the same class
  Stack.prototype.filter = function()
  {
    var ret = new this.constructor;
    ret.push.apply(ret, filter.apply(this, arguments));
    return ret;
  };

  Stack.prototype.map = function()
  {
    var ret = new this.constructor;
    ret.push.apply(ret, map.apply(this, arguments));
    return ret;
  };

  Stack.prototype.slice = function()
  {
    var ret = new this.constructor;
    ret.push.apply(ret, Array.prototype.slice.apply(this, arguments));
    return ret;
  };

  Stack.prototype.splice = function()
  {
    var ret = new this.constructor;
    ret.push.apply(ret, Array.prototype.splice.apply(this, arguments));
    return ret;
  };

  // Add new "toArray" method for convert a base array to a native Array
  Stack.prototype.toArray = function() {
    return Array.prototype.slice.call(this, 0);
  };

  // Add valueOf() to return the length
  Stack.prototype.valueOf = function(){
    return this.length;
  };

  // Return final class
  return Stack;
}


function Stack(length)
{
  if(arguments.length === 1 && typeof length === "number") {
    this.length = -1 < length && length === length >> .5 ? length : this.push(length);
  } else if(arguments.length) {
    this.push.apply(this, arguments);
  }
};

function PseudoArray(){};
PseudoArray.prototype = [];
Stack.prototype = new PseudoArray;
Stack.prototype.length = 0;

qx.type.BaseArray = createStackConstructor(Stack);

})();
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * The Core module's responsibility is to query the DOM for elements and offer
 * these elements as a collection. The Core module itself does not offer any methods to
 * work with the collection. These methods are added by the other included modules,
 * such as Manipulating or Attributes.
 *
 * Core also provides the plugin API which allows modules to attach either
 * static functions to the global <code>q</code> object or define methods on the
 * collection it returns.
 *
 * By default, the core module is assigned to a global module named <code>q</code>.
 * In case <code>q</code> is already defined, the name <code>qxWeb</code>
 * is used instead.
 *
 * For further details, take a look at the documentation in the
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/website.html' target='_blank'>user manual</a>.
 *
 * @ignore(q)
 *
 * @group (Core)
 */
qx.Bootstrap.define("qxWeb", {
  extend : qx.type.BaseArray,
  statics : {
    // internal storage for all initializers
    __init : [],

    // internal reference to the used qx namespace
    $$qx : qx,

    /**
     * Internal helper to initialize collections.
     *
     * @param arg {var} An array of Elements which will
     *   be initialized as {@link q}. All items in the array which are not
     *   either a window object, a DOM element node or a DOM document node will
     *   be ignored.
     * @param clazz {Class} The class of the new collection.
     * @return {q} A new initialized collection.
     */
    $init : function(arg, clazz) {
      var clean = [];
      for (var i = 0; i < arg.length; i++) {
        // check for node or window object
        var isNode = !!(arg[i] && (arg[i].nodeType === 1 || arg[i].nodeType === 9));
        if (isNode) {
          clean.push(arg[i]);
          continue;
        }
        var isWindow = !!(arg[i] && arg[i].history && arg[i].location && arg[i].document);
        if (isWindow) {
          clean.push(arg[i]);
        }
      }

      if (arg[0] && arg[0].getAttribute && arg[0].getAttribute("data-qx-class")) {
        clazz = qx.Bootstrap.getByName(arg[0].getAttribute("data-qx-class")) || clazz;
      }

      var col = qx.lang.Array.cast(clean, clazz);
      for (var i=0; i < qxWeb.__init.length; i++) {
        qxWeb.__init[i].call(col);
      }

      return col;
    },


    /**
     * This is an API for module development and can be used to attach new methods
     * to {@link q}.
     *
     * @param module {Map} A map containing the methods to attach.
     */
    $attach : function(module) {
      for (var name in module) {
        if (qx.core.Environment.get("qx.debug")) {
          if (qxWeb.prototype[name] != undefined && Array.prototype[name] == undefined) {
            throw new Error("Method '" + name + "' already available.");
          }
        }
        qxWeb.prototype[name] = module[name];
      }
    },


    /**
     * This is an API for module development and can be used to attach new methods
     * to {@link q}.
     *
     * @param module {Map} A map containing the methods to attach.
     */
    $attachStatic : function(module) {
      for (var name in module) {
        if (qx.core.Environment.get("qx.debug")) {
          if (qxWeb[name] != undefined) {
            throw new Error("Method '" + name + "' already available as static method.");
          }
        }
        qxWeb[name] = module[name];
      }
    },


    /**
     * This is an API for module development and can be used to attach new initialization
     * methods to {@link q} which will be called when a new collection is
     * created.
     *
     * @param init {Function} The initialization method for a module.
     */
    $attachInit : function(init) {
      this.__init.push(init);
    },


    /**
     * Define a new class using the qooxdoo class system.
     *
     * @param name {String?} Name of the class. If null, the class will not be
     *   attached to a namespace.
     * @param config {Map ? null} Class definition structure. The configuration map has the following keys:
     *     <table>
     *       <thead>
     *         <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *       </thead>
     *       <tr><td>extend</td><td>Class</td><td>The super class the current class inherits from.</td></tr>
     *       <tr><td>construct</td><td>Function</td><td>The constructor of the class.</td></tr>
     *       <tr><td>statics</td><td>Map</td><td>Map of static values / functions of the class.</td></tr>
     *       <tr><td>members</td><td>Map</td><td>Map of instance members of the class.</td></tr>
     *       <tr><td>defer</td><td>Function</td><td>Function that is called at the end of
     *          processing the class declaration.</td></tr>
     *     </table>
     * @return {Function} The defined class.
     */
    define : function(name, config) {
      if (config == undefined) {
        config = name;
        name = null;
      }
      return qx.Bootstrap.define.call(qx.Bootstrap, name, config);
    }
  },


  /**
   * Primary usage:
   * Accepts a selector string and returns a collection of found items. The optional context
   * element can be used to reduce the amount of found elements to children of the
   * context element. If the context object is a collection, its first item is used.
   *
   * Secondary usage:
   * Creates a collection from an existing DOM element, document node or window object
   * (or an Array containing any such objects)
   *
   * <a href="http://sizzlejs.com/" target="_blank">Sizzle</a> is used as selector engine.
   * Check out the <a href="https://github.com/jquery/sizzle/wiki/Sizzle-Home" target="_blank">documentation</a>
   * for more details.
   *
   * @param selector {String|Element|Document|Window|Array} Valid selector (CSS3 + extensions),
   *   window object, DOM element/document or Array of DOM Elements.
   * @param context {Element|q} Only the children of this element are considered.
   * @return {q} A collection of DOM elements.
   */
  construct : function(selector, context) {
    if (!selector && this instanceof qxWeb) {
      return this;
    }

    if (qx.Bootstrap.isString(selector)) {
      if (context instanceof qxWeb) {
        context = context[0];
      }
      selector = qx.bom.Selector.query(selector, context);
    } else if (!(qx.Bootstrap.isArray(selector))) {
      selector = [selector];
    }
    return qxWeb.$init(selector, qxWeb);
  },


  members : {
    /**
     * Gets a new collection containing only those elements that passed the
     * given filter. This can be either a selector expression or a filter
     * function.
     *
     * @param selector {String|Function} Selector expression or filter function
     * @return {q} New collection containing the elements that passed the filter
     */
    filter : function(selector) {
      if (qx.lang.Type.isFunction(selector)) {
        return qxWeb.$init(Array.prototype.filter.call(this, selector), this.constructor);
      }
      return qxWeb.$init(qx.bom.Selector.matches(selector, this), this.constructor);
    },


    /**
     * Recreates a collection which is free of all duplicate elements from the original.
     *
     * @return {q} Returns a copy with no duplicates
     */
    unique : function() {
      var unique = qx.lang.Array.unique(this);
      return qxWeb.$init(unique, this.constructor);
    },


    /**
     * Returns a copy of the collection within the given range.
     *
     * @param begin {Number} The index to begin.
     * @param end {Number?} The index to end.
     * @return {q} A new collection containing a slice of the original collection.
     */
    slice : function(begin, end) {
      // Old IEs return an empty array if the second argument is undefined
      // check 'end' explicit for "undefined" [BUG #7322]
      if (end !== undefined) {
        return qxWeb.$init(Array.prototype.slice.call(this, begin, end), this.constructor);
      }
      return qxWeb.$init(Array.prototype.slice.call(this, begin), this.constructor);
    },


    /**
     * Removes the given number of items and returns the removed items as a new collection.
     * This method can also add items. Take a look at the
     * <a href='https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/splice' target='_blank'>documentation of MDN</a> for more details.
     *
     * @param index {Number} The index to begin.
     * @param howMany {Number} the amount of items to remove.
     * @param varargs {var} As many items as you want to add.
     * @return {q} A new collection containing the removed items.
     */
    splice : function(index , howMany, varargs) {
      return qxWeb.$init(Array.prototype.splice.apply(this, arguments), this.constructor);
    },


    /**
     * Returns a new collection containing the modified elements. For more details, check out the
     * <a href='https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map' target='_blank'>MDN documentation</a>.
     *
     * @param callback {Function} Function which produces the new element.
     * @param thisarg {var} Context of the callback.
     * @return {q} New collection containing the elements that passed the filter
     */
    map : function(callback, thisarg) {
      return qxWeb.$init(Array.prototype.map.apply(this, arguments), this.constructor);
    },


    /**
     * Returns a copy of the collection including the given elements.
     *
     * @param varargs {var} As many items as you want to add.
     * @return {q} A new collection containing all items.
     */
    concat : function(varargs) {
      var clone = Array.prototype.slice.call(this, 0);
      for (var i=0; i < arguments.length; i++) {
        if (arguments[i] instanceof qxWeb) {
          clone = clone.concat(Array.prototype.slice.call(arguments[i], 0));
        } else {
          clone.push(arguments[i]);
        }
      }
      return qxWeb.$init(clone, this.constructor);
    },


    /**
     * Returns the index of the given element within the current
     * collection or -1 if the element is not in the collection
     * @param elem {Element|Element[]|qxWeb} Element or collection of elements
     * @return {Number} The element's index
     */
    indexOf : function(elem) {
      if (!elem) {
        return -1;
      }

      if (qx.Bootstrap.isArray(elem)) {
        elem = elem[0];
      }

      for (var i=0, l=this.length; i<l; i++) {
        if (this[i] === elem) {
          return i;
        }
      }

      return -1;
    },


    /**
     * Calls the browser's native debugger to easily allow debugging within
     * chained calls.
     *
     * @return {q} The collection for chaining
     * @ignore(debugger)
     */
    debug : function() {
      debugger;
      return this;
    },


    /**
     * Calls a function for each DOM element node in the collection. This is used
     * for DOM manipulations which can't be applied to document nodes or window
     * objects.
     *
     * @param func {Function} Callback function. Will be called with three arguments:
     * The element, the element's index within the collection and the collection itself.
     * @param ctx {Object} The context for the callback function (default: The collection)
     * @return {q} The collection for chaining
     */
    _forEachElement : function(func, ctx) {
      for (var i=0, l=this.length; i<l; i++) {
        if (this[i] && this[i].nodeType === 1) {
          func.apply(ctx || this, [this[i], i, this]);
        }
      }
      return this;
    },


    /**
     * Calls a function for each DOM element node in the collection. Each node is wrapped
     * in a collection before the function is called.
     *
     * @param func {Function} Callback function. Will be called with three arguments:
     * The element wrappend in a collection, the element's index within the collection and
     * the collection itself.
     * @param ctx {Object} The context for the callback function (default: The collection)
     * @return {q} The collection for chaining
     */
    _forEachElementWrapped : function(func, ctx) {
      this._forEachElement(function(item, idx, arr) {
        func.apply(this, [qxWeb(item), idx, arr]);
      }, ctx);
      return this;
    }
  },

  /**
   * @ignore(q)
   */
  defer : function(statics) {
    if (window.q == undefined) {
      q = statics;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008-2010 Sebastian Werner, http://sebastian-werner.net

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Andreas Ecker (ecker)

   ======================================================================

   This class contains code based on the following work:

   * Sizzle CSS Selector Engine - v1.8.2

     Homepage:
       http://sizzlejs.com/

     Documentation:
       http://wiki.github.com/jeresig/sizzle

     Discussion:
       http://groups.google.com/group/sizzlejs

     Code:
       http://github.com/jeresig/sizzle/tree

     Copyright:
       (c) 2009, The Dojo Foundation

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

   ----------------------------------------------------------------------

     Copyright (c) 2009 John Resig

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation files
     (the "Software"), to deal in the Software without restriction,
     including without limitation the rights to use, copy, modify, merge,
     publish, distribute, sublicense, and/or sell copies of the Software,
     and to permit persons to whom the Software is furnished to do so,
     subject to the following conditions:

     The above copyright notice and this permission notice shall be
     included in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.

   ----------------------------------------------------------------------

     Version:
       Snapshot taken on 2012-10-02, latest Sizzle commit on 2012-09-20:
       commit  41a7c2ce9be6c66e0c9b8b15e0a29c8e3ca6fb31

************************************************************************ */

/**
 * The selector engine supports virtually all CSS 3 Selectors  – this even
 * includes some parts that are infrequently implemented such as escaped
 * selectors (<code>.foo\\+bar</code>), Unicode selectors, and results returned
 * in document order. There are a few notable exceptions to the CSS 3 selector
 * support:
 *
 * * <code>:root</code>
 * * <code>:target</code>
 * * <code>:nth-last-child</code>
 * * <code>:nth-of-type</code>
 * * <code>:nth-last-of-type</code>
 * * <code>:first-of-type</code>
 * * <code>:last-of-type</code>
 * * <code>:only-of-type</code>
 * * <code>:lang()</code>
 *
 * In addition to the CSS 3 Selectors the engine supports the following
 * additional selectors or conventions.
 *
 * *Changes*
 *
 * * <code>:not(a.b)</code>: Supports non-simple selectors in <code>:not()</code> (most browsers only support <code>:not(a)</code>, for example).
 * * <code>:not(div > p)</code>: Supports full selectors in <code>:not()</code>.
 * * <code>:not(div, p)</code>: Supports multiple selectors in <code>:not()</code>.
 * * <code>[NAME=VALUE]</code>: Doesn't require quotes around the specified value in an attribute selector.
 *
 * *Additions*
 *
 * * <code>[NAME!=VALUE]</code>: Finds all elements whose <code>NAME</code> attribute doesn't match the specified value. Is equivalent to doing <code>:not([NAME=VALUE])</code>.
 * * <code>:contains(TEXT)</code>: Finds all elements whose textual context contains the word <code>TEXT</code> (case sensitive).
 * * <code>:header</code>: Finds all elements that are a header element (h1, h2, h3, h4, h5, h6).
 * * <code>:parent</code>: Finds all elements that contains another element.
 *
 * *Positional Selector Additions*
 *
 * * <code>:first</code>/</code>:last</code>: Finds the first or last matching element on the page. (e.g. <code>div:first</code> would find the first div on the page, in document order)
 * * <code>:even</code>/<code>:odd</code>: Finds every other element on the page (counting begins at 0, so <code>:even</code> would match the first element).
 * * <code>:eq</code>/<code>:nth</code>: Finds the Nth element on the page (e.g. <code>:eq(5)</code> finds the 6th element on the page).
 * * <code>:lt</code>/<code>:gt</code>: Finds all elements at positions less than or greater than the specified positions.
 *
 * *Form Selector Additions*
 *
 * * <code>:input</code>: Finds all input elements (includes textareas, selects, and buttons).
 * * <code>:text</code>, <code>:checkbox</code>, <code>:file</code>, <code>:password</code>, <code>:submit</code>, <code>:image</code>, <code>:reset</code>, <code>:button</code>: Finds the input element with the specified input type (<code>:button</code> also finds button elements).
 *
 * Based on Sizzle by John Resig, see:
 *
 * * http://sizzlejs.com/
 *
 * For further usage details also have a look at the wiki page at:
 *
 * * https://github.com/jquery/sizzle/wiki/Sizzle-Home
 */
qx.Bootstrap.define("qx.bom.Selector",
{
  statics :
  {
    /**
     * Queries the document for the given selector. Supports all CSS3 selectors
     * plus some extensions as mentioned in the class description.
     *
     * @signature function(selector, context)
     * @param selector {String} Valid selector (CSS3 + extensions)
     * @param context {Element} Context element (result elements must be children of this element)
     * @return {Array} Matching elements
     */
    query : null,

    /**
     * Returns an reduced array which only contains the elements from the given
     * array which matches the given selector
     *
     * @signature function(selector, set)
     * @param selector {String} Selector to filter given set
     * @param set {Array} List to filter according to given selector
     * @return {Array} New array containing matching elements
     */
    matches : null
  }
});


/**
 * Below is the original Sizzle code. Snapshot date is mentioned in the head of
 * this file.
 * @lint ignoreUnused(j, rnot, rendsWithNot)
 */

/*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var cachedruns,
  assertGetIdNotName,
  Expr,
  getText,
  isXML,
  contains,
  compile,
  sortOrder,
  hasDuplicate,
  outermostContext,

  baseHasDuplicate = true,
  strundefined = "undefined",

  expando = ( "sizcache" + Math.random() ).replace( ".", "" ),

  Token = String,
  document = window.document,
  docElem = document.documentElement,
  dirruns = 0,
  done = 0,
  pop = [].pop,
  push = [].push,
  slice = [].slice,
  // Use a stripped-down indexOf if a native one is unavailable
  indexOf = [].indexOf || function( elem ) {
    var i = 0,
      len = this.length;
    for ( ; i < len; i++ ) {
      if ( this[i] === elem ) {
        return i;
      }
    }
    return -1;
  },

  // Augment a function for special use by Sizzle
  markFunction = function( fn, value ) {
    fn[ expando ] = value == null || value;
    return fn;
  },

  createCache = function() {
    var cache = {},
      keys = [];

    return markFunction(function( key, value ) {
      // Only keep the most recent entries
      if ( keys.push( key ) > Expr.cacheLength ) {
        delete cache[ keys.shift() ];
      }

      return (cache[ key ] = value);
    }, cache );
  },

  classCache = createCache(),
  tokenCache = createCache(),
  compilerCache = createCache(),

  // Regex

  // Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
  whitespace = "[\\x20\\t\\r\\n\\f]",
  // http://www.w3.org/TR/css3-syntax/#characters
  characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",

  // Loosely modeled on CSS identifier characters
  // An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
  // Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
  identifier = characterEncoding.replace( "w", "w#" ),

  // Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
  operators = "([*^$|!~]?=)",
  attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
    "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

  // Prefer arguments not in parens/brackets,
  //   then attribute selectors and non-pseudos (denoted by :),
  //   then anything else
  // These preferences are here to reduce the number of selectors
  //   needing tokenize in the PSEUDO preFilter
  pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",

  // For matchExpr.POS and matchExpr.needsContext
  pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
    "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)",

  // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
  rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

  rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
  rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
  rpseudo = new RegExp( pseudos ),

  // Easily-parseable/retrievable ID or TAG or CLASS selectors
  rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,

  rnot = /^:not/,
  rsibling = /[\x20\t\r\n\f]*[+~]/,
  rendsWithNot = /:not\($/,

  rheader = /h\d/i,
  rinputs = /input|select|textarea|button/i,

  rbackslash = /\\(?!\\)/g,

  matchExpr = {
    "ID": new RegExp( "^#(" + characterEncoding + ")" ),
    "CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
    "NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
    "TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
    "ATTR": new RegExp( "^" + attributes ),
    "PSEUDO": new RegExp( "^" + pseudos ),
    "POS": new RegExp( pos, "i" ),
    "CHILD": new RegExp( "^:(only|nth|first|last)-child(?:\\(" + whitespace +
      "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
      "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
    // For use in libraries implementing .is()
    "needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
  },

  // Support

  // Used for testing something on an element
  assert = function( fn ) {
    var div = document.createElement("div");

    try {
      return fn( div );
    } catch (e) {
      return false;
    } finally {
      // release memory in IE
      div = null;
    }
  },

  // Check if getElementsByTagName("*") returns only elements
  assertTagNameNoComments = assert(function( div ) {
    div.appendChild( document.createComment("") );
    return !div.getElementsByTagName("*").length;
  }),

  // Check if getAttribute returns normalized href attributes
  assertHrefNotNormalized = assert(function( div ) {
    div.innerHTML = "<a href='#'></a>";
    return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
      div.firstChild.getAttribute("href") === "#";
  }),

  // Check if attributes should be retrieved by attribute nodes
  assertAttributes = assert(function( div ) {
    div.innerHTML = "<select></select>";
    var type = typeof div.lastChild.getAttribute("multiple");
    // IE8 returns a string for some attributes even when not present
    return type !== "boolean" && type !== "string";
  }),

  // Check if getElementsByClassName can be trusted
  assertUsableClassName = assert(function( div ) {
    // Opera can't find a second classname (in 9.6)
    div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
    if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
      return false;
    }

    // Safari 3.2 caches class attributes and doesn't catch changes
    div.lastChild.className = "e";
    return div.getElementsByClassName("e").length === 2;
  }),

  // Check if getElementById returns elements by name
  // Check if getElementsByName privileges form controls or returns elements by ID
  assertUsableName = assert(function( div ) {
    // Inject content
    div.id = expando + 0;
    div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
    docElem.insertBefore( div, docElem.firstChild );

    // Test
    var pass = document.getElementsByName &&
      // buggy browsers will return fewer than the correct 2
      document.getElementsByName( expando ).length === 2 +
      // buggy browsers will return more than the correct 0
      document.getElementsByName( expando + 0 ).length;
    assertGetIdNotName = !document.getElementById( expando );

    // Cleanup
    docElem.removeChild( div );

    return pass;
  });

// If slice is not available, provide a backup
try {
  slice.call( docElem.childNodes, 0 )[0].nodeType;
} catch ( e ) {
  slice = function( i ) {
    var elem,
      results = [];
    for ( ; (elem = this[i]); i++ ) {
      results.push( elem );
    }
    return results;
  };
}

function Sizzle( selector, context, results, seed ) {
  results = results || [];
  context = context || document;
  var match, elem, xml, m,
    nodeType = context.nodeType;

  if ( !selector || typeof selector !== "string" ) {
    return results;
  }

  if ( nodeType !== 1 && nodeType !== 9 ) {
    return [];
  }

  xml = isXML( context );

  if ( !xml && !seed ) {
    if ( (match = rquickExpr.exec( selector )) ) {
      // Speed-up: Sizzle("#ID")
      if ( (m = match[1]) ) {
        if ( nodeType === 9 ) {
          elem = context.getElementById( m );
          // Check parentNode to catch when Blackberry 4.6 returns
          // nodes that are no longer in the document #6963
          if ( elem && elem.parentNode ) {
            // Handle the case where IE, Opera, and Webkit return items
            // by name instead of ID
            if ( elem.id === m ) {
              results.push( elem );
              return results;
            }
          } else {
            return results;
          }
        } else {
          // Context is not a document
          if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
            contains( context, elem ) && elem.id === m ) {
            results.push( elem );
            return results;
          }
        }

      // Speed-up: Sizzle("TAG")
      } else if ( match[2] ) {
        push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
        return results;

      // Speed-up: Sizzle(".CLASS")
      } else if ( (m = match[3]) && assertUsableClassName && context.getElementsByClassName ) {
        push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
        return results;
      }
    }
  }

  // All others
  return select( selector.replace( rtrim, "$1" ), context, results, seed, xml );
}

Sizzle.matches = function( expr, elements ) {
  return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
  return Sizzle( expr, null, null, [ elem ] ).length > 0;
};

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
  return function( elem ) {
    var name = elem.nodeName.toLowerCase();
    return name === "input" && elem.type === type;
  };
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
  return function( elem ) {
    var name = elem.nodeName.toLowerCase();
    return (name === "input" || name === "button") && elem.type === type;
  };
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
  return markFunction(function( argument ) {
    argument = +argument;
    return markFunction(function( seed, matches ) {
      var j,
        matchIndexes = fn( [], seed.length, argument ),
        i = matchIndexes.length;

      // Match elements found at the specified indexes
      while ( i-- ) {
        if ( seed[ (j = matchIndexes[i]) ] ) {
          seed[j] = !(matches[j] = seed[j]);
        }
      }
    });
  });
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param elem {Array|Element}
 */
getText = Sizzle.getText = function( elem ) {
  var node,
    ret = "",
    i = 0,
    nodeType = elem.nodeType;

  if ( nodeType ) {
    if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
      // Use textContent for elements
      // innerText usage removed for consistency of new lines (see #11153)
      if ( typeof elem.textContent === "string" ) {
        return elem.textContent;
      } else {
        // Traverse its children
        for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
          ret += getText( elem );
        }
      }
    } else if ( nodeType === 3 || nodeType === 4 ) {
      return elem.nodeValue;
    }
    // Do not include comment or processing instruction nodes
  } else {

    // If no nodeType, this is expected to be an array
    for ( ; (node = elem[i]); i++ ) {
      // Do not traverse comment nodes
      ret += getText( node );
    }
  }
  return ret;
};

isXML = Sizzle.isXML = function( elem ) {
  // documentElement is verified for cases where it doesn't yet exist
  // (such as loading iframes in IE - #4833)
  var documentElement = elem && (elem.ownerDocument || elem).documentElement;
  return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Element contains another
contains = Sizzle.contains = docElem.contains ?
  function( a, b ) {
    var adown = a.nodeType === 9 ? a.documentElement : a,
      bup = b && b.parentNode;
    return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
  } :
  docElem.compareDocumentPosition ?
  function( a, b ) {
    return b && !!( a.compareDocumentPosition( b ) & 16 );
  } :
  function( a, b ) {
    while ( (b = b.parentNode) ) {
      if ( b === a ) {
        return true;
      }
    }
    return false;
  };

Sizzle.attr = function( elem, name ) {
  var val,
    xml = isXML( elem );

  if ( !xml ) {
    name = name.toLowerCase();
  }
  if ( (val = Expr.attrHandle[ name ]) ) {
    return val( elem );
  }
  if ( xml || assertAttributes ) {
    return elem.getAttribute( name );
  }
  val = elem.getAttributeNode( name );
  return val ?
    typeof elem[ name ] === "boolean" ?
      elem[ name ] ? name : null :
      val.specified ? val.value : null :
    null;
};

Expr = Sizzle.selectors = {

  // Can be adjusted by the user
  cacheLength: 50,

  createPseudo: markFunction,

  match: matchExpr,

  // IE6/7 return a modified href
  attrHandle: assertHrefNotNormalized ?
    {} :
    {
      "href": function( elem ) {
        return elem.getAttribute( "href", 2 );
      },
      "type": function( elem ) {
        return elem.getAttribute("type");
      }
    },

  find: {
    "ID": assertGetIdNotName ?
      function( id, context, xml ) {
        if ( typeof context.getElementById !== strundefined && !xml ) {
          var m = context.getElementById( id );
          // Check parentNode to catch when Blackberry 4.6 returns
          // nodes that are no longer in the document #6963
          return m && m.parentNode ? [m] : [];
        }
      } :
      function( id, context, xml ) {
        if ( typeof context.getElementById !== strundefined && !xml ) {
          var m = context.getElementById( id );

          return m ?
            m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
              [m] :
              undefined :
            [];
        }
      },

    "TAG": assertTagNameNoComments ?
      function( tag, context ) {
        if ( typeof context.getElementsByTagName !== strundefined ) {
          return context.getElementsByTagName( tag );
        }
      } :
      function( tag, context ) {
        var results = context.getElementsByTagName( tag );

        // Filter out possible comments
        if ( tag === "*" ) {
          var elem,
            tmp = [],
            i = 0;

          for ( ; (elem = results[i]); i++ ) {
            if ( elem.nodeType === 1 ) {
              tmp.push( elem );
            }
          }

          return tmp;
        }
        return results;
      },

    "NAME": assertUsableName && function( tag, context ) {
      if ( typeof context.getElementsByName !== strundefined ) {
        return context.getElementsByName( name );
      }
    },

    "CLASS": assertUsableClassName && function( className, context, xml ) {
      if ( typeof context.getElementsByClassName !== strundefined && !xml ) {
        return context.getElementsByClassName( className );
      }
    }
  },

  relative: {
    ">": { dir: "parentNode", first: true },
    " ": { dir: "parentNode" },
    "+": { dir: "previousSibling", first: true },
    "~": { dir: "previousSibling" }
  },

  preFilter: {
    "ATTR": function( match ) {
      match[1] = match[1].replace( rbackslash, "" );

      // Move the given value to match[3] whether quoted or unquoted
      match[3] = ( match[4] || match[5] || "" ).replace( rbackslash, "" );

      if ( match[2] === "~=" ) {
        match[3] = " " + match[3] + " ";
      }

      return match.slice( 0, 4 );
    },

    "CHILD": function( match ) {
      /* matches from matchExpr["CHILD"]
        1 type (only|nth|...)
        2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
        3 xn-component of xn+y argument ([+-]?\d*n|)
        4 sign of xn-component
        5 x of xn-component
        6 sign of y-component
        7 y of y-component
      */
      match[1] = match[1].toLowerCase();

      if ( match[1] === "nth" ) {
        // nth-child requires argument
        if ( !match[2] ) {
          Sizzle.error( match[0] );
        }

        // numeric x and y parameters for Expr.filter.CHILD
        // remember that false/true cast respectively to 0/1
        match[3] = +( match[3] ? match[4] + (match[5] || 1) : 2 * ( match[2] === "even" || match[2] === "odd" ) );
        match[4] = +( ( match[6] + match[7] ) || match[2] === "odd" );

      // other types prohibit arguments
      } else if ( match[2] ) {
        Sizzle.error( match[0] );
      }

      return match;
    },

    "PSEUDO": function( match ) {
      var unquoted, excess;
      if ( matchExpr["CHILD"].test( match[0] ) ) {
        return null;
      }

      if ( match[3] ) {
        match[2] = match[3];
      } else if ( (unquoted = match[4]) ) {
        // Only check arguments that contain a pseudo
        if ( rpseudo.test(unquoted) &&
          // Get excess from tokenize (recursively)
          (excess = tokenize( unquoted, true )) &&
          // advance to the next closing parenthesis
          (excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

          // excess is a negative index
          unquoted = unquoted.slice( 0, excess );
          match[0] = match[0].slice( 0, excess );
        }
        match[2] = unquoted;
      }

      // Return only captures needed by the pseudo filter method (type and argument)
      return match.slice( 0, 3 );
    }
  },

  filter: {
    "ID": assertGetIdNotName ?
      function( id ) {
        id = id.replace( rbackslash, "" );
        return function( elem ) {
          return elem.getAttribute("id") === id;
        };
      } :
      function( id ) {
        id = id.replace( rbackslash, "" );
        return function( elem ) {
          var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
          return node && node.value === id;
        };
      },

    "TAG": function( nodeName ) {
      if ( nodeName === "*" ) {
        return function() { return true; };
      }
      nodeName = nodeName.replace( rbackslash, "" ).toLowerCase();

      return function( elem ) {
        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
      };
    },

    "CLASS": function( className ) {
      var pattern = classCache[ expando ][ className ];
      if ( !pattern ) {
        pattern = classCache( className, new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)") );
      }
      return function( elem ) {
        return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
      };
    },

    "ATTR": function( name, operator, check ) {
      return function( elem, context ) {
        var result = Sizzle.attr( elem, name );

        if ( result == null ) {
          return operator === "!=";
        }
        if ( !operator ) {
          return true;
        }

        result += "";

        return operator === "=" ? result === check :
          operator === "!=" ? result !== check :
          operator === "^=" ? check && result.indexOf( check ) === 0 :
          operator === "*=" ? check && result.indexOf( check ) > -1 :
          operator === "$=" ? check && result.substr( result.length - check.length ) === check :
          operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
          operator === "|=" ? result === check || result.substr( 0, check.length + 1 ) === check + "-" :
          false;
      };
    },

    "CHILD": function( type, argument, first, last ) {

      if ( type === "nth" ) {
        return function( elem ) {
          var node, diff,
            parent = elem.parentNode;

          if ( first === 1 && last === 0 ) {
            return true;
          }

          if ( parent ) {
            diff = 0;
            for ( node = parent.firstChild; node; node = node.nextSibling ) {
              if ( node.nodeType === 1 ) {
                diff++;
                if ( elem === node ) {
                  break;
                }
              }
            }
          }

          // Incorporate the offset (or cast to NaN), then check against cycle size
          diff -= last;
          return diff === first || ( diff % first === 0 && diff / first >= 0 );
        };
      }

      return function( elem ) {
        var node = elem;

        switch ( type ) {
          case "only":
          case "first":
            while ( (node = node.previousSibling) ) {
              if ( node.nodeType === 1 ) {
                return false;
              }
            }

            if ( type === "first" ) {
              return true;
            }

            node = elem;

            /* falls through */
          case "last":
            while ( (node = node.nextSibling) ) {
              if ( node.nodeType === 1 ) {
                return false;
              }
            }

            return true;
        }
      };
    },

    "PSEUDO": function( pseudo, argument ) {
      // pseudo-class names are case-insensitive
      // http://www.w3.org/TR/selectors/#pseudo-classes
      // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
      // Remember that setFilters inherits from pseudos
      var args,
        fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
          Sizzle.error( "unsupported pseudo: " + pseudo );

      // The user may use createPseudo to indicate that
      // arguments are needed to create the filter function
      // just as Sizzle does
      if ( fn[ expando ] ) {
        return fn( argument );
      }

      // But maintain support for old signatures
      if ( fn.length > 1 ) {
        args = [ pseudo, pseudo, "", argument ];
        return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
          markFunction(function( seed, matches ) {
            var idx,
              matched = fn( seed, argument ),
              i = matched.length;
            while ( i-- ) {
              idx = indexOf.call( seed, matched[i] );
              seed[ idx ] = !( matches[ idx ] = matched[i] );
            }
          }) :
          function( elem ) {
            return fn( elem, 0, args );
          };
      }

      return fn;
    }
  },

  pseudos: {
    "not": markFunction(function( selector ) {
      // Trim the selector passed to compile
      // to avoid treating leading and trailing
      // spaces as combinators
      var input = [],
        results = [],
        matcher = compile( selector.replace( rtrim, "$1" ) );

      return matcher[ expando ] ?
        markFunction(function( seed, matches, context, xml ) {
          var elem,
            unmatched = matcher( seed, null, xml, [] ),
            i = seed.length;

          // Match elements unmatched by `matcher`
          while ( i-- ) {
            if ( (elem = unmatched[i]) ) {
              seed[i] = !(matches[i] = elem);
            }
          }
        }) :
        function( elem, context, xml ) {
          input[0] = elem;
          matcher( input, null, xml, results );
          return !results.pop();
        };
    }),

    "has": markFunction(function( selector ) {
      return function( elem ) {
        return Sizzle( selector, elem ).length > 0;
      };
    }),

    "contains": markFunction(function( text ) {
      return function( elem ) {
        return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
      };
    }),

    "enabled": function( elem ) {
      return elem.disabled === false;
    },

    "disabled": function( elem ) {
      return elem.disabled === true;
    },

    "checked": function( elem ) {
      // In CSS3, :checked should return both checked and selected elements
      // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
      var nodeName = elem.nodeName.toLowerCase();
      return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
    },

    "selected": function( elem ) {
      // Accessing this property makes selected-by-default
      // options in Safari work properly
      if ( elem.parentNode ) {
        elem.parentNode.selectedIndex;
      }

      return elem.selected === true;
    },

    "parent": function( elem ) {
      return !Expr.pseudos["empty"]( elem );
    },

    "empty": function( elem ) {
      // http://www.w3.org/TR/selectors/#empty-pseudo
      // :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
      //   not comment, processing instructions, or others
      // Thanks to Diego Perini for the nodeName shortcut
      //   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
      var nodeType;
      elem = elem.firstChild;
      while ( elem ) {
        if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
          return false;
        }
        elem = elem.nextSibling;
      }
      return true;
    },

    "header": function( elem ) {
      return rheader.test( elem.nodeName );
    },

    "text": function( elem ) {
      var type, attr;
      // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
      // use getAttribute instead to test this case
      return elem.nodeName.toLowerCase() === "input" &&
        (type = elem.type) === "text" &&
        ( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type );
    },

    // Input types
    "radio": createInputPseudo("radio"),
    "checkbox": createInputPseudo("checkbox"),
    "file": createInputPseudo("file"),
    "password": createInputPseudo("password"),
    "image": createInputPseudo("image"),

    "submit": createButtonPseudo("submit"),
    "reset": createButtonPseudo("reset"),

    "button": function( elem ) {
      var name = elem.nodeName.toLowerCase();
      return name === "input" && elem.type === "button" || name === "button";
    },

    "input": function( elem ) {
      return rinputs.test( elem.nodeName );
    },

    "focus": function( elem ) {
      var doc = elem.ownerDocument;
      return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href);
    },

    "active": function( elem ) {
      return elem === elem.ownerDocument.activeElement;
    },

    // Positional types
    "first": createPositionalPseudo(function( matchIndexes, length, argument ) {
      return [ 0 ];
    }),

    "last": createPositionalPseudo(function( matchIndexes, length, argument ) {
      return [ length - 1 ];
    }),

    "eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
      return [ argument < 0 ? argument + length : argument ];
    }),

    "even": createPositionalPseudo(function( matchIndexes, length, argument ) {
      for ( var i = 0; i < length; i += 2 ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "odd": createPositionalPseudo(function( matchIndexes, length, argument ) {
      for ( var i = 1; i < length; i += 2 ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
      for ( var i = argument < 0 ? argument + length : argument; --i >= 0; ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    }),

    "gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
      for ( var i = argument < 0 ? argument + length : argument; ++i < length; ) {
        matchIndexes.push( i );
      }
      return matchIndexes;
    })
  }
};

function siblingCheck( a, b, ret ) {
  if ( a === b ) {
    return ret;
  }

  var cur = a.nextSibling;

  while ( cur ) {
    if ( cur === b ) {
      return -1;
    }

    cur = cur.nextSibling;
  }

  return 1;
}

sortOrder = docElem.compareDocumentPosition ?
  function( a, b ) {
    if ( a === b ) {
      hasDuplicate = true;
      return 0;
    }

    return ( !a.compareDocumentPosition || !b.compareDocumentPosition ?
      a.compareDocumentPosition :
      a.compareDocumentPosition(b) & 4
    ) ? -1 : 1;
  } :
  function( a, b ) {
    // The nodes are identical, we can exit early
    if ( a === b ) {
      hasDuplicate = true;
      return 0;

    // Fallback to using sourceIndex (in IE) if it's available on both nodes
    } else if ( a.sourceIndex && b.sourceIndex ) {
      return a.sourceIndex - b.sourceIndex;
    }

    var al, bl,
      ap = [],
      bp = [],
      aup = a.parentNode,
      bup = b.parentNode,
      cur = aup;

    // If the nodes are siblings (or identical) we can do a quick check
    if ( aup === bup ) {
      return siblingCheck( a, b );

    // If no parents were found then the nodes are disconnected
    } else if ( !aup ) {
      return -1;

    } else if ( !bup ) {
      return 1;
    }

    // Otherwise they're somewhere else in the tree so we need
    // to build up a full list of the parentNodes for comparison
    while ( cur ) {
      ap.unshift( cur );
      cur = cur.parentNode;
    }

    cur = bup;

    while ( cur ) {
      bp.unshift( cur );
      cur = cur.parentNode;
    }

    al = ap.length;
    bl = bp.length;

    // Start walking down the tree looking for a discrepancy
    for ( var i = 0; i < al && i < bl; i++ ) {
      if ( ap[i] !== bp[i] ) {
        return siblingCheck( ap[i], bp[i] );
      }
    }

    // We ended someplace up the tree so do a sibling check
    return i === al ?
      siblingCheck( a, bp[i], -1 ) :
      siblingCheck( ap[i], b, 1 );
  };

// Always assume the presence of duplicates if sort doesn't
// pass them to our comparison function (as in Google Chrome).
[0, 0].sort( sortOrder );
baseHasDuplicate = !hasDuplicate;

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
  var elem,
    i = 1;

  hasDuplicate = baseHasDuplicate;
  results.sort( sortOrder );

  if ( hasDuplicate ) {
    for ( ; (elem = results[i]); i++ ) {
      if ( elem === results[ i - 1 ] ) {
        results.splice( i--, 1 );
      }
    }
  }

  return results;
};

Sizzle.error = function( msg ) {
  throw new Error( "Syntax error, unrecognized expression: " + msg );
};

function tokenize( selector, parseOnly ) {
  var matched, match, tokens, type, soFar, groups, preFilters,
    cached = tokenCache[ expando ][ selector ];

  if ( cached ) {
    return parseOnly ? 0 : cached.slice( 0 );
  }

  soFar = selector;
  groups = [];
  preFilters = Expr.preFilter;

  while ( soFar ) {

    // Comma and first run
    if ( !matched || (match = rcomma.exec( soFar )) ) {
      if ( match ) {
        soFar = soFar.slice( match[0].length );
      }
      groups.push( tokens = [] );
    }

    matched = false;

    // Combinators
    if ( (match = rcombinators.exec( soFar )) ) {
      tokens.push( matched = new Token( match.shift() ) );
      soFar = soFar.slice( matched.length );

      // Cast descendant combinators to space
      matched.type = match[0].replace( rtrim, " " );
    }

    // Filters
    for ( type in Expr.filter ) {
      if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
        // The last two arguments here are (context, xml) for backCompat
        (match = preFilters[ type ]( match, document, true ))) ) {

        tokens.push( matched = new Token( match.shift() ) );
        soFar = soFar.slice( matched.length );
        matched.type = type;
        matched.matches = match;
      }
    }

    if ( !matched ) {
      break;
    }
  }

  // Return the length of the invalid excess
  // if we're just parsing
  // Otherwise, throw an error or return tokens
  return parseOnly ?
    soFar.length :
    soFar ?
      Sizzle.error( selector ) :
      // Cache the tokens
      tokenCache( selector, groups ).slice( 0 );
}

function addCombinator( matcher, combinator, base ) {
  var dir = combinator.dir,
    checkNonElements = base && combinator.dir === "parentNode",
    doneName = done++;

  return combinator.first ?
    // Check against closest ancestor/preceding element
    function( elem, context, xml ) {
      while ( (elem = elem[ dir ]) ) {
        if ( checkNonElements || elem.nodeType === 1  ) {
          return matcher( elem, context, xml );
        }
      }
    } :

    // Check against all ancestor/preceding elements
    function( elem, context, xml ) {
      // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
      if ( !xml ) {
        var cache,
          dirkey = dirruns + " " + doneName + " ",
          cachedkey = dirkey + cachedruns;
        while ( (elem = elem[ dir ]) ) {
          if ( checkNonElements || elem.nodeType === 1 ) {
            if ( (cache = elem[ expando ]) === cachedkey ) {
              return elem.sizset;
            } else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
              if ( elem.sizset ) {
                return elem;
              }
            } else {
              elem[ expando ] = cachedkey;
              if ( matcher( elem, context, xml ) ) {
                elem.sizset = true;
                return elem;
              }
              elem.sizset = false;
            }
          }
        }
      } else {
        while ( (elem = elem[ dir ]) ) {
          if ( checkNonElements || elem.nodeType === 1 ) {
            if ( matcher( elem, context, xml ) ) {
              return elem;
            }
          }
        }
      }
    };
}

function elementMatcher( matchers ) {
  return matchers.length > 1 ?
    function( elem, context, xml ) {
      var i = matchers.length;
      while ( i-- ) {
        if ( !matchers[i]( elem, context, xml ) ) {
          return false;
        }
      }
      return true;
    } :
    matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
  var elem,
    newUnmatched = [],
    i = 0,
    len = unmatched.length,
    mapped = map != null;

  for ( ; i < len; i++ ) {
    if ( (elem = unmatched[i]) ) {
      if ( !filter || filter( elem, context, xml ) ) {
        newUnmatched.push( elem );
        if ( mapped ) {
          map.push( i );
        }
      }
    }
  }

  return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
  if ( postFilter && !postFilter[ expando ] ) {
    postFilter = setMatcher( postFilter );
  }
  if ( postFinder && !postFinder[ expando ] ) {
    postFinder = setMatcher( postFinder, postSelector );
  }
  return markFunction(function( seed, results, context, xml ) {
    // Positional selectors apply to seed elements, so it is invalid to follow them with relative ones
    if ( seed && postFinder ) {
      return;
    }

    var i, elem, postFilterIn,
      preMap = [],
      postMap = [],
      preexisting = results.length,

      // Get initial elements from seed or context
      elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [], seed ),

      // Prefilter to get matcher input, preserving a map for seed-results synchronization
      matcherIn = preFilter && ( seed || !selector ) ?
        condense( elems, preMap, preFilter, context, xml ) :
        elems,

      matcherOut = matcher ?
        // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
        postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

          // ...intermediate processing is necessary
          [] :

          // ...otherwise use results directly
          results :
        matcherIn;

    // Find primary matches
    if ( matcher ) {
      matcher( matcherIn, matcherOut, context, xml );
    }

    // Apply postFilter
    if ( postFilter ) {
      postFilterIn = condense( matcherOut, postMap );
      postFilter( postFilterIn, [], context, xml );

      // Un-match failing elements by moving them back to matcherIn
      i = postFilterIn.length;
      while ( i-- ) {
        if ( (elem = postFilterIn[i]) ) {
          matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
        }
      }
    }

    // Keep seed and results synchronized
    if ( seed ) {
      // Ignore postFinder because it can't coexist with seed
      i = preFilter && matcherOut.length;
      while ( i-- ) {
        if ( (elem = matcherOut[i]) ) {
          seed[ preMap[i] ] = !(results[ preMap[i] ] = elem);
        }
      }
    } else {
      matcherOut = condense(
        matcherOut === results ?
          matcherOut.splice( preexisting, matcherOut.length ) :
          matcherOut
      );
      if ( postFinder ) {
        postFinder( null, results, matcherOut, xml );
      } else {
        push.apply( results, matcherOut );
      }
    }
  });
}

function matcherFromTokens( tokens ) {
  var checkContext, matcher, j,
    len = tokens.length,
    leadingRelative = Expr.relative[ tokens[0].type ],
    implicitRelative = leadingRelative || Expr.relative[" "],
    i = leadingRelative ? 1 : 0,

    // The foundational matcher ensures that elements are reachable from top-level context(s)
    matchContext = addCombinator( function( elem ) {
      return elem === checkContext;
    }, implicitRelative, true ),
    matchAnyContext = addCombinator( function( elem ) {
      return indexOf.call( checkContext, elem ) > -1;
    }, implicitRelative, true ),
    matchers = [ function( elem, context, xml ) {
      return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
        (checkContext = context).nodeType ?
          matchContext( elem, context, xml ) :
          matchAnyContext( elem, context, xml ) );
    } ];

  for ( ; i < len; i++ ) {
    if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
      matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
    } else {
      // The concatenated values are (context, xml) for backCompat
      matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

      // Return special upon seeing a positional matcher
      if ( matcher[ expando ] ) {
        // Find the next relative operator (if any) for proper handling
        j = ++i;
        for ( ; j < len; j++ ) {
          if ( Expr.relative[ tokens[j].type ] ) {
            break;
          }
        }
        return setMatcher(
          i > 1 && elementMatcher( matchers ),
          i > 1 && tokens.slice( 0, i - 1 ).join("").replace( rtrim, "$1" ),
          matcher,
          i < j && matcherFromTokens( tokens.slice( i, j ) ),
          j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
          j < len && tokens.join("")
        );
      }
      matchers.push( matcher );
    }
  }

  return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
  var bySet = setMatchers.length > 0,
    byElement = elementMatchers.length > 0,
    superMatcher = function( seed, context, xml, results, expandContext ) {
      var elem, j, matcher,
        setMatched = [],
        matchedCount = 0,
        i = "0",
        unmatched = seed && [],
        outermost = expandContext != null,
        contextBackup = outermostContext,
        // We must always have either seed elements or context
        elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
        // Nested matchers should use non-integer dirruns
        dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.E);

      if ( outermost ) {
        outermostContext = context !== document && context;
        cachedruns = superMatcher.el;
      }

      // Add elements passing elementMatchers directly to results
      for ( ; (elem = elems[i]) != null; i++ ) {
        if ( byElement && elem ) {
          for ( j = 0; (matcher = elementMatchers[j]); j++ ) {
            if ( matcher( elem, context, xml ) ) {
              results.push( elem );
              break;
            }
          }
          if ( outermost ) {
            dirruns = dirrunsUnique;
            cachedruns = ++superMatcher.el;
          }
        }

        // Track unmatched elements for set filters
        if ( bySet ) {
          // They will have gone through all possible matchers
          if ( (elem = !matcher && elem) ) {
            matchedCount--;
          }

          // Lengthen the array for every element, matched or not
          if ( seed ) {
            unmatched.push( elem );
          }
        }
      }

      // Apply set filters to unmatched elements
      matchedCount += i;
      if ( bySet && i !== matchedCount ) {
        for ( j = 0; (matcher = setMatchers[j]); j++ ) {
          matcher( unmatched, setMatched, context, xml );
        }

        if ( seed ) {
          // Reintegrate element matches to eliminate the need for sorting
          if ( matchedCount > 0 ) {
            while ( i-- ) {
              if ( !(unmatched[i] || setMatched[i]) ) {
                setMatched[i] = pop.call( results );
              }
            }
          }

          // Discard index placeholder values to get only actual matches
          setMatched = condense( setMatched );
        }

        // Add matches to results
        push.apply( results, setMatched );

        // Seedless set matches succeeding multiple successful matchers stipulate sorting
        if ( outermost && !seed && setMatched.length > 0 &&
          ( matchedCount + setMatchers.length ) > 1 ) {

          Sizzle.uniqueSort( results );
        }
      }

      // Override manipulation of globals by nested matchers
      if ( outermost ) {
        dirruns = dirrunsUnique;
        outermostContext = contextBackup;
      }

      return unmatched;
    };

  superMatcher.el = 0;
  return bySet ?
    markFunction( superMatcher ) :
    superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
  var i,
    setMatchers = [],
    elementMatchers = [],
    cached = compilerCache[ expando ][ selector ];

  if ( !cached ) {
    // Generate a function of recursive functions that can be used to check each element
    if ( !group ) {
      group = tokenize( selector );
    }
    i = group.length;
    while ( i-- ) {
      cached = matcherFromTokens( group[i] );
      if ( cached[ expando ] ) {
        setMatchers.push( cached );
      } else {
        elementMatchers.push( cached );
      }
    }

    // Cache the compiled function
    cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
  }
  return cached;
};

function multipleContexts( selector, contexts, results, seed ) {
  var i = 0,
    len = contexts.length;
  for ( ; i < len; i++ ) {
    Sizzle( selector, contexts[i], results, seed );
  }
  return results;
}

function select( selector, context, results, seed, xml ) {
  var i, tokens, token, type, find,
    match = tokenize( selector ),
    j = match.length;

  if ( !seed ) {
    // Try to minimize operations if there is only one group
    if ( match.length === 1 ) {

      // Take a shortcut and set the context if the root selector is an ID
      tokens = match[0] = match[0].slice( 0 );
      if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
          context.nodeType === 9 && !xml &&
          Expr.relative[ tokens[1].type ] ) {

        context = Expr.find["ID"]( token.matches[0].replace( rbackslash, "" ), context, xml )[0];
        if ( !context ) {
          return results;
        }

        selector = selector.slice( tokens.shift().length );
      }

      // Fetch a seed set for right-to-left matching
      for ( i = matchExpr["POS"].test( selector ) ? -1 : tokens.length - 1; i >= 0; i-- ) {
        token = tokens[i];

        // Abort if we hit a combinator
        if ( Expr.relative[ (type = token.type) ] ) {
          break;
        }
        if ( (find = Expr.find[ type ]) ) {
          // Search, expanding context for leading sibling combinators
          if ( (seed = find(
            token.matches[0].replace( rbackslash, "" ),
            rsibling.test( tokens[0].type ) && context.parentNode || context,
            xml
          )) ) {

            // If seed is empty or no tokens remain, we can return early
            tokens.splice( i, 1 );
            selector = seed.length && tokens.join("");
            if ( !selector ) {
              push.apply( results, slice.call( seed, 0 ) );
              return results;
            }

            break;
          }
        }
      }
    }
  }

  // Compile and execute a filtering function
  // Provide `match` to avoid retokenization if we modified the selector above
  compile( selector, match )(
    seed,
    context,
    xml,
    results,
    rsibling.test( selector )
  );
  return results;
}

if ( document.querySelectorAll ) {
  (function() {
    var disconnectedMatch,
      oldSelect = select,
      rescape = /'|\\/g,
      rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

      // qSa(:focus) reports false when true (Chrome 21),
      // A support test would require too much code (would include document ready)
      rbuggyQSA = [":focus"],

      // matchesSelector(:focus) reports false when true (Chrome 21),
      // matchesSelector(:active) reports false when true (IE9/Opera 11.5)
      // A support test would require too much code (would include document ready)
      // just skip matchesSelector for :active
      rbuggyMatches = [ ":active", ":focus" ],
      matches = docElem.matchesSelector ||
        docElem.mozMatchesSelector ||
        docElem.webkitMatchesSelector ||
        docElem.oMatchesSelector ||
        docElem.msMatchesSelector;

    // Build QSA regex
    // Regex strategy adopted from Diego Perini
    assert(function( div ) {
      // Select is set to empty string on purpose
      // This is to test IE's treatment of not explictly
      // setting a boolean content attribute,
      // since its presence should be enough
      // http://bugs.jquery.com/ticket/12359
      div.innerHTML = "<select><option selected=''></option></select>";

      // IE8 - Some boolean attributes are not treated correctly
      if ( !div.querySelectorAll("[selected]").length ) {
        rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
      }

      // Webkit/Opera - :checked should return selected option elements
      // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
      // IE8 throws error here (do not put tests after this one)
      if ( !div.querySelectorAll(":checked").length ) {
        rbuggyQSA.push(":checked");
      }
    });

    assert(function( div ) {

      // Opera 10-12/IE9 - ^= $= *= and empty values
      // Should not select anything
      div.innerHTML = "<p test=''></p>";
      if ( div.querySelectorAll("[test^='']").length ) {
        rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
      }

      // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
      // IE8 throws error here (do not put tests after this one)
      div.innerHTML = "<input type='hidden'/>";
      if ( !div.querySelectorAll(":enabled").length ) {
        rbuggyQSA.push(":enabled", ":disabled");
      }
    });

    // rbuggyQSA always contains :focus, so no need for a length check
    rbuggyQSA = /* rbuggyQSA.length && */ new RegExp( rbuggyQSA.join("|") );

    select = function( selector, context, results, seed, xml ) {
      // Only use querySelectorAll when not filtering,
      // when this is not xml,
      // and when no QSA bugs apply
      if ( !seed && !xml && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
        var groups, i,
          old = true,
          nid = expando,
          newContext = context,
          newSelector = context.nodeType === 9 && selector;

        // qSA works strangely on Element-rooted queries
        // We can work around this by specifying an extra ID on the root
        // and working up from there (Thanks to Andrew Dupont for the technique)
        // IE 8 doesn't work on object elements
        if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
          groups = tokenize( selector );

          if ( (old = context.getAttribute("id")) ) {
            nid = old.replace( rescape, "\\$&" );
          } else {
            context.setAttribute( "id", nid );
          }
          nid = "[id='" + nid + "'] ";

          i = groups.length;
          while ( i-- ) {
            groups[i] = nid + groups[i].join("");
          }
          newContext = rsibling.test( selector ) && context.parentNode || context;
          newSelector = groups.join(",");
        }

        if ( newSelector ) {
          try {
            push.apply( results, slice.call( newContext.querySelectorAll(
              newSelector
            ), 0 ) );
            return results;
          } catch(qsaError) {
          } finally {
            if ( !old ) {
              context.removeAttribute("id");
            }
          }
        }
      }

      return oldSelect( selector, context, results, seed, xml );
    };

    if ( matches ) {
      assert(function( div ) {
        // Check to see if it's possible to do matchesSelector
        // on a disconnected node (IE 9)
        disconnectedMatch = matches.call( div, "div" );

        // This should fail with an exception
        // Gecko does not error, returns false instead
        try {
          matches.call( div, "[test!='']:sizzle" );
          rbuggyMatches.push( "!=", pseudos );
        } catch ( e ) {}
      });

      // rbuggyMatches always contains :active and :focus, so no need for a length check
      rbuggyMatches = /* rbuggyMatches.length && */ new RegExp( rbuggyMatches.join("|") );

      Sizzle.matchesSelector = function( elem, expr ) {
        // Make sure that attribute selectors are quoted
        expr = expr.replace( rattributeQuotes, "='$1']" );

        // rbuggyMatches always contains :active, so no need for an existence check
        if ( !isXML( elem ) && !rbuggyMatches.test( expr ) && (!rbuggyQSA || !rbuggyQSA.test( expr )) ) {
          try {
            var ret = matches.call( elem, expr );

            // IE 9's matchesSelector returns false on disconnected nodes
            if ( ret || disconnectedMatch ||
                // As well, disconnected nodes are said to be in a document
                // fragment in IE 9
                elem.document && elem.document.nodeType !== 11 ) {
              return ret;
            }
          } catch(e) {}
        }

        return Sizzle( expr, null, null, [ elem ] ).length > 0;
      };
    }
  })();
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Back-compat
function setFilters() {}
Expr.filters = setFilters.prototype = Expr.pseudos;
Expr.setFilters = new setFilters();



// EXPOSE qooxdoo variant
qx.bom.Selector.query = function(selector, context) {
  return Sizzle(selector, context);
};

qx.bom.Selector.matches = function(selector, set) {
  return Sizzle(selector, null, null, set);
};

})( window );
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * CSS/Style property manipulation module
 * @group (Core)
 */
qx.Bootstrap.define("qx.module.Css", {
  statics: {


    /**
     * Modifies the given style property on all elements in the collection.
     *
     * @attach {qxWeb}
     * @param name {String} Name of the style property to modify
     * @param value {var} The value to apply
     * @return {qxWeb} The collection for chaining
     */
    setStyle : function(name, value) {
      if (/\w-\w/.test(name)) {
        name = qx.lang.String.camelCase(name);
      }
      this._forEachElement(function(item) {
        qx.bom.element.Style.set(item, name, value);
      });
      return this;
    },


    /**
     * Returns the value of the given style property for the first item in the
     * collection.
     *
     * @attach {qxWeb}
     * @param name {String} Style property name
     * @return {var} Style property value
     */
    getStyle : function(name) {
      if (this[0] && qx.dom.Node.isElement(this[0])) {
        if (/\w-\w/.test(name)) {
          name = qx.lang.String.camelCase(name);
        }
        return qx.bom.element.Style.get(this[0], name);
      }
      return null;
    },


    /**
     * Sets multiple style properties for each item in the collection.
     *
     * @attach {qxWeb}
     * @param styles {Map} A map of style property name/value pairs
     * @return {qxWeb} The collection for chaining
     */
    setStyles : function(styles) {
      for (var name in styles) {
        this.setStyle(name, styles[name]);
      }
      return this;
    },


    /**
     * Returns the values of multiple style properties for each item in the
     * collection
     *
     * @attach {qxWeb}
     * @param names {String[]} List of style property names
     * @return {Map} Map of style property name/value pairs
     */
    getStyles : function(names) {
      var styles = {};
      for (var i=0; i < names.length; i++) {
        styles[names[i]] = this.getStyle(names[i]);
      }
      return styles;
    },


    /**
     * Adds a class name to each element in the collection
     *
     * @attach {qxWeb}
     * @param name {String} Class name
     * @return {qxWeb} The collection for chaining
     */
    addClass : function(name) {
      this._forEachElement(function(item) {
        qx.bom.element.Class.add(item, name);
      });
      return this;
    },


    /**
     * Adds multiple class names to each element in the collection
     *
     * @attach {qxWeb}
     * @param names {String[]} List of class names to add
     * @return {qxWeb} The collection for chaining
     */
    addClasses : function(names) {
      this._forEachElement(function(item) {
        qx.bom.element.Class.addClasses(item, names);
      });
      return this;
    },


    /**
     * Removes a class name from each element in the collection
     *
     * @attach {qxWeb}
     * @param name {String} The class name to remove
     * @return {qxWeb} The collection for chaining
     */
    removeClass : function(name) {
      this._forEachElement(function(item) {
        qx.bom.element.Class.remove(item, name);
      });
      return this;
    },


    /**
     * Removes multiple class names from each element in the collection.
     * Use {@link qx.module.Attribute#removeAttribute} to remove all classes.
     *
     * @attach {qxWeb}
     * @param names {String[]} List of class names to remove
     * @return {qxWeb} The collection for chaining
     */
    removeClasses : function(names) {
      this._forEachElement(function(item) {
        qx.bom.element.Class.removeClasses(item, names);
      });
      return this;
    },


    /**
     * Checks if the first element in the collection has the given class name
     *
     * @attach {qxWeb}
     * @param name {String} Class name to check for
     * @return {Boolean} <code>true</code> if the first item has the given class name
     */
    hasClass : function(name) {
      if (!this[0] || !qx.dom.Node.isElement(this[0])) {
        return false;
      }
      return qx.bom.element.Class.has(this[0], name);
    },


    /**
     * Returns the class name of the first element in the collection
     *
     * @attach {qxWeb}
     * @return {String} Class name
     */
    getClass : function() {
      if (!this[0] || !qx.dom.Node.isElement(this[0])) {
        return "";
      }
      return qx.bom.element.Class.get(this[0]);
    },


    /**
     * Toggles the given class name on each item in the collection
     *
     * @attach {qxWeb}
     * @param name {String} Class name
     * @return {qxWeb} The collection for chaining
     */
    toggleClass : function(name) {
      var bCls = qx.bom.element.Class;
      this._forEachElement(function(item) {
        bCls.has(item, name) ?
          bCls.remove(item, name) :
          bCls.add(item, name);
      });
      return this;
    },


    /**
     * Toggles the given list of class names on each item in the collection
     *
     * @attach {qxWeb}
     * @param names {String[]} Class names
     * @return {qxWeb} The collection for chaining
     */
    toggleClasses : function(names) {
      for (var i=0,l=names.length; i<l; i++) {
        this.toggleClass(names[i]);
      }
      return this;
    },


    /**
     * Replaces a class name on each element in the collection
     *
     * @attach {qxWeb}
     * @param oldName {String} Class name to remove
     * @param newName {String} Class name to add
     * @return {qxWeb} The collection for chaining
     */
    replaceClass : function(oldName, newName) {
      this._forEachElement(function(item) {
        qx.bom.element.Class.replace(item, oldName, newName);
      });
      return this;
    },


    /**
     * Returns the rendered height of the first element in the collection.
     * @attach {qxWeb}
     * @param force {Boolean?false} When true also get the height of a <em>non displayed</em> element
     * @return {Number} The first item's rendered height
     */
    getHeight : function(force) {
      var elem = this[0];

      if (elem) {
        if (qx.dom.Node.isElement(elem)) {

          var elementHeight;
          if (force) {
            var stylesToSwap = {
              display : "block",
              position : "absolute",
              visibility : "hidden"
            };
            elementHeight = qx.module.Css.__swap(elem, stylesToSwap, qx.module.Css.getHeight, this);
          } else {
            elementHeight = qx.bom.element.Dimension.getHeight(elem);
          }

          return elementHeight;
        } else if (qx.dom.Node.isDocument(elem)) {
          return qx.bom.Document.getHeight(qx.dom.Node.getWindow(elem));
        } else if (qx.dom.Node.isWindow(elem)) {
          return qx.bom.Viewport.getHeight(elem);
        }
      }

      return null;
    },


    /**
     * Returns the rendered width of the first element in the collection
     * @attach {qxWeb}
     * @param force {Boolean?false} When true also get the width of a <em>non displayed</em> element
     * @return {Number} The first item's rendered width
     */
    getWidth : function(force) {
      var elem = this[0];

      if (elem) {
        if (qx.dom.Node.isElement(elem)) {

          var elementWidth;
          if (force) {
            var stylesToSwap = {
              display : "block",
              position : "absolute",
              visibility : "hidden"
            };
            elementWidth = qx.module.Css.__swap(elem, stylesToSwap, qx.module.Css.getWidth, this);
          } else {
            elementWidth = qx.bom.element.Dimension.getWidth(elem);
          }

          return elementWidth;
        } else if (qx.dom.Node.isDocument(elem)) {
          return qx.bom.Document.getWidth(qx.dom.Node.getWindow(elem));
        } else if (qx.dom.Node.isWindow(elem)) {
          return qx.bom.Viewport.getWidth(elem);
        }
      }

      return null;
    },


    /**
     * Returns the computed location of the given element in the context of the
     * document dimensions.
     *
     * Supported modes:
     *
     * * <code>margin</code>: Calculate from the margin box of the element (bigger than the visual appearance: including margins of given element)
     * * <code>box</code>: Calculates the offset box of the element (default, uses the same size as visible)
     * * <code>border</code>: Calculate the border box (useful to align to border edges of two elements).
     * * <code>scroll</code>: Calculate the scroll box (relevant for absolute positioned content).
     * * <code>padding</code>: Calculate the padding box (relevant for static/relative positioned content).
     *
     * @attach {qxWeb}
     * @param mode {String?box} A supported option. See comment above.
     * @return {Map} A map with the keys <code>left</code>, <code>top</code>,
     * <code>right</code> and <code>bottom</code> which contains the distance
     * of the element relative to the document.
     */
    getOffset : function(mode) {
      var elem = this[0];

      if (elem && qx.dom.Node.isElement(elem)) {
        return qx.bom.element.Location.get(elem, mode);
      }

      return null;
    },


    /**
     * Returns the content height of the first element in the collection.
     * This is the maximum height the element can use, excluding borders,
     * margins, padding or scroll bars.
     * @attach {qxWeb}
     * @param force {Boolean?false} When true also get the content height of a <em>non displayed</em> element
     * @return {Number} Computed content height
     */
    getContentHeight : function(force)
    {
      var obj = this[0];
      if (qx.dom.Node.isElement(obj)) {

        var contentHeight;
        if (force) {
          var stylesToSwap = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
          };
          contentHeight = qx.module.Css.__swap(obj, stylesToSwap, qx.module.Css.getContentHeight, this);
        } else {
          contentHeight = qx.bom.element.Dimension.getContentHeight(obj);
        }

        return contentHeight;
      }

      return null;
    },


    /**
     * Returns the content width of the first element in the collection.
     * This is the maximum width the element can use, excluding borders,
     * margins, padding or scroll bars.
     * @attach {qxWeb}
     * @param force {Boolean?false} When true also get the content width of a <em>non displayed</em> element
     * @return {Number} Computed content width
     */
    getContentWidth : function(force)
    {
      var obj = this[0];
      if (qx.dom.Node.isElement(obj)) {

        var contentWidth;
        if (force) {
          var stylesToSwap = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
          };
          contentWidth = qx.module.Css.__swap(obj, stylesToSwap, qx.module.Css.getContentWidth, this);
        } else {
          contentWidth = qx.bom.element.Dimension.getContentWidth(obj);
        }

        return contentWidth;
      }

      return null;
    },


    /**
     * Returns the distance between the first element in the collection and its
     * offset parent
     *
     * @attach {qxWeb}
     * @return {Map} a map with the keys <code>left</code> and <code>top</code>
     * containing the distance between the elements
     */
    getPosition : function()
    {
      var obj = this[0];
      if (qx.dom.Node.isElement(obj)) {
        return qx.bom.element.Location.getPosition(obj);
      }

      return null;
    },


    /**
     * Includes a Stylesheet file
     *
     * @attachStatic {qxWeb}
     * @param uri {String} The stylesheet's URI
     * @param doc {Document?} Document to modify
     */
    includeStylesheet : function(uri, doc) {
      qx.bom.Stylesheet.includeFile(uri, doc);
    },


    /**
     * Hides all elements in the collection by setting their "display"
     * style to "none". The previous value is stored so it can be re-applied
     * when {@link #show} is called.
     *
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining
     */
    hide : function() {
      this._forEachElementWrapped(function(item) {
        var prevStyle = item.getStyle("display");
        if (prevStyle !== "none") {
          item[0].$$qPrevDisp = prevStyle;
          item.setStyle("display", "none");
        }
      });

      return this;
    },


    /**
     * Shows any elements with "display: none" in the collection. If an element
     * was hidden by using the {@link #hide} method, its previous
     * "display" style value will be re-applied. Otherwise, the
     * default "display" value for the element type will be applied.
     *
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining
     */
    show : function() {
      this._forEachElementWrapped(function(item) {
        var currentVal = item.getStyle("display");
        var prevVal = item[0].$$qPrevDisp;
        var newVal;
        if (currentVal == "none") {
          if (prevVal && prevVal != "none") {
            newVal = prevVal;
          }
          else {
            var doc = qxWeb.getDocument(item[0]);
            newVal = qx.module.Css.__getDisplayDefault(item[0].tagName, doc);
          }
          item.setStyle("display", newVal);
          item[0].$$qPrevDisp = "none";
        }
      });

      return this;
    },


    /**
     * Maps HTML elements to their default "display" style values.
     */
    __displayDefaults : {},


    /**
     * Attempts tp determine the default "display" style value for
     * elements with the given tag name.
     *
     * @param tagName {String} Tag name
     * @param  doc {Document?} Document element. Default: The current document
     * @return {String} The default "display" value, e.g. <code>inline</code>
     * or <code>block</code>
     */
    __getDisplayDefault : function(tagName, doc)
    {
      var defaults = qx.module.Css.__displayDefaults;
      if (!defaults[tagName]) {
        var docu = doc || document;
        var tempEl = qxWeb(docu.createElement(tagName)).appendTo(doc.body);
        defaults[tagName] = tempEl.getStyle("display");
        tempEl.remove();
      }

      return defaults[tagName] || "";
    },


    /**
     * Swaps the given styles of the element and execute the callback
     * before the original values are restored.
     *
     * Finally returns the return value of the callback.
     *
     * @param element {Element} the DOM element to operate on
     * @param styles {Map} the styles to swap
     * @param callback {Function} the callback function
     * @param context {Object} the context in which the callback should be called
     * @return {Object} the return value of the callback
     */
    __swap : function(element, styles, callback, context)
    {
      // get the current values
      var currentValues = {};
      for (var styleProperty in styles) {
        currentValues[styleProperty] = element.style[styleProperty];
        element.style[styleProperty] = styles[styleProperty];
      }

      var value = callback.call(context);

      for (var styleProperty in currentValues) {
        element.style[styleProperty] = currentValues[styleProperty];
      }

      return value;
    }
  },


  defer : function(statics) {
    qxWeb.$attach({
      "setStyle" : statics.setStyle,
      "getStyle" : statics.getStyle,
      "setStyles" : statics.setStyles,
      "getStyles" : statics.getStyles,

      "addClass" : statics.addClass,
      "addClasses" : statics.addClasses,
      "removeClass" : statics.removeClass,
      "removeClasses" : statics.removeClasses,
      "hasClass" : statics.hasClass,
      "getClass" : statics.getClass,
      "toggleClass" : statics.toggleClass,
      "toggleClasses" : statics.toggleClasses,
      "replaceClass" : statics.replaceClass,

      "getHeight" : statics.getHeight,
      "getWidth" : statics.getWidth,
      "getOffset" : statics.getOffset,
      "getContentHeight" : statics.getContentHeight,
      "getContentWidth" : statics.getContentWidth,

      "getPosition" : statics.getPosition,

      "hide" : statics.hide,
      "show" : statics.show
    });

    qxWeb.$attachStatic({
      "includeStylesheet" : statics.includeStylesheet
    });
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */

/**
 * Adds JavaScript features that may not be supported by all clients.
 *
 * @require(qx.lang.normalize.Function)
 * @require(qx.lang.normalize.String)
 * @require(qx.lang.normalize.Date)
 * @require(qx.lang.normalize.Array)
 * @require(qx.lang.normalize.Error)
 * @require(qx.lang.normalize.Object)
 *
 * @group (Polyfill)
 */
qx.Bootstrap.define("qx.module.Polyfill", {});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */

/**
 * Support for native and custom events.
 *
 * @require(qx.module.Polyfill)
 * @group (Core)
 */
qx.Bootstrap.define("qx.module.Event", {
  statics :
  {
    /**
     * Event normalization registry
     *
     * @internal
     */
    __normalizations : {},

    /**
     * Registry of event hooks
     * @internal
     */
    __hooks : {
      on : {},
      off : {}
    },

    /**
     * Registers a listener for the given event type on each item in the
     * collection. This can be either native or custom events.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param context {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true
     * @return {qxWeb} The collection for chaining
     */
    on : function(type, listener, context, useCapture) {
      for (var i=0; i < this.length; i++) {
        var el = this[i];
        var ctx = context || qxWeb(el);

        // call hooks
        var hooks = qx.module.Event.__hooks.on;
        // generic
        var typeHooks = hooks["*"] || [];
        // type specific
        if (hooks[type]) {
          typeHooks = typeHooks.concat(hooks[type]);
        }
        for (var j=0, m=typeHooks.length; j<m; j++) {
          typeHooks[j](el, type, listener, context);
        }

        var bound = function(event) {
          // apply normalizations
          var registry = qx.module.Event.__normalizations;
          // generic
          var normalizations = registry["*"] || [];
          // type specific
          if (registry[type]) {
            normalizations = normalizations.concat(registry[type]);
          }

          for (var x=0, y=normalizations.length; x<y; x++) {
            event = normalizations[x](event, el, type);
          }
          // call original listener with normalized event
          listener.apply(this, [event]);
        }.bind(ctx);
        bound.original = listener;

        // add native listener
        if (qx.bom.Event.supportsEvent(el, type)) {
          qx.bom.Event.addNativeListener(el, type, bound, useCapture);
        }
        // create an emitter if necessary
        if (!el.__emitter) {
          el.__emitter = new qx.event.Emitter();
        }

        var id = el.__emitter.on(type, bound, ctx);
        if (!el.__listener) {
          el.__listener = {};
        }
        if (!el.__listener[type]) {
          el.__listener[type] = {};
        }
        el.__listener[type][id] = bound;

        if (!context) {
          // store a reference to the dynamically created context so we know
          // what to check for when removing the listener
          if (!el.__ctx) {
            el.__ctx = {};
          }
          el.__ctx[id] = ctx;
        }
      }
      return this;
    },


    /**
     * Unregisters event listeners for the given type from each element in the
     * collection.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event
     * @param listener {Function} Listener callback
     * @param context {Object?} Listener callback context
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true
     * @return {qxWeb} The collection for chaining
     */
    off : function(type, listener, context, useCapture) {
      var removeAll = (listener === null && context === null);

      for (var j=0; j < this.length; j++) {
        var el = this[j];

        // continue if no listeners are available
        if (!el.__listener) {
          continue;
        }

        var types = [];
        if (type !== null) {
          types.push(type);
        } else {
          // no type specified, remove all listeners
          for (var listenerType in el.__listener) {
            types.push(listenerType);
          }
        }

        for (var i=0, l=types.length; i<l; i++) {
          for (var id in el.__listener[types[i]]) {
            var storedListener = el.__listener[types[i]][id];
            if (removeAll || storedListener == listener || storedListener.original == listener) {
              // get the stored context
              var hasStoredContext = typeof el.__ctx !== "undefined" && el.__ctx[id];
              var storedContext;
              if (!context && hasStoredContext) {
                storedContext = el.__ctx[id];
              }
              // remove the listener from the emitter
              el.__emitter.off(types[i], storedListener, storedContext || context);

              // check if it's a bound listener which means it was a native event
              if (removeAll || storedListener.original == listener) {
                // remove the native listener
                qx.bom.Event.removeNativeListener(el, types[i], storedListener, useCapture);
              }

              delete el.__listener[types[i]][id];

              if (hasStoredContext) {
                delete el.__ctx[id];
              }
            }
          }

          // call hooks
          var hooks = qx.module.Event.__hooks.off;
          // generic
          var typeHooks = hooks["*"] || [];
          // type specific
          if (hooks[type]) {
            typeHooks = typeHooks.concat(hooks[type]);
          }
          for (var k=0, m=typeHooks.length; k<m; k++) {
            typeHooks[k](el, type, listener, context);
          }
        }

      }

      return this;
    },

    /**
     * Removes all event listeners (or all listeners for a given type) from the
     * collection.
     *
     * @attach {qxWeb}
     * @param type {String?} Event type. All listeners will be removed if this is undefined.
     * @return {qxWeb} The collection for chaining
     */
    allOff : function(type) {
      return this.off(type || null, null, null);
    },

    /**
     * Fire an event of the given type.
     *
     * @attach {qxWeb}
     * @param type {String} Event type
     * @param data {var?} Optional data that will be passed to the listener
     * callback function.
     * @return {qxWeb} The collection for chaining
     */
    emit : function(type, data) {
      for (var j=0; j < this.length; j++) {
        var el = this[j];
        if (el.__emitter) {
          el.__emitter.emit(type, data);
        }
      }
      return this;
    },


    /**
     * Attaches a listener for the given event that will be executed only once.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param context {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @return {qxWeb} The collection for chaining
     */
    once : function(type, listener, context) {
      var self = this;
      var wrappedListener = function(data) {
        self.off(type, wrappedListener, context);
        listener.call(this, data);
      };
      this.on(type, wrappedListener, context);
      return this;
    },


    /**
     * Checks if one or more listeners for the given event type are attached to
     * the first element in the collection
     *
     * @attach {qxWeb}
     * @param type {String} Event type, e.g. <code>mousedown</code>
     * @param listener {Function?} Event listener to check for.
     * @param context {Object?} Context object listener to check for.
     * @return {Boolean} <code>true</code> if one or more listeners are attached
     */
    hasListener : function(type, listener, context) {
      if (!this[0] || !this[0].__emitter ||
        !this[0].__emitter.getListeners()[type])
      {
        return false;
      }

      if (listener) {
        var attachedListeners = this[0].__emitter.getListeners()[type];
        for (var i = 0; i < attachedListeners.length; i++) {
          var hasListener = false;
          if (attachedListeners[i].listener == listener) {
            hasListener = true;
          }
          if (attachedListeners[i].listener.original &&
              attachedListeners[i].listener.original == listener) {
            hasListener =  true;
          }

          if (hasListener) {
            if (context !== undefined) {
              if (attachedListeners[i].ctx === context) {
                return true;
              }
            } else {
              return true;
            }
          }
        }
        return false;
      }
      return this[0].__emitter.getListeners()[type].length > 0;
    },


    /**
     * Copies any event listeners that are attached to the elements in the
     * collection to the provided target element
     *
     * @internal
     * @param target {Element} Element to attach the copied listeners to
     */
    copyEventsTo : function(target) {
      // Copy both arrays to make sure the original collections are not manipulated.
      // If e.g. the 'target' array contains a DOM node with child nodes we run into
      // problems because the 'target' array is flattened within this method.
      var source = this.concat();
      var targetCopy = target.concat();

      // get all children of source and target
      for (var i = source.length - 1; i >= 0; i--) {
        var descendants = source[i].getElementsByTagName("*");
        for (var j=0; j < descendants.length; j++) {
          source.push(descendants[j]);
        }
      }

      for (var i = targetCopy.length -1; i >= 0; i--) {
        var descendants = targetCopy[i].getElementsByTagName("*");
        for (var j=0; j < descendants.length; j++) {
          targetCopy.push(descendants[j]);
        }
      }
      // make sure no emitter object has been copied
      targetCopy.forEach(function(el) {
        el.__emitter = null;
      });

      for (var i=0; i < source.length; i++) {
        var el = source[i];
        if (!el.__emitter) {
          continue;
        }
        var storage = el.__emitter.getListeners();
        for (var name in storage) {
          for (var j = storage[name].length - 1; j >= 0; j--) {
            var listener = storage[name][j].listener;
            if (listener.original) {
              listener = listener.original;
            }
            qxWeb(targetCopy[i]).on(name, listener, storage[name][j].ctx);
          }
        }
      }
    },


    __isReady : false,


    /**
     * Executes the given function once the document is ready.
     *
     * @attachStatic {qxWeb}
     * @param callback {Function} callback function
     */
    ready : function(callback) {
      // DOM is already ready
      if (document.readyState === "complete") {
        window.setTimeout(callback, 1);
        return;
      }

      // listen for the load event so the callback is executed no matter what
      var onWindowLoad = function()
      {
        qx.module.Event.__isReady = true;
        callback();
      };

      qxWeb(window).on("load", onWindowLoad);

      var wrappedCallback = function() {
        qxWeb(window).off("load", onWindowLoad);
        callback();
      };

      // Listen for DOMContentLoaded event if available (no way to reliably detect
      // support)
      if (qxWeb.env.get("engine.name") !== "mshtml" || qxWeb.env.get("browser.documentmode") > 8) {
        qx.bom.Event.addNativeListener(document, "DOMContentLoaded", wrappedCallback);
      }
      else {
        // Continually check to see if the document is ready
        var timer = function() {
          // onWindowLoad already executed
          if (qx.module.Event.__isReady) {
            return;
          }
          try {
            // If DOMContentLoaded is unavailable, use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            document.documentElement.doScroll("left");
            if (document.body) {
              wrappedCallback();
            }
          }
          catch(error) {
            window.setTimeout(timer, 100);
          }
        };

        timer();
      }
    },


    /**
     * Bind one or two callbacks to the collection.
     * If only the first callback is defined the collection
     * does react on 'mouseover' only.
     *
     * @attach {qxWeb}
     *
     * @param callbackIn {Function} callback when hovering over
     * @param callbackOut {Function?} callback when hovering out
     * @return {qxWeb} The collection for chaining
     */
    hover : function(callbackIn, callbackOut) {

      this.on("mouseover", callbackIn, this);

      if (qx.lang.Type.isFunction(callbackOut)) {
        this.on("mouseout", callbackOut, this);
      }

      return this;
    },


    /**
     * Registers a normalization function for the given event types. Listener
     * callbacks for these types will be called with the return value of the
     * normalization function instead of the regular event object.
     *
     * The normalizer will be called with two arguments: The original event
     * object and the element on which the event was triggered
     *
     * @attachStatic {qxWeb, $registerEventNormalization}
     * @param types {String[]} List of event types to be normalized. Use an
     * asterisk (<code>*</code>) to normalize all event types
     * @param normalizer {Function} Normalizer function
     */
    $registerNormalization : function(types, normalizer)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var registry = qx.module.Event.__normalizations;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(normalizer)) {
          if (!registry[type]) {
            registry[type] = [];
          }
          registry[type].push(normalizer);
        }
      }
    },


    /**
     * Unregisters a normalization function from the given event types.
     *
     * @attachStatic {qxWeb, $unregisterEventNormalization}
     * @param types {String[]} List of event types
     * @param normalizer {Function} Normalizer function
     */
    $unregisterNormalization : function(types, normalizer)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var registry = qx.module.Event.__normalizations;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (registry[type]) {
          qx.lang.Array.remove(registry[type], normalizer);
        }
      }
    },


    /**
     * Returns all registered event normalizers
     *
     * @attachStatic {qxWeb, $getEventNormalizationRegistry}
     * @return {Map} Map of event types/normalizer functions
     */
    $getRegistry : function()
    {
      return qx.module.Event.__normalizations;
    },


    /**
     * Registers an event hook for the given event types.
     *
     * @attachStatic {qxWeb, $registerEventHook}
     * @param types {String[]} List of event types
     * @param registerHook {Function} Hook function to be called on event registration
     * @param unregisterHook {Function?} Hook function to be called on event deregistration
     * @internal
     */
    $registerEventHook : function(types, registerHook, unregisterHook)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var onHooks = qx.module.Event.__hooks.on;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(registerHook)) {
          if (!onHooks[type]) {
            onHooks[type] = [];
          }
          onHooks[type].push(registerHook);
        }
      }
      if (!unregisterHook) {
        return;
      }
      var offHooks = qx.module.Event.__hooks.off;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(unregisterHook)) {
          if (!offHooks[type]) {
            offHooks[type] = [];
          }
          offHooks[type].push(unregisterHook);
        }
      }
    },


    /**
     * Unregisters a hook from the given event types.
     *
     * @attachStatic {qxWeb, $unregisterEventHooks}
     * @param types {String[]} List of event types
     * @param registerHook {Function} Hook function to be called on event registration
     * @param unregisterHook {Function?} Hook function to be called on event deregistration
     * @internal
     */
    $unregisterEventHook : function(types, registerHook, unregisterHook)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var onHooks = qx.module.Event.__hooks.on;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (onHooks[type]) {
          qx.lang.Array.remove(onHooks[type], registerHook);
        }
      }
      if (!unregisterHook) {
        return;
      }
      var offHooks = qx.module.Event.__hooks.off;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (offHooks[type]) {
          qx.lang.Array.remove(offHooks[type], unregisterHook);
        }
      }
    },


    /**
     * Returns all registered event hooks
     *
     * @attachStatic {qxWeb, $getEventHookRegistry}
     * @return {Map} Map of event types/registration hook functions
     * @internal
     */
    $getHookRegistry : function()
    {
      return qx.module.Event.__hooks;
    }
  },


  defer : function(statics) {
    qxWeb.$attach({
      "on" : statics.on,
      "off" : statics.off,
      "allOff" : statics.allOff,
      "once" : statics.once,
      "emit" : statics.emit,
      "hasListener" : statics.hasListener,
      "copyEventsTo" : statics.copyEventsTo,
      "hover" : statics.hover
    });

    qxWeb.$attachStatic({
      "ready": statics.ready,
      "$registerEventNormalization" : statics.$registerNormalization,
      "$unregisterEventNormalization" : statics.$unregisterNormalization,
      "$getEventNormalizationRegistry" : statics.$getRegistry,

      "$registerEventHook" : statics.$registerEventHook,
      "$unregisterEventHook" : statics.$unregisterEventHook,
      "$getEventHookRegistry" : statics.$getHookRegistry
    });
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * Cross browser animation layer. It uses feature detection to check if CSS
 * animations are available and ready to use. If not, a JavaScript-based
 * fallback will be used.
 *
 * @require(qx.module.Css)
 * @require(qx.module.Event)
 */
qx.Bootstrap.define("qx.module.Animation", {
  events : {
    /** Fired when an animation starts. */
    "animationStart" : undefined,

    /** Fired when an animation has ended one iteration. */
    "animationIteration" : undefined,

    /** Fired when an animation has ended. */
    "animationEnd" : undefined
  },

  statics :
  {
    /**
     * Returns the stored animation handles. The handles are only
     * available while an animation is running.
     *
     * @internal
     * @return {Array} An array of animation handles.
     */
    getAnimationHandles : function() {
      var animationHandles = [];
      for (var i=0; i < this.length; i++) {
        animationHandles[i] = this[i].$$animation;
      }
      return animationHandles;
    },


    /**
     * Animation description used in {@link #fadeOut}.
     */
    _fadeOut : {duration: 700, timing: "ease-out", keep: 100, keyFrames : {
      0: {opacity: 1},
      100: {opacity: 0, display: "none"}
    }},


    /**
     * Animation description used in {@link #fadeIn}.
     */
    _fadeIn : {duration: 700, timing: "ease-in", keep: 100, keyFrames : {
      0: {opacity: 0},
      100: {opacity: 1}
    }},


    /**
     * Starts the animation with the given description.
     * The description should be a map, which could look like this:
     *
     * <pre class="javascript">
     * {
     *   "duration": 1000,
     *   "keep": 100,
     *   "keyFrames": {
     *     0 : {"opacity": 1, "scale": 1},
     *     100 : {"opacity": 0, "scale": 0}
     *   },
     *   "origin": "50% 50%",
     *   "repeat": 1,
     *   "timing": "ease-out",
     *   "alternate": false,
     *   "delay": 2000
     * }
     * </pre>
     *
     * *duration* is the time in milliseconds one animation cycle should take.
     *
     * *keep* is the key frame to apply at the end of the animation. (optional)
     *
     * *keyFrames* is a map of separate frames. Each frame is defined by a
     *   number which is the percentage value of time in the animation. The value
     *   is a map itself which holds css properties or transforms
     *   (Transforms only for CSS Animations).
     *
     * *origin* maps to the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin">transform origin</a>
     * (Only for CSS animations).
     *
     * *repeat* is the amount of time the animation should be run in
     *   sequence. You can also use "infinite".
     *
     * *timing* takes one of these predefined values:
     *   <code>ease</code> | <code>linear</code> | <code>ease-in</code>
     *   | <code>ease-out</code> | <code>ease-in-out</code> |
     *   <code>cubic-bezier(&lt;number&gt;, &lt;number&gt;, &lt;number&gt;, &lt;number&gt;)</code>
     *   (cubic-bezier only available for CSS animations)
     *
     * *alternate* defines if every other animation should be run in reverse order.
     *
     * *delay* is the time in milliseconds the animation should wait before start.
     *
     * @attach {qxWeb}
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @return {qxWeb} The collection for chaining.
     */
    animate : function(desc, duration) {
      qx.module.Animation._animate.bind(this)(desc, duration, false);
      return this;
    },


    /**
     * Starts an animation in reversed order. For further details, take a look at
     * the {@link #animate} method.
     * @attach {qxWeb}
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @return {qxWeb} The collection for chaining.
     */
    animateReverse : function(desc, duration) {
      qx.module.Animation._animate.bind(this)(desc, duration, true);
      return this;
    },


    /**
     * Animation execute either regular or reversed direction.
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be reversed
     */
    _animate : function(desc, duration, reverse) {
      this._forEachElement(function(el, i) {
        // stop all running animations
        if (el.$$animation) {
          el.$$animation.stop();
        }

        var handle;
        if (reverse) {
          handle = qx.bom.element.Animation.animateReverse(el, desc, duration);
        } else {
          handle = qx.bom.element.Animation.animate(el, desc, duration);
        }

        var self = this;
        // only register for the first element
        if (i == 0) {
          handle.on("start", function() {
            self.emit("animationStart");
          }, handle);

          handle.on("iteration", function() {
            self.emit("animationIteration");
          }, handle);
        }

        handle.on("end", function() {
          for (var i=0; i < self.length; i++) {
            if (self[i].$$animation) {
              return;
            }
          }
          self.emit("animationEnd");
        }, el);
      });
    },


    /**
     * Manipulates the play state of the animation.
     * This can be used to continue an animation when paused.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    play : function() {
      for (var i=0; i < this.length; i++) {
        var handle = this[i].$$animation;
        if (handle) {
          handle.play();
        }
      }
      return this;
    },


    /**
     * Manipulates the play state of the animation.
     * This can be used to pause an animation when running.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    pause : function() {
      for (var i=0; i < this.length; i++) {
        var handle = this[i].$$animation;
        if (handle) {
          handle.pause();
        }
      }

      return this;
    },


    /**
     * Stops a running animation.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    stop : function() {
      for (var i=0; i < this.length; i++) {
        var handle = this[i].$$animation;
        if (handle) {
          handle.stop();
        }
      }

      return this;
    },


    /**
     * Returns whether an animation is running or not.
     * @attach {qxWeb}
     * @return {Boolean} <code>true</code>, if an animation is running.
     */
    isPlaying : function() {
      for (var i=0; i < this.length; i++) {
        var handle = this[i].$$animation;
        if (handle && handle.isPlaying()) {
          return true;
        }
      }

      return false;
    },


    /**
     * Returns whether an animation has ended or not.
     * @attach {qxWeb}
     * @return {Boolean} <code>true</code>, if an animation has ended.
     */
    isEnded : function() {
      for (var i=0; i < this.length; i++) {
        var handle = this[i].$$animation;
        if (handle && !handle.isEnded()) {
          return false;
        }
      }

      return true;
    },


    /**
     * Fades in all elements in the collection.
     * @attach {qxWeb}
     * @param duration {Number?} The duration in milliseconds.
     * @return {qxWeb} The collection for chaining.
     */
    fadeIn : function(duration) {
      // remove 'display: none' style
      this.setStyle("display", "");
      return this.animate(qx.module.Animation._fadeIn, duration);
    },


    /**
     * Fades out all elements in the collection.
     * @attach {qxWeb}
     * @param duration {Number?} The duration in milliseconds.
     * @return {qxWeb} The collection for chaining.
     */
    fadeOut : function(duration) {
      return this.animate(qx.module.Animation._fadeOut, duration);
    }
  },


  defer : function(statics) {
    qxWeb.$attach({
      "animate" : statics.animate,
      "animateReverse" : statics.animateReverse,
      "fadeIn" : statics.fadeIn,
      "fadeOut" : statics.fadeOut,
      "play" : statics.play,
      "pause" : statics.pause,
      "stop" : statics.stop,
      "isEnded" : statics.isEnded,
      "isPlaying" : statics.isPlaying,
      "getAnimationHandles" : statics.getAnimationHandles
    });
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Wrapper for {@link qx.bom.element.AnimationCss} and
 * {@link qx.bom.element.AnimationJs}. It offers the pubilc API and decides using
 * feature checks either to use CSS animations or JS animations.
 *
 * If you use this class, the restrictions of the JavaScript animations apply.
 * This means that you can not use transforms and custom bezier timing functions.
 */
qx.Bootstrap.define("qx.bom.element.Animation",
{
  statics : {

    /**
     * This function takes care of the feature check and starts the animation.
     * It takes a DOM element to apply the animation to, and a description.
     * The description should be a map, which could look like this:
     *
     * <pre class="javascript">
     * {
     *   "duration": 1000,
     *   "keep": 100,
     *   "keyFrames": {
     *     0 : {"opacity": 1, "scale": 1},
     *     100 : {"opacity": 0, "scale": 0}
     *   },
     *   "origin": "50% 50%",
     *   "repeat": 1,
     *   "timing": "ease-out",
     *   "alternate": false,
     *   "delay" : 2000
     * }
     * </pre>
     *
     * *duration* is the time in milliseconds one animation cycle should take.
     *
     * *keep* is the key frame to apply at the end of the animation. (optional)
     *   Keep in mind that the keep key is reversed in case you use an reverse
     *   animation or set the alternate key and a even repeat count.
     *
     * *keyFrames* is a map of separate frames. Each frame is defined by a
     *   number which is the percentage value of time in the animation. The value
     *   is a map itself which holds css properties or transforms
     *   {@link qx.bom.element.Transform} (Transforms only for CSS Animations).
     *
     * *origin* maps to the transform origin {@link qx.bom.element.Transform#setOrigin}
     *   (Only for CSS animations).
     *
     * *repeat* is the amount of time the animation should be run in
     *   sequence. You can also use "infinite".
     *
     * *timing* takes one of the predefined value:
     *   <code>ease</code> | <code>linear</code> | <code>ease-in</code>
     *   | <code>ease-out</code> | <code>ease-in-out</code> |
     *   <code>cubic-bezier(&lt;number&gt;, &lt;number&gt;, &lt;number&gt;, &lt;number&gt;)</code>
     *   (cubic-bezier only available for CSS animations)
     *
     * *alternate* defines if every other animation should be run in reverse order.
     *
     * *delay* is the time in milliseconds the animation should wait before start.
     *
     * @param el {Element} The element to animate.
     * @param desc {Map} The animations description.
     * @param duration {Integer?} The duration in milliseconds of the animation
     *   which will override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} AnimationHandle instance to control
     *   the animation.
     */
    animate : function(el, desc, duration) {
      var onlyCssKeys = qx.bom.element.Animation.__hasOnlyCssKeys(el, desc.keyFrames);

      if (qx.core.Environment.get("css.animation") && onlyCssKeys) {
        return qx.bom.element.AnimationCss.animate(el, desc, duration);
      } else {
        return qx.bom.element.AnimationJs.animate(el, desc, duration);
      }
    },


    /**
     * Starts an animation in reversed order. For further details, take a look at
     * the {@link #animate} method.
     * @param el {Element} The element to animate.
     * @param desc {Map} The animations description.
     * @param duration {Integer?} The duration in milliseconds of the animation
     *   which will override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} AnimationHandle instance to control
     *   the animation.
     */
    animateReverse : function(el, desc, duration) {
      var onlyCssKeys = qx.bom.element.Animation.__hasOnlyCssKeys(el, desc.keyFrames);
      if (qx.core.Environment.get("css.animation") && onlyCssKeys) {
        return qx.bom.element.AnimationCss.animateReverse(el, desc, duration);
      } else {
        return qx.bom.element.AnimationJs.animateReverse(el, desc, duration);
      }
    },


    /**
     * Detection helper which detects if only CSS keys are in
     * the animations key frames.
     * @param el {Element} The element to check for the styles.
     * @param keyFrames {Map} The keyFrames of the animation.
     * @return {Boolean} <code>true</code> if only css properties are included.
     */
    __hasOnlyCssKeys : function(el, keyFrames) {
      var keys = [];
      for (var nr in keyFrames) {
        var frame = keyFrames[nr];
        for (var key in frame) {
          if (keys.indexOf(key) == -1) {
            keys.push(key);
          }
        }
      }

      var transformKeys = ["scale", "rotate", "skew", "translate"];
      for (var i=0; i < keys.length; i++) {
        var key = qx.lang.String.camelCase(keys[i]);
        if (!(key in el.style)) {
          // check for transform keys
          if (transformKeys.indexOf(keys[i]) != -1) {
            continue;
          }
          // check for prefixed keys
          if (qx.bom.Style.getPropertyName(key)) {
            continue;
          }
          return false;
        }
      };
      return true;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is responsible for applying CSS3 animations to plain DOM elements.
 *
 * The implementation is mostly a cross-browser wrapper for applying the
 * animations, including transforms. If the browser does not support
 * CSS animations, but you have set a keep frame, the keep frame will be applied
 * immediately, thus making the animations optional.
 *
 * The API aligns closely to the spec wherever possible.
 *
 * http://www.w3.org/TR/css3-animations/
 *
 * {@link qx.bom.element.Animation} is the class, which takes care of the
 * feature detection for CSS animations and decides which implementation
 * (CSS or JavaScript) should be used. Most likely, this implementation should
 * be the one to use.
 */
qx.Bootstrap.define("qx.bom.element.AnimationCss",
{
  statics : {
    // initialization
    __sheet : null,
    __rulePrefix : "Anni",
    __id : 0,
    /** Static map of rules */
    __rules : {},

    /** The used keys for transforms. */
    __transitionKeys : {
      "scale": true,
      "rotate" : true,
      "skew" : true,
      "translate" : true
    },

    /** Map of cross browser CSS keys. */
    __cssAnimationKeys : qx.core.Environment.get("css.animation"),


    /**
     * This is the main function to start the animation in reverse mode.
     * For further details, take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animateReverse : function(el, desc, duration) {
      return this._animate(el, desc, duration, true);
    },

    /**
     * This is the main function to start the animation. For further details,
     * take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animate : function(el, desc, duration) {
      return this._animate(el, desc, duration, false);
    },


    /**
     * Internal method to start an animation either reverse or not.
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be
     *   reversed.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    _animate : function(el, desc, duration, reverse) {
      this.__normalizeDesc(desc);

      // debug validation
      if (qx.core.Environment.get("qx.debug")) {
        this.__validateDesc(desc);
      }

      // reverse the keep property if the animation is reverse as well
      var keep = desc.keep;
      if (keep != null && (reverse || (desc.alternate && desc.repeat % 2 == 0))) {
        keep = 100 - keep;
      }

      if (!this.__sheet) {
        this.__sheet = qx.bom.Stylesheet.createElement();
      }
      var keyFrames = desc.keyFrames;

      if (duration == undefined) {
        duration = desc.duration;
      }

      // if animations are supported
      if (this.__cssAnimationKeys != null) {
        var name = this.__addKeyFrames(keyFrames, reverse);

        var style =
          name + " " +
          duration + "ms " +
          desc.repeat + " " +
          desc.timing + " " +
          (desc.delay ? desc.delay + "ms " : "") +
          (desc.alternate ? "alternate" : "");

        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["start-event"], this.__onAnimationStart);
        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["iteration-event"], this.__onAnimationIteration);
        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["end-event"], this.__onAnimationEnd);

        if (qx.core.Environment.get("qx.debug")) {
          if (qx.bom.element.Style.get(el, "display") == "none") {
            qx.log.Logger.warn("Some browsers will not animate elements with display==none", el);
          }
        }

        el.style[qx.lang.String.camelCase(this.__cssAnimationKeys["name"])] = style;
        // use the fill mode property if available and suitable
        if (keep && keep == 100 && this.__cssAnimationKeys["fill-mode"]) {
          el.style[this.__cssAnimationKeys["fill-mode"]] = "forwards";
        }
      }

      var animation = new qx.bom.element.AnimationHandle();
      animation.desc = desc;
      animation.el = el;
      animation.keep = keep;
      el.$$animation = animation;

      // additional transform keys
      if (desc.origin != null) {
        qx.bom.element.Transform.setOrigin(el, desc.origin);
      }

      // fallback for browsers not supporting animations
      if (this.__cssAnimationKeys == null) {
        window.setTimeout(function() {
          qx.bom.element.AnimationCss.__onAnimationEnd({target: el});
        }, 0);
      }

      return animation;
    },


    /**
     * Handler for the animation start.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationStart : function(e) {
      e.target.$$animation.emit("start", e.target);
    },


    /**
     * Handler for the animation iteration.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationIteration : function(e)
    {
      // It could happen that an animation end event is fired before an
      // animation iteration appears [BUG #6928]
      if (e.target != null && e.target.$$animation != null) {
        e.target.$$animation.emit("iteration", e.target);
      }
    },


    /**
     * Handler for the animation end.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationEnd : function(e) {
      var el = e.target;
      var animation = el.$$animation;

      // ignore events when already cleaned up
      if (!animation) {
        return;
      }

      var desc = animation.desc;

      if (qx.bom.element.AnimationCss.__cssAnimationKeys != null) {
        // reset the styling
        var key = qx.lang.String.camelCase(
          qx.bom.element.AnimationCss.__cssAnimationKeys["name"]
        );
        el.style[key] = "";

        qx.bom.Event.removeNativeListener(
          el,
          qx.bom.element.AnimationCss.__cssAnimationKeys["name"],
          qx.bom.element.AnimationCss.__onAnimationEnd
        );
      }

      if (desc.origin != null) {
        qx.bom.element.Transform.setOrigin(el, "");
      }

      qx.bom.element.AnimationCss.__keepFrame(el, desc.keyFrames[animation.keep]);

      el.$$animation = null;
      animation.el = null;
      animation.ended = true;

      animation.emit("end", el);
    },


    /**
     * Helper method which takes an element and a key frame description and
     * applies the properties defined in the given frame to the element. This
     * method is used to keep the state of the animation.
     * @param el {Element} The element to apply the frame to.
     * @param endFrame {Map} The description of the end frame, which is basically
     *   a map containing CSS properties and values including transforms.
     */
    __keepFrame : function(el, endFrame) {
      // keep the element at this animation step
      var transforms;
      for (var style in endFrame) {
        if (style in qx.bom.element.AnimationCss.__transitionKeys) {
          if (!transforms) {
            transforms = {};
          }
          transforms[style] = endFrame[style];
        } else {
          el.style[qx.lang.String.camelCase(style)] = endFrame[style];
        }
      }

      // transform keeping
      if (transforms) {
        qx.bom.element.Transform.transform(el, transforms);
      }
    },


    /**
     * Preprocessing of the description to make sure every necessary key is
     * set to its default.
     * @param desc {Map} The description of the animation.
     */
    __normalizeDesc : function(desc) {
      if (!desc.hasOwnProperty("alternate")) {
        desc.alternate = false;
      }
      if (!desc.hasOwnProperty("keep")) {
        desc.keep = null;
      }
      if (!desc.hasOwnProperty("repeat")) {
        desc.repeat = 1;
      }
      if (!desc.hasOwnProperty("timing")) {
        desc.timing = "linear";
      }
      if (!desc.hasOwnProperty("origin")) {
        desc.origin = null;
      }
    },


    /**
     * Debugging helper to validate the description.
     * @signature function(desc)
     * @param desc {Map} The description of the animation.
     */
    __validateDesc : qx.core.Environment.select("qx.debug", {
      "true" : function(desc) {
        var possibleKeys = [
          "origin", "duration", "keep", "keyFrames", "delay",
          "repeat", "timing", "alternate"
        ];

        // check for unknown keys
        for (var name in desc) {
          if (!(possibleKeys.indexOf(name) != -1)) {
            qx.Bootstrap.warn("Unknown key '" + name + "' in the animation description.");
          }
        };

        if (desc.keyFrames == null) {
          qx.Bootstrap.warn("No 'keyFrames' given > 0");
        } else {
          // check the key frames
          for (var pos in desc.keyFrames) {
            if (pos < 0 || pos > 100) {
              qx.Bootstrap.warn("Keyframe position needs to be between 0 and 100");
            }
          }
        }
      },

      "default" : null
    }),


    /**
     * Helper to add the given frames to an internal CSS stylesheet. It parses
     * the description and adds the key frames to the sheet.
     * @param frames {Map} A map of key frames that describe the animation.
     * @param reverse {Boolean} <code>true</code>, if the key frames should
     *   be added in reverse order.
     * @return {String} The generated name of the keyframes rule.
     */
    __addKeyFrames : function(frames, reverse) {
      var rule = "";

      // for each key frame
      for (var position in frames) {
        rule += (reverse ? -(position - 100) : position) + "% {";

        var frame = frames[position];
        var transforms;
        // each style
        for (var style in frame) {
          if (style in this.__transitionKeys) {
            if (!transforms) {
              transforms = {};
            }
            transforms[style] = frame[style];
          } else {
            var propName = qx.bom.Style.getPropertyName(style);
            var prefixed = (propName !== null) ?
              qx.bom.Style.getCssName(propName) : "";
            rule += (prefixed || style) + ":" + frame[style] + ";";
          }
        }

        // transform handling
        if (transforms) {
          rule += qx.bom.element.Transform.getCss(transforms);
        }

        rule += "} ";
      }

      // cached shorthand
      if (this.__rules[rule]) {
        return this.__rules[rule];
      }

      var name = this.__rulePrefix + this.__id++;
      var selector = this.__cssAnimationKeys["keyframes"] + " " + name;
      qx.bom.Stylesheet.addRule(this.__sheet, selector, rule);

      this.__rules[rule] = name;

      return name;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * This is a simple handle, which will be returned when an animation is
 * started using the {@link qx.bom.element.Animation#animate} method. It
 * basically controls the animation.
 *
 * @ignore(qx.bom.element.AnimationJs)
 */
qx.Bootstrap.define("qx.bom.element.AnimationHandle",
{
  extend : qx.event.Emitter,


  construct : function() {
    var css = qx.core.Environment.get("css.animation");
    this.__playState = css && css["play-state"];
    this.__playing = true;
  },


  events: {
    /** Fired when the animation started via {@link qx.bom.element.Animation}. */
    "start" : "Element",

    /**
     * Fired when the animation started via {@link qx.bom.element.Animation} has
     * ended.
     */
    "end" : "Element",

    /** Fired on every iteration of the animation. */
    "iteration" : "Element"
  },


  members :
  {
    __playState : null,
    __playing : false,
    __ended : false,


    /**
     * Accessor of the playing state.
     * @return {Boolean} <code>true</code>, if the animations is playing.
     */
    isPlaying : function() {
      return this.__playing;
    },


    /**
     * Accessor of the ended state.
     * @return {Boolean} <code>true</code>, if the animations has ended.
     */
    isEnded : function() {
      return this.__ended;
    },


    /**
     * Accessor of the paused state.
     * @return {Boolean} <code>true</code>, if the animations is paused.
     */
    isPaused : function() {
      return this.el.style[this.__playState] == "paused";
    },


    /**
     * Pauses the animation, if running. If not running, it will be ignored.
     */
    pause : function() {
      if (this.el) {
        this.el.style[this.__playState] = "paused";
        this.el.$$animation.__playing = false;
        // in case the animation is based on JS
        if (this.animationId && qx.bom.element.AnimationJs) {
          qx.bom.element.AnimationJs.pause(this);
        }
      }
    },


    /**
     * Resumes an animation. This does not start the animation once it has ended.
     * In this case you need to start a new Animation.
     */
    play : function() {
      if (this.el) {
        this.el.style[this.__playState] = "running";
        this.el.$$animation.__playing = true;
        // in case the animation is based on JS
        if (this.i != undefined && qx.bom.element.AnimationJs) {
          qx.bom.element.AnimationJs.play(this);
        }
      }
    },


    /**
     * Stops the animation if running.
     */
    stop : function() {
      if (this.el && qx.core.Environment.get("css.animation") && !this.jsAnimation) {
        this.el.style[this.__playState] = "";
        this.el.style[qx.core.Environment.get("css.animation").name] = "";
        this.el.$$animation.__playing = false;
        this.el.$$animation.__ended = true;
      }
      // in case the animation is based on JS
      else if (this.jsAnimation) {
        this.stopped = true;
        qx.bom.element.AnimationJs.stop(this);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * This class offers the same API as the CSS3 animation layer in
 * {@link qx.bom.element.AnimationCss} but uses JavaScript to fake the behavior.
 *
 * {@link qx.bom.element.Animation} is the class, which takes care of the
 * feature detection for CSS animations and decides which implementation
 * (CSS or JavaScript) should be used. Most likely, this implementation should
 * be the one to use.
 *
 * @ignore(qx.bom.element.Style.*)
 * @use(qx.bom.element.AnimationJs#play)
 */
qx.Bootstrap.define("qx.bom.element.AnimationJs",
{
  statics :
  {
    /**
     * The maximal time a frame should take.
     */
    __maxStepTime : 30,

    /**
     * The supported CSS units.
     */
    __units : ["%", "in", "cm", "mm", "em", "ex", "pt", "pc", "px"],

    /** The used keys for transforms. */
    __transitionKeys : {
      "scale": true,
      "rotate" : true,
      "skew" : true,
      "translate" : true
    },

    /**
     * This is the main function to start the animation. For further details,
     * take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animate : function(el, desc, duration) {
      return this._animate(el, desc, duration, false);
    },


    /**
     * This is the main function to start the animation in reversed mode.
     * For further details, take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animateReverse : function(el, desc, duration) {
      return this._animate(el, desc, duration, true);
    },


    /**
     * Helper to start the animation, either in reversed order or not.
     *
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be
     *   reversed.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    _animate : function(el, desc, duration, reverse) {
      // stop if an animation is already running
      if (el.$$animation) {
        return el.$$animation;
      }

      desc = qx.lang.Object.clone(desc, true);

      if (duration == undefined) {
        duration = desc.duration;
      }

      var keyFrames = desc.keyFrames;

      var keys = this.__getOrderedKeys(keyFrames);
      var stepTime = this.__getStepTime(duration, keys);
      var steps = parseInt(duration / stepTime, 10);

      this.__normalizeKeyFrames(keyFrames, el);

      var delta = this.__calculateDelta(steps, stepTime, keys, keyFrames, duration, desc.timing);
      var handle = new qx.bom.element.AnimationHandle();
      handle.jsAnimation = true;

      if (reverse) {
        delta.reverse();
        handle.reverse = true;
      }

      handle.desc = desc;
      handle.el = el;
      handle.delta = delta;
      handle.stepTime = stepTime;
      handle.steps = steps;
      el.$$animation = handle;

      handle.i = 0;
      handle.initValues = {};
      handle.repeatSteps = this.__applyRepeat(steps, desc.repeat);

      var delay = desc.delay || 0;
      var self = this;
      handle.delayId = window.setTimeout(function() {
        handle.delayId = null;
        self.play(handle);
      }, delay);
      return handle;
    },


    /**
     * Try to normalize the keyFrames by adding the default / set values of the
     * element.
     * @param keyFrames {Map} The map of key frames.
     * @param el {Element} The element to animate.
     */
    __normalizeKeyFrames : function(keyFrames, el) {
      // collect all possible keys and its units
      var units = {};
      for (var percent in keyFrames) {
        for (var name in keyFrames[percent]) {
          // prefixed key calculation
          var prefixed = qx.bom.Style.getPropertyName(name);
          if (prefixed && prefixed != name) {
            var prefixedName = qx.bom.Style.getCssName(prefixed);
            keyFrames[percent][prefixedName] = keyFrames[percent][name];
            delete keyFrames[percent][name];
            name = prefixedName;
          }
          // check for the available units
          if (units[name] == undefined) {
            var item = keyFrames[percent][name];
            if (typeof item == "string") {
              units[name] = this.__getUnit(item);
            } else {
              units[name] = "";
            }
          }
        };
      }
      // add all missing keys
      for (var percent in keyFrames) {
        var frame = keyFrames[percent];
        for (var name in units) {
          if (frame[name] == undefined) {
            if (name in el.style) {
              // get the computed style if possible
              if (window.getComputedStyle) {
                frame[name] = getComputedStyle(el, null)[name];
              } else {
                frame[name] = el.style[name];
              }
            } else {
              frame[name] = el[name];
            }
            // if its a unit we know, set 0 as fallback
            if (frame[name] === "" && this.__units.indexOf(units[name]) != -1) {
              frame[name] = "0" + units[name];
            }
          }
        };
      };
    },


    /**
     * Checks for transform keys and returns a cloned frame
     * with the right transform style set.
     * @param frame {Map} A single key frame of the description.
     * @return {Map} A modified clone of the given frame.
     */
    __normalizeKeyFrameTransforms : function(frame) {
      frame = qx.lang.Object.clone(frame);
      var transforms;
      for (var name in frame) {
        if (name in this.__transitionKeys) {
          if (!transforms) {
            transforms = {};
          }
          transforms[name] = frame[name];
          delete frame[name];
        }
      };
      if (transforms) {
        var transformStyle = qx.bom.element.Transform.getCss(transforms).split(":");
        if (transformStyle.length > 1) {
          frame[transformStyle[0]] = transformStyle[1].replace(";", "");
        }
      }
      return frame;
    },


    /**
     * Precalculation of the delta which will be applied during the animation.
     * The whole deltas will be calculated prior to the animation and stored
     * in a single array. This method takes care of that calculation.
     *
     * @param steps {Integer} The amount of steps to take to the end of the
     *   animation.
     * @param stepTime {Integer} The amount of milliseconds each step takes.
     * @param keys {Array} Ordered list of keys in the key frames map.
     * @param keyFrames {Map} The map of key frames.
     * @param duration {Integer} Time in milliseconds the animation should take.
     * @param timing {String} The given timing function.
     * @return {Array} An array containing the animation deltas.
     */
    __calculateDelta : function(steps, stepTime, keys, keyFrames, duration, timing) {
      var delta = new Array(steps);

      var keyIndex = 1;
      delta[0] = this.__normalizeKeyFrameTransforms(keyFrames[0]);
      var last = keyFrames[0];
      var next = keyFrames[keys[keyIndex]];
      var stepsToNext = Math.floor(keys[keyIndex] / (stepTime / duration * 100));

      var calculationIndex = 1; // is used as counter for the timing calculation
      // for every step
      for (var i=1; i < delta.length; i++) {
        // switch key frames if we crossed a percent border
        if (i * stepTime / duration * 100 > keys[keyIndex]) {
          last = next;
          keyIndex++;
          next = keyFrames[keys[keyIndex]];
          stepsToNext = Math.floor(keys[keyIndex] / (stepTime / duration * 100)) - stepsToNext;
          calculationIndex = 1;
        }

        delta[i] = {};

        var transforms;
        // for every property
        for (var name in next) {
          var nItem = next[name] + "";

          // transform values
          if (name in this.__transitionKeys) {
            if (!transforms) {
              transforms = {};
            }

            if (qx.Bootstrap.isArray(last[name])) {
              if (!qx.Bootstrap.isArray(next[name])) {
                next[name] = [next[name]];
              }
              transforms[name] = [];
              for (var j = 0; j < next[name].length; j++) {
                var item = next[name][j] + "";
                var x = calculationIndex / stepsToNext;
                transforms[name][j] = this.__getNextValue(item, last[name], timing, x);
              }
            } else {
              var x = calculationIndex / stepsToNext;
              transforms[name] = this.__getNextValue(nItem, last[name], timing, x);
            }

          // color values
          } else if (nItem.charAt(0) == "#") {
            // get the two values from the frames as RGB arrays
            var value0 = qx.util.ColorUtil.cssStringToRgb(last[name]);
            var value1 = qx.util.ColorUtil.cssStringToRgb(nItem);
            var stepValue = [];
            // calculate every color chanel
            for (var j=0; j < value0.length; j++) {
              var range = value0[j] - value1[j];
              var x = calculationIndex / stepsToNext;
              var timingX = qx.bom.AnimationFrame.calculateTiming(timing, x);
              stepValue[j] = parseInt(value0[j] - range * timingX, 10);
            }

            delta[i][name] = qx.util.ColorUtil.rgbToHexString(stepValue);

          } else if (!isNaN(parseFloat(nItem))) {
            var x = calculationIndex / stepsToNext;
            delta[i][name] = this.__getNextValue(nItem, last[name], timing, x);
          } else {
            delta[i][name] = last[name] + "";
          }
        }
        // save all transformations in the delta values
        if (transforms) {
          var transformStyle = qx.bom.element.Transform.getCss(transforms).split(":");
          if (transformStyle.length > 1) {
            delta[i][transformStyle[0]] = transformStyle[1].replace(";", "");
          }
        }

        calculationIndex++;
      }
      // make sure the last key frame is right
      delta[delta.length -1] = this.__normalizeKeyFrameTransforms(keyFrames[100]);

      return delta;
    },


    /**
     * Ties to parse out the unit of the given value.
     *
     * @param item {String} A CSS value including its unit.
     * @return {String} The unit of the given value.
     */
    __getUnit : function(item) {
      return item.substring((parseFloat(item) + "").length, item.length);
    },


    /**
     * Returns the next value based on the given arguments.
     *
     * @param nextItem {String} The CSS value of the next frame
     * @param lastItem {String} The CSS value of the last frame
     * @param timing {String} The timing used for the calculation
     * @param x {Number} The x position of the animation on the time axis
     * @return {String} The calculated value including its unit.
     */
    __getNextValue : function(nextItem, lastItem, timing, x) {
      var range = parseFloat(nextItem) - parseFloat(lastItem);
      return (parseFloat(lastItem) + range * qx.bom.AnimationFrame.calculateTiming(timing, x)) + this.__getUnit(nextItem);
    },


    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to play
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */
    play : function(handle) {
      handle.emit("start", handle.el);
      var id = window.setInterval(function() {
        handle.repeatSteps--;
        var values = handle.delta[handle.i % handle.steps];
        // save the init values
        if (handle.i === 0) {
          for (var name in values) {
            if (handle.initValues[name] === undefined) {
              // animate element property
              if (handle.el[name] !== undefined) {
                handle.initValues[name] = handle.el[name];
              }
              // animate CSS property
              else if (qx.bom.element.Style) {
                handle.initValues[name] = qx.bom.element.Style.get(
                  handle.el, qx.lang.String.camelCase(name)
                );
              } else {
                handle.initValues[name] = handle.el.style[qx.lang.String.camelCase(name)];
              }
            }
          }
        }
        qx.bom.element.AnimationJs.__applyStyles(handle.el, values);

        handle.i++;
        // iteration condition
        if (handle.i % handle.steps == 0) {
          handle.emit("iteration", handle.el);
          if (handle.desc.alternate) {
            handle.delta.reverse();
          }
        }
        // end condition
        if (handle.repeatSteps < 0) {
          qx.bom.element.AnimationJs.stop(handle);
        }
      }, handle.stepTime);

      handle.animationId = id;

      return handle;
    },


    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to pause
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */

    pause : function(handle) {
      // stop the interval
      window.clearInterval(handle.animationId);
      handle.animationId = null;

      return handle;
    },


    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to stop
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */
    stop : function(handle) {
      var desc = handle.desc;
      var el = handle.el;
      var initValues = handle.initValues;
      if (handle.animationId) {
        window.clearInterval(handle.animationId);
      }

      // clear the delay if the animation has not been started
      if (handle.delayId) {
        window.clearTimeout(handle.delayId);
      }

      // check if animation is already stopped
      if (el == undefined) {
        return handle;
      }

      // if we should keep a frame
      var keep = desc.keep;
      if (keep != undefined && !handle.stopped) {
        if (handle.reverse || (desc.alternate && desc.repeat && desc.repeat % 2 == 0)) {
          keep = 100 - keep;
        }
        this.__applyStyles(el, desc.keyFrames[keep]);
      } else {
        this.__applyStyles(el, initValues);
      }

      el.$$animation = null;
      handle.el = null;
      handle.ended = true;
      handle.animationId = null;

      handle.emit("end", el);

      return handle;
    },


    /**
     * Takes care of the repeat key of the description.
     * @param steps {Integer} The number of steps one iteration would take.
     * @param repeat {Integer|String} It can be either a number how often the
     * animation should be repeated or the string 'infinite'.
     * @return {Integer} The number of steps to animate.
     */
    __applyRepeat : function(steps, repeat) {
      if (repeat == undefined) {
        return steps;
      }
      if (repeat == "infinite") {
        return Number.MAX_VALUE;
      }
      return steps * repeat;
    },


    /**
     * Central method to apply css styles and element properties.
     * @param el {Element} The DOM element to apply the styles.
     * @param styles {Map} A map containing styles and values.
     */
    __applyStyles : function(el, styles) {
      for (var key in styles) {
        // ignore undefined values (might be a bad detection)
        if (styles[key] === undefined) {
          continue;
        }

        // apply element property value - only if a CSS property
        // is *not* available
        if (typeof el.style[key] === "undefined" && key in el) {
          el[key] = styles[key];
          continue;
        }

        var name = qx.bom.Style.getPropertyName(key) || key;
        if (qx.bom.element.Style) {
          qx.bom.element.Style.set(el, name, styles[key]);
        } else {
          el.style[name] = styles[key];
        }
      }
    },


    /**
     * Dynamic calculation of the steps time considering a max step time.
     * @param duration {Number} The duration of the animation.
     * @param keys {Array} An array containing the orderd set of key frame keys.
     * @return {Integer} The best suited step time.
     */
    __getStepTime : function(duration, keys) {
      // get min difference
      var minDiff = 100;
      for (var i=0; i < keys.length - 1; i++) {
        minDiff = Math.min(minDiff, keys[i+1] - keys[i])
      };

      var stepTime = duration * minDiff / 100;
      while (stepTime > this.__maxStepTime) {
        stepTime = stepTime / 2;
      }
      return Math.round(stepTime);
    },


    /**
     * Helper which returns the orderd keys of the key frame map.
     * @param keyFrames {Map} The map of key frames.
     * @return {Array} An orderd list of kyes.
     */
    __getOrderedKeys : function(keyFrames) {
      var keys = Object.keys(keyFrames);
      for (var i=0; i < keys.length; i++) {
        keys[i] = parseInt(keys[i], 10);
      };
      keys.sort(function(a,b) {return a-b;});
      return keys;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */

/**
 * This class is responsible for applying CSS3 transforms to plain DOM elements.
 * The implementation is mostly a cross browser wrapper for applying the
 * transforms.
 * The API is keep to the spec as close as possible.
 *
 * http://www.w3.org/TR/css3-3d-transforms/
 */
qx.Bootstrap.define("qx.bom.element.Transform",
{
  statics :
  {
    /** The dimensions of the transforms */
    __dimensions : ["X", "Y", "Z"],

    /** Internal storage of the CSS names */
    __cssKeys : qx.core.Environment.get("css.transform"),


    /**
     * Method to apply multiple transforms at once to the given element. It
     * takes a map containing the transforms you want to apply plus the values
     * e.g.<code>{scale: 2, rotate: "5deg"}</code>.
     * The values can be either singular, which means a single value will
     * be added to the CSS. If you give an array, the values will be split up
     * and each array entry will be used for the X, Y or Z dimension in that
     * order e.g. <code>{scale: [2, 0.5]}</code> will result in a element
     * double the size in X direction and half the size in Y direction.
     * Make sure your browser supports all transformations you apply.
     * @param el {Element} The element to apply the transformation.
     * @param transforms {Map} The map containing the transforms and value.
     */
    transform : function(el, transforms) {
      var transformCss = this.__mapToCss(transforms);
      if (this.__cssKeys != null) {
        var style = this.__cssKeys["name"];
        el.style[style] = transformCss;
      }
    },


    /**
     * Translates the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to translate e.g. <code>"10px"</code>.
     */
    translate : function(el, value) {
      this.transform(el, {translate: value});
    },


    /**
     * Scales the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {Number|Array} The value to scale.
     */
    scale : function(el, value) {
      this.transform(el, {scale: value});
    },


    /**
     * Rotates the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to rotate e.g. <code>"90deg"</code>.
     */
    rotate : function(el, value) {
      this.transform(el, {rotate: value});
    },


    /**
     * Skews the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to skew e.g. <code>"90deg"</code>.
     */
    skew : function(el, value) {
      this.transform(el, {skew: value});
    },


    /**
     * Converts the given map to a string which could be added to a css
     * stylesheet.
     * @param transforms {Map} The transforms map. For a detailed description,
     * take a look at the {@link #transform} method.
     * @return {String} The CSS value.
     */
    getCss : function(transforms) {
      var transformCss = this.__mapToCss(transforms);
      if (this.__cssKeys != null) {
        var style = this.__cssKeys["name"];
        return qx.bom.Style.getCssName(style) + ":" + transformCss + ";";
      }
      return "";
    },


    /**
     * Sets the transform-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     */
    setOrigin : function(el, value) {
      if (this.__cssKeys != null) {
        el.style[this.__cssKeys["origin"]] = value;
      }
    },


    /**
     * Returns the transform-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>50% 50%</code>
     */
    getOrigin : function(el) {
      if (this.__cssKeys != null) {
        return el.style[this.__cssKeys["origin"]];
      }
      return "";
    },


    /**
     * Sets the transform-style property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} Either <code>flat</code> or <code>preserve-3d</code>.
     */
    setStyle : function(el, value) {
      if (this.__cssKeys != null) {
        el.style[this.__cssKeys["style"]] = value;
      }
    },


    /**
     * Returns the transform-style property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, either <code>flat</code> or
     *   <code>preserve-3d</code>.
     */
    getStyle : function(el) {
      if (this.__cssKeys != null) {
        return el.style[this.__cssKeys["style"]];
      }
      return "";
    },


    /**
     * Sets the perspective property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     * @param el {Element} The dom element to set the property.
     * @param value {Number} The perspective layer. Numbers between 100
     *   and 5000 give the best results.
     */
    setPerspective : function(el, value) {
      if (this.__cssKeys != null) {
        el.style[this.__cssKeys["perspective"]] = value + "px";
      }
    },


    /**
     * Returns the perspective property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>500</code>
     */
    getPerspective : function(el) {
      if (this.__cssKeys != null) {
        return el.style[this.__cssKeys["perspective"]];
      }
      return "";
    },


    /**
     * Sets the perspective-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     */
    setPerspectiveOrigin : function(el, value) {
      if (this.__cssKeys != null) {
        el.style[this.__cssKeys["perspective-origin"]] = value;
      }
    },


    /**
     * Returns the perspective-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>50% 50%</code>
     */
    getPerspectiveOrigin : function(el) {
      if (this.__cssKeys != null) {
        var value = el.style[this.__cssKeys["perspective-origin"]];
        if (value != "") {
          return value;
        } else {
          var valueX = el.style[this.__cssKeys["perspective-origin"] + "X"];
          var valueY = el.style[this.__cssKeys["perspective-origin"] + "Y"];
          if (valueX != "") {
            return valueX + " " + valueY;
          }
        }
      }
      return "";
    },


    /**
     * Sets the backface-visibility property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     * @param el {Element} The dom element to set the property.
     * @param value {Boolean} <code>true</code> if the backface should be visible.
     */
    setBackfaceVisibility : function(el, value) {
      if (this.__cssKeys != null) {
        el.style[this.__cssKeys["backface-visibility"]] = value ? "visible" : "hidden";
      }
    },


    /**
     * Returns the backface-visibility property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     * @param el {Element} The dom element to read the property.
     * @return {Boolean} <code>true</code>, if the backface is visible.
     */
    getBackfaceVisibility : function(el) {
      if (this.__cssKeys != null) {
        return el.style[this.__cssKeys["backface-visibility"]] == "visible";
      }
      return true;
    },


    /**
     * Internal helper which converts the given transforms map to a valid CSS
     * string.
     * @param transforms {Map} A map containing the transforms.
     * @return {String} The CSS transforms.
     */
    __mapToCss : function(transforms) {
      var value = "";
      for (var func in transforms) {

        var params = transforms[func];
        // if an array is given
        if (qx.Bootstrap.isArray(params)) {
          for (var i=0; i < params.length; i++) {
            if (params[i] == undefined ||
              (i == 2 && !qx.core.Environment.get("css.transform.3d"))) {
              continue;
            }
            value += func + this.__dimensions[i] + "(";
            value += params[i];
            value += ") ";
          }
        // case for single values given
        } else {
          // single value case
          value += func + "(" + transforms[func] + ") ";
        }
      }

      return value;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class manages the timer used for deferred calls. All
 * {@link qx.util.DeferredCall} instances use the single timer from this class.
 */
qx.Class.define("qx.util.DeferredCallManager",
{
  extend : qx.core.Object,
  type : "singleton",


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.__calls = {};
    this.__timeoutWrapper = qx.lang.Function.bind(this.__timeout, this);
    this.__hasCalls = false;
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __timeoutId : null,
    __currentQueue : null,
    __calls : null,
    __hasCalls : null,
    __timeoutWrapper : null,


    /**
     * Schedule a deferred call
     *
     * @param deferredCall {qx.util.DeferredCall} The call to schedule
     */
    schedule : function(deferredCall)
    {
      if (this.__timeoutId == null)
      {
        this.__timeoutId = window.setTimeout(this.__timeoutWrapper, 0);
      }

      var callKey = deferredCall.toHashCode();

      // the flush is currently running and the call is already
      // scheduled
      if (this.__currentQueue && this.__currentQueue[callKey]) {
        return;
      }

      this.__calls[callKey] = deferredCall;
      this.__hasCalls = true;
    },


    /**
     * Cancel a scheduled deferred call
     *
     * @param deferredCall {qx.util.DeferredCall} The call to schedule
     */
    cancel : function(deferredCall)
    {
      var callKey = deferredCall.toHashCode();

      // the flush is currently running and the call is already
      // scheduled -> remove it from the current queue
      if(this.__currentQueue && this.__currentQueue[callKey])
      {
        this.__currentQueue[callKey] = null;
        return;
      }

      delete this.__calls[callKey];

      // stop timer if no other calls are waiting
      if(qx.lang.Object.isEmpty(this.__calls) && this.__timeoutId != null)
      {
        window.clearTimeout(this.__timeoutId);
        this.__timeoutId = null;
      }
    },


    /**
     * Helper function for the timer.
     *
     * @signature function()
     */
    __timeout : qx.event.GlobalError.observeMethod(function()
    {
      this.__timeoutId = null;

      // the queue may change while doing the flush so we work on a copy of
      // the queue and loop while the queue has any entries.
      while(this.__hasCalls)
      {
        this.__currentQueue = qx.lang.Object.clone(this.__calls);
        this.__calls = {};
        this.__hasCalls = false;

        for (var key in this.__currentQueue)
        {
          var call = this.__currentQueue[key];
          if (call)
          {
            this.__currentQueue[key] = null;
            call.call();
          }
        }
      }

      this.__currentQueue = null;
    })

  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__timeoutId != null) {
      window.clearTimeout(this.__timeoutId);
    }
    this.__timeoutWrapper = this.__calls = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class represents a wrapper for functions, which should be called after
 * the current thread of JavaScript has finished and the control is returned to
 * the browser. The wrapped function will at most be called once after the control
 * has been given back to the browser, independent of the number of {@link #call}
 * calls.
 *
 * @require(qx.util.DeferredCallManager)
 */
qx.Class.define("qx.util.DeferredCall",
{
  extend : qx.core.Object,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param callback {Function} The callback
   * @param context {Object?window} the context in which the function will be called.
   */
  construct : function(callback, context)
  {
    this.base(arguments);

    this.__callback = callback;
    this.__context = context || null;
    this.__manager = qx.util.DeferredCallManager.getInstance();
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __callback : null,
    __context : null,
    __manager : null,

    /**
     * Prevent the callback from being called.
     */
    cancel : function() {
      this.__manager.cancel(this);
    },


    /**
     * Issue a deferred call of the callback.
     */
    schedule : function() {
      this.__manager.schedule(this);
    },


    /**
     * Calls the callback directly.
     */
    call : function() {

      if (qx.core.Environment.get("qx.debug")) {
        // warn if the context is disposed
        var context = this.__context;
        if (context && context.isDisposed && context.isDisposed()) {
          this.warn(
            "The context object '" + context + "' of the defered call '" +
            this + "'is already disposed."
          );
        }
      }

      this.__context ? this.__callback.apply(this.__context) : this.__callback();
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.cancel();
    this.__context = this.__callback = this.__manager = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * High-performance, high-level DOM element creation and management.
 *
 * Includes support for HTML and style attributes. Elements also have
 * got a powerful children and visibility management.
 *
 * Processes DOM insertion and modification with advanced logic
 * to reduce the real transactions.
 *
 * From the view of the parent you can use the following children management
 * methods:
 * {@link #getChildren}, {@link #indexOf}, {@link #hasChild}, {@link #add},
 * {@link #addAt}, {@link #remove}, {@link #removeAt}, {@link #removeAll}
 *
 * Each child itself also has got some powerful methods to control its
 * position:
 * {@link #getParent}, {@link #free},
 * {@link #insertInto}, {@link #insertBefore}, {@link #insertAfter},
 * {@link #moveTo}, {@link #moveBefore}, {@link #moveAfter},
 *
 * @require(qx.module.Animation)
 */
qx.Class.define("qx.html.Element",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a new Element
   *
   * @param tagName {String?"div"} Tag name of the element to create
   * @param styles {Map?null} optional map of CSS styles, where the key is the name
   *    of the style and the value is the value to use.
   * @param attributes {Map?null} optional map of element attributes, where the
   *    key is the name of the attribute and the value is the value to use.
   */
  construct : function(tagName, styles, attributes)
  {
    this.base(arguments);

    // {String} Set tag name
    this.__nodeName = tagName || "div";

    this.__styleValues = styles || null;
    this.__attribValues = attributes || null;
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      STATIC DATA
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} If debugging should be enabled */
    DEBUG : false,


    /** @type {Map} Contains the modified {@link qx.html.Element}s. The key is the hash code. */
    _modified : {},


    /** @type {Map} Contains the {@link qx.html.Element}s which should get hidden or visible at the next flush. The key is the hash code. */
    _visibility : {},


    /** @type {Map} Contains the {@link qx.html.Element}s which should scrolled at the next flush */
    _scroll : {},


    /** @type {Array} List of post actions for elements. The key is the action name. The value the {@link qx.html.Element}. */
    _actions : [],


    /**  @type {Map} List of all selections. */
    __selection : {},


    __focusHandler : null,


    __mouseCapture : null,






    /*
    ---------------------------------------------------------------------------
      PUBLIC ELEMENT FLUSH
    ---------------------------------------------------------------------------
    */

    /**
     * Schedule a deferred element queue flush. If the widget subsystem is used
     * this method gets overwritten by {@link qx.ui.core.queue.Manager}.
     *
     * @param job {String} The job descriptor. Should always be <code>"element"</code>.
     */
    _scheduleFlush : function(job) {
      qx.html.Element.__deferredCall.schedule();
    },


    /**
     * Flush the global modified list
     */
    flush : function()
    {
      var obj;

      if (qx.core.Environment.get("qx.debug"))
      {
        if (this.DEBUG) {
          qx.log.Logger.debug(this, "Flushing elements...");
        }
      }


      // blur elements, which will be removed
      var focusHandler = this.__getFocusHandler();
      var focusedDomElement = focusHandler.getFocus();
      if (focusedDomElement && this.__willBecomeInvisible(focusedDomElement)) {
        focusHandler.blur(focusedDomElement);
      }

      // decativate elements, which will be removed
      var activeDomElement = focusHandler.getActive();
      if (activeDomElement && this.__willBecomeInvisible(activeDomElement)) {
        qx.bom.Element.deactivate(activeDomElement);
      }

      // release capture for elements, which will be removed
      var captureDomElement = this.__getCaptureElement();
      if (captureDomElement && this.__willBecomeInvisible(captureDomElement)) {
        qx.bom.Element.releaseCapture(captureDomElement);
      }


      var later = [];
      var modified = this._modified;

      for (var hc in modified)
      {
        obj = modified[hc];
        // Ignore all hidden elements except iframes
        // but keep them until they get visible (again)
        if (obj.__willBeSeeable() || obj.classname == "qx.html.Iframe")
        {
          // Separately queue rendered elements
          if (obj.__element && qx.dom.Hierarchy.isRendered(obj.__element)) {
            later.push(obj);
          }

          // Flush invisible elements first
          else
          {
            if (qx.core.Environment.get("qx.debug"))
            {
              if (this.DEBUG) {
                obj.debug("Flush invisible element");
              }
            }

            obj.__flush();
          }

          // Cleanup modification list
          delete modified[hc];
        }
      }

      for (var i=0, l=later.length; i<l; i++)
      {
        obj = later[i];

        if (qx.core.Environment.get("qx.debug"))
        {
          if (this.DEBUG) {
            obj.debug("Flush rendered element");
          }
        }

        obj.__flush();
      }



      // Process visibility list
      var visibility = this._visibility;

      for (var hc in visibility)
      {
        obj = visibility[hc];

        var element = obj.__element;
        if (!element)
        {
          delete visibility[hc];
          continue;
        }

        if (qx.core.Environment.get("qx.debug"))
        {
          if (this.DEBUG) {
            qx.log.Logger.debug(this, "Switching visibility to: " + obj.__visible);
          }
        }

        // hiding or showind an object and deleting it right after that may
        // cause an disposed object in the visibility queue [BUG #3607]
        if (!obj.$$disposed) {
          element.style.display = obj.__visible ? "" : "none";
          // also hide the element (fixed some rendering problem in IE<8 & IE8 quirks)
          if ((qx.core.Environment.get("engine.name") == "mshtml"))
          {
            if (!(document.documentMode >= 8)) {
              element.style.visibility = obj.__visible ? "visible" : "hidden";
            }
          }
        }

        delete visibility[hc];
      }

      // Process scroll list
      var scroll = this._scroll;
      for (var hc in scroll)
      {
        obj = scroll[hc];
        var elem = obj.__element;

        if (elem && elem.offsetWidth)
        {
          var done = true;

          // ScrollToX
          if (obj.__lazyScrollX != null)
          {
            obj.__element.scrollLeft = obj.__lazyScrollX;
            delete obj.__lazyScrollX;
          }

          // ScrollToY
          if (obj.__lazyScrollY != null)
          {
            obj.__element.scrollTop = obj.__lazyScrollY;
            delete obj.__lazyScrollY;
          }

          // ScrollIntoViewX
          var intoViewX = obj.__lazyScrollIntoViewX;
          if (intoViewX != null)
          {
            var child = intoViewX.element.getDomElement();

            if (child && child.offsetWidth)
            {
              qx.bom.element.Scroll.intoViewX(child, elem, intoViewX.align);
              delete obj.__lazyScrollIntoViewX;
            }
            else
            {
              done = false;
            }
          }

          // ScrollIntoViewY
          var intoViewY = obj.__lazyScrollIntoViewY;
          if (intoViewY != null)
          {
            var child = intoViewY.element.getDomElement();

            if (child && child.offsetWidth)
            {
              qx.bom.element.Scroll.intoViewY(child, elem, intoViewY.align);
              delete obj.__lazyScrollIntoViewY;
            }
            else
            {
              done = false;
            }
          }

          // Clear flag if all things are done
          // Otherwise wait for the next flush
          if (done) {
            delete scroll[hc];
          }
        }
      }


      var activityEndActions = {
        "releaseCapture": 1,
        "blur": 1,
        "deactivate": 1
      }

      // Process action list
      for (var i=0; i<this._actions.length; i++)
      {
        var action = this._actions[i];
        var element = action.element.__element;
        if (!element || !activityEndActions[action.type] && !action.element.__willBeSeeable()) {
          continue;
        }
        var args = action.args;
        args.unshift(element);
        qx.bom.Element[action.type].apply(qx.bom.Element, args);
      }
      this._actions = [];

      // Process selection
      for (var hc in this.__selection)
      {
        var selection = this.__selection[hc];
        var elem = selection.element.__element;
        if (elem)
        {
          qx.bom.Selection.set(elem, selection.start, selection.end);
          delete this.__selection[hc];
        }
      }

      // Fire appear/disappear events
      qx.event.handler.Appear.refresh();
    },


    /**
     * Get the focus handler
     *
     * @return {qx.event.handler.Focus} The focus handler
     */
    __getFocusHandler : function()
    {
      if (!this.__focusHandler)
      {
        var eventManager = qx.event.Registration.getManager(window);
        this.__focusHandler = eventManager.getHandler(qx.event.handler.Focus);
      }
      return this.__focusHandler;
    },


    /**
     * Get the mouse capture element
     *
     * @return {Element} The mouse capture DOM element
     */
    __getCaptureElement : function()
    {
      if (!this.__mouseCapture)
      {
        var eventManager = qx.event.Registration.getManager(window);
        this.__mouseCapture = eventManager.getDispatcher(qx.event.dispatch.MouseCapture);
      }
      return this.__mouseCapture.getCaptureElement();
    },


    /**
     * Whether the given DOM element will become invisible after the flush
     *
     * @param domElement {Element} The DOM element to check
     * @return {Boolean} Whether the element will become invisible
     */
    __willBecomeInvisible : function(domElement)
    {
      var element = qx.core.ObjectRegistry.fromHashCode(domElement.$$element);
      return element && !element.__willBeSeeable();
    }
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      PROTECTED HELPERS/DATA
    ---------------------------------------------------------------------------
    */

    __nodeName : null,

    /** @type {Element} DOM element of this object */
    __element : null,

    /** @type {Boolean} Marker for always visible root nodes (often the body node) */
    __root : false,

    /** @type {Boolean} Whether the element should be included in the render result */
    __included : true,

    /** @type {Boolean} Whether the element should be visible in the render result */
    __visible : true,

    __lazyScrollIntoViewX : null,
    __lazyScrollIntoViewY : null,

    __lazyScrollX : null,
    __lazyScrollY : null,

    __styleJobs : null,
    __attribJobs : null,
    __propertyJobs : null,

    __styleValues : null,
    __attribValues : null,
    __propertyValues : null,
    __eventValues : null,

    __children : null,
    __modifiedChildren : null,

    __parent : null,

    /**
     * Add the element to the global modification list.
     *
     */
    _scheduleChildrenUpdate : function()
    {
      if (this.__modifiedChildren) {
        return;
      }

      this.__modifiedChildren = true;

      qx.html.Element._modified[this.$$hash] = this;
      qx.html.Element._scheduleFlush("element");
    },


    /**
     * Internal helper to generate the DOM element
     *
     * @return {Element} DOM element
     */
    _createDomElement : function() {
      return qx.dom.Element.create(this.__nodeName);
    },






    /*
    ---------------------------------------------------------------------------
      FLUSH OBJECT
    ---------------------------------------------------------------------------
    */

    /**
     * Syncs data of an HtmlElement object to the DOM.
     *
     */
    __flush : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this.DEBUG) {
          this.debug("Flush: " + this.getAttribute("id"));
        }
      }

      var length;
      var children = this.__children;
      if (children)
      {
        length = children.length;
        var child;
        for (var i=0; i<length; i++)
        {
          child = children[i];

          if (child.__visible && child.__included && !child.__element) {
            child.__flush();
          }
        }
      }

      if (!this.__element)
      {
        this.__element = this._createDomElement();
        this.__element.$$element = this.$$hash;

        this._copyData(false);

        if (children && length > 0) {
          this._insertChildren();
        }
      }
      else
      {
        this._syncData();

        if (this.__modifiedChildren) {
          this._syncChildren();
        }
      }

      delete this.__modifiedChildren;
    },





    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR CHILDREN FLUSH
    ---------------------------------------------------------------------------
    */

    /**
     * Append all child nodes to the DOM
     * element. This function is used when the element is initially
     * created. After this initial apply {@link #_syncChildren} is used
     * instead.
     *
     */
    _insertChildren : function()
    {
      var children = this.__children;
      var length = children.length;
      var child;

      if (length > 2)
      {
        var domElement = document.createDocumentFragment();
        for (var i=0; i<length; i++)
        {
          child = children[i];
          if (child.__element && child.__included) {
            domElement.appendChild(child.__element);
          }
        }

        this.__element.appendChild(domElement);
      }
      else
      {
        var domElement = this.__element;
        for (var i=0; i<length; i++)
        {
          child = children[i];
          if (child.__element && child.__included) {
            domElement.appendChild(child.__element);
          }
        }
      }
    },


    /**
     * Syncronize internal children hierarchy to the DOM. This is used
     * for further runtime updates after the element has been created
     * initially.
     *
     */
    _syncChildren : function()
    {
      var ObjectRegistry = qx.core.ObjectRegistry;

      var dataChildren = this.__children;
      var dataLength = dataChildren.length;
      var dataChild;
      var dataEl;

      var domParent = this.__element;
      var domChildren = domParent.childNodes;
      var domPos = 0;
      var domEl;

      if (qx.core.Environment.get("qx.debug")) {
        var domOperations = 0;
      }

      // Remove children from DOM which are excluded or remove first
      for (var i=domChildren.length-1; i>=0; i--)
      {
        domEl = domChildren[i];
        dataEl = ObjectRegistry.fromHashCode(domEl.$$element);

        if (!dataEl || !dataEl.__included || dataEl.__parent !== this)
        {
          domParent.removeChild(domEl);

          if (qx.core.Environment.get("qx.debug")) {
            domOperations++;
          }
        }
      }

      // Start from beginning and bring DOM in sync
      // with the data structure
      for (var i=0; i<dataLength; i++)
      {
        dataChild = dataChildren[i];

        // Only process visible childs
        if (dataChild.__included)
        {
          dataEl = dataChild.__element;
          domEl = domChildren[domPos];

          if (!dataEl) {
            continue;
          }

          // Only do something when out of sync
          // If the data element is not there it may mean that it is still
          // marked as visible=false
          if (dataEl != domEl)
          {
            if (domEl) {
              domParent.insertBefore(dataEl, domEl);
            } else {
              domParent.appendChild(dataEl);
            }

            if (qx.core.Environment.get("qx.debug")) {
              domOperations++
            }
          }

          // Increase counter
          domPos++;
        }
      }

      // User feedback
      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.html.Element.DEBUG) {
          this.debug("Synced DOM with " + domOperations + " operations");
        }
      }
    },





    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR ATTRIBUTE/STYLE/EVENT FLUSH
    ---------------------------------------------------------------------------
    */

    /**
     * Copies data between the internal representation and the DOM. This
     * simply copies all the data and only works well directly after
     * element creation. After this the data must be synced using {@link #_syncData}
     *
     * @param fromMarkup {Boolean} Whether the copy should respect styles
     *   given from markup
     */
    _copyData : function(fromMarkup)
    {
      var elem = this.__element;

      // Copy attributes
      var data = this.__attribValues;
      if (data)
      {
        var Attribute = qx.bom.element.Attribute;

        for (var key in data) {
          Attribute.set(elem, key, data[key]);
        }
      }

      // Copy styles
      var data = this.__styleValues;
      if (data)
      {
        var Style = qx.bom.element.Style;
        if (fromMarkup) {
          Style.setStyles(elem, data);
        }
        else
        {
          // Set styles at once which is a lot faster in most browsers
          // compared to separate modifications of many single style properties.
          Style.setCss(elem, Style.compile(data));
        }
      }

      // Copy properties
      var data = this.__propertyValues;
      if (data)
      {
        for (var key in data) {
          this._applyProperty(key, data[key]);
        }
      }

      // Attach events
      var data = this.__eventValues;
      if (data)
      {
        // Import listeners
        qx.event.Registration.getManager(elem).importListeners(elem, data);

        // Cleanup event map
        // Events are directly attached through event manager
        // after initial creation. This differs from the
        // handling of styles and attributes where queuing happens
        // through the complete runtime of the application.
        delete this.__eventValues;
      }
    },


    /**
     * Syncronizes data between the internal representation and the DOM. This
     * is the counterpart of {@link #_copyData} and is used for further updates
     * after the element has been created.
     *
     */
    _syncData : function()
    {
      var elem = this.__element;

      var Attribute = qx.bom.element.Attribute;
      var Style = qx.bom.element.Style;

      // Sync attributes
      var jobs = this.__attribJobs;
      if (jobs)
      {
        var data = this.__attribValues;
        if (data)
        {
          var value;
          for (var key in jobs)
          {
            value = data[key];

            if (value !== undefined) {
              Attribute.set(elem, key, value);
            } else {
              Attribute.reset(elem, key);
            }
          }
        }

        this.__attribJobs = null;
      }

      // Sync styles
      var jobs = this.__styleJobs;
      if (jobs)
      {
        var data = this.__styleValues;
        if (data)
        {
          var styles = {};
          for (var key in jobs) {
            styles[key] = data[key]
          }

          Style.setStyles(elem, styles);
        }

        this.__styleJobs = null;
      }

      // Sync misc
      var jobs = this.__propertyJobs;
      if (jobs)
      {
        var data = this.__propertyValues;
        if (data)
        {
          var value;
          for (var key in jobs) {
            this._applyProperty(key, data[key]);
          }
        }

        this.__propertyJobs = null;
      }

      // Note: Events are directly kept in sync
    },








    /*
    ---------------------------------------------------------------------------
      PRIVATE HELPERS/DATA
    ---------------------------------------------------------------------------
    */

    /**
     * Walk up the internal children hierarchy and
     * look if one of the children is marked as root.
     *
     * This method is quite performance hungry as it
     * really walks up recursively.
     * @return {Boolean} <code>true</code> if the element will be seeable
     */
    __willBeSeeable : function()
    {
      var pa = this;

      // Any chance to cache this information in the parents?
      while(pa)
      {
        if (pa.__root) {
          return true;
        }

        if (!pa.__included || !pa.__visible) {
          return false;
        }

        pa = pa.__parent;
      }

      return false;
    },


    /**
     * Internal helper for all children addition needs
     *
     * @param child {var} the element to add
     * @throws {Error} if the given element is already a child
     *     of this element
     */
    __addChildHelper : function(child)
    {
      if (child.__parent === this) {
        throw new Error("Child is already in: " + child);
      }

      if (child.__root) {
        throw new Error("Root elements could not be inserted into other ones.");
      }

      // Remove from previous parent
      if (child.__parent) {
        child.__parent.remove(child);
      }

      // Convert to child of this object
      child.__parent = this;

      // Prepare array
      if (!this.__children) {
        this.__children = [];
      }

      // Schedule children update
      if (this.__element) {
        this._scheduleChildrenUpdate();
      }
    },


    /**
     * Internal helper for all children removal needs
     *
     * @param child {qx.html.Element} the removed element
     * @throws {Error} if the given element is not a child
     *     of this element
     */
    __removeChildHelper : function(child)
    {
      if (child.__parent !== this) {
        throw new Error("Has no child: " + child);
      }

      // Schedule children update
      if (this.__element) {
        this._scheduleChildrenUpdate();
      }

      // Remove reference to old parent
      delete child.__parent;
    },


    /**
     * Internal helper for all children move needs
     *
     * @param child {qx.html.Element} the moved element
     * @throws {Error} if the given element is not a child
     *     of this element
     */
    __moveChildHelper : function(child)
    {
      if (child.__parent !== this) {
        throw new Error("Has no child: " + child);
      }

      // Schedule children update
      if (this.__element) {
        this._scheduleChildrenUpdate();
      }
    },




    /*
    ---------------------------------------------------------------------------
      CHILDREN MANAGEMENT (EXECUTED ON THE PARENT)
    ---------------------------------------------------------------------------
    */

    /**
     * Returns a copy of the internal children structure.
     *
     * Please do not modify the array in place. If you need
     * to work with the data in such a way make yourself
     * a copy of the data first.
     *
     * @return {Array} the children list
     */
    getChildren : function() {
      return this.__children || null;
    },


    /**
     * Get a child element at the given index
     *
     * @param index {Integer} child index
     * @return {qx.html.Element|null} The child element or <code>null</code> if
     *     no child is found at that index.
     */
    getChild : function(index)
    {
      var children = this.__children;
      return children && children[index] || null;
    },


    /**
     * Returns whether the element has any child nodes
     *
     * @return {Boolean} Whether the element has any child nodes
     */
    hasChildren : function()
    {
      var children = this.__children;
      return children && children[0] !== undefined;
    },


    /**
     * Find the position of the given child
     *
     * @param child {qx.html.Element} the child
     * @return {Integer} returns the position. If the element
     *     is not a child <code>-1</code> will be returned.
     */
    indexOf : function(child)
    {
      var children = this.__children;
      return children ? children.indexOf(child) : -1;
    },


    /**
     * Whether the given element is a child of this element.
     *
     * @param child {qx.html.Element} the child
     * @return {Boolean} Returns <code>true</code> when the given
     *    element is a child of this element.
     */
    hasChild : function(child)
    {
      var children = this.__children;
      return children && children.indexOf(child) !== -1;
    },


    /**
     * Append all given children at the end of this element.
     *
     * @param varargs {qx.html.Element} elements to insert
     * @return {qx.html.Element} this object (for chaining support)
     */
    add : function(varargs)
    {
      if (arguments[1])
      {
        for (var i=0, l=arguments.length; i<l; i++) {
          this.__addChildHelper(arguments[i]);
        }

        this.__children.push.apply(this.__children, arguments);
      }
      else
      {
        this.__addChildHelper(varargs);
        this.__children.push(varargs);
      }

      // Chaining support
      return this;
    },


    /**
     * Inserts a new element into this element at the given position.
     *
     * @param child {qx.html.Element} the element to insert
     * @param index {Integer} the index (starts at 0 for the
     *     first child) to insert (the index of the following
     *     children will be increased by one)
     * @return {qx.html.Element} this object (for chaining support)
     */
    addAt : function(child, index)
    {
      this.__addChildHelper(child);
      qx.lang.Array.insertAt(this.__children, child, index);

      // Chaining support
      return this;
    },


    /**
     * Removes all given children
     *
     * @param childs {qx.html.Element} children to remove
     * @return {qx.html.Element} this object (for chaining support)
     */
    remove : function(childs)
    {
      var children = this.__children;
      if (!children) {
        return this;
      }

      if (arguments[1])
      {
        var child;
        for (var i=0, l=arguments.length; i<l; i++)
        {
          child = arguments[i];

          this.__removeChildHelper(child);
          qx.lang.Array.remove(children, child);
        }
      }
      else
      {
        this.__removeChildHelper(childs);
        qx.lang.Array.remove(children, childs);
      }

      // Chaining support
      return this;
    },


    /**
     * Removes the child at the given index
     *
     * @param index {Integer} the position of the
     *     child (starts at 0 for the first child)
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeAt : function(index)
    {
      var children = this.__children;
      if (!children) {
        throw new Error("Has no children!");
      }

      var child = children[index];
      if (!child) {
        throw new Error("Has no child at this position!");
      }

      this.__removeChildHelper(child);
      qx.lang.Array.removeAt(this.__children, index);

      // Chaining support
      return this;
    },


    /**
     * Remove all children from this element.
     *
     * @return {qx.html.Element} A reference to this.
     */
    removeAll : function()
    {
      var children = this.__children;
      if (children)
      {
        for (var i=0, l=children.length; i<l; i++) {
          this.__removeChildHelper(children[i]);
        }

        // Clear array
        children.length = 0;
      }

      // Chaining support
      return this;
    },






    /*
    ---------------------------------------------------------------------------
      CHILDREN MANAGEMENT (EXECUTED ON THE CHILD)
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the parent of this element.
     *
     * @return {qx.html.Element|null} The parent of this element
     */
    getParent : function() {
      return this.__parent || null;
    },


    /**
     * Insert self into the given parent. Normally appends self to the end,
     * but optionally a position can be defined. With index <code>0</code> it
     * will be inserted at the begin.
     *
     * @param parent {qx.html.Element} The new parent of this element
     * @param index {Integer?null} Optional position
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertInto : function(parent, index)
    {
      parent.__addChildHelper(this);

      if (index == null) {
        parent.__children.push(this);
      } else {
        qx.lang.Array.insertAt(this.__children, this, index);
      }

      return this;
    },


    /**
     * Insert self before the given (related) element
     *
     * @param rel {qx.html.Element} the related element
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertBefore : function(rel)
    {
      var parent = rel.__parent;

      parent.__addChildHelper(this);
      qx.lang.Array.insertBefore(parent.__children, this, rel);

      return this;
    },


    /**
     * Insert self after the given (related) element
     *
     * @param rel {qx.html.Element} the related element
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertAfter : function(rel)
    {
      var parent = rel.__parent;

      parent.__addChildHelper(this);
      qx.lang.Array.insertAfter(parent.__children, this, rel);

      return this;
    },


    /**
     * Move self to the given index in the current parent.
     *
     * @param index {Integer} the index (starts at 0 for the first child)
     * @return {qx.html.Element} this object (for chaining support)
     * @throws {Error} when the given element is not child
     *      of this element.
     */
    moveTo : function(index)
    {
      var parent = this.__parent;

      parent.__moveChildHelper(this);

      var oldIndex = parent.__children.indexOf(this);

      if (oldIndex === index) {
        throw new Error("Could not move to same index!");
      } else if (oldIndex < index) {
        index--;
      }

      qx.lang.Array.removeAt(parent.__children, oldIndex);
      qx.lang.Array.insertAt(parent.__children, this, index);

      return this;
    },


    /**
     * Move self before the given (related) child.
     *
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    moveBefore : function(rel)
    {
      var parent = this.__parent;
      return this.moveTo(parent.__children.indexOf(rel));
    },


    /**
     * Move self after the given (related) child.
     *
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    moveAfter : function(rel)
    {
      var parent = this.__parent;
      return this.moveTo(parent.__children.indexOf(rel) + 1);
    },


    /**
     * Remove self from the current parent.
     *
     * @return {qx.html.Element} this object (for chaining support)
     */
    free : function()
    {
      var parent = this.__parent;
      if (!parent) {
        throw new Error("Has no parent to remove from.");
      }

      if (!parent.__children) {
        return this;
      }

      parent.__removeChildHelper(this);
      qx.lang.Array.remove(parent.__children, this);

      return this;
    },






    /*
    ---------------------------------------------------------------------------
      DOM ELEMENT ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the DOM element (if created). Please use this with caution.
     * It is better to make all changes to the object itself using the public
     * API rather than to the underlying DOM element.
     *
     * @return {Element|null} The DOM element node, if available.
     */
    getDomElement : function() {
      return this.__element || null;
    },


    /**
     * Returns the nodeName of the DOM element.
     *
     * @return {String} The node name
     */
    getNodeName : function() {
      return this.__nodeName;
    },

    /**
     * Sets the nodeName of the DOM element.
     *
     * @param name {String} The node name
     */
    setNodeName : function(name) {
      this.__nodeName = name;
    },

    /**
     * Sets the element's root flag, which indicates
     * whether the element should be a root element or not.
     * @param root {Boolean} The root flag.
     */
    setRoot : function(root) {
      this.__root = root;
    },

    /**
     * Uses existing markup for this element. This is mainly used
     * to insert pre-built markup blocks into the element hierarchy.
     *
     * @param html {String} HTML markup with one root element
     *   which is used as the main element for this instance.
     * @return {Element} The created DOM element
     */
    useMarkup : function(html)
    {
      if (this.__element) {
        throw new Error("Could not overwrite existing element!");
      }

      // Prepare extraction
      // We have a IE specific issue with "Unknown error" messages
      // when we try to use the same DOM node again. I am not sure
      // why this happens. Would be a good performance improvement,
      // but does not seem to work.
      if (qx.core.Environment.get("engine.name") == "mshtml") {
        var helper = document.createElement("div");
      } else {
        var helper = qx.dom.Element.getHelperElement();
      }

      // Extract first element
      helper.innerHTML = html;
      this.useElement(helper.firstChild);

      return this.__element;
    },


    /**
     * Uses an existing element instead of creating one. This may be interesting
     * when the DOM element is directly needed to add content etc.
     *
     * @param elem {Element} Element to reuse
     */
    useElement : function(elem)
    {
      if (this.__element) {
        throw new Error("Could not overwrite existing element!");
      }

      // Use incoming element
      this.__element = elem;
      this.__element.$$element = this.$$hash;

      // Copy currently existing data over to element
      this._copyData(true);
    },


    /**
     * Whether the element is focusable (or will be when created)
     *
     * @return {Boolean} <code>true</code> when the element is focusable.
     */
    isFocusable : function()
    {
      var tabIndex = this.getAttribute("tabIndex");
      if (tabIndex >= 1) {
        return true;
      }

      var focusable = qx.event.handler.Focus.FOCUSABLE_ELEMENTS;
      if (tabIndex >= 0 && focusable[this.__nodeName]) {
        return true;
      }

      return false;
    },


    /**
     * Set whether the element is selectable. It uses the qooxdoo attribute
     * qxSelectable with the values 'on' or 'off'.
     * In webkit, a special css property will be used (-webkit-user-select).
     *
     * @param value {Boolean} True, if the element should be selectable.
     */
    setSelectable : function(value)
    {
      this.setAttribute("qxSelectable", value ? "on" : "off");
      var userSelect = qx.core.Environment.get("css.userselect");
      if (userSelect) {
        this.setStyle(userSelect, value ? "text" :
          qx.core.Environment.get("css.userselect.none"));
      }
    },


    /**
     * Whether the element is natively focusable (or will be when created)
     *
     * This ignores the configured tabIndex.
     *
     * @return {Boolean} <code>true</code> when the element is focusable.
     */
    isNativelyFocusable : function() {
      return !!qx.event.handler.Focus.FOCUSABLE_ELEMENTS[this.__nodeName];
    },







    /*
    ---------------------------------------------------------------------------
      EXCLUDE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Marks the element as included which means it will be moved into
     * the DOM again and synced with the internal data representation.
     *
     * @return {qx.html.Element} this object (for chaining support)
     */
    include : function()
    {
      if (this.__included) {
        return this;
      }

      delete this.__included;

      if (this.__parent) {
        this.__parent._scheduleChildrenUpdate();
      }

      return this;
    },


    /**
     * Marks the element as excluded which means it will be removed
     * from the DOM and ignored for updates until it gets included again.
     *
     * @return {qx.html.Element} this object (for chaining support)
     */
    exclude : function()
    {
      if (!this.__included) {
        return this;
      }

      this.__included = false;

      if (this.__parent) {
        this.__parent._scheduleChildrenUpdate();
      }

      return this;
    },


    /**
     * Whether the element is part of the DOM
     *
     * @return {Boolean} Whether the element is part of the DOM.
     */
    isIncluded : function() {
      return this.__included === true;
    },




    /*
    ---------------------------------------------------------------------------
      ANIMATION SUPPORT
    ---------------------------------------------------------------------------
    */
    /**
     * Fades in the element.
     * @param duration {Number} Time in ms.
     * @return {qx.bom.element.AnimationHandle} The animation handle to react for
     *   the fade animation.
     */
    fadeIn : function(duration) {
      var col = qxWeb(this.__element);
      if (col.isPlaying()) {
        col.stop();
      }
      // create the element right away
      if (!this.__element) {
        this.__flush();
        col.push(this.__element);
      }
      if (this.__element) {
        col.fadeIn(duration);
        return col.getAnimationHandles()[0];
      }
    },


    /**
     * Fades out the element.
     * @param duration {Number} Time in ms.
     * @return {qx.bom.element.AnimationHandle} The animation handle to react for
     *   the fade animation.
     */
    fadeOut : function(duration) {
      var col = qxWeb(this.__element);
      if (col.isPlaying()) {
        col.stop();
      }

      if (this.__element) {
        col.fadeOut(duration).once("animationEnd", function() {
          this.hide();
          qx.html.Element.flush();
        }, this);
        return col.getAnimationHandles()[0];
      }
    },




    /*
    ---------------------------------------------------------------------------
      VISIBILITY SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Marks the element as visible which means that a previously applied
     * CSS style of display=none gets removed and the element will inserted
     * into the DOM, when this had not already happened before.
     *
     * @return {qx.html.Element} this object (for chaining support)
     */
    show : function()
    {
      if (this.__visible) {
        return this;
      }

      if (this.__element)
      {
        qx.html.Element._visibility[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      // Must be sure that the element gets included into the DOM.
      if (this.__parent) {
        this.__parent._scheduleChildrenUpdate();
      }

      delete this.__visible;
      return this;
    },


    /**
     * Marks the element as hidden which means it will kept in DOM (if it
     * is already there, but configured hidden using a CSS style of display=none).
     *
     * @return {qx.html.Element} this object (for chaining support)
     */
    hide : function()
    {
      if (!this.__visible) {
        return this;
      }

      if (this.__element)
      {
        qx.html.Element._visibility[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      this.__visible = false;
      return this;
    },


    /**
     * Whether the element is visible.
     *
     * Please note: This does not control the visibility or parent inclusion recursively.
     *
     * @return {Boolean} Returns <code>true</code> when the element is configured
     *   to be visible.
     */
    isVisible : function() {
      return this.__visible === true;
    },







    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Scrolls the given child element into view. Only scrolls children.
     * Do not influence elements on top of this element.
     *
     * If the element is currently invisible it gets scrolled automatically
     * at the next time it is visible again (queued).
     *
     * @param elem {qx.html.Element} The element to scroll into the viewport.
     * @param align {String?null} Alignment of the element. Allowed values:
     *   <code>left</code> or <code>right</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param direct {Boolean?true} Whether the execution should be made
     *   directly when possible
     */
    scrollChildIntoViewX : function(elem, align, direct)
    {
      var thisEl = this.__element;
      var childEl = elem.getDomElement();

      if (direct !== false && thisEl && thisEl.offsetWidth && childEl && childEl.offsetWidth)
      {
        qx.bom.element.Scroll.intoViewX(childEl, thisEl, align);
      }
      else
      {
        this.__lazyScrollIntoViewX =
        {
          element : elem,
          align : align
        };

        qx.html.Element._scroll[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      delete this.__lazyScrollX;
    },


    /**
     * Scrolls the given child element into view. Only scrolls children.
     * Do not influence elements on top of this element.
     *
     * If the element is currently invisible it gets scrolled automatically
     * at the next time it is visible again (queued).
     *
     * @param elem {qx.html.Element} The element to scroll into the viewport.
     * @param align {String?null} Alignment of the element. Allowed values:
     *   <code>top</code> or <code>bottom</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param direct {Boolean?true} Whether the execution should be made
     *   directly when possible
     */
    scrollChildIntoViewY : function(elem, align, direct)
    {
      var thisEl = this.__element;
      var childEl = elem.getDomElement();

      if (direct !== false && thisEl && thisEl.offsetWidth && childEl && childEl.offsetWidth)
      {
        qx.bom.element.Scroll.intoViewY(childEl, thisEl, align);
      }
      else
      {
        this.__lazyScrollIntoViewY =
        {
          element : elem,
          align : align
        };

        qx.html.Element._scroll[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      delete this.__lazyScrollY;
    },


    /**
     * Scrolls the element to the given left position.
     *
     * @param x {Integer} Horizontal scroll position
     * @param lazy {Boolean?false} Whether the scrolling should be performed
     *    during element flush.
     */
    scrollToX : function(x, lazy)
    {
      var thisEl = this.__element;
      if (lazy !== true && thisEl && thisEl.offsetWidth)
      {
        thisEl.scrollLeft = x;
        delete this.__lazyScrollX;
      }
      else
      {
        this.__lazyScrollX = x;
        qx.html.Element._scroll[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      delete this.__lazyScrollIntoViewX;
    },


    /**
     * Get the horizontal scroll position.
     *
     * @return {Integer} Horizontal scroll position
     */
    getScrollX : function()
    {
      var thisEl = this.__element;
      if (thisEl) {
        return thisEl.scrollLeft;
      }

      return this.__lazyScrollX || 0;
    },


    /**
     * Scrolls the element to the given top position.
     *
     * @param y {Integer} Vertical scroll position
     * @param lazy {Boolean?false} Whether the scrolling should be performed
     *    during element flush.
     */
    scrollToY : function(y, lazy)
    {
      var thisEl = this.__element;
      if (lazy !== true && thisEl && thisEl.offsetWidth)
      {
        thisEl.scrollTop = y;
        delete this.__lazyScrollY;
      }
      else
      {
        this.__lazyScrollY = y;
        qx.html.Element._scroll[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      delete this.__lazyScrollIntoViewY;
    },


    /**
     * Get the vertical scroll position.
     *
     * @return {Integer} Vertical scroll position
     */
    getScrollY : function()
    {
      var thisEl = this.__element;
      if (thisEl) {
        return thisEl.scrollTop;
      }

      return this.__lazyScrollY || 0;
    },


    /**
     * Disables browser-native scrolling
     */
    disableScrolling : function()
    {
      this.enableScrolling();
      this.scrollToX(0);
      this.scrollToY(0);
      this.addListener("scroll", this.__onScroll, this);
    },


    /**
     * Re-enables browser-native scrolling
     */
    enableScrolling : function() {
      this.removeListener("scroll", this.__onScroll, this);
    },


    __inScroll : null,

    /**
     * Handler for the scroll-event
     *
     * @param e {qx.event.type.Native} scroll-event
     */
    __onScroll : function(e)
    {
      if (!this.__inScroll)
      {
        this.__inScroll = true;
        this.__element.scrollTop = 0;
        this.__element.scrollLeft = 0;
        delete this.__inScroll;
      }
    },


    /*
    ---------------------------------------------------------------------------
      TEXT SELECTION SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Get the selection of the element.
     *
     * If the underlaying DOM element is not yet created, this methods returns
     * a null value.
     *
     * @return {String|null}
     */
    getTextSelection : function()
    {
      var el = this.__element;
      if (el) {
        return qx.bom.Selection.get(el);
      }

      return null;
    },


    /**
     * Get the length of selection of the element.
     *
     * If the underlaying DOM element is not yet created, this methods returns
     * a null value.
     *
     * @return {Integer|null}
     */
    getTextSelectionLength : function()
    {
      var el = this.__element;
      if (el) {
        return qx.bom.Selection.getLength(el);
      }

      return null;
    },


    /**
     * Get the start of the selection of the element.
     *
     * If the underlaying DOM element is not yet created, this methods returns
     * a null value.
     *
     * @return {Integer|null}
     */
    getTextSelectionStart : function()
    {
      var el = this.__element;
      if (el) {
        return qx.bom.Selection.getStart(el);
      }

      return null;
    },


    /**
     * Get the end of the selection of the element.
     *
     * If the underlaying DOM element is not yet created, this methods returns
     * a null value.
     *
     * @return {Integer|null}
     */
    getTextSelectionEnd : function()
    {
      var el = this.__element;
      if (el) {
        return qx.bom.Selection.getEnd(el);
      }

      return null;
    },


    /**
     * Set the selection of the element with the given start and end value.
     * If no end value is passed the selection will extend to the end.
     *
     * This method only works if the underlying DOM element is already created.
     *
     * @param start {Integer} start of the selection (zero based)
     * @param end {Integer} end of the selection
     */
    setTextSelection : function(start, end)
    {
      var el = this.__element;
      if (el) {
        qx.bom.Selection.set(el, start, end);
        return;
      }

      // if element not created, save the selection for flushing
      qx.html.Element.__selection[this.toHashCode()] = {
        element : this,
        start : start,
        end : end
      };
      qx.html.Element._scheduleFlush("element");
    },


    /**
     * Clears the selection of the element.
     *
     * This method only works if the underlying DOM element is already created.
     *
     */
    clearTextSelection : function()
    {
      var el = this.__element;
      if (el) {
        qx.bom.Selection.clear(el);
      }
      delete qx.html.Element.__selection[this.toHashCode()];
    },




    /*
    ---------------------------------------------------------------------------
      FOCUS/ACTIVATE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Takes the action to process as argument and queues this action if the
     * underlying DOM element is not yet created.
     *
     * @param action {String} action to queue
     * @param args {Array} optional list of arguments for the action
     */
    __performAction : function(action, args)
    {
      var actions = qx.html.Element._actions;

      actions.push({
        type: action,
        element: this,
        args: args || []
      });
      qx.html.Element._scheduleFlush("element");
    },


    /**
     * Focus this element.
     *
     * If the underlaying DOM element is not yet created, the
     * focus is queued for processing after the element creation.
     *
     */
    focus : function() {
      this.__performAction("focus");
    },


    /**
     * Mark this element to get blurred on the next flush of the queue
     *
     */
    blur : function() {
      this.__performAction("blur");
    },


    /**
     * Mark this element to get activated on the next flush of the queue
     *
     */
    activate : function() {
      this.__performAction("activate");
    },


    /**
     * Mark this element to get deactivated on the next flush of the queue
     *
     */
    deactivate : function() {
      this.__performAction("deactivate");
    },


    /**
     * Captures all mouse events to this element
     *
     * @param containerCapture {Boolean?true} If true all events originating in
     *   the container are captured. If false events originating in the container
     *   are not captured.
     */
    capture : function(containerCapture) {
      this.__performAction("capture", [containerCapture !== false]);
    },


    /**
     * Releases this element from a previous {@link #capture} call
     */
    releaseCapture : function() {
      this.__performAction("releaseCapture");
    },





    /*
    ---------------------------------------------------------------------------
      STYLE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Set up the given style attribute
     *
     * @param key {String} the name of the style attribute
     * @param value {var} the value
     * @param direct {Boolean?false} Whether the value should be applied
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    setStyle : function(key, value, direct)
    {
      if (!this.__styleValues) {
        this.__styleValues = {};
      }

      if (this.__styleValues[key] == value) {
        return this;
      }

      if (value == null) {
        delete this.__styleValues[key];
      } else {
        this.__styleValues[key] = value;
      }

      // Uncreated elements simply copy all data
      // on creation. We don't need to remember any
      // jobs. It is a simple full list copy.
      if (this.__element)
      {
        // Omit queuing in direct mode
        if (direct)
        {
          qx.bom.element.Style.set(this.__element, key, value);
          return this;
        }

        // Dynamically create if needed
        if (!this.__styleJobs) {
          this.__styleJobs = {};
        }

        // Store job info
        this.__styleJobs[key] = true;

        // Register modification
        qx.html.Element._modified[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      return this;
    },


    /**
     * Convenience method to modify a set of styles at once.
     *
     * @param map {Map} a map where the key is the name of the property
     *    and the value is the value to use.
     * @param direct {Boolean?false} Whether the values should be applied
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    setStyles : function(map, direct)
    {
      // inline calls to "set" because this method is very
      // performance critical!

      var Style = qx.bom.element.Style;

      if (!this.__styleValues) {
        this.__styleValues = {};
      }

      if (this.__element)
      {
        // Dynamically create if needed
        if (!this.__styleJobs) {
          this.__styleJobs = {};
        }

        for (var key in map)
        {
          var value = map[key];
          if (this.__styleValues[key] == value) {
            continue;
          }

          if (value == null) {
            delete this.__styleValues[key];
          } else {
            this.__styleValues[key] = value;
          }

          // Omit queuing in direct mode
          if (direct)
          {
            Style.set(this.__element, key, value);
            continue;
          }

          // Store job info
          this.__styleJobs[key] = true;
        }

        // Register modification
        qx.html.Element._modified[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }
      else
      {
        for (var key in map)
        {
          var value = map[key];
          if (this.__styleValues[key] == value) {
            continue;
          }

          if (value == null) {
            delete this.__styleValues[key];
          } else {
            this.__styleValues[key] = value;
          }
        }
      }

      return this;
    },


    /**
     * Removes the given style attribute
     *
     * @param key {String} the name of the style attribute
     * @param direct {Boolean?false} Whether the value should be removed
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeStyle : function(key, direct) {
      this.setStyle(key, null, direct);
      return this;
    },


    /**
     * Get the value of the given style attribute.
     *
     * @param key {String} name of the style attribute
     * @return {var} the value of the style attribute
     */
    getStyle : function(key) {
      return this.__styleValues ? this.__styleValues[key] : null;
    },


    /**
     * Returns a map of all styles. Do not modify the result map!
     *
     * @return {Map} All styles or <code>null</code> when none are configured.
     */
    getAllStyles : function() {
      return this.__styleValues || null;
    },





    /*
    ---------------------------------------------------------------------------
      ATTRIBUTE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Set up the given attribute
     *
     * @param key {String} the name of the attribute
     * @param value {var} the value
     * @param direct {Boolean?false} Whether the value should be applied
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    setAttribute : function(key, value, direct)
    {
      if (!this.__attribValues) {
        this.__attribValues = {};
      }

      if (this.__attribValues[key] == value) {
        return this;
      }

      if (value == null) {
        delete this.__attribValues[key];
      } else {
        this.__attribValues[key] = value;
      }

      // Uncreated elements simply copy all data
      // on creation. We don't need to remember any
      // jobs. It is a simple full list copy.
      if (this.__element)
      {
        // Omit queuing in direct mode
        if (direct)
        {
          qx.bom.element.Attribute.set(this.__element, key, value);
          return this;
        }

        // Dynamically create if needed
        if (!this.__attribJobs) {
          this.__attribJobs = {};
        }

        // Store job info
        this.__attribJobs[key] = true;

        // Register modification
        qx.html.Element._modified[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      return this;
    },


    /**
     * Convenience method to modify a set of attributes at once.
     *
     * @param map {Map} a map where the key is the name of the property
     *    and the value is the value to use.
     * @param direct {Boolean?false} Whether the values should be applied
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    setAttributes : function(map, direct)
    {
      for (var key in map) {
        this.setAttribute(key, map[key], direct);
      }

      return this;
    },


    /**
     * Removes the given attribute
     *
     * @param key {String} the name of the attribute
     * @param direct {Boolean?false} Whether the value should be removed
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeAttribute : function(key, direct) {
      return this.setAttribute(key, null, direct);
    },


    /**
     * Get the value of the given attribute.
     *
     * @param key {String} name of the attribute
     * @return {var} the value of the attribute
     */
    getAttribute : function(key) {
      return this.__attribValues ? this.__attribValues[key] : null;
    },



    /*
    ---------------------------------------------------------------------------
      CSS CLASS SUPPORT
    ---------------------------------------------------------------------------
    */
    /**
     * Adds a css class to the element.
     * @param name {String} Name of the CSS class.
     */
    addClass : function(name) {
      var value = ((this.getAttribute("class") || "") + " " + name).trim();
      this.setAttribute("class", value);
    },


    /**
     * Removes a CSS class from the current element.
     * @param name {String} Name of the CSS class.
     */
    removeClass : function(name) {
      var currentClass = this.getAttribute("class");
      if (currentClass) {
        this.setAttribute("class", (currentClass.replace(name, "")).trim());
      }
    },



    /*
    ---------------------------------------------------------------------------
      PROPERTY SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Applies a special property with the given value.
     *
     * This property apply routine can be easily overwritten and
     * extended by sub classes to add new low level features which
     * are not easily possible using styles and attributes.
     *
     * @param name {String} Unique property identifier
     * @param value {var} Any valid value (depends on the property)
     * @return {qx.html.Element} this object (for chaining support)
     * @abstract
     */
    _applyProperty : function(name, value) {
      // empty implementation
    },


    /**
     * Set up the given property.
     *
     * @param key {String} the name of the property
     * @param value {var} the value
     * @param direct {Boolean?false} Whether the value should be applied
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    _setProperty : function(key, value, direct)
    {
      if (!this.__propertyValues) {
        this.__propertyValues = {};
      }

      if (this.__propertyValues[key] == value) {
        return this;
      }

      if (value == null) {
        delete this.__propertyValues[key];
      } else {
        this.__propertyValues[key] = value;
      }

      // Uncreated elements simply copy all data
      // on creation. We don't need to remember any
      // jobs. It is a simple full list copy.
      if (this.__element)
      {
        // Omit queuing in direct mode
        if (direct)
        {
          this._applyProperty(key, value);
          return this;
        }

        // Dynamically create if needed
        if (!this.__propertyJobs) {
          this.__propertyJobs = {};
        }

        // Store job info
        this.__propertyJobs[key] = true;

        // Register modification
        qx.html.Element._modified[this.$$hash] = this;
        qx.html.Element._scheduleFlush("element");
      }

      return this;
    },


    /**
     * Removes the given misc
     *
     * @param key {String} the name of the misc
     * @param direct {Boolean?false} Whether the value should be removed
     *    directly (without queuing)
     * @return {qx.html.Element} this object (for chaining support)
     */
    _removeProperty : function(key, direct) {
      return this._setProperty(key, null, direct);
    },


    /**
     * Get the value of the given misc.
     *
     * @param key {String} name of the misc
     * @return {var} the value of the misc
     */
    _getProperty : function(key)
    {
      var db = this.__propertyValues;
      if (!db) {
        return null;
      }

      var value = db[key];
      return value == null ? null : value;
    },





    /*
    ---------------------------------------------------------------------------
      EVENT SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Adds an event listener to the element.
     *
     * @param type {String} Name of the event
     * @param listener {Function} Function to execute on event
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean ? false} Whether capturing should be enabled
     * @return {var} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListener : function(type, listener, self, capture)
    {
      if (this.$$disposed) {
        return null;
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Failed to add event listener for type '" + type + "'" +
          " to the target '" + this + "': ";

        this.assertString(type, msg + "Invalid event type.");
        this.assertFunction(listener, msg + "Invalid callback function");

        if (self !== undefined) {
          this.assertObject(self, "Invalid context for callback.")
        }

        if (capture !== undefined) {
          this.assertBoolean(capture, "Invalid capture flag.");
        }
      }

      if (this.__element) {
        return qx.event.Registration.addListener(this.__element, type, listener, self, capture);
      }

      if (!this.__eventValues) {
        this.__eventValues = {};
      }

      if (capture == null) {
        capture = false;
      }

      var unique = qx.event.Manager.getNextUniqueId();
      var id = type + (capture ? "|capture|" : "|bubble|") + unique;

      this.__eventValues[id] =
      {
        type : type,
        listener : listener,
        self : self,
        capture : capture,
        unique : unique
      };

      return id;
    },


    /**
     * Removes an event listener from the element.
     *
     * @param type {String} Name of the event
     * @param listener {Function} Function to execute on event
     * @param self {Object} Execution context of given function
     * @param capture {Boolean ? false} Whether capturing should be enabled
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeListener : function(type, listener, self, capture)
    {
      if (this.$$disposed) {
        return null;
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Failed to remove event listener for type '" + type + "'" +
          " from the target '" + this + "': ";

        this.assertString(type, msg + "Invalid event type.");
        this.assertFunction(listener, msg + "Invalid callback function");

        if (self !== undefined) {
          this.assertObject(self, "Invalid context for callback.")
        }

        if (capture !== undefined) {
          this.assertBoolean(capture, "Invalid capture flag.");
        }
      }

      if (this.__element)
      {
        qx.event.Registration.removeListener(this.__element, type, listener, self, capture);
      }
      else
      {
        var values = this.__eventValues;
        var entry;

        if (capture == null) {
          capture = false;
        }

        for (var key in values)
        {
          entry = values[key];

          // Optimized for performance: Testing references first
          if (entry.listener === listener && entry.self === self && entry.capture === capture && entry.type === type)
          {
            delete values[key];
            break;
          }
        }
      }

      return this;
    },


    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param id {var} The id returned by {@link #addListener}
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeListenerById : function(id)
    {
      if (this.$$disposed) {
        return null;
      }

      if (this.__element) {
        qx.event.Registration.removeListenerById(this.__element, id);
      } else {
        delete this.__eventValues[id];
      }

      return this;
    },


    /**
     * Check if there are one or more listeners for an event type.
     *
     * @param type {String} name of the event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the object has a listener of the given type.
     */
    hasListener : function(type, capture)
    {
      if (this.$$disposed) {
        return false;
      }

      if (this.__element) {
        return qx.event.Registration.hasListener(this.__element, type, capture);
      }

      var values = this.__eventValues;
      var entry;

      if (capture == null) {
        capture = false;
      }

      for (var key in values)
      {
        entry = values[key];

        // Optimized for performance: Testing fast types first
        if (entry.capture === capture && entry.type === type) {
          return true;
        }
      }

      return false;
    },


    /**
     * Serializes and returns all event listeners attached to this element
     * @return {Map[]} an Array containing a map for each listener. The maps
     * have the following keys:
     * <ul>
     *   <li><code>type</code> (String): Event name</li>
     *   <li><code>handler</code> (Function): Callback function</li>
     *   <li><code>self</code> (Object): The callback's context</li>
     *   <li><code>capture</code> (Boolean): If <code>true</code>, the listener is
     * attached to the capturing phase</li>
     * </ul>
     */
    getListeners : function() {
      if (this.$$disposed) {
        return null;
      }

      if (this.__element) {
        return qx.event.Registration.getManager(this.__element).serializeListeners(this.__element);
      }

      var listeners = [];
      for (var id in this.__eventValues) {
        var listenerData = this.__eventValues[id];
        listeners.push({
          type: listenerData.type,
          handler: listenerData.listener,
          self: listenerData.self,
          capture: listenerData.capture
        });
      }

      return listeners;
    }
  },





  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    statics.__deferredCall = new qx.util.DeferredCall(statics.flush, statics);
  },





  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {
    var el = this.__element;
    if (el)
    {
      qx.event.Registration.getManager(el).removeAllListeners(el);
      el.$$element = "";
    }

    if (!qx.core.ObjectRegistry.inShutDown)
    {
      var parent = this.__parent;
      if (parent && !parent.$$disposed) {
        parent.remove(this);
      }
    }

    this._disposeArray("__children");

    this.__attribValues = this.__styleValues = this.__eventValues =
      this.__propertyValues = this.__attribJobs = this.__styleJobs =
      this.__propertyJobs = this.__element = this.__parent =
      this.__lazyScrollIntoViewX = this.__lazyScrollIntoViewY = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class provides a handler for the online event.
 */
qx.Class.define("qx.event.handler.Offline",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    this.__manager = manager;
    this.__window = manager.getWindow();

    this._initObserver();
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      online : true,
      offline : true
    },


    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_WINDOW,


    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __manager : null,
    __window : null,
    __onNativeWrapper : null,


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    /**
     * Connects the native online and offline event listeners.
     */
    _initObserver : function() {
      this.__onNativeWrapper = qx.lang.Function.listener(this._onNative, this);

      qx.bom.Event.addNativeListener(this.__window, "offline", this.__onNativeWrapper);
      qx.bom.Event.addNativeListener(this.__window, "online", this.__onNativeWrapper);
    },


    /**
     * Disconnects the native online and offline event listeners.
     */
    _stopObserver : function() {
      qx.bom.Event.removeNativeListener(this.__window, "offline", this.__onNativeWrapper);
      qx.bom.Event.removeNativeListener(this.__window, "online", this.__onNativeWrapper);
    },


    /**
     * Native handler function which fires a qooxdoo event.
     * @signature function(domEvent)
     * @param domEvent {Event} Native DOM event
     */
    _onNative : qx.event.GlobalError.observeMethod(function(domEvent) {
      qx.event.Registration.fireEvent(
          this.__window,
          domEvent.type,
          qx.event.type.Event,
          []
      );
    }),


    /*
    ---------------------------------------------------------------------------
      USER ACCESS
    ---------------------------------------------------------------------------
    */


    /**
     * Returns whether the current window thinks its online or not.
     * @return {Boolean} <code>true</code> if its online
     */
    isOnline : function() {
      return !!this.__window.navigator.onLine;
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.__manager = null;
    this._stopObserver();

    // Deregister
    delete qx.event.handler.Appear.__instances[this.$$hash];
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This class is mainly a convenience wrapper for DOM elements to
 * qooxdoo's event system.
 *
 * @require(qx.event.dispatch.Direct)
 * @require(qx.event.dispatch.DomBubbling)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Mouse)
 * @require(qx.event.handler.DragDrop)
 * @require(qx.event.handler.Element)
 * @require(qx.event.handler.Appear)
 * @require(qx.event.handler.Touch)
 * @require(qx.event.handler.Offline)
 * @require(qx.event.handler.Input)
 */
qx.Class.define("qx.bom.Element",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Add an event listener to a DOM element. The event listener is passed an
     * instance of {@link Event} containing all relevant information
     * about the event as parameter.
     *
     * @param element {Element} DOM element to attach the event on.
     * @param type {String} Name of the event e.g. "click", "keydown", ...
     * @param listener {Function} Event listener function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean} Whether to attach the event to the
     *       capturing phase or the bubbling phase of the event. The default is
     *       to attach the event handler to the bubbling phase.
     * @return {String} An opaque id, which can be used to remove the event listener
     *       using the {@link #removeListenerById} method.
     */
    addListener : function(element, type, listener, self, capture) {
      return qx.event.Registration.addListener(element, type, listener, self, capture);
    },


    /**
     * Remove an event listener from a from DOM node.
     *
     * Note: All registered event listeners will automatically be removed from
     *   the DOM at page unload so it is not necessary to detach events yourself.
     *
     * @param element {Element} DOM Element
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the event listener
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener.
     * @param capture {Boolean} Whether to remove the event listener of
     *       the bubbling or of the capturing phase.
     * @return {Boolean} <code>true</code> if the listener was removed
     */
    removeListener : function(element, type, listener, self, capture) {
      return qx.event.Registration.removeListener(element, type, listener, self, capture);
    },


    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param target {Object} The event target
     * @param id {String} The id returned by {@link #addListener}
     * @return {Boolean} <code>true</code> if the listener was removed
     */
    removeListenerById : function(target, id) {
      return qx.event.Registration.removeListenerById(target, id);
    },


    /**
     * Check whether there are one or more listeners for an event type
     * registered at the element.
     *
     * @param element {Element} DOM element
     * @param type {String} The event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *       the bubbling or of the capturing phase.
     * @return {Boolean} Whether the element has event listeners of the given type.
     */
    hasListener : function(element, type, capture) {
      return qx.event.Registration.hasListener(element, type, capture);
    },


    /**
     * Focuses the given element. The element needs to have a positive <code>tabIndex</code> value.
     *
     * @param element {Element} DOM element to focus
     */
    focus : function(element) {
      qx.event.Registration.getManager(element).getHandler(qx.event.handler.Focus).focus(element);
    },


    /**
     * Blurs the given element
     *
     * @param element {Element} DOM element to blur
     */
    blur : function(element) {
      qx.event.Registration.getManager(element).getHandler(qx.event.handler.Focus).blur(element);
    },


    /**
     * Activates the given element. The active element receives all key board events.
     *
     * @param element {Element} DOM element to focus
     */
    activate : function(element) {
      qx.event.Registration.getManager(element).getHandler(qx.event.handler.Focus).activate(element);
    },


    /**
     * Deactivates the given element. The active element receives all key board events.
     *
     * @param element {Element} DOM element to focus
     */
    deactivate : function(element) {
      qx.event.Registration.getManager(element).getHandler(qx.event.handler.Focus).deactivate(element);
    },


    /**
     * Captures the given element
     *
     * @param element {Element} DOM element to capture
     * @param containerCapture {Boolean?true} If true all events originating in
     *   the container are captured. If false events originating in the container
     *   are not captured.
     */
    capture : function(element, containerCapture) {
      qx.event.Registration.getManager(element).getDispatcher(qx.event.dispatch.MouseCapture).activateCapture(element, containerCapture);
    },


    /**
     * Releases the given element (from a previous {@link #capture} call)
     *
     * @param element {Element} DOM element to release
     */
    releaseCapture : function(element) {
      qx.event.Registration.getManager(element).getDispatcher(qx.event.dispatch.MouseCapture).releaseCapture(element);
    },


    /*
    ---------------------------------------------------------------------------
      UTILS
    ---------------------------------------------------------------------------
    */

    /**
     * Clone given DOM element. May optionally clone all attached
     * events (recursively) as well.
     *
     * @param element {Element} Element to clone
     * @param events {Boolean?false} Whether events should be copied as well
     * @return {Element} The copied element
     */
    clone : function(element, events)
    {
      var clone;

      if (events || ((qx.core.Environment.get("engine.name") == "mshtml") && !qx.xml.Document.isXmlDocument(element)))
      {
        var mgr = qx.event.Registration.getManager(element);
        var all = qx.dom.Hierarchy.getDescendants(element);
        all.push(element);
      }

      // IE copies events bound via attachEvent() when
      // using cloneNode(). Calling detachEvent() on the
      // clone will also remove the events from the orignal.
      //
      // In order to get around this, we detach all locally
      // attached events first, do the cloning and recover
      // them afterwards again.
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        for (var i=0, l=all.length; i<l; i++) {
          mgr.toggleAttachedEvents(all[i], false);
        }
      }

      // Do the native cloning
      var clone = element.cloneNode(true);

      // Recover events on original elements
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        for (var i=0, l=all.length; i<l; i++) {
          mgr.toggleAttachedEvents(all[i], true);
        }
      }

      // Attach events from original element
      if (events === true)
      {
        // Produce recursive list of elements in the clone
        var cloneAll = qx.dom.Hierarchy.getDescendants(clone);
        cloneAll.push(clone);

        // Process all elements and copy over listeners
        var eventList, cloneElem, origElem, eventEntry;
        for (var i=0, il=all.length; i<il; i++)
        {
          origElem = all[i];
          eventList = mgr.serializeListeners(origElem);

          if (eventList.length > 0)
          {
            cloneElem = cloneAll[i];

            for (var j=0, jl=eventList.length; j<jl; j++)
            {
              eventEntry = eventList[j];
              mgr.addListener(cloneElem, eventEntry.type, eventEntry.handler, eventEntry.self, eventEntry.capture);
            }
          }
        }
      }

      // Finally return the clone
      return clone;
    }
  }
});
 /* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Implementation of the Internet Explorer specific event capturing mode for
 * mouse events http://msdn2.microsoft.com/en-us/library/ms536742.aspx.
 *
 * This class is used internally by {@link qx.event.Manager} to do mouse event
 * capturing.
 *
 * @use(qx.event.handler.Focus)
 * @use(qx.event.handler.Window)
 * @use(qx.event.handler.Capture)
 */
qx.Class.define("qx.event.dispatch.MouseCapture",
{
  extend : qx.event.dispatch.AbstractBubbling,


  /**
   * @param manager {qx.event.Manager} Event manager for the window to use
   * @param registration {qx.event.Registration} The event registration to use
   */
  construct : function(manager, registration)
  {
    this.base(arguments, manager);
    this.__window = manager.getWindow();
    this.__registration = registration;

    manager.addListener(this.__window, "blur", this.releaseCapture, this);
    manager.addListener(this.__window, "focus", this.releaseCapture, this);
    manager.addListener(this.__window, "scroll", this.releaseCapture, this);
  },


  statics :
  {
    /** @type {Integer} Priority of this dispatcher */
    PRIORITY : qx.event.Registration.PRIORITY_FIRST
  },


  members:
  {
    __registration : null,
    __captureElement : null,
    __containerCapture : true,
    __window : null,


    // overridden
    _getParent : function(target) {
      return target.parentNode;
    },


    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCHER INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    canDispatchEvent : function(target, event, type)
    {
      return !!(
        this.__captureElement &&
        this.__captureEvents[type]
      );
    },


    // overridden
    dispatchEvent : function(target, event, type)
    {
      // Conforming to the MS implementation a mouse click will stop mouse
      // capturing. The event is "eaten" by the capturing handler.
      if (!qx.event.handler.MouseEmulation.ON) {
        if (type == "click") {
          event.stopPropagation();

          this.releaseCapture();
          return;
        }
      }

      if (
        this.__containerCapture ||
        !qx.dom.Hierarchy.contains(this.__captureElement, target)
      ) {
        target = this.__captureElement;
      }

      this.base(arguments, target, event, type);
    },


    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * @lint ignoreReferenceField(__captureEvents)
     */
    __captureEvents :
    {
      "mouseup": 1,
      "mousedown": 1,
      "click": 1,
      "dblclick": 1,
      "mousemove": 1,
      "mouseout": 1,
      "mouseover": 1
    },


    /*
    ---------------------------------------------------------------------------
      USER ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Set the given element as target for event
     *
     * @param element {Element} The element which should capture the mouse events.
     * @param containerCapture {Boolean?true} If true all events originating in
     *   the container are captured. IF false events originating in the container
     *   are not captured.
     */
    activateCapture : function(element, containerCapture)
    {
      var containerCapture = containerCapture !== false;

      if (
        this.__captureElement === element &&
        this.__containerCapture == containerCapture
      ) {
        return;
      }


      if (this.__captureElement) {
        this.releaseCapture();
      }

      // turn on native mouse capturing if the browser supports it
      this.nativeSetCapture(element, containerCapture);
      if (this.hasNativeCapture)
      {
        var self = this;
        qx.bom.Event.addNativeListener(element, "losecapture", function()
        {
          qx.bom.Event.removeNativeListener(element, "losecapture", arguments.callee);
          self.releaseCapture();
        });
      }

      this.__containerCapture = containerCapture;
      this.__captureElement = element;
      this.__registration.fireEvent(element, "capture", qx.event.type.Event, [true, false]);
    },


    /**
     * Get the element currently capturing events.
     *
     * @return {Element|null} The current capture element. This value may be
     *    null.
     */
    getCaptureElement : function() {
      return this.__captureElement;
    },


    /**
     * Stop capturing of mouse events.
     */
    releaseCapture : function()
    {
      var element = this.__captureElement;

      if (!element) {
        return;
      }

      this.__captureElement = null;
      this.__registration.fireEvent(element, "losecapture", qx.event.type.Event, [true, false]);

      // turn off native mouse capturing if the browser supports it
      this.nativeReleaseCapture(element);
    },


    /** Whether the browser has native mouse capture support */
    hasNativeCapture : qx.core.Environment.get("engine.name") == "mshtml",


    /**
     * If the browser supports native mouse capturing, sets the mouse capture to
     * the object that belongs to the current document.
     *
     * @param element {Element} The capture DOM element
     * @param containerCapture {Boolean?true} If true all events originating in
     *   the container are captured. If false events originating in the container
     *   are not captured.
     * @signature function(element, containerCapture)
     */
    nativeSetCapture : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, containerCapture) {
        element.setCapture(containerCapture !== false);
      },

      "default" : (function() {})
    }),


    /**
     * If the browser supports native mouse capturing, removes mouse capture
     * from the object in the current document.
     *
     * @param element {Element} The DOM element to release the capture for
     * @signature function(element)
     */
    nativeReleaseCapture : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element) {
        element.releaseCapture();
      },

      "default" : (function() {})
    })
  },


  destruct : function() {
    this.__captureElement = this.__window = this.__registration = null;
  },


  defer : function(statics) {
    qx.event.Registration.addDispatcher(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class performs the auto flush of all layout relevant queues.
 *
 * @require(qx.event.handler.UserAction)
 */
qx.Class.define("qx.ui.core.queue.Manager",
{
  statics :
  {
    /** @type {Boolean} Whether a flush was scheduled */
    __scheduled : false,

    /** @type {Boolean} true, if the flush should not be executed */
    __canceled : false,

    /** @type {Map} Internal data structure for the current job list */
    __jobs : {},


    /** @type {Integer} Counts how often a flush failed due to exceptions */
    __retries : 0,

    /** @type {Integer} Maximum number of flush retries */
    MAX_RETRIES : 10,


    /**
     * Schedule a deferred flush of all queues.
     *
     * @param job {String} The job, which should be performed. Valid values are
     *     <code>layout</code>, <code>decoration</code> and <code>element</code>.
     */
    scheduleFlush : function(job)
    {
      // Sometimes not executed in context, fix this
      var self = qx.ui.core.queue.Manager;

      self.__jobs[job] = true;

      if (!self.__scheduled)
      {
        self.__canceled = false;

        qx.bom.AnimationFrame.request(function() {
          if (self.__canceled) {
            self.__canceled = false;
            return;
          }
          self.flush();
        }, self);
        self.__scheduled = true;
      }
    },


    /**
     * Flush all layout queues in the correct order. This function is called
     * deferred if {@link #scheduleFlush} is called.
     *
     */
    flush : function()
    {
      // Sometimes not executed in context, fix this
      var self = qx.ui.core.queue.Manager;

      // Stop when already executed
      if (self.__inFlush) {
        return;
      }

      self.__inFlush = true;

      // Cancel timeout if called manually
      self.__canceled = true;

      var jobs = self.__jobs;

      self.__executeAndRescheduleOnError(function()
      {
        // Process jobs
        while (jobs.visibility || jobs.widget || jobs.appearance || jobs.layout || jobs.element)
        {
          // No else blocks here because each flush can influence the following flushes!
          if (jobs.widget)
          {
            delete jobs.widget;

            if (qx.core.Environment.get("qx.debug.ui.queue")) {
              try {
                qx.ui.core.queue.Widget.flush();
              } catch (e) {
                qx.log.Logger.error(qx.ui.core.queue.Widget, "Error in the 'Widget' queue:" + e, e);
              }
            } else {
              qx.ui.core.queue.Widget.flush();
            }
          }

          if (jobs.visibility)
          {
            delete jobs.visibility;

            if (qx.core.Environment.get("qx.debug.ui.queue")) {
              try {
                qx.ui.core.queue.Visibility.flush();
              } catch (e) {
                qx.log.Logger.error(qx.ui.core.queue.Visibility, "Error in the 'Visibility' queue:" + e, e);
              }
            } else {
              qx.ui.core.queue.Visibility.flush();
            }
          }

          if (jobs.appearance)
          {
            delete jobs.appearance;

            if (qx.core.Environment.get("qx.debug.ui.queue")) {
              try {
                qx.ui.core.queue.Appearance.flush();
              } catch (e) {
                qx.log.Logger.error(qx.ui.core.queue.Appearance, "Error in the 'Appearance' queue:" + e, e);
              }
            } else {
              qx.ui.core.queue.Appearance.flush();
            }
          }

          // Defer layout as long as possible
          if (jobs.widget || jobs.visibility || jobs.appearance) {
            continue;
          }

          if (jobs.layout)
          {
            delete jobs.layout;

            if (qx.core.Environment.get("qx.debug.ui.queue")) {
              try {
                qx.ui.core.queue.Layout.flush();
              } catch (e) {
                qx.log.Logger.error(qx.ui.core.queue.Layout, "Error in the 'Layout' queue:" + e, e);
              }
            } else {
              qx.ui.core.queue.Layout.flush();
            }
          }

          // Defer element as long as possible
          if (jobs.widget || jobs.visibility || jobs.appearance || jobs.layout) {
            continue;
          }

          if (jobs.element)
          {
            delete jobs.element;
            qx.html.Element.flush();
          }
        }
      }, function() {
        self.__scheduled = false;
      });

      self.__executeAndRescheduleOnError(function()
      {
        if (jobs.dispose)
        {
          delete jobs.dispose;

          if (qx.core.Environment.get("qx.debug.ui.queue")) {
            try {
              qx.ui.core.queue.Dispose.flush();
            } catch (e) {
              qx.log.Logger.error("Error in the 'Dispose' queue:" + e);
            }
          } else {
            qx.ui.core.queue.Dispose.flush();
          }
        }
      }, function() {
        // Clear flag
        self.__inFlush = false;
      });

      // flush succeeded successfully. Reset retries
      self.__retries = 0;
    },


    /**
     * Executes the callback code. If the callback throws an error the current
     * flush is cleaned up and rescheduled. The finally code is called after the
     * callback even if it has thrown an exception.
     *
     * @signature function(callback, finallyCode)
     * @param callback {Function} the callback function
     * @param finallyCode {Function} function to be called in the finally block
     */
    __executeAndRescheduleOnError : qx.core.Environment.select("qx.debug",
    {
      "true" : function(callback, finallyCode)
      {
        callback();
        finallyCode();
      },


      "false" : function(callback, finallyCode)
      {
        var self = qx.ui.core.queue.Manager;

        try
        {
          callback();
        }
        catch (e)
        {
          if (qx.core.Environment.get("qx.debug")) {
            qx.log.Logger.error(
              "Error while layout flush: " + e + "\n" +
              "Stack trace: \n" +
              qx.dev.StackTrace.getStackTraceFromError(e)
            );
          }
          self.__scheduled = false;
          self.__inFlush = false;
          self.__retries += 1;

          if (self.__retries <= self.MAX_RETRIES) {
            self.scheduleFlush();
          } else {
            throw new Error(
              "Fatal Error: Flush terminated " + (self.__retries-1) + " times in a row" +
              " due to exceptions in user code. The application has to be reloaded!"
            );
          }

          throw e;
        }
        finally
        {
          finallyCode();
        }
      }
    }),


    /**
     * Handler used on touch devices to prevent the queue from manipulating
     * the dom during the touch - mouse - ... event sequence. Usually, iOS
     * devices fire a click event 300ms after the touchend event. So using
     * 500ms should be a good value to be on the save side. This is necessary
     * due to the fact that the event chain is stopped if a manipulation in
     * the DOM is done.
     *
     * @param e {qx.event.type.Data} The user action data event.
     */
    __onUserAction : function(e)
    {
      qx.ui.core.queue.Manager.flush();
    }
  },




  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  defer : function(statics)
  {
    // Replace default scheduler for HTML element with local one.
    // This is quite a hack, but allows us to force other flushes
    // before the HTML element flush.
    qx.html.Element._scheduleFlush = statics.scheduleFlush;

    // Register to user action
    qx.event.Registration.addListener(window, "useraction",
      qx.core.Environment.get("event.touch") ?
        statics.__onUserAction : statics.flush
    );
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Mustafa Sak (msak)

************************************************************************ */

/**
 * The widget queue handles the deferred computation of certain widget properties.
 * It is used e.g. for the tree to update the indentation of tree nodes.
 *
 * This queue calls the method {@link qx.ui.core.Widget#syncWidget} of each
 * queued widget before the layout queues are processed.
 */
qx.Class.define("qx.ui.core.queue.Widget",
{
  statics :
  {
    /** @type {Array} This contains all the queued widgets for the next flush. */
    __queue : [],


    /**
     * @type {Object} This contains a map of widgets hash ($$hash) and their
     * corresponding map of jobs.
     */
    __jobs : {},


    /**
     * Clears given job of a widget from the internal queue. If no jobs left, the
     * widget will be removed completely from queue. If job param is <code>null</code>
     * or <code>undefined</code> widget will be removed completely from queue.
     * Normally only used during interims disposes of one or a few widgets.
     *
     * @param widget {qx.ui.core.Widget} The widget to clear
     * @param job {String?} Job identifier. If not used, it will be converted to
     * "$$default".
     */
    remove : function(widget, job)
    {
      var queue = this.__queue;

      if (!qx.lang.Array.contains(queue, widget)) {
        return;
      }

      var hash = widget.$$hash;

      // remove widget and all corresponding jobs, if job param is not given.
      if(job == null) {
         qx.lang.Array.remove(queue, widget);
         delete this.__jobs[hash];
         return;
      }

      if (this.__jobs[hash])
      {
        delete this.__jobs[hash][job];

        if(qx.lang.Object.getLength(this.__jobs[hash]) == 0) {
          qx.lang.Array.remove(queue, widget);
        }
      }
    },


    /**
     * Adds a widget to the queue. The second param can be used to identify
     * several jobs. You can add one job at once, which will be returned as
     * an map at flushing on method {@link qx.ui.core.Widget#syncWidget}.
     *
     * @param widget {qx.ui.core.Widget} The widget to add.
     * @param job {String?} Job identifier. If not used, it will be converted to
     * "$$default".
     */
    add : function(widget, job)
    {
      var queue = this.__queue;
      //add widget if not containing
      if (!qx.lang.Array.contains(queue, widget)){
        queue.unshift(widget);
      }

      //add job
      if (job == null) {
        job = "$$default";
      }
      var hash = widget.$$hash;
      if (!this.__jobs[hash]) {
        this.__jobs[hash] = {};
      }
      this.__jobs[hash][job] = true;

      qx.ui.core.queue.Manager.scheduleFlush("widget");
    },


    /**
     * Flushes the widget queue.
     *
     * This is used exclusively by the {@link qx.ui.core.queue.Manager}.
     */
    flush : function()
    {
      // Process all registered widgets
      var queue = this.__queue;
      var obj, jobs;
      for (var i = queue.length - 1 ; i >= 0; i--)
      {
        // Order is important to allow the same widget to be requeued directly
        obj = queue[i];
        jobs = this.__jobs[obj.$$hash];

        queue.splice(i, 1);
        obj.syncWidget(jobs);
      }

      // Empty check
      if (queue.length != 0) {
        return;
      }

      // Recreate the array is cheaper compared to keep a sparse array over time
      this.__queue = [];
      this.__jobs = {};
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Keeps data about the visibility of all widgets. Updates the internal
 * tree when widgets are added, removed or modify their visibility.
 */
qx.Class.define("qx.ui.core.queue.Visibility",
{
  statics :
  {
    /** @type {Array} This contains all the queued widgets for the next flush. */
    __queue : [],


    /** @type {Map} Maps hash codes to visibility */
    __data : {},


    /**
     * Clears the cached data of the given widget. Normally only used
     * during interims disposes of one or a few widgets.
     *
     * @param widget {qx.ui.core.Widget} The widget to clear
     */
    remove : function(widget)
    {
      delete this.__data[widget.$$hash];
      qx.lang.Array.remove(this.__queue, widget);
    },


    /**
     * Whether the given widget is visible.
     *
     * Please note that the information given by this method is queued and may not be accurate
     * until the next queue flush happens.
     *
     * @param widget {qx.ui.core.Widget} The widget to query
     * @return {Boolean} Whether the widget is visible
     */
    isVisible : function(widget) {
      return this.__data[widget.$$hash] || false;
    },


    /**
     * Computes the visibility for the given widget
     *
     * @param widget {qx.ui.core.Widget} The widget to update
     * @return {Boolean} Whether the widget is visible
     */
    __computeVisible : function(widget)
    {
      var data = this.__data;
      var hash = widget.$$hash;
      var visible;

      // Respect local value
      if (widget.isExcluded())
      {
        visible = false;
      }
      else
      {
        // Parent hierarchy
        var parent = widget.$$parent;
        if (parent) {
          visible = this.__computeVisible(parent);
        } else {
          visible = widget.isRootWidget();
        }
      }

      return data[hash] = visible;
    },


    /**
     * Adds a widget to the queue.
     *
     * Should only be used by {@link qx.ui.core.Widget}.
     *
     * @param widget {qx.ui.core.Widget} The widget to add.
     */
    add : function(widget)
    {
      var queue = this.__queue;
      if (qx.lang.Array.contains(queue, widget)) {
        return;
      }

      queue.unshift(widget);
      qx.ui.core.queue.Manager.scheduleFlush("visibility");
    },


    /**
     * Flushes the visibility queue.
     *
     * This is used exclusively by the {@link qx.ui.core.queue.Manager}.
     */
    flush : function()
    {
      // Dispose all registered objects
      var queue = this.__queue;
      var data = this.__data;

      // Dynamically add children to queue
      // Only respect already known widgets because otherwise the children
      // are also already in the queue (added on their own)
      for (var i = queue.length - 1; i >= 0; i--)
      {
        var hash = queue[i].$$hash;
        if (data[hash] != null) {
          // recursive method call which adds widgets to the queue so be
          // careful with that one (performance critical)
          queue[i].addChildrenToQueue(queue);
        }
      }

      // Cache old data, clear current data
      // Do this before starting with recompution because
      // new data may also be added by related widgets and not
      // only the widget itself.
      var oldData = {};
      for (var i = queue.length - 1; i >= 0; i--)
      {
        var hash = queue[i].$$hash;
        oldData[hash] = data[hash];
        data[hash] = null;
      }

      // Finally recompute
      for (var i = queue.length - 1; i >= 0; i--)
      {
        var widget = queue[i];
        var hash = widget.$$hash;
        queue.splice(i, 1);

        // Only update when not already updated by another widget
        if (data[hash] == null) {
          this.__computeVisible(widget);
        }

        // Check for updates required to the appearance.
        // Hint: Invisible widgets are ignored inside appearance flush
        if (data[hash] && data[hash] != oldData[hash]) {
          widget.checkAppearanceNeeds();
        }
      }

      // Recreate the array is cheaper compared to keep a sparse array over time
      this.__queue = [];
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The AppearanceQueue registers all widgets which are influences through
 * state changes.
 */
qx.Class.define("qx.ui.core.queue.Appearance",
{
  statics :
  {
    /** @type {Array} This contains all the queued widgets for the next flush. */
    __queue : [],


    /**
     * Clears the widget from the internal queue. Normally only used
     * during interims disposes of one or a few widgets.
     *
     * @param widget {qx.ui.core.Widget} The widget to clear
     */
    remove : function(widget) {
      qx.lang.Array.remove(this.__queue, widget)
    },


    /**
     * Adds a widget to the queue.
     *
     * Should only be used by {@link qx.ui.core.Widget}.
     *
     * @param widget {qx.ui.core.Widget} The widget to add.
     */
    add : function(widget)
    {
      var queue = this.__queue;
      if (qx.lang.Array.contains(queue, widget)) {
        return;
      }

      queue.unshift(widget);
      qx.ui.core.queue.Manager.scheduleFlush("appearance");
    },


    /**
     * Whether the given widget is already queued
     *
     * @param widget {qx.ui.core.Widget} The widget to check
     * @return {Boolean} <code>true</code> if the widget is queued
     */
    has : function(widget) {
      return qx.lang.Array.contains(this.__queue, widget);
    },


    /**
     * Flushes the appearance queue.
     *
     * This is used exclusively by the {@link qx.ui.core.queue.Manager}.
     */
    flush : function()
    {
      var Visibility = qx.ui.core.queue.Visibility;

      var queue = this.__queue;
      var obj;

      for (var i = queue.length - 1; i >= 0; i--)
      {
        // Order is important to allow the same widget to be re-queued directly
        obj = queue[i];
        queue.splice(i, 1);

        // Only apply to currently visible widgets
        if (Visibility.isVisible(obj)) {
          obj.syncAppearance();
        } else {
          obj.$$stateChanges = true;
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The DisposeQueue registers all widgets which are should be disposed.
 * This queue makes it possible to remove widgets from the DOM using
 * the layout and element queues and dispose them afterwards.
 */
qx.Class.define("qx.ui.core.queue.Dispose",
{
  statics :
  {
    /** @type {Array} This contains all the queued widgets for the next flush. */
    __queue : [],


    /**
     * Adds a widget to the queue.
     *
     * Should only be used by {@link qx.ui.core.Widget}.
     *
     * @param widget {qx.ui.core.Widget} The widget to add.
     */
    add : function(widget)
    {
      var queue = this.__queue;
      if (qx.lang.Array.contains(queue, widget)) {
        return;
      }

      queue.unshift(widget);
      qx.ui.core.queue.Manager.scheduleFlush("dispose");
    },


    /**
     * Whether the dispose queue is empty
     * @return {Boolean}
     * @internal
     */
    isEmpty : function()
    {
      return this.__queue.length == 0;
    },


    /**
     * Flushes the dispose queue.
     *
     * This is used exclusively by the {@link qx.ui.core.queue.Manager}.
     */
    flush : function()
    {
      // Dispose all registered objects
      var queue = this.__queue;
      for (var i = queue.length - 1; i >= 0; i--)
      {
        var widget = queue[i];
        queue.splice(i, 1);
        widget.dispose();
      }

      // Empty check
      if (queue.length != 0) {
        return;
      }

      // Recreate the array is cheaper compared to keep a sparse array over time
      this.__queue = [];
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************



************************************************************************ */

/**
 * This is the base class for all widgets.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 *
 * @use(qx.ui.core.EventHandler)
 * @use(qx.event.handler.DragDrop)
 * @asset(qx/static/blank.gif)
 *
 * @ignore(qx.ui.root.Inline)
 */
qx.Class.define("qx.ui.core.Widget",
{
  extend : qx.ui.core.LayoutItem,
  include : [qx.locale.MTranslation],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Create basic element
    this.__contentElement = this.__createContentElement();

    // Initialize properties
    this.initFocusable();
    this.initSelectable();
    this.initNativeContextMenu();
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired after the widget appears on the screen.
     */
    appear : "qx.event.type.Event",

    /**
     * Fired after the widget disappears from the screen.
     */
    disappear : "qx.event.type.Event",

    /**
     * Fired after the creation of a child control. The passed data is the
     * newly created child widget.
     */
    createChildControl : "qx.event.type.Data",


    /**
     * Fired on resize (after layout) of the widget.
     * The data property of the event contains the widget's computed location
     * and dimension as returned by {@link qx.ui.core.LayoutItem#getBounds}
     */
    resize : "qx.event.type.Data",

    /**
     * Fired on move (after layout) of the widget.
     * The data property of the event contains the widget's computed location
     * and dimension as returned by {@link qx.ui.core.LayoutItem#getBounds}
     */
    move : "qx.event.type.Data",

    /**
     * Fired after the appearance has been applied. This happens before the
     * widget becomes visible, on state and appearance changes. The data field
     * contains the state map. This can be used to react on state changes or to
     * read properties set by the appearance.
     */
    syncAppearance : "qx.event.type.Data",



    /** Fired if the mouse cursor moves over the widget.
     *  The data property of the event contains the widget's computed location
     *  and dimension as returned by {@link qx.ui.core.LayoutItem#getBounds}
     */
    mousemove : "qx.event.type.Mouse",

    /**
     * Fired if the mouse cursor enters the widget.
     *
     * Note: This event is also dispatched if the widget is disabled!
     */
    mouseover : "qx.event.type.Mouse",

    /**
     * Fired if the mouse cursor leaves widget.
     *
     * Note: This event is also dispatched if the widget is disabled!
     */
    mouseout : "qx.event.type.Mouse",

    /** Mouse button is pressed on the widget. */
    mousedown : "qx.event.type.Mouse",

    /** Mouse button is released on the widget. */
    mouseup : "qx.event.type.Mouse",

    /** Widget is clicked using left or middle button.
        {@link qx.event.type.Mouse#getButton} for more details.*/
    click : "qx.event.type.Mouse",

    /** Widget is double clicked using left or middle button.
        {@link qx.event.type.Mouse#getButton} for more details.*/
    dblclick : "qx.event.type.Mouse",

    /** Widget is clicked using the right mouse button. */
    contextmenu : "qx.event.type.Mouse",

    /** Fired before the context menu is opened. */
    beforeContextmenuOpen : "qx.event.type.Data",

    /** Fired if the mouse wheel is used over the widget. */
    mousewheel : "qx.event.type.MouseWheel",

    /** Fired if a touch at the screen is started. */
    touchstart : "qx.event.type.Touch",

    /** Fired if a touch at the screen has ended. */
    touchend : "qx.event.type.Touch",

    /** Fired during a touch at the screen. */
    touchmove : "qx.event.type.Touch",

    /** Fired if a touch at the screen is canceled. */
    touchcancel : "qx.event.type.Touch",

    /** Fired when a finger taps on the screen. */
    tap : "qx.event.type.Tap",

    /** Fired when a finger holds on the screen. */
    longtap : "qx.event.type.Tap",

    /** Fired when a finger swipes over the screen. */
    swipe : "qx.event.type.Touch",

    /**
     * This event if fired if a keyboard key is released.
     **/
    keyup : "qx.event.type.KeySequence",

    /**
     * This event if fired if a keyboard key is pressed down. This event is
     * only fired once if the user keeps the key pressed for a while.
     */
    keydown : "qx.event.type.KeySequence",

    /**
     * This event is fired any time a key is pressed. It will be repeated if
     * the user keeps the key pressed. The pressed key can be determined using
     * {@link qx.event.type.KeySequence#getKeyIdentifier}.
     */
    keypress : "qx.event.type.KeySequence",

    /**
     * This event is fired if the pressed key or keys result in a printable
     * character. Since the character is not necessarily associated with a
     * single physical key press, the event does not have a key identifier
     * getter. This event gets repeated if the user keeps pressing the key(s).
     *
     * The unicode code of the pressed key can be read using
     * {@link qx.event.type.KeyInput#getCharCode}.
     */
    keyinput : "qx.event.type.KeyInput",



    /**
     * The event is fired when the widget gets focused. Only widgets which are
     * {@link #focusable} receive this event.
     */
    focus : "qx.event.type.Focus",

    /**
     * The event is fired when the widget gets blurred. Only widgets which are
     * {@link #focusable} receive this event.
     */
    blur : "qx.event.type.Focus",

    /**
     * When the widget itself or any child of the widget receive the focus.
     */
    focusin : "qx.event.type.Focus",

    /**
     * When the widget itself or any child of the widget lost the focus.
     */
    focusout : "qx.event.type.Focus",

    /**
     * When the widget gets active (receives keyboard events etc.)
     */
    activate : "qx.event.type.Focus",

    /**
     * When the widget gets inactive
     */
    deactivate : "qx.event.type.Focus",



    /**
     * Fired if the widget becomes the capturing widget by a call to {@link #capture}.
     */
    capture : "qx.event.type.Event",

    /**
     * Fired if the widget looses the capturing mode by a call to
     * {@link #releaseCapture} or a mouse click.
     */
    losecapture : "qx.event.type.Event",



    /**
     * Fired on the drop target when the drag&drop action is finished
     * successfully. This event is normally used to transfer the data
     * from the drag to the drop target.
     *
     * Modeled after the WHATWG specification of Drag&Drop:
     * http://www.whatwg.org/specs/web-apps/current-work/#dnd
     */
    drop : "qx.event.type.Drag",

    /**
     * Fired on a potential drop target when leaving it.
     *
     * Modeled after the WHATWG specification of Drag&Drop:
     * http://www.whatwg.org/specs/web-apps/current-work/#dnd
     */
    dragleave : "qx.event.type.Drag",

    /**
     * Fired on a potential drop target when reaching it via the mouse.
     * This event can be canceled if none of the incoming data types
     * are supported.
     *
     * Modeled after the WHATWG specification of Drag&Drop:
     * http://www.whatwg.org/specs/web-apps/current-work/#dnd
     */
    dragover : "qx.event.type.Drag",

    /**
     * Fired during the drag. Contains the current mouse coordinates
     * using {@link qx.event.type.Drag#getDocumentLeft} and
     * {@link qx.event.type.Drag#getDocumentTop}
     *
     * Modeled after the WHATWG specification of Drag&Drop:
     * http://www.whatwg.org/specs/web-apps/current-work/#dnd
     */
    drag : "qx.event.type.Drag",

    /**
     * Initiate the drag-and-drop operation. This event is cancelable
     * when the drag operation is currently not allowed/possible.
     *
     * Modeled after the WHATWG specification of Drag&Drop:
     * http://www.whatwg.org/specs/web-apps/current-work/#dnd
     */
    dragstart : "qx.event.type.Drag",

    /**
     * Fired on the source (drag) target every time a drag session was ended.
     */
    dragend : "qx.event.type.Drag",

    /**
     * Fired when the drag configuration has been modified e.g. the user
     * pressed a key which changed the selected action. This event will be
     * fired on the draggable and the droppable element. In case of the
     * droppable element, you can cancel the event and prevent a drop based on
     * e.g. the current action.
     */
    dragchange : "qx.event.type.Drag",

    /**
     * Fired when the drop was successfully done and the target widget
     * is now asking for data. The listener should transfer the data,
     * respecting the selected action, to the event. This can be done using
     * the event's {@link qx.event.type.Drag#addData} method.
     */
    droprequest : "qx.event.type.Drag"
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      PADDING
    ---------------------------------------------------------------------------
    */

    /** Padding of the widget (top) */
    paddingTop :
    {
      check : "Integer",
      init : 0,
      apply : "_applyPadding",
      themeable : true
    },


    /** Padding of the widget (right) */
    paddingRight :
    {
      check : "Integer",
      init : 0,
      apply : "_applyPadding",
      themeable : true
    },


    /** Padding of the widget (bottom) */
    paddingBottom :
    {
      check : "Integer",
      init : 0,
      apply : "_applyPadding",
      themeable : true
    },


    /** Padding of the widget (left) */
    paddingLeft :
    {
      check : "Integer",
      init : 0,
      apply : "_applyPadding",
      themeable : true
    },


    /**
     * The 'padding' property is a shorthand property for setting 'paddingTop',
     * 'paddingRight', 'paddingBottom' and 'paddingLeft' at the same time.
     *
     * If four values are specified they apply to top, right, bottom and left respectively.
     * If there is only one value, it applies to all sides, if there are two or three,
     * the missing values are taken from the opposite side.
     */
    padding :
    {
      group : [ "paddingTop", "paddingRight", "paddingBottom", "paddingLeft" ],
      mode  : "shorthand",
      themeable : true
    },






    /*
    ---------------------------------------------------------------------------
      STYLING PROPERTIES
    ---------------------------------------------------------------------------
    */

    /**
     * The z-index property sets the stack order of an element. An element with
     * greater stack order is always in front of another element with lower stack order.
     */
    zIndex :
    {
      nullable : true,
      init : 10,
      apply : "_applyZIndex",
      event : "changeZIndex",
      check : "Integer",
      themeable : true
    },


    /**
     * The decorator property points to an object, which is responsible
     * for drawing the widget's decoration, e.g. border, background or shadow.
     *
     * This can be a decorator object or a string pointing to a decorator
     * defined in the decoration theme.
     */
    decorator :
    {
      nullable : true,
      init : null,
      apply : "_applyDecorator",
      event : "changeDecorator",
      check : "Decorator",
      themeable : true
    },


    /**
     * The background color the rendered widget.
     */
    backgroundColor :
    {
      nullable : true,
      check : "Color",
      apply : "_applyBackgroundColor",
      event : "changeBackgroundColor",
      themeable : true
    },


    /**
     * The text color the rendered widget.
     */
    textColor :
    {
      nullable : true,
      check : "Color",
      apply : "_applyTextColor",
      event : "changeTextColor",
      themeable : true,
      inheritable : true
    },


    /**
     * The widget's font. The value is either a font name defined in the font
     * theme or an instance of {@link qx.bom.Font}.
     */
    font :
    {
      nullable : true,
      apply : "_applyFont",
      check : "Font",
      event : "changeFont",
      themeable : true,
      inheritable : true,
      dereference : true
    },


    /**
     * Mapping to native style property opacity.
     *
     * The uniform opacity setting to be applied across an entire object.
     * Behaves like the new CSS-3 Property.
     * Any values outside the range 0.0 (fully transparent) to 1.0
     * (fully opaque) will be clamped to this range.
     */
    opacity :
    {
      check : "Number",
      apply : "_applyOpacity",
      themeable : true,
      nullable : true,
      init : null
    },


    /**
     * Mapping to native style property cursor.
     *
     * The name of the cursor to show when the mouse pointer is over the widget.
     * This is any valid CSS2 cursor name defined by W3C.
     *
     * The following values are possible crossbrowser:
     * <ul><li>default</li>
     * <li>crosshair</li>
     * <li>pointer</li>
     * <li>move</li>
     * <li>n-resize</li>
     * <li>ne-resize</li>
     * <li>e-resize</li>
     * <li>se-resize</li>
     * <li>s-resize</li>
     * <li>sw-resize</li>
     * <li>w-resize</li>
     * <li>nw-resize</li>
     * <li>nesw-resize</li>
     * <li>nwse-resize</li>
     * <li>text</li>
     * <li>wait</li>
     * <li>help </li>
     * </ul>
     */
    cursor :
    {
      check : "String",
      apply : "_applyCursor",
      themeable : true,
      inheritable : true,
      nullable : true,
      init : null
    },


    /**
     * Sets the tooltip instance to use for this widget. If only the tooltip
     * text and icon have to be set its better to use the {@link #toolTipText}
     * and {@link #toolTipIcon} properties since they use a shared tooltip
     * instance.
     *
     * If this property is set the {@link #toolTipText} and {@link #toolTipIcon}
     * properties are ignored.
     */
    toolTip :
    {
      check : "qx.ui.tooltip.ToolTip",
      nullable : true
    },


    /**
     * The text of the widget's tooltip. This text can contain HTML markup.
     * The text is displayed using a shared tooltip instance. If the tooltip
     * must be customized beyond the text and an icon {@link #toolTipIcon}, the
     * {@link #toolTip} property has to be used
     */
    toolTipText :
    {
      check : "String",
      nullable : true,
      event : "changeToolTipText",
      apply : "_applyToolTipText"
    },


    /**
    * The icon URI of the widget's tooltip. This icon is displayed using a shared
    * tooltip instance. If the tooltip must be customized beyond the tooltip text
    * {@link #toolTipText} and the icon, the {@link #toolTip} property has to be
    * used.
    */
    toolTipIcon :
    {
      check : "String",
      nullable : true,
      event : "changeToolTipText"
    },

    /**
     * Controls if a tooltip should shown or not.
     */
    blockToolTip :
    {
      check : "Boolean",
      init : false
    },


    /*
    ---------------------------------------------------------------------------
      MANAGEMENT PROPERTIES
    ---------------------------------------------------------------------------
    */

    /**
     * Controls the visibility. Valid values are:
     *
     * <ul>
     *   <li><b>visible</b>: Render the widget</li>
     *   <li><b>hidden</b>: Hide the widget but don't relayout the widget's parent.</li>
     *   <li><b>excluded</b>: Hide the widget and relayout the parent as if the
     *     widget was not a child of its parent.</li>
     * </ul>
     */
    visibility :
    {
      check : ["visible", "hidden", "excluded"],
      init : "visible",
      apply : "_applyVisibility",
      event : "changeVisibility"
    },


    /**
     * Whether the widget is enabled. Disabled widgets are usually grayed out
     * and do not process user created events. While in the disabled state most
     * user input events are blocked. Only the {@link #mouseover} and
     * {@link #mouseout} events will be dispatched.
     */
    enabled :
    {
      init : true,
      check : "Boolean",
      inheritable : true,
      apply : "_applyEnabled",
      event : "changeEnabled"
    },


    /**
     * Whether the widget is anonymous.
     *
     * Anonymous widgets are ignored in the event hierarchy. This is useful
     * for combined widgets where the internal structure do not have a custom
     * appearance with a different styling from the element around. This is
     * especially true for widgets like checkboxes or buttons where the text
     * or icon are handled synchronously for state changes to the outer widget.
     */
    anonymous :
    {
      init : false,
      check : "Boolean"
    },


    /**
     * Defines the tab index of an widget. If widgets with tab indexes are part
     * of the current focus root these elements are sorted in first priority. Afterwards
     * the sorting continues by rendered position, zIndex and other criteria.
     *
     * Please note: The value must be between 1 and 32000.
     */
    tabIndex :
    {
      check : "Integer",
      nullable : true,
      apply : "_applyTabIndex"
    },


    /**
     * Whether the widget is focusable e.g. rendering a focus border and visualize
     * as active element.
     *
     * See also {@link #isTabable} which allows runtime checks for
     * <code>isChecked</code> or other stuff to test whether the widget is
     * reachable via the TAB key.
     */
    focusable :
    {
      check : "Boolean",
      init : false,
      apply : "_applyFocusable"
    },


    /**
     * If this property is enabled, the widget and all of its child widgets
     * will never get focused. The focus keeps at the currently
     * focused widget.
     *
     * This only works for widgets which are not {@link #focusable}.
     *
     * This is mainly useful for widget authors. Please use with caution!
     */
    keepFocus :
    {
      check : "Boolean",
      init : false,
      apply : "_applyKeepFocus"
    },


    /**
     * If this property if enabled, the widget and all of its child widgets
     * will never get activated. The activation keeps at the currently
     * activated widget.
     *
     * This is mainly useful for widget authors. Please use with caution!
     */
    keepActive :
    {
      check : "Boolean",
      init : false,
      apply : "_applyKeepActive"
    },


    /** Whether the widget acts as a source for drag&drop operations */
    draggable :
    {
      check : "Boolean",
      init : false,
      apply : "_applyDraggable"
    },


    /** Whether the widget acts as a target for drag&drop operations */
    droppable :
    {
      check : "Boolean",
      init : false,
      apply : "_applyDroppable"
    },


    /**
     * Whether the widget contains content which may be selected by the user.
     *
     * If the value set to <code>true</code> the native browser selection can
     * be used for text selection. But it is normally useful for
     * forms fields, longer texts/documents, editors, etc.
     */
    selectable :
    {
      check : "Boolean",
      init : false,
      event : "changeSelectable",
      apply : "_applySelectable"
    },


    /**
     * Whether to show a context menu and which one
     */
    contextMenu :
    {
      check : "qx.ui.menu.Menu",
      apply : "_applyContextMenu",
      nullable : true,
      event : "changeContextMenu"
    },


    /**
     * Whether the native context menu should be enabled for this widget. To
     * globally enable the native context menu set the {@link #nativeContextMenu}
     * property of the root widget ({@link qx.ui.root.Abstract}) to
     * <code>true</code>.
     */
    nativeContextMenu :
    {
      check : "Boolean",
      init : false,
      themeable : true,
      event : "changeNativeContextMenu",
      apply : "_applyNativeContextMenu"
    },


    /**
     * The appearance ID. This ID is used to identify the appearance theme
     * entry to use for this widget. This controls the styling of the element.
     */
    appearance :
    {
      check : "String",
      init : "widget",
      apply : "_applyAppearance",
      event : "changeAppearance"
    }
  },


  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** Whether the widget should print out hints and debug messages */
    DEBUG : false,

    /**
     * Returns the widget, which contains the given DOM element.
     *
     * @param element {Element} The DOM element to search the widget for.
     * @param considerAnonymousState {Boolean?false} If true, anonymous widget
     *   will not be returned.
     * @return {qx.ui.core.Widget} The widget containing the element.
     */
    getWidgetByElement : function(element, considerAnonymousState)
    {
      while(element)
      {
        var widgetKey = element.$$widget;

        // dereference "weak" reference to the widget.
        if (widgetKey != null) {
          var widget = qx.core.ObjectRegistry.fromHashCode(widgetKey);
          // check for anonymous widgets
          if (!considerAnonymousState || !widget.getAnonymous()) {
            return widget;
          }
        }

        // Fix for FF, which occasionally breaks (BUG#3525)
        try {
          element = element.parentNode;
        } catch (e) {
          return null;
        }
      }
      return null;
    },


    /**
     * Whether the "parent" widget contains the "child" widget.
     *
     * @param parent {qx.ui.core.Widget} The parent widget
     * @param child {qx.ui.core.Widget} The child widget
     * @return {Boolean} Whether one of the "child"'s parents is "parent"
     */
    contains : function(parent, child)
    {
      while (child)
      {
        if (parent == child) {
          return true;
        }

        child = child.getLayoutParent();
      }

      return false;
    },

    /** @type {Map} Contains all pooled separators for reuse */
    __separatorPool : new qx.util.ObjectPool()
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __contentElement : null,
    __initialAppearanceApplied : null,
    __toolTipTextListenerId : null,


    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    /**
     * @type {qx.ui.layout.Abstract} The connected layout manager
     */
    __layoutManager : null,


    // overridden
    _getLayout : function() {
      return this.__layoutManager;
    },


    /**
     * Set a layout manager for the widget. A a layout manager can only be connected
     * with one widget. Reset the connection with a previous widget first, if you
     * like to use it in another widget instead.
     *
     * @param layout {qx.ui.layout.Abstract} The new layout or
     *     <code>null</code> to reset the layout.
     */
    _setLayout : function(layout)
    {
      if (qx.core.Environment.get("qx.debug")) {
        if (layout) {
          this.assertInstance(layout, qx.ui.layout.Abstract);
        }
      }

      if (this.__layoutManager) {
        this.__layoutManager.connectToWidget(null);
      }

      if (layout) {
        layout.connectToWidget(this);
      }

      this.__layoutManager = layout;
      qx.ui.core.queue.Layout.add(this);
    },


    // overridden
    setLayoutParent : function(parent)
    {
      if (this.$$parent === parent) {
        return;
      }

      var content = this.getContentElement();

      if (this.$$parent && !this.$$parent.$$disposed) {
        this.$$parent.getContentElement().remove(content);
      }

      this.$$parent = parent || null;

      if (parent && !parent.$$disposed) {
        this.$$parent.getContentElement().add(content);
      }

      // Update inheritable properties
      this.$$refreshInheritables();

      // Update visibility cache
      qx.ui.core.queue.Visibility.add(this);
    },


    /** @type {Boolean} Whether insets have changed and must be updated */
    _updateInsets : null,


    // overridden
    renderLayout : function(left, top, width, height)
    {
      var changes = this.base(arguments, left, top, width, height);

      // Directly return if superclass has detected that no
      // changes needs to be applied
      if (!changes) {
        return null;
      }

      if (qx.lang.Object.isEmpty(changes) && !this._updateInsets) {
        return null;
      }

      var content = this.getContentElement();
      var inner = changes.size || this._updateInsets;
      var pixel = "px";

      var contentStyles = {};
      // Move content to new position
      if (changes.position)
      {
        contentStyles.left = left + pixel;
        contentStyles.top = top + pixel;
      }

      if (inner || changes.margin)
      {
        contentStyles.width = width + pixel;
        contentStyles.height = height + pixel;
      }

      if (Object.keys(contentStyles).length > 0) {
        content.setStyles(contentStyles);
      }

      if (inner || changes.local || changes.margin)
      {
        if (this.__layoutManager && this.hasLayoutChildren()) {
          var inset = this.getInsets();
          var innerWidth = width - inset.left - inset.right;
          var innerHeight = height - inset.top - inset.bottom;

          var decorator = this.getDecorator();
          var decoratorPadding = {left: 0, right: 0, top: 0, bottom: 0};
          if (decorator) {
            decorator = qx.theme.manager.Decoration.getInstance().resolve(decorator);
            decoratorPadding = decorator.getPadding();
          }

          var padding = {
            top: this.getPaddingTop() + decoratorPadding.top,
            right: this.getPaddingRight() + decoratorPadding.right,
            bottom: this.getPaddingBottom() + decoratorPadding.bottom,
            left : this.getPaddingLeft() + decoratorPadding.left
          };

          this.__layoutManager.renderLayout(innerWidth, innerHeight, padding);
        } else if (this.hasLayoutChildren()) {
          throw new Error("At least one child in control " +
            this._findTopControl() +
            " requires a layout, but no one was defined!");
        }
      }

      // Fire events
      if (changes.position && this.hasListener("move")) {
        this.fireDataEvent("move", this.getBounds());
      }

      if (changes.size && this.hasListener("resize")) {
        this.fireDataEvent("resize", this.getBounds());
      }

      // Cleanup flags
      delete this._updateInsets;

      return changes;
    },










    /*
    ---------------------------------------------------------------------------
      SEPARATOR SUPPORT
    ---------------------------------------------------------------------------
    */

    __separators : null,

    // overridden
    clearSeparators : function()
    {
      var reg = this.__separators;
      if (!reg) {
        return;
      }

      var pool = qx.ui.core.Widget.__separatorPool;
      var content = this.getContentElement();
      var widget;

      for (var i=0, l=reg.length; i<l; i++)
      {
        widget = reg[i];
        pool.poolObject(widget);
        content.remove(widget.getContentElement());
      }

      // Clear registry
      reg.length = 0;
    },


    // overridden
    renderSeparator : function(separator, bounds)
    {
      // Insert
      var widget = qx.ui.core.Widget.__separatorPool.getObject(qx.ui.core.Widget);
      widget.set({
        decorator: separator
      });
      var elem = widget.getContentElement();
      this.getContentElement().add(elem);

      // Move
      var domEl = elem.getDomElement();
      // use the DOM element because the cache of the qx.html.Element could be
      // wrong due to changes made by the decorators which work on the DOM element too
      if (domEl) {
        domEl.style.top = bounds.top + "px";
        domEl.style.left = bounds.left + "px";
        domEl.style.width = bounds.width + "px";
        domEl.style.height = bounds.height + "px";
      } else {
        elem.setStyles({
          left : bounds.left + "px",
          top : bounds.top + "px",
          width : bounds.width + "px",
          height : bounds.height + "px"
        });
      }

      // Remember element
      if (!this.__separators) {
        this.__separators = [];
      }
      this.__separators.push(widget);
    },







    /*
    ---------------------------------------------------------------------------
      SIZE HINTS
    ---------------------------------------------------------------------------
    */

    // overridden
    _computeSizeHint : function()
    {
      // Start with the user defined values
      var width = this.getWidth();
      var minWidth = this.getMinWidth();
      var maxWidth = this.getMaxWidth();

      var height = this.getHeight();
      var minHeight = this.getMinHeight();
      var maxHeight = this.getMaxHeight();

      if (qx.core.Environment.get("qx.debug"))
      {
        if (minWidth !== null && maxWidth !== null) {
          this.assert(minWidth <= maxWidth, "minWidth is larger than maxWidth!");
        }
        if (minHeight !== null && maxHeight !== null) {
          this.assert(minHeight <= maxHeight, "minHeight is larger than maxHeight!");
        }
      }

      // Ask content
      var contentHint = this._getContentHint();

      var insets = this.getInsets();
      var insetX = insets.left + insets.right;
      var insetY = insets.top + insets.bottom;

      if (width == null) {
        width = contentHint.width + insetX;
      }

      if (height == null) {
        height = contentHint.height + insetY;
      }

      if (minWidth == null)
      {
        minWidth = insetX;

        if (contentHint.minWidth != null) {
          minWidth += contentHint.minWidth;
          // do not apply bigger min width than max width [BUG #5008]
          if (minWidth > maxWidth && maxWidth != null) {
            minWidth = maxWidth;
          }
        }
      }

      if (minHeight == null)
      {
        minHeight = insetY;

        if (contentHint.minHeight != null) {
          minHeight += contentHint.minHeight;
          // do not apply bigger min height than max height [BUG #5008]
          if (minHeight > maxHeight && maxHeight != null) {
            minHeight = maxHeight;
          }
        }
      }

      if (maxWidth == null)
      {
        if (contentHint.maxWidth == null) {
          maxWidth = Infinity;
        } else {
          maxWidth = contentHint.maxWidth + insetX;
          // do not apply bigger min width than max width [BUG #5008]
          if (maxWidth < minWidth && minWidth != null) {
            maxWidth = minWidth;
          }
        }
      }

      if (maxHeight == null)
      {
        if (contentHint.maxHeight == null) {
          maxHeight = Infinity;
        } else {
          maxHeight = contentHint.maxHeight + insetY;
          // do not apply bigger min width than max width [BUG #5008]
          if (maxHeight < minHeight && minHeight != null) {
            maxHeight = minHeight;
          }
        }
      }

      // Build size hint and return
      return {
        width : width,
        minWidth : minWidth,
        maxWidth : maxWidth,
        height : height,
        minHeight : minHeight,
        maxHeight : maxHeight
      };
    },


    // overridden
    invalidateLayoutCache : function()
    {
      this.base(arguments);

      if (this.__layoutManager) {
        this.__layoutManager.invalidateLayoutCache();
      }
    },


    /**
     * Returns the recommended/natural dimensions of the widget's content.
     *
     * For labels and images this may be their natural size when defined without
     * any dimensions. For containers this may be the recommended size of the
     * underlying layout manager.
     *
     * Developer note: This can be overwritten by the derived classes to allow
     * a custom handling here.
     *
     * @return {Map}
     */
    _getContentHint : function()
    {
      var layout = this.__layoutManager;
      if (layout)
      {
        if (this.hasLayoutChildren())
        {
          var hint = layout.getSizeHint();

          if (qx.core.Environment.get("qx.debug"))
          {
            var msg = "The layout of the widget" + this.toString() +
              " returned an invalid size hint!";
            this.assertInteger(hint.width, "Wrong 'left' argument. " + msg);
            this.assertInteger(hint.height, "Wrong 'top' argument. " + msg);
          }

          return hint;
        }
        else
        {
          return {
            width : 0,
            height : 0
          };
        }
      }
      else
      {
        return {
          width : 100,
          height : 50
        };
      }
    },


    // overridden
    _getHeightForWidth : function(width)
    {
      // Prepare insets
      var insets = this.getInsets();

      var insetX = insets.left + insets.right;
      var insetY = insets.top + insets.bottom;

      // Compute content width
      var contentWidth = width - insetX;

      // Compute height
      var layout = this._getLayout();
      if (layout && layout.hasHeightForWidth()) {
        var contentHeight =  layout.getHeightForWidth(width);
      } else {
        contentHeight = this._getContentHeightForWidth(contentWidth);
      }

      // Computed box height
      var height = contentHeight + insetY;

      return height;
    },


    /**
     * Returns the computed height for the given width.
     *
     * @abstract
     * @param width {Integer} Incoming width (as limitation)
     * @return {Integer} Computed height while respecting the given width.
     */
    _getContentHeightForWidth : function(width) {
      throw new Error("Abstract method call: _getContentHeightForWidth()!");
    },






    /*
    ---------------------------------------------------------------------------
      INSET CALCULATION SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the sum of the widget's padding and border width.
     *
     * @return {Map} Contains the keys <code>top</code>, <code>right</code>,
     *   <code>bottom</code> and <code>left</code>. All values are integers.
     */
    getInsets : function()
    {
      var top = this.getPaddingTop();
      var right = this.getPaddingRight();
      var bottom = this.getPaddingBottom();
      var left = this.getPaddingLeft();
      if (this.getDecorator()) {
        var decorator = qx.theme.manager.Decoration.getInstance().resolve(this.getDecorator());
        var inset = decorator.getInsets();

        if (qx.core.Environment.get("qx.debug"))
        {
          this.assertNumber(
            inset.top,
            "Invalid top decorator inset detected: " + inset.top
          );
          this.assertNumber(
            inset.right,
            "Invalid right decorator inset detected: " + inset.right
          );
          this.assertNumber(
            inset.bottom,
            "Invalid bottom decorator inset detected: " + inset.bottom
          );
          this.assertNumber(
            inset.left,
            "Invalid left decorator inset detected: " + inset.left
          );
        }

        top += inset.top;
        right += inset.right;
        bottom += inset.bottom;
        left += inset.left;
      }

      return {
        "top" : top,
        "right" : right,
        "bottom" : bottom,
        "left" : left
      };
    },





    /*
    ---------------------------------------------------------------------------
      COMPUTED LAYOUT SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the widget's computed inner size as available
     * through the layout process.
     *
     * This function is guaranteed to return a correct value
     * during a {@link #resize} or {@link #move} event dispatch.
     *
     * @return {Map} The widget inner dimension in pixel (if the layout is
     *    valid). Contains the keys <code>width</code> and <code>height</code>.
     */
    getInnerSize : function()
    {
      var computed = this.getBounds();
      if (!computed) {
        return null;
      }

      // Return map data
      var insets = this.getInsets();
      return {
        width : computed.width - insets.left - insets.right,
        height : computed.height - insets.top - insets.bottom
      };
    },





    /*
    ---------------------------------------------------------------------------
      ANIMATION SUPPORT: USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Fade out this widget.
     * @param duration {Number} Time in ms.
     * @return {qx.bom.element.AnimationHandle} The animation handle to react for
     *   the fade animation.
     */
    fadeOut : function(duration) {
      return this.getContentElement().fadeOut(duration);
    },

    /**
     * Fade in the widget.
     * @param duration {Number} Time in ms.
     * @return {qx.bom.element.AnimationHandle} The animation handle to react for
     *   the fade animation.
     */
    fadeIn : function(duration) {
      return this.getContentElement().fadeIn(duration);
    },


    /*
    ---------------------------------------------------------------------------
      VISIBILITY SUPPORT: USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Make this widget visible.
     *
     */
    show : function() {
      this.setVisibility("visible");
    },


    /**
     * Hide this widget.
     *
     */
    hide : function() {
      this.setVisibility("hidden");
    },


    /**
     * Hide this widget and exclude it from the underlying layout.
     *
     */
    exclude : function() {
      this.setVisibility("excluded");
    },


    /**
     * Whether the widget is locally visible.
     *
     * Note: This method does not respect the hierarchy.
     *
     * @return {Boolean} Returns <code>true</code> when the widget is visible
     */
    isVisible : function() {
      return this.getVisibility() === "visible";
    },


    /**
     * Whether the widget is locally hidden.
     *
     * Note: This method does not respect the hierarchy.
     *
     * @return {Boolean} Returns <code>true</code> when the widget is hidden
     */
    isHidden : function() {
      return this.getVisibility() !== "visible";
    },


    /**
     * Whether the widget is locally excluded.
     *
     * Note: This method does not respect the hierarchy.
     *
     * @return {Boolean} Returns <code>true</code> when the widget is excluded
     */
    isExcluded : function() {
      return this.getVisibility() === "excluded";
    },


    /**
     * Detects if the widget and all its parents are visible.
     *
     * WARNING: Please use this method with caution becuase it flushes the
     * internal queues which might be an expensive operation.
     *
     * @return {Boolean} true, if the widget is currently on the screen
     */
    isSeeable : function()
    {
      // Flush the queues because to detect if the widget ins visible, the
      // queues need to be flushed (see bug #5254)
      qx.ui.core.queue.Manager.flush();
      // if the element is already rendered, a check for the offsetWidth is enough
      var element = this.getContentElement().getDomElement();
      if (element) {
        // will also be 0 if the parents are not visible
        return element.offsetWidth > 0;
      }
      // if no element is available, it can not be visible
      return false;
    },




    /*
    ---------------------------------------------------------------------------
      CREATION OF HTML ELEMENTS
    ---------------------------------------------------------------------------
    */


    /**
     * Create the widget's content HTML element.
     *
     * @return {qx.html.Element} The content HTML element
     */
    __createContentElement : function()
    {
      var el = this._createContentElement();

      el.setAttribute("$$widget", this.toHashCode());

      if (qx.core.Environment.get("qx.debug")) {
        el.setAttribute("qxClass", this.classname);
      }

      var styles = {
        "zIndex": 10,
        "boxSizing": "border-box"
      };

      if (!qx.ui.root.Inline ||
        !(this instanceof qx.ui.root.Inline))
      {
        styles.position = "absolute";
      }

      el.setStyles(styles);

      return el;
    },


    /**
     * Creates the content element. The style properties
     * position and zIndex are modified from the Widget
     * core.
     *
     * This function may be overridden to customize a class
     * content.
     *
     * @return {qx.html.Element} The widget's content element
     */
    _createContentElement : function()
    {
      return new qx.html.Element("div", {
        overflowX: "hidden",
        overflowY: "hidden"
      });
    },


    /**
     * Returns the element wrapper of the widget's content element.
     * This method exposes widget internal and must be used with caution!
     *
     * @return {qx.html.Element} The widget's content element
     */
    getContentElement : function() {
      return this.__contentElement;
    },


    /*
    ---------------------------------------------------------------------------
      CHILDREN HANDLING
    ---------------------------------------------------------------------------
    */

    /** @type {qx.ui.core.LayoutItem[]} List of all child widgets */
    __widgetChildren : null,


    /**
     * Returns all children, which are layout relevant. This excludes all widgets,
     * which have a {@link qx.ui.core.Widget#visibility} value of <code>exclude</code>.
     *
     * @internal
     * @return {qx.ui.core.Widget[]} All layout relevant children.
     */
    getLayoutChildren : function()
    {
      var children = this.__widgetChildren;
      if (!children) {
        return this.__emptyChildren;
      }

      var layoutChildren;
      for (var i=0, l=children.length; i<l; i++)
      {
        var child = children[i];
        if (child.hasUserBounds() || child.isExcluded())
        {
          if (layoutChildren == null) {
            layoutChildren = children.concat();
          }

          qx.lang.Array.remove(layoutChildren, child);
        }
      }

      return layoutChildren || children;
    },


    /**
     * Marks the layout of this widget as invalid and triggers a layout update.
     * This is a shortcut for <code>qx.ui.core.queue.Layout.add(this);</code>.
     */
    scheduleLayoutUpdate : function() {
      qx.ui.core.queue.Layout.add(this);
    },


    /**
     * Resets the cache for children which should be laid out.
     */
    invalidateLayoutChildren : function()
    {
      var layout = this.__layoutManager;
      if (layout) {
        layout.invalidateChildrenCache();
      }

      qx.ui.core.queue.Layout.add(this);
    },


    /**
     * Returns whether the layout has children, which are layout relevant. This
     * excludes all widgets, which have a {@link qx.ui.core.Widget#visibility}
     * value of <code>exclude</code>.
     *
     * @return {Boolean} Whether the layout has layout relevant children
     */
    hasLayoutChildren : function()
    {
      var children = this.__widgetChildren;
      if (!children) {
        return false;
      }

      var child;
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        if (!child.hasUserBounds() && !child.isExcluded()) {
          return true;
        }
      }

      return false;
    },


    /**
     * Returns the widget which contains the children and
     * is relevant for laying them out. This is from the user point of
     * view and may not be identical to the technical structure.
     *
     * @return {qx.ui.core.Widget} Widget which contains the children.
     */
    getChildrenContainer : function() {
      return this;
    },


    /**
     * @type {Array} Placeholder for children list in empty widgets.
     *     Mainly to keep instance number low.
     *
     * @lint ignoreReferenceField(__emptyChildren)
     */
    __emptyChildren : [],


    /**
     * Returns the children list
     *
     * @return {LayoutItem[]} The children array (Arrays are
     *   reference types, so please do not modify it in-place).
     */
    _getChildren : function() {
      return this.__widgetChildren || this.__emptyChildren;
    },


    /**
     * Returns the index position of the given widget if it is
     * a child widget. Otherwise it returns <code>-1</code>.
     *
     * @param child {Widget} the widget to query for
     * @return {Integer} The index position or <code>-1</code> when
     *   the given widget is no child of this layout.
     */
    _indexOf : function(child)
    {
      var children = this.__widgetChildren;
      if (!children) {
        return -1;
      }

      return children.indexOf(child);
    },


    /**
     * Whether the widget contains children.
     *
     * @return {Boolean} Returns <code>true</code> when the widget has children.
     */
    _hasChildren : function()
    {
      var children = this.__widgetChildren;
      return children != null && (!!children[0]);
    },


    /**
     * Recursively adds all children to the given queue
     *
     * @param queue {Array} The queue to add widgets to
     */
    addChildrenToQueue : function(queue)
    {
      var children = this.__widgetChildren;
      if (!children) {
        return;
      }

      var child;
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        queue.push(child);

        child.addChildrenToQueue(queue);
      }
    },


    /**
     * Adds a new child widget.
     *
     * The supported keys of the layout options map depend on the layout manager
     * used to position the widget. The options are documented in the class
     * documentation of each layout manager {@link qx.ui.layout}.
     *
     * @param child {LayoutItem} the widget to add.
     * @param options {Map?null} Optional layout data for widget.
     */
    _add : function(child, options)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInstance(child, qx.ui.core.LayoutItem.constructor, "'Child' must be an instance of qx.ui.core.LayoutItem!")
      }

      // When moving in the same widget, remove widget first
      if (child.getLayoutParent() == this) {
        qx.lang.Array.remove(this.__widgetChildren, child);
      }

      if (this.__widgetChildren) {
        this.__widgetChildren.push(child);
      } else {
        this.__widgetChildren = [ child ];
      }

      this.__addHelper(child, options);
    },


    /**
     * Add a child widget at the specified index
     *
     * @param child {LayoutItem} widget to add
     * @param index {Integer} Index, at which the widget will be inserted
     * @param options {Map?null} Optional layout data for widget.
     */
    _addAt : function(child, index, options)
    {
      if (!this.__widgetChildren) {
        this.__widgetChildren = [];
      }

      // When moving in the same widget, remove widget first
      if (child.getLayoutParent() == this) {
        qx.lang.Array.remove(this.__widgetChildren, child);
      }

      var ref = this.__widgetChildren[index];

      if (ref === child) {
        child.setLayoutProperties(options);
      }

      if (ref) {
        qx.lang.Array.insertBefore(this.__widgetChildren, child, ref);
      } else {
        this.__widgetChildren.push(child);
      }

      this.__addHelper(child, options);
    },


    /**
     * Add a widget before another already inserted widget
     *
     * @param child {LayoutItem} widget to add
     * @param before {LayoutItem} widget before the new widget will be inserted.
     * @param options {Map?null} Optional layout data for widget.
     */
    _addBefore : function(child, before, options)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInArray(before, this._getChildren(),
          "The 'before' widget is not a child of this widget!");
      }

      if (child == before) {
        return;
      }

      if (!this.__widgetChildren) {
        this.__widgetChildren = [];
      }

      // When moving in the same widget, remove widget first
      if (child.getLayoutParent() == this) {
        qx.lang.Array.remove(this.__widgetChildren, child);
      }

      qx.lang.Array.insertBefore(this.__widgetChildren, child, before);

      this.__addHelper(child, options);
    },


    /**
     * Add a widget after another already inserted widget
     *
     * @param child {LayoutItem} widget to add
     * @param after {LayoutItem} widget, after which the new widget will
     *   be inserted
     * @param options {Map?null} Optional layout data for widget.
     */
    _addAfter : function(child, after, options)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInArray(after, this._getChildren(),
          "The 'after' widget is not a child of this widget!");
      }

      if (child == after) {
        return;
      }

      if (!this.__widgetChildren) {
        this.__widgetChildren = [];
      }

      // When moving in the same widget, remove widget first
      if (child.getLayoutParent() == this) {
        qx.lang.Array.remove(this.__widgetChildren, child);
      }

      qx.lang.Array.insertAfter(this.__widgetChildren, child, after);

      this.__addHelper(child, options);
    },


    /**
     * Remove the given child widget.
     *
     * @param child {LayoutItem} the widget to remove
     */
    _remove : function(child)
    {
      if (!this.__widgetChildren) {
        throw new Error("This widget has no children!");
      }

      qx.lang.Array.remove(this.__widgetChildren, child);
      this.__removeHelper(child);
    },


    /**
     * Remove the widget at the specified index.
     *
     * @param index {Integer} Index of the widget to remove.
     * @return {qx.ui.core.LayoutItem} The removed item.
     */
    _removeAt : function(index)
    {
      if (!this.__widgetChildren) {
        throw new Error("This widget has no children!");
      }

      var child = this.__widgetChildren[index];

      qx.lang.Array.removeAt(this.__widgetChildren, index);
      this.__removeHelper(child);

      return child;
    },


    /**
     * Remove all children.
     *
     * @return {Array} An array containing the removed children.
     */
    _removeAll : function()
    {
      if (!this.__widgetChildren) {
        return [];
      }

      // Working on a copy to make it possible to clear the
      // internal array before calling setLayoutParent()
      var children = this.__widgetChildren.concat();
      this.__widgetChildren.length = 0;

      for (var i=children.length-1; i>=0; i--) {
        this.__removeHelper(children[i]);
      }

      qx.ui.core.queue.Layout.add(this);

      return children;
    },




    /*
    ---------------------------------------------------------------------------
      CHILDREN HANDLING - TEMPLATE METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * This method gets called each time after a child widget was added and can
     * be overridden to get notified about child adds.
     *
     * @signature function(child)
     * @param child {qx.ui.core.LayoutItem} The added child.
     */
    _afterAddChild : null,


    /**
     * This method gets called each time after a child widget was removed and
     * can be overridden to get notified about child removes.
     *
     * @signature function(child)
     * @param child {qx.ui.core.LayoutItem} The removed child.
     */
    _afterRemoveChild : null,




    /*
    ---------------------------------------------------------------------------
      CHILDREN HANDLING - IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    /**
     * Convenience function to add a child widget. It will insert the child to
     * the parent widget and schedule a layout update.
     *
     * @param child {LayoutItem} The child to add.
     * @param options {Map|null} Optional layout data for the widget.
     */
    __addHelper : function(child, options)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInstance(child, qx.ui.core.LayoutItem, "Invalid widget to add: " + child);
        this.assertNotIdentical(child, this, "Could not add widget to itself: " + child);

        if (options != null) {
          this.assertType(options, "object", "Invalid layout data: " + options);
        }
      }

      // Remove from old parent
      var parent = child.getLayoutParent();
      if (parent && parent != this) {
        parent._remove(child);
      }

      // Remember parent
      child.setLayoutParent(this);

      // Import options: This call will
      //  - clear the layout's children cache as well and
      //  - add its parent (this widget) to the layout queue
      if (options) {
        child.setLayoutProperties(options);
      } else {
        this.updateLayoutProperties();
      }

      // call the template method
      if (this._afterAddChild) {
        this._afterAddChild(child);
      }
    },


    /**
     * Convenience function to remove a child widget. It will remove it
     * from the parent widget and schedule a layout update.
     *
     * @param child {LayoutItem} The child to remove.
     */
    __removeHelper : function(child)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertNotUndefined(child);
      }

      if (child.getLayoutParent() !== this) {
        throw new Error("Remove Error: " + child + " is not a child of this widget!");
      }

      // Clear parent connection
      child.setLayoutParent(null);

      // clear the layout's children cache
      if (this.__layoutManager) {
        this.__layoutManager.invalidateChildrenCache();
      }

      // Add to layout queue
      qx.ui.core.queue.Layout.add(this);

      // call the template method
      if (this._afterRemoveChild) {
        this._afterRemoveChild(child);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Enables mouse event capturing. All mouse events will dispatched on this
     * widget until capturing is disabled using {@link #releaseCapture} or a
     * mouse button is clicked. If the widgets becomes the capturing widget the
     * {@link #capture} event is fired. Once it loses capture mode the
     * {@link #losecapture} event is fired.
     *
     * @param capture {Boolean?true} If true all events originating in
     *   the container are captured. If false events originating in the container
     *   are not captured.
     */
    capture : function(capture) {
      this.getContentElement().capture(capture);
    },


    /**
     * Disables mouse capture mode enabled by {@link #capture}.
     */
    releaseCapture : function() {
      this.getContentElement().releaseCapture();
    },




    /*
    ---------------------------------------------------------------------------
      PADDING SUPPORT
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyPadding : function(value, old, name)
    {
      this._updateInsets = true;
      qx.ui.core.queue.Layout.add(this);

      this.__updateContentPadding(name, value);
    },


    /**
     * Helper to updated the css padding of the content element considering the
     * padding of the decorator.
     * @param style {String} The name of the css padding property e.g. <code>paddingTop</code>
     * @param value {Number} The value to set.
     */
    __updateContentPadding : function(style, value) {
      var content = this.getContentElement();
      var decorator = this.getDecorator();
      decorator = qx.theme.manager.Decoration.getInstance().resolve(decorator);
      if (decorator) {
        var direction = qx.Bootstrap.firstLow(style.replace("padding", ""));
        value += decorator.getPadding()[direction] || 0;
      }
      content.setStyle(style, value + "px");
    },


    /*
    ---------------------------------------------------------------------------
      DECORATION SUPPORT
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyDecorator : function(value, old)
    {
      var content = this.getContentElement();

      if (old) {
        old = qx.theme.manager.Decoration.getInstance().getCssClassName(old);
        content.removeClass(old);
      }

      if (value) {
        value = qx.theme.manager.Decoration.getInstance().addCssClass(value);
        content.addClass(value);
      }
    },




    /*
    ---------------------------------------------------------------------------
      OTHER PROPERTIES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyToolTipText : function(value, old)
    {
      if (qx.core.Environment.get("qx.dynlocale"))
      {
        if (this.__toolTipTextListenerId) {
          return;
        }
        var manager = qx.locale.Manager.getInstance();
        this.__toolTipTextListenerId = manager.addListener("changeLocale",
          function() {
            var toolTipText = this.getToolTipText();
            if (toolTipText && toolTipText.translate) {
              this.setToolTipText(toolTipText.translate());
            }
          }
        , this);
      }
    },

    // property apply
    _applyTextColor : function(value, old) {
      // empty template
    },


    // property apply
    _applyZIndex : function(value, old) {
      this.getContentElement().setStyle("zIndex", value == null ? 0 : value);
    },


    // property apply
    _applyVisibility : function(value, old)
    {
      var content = this.getContentElement();

      if (value === "visible") {
        content.show();
      } else {
        content.hide();
      }

      // only force a layout update if visibility change from/to "exclude"
      var parent = this.$$parent;
      if (parent && (old == null || value == null || old === "excluded" || value === "excluded")) {
        parent.invalidateLayoutChildren();
      }

      // Update visibility cache
      qx.ui.core.queue.Visibility.add(this);
    },


    // property apply
    _applyOpacity : function(value, old) {
      this.getContentElement().setStyle("opacity", value == 1 ? null : value);
    },


    // property apply
    _applyCursor : function(value, old)
    {
      if (value == null && !this.isSelectable()) {
        value = "default";
      }

      // In Opera the cursor must be set directly.
      // http://bugzilla.qooxdoo.org/show_bug.cgi?id=1729
      this.getContentElement().setStyle(
        "cursor", value, qx.core.Environment.get("engine.name") == "opera"
      );
    },


    // property apply
    _applyBackgroundColor : function(value, old) {
      var color = this.getBackgroundColor();
      var content = this.getContentElement();

      var resolved = qx.theme.manager.Color.getInstance().resolve(color);
      content.setStyle("backgroundColor", resolved);
    },


    // property apply
    _applyFont : function(value, old) {
      // empty template
    },


    /*
    ---------------------------------------------------------------------------
      DYNAMIC THEME SWITCH SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    _onChangeTheme : function() {
      this.base(arguments);

      // update the appearance
      this.updateAppearance();

      // DECORATOR //
      var value = this.getDecorator();
      this._applyDecorator(null, value);
      this._applyDecorator(value);

      // FONT //
      value = this.getFont();
      if (qx.lang.Type.isString(value)) {
        this._applyFont(value, value);
      }

      // TEXT COLOR //
      value = this.getTextColor();
      if (qx.lang.Type.isString(value)) {
        this._applyTextColor(value, value);
      }

      // BACKGROUND COLOR //
      value = this.getBackgroundColor();
      if (qx.lang.Type.isString(value)) {
        this._applyBackgroundColor(value, value);
      }
    },



    /*
    ---------------------------------------------------------------------------
      STATE HANDLING
    ---------------------------------------------------------------------------
    */

    /** @type {Map} The current widget states */
    __states : null,


    /** @type {Boolean} Whether the widget has state changes which are not yet queued */
    $$stateChanges : null,


    /** @type {Map} Can be overridden to forward states to the child controls. */
    _forwardStates : null,


    /**
     * Returns whether a state is set.
     *
     * @param state {String} the state to check.
     * @return {Boolean} whether the state is set.
     */
    hasState : function(state)
    {
      var states = this.__states;
      return !!states && !!states[state];
    },


    /**
     * Sets a state.
     *
     * @param state {String} The state to add
     */
    addState : function(state)
    {
      // Dynamically create state map
      var states = this.__states;
      if (!states) {
        states = this.__states = {};
      }

      if (states[state]) {
        return;
      }

      // Add state and queue
      this.__states[state] = true;

      // Fast path for hovered state
      if (state === "hovered") {
        this.syncAppearance();
      } else if (!qx.ui.core.queue.Visibility.isVisible(this)) {
        this.$$stateChanges = true;
      } else {
        qx.ui.core.queue.Appearance.add(this);
      }

      // Forward state change to child controls
      var forward = this._forwardStates;
      var controls = this.__childControls;

      if (forward && forward[state] && controls)
      {
        var control;
        for (var id in controls)
        {
          control = controls[id];
          if (control instanceof qx.ui.core.Widget) {
            controls[id].addState(state);
          }
        }
      }
    },


    /**
     * Clears a state.
     *
     * @param state {String} the state to clear.
     */
    removeState : function(state)
    {
      // Check for existing state
      var states = this.__states;
      if (!states || !states[state]) {
        return;
      }

      // Clear state and queue
      delete this.__states[state];

      // Fast path for hovered state
      if (state === "hovered") {
        this.syncAppearance();
      } else if (!qx.ui.core.queue.Visibility.isVisible(this)) {
        this.$$stateChanges = true;
      } else {
        qx.ui.core.queue.Appearance.add(this);
      }

      // Forward state change to child controls
      var forward = this._forwardStates;
      var controls = this.__childControls;

      if (forward && forward[state] && controls)
      {
        for (var id in controls)
        {
          var control = controls[id];
          if (control instanceof qx.ui.core.Widget) {
            control.removeState(state);
          }
        }
      }
    },


    /**
     * Replaces the first state with the second one.
     *
     * This method is ideal for state transitions e.g. normal => selected.
     *
     * @param old {String} Previous state
     * @param value {String} New state
     */
    replaceState : function(old, value)
    {
      var states = this.__states;
      if (!states) {
        states = this.__states = {};
      }

      if (!states[value]) {
        states[value] = true;
      }

      if (states[old]) {
        delete states[old];
      }

      if (!qx.ui.core.queue.Visibility.isVisible(this)) {
        this.$$stateChanges = true;
      } else {
        qx.ui.core.queue.Appearance.add(this);
      }

      // Forward state change to child controls
      var forward = this._forwardStates;
      var controls = this.__childControls;

      if (forward && forward[value] && controls)
      {
        for (var id in controls)
        {
          var control = controls[id];
          if (control instanceof qx.ui.core.Widget) {
            control.replaceState(old, value);
          }
        }
      }
    },





    /*
    ---------------------------------------------------------------------------
      APPEARANCE SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {String} The currently compiled selector to lookup the matching appearance */
    __appearanceSelector : null,


    /** @type {Boolean} Whether the selectors needs to be recomputed before updating appearance */
    __updateSelector : null,


    /**
     * Renders the appearance using the current widget states.
     *
     * Used exclusively by {qx.ui.core.queue.Appearance}.
     */
    syncAppearance : function()
    {
      var states = this.__states;
      var selector = this.__appearanceSelector;
      var manager = qx.theme.manager.Appearance.getInstance();

      // Cache deep accessor
      var styler = qx.core.Property.$$method.setThemed;
      var unstyler = qx.core.Property.$$method.resetThemed;

      // Check for requested selector update
      if (this.__updateSelector)
      {
        // Clear flag
        delete this.__updateSelector;

        // Check if the selector was created previously
        if (selector)
        {
          // Query old selector
          var oldData = manager.styleFrom(selector, states, null, this.getAppearance());

          // Clear current selector (to force recompute)
          selector = null;
        }
      }

      // Build selector
      if (!selector)
      {
        var obj = this;
        var id = [];

        do {
          id.push(obj.$$subcontrol||obj.getAppearance());
        } while (obj = obj.$$subparent);

        // Combine parent control IDs, add top level appearance, filter result
        // to not include positioning information anymore (e.g. #3)
        selector = id.reverse().join("/").replace(/#[0-9]+/g, "");
        this.__appearanceSelector = selector;
      }

      // Query current selector
      var newData = manager.styleFrom(selector, states, null, this.getAppearance());
      if (newData)
      {
        if (oldData)
        {
          for (var prop in oldData)
          {
            if (newData[prop] === undefined) {
              this[unstyler[prop]]();
            }
          }
        }

        // Check property availability of new data
        if (qx.core.Environment.get("qx.debug"))
        {
          for (var prop in newData)
          {
            if (!this[styler[prop]]) {
              throw new Error(this.classname +
                ' has no themeable property "' + prop +
                '" while styling ' + selector);
            }
          }
        }

        // Apply new data
        for (var prop in newData) {
          newData[prop] === undefined ? this[unstyler[prop]]() : this[styler[prop]](newData[prop]);
        }
      }
      else if (oldData)
      {
        // Clear old data
        for (var prop in oldData) {
          this[unstyler[prop]]();
        }
      }

      this.fireDataEvent("syncAppearance", this.__states);
    },


    // property apply
    _applyAppearance : function(value, old) {
      this.updateAppearance();
    },


    /**
     * Helper method called from the visibility queue to detect outstanding changes
     * to the appearance.
     *
     * @internal
     */
    checkAppearanceNeeds : function()
    {
      // CASE 1: Widget has never got an appearance already because it was never
      // visible before. Normally add it to the queue is the easiest way to update it.
      if (!this.__initialAppearanceApplied)
      {
        qx.ui.core.queue.Appearance.add(this);
        this.__initialAppearanceApplied = true;
      }

      // CASE 2: Widget has got an appearance before, but was hidden for some time
      // which results into maybe omitted state changes have not been applied.
      // In this case the widget is already queued in the appearance. This is basically
      // what all addState/removeState do, but the queue itself may not have been registered
      // to be flushed
      else if (this.$$stateChanges)
      {
        qx.ui.core.queue.Appearance.add(this);
        delete this.$$stateChanges;
      }
    },


    /**
     * Refreshes the appearance of this widget and all
     * registered child controls.
     */
    updateAppearance : function()
    {
      // Clear selector
      this.__updateSelector = true;

      // Add to appearance queue
      qx.ui.core.queue.Appearance.add(this);

      // Update child controls
      var controls = this.__childControls;
      if (controls)
      {
        var obj;
        for (var id in controls)
        {
          obj = controls[id];

          if (obj instanceof qx.ui.core.Widget) {
            obj.updateAppearance();
          }
        }
      }
    },





    /*
    ---------------------------------------------------------------------------
      WIDGET QUEUE
    ---------------------------------------------------------------------------
    */

    /**
     * This method is called during the flush of the
     * {@link qx.ui.core.queue.Widget widget queue}.
     *
     * @param jobs {Map} A map of jobs.
     */
    syncWidget : function(jobs) {
      // empty implementation
    },





    /*
    ---------------------------------------------------------------------------
      EVENT SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the next event target in the parent chain. May
     * also return the widget itself if it is not anonymous.
     *
     * @return {qx.ui.core.Widget} A working event target of this widget.
     *    May be <code>null</code> as well.
     */
    getEventTarget : function()
    {
      var target = this;

      while (target.getAnonymous())
      {
        target = target.getLayoutParent();
        if (!target) {
          return null;
        }
      }

      return target;
    },


    /**
     * Returns the next focus target in the parent chain. May
     * also return the widget itself if it is not anonymous and focusable.
     *
     * @return {qx.ui.core.Widget} A working focus target of this widget.
     *    May be <code>null</code> as well.
     */
    getFocusTarget : function()
    {
      var target = this;

      if (!target.getEnabled()) {
        return null;
      }

      while (target.getAnonymous() || !target.getFocusable())
      {
        target = target.getLayoutParent();
        if (!target || !target.getEnabled()) {
          return null;
        }
      }

      return target;
    },


    /**
     * Returns the element which should be focused.
     *
     * @return {qx.html.Element} The html element to focus.
     */
    getFocusElement : function() {
      return this.getContentElement();
    },


    /**
     * Whether the widget is reachable by pressing the TAB key.
     *
     * Normally tests for both, the focusable property and a positive or
     * undefined tabIndex property. The widget must have a DOM element
     * since only visible widgets are tabable.
     *
     * @return {Boolean} Whether the element is tabable.
     */
    isTabable : function() {
      return (!!this.getContentElement().getDomElement()) && this.isFocusable();
    },


    // property apply
    _applyFocusable : function(value, old)
    {
      var target = this.getFocusElement();

      // Apply native tabIndex attribute
      if (value)
      {
        var tabIndex = this.getTabIndex();
        if (tabIndex == null) {
          tabIndex = 1;
        }

        target.setAttribute("tabIndex", tabIndex);

        // Omit native dotted outline border
        target.setStyle("outline", "none");
      }
      else
      {
        if (target.isNativelyFocusable()) {
          target.setAttribute("tabIndex", -1);
        } else if (old) {
          target.setAttribute("tabIndex", null);
        }
      }
    },


    // property apply
    _applyKeepFocus : function(value)
    {
      var target = this.getFocusElement();
      target.setAttribute("qxKeepFocus", value ? "on" : null);
    },


    // property apply
    _applyKeepActive : function(value)
    {
      var target = this.getContentElement();
      target.setAttribute("qxKeepActive", value ? "on" : null);
    },


    // property apply
    _applyTabIndex : function(value)
    {
      if (value == null) {
        value = 1;
      } else if (value < 1 || value > 32000) {
        throw new Error("TabIndex property must be between 1 and 32000");
      }

      if (this.getFocusable() && value != null) {
        this.getFocusElement().setAttribute("tabIndex", value);
      }
    },


    // property apply
    _applySelectable : function(value, old)
    {
      // Re-apply cursor if not in "initSelectable"
      if (old !== null) {
        this._applyCursor(this.getCursor());
      }

      // Apply qooxdoo attribute
      this.getContentElement().setSelectable(value);
    },


    // property apply
    _applyEnabled : function(value, old)
    {
      if (value===false)
      {
        this.addState("disabled");

        // hovered not configured in widget, but as this is a
        // standardized name in qooxdoo and we never want a hover
        // state for disabled widgets, remove this state everytime
        this.removeState("hovered");

        // Blur when focused
        if (this.isFocusable())
        {
          // Remove focused state
          this.removeState("focused");

          // Remove tabIndex
          this._applyFocusable(false, true);
        }

        // Remove draggable
        if (this.isDraggable()) {
          this._applyDraggable(false, true);
        }

        // Remove droppable
        if (this.isDroppable()) {
          this._applyDroppable(false, true);
        }
      }
      else
      {
        this.removeState("disabled");

        // Re-add tabIndex
        if (this.isFocusable()) {
          this._applyFocusable(true, false);
        }

        // Re-add draggable
        if (this.isDraggable()) {
          this._applyDraggable(true, false);
        }

        // Re-add droppable
        if (this.isDroppable()) {
          this._applyDroppable(true, false);
        }
      }
    },




    /*
    ---------------------------------------------------------------------------
      CONTEXT MENU
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyNativeContextMenu : function(value, old, name) {
      // empty body to allow overriding
    },


    // property apply
    _applyContextMenu : function(value, old)
    {
      if (old)
      {
        old.removeState("contextmenu");

        if (old.getOpener() == this) {
          old.resetOpener();
        }

        if (!value)
        {
          this.removeListener("contextmenu", this._onContextMenuOpen);
          old.removeListener("changeVisibility", this._onBeforeContextMenuOpen, this);
        }
      }

      if (value)
      {
        value.setOpener(this);
        value.addState("contextmenu");

        if (!old)
        {
          this.addListener("contextmenu", this._onContextMenuOpen);
          value.addListener("changeVisibility", this._onBeforeContextMenuOpen, this);
        }
      }
    },


    /**
     * Event listener for <code>contextmenu</code> event
     *
     * @param e {qx.event.type.Mouse} The event object
     */
    _onContextMenuOpen : function(e)
    {
      this.getContextMenu().openAtMouse(e);

      // Do not show native menu
      // don't open any other contextmenus
      e.stop();
    },


    /**
     * Event listener for <code>beforeContextmenuOpen</code> event
     *
     * @param e {qx.event.type.Data} The data event
     */
    _onBeforeContextMenuOpen : function(e)
    {
      if (e.getData() == "visible" && this.hasListener("beforeContextmenuOpen")) {
        this.fireDataEvent("beforeContextmenuOpen", e);
      }
    },




    /*
    ---------------------------------------------------------------------------
      USEFUL COMMON EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener which stops a bubbling event from
     * propagates further.
     *
     * @param e {qx.event.type.Event} Any bubbling event
     */
    _onStopEvent : function(e) {
      e.stopPropagation();
    },





    /*
    ---------------------------------------------------------------------------
      DRAG & DROP SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Helper to return a instance of a {@link qx.ui.core.DragDropCursor}.
     * If you want to use your own DragDropCursor, override this method
     * and return your custom instance.
     * @return {qx.ui.core.DragDropCursor} A drag drop cursor implementation.
     */
    _getDragDropCursor : function() {
      return qx.ui.core.DragDropCursor.getInstance();
    },

    // property apply
    _applyDraggable : function(value, old)
    {
      if (qx.event.handler.MouseEmulation.ON) {
        return;
      }
      if (!this.isEnabled() && value === true) {
        value = false;
      }

      // Force cursor creation
      this._getDragDropCursor();

      // Process listeners
      if (value)
      {
        this.addListener("dragstart", this._onDragStart);
        this.addListener("drag", this._onDrag);
        this.addListener("dragend", this._onDragEnd);
        this.addListener("dragchange", this._onDragChange);
      }
      else
      {
        this.removeListener("dragstart", this._onDragStart);
        this.removeListener("drag", this._onDrag);
        this.removeListener("dragend", this._onDragEnd);
        this.removeListener("dragchange", this._onDragChange);
      }

      // Sync DOM attribute
      this.getContentElement().setAttribute("qxDraggable", value ? "on" : null);
    },


    // property apply
    _applyDroppable : function(value, old)
    {
      if (!this.isEnabled() && value === true) {
        value = false;
      }

      // Sync DOM attribute
      this.getContentElement().setAttribute("qxDroppable", value ? "on" : null);
    },


    /**
     * Event listener for own <code>dragstart</code> event.
     *
     * @param e {qx.event.type.Drag} Drag event
     */
    _onDragStart : function(e)
    {
      this._getDragDropCursor().placeToMouse(e);
      this.getApplicationRoot().setGlobalCursor("default");
    },


    /**
     * Event listener for own <code>drag</code> event.
     *
     * @param e {qx.event.type.Drag} Drag event
     */
    _onDrag : function(e) {
      this._getDragDropCursor().placeToMouse(e);
    },


    /**
     * Event listener for own <code>dragend</code> event.
     *
     * @param e {qx.event.type.Drag} Drag event
     */
    _onDragEnd : function(e)
    {
      this._getDragDropCursor().moveTo(-1000, -1000);
      this.getApplicationRoot().resetGlobalCursor();
    },


    /**
     * Event listener for own <code>dragchange</code> event.
     *
     * @param e {qx.event.type.Drag} Drag event
     */
    _onDragChange : function(e)
    {
      var cursor = this._getDragDropCursor();
      var action = e.getCurrentAction();
      action ? cursor.setAction(action) : cursor.resetAction();
    },






    /*
    ---------------------------------------------------------------------------
      VISUALIZE FOCUS STATES
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler which is executed when the widget receives the focus.
     *
     * This method is used by the {@link qx.ui.core.FocusHandler} to
     * apply states etc. to a focused widget.
     *
     * @internal
     */
    visualizeFocus : function() {
      this.addState("focused");
    },


    /**
     * Event handler which is executed when the widget lost the focus.
     *
     * This method is used by the {@link qx.ui.core.FocusHandler} to
     * remove states etc. from a previously focused widget.
     *
     * @internal
     */
    visualizeBlur : function() {
      this.removeState("focused");
    },






    /*
    ---------------------------------------------------------------------------
      SCROLL CHILD INTO VIEW
    ---------------------------------------------------------------------------
    */

    /**
     * The method scrolls the given item into view.
     *
     * @param child {qx.ui.core.Widget} Child to scroll into view
     * @param alignX {String?null} Alignment of the item. Allowed values:
     *   <code>left</code> or <code>right</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param alignY {String?null} Alignment of the item. Allowed values:
     *   <code>top</code> or <code>bottom</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param direct {Boolean?true} Whether the execution should be made
     *   directly when possible
     */
    scrollChildIntoView : function(child, alignX, alignY, direct)
    {
      // Scroll directly on default
      direct = typeof direct == "undefined" ? true : direct;

      // Always lazy scroll when either
      // - the child
      // - its layout parent
      // - its siblings
      // have layout changes scheduled.
      //
      // This is to make sure that the scroll position is computed
      // after layout changes have been applied to the DOM. Note that changes
      // scheduled for the grand parent (and up) are not tracked and need to
      // be signalled manually.
      var Layout = qx.ui.core.queue.Layout;
      var parent;

      // Child
      if (direct) {
        direct = !Layout.isScheduled(child);
        parent = child.getLayoutParent();

        // Parent
        if (direct && parent) {
          direct = !Layout.isScheduled(parent);

          // Siblings
          if (direct) {
            parent.getChildren().forEach(function(sibling) {
              direct = direct && !Layout.isScheduled(sibling);
            });
          }
        }
      }

      this.scrollChildIntoViewX(child, alignX, direct);
      this.scrollChildIntoViewY(child, alignY, direct);
    },


    /**
     * The method scrolls the given item into view (x-axis only).
     *
     * @param child {qx.ui.core.Widget} Child to scroll into view
     * @param align {String?null} Alignment of the item. Allowed values:
     *   <code>left</code> or <code>right</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param direct {Boolean?true} Whether the execution should be made
     *   directly when possible
     */
    scrollChildIntoViewX : function(child, align, direct) {
      this.getContentElement().scrollChildIntoViewX(child.getContentElement(), align, direct);
    },


    /**
     * The method scrolls the given item into view (y-axis only).
     *
     * @param child {qx.ui.core.Widget} Child to scroll into view
     * @param align {String?null} Alignment of the element. Allowed values:
     *   <code>top</code> or <code>bottom</code>. Could also be null.
     *   Without a given alignment the method tries to scroll the widget
     *   with the minimum effort needed.
     * @param direct {Boolean?true} Whether the execution should be made
     *   directly when possible
     */
    scrollChildIntoViewY : function(child, align, direct) {
      this.getContentElement().scrollChildIntoViewY(child.getContentElement(), align, direct);
    },





    /*
    ---------------------------------------------------------------------------
      FOCUS SYSTEM USER ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Focus this widget.
     *
     */
    focus : function()
    {
      if (this.isFocusable()) {
        this.getFocusElement().focus();
      } else {
        throw new Error("Widget is not focusable!");
      }
    },


    /**
     * Remove focus from this widget.
     *
     */
    blur : function()
    {
      if (this.isFocusable()) {
        this.getFocusElement().blur();
      } else {
        throw new Error("Widget is not focusable!");
      }
    },


    /**
     * Activate this widget e.g. for keyboard events.
     *
     */
    activate : function() {
      this.getContentElement().activate();
    },


    /**
     * Deactivate this widget e.g. for keyboard events.
     *
     */
    deactivate : function() {
      this.getContentElement().deactivate();
    },


    /**
     * Focus this widget when using the keyboard. This is
     * mainly thought for the advanced qooxdoo keyboard handling
     * and should not be used by the application developer.
     *
     * @internal
     */
    tabFocus : function() {
      this.getFocusElement().focus();
    },





    /*
    ---------------------------------------------------------------------------
      CHILD CONTROL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the given ID is assigned to a child control.
     *
     * @param id {String} ID of the child control
     * @return {Boolean} <code>true</code> when the child control is registered.
     */
    hasChildControl : function(id)
    {
      if (!this.__childControls) {
        return false;
      }

      return !!this.__childControls[id];
    },


    /** @type {Map} Map of instantiated child controls */
    __childControls : null,


    /**
     * Returns a map of all already created child controls
     *
     * @return {Map} mapping of child control id to the child widget.
     */
    _getCreatedChildControls : function() {
      return this.__childControls;
    },


    /**
     * Returns the child control from the given ID. Returns
     * <code>null</code> when the child control is unknown.
     *
     * It is designed for widget authors, who want to access child controls,
     * which are created by the widget itself.
     *
     * <b>Warning</b>: This method exposes widget internals and modifying the
     * returned sub widget may bring the widget into an inconsistent state.
     * Accessing child controls defined in a super class or in an foreign class
     * is not supported. Do not use it if the result can be achieved using public
     * API or theming.
     *
     * @param id {String} ID of the child control
     * @param notcreate {Boolean?false} Whether the child control
     *    should not be created dynamically if not yet available.
     * @return {qx.ui.core.Widget} Child control
     */
    getChildControl : function(id, notcreate)
    {
      if (!this.__childControls)
      {
        if (notcreate) {
          return null;
        }

        this.__childControls = {};
      }

      var control = this.__childControls[id];
      if (control) {
        return control;
      }

      if (notcreate === true) {
        return null;
      }

      return this._createChildControl(id);
    },


    /**
     * Shows the given child control by ID
     *
     * @param id {String} ID of the child control
     * @return {qx.ui.core.Widget} the child control
     */
    _showChildControl : function(id)
    {
      var control = this.getChildControl(id);
      control.show();
      return control;
    },


    /**
     * Excludes the given child control by ID
     *
     * @param id {String} ID of the child control
     */
    _excludeChildControl : function(id)
    {
      var control = this.getChildControl(id, true);
      if (control) {
        control.exclude();
      }
    },


    /**
     * Whether the given child control is visible.
     *
     * @param id {String} ID of the child control
     * @return {Boolean} <code>true</code> when the child control is visible.
     */
    _isChildControlVisible : function(id)
    {
      var control = this.getChildControl(id, true);
      if (control) {
        return control.isVisible();
      }

      return false;
    },


    /**
     * Release the child control by ID and decouple the
     * child from the parent. This method does not dispose the child control.
     *
     * @param id {String} ID of the child control
     * @return {qx.ui.core.Widget} The released control
     */
    _releaseChildControl : function(id)
    {
      var control = this.getChildControl(id, false);
      if (!control) {
        throw new Error("Unsupported control: " + id);
      }

      // remove connection to parent
      delete control.$$subcontrol;
      delete control.$$subparent;

      // remove state forwarding
      var states = this.__states;
      var forward = this._forwardStates;

      if (states && forward && control instanceof qx.ui.core.Widget) {
        for (var state in states) {
          if (forward[state]) {
            control.removeState(state);
          }
        }
      }

      delete this.__childControls[id];

      return control;
    },


    /**
     * Force the creation of the given child control by ID.
     *
     * Do not override this method! Override {@link #_createChildControlImpl}
     * instead if you need to support new controls.
     *
     * @param id {String} ID of the child control
     * @return {qx.ui.core.Widget} The created control
     * @throws {Error} when the control was created before
     */
    _createChildControl : function(id)
    {
      if (!this.__childControls) {
        this.__childControls = {};
      } else if (this.__childControls[id]) {
        throw new Error("Child control '" + id + "' already created!");
      }

      var pos = id.indexOf("#");
      try {
        if (pos == -1) {
          var control = this._createChildControlImpl(id);
        } else {
          var control = this._createChildControlImpl(
            id.substring(0, pos), id.substring(pos + 1, id.length)
          );
        }
      } catch(exc) {
        exc.message = "Exception while creating child control '" + id +
        "' of widget " + this.toString() + ": " + exc.message;
        throw exc;
      }

      if (!control) {
        throw new Error("Unsupported control: " + id);
      }

      // Establish connection to parent
      control.$$subcontrol = id;
      control.$$subparent = this;

      // Support for state forwarding
      var states = this.__states;
      var forward = this._forwardStates;

      if (states && forward && control instanceof qx.ui.core.Widget)
      {
        for (var state in states)
        {
          if (forward[state]) {
            control.addState(state);
          }
        }
      }

      this.fireDataEvent("createChildControl", control);

      // Register control and return
      return this.__childControls[id] = control;
    },


    /**
     * Internal method to create child controls. This method
     * should be overwritten by classes which extends this one
     * to support new child control types.
     *
     * @param id {String} ID of the child control. If a # is used, the id is
     *   the part infront of the #.
     * @param hash {String?undefined} If a child control name contains a #,
     *   all text following the # will be the hash argument.
     * @return {qx.ui.core.Widget} The created control or <code>null</code>
     */
    _createChildControlImpl : function(id, hash) {
      return null;
    },


    /**
     * Dispose all registered controls. This is automatically
     * executed by the widget.
     *
     */
    _disposeChildControls : function()
    {
      var controls = this.__childControls;
      if (!controls) {
        return;
      }

      var Widget = qx.ui.core.Widget;

      for (var id in controls)
      {
        var control = controls[id];
        if (!Widget.contains(this, control)) {
          control.destroy();
        } else {
          control.dispose();
        }
      }

      delete this.__childControls;
    },


    /**
     * Finds and returns the top level control. This is the first
     * widget which is not a child control of any other widget.
     *
     * @return {qx.ui.core.Widget} The top control
     */
    _findTopControl : function()
    {
      var obj = this;
      while (obj)
      {
        if (!obj.$$subparent) {
          return obj;
        }

        obj = obj.$$subparent;
      }

      return null;
    },




    /*
    ---------------------------------------------------------------------------
      LOWER LEVEL ACCESS
    ---------------------------------------------------------------------------
    */


    /**
     * Computes the location of the content element in context of the document
     * dimensions.
     *
     * Supported modes:
     *
     * * <code>margin</code>: Calculate from the margin box of the element
     *   (bigger than the visual appearance: including margins of given element)
     * * <code>box</code>: Calculates the offset box of the element (default,
     *   uses the same size as visible)
     * * <code>border</code>: Calculate the border box (useful to align to
     *   border edges of two elements).
     * * <code>scroll</code>: Calculate the scroll box (relevant for absolute
     *   positioned content).
     * * <code>padding</code>: Calculate the padding box (relevant for
     *   static/relative positioned content).
     *
     * @param mode {String?box} A supported option. See comment above.
     * @return {Map} Returns a map with <code>left</code>, <code>top</code>,
     *   <code>right</code> and <code>bottom</code> which contains the distance
     *   of the element relative to the document.
     */
    getContentLocation : function(mode)
    {
      var domEl = this.getContentElement().getDomElement();
      return domEl ? qx.bom.element.Location.get(domEl, mode) : null;
    },


    /**
     * Directly modifies the relative left position in relation
     * to the parent element.
     *
     * Use with caution! This may be used for animations, drag&drop
     * or other cases where high performance location manipulation
     * is important. Otherwise please use {@link qx.ui.core.LayoutItem#setUserBounds} instead.
     *
     * @param value {Integer} Left position
     */
    setDomLeft : function(value)
    {
      var domEl = this.getContentElement().getDomElement();
      if (domEl) {
        domEl.style.left = value + "px";
      } else {
        throw new Error("DOM element is not yet created!");
      }
    },


    /**
     * Directly modifies the relative top position in relation
     * to the parent element.
     *
     * Use with caution! This may be used for animations, drag&drop
     * or other cases where high performance location manipulation
     * is important. Otherwise please use {@link qx.ui.core.LayoutItem#setUserBounds} instead.
     *
     * @param value {Integer} Top position
     */
    setDomTop : function(value)
    {
      var domEl = this.getContentElement().getDomElement();
      if (domEl) {
        domEl.style.top = value + "px";
      } else {
        throw new Error("DOM element is not yet created!");
      }
    },


    /**
     * Directly modifies the relative left and top position in relation
     * to the parent element.
     *
     * Use with caution! This may be used for animations, drag&drop
     * or other cases where high performance location manipulation
     * is important. Otherwise please use {@link qx.ui.core.LayoutItem#setUserBounds} instead.
     *
     * @param left {Integer} Left position
     * @param top {Integer} Top position
     */
    setDomPosition : function(left, top)
    {
      var domEl = this.getContentElement().getDomElement();
      if (domEl)
      {
        domEl.style.left = left + "px";
        domEl.style.top = top + "px";
      }
      else
      {
        throw new Error("DOM element is not yet created!");
      }
    },




    /*
    ---------------------------------------------------------------------------
      ENHANCED DISPOSE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Removes this widget from its parent and disposes it.
     *
     * Please note that the widget is not disposed synchronously. The
     * real dispose happens after the next queue flush.
     *
     */
    destroy : function()
    {
      if (this.$$disposed) {
        return;
      }

      var parent = this.$$parent;
      if (parent) {
        parent._remove(this);
      }

      qx.ui.core.queue.Dispose.add(this);
    },





    /*
    ---------------------------------------------------------------------------
      CLONE SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    clone : function()
    {
      var clone = this.base(arguments);

      if (this.getChildren)
      {
        var children = this.getChildren();
        for (var i=0, l=children.length; i<l; i++) {
          clone.add(children[i].clone());
        }
      }

      return clone;
    }

  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    // Some dispose stuff is not needed in global shutdown, otherwise
    // it just slows down things a bit, so do not do them.
    if (!qx.core.ObjectRegistry.inShutDown)
    {
      if (qx.core.Environment.get("qx.dynlocale"))
      {
        if (this.__toolTipTextListenerId)
        {
          qx.locale.Manager.getInstance().removeListenerById(
            this.__toolTipTextListenerId
          );
        }
      }

      // Remove widget pointer from DOM
      var contentEl = this.getContentElement();
      if (contentEl) {
        contentEl.setAttribute("$$widget", null, true);
      }

      // Clean up all child controls
      this._disposeChildControls();

      // Remove from ui queues
      qx.ui.core.queue.Appearance.remove(this);
      qx.ui.core.queue.Layout.remove(this);
      qx.ui.core.queue.Visibility.remove(this);
      qx.ui.core.queue.Widget.remove(this);
    }

    if (this.getContextMenu()) {
      this.setContextMenu(null);
    }

    // pool decorators if not in global shutdown
    if (!qx.core.ObjectRegistry.inShutDown)
    {
      this.clearSeparators();
      this.__separators = null;
    }
    else
    {
      this._disposeArray("__separators");
    }

    // Clear children array
    this._disposeArray("__widgetChildren");


    // Cleanup map of appearance states
    this.__states = this.__childControls = null;


    // Dispose layout manager and HTML elements
    this._disposeObjects(
      "__layoutManager",
      "__contentElement"
    );
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Connects the widgets to the browser DOM events.
 */
qx.Class.define("qx.ui.core.EventHandler",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.__manager = qx.event.Registration.getManager(window);
  },



  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_FIRST,

    /** @type {Map} Supported event types. Identical to events map of qx.ui.core.Widget */
    SUPPORTED_TYPES :
    {
      // mouse events
      mousemove : 1,
      mouseover : 1,
      mouseout : 1,
      mousedown : 1,
      mouseup : 1,
      click : 1,
      dblclick : 1,
      contextmenu : 1,
      mousewheel : 1,

      // key events
      keyup : 1,
      keydown : 1,
      keypress : 1,
      keyinput : 1,

      // mouse capture
      capture : 1,
      losecapture : 1,

      // focus events
      focusin : 1,
      focusout : 1,
      focus : 1,
      blur : 1,
      activate : 1,
      deactivate : 1,

      // appear events
      appear : 1,
      disappear : 1,

      // drag drop events
      dragstart : 1,
      dragend : 1,
      dragover : 1,
      dragleave : 1,
      drop : 1,
      drag : 1,
      dragchange : 1,
      droprequest : 1,

      // touch events
      touchstart : 1,
      touchend : 1,
      touchmove : 1,
      touchcancel : 1,
      tap : 1,
      longtap : 1,
      swipe : 1
    },

    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __manager : null,


    /**
     * @type {Map} Supported focus event types
     *
     * @lint ignoreReferenceField(__focusEvents)
     */
    __focusEvents :
    {
      focusin : 1,
      focusout : 1,
      focus : 1,
      blur : 1
    },


    /**
     * @type {Map} Map of events which should be fired independently from being disabled
     *
     * @lint ignoreReferenceField(__ignoreDisabled)
     */
    __ignoreDisabled :
    {
      // mouse events
      mouseover : 1,
      mouseout : 1,

      // appear events
      appear : 1,
      disappear : 1
    },


    // interface implementation
    canHandleEvent : function(target, type) {
      return target instanceof qx.ui.core.Widget;
    },


    /**
     * Dispatches a DOM event on a widget.
     *
     * @param domEvent {qx.event.type.Event} The event object to dispatch.
     */
    _dispatchEvent : function(domEvent)
    {
      // EVENT TARGET
      var domTarget = domEvent.getTarget();

      var widgetTarget = qx.ui.core.Widget.getWidgetByElement(domTarget);
      var targetChanged = false;
      while (widgetTarget && widgetTarget.isAnonymous())
      {
        var targetChanged = true;
        widgetTarget = widgetTarget.getLayoutParent();
      }

      // don't activate anonymous widgets!
      if (widgetTarget && targetChanged && domEvent.getType() == "activate") {
        widgetTarget.getContentElement().activate();
      }


      // Correcting target for focus events
      if (this.__focusEvents[domEvent.getType()])
      {
        widgetTarget = widgetTarget && widgetTarget.getFocusTarget();

        // Whether nothing is returned
        if (!widgetTarget) {
          return;
        }
      }


      // EVENT RELATED TARGET
      if (domEvent.getRelatedTarget)
      {
        var domRelatedTarget = domEvent.getRelatedTarget();

        var widgetRelatedTarget = qx.ui.core.Widget.getWidgetByElement(domRelatedTarget);
        while (widgetRelatedTarget && widgetRelatedTarget.isAnonymous()) {
          widgetRelatedTarget = widgetRelatedTarget.getLayoutParent();
        }

        if (widgetRelatedTarget)
        {
          // Correcting target for focus events
          if (this.__focusEvents[domEvent.getType()]) {
            widgetRelatedTarget = widgetRelatedTarget.getFocusTarget();
          }

          // If target and related target are identical ignore the event
          if (widgetRelatedTarget === widgetTarget) {
            return;
          }
        }
      }


      // EVENT CURRENT TARGET
      var currentTarget = domEvent.getCurrentTarget();


      var currentWidget = qx.ui.core.Widget.getWidgetByElement(currentTarget);
      if (!currentWidget || currentWidget.isAnonymous()) {
        return;
      }

      // Correcting target for focus events
      if (this.__focusEvents[domEvent.getType()]) {
        currentWidget = currentWidget.getFocusTarget();
      }

      // Ignore most events in the disabled state.
      var type = domEvent.getType();
      if (!currentWidget || !(currentWidget.isEnabled() || this.__ignoreDisabled[type])) {
        return;
      }


      // PROCESS LISTENERS

      // Load listeners
      var capture = domEvent.getEventPhase() == qx.event.type.Event.CAPTURING_PHASE;
      var listeners = this.__manager.getListeners(currentWidget, type, capture);
      if (!listeners || listeners.length === 0) {
        return;
      }

      // Create cloned event with correct target
      var widgetEvent = qx.event.Pool.getInstance().getObject(domEvent.constructor);
      domEvent.clone(widgetEvent);

      widgetEvent.setTarget(widgetTarget);
      widgetEvent.setRelatedTarget(widgetRelatedTarget||null);
      widgetEvent.setCurrentTarget(currentWidget);

      // Keep original target of DOM event, otherwise map it to the original
      var orig = domEvent.getOriginalTarget();
      if (orig)
      {
        var widgetOriginalTarget = qx.ui.core.Widget.getWidgetByElement(orig);
        while (widgetOriginalTarget && widgetOriginalTarget.isAnonymous()) {
          widgetOriginalTarget = widgetOriginalTarget.getLayoutParent();
        }

        widgetEvent.setOriginalTarget(widgetOriginalTarget);
      }
      else
      {
        widgetEvent.setOriginalTarget(domTarget);
      }

      // Dispatch it on all listeners
      for (var i=0, l=listeners.length; i<l; i++)
      {
        var context = listeners[i].context || currentWidget;
        listeners[i].handler.call(context, widgetEvent);
      }

      // Synchronize propagation stopped/prevent default property
      if (widgetEvent.getPropagationStopped()) {
        domEvent.stopPropagation();
      }

      if (widgetEvent.getDefaultPrevented()) {
        domEvent.preventDefault();
      }

      // Release the event instance to the event pool
      qx.event.Pool.getInstance().poolObject(widgetEvent);
    },


    // interface implementation
    registerEvent : function(target, type, capture)
    {
      var elem;

      if (type === "focus" || type === "blur") {
        elem = target.getFocusElement();
      } else {
        elem = target.getContentElement();
      }

      if (elem) {
        elem.addListener(type, this._dispatchEvent, this, capture);
      }
    },


    // interface implementation
    unregisterEvent : function(target, type, capture)
    {
      var elem;

      if (type === "focus" || type === "blur") {
        elem = target.getFocusElement();
      } else {
        elem = target.getContentElement();
      }

      if (elem) {
        elem.removeListener(type, this._dispatchEvent, this, capture);
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__manager = null;
  },


  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Base class for all layout managers.
 *
 * Custom layout manager must derive from
 * this class and implement the methods {@link #invalidateLayoutCache},
 * {@link #renderLayout} and {@link #getSizeHint}.
 */
qx.Class.define("qx.ui.layout.Abstract",
{
  type : "abstract",
  extend : qx.core.Object,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** @type {Map} The cached size hint */
    __sizeHint : null,

    /** @type {Boolean} Whether the children cache is valid. This field is protected
     *    because sub classes must be able to access it quickly.
     */
    _invalidChildrenCache : null,

    /** @type {qx.ui.core.Widget} The connected widget */
    __widget : null,



    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    /**
     * Invalidate all layout relevant caches. Automatically deletes the size hint.
     *
     * @abstract
     */
    invalidateLayoutCache : function() {
      this.__sizeHint = null;
    },


    /**
     * Applies the children layout.
     *
     * @abstract
     * @param availWidth {Integer} Final width available for the content (in pixel)
     * @param availHeight {Integer} Final height available for the content (in pixel)
     * @param padding {Map} Map containing the padding values. Keys:
     * <code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>
     */
    renderLayout : function(availWidth, availHeight, padding) {
      this.warn("Missing renderLayout() implementation!");
    },


    /**
     * Computes the layout dimensions and possible ranges of these.
     *
     * @return {Map|null} The map with the preferred width/height and the allowed
     *   minimum and maximum values in cases where shrinking or growing
     *   is required. Can also return <code>null</code> when this detection
     *   is not supported by the layout.
     */
    getSizeHint : function()
    {
      if (this.__sizeHint) {
        return this.__sizeHint;
      }

      return this.__sizeHint = this._computeSizeHint();
    },


    /**
     * Whether the layout manager supports height for width.
     *
     * @return {Boolean} Whether the layout manager supports height for width
     */
    hasHeightForWidth : function() {
      return false;
    },


    /**
     * If layout wants to trade height for width it has to implement this
     * method and return the preferred height if it is resized to
     * the given width. This function returns <code>null</code> if the item
     * do not support height for width.
     *
     * @param width {Integer} The computed width
     * @return {Integer} The desired height
     */
    getHeightForWidth : function(width)
    {
      this.warn("Missing getHeightForWidth() implementation!");
      return null;
    },


    /**
     * This computes the size hint of the layout and returns it.
     *
     * @abstract
     * @return {Map} The size hint.
     */
    _computeSizeHint : function() {
      return null;
    },


    /**
     * This method is called, on each child "add" and "remove" action and
     * whenever the layout data of a child is changed. The method should be used
     * to clear any children relevant cached data.
     *
     */
    invalidateChildrenCache : function() {
      this._invalidChildrenCache = true;
    },


    /**
     * Verifies the value of a layout property.
     *
     * Note: This method is only available in the debug builds.
     *
     * @signature function(item, name, value)
     * @param item {Object} The affected layout item
     * @param name {Object} Name of the layout property
     * @param value {Object} Value of the layout property
     */
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value) {
        // empty implementation
      },

      "false" : null
    }),


    /**
     * Remove all currently visible separators
     */
    _clearSeparators : function()
    {
      // It may be that the widget do not implement clearSeparators which is especially true
      // when it do not inherit from LayoutItem.
      var widget = this.__widget;
      if (widget instanceof qx.ui.core.LayoutItem) {
        widget.clearSeparators();
      }
    },


    /**
     * Renders a separator between two children
     *
     * @param separator {Decorator} The separator to render
     * @param bounds {Map} Contains the left and top coordinate and the width and height
     *    of the separator to render.
     */
    _renderSeparator : function(separator, bounds) {
      this.__widget.renderSeparator(separator, bounds);
    },


    /**
     * This method is called by the widget to connect the widget with the layout.
     *
     * @param widget {qx.ui.core.Widget} The widget to connect to.
     */
    connectToWidget : function(widget)
    {
      if (widget && this.__widget) {
        throw new Error("It is not possible to manually set the connected widget.");
      }

      this.__widget = widget;

      // Invalidate cache
      this.invalidateChildrenCache();
    },

    /**
     * Return the widget that is this layout is responsible for.
     *
     * @return {qx.ui.core.Widget} The widget connected to this layout.
     */
    _getWidget : function()
    {
      return this.__widget;
    },

    /**
     * Indicate that the layout has layout changed and propagate this information
     * up the widget hierarchy.
     *
     * Also a generic property apply method for all layout relevant properties.
     */
    _applyLayoutChange : function()
    {
      if (this.__widget) {
        this.__widget.scheduleLayoutUpdate();
      }
    },


    /**
     * Returns the list of all layout relevant children.
     *
     * @return {Array} List of layout relevant children.
     */
    _getLayoutChildren : function() {
      return this.__widget.getLayoutChildren();
    }
  },





  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function() {
    this.__widget = this.__sizeHint = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Manager for decoration themes
 */
qx.Class.define("qx.theme.manager.Decoration",
{
  type : "singleton",
  extend : qx.core.Object,



  construct : function() {
    this.base(arguments);
    this.__rules = [];
    this.__legacyIe = (qx.core.Environment.get("engine.name") == "mshtml" &&
      qx.core.Environment.get("browser.documentmode") < 9);
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Selected decoration theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      apply : "_applyTheme",
      event : "changeTheme"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __dynamic : null,
    __rules : null,
    __legacyIe : false,


    /**
     * Returns the name which will be / is used as css class name.
     * @param value {Decorator} The decorator string or instance.
     * @return {String} The css class name.
     */
    getCssClassName : function(value) {
      if (qx.lang.Type.isString(value)) {
        return "qx-" + value;
      } else {
        return "qx-" + value.toHashCode();
      }
    },


    /**
     * Adds a css class to the global stylesheet for the given decorator.
     * This includes resolving the decorator if it's a string.
     * @param value {Decorator} The decorator string or instance.
     * @return {String} the css class name.
     */
    addCssClass : function(value) {
      var sheet = qx.ui.style.Stylesheet.getInstance();

      var instance = value;

      value = this.getCssClassName(value);
      var selector = "." + value;

      if (sheet.hasRule(selector)) {
        return value;
      }

      if (qx.lang.Type.isString(instance)) {
        instance = this.resolve(instance);
      }

      if (!instance) {
        throw new Error("Unable to resolve decorator '" + value + "'.");
      }

      // create and add a CSS rule
      var css = "";
      var styles = instance.getStyles(true);
      for (var key in styles) {

        // if we find a map value, use it as pseudo class
        if (qx.Bootstrap.isObject(styles[key])) {
          var innerCss = "";
          var innerStyles = styles[key];
          var inner = false;
          for (var innerKey in innerStyles) {
            inner = true;
            innerCss += innerKey + ":" + innerStyles[innerKey] + ";";
          }
          var innerSelector = this.__legacyIe ? selector :
            selector + (inner ? ":" : "");
          this.__rules.push(innerSelector + key);
          sheet.addRule(innerSelector + key, innerCss);
          continue;
        }
        css += key + ":" + styles[key] + ";";
      }

      if (css) {
        sheet.addRule(selector, css);
        this.__rules.push(selector);
      }

      return value;
    },


    /**
     * Returns the dynamically interpreted result for the incoming value
     *
     * @param value {String} dynamically interpreted idenfier
     * @return {var} return the (translated) result of the incoming value
     */
    resolve : function(value)
    {
      if (!value) {
        return null;
      }

      if (typeof value === "object") {
        return value;
      }

      var theme = this.getTheme();
      if (!theme) {
        return null;
      }

      var cache = this.__dynamic;
      if (!cache) {
        cache = this.__dynamic = {};
      }

      var resolved = cache[value];
      if (resolved) {
        return resolved;
      }

      var entry = qx.lang.Object.clone(theme.decorations[value], true);
      if (!entry) {
        return null;
      }

      // create empty style map if necessary
      if (!entry.style) {
        entry.style = {};
      }

      // check for inheritance
      var currentEntry = entry;
      while (currentEntry.include) {
        currentEntry = theme.decorations[currentEntry.include];
        // decoration key
        if (!entry.decorator && currentEntry.decorator) {
          entry.decorator = qx.lang.Object.clone(currentEntry.decorator);
        }

        // styles key
        if (currentEntry.style) {
          for (var key in currentEntry.style) {
            if (entry.style[key] == undefined) {
              entry.style[key] = qx.lang.Object.clone(currentEntry.style[key], true);
            }
          }
        }
      }

      return cache[value] = (new qx.ui.decoration.Decorator()).set(entry.style);
    },


    /**
     * Whether the given value is valid for being used in a property
     * with the 'check' configured to 'Decorator'.
     *
     * @param value {var} Incoming value
     * @return {Boolean} Whether the value is valid for being used in a Decorator property
     */
    isValidPropertyValue : function(value)
    {
      if (typeof value === "string") {
        return this.isDynamic(value);
      }
      else if (typeof value === "object")
      {
        var clazz = value.constructor;
        return qx.Class.hasInterface(clazz, qx.ui.decoration.IDecorator);
      }

      return false;
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns <code>true</code> if the value is interpreted dynamically
     */
    isDynamic : function(value)
    {
      if (!value) {
        return false;
      }

      var theme = this.getTheme();
      if (!theme) {
        return false;
      }

      return !!theme.decorations[value];
    },


    /**
     * Whether the given decorator is cached
     *
     * @param decorator {qx.ui.decoration.IDecorator} The decorator to check
     * @return {Boolean} <code>true</code> if the decorator is cached
     * @internal
     */
    isCached : function(decorator)
    {
      return !this.__dynamic ? false :
        qx.lang.Object.contains(this.__dynamic, decorator);
    },


    // property apply
    _applyTheme : function(value, old)
    {
      var aliasManager = qx.util.AliasManager.getInstance();

      // remove old rules
      for (var i=0; i < this.__rules.length; i++) {
        var selector = this.__rules[i];
        qx.ui.style.Stylesheet.getInstance().removeRule(selector);
      };
      this.__rules = [];

      if (old)
      {
        for (var alias in old.aliases) {
          aliasManager.remove(alias);
        }
      }

      if (value)
      {
        for (var alias in value.aliases) {
          aliasManager.add(alias, value.aliases[alias]);
        }
      }

      this._disposeMap("__dynamic");
      this.__dynamic = {};
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeMap("__dynamic");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * Global class which handles the single stylesheet used for qx.desktop.
 */
qx.Class.define("qx.ui.style.Stylesheet",
{
  type : "singleton",
  extend : qx.core.Object,


  construct : function() {
    this.base(arguments);
    this.__sheet = qx.bom.Stylesheet.createElement();
    this.__rules = [];
  },


  members :
  {
    __rules : null,
    __sheet : null,


    /**
     * Adds a rule to the global stylesheet.
     * @param selector {String} The CSS selector to add the rule for.
     * @param css {String} The rule's content.
     */
    addRule : function(selector, css) {
      if (this.hasRule(selector)) {
        return;
      }
      qx.bom.Stylesheet.addRule(this.__sheet, selector, css);
      this.__rules.push(selector);
    },


    /**
     * Check if a rule exists.
     * @param selector {String} The selector to check.
     * @return {Boolean} <code>true</code> if the rule exists
     */
    hasRule : function(selector) {
      return this.__rules.indexOf(selector) != -1;
    },


    /**
     * Remove the rule for the given selector.
     * @param selector {String} The selector to identify the rule.
     */
    removeRule : function(selector) {
      delete this.__rules[this.__rules.indexOf(selector)];
      qx.bom.Stylesheet.removeRule(this.__sheet, selector);
    }
  },


  destruct : function() {
    qx.bom.Stylesheet.removeSheet(this.__sheet);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin responsible for setting the background color of a widget.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 */
qx.Mixin.define("qx.ui.decoration.MBackgroundColor",
{
  properties :
  {
    /** Color of the background */
    backgroundColor :
    {
      check : "Color",
      nullable : true,
      apply : "_applyBackgroundColor"
    }
  },


  members :
  {

    /**
     * Adds the background-color styles to the given map
     * @param styles {Map} CSS style map
     */
    _styleBackgroundColor : function(styles) {
      var bgcolor = this.getBackgroundColor();

      if (bgcolor && qx.core.Environment.get("qx.theme")) {
        bgcolor = qx.theme.manager.Color.getInstance().resolve(bgcolor);
      }

      if (bgcolor) {
        styles["background-color"] = bgcolor;
      }
    },


    // property apply
    _applyBackgroundColor : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A decorator is responsible for computing a widget's decoration styles.
 *
 */
qx.Interface.define("qx.ui.decoration.IDecorator",
{
  members :
  {

    /**
     * Returns the decorator's styles.
     *
     * @return {Map} Map of decoration styles
     */
    getStyles : function() {},



    /**
     * Returns the configured padding minus the border width.
     * @return {Map} Map of top, right, bottom and left padding values
     */
    getPadding : function() {},


    /**
     * Get the amount of space the decoration needs for its border and padding
     * on each side.
     *
     * @return {Map} the desired inset as a map with the keys <code>top</code>,
     *     <code>right</code>, <code>bottom</code>, <code>left</code>.
     */
    getInsets : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * This class acts as abstract class for all decorators. It offers the
 * properties for the insets handling. Each decorator has to define its own
 * default insets by implementing the template method
 * (http://en.wikipedia.org/wiki/Template_Method) <code>_getDefaultInsets</code>
 */
qx.Class.define("qx.ui.decoration.Abstract",
{
  extend: qx.core.Object,
  implement : [qx.ui.decoration.IDecorator],
  type: "abstract",


  members :
  {
    __insets : null,


    /**
     * Abstract method. Should return a map containing the default insets of
     * the decorator. This could look like this:
     * <pre>
     * return {
     *   top : 0,
     *   right : 0,
     *   bottom : 0,
     *   left : 0
     * };
     * </pre>
     * @return {Map} Map containing the insets.
     */
    _getDefaultInsets : function() {
      throw new Error("Abstract method called.");
    },


    /**
     * Abstract method. Should return an boolean value if the decorator is
     * already initialized or not.
     * @return {Boolean} True, if the decorator is initialized.
     */
    _isInitialized: function() {
      throw new Error("Abstract method called.");
    },


    /**
     * Resets the insets.
     */
    _resetInsets: function() {
      this.__insets = null;
    },


    // interface implementation
    getInsets : function()
    {
      if (this.__insets) {
        return this.__insets;
      }

      return this._getDefaultInsets();
    }
  },


  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     this.__insets = null;
   }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for supporting the background images on decorators.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 */
qx.Mixin.define("qx.ui.decoration.MBackgroundImage",
{
  properties :
  {
    /** The URL of the background image */
    backgroundImage :
    {
      check : "String",
      nullable : true,
      apply : "_applyBackgroundImage"
    },


    /** How the background image should be repeated */
    backgroundRepeat :
    {
      check : ["repeat", "repeat-x", "repeat-y", "no-repeat", "scale"],
      init : "repeat",
      apply : "_applyBackgroundImage"
    },


    /**
     * Either a string or a number, which defines the horizontal position
     * of the background image.
     *
     * If the value is an integer it is interpreted as a pixel value, otherwise
     * the value is taken to be a CSS value. For CSS, the values are "center",
     * "left" and "right".
     */
    backgroundPositionX :
    {
      nullable : true,
      apply : "_applyBackgroundPosition"
    },


    /**
     * Either a string or a number, which defines the vertical position
     * of the background image.
     *
     * If the value is an integer it is interpreted as a pixel value, otherwise
     * the value is taken to be a CSS value. For CSS, the values are "top",
     * "center" and "bottom".
     */
    backgroundPositionY :
    {
      nullable : true,
      apply : "_applyBackgroundPosition"
    },


    /**
     * Property group to define the background position
     */
    backgroundPosition :
    {
      group : ["backgroundPositionY", "backgroundPositionX"]
    }
  },


  members :
  {
    /**
     * Adds the background-image styles to the given map
     * @param styles {Map} CSS style map
     */
    _styleBackgroundImage : function(styles)
    {
      var image = this.getBackgroundImage();
      if(!image) {
        return;
      }

      var id = qx.util.AliasManager.getInstance().resolve(image);
      var source = qx.util.ResourceManager.getInstance().toUri(id);
      if (styles["background-image"]) {
        styles["background-image"] +=  ', url(' + source + ')';
      } else {
        styles["background-image"] = 'url(' + source + ')';
      }

      var repeat = this.getBackgroundRepeat();
      if (repeat === "scale") {
        styles["background-size"] = "100% 100%";
      }
      else {
        styles["background-repeat"] = repeat;
      }

      var top = this.getBackgroundPositionY() || 0;
      var left = this.getBackgroundPositionX() || 0;

      if (!isNaN(top)) {
        top += "px";
      }

      if (!isNaN(left)) {
        left += "px";
      }

      styles["background-position"] = left + " " + top;

      if (qx.core.Environment.get("qx.debug") &&
        source &&  qx.lang.String.endsWith(source, ".png") &&
        (repeat == "scale" || repeat == "no-repeat") &&
        qx.core.Environment.get("engine.name") == "mshtml" &&
        qx.core.Environment.get("browser.documentmode") < 9)
      {
        this.warn("Background PNGs with repeat == 'scale' or repeat == 'no-repeat'" +
          " are not supported in this client! The image's resource id is '" + id + "'");
      }
    },


    // property apply
    _applyBackgroundImage : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    },

    // property apply
    _applyBackgroundPosition : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
        if (qx.core.Environment.get("engine.name") == "mshtml" &&
          qx.core.Environment.get("browser.documentmode") < 9)
        {
          this.warn("The backgroundPosition property is not supported by this client!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * This singleton manages global resource aliases.
 *
 * The AliasManager supports simple prefix replacement on strings. There are
 * some pre-defined aliases, and you can register your own with {@link #add}.
 * The AliasManager is automatically invoked in various situations, e.g. when
 * resolving the icon image for a button, so it is common to register aliases for
 * <a href="http://manual.qooxdoo.org/${qxversion}/pages/desktop/ui_resources.html">resource id's</a>.
 * You can of course call the AliasManager's {@link #resolve}
 * explicitly to get an alias resolution in any situation, but keep that
 * automatic invocation of the AliasManager in mind when defining new aliases as
 * they will be applied globally in many classes, not only your own.
 *
 * Examples:
 * <ul>
 *  <li> <code>foo</code> -> <code>bar/16pt/baz</code>  (resolves e.g. __"foo/a/b/c.png"__ to
 *    __"bar/16pt/baz/a/b/c.png"__)
 *  <li> <code>imgserver</code> -> <code>http&#058;&#047;&#047;imgs03.myserver.com/my/app/</code>
 *    (resolves e.g. __"imgserver/a/b/c.png"__ to
 *    __"http&#058;&#047;&#047;imgs03.myserver.com/my/app/a/b/c.png"__)
 * </ul>
 *
 * For resources, only aliases that resolve to proper resource id's can be __managed__
 * resources, and will be considered __unmanaged__ resources otherwise.
 */
qx.Class.define("qx.util.AliasManager",
{
  type : "singleton",
  extend : qx.util.ValueManager,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Contains defined aliases (like icons/, widgets/, application/, ...)
    this.__aliases = {};

    // Define static alias from setting
    this.add("static", "qx/static");
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __aliases : null,

    /**
     * pre-process incoming dynamic value
     *
     * @param value {String} incoming value
     * @return {String} pre processed value
     */
    _preprocess : function(value)
    {
      var dynamics = this._getDynamic();

      if (dynamics[value] === false)
      {
        return value;
      }
      else if (dynamics[value] === undefined)
      {
        if (value.charAt(0) === "/" || value.charAt(0) === "." || value.indexOf("http://") === 0 || value.indexOf("https://") === "0" || value.indexOf("file://") === 0)
        {
          dynamics[value] = false;
          return value;
        }

        if (this.__aliases[value]) {
          return this.__aliases[value];
        }

        var alias = value.substring(0, value.indexOf("/"));
        var resolved = this.__aliases[alias];

        if (resolved !== undefined) {
          dynamics[value] = resolved + value.substring(alias.length);
        }
      }

      return value;
    },


    /**
     * Define an alias to a resource path
     *
     * @param alias {String} alias name for the resource path/url
     * @param base {String} first part of URI for all images which use this alias
     */
    add : function(alias, base)
    {
      // Store new alias value
      this.__aliases[alias] = base;

      // Localify stores
      var dynamics = this._getDynamic();

      // Update old entries which use this alias
      for (var path in dynamics)
      {
        if (path.substring(0, path.indexOf("/")) === alias)
        {
          dynamics[path] = base + path.substring(alias.length);
        }
      }
    },


    /**
     * Remove a previously defined alias
     *
     * @param alias {String} alias name for the resource path/url
     */
    remove : function(alias)
    {
      delete this.__aliases[alias];

      // No signal for depending objects here. These
      // will informed with the new value using add().
    },


    /**
     * Resolves a given path
     *
     * @param path {String} input path
     * @return {String} resulting path (with interpreted aliases)
     */
    resolve : function(path)
    {
      var dynamic = this._getDynamic();

      if (path != null) {
        path = this._preprocess(path);
      }

      return dynamic[path] || path;
    },


    /**
     * Get registered aliases
     *
     * @return {Map} the map of the currently registered alias:resolution pairs
     */
    getAliases : function()
    {
      var res = {};
      for (var key in this.__aliases) {
        res[key] = this.__aliases[key];
      }
      return res;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__aliases = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * A basic decorator featuring simple borders based on CSS styles.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 */
qx.Mixin.define("qx.ui.decoration.MSingleBorder",
{
  properties :
  {
    /*
    ---------------------------------------------------------------------------
      PROPERTY: WIDTH
    ---------------------------------------------------------------------------
    */

    /** top width of border */
    widthTop :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** right width of border */
    widthRight :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** bottom width of border */
    widthBottom :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** left width of border */
    widthLeft :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY: STYLE
    ---------------------------------------------------------------------------
    */

    /** top style of border */
    styleTop :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double", "inset", "outset", "ridge", "groove"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** right style of border */
    styleRight :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double", "inset", "outset", "ridge", "groove"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** bottom style of border */
    styleBottom :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double", "inset", "outset", "ridge", "groove"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** left style of border */
    styleLeft :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double", "inset", "outset", "ridge", "groove"],
      init : "solid",
      apply : "_applyStyle"
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY: COLOR
    ---------------------------------------------------------------------------
    */

    /** top color of border */
    colorTop :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** right color of border */
    colorRight :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** bottom color of border */
    colorBottom :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** left color of border */
    colorLeft :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY GROUP: EDGE
    ---------------------------------------------------------------------------
    */

    /** Property group to configure the left border */
    left : {
      group : [ "widthLeft", "styleLeft", "colorLeft" ]
    },

    /** Property group to configure the right border */
    right : {
      group : [ "widthRight", "styleRight", "colorRight" ]
    },

    /** Property group to configure the top border */
    top : {
      group : [ "widthTop", "styleTop", "colorTop" ]
    },

    /** Property group to configure the bottom border */
    bottom : {
      group : [ "widthBottom", "styleBottom", "colorBottom" ]
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY GROUP: TYPE
    ---------------------------------------------------------------------------
    */

    /** Property group to set the border width of all sides */
    width :
    {
      group : [ "widthTop", "widthRight", "widthBottom", "widthLeft" ],
      mode : "shorthand"
    },

    /** Property group to set the border style of all sides */
    style :
    {
      group : [ "styleTop", "styleRight", "styleBottom", "styleLeft" ],
      mode : "shorthand"
    },

    /** Property group to set the border color of all sides */
    color :
    {
      group : [ "colorTop", "colorRight", "colorBottom", "colorLeft" ],
      mode : "shorthand"
    }
  },


  members :
  {
    /**
     * Takes a styles map and adds the border styles styles in place
     * to the given map. This is the needed behavior for
     * {@link qx.ui.decoration.Decorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    _styleBorder : function(styles)
    {
      if (qx.core.Environment.get("qx.theme"))
      {
        var Color = qx.theme.manager.Color.getInstance();

        var colorTop = Color.resolve(this.getColorTop());
        var colorRight = Color.resolve(this.getColorRight());
        var colorBottom = Color.resolve(this.getColorBottom());
        var colorLeft = Color.resolve(this.getColorLeft());
      }
      else
      {
        var colorTop = this.getColorTop();
        var colorRight = this.getColorRight();
        var colorBottom = this.getColorBottom();
        var colorLeft = this.getColorLeft();
      }

      // Add borders
      var width = this.getWidthTop();
      if (width > 0) {
        styles["border-top"] = width + "px " + this.getStyleTop() + " " + (colorTop || "");
      }

      var width = this.getWidthRight();
      if (width > 0) {
        styles["border-right"] = width + "px " + this.getStyleRight() + " " + (colorRight || "");
      }

      var width = this.getWidthBottom();
      if (width > 0) {
        styles["border-bottom"] = width + "px " + this.getStyleBottom() + " " + (colorBottom || "");
      }

      var width = this.getWidthLeft();
      if (width > 0) {
        styles["border-left"] = width + "px " + this.getStyleLeft() + " " + (colorLeft || "");
      }

      // Check if valid
      if (qx.core.Environment.get("qx.debug"))
      {
        if (styles.length === 0) {
          throw new Error("Invalid Single decorator (zero border width). Use qx.ui.decorator.Background instead!");
        }
      }

      // Add basic styles
      styles.position = "absolute";
    },


    /**
     * Implementation of the interface for the single border.
     *
     * @return {Map} A map containing the default insets.
     *   (top, right, bottom, left)
     */
    _getDefaultInsetsForBorder : function()
    {
      return {
        top : this.getWidthTop(),
        right : this.getWidthRight(),
        bottom : this.getWidthBottom(),
        left : this.getWidthLeft()
      };
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyWidth : function()
    {
      this._applyStyle();

      this._resetInsets();
    },


    // property apply
    _applyStyle : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Border implementation with two CSS borders. Both borders can be styled
 * independent of each other.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 */
qx.Mixin.define("qx.ui.decoration.MDoubleBorder",
{
  include : [qx.ui.decoration.MSingleBorder, qx.ui.decoration.MBackgroundImage],

  construct : function() {
    // override the methods of single border and background image
    this._getDefaultInsetsForBorder = this.__getDefaultInsetsForDoubleBorder;
    this._styleBorder = this.__styleDoubleBorder;
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      PROPERTY: INNER WIDTH
    ---------------------------------------------------------------------------
    */

    /** top width of border */
    innerWidthTop :
    {
      check : "Number",
      init : 0,
      apply : "_applyDoubleBorder"
    },

    /** right width of border */
    innerWidthRight :
    {
      check : "Number",
      init : 0,
      apply : "_applyDoubleBorder"
    },

    /** bottom width of border */
    innerWidthBottom :
    {
      check : "Number",
      init : 0,
      apply : "_applyDoubleBorder"
    },

    /** left width of border */
    innerWidthLeft :
    {
      check : "Number",
      init : 0,
      apply : "_applyDoubleBorder"
    },

    /** Property group to set the inner border width of all sides */
    innerWidth :
    {
      group : [ "innerWidthTop", "innerWidthRight", "innerWidthBottom", "innerWidthLeft" ],
      mode : "shorthand"
    },




    /*
    ---------------------------------------------------------------------------
      PROPERTY: INNER COLOR
    ---------------------------------------------------------------------------
    */

    /** top inner color of border */
    innerColorTop :
    {
      nullable : true,
      check : "Color",
      apply : "_applyDoubleBorder"
    },

    /** right inner color of border */
    innerColorRight :
    {
      nullable : true,
      check : "Color",
      apply : "_applyDoubleBorder"
    },

    /** bottom inner color of border */
    innerColorBottom :
    {
      nullable : true,
      check : "Color",
      apply : "_applyDoubleBorder"
    },

    /** left inner color of border */
    innerColorLeft :
    {
      nullable : true,
      check : "Color",
      apply : "_applyDoubleBorder"
    },

    /**
     * Property group for the inner color properties.
     */
    innerColor :
    {
      group : [ "innerColorTop", "innerColorRight", "innerColorBottom", "innerColorLeft" ],
      mode : "shorthand"
    },

    /**
     * The opacity of the inner border.
     */
    innerOpacity :
    {
      check : "Number",
      init : 1,
      apply : "_applyDoubleBorder"
    }
  },


  members :
  {

    /**
     * Takes a styles map and adds the outer border styles in place
     * to the given map. This is the needed behavior for
     * {@link qx.ui.decoration.Decorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    __styleDoubleBorder : function(styles)
    {
      var propName = qx.core.Environment.get("css.boxshadow");

      var color,
          innerColor,
          innerWidth;
      if (qx.core.Environment.get("qx.theme"))
      {
        var Color = qx.theme.manager.Color.getInstance();

        color = {
          top : Color.resolve(this.getColorTop()),
          right : Color.resolve(this.getColorRight()),
          bottom : Color.resolve(this.getColorBottom()),
          left : Color.resolve(this.getColorLeft())
        };

        innerColor = {
          top : Color.resolve(this.getInnerColorTop()),
          right : Color.resolve(this.getInnerColorRight()),
          bottom : Color.resolve(this.getInnerColorBottom()),
          left : Color.resolve(this.getInnerColorLeft())
        };
      }
      else
      {
        color = {
          top : this.getColorTop(),
          right : this.getColorRight(),
          bottom : this.getColorBottom(),
          left : this.getColorLeft()
        };

        innerColor = {
          top : this.getInnerColorTop(),
          right : this.getInnerColorRight(),
          bottom : this.getInnerColorBottom(),
          left : this.getInnerColorLeft()
        };
      }

      innerWidth = {
        top : this.getInnerWidthTop(),
        right : this.getInnerWidthRight(),
        bottom : this.getInnerWidthBottom(),
        left : this.getInnerWidthLeft()
      };

      // Add outer borders
      var width = this.getWidthTop();
      if (width > 0) {
        styles["border-top"] = width + "px " + this.getStyleTop() + " " + color.top;
      }

      width = this.getWidthRight();
      if (width > 0) {
        styles["border-right"] = width + "px " + this.getStyleRight() + " " + color.right;
      }

      width = this.getWidthBottom();
      if (width > 0) {
        styles["border-bottom"] = width + "px " + this.getStyleBottom() + " " + color.bottom;
      }

      width = this.getWidthLeft();
      if (width > 0) {
        styles["border-left"] = width + "px " + this.getStyleLeft() + " " + color.left;
      }

      var innerOpacity = this.getInnerOpacity();

      if (innerOpacity < 1) {
        this.__processInnerOpacity(innerColor, innerOpacity);
      }


      // inner border
      if (
        innerWidth.top > 0 ||
        innerWidth.right > 0 ||
        innerWidth.bottom > 0 ||
        innerWidth.left > 0
      ) {

        var borderTop = (innerWidth.top || 0) + "px solid " + innerColor.top;
        var borderRight = (innerWidth.right || 0) + "px solid " + innerColor.right;
        var borderBottom = (innerWidth.bottom || 0) + "px solid " + innerColor.bottom;
        var borderLeft = (innerWidth.left || 0) + "px solid " + innerColor.left;

        styles[":before"] = {
          "width" : "100%",
          "height" : "100%",
          "position" : "absolute",
          "content" : '""',
          "border-top" : borderTop,
          "border-right" : borderRight,
          "border-bottom" : borderBottom,
          "border-left" : borderLeft,
          "left": 0,
          "top" : 0
        };
        var boxSizingKey = qx.bom.Style.getCssName(qx.core.Environment.get("css.boxsizing"));
        styles[":before"][boxSizingKey] = "border-box";

        // make sure to apply the border radius as well
        var borderRadiusKey = qx.core.Environment.get("css.borderradius");
        if (borderRadiusKey) {
          borderRadiusKey = qx.bom.Style.getCssName(borderRadiusKey);
          styles[":before"][borderRadiusKey] = "inherit";
        }

        // Add inner borders as shadows
        var shadowStyle = [];

        if (innerColor.top && innerWidth.top &&
            innerColor.top == innerColor.bottom &&
            innerColor.top == innerColor.right &&
            innerColor.top == innerColor.left &&
            innerWidth.top == innerWidth.bottom &&
            innerWidth.top == innerWidth.right &&
            innerWidth.top == innerWidth.left)
        {
          shadowStyle.push("inset 0 0 0 " + innerWidth.top + "px " + innerColor.top);
        }
        else {
          if (innerColor.top) {
            shadowStyle.push("inset 0 " + (innerWidth.top || 0) + "px " + innerColor.top);
          }
          if (innerColor.right) {
            shadowStyle.push("inset -" + (innerWidth.right || 0) + "px 0 " + innerColor.right);
          }
          if (innerColor.bottom) {
            shadowStyle.push("inset 0 -" + (innerWidth.bottom || 0) + "px " + innerColor.bottom);
          }
          if (innerColor.left) {
            shadowStyle.push("inset " + (innerWidth.left || 0) + "px 0 " + innerColor.left);
          }
        }

        // apply or append the box shadow styles
        if (shadowStyle.length > 0 && propName) {
          propName = qx.bom.Style.getCssName(propName);
          if (!styles[propName]) {
            styles[propName] = shadowStyle.join(",");
          } else {
            styles[propName] += "," + shadowStyle.join(",");
          }
        }
      }
    },


    /**
     * Converts the inner border's colors to rgba.
     *
     * @param innerColor {Map} map of top, right, bottom and left colors
     * @param innerOpacity {Number} alpha value
     */
    __processInnerOpacity : function(innerColor, innerOpacity)
    {
      if (!qx.core.Environment.get("css.rgba")) {
          if (qx.core.Environment.get("qx.debug")) {
          qx.log.Logger.warn("innerOpacity is configured but the browser doesn't support RGBA colors.");
        }
        return;
      }

      for (var edge in innerColor) {
        var rgb = qx.util.ColorUtil.stringToRgb(innerColor[edge]);
        rgb.push(innerOpacity);
        var rgbString = qx.util.ColorUtil.rgbToRgbString(rgb);
        innerColor[edge] = rgbString;
      }
    },


    _applyDoubleBorder : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    },


   /**
    * Implementation of the interface for the double border.
    *
    * @return {Map} A map containing the default insets.
    *   (top, right, bottom, left)
    */
    __getDefaultInsetsForDoubleBorder : function()
    {
      return {
        top : this.getWidthTop() + this.getInnerWidthTop(),
        right : this.getWidthRight() + this.getInnerWidthRight(),
        bottom : this.getWidthBottom() + this.getInnerWidthBottom(),
        left : this.getWidthLeft() + this.getInnerWidthLeft()
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for the border radius CSS property.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 *
 * Keep in mind that this is not supported by all browsers:
 *
 * * Firefox 3,5+
 * * IE9+
 * * Safari 3.0+
 * * Opera 10.5+
 * * Chrome 4.0+
 */
qx.Mixin.define("qx.ui.decoration.MBorderRadius",
{
  properties : {
    /** top left corner radius */
    radiusTopLeft :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** top right corner radius */
    radiusTopRight :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** bottom left corner radius */
    radiusBottomLeft :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** bottom right corner radius */
    radiusBottomRight :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** Property group to set the corner radius of all sides */
    radius :
    {
      group : [ "radiusTopLeft", "radiusTopRight", "radiusBottomRight", "radiusBottomLeft" ],
      mode : "shorthand"
    }
  },


  members :
  {
    /**
     * Takes a styles map and adds the border radius styles in place to the
     * given map. This is the needed behavior for
     * {@link qx.ui.decoration.Decorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    _styleBorderRadius : function(styles)
    {
      // Fixing the background bleed in Webkits
      // http://tumble.sneak.co.nz/post/928998513/fixing-the-background-bleed
      styles["-webkit-background-clip"] = "padding-box";
      styles["background-clip"] = "padding-box";

      // radius handling
      var hasRadius = false;
      var radius = this.getRadiusTopLeft();
      if (radius > 0) {
        hasRadius = true;
        styles["-moz-border-radius-topleft"] = radius + "px";
        styles["-webkit-border-top-left-radius"] = radius + "px";
        styles["border-top-left-radius"] = radius + "px";
      }

      radius = this.getRadiusTopRight();
      if (radius > 0) {
        hasRadius = true;
        styles["-moz-border-radius-topright"] = radius + "px";
        styles["-webkit-border-top-right-radius"] = radius + "px";
        styles["border-top-right-radius"] = radius + "px";
      }

      radius = this.getRadiusBottomLeft();
      if (radius > 0) {
        hasRadius = true;
        styles["-moz-border-radius-bottomleft"] = radius + "px";
        styles["-webkit-border-bottom-left-radius"] = radius + "px";
        styles["border-bottom-left-radius"] = radius + "px";
      }

      radius = this.getRadiusBottomRight();
      if (radius > 0) {
        hasRadius = true;
        styles["-moz-border-radius-bottomright"] = radius + "px";
        styles["-webkit-border-bottom-right-radius"] = radius + "px";
        styles["border-bottom-right-radius"] = radius + "px";
      }

      // Fixing the background bleed in Webkits
      // http://tumble.sneak.co.nz/post/928998513/fixing-the-background-bleed
      if (hasRadius && qx.core.Environment.get("engine.name") == "webkit") {
        styles["-webkit-background-clip"] = "padding-box";
      } else {
    styles["background-clip"] = "padding-box";
      }
    },

    // property apply
    _applyBorderRadius : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */

/**
 * Decorator which uses the CSS3 border image properties.
 */
qx.Mixin.define("qx.ui.decoration.MBorderImage", {

  properties :
  {
    /**
     * Base image URL.
     */
    borderImage :
    {
      check : "String",
      nullable : true,
      apply : "_applyBorderImage"
    },


    /**
     * The top slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceTop :
    {
      check : "Integer",
      nullable : true,
      init : null,
      apply : "_applyBorderImage"
    },

    /**
     * The right slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceRight :
    {
      check : "Integer",
      nullable : true,
      init : null,
      apply : "_applyBorderImage"
    },


    /**
     * The bottom slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceBottom :
    {
      check : "Integer",
      nullable : true,
      init : null,
      apply : "_applyBorderImage"
    },


    /**
     * The left slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceLeft :
    {
      check : "Integer",
      nullable : true,
      init : null,
      apply : "_applyBorderImage"
    },


    /**
     * The slice properties divide the image into nine regions, which define the
     * corner, edge and the center images.
     */
    slice :
    {
      group : [ "sliceTop", "sliceRight", "sliceBottom", "sliceLeft" ],
      mode : "shorthand"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled horizontally.
     *
     * Values have the following meanings:
     * <ul>
     *   <li><strong>stretch</strong>: The image is stretched to fill the area.</li>
     *   <li><strong>repeat</strong>: The image is tiled (repeated) to fill the area.</li>
     *   <li><strong>round</strong>: The image is tiled (repeated) to fill the area. If it does not
     *    fill the area with a whole number of tiles, the image is rescaled so
     *    that it does.</li>
     * </ul>
     */
    repeatX :
    {
      check : ["stretch", "repeat", "round"],
      init : "stretch",
      apply : "_applyBorderImage"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled vertically.
     *
     * Values have the following meanings:
     * <ul>
     *   <li><strong>stretch</strong>: The image is stretched to fill the area.</li>
     *   <li><strong>repeat</strong>: The image is tiled (repeated) to fill the area.</li>
     *   <li><strong>round</strong>: The image is tiled (repeated) to fill the area. If it does not
     *    fill the area with a whole number of tiles, the image is rescaled so
     *    that it does.</li>
     * </ul>
     */
    repeatY :
    {
      check : ["stretch", "repeat", "round"],
      init : "stretch",
      apply : "_applyBorderImage"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled.
     */
    repeat :
    {
      group : ["repeatX", "repeatY"],
      mode : "shorthand"
    },


    /**
     * If set to <code>false</code>, the center image will be omitted and only
     * the border will be drawn.
     */
    fill :
    {
      check : "Boolean",
      init : true,
      apply : "_applyBorderImage"
    },


    /**
     * Configures the border image mode. Supported values:
     * <ul>
     *   <li>horizontal: left and right border images</li>
     *   <li>vertical: top and bottom border images</li>
     *   <li>grid: border images for all edges</li>
     * </ul>
     */
    borderImageMode :
    {
      check : ["horizontal", "vertical", "grid"],
      init : "grid"
    }
  },

  members :
  {
    /**
     * Adds the border-image styles to the given map
     * @param styles {Map} CSS style map
     */
    _styleBorderImage : function(styles)
    {
      if (!this.getBorderImage()) {
        return;
      }
      var resolvedImage = qx.util.AliasManager.getInstance().resolve(this.getBorderImage());
      var source = qx.util.ResourceManager.getInstance().toUri(resolvedImage);

      var computedSlices = this._getDefaultInsetsForBorderImage();

      var slice = [
        computedSlices.top,
        computedSlices.right,
        computedSlices.bottom,
        computedSlices.left
      ];

      var repeat = [
        this.getRepeatX(),
        this.getRepeatY()
      ].join(" ");

      var fill = this.getFill() &&
        qx.core.Environment.get("css.borderimage.standardsyntax") ? " fill" : "";

      var styleName = qx.bom.Style.getPropertyName("borderImage");
      if (styleName) {
        var cssName = qx.bom.Style.getCssName(styleName);
        styles[cssName] = 'url("' + source + '") ' + slice.join(" ") + fill + " " + repeat;
      }
      // Apply border styles even if we couldn't determine the borderImage property name
      // (e.g. because the browser doesn't support it). This is needed to keep
      // the layout intact.
      styles["border-style"] = "solid";
      styles["border-color"] = "transparent";
      styles["border-width"] = slice.join("px ") + "px";
    },


    /**
     * Computes the inset values based on the border image slices (defined in the
     * decoration theme or computed from the fallback image sizes).
     *
     * @return {Map} Map with the top, right, bottom and left insets
     */
    _getDefaultInsetsForBorderImage : function()
    {
      if (!this.getBorderImage()) {
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };
      }

      var resolvedImage = qx.util.AliasManager.getInstance().resolve(this.getBorderImage());
      var computedSlices = this.__getSlices(resolvedImage);

      return {
        top : this.getSliceTop() || computedSlices[0],
        right: this.getSliceRight() || computedSlices[1],
        bottom: this.getSliceBottom() || computedSlices[2],
        left: this.getSliceLeft() || computedSlices[3]
      };
    },


    _applyBorderImage : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    },


    /**
     * Gets the slice sizes from the fallback border images.
     *
     * @param baseImage {String} Resource Id of the base border image
     * @return {Integer[]} Array with the top, right, bottom and left slice widths
     */
    __getSlices : function(baseImage)
    {
      var mode = this.getBorderImageMode();
      var topSlice = 0;
      var rightSlice = 0;
      var bottomSlice = 0;
      var leftSlice = 0;

      var split = /(.*)(\.[a-z]+)$/.exec(baseImage);
      var prefix = split[1];
      var ext = split[2];

      var ResourceManager = qx.util.ResourceManager.getInstance();

      if (mode == "grid" || mode == "vertical") {
        topSlice = ResourceManager.getImageHeight(prefix + "-t" + ext);
        bottomSlice = ResourceManager.getImageHeight(prefix + "-b" + ext);
      }

      if (mode == "grid" || mode == "horizontal") {
        rightSlice = ResourceManager.getImageWidth(prefix + "-r" + ext);
        leftSlice = ResourceManager.getImageWidth(prefix + "-l" + ext);
      }

      return [topSlice, rightSlice, bottomSlice, leftSlice];
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for the linear background gradient CSS property.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 *
 * Keep in mind that this is not supported by all browsers:
 *
 * * Safari 4.0+
 * * Chrome 4.0+
 * * Firefox 3.6+
 * * Opera 11.1+
 * * IE 10+
 * * IE 5.5+ (with limitations)
 *
 * For IE 5.5 to IE 8,this class uses the filter rules to create the gradient. This
 * has some limitations: The start and end position property can not be used. For
 * more details, see the original documentation:
 * http://msdn.microsoft.com/en-us/library/ms532997(v=vs.85).aspx
 *
 * For IE9, we create a gradient in a canvas element and render this gradient
 * as background image.
 */
qx.Mixin.define("qx.ui.decoration.MLinearBackgroundGradient",
{
  properties :
  {
    /**
     * Start color of the background gradient.
     * Note that alpha transparency (rgba) is not supported in IE 8.
     */
    startColor :
    {
      check : "Color",
      nullable : true,
      apply : "_applyLinearBackgroundGradient"
    },

    /**
     * End color of the background gradient.
     * Note that alpha transparency (rgba) is not supported in IE 8.
     */
    endColor :
    {
      check : "Color",
      nullable : true,
      apply : "_applyLinearBackgroundGradient"
    },

    /** The orientation of the gradient. */
    orientation :
    {
      check : ["horizontal", "vertical"],
      init : "vertical",
      apply : "_applyLinearBackgroundGradient"
    },

    /** Position in percent where to start the color. */
    startColorPosition :
    {
      check : "Number",
      init : 0,
      apply : "_applyLinearBackgroundGradient"
    },

    /** Position in percent where to start the color. */
    endColorPosition :
    {
      check : "Number",
      init : 100,
      apply : "_applyLinearBackgroundGradient"
    },

    /** Defines if the given positions are in % or px.*/
    colorPositionUnit :
    {
      check : ["px", "%"],
      init : "%",
      apply : "_applyLinearBackgroundGradient"
    },


    /** Property group to set the start color including its start position. */
    gradientStart :
    {
      group : ["startColor", "startColorPosition"],
      mode : "shorthand"
    },

    /** Property group to set the end color including its end position. */
    gradientEnd :
    {
      group : ["endColor", "endColorPosition"],
      mode : "shorthand"
    }
  },


  members :
  {
    __canvas : null,


    /**
     * Takes a styles map and adds the linear background styles in place to the
     * given map. This is the needed behavior for
     * {@link qx.ui.decoration.Decorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    _styleLinearBackgroundGradient : function(styles) {
      var colors = this.__getColors();
      var startColor = colors.start;
      var endColor = colors.end;
      var value;

      if (!startColor || !endColor) {
        return;
      }

      var unit = this.getColorPositionUnit();

      // new implementation for webkit is available since chrome 10 --> version
      if (qx.core.Environment.get("css.gradient.legacywebkit")) {
        // webkit uses px values if non are given
        unit = unit === "px" ? "" : unit;

        if (this.getOrientation() == "horizontal") {
          var startPos = this.getStartColorPosition() + unit +" 0" + unit;
          var endPos = this.getEndColorPosition() + unit + " 0" + unit;
        } else {
          var startPos = "0" + unit + " " + this.getStartColorPosition() + unit;
          var endPos = "0" + unit +" " + this.getEndColorPosition() + unit;
        }

        var color =
          "from(" + startColor +
          "),to(" + endColor + ")";

        value = "-webkit-gradient(linear," + startPos + "," + endPos + "," + color + ")";
        styles["background"] = value;

      // IE9 canvas solution
      } else if (qx.core.Environment.get("css.gradient.filter") &&
        !qx.core.Environment.get("css.gradient.linear") && qx.core.Environment.get("css.borderradius")) {

          if (!this.__canvas) {
            this.__canvas = document.createElement("canvas");
          }

          var isVertical = this.getOrientation() == "vertical";

          var colors = this.__getColors();
          var height = isVertical ? 200 : 1;
          var width = isVertical ? 1 : 200;

          this.__canvas.width = width;
          this.__canvas.height = height;
          var ctx = this.__canvas.getContext('2d');

          if (isVertical) {
            var lingrad = ctx.createLinearGradient(0, 0, 0, height);
          } else {
            var lingrad = ctx.createLinearGradient(0, 0, width, 0);
          }

          lingrad.addColorStop(this.getStartColorPosition() / 100, colors.start);
          lingrad.addColorStop(this.getEndColorPosition() / 100, colors.end);

          ctx.fillStyle = lingrad;
          ctx.fillRect(0, 0, width, height);

          var value = "url(" + this.__canvas.toDataURL() + ")";
          styles["background-image"] = value;
          styles["background-size"] = "100% 100%";

      // old IE filter fallback
      } else if (qx.core.Environment.get("css.gradient.filter") &&
        !qx.core.Environment.get("css.gradient.linear"))
      {
        var colors = this.__getColors();
        var type = this.getOrientation() == "horizontal" ? 1 : 0;

        var startColor = colors.start;
        var endColor = colors.end;

        // convert rgb, hex3 and named colors to hex6
        if (!qx.util.ColorUtil.isHex6String(startColor)) {
          startColor = qx.util.ColorUtil.stringToRgb(startColor);
          startColor = qx.util.ColorUtil.rgbToHexString(startColor);
        }
        if (!qx.util.ColorUtil.isHex6String(endColor)) {
          endColor = qx.util.ColorUtil.stringToRgb(endColor);
          endColor = qx.util.ColorUtil.rgbToHexString(endColor);
        }

        // get rid of the starting '#'
        startColor = startColor.substring(1, startColor.length);
        endColor = endColor.substring(1, endColor.length);

        value = "progid:DXImageTransform.Microsoft.Gradient" +
          "(GradientType=" + type + ", " +
          "StartColorStr='#FF" + startColor + "', " +
          "EndColorStr='#FF" + endColor + "';)";
        if (styles["filter"]) {
          styles["filter"] += ", " + value;
        } else {
          styles["filter"] = value;
        }

        // Elements with transparent backgrounds will not receive receive mouse
        // events if a Gradient filter is set.
        if (!styles["background-color"] ||
            styles["background-color"] == "transparent")
        {
          // We don't support alpha transparency for the gradient color stops
          // so it doesn't matter which color we set here.
          styles["background-color"] = "white";
        }

      // spec like syntax
      } else {
        // WebKit, Opera and Gecko interpret 0deg as "to right"
        var deg = this.getOrientation() == "horizontal" ? 0 : 270;

        var start = startColor + " " + this.getStartColorPosition() + unit;
        var end = endColor + " " + this.getEndColorPosition() + unit;

        var prefixedName = qx.core.Environment.get("css.gradient.linear");
        // Browsers supporting the unprefixed implementation interpret 0deg as
        // "to top" as defined by the spec [BUG #6513]
        if (prefixedName === "linear-gradient") {
          deg = this.getOrientation() == "horizontal" ? deg + 90 : deg - 90;
        }

        value = prefixedName + "(" + deg + "deg, " + start + "," + end + ")";
        if (styles["background-image"]) {
          styles["background-image"] += ", " + value;
        }
        else {
          styles["background-image"] = value;
        }
      }
    },


    /**
     * Helper to get start and end color.
     * @return {Map} A map containing start and end color.
     */
    __getColors : function() {
      if (qx.core.Environment.get("qx.theme"))
      {
        var Color = qx.theme.manager.Color.getInstance();
        var startColor = Color.resolve(this.getStartColor());
        var endColor = Color.resolve(this.getEndColor());
      }
      else
      {
        var startColor = this.getStartColor();
        var endColor = this.getEndColor();
      }
      return {start: startColor, end: endColor};
    },


    /**
     * Helper for IE which applies the filter used for the gradient to a separate
     * DIV element which will be put into the decorator. This is necessary in case
     * the decorator has rounded corners.
     * @return {String} The HTML for the inner gradient DIV.
     */
    _getContent : function() {
      // IE filter syntax
      // http://msdn.microsoft.com/en-us/library/ms532997(v=vs.85).aspx
      // It needs to be wrapped in a separate div bug #6318
      if (qx.core.Environment.get("css.gradient.filter") &&
        !qx.core.Environment.get("css.gradient.linear")) {

        var colors = this.__getColors();
        var type = this.getOrientation() == "horizontal" ? 1 : 0;

        // convert all hex3 to hex6
        var startColor = qx.util.ColorUtil.hex3StringToHex6String(colors.start);
        var endColor = qx.util.ColorUtil.hex3StringToHex6String(colors.end);

        // get rid of the starting '#'
        startColor = startColor.substring(1, startColor.length);
        endColor = endColor.substring(1, endColor.length);

        // filter gradients block the box shadow implementation ->
        // we need to set them explicitly [BUG #6761]
        var shadow = "";
        if (this.classname.indexOf("MBoxShadow") != -1) {
          var styles = {};
          this._styleBoxShadow(styles);
          shadow = "<div style='width: 100%; height: 100%; position: absolute;" +
            qx.bom.element.Style.compile(styles) +
            "'></div>";
        }

        return "<div style=\"position: absolute; width: 100%; height: 100%; " +
          "filter:progid:DXImageTransform.Microsoft.Gradient" +
          "(GradientType=" + type + ", " +
          "StartColorStr='#FF" + startColor + "', " +
          "EndColorStr='#FF" + endColor + "';)\">" + shadow + "</div>";
      }
      return "";
    },


    // property apply
    _applyLinearBackgroundGradient : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for the box shadow CSS property.
 * This mixin is usually used by {@link qx.ui.decoration.Decorator}.
 *
 * Keep in mind that this is not supported by all browsers:
 *
 * * Firefox 3,5+
 * * IE9+
 * * Safari 3.0+
 * * Opera 10.5+
 * * Chrome 4.0+
 */
qx.Mixin.define("qx.ui.decoration.MBoxShadow",
{
  properties : {
    /** Horizontal length of the shadow. */
    shadowHorizontalLength :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBoxShadow"
    },

    /** Vertical length of the shadow. */
    shadowVerticalLength :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBoxShadow"
    },

    /** The blur radius of the shadow. */
    shadowBlurRadius :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBoxShadow"
    },

    /** The spread radius of the shadow. */
    shadowSpreadRadius :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBoxShadow"
    },

    /** The color of the shadow. */
    shadowColor :
    {
      nullable : true,
      check : "Color",
      apply : "_applyBoxShadow"
    },

    /** Inset shadows are drawn inside the border. */
    inset :
    {
      init : false,
      check : "Boolean",
      apply : "_applyBoxShadow"
    },

    /** Property group to set the shadow length. */
    shadowLength :
    {
      group : ["shadowHorizontalLength", "shadowVerticalLength"],
      mode : "shorthand"
    }
  },


  members :
  {
    /**
     * Takes a styles map and adds the box shadow styles in place to the
     * given map. This is the needed behavior for
     * {@link qx.ui.decoration.Decorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    _styleBoxShadow : function(styles) {
      var propName = qx.core.Environment.get("css.boxshadow");
      if (!propName ||
          this.getShadowVerticalLength() == null &&
          this.getShadowHorizontalLength() == null)
      {
        return;
      }

      if (qx.core.Environment.get("qx.theme"))
      {
        var Color = qx.theme.manager.Color.getInstance();
        var color = Color.resolve(this.getShadowColor());
      }
      else
      {
        var color = this.getShadowColor();
      }

      if (color != null)
      {
        var vLength = this.getShadowVerticalLength() || 0;
        var hLength = this.getShadowHorizontalLength() || 0;
        var blur = this.getShadowBlurRadius() || 0;
        var spread = this.getShadowSpreadRadius() || 0;
        var inset = this.getInset() ? "inset " : "";
        var value = inset + hLength + "px " + vLength + "px " + blur + "px " + spread + "px " + color;

        // apply or append the box shadow styles
        propName = qx.bom.Style.getCssName(propName);
        if (!styles[propName]) {
          styles[propName] = value;
        } else {
          styles[propName] += "," + value;
        }
      }
    },


    // property apply
    _applyBoxShadow : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */

/**
 * Decorator including all decoration possibilities from mixins:
 *
 * <ul>
 * <li>Background color</li>
 * <li>Background image</li>
 * <li>Background gradient</li>
 * <li>Single and double borders</li>
 * <li>Border radius</li>
 * <li>Box shadow</li>
 * </ul>
 */
qx.Class.define("qx.ui.decoration.Decorator", {

  extend : qx.ui.decoration.Abstract,

  implement : [qx.ui.decoration.IDecorator],

  include : [
    qx.ui.decoration.MBackgroundColor,
    qx.ui.decoration.MBorderRadius,
    qx.ui.decoration.MBoxShadow,
    qx.ui.decoration.MDoubleBorder,
    qx.ui.decoration.MLinearBackgroundGradient,
    qx.ui.decoration.MBorderImage
  ],

  members :
  {
    __initialized : false,

    /**
     * Returns the configured padding minus the border width.
     * @return {Map} Map of top, right, bottom and left padding values
     */
    getPadding : function()
    {
      var insets = this.getInset();
      var slices = this._getDefaultInsetsForBorderImage();

      var borderTop = insets.top - (slices.top ? slices.top : this.getWidthTop());
      var borderRight = insets.right - (slices.right ? slices.right : this.getWidthRight());
      var borderBottom = insets.bottom - (slices.bottom ? slices.bottom : this.getWidthBottom());
      var borderLeft = insets.left - (slices.left ? slices.left : this.getWidthLeft());

      return {
        top : insets.top ? borderTop : this.getInnerWidthTop(),
        right : insets.right ? borderRight : this.getInnerWidthRight(),
        bottom : insets.bottom ? borderBottom : this.getInnerWidthBottom(),
        left : insets.left ? borderLeft : this.getInnerWidthLeft()
      };
    },


    /**
     * Returns the styles of the decorator as a map with property names written
     * in javascript style (e.g. <code>fontWeight</code> instead of <code>font-weight</code>).
     *
     * @param css {Boolean?} <code>true</code> if hyphenated CSS names should be returned.
     * @return {Map} style information
     */
    getStyles : function(css)
    {
      if (css) {
        return this._getStyles();
      }

      var jsStyles = {};
      var cssStyles = this._getStyles();

      for (var property in cssStyles)
      {
        jsStyles[qx.lang.String.camelCase(property)] = cssStyles[property];
      }

      return jsStyles;
    },


    /**
     * Collects all the style information from the decorators.
     *
     * @return {Map} style information
     */
    _getStyles : function()
    {
      var styles = {};

      for (var name in this) {
        if (name.indexOf("_style") == 0 && this[name] instanceof Function) {
          this[name](styles);
        }
      }

      this.__initialized = true;
      return styles;
    },


    // overridden
    _getDefaultInsets : function() {
      var directions = ["top", "right", "bottom", "left"];
      var defaultInsets = {};

      for (var name in this) {
        if (name.indexOf("_getDefaultInsetsFor") == 0 && this[name] instanceof Function) {
          var currentInsets = this[name]();

          for (var i=0; i < directions.length; i++) {
            var direction = directions[i];
            // initialize with the first insets found
            if (defaultInsets[direction] == undefined) {
              defaultInsets[direction] = currentInsets[direction];
            }
            // take the largest inset
            if (currentInsets[direction] > defaultInsets[direction]) {
              defaultInsets[direction] = currentInsets[direction];
            }
          }
        }
      }

      // check if the mixins have created a default insets
      if (defaultInsets["top"] != undefined) {
        return defaultInsets;
      }
      // return a fallback which is 0 for all insets
      return {top: 0, right: 0, bottom: 0, left: 0};
    },


    // overridden
    _isInitialized: function() {
      return this.__initialized;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * The image class displays an image file
 *
 * This class supports image clipping, which means that multiple images can be combined
 * into one large image and only the relevant part is shown.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var image = new qx.ui.basic.Image("icon/32/actions/format-justify-left.png");
 *
 *   this.getRoot().add(image);
 * </pre>
 *
 * This example create a widget to display the image
 * <code>icon/32/actions/format-justify-left.png</code>.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/image.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.basic.Image",
{
  extend : qx.ui.core.Widget,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param source {String?null} The URL of the image to display.
   */
  construct : function(source)
  {
    this.__contentElements = {};

    this.base(arguments);

    if (source) {
      this.setSource(source);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The URL of the image */
    source :
    {
      check : "String",
      init : null,
      nullable : true,
      event : "changeSource",
      apply : "_applySource",
      themeable : true
    },


    /**
     * Whether the image should be scaled to the given dimensions
     *
     * This is disabled by default because it prevents the usage
     * of image clipping when enabled.
     */
    scale :
    {
      check : "Boolean",
      init : false,
      themeable : true,
      apply : "_applyScale"
    },


    // overridden
    appearance :
    {
      refine : true,
      init : "image"
    },


    // overridden
    allowShrinkX :
    {
      refine : true,
      init : false
    },


    // overridden
    allowShrinkY :
    {
      refine : true,
      init : false
    },


    // overridden
    allowGrowX :
    {
      refine : true,
      init : false
    },


    // overridden
    allowGrowY :
    {
      refine : true,
      init : false
    }
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired if the image source can not be loaded.
     *
     * *Attention*: This event is only used for images which are loaded externally
     * (aka unmanaged images).
     */
    loadingFailed : "qx.event.type.Event",


    /**
     * Fired if the image has been loaded.
     *
     * *Attention*: This event is only used for images which are loaded externally
     * (aka unmanaged images).
     */
    loaded : "qx.event.type.Event"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __width : null,
    __height : null,
    __mode : null,
    __contentElements : null,
    __currentContentElement : null,
    __wrapper : null,


    //overridden
    _onChangeTheme : function() {
      this.base(arguments);
      // restyle source (theme change might have changed the resolved url)
      this._styleSource();
    },

    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    getContentElement : function() {
      return this.__getSuitableContentElement();
    },


    // overridden
    _createContentElement : function() {
      return this.__getSuitableContentElement();
    },


    // overridden
    _getContentHint : function()
    {
      return {
        width : this.__width || 0,
        height : this.__height || 0
      };
    },

    // overridden
    _applyDecorator : function(value, old) {
      this.base(arguments, value, old);

      var source = this.getSource();
      source = qx.util.AliasManager.getInstance().resolve(source);
      var el = this.getContentElement();
      if (this.__wrapper) {
        el = el.getChild(0);
      }
      this.__setSource(el, source);
    },


    // overridden
    _applyPadding : function(value, old, name)
    {
      this.base(arguments, value, old, name);

      var element = this.getContentElement();
      if (this.__wrapper) {
        element.getChild(0).setStyles({
          top: this.getPaddingTop() || 0,
          left: this.getPaddingLeft() || 0
        });
      } else {
        element.setPadding(
          this.getPaddingLeft() || 0, this.getPaddingTop() || 0
        );
      }

    },

    renderLayout : function(left, top, width, height) {
      this.base(arguments, left, top, width, height);

      var element = this.getContentElement();
      if (this.__wrapper) {
        element.getChild(0).setStyles({
          width: width - (this.getPaddingLeft() || 0) - (this.getPaddingRight() || 0),
          height: height - (this.getPaddingTop() || 0) - (this.getPaddingBottom() || 0),
          top: this.getPaddingTop() || 0,
          left: this.getPaddingLeft() || 0
        });
      }
    },




    /*
    ---------------------------------------------------------------------------
      IMAGE API
    ---------------------------------------------------------------------------
    */

    // property apply, overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);

      if (this.getSource()) {
        this._styleSource();
      }
    },


    // property apply
    _applySource : function(value) {
      this._styleSource();
    },


    // property apply
    _applyScale : function(value) {
      this._styleSource();
    },


    /**
     * Remembers the mode to keep track which contentElement is currently in use.
     * @param mode {String} internal mode (alphaScaled|scaled|nonScaled)
     */
    __setMode : function(mode) {
      this.__mode = mode;
    },


    /**
     * Returns the current mode if set. Otherwise checks the current source and
     * the current scaling to determine the current mode.
     *
     * @return {String} current internal mode
     */
    __getMode : function()
    {
      if (this.__mode == null)
      {
        var source = this.getSource();
        var isPng = false;
        if (source != null) {
          isPng = qx.lang.String.endsWith(source, ".png");
        }

        if (this.getScale() && isPng && qx.core.Environment.get("css.alphaimageloaderneeded")) {
          this.__mode = "alphaScaled";
        } else if (this.getScale()) {
          this.__mode = "scaled";
        } else {
          this.__mode = "nonScaled";
        }
      }

      return this.__mode;
    },


    /**
     * Creates a contentElement suitable for the current mode
     *
     * @param mode {String} internal mode
     * @return {qx.html.Image} suitable image content element
     */
    __createSuitableContentElement : function(mode)
    {
      var scale;
      var tagName;
      if (mode == "alphaScaled")
      {
        scale = true;
        tagName = "div";
      }
      else if (mode == "nonScaled")
      {
        scale = false;
        tagName = "div";
      }
      else
      {
        scale = true;
        tagName = "img";
      }

      var element = new qx.html.Image(tagName);
      element.setAttribute("$$widget", this.toHashCode());
      element.setScale(scale);
      element.setStyles({
        "overflowX": "hidden",
        "overflowY": "hidden",
        "boxSizing": "border-box"
      });

      if (qx.core.Environment.get("css.alphaimageloaderneeded")) {
        var wrapper = this.__wrapper = new qx.html.Element("div");
        wrapper.setAttribute("$$widget", this.toHashCode());
        wrapper.setStyle("position", "absolute");
        wrapper.add(element);
        return wrapper;
      }

      return element;
    },


    /**
     * Returns a contentElement suitable for the current mode
     *
     * @return {qx.html.Image} suitable image contentElement
     */
    __getSuitableContentElement : function()
    {
      if (this.$$disposed) {
        return null;
      }

      var mode = this.__getMode();

      if (this.__contentElements[mode] == null) {
        this.__contentElements[mode] = this.__createSuitableContentElement(mode);
      }

      var element = this.__contentElements[mode];

      if (!this.__currentContentElement) {
        this.__currentContentElement = element;
      }

      return element;
    },


    /**
     * Applies the source to the clipped image instance or preload
     * an image to detect sizes and apply it afterwards.
     *
     */
    _styleSource : function()
    {
      var source = qx.util.AliasManager.getInstance().resolve(this.getSource());

      var element = this.getContentElement();
      if (this.__wrapper) {
        element = element.getChild(0);
      }

      if (!source)
      {
        element.resetSource();
        return;
      }

      this.__checkForContentElementSwitch(source);

      if ((qx.core.Environment.get("engine.name") == "mshtml") &&
        (parseInt(qx.core.Environment.get("engine.version"), 10) < 9 ||
         qx.core.Environment.get("browser.documentmode") < 9))
      {
        var repeat = this.getScale() ? "scale" : "no-repeat";
        element.tagNameHint = qx.bom.element.Decoration.getTagName(repeat, source);
      }

      var contentEl = this.__currentContentElement;
      if (this.__wrapper) {
        contentEl = contentEl.getChild(0);
      }

      // Detect if the image registry knows this image
      if (qx.util.ResourceManager.getInstance().has(source)) {
        this.__setManagedImage(contentEl, source);
      } else if (qx.io.ImageLoader.isLoaded(source)) {
        this.__setUnmanagedImage(contentEl, source);
      } else {
        this.__loadUnmanagedImage(contentEl, source);
      }
    },


    /**
     * Checks if the current content element is capable to display the image
     * with the current settings (scaling, alpha PNG)
     *
     * @param source {String} source of the image
     */
    __checkForContentElementSwitch : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(source)
      {
        var alphaImageLoader = qx.core.Environment.get("css.alphaimageloaderneeded");
        var isPng = qx.lang.String.endsWith(source, ".png");

        if (alphaImageLoader && isPng)
        {
          if (this.getScale() && this.__getMode() != "alphaScaled") {
            this.__setMode("alphaScaled");
          } else if (!this.getScale() && this.__getMode() != "nonScaled") {
            this.__setMode("nonScaled");
          }
        }
        else
        {
          if (this.getScale() && this.__getMode() != "scaled") {
            this.__setMode("scaled");
          } else if (!this.getScale() && this.__getMode() != "nonScaled") {
            this.__setMode("nonScaled");
          }
        }

        this.__checkForContentElementReplacement(this.__getSuitableContentElement());
      },

      "default" : function(source)
      {
        if (this.getScale() && this.__getMode() != "scaled") {
          this.__setMode("scaled");
        } else if (!this.getScale() && this.__getMode("nonScaled")) {
          this.__setMode("nonScaled");
        }

        this.__checkForContentElementReplacement(this.__getSuitableContentElement());
      }
    }),


    /**
     * Checks the current child and replaces it if necessary
     *
     * @param elementToAdd {qx.html.Image} content element to add
     */
    __checkForContentElementReplacement : function(elementToAdd)
    {
      var currentContentElement = this.__currentContentElement;

      if (currentContentElement != elementToAdd)
      {
        if (currentContentElement != null)
        {
          var pixel = "px";
          var styles = {};

          // Copy dimension and location of the current content element
          var bounds = this.getBounds();
          if (bounds != null)
          {
            styles.width = bounds.width + pixel;
            styles.height = bounds.height + pixel;
          }

          var insets = this.getInsets();
          styles.left = parseInt(currentContentElement.getStyle("left") || insets.left) + pixel;
          styles.top = parseInt(currentContentElement.getStyle("top") || insets.top) + pixel;

          styles.zIndex = 10;

          var newEl = this.__wrapper ? elementToAdd.getChild(0) : elementToAdd;
          newEl.setStyles(styles, true);
          newEl.setSelectable(this.getSelectable());

          if (!currentContentElement.isVisible()) {
            elementToAdd.hide();
          }

          if (!currentContentElement.isIncluded()) {
            elementToAdd.exclude();
          }

          var container = currentContentElement.getParent();

          if (container) {
            var index = container.getChildren().indexOf(currentContentElement);
            container.removeAt(index);
            container.addAt(elementToAdd, index);
          }
          // force re-application of source so __setSource is called again
          var hint = newEl.getNodeName();
          newEl.setSource(null);
          var currentEl = this.__wrapper ? this.__currentContentElement.getChild(0) : this.__currentContentElement;
          newEl.tagNameHint = hint;
          newEl.setAttribute("class", currentEl.getAttribute("class"));

          // Flush elements to make sure the DOM elements are created.
          qx.html.Element.flush();
          var currentDomEl = currentEl.getDomElement();
          var newDomEl = elementToAdd.getDomElement();

          // copy event listeners
          var listeners = currentContentElement.getListeners() || [];
          listeners.forEach(function(listenerData) {
            elementToAdd.addListener(listenerData.type, listenerData.handler, listenerData.self, listenerData.capture);
          });

          if (currentDomEl && newDomEl) {
            // Switch the DOM elements' hash codes. This is required for the event
            // layer to work [BUG #7447]
            var currentHash = currentDomEl.$$hash;
            currentDomEl.$$hash = newDomEl.$$hash;
            newDomEl.$$hash = currentHash;
          }

          this.__currentContentElement = elementToAdd;
        }
      }
    },


    /**
     * Use the ResourceManager to set a managed image
     *
     * @param el {Element} image DOM element
     * @param source {String} source path
     */
    __setManagedImage : function(el, source)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();

      // Try to find a disabled image in registry
      if (!this.getEnabled())
      {
        var disabled = source.replace(/\.([a-z]+)$/, "-disabled.$1");
        if (ResourceManager.has(disabled))
        {
          source = disabled;
          this.addState("replacement");
        }
        else
        {
          this.removeState("replacement");
        }
      }

      // Optimize case for enabled changes when no disabled image was found
      if (el.getSource() === source) {
        return;
      }

      // Apply source
      this.__setSource(el, source);

      // Compare with old sizes and relayout if necessary
      this.__updateContentHint(ResourceManager.getImageWidth(source),
        ResourceManager.getImageHeight(source));
    },


    /**
     * Use the infos of the ImageLoader to set an unmanaged image
     *
     * @param el {Element} image DOM element
     * @param source {String} source path
     */
    __setUnmanagedImage : function(el, source)
    {
      var ImageLoader = qx.io.ImageLoader;

      // Apply source
      this.__setSource(el, source);

      // Compare with old sizes and relayout if necessary
      var width = ImageLoader.getWidth(source);
      var height = ImageLoader.getHeight(source);
      this.__updateContentHint(width, height);
    },


    /**
     * Use the ImageLoader to load an unmanaged image
     *
     * @param el {Element} image DOM element
     * @param source {String} source path
     */
    __loadUnmanagedImage : function(el, source)
    {
      var ImageLoader = qx.io.ImageLoader;

      if (qx.core.Environment.get("qx.debug"))
      {
        // loading external images via HTTP/HTTPS is a common usecase, as is
        // using data URLs.
        var sourceLC = source.toLowerCase();
        var startsWith = qx.lang.String.startsWith;
        if (!startsWith(sourceLC, "http") &&
            !startsWith(sourceLC, "data:image/"))
        {
          var self = this.self(arguments);

          if (!self.__warned) {
            self.__warned = {};
          }

          if (!self.__warned[source])
          {
            this.debug("try to load an unmanaged relative image: " + source);
            self.__warned[source] = true;
          }
        }
      }

      // only try to load the image if it not already failed
      if(!ImageLoader.isFailed(source)) {
        ImageLoader.load(source, this.__loaderCallback, this);
      } else {
        if (el != null) {
          el.resetSource();
        }
      }
    },


    /**
     * Combines the decorator's image styles with our own image to make sure
     * gradient and backgroundImage decorators work on Images.
     *
     * @param el {Element} image DOM element
     * @param source {String} source path
     */
    __setSource : function(el, source) {
      if (el.getNodeName() == "div") {

        var dec = qx.theme.manager.Decoration.getInstance().resolve(this.getDecorator());
        // if the decorator defines any CSS background-image
        if (dec) {
          var hasGradient = (dec.getStartColor() && dec.getEndColor());
          var hasBackground = dec.getBackgroundImage();
          if (hasGradient || hasBackground) {
            var repeat = this.getScale() ? "scale" : "no-repeat";

            // get the style attributes for the given source
            var attr = qx.bom.element.Decoration.getAttributes(source, repeat);
            // get the background image(s) defined by the decorator
            var decStyle = dec.getStyles(true);

            var combinedStyles = {
              "backgroundImage":  attr.style.backgroundImage,
              "backgroundPosition": (attr.style.backgroundPosition || "0 0"),
              "backgroundRepeat": (attr.style.backgroundRepeat || "no-repeat")
            };

            if (hasBackground) {
              combinedStyles["backgroundPosition"] += "," + decStyle["background-position"] || "0 0";
              combinedStyles["backgroundRepeat"] += ", " + dec.getBackgroundRepeat();
            }

            if (hasGradient) {
              combinedStyles["backgroundPosition"] += ", 0 0";
              combinedStyles["backgroundRepeat"] += ", no-repeat";
            }

            combinedStyles["backgroundImage"] += "," + decStyle["background-image"];

            // apply combined background images
            el.setStyles(combinedStyles);

            return;
          }
        } else {
          // force re-apply to remove old decorator styles
          el.setSource(null);
        }
      }

      el.setSource(source);
    },


    /**
     * Event handler fired after the preloader has finished loading the icon
     *
     * @param source {String} Image source which was loaded
     * @param imageInfo {Map} Dimensions of the loaded image
     */
    __loaderCallback : function(source, imageInfo)
    {
      // Ignore the callback on already disposed images
      if (this.$$disposed === true) {
        return;
      }

      // Ignore when the source has already been modified
      if (source !== qx.util.AliasManager.getInstance().resolve(this.getSource())) {
        return;
      }

      // Output a warning if the image could not loaded and quit
      if (imageInfo.failed) {
        this.warn("Image could not be loaded: " + source);
        this.fireEvent("loadingFailed");
      } else if (imageInfo.aborted) {
        // ignore the rest because it is aborted
        return;
      } else {
        this.fireEvent("loaded");
      }

      // Update image (again)
      this._styleSource();
    },


    /**
     * Updates the content hint when the image size has been changed
     *
     * @param width {Integer} width of the image
     * @param height {Integer} height of the image
     */
    __updateContentHint : function(width, height)
    {
      // Compare with old sizes and relayout if necessary
      if (width !== this.__width || height !== this.__height)
      {
        this.__width = width;
        this.__height = height;

        qx.ui.core.queue.Layout.add(this);
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    delete this.__currentContentElement;
    this._disposeMap("__contentElements");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This is a simple image class using the low level image features of
 * qooxdoo and wraps it for the qx.html layer.
 */
qx.Class.define("qx.html.Image",
{
  extend : qx.html.Element,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __paddingTop : null,
    __paddingLeft: null,


    // this member variable is only used for IE browsers to be able
    // to the tag name which will be set. This is heavily connected to the runtime
    // change of decorators and the use of external (=unmanaged images). It is
    // necessary to be able to determine what tag will be used e.g. before the
    // ImageLoader has finished its loading of an external image.
    // See Bug #3894 for more details
    tagNameHint : null,


    /**
     * Maps padding to background-position if the widget is rendered as a
     * background image
     * @param paddingLeft {Integer} left padding value
     * @param paddingTop {Integer} top padding value
     */
    setPadding : function(paddingLeft, paddingTop)
    {
      this.__paddingLeft = paddingLeft;
      this.__paddingTop = paddingTop;

      if (this.getNodeName() == "div") {
        this.setStyle("backgroundPosition", paddingLeft + "px " + paddingTop + "px");
      }
    },


    /*
    ---------------------------------------------------------------------------
      ELEMENT API
    ---------------------------------------------------------------------------
    */

    // overridden
    _applyProperty : function(name, value)
    {
      this.base(arguments, name, value);

      if (name === "source")
      {
        var elem = this.getDomElement();

        // To prevent any wrong background-position or -repeat it is necessary
        // to reset those styles whenever a background-image is updated.
        // This is only necessary if any backgroundImage was set already.
        // See bug #3376 for details
        var styles = this.getAllStyles();

        if (this.getNodeName() == "div" && this.getStyle("backgroundImage"))
        {
          styles.backgroundRepeat = null;
        }

        var source = this._getProperty("source");
        var scale = this._getProperty("scale");
        var repeat = scale ? "scale" : "no-repeat";

        // Source can be null in certain circumstances.
        // See bug #3701 for details.
        if (source != null) {
          // Normalize "" to null
          source = source || null;

          styles.paddingTop = this.__paddingTop;
          styles.paddingLeft = this.__paddingLeft;

          qx.bom.element.Decoration.update(elem, source, repeat, styles);
        }
      }
    },

    // overridden
    _removeProperty : function(key, direct) {
      if (key == "source") {
        // Work-around check for null in #_applyProperty, introduced with fix
        // for bug #3701. Use empty string that is later normalized to null.
        // This fixes bug #4524.
        this._setProperty(key, "", direct);
      } else {
        this._setProperty(key, null, direct);
      }
    },

    // overridden
    _createDomElement : function()
    {
      var scale = this._getProperty("scale");
      var repeat = scale ? "scale" : "no-repeat";

      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        var source = this._getProperty("source");

        if (this.tagNameHint != null) {
          this.setNodeName(this.tagNameHint);
        } else {
          this.setNodeName(qx.bom.element.Decoration.getTagName(repeat, source));
        }
      }
      else
      {
        this.setNodeName(qx.bom.element.Decoration.getTagName(repeat));
      }

      return this.base(arguments);
    },


    // overridden
    // be sure that style attributes are merged and not overwritten
    _copyData : function(fromMarkup) {
      return this.base(arguments, true);
    },





    /*
    ---------------------------------------------------------------------------
      IMAGE API
    ---------------------------------------------------------------------------
    */

    /**
     * Configures the image source
     *
     * @param value {Boolean} Whether the HTML mode should be used.
     * @return {qx.html.Label} This instance for for chaining support.
     */
    setSource : function(value)
    {
      this._setProperty("source", value);
      return this;
    },


    /**
     * Returns the image source.
     *
     * @return {String} Current image source.
     */
    getSource : function() {
      return this._getProperty("source");
    },


    /**
     * Resets the current source to null which means that no image
     * is shown anymore.
     * @return {qx.html.Image} The current instance for chaining
     */
    resetSource : function()
    {
      // webkit browser do not allow to remove the required "src" attribute.
      // If removing the attribute the old image is still visible.
      if ((qx.core.Environment.get("engine.name") == "webkit")) {
        this._setProperty("source", "qx/static/blank.gif");
      } else {
        this._removeProperty("source", true);
      }
      return this;
    },


    /**
     * Whether the image should be scaled or not.
     *
     * @param value {Boolean} Scale the image
     * @return {qx.html.Label} This instance for for chaining support.
     */
    setScale : function(value)
    {
      this._setProperty("scale", value);
      return this;
    },


    /**
     * Returns whether the image is scaled or not.
     *
     * @return {Boolean} Whether the image is scaled
     */
    getScale : function() {
      return this._getProperty("scale");
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Alexander Steitz (aback)

************************************************************************ */

/**
 * Powerful creation and update features for images used for decoration
 * purposes like for rounded borders, icons, etc.
 *
 * Includes support for image clipping, PNG alpha channel support, additional
 * repeat options like <code>scale-x</code> or <code>scale-y</code>.
 */
qx.Class.define("qx.bom.element.Decoration",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Boolean} Whether clipping hints should be logged */
    DEBUG : false,

    /** @type {Map} Collect warnings for potential clipped images */
    __warnings : {},

    /** @type {Map} List of repeat modes which supports the IE AlphaImageLoader */
    __alphaFixRepeats : qx.core.Environment.select("engine.name",
    {
      "mshtml" :
      {
        "scale-x" : true,
        "scale-y" : true,
        "scale" : true,
        "no-repeat" : true
      },

      "default" : null
    }),


    /** @type {Map} Mapping between background repeat and the tag to create */
    __repeatToTagname :
    {
      "scale-x" : "img",
      "scale-y" : "img",
      "scale" : "img",
      "repeat" : "div",
      "no-repeat" : "div",
      "repeat-x" : "div",
      "repeat-y" : "div"
    },


    /**
     * Updates the element to display the given source
     * with the repeat option.
     *
     * @param element {Element} DOM element to update
     * @param source {String} Any valid URI
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param style {Map} Additional styles to apply
     */
    update : function(element, source, repeat, style)
    {
      var tag = this.getTagName(repeat, source);
      if (tag != element.tagName.toLowerCase()) {
        throw new Error("Image modification not possible because elements could not be replaced at runtime anymore!");
      }

      var ret = this.getAttributes(source, repeat, style);

      if (tag === "img") {
        element.src = ret.src || qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif");
      }

      // Fix for old background position
      if (element.style.backgroundPosition != "" && ret.style.backgroundPosition === undefined) {
        ret.style.backgroundPosition = null;
      }

      // Fix for old clip
      if (element.style.clip != "" && ret.style.clip === undefined) {
        ret.style.clip = null;
      }

      // Apply new styles
      qx.bom.element.Style.setStyles(element, ret.style);

      // we need to apply the filter to prevent black rendering artifacts
      // http://blog.hackedbrain.com/archive/2007/05/21/6110.aspx
      if (qx.core.Environment.get("css.alphaimageloaderneeded"))
      {
        try {
          element.filters["DXImageTransform.Microsoft.AlphaImageLoader"].apply();
        } catch(e) {}
      }
    },


    /**
     * Creates the HTML for a decorator image element with the given options.
     *
     * @param source {String} Any valid URI
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param style {Map} Additional styles to apply
     * @return {String} Decorator image HTML
     */
    create : function(source, repeat, style)
    {
      var tag = this.getTagName(repeat, source);
      var ret = this.getAttributes(source, repeat, style);
      var css = qx.bom.element.Style.compile(ret.style);

      if (tag === "img") {
        return '<img src="' + ret.src + '" style="' + css + '"/>';
      } else {
        return '<div style="' + css + '"></div>';
      }
    },


    /**
     * Translates the given repeat option to a tag name. Useful
     * for systems which depends on early information of the tag
     * name to prepare element like {@link qx.html.Image}.
     *
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param source {String?null} Source used to identify the image format
     * @return {String} The tag name: <code>div</code> or <code>img</code>
     */
    getTagName : function(repeat, source)
    {
      if (source && qx.core.Environment.get("css.alphaimageloaderneeded") &&
          this.__alphaFixRepeats[repeat] && qx.lang.String.endsWith(source, ".png"))
      {
        return "div";
      }

      return this.__repeatToTagname[repeat];
    },


    /**
     * This method is used to collect all needed attributes for
     * the tag name detected by {@link #getTagName}.
     *
     * @param source {String} Image source
     * @param repeat {String} Repeat mode of the image
     * @param style {Map} Additional styles to apply
     * @return {String} Markup for image
     */
    getAttributes : function(source, repeat, style)
    {
      if (!style) {
        style = {};
      }

      if (!style.position) {
        style.position = "absolute";
      }

      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        // Add a fix for small blocks where IE has a minHeight
        // of the fontSize in quirks mode
        style.fontSize = 0;
        style.lineHeight = 0;
      }
      else if ((qx.core.Environment.get("engine.name") == "webkit"))
      {
        // This stops images from being dragable in webkit
        style.WebkitUserDrag = "none";
      }

      var format = qx.util.ResourceManager.getInstance().getImageFormat(source) ||
                   qx.io.ImageLoader.getFormat(source);
      if (qx.core.Environment.get("qx.debug"))
      {
        if (source != null && format == null) {
          qx.log.Logger.warn("ImageLoader: Not recognized format of external image '" + source + "'!");
        }
      }

      var result;

      // Enable AlphaImageLoader in IE6/IE7/IE8
      if (qx.core.Environment.get("css.alphaimageloaderneeded") &&
          this.__alphaFixRepeats[repeat] && format === "png")
      {
        var dimension = this.__getDimension(source);
        this.__normalizeWidthHeight(style, dimension.width, dimension.height);
        result = this.processAlphaFix(style, repeat, source);
      }
      else
      {
        delete style.clip;
        if (repeat === "scale") {
          result = this.__processScale(style, repeat, source);
        } else  if (repeat === "scale-x" || repeat === "scale-y") {
          result = this.__processScaleXScaleY(style, repeat, source);
        } else {
          // Native repeats or "no-repeat"
          result = this.__processRepeats(style, repeat, source);
        }
      }

      return result;
    },


    /**
     * Normalize the given width and height values
     *
     * @param style {Map} style information
     * @param width {Integer?null} width as number or null
     * @param height {Integer?null} height as number or null
     */
    __normalizeWidthHeight : function(style, width, height)
    {
      if (style.width == null && width != null) {
        style.width = width + "px";
      }

      if (style.height == null && height != null) {
        style.height = height + "px";
      }
    },


    /**
     * Returns the dimension of the image by calling
     * {@link qx.util.ResourceManager} or {@link qx.io.ImageLoader}
     * depending on if the image is a managed one.
     *
     * @param source {String} image source
     * @return {Map} dimension of image
     */
    __getDimension : function(source)
    {
      var width = qx.util.ResourceManager.getInstance().getImageWidth(source) ||
                  qx.io.ImageLoader.getWidth(source);
      var height = qx.util.ResourceManager.getInstance().getImageHeight(source) ||
                   qx.io.ImageLoader.getHeight(source);

      return {
        width: width,
        height: height
      };
    },


    /**
     * Get all styles for IE browser which need to load the image
     * with the help of the AlphaImageLoader
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     *
     * @return {Map} style infos
     */
    processAlphaFix : function(style, repeat, source)
    {
      if (repeat == "repeat" || repeat == "repeat-x" || repeat == "repeat-y") {
        return style;
      }
      var sizingMethod = repeat == "no-repeat" ? "crop" : "scale";
      var filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
                   qx.util.ResourceManager.getInstance().toUri(source) +
                   "', sizingMethod='" + sizingMethod + "')";

      style.filter = filter;
      style.backgroundImage = style.backgroundRepeat = "";
      delete style["background-image"];
      delete style["background-repeat"];

      return {
        style : style
      };
    },


    /**
     * Process scaled images.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     *
     * @return {Map} image URI and style infos
     */
    __processScale : function(style, repeat, source)
    {
      var uri = qx.util.ResourceManager.getInstance().toUri(source);
      var dimension = this.__getDimension(source);

      this.__normalizeWidthHeight(style, dimension.width, dimension.height);

      return {
        src : uri,
        style : style
      };
    },


    /**
     * Process images which are either scaled horizontally or
     * vertically.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param sourceid {String} image resource id
     *
     * @return {Map} image URI and style infos
     */
    __processScaleXScaleY : function(style, repeat, sourceid)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();
      var clipped = ResourceManager.getCombinedFormat(sourceid);
      var dimension = this.__getDimension(sourceid);
      var uri;

      if (clipped)
      {
        var data = ResourceManager.getData(sourceid);
        var combinedid = data[4];
        if (clipped == "b64") {
          uri = ResourceManager.toDataUri(sourceid);
        }
        else {
          uri = ResourceManager.toUri(combinedid);
        }

        if (repeat === "scale-x") {
          style = this.__getStylesForClippedScaleX(style, data, dimension.height);
        } else {
          style = this.__getStylesForClippedScaleY(style, data, dimension.width);
        }

        return {
          src : uri,
          style : style
        };
      }

      // No clipped image available
      else
      {
        if (qx.core.Environment.get("qx.debug")) {
          this.__checkForPotentialClippedImage(sourceid);
        }

        if (repeat == "scale-x")
        {
          style.height = dimension.height == null ? null : dimension.height + "px";
          // note: width is given by the user
        }
        else if (repeat == "scale-y")
        {
          style.width = dimension.width == null ? null : dimension.width + "px";
          // note: height is given by the user
        }

        uri = ResourceManager.toUri(sourceid);
        return {
          src : uri,
          style : style
        };
      }
    },


    /**
     * Generates the style infos for horizontally scaled clipped images.
     *
     * @param style {Map} style infos
     * @param data {Array} image data retrieved from the {@link qx.util.ResourceManager}
     * @param height {Integer} image height
     *
     * @return {Map} style infos and image URI
     */
    __getStylesForClippedScaleX : function(style, data, height)
    {
      // Use clipped image (multi-images on x-axis)
      var imageHeight = qx.util.ResourceManager.getInstance().getImageHeight(data[4]);

      // Add size and clipping
      style.clip = {top: -data[6], height: height};
      style.height = imageHeight + "px";

      // note: width is given by the user

      // Fix user given y-coordinate to include the combined image offset
      if (style.top != null) {
        style.top = (parseInt(style.top, 10) + data[6]) + "px";
      } else if (style.bottom != null) {
        style.bottom = (parseInt(style.bottom, 10) + height - imageHeight - data[6]) + "px";
      }

      return style;
    },


    /**
     * Generates the style infos for vertically scaled clipped images.
     *
     * @param style {Map} style infos
     * @param data {Array} image data retrieved from the {@link qx.util.ResourceManager}
     * @param width {Integer} image width
     *
     * @return {Map} style infos and image URI
     */
    __getStylesForClippedScaleY : function(style, data, width)
    {
      // Use clipped image (multi-images on x-axis)
      var imageWidth = qx.util.ResourceManager.getInstance().getImageWidth(data[4]);

      // Add size and clipping
      style.clip = {left: -data[5], width: width};
      style.width = imageWidth + "px";

      // note: height is given by the user

      // Fix user given x-coordinate to include the combined image offset
      if (style.left != null) {
        style.left = (parseInt(style.left, 10) + data[5]) + "px";
      } else if (style.right != null) {
        style.right = (parseInt(style.right, 10) + width - imageWidth - data[5]) + "px";
      }

      return style;
    },


    /**
     * Process repeated images.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param sourceid {String} image resource id
     *
     * @return {Map} image URI and style infos
     */
    __processRepeats : function(style, repeat, sourceid)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();
      var clipped = ResourceManager.getCombinedFormat(sourceid);
      var dimension = this.__getDimension(sourceid);

      // Double axis repeats cannot be clipped
      if (clipped && repeat !== "repeat")
      {
        // data = [ 8, 5, "png", "qx", "qx/decoration/Modern/arrows-combined.png", -36, 0]
        var data = ResourceManager.getData(sourceid);
        var combinedid = data[4];
        if (clipped == "b64")
        {
          var uri = ResourceManager.toDataUri(sourceid);
          var offx = 0;
          var offy = 0;
        }
        else
        {
          var uri  = ResourceManager.toUri(combinedid);
          var offx = data[5];
          var offy = data[6];

          // honor padding for combined images
          if (style.paddingTop || style.paddingLeft || style.paddingRight || style.paddingBottom) {
            var top = style.paddingTop || 0;
            var left = style.paddingLeft || 0;

            offx += style.paddingLeft || 0;
            offy += style.paddingTop || 0;

            style.clip = {left: left, top: top, width: dimension.width, height: dimension.height};
          }
        }

        var bg = qx.bom.element.Background.getStyles(uri, repeat, offx, offy);
        for (var key in bg) {
          style[key] = bg[key];
        }

        if (dimension.width != null && style.width == null && (repeat == "repeat-y" || repeat === "no-repeat")) {
          style.width = dimension.width + "px";
        }

        if (dimension.height != null && style.height == null && (repeat == "repeat-x" || repeat === "no-repeat")) {
          style.height = dimension.height + "px";
        }

        return {
          style : style
        };
      }
      else
      {
        // honor padding
        var top = style.paddingTop || 0;
        var left = style.paddingLeft || 0;
        style.backgroundPosition = left + "px " + top + "px";

        if (qx.core.Environment.get("qx.debug"))
        {
          if (repeat !== "repeat") {
            this.__checkForPotentialClippedImage(sourceid);
          }
        }

        this.__normalizeWidthHeight(style, dimension.width, dimension.height);
        this.__getStylesForSingleRepeat(style, sourceid, repeat);

        return {
          style : style
        };
      }
    },


    /**
     * Generate all style infos for single repeated images
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     */
    __getStylesForSingleRepeat : function(style, source, repeat)
    {
      // retrieve the "backgroundPosition" style if available to prevent
      // overwriting with default values
      var top = null;
      var left = null;
      if (style.backgroundPosition)
      {
        var backgroundPosition = style.backgroundPosition.split(" ");

        left = parseInt(backgroundPosition[0], 10);
        if (isNaN(left)) {
          left = backgroundPosition[0];
        }

        top = parseInt(backgroundPosition[1], 10);
        if (isNaN(top)) {
          top = backgroundPosition[1];
        }
      }

      var bg = qx.bom.element.Background.getStyles(source, repeat, left, top);
      for (var key in bg) {
        style[key] = bg[key];
      }

      // Reset the AlphaImageLoader filter if applied
      // This prevents IE from setting BOTH CSS filter AND backgroundImage
      // This is only a fallback if the image is not recognized as PNG
      // If it's a Alpha-PNG file it *may* result in display problems
      if (style.filter) {
        style.filter = "";
      }
    },


    /**
     * Output a warning if the image can be clipped.
     *
     * @param source {String} image source
     */
    __checkForPotentialClippedImage : function(source)
    {
      if (this.DEBUG && qx.util.ResourceManager.getInstance().has(source) && source.indexOf("qx/icon") == -1)
      {
        if (!this.__warnings[source])
        {
          qx.log.Logger.debug("Potential clipped image candidate: " + source);
          this.__warnings[source] = true;
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * The background class contains methods to compute and set the background image
 * of a DOM element.
 *
 * It fixes a background position issue in Firefox 2.
 */
qx.Class.define("qx.bom.element.Background",
{
  statics :
  {
    /** @type {Array} Internal helper to improve compile performance */
    __tmpl :
    [
      "background-image:url(", null, ");",
      "background-position:", null, ";",
      "background-repeat:", null, ";"
    ],


    /** @type {Map} Empty styles when no image is given */
    __emptyStyles :
    {
      backgroundImage : null,
      backgroundPosition : null,
      backgroundRepeat : null
    },


    /**
     * Computes the background position CSS value
     *
     * @param left {Integer|String} either an integer pixel value or a CSS
     *    string value
     * @param top {Integer|String} either an integer pixel value or a CSS
     *    string value
     * @return {String} The background position CSS value
     */
    __computePosition : function(left, top)
    {
      // Correcting buggy Firefox background-position implementation
      // Have problems with identical values
      var engine = qx.core.Environment.get("engine.name");
      var version = qx.core.Environment.get("engine.version");
      if (engine == "gecko" && version < 1.9 && left == top && typeof left == "number") {
        top += 0.01;
      }

      if (left) {
        var leftCss = (typeof left == "number") ? left + "px" : left;
      } else {
        leftCss = "0";
      }
      if (top) {
        var topCss = (typeof top == "number") ? top + "px" : top;
      } else {
        topCss = "0";
      }

      return leftCss + " " + topCss;
    },


    /**
     * Checks if the given image URL is a base64-encoded one.
     *
     * @param url {String} image url to check for
     * @return {Boolean} whether it is a base64-encoded image url
     */
    __isBase64EncodedImage : function(url)
    {
      var String = qx.lang.String;

      // only check the first 50 characters for performance, since we do not
      // know how long a base64 image url can be.
      var firstPartOfUrl = url.substr(0, 50);
      return String.startsWith(firstPartOfUrl, "data:") && String.contains(firstPartOfUrl, "base64");
    },


    /**
     * Compiles the background into a CSS compatible string.
     *
     * @param source {String?null} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer|String?null} The horizontal offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "center", "left" and "right"
     * @param top {Integer|String?null} The vertical offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "top", "bottom" and "center"
     * @return {String} CSS string
     */
    compile : function(source, repeat, left, top)
    {
      var position = this.__computePosition(left, top);
      var backgroundImageUrl = qx.util.ResourceManager.getInstance().toUri(source);

      if (this.__isBase64EncodedImage(backgroundImageUrl)) {
        backgroundImageUrl = "'" + backgroundImageUrl + "'";
      }

      // Updating template
      var tmpl = this.__tmpl;

      tmpl[1] = backgroundImageUrl;
      tmpl[4] = position;
      tmpl[7] = repeat;

      return tmpl.join("");
    },


    /**
     * Get standard css background styles
     *
     * @param source {String} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer|String?null} The horizontal offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "center", "left" and "right"
     * @param top {Integer|String?null} The vertical offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "top", "bottom" and "center"
     * @return {Map} A map of CSS styles
     */
    getStyles : function(source, repeat, left, top)
    {
      if (!source) {
        return this.__emptyStyles;
      }

      var position = this.__computePosition(left, top);
      var backgroundImageUrl = qx.util.ResourceManager.getInstance().toUri(source);

      var backgroundImageCssString;
      if (this.__isBase64EncodedImage(backgroundImageUrl)) {
        backgroundImageCssString = "url('" + backgroundImageUrl + "')";
      } else {
        backgroundImageCssString = "url(" + backgroundImageUrl + ")";
      }

      var map = {
        backgroundPosition : position,
        backgroundImage : backgroundImageCssString
      };

      if (repeat != null) {
        map.backgroundRepeat = repeat;
      }
      return map;
    },


    /**
     * Set the background on the given DOM element
     *
     * @param element {Element} The element to modify
     * @param source {String?null} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer?null} The horizontal offset of the image inside of
     *     the image element.
     * @param top {Integer?null} The vertical offset of the image inside of
     *     the image element.
     */
    set : function(element, source, repeat, left, top)
    {
      var styles = this.getStyles(source, repeat, left, top);
      for (var prop in styles) {
        element.style[prop] = styles[prop];
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This widget is used as feedback widget in drag and drop actions.
 */
qx.Class.define("qx.ui.core.DragDropCursor",
{
  extend : qx.ui.basic.Image,
  include : qx.ui.core.MPlacement,
  type : "singleton",



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Put above other stuff
    this.setZIndex(1e8);

    // Move using DOM
    this.setDomMove(true);

    // Automatically add to root
    var root = this.getApplicationRoot();
    root.add(this, { left: -1000, top: - 1000 });
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    appearance :
    {
      refine : true,
      init : "dragdrop-cursor"
    },

    /** The current drag&drop action */
    action :
    {
      check : [ "alias", "copy", "move" ],
      apply : "_applyAction",
      nullable : true
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  members :
  {
    // property apply
    _applyAction : function(value, old)
    {
      if (old) {
        this.removeState(old);
      }

      if (value) {
        this.addState(value);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Methods to work with the delegate pattern.
 */
qx.Class.define("qx.util.Delegate",
{
  statics :
  {
    /**
     * Returns the delegate method given my its name.
     *
     * @param delegate {Object} The delegate object to check the method.
     * @param specificMethod {String} The name of the delegate method.
     * @return {Function|null} The requested method or null, if no method is set.
     */
    getMethod : function(delegate, specificMethod)
    {
      if (qx.util.Delegate.containsMethod(delegate, specificMethod)) {
        return qx.lang.Function.bind(delegate[specificMethod], delegate);
      }

      return null;
    },



    /**
     * Checks, if the given delegate is valid or if a specific method is given.
     *
     * @param delegate {Object} The delegate object.
     * @param specificMethod {String} The name of the method to search for.
     * @return {Boolean} True, if everything was ok.
     */
    containsMethod : function (delegate, specificMethod)
    {
      var Type = qx.lang.Type;

      if (Type.isObject(delegate)) {
        return Type.isFunction(delegate[specificMethod]);
      }

      return false;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * Base class for all list item renderer.
 */
qx.Class.define("qx.ui.mobile.list.renderer.Abstract",
{
  extend : qx.ui.mobile.container.Composite,
  type : "abstract",


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function(layout)
  {
    this.base(arguments, layout);
    this.initSelectable();
    this.initShowArrow();
  },


 /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "list-item"
    },


    /**
     * Whether the row is selected.
     */
    selected :
    {
      check : "Boolean",
      init : false,
      apply : "_applySelected"
    },


    /**
     * Whether the row is selectable.
     */
    selectable :
    {
      check : "Boolean",
      init : true,
      apply : "_applyAttribute"
    },


    /**
     * Whether to show an arrow in the row.
     */
    showArrow :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowArrow"
    },


    //overridden
    activatable :
    {
      refine :true,
      init : true
    }
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // abstract method
    /**
     * Resets all defined child widgets. Override this method in your custom
     * list item renderer and reset all widgets displaying data. Needed as the
     * renderer is used for every row and otherwise data of a different row
     * might be displayed, when not all data displaying widgets are used for the row.
     * Gets called automatically by the {@link qx.ui.mobile.list.provider.Provider}.
     *
     */
    reset : function() {
      if (qx.core.Environment.get("qx.debug")) {
        throw new Error("Abstract method call");
      }
    },

    // overridden
    _getTagName : function()
    {
      return "li";
    },


    /**
     * Returns the row index of a certain DOM element in the list from the given event.
     *
     * @param evt {qx.event.type.Event} The causing event.
     * @return {Integer} the index of the row.
     */
    getRowIndexFromEvent : function(evt) {
      return this.getRowIndex(evt.getOriginalTarget());
    },


    /**
     * Returns the row index of a certain DOM element in the list.
     *
     * @param element {Element} DOM element to retrieve the index from.
     * @return {Integer} the index of the row.
     */
    getRowIndex : function(element)
    {
      while (element.tagName != "LI") {
        element = element.parentNode;
      }
      return qx.dom.Hierarchy.getElementIndex(element);
    },


    // property apply
    _applyShowArrow : function(value, old)
    {
      if (value) {
        this.addCssClass("arrow");
      } else {
        this.removeCssClass("arrow");
      }
    },


    // property apply
    _applySelected : function(value, old)
    {
      if (value) {
        this.addCssClass("selected");
      } else {
        this.removeCssClass("selected");
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * The default list item renderer. Used as the default renderer by the
 * {@link qx.ui.mobile.list.provider.Provider}. Configure the renderer
 * by setting the {@link qx.ui.mobile.list.List#delegate} property.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *
 *   // Create the list with a delegate that
 *   // configures the list item.
 *   var list = new qx.ui.mobile.list.List({
 *     configureItem : function(item, data, row)
 *     {
 *       item.setImage("path/to/image.png");
 *       item.setTitle(data.title);
 *       item.setSubtitle(data.subtitle);
 *     }
 *   });
 * </pre>
 *
 * This example creates a list with a delegate that configures the list item with
 * the given data.
 */
qx.Class.define("qx.ui.mobile.list.renderer.Default",
{
  extend : qx.ui.mobile.list.renderer.Abstract,


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function(layout)
  {
    this.base(arguments, layout || new qx.ui.mobile.layout.HBox().set({
        alignY : "middle"
      }));
    this._init();
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __image : null,
    __title : null,
    __subtitle : null,
    __rightContainer : null,


    /**
     * Returns the image widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Image} The image widget
     */
    getImageWidget : function() {
      return this.__image;
    },


    /**
     * Returns the title widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Label} The title widget
     */
    getTitleWidget : function() {
      return this.__title;
    },


    /**
     * Returns the subtitle widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Label} The subtitle widget
     */
    getSubtitleWidget : function()
    {
      return this.__subtitle;
    },


    /**
     * Sets the source of the image widget.
     *
     * @param source {String} The source to set
     */
    setImage : function(source)
    {
      this.__image.setSource(source);
    },


    /**
     * Sets the value of the title widget.
     *
     * @param title {String} The value to set
     */
    setTitle : function(title)
    {
      if (title && title.translate) {
        this.__title.setValue(title.translate());
      }
      else {
        this.__title.setValue(title);
      }
    },


    /**
     * Sets the value of the subtitle widget.
     *
     * @param subtitle {String} The value to set
     */
    setSubtitle : function(subtitle)
    {
      if (subtitle && subtitle.translate) {
        this.__subtitle.setValue(subtitle.translate());
      }
      else {
        this.__subtitle.setValue(subtitle);
      }
    },


    /**
     * Inits the widgets for the renderer.
     *
     */
    _init : function()
    {
      this.__image = this._createImage();
      this.add(this.__image);

      this.__rightContainer = this._createRightContainer();
      this.add(this.__rightContainer, {flex:1});

      this.__title = this._createTitle();
      this.__rightContainer.add(this.__title);

      this.__subtitle = this._createSubtitle();
      this.__rightContainer.add(this.__subtitle);
    },


    /**
     * Creates and returns the right container composite. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.container.Composite} the right container.
     */
    _createRightContainer : function() {
      return new qx.ui.mobile.container.Composite(new qx.ui.mobile.layout.VBox());
    },


    /**
     * Creates and returns the image widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Image} the image widget.
     */
    _createImage : function() {
      var image = new qx.ui.mobile.basic.Image();
      image.setAnonymous(true);
      image.addCssClass("list-itemimage");
      return image;
    },


    /**
     * Creates and returns the title widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Label} the title widget.
     */
    _createTitle : function() {
      var title = new qx.ui.mobile.basic.Label();
      title.setWrap(false);
      title.addCssClass("list-itemlabel");
      return title;
    },


    /**
     * Creates and returns the subtitle widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Label} the subtitle widget.
     */
    _createSubtitle : function() {
      var subtitle = new qx.ui.mobile.basic.Label();
      subtitle.setWrap(false);
      subtitle.addCssClass("subtitle");
      return subtitle;
    },


    // overridden
    reset : function()
    {
      this.__image.setSource(null);
      this.__title.setValue("");
      this.__subtitle.setValue("");
    }
  },

 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__image", "__title", "__subtitle", "__rightContainer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following three keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove', 'order' or 'add/remove'</li>
     * <li>added: The items which has been added (as a JavaScript array)</li>
     * <li>removed: The items which has been removed (as a JavaScript array)</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            added: [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The end index. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. For every remove or
     * add an event will be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      } else if (amount == arguments.length - 2) {
        // if we added as much items as we removed
        var addedItems = qx.lang.Array.fromArguments(arguments, 2)
        // check if the array content equals the content before the operation
        for (var i = 0; i < addedItems.length; i++) {
          if (addedItems[i] !== returnArray[i]) {
            break;
          }
          // if all added and removed items are queal
          if (i == addedItems.length -1) {
            // prevent all events and return a new array
            return new qx.data.Array();
          }
        }
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      if (removed || added) {
        var addedItems = qx.lang.Array.fromArguments(arguments, 2);

        if (returnArray.length == 0) {
          var type = "add";
          var end = startIndex + addedItems.length;
        } else if (addedItems.length == 0) {
          var type = "remove";
          var end = this.length - 1;
        } else {
          var type = "add/remove";
          var end = startIndex + Math.abs(addedItems.length - returnArray.length);
        }
        this.fireDataEvent("change",
          {
            start: startIndex,
            end: end,
            type: type,
            added : addedItems,
            removed : returnArray
          }, null
        );
      }

      // remove the listeners first [BUG #7132]
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }

      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + (i - 2));
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + (arguments.length - 2) - amount, this.length);

      // fire the changeBubble event
      var value = [];
      for (var i=2; i < arguments.length; i++) {
        value[i-2] = arguments[i];
      };
      var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
      var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;
      this.fireDataEvent("changeBubble", {
        value: value, name: name + "", old: returnArray, item: this
      });

      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            added : [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add/remove",
          added: [item],
          removed: [oldItem]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },

    /**
     * Returns the last index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    lastIndexOf: function(item) {
      return this.__array.lastIndexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          removed : items,
          added : []
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the second argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, this.__array.length + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          added : array,
          removed : []
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      Additional JS1.6 methods
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a new array with all elements that pass the test implemented by
     * the provided function. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing only the items
     *  which passed the test.
     */
    filter : function(callback, self) {
      return new qx.data.Array(this.__array.filter(callback, self));
    },


    /**
     * Creates a new array with the results of calling a provided function on every
     * element in this array. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The mapping function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing the new created items.
     */
    map : function(callback, self) {
      return new qx.data.Array(this.__array.map(callback, self));
    },


    /**
     * Tests whether any element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if any element passed the test function.
     */
    some : function(callback, self) {
      return this.__array.some(callback, self);
    },


    /**
     * Tests whether every element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if every element passed the test function.
     */
    every : function(callback, self) {
      return this.__array.every(callback, self);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from left-to-right) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduce : function(callback, initValue) {
      return this.__array.reduce(callback, initValue);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from right-to-left) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduceRight : function(callback, initValue) {
      return this.__array.reduceRight(callback, initValue);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
