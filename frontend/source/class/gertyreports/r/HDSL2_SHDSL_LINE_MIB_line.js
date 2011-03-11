
qx.Class.define
("gertyreports.r.HDSL2_SHDSL_LINE_MIB_line",
 {
     extend : gertyreports.DisplayTimeSeries,

     members :
     {
         reportTitle: "DSL line statistics",
         exportUrlPath: "HDSL2_SHDSL_LINE_MIB/get_line_timeseries",
         rpcServiceName: "HDSL2_SHDSL_LINE_MIB",
         rpcTimeSeriesMethod: "get_line_timeseries"
     }
 });






