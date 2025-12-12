import React, { useState, useEffect } from 'react';
import { API_URL, updateArticle, updateImage, updateImageContent, createImage } from '../api/api';
import ImageEditor from './ImageEditor';

const Badge = ({ children, color = 'rgba(255, 255, 255, 0.1)' }) => (
    <span style={{
        background: color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '500',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
    }}>
        {children}
    </span>
);

const InlineEdit = ({ value, onSave, multiline = false, style = {} }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    // Sync tempValue when value prop changes
    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    if (isEditing) {
        return (
            <div style={{ position: 'relative', width: '100%' }}>
                {multiline ? (
                    <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        autoFocus
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--accent-color)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '8px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none',
                            ...style
                        }}
                    />
                ) : (
                    <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        autoFocus
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--accent-color)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            ...style
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Click to edit"
            style={{
                cursor: 'pointer',
                border: '1px solid transparent',
                borderRadius: '4px',
                padding: '2px',
                transition: 'all 0.2s',
                minHeight: '24px',
                ...style
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
            {value || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Click to add...</span>}
        </div>
    );
};

const ImageCarousel = ({ images, index, setIndex, onEdit, refreshKey }) => {
    const [isLightbox, setIsLightbox] = useState(false);
    const img = images[index];

    const next = (e) => { e && e.stopPropagation(); setIndex((index + 1) % images.length); };
    const prev = (e) => { e && e.stopPropagation(); setIndex((index - 1 + images.length) % images.length); };

    return (
        <>
            <div style={{ position: 'relative', marginBottom: '2.5rem', borderRadius: '16px', overflow: 'hidden', bg: '#000', border: '1px solid var(--glass-border)' }}>
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                    <img
                        src={`${API_URL}/static/${img.localPath}?t=${new Date(img.updatedAt || img.createdAt).getTime()}&r=${refreshKey}`}
                        alt="Gallery"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() => setIsLightbox(true)}
                    />

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsLightbox(true); }}
                        title="Full Screen"
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                    >
                        ⛶
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(img); }}
                        title="Edit Image"
                        style={{ position: 'absolute', top: '1rem', right: '3.5rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                    >
                        ✏️
                    </button>
                </div>

                {images.length > 1 && (
                    <>
                        <button onClick={prev} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '48px', height: '48px', fontSize: '1.5rem', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                        <button onClick={next} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '48px', height: '48px', fontSize: '1.5rem', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', color: '#fff' }}>
                            {index + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {isLightbox && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                    onClick={() => setIsLightbox(false)}
                >
                    <img
                        src={`${API_URL}/static/${img.localPath}?t=${new Date(img.updatedAt || img.createdAt).getTime()}&r=${refreshKey}`}
                        alt="Fullscreen"
                        style={{ maxHeight: '95vh', maxWidth: '95vw', objectFit: 'contain', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button onClick={() => setIsLightbox(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '1.5rem', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>✕</button>

                    {images.length > 1 && (
                        <>
                            <button onClick={prev} style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '64px', height: '64px', fontSize: '2rem', cursor: 'pointer' }}>‹</button>
                            <button onClick={next} style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '64px', height: '64px', fontSize: '2rem', cursor: 'pointer' }}>›</button>
                        </>
                    )}

                    <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: 'white', opacity: 0.7 }}>
                        {index + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
};

const AccordionCard = ({ title, icon, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            marginBottom: '2.5rem',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(5px)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                }}
            >
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {icon} {title}
                </h3>
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'var(--text-secondary)',
                    fontSize: '1.2rem'
                }}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <div style={{
                    padding: '0 1.5rem 1.5rem 1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default function ArticleViewer({ article }) {
    if (!article) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📰</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No Article Selected</h3>
                <p style={{ opacity: 0.7 }}>Select an article from the table to start reading.</p>
            </div>
        );
    }

    const hasAIContent = true; // Always show sections so they can be edited (added)
    const [imgIndex, setImgIndex] = useState(0);
    const [editingImage, setEditingImage] = useState(null); // Image object being edited

    const [refreshKey, setRefreshKey] = useState(0);

    const handleSaveImageEdit = async (blob) => {
        try {
            const newImage = await createImage(article.id, blob);

            if (newImage) {
                // Add new image to article.images
                article.images.push(newImage);
                // Switch to new image
                setImgIndex(article.images.length - 1);
            }

            setEditingImage(null);
            setRefreshKey(prev => prev + 1); // Force refresh of images
        } catch (e) {
            console.error("Failed to save edited image", e);
            alert("Failed to save image");
        }
    };

    // Helpers for updates
    const handleSummaryUpdate = async (newSummary) => {
        try {
            await updateArticle(article.id, { summary: newSummary });
            article.summary = newSummary; // Optimistic update
        } catch (e) {
            console.error("Failed to update summary", e);
            alert("Failed to save summary");
        }
    };

    const handleImageUpdate = async (img, field, value) => {
        try {
            const updateData = { [field]: value };
            await updateImage(img.id, updateData);
            img[field] = value; // Optimistic update
        } catch (e) {
            console.error(`Failed to update image ${field}`, e);
        }
    };

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: 'transparent' }}>

            {/* --- HEADER SECTION --- */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    margin: '0 0 1rem 0',
                    color: 'var(--text-primary)',
                    lineHeight: '1.2',
                    fontFamily: '"Merriweather", "Georgia", serif',
                    fontWeight: '700'
                }}>
                    {article.title}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${new URL(article.url).hostname}&sz=32`}
                            alt="icon"
                            style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{article.sourceName}</span>
                    </div>

                    {article.category && (
                        <Badge color="rgba(56, 189, 248, 0.15)">
                            📂 {article.category}
                        </Badge>
                    )}

                    {article.language && (
                        <Badge color="rgba(168, 85, 247, 0.15)">
                            🌐 {article.language.toUpperCase()}
                        </Badge>
                    )}

                    <span>•</span>
                    <span>{new Date(article.pubDate).toLocaleString('tr-TR', { hour12: false })}</span>
                    <a href={article.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted currentColor' }}>
                        Open Original ↗
                    </a>
                </div>
            </div>

            {/* --- VISUAL GALLERY (CAROUSEL) --- */}
            {article.images && article.images.length > 0 && (
                <ImageCarousel images={article.images} index={imgIndex} setIndex={setImgIndex} onEdit={setEditingImage} refreshKey={refreshKey} />
            )}

            {/* --- AI IMAGE ANALYSIS CARD --- */}
            {article.images && article.images.length > 0 && (
                <AccordionCard title="AI Image Analysis" icon="👁️" defaultOpen={false}>
                    {article.images.map((img, idx) => (
                        <div
                            key={img.id}
                            style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '0.8rem', cursor: 'pointer', border: imgIndex === idx ? '1px solid var(--accent-color)' : '1px solid transparent' }}
                            onClick={() => setImgIndex(idx)}
                        >
                            <div style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                <img
                                    src={`${API_URL}/static/${img.localPath}?t=${new Date(img.updatedAt || img.createdAt).getTime()}&r=${refreshKey}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                    alt="thumb"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                                    <InlineEdit
                                        value={img.analysis}
                                        onSave={(val) => handleImageUpdate(img, 'analysis', val)}
                                        multiline
                                    />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5, marginRight: '4px' }}>tags:</span>
                                    <div style={{ flex: 1 }}>
                                        <InlineEdit
                                            value={img.tags}
                                            onSave={(val) => handleImageUpdate(img, 'tags', val)}
                                            style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </AccordionCard>
            )}


            {/* --- IMAGE EDITOR MODAL --- */}
            {
                editingImage && (
                    <ImageEditor
                        imageId={editingImage.id}
                        imageUrl={`${API_URL}/static/${editingImage.localPath}?t=${new Date(editingImage.updatedAt || editingImage.createdAt).getTime()}&r=${refreshKey}`}
                        onSave={handleSaveImageEdit}
                        onCancel={() => setEditingImage(null)}
                    />
                )
            }

            {/* --- AI SUMMARY CARD --- */}
            <AccordionCard title="AI Summary" icon="📝" defaultOpen={false}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        lineHeight: '1.6',
                        fontSize: '1rem',
                        color: '#e2e8f0',
                        whiteSpace: 'pre-wrap'
                    }}>
                        <InlineEdit
                            value={article.summary}
                            onSave={handleSummaryUpdate}
                            multiline
                        />
                    </div>
                </div>
            </AccordionCard>

            {/* --- MAIN CONTENT --- */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', marginBottom: '2.5rem' }} />

            <div style={{
                lineHeight: '1.9',
                fontSize: '1.125rem',
                whiteSpace: 'pre-wrap',
                color: '#d1d5db',
                maxWidth: '750px',
                margin: '0 auto',
                fontFamily: '"Inter", system-ui, sans-serif'
            }}>
                {article.content}
            </div>

        </div >
    );
}