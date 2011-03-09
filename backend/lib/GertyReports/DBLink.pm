# RDBMS access interface

package GertyReports::DBLink;

use Mojo::Base -base;

use Mojo::Log;
use DBI;

has log  => sub { Mojo::Log->new };

has 'dsn';
has 'username';
has 'password';

has 'dbh';
has 'main_table';
has 'hostname_column' => 'HOSTNAME';

sub connect
{
    my $self = shift;

    if( not $self->dsn )
    {
        die('dsn attribute is missing');
    }
    
    if( not $self->username )
    {
        die('username attribute is missing');
    }
        
    if( not $self->password )
    {
        die('password attribute is missing');
    }
        
    my $dbi_args = {
        'AutoCommit' => 1,
        'RaiseError' => 0,
        'PrintError' => 1,
    };
    
    $self->log->debug('Connecting to database: ' . $self->dsn);
    
    my $dbh = DBI->connect( $self->dsn,
                            $self->username,
                            $self->password,
                            $dbi_args );
    
    if( not defined( $dbh ) )
    {
        die('DBLink failed to connect to the database "'.
            $self->dsn . '". Error message: ' . $DBI::errstr);
    }

    $self->dbh($dbh);
    
    return $dbh;
}


sub disconnect
{
    my $self = shift;
    if( defined($self->dbh) )
    {
        $self->dbh->disconnect();
    }
}


sub is_mysql
{
    my $self = shift;
    return ( $self->dsn =~ /mysql/o );
}


sub search_hosts
{
    my $self = shift;
    my $pattern = shift;
    my $limit = shift;
    
    $self->connect();

    my $sth = $self->dbh->prepare
        ('SELECT DISTINCT ' . $self->hostname_column . ' ' . 
         'FROM ' . $self->main_table . ' ' .
         'WHERE ' . $self->hostname_column . ' LIKE ?');

    $sth->execute( $pattern );

    my $ret = [];
    while( scalar(@{$ret}) < $limit and
           my $data = $sth->fetchrow_arrayref )
    {
        push(@{$ret}, $data->[0]);
    }

    $sth->finish();
    $self->disconnect();

    return $ret;
}

1;
