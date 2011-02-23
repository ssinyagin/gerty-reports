package GertyReports::RPC::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => 'HDSL Line Errors';
has 'report_description' => '15-minute HDSL2/SHDSL line error statistics';

has 'main_table' => 'HDSL_XTUC_15MIN_COUNTERS';

has 'allow_rpc_access';



my %methods_allowed =
    ('search_host' => 1);

sub allow_rpc_access
{
    my $self = shift;
    my $method = shift;

    return $methods_allowed{$method};
}


    
1;
