/*
#asset(qx/icon/${qx.icontheme}/22/apps/utilities-statistics.png)
*/

qx.Class.define
("gertyreports.ReportsMenuItem",
 {
     extend : qx.ui.menu.Button,

     // reportdef is a hash: name, class, description

     construct : function(reportdef, desktop) {         
         this.base(arguments, reportdef['name'],
                   "icon/22/apps/utilities-statistics.png");
         
         this.desktop = desktop;
         this.reportDef = reportdef;

         this.addListener("execute", function(){
             this.debug("Menu selected: " + this.reportDef['name']);
             eval('new gertyreports.' +
                  this.reportDef['class'] +
                  '(this.reportDef[\'description\'], desktop)');
         });   
         return this;
     },

     members :
     {
         desktop: null,
         reportDef: null
     }          
 });

         