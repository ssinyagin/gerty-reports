/* JSON-RPC connection to gerty-reports backend */

qx.Class.define('gertyreports.BackendConnection', {
    extend : qx.io.remote.Rpc,
    type : "singleton",
    
    construct : function() {
        this.base(arguments);
        this.setTimeout(3000);
        this.setUrl(qx.core.Setting.get("gertyreports.backend.url"));
    },
    
    members : {
    }
});

