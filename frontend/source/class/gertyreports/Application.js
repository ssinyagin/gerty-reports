/*
#asset(qx/icon/${qx.icontheme}/22/apps/utilities-statistics.png)
*/

qx.Class.define
("gertyreports.Application",
 {
     extend : qx.application.Standalone,
     
     members :
     {
         main : function()
         {
             this.base(arguments);
             if (qx.core.Variant.isSet("qx.debug", "on"))
             {
                 qx.log.appender.Native;
                 // support additional cross-browser console.
                 // Press F7 to toggle visibility
                 qx.log.appender.Console;
             }

             var root = this.getRoot();
             gertyreports.ReportWindow.desktop = root;
             this.addMenuBar(root);

             /* for quick testing
             new gertyreports.r.HDSL2_SHDSL_LINE_MIB_line(
                 'do-dm-01', 'MLP-1-1', new Date(1298934000*1000));
             */
         },

         // Top-level toolbar         
         addMenuBar : function(appwindow)
         {
             var frame = new qx.ui.container.Composite(new qx.ui.layout.Grow);
             frame.setDecorator("main");
             
             var reportsMenu = new qx.ui.menu.Menu;
             
             var rpc = gertyreports.BackendConnection.getInstance();
             rpc.setServiceName('Common');
             rpc.callAsyncSmart(
                 function(reports)
                 {
                     // result is array of hashes: name, class, description
                     for (var i=0; i < reports.length; i++)
                     {
                         rpc.debug("Adding menu item: " + reports[i]["name"]);
                         var button =
                             new qx.ui.menu.Button(
                                 reports[i].name,
                                 "icon/22/apps/utilities-statistics.png");
                         
                         button.setUserData("report-class",
                                            reports[i]["class"]);
                         button.setUserData("report-descr",
                                            reports[i]["description"]);
                         
                         button.addListener(
                             "execute",
                             function()
                             {
                                 var klassName =
                                     "gertyreports.r." +
                                     this.getUserData("report-class");
                                 
                                 this.debug("Launching report window: " +
                                            klassName);
                                 
                                 var klass = qx.Class.getByName(klassName);
                                 if( klass == null )
                                 {
                                     alert("Cannot load report class: " +
                                           klassName);
                                 }
                                 else
                                 {
                                     new klass(
                                         this.getUserData("report-descr"));
                                 }
                             },
                             button);
                         
                         reportsMenu.add(button);
                     }
                 },
                 "listreports");
             
             var reportsMenuButton =
                 new qx.ui.toolbar.MenuButton("Reports");
             reportsMenuButton.setMenu(reportsMenu);
             
             var menuPart = new qx.ui.toolbar.Part;
             menuPart.add(reportsMenuButton);


             var helpPart = new qx.ui.toolbar.Part;
             helpPart.add(new qx.ui.toolbar.Button("Help"));

             var toolbar = new qx.ui.toolbar.ToolBar;
             toolbar.setWidth(400);
             frame.add(toolbar);

             toolbar.add(menuPart);
             toolbar.addSpacer();
             toolbar.add(helpPart);

             appwindow.add(frame);
         }
     }
 });

