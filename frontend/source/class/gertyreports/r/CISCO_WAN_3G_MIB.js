
qx.Class.define
("gertyreports.r.CISCO_WAN_3G_MIB",
 {
     extend : gertyreports.NavigateDevices,

     members :
     {
         rpcServiceName: "CISCO_WAN_3G_MIB",
         rpcSearchDevicesMethod: "search_hosts",
         rpcSummaryMethod: "get_rssi_summary",
         topNSortBy: [
             {label: "RSSI Minimum", data: "RSSI_MIN"}, 
             {label: "RSSI Average", data: "RSSI_AVG"},
             {label: "RSSI Std. dev.", data: "RSSI_STDDEV"}
         ],
         rpcTopNMethod: "get_topn",
         
         timeSeriesReportClass: "gertyreports.r.CISCO_WAN_3G_MIB_modem",
         
         legendText: "Min RSSI: lowest 1-minute measurement<br/>" +
             "Avg RSSI: average measurement<br/>" +
             "Std. Dev.: standard deviation of measured values<br/>" +
             "Hours: measurement time"
     }
 });






