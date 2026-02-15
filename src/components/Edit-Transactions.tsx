'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { v4 as uuidv4 } from 'uuid';
import ServiceTypeahead from './ServiceTypeahead';
import PriestServiceTypeahead from './PriestServiceTypeahead';

type Transaction = {
  id: string;
  BookedDate: string;
  DevoteeEmail?: string;
  DevoteeName?: string;
  Amount?: number;
  PaymentType?: string;
  ServiceType?: string;
  TransactionId?: string;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const EditTransactions: React.FC = () => {
  const [serviceTypeMode, setServiceTypeMode] = useState<'regular' | 'priest'>('regular');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit/Delete states
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Transaction | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const fetchWithRetry = useCallback(
    async (
      url: string,
      options: RequestInit,
      retries: number,
      delay: number
    ): Promise<Response> => {
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
        const monthlyDataResponse = await fetchWithRetry(
          monthlyPresignedUrl,
          { credentials: 'include' },
          MAX_RETRIES,
          RETRY_DELAY_MS
        );

        const monthlyData: Record<string, any> = await monthlyDataResponse.json();

        // Process monthly transactions
        let monthlyTransactions = Object.entries(monthlyData)
          .flatMap(([_, transactions]) => transactions)
          .map((transaction: Transaction) => ({
            ...transaction,
            id: transaction.id || uuidv4(),
          }))
          .sort(
            (a, b) =>
              new Date(b.BookedDate).getTime() - new Date(a.BookedDate).getTime()
          );

        setTransactions(monthlyTransactions);
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
  }, [fetchWithRetry]);

  // Edit handlers
  const handleEditClick = (row: Transaction) => {
    setEditRowId(row.id);
    setEditFormData({ ...row });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditRowId(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (field: keyof Transaction, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormData || isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      const requiredFields = [
        'BookedDate',
        'DevoteeName',
        'DevoteeEmail',
        'Amount',
        'PaymentType',
        'ServiceType',
        'TransactionId',
      ];

      for (const field of requiredFields) {
        if (!editFormData[field as keyof Transaction]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      const response = await fetch('/edit-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update',
          transaction: editFormData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Failed to update transaction');
      }

      setTransactions((prevTransactions) =>
        prevTransactions.map((t) => (t.id === editFormData.id ? editFormData : t))
      );

      setSnackbarMessage('Transaction updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleEditDialogClose();
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      setSnackbarMessage(error.message || 'Failed to update transaction');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Column definitions with edit/delete actions
  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditClick(params.row as Transaction)}
        />,
      ],
    },
    { field: 'BookedDate', headerName: 'Date', width: 150, editable: false },
    { field: 'DevoteeName', headerName: 'Name', width: 200, editable: false },
    { field: 'Amount', headerName: 'Amount', width: 100, type: 'number', editable: false },
    { field: 'DevoteeEmail', headerName: 'Email', width: 250, editable: false },
    { field: 'PaymentType', headerName: 'Payment Type', width: 150, editable: false },
    { field: 'ServiceType', headerName: 'Service Type', width: 150, editable: false },
    { field: 'TransactionId', headerName: 'TransactionId', width: 150, editable: false },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Edit Transactions
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use this page to edit or delete transaction records. Click the edit or
        delete icons to modify transactions.
      </Typography>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={editFormData?.BookedDate ? editFormData.BookedDate.split('T')[0] : ''}
              onChange={(e) => handleEditFormChange('BookedDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Name"
              value={editFormData?.DevoteeName || ''}
              onChange={(e) => handleEditFormChange('DevoteeName', e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={editFormData?.DevoteeEmail || ''}
              onChange={(e) => handleEditFormChange('DevoteeEmail', e.target.value)}
              fullWidth
            />
            <TextField
              label="Amount"
              type="number"
              value={editFormData?.Amount ?? ''}
              onChange={(e) => handleEditFormChange('Amount', Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Payment Type"
              value={editFormData?.PaymentType || ''}
              onChange={(e) => handleEditFormChange('PaymentType', e.target.value)}
              fullWidth
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Service Type
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant={serviceTypeMode === 'regular' ? 'contained' : 'outlined'}
                  onClick={() => setServiceTypeMode('regular')}
                >
                  Regular Service
                </Button>
                <Button
                  variant={serviceTypeMode === 'priest' ? 'contained' : 'outlined'}
                  onClick={() => setServiceTypeMode('priest')}
                  sx={{ ml: 1 }}
                >
                  Priest Service
                </Button>
              </Box>
              {serviceTypeMode === 'regular' ? (
                <ServiceTypeahead
                  onSelect={(value: string) => handleEditFormChange('ServiceType', value)}
                />
              ) : (
                <PriestServiceTypeahead
                  onSelect={(value: string) => handleEditFormChange('ServiceType', value)}
                />
              )}
              {editFormData?.ServiceType && (
                <Typography
                  variant="caption"
                  sx={{ mt: 1, display: 'block', color: 'gray' }}
                >
                  Selected: {editFormData.ServiceType}
                </Typography>
              )}
            </Box>
            <TextField
              label="TransactionId"
              value={editFormData?.TransactionId || ''}
              fullWidth
              disabled
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Data Grid */}
      <Box sx={{ height: 600, width: '100%', mt: 2 }}>
        {loading && transactions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ mt: 2 }}>{error}</Box>
        ) : (
          <DataGrid
            rows={transactions}
            columns={columns}
            disableRowSelectionOnClick
            autoHeight
            loading={loading}
            initialState={{
              sorting: {
                sortModel: [{ field: 'BookedDate', sort: 'desc' }],
              },
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </Box>
    </Box>
  );
};

export default EditTransactions;