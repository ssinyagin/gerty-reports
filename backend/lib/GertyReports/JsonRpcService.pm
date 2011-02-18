package GertyReports::JsonRpcService;

use strict;
use base qw(Mojo::Base);


sub helloworld
{
    my $self = shift;
    return 'Hello World';
}

1;
