package GertyReports::Backend::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => 'HDSL Line Errors';
has 'report_description' => '15-minute HDSL2/SHDSL line error statistics';
has 'main_table' => 'HDSL_XTUC_15MIN_COUNTERS';

has 'app';



sub search_hosts_and_lines
{
    my $self = shift;
    my $pattern = shift;
    my $limit = shift;
    
    $self->connect();

    my $sth = $self->dbh->prepare
        ('SELECT DISTINCT HOSTNAME, INTF_NAME ' .
         'FROM HDSL_XTUC_15MIN_COUNTERS ' .
         'WHERE ' .
         'HOSTNAME LIKE ? ' .
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

    return $ret;
}


    

sub get_host_ports
{
    my $self = shift;
    my $hostname = shift;

    $self->connect();

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
    return $ret;
}



sub get_line_summary
{
    my $self = shift;
    my $hostname = shift;
    my $intf = shift;

    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_line_summary()';
        $self->log->fatal($msg);
        die($msg);
    }
        
    $self->connect();

    my $max_date;
    
    {
        my $result = $self->dbh->selectrow_arrayref
            ('SELECT ' .
             ' DATE(MAX(MEASURE_TS)) ' .
             'FROM HDSL_XTUC_15MIN_COUNTERS ' .
             'WHERE HOSTNAME=\'' . $hostname . '\' AND ' .
             'INTF_NAME=\'' . $intf . '\'');
        if( defined($result->[0]) )
        {
            $max_date = $result->[0];
        }
    }
        
    my $ret = {};

    # column names
    $ret->{'labels'} = [
        'Date',
        'CRC Err',
        'ES',
        'SES',
        'LOSWS',
        'UAS',
        'Hours'];

    $ret->{'data'} = [];

    if( not defined($max_date) )
    {
        return $ret;
    }
        
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
             '  DATE_SUB(\'' . $max_date . '\',' .
             '           INTERVAL ' . $day . ' DAY) ' .
             'AND ' .
             'MEASURE_TS < ' .
             '  DATE_SUB(\'' . $max_date . '\',' .
             '           INTERVAL ' . ($day-1) . ' DAY) ');
        
        if( defined($result->{'INTVLS'}) and $result->{'INTVLS'} > 0 )
        {
            push(@{$ret->{'data'}},
                 [
                  $result->{'DT'},
                  $result->{'CRCA'},
                  $result->{'ES'},
                  $result->{'SES'},
                  $result->{'LOSWS'},
                  $result->{'UAS'},
                  $result->{'INTVLS'}/4,
                 ]);
        }
    }
    
    $self->disconnect();
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
    
    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_topn()';
        $self->log->fatal($msg);
        die($msg);
    }
        
    $self->connect();

    my $ret = {};
    
    # column names
    $ret->{'labels'} = [
        'Device',
        'Port',
        'CRC Err',
        'ES',
        'SES',
        'LOSWS',
        'UAS',
        'Hours'];

    $ret->{'data'} = [];

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
    
    while( my $result = $sth->fetchrow_hashref )
    {
        if( defined($result->{'INTVLS'}) and $result->{'INTVLS'} > 0 )
        {
            push(@{$ret->{'data'}},
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
        }
    }
    
    $self->disconnect();
    return $ret;
}
    


sub get_line_timeseries
{
    my $self = shift;
    my $hostname = shift;
    my $intf = shift;
    my $dateFrom = shift;
    my $days = shift;
    
    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_line_timeseries()';
        $self->log->fatal($msg);
        die($msg);
    }

    $self->connect();

    my $ret = {};
    
    # column names
    $ret->{'labels'} =
        ['Date', 'CRC Err', 'ES', 'SES', 'LOSWS', 'UAS'];

    $ret->{'data'} = [];
    
    my $sth = $self->dbh->prepare
        ('SELECT ' .
         ' UNIX_TIMESTAMP(MEASURE_TS) AS TS, ' .
         ' CRCA_COUNT, ' .
         ' ES_COUNT, ' .
         ' SES_COUNT, ' .
         ' LOSWS_COUNT, ' .
         ' UAS_COUNT ' .
         'FROM HDSL_XTUC_15MIN_COUNTERS ' .
         'WHERE ' .
         ' HOSTNAME=\'' . $hostname . '\' AND ' .
         ' INTF_NAME=\'' . $intf . '\' AND ' .
         ' MEASURE_TS >= \'' . $dateFrom . '\' AND ' .
         ' MEASURE_TS < DATE_ADD(\'' . $dateFrom . '\',' .
         '       INTERVAL ' . $days . ' DAY) ' .
         'ORDER BY TS');

    $sth->execute();

    while( (my @row = $sth->fetchrow_array()) )
    {
        # convert from strings to numbers
        my @numbers = map {int($_)} @row;
        push(@{$ret->{'data'}}, [@numbers]);
    }

    $self->disconnect();
    return $ret;
}



    
1;
