package GertyReports;

use strict;
use Mojo::Base 'Mojolicious';
use Mojo::JSON;
use IO::File;

use GertyReports::RPC::Common;

# This method will run once at server start
sub startup
{
    my $self = shift;
    
    my $config = $self->plugin('JSONConfig');

    # Initialize the reports from siteconfig
    my $known_reports = $self->siteconfig('reports');
    my $enabled_reports = {};
    
    foreach my $report (@{$known_reports})
    {
        if( $self->siteconfig($report . '.enabled') )
        {
            $self->log->debug('Report enabled in siteconfig: ' . $report);

            my $ok = 1;
            my $report_params = {};
            
            my $dbkey = $report . '.db';
            my $dbattr = $self->siteconfig($dbkey);
            if( not defined($dbattr) )
            {
                $self->log->error
                    ('Missing a mandatory report attribute: ' . $dbkey);
                $ok = 0;
            }
            else
            {
                foreach my $attr ('dsn', 'username', 'password')
                {
                    if( not defined($dbattr->{$attr}) )
                    {
                        $self->log->error
                            ('Missing a mandatory configuration attribute: ' .
                             $dbkey . '.' . $attr);
                        $ok = 0;
                    }
                    else
                    {
                        $report_params->{$attr} = $dbattr->{$attr};
                    }
                }
            }

            if($ok)
            {
                $enabled_reports->{$report} = $report_params;
            }
            else
            {
                $self->log->error
                    ('Failed to initialize report: ' . $report);
            }
        }
    }

    
    # RPC and Export services
    
    my $rpcsrv = {};
    my $expsrv = {};
    my $report_list = {};
    
    # Load report handlers
    
    while( my ($report, $attrs) = each%{$enabled_reports} )
    {
        my $backend = $self->load_module
            ('GertyReports::Backend::' . $report, %{$attrs}, app => $self);

        next unless defined($backend);

        my $rpc_handle = $self->load_module
            ('GertyReports::RPC::' . $report, 'backend' => $backend);
        next unless defined($rpc_handle);

        my $exp_handle = $self->load_module
            ('GertyReports::Export::' . $report, 'backend' => $backend);
        next unless defined($exp_handle);

        $rpcsrv->{$report} = $rpc_handle;
        $expsrv->{$report} = $exp_handle;
        $report_list->{$report} = {
            'report_name' => $backend->report_name(),
            'report_description' => $backend->report_description(),
        };
    }

    # Common service which lists the available reports
    
    $rpcsrv->{'Common'} = new GertyReports::RPC::Common
        ('enabled_reports' => $report_list);
    

    # new binary type
    $self->types->type(excel => 'application/vnd.ms-excel');

    # HTTP dispatch routing
    my $r = $self->routes;
            
    $r->route('/' . $config->{'jsonrpcpath'})->to(
        class => 'Jsonrpc',
        method => 'dispatch',
        namespace => 'MojoX::Dispatcher::Qooxdoo',
        services => $rpcsrv,
        debug => 0,
        );

    $r->route('/' . $config->{'exportpath'} . '/xls/:report/:call')->to(
        class => 'ExportExcel',
        method => 'dispatch',
        namespace => 'GertyReports',
        report_handlers => $expsrv,
        );
}


sub siteconfig
{
    my $self = shift;
    my $key = shift;

    if( not defined($self->{'GertyReports.siteconfig'}) )
    {
        my $file = $self->defaults('config')->{'backendsitecfg'};

        $self->log->debug('Reading site configuration from ' . $file);
        # Slurp UTF-8 file
        my $fh = new IO::File($file);
        $fh or die("Could not open config file \"$file\": $!");
        my $encoded = do { local $/; <$fh> };
        $fh->close();

        my $json = new Mojo::JSON;
        my $siteconfig = $json->decode($encoded);
        if( not defined($siteconfig) )
        {
            die('Cannot parse JSON file ' . $file . ': ' . $json->error);
        }

        $self->{'GertyReports.siteconfig'} = $siteconfig;
    }
    
    return $self->{'GertyReports.siteconfig'}{$key};
}


sub secret
{
    my $self = shift;
    my $ret = $self->siteconfig('Mojolicious.secret');
    $ret = 'iecho4Gaetiecem' unless defined($ret);
    return $ret;
}


sub load_module
{
    my $self = shift;
    my $module = shift;
    my @args = @_;

    $self->log->debug('Loading report module: ' . $module);
            
    eval 'require ' . $module;
    if( $@ )
    {
        $self->log->error('Failed to load ' . $module . ': ' . $@);
        return undef;
    }
    
    my $handle = eval 'new ' . $module . '(@args)';
    if( $@ )
    {
        $self->log->error('Failed to initialize ' . $module . ': ' . $@);
        return undef;
    }
    
    if( not defined($handle) )
    { 
        $self->log->error($module . '->new() returned undef');
        return undef;
    }
    
    return $handle;
}


        
    
    


        






1;
