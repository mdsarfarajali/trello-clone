import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { Clock, AlignLeft, CheckSquare, MessageSquare, Edit2 } from 'lucide-react';

export default function CardComponent({ card, listId, onClick }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card._id,
        data: { type: 'card', listId }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const hasChecklist = card.checklists?.length > 0;
    const totalItems = card.checklists?.reduce((a, cl) => a + cl.items.length, 0) || 0;
    const doneItems = card.checklists?.reduce((a, cl) => a + cl.items.filter(i => i.completed).length, 0) || 0;

    const getDueBadgeClass = () => {
        if (!card.dueDate) return '';
        if (card.dueDateCompleted) return 'due-done';
        if (isPast(new Date(card.dueDate))) return 'due-overdue';
        if (isToday(new Date(card.dueDate)) || isTomorrow(new Date(card.dueDate))) return 'due-soon';
        return '';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="card hover-lift"
        >
            {/* Cover */}
            {card.cover && (
                <div className="card-cover" style={{ background: card.cover }} />
            )}

            {/* Labels */}
            {card.labelColors?.length > 0 && (
                <div className="card-labels">
                    {card.labelColors.map((color, i) => (
                        <div key={i} className="card-label" style={{ background: color }} />
                    ))}
                </div>
            )}

            {/* Title */}
            <div className="card-title" onClick={(e) => { e.stopPropagation(); onClick(); }}>{card.title}</div>

            {/* Badges */}
            <div className="card-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {card.dueDate && (
                    <span className={`card-badge ${getDueBadgeClass()}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                        <Clock size={12} /> {format(new Date(card.dueDate), 'MMM d')}
                    </span>
                )}
                {card.description && <span className="card-badge" style={{ display: 'flex', alignItems: 'center', color: '#6B778C' }}><AlignLeft size={14} /></span>}
                {hasChecklist && totalItems > 0 && (
                    <span className={`card-badge ${doneItems === totalItems ? 'due-done' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: doneItems === totalItems ? '#fff' : '#6B778C', background: doneItems === totalItems ? '#61BD4F' : 'transparent' }}>
                        <CheckSquare size={12} /> {doneItems}/{totalItems}
                    </span>
                )}
                {card.comments?.length > 0 && (
                    <span className="card-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B778C', fontSize: 12, fontWeight: 500 }}>
                        <MessageSquare size={12} /> {card.comments.length}
                    </span>
                )}
            </div>

            {/* Members */}
            {card.members?.length > 0 && (
                <div className="card-members">
                    {card.members.map(m => (
                        <div key={m._id} className="avatar avatar-sm" style={{ background: m.avatarColor }} title={m.name}>
                            {m.initials}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit button */}
            <button className="card-edit-btn" onClick={e => { e.stopPropagation(); onClick(); }} style={{ position: 'absolute', top: 6, right: 6, background: '#F4F5F7', border: 'none', borderRadius: 'var(--radius)', padding: 6, color: '#42526E', cursor: 'pointer', display: 'flex', opacity: 0, transition: 'opacity 0.2s', boxShadow: 'var(--shadow-sm)' }}>
                <Edit2 size={12} />
            </button>
        </div>
    );
}
