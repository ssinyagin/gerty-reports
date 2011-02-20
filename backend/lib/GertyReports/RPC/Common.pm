package GertyReports::RPC::Common;

use strict;
use base qw(Mojo::Base);


# if this attribute is created it will hold the mojo cookie session hash
__PACKAGE__->attr('_mojo_session');
# if this attribute exists it will provide access to the stash
__PACKAGE__->attr('_mojo_stash');
# optional access_check method the method is called right before the actual
# method is called but after the _mojo_session and _mojo_stash properties
# are assigned


my %_methods_allowed =
    ('listreports' => 1);

sub _check_access
{
    my $self = shift;
    my $method = shift;

    return $_methods_allowed{$method};
}



sub listreports
{
    my $self = shift;
    return ['X1', 'X2'];
}


1;
