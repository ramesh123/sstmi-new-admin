import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Typography, Button, Modal } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { v4 as uuidv4 } from 'uuid';
import DownloadIcon from '@mui/icons-material/Download';

type Transaction = {
  id?: string;
  BookedDate: string;
  DevoteeEmail?: string;
  DevoteeName?: string;
  Amount?: number;
  PaymentType?: string;
  ServiceType?: string;
};

type SummaryData = {
  id: string;
  Name: string;
  Email: string;
  '2023': number;
  '2024': number;
  '2025'?: number;
  Contributions: string;
  recent: string;
};

interface TransactionsProps {
  devoteeFilter?: {
    DevoteeName?: string;
    DevoteeEmail?: string;
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const Transactions: React.FC<TransactionsProps> = ({ devoteeFilter }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const fetchWithRetry = useCallback(
    async (url: string, options: RequestInit, retries: number, delay: number): Promise<Response> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          if (response.status === 401 && retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
          }
          throw new Error(response.status.toString());
        }
        return response;
      } catch (error) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
  
      try {
        // When devoteeFilter is set, fetch both monthly and summary data
        if (devoteeFilter) {
          // Fetch monthly transactions
          const monthlyResponse = await fetchWithRetry(
            `/transactions/monthly?uri=${encodeURIComponent('/transactions/monthly')}`,
            { credentials: 'include' },
            MAX_RETRIES,
            RETRY_DELAY_MS
          );
  
          if (monthlyResponse.status === 401) {
            throw new Error('Unauthorized');
          }
  
          const { presignedUrl: monthlyPresignedUrl } = await monthlyResponse.json();
          const monthlyDataResponse = await fetchWithRetry(monthlyPresignedUrl, { credentials: 'include' }, MAX_RETRIES, RETRY_DELAY_MS);
          const monthlyData: Record<string, any> = await monthlyDataResponse.json();
  
          // Apply devotee filter for monthly transactions
          let monthlyTransactions = Object.entries(monthlyData)
            .flatMap(([_, transactions]) => transactions)
            .map((transaction: Transaction) => ({
              ...transaction,
              id: uuidv4(),
            }))
            .sort((a, b) => new Date(b.BookedDate).getTime() - new Date(a.BookedDate).getTime());
  
          // Apply devotee filter to monthly transactions
          console.log('Applying devotee filter for monthly transactions:', devoteeFilter); // Debug log
          monthlyTransactions = monthlyTransactions.filter(transaction => {
            const nameMatch = devoteeFilter.DevoteeName
              ? transaction.DevoteeName?.toLowerCase() === devoteeFilter.DevoteeName.toLowerCase()
              : true;
            const emailMatch = devoteeFilter.DevoteeEmail
              ? transaction.DevoteeEmail?.toLowerCase() === devoteeFilter.DevoteeEmail.toLowerCase()
              : true;
            return nameMatch && emailMatch;
          });
  
          setTransactions(monthlyTransactions);
  
          // Fetch yearly summary
          const summaryResponse = await fetchWithRetry(
            `/transactions/summary?uri=${encodeURIComponent('/transactions/summary')}`,
            { credentials: 'include' },
            MAX_RETRIES,
            RETRY_DELAY_MS
          );
  
          if (summaryResponse.status === 401) {
            throw new Error('Unauthorized');
          }
  
          const { presignedUrl: summaryPresignedUrl } = await summaryResponse.json();
          const summaryDataResponse = await fetchWithRetry(summaryPresignedUrl, { credentials: 'include' }, MAX_RETRIES, RETRY_DELAY_MS);
          const summaryData: SummaryData[] = await summaryDataResponse.json();
  
          // Apply devotee filter to yearly summary data
          let formattedSummary = summaryData.map((row) => ({
            ...row,
            id: uuidv4(),
            Contributions: row.Contributions ?? '',
            recent: row.recent ? row.recent : new Date(0).toISOString(),
          }));
  
          console.log('Applying devotee filter for Yearly transactions:', devoteeFilter); // Debug log
          formattedSummary = formattedSummary.filter(row => {
            const nameMatch = devoteeFilter.DevoteeName
              ? row.Name.toLowerCase() === devoteeFilter.DevoteeName.toLowerCase()
              : true;
            const emailMatch = devoteeFilter.DevoteeEmail
              ? row.Email.toLowerCase() === devoteeFilter.DevoteeEmail.toLowerCase()
              : true;
            return nameMatch && emailMatch;
          });
  
          formattedSummary.sort((a, b) => new Date(b.recent).getTime() - new Date(a.recent).getTime());
          setSummaryData(formattedSummary);
  
        } else {
          // If devoteeFilter is not set, fetch data based on tabIndex (current behavior)
          const endpoint = tabIndex === 0
            ? `/transactions/monthly?uri=${encodeURIComponent('/transactions/monthly')}`
            : `/transactions/summary?uri=${encodeURIComponent('/transactions/summary')}`;
  
          const response = await fetchWithRetry(endpoint, { credentials: 'include' }, MAX_RETRIES, RETRY_DELAY_MS);
  
          if (response.status === 401) {
            throw new Error('Unauthorized');
          }
  
          const { presignedUrl } = await response.json();
          const dataResponse = await fetchWithRetry(presignedUrl, { credentials: 'include' }, MAX_RETRIES, RETRY_DELAY_MS);
          const data: Record<string, any> = await dataResponse.json();
  
          if (data && typeof data === 'object') {
            if (tabIndex === 0) {
              // Monthly Transactions
              let monthlyTransactions = Object.entries(data)
                .flatMap(([_, transactions]) => transactions)
                .map((transaction: Transaction) => ({
                  ...transaction,
                  id: uuidv4(),
                }))
                .sort((a, b) => new Date(b.BookedDate).getTime() - new Date(a.BookedDate).getTime());
  
              setTransactions(monthlyTransactions);
            } else {
              // Yearly Summary
              let formattedSummary = (data as SummaryData[]).map((row) => ({
                ...row,
                id: uuidv4(),
                Contributions: row.Contributions ?? '',
                recent: row.recent ? row.recent : new Date(0).toISOString(),
              }));
  
              formattedSummary.sort((a, b) => new Date(b.recent).getTime() - new Date(a.recent).getTime());
              setSummaryData(formattedSummary);
            }
          } else {
            setTransactions([]);
            setSummaryData([]);
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        if (error.message === 'Unauthorized') {
          setError('Login expired. Please log in again.');
        } else {
          setError('An error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [tabIndex, fetchWithRetry, devoteeFilter]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const openModalHandler = (name: string, contributions: string) => {
    setModalContent(`${name}: ${contributions}`);
    setOpenModal(true);
  };
  
  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const downloadCSV = () => {
    let csvContent = '';
    let filename = '';

    if (devoteeFilter) {
      // Download both summary and detailed transactions for filtered view
      const summaryHeaders = ['Name', 'Email', '2023', '2024', '2025'];
      const transactionHeaders = ['BookedDate', 'DevoteeName', 'DevoteeEmail', 'Amount', 'PaymentType', 'ServiceType'];
      
      csvContent = 'Yearly Summary\n';
      csvContent += summaryHeaders.join(',') + '\n';
      summaryData.forEach(row => {
        const values = summaryHeaders.map(header => {
          const value = row[header as keyof SummaryData];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value ?? '';
        });
        csvContent += values.join(',') + '\n';
      });

      csvContent += '\nTransaction Details\n';
      csvContent += transactionHeaders.join(',') + '\n';
      transactions.forEach(row => {
        const values = transactionHeaders.map(header => {
          const value = row[header as keyof Transaction];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value ?? '';
        });
        csvContent += values.join(',') + '\n';
      });

      filename = `${summaryData[0]?.Name || 'devotee'}_transactions.csv`;
    } else if (tabIndex === 0) {
      // Monthly transactions
      const headers = ['BookedDate', 'DevoteeName', 'DevoteeEmail', 'Amount', 'PaymentType', 'ServiceType'];
      csvContent = headers.join(',') + '\n';
      transactions.forEach(row => {
        const values = headers.map(header => {
          const value = row[header as keyof Transaction];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value ?? '';
        });
        csvContent += values.join(',') + '\n';
      });
      filename = 'monthly_transactions.csv';
    } else {
      // Yearly summary
      const headers = ['Name', 'Email', '2023', '2024', '2025', 'Contributions', 'recent'];
      csvContent = headers.join(',') + '\n';
      summaryData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header as keyof SummaryData];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value ?? '';
        });
        csvContent += values.join(',') + '\n';
      });
      filename = 'yearly_summary.csv';
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthlyColumns: GridColDef[] = [
    { field: 'BookedDate', headerName: 'Date', width: 150 },
    { field: 'DevoteeName', headerName: 'Name', width: 200 },
    { field: 'DevoteeEmail', headerName: 'Email', width: 250 },
    { field: 'Amount', headerName: 'Amount', width: 100, type: 'number' },
    { field: 'PaymentType', headerName: 'Payment Type', width: 150 },
    { field: 'ServiceType', headerName: 'Service Type', width: 150 },
  ];

  const summaryColumns: GridColDef[] = [
    { field: 'recent', headerName: 'Recent', width: 150 },
    { field: 'Name', headerName: 'Name', width: 200 },
    { field: 'Email', headerName: 'Email', width: 250 },
    { field: '2023', headerName: '2023', width: 100, type: 'number' },
    { field: '2024', headerName: '2024', width: 100, type: 'number' },
    { field: '2025', headerName: '2025', width: 100, type: 'number' },
    {
      field: 'Contributions',
      headerName: 'Contributions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          onClick={() => openModalHandler(params.row.Name, params.row.Contributions)}
        >
          View More
        </Button>
      ),
    },
  ];
  
  // Modal style for centering and responsiveness
  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', md: 400 },
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    overflowY: 'auto',
  };

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>{error}</Box>;
  if (tabIndex === 1 && summaryData.length === 0) return <Box>No data available or still loading...</Box>;

