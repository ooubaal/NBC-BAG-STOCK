import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200, 'all'],
  itemName = 'รายการ'
}) => {
  const effectivePageSize = pageSize === 'all' ? (totalItems || 1) : Number(pageSize);
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const endItem = pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * effectivePageSize, totalItems);

  if (totalItems === 0) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    let start = Math.max(2, safeCurrentPage - 1);
    let end = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (safeCurrentPage <= 3) {
      end = 4;
    } else if (safeCurrentPage >= totalPages - 2) {
      start = totalPages - 3;
    }

    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '0.85rem 1.25rem',
      background: 'rgba(255, 255, 255, 0.03)',
      borderTop: '1px solid var(--glass-border)',
      borderRadius: '0 0 12px 12px',
      fontSize: '0.875rem'
    }}>
      {/* Left: Summary text & Page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          แสดง <strong style={{ color: 'var(--text-primary)' }}>{startItem.toLocaleString()} - {endItem.toLocaleString()}</strong> จากทั้งหมด <strong style={{ color: 'var(--accent-color)' }}>{totalItems.toLocaleString()}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>แสดงหน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                onPageSizeChange(val);
                if (onPageChange) onPageChange(1);
              }}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-card, rgba(30, 41, 59, 0.8))',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'ทั้งหมด' : `${opt} รายการ`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* First Page */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            title="หน้าแรก"
            style={{
              padding: '0.35rem 0.5rem',
              minWidth: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: safeCurrentPage === 1 ? 0.4 : 1,
              cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            title="ก่อนหน้า"
            style={{
              padding: '0.35rem 0.5rem',
              minWidth: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: safeCurrentPage === 1 ? 0.4 : 1,
              cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>
                    ...
                  </span>
                );
              }
              const isCurrent = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: isCurrent ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                    background: isCurrent ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                    color: isCurrent ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: isCurrent ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            title="ถัดไป"
            style={{
              padding: '0.35rem 0.5rem',
              minWidth: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: safeCurrentPage === totalPages ? 0.4 : 1,
              cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            title="หน้าสุดท้าย"
            style={{
              padding: '0.35rem 0.5rem',
              minWidth: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: safeCurrentPage === totalPages ? 0.4 : 1,
              cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
