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
    
    my $r = $self->routes;

    my $services = {
        'Common' => new GertyReports::RPC::Common(app => $self),
    };
            
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
