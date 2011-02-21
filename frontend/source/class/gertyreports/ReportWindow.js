qx.Class.define
("gertyreports.ReportWindow",
 {
     extend : qx.ui.window.Window,

     // reportdef is a hash: name, class, description
     
     construct : function(reportdef) {             
         this.base(arguments, reportdef.description);
         this.debug("ReportWindow created: " + reportdef.name);

         this.reportDef = reportdef;

         this.setLayout(new qx.ui.layout.VBox(10));
         this.setHeight(500);
         this.setWidth(600);
         this.open();
         return this;
     },
     
     members :
     {
         reportDef: null
     }
 });

         