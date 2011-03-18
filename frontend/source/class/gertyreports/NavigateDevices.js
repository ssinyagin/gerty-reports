/*
#asset(qx/icon/${qx.icontheme}/22/actions/system-search.png)
#asset(qx/icon/${qx.icontheme}/22/apps/office-chart.png)
#asset(qx/icon/${qx.icontheme}/22/apps/utilities-statistics.png)
*/

qx.Class.define
("gertyreports.NavigateDevices",
 {
     extend : gertyreports.ReportWindow,

     members :
     {
         topNFirstTime: null,
         
         rpcServiceName: null,
         rpcSearchDevicesMethod: null,
         rpcSummaryMethod: null,
         topNSortBy: null,
         rpcTopNMethod: null,
         timeSeriesReportClass: null,
         legendText: null,
                 
         
         initContent : function()
         {
             this.topNFirstTime = true;
             
             var tabView = new qx.ui.tabview.TabView();

             tabView.add(this.initSeachTab());
             tabView.add(this.initTopNTab());
             this.initAdditionalTabs(tabView);
             this.add(tabView);
         },

         initAdditionalTabs : function(tabView)
         {
             /* do nothing - let subclasses override this */
         },
             
         initSeachTab : function ()
         {
             var statusBar = this;
             var reportWindow = this;
             
             var page = new qx.ui.tabview.Page(
                 "Search", "icon/22/actions/system-search.png");
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
                     null, "icon/22/apps/utilities-statistics.png");
             lineDetailsButton.setToolTipText(
                 "Open detailed statistics in a new window");
             lineDetailsButton.setEnabled(false);
             statsLabelContainer.add(lineDetailsButton);
             
             var hostinfoLabel = new qx.ui.basic.Label();
             hostinfoLabel.setWidth(150);
             hostinfoLabel.setRich(true);
             hostinfoLabel.setSelectable(true);
             statsLabelContainer.add(hostinfoLabel);


             statsLabelContainer.add(
                 new qx.ui.basic.Label("Daily summary for last 2 weeks:"));
             
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
                 this.bindSearchInputWithHostlist(searchField, hostList);
             
             
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
                                 rpc.setServiceName(
                                     reportWindow.rpcServiceName);
                                 rpc.callAsyncSmart(
                                     function(result)
                                     {
                                         if( result != null )
                                         {
                                             
                                             hostinfoLabel.setValue(
                                                 "<b>" + hostname +
                                                     (intf.length > 0 ?
                                                      (", " + intf):"") +
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
                                                 result.labels);
                                             statsModel.addRows(result.data);
                                             
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
                                     reportWindow.rpcSummaryMethod,
                                     hostname, intf);
                             },
                             0,
                             null,
                             selected,
                             150);
                     }
                 },
                 searchListController);            

             // Lite details pick up the date from statsTable
             lineDetailsButton.addListener(
                 "execute",
                 function()
                 {
                     var detailsDate = new Date();
                     var model = statsTable.getTableModel();
                     var selModel = statsTable.getSelectionModel();
                     if( !selModel.isSelectionEmpty() )
                     {
                         var row = selModel.getAnchorSelectionIndex();
                         var dateString = model.getValue(0, row);
                         var dateFormatter =
                             new qx.util.format.DateFormat('YYYY-MM-dd');
                         detailsDate = dateFormatter.parse(dateString);
                     }
                     this.openLineDetails(
                         lineDetailsButton.getUserData('hostname'),
                         lineDetailsButton.getUserData('intf'),
                         detailsDate);
                 },
                 this);

             
             return page;
         },


         // ******  Top N tab  ********
         
         initTopNTab : function()
         {
             var statusBar = this;
             var reportWindow = this;
             
             var page = new qx.ui.tabview.Page(
                 "Top N", "icon/22/apps/office-chart.png");
             page.setLayout(new qx.ui.layout.Grow());
             
             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             page.add(rowsContainer);

             var firstRowLayout = new qx.ui.layout.HBox(8);
             firstRowLayout.setAlignY("bottom");
             var firstRow =
                 new qx.ui.container.Composite(firstRowLayout);
             rowsContainer.add(firstRow);

             var validator = new qx.ui.form.validation.Manager();

             firstRow.add(new qx.ui.basic.Label("Display top"));
             
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
             daysList.setWidth(50);
             new qx.data.controller.List(daysModel, daysList);
             firstRow.add(daysList);

             firstRow.add(new qx.ui.basic.Label("days, sort by"));

             var critListData = reportWindow.topNSortBy;
             
             var critModel =
                 qx.data.marshal.Json.createModel(critListData);
             
             var critList = new qx.ui.form.SelectBox();
             critList.setWidth(200);
             new qx.data.controller.List(critModel, critList, "label");
             
             firstRow.add(critList);
             
             firstRow.add(new qx.ui.core.Spacer(200));

             var lineDetailsButton =
                 new qx.ui.form.Button(
                     null, "icon/22/apps/utilities-statistics.png");
             lineDetailsButton.setToolTipText(
                 "Open detailed line statistics in a new window");
             lineDetailsButton.setEnabled(false);
             lineDetailsButton.addListener(
                 "execute",
                 function()
                 {
                     var daysSelection = daysList.getSelection();
                     var days = daysSelection[0].getModel();
                     
                     this.openLineDetails(
                         lineDetailsButton.getUserData('hostname'),
                         lineDetailsButton.getUserData('intf'),
                         dateFrom.getValue()
                     );
                 },
                 this);
             firstRow.add(lineDetailsButton);
             
             var statsTable = new qx.ui.table.Table();
             statsTable.setStatusBarVisible(false);
             rowsContainer.add(statsTable, {flex : 1});
             
             rowsContainer.add(this.legendLabel());

             // Event handler for selection changes

             var refreshTable = function() {
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
                     rpc.setServiceName(reportWindow.rpcServiceName);
                     rpc.callAsyncSmart(
                         function(result)
                         {
                             if( result != null )
                             {
                                 var statsModel =
                                     new qx.ui.table.model.Simple();
                                 
                                 statsModel.setColumns(result.labels);
                                 statsModel.addRows(result.data);
                                 
                                 statsTable.setTableModel(statsModel);
                                 statsTable.setVisibility("visible");
                                 
                                 statusBar.setStatus(
                                     "Statistics available for " +
                                         statsModel.getRowCount() +
                                         " lines. Select the new criteria " +
                                         "or choose a device and see the " +
                                         "graphs");
                             }
                         },
                         reportWindow.rpcTopNMethod,
                         topNumField.getValue(),
                         dateFormatter.format(dateFrom.getValue()),
                         days,
                         criterion);
                 }
                 else
                 {
                     statusBar.setStatus("Invalid parameters");
                 }
             };             

             // refresh the table after selection change
             
             topNumField.addListener("changeValue", refreshTable);
             dateFrom.addListener("changeValue", refreshTable);
             daysList.addListener("changeSelection",refreshTable);
             critList.addListener("changeSelection",refreshTable);
             
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

             page.addListener(
                 "appear",
                 function(e)
                 {
                     if( reportWindow.topNFirstTime )
                     {
                         // retrieve data immediately after window opening
                         refreshTable();
                         reportWindow.topNFirstTime = false;
                     }
                     else
                     {
                         statusBar.setStatus(
                             "Select the criteria for Top-N display");
                     }
                 });

             return page;
         },

         legendLabel : function ()
         {
             var ret = new qx.ui.basic.Label();
             ret.setRich(true);
             ret.setFont(new qx.bom.Font(9, [
                 "Verdana", "Arial", "Sans Serif"]));
             ret.setValue(this.legendText);
             return ret;
         },

         openLineDetails: function (hostname, intf, dateFrom)
         {
             var klass = qx.Class.getByName(this.timeSeriesReportClass);
             if( klass == null )
             {
                 alert("Cannot load report class: " +
                       this.timeSeriesReportClass);
             }
             else
             {
                 new klass(hostname, intf, dateFrom);
             }
         },


         bindSearchInputWithHostlist : function(searchField, hostList)
         {
             var statusBar = this;
             var reportWindow = this;

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
                                 rpc.setServiceName(
                                     reportWindow.rpcServiceName);
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
                                     reportWindow.rpcSearchDevicesMethod,
                                     userData + '%', 50);
                             }
                         },
                         0,
                         null,
                         e.getData(),
                         200);
                 });
             
             return searchListController;
         }
     }
 });






