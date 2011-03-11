
qx.Class.define
("gertyreports.r.HDSL2_SHDSL_LINE_MIB",
 {
     extend : gertyreports.NavigateDevices,

     members :
     {
         rpcServiceName: "HDSL2_SHDSL_LINE_MIB",
         rpcSearchDevicesMethod: "search_hosts_and_lines",
         rpcSummaryMethod: "get_line_summary",
         topNSortBy: [
             {label: "CRC Errors", data: "CRCA"}, 
             {label: "Errored Seconds", data: "ES"},
             {label: "Severely Errored Seconds", data: "SES"},
             {label: "Loss of Sync Word Seconds", data: "LOSWS"},
             {label: "Unavailable Seconds", data: "UAS"}
         ],
         rpcTopNMethod: "get_topn",
         
         timeSeriesReportClass: "gertyreports.r.HDSL2_SHDSL_LINE_MIB_line",
         
         legendText: "CRC Errors: maximum count per 15-minute interval<br/>" +
             "ES, SES, LOSWS, UAS: maximum seconds per " +
             "15-minute interval<br/>" +
             "Hours: measurement time"
     }
 });






