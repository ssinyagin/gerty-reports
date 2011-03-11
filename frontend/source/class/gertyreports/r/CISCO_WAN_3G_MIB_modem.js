
qx.Class.define
("gertyreports.r.CISCO_WAN_3G_MIB_modem",
 {
     extend : gertyreports.DisplayTimeSeries,

     members :
     {
         reportTitle: "3G GSM modem statistics",
         exportUrlPath: "CISCO_WAN_3G_MIB/get_rssi_timeseries",
         rpcServiceName: "CISCO_WAN_3G_MIB",
         rpcTimeSeriesMethod: "get_rssi_timeseries"
     }
 });






