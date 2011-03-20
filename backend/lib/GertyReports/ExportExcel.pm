# Excel export controller

package GertyReports::ExportExcel;

use Mojo::Base 'Mojolicious::Controller';
use Spreadsheet::WriteExcel;
use Date::Manip ();
use IO::Scalar;

use YAML;

sub dispatch
{
    my $self = shift;

    my $handlers = $self->stash('report_handlers');
    if( not defined($handlers) )
    {
        $self->render_exception('report_handlers undefined');
        return;
    }
    
    my $report = $self->stash('report');
    if( not defined( $handlers->{$report} ) )
    {
        $self->render_exception('Report name unknown: ' . $report);
        return;
    }

    my $handle = $handlers->{$report};
    my $method = $self->stash('call');

    if( not $handle->can($method) )
    {
        $self->render_exception
            ('Unknown call for ' . $report . ': ' . $method );
        return;
    }

    my $result = $handle->$method($self);
    if( not defined($result) )
    {
        return;
    }

    my $xls;    
    my $fh = new IO::Scalar(\$xls);
    
    my $workbook = Spreadsheet::WriteExcel->new($fh);
    my $worksheet = $workbook->add_worksheet($result->{'title'});

    my $c_tblheader = $workbook->set_custom_color(40, '#003366');
    
    my $f_tblheader = $workbook->add_format
        ( bold => 1,
          bottom => 1,
          align => 'center',
          bg_color => $c_tblheader,
          color => 'white' ); 
    
    my $f_column = $workbook->add_format();    
    my $f_date = $workbook->add_format(num_format => 'yyyy-mm-dd hh:mm');

    my $col = 0;
    my $row = 0;

    foreach my $label (@{$result->{'labels'}})
    {
        $worksheet->set_column($col, $col, 25, $f_column);
        $worksheet->write_string($row, $col++, $label, $f_tblheader);
    }

    foreach my $datarow (@{$result->{'data'}})
    {
        $col = 0;
        $row++;

        for( $col=0; $col < scalar(@{$datarow}); $col++)
        {
            my $value = $datarow->[$col];
            my $type = '';
            if( defined($result->{'coltypes'}) and
                defined($result->{'coltypes'}[$col]) )
            {
                $type = $result->{'coltypes'}[$col];
            }

            if( $type eq 'number' )
            {
                $worksheet->write_number($row, $col, $value);
            }
            elsif( $type eq 'string' )
            {
                $worksheet->write_string($row, $col, $value);
            }
            elsif( $type eq 'unixtime' )
            {
                $worksheet->write_date_time
                    ($row, $col,
                     Date::Manip::UnixDate('epoch ' . $value, '%O'),
                     $f_date);
            }
            elsif( $type eq 'date_time' )
            {
                $worksheet->write_date_time($row, $col, $value, $f_date);
            }
            else
            {
                $worksheet->write($row, $col, $value);
            }
        }
    }
    
    $workbook->close();
    
    $self->render(format => 'excel', data => $xls);
}




1;
