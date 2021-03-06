qx.Class.define("kirra_qooxdoo.EntityNavigator",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function(repository)
  {
    this.base(arguments);
    this.repository = repository;
    this.setTitle("Main");
  },


  events :
  {
    /** The page to show */
    "show" : "qx.event.type.Data"
  },


  members :
  {
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      var me = this;
      var list = this.entityList = new qx.ui.mobile.list.List({
        configureItem : function(item, data, row)
        {
          item.setTitle(data.name);
          item.setSubtitle(data.description);
          item.setShowArrow(true);
          item.data = data;
        }
      });
      this.getContent().add(list);
      list.addListener("changeSelection", function(evt) {
        var selectedEntity = list.getModel().getItem(evt.getData());
        qx.core.Init.getApplication().getRouting().executeGet("/entities/" + selectedEntity.fullName + "/instances/");
      }, this);
      
      this.repository.loadEntities(function (entities) {
          var topLevel = [];
          for (var i in entities) {
              if (entities[i].topLevel && (entities[i].concrete === undefined || entities[i].concrete) && (entities[i].standalone === undefined || entities[i].standalone))
                  topLevel.push(entities[i]);
          }
          me.entityList.setModel(new qx.data.Array(topLevel));
      });
    },
    _start : function() {
        this.base(arguments);
    }
  }
});
