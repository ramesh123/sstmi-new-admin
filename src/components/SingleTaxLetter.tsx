"use client";
import React, { useState, useEffect } from 'react';
import {
Box,
Typography,
TextField,
Button,
Paper,
CircularProgress,
InputAdornment,
FormControlLabel,
Switch
} from '@mui/material';
import DevoteeTypeahead from './DevoteeTypeahead';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Devotee {
Name: string;
Email: string;
PhoneNumber?: string;
Address?: string;
}

const SingleTaxLetter: React.FC = () => {
// New state for username loaded from cookie
const [username, setUsername] = useState<string>('');

// Form state for devotee & tax letter details
const [selectedDevotee, setSelectedDevotee] = useState<Devotee | null>(null);
const [manualName, setManualName] = useState<string>('');
const [manualEmail, setManualEmail] = useState<string>('');
const [amount, setAmount] = useState<string>('');
const [taxYear, setTaxYear] = useState<string>(new Date().getFullYear().toString());
const [useTypeahead, setUseTypeahead] = useState<boolean>(true);

// UI state
const [loading, setLoading] = useState<boolean>(false);

// On mount, fetch the username (in this example taken from the cookie "email")
useEffect(() => {
if (!username) {
const email = getCookie('email');
if (email) {
setUsername(email);
}
}
}, [username]);

// Handle devotee selection from typeahead
const handleDevoteeSelect = (devotee: Devotee) => {
console.log('Selected Devotee:', devotee);
setSelectedDevotee(devotee);
};

// Handle new devotee name from typeahead; switch to manual mode
const handleNewDevotee = (name: string) => {
console.log('New Devotee Name:', name);
setManualName(name);
setManualEmail('');
setSelectedDevotee(null);
setUseTypeahead(false);
};

// Toggle between typeahead and manual entry for devotee info
const handleToggleEntryMode = () => {
console.log('Toggling to:', !useTypeahead);
setUseTypeahead(!useTypeahead);
setSelectedDevotee(null);
setManualName('');
setManualEmail('');
};

// Form submission
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

// Validate that the username is available (fetched from cookie)
if (!username.trim()) {
  toast.error('Your username is missing. Please log in again.');
  return;
}

// Validate devotee information
if (useTypeahead && !selectedDevotee) {
  toast.error('Please select a devotee');
  return;
}
if (!useTypeahead && (!manualName || !manualEmail)) {
  toast.error('Please enter both devotee name and email');
  return;
}

// Validate donation amount
if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
  toast.error('Please enter a valid donation amount');
  return;
}

// Validate tax year
if (!taxYear || isNaN(Number(taxYear))) {
  toast.error('Please enter a valid tax year');
  return;
}

// Get the devotee name/email based on the mode
const name = useTypeahead ? selectedDevotee?.Name : manualName;
const email = useTypeahead ? selectedDevotee?.Email : manualEmail;

// Prepare request payload including the username
const requestData = {
  username, // the username fetched from cookie
  name,
  email,
  amount: Number(amount),
  tax_year: taxYear
};

console.log('Submitting:', requestData);
setLoading(true);

try {
  const apiUrl = '/singletaxletter';
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestData),
    credentials: 'include',
  });
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const textResponse = await response.text();
    console.error("Received non-JSON response:", textResponse.substring(0, 500) + "...");
    throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText})`);
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Error: ${response.status} ${response.statusText}`);
  }
  
  toast.success(`Tax letter sent successfully to ${email}`);
  
  // Reset the form for donation amount (and devotee info if necessary)
  if (useTypeahead) {
    setSelectedDevotee(null);
  } else {
    setManualName('');
    setManualEmail('');
  }
  setAmount('');
  
} catch (err: any) {
  console.error('Error sending tax letter:', err);
  toast.error(err.message || 'Failed to send tax letter. Please try again.');
} finally {
  setLoading(false);
}
};

return (
<Box sx={{ maxWidth: 800, mx: 'auto' }}>
<Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
Send Individual Tax Letter
</Typography>
<Typography variant="subtitle1" gutterBottom>
            This form will send one tax letter to selected devotee. Use for corrections with Name and Donation amount. These changes will be recorded in the database for future use
          </Typography>

  <Paper elevation={3} sx={{ p: 3 }}>
    {/* Read-only field for username */}
    <TextField
      label="Your Name"
      value={username}
      fullWidth
      margin="normal"
      InputProps={{
        readOnly: true,
      }}
    />
    
    <FormControlLabel
      control={
        <Switch
          checked={useTypeahead}
          onChange={handleToggleEntryMode}
          color="primary"
        />
      }
      label={useTypeahead ? "Using devotee search" : "Manual entry"}
      sx={{ mb: 2 }}
    />
    
    <form onSubmit={handleSubmit}>
      {useTypeahead ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Search for existing devotee:
          </Typography>
          <DevoteeTypeahead
            onSelect={handleDevoteeSelect}
            onNewName={handleNewDevotee}
            className="mb-4"
          />
          {selectedDevotee && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="subtitle2">Selected devotee:</Typography>
              <Typography>
                <strong>Name:</strong> {selectedDevotee.Name}
              </Typography>
              <Typography>
                <strong>Email:</strong> {selectedDevotee.Email}
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Devotee Name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Devotee Email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            fullWidth
            margin="normal"
            type="email"
            required
          />
        </Box>
      )}
      
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Donation Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          margin="normal"
          type="number"
          required
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        
        <TextField
          label="Tax Year"
          value={taxYear}
          onChange={(e) => setTaxYear(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </Box>
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        sx={{ mt: 2 }}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Send Tax Letter'}
      </Button>
    </form>
  </Paper>
</Box>
);
};

export default SingleTaxLetter;

// Helper function to fetch a cookie value
const getCookie = (name: string): string | null => {
const cookies = document.cookie.split('; ');
const cookie = cookies.find((row) => row.startsWith(name + '='));
return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};