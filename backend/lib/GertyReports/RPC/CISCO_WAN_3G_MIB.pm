package GertyReports::RPC::CISCO_WAN_3G_MIB;

use Mojo::Base -base;

use Mojo::Log;
has log  => sub { Mojo::Log->new };

has 'backend';



my %methods_allowed =
    (
     'search_hosts' => 1,
     'get_rssi_summary' => 1,
     'get_topn' => 1,
     'get_rssi_timeseries' => 1,
    );

sub allow_rpc_access
{
    my $self = shift;
    my $method = shift;

    return $methods_allowed{$method};
}



sub search_hosts
{
    my $self = shift;
    my $pattern = shift;
    my $limit = shift;

    $pattern = '%' unless defined($pattern);
    $limit = 50 unless defined($limit);
    
    $self->log->debug('RPC call: search_hosts, ' .
                      $pattern . ', ' . $limit);
    
    my $ret = $self->backend->search_hosts($pattern, $limit);
    
    $self->log->debug('RPC result: ' . scalar(@{$ret}) . ' items');
    return $ret;
}




sub get_rssi_summary
{
    my $self = shift;
    my $hostname = shift;

    $self->log->debug('RPC call: get_rssi_summary, ' . $hostname);
    
    my $ret = $self->backend->get_rssi_summary($hostname);
    
    $self->log->debug('Retrieved RSSI statistics for ' .
                      scalar(@{$ret->{'data'}}) . ' days');
    
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
    
    $self->log->debug('RPC call: get_topn, ' .
                      join(', ', $topNum, $dateFrom, $days, $topColumn));

    my $ret = $self->backend->get_topn($topNum, $dateFrom, $days, $topColumn);

    $self->log->debug('Retrieved RSSI statistics for ' .
                      scalar(@{$ret->{'data'}}) . ' ports');
    return $ret;
}
    

# retrieve detailed statistics for plotting

sub get_rssi_timeseries
{
    my $self = shift;
    my $hostname = shift;
    my $intf = shift;
    my $dateFrom = shift;
    my $days = shift;
    
    $self->log->debug
        ('RPC call: get_rssi_timeseries, ' .
         $hostname . ', ' . $dateFrom . ', ' . $days);

    my $ret = $self->backend->get_rssi_timeseries
        ($hostname, $dateFrom, $days);
    
    $self->log->debug('Retrieved ' . scalar(@{$ret->{'data'}}) . ' rows');
    
    return $ret;
}



    
1;
