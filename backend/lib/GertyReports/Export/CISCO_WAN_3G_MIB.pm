package GertyReports::Export::CISCO_WAN_3G_MIB;

use Mojo::Base -base;

use Mojo::Log;
has log  => sub { Mojo::Log->new };

has 'backend';


sub get_rssi_timeseries
{
    my $self = shift;
    my $controller = shift;

    my $params = {};
    foreach my $p (qw(hostname dateFrom days))
    {
        my $val = $controller->param($p);
        if( not defined($val) )
        {
            $controller->render_exception('Undefined parameter: ' . $p);
            return undef;
        }
        $params->{$p} = $val;
    }

    my $ret = $self->backend->get_rssi_timeseries
        ($params->{'hostname'}, $params->{'dateFrom'}, $params->{'days'});
    
    $ret->{'title'} = $params->{'hostname'};
    
    $self->log->debug('get_rssi_timeseries: retrieved ' .
                      scalar(@{$ret->{'data'}}) . ' rows');
    return $ret;
}



    
1;
