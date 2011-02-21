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
    
    my $config = $self->plugin('json_config');

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
            foreach my $attr ('dsn', 'username', 'password', 'history_days')
            {
                my $key = $report . '.' . $attr;
                my $val = $self->siteconfig($key);
                if( not defined($val) )
                {
                    $self->log->error
                        ('Missing a mandatory report attribute: ' . $key);
                    $ok = 0;
                }
                else
                {
                    $report_params->{$attr} = $val;
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

    # RPC services
    
    my $services = {
        'Common' => new GertyReports::RPC::Common('enabled_reports' =>
                                                  $enabled_reports)            
    };

    while( my ($report, $attrs) = each%{$enabled_reports} )
    {
        my $module = 'GertyReports::RPC::' . $report;
        $self->log->debug('Loading report module: ' . $module);

        eval 'require ' . $module;
        if( $@ )
        {
            $self->log->error
                ('Failed to load ' . $module . ': ' . $@);
        }
        
        my $handle = eval 'new ' . $module . '(%{$attrs})';
        if( $@ )
        {
            $self->log->error
                ('Failed to initialize ' . $module . ': ' . $@);
        }
        else
        {
            $services->{$report} = $handle;
            $attrs->{'report_name'} = $handle->report_name();
            $attrs->{'report_description'} = $handle->report_description();
        }
    }
    
    my $r = $self->routes;

            
    $r->route('/' . $config->{'jsonrpcpath'})->to(
        class => 'Jsonrpc',
        method => 'dispatch',
        namespace => 'MojoX::Dispatcher::Qooxdoo',
        # our own properties
        services => $services,
        debug => 0,
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


        
        






1;
