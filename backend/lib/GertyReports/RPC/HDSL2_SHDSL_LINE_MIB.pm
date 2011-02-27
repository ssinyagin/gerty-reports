package GertyReports::RPC::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => 'HDSL Line Errors';
has 'report_description' => '15-minute HDSL2/SHDSL line error statistics';

has 'main_table' => 'HDSL_XTUC_15MIN_COUNTERS';

# use YAML;

my %methods_allowed =
    (
     'search_hosts' => 1,
     'search_hosts_and_lines' => 1,
     'get_host_ports' => 1,
     'get_line_summary' => 1,
     'get_topn' => 1,
    );

sub allow_rpc_access
{
    my $self = shift;
    my $method = shift;

    return $methods_allowed{$method};
}



sub search_hosts_and_lines
{
    my $self = shift;
    my $pattern = shift;
    my $limit = shift;

    $limit = 50 unless defined($limit);
    
    $self->log->debug('RPC call: search_hosts_and_lines, ' .
                      $pattern . ', ' . $limit);
    
    if( not $self->connect() )
    {
        return undef;
    }

    my $sth = $self->dbh->prepare
        ('SELECT DISTINCT HOSTNAME, INTF_NAME ' .
         'FROM HDSL_XTUC_15MIN_COUNTERS ' .
         'WHERE HOSTNAME LIKE ? ' .
         ' ORDER BY HOSTNAME, INTF_NAME');
    
    $sth->execute( $pattern );

    my $ret = [];
    while( scalar(@{$ret}) < $limit and
           my $data = $sth->fetchrow_arrayref )
    {
        my($hostname, $intf) = @{$data};
        
        push(@{$ret},
             {
                 'label' => $hostname . ': ' . $intf,
                 'hostname' => $hostname,
                 'interface' => $intf,
             });
    }

    $sth->finish();
    $self->disconnect();

    $self->log->debug('RPC result: ' . scalar(@{$ret}) . ' items');
    return $ret;
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

    $self->log->debug('RPC call: get_line_summary, ' .
                      $hostname . ', ' . $intf);

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
          'UAS',
          'Hours',
         ]);

    # daily error counters for last 14 days
    my $days_available = 0;
    
    foreach my $day (0..14)
    {
        my $result = $self->dbh->selectrow_hashref
            ('SELECT ' .
             ' DATE(MIN(MEASURE_TS)) AS DT, ' .
             ' MAX(ES_COUNT) AS ES, ' .
             ' MAX(SES_COUNT) AS SES, ' .
             ' MAX(CRCA_COUNT) AS CRCA, ' .
             ' MAX(LOSWS_COUNT) AS LOSWS, ' .
             ' MAX(UAS_COUNT) AS UAS, ' .
             ' COUNT(DISTINCT MEASURE_TS) AS INTVLS ' .
             'FROM HDSL_XTUC_15MIN_COUNTERS ' .
             'WHERE HOSTNAME=\'' . $hostname . '\' AND ' .
             'INTF_NAME=\'' . $intf . '\' AND ' .
             'MEASURE_TS >= ' .
             '  DATE_SUB(CURRENT_DATE(), INTERVAL ' . $day . ' DAY) ' .
             'AND ' .
             'MEASURE_TS < ' .
             '  DATE_SUB(CURRENT_DATE(), INTERVAL ' . ($day-1) . ' DAY) ');

        if( defined($result->{'INTVLS'}) and $result->{'INTVLS'} > 0 )
        {
            push(@{$ret},
                 [
                  $result->{'DT'},
                  $result->{'CRCA'},
                  $result->{'ES'},
                  $result->{'SES'},
                  $result->{'LOSWS'},
                  $result->{'UAS'},
                  $result->{'INTVLS'}/4,
                 ]);
            $days_available++;
        }
    }

    $self->disconnect();

    $self->log->debug('Retrieved line statistics for ' .
                      $days_available . ' days');

    return $ret;
}


# Get Top N DSL lines by error counter

sub get_topn
{
    my $self = shift;
    my $topNum = shift;
    my $dateFrom = shift;
    my $days = shift;
    my $topColumn = shift;
    
    $self->log->debug('RPC call: get_topn, ' .
                      join(', ', $topNum, $dateFrom, $days, $topColumn));
    
    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_topn()';
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
          'Device',
          'Port',
          'CRC Err',
          'ES',
          'SES',
          'LOSWS',
          'UAS',
          'Hours',
         ]);

    # convert CRCA_COUNT => CRCA
    $topColumn =~ s/_COUNT$//;
    
    my $sth = $self->dbh->prepare
        ('SELECT ' .
         ' HOSTNAME, ' .
         ' INTF_NAME, ' .
         ' MAX(ES_COUNT) AS ES, ' .
         ' MAX(SES_COUNT) AS SES, ' .
         ' MAX(CRCA_COUNT) AS CRCA, ' .
         ' MAX(LOSWS_COUNT) AS LOSWS, ' .
         ' MAX(UAS_COUNT) AS UAS, ' .
         ' COUNT(DISTINCT MEASURE_TS) AS INTVLS ' .
         'FROM HDSL_XTUC_15MIN_COUNTERS ' .
         'WHERE ' . 
         ' MEASURE_TS >= \'' . $dateFrom . '\' AND ' .
         ' MEASURE_TS < DATE_ADD(\'' . $dateFrom . '\',' .
         '       INTERVAL ' . $days . ' DAY) ' .
         'GROUP BY HOSTNAME, INTF_NAME ' .
         'ORDER BY ' . $topColumn . ' DESC ' .
         'LIMIT ' . $topNum);
    
    
    $sth->execute();
    
    my $ports_available = 0;
    
    while( my $result = $sth->fetchrow_hashref )
    {
        if( defined($result->{'INTVLS'}) and $result->{'INTVLS'} > 0 )
        {
            push(@{$ret},
                 [
                  $result->{'HOSTNAME'},
                  $result->{'INTF_NAME'},
                  $result->{'CRCA'},
                  $result->{'ES'},
                  $result->{'SES'},
                  $result->{'LOSWS'},
                  $result->{'UAS'},
                  $result->{'INTVLS'}/4,
                 ]);
            $ports_available++;
        }
    }

    $self->disconnect();

    $self->log->debug('Retrieved line statistics for ' .
                      $ports_available . ' ports');

    # print STDERR YAML::Dump($ret);
    
    return $ret;
}
    


    
1;
