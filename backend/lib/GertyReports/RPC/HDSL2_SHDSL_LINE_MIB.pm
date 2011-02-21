package GertyReports::RPC::HDSL2_SHDSL_LINE_MIB;

use Mojo::Base 'GertyReports::DBLink';


has 'report_name' => 'HDSL Line Errors';
has 'report_description' => '15-minute HDSL2/SHDSL line error statistics';

has 'main_table' => 'HDSL_XTUC_15MIN_COUNTERS';

has '_check_access';



my %_methods_allowed =
    ('search_host' => 1);

sub _check_access
{
    my $self = shift;
    my $method = shift;

    return $_methods_allowed{$method};
}


    
1;
