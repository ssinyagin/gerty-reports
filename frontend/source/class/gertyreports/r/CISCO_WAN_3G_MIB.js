/*
#asset(qx/icon/${qx.icontheme}/22/apps/utilities-log-viewer.png)
#asset(qx/icon/${qx.icontheme}/22/apps/office-spreadsheet.png)
*/
qx.Class.define
("gertyreports.r.CISCO_WAN_3G_MIB",
 {
     extend : gertyreports.NavigateDevices,

     members :
     {
         rpcServiceName: "CISCO_WAN_3G_MIB",
         rpcSearchDevicesMethod: "search_hosts",
         rpcSummaryMethod: "get_rssi_summary",
         topNSortBy: [
             {label: "RSSI Minimum", data: "RSSI_MIN"}, 
             {label: "RSSI Average", data: "RSSI_AVG"},
             {label: "RSSI Std. dev.", data: "RSSI_STDDEV"}
         ],
         rpcTopNMethod: "get_topn",
         
         timeSeriesReportClass: "gertyreports.r.CISCO_WAN_3G_MIB_modem",
         
         legendText: "Min RSSI: lowest 1-minute measurement<br/>" +
             "Avg RSSI: average measurement<br/>" +
             "Std. Dev.: standard deviation of measured values<br/>" +
             "Hours: measurement time",

         initAdditionalTabs : function(tabView)
         {
             tabView.add(this.initHardwareTab());
         },

         
         // ****** Hardware History tab ********
         
         initHardwareTab : function ()
         {
             var statusBar = this;
             var reportWindow = this;
             
             var page = new qx.ui.tabview.Page(
                 "Hardware History", "icon/22/apps/utilities-log-viewer.png");
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
             hostList.setWidth(120);
             secondRow.add(hostList, {row:1, column:0});


             var statsLabelLayout = new qx.ui.layout.HBox(20);
             statsLabelLayout.setAlignY("middle");
             var statsLabelContainer =
                 new qx.ui.container.Composite(statsLabelLayout);
             secondRow.add(statsLabelContainer, {row:0, column:1});


             var hostinfoLabel = new qx.ui.basic.Label();
             hostinfoLabel.setWidth(150);
             hostinfoLabel.setRich(true);
             hostinfoLabel.setSelectable(true);
             statsLabelContainer.add(hostinfoLabel);


             statsLabelContainer.add(
                 new qx.ui.basic.Label("3G Modem hardware history:"));

             // Customize the table column model.
             // We want one that automatically resizes columns.
             
             var histTableCustom =
                 {
                     tableColumnModel : function(obj)
                     {
                         return new qx.ui.table.columnmodel.Resize(obj);
                     }
                 };
             
             var historyTableContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.Grow());
             var dummyTable = new qx.ui.table.Table();
             dummyTable.setStatusBarVisible(false);
             historyTableContainer.add(dummyTable);
             secondRow.add(historyTableContainer, {row:1, column:1});
             
             // ***  bindings between widgets ***

             // bind search field with the hostList
             var searchListController =
                 this.bindSearchInputWithHostlist(searchField, hostList);
             
             // bind searchList with the history widget
             // with 150ms delay

             var histTimer = qx.util.TimerManager.getInstance();
             var histTimerId = null;

             searchListController.addListener(
                 "changeSelection",
                 function()
                 {
                     if( histTimerId != null )
                     {
                         histTimer.stop(histTimerId);
                     }

                     var selected = this.getSelection().getItem(0);
                     if( selected != null )
                     {
                         historyTableContainer.removeAll();
                         hostinfoLabel.setValue("");
                         statusBar.setStatus("Loading...");
                         
                         histTimerId = histTimer.start(
                             function(userData)
                             {
                                 histTimerId = null;

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

                                             var histModel =
                                                 new qx.ui.table.model.Simple();
                                             
                                             histModel.setColumns(
                                                 result.labels);
                                             histModel.addRows(result.data);

                                             var historyTable =
                                                 new qx.ui.table.Table(
                                                     histModel,
                                                     histTableCustom);
                                             historyTable.setStatusBarVisible(
                                                 false);
                                             historyTableContainer.add(
                                                 historyTable);
                                             
                                             statusBar.setStatus(
                                                 "Retrieved " +
                                                     histModel.getRowCount() +
                                                     " rows");
                                         }
                                     },
                                     "get_hw_history",
                                     hostname);
                             },
                             0,
                             null,
                             selected,
                             150);
                     }
                 },
                 searchListController);            

             // Excel export button
             firstRow.add(new qx.ui.core.Spacer(500, 0));

             var xlsButton =
                 new qx.ui.form.Button(
                     null, "icon/22/apps/office-spreadsheet.png");
             xlsButton.setToolTipText(
                 "Export all hardware history as Excel file");
             firstRow.add(xlsButton);

             xlsButton.addListener(
                 "execute",
                 function(e)
                 {
                     window.location.href =
                         qx.core.Setting.get("gertyreports.export.url") +
                         "/xls/CISCO_WAN_3G_MIB/get_hw_history";
                 });
             
             return page;
         }
     }
 });






