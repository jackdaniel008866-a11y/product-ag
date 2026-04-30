import { useState, useRef } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Copy, Check, Filter } from 'lucide-react';
import type { Initiative, Product } from '../../types';
import { useUsers } from '../../contexts/UserContext';

interface DigestViewProps {
  initiatives: Initiative[];
}

type DateLookback = 7 | 14 | 30;

const ALL_PRODUCTS = 'All Products';

export default function DigestView({ initiatives }: DigestViewProps) {
  const { usersList } = useUsers();
  const [lookbackDays, setLookbackDays] = useState<DateLookback>(14);
  const [selectedProduct, setSelectedProduct] = useState<Product | typeof ALL_PRODUCTS>(ALL_PRODUCTS);
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopyClick = () => {
    if (!contentRef.current) return;
    
    // Modern approach for copying rich text to clipboard for emails
    try {
      const html = contentRef.current.innerHTML;
      // We also provide a plain text fallback
      const text = contentRef.current.innerText;
      
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([text], { type: 'text/plain' });
      
      const data = [new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      })];
      
      navigator.clipboard.write(data).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback method for older browsers
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('copy');
      selection?.removeAllRanges();
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };



  const getDevNames = (devIds: string[] | undefined) => {
    if (!devIds || devIds.length === 0) return '';
    return devIds.map(id => usersList.find(u => u.id === id)?.name || 'Unknown').join(', ');
  };

  // Filter by Product First
  const productFiltered = selectedProduct === ALL_PRODUCTS 
    ? initiatives 
    : initiatives.filter(i => i.product === selectedProduct);

  // Grouping
  const now = new Date();
  
  const shipped = productFiltered.filter(i => 
    i.status === 'Deployed' && 
    differenceInDays(now, parseISO(i.stageUpdatedAt)) <= lookbackDays
  );

  const active = productFiltered.filter(i => 
    i.status === 'Active' && 
    ['Planning', 'Execution', 'Testing'].includes(i.stage)
  );

  const blocked = productFiltered.filter(i => i.status === 'Blocked');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Sprint Digest Generator
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Instantly format your updates for email or presentations.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Filter size={16} className="text-slate-500 ml-2 mr-1" />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value as Product | typeof ALL_PRODUCTS)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 py-1.5 cursor-pointer pr-4"
            >
              <option value={ALL_PRODUCTS}>All Products</option>
              <option value="Surbo">Surbo</option>
              <option value="Surbo Chat">Surbo Chat</option>
              <option value="Surbo Ace">Surbo Ace</option>
              <option value="AI Voicebot">AI Voicebot</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setLookbackDays(days as DateLookback)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  lookbackDays === days
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isCopied 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
            }`}
          >
            {isCopied ? <Check size={18} /> : <Copy size={18} />}
            {isCopied ? 'Copied to Clipboard!' : 'Copy for Email'}
          </button>
        </div>
      </div>

      {/* Digest Preview Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8">
          <div ref={contentRef} className="text-slate-800 dark:text-slate-200" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
            
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }} className="dark:text-white">
              Sprint Digest: {selectedProduct} (Past {lookbackDays} Days)
            </h1>
            <p style={{ marginBottom: '24px', color: '#64748b' }} className="dark:text-slate-400">
              Here is a summary of our progress, current priorities, and any blockers.
            </p>

            {/* SECTION: Shipped */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#059669', borderBottom: '2px solid #059669', paddingBottom: '8px', marginBottom: '16px' }}>
                🚀 Shipped & Deployed
              </h2>
              {shipped.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic' }} className="dark:text-slate-400">No recent deployments in this timeframe.</p>
              ) : (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {shipped.map(item => (
                    <li key={item.id} style={{ marginBottom: '12px' }}>
                      <strong>{item.title}</strong>
                      {item.product && selectedProduct === ALL_PRODUCTS && <span style={{ color: '#64748b', fontSize: '0.9em' }}> [{item.product}]</span>}
                      <br/>
                      <span style={{ color: '#475569', fontSize: '0.95em' }} className="dark:text-slate-300">{item.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SECTION: In Progress */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb', borderBottom: '2px solid #2563eb', paddingBottom: '8px', marginBottom: '16px' }}>
                🔥 In Active Development
              </h2>
              {active.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic' }} className="dark:text-slate-400">No items currently in execution.</p>
              ) : (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {active.map(item => (
                    <li key={item.id} style={{ marginBottom: '12px' }}>
                      <strong>{item.title}</strong> - <span style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.9em' }}>Stage: {item.stage} 
                      {item.developers?.length ? ` | Dev: ${getDevNames(item.developers)}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SECTION: Blocked */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #dc2626', paddingBottom: '8px', marginBottom: '16px' }}>
                🛑 Blocked / Needs Attention
              </h2>
              {blocked.length === 0 ? (
                <p style={{ color: '#64748b', fontStyle: 'italic' }} className="dark:text-slate-400">No blocked items! Everything is moving smoothly.</p>
              ) : (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {blocked.map(item => (
                    <li key={item.id} style={{ marginBottom: '12px' }}>
                      <strong>{item.title}</strong>
                      <br/>
                      <span style={{ color: '#ef4444', fontSize: '0.95em', fontWeight: '500' }}>Reason: {item.blockerReason || 'No reason provided.'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
