import React, { useState } from 'react';

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

const ImageCarousel = ({ images, index, setIndex }) => {
    const [isLightbox, setIsLightbox] = useState(false);
    const img = images[index];

    const next = (e) => { e && e.stopPropagation(); setIndex((index + 1) % images.length); };
    const prev = (e) => { e && e.stopPropagation(); setIndex((index - 1 + images.length) % images.length); };

    // Handle standard view or lightbox view
    return (
        <>
            <div style={{ position: 'relative', marginBottom: '2.5rem', borderRadius: '16px', overflow: 'hidden', bg: '#000', border: '1px solid var(--glass-border)' }}>
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                    <img
                        src={`http://localhost:8000/static/${img.localPath}`}
                        alt="Gallery"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() => setIsLightbox(true)}
                    />

                    {/* Fullscreen Icon */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsLightbox(true); }}
                        title="Full Screen"
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                    >
                        ⛶
                    </button>
                </div>

                {/* Controls (Inline) */}
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

            {/* Lightbox Overlay */}
            {isLightbox && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                    onClick={() => setIsLightbox(false)}
                >
                    <img
                        src={`http://localhost:8000/static/${img.localPath}`}
                        alt="Fullscreen"
                        style={{ maxHeight: '95vh', maxWidth: '95vw', objectFit: 'contain', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                        onClick={(e) => e.stopPropagation()} // Prevent close on image click
                    />

                    {/* Lightbox Controls */}
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

    // Safely parse JSON tags
    const getTags = (img) => {
        try {
            return img.tags ? JSON.parse(img.tags) : [];
        } catch {
            return [];
        }
    };

    const hasAIContent = article.summary || (article.images && article.images.some(img => img.isAnalyzed));
    const [imgIndex, setImgIndex] = useState(0);

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
                <ImageCarousel images={article.images} index={imgIndex} setIndex={setImgIndex} />
            )}

            {/* --- AI IMAGE ANALYSIS CARD --- */}
            {hasAIContent && (
                <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2.5rem',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)'
                }}>
                    <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        👁️ AI Image Analysis
                    </h3>

                    {/* Vision Analysis */}
                    {article.images && article.images.map((img, idx) => img.isAnalyzed && img.analysis && (
                        <div
                            key={img.id}
                            style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '0.8rem', cursor: 'pointer', border: imgIndex === idx ? '1px solid var(--accent-color)' : '1px solid transparent' }}
                            onClick={() => setImgIndex(idx)}
                        >
                            <div style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                <img
                                    src={`http://localhost:8000/static/${img.localPath}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                    alt="thumb"
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>{img.analysis}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {getTags(img).map((tag, i) => (
                                        <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- AI SUMMARY CARD --- */}
            {hasAIContent && (
                <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2.5rem',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)'
                }}>
                    <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📝 AI Summary
                    </h3>

                    {/* Summary */}
                    {article.summary && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                lineHeight: '1.6',
                                fontSize: '1rem',
                                color: '#e2e8f0',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {article.summary}
                            </div>
                        </div>
                    )}
                </div>
            )}

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

        </div>
    );
}