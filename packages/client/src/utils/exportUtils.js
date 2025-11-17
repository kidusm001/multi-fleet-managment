import * as XLSX from 'xlsx';

export const downloadExcel = (data, filename, options = {}) => {
  const workbook = XLSX.utils.book_new();
  
  if (options.groupByShift) {
    // Group data by shift
    const shiftGroups = data.reduce((acc, row) => {
      const shiftName = row['Shift Name'] || 'No Shift';
      if (!acc[shiftName]) acc[shiftName] = [];
      acc[shiftName].push(row);
      return acc;
    }, {});

    // Create worksheet for each shift
    Object.entries(shiftGroups).forEach(([shiftName, shiftData]) => {
      const worksheet = XLSX.utils.json_to_sheet(shiftData);
      styleWorksheet(worksheet, shiftData);
      XLSX.utils.book_append_sheet(workbook, worksheet, shiftName.substring(0, 31)); // Excel sheet name length limit
    });
  } else {
    // Single worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    styleWorksheet(worksheet, data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Routes");
  }

  XLSX.writeFile(workbook, filename);
};

const styleWorksheet = (worksheet, data) => {
  // Auto-size columns
  const maxWidths = {};
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      const value = row[key]?.toString() || '';
      maxWidths[key] = Math.max(maxWidths[key] || 0, value.length, key.length);
    });
  });

  worksheet['!cols'] = Object.keys(maxWidths).map(key => ({
    wch: Math.min(maxWidths[key] + 2, 50) // Cap width at 50 characters
  }));

  // Apply styles
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if (!worksheet[cell_ref]) continue;

      worksheet[cell_ref].s = {
        font: { name: "Arial" },
        alignment: { vertical: "center", horizontal: "left", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };

      if (R === 0) {
        worksheet[cell_ref].s.font.bold = true;
        worksheet[cell_ref].s.fill = { fgColor: { rgb: "EEEEEE" } };
      }
    }
  }
};
