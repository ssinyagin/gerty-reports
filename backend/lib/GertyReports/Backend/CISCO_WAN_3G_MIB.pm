package GertyReports::Backend::CISCO_WAN_3G_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => '3G GSM Signal Statistics';
has 'report_description' => '1-minute RSSI statistics for Cisco 3G GSM modems';
has 'main_table' => 'C3G_GSM_RSSI_MINUTE_HISTORY';

has 'app';


# We assume that there's always one 3G cellular interface per device.
# If it's not so, some queries need to be modified


sub get_rssi_summary
{
    my $self = shift;
    my $hostname = shift;

    if( not $self->is_mysql() )
    {
        my $msg = 'Only MySQL is currently supported by get_rssi_summary()';
        $self->log->fatal($msg);
        die($msg);
    }
        
    $self->connect();

    my $max_date;
    
    {
        my $result = $self->dbh->selectrow_arrayref
            ('SELECT ' .
             ' DATE(MAX(MEASURE_TS)) ' .
             'FROM C3G_GSM_RSSI_MINUTE_HISTORY ' .
             'WHERE HOSTNAME=\'' . $hostname . '\'');
        if( defined($result->[0]) )
        {
            $max_date = $result->[0];
        }
    }

    
    my $ret = {};

    # column names
    $ret->{'labels'} = [
        'Date',
        'Min RSSI',
        'Avg RSSI',
        'Std. Dev',
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
             ' MAX(WEAKEST_RSSI) AS RSSI_MAX, ' .
             ' AVG(WEAKEST_RSSI) AS RSSI_AVG, ' .
             ' STDDEV_SAMP(WEAKEST_RSSI) AS RSSI_STDDEV, ' .
             ' COUNT(DISTINCT MEASURE_TS) AS INTVLS ' .
             'FROM C3G_GSM_RSSI_MINUTE_HISTORY ' .
             'WHERE HOSTNAME=\'' . $hostname . '\' AND ' .
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
                  $result->{'RSSI_MAX'},
                  sprintf('%.2f', $result->{'RSSI_AVG'}),
                  sprintf('%.2f', $result->{'RSSI_STDDEV'}),
                  sprintf('%.2f', $result->{'INTVLS'}/60),
                 ]);
        }
    }
    
    $self->disconnect();
    return $ret;
}


# Get Top N 3G modems by worst RSSI
# $topColumn is one of RSSI_MIN, RSSI_AVG, RSSI_STDDEV

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
        '', # empty port name
        'Min RSSI',
        'Avg RSSI',
        'Std. Dev.',
        'Hours'];

    $ret->{'data'} = [];

    # Find lowest RSSI or highest Stddev
    
    my $sth = $self->dbh->prepare
        ('SELECT ' .
         ' HOSTNAME, ' .
         ' MIN(WEAKEST_RSSI) AS RSSI_MIN, ' .
         ' AVG(WEAKEST_RSSI) AS RSSI_AVG, ' .
         ' STDDEV_SAMP(WEAKEST_RSSI) * (-1) AS RSSI_STDDEV, ' .
         ' COUNT(DISTINCT MEASURE_TS) AS INTVLS ' .
         'FROM C3G_GSM_RSSI_MINUTE_HISTORY ' .
         'WHERE ' . 
         ' MEASURE_TS >= \'' . $dateFrom . '\' AND ' .
         ' MEASURE_TS < DATE_ADD(\'' . $dateFrom . '\',' .
         '       INTERVAL ' . $days . ' DAY) ' .
         'GROUP BY HOSTNAME ' .
         'ORDER BY ' . $topColumn . ' ASC ' .
         'LIMIT ' . $topNum);
    
    
    $sth->execute();
    
    while( my $result = $sth->fetchrow_hashref )
    {
        if( defined($result->{'INTVLS'}) and $result->{'INTVLS'} > 0 )
        {
            push(@{$ret->{'data'}},
                 [
                  $result->{'HOSTNAME'},
                  '',
                  $result->{'RSSI_MIN'},
                  sprintf('%.2f', $result->{'RSSI_AVG'}),
                  sprintf('%.2f', $result->{'RSSI_STDDEV'} * (-1)),
                  sprintf('%.2f', $result->{'INTVLS'}/60),
                 ]);
        }
    }
    
    $self->disconnect();
    return $ret;
}
    


sub get_rssi_timeseries
{
    my $self = shift;
    my $hostname = shift;
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
        ['Date', 'RSSI'];

    $ret->{'data'} = [];
    
    my $sth = $self->dbh->prepare
        ('SELECT ' .
         ' UNIX_TIMESTAMP(MEASURE_TS) AS TS, ' .
         ' WEAKEST_RSSI ' .
         'FROM C3G_GSM_RSSI_MINUTE_HISTORY ' .
         'WHERE ' .
         ' HOSTNAME=\'' . $hostname . '\' AND ' .
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
