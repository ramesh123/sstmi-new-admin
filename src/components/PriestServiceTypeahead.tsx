import React, { useState, useEffect, useRef } from 'react';

interface PriestServiceTypeaheadProps {
  onSelect: (serviceName: string) => void;
  className?: string;
}

const PriestServiceTypeahead: React.FC<PriestServiceTypeaheadProps> = ({ onSelect, className = '' }) => {
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [filteredServices, setFilteredServices] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        // const response = await fetch('/data/unique_service_types_priest.json', { credentials: 'include' });
        const response = await fetch('/data/unique_service_types_priest.json', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch service types');
        }
        const data: string[] = await response.json();
        setServices(data);
      } catch (err) {
        setError('Failed to load service types. Please refresh the page.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const filtered = services.filter((service) =>
        service.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredServices(filtered.slice(0, 5));
      setIsOpen(true);
    } else {
      setFilteredServices([]);
      setIsOpen(false);
    }
  }, [query, services]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (service: string) => {
    setQuery(service);
    onSelect(service);
    setIsOpen(false);
    setHasSelected(true);
  };

  // onBlur automatically adds the service if no selection was made and query is non-empty.
  const handleBlur = () => {
    // Use a small delay to allow click events on list items to register.
    setTimeout(() => {
      if (!hasSelected && query.trim() !== '') {
        onSelect(query);
      }
      setHasSelected(false); // Reset the flag for future interactions.
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
          placeholder="Search or select service..."
          className="p-2 border rounded w-full"
          aria-label="Search services"
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
          {filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <li
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                // Use onMouseDown to prevent the input from blurring before selection is processed.
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(service);
                }}
              >
                <div className="font-medium">{service}</div>
              </li>
            ))
          ) : (
            <li className="p-2 text-sm text-gray-600">
              No matches found. {query && <span className="ml-1 font-medium">"{query}" will be added as new service.</span>}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default PriestServiceTypeahead;
