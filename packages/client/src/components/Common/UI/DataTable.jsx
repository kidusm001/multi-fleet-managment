import PropTypes from 'prop-types';
import { validatePhoneNumber, validateEmployeeUploadData } from "@/utils/validators";
import { Badge } from "./Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./Table";

export function DataTable({ data, headers }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header.key}>{header.label}</TableHead>
            ))}
            <TableHead>Validation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => {
            const { isValid, errors } = validateEmployeeUploadData(row);
            
            return (
              <TableRow key={idx}>
                {headers.map((header) => (
                  <TableCell 
                    key={header.key}
                    className={
                      header.key === 'contact' && !validatePhoneNumber(row[header.key])
                        ? 'text-red-500'
                        : ''
                    }
                  >
                    {row[header.key]}
                  </TableCell>
                ))}
                <TableCell>
                  {isValid ? (
                    <Badge variant="success">Valid</Badge>
                  ) : (
                    <div className="text-xs text-red-500">
                      {errors.join(', ')}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

DataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};
