import { useState, useEffect, useRef } from 'react';
import { Actions, DockLocation } from 'flexlayout-react';
import { getArticles, getFilterOptions } from '../api/api';
import { FilterPopover, MultiSelectFilter, DateRangeFilter, TextFilter } from './TableFilters';

export default function ArticleTable({ model }) {
    const [articles, setArticles] = useState([]);
    const [metadata, setMetadata] = useState({ categories: [], sources: [], languages: [] });
    const [sortConfig, setSortConfig] = useState({ key: 'pubDate', direction: 'desc' });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activePopup, setActivePopup] = useState(null); // Added activePopup state

    // Active Filters (Applied to Table)
    const [filters, setFilters] = useState({
        title: '',
        category: [],
        source: [],
        language: [],
        start_date: null,
        end_date: null
    });

    // Search Form State (Not Live)
    const [searchForm, setSearchForm] = useState({
        title: '',
        category: [],
        source: [],
        language: [],
        start_date: null,
        end_date: null
    });

    // Load Data & Metadata
    useEffect(() => {
        getFilterOptions().then(setMetadata).catch(console.error);
    }, []);

    useEffect(() => {
        getArticles({
            sort_by: sortConfig.key,
            sort_order: sortConfig.direction,
            ...filters
        }).then(setArticles).catch(console.error);
    }, [sortConfig, filters]);

    const handleSearch = () => {
        setFilters(searchForm);
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Helper to toggle popup
    const togglePopup = (e, key) => {
        e.stopPropagation();
        setActivePopup(activePopup === key ? null : key);
    };

    // Helper for filter change from header
    const handleHeaderFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    return (
        <div style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Search Bar & Advanced Toggle */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchForm.title}
                            onChange={(e) => setSearchForm({ ...searchForm, title: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%',
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        {/* Search Icon (Absolute Left) - Optional, user didn't ask but looks good. Skipping to precise req. */}
                    </div>

                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{
                            background: showAdvanced ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'all 0.2s'
                        }}
                        title="Advanced Search"
                    >
                        {/* Triple Down Arrow Icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="7 13 12 18 17 13"></polyline>
                            <polyline points="7 6 12 11 17 6"></polyline>
                        </svg>
                    </button>
                </div>

                {/* Advanced Search Form (Collapsible) */}
                {showAdvanced && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Date Range</label>
                            <DateRangeFilter
                                start={searchForm.start_date}
                                end={searchForm.end_date}
                                onChange={(s, e) => setSearchForm({ ...searchForm, start_date: s, end_date: e })}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Source</label>
                            <MultiSelectFilter
                                options={metadata.sources}
                                selected={searchForm.source}
                                onChange={v => setSearchForm({ ...searchForm, source: v })}
                                placeholder="All Sources"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Category</label>
                            <MultiSelectFilter
                                options={metadata.categories}
                                selected={searchForm.category}
                                onChange={v => setSearchForm({ ...searchForm, category: v })}
                                placeholder="All Categories"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Language</label>
                            <MultiSelectFilter
                                options={metadata.languages}
                                selected={searchForm.language}
                                onChange={v => setSearchForm({ ...searchForm, language: v })}
                                placeholder="All Languages"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                            <button
                                onClick={handleSearch}
                                className="btn btn-primary"
                                style={{ height: '36px', padding: '0 24px' }}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass-container" style={{ overflow: 'auto', flex: 1 }}>
                <table className="glass-table">
                    <thead>
                        <tr>
                            <SortableFilterHeader
                                label="Published"
                                sortKey="pubDate"
                                filterType="pubDate"
                                sortConfig={sortConfig}
                                filters={filters}
                                activePopup={activePopup}
                                metadata={metadata}
                                onSort={handleSort}
                                onTogglePopup={togglePopup}
                                onFilterChange={handleHeaderFilterChange}
                            />
                            <SortableFilterHeader
                                label="Language"
                                sortKey="language"
                                filterType="language"
                                sortConfig={sortConfig}
                                filters={filters}
                                activePopup={activePopup}
                                metadata={metadata}
                                onSort={handleSort}
                                onTogglePopup={togglePopup}
                                onFilterChange={handleHeaderFilterChange}
                            />
                            <SortableFilterHeader
                                label="Source"
                                sortKey="sourceName"
                                filterType="sourceName"
                                sortConfig={sortConfig}
                                filters={filters}
                                activePopup={activePopup}
                                metadata={metadata}
                                onSort={handleSort}
                                onTogglePopup={togglePopup}
                                onFilterChange={handleHeaderFilterChange}
                            />
                            <SortableFilterHeader
                                label="Category"
                                sortKey="category"
                                filterType="category"
                                sortConfig={sortConfig}
                                filters={filters}
                                activePopup={activePopup}
                                metadata={metadata}
                                onSort={handleSort}
                                onTogglePopup={togglePopup}
                                onFilterChange={handleHeaderFilterChange}
                            />
                            <SortableFilterHeader
                                label="Headline"
                                sortKey="title"
                                width="40%"
                                filterType="title"
                                sortConfig={sortConfig}
                                filters={filters}
                                activePopup={activePopup}
                                metadata={metadata}
                                onSort={handleSort}
                                onTogglePopup={togglePopup}
                                onFilterChange={handleHeaderFilterChange}
                            />
                            <th>AI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map(art => (
                            <tr
                                key={art.id}
                                className="glass-row"
                                onClick={() => {
                                    // Smart Tab Open Logic
                                    const listZone = model.getNodeById("list_zone");
                                    let targetId = "list_zone";
                                    let location = DockLocation.RIGHT;

                                    if (listZone) {
                                        const parent = listZone.getParent();
                                        if (parent && parent.getChildren().length > 1) {
                                            const otherNode = parent.getChildren().find(n => n.getId() !== "list_zone");
                                            if (otherNode) {
                                                targetId = otherNode.getId();
                                                location = DockLocation.CENTER;
                                            }
                                        }
                                    }

                                    model.doAction(Actions.addNode({
                                        type: "tab",
                                        component: "ArticleViewer",
                                        name: art.title.substring(0, 15) + "...",
                                        config: art,
                                        enableClose: true
                                    }, targetId, location, -1));
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Date & Time */}
                                <td style={{ whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 600 }}>{new Date(art.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(art.pubDate).toLocaleDateString()}</div>
                                </td>

                                {/* Language */}
                                <td>
                                    {art.language && (
                                        <span className="badge badge-purple">{art.language.toUpperCase()}</span>
                                    )}
                                </td>

                                {/* Source */}
                                <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                                    {art.sourceName}
                                </td>

                                {/* Category */}
                                <td>
                                    {art.category ? (
                                        <span className="badge badge-blue">{art.category}</span>
                                    ) : <span style={{ opacity: 0.3 }}>-</span>}
                                </td>

                                {/* Headline */}
                                <td style={{ fontWeight: 500, lineHeight: 1.5 }}>
                                    {art.title}
                                </td>

                                {/* Features (Icons) */}
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {art.isSummarized && <span title="AI Summary" style={{ fontSize: '1.1rem' }}>📝</span>}
                                        {art.images && art.images.some(i => i.isAnalyzed) && <span title="Vision Analysis" style={{ fontSize: '1.1rem' }}>👁️</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
// Extracted for stability and performance
const SortableFilterHeader = ({
    label,
    sortKey,
    width,
    filterType,
    sortConfig,
    filters,
    activePopup,
    metadata,
    onSort,
    onTogglePopup,
    onFilterChange
}) => {
    const isSorted = sortConfig.key === sortKey;
    const arrow = isSorted ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↓';
    // Helper to check if a specific filter is active
    const isActive = (type) => {
        if (!type || !filters) return false;
        if (type === 'pubDate') return !!(filters.start_date || filters.end_date);
        return Array.isArray(filters[type]) ? filters[type].length > 0 : !!filters[type];
    }
    const isFiltered = isActive(filterType);

    return (
        <th
            onClick={() => onSort(sortKey)}
            style={{
                cursor: 'pointer',
                width: width,
                userSelect: 'none',
                color: isSorted ? 'var(--accent-color)' : 'var(--text-secondary)',
                position: 'relative'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Filter Trigger */}
                    {filterType && (
                        <div
                            onClick={(e) => onTogglePopup(e, filterType)}
                            style={{
                                padding: '4px',
                                borderRadius: '4px',
                                background: isFiltered ? 'var(--accent-color)' : 'transparent',
                                color: isFiltered ? 'white' : 'inherit',
                                opacity: (isFiltered || activePopup === filterType) ? 1 : 0.4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            title="Filter"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                        </div>
                    )}
                    <span style={{ opacity: isSorted ? 1 : 0.2, fontSize: '1.1rem' }}>{arrow}</span>
                </div>
            </div>

            {/* Filter Popover */}
            {activePopup === filterType && (
                <FilterPopover onClose={() => onTogglePopup({ stopPropagation: () => { } }, filterType)}>

                    {filterType === 'pubDate' && (
                        <DateRangeFilter
                            start={filters.start_date}
                            end={filters.end_date}
                            onChange={(s, e) => onFilterChange({ ...filters, start_date: s, end_date: e })}
                        />
                    )}
                    {filterType === 'category' && (
                        <MultiSelectFilter
                            options={metadata.categories}
                            selected={filters.category}
                            onChange={v => onFilterChange({ ...filters, category: v })}
                            placeholder="Search Categories..."
                        />
                    )}
                    {filterType === 'sourceName' && (
                        <MultiSelectFilter
                            options={metadata.sources}
                            selected={filters.source}
                            onChange={v => onFilterChange({ ...filters, source: v })}
                            placeholder="Search Sources..."
                        />
                    )}
                    {filterType === 'language' && (
                        <MultiSelectFilter
                            options={metadata.languages}
                            selected={filters.language}
                            onChange={v => onFilterChange({ ...filters, language: v })}
                            placeholder="Search Languages..."
                        />
                    )}
                    {filterType === 'title' && (
                        <TextFilter
                            value={filters.title}
                            onChange={v => onFilterChange({ ...filters, title: v })}
                        />
                    )}
                </FilterPopover>
            )}
        </th>
    );
};
