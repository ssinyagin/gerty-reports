package GertyReports::RPC::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => 'HDSL Line Errors';
has 'report_description' => '15-minute HDSL2/SHDSL line error statistics';

has 'main_table' => 'HDSL_XTUC_15MIN_COUNTERS';


my %methods_allowed =
    (
     'search_host' => 1,
     'get_host_ports' => 1,
     'get_line_summary' => 1,
     
    );

sub allow_rpc_access
{
    my $self = shift;
    my $method = shift;

    return $methods_allowed{$method};
}



sub get_host_ports
{
    my $self = shift;
    my $hostname = shift;

    $self->log->debug('RPC call: get_host_ports, ' . $hostname);
    
    if( not $self->connect() )
    {
        return undef;
    }

    my $sth = $self->dbh->prepare
        ('SELECT DISTINCT INTF_NAME ' .
         'FROM HDSL_XTUC_15MIN_COUNTERS ' .
         'WHERE HOSTNAME=?');

    $sth->execute( $hostname );

    my $ret = [];
    while( my $data = $sth->fetchrow_arrayref )
    {
        push(@{$ret}, $data->[0]);
    }

    $self->disconnect();

    $self->log->debug('RPC result: ' . scalar(@{$ret}) . ' items');
    return $ret;
}



sub get_line_summary
{
    my $self = shift;
    my $hostname = shift;
    my $intf = shift;

    $self->log->debug('RPC call: get_line_summary, ' . $hostname);

    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_line_summary()';
        $self->log->fatal($msg);
        die($msg);
    }
        
    if( not $self->connect() )
    {
        return undef;
    }

    my $ret = [];

    # column names
    push(@{$ret},
         [
          'Date',
          'CRC Err',
          'ES',
          'SES',
          'LOSWS',
          'UAS'
         ]);

    # daily error counters for last 14 days

    foreach my $day (0..14)
    {
        my $result = $self->dbh->selectrow_hashref
            ('SELECT ' .
             ' DATE(MIN(MEASURE_TS)) AS DT, ' .
             ' SUM(ES_COUNT) AS ES, ' .
             ' SUM(SES_COUNT) AS SES, ' .
             ' SUM(CRCA_COUNT) AS CRCA, ' .
             ' SUM(LOSWS_COUNT) AS LOSWS, ' .
             ' SUM(UAS_COUNT) AS UAS, ' .
             ' TIME_TO_SEC(TIMEDIFF(MAX(MEASURE_TS), ' .
             '   MIN(MEASURE_TS))) AS SECS ' .
             'FROM HDSL_XTUC_15MIN_COUNTERS ' .
             'WHERE HOSTNAME=\'' . $hostname . '\' AND ' .
             'INTF_NAME=\'' . $intf . '\' AND ' .
             'MEASURE_TS >= ' .
             '  DATE_SUB(CURRENT_DATE(), INTERVAL ' . $day . ' DAY) ' .
             'AND ' .
             'MEASURE_TS < ' .
             '  DATE_SUB(CURRENT_DATE(), INTERVAL ' . ($day-1) . ' DAY) ');

        if( defined($result->{'SECS'}) and $result->{'SECS'} > 0 )
        {
            push(@{$ret},
                 [
                  $result->{'DT'},
                  ($result->{'CRCA'} * 60 / $result->{'SECS'}),
                  ($result->{'ES'} * 100 / $result->{'SECS'}),
                  ($result->{'SES'} * 100 / $result->{'SECS'}),
                  ($result->{'LOSWS'} * 100 / $result->{'SECS'}),
                  ($result->{'UAS'} * 100 / $result->{'SECS'})
                 ]);
        }
    }

    $self->disconnect();

    return $ret;
}


    
1;
