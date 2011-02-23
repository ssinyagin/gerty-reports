package GertyReports::RPC::Common;

use Mojo::Base -base;

has 'enabled_reports';

has 'allow_rpc_access';


my %methods_allowed =
    ('listreports' => 1);

sub allow_rpc_access
{
    my $self = shift;
    my $method = shift;

    return $methods_allowed{$method};
}



sub listreports
{
    my $self = shift;

    my $ret = [];

    my $reps = $self->enabled_reports;
    
    foreach my $report (sort keys %{$reps})
    {
        my $r = {'class' => $report,
                 'name' => $reps->{$report}{'report_name'},
                 'description' => $reps->{$report}{'report_description'}};
        push(@{$ret}, $r);
    }
    
    return $ret;    
}


1;
