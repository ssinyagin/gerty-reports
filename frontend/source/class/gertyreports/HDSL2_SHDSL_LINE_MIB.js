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
         initContent : function()
         {
             var tabView = new qx.ui.tabview.TabView();

             tabView.add(this.initSeachTab());
             tabView.add(this.initTopNTab());
             this.add(tabView);
         },

         initSeachTab : function ()
         {
             var page = new qx.ui.tabview.Page(
                 "Search", "icon/16/actions/system-search.png");
             page.setLayout(new qx.ui.layout.Grow());
             
             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             page.add(rowsContainer);
             
             var firstRow =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             rowsContainer.add(firstRow);
             
             firstRow.add(new qx.ui.basic.Label
                          ("Device name starting with: "));
             
             var searchField = new qx.ui.form.TextField();
             searchField.setLiveUpdate(true);
             firstRow.add(searchField);

             var secondRowGrid = new qx.ui.layout.Grid(15,6);
             var secondRow =
                 new qx.ui.container.Composite(secondRowGrid);
             secondRowGrid.setRowFlex(1,1);
             rowsContainer.add(secondRow, {flex: 1});
             

             secondRow.add(new qx.ui.basic.Label
                           ("Search results: "), {row:0, column:0});
             var hostList = new qx.ui.form.List();
             secondRow.add(hostList, {row:1, column:0});


             secondRow.add(new qx.ui.basic.Label
                           ("Ports: "), {row:2, column:0});
             var portList = new qx.ui.form.List();
             portList.setHeight(70);
             secondRow.add(portList, {row:3, column:0});


             secondRow.add(
                 new qx.ui.basic.Label(
                     "Statistics for last 14 days:"),
                 {row:0, column:1});

             var statsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(2));
             secondRow.add(statsContainer, {row:1, column:1, rowSpan:3});


             var hostinfoLabel = new qx.ui.basic.Label();
             hostinfoLabel.setRich(true);
             hostinfoLabel.setSelectable(true);
             statsContainer.add(hostinfoLabel);
             

             var legendLabel = new qx.ui.basic.Label();
             legendLabel.setRich(true);
             legendLabel.setFont(new qx.bom.Font(9, [
                 "Verdana", "Arial", "Sans Serif"]));
             legendLabel.setValue(
                 "CRC Errors: daily average count per minute<br>" +
                     "ES, SES, LOSWS, UAS: daily average in percent of time");
             statsContainer.add(legendLabel);

             var statsTable = new qx.ui.table.Table();
             statsTable.set({width: 640});
             statsContainer.add(statsTable, {flex : 1});
             
             // ***  bindings between widgets ***

             // bind search field with the hostList
             
             var searchResults = new qx.data.Array();
             var searchListController =
                 new qx.data.controller.List(searchResults, hostList);

             // make every input in the searchField update the hostList
             // with 300ms delay

             var searchTimer = qx.util.TimerManager.getInstance();
             var searchTimerId = null;
             
             searchField.addListener(
                 "changeValue",
                 function(e)
                 {
                     if( searchTimerId != null )
                     {
                         searchTimer.stop(searchTimerId);
                     }

                     searchTimerId = searchTimer.start(
                         function(userData)
                         {
                             searchTimerId = null;
                             searchResults.removeAll();
                             if( userData != null && userData.length > 0 )
                             {
                                 var rpc =
                                     gertyreports.BackendConnection.
                                     getInstance();
                                 rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                                 rpc.callAsyncSmart(
                                     function(result)
                                     {
                                         searchResults.append(result);
                                     },
                                     "search_host", userData + '%', 50);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         300);
                 });
             

             // bind hostList with portList

             var portArray = new qx.data.Array();
             var portListController =
                 new qx.data.controller.List(portArray, portList);
             
             // make every selection in hostList update portList 
             // with 300ms delay

             var portTimer = qx.util.TimerManager.getInstance();
             var portTimerId = null;

             searchListController.addListener(
                 "changeSelection",
                 function()
                 {
                     if( portTimerId != null )
                     {
                         portTimer.stop(portTimerId);
                     }

                     portTimerId = portTimer.start(
                         function(userData)
                         {
                             portTimerId = null;
                             portArray.removeAll();
                             if( userData != null && userData.length > 0 )
                             {
                                 var rpc =
                                     gertyreports.BackendConnection.
                                     getInstance();
                                 rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                                 rpc.callAsyncSmart(
                                     function(result)
                                     {
                                         if( result != null )
                                         {
                                             portArray.append(result);
                                         }
                                     },
                                     "get_host_ports", userData);
                             }
                         },
                         0,
                         null,
                         this.getSelection().getItem(0),
                         300);
                     
                 },
                 searchListController);

             
             // bind portList with the statistics widget
             // with 500ms delay

             var statTimer = qx.util.TimerManager.getInstance();
             var statTimerId = null;

             portListController.addListener(
                 "changeSelection",
                 function()
                 {
                     if( statTimerId != null )
                     {
                         statTimer.stop(statTimerId);
                     }

                     hostinfoLabel.setValue("Loading...");
                     
                     statTimerId = statTimer.start(
                         function(userData)
                         {
                             statTimerId = null;
                             if( userData != null && userData.length > 0 )
                             {
                                 var hostname = searchListController.
                                     getSelection().getItem(0);
                                 var intf = userData;
                                 
                                 var rpc =
                                     gertyreports.BackendConnection.
                                     getInstance();
                                 rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                                 rpc.callAsyncSmart(
                                     function(result)
                                     {
                                         if( result != null )
                                         {
                                             hostinfoLabel.setValue(
                                                 "Device: <b>" + hostname +
                                                     "</b> &nbsp;&nbsp; " +
                                                     "Port: <b>" + intf +
                                                     "</b>");
   
                                             var statsModel =
                                                 new qx.ui.table.model.Simple();

                                             statsModel.setColumns(
                                                 result[0]);

                                             result.shift();
                                             statsModel.addRows(result);
                                             
                                             statsTable.setTableModel(
                                                 statsModel);
                                         }
                                     },
                                     "get_line_summary", hostname, intf);
                             }
                         },
                         0,
                         null,
                         this.getSelection().getItem(0),
                         500);
                     
                 },
                 portListController);
             
             return page;
         },



         
         initTopNTab : function()
         {
             var page = new qx.ui.tabview.Page(
                 "Top N", "icon/16/apps/office-chart.png");
             page.setLayout(new qx.ui.layout.Grow());


             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             page.add(rowsContainer);

             var firstRowLayout = new qx.ui.layout.HBox(8);
             firstRowLayout.setAlignY("bottom");
             var firstRow =
                 new qx.ui.container.Composite(firstRowLayout);
             rowsContainer.add(firstRow);
             
             firstRow.add(new qx.ui.basic.Label
                          ("Show top "));
             
             var topNumField = new qx.ui.form.TextField("10");
             topNumField.setWidth(50);
             firstRow.add(topNumField);

             firstRow.add(new qx.ui.basic.Label("devices from"));

             var today = new Date();
             var dateFrom = new qx.ui.form.DateField();
             dateFrom.setValue(today);
             firstRow.add(dateFrom);

             firstRow.add(new qx.ui.basic.Label("to"));

             var dateTo = new qx.ui.form.DateField();
             dateTo.setValue(today);
             firstRow.add(dateTo);

             firstRow.add(new qx.ui.basic.Label("by"));

             var critListData = [
                 {label: "CRC Errors", data: "CRCA_COUNT"}, 
                 {label: "Errored Seconds", data: "ES_COUNT"},
                 {label: "Severely Errored Seconds", data: "SES_COUNT"},
                 {label: "Loss of Sync Word Seconds", data: "LOSWS_COUNT"},
                 {label: " Unavailable Seconds", data: "UAS_COUNT"}
             ];
             
             var critModel =
                 qx.data.marshal.Json.createModel(critListData);
             
             var critList = new qx.ui.form.SelectBox();
             critList.setWidth(200);
             var critListController =
                 new qx.data.controller.List(critModel, critList, "label");
             
             firstRow.add(critList);


             var goButton = new qx.ui.form.Button("Go!");
             goButton.addListener(
                 "execute",
                 function() {
                 }
             );

             firstRow.add(goButton);
             
             return page;
         }
     }
 });






