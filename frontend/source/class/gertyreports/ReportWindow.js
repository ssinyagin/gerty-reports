qx.Class.define
("gertyreports.ReportWindow",
 {
     extend : qx.ui.window.Window,

     // reportdef is a hash: name, class, description
     
     construct : function(title) {             
         this.base(arguments, title);

         this.setLayout(new qx.ui.layout.Grow());
         this.setHeight(500);
         this.setWidth(800);
         this.setShowStatusbar(true);
         this.open();
         
         gertyreports.ReportWindow.desktop.add(this, {
             left: gertyreports.ReportWindow.next_window_left,
             top:  gertyreports.ReportWindow.next_window_top});
         gertyreports.ReportWindow.next_window_top += 30;
         gertyreports.ReportWindow.next_window_left += 30;

         this.initContent();
         
         return this;
     },
     
     statics : {
         desktop : null,
         next_window_top : 40,
         next_window_left : 30
     }
 });

         