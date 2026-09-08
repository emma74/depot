import Button from './Button';
import { downloadCsv } from '../../utils/exportCsv';

// columns: [{ key, label, value?: (row) => cell }]
// rows: array of records to export
// summary: optional { label: value } map appended as totals at the end of the file
export default function DownloadButton({ filename, columns, rows, summary, label = 'Download report', ...props }) {
  const handleClick = () => downloadCsv(filename, columns, rows, summary);

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={!rows || rows.length === 0} {...props}>
      {label}
    </Button>
  );
}
