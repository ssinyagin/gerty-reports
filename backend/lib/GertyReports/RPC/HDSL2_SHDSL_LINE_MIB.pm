package GertyReports::RPC::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base -base;

use Mojo::Log;
has log  => sub { Mojo::Log->new };

has 'backend';



my %methods_allowed =
    (
     'search_hosts_and_lines' => 1,
     'get_line_summary' => 1,
     'get_topn' => 1,
     'get_line_timeseries' => 1,
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

    $pattern = '%' unless defined($pattern);
    $limit = 50 unless defined($limit);
    
    $self->log->debug('RPC call: search_hosts_and_lines, ' .
                      $pattern . ', ' . $limit);
    
    my $ret = $self->backend->search_hosts_and_lines($pattern, $limit);
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
    
    my $ret = $self->backend->get_line_summary($hostname, $intf);
    
    $self->log->debug('Retrieved line statistics for ' .
                      scalar(@{$ret->{'data'}}) . ' days');
    
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

    my $ret = $self->backend->get_topn($topNum, $dateFrom, $days, $topColumn);

    $self->log->debug('Retrieved line statistics for ' .
                      scalar(@{$ret->{'data'}}) . ' ports');
    return $ret;
}
    

# retrieve detailed statistics for plotting

sub get_line_timeseries
{
    my $self = shift;
    my $hostname = shift;
    my $intf = shift;
    my $dateFrom = shift;
    my $days = shift;
    
    $self->log->debug
        ('RPC call: get_line_timeseries, ' .
         $hostname . ', ' . $intf . ', ' . $dateFrom . ', ' . $days);

    my $ret = $self->backend->get_line_timeseries
        ($hostname, $intf, $dateFrom, $days);
    
    $self->log->debug('Retrieved ' . scalar(@{$ret->{'data'}}) . ' rows');
    
    return $ret;
}



    
1;
