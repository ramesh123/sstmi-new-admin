"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

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

// Proper suppression of findDOMNode warning for React Quill
const originalError = console.error;
if (typeof window !== 'undefined') {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('findDOMNode')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
}) as any;

interface EmailFormData {
  to: string;
  from: string;
  subject: string;
  body: string;
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

const EmailSender: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [emailFormData, setEmailFormData] = useState<EmailFormData>({
    to: '',
    from: 'noreply@sstmi.org',
    subject: '',
    body: ''
  });
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper function to check if a URL is an image
  const isImageUrl = (url: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)(\?.*)?$/i;
    return imageExtensions.test(url);
  };

  // Helper function to check if URL is valid
  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  // Image handler for Quill (handles both file upload and URL paste)
  const imageHandler = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Prompt user to choose between file upload or URL
    const input = prompt('Enter image URL or press Cancel to upload a file:');
    
    if (input !== null) {
      // User entered something (could be empty string or URL)
      const trimmedInput = input.trim();
      
      if (trimmedInput) {
        // User entered a URL
        if (isValidUrl(trimmedInput)) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', trimmedInput);
          quill.setSelection(range.index + 1);
        } else {
          setToast({
            message: 'Please enter a valid URL (must start with http:// or https://)',
            type: 'error'
          });
        }
      } else {
        // User pressed OK with empty input, show file picker
        //triggerFileUpload();
      }
    } else {
      // User pressed Cancel, show file picker
      //triggerFileUpload();
    }
  };

  const triggerFileUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setToast({
            message: 'Image size should be less than 5MB',
            type: 'error'
          });
          return;
        }

        // Convert image to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', base64);
            quill.setSelection(range.index + 1);
          }
        };
        reader.onerror = () => {
          setToast({
            message: 'Failed to read image file',
            type: 'error'
          });
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuillChange = (content: string) => {
    setEmailFormData(prev => ({
      ...prev,
      body: content
    }));
  };

  // Handle paste event to detect image URLs - FIXED VERSION
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      
      if (text && isValidUrl(text) && isImageUrl(text)) {
        // Prevent ALL default paste behavior to ensure it's not inserted as a link
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const range = quill.getSelection(true);
        if (range) {
          // Insert the image at cursor position using insertEmbed (not insertText or paste)
          quill.insertEmbed(range.index, 'image', text);
          quill.setSelection(range.index + 1);
          
          setToast({
            message: 'Image URL inserted successfully',
            type: 'success'
          });
        }
      }
    };

    const editor = quill.root;
    // Use capture phase (true) to intercept BEFORE Quill's default handlers
    editor.addEventListener('paste', handlePaste, true);

    return () => {
      editor.removeEventListener('paste', handlePaste, true);
    };
  }, [isMounted]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const stripHtmlTags = (html: string): string => {
    if (typeof window === 'undefined') return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSendEmail = async () => {
    // Validation
    if (!emailFormData.to || !emailFormData.from || !emailFormData.subject) {
      setToast({
        message: 'Please fill in all required fields (To, From, Subject)',
        type: 'error'
      });
      return;
    }

    if (!validateEmail(emailFormData.to)) {
      setToast({
        message: 'Please enter a valid "To" email address',
        type: 'error'
      });
      return;
    }

    if (!validateEmail(emailFormData.from)) {
      setToast({
        message: 'Please enter a valid "From" email address',
        type: 'error'
      });
      return;
    }

    // const plainTextBody = stripHtmlTags(emailFormData.body);
    // if (!plainTextBody.trim()) {
    //   setToast({
    //     message: 'Email body cannot be empty',
    //     type: 'error'
    //   });
    //   return;
    // }

    setIsLoading(true);

    try {
      const jsonObj = { 
        sender: "noreply@sstmi.org",
        recipient: emailFormData.to, 
        subject: emailFormData.subject, 
        body_text: stripHtmlTags(emailFormData.body), 
        body_html: emailFormData.body 
      };
     
      const response = await makeAuthenticatedRequest(
        "https://u2b0w593t4.execute-api.us-east-1.amazonaws.com/Prod/send-email",  // CloudFront path - update this to match your API Gateway route
        {
          method: "POST",
          body: JSON.stringify(jsonObj)
        }
      );
      
      const data = await response.json();
      
      if (response.ok && (data?.statusCode === 200 || data?.message?.includes('success'))) {
        setToast({ message: 'Email sent successfully!', type: 'success' });
        setEmailFormData({
          to: '',
          from: 'noreply@sstmi.org',
          subject: '',
          body: ''
        });
      } else {
        setToast({ 
          message: data?.message || 'Failed to send email. Please try again.', 
          type: 'error' 
        });
      }       

    } catch (error) {
      console.error('Error sending email:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [
          { list: "ordered" },
          { indent: "-1" },
          { indent: "+1" }
        ],
        ["link", "image", "code-block"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["clean"]
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'image', 'code-block',
    'color', 'background',
    'align'
  ];

  if (!isMounted) {
    return null;
  }

  const defaultValue = `
  <h1>Welcome</h1>
  <p>Thanks for signing up.</p>
  <p>Please find the event details below.</p>
`;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ 
        maxWidth: '900px', 
        margin: '2rem auto', 
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem',
          color: '#1f2937'
        }}>
          Send Email
        </h1>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#1e40af',
            margin: 0,
            lineHeight: '1.5'
          }}>
            <strong>💡 Tip:</strong> To insert images, you can:
            <br />
            • Click the image button in the toolbar and enter a URL or upload a file
            <br />
            • Paste an image URL directly (e.g., https://example.com/image.jpg) - it will be auto-detected and inserted as an image
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* To Field */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              To <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="to"
              value={emailFormData.to}
              onChange={handleEmailInputChange}
              placeholder="recipient@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* From Field */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              From <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="from"
              value={emailFormData.from}
              onChange={handleEmailInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              readOnly
            />
          </div>

          {/* Subject Field */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={emailFormData.subject}
              onChange={handleEmailInputChange}
              placeholder="Enter email subject"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* React Quill Editor */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Message <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px'
            }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"                
                value={emailFormData.body || defaultValue}
                onChange={handleQuillChange}
                modules={modules}
                formats={formats}
                placeholder="Compose your email message here..."
                style={{
                  minHeight: '250px',
                  backgroundColor: 'white'
                }}
              />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.5rem'
            }}>
              {stripHtmlTags(emailFormData.body).length} characters
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendEmail}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              backgroundColor: isLoading ? '#9ca3af' : '#6366f1',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#6366f1';
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sending...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
          min-height: 200px;
        }
        
        .ql-editor {
          min-height: 200px;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .ql-editor img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </>
  );
};

export default EmailSender;