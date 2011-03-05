/*
#asset(qx/icon/${qx.icontheme}/22/actions/view-refresh.png)
#asset(jqPlot/*)
*/

qx.Class.define
("gertyreports.HDSL2_SHDSL_LINE_MIB_line",
 {
     extend : gertyreports.ReportWindow,

     construct : function(hostname, intf) {
         this.hostname = hostname;
         this.intf = intf;
         
         this.base(arguments, "Line statistics: " + hostname + ",  " + intf);
     },

     members :
     {
         hostname : null,
         intf: null,
         
         initContent : function()
         {
             var rowsContainer =
                 new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
             this.add(rowsContainer);

             var controlsLayout = new qx.ui.layout.HBox(8);
             controlsLayout.setAlignY("middle");
             var controlsContainer =
                 new qx.ui.container.Composite(controlsLayout);
             rowsContainer.add(controlsContainer);

             var goButton = new qx.ui.form.Button(
                 "Display", "icon/22/actions/view-refresh.png");
             controlsContainer.add(goButton);
             
             controlsContainer.add(new qx.ui.basic.Label(
                 "line statistics from "));

             var today = new Date();
             var dateFrom = new qx.ui.form.DateField();
             dateFrom.setValue(today);
             controlsContainer.add(dateFrom);

             controlsContainer.add(new qx.ui.basic.Label("for"));
             
             var daysData = [1,2,3,4,5,6,7,14,30,90];
             var daysModel =
                 qx.data.marshal.Json.createModel(daysData);                 
             var daysList = new qx.ui.form.SelectBox();
             daysList.setWidth(40);
             new qx.data.controller.List(daysModel, daysList);
             controlsContainer.add(daysList);
             
             controlsContainer.add(new qx.ui.basic.Label("days"));

             var plot = new qxjqplot.Plot(
                 [[4, 25, 13, 22, 14, 17, 15]],
                 {
                     title:'Dragable and Trend Line Example',
                     seriesDefaults: {
                         isDragable: true,
                         trendline: {
                             show: true
                         }
                     }
                 },
                 ['dragable','trendline']
             );

             rowsContainer.add(plot, {flex:1});
         }

     }
 });






