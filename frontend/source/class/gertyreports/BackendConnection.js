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
        /**
         * A variant of the asyncCall method which pops up error messages
         * generated by the server automatically.
         *
         * Note that the handler method only gets a return value never
         * an exception. It just does not get called when there is an exception.
         *
         * @param handler {Function} the callback function.
         * @param methodName {String} the name of the method to call.
         * @return {var} the method call reference.
         */
        callAsyncSmart : function(handler, methodName) {
            var origHandler = handler;

            var superHandler = function(ret, exc, id) {
                if (exc) {
                    ep.ui.MsgBox.getInstance().exc(exc);
                } else {
                    origHandler(ret);
                }
            };
            
            arguments[0] = superHandler;
            this.callAsync.apply(this, arguments);
        }
    }
});

