/*
#asset(qx/icon/${qx.icontheme}/22/apps/utilities-statistics.png)
*/

qx.Class.define
("gertyreports.ReportsMenuItem",
 {
     extend : qx.ui.menu.Button,

     // reportdef is a hash: name, class, description

     construct : function(reportdef, appwindow) {         
         this.base(arguments, reportdef.name,
                   "icon/22/apps/utilities-statistics.png");
         
         this.appWindow = appwindow;
         this.reportDef = reportdef;

         this.addListener("execute", function(){
             this.debug("Menu selected: " + this.reportDef.name);
             var win =
                 new gertyreports.ReportWindow(this.reportDef);
             this.appWindow.add(win,  {left:20, top:30});
         });   
         return this;
     },
     
     members :
     {
         appWindow: null,
         reportDef: null
     }          
 });

         