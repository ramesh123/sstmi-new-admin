import React, { useState, useEffect, useCallback, useRef } from 'react';

const isMobile = window.matchMedia('(max-width: 768px)').matches;

type Transaction = {
  TransactionId: string;
  DevoteeName: string;
  DevoteeEmail: string;
  Amount: number;
  BookedDate: string;
  PaymentType: string;
  ServiceType: string;
  YearMonth: string;
  service_parent?: string;
  service_display?: string;
  service_id?: string;
  IsReversal?: boolean;
};

interface PivotNode {
  id: string;
  label: string;
  amount: number;
  count: number;
  level: 1 | 2 | 3;
  children?: PivotNode[];
  transactions?: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'POOJA': '#E8F5E9',
  'VIGRAHAM': '#FFF3E0',
  'ALAYA_UPKARA': '#F3E5F5',
  'POSHAKA_SEVA': '#E3F2FD',
  'BHOODANA': '#FCE4EC',
  'SEVA_AND_NAIVEDYA': '#E0F2F1',
  'EVENTS': '#FFF9C4',
  'PRIEST_SERVICES': '#F1F8E9',
  'GENERAL_DONATIONS': '#EEEEEE',
  'SPECIAL_PROGRAMS': '#E8EAF6'
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const ITEMS_PER_PAGE = 20;

// Add animation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pivotByYear, setPivotByYear] = useState<PivotNode[]>([]);
  const [pivotByCategory, setPivotByCategory] = useState<PivotNode[]>([]);
  const [pivotByDevotee, setPivotByDevotee] = useState<PivotNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<PivotNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState({ totalAmount: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'byYear' | 'byCategory' | 'byDevotee'>('byYear');
  const [devoteeFilter, setDevoteeFilter] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'detailed'>('recent');
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- NEW: CSV DOWNLOAD LOGIC ---
  const downloadCSV = () => {
    if (transactions.length === 0) return;

    // Define columns for the CSV
    const headers = ["Transaction ID", "Date", "Name", "Email", "Amount", "Service", "Payment Type", "Is Reversal"];
    
    // Map each transaction object to a simple array of strings/numbers
    const csvRows = transactions.map(t => [
      t.TransactionId,
      t.BookedDate,
      `"${t.DevoteeName.replace(/"/g, '""')}"`, // Wrap in quotes to handle names with commas
      t.DevoteeEmail,
      t.IsReversal ? -Math.abs(t.Amount) : t.Amount,
      `"${(t.service_display || t.ServiceType).replace(/"/g, '""')}"`,
      t.PaymentType,
      t.IsReversal ? "Yes" : "No"
    ]);

    // Combine headers and rows into a large string
    const csvString = [headers, ...csvRows].map(row => row.join(",")).join("\n");
    
    // Create a Blob and trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- NEW: HANDLE RECENT CARD CLICK ---
  // This allows the "Recent" tab cards to open the same drawer as the detailed view
  const handleRecentCardClick = (txn: Transaction) => {
    setSelectedRow({
      id: txn.TransactionId,
      label: txn.DevoteeName,
      amount: txn.IsReversal ? -Math.abs(txn.Amount) : txn.Amount,
      count: 1,
      level: 3,
      transactions: [txn] // Pass this single transaction as an array to the drawer
    });
    setDrawerOpen(true);
  };

  const fetchWithRetry = useCallback(
    async (url: string, options: RequestInit, retries: number, delay: number): Promise<Response> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          if (response.status === 401 && retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
          }
          throw new Error(`HTTP ${response.status}`);
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
        const response = await fetchWithRetry(
          `/transactions/transactions?uri=${encodeURIComponent('/transactions/transactions')}`,
          { credentials: 'include' },
          MAX_RETRIES,
          RETRY_DELAY_MS
        );

        if (response.status === 401) {
          throw new Error('Unauthorized - Login expired. Please log in again.');
        }

        const { presignedUrl } = await response.json();

        if (!presignedUrl) {
          throw new Error('No presigned URL received from server');
        }

        const dataResponse = await fetchWithRetry(
          presignedUrl,
          { credentials: 'include' },
          MAX_RETRIES,
          RETRY_DELAY_MS
        );

        const data = await dataResponse.json();

        if (!data?.transactions || typeof data.transactions !== 'object') {
          throw new Error('Invalid transaction payload');
        }

        setLastUpdated(data.last_updated_michigan || null);

        const txns = Object.values(data.transactions) as Transaction[];

        if (!txns || txns.length === 0) {
          throw new Error('No transaction data received');
        }

        const sortedTxns = [...txns].sort((a, b) => 
          new Date(b.BookedDate).getTime() - new Date(a.BookedDate).getTime()
        );

        setTransactions(sortedTxns);
        setDisplayedTransactions(sortedTxns.slice(0, ITEMS_PER_PAGE));
        setHasMore(sortedTxns.length > ITEMS_PER_PAGE);

        const total = txns.reduce((sum, t) => sum + (t.IsReversal ? -Math.abs(t.Amount) : t.Amount), 0);
        setStats({ totalAmount: total, totalTransactions: txns.length });

        setPivotByYear(buildPivotByYear(txns));
        setPivotByCategory(buildPivotByCategory(txns));
        setPivotByDevotee(buildPivotByDevotee(txns));

        const yearIds = buildPivotByYear(txns).map(n => n.id);
        setExpandedNodes(new Set(yearIds));

      } catch (error: any) {
        setError(error.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchWithRetry]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) {
        if (!hasMore) return;
        const currentLength = displayedTransactions.length;
        const newTransactions = transactions.slice(currentLength, currentLength + ITEMS_PER_PAGE);
        setDisplayedTransactions(prev => [...prev, ...newTransactions]);
        setHasMore(currentLength + ITEMS_PER_PAGE < transactions.length);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayedTransactions, hasMore, transactions]);

  // --- START PIVOT LOGIC (Kept as per original) ---
  function buildPivotByYear(txns: Transaction[]): PivotNode[] {
    const calculateAmount = (t: Transaction) => t.IsReversal ? -Math.abs(t.Amount) : t.Amount;
    const yearMap = new Map<string, Map<string, Map<string, Transaction[]>>>();

    txns.forEach(t => {
      const year = t.YearMonth?.substring(0, 4) || 'Unknown';
      const category = t.service_parent || 'GENERAL_DONATIONS';
      const serviceId = t.service_id || 'Unknown';
      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const categoryMap = yearMap.get(year)!;
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const serviceMap = categoryMap.get(category)!;
      if (!serviceMap.has(serviceId)) serviceMap.set(serviceId, []);
      serviceMap.get(serviceId)!.push(t);
    });

    const nodes: PivotNode[] = [];
    Array.from(yearMap.keys()).sort().reverse().forEach(year => {
      const yearChildren: PivotNode[] = [];
      let yearTotal = 0; let yearCount = 0;
      const categoryMap = yearMap.get(year)!;
      Array.from(categoryMap.keys()).sort().forEach(category => {
        const serviceChildren: PivotNode[] = [];
        let categoryTotal = 0; let categoryCount = 0;
        const serviceMap = categoryMap.get(category)!;
        Array.from(serviceMap.keys()).sort().forEach(serviceId => {
          const txnsList = serviceMap.get(serviceId)!;
          const serviceTotal = txnsList.reduce((sum, t) => sum + calculateAmount(t), 0);
          categoryTotal += serviceTotal; categoryCount += txnsList.length;
          serviceChildren.push({ id: `${year}-${category}-${serviceId}`, label: txnsList[0]?.service_display || serviceId, amount: serviceTotal, count: txnsList.length, level: 3, transactions: txnsList });
        });
        yearTotal += categoryTotal; yearCount += categoryCount;
        yearChildren.push({ id: `${year}-${category}`, label: formatCategoryName(category), amount: categoryTotal, count: categoryCount, level: 2, children: serviceChildren });
      });
      nodes.push({ id: year, label: year, amount: yearTotal, count: yearCount, level: 1, children: yearChildren });
    });
    return nodes;
  }

  function buildPivotByCategory(txns: Transaction[]): PivotNode[] {
    const calculateAmount = (t: Transaction) => t.IsReversal ? -Math.abs(t.Amount) : t.Amount;
    const categoryMap = new Map<string, Map<string, Map<string, Transaction[]>>>();
    txns.forEach(t => {
      const category = t.service_parent || 'GENERAL_DONATIONS';
      const serviceId = t.service_id || 'Unknown';
      const year = t.YearMonth?.substring(0, 4) || 'Unknown';
      if (!categoryMap.has(category)) categoryMap.set(category, new Map());
      const serviceMapByYear = categoryMap.get(category)!;
      if (!serviceMapByYear.has(serviceId)) serviceMapByYear.set(serviceId, new Map());
      const yearMap = serviceMapByYear.get(serviceId)!;
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(t);
    });
    const nodes: PivotNode[] = [];
    Array.from(categoryMap.keys()).sort().forEach(category => {
      const serviceChildren: PivotNode[] = [];
      let categoryTotal = 0; let categoryCount = 0;
      const serviceMapByYear = categoryMap.get(category)!;
      Array.from(serviceMapByYear.keys()).sort().forEach(serviceId => {
        const yearMap = serviceMapByYear.get(serviceId)!;
        const yearChildren: PivotNode[] = [];
        let serviceTotal = 0; let serviceCount = 0;
        Array.from(yearMap.keys()).sort().reverse().forEach(year => {
          const txnsList = yearMap.get(year)!;
          const yearTotal = txnsList.reduce((sum, t) => sum + calculateAmount(t), 0);
          serviceTotal += yearTotal; serviceCount += txnsList.length;
          yearChildren.push({ id: `cat-${category}-${serviceId}-${year}`, label: year, amount: yearTotal, count: txnsList.length, level: 3, transactions: txnsList });
        });
        categoryTotal += serviceTotal; categoryCount += serviceCount;
        serviceChildren.push({ id: `cat-${category}-${serviceId}`, label: yearChildren[0]?.transactions?.[0]?.service_display || serviceId, amount: serviceTotal, count: serviceCount, level: 2, children: yearChildren });
      });
      nodes.push({ id: `cat-${category}`, label: formatCategoryName(category), amount: categoryTotal, count: categoryCount, level: 1, children: serviceChildren });
    });
    return nodes;
  }

  function buildPivotByDevotee(txns: Transaction[]): PivotNode[] {
    const calculateAmount = (t: Transaction) => t.IsReversal ? -Math.abs(t.Amount) : t.Amount;
    const devoteeMap = new Map<string, Map<string, Map<string, Transaction[]>>>();
    txns.forEach(t => {
      const devotee = t.DevoteeName || 'Unknown';
      const year = t.YearMonth?.substring(0, 4) || 'Unknown';
      const category = t.service_parent || 'GENERAL_DONATIONS';
      if (!devoteeMap.has(devotee)) devoteeMap.set(devotee, new Map());
      const yearMap = devoteeMap.get(devotee)!;
      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const categoryMap = yearMap.get(year)!;
      if (!categoryMap.has(category)) categoryMap.set(category, []);
      categoryMap.get(category)!.push(t);
    });
    const nodes: PivotNode[] = [];
    Array.from(devoteeMap.keys()).sort().forEach(devotee => {
      const yearChildren: PivotNode[] = [];
      let devoteeTotal = 0; let devoteeCount = 0;
      const yearMap = devoteeMap.get(devotee)!;
      Array.from(yearMap.keys()).sort().reverse().forEach(year => {
        const categoryChildren: PivotNode[] = [];
        let yearTotal = 0; let yearCount = 0;
        const categoryMap = yearMap.get(year)!;
        Array.from(categoryMap.keys()).sort().forEach(category => {
          const txnsList = categoryMap.get(category)!;
          const categoryTotal = txnsList.reduce((sum, t) => sum + calculateAmount(t), 0);
          yearTotal += categoryTotal; yearCount += txnsList.length;
          categoryChildren.push({ id: `dev-${devotee}-${year}-${category}`, label: formatCategoryName(category), amount: categoryTotal, count: txnsList.length, level: 3, transactions: txnsList });
        });
        devoteeTotal += yearTotal; devoteeCount += yearCount;
        yearChildren.push({ id: `dev-${devotee}-${year}`, label: year, amount: yearTotal, count: yearCount, level: 2, children: categoryChildren });
      });
      nodes.push({ id: `dev-${devotee}`, label: devotee, amount: devoteeTotal, count: devoteeCount, level: 1, children: yearChildren });
    });
    return nodes;
  }

  function formatCategoryName(category: string): string {
    return category.replace(/_/g, ' ').split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  }

  function toggleNode(id: string) {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }

  function handleRowClick(node: PivotNode) {
    if (node.transactions?.length) {
      setSelectedRow(node);
      setDrawerOpen(true);
    }
  }

  const getCategoryColor = (id: string): string => {
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
      if (id.includes(key)) return color;
    }
    return '#FAFAFA';
  };

  const renderTree = (nodes: PivotNode[], depth = 0) =>
    nodes.map(node => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = (node.children?.length ?? 0) > 0;
      const isClickable = (node.transactions?.length ?? 0) > 0;
      const bgColor = node.level === 2 ? getCategoryColor(node.id) : 'transparent';
      const isNegative = node.amount < 0;

      return (
        <div key={node.id}>
          <div
            onClick={() => {
              if (hasChildren) toggleNode(node.id);
              if (isClickable) handleRowClick(node);
            }}
            style={{
              display: 'flex', alignItems: 'center',
              paddingLeft: isMobile ? `${Math.max(depth * 12, 0)}px` : `${depth * 24}px`,
              paddingTop: '8px', paddingBottom: '8px', paddingRight: '8px', marginBottom: '2px',
              backgroundColor: bgColor, cursor: (hasChildren || isClickable) ? 'pointer' : 'default',
              borderLeft: node.level === 1 ? '4px solid #1976d2' : 'none',
              borderRadius: '4px', transition: 'all 0.2s',
              fontSize: isMobile && node.level === 1 ? '0.95rem' : isMobile ? '0.85rem' : 'inherit', gap: '4px',
            }}
          >
            <span style={{ width: '16px', marginRight: '4px', fontWeight: 600, flexShrink: 0 }}>
              {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
            </span>
            <span style={{ flex: 1, fontWeight: node.level === 1 ? 700 : node.level === 2 ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.label}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#666', flexShrink: 0 }}>{node.count}</span>
            <span style={{
                minWidth: isMobile ? '80px' : '120px', textAlign: 'right', fontWeight: node.level === 1 ? 700 : 600,
                color: isNegative ? '#c62828' : '#2e7d32', flexShrink: 0
            }}>
              ${Math.abs(node.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {hasChildren && isExpanded && renderTree(node.children!, depth + 1)}
        </div>
      );
    });

  const renderRecentTransactions = () => (
    <div ref={scrollContainerRef} style={{ height: 'calc(100vh - 160px)', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        {displayedTransactions.map((txn) => (
          <div
            key={txn.TransactionId}
            onClick={() => handleRecentCardClick(txn)} // --- UPDATED: RECENT CARD NOW CLICKABLE ---
            style={{
              padding: '12px', marginBottom: '8px', backgroundColor: '#fff', borderRadius: '6px',
              borderLeft: '3px solid #1976d2', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>{txn.DevoteeName}</span>
              <span style={{ fontWeight: 600, color: txn.IsReversal ? '#c62828' : '#2e7d32' }}>
                ${Math.abs(txn.Amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{txn.DevoteeEmail}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
              <span>{txn.BookedDate}</span>
              <span>{txn.service_display || txn.ServiceType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const pivotData = viewMode === 'byYear' ? pivotByYear : viewMode === 'byCategory' ? pivotByCategory : pivotByDevotee;
  const filteredPivotData = viewMode === 'byDevotee' && devoteeFilter
    ? pivotData.filter(node => node.label.toLowerCase().includes(devoteeFilter.toLowerCase()))
    : pivotData;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
      
      {/* --- NEW: COMPACT TOP STATUS BAR --- */}
      {!loading && !error && (
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', backgroundColor: '#eee', borderBottom: '1px solid #ddd' 
        }}>
          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 500 }}>
            {lastUpdated ? `Last Sync: ${lastUpdated}` : 'Syncing...'}
          </span>
          <button 
            onClick={downloadCSV}
            style={{ 
              backgroundColor: '#1976d2', color: '#fff', border: 'none', 
              borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', 
              cursor: 'pointer', fontWeight: 600 
            }}
          >
            Download CSV
          </button>
        </div>
      )}

      {loading && <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}

      {!loading && !error && (
        <>
          {/* TAB NAVIGATION */}
          <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex' }}>
            <button onClick={() => setActiveTab('recent')} style={{
                flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'recent' ? '3px solid #1976d2' : 'none',
                backgroundColor: activeTab === 'recent' ? '#fff' : '#fafafa', color: activeTab === 'recent' ? '#1976d2' : '#666', fontWeight: 600, cursor: 'pointer'
            }}>Recent</button>
            <button onClick={() => setActiveTab('detailed')} style={{
                flex: 1, padding: '12px', border: 'none', borderBottom: activeTab === 'detailed' ? '3px solid #1976d2' : 'none',
                backgroundColor: activeTab === 'detailed' ? '#fff' : '#fafafa', color: activeTab === 'detailed' ? '#1976d2' : '#666', fontWeight: 600, cursor: 'pointer'
            }}>Detailed</button>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'recent' ? renderRecentTransactions() : (
              <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '12px' : '20px' }}>
                
                {/* STATS BREAKDOWN (Without the Last Updated info as it's now at the very top) */}
                <div style={{ backgroundColor: '#fff', padding: '16px', marginBottom: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Total Amount</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', color: '#1976d2', fontWeight: 700 }}>
                        ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Total Txns</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', color: '#1976d2', fontWeight: 700 }}>{stats.totalTransactions}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['byYear', 'byCategory', 'byDevotee'].map(m => (
                      <button key={m} onClick={() => setViewMode(m as any)} style={{
                        padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.8rem',
                        backgroundColor: viewMode === m ? '#1976d2' : '#fff', color: viewMode === m ? '#fff' : '#666'
                      }}>{m.replace('by', 'By ')}</button>
                    ))}
                  </div>

                  {viewMode === 'byDevotee' && (
                    <input type="text" placeholder="Search name..." value={devoteeFilter} onChange={(e) => setDevoteeFilter(e.target.value)}
                      style={{ width: '100%', padding: '10px', marginTop: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  )}
                </div>

                <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {renderTree(filteredPivotData)}
                </div>
              </div>
            )}
          </div>

          {/* DRAWER FOR DETAILS */}
          {drawerOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setDrawerOpen(false)} />
              <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '80vh', backgroundColor: '#fff',
                borderTopLeftRadius: '16px', borderTopRightRadius: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedRow?.label}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{selectedRow?.count} txn(s) • ${selectedRow?.amount.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ overflowY: 'auto', padding: '16px', flex: 1 }}>
                  {selectedRow?.transactions?.map(txn => (
                    <div key={txn.TransactionId} style={{ padding: '12px', marginBottom: '8px', backgroundColor: '#f9f9f9', borderRadius: '6px', borderLeft: '3px solid #1976d2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{txn.DevoteeName}</span>
                        <span style={{ fontWeight: 600, color: txn.IsReversal ? 'red' : 'green' }}>${Math.abs(txn.Amount)}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{txn.DevoteeEmail}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{txn.BookedDate} • {txn.PaymentType}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;