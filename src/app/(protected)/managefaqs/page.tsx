"use client";
import { useEffect, useState } from "react";

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    // This tells the browser to send your existing id_token cookie automatically
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // If we get a 401, the cookie might have expired
    window.location.href = '/login'; // Or your hosted UI link
    throw new Error('Session expired. Redirecting to login...');
  }

  return response;
};

interface FAQ {
  question: string;
  answer: string;
}

interface SortConfig {
  key: keyof FAQ | null;
  direction: 'asc' | 'desc';
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
        minWidth: '300px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const FAQModal = ({ faq, onClose, onSave, isEdit }: {
  faq: FAQ | null;
  onClose: () => void;
  onSave: (faq: FAQ) => void;
  isEdit: boolean;
}) => {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const updatedFaq: FAQ = {
      question: formData.question,
      answer: formData.answer
    };

    onSave(updatedFaq);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              {isEdit ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${errors.question ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter question"
                rows={2}
              />
              {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${errors.answer ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter answer"
                rows={4}
              />
              {errors.answer && <p className="text-red-500 text-xs mt-1">{errors.answer}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              {isEdit ? 'Update FAQ' : 'Add FAQ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Confirm Delete</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600">Are you sure you want to delete this FAQ?</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const FAQManager = () => {

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 10;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load FAQs from storage on mount
  useEffect(() => {
    loadFaqsFromStorage();
  }, []);

  const loadFaqsFromStorage = async () => {
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        'https://ztu45fmv11.execute-api.us-east-1.amazonaws.com/prod/faqs',  // CloudFront path - update this to match your API Gateway route
        {
          method: 'POST',
          body: JSON.stringify({
            httpMethod: 'GET'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      
      const result = await response.json();
      const data = JSON.parse(result.body);
      setFaqs(data);
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to load FAQs data. Please refresh the page.', 
        type: 'error' 
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sortData = (data: FAQ[]): FAQ[] => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filterData = (data: FAQ[]): FAQ[] => {
    if (!searchTerm) return data;

    return data.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSort = (key: keyof FAQ): void => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredData: FAQ[] = filterData(faqs);
  const sortedData: FAQ[] = sortData(filteredData);

  const totalPages: number = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex: number = (currentPage - 1) * itemsPerPage;
  const paginatedData: FAQ[] = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const getSortIcon = (key: keyof FAQ) => {
    if (sortConfig.key !== key) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const handleAddNew = () => {
    setSelectedFaq(null);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleSave = async (faq: FAQ) => {
    setIsLoading(true);
    try {
      const jsonObj = { question: faq?.question, answer: faq?.answer };
      
      const response = await makeAuthenticatedRequest(
        'https://ztu45fmv11.execute-api.us-east-1.amazonaws.com/prod/faqs',  // CloudFront path - update this to match your API Gateway route
        {
          method: 'POST',
          body: JSON.stringify({
            httpMethod: 'POST',
            body: JSON.stringify(jsonObj)
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to save FAQ');
      }
      
      const result = await response.json();
      if (result?.body) {
        setToast({ message: 'FAQ saved successfully!', type: 'success' });
        await loadFaqsFromStorage();
        setIsModalOpen(false);
      }
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to save FAQ. Please try again.', 
        type: 'error' 
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (faq: any) => {
    const updatedFaqs = faqs.filter(f => f.question !== faq?.question);
    setFaqs(updatedFaqs);
    setIsLoading(true);
    
    try {
      const jsonObj = { question: faq?.question, answer: faq?.answer };
      
      const response = await makeAuthenticatedRequest(
        'https://ztu45fmv11.execute-api.us-east-1.amazonaws.com/prod/faqs',  // CloudFront path - update this to match your API Gateway route
        {
          method: 'POST',
          body: JSON.stringify({
            httpMethod: 'DELETE',
            body: JSON.stringify(jsonObj)
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }
      
      const result = await response.json();
      if (result?.body) {
        setToast({ message: 'FAQ deleted successfully!', type: 'success' });
        setDeleteConfirm(null);
      }
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to delete FAQ. Please try again.', 
        type: 'error' 
      });
      console.error(err);
      // Restore the FAQ if delete failed
      setFaqs(faqs);
    } finally {
      setIsLoading(false);
    }    
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {isModalOpen && (
        <FAQModal
          faq={selectedFaq}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isEdit={isEdit}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Manage FAQs</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New FAQ
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50">
              <input
                type="text"
                placeholder="Search questions and answers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                      <button
                        onClick={() => handleSort('question')}
                        className="flex items-center gap-2 hover:text-blue-600 transition"
                      >
                        Question {getSortIcon('question')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/2">
                      <button
                        onClick={() => handleSort('answer')}
                        className="flex items-center gap-2 hover:text-blue-600 transition"
                      >
                        Answer {getSortIcon('answer')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row: FAQ, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {row.question}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {row.answer}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setDeleteConfirm(row)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No FAQs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page: number) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQManager;