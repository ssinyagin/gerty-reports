/*
  #asset(dygraphs/*)
*/

qx.Class.define
("gertyreports.r.HDSL2_SHDSL_LINE_MIB_line",
 {
     extend : gertyreports.ReportWindow,

     construct : function(hostname, intf, dateFrom) {
         this.hostname = hostname;
         this.intf = intf;
         this.dateFrom = dateFrom;
         
         this.base(arguments, "Line statistics: " + hostname + ",  " + intf);
     },

     members :
     {
         hostname : null,
         intf: null,
         plotObject: null,
         dateFrom: null,
         
         initContent : function()
         {
             var statusBar = this;
             var reportWindow = this;
             
             statusBar.setStatus(
                 "Select the time range and press the Refresh button");
             
             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             this.add(rowsContainer);

             var controlsLayout = new qx.ui.layout.HBox(8);
             controlsLayout.setAlignY("middle");
             var controlsContainer =
                 new qx.ui.container.Composite(controlsLayout);
             rowsContainer.add(controlsContainer);
             
             controlsContainer.add(new qx.ui.basic.Label(
                 "Display line statistics from "));

             var dateFrom = new qx.ui.form.DateField();
             if( this.dateFrom != null )
             {
                 dateFrom.setValue(this.dateFrom);
             }
             else
             {
                 // today
                 dateFrom.setValue(new Date());
             }
             controlsContainer.add(dateFrom);

             controlsContainer.add(new qx.ui.basic.Label("for"));
             
             var daysData = [1,2,3,4,5,6,7,14,30,90];
             var daysModel =
                 qx.data.marshal.Json.createModel(daysData);                 
             var daysList = new qx.ui.form.SelectBox();
             daysList.setWidth(60);
             new qx.data.controller.List(daysModel, daysList);
             controlsContainer.add(daysList);
             
             controlsContainer.add(new qx.ui.basic.Label("days"));

             var plotContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.Grow());
             rowsContainer.add(plotContainer, {flex: 1});

             // Event handler for selection changes

             var drawGraph  = function() {
                 plotContainer.removeAll();
                 statusBar.setStatus("Loading...");
                 
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
                         // result = [rowcount, data, options]
                         if( result[0] > 0 )
                         {
                             var opts = result[2];
                             var series = result[1];
                             // convert UNIX timestamps to dates
                             for(var i=0; i<series.length; i++)
                             {
                                 series[i][0] =
                                     new Date(series[i][0] * 1000);
                             }
                             
                             var plot = new qxdygraphs.Plot(series,opts);
                             plotContainer.add(plot);
                             statusBar.setStatus(
                                 "Retrieved " + result[0] + " data points");
                         }
                         else
                         {
                             statusBar.setStatus("No data availale");
                         }
                     },
                     "get_line_timeseries",
                     reportWindow.hostname,
                     reportWindow.intf,
                     dateFormatter.format(dateFrom.getValue()),
                     days
                 );
             };
             
             // redraw the graph on selection change
             dateFrom.addListener("changeValue", drawGraph);
             daysList.addListener("changeSelection", drawGraph);

             // plot the data when the window opens for the first time
             drawGraph();
         }
     }
 });






