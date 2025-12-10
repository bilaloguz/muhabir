import React, { useState, useEffect, useRef } from 'react';

export const FilterPopover = ({ onClose, children }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '1rem',
            width: '240px',
            zIndex: 100,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            color: 'var(--text-primary)'
        }}
            onClick={(e) => e.stopPropagation()} // Prevent sort click
        >
            {children}
        </div>
    );
};

export const MultiSelectFilter = ({ options, selected = [], onChange, placeholder = "Search..." }) => {
    const [search, setSearch] = useState('');
    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    const toggle = (val) => {
        if (selected.includes(val)) onChange(selected.filter(s => s !== val));
        else onChange([...selected, val]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.85rem'
                }}
            />
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filtered.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', padding: '4px', borderRadius: '4px', background: selected.includes(opt) ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
                        <input
                            type="checkbox"
                            checked={selected.includes(opt)}
                            onChange={() => toggle(opt)}
                            style={{ accentColor: 'var(--accent-color)' }}
                        />
                        {opt}
                    </label>
                ))}
            </div>
            {selected.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textAlign: 'right', cursor: 'pointer' }} onClick={() => onChange([])}>
                    Clear ({selected.length})
                </div>
            )}
        </div>
    );
};

export const DateRangeFilter = ({ start, end, onChange }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</div>
                <input
                    type="datetime-local"
                    value={start || ''}
                    onChange={e => onChange(e.target.value, end)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px',
                        borderRadius: '6px',
                        color: 'white',
                        width: '100%',
                        fontSize: '0.8rem'
                    }}
                />
            </div>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</div>
                <input
                    type="datetime-local"
                    value={end || ''}
                    onChange={e => onChange(start, e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px',
                        borderRadius: '6px',
                        color: 'white',
                        width: '100%',
                        fontSize: '0.8rem'
                    }}
                />
            </div>
            {(start || end) && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textAlign: 'right', cursor: 'pointer' }} onClick={() => onChange(null, null)}>
                    Clear Dates
                </div>
            )}
        </div>
    );
};

export const TextFilter = ({ value, onChange }) => {
    return (
        <div>
            <input
                type="text"
                placeholder="Type to search..."
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                autoFocus
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: 'white',
                    width: '100%',
                    fontSize: '0.9rem'
                }}
            />
            {value && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textAlign: 'right', cursor: 'pointer', marginTop: '8px' }} onClick={() => onChange('')}>
                    Clear
                </div>
            )}
        </div>
    );
};
