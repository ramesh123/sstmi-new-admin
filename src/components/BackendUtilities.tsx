'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { toast } from 'react-toastify';

interface Match {
  file: string;
  line: number;
  match: string;
  context: string[];
}

interface FunctionMatch {
  functionName: string;
  runtime: string;
  matches: Match[];
}

export default function BackendUtilities() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FunctionMatch[] | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('Please enter a keyword.');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch(
        'https://exxrm7ol6xay6rv2druch3rd440nqrhg.lambda-url.us-east-1.on.aws/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
        }
      );

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      setResults(data.results || []);
      toast.success(`Found ${data.totalMatches} matches`);
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Lambda Code Search Utility
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Keyword"
          variant="outlined"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      {results && results.length > 0 ? (
        results.map((func, idx) => (
          <Box key={idx} sx={{ mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {func.functionName} ({func.runtime})
            </Typography>

            {func.matches.map((match, mIdx) => (
              <Box key={mIdx} sx={{ mt: 2, pl: 2, borderLeft: '2px solid #1976d2' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  <strong>{match.file}:{match.line}</strong> — {match.match}
                </Typography>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', mt: 1, color: 'gray' }}>
                  {match.context.join('\n')}
                </Box>
              </Box>
            ))}
          </Box>
        ))
      ) : (
        !loading && (
          <Typography variant="body2" color="text.secondary">
            No results yet. Enter a keyword to start.
          </Typography>
        )
      )}
    </Box>
  );
}
