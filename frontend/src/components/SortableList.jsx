import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CardComponent from './CardComponent';
import { MoreHorizontal, Plus, Trash2, X } from 'lucide-react';

export default function SortableList({ list, cards, onAddCard, onOpenCard, onDeleteList, onUpdateTitle, boardMembers, boardLabels }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: list._id,
        data: { type: 'list' }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const [addingCard, setAddingCard] = useState(false);
    const [cardTitle, setCardTitle] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [showMenu, setShowMenu] = useState(false);

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!cardTitle.trim()) return;
        await onAddCard(list._id, cardTitle.trim());
        setCardTitle('');
    };

    const handleTitleBlur = () => {
        if (title.trim() && title !== list.title) onUpdateTitle(list._id, title.trim());
        else setTitle(list.title);
        setEditingTitle(false);
    };

    return (
        <div ref={setNodeRef} style={style} className="list-wrapper">
            <div className="list">
                {/* List header draghandle */}
                <div className="list-header" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                    {editingTitle ? (
                        <textarea
                            className="list-title"
                            value={title}
                            autoFocus
                            onChange={e => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTitleBlur(); } if (e.key === 'Escape') { setTitle(list.title); setEditingTitle(false); } }}
                            rows={1}
                            style={{ cursor: 'text' }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            className="list-title"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={() => setEditingTitle(true)}
                            style={{ cursor: 'text' }}
                        >{title}</div>
                    )}
                    <div style={{ position: 'relative' }}>
                        <button className="list-menu-btn" onMouseDown={e => e.stopPropagation()} onClick={() => setShowMenu(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 'var(--radius)', background: showMenu ? 'rgba(9,30,66,0.08)' : 'transparent', color: '#6B778C', border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }}>
                            <MoreHorizontal size={20} />
                        </button>
                        {showMenu && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={e => { e.stopPropagation(); setShowMenu(false); }} />
                                <div className="popover anim-pop-in" style={{ right: 0, top: '100%', minWidth: 160, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                    <div className="popover-header" style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        List Actions
                                        <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: '#6B778C', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                                    </div>
                                    <div className="popover-item" onClick={() => { setAddingCard(true); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14 }}>
                                        <Plus size={14} /> Add card
                                    </div>
                                    <div className="popover-item danger" onClick={() => { onDeleteList(list._id); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14, color: 'var(--red)' }}>
                                        <Trash2 size={14} /> Delete list
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Cards */}
                <div className="list-cards">
                    <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy} id={list._id}>
                        {cards.map(card => (
                            <CardComponent key={card._id} card={card} listId={list._id} onClick={() => onOpenCard(card._id)} />
                        ))}
                    </SortableContext>
                </div>

                {/* Add card */}
                {addingCard ? (
                    <div className="add-card-form anim-fade-in-up">
                        <form onSubmit={handleAddCard}>
                            <textarea
                                autoFocus
                                className="add-card-input"
                                placeholder="Enter a title for this card..."
                                value={cardTitle}
                                onChange={e => setCardTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') { setAddingCard(false); setCardTitle(''); } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(e); } }}
                                rows={3}
                                style={{
                                    width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: 'none',
                                    boxShadow: 'var(--shadow-sm)', resize: 'none', outline: 'none',
                                    fontFamily: 'inherit', fontSize: 14, color: '#172B4D', marginBottom: 8
                                }}
                            />
                            <div className="add-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button type="submit" className="btn btn-primary" style={{ fontSize: 13, background: 'var(--blue)', color: '#fff', padding: '6px 12px', borderRadius: 'var(--radius)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add card</button>
                                <button type="button" onClick={() => { setAddingCard(false); setCardTitle(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, background: 'transparent', border: 'none', color: '#6B778C', cursor: 'pointer', borderRadius: 'var(--radius)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <button className="add-card-btn hover-lift" onClick={() => setAddingCard(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 'var(--radius)', color: '#5E6C84', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all var(--transition)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(9,30,66,0.08)'; e.currentTarget.style.color = '#172B4D'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5E6C84'; }}>
                        <Plus size={16} /> Add a card
                    </button>
                )}
            </div>
        </div>
    );
}