  return (
    <Box sx={{ width: '100%' }}>
    <Modal
      open={openModal}
      onClose={closeModalHandler}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Contributions Details
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          {modalContent}
        </Typography>
        <Button onClick={closeModalHandler} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>

    {/* Download Button */}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={downloadCSV}
      >
        Download CSV
      </Button>
    </Box>
  
      {devoteeFilter ? (
      // Render filtered view for both monthly and yearly data
      <>
        {/* Yearly Summary Section */}
        <Box sx={{ mb: 4, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {summaryData[0]?.Name || 'Devotee'} Summary
          </Typography>
          <DataGrid
            rows={summaryData}
            columns={summaryColumns.filter(col => 
              ['2023', '2024', '2025'].includes(col.field)
            )}
            autoHeight
            hideFooter
          />
        </Box>

        {/* Detailed Transactions Section */}
        <Typography variant="h6" gutterBottom>
          Transaction Details
        </Typography>
        <DataGrid
          rows={transactions}
          columns={monthlyColumns.filter(col =>
            ['BookedDate', 'Amount', 'PaymentType', 'ServiceType'].includes(col.field)
          )}
          autoHeight
          initialState={{
            sorting: {
              sortModel: [{ field: 'BookedDate', sort: 'desc' }],
            },
          }}
        />
      </>
    ) : (
      // Render default tabs view
      <>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Transaction Tabs">
          <Tab label="Monthly Transactions" />
          <Tab label="Yearly Summary" />
        </Tabs>
        {tabIndex === 0 && (
          <Box sx={{ height: 600, width: '100%', mt: 2 }}>
            <DataGrid
              rows={transactions}
              columns={monthlyColumns}
              disableRowSelectionOnClick
              autoHeight
            />
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ height: 600, width: '100%', mt: 2, overflowX: 'auto' }}>
            <DataGrid
              rows={summaryData}
              columns={summaryColumns}
              disableColumnMenu
              disableRowSelectionOnClick
            />
          </Box>
        )}
      </>
    )}
  </Box>
);

}
  
export default Transactions;