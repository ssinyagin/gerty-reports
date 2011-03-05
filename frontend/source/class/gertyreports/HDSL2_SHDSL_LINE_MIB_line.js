/*
#asset(qx/icon/${qx.icontheme}/22/actions/view-refresh.png)
#asset(jqPlot/*)
*/

qx.Class.define
("gertyreports.HDSL2_SHDSL_LINE_MIB_line",
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

             var goButton = new qx.ui.form.Button(
                 null, "icon/22/actions/view-refresh.png");
             controlsContainer.add(goButton);

             var plotContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.Grow());
             
             rowsContainer.add(plotContainer, {flex:1});


             // Event handler for the Go button
             
             goButton.addListener(
                 "execute",
                 function() {
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
                             if( result[0] > 0 )
                             {
                                 var opts = function ($jqplot)
                                 {
                                     var ret = result[2];
                                     var tickFormat = '%F %R'
                                     if( days == 1 )
                                     {
                                         tickFormat = '%R';
                                     }
                                     else
                                     {
                                         if( days > 3 )
                                         {
                                             tickFormat = '%F';
                                         }
                                     }
                                     
                                     ret.axes = {
                                         xaxis: {
                                             renderer: $jqplot.DateAxisRenderer,
                                             tickOptions:{
                                                 formatString: tickFormat
                                             },
                                             numberTicks: 6,
                                             pad: 1.001
                                         }
                                     };

                                     ret.legend = {show: true};
                                     
                                     ret.seriesDefaults = {
                                         lineWidth: 1.0,
                                         markerOptions: {size: 2}
                                     }

                                     return ret;
                                 };

                                 var plot = new qxjqplot.Plot(
                                     result[1],
                                     opts,
                                     ['dateAxisRenderer']);
                                 
                                 plotContainer.add(plot);
                                 statusBar.setStatus(
                                     "Ready. " + result[0] + " data points");
                             }
                             else
                             {
                                 statusBar.setStatus("No data availale");
                             }
                         },
                         "get_line_stats",
                         this.hostname,
                         this.intf,
                         dateFormatter.format(dateFrom.getValue()),
                         days
                     );
                 },
                 this);
         }
     }
 });






