import Papa from 'papaparse';

export const parseClipboardData = (text) => {
  // Split by newlines and tabs to handle Excel-style copied data
  const rows = text.split(/\r\n|\n/).filter(row => row.trim());
  const data = rows.map(row => row.split('\t'));

  // Try to identify headers from the first row
  const headers = data[0];
  const jsonData = data.slice(1).map(row => {
    const obj = {};
    row.forEach((cell, index) => {
      obj[headers[index]] = cell;
    });
    return obj;
  });

  return jsonData;
};

export const exportToCSV = (data, filename = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}; 