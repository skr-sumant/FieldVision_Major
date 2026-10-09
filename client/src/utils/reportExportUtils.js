import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Format currency in Indian Rupees
 */
function formatINR(val) {
  return 'INR ' + Number(val || 0).toLocaleString('en-IN');
}

/**
 * Get current date string in YYYY-MM-DD format
 */
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Export Executive Summary & Field Analytics to PDF
 */
export function exportExecutivePdf({
  companyName = 'Bharat Enterprise FMCG Pvt Ltd',
  visits = [],
  managers = [],
  salesReps = [],
  zones = [],
  periodLabel = 'All Time'
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const dateStr = getDateString();

  // Calculated Metrics
  const totalVisits = visits.length;
  const verifiedVisits = visits.filter(v => v.status === 'Verified').length;
  const flaggedVisits = visits.filter(v => v.status === 'Flagged Anomalous').length;
  const pendingVisits = visits.filter(v => v.status === 'Pending Review' || (!v.status && v.orderTotal)).length;
  const totalRevenue = visits.reduce((acc, v) => acc + (parseFloat(v.orderTotal) || 0), 0);
  const accuracyRate = totalVisits > 0 ? Math.round((verifiedVisits / totalVisits) * 100) : 100;

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a (Dark Slate)
  doc.rect(0, 0, 595.28, 90, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FIELDVISION ENTERPRISE', 40, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text(`Executive Field Telemetry & Performance Report | Period: ${periodLabel}`, 40, 60);
  doc.text(`Organization: ${companyName} | Generated: ${new Date().toLocaleString()}`, 40, 75);

  let currentY = 110;

  // Section 1: Executive KPI Metrics Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive KPI Summary', 40, currentY);
  currentY += 12;

  const kpiData = [
    ['Total Field Revenue', formatINR(totalRevenue), 'Total Completed Visits', totalVisits.toString()],
    ['Verified Visits', `${verifiedVisits} (${accuracyRate}%)`, 'GPS Verification Accuracy', `${accuracyRate}%`],
    ['Flagged Anomalies', flaggedVisits.toString(), 'Pending Verification', pendingVisits.toString()],
    ['Active Regional Managers', managers.length.toString(), 'Field Representatives', salesReps.length.toString()]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, font: 'helvetica' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    body: kpiData,
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], width: 140 },
      1: { fontStyle: 'bold', textColor: [16, 185, 129] },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], width: 140 },
      3: { fontStyle: 'bold' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 25;

  // Section 2: Regional Commercial Zones & Managers
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Regional Commercial Zones & Jurisdiction', 40, currentY);
  currentY += 12;

  const managerRows = managers.map(m => {
    const repsUnder = salesReps.filter(r => r.managerId === m.id).length;
    const visitsUnder = visits.filter(v => v.managerId === m.id).length;
    return [
      m.name,
      m.zone || 'All India',
      m.state || 'Headquarters',
      m.phone || 'N/A',
      repsUnder.toString(),
      visitsUnder.toString(),
      m.status || 'Active'
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 5 },
    head: [['Regional Manager', 'Commercial Zone', 'Primary State', 'Contact Phone', 'Reps', 'Visits', 'Status']],
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    body: managerRows.length ? managerRows : [['No managers registered', '-', '-', '-', '0', '0', '-']]
  });

  currentY = doc.lastAutoTable.finalY + 25;

  // Section 3: Recent Field Telemetry & Visits Log
  if (currentY > 650) {
    doc.addPage();
    currentY = 40;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Field Visits & Order Telemetry Log (Top 30 Records)', 40, currentY);
  currentY += 12;

  const visitRows = visits.slice(0, 30).map(v => [
    v.timestamp ? new Date(v.timestamp).toLocaleDateString() : 'Today',
    v.repName || 'Field Agent',
    v.shopName || v.customerName || 'Retail Outlet',
    formatINR(v.orderTotal || 0),
    v.gpsAutoVerified ? 'GPS Verified' : 'Manual',
    v.status || 'Pending'
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 4 },
    head: [['Date', 'Sales Representative', 'Shop / Retail Outlet', 'Order Value', 'GPS Status', 'Verification Status']],
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    body: visitRows.length ? visitRows : [['No visits logged', '-', '-', 'INR 0', '-', '-']],
    columnStyles: {
      3: { fontStyle: 'bold', textColor: [16, 185, 129] }
    }
  });

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FieldVision Enterprise Field Telemetry | Page ${i} of ${pageCount} | Confidential`,
      40,
      820
    );
  }

  doc.save(`FieldVision_Executive_Report_${dateStr}.pdf`);
}

/**
 * Export Comprehensive Enterprise Data to Excel (.xlsx) with Multiple Worksheets
 */
export function exportExecutiveExcel({
  companyName = 'Bharat Enterprise FMCG Pvt Ltd',
  visits = [],
  managers = [],
  salesReps = [],
  customers = [],
  periodLabel = 'All Time'
}) {
  const wb = XLSX.utils.book_new();
  const dateStr = getDateString();

  // Calculated Metrics
  const totalRevenue = visits.reduce((acc, v) => acc + (parseFloat(v.orderTotal) || 0), 0);
  const verifiedVisits = visits.filter(v => v.status === 'Verified').length;
  const flaggedVisits = visits.filter(v => v.status === 'Flagged Anomalous').length;
  const accuracyRate = visits.length > 0 ? Math.round((verifiedVisits / visits.length) * 100) : 100;

  // Sheet 1: Executive Summary
  const summaryRows = [
    { Metric: 'Organization', Value: companyName },
    { Metric: 'Report Generation Timestamp', Value: new Date().toISOString() },
    { Metric: 'Reporting Period', Value: periodLabel },
    { Metric: 'Total Field Revenue (INR)', Value: totalRevenue },
    { Metric: 'Total Completed Visits', Value: visits.length },
    { Metric: 'Verified Shop Visits', Value: verifiedVisits },
    { Metric: 'GPS Verification Accuracy Rate', Value: `${accuracyRate}%` },
    { Metric: 'Flagged Anomalous Visits', Value: flaggedVisits },
    { Metric: 'Total Active Regional Managers', Value: managers.length },
    { Metric: 'Total Active Field Sales Reps', Value: salesReps.length },
    { Metric: 'Total Registered Retail Shops', Value: customers.length }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // Sheet 2: Field Visits
  const visitRows = visits.map((v, idx) => ({
    Record_ID: v.id || `VIS_${idx + 1}`,
    Date_Time: v.timestamp || new Date().toISOString(),
    Sales_Representative: v.repName || 'Sales Rep',
    Shop_Name: v.shopName || v.customerName || 'Retail Shop',
    Owner_Name: v.ownerName || '',
    Phone: v.phone || '',
    Order_Value_INR: parseFloat(v.orderTotal) || 0,
    Verification_Status: v.status || 'Pending',
    GPS_Auto_Verified: v.gpsAutoVerified ? 'YES' : 'NO',
    Latitude: v.latitude || (v.location?.lat || ''),
    Longitude: v.longitude || (v.location?.lng || ''),
    Address: v.location?.address || '',
    Notes: v.notes || ''
  }));
  const visitsSheet = XLSX.utils.json_to_sheet(visitRows);
  XLSX.utils.book_append_sheet(wb, visitsSheet, 'Field Visits');

  // Sheet 3: Regional Managers
  const managerRows = managers.map(m => ({
    Manager_ID: m.id,
    Full_Name: m.name,
    Email: m.email,
    Phone: m.phone || '',
    Commercial_Zone: m.zone || '',
    Primary_State: m.state || '',
    Assigned_Reps_Count: salesReps.filter(r => r.managerId === m.id).length,
    Account_Status: m.status || 'Active',
    Created_At: m.createdAt || ''
  }));
  const managersSheet = XLSX.utils.json_to_sheet(managerRows);
  XLSX.utils.book_append_sheet(wb, managersSheet, 'Regional Managers');

  // Sheet 4: Sales Representatives
  const repRows = salesReps.map(r => {
    const assignedManager = managers.find(m => m.id === r.managerId);
    return {
      Rep_ID: r.id,
      Full_Name: r.name,
      Email: r.email,
      Phone: r.phone || '',
      Commercial_Zone: r.zone || assignedManager?.zone || '',
      Territory_District: r.territory || '',
      Assigned_Manager: assignedManager ? assignedManager.name : 'Direct Admin',
      Daily_Target: r.dailyTarget || 15,
      Account_Status: r.status || 'Active'
    };
  });
  const repsSheet = XLSX.utils.json_to_sheet(repRows);
  XLSX.utils.book_append_sheet(wb, repsSheet, 'Sales Representatives');

  // Sheet 5: Customer Retail Outlets
  if (customers && customers.length > 0) {
    const customerRows = customers.map(c => ({
      Customer_ID: c.id,
      Shop_Name: c.name || c.shopName,
      Owner: c.owner || '',
      Phone: c.phone || '',
      City_Territory: c.city || c.territory || '',
      Address: c.address || '',
      Credit_Limit_INR: c.creditLimit || 0
    }));
    const customerSheet = XLSX.utils.json_to_sheet(customerRows);
    XLSX.utils.book_append_sheet(wb, customerSheet, 'Customer Outlets');
  }

  XLSX.writeFile(wb, `FieldVision_Enterprise_Report_${dateStr}.xlsx`);
}

/**
 * Export Field Telemetry to Clean CSV File
 */
export function exportExecutiveCsv({
  visits = [],
  filename = null
}) {
  if (!visits || !visits.length) {
    alert('No visit records found to export for the selected filter.');
    return;
  }

  const exportFilename = filename || `FieldVision_Visits_Report_${getDateString()}.csv`;

  const rows = visits.map(v => ({
    Visit_ID: v.id,
    Timestamp: v.timestamp || '',
    Representative: v.repName || '',
    Shop_Name: v.shopName || v.customerName || '',
    Order_Value_INR: parseFloat(v.orderTotal) || 0,
    Status: v.status || 'Pending',
    GPS_Verified: v.gpsAutoVerified ? 'YES' : 'NO',
    Latitude: v.latitude || (v.location?.lat || ''),
    Longitude: v.longitude || (v.location?.lng || ''),
    Address: v.location?.address || '',
    Notes: v.notes || ''
  }));

  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', exportFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a blank standardized Excel template with sample data for Field Visits
 */
export function exportVisitExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Field Visit Template
  const templateRows = [
    {
      'Shop_Name*': 'Shree Ganesh Kirana Store',
      'Owner_Name': 'Ramesh Patel',
      'Contact_Phone': '+91 98200 12345',
      'Street_Address*': 'Shop 4, Linking Road, Bandra West, Mumbai',
      'Latitude': 19.0596,
      'Longitude': 72.8295,
      'Order_Amount_INR*': 14500,
      'Items_Ordered': '10x Wheat Flour 10kg, 20x Cooking Oil 1L, 15x Basmati Rice 5kg',
      'Payment_Mode*': 'UPI QR',
      'Payment_Status': 'Paid via UPI',
      'Sales_Rep_Email*': 'rahul@fieldvision.in',
      'Visit_Date_Time*': '2026-09-06 11:30:00',
      'Field_Notes': 'Retailer confirmed monthly restock cycle. Prime shelf visibility.'
    },
    {
      'Shop_Name*': 'Om Sai Super Market',
      'Owner_Name': 'Suresh Gupta',
      'Contact_Phone': '+91 98765 67890',
      'Street_Address*': '12 Commercial Complex, Andheri East, Mumbai',
      'Latitude': 19.1136,
      'Longitude': 72.8697,
      'Order_Amount_INR*': 28200,
      'Items_Ordered': '25x Tea Packets 500g, 30x Detergent Powder 2kg, 50x Biscuits Box',
      'Payment_Mode*': 'Cash',
      'Payment_Status': 'Cash Collected',
      'Sales_Rep_Email*': 'rahul@fieldvision.in',
      'Visit_Date_Time*': '2026-09-06 14:15:00',
      'Field_Notes': 'Collected cash in full. New competitor brand spotted on front rack.'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 45 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 40 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 22 },
    { wch: 50 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Visit_Import_Template');

  // Sheet 2: Guidelines & Allowed Values
  const instructions = [
    { 'Field': 'Shop_Name*', 'Required': 'YES', 'Description': 'Official name of the retail store or dealer' },
    { 'Field': 'Street_Address*', 'Required': 'YES', 'Description': 'Physical address or landmark of the retailer' },
    { 'Field': 'Order_Amount_INR*', 'Required': 'YES', 'Description': 'Total numeric booking order value in Indian Rupees' },
    { 'Field': 'Payment_Mode*', 'Required': 'YES', 'Description': 'Allowed values: UPI QR, Cash, Credit / Pay Later' },
    { 'Field': 'Payment_Status', 'Required': 'NO', 'Description': 'Allowed values: Paid via UPI, Cash Collected, Pending' },
    { 'Field': 'Sales_Rep_Email*', 'Required': 'YES', 'Description': 'Registered login email of the sales representative' },
    { 'Field': 'Visit_Date_Time*', 'Required': 'YES', 'Description': 'Format: YYYY-MM-DD HH:MM:SS' },
    { 'Field': 'Latitude / Longitude', 'Required': 'OPTIONAL', 'Description': 'Decimal GPS coordinates for geofence verification' }
  ];
  const wsGuide = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guidelines & Validation');

  XLSX.writeFile(wb, 'FieldVision_Visit_Template.xlsx');
}

/**
 * Export a clean CSV template with headers and sample rows for Field Visits
 */
export function exportVisitCsvTemplate() {
  const headers = [
    'Shop_Name',
    'Owner_Name',
    'Contact_Phone',
    'Street_Address',
    'Latitude',
    'Longitude',
    'Order_Amount_INR',
    'Items_Ordered',
    'Payment_Mode',
    'Payment_Status',
    'Sales_Rep_Email',
    'Visit_Date_Time',
    'Field_Notes'
  ];

  const sampleRows = [
    [
      'Shree Ganesh Kirana Store',
      'Ramesh Patel',
      '+91 98200 12345',
      'Shop 4, Linking Road, Bandra West, Mumbai',
      '19.0596',
      '72.8295',
      '14500',
      '10x Wheat Flour 10kg, 20x Cooking Oil 1L, 15x Basmati Rice 5kg',
      'UPI QR',
      'Paid via UPI',
      'rahul@fieldvision.in',
      '2026-09-06 11:30:00',
      'Retailer confirmed monthly restock cycle. Prime shelf visibility.'
    ],
    [
      'Om Sai Super Market',
      'Suresh Gupta',
      '+91 98765 67890',
      '12 Commercial Complex, Andheri East, Mumbai',
      '19.1136',
      '72.8697',
      '28200',
      '25x Tea Packets 500g, 30x Detergent Powder 2kg, 50x Biscuits Box',
      'Cash',
      'Cash Collected',
      'rahul@fieldvision.in',
      '2026-09-06 14:15:00',
      'Collected cash in full. New competitor brand spotted on front rack.'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'FieldVision_Visit_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

