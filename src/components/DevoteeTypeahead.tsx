import React, { useState, useEffect, useRef } from 'react';

interface Devotee {
Name: string;
Email: string;
PhoneNumber: string;
Address: string;
}

interface DevoteeTypeaheadProps {
onSelect: (devotee: Devotee) => void;
onNewName: (name: string) => void; // Callback for new names
className?: string;
}

const DevoteeTypeahead: React.FC<DevoteeTypeaheadProps> = ({
onSelect,
onNewName,
className = ''
}) => {
const [query, setQuery] = useState('');
const [devotees, setDevotees] = useState<Devotee[]>([]);
const [filteredDevotees, setFilteredDevotees] = useState<Devotee[]>([]);
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const wrapperRef = useRef<HTMLDivElement>(null);
const [hasSelected, setHasSelected] = useState(false);

useEffect(() => {
const fetchDevotees = async () => {
setLoading(true);
try {
const response = await fetch('/data/devotees.json', {
credentials: 'include',
headers: { Accept: 'application/json' },
});

    if (!response.ok) {
      throw new Error('Failed to fetch devotees');
    }

    const data: Devotee[] = await response.json();
    setDevotees(data);
  } catch (err) {
    setError('Failed to load devotees data. Please refresh the page.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

fetchDevotees();
}, []);

useEffect(() => {
if (query.length >= 2) {
const filtered = devotees.filter(devotee =>
devotee.Name.toLowerCase().includes(query.toLowerCase()) ||
devotee.Email.toLowerCase().includes(query.toLowerCase())
);
setFilteredDevotees(filtered.slice(0, 5));
setIsOpen(true);
} else {
setFilteredDevotees([]);
setIsOpen(false);
}
}, [query, devotees]);

useEffect(() => {
const handleClickOutside = (event: MouseEvent) => {
if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
setIsOpen(false);
}
};

document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const handleSelect = (devotee: Devotee) => {
setQuery(devotee.Name);
onSelect(devotee);
setIsOpen(false);
setHasSelected(true);
};

// When input loses focus, if nothing was selected and there's a non-empty query,
// automatically treat it as a new devotee name.
const handleBlur = () => {
// Use a small delay to allow click events on list items to register.
setTimeout(() => {
if (!hasSelected && query.trim() !== '') {
onNewName(query);
}
// Reset flag for future interactions
setHasSelected(false);
}, 200);
};

return (
  <div ref={wrapperRef} className={`relative ${className}`}>
<div className="relative">
<input
type="text"
value={query}
onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
onBlur={handleBlur}
placeholder="Search or enter name..."
className="p-2 border rounded w-full"
aria-label="Search devotees"
/>
{loading && (
<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
<div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
</div>
)}
</div>

  {error && (
    <div className="absolute bottom-full mb-2 w-full bg-red-50 border border-red-200 rounded p-2 text-red-600 text-sm">
      {error}
    </div>
  )}

  {isOpen && (
    <ul className="absolute bottom-full mb-2 w-full bg-white border rounded shadow-lg z-10 max-h-60 overflow-y-auto">
      {filteredDevotees.length > 0 ? (
        filteredDevotees.map((devotee, index) => (
          <li
            key={index}
            className="p-2 hover:bg-gray-100 cursor-pointer"
            // Use onMouseDown to prevent the input from blurring before selection is processed.
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(devotee);
            }}
          >
            <div className="font-medium">{devotee.Name}</div>
            <div className="text-sm text-gray-600">{devotee.Email}</div>
          </li>
        ))
      ) : (
        <li className="p-2 text-sm text-gray-600">
          No matches found.
          {query && (
            <span className="ml-1 font-medium">
              "{query}" will be added as new devotee name.
            </span>
          )}
        </li>
      )}
    </ul>
  )}
</div>
);
};

export default DevoteeTypeahead;