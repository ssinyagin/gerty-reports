/*
#asset(qx/icon/${qx.icontheme}/16/actions/system-search.png)
#asset(qx/icon/${qx.icontheme}/16/apps/office-chart.png)
*/

qx.Class.define
("gertyreports.HDSL2_SHDSL_LINE_MIB",
 {
     extend : gertyreports.ReportWindow,

     members :
     {
         initialize : function()
         {
             var tabView = new qx.ui.tabview.TabView();

             {
                 var page = new qx.ui.tabview.Page(
                     "Search", "icon/16/actions/system-search.png");
                 page.setLayout(new qx.ui.layout.Grow());
                 tabView.add(page);
                 
                 var layout = new qx.ui.layout.Grid(4,4);
                 layout.setColumnFlex(1,1);
                 layout.setRowFlex(1,1);
                 
                 var container = new qx.ui.container.Composite(layout);
                 page.add(container);
                 
                 container.add(new qx.ui.basic.Label
                               ("Hostname starting with: "),
                               {row: 0, column: 0});
                 
                 var textfield = new qx.ui.form.TextField();
                 textfield.setLiveUpdate(true);
                 container.add(textfield, {row: 0, column: 1});
                 
                 var list = new qx.ui.form.List();
                 container.add(list, {row: 1, column: 0, colSpan: 2});

                 var searchResults = new qx.data.Array();
                 var listController =
                     new qx.data.controller.List(searchResults, list);
                 
                 // make every input in the textfield update the list
                 textfield.addListener(
                     "changeValue",
                     function(e)
                     {
                         searchResults.removeAll();
                         if( e.getData().length > 0 )
                         {
                             var rpc =
                                 gertyreports.BackendConnection.getInstance();
                             rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                             rpc.callAsyncSmart(
                                 function(result)
                                 {
                                     searchResults.append(result);
                                 },
                                 "search_host", e.getData() + '%', 50);
                         }
                     });

                 // upon selection, open a new window with host statistics
                 listController.addListener(
                     "changeSelection",
                     function()
                     {
                         //TODO
                     },
                     this);
             }

             {
                 var page = new qx.ui.tabview.Page(
                     "Top N", "icon/16/apps/office-chart.png");
                 page.setLayout(new qx.ui.layout.Grow());
                 tabView.add(page);
             }
             
             this.add(tabView);
         }
     }
 });



