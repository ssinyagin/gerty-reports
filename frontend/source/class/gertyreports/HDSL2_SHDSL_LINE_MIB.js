/*
#asset(qx/icon/${qx.icontheme}/16/actions/system-search.png)
#asset(qx/icon/${qx.icontheme}/16/apps/office-chart.png)
#asset(qx/icon/${qx.icontheme}/22/actions/view-refresh.png)
#asset(qx/icon/${qx.icontheme}/16/apps/utilities-statistics.png)
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
             var statusBar = this;
             
             var page = new qx.ui.tabview.Page(
                 "Search", "icon/16/actions/system-search.png");
             page.setLayout(new qx.ui.layout.Grow());
             page.addListener(
                 "appear",
                 function(e)
                 {
                     statusBar.setStatus(
                         "Type in the first letters of device name");
                 });

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
             secondRowGrid.setColumnFlex(1,1);
             rowsContainer.add(secondRow, {flex: 1});
             

             secondRow.add(new qx.ui.basic.Label
                           ("Search results: "), {row:0, column:0});
             var hostList = new qx.ui.form.List();
             hostList.setWidth(180);
             secondRow.add(hostList, {row:1, column:0});


             var statsLabelLayout = new qx.ui.layout.HBox(20);
             statsLabelLayout.setAlignY("middle");
             var statsLabelContainer =
                 new qx.ui.container.Composite(statsLabelLayout);
             secondRow.add(statsLabelContainer, {row:0, column:1});


             var lineDetailsButton =
                 new qx.ui.form.Button(
                     null, "icon/16/apps/utilities-statistics.png");
             lineDetailsButton.setToolTipText(
                 "Open detailed line statistics in a new window");
             lineDetailsButton.setEnabled(false);
             lineDetailsButton.addListener(
                 "execute",
                 function()
                 {
                     this.openLineDetails(
                         lineDetailsButton.getUserData('hostname'),
                         lineDetailsButton.getUserData('intf'));
                 },
                 this);
             statsLabelContainer.add(lineDetailsButton);
             
             var hostinfoLabel = new qx.ui.basic.Label();
             hostinfoLabel.setWidth(150);
             hostinfoLabel.setRich(true);
             hostinfoLabel.setSelectable(true);
             statsLabelContainer.add(hostinfoLabel);


             statsLabelContainer.add(
                 new qx.ui.basic.Label("Line errors for last 2 weeks:"));
             
             var statsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(2));
             secondRow.add(statsContainer, {row:1, column:1});
             
             var statsTable = new qx.ui.table.Table();
             statsTable.setStatusBarVisible(false);
             statsContainer.add(statsTable, {flex : 1});

             statsContainer.add(this.legendLabel());

             
             // ***  bindings between widgets ***

             // bind search field with the hostList
             
             var searchListController =
                 new qx.data.controller.List(null, hostList, "label");

             // make every input in the searchField update the hostList
             // with 200ms delay

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

                     statusBar.setStatus("Searching...");
                     
                     searchTimerId = searchTimer.start(
                         function(userData)
                         {
                             searchTimerId = null;
                             if( userData != null && userData.length > 0 )
                             {
                                 var rpc =
                                     gertyreports.BackendConnection.
                                     getInstance();
                                 rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                                 rpc.callAsyncSmart(
                                     function(result)
                                     {
                                         var model = 
                                             qx.data.marshal.Json.createModel(
                                                 result);
                                         
                                         searchListController.setModel(model);
                                         
                                         if( result.length == 50 )
                                         {
                                             statusBar.setStatus(
                                                 "Search results limited " +
                                                     "to 50 lines")
                                         }
                                         else
                                         {
                                             statusBar.setStatus(
                                                 "Search results: " +
                                                     result.length + " lines");
                                         }
                                     },
                                     "search_hosts_and_lines",
                                     userData + '%', 50);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         200);
                 });
             
             
             // bind searchList with the statistics widget
             // with 150ms delay

             var statTimer = qx.util.TimerManager.getInstance();
             var statTimerId = null;

             searchListController.addListener(
                 "changeSelection",
                 function()
                 {
                     if( statTimerId != null )
                     {
                         statTimer.stop(statTimerId);
                     }

                     var selected = this.getSelection().getItem(0);
                     if( selected != null )
                     {
                         statsTable.setVisibility("hidden");
                         statsTable.resetSelection();
                         statsTable.resetCellFocus();
                         hostinfoLabel.setValue("");
                         lineDetailsButton.setEnabled(false);
                         statusBar.setStatus("Loading...");
                         
                         statTimerId = statTimer.start(
                             function(userData)
                             {
                                 statTimerId = null;

                                 var hostname = userData.getHostname();
                                 var intf = userData.getInterface();
                                 
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
                                                 "<b>" + hostname +
                                                     ", " + intf +
                                                     "</b>");
                                             lineDetailsButton.setUserData(
                                                 'hostname', hostname);
                                             lineDetailsButton.setUserData(
                                                 'intf', intf);
                                             lineDetailsButton.setEnabled(
                                                 true);

                                             var statsModel =
                                                 new qx.ui.table.model.Simple();
                                             
                                             statsModel.setColumns(
                                                 result[0]);
                                             
                                             result.shift();
                                             statsModel.addRows(result);
                                             
                                             statsTable.setTableModel(
                                                 statsModel);
                                             statsTable.setVisibility(
                                                 "visible");
                                             
                                             statusBar.setStatus(
                                                 "Statistics available for " +
                                                     statsModel.getRowCount() +
                                                     " days");
                                         }
                                     },
                                     "get_line_summary", hostname, intf);
                             },
                             0,
                             null,
                             selected,
                             150);
                     }
                 },
                 searchListController);            
             
             return page;
         },


         // ******  Top N tab  ********
         
         initTopNTab : function()
         {
             var statusBar = this;
             
             var page = new qx.ui.tabview.Page(
                 "Top N", "icon/16/apps/office-chart.png");
             page.setLayout(new qx.ui.layout.Grow());
             page.addListener(
                 "appear",
                 function(e)
                 {
                     statusBar.setStatus(
                         "Select the criteria for Top-N display and " +
                             "click the fire button");
                 });
             
             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             page.add(rowsContainer);

             var firstRowLayout = new qx.ui.layout.HBox(8);
             firstRowLayout.setAlignY("bottom");
             var firstRow =
                 new qx.ui.container.Composite(firstRowLayout);
             rowsContainer.add(firstRow);

             var validator = new qx.ui.form.validation.Manager();

             var goButton = new qx.ui.form.Button(
                 "Display", "icon/22/actions/view-refresh.png");
             firstRow.add(goButton);

             firstRow.add(new qx.ui.basic.Label
                          ("top"));
             
             var topNumField = new qx.ui.form.TextField("10");
             topNumField.setWidth(50);
             firstRow.add(topNumField);

             validator.add(topNumField,
                           function(value, item)
                           {
                               var valid =
                                   value != null &&
                                   value.length > 0 &&
                                   value >= 5 &&
                                   value <=50;
                               if (!valid) {
                                   item.setInvalidMessage(
                                       "Please enter a " +
                                           "number between 5 and 50");
                               }
                               return valid;
                           });
             
             
             firstRow.add(new qx.ui.basic.Label("devices from"));

             var today = new Date();
             var dateFrom = new qx.ui.form.DateField();
             dateFrom.setValue(today);
             firstRow.add(dateFrom);

             firstRow.add(new qx.ui.basic.Label("for"));
             
             var daysData = [1,2,3,4,5,6,7];
             var daysModel =
                 qx.data.marshal.Json.createModel(daysData);                 
             var daysList = new qx.ui.form.SelectBox();
             daysList.setWidth(40);
             new qx.data.controller.List(daysModel, daysList);
             firstRow.add(daysList);

             firstRow.add(new qx.ui.basic.Label("days, sort by"));

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
             new qx.data.controller.List(critModel, critList, "label");
             
             firstRow.add(critList);

             var spacer = new qx.ui.basic.Atom();
             spacer.setWidth(200);
             firstRow.add(spacer);

             var lineDetailsButton =
                 new qx.ui.form.Button(
                     null, "icon/16/apps/utilities-statistics.png");
             lineDetailsButton.setToolTipText(
                 "Open detailed line statistics in a new window");
             lineDetailsButton.setEnabled(false);
             lineDetailsButton.addListener(
                 "execute",
                 function()
                 {
                     this.openLineDetails(
                         lineDetailsButton.getUserData('hostname'),
                         lineDetailsButton.getUserData('intf'));
                 },
                 this);
             firstRow.add(lineDetailsButton);
             
             var statsTable = new qx.ui.table.Table();
             statsTable.setStatusBarVisible(false);
             rowsContainer.add(statsTable, {flex : 1});
             
             rowsContainer.add(this.legendLabel());

             // Event handler for the Go button
             
             goButton.addListener(
                 "execute",
                 function() {
                     if( validator.validate() )
                     {
                         statsTable.setVisibility("hidden");
                         statsTable.resetSelection();
                         statsTable.resetCellFocus();
                         lineDetailsButton.setEnabled(false);
                         statusBar.setStatus("Loading...");

                         var critSelection = critList.getSelection();
                         var criterion = critSelection[0].getModel().getData();

                         var daysSelection = daysList.getSelection();
                         var days = daysSelection[0].getModel();
                             
                         var dateFormatter =
                             new qx.util.format.DateFormat('YYYY-MM-dd');
                         
                         var rpc =
                             gertyreports.BackendConnection.
                             getInstance();
                         rpc.setServiceName('HDSL2_SHDSL_LINE_MIB');
                         rpc.callAsyncSmart(
                             function(result)
                             {
                                 if( result != null )
                                 {
                                     var statsModel =
                                         new qx.ui.table.model.Simple();
                                     
                                     statsModel.setColumns(
                                         result[0]);
                                     
                                     result.shift();
                                     statsModel.addRows(result);
                                     
                                     statsTable.setTableModel(statsModel);
                                     statsTable.setVisibility("visible");
                                     
                                     statusBar.setStatus(
                                         "Statistics available for " +
                                             statsModel.getRowCount() +
                                             " lines");
                                 }
                             },
                             "get_topn",
                             topNumField.getValue(),
                             dateFormatter.format(dateFrom.getValue()),
                             days,
                             criterion);
                     }
                     else
                     {
                         statusBar.setStatus("Invalid parameters");
                     }
                 }
             );

             // Click on a table row -> enable the details button
             statsTable.getSelectionModel().addListener(
                 "changeSelection",
                 function ()
                 {
                     var row = statsTable.getFocusedRow();
                     if( row != null )
                     {
                         var model = statsTable.getTableModel();
                         var hostname = model.getValue(0, row);
                         var intf = model.getValue(1, row);
                         lineDetailsButton.setUserData('hostname', hostname);
                         lineDetailsButton.setUserData('intf', intf);
                         lineDetailsButton.setEnabled(true);
                     }
                     else
                     {
                         lineDetailsButton.setEnabled(false);
                     }
                 },
                 this);
             
             return page;
         },

         legendLabel : function ()
         {
             var ret = new qx.ui.basic.Label();
             ret.setRich(true);
             ret.setFont(new qx.bom.Font(9, [
                 "Verdana", "Arial", "Sans Serif"]));
             ret.setValue(
                 "CRC Errors: maximum count per 15-minute interval<br>" +
                     "ES, SES, LOSWS, UAS: maximum seconds per " +
                     "15-minute interval<br>" +
                     "Hours: measurement time");
             return ret;
         },

         openLineDetails: function (hostname, intf)
         {
             new gertyreports.HDSL2_SHDSL_LINE_MIB_line(hostname, intf);
         }
     }
 });






