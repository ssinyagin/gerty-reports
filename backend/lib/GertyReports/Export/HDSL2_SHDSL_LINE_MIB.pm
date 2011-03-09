package GertyReports::Export::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base -base;

use Mojo::Log;
has log  => sub { Mojo::Log->new };

has 'backend';


sub get_line_timeseries
{
    my $self = shift;
    my $controller = shift;

    my $params = {};
    foreach my $p (qw(hostname intf dateFrom days))
    {
        my $val = $controller->param($p);
        if( not defined($val) )
        {
            $controller->render_exception('Undefined parameter: ' . $p);
            return undef;
        }
        $params->{$p} = $val;
    }

    my $ret = $self->backend->get_line_timeseries
        ($params->{'hostname'}, $params->{'intf'},
         $params->{'dateFrom'}, $params->{'days'});

    $ret->{'title'} = $params->{'hostname'};
    
    $self->log->debug('get_line_timeseries: retrieved ' .
                      scalar(@{$ret->{'data'}}) . ' rows');
    return $ret;
}



    
1;
