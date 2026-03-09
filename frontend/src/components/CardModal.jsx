import React, { useState, useRef, useEffect } from 'react';
import API from '../api';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { Tag, Clock, Users, AlignLeft, CheckSquare, MessageSquare, X, Plus, Trash2, Edit2, Check } from 'lucide-react';

const LABEL_COLORS = ['#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46', '#C377E0', '#0079BF', '#00C2E0', '#51E898', '#FF78CB', '#344563'];
const COVER_COLORS = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91', '#4BBF6B', '#00AECC', '#d4edfb', '#f5d5a7'];

export default function CardModal({ card, board, lists, onClose, onUpdate, onDelete, currentUser }) {
    const [data, setData] = useState({ ...card });
    const [saving, setSaving] = useState(false);

    // Panels
    const [showLabels, setShowLabels] = useState(false);
    const [showCover, setShowCover] = useState(false);
    const [showDueDate, setShowDueDate] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const [newComment, setNewComment] = useState('');
    const [addingChecklistTitle, setAddingChecklistTitle] = useState('');
    const [showAddChecklist, setShowAddChecklist] = useState(false);
    const [newCheckItems, setNewCheckItems] = useState({});

    useEffect(() => { setData({ ...card }); }, [card]);

    const saveField = async (fields) => {
        try {
            setSaving(true);
            const res = await API.put(`/cards/${data._id}`, { ...fields });
            setData(res.data);
            onUpdate(res.data);
        } catch { toast.error('Save failed'); } finally { setSaving(false); }
    };

    const handleTitleBlur = (e) => {
        const t = e.target.value.trim();
        if (t && t !== card.title) saveField({ title: t });
    };

    const handleDescriptionBlur = (e) => {
        const d = e.target.value;
        if (d !== card.description) saveField({ description: d });
    };

    const toggleLabel = async (color) => {
        const colors = data.labelColors || [];
        const updated = colors.includes(color) ? colors.filter(c => c !== color) : [...colors, color];
        await saveField({ labelColors: updated });
    };

    const handleDueDateChange = async (e) => {
        await saveField({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
    };

    const toggleDueDateComplete = async () => {
        await saveField({ dueDateCompleted: !data.dueDateCompleted });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await API.post(`/cards/${data._id}/comments`, { text: newComment.trim() });
            setData(res.data);
            onUpdate(res.data);
            setNewComment('');
        } catch { toast.error('Failed to add comment'); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const res = await API.delete(`/cards/${data._id}/comments/${commentId}`);
            setData(res.data);
            onUpdate(res.data);
        } catch { toast.error('Failed to delete comment'); }
    };

    const handleAddChecklist = async (e) => {
        e.preventDefault();
        if (!addingChecklistTitle.trim()) return;
        const updated = [...(data.checklists || []), { title: addingChecklistTitle.trim(), items: [] }];
        await saveField({ checklists: updated });
        setAddingChecklistTitle('');
        setShowAddChecklist(false);
    };

    const toggleChecklistItem = async (clIdx, itemIdx) => {
        const updated = data.checklists.map((cl, ci) =>
            ci !== clIdx ? cl : { ...cl, items: cl.items.map((item, ii) => ii !== itemIdx ? item : { ...item, completed: !item.completed }) }
        );
        await saveField({ checklists: updated });
    };

    const addChecklistItem = async (clIdx) => {
        const text = newCheckItems[clIdx]?.trim();
        if (!text) return;
        const updated = data.checklists.map((cl, ci) =>
            ci !== clIdx ? cl : { ...cl, items: [...cl.items, { text, completed: false }] }
        );
        await saveField({ checklists: updated });
        setNewCheckItems(prev => ({ ...prev, [clIdx]: '' }));
    };

    const deleteChecklist = async (clIdx) => {
        const updated = data.checklists.filter((_, ci) => ci !== clIdx);
        await saveField({ checklists: updated });
    };

    const deleteChecklistItem = async (clIdx, itemIdx) => {
        const updated = data.checklists.map((cl, ci) =>
            ci !== clIdx ? cl : { ...cl, items: cl.items.filter((_, ii) => ii !== itemIdx) }
        );
        await saveField({ checklists: updated });
    };

    const handleDelete = async () => {
        if (!confirm('Delete this card?')) return;
        try {
            await API.delete(`/cards/${data._id}`);
            onDelete(data._id);
        } catch { toast.error('Failed to delete card'); }
    };

    const handleSetCover = async (color) => {
        await saveField({ cover: color });
        setShowCover(false);
    };

    const currentList = lists.find(l => l._id === (data.list?._id || data.list));
    const dueDateForInput = data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '';
    const isOverdue = data.dueDate && isPast(new Date(data.dueDate)) && !data.dueDateCompleted;

    return (
        <div className="modal-overlay anim-fade-in-up" onClick={onClose}>
            <div className="modal anim-pop-in" onClick={e => e.stopPropagation()} style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}>
                <button className="modal-close" onClick={onClose} style={{ top: 16, right: 16, background: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', boxShadow: 'var(--shadow-sm)' }}><X size={18} color="#172B4D" /></button>

                {/* Cover */}
                {data.cover && (
                    <div className="modal-cover" style={{ background: data.cover, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
                )}

                <div className="modal-body">
                    {/* Main Content */}
                    <div className="modal-main">
                        {/* Title */}
                        <textarea
                            className="modal-title-input"
                            defaultValue={data.title}
                            onBlur={handleTitleBlur}
                            rows={2}
                            style={{ marginBottom: 2 }}
                        />
                        <div className="modal-list-label">in list <strong>{currentList?.title || 'Unknown'}</strong></div>

                        {/* Labels display */}
                        {data.labelColors?.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: 20 }}>
                                <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag size={18} color="#172B4D" /> Labels
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {data.labelColors.map((c, i) => (
                                        <div key={i} className="hover-lift" style={{ height: 32, minWidth: 48, background: c, borderRadius: 'var(--radius)', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} onClick={() => setShowLabels(true)} />
                                    ))}
                                    <button className="hover-lift" onClick={() => setShowLabels(v => !v)} style={{ height: 32, padding: '0 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#172B4D' }}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Due Date display */}
                        {data.dueDate && (
                            <div className="modal-section" style={{ marginBottom: 20 }}>
                                <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color="#172B4D" /> Due Date</div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                                    <input type="checkbox" checked={data.dueDateCompleted} onChange={toggleDueDateComplete} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                                    <span style={{ padding: '6px 12px', borderRadius: 'var(--radius)', background: isOverdue ? '#EB5A46' : data.dueDateCompleted ? '#61BD4F' : 'rgba(9,30,66,.04)', color: (isOverdue || data.dueDateCompleted) ? '#fff' : '#172B4D', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {format(new Date(data.dueDate), 'MMM d, yyyy h:mm a')}
                                        {isOverdue && <span style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.2)', borderRadius: 2, fontSize: 11 }}>(overdue)</span>}
                                        {data.dueDateCompleted && <Check size={14} />}
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Members display */}
                        {data.members?.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: 20 }}>
                                <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color="#172B4D" /> Members</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {data.members.map(m => (
                                        <div key={m._id} className="avatar hover-lift" style={{ background: m.avatarColor, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} title={m.name}>{m.initials}</div>
                                    ))}
                                    <button className="hover-lift" onClick={() => setShowMembers(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(9,30,66,.04)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#172B4D' }}><Plus size={16} /></button>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="modal-section" style={{ marginBottom: 24 }}>
                            <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlignLeft size={18} color="#172B4D" /> Description</div>
                            <textarea
                                className="description-area"
                                defaultValue={data.description}
                                onBlur={e => { e.currentTarget.style.background = 'rgba(9,30,66,.04)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(9,30,66,.1)'; handleDescriptionBlur(e); }}
                                placeholder="Add a more detailed description..."
                                rows={4}
                                style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: 'none', background: 'rgba(9,30,66,.04)', boxShadow: 'inset 0 0 0 1px rgba(9,30,66,.1)', fontSize: 14, outline: 'none', transition: 'all var(--transition)' }}
                                onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--blue)'; }}
                            />
                        </div>

                        {/* Checklists */}
                        {data.checklists?.map((cl, clIdx) => {
                            const total = cl.items.length;
                            const done = cl.items.filter(i => i.completed).length;
                            const pct = total ? Math.round((done / total) * 100) : 0;
                            return (
                                <div key={clIdx} className="modal-section checklist" style={{ marginBottom: 24 }}>
                                    <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckSquare size={18} color="#172B4D" /> <span style={{ flex: 1 }}>{cl.title}</span>
                                        <button className="modal-section-action" onClick={() => deleteChecklist(clIdx)} style={{ padding: '6px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#172B4D' }}>Delete</button>
                                    </div>
                                    <div className="checklist-progress" style={{ margin: '8px 0', height: 8, background: 'rgba(9,30,66,.08)', borderRadius: 99, overflow: 'hidden' }}>
                                        <div className="checklist-progress-bar" style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#61BD4F' : '#5AAC44', transition: 'width 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize: 12, color: '#5E6C84', marginBottom: 12, fontWeight: 600 }}>{pct}%</div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                        {cl.items.map((item, itemIdx) => (
                                            <div key={itemIdx} className="checklist-item hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px', borderRadius: 'var(--radius)' }}>
                                                <input type="checkbox" checked={item.completed} onChange={() => toggleChecklistItem(clIdx, itemIdx)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                                                <span className={`checklist-item-text ${item.completed ? 'done' : ''}`} style={{ flex: 1, fontSize: 14, color: item.completed ? '#6B778C' : '#172B4D', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                                                <button onClick={() => deleteChecklistItem(clIdx, itemIdx)} style={{ background: 'none', border: 'none', color: '#6B778C', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Add item */}
                                    <div className="add-checklist-item" style={{ paddingLeft: 32 }}>
                                        <input
                                            className="add-checklist-input"
                                            placeholder="Add an item..."
                                            value={newCheckItems[clIdx] || ''}
                                            onChange={e => setNewCheckItems(prev => ({ ...prev, [clIdx]: e.target.value }))}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(clIdx); } }}
                                            style={{ width: '100%', padding: '8px 12px', border: 'none', borderRadius: 'var(--radius)', background: 'rgba(9,30,66,.04)', boxShadow: 'inset 0 0 0 1px rgba(9,30,66,.1)', fontSize: 14, outline: 'none', marginBottom: 8, transition: 'all var(--transition)' }}
                                            onFocus={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--blue)'; }}
                                        />
                                        <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 12px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }} onClick={() => addChecklistItem(clIdx)}>Add</button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Comments / Activity */}
                        <div className="modal-section">
                            <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} color="#172B4D" /> Activity</div>
                            <div className="comment-form" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                                <div className="avatar" style={{ background: currentUser?.avatarColor, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}>{currentUser?.initials}</div>
                                <div style={{ flex: 1 }}>
                                    <textarea
                                        className="comment-input"
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        rows={1}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius)', border: 'none', background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(9,30,66,.15), var(--shadow-sm)', fontSize: 14, outline: 'none', transition: 'box-shadow var(--transition)', resize: 'vertical', minHeight: 40 }}
                                        onFocus={e => e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--blue), var(--shadow-sm)'}
                                        onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(9,30,66,.15), var(--shadow-sm)'}
                                    />
                                    {newComment && (
                                        <form onSubmit={handleAddComment}>
                                            <button type="submit" className="btn btn-primary" style={{ fontSize: 13, marginTop: 8, padding: '6px 16px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>Save comment</button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {data.comments?.slice().reverse().map(comment => (
                                    <div key={comment._id} className="comment" style={{ display: 'flex', gap: 12 }}>
                                        <div className="avatar avatar-sm" style={{ background: comment.author?.avatarColor, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}>{comment.author?.initials}</div>
                                        <div className="comment-body" style={{ flex: 1 }}>
                                            <div style={{ marginBottom: 4 }}>
                                                <span className="comment-author" style={{ fontWeight: 700, color: '#172B4D', fontSize: 14, marginRight: 8 }}>{comment.author?.name}</span>
                                                <span className="comment-date" style={{ color: '#5E6C84', fontSize: 12 }}>{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <div className="comment-text" style={{ padding: '10px 14px', background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm), inset 0 0 0 1px rgba(9,30,66,0.08)', fontSize: 14, color: '#172B4D', display: 'inline-block', minWidth: 200 }}>{comment.text}</div>
                                            {comment.author?._id === currentUser?._id && (
                                                <div style={{ marginTop: 4 }}>
                                                    <button onClick={() => handleDeleteComment(comment._id)} style={{ fontSize: 12, color: '#5E6C84', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="modal-sidebar">
                        {/* Add to card */}
                        <div style={{ marginBottom: 16 }}>
                            <div className="modal-sidebar-label">Add to card</div>
                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                <button className="sidebar-action-btn hover-lift" onClick={() => setShowMembers(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', color: '#172B4D', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    <Users size={16} /> Members
                                </button>
                                {showMembers && board?.members && (
                                    <div className="popover anim-pop-in" style={{ left: 0, top: '100%', minWidth: 260, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                        <div className="popover-header" style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Board Members</div>
                                        <div style={{ padding: 8 }}>
                                            {board.members.map(m => {
                                                const isMember = data.members?.find(dm => dm._id === m.user._id);
                                                return (
                                                    <div key={m.user._id} className="popover-item hover-lift" onClick={async () => {
                                                        try {
                                                            let res;
                                                            if (isMember) {
                                                                res = await API.delete(`/cards/${data._id}/members/${m.user._id}`);
                                                            } else {
                                                                res = await API.post(`/cards/${data._id}/members`, { userId: m.user._id });
                                                            }
                                                            setData(res.data); onUpdate(res.data);
                                                        } catch { toast.error('Failed'); }
                                                    }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                                                        <div className="avatar avatar-sm" style={{ background: m.user.avatarColor }}>{m.user.initials}</div>
                                                        <span style={{ flex: 1, fontSize: 14, color: '#172B4D', fontWeight: 500 }}>{m.user.name}</span>
                                                        {isMember && <Check size={16} color="#172B4D" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                <button className="sidebar-action-btn hover-lift" onClick={() => setShowLabels(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', color: '#172B4D', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    <Tag size={16} /> Labels
                                </button>
                                {showLabels && (
                                    <div className="popover anim-pop-in" style={{ left: 0, top: '100%', minWidth: 260, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                        <div className="popover-header" style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Labels</div>
                                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {LABEL_COLORS.map(color => (
                                                <div key={color} className="label-option hover-lift" onClick={() => toggleLabel(color)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                    <div className="label-swatch" style={{ background: color, height: 32, flex: 1, borderRadius: 'var(--radius)' }} />
                                                    {data.labelColors?.includes(color) && <Check size={16} color="#172B4D" style={{ marginLeft: 'auto' }} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                <button className="sidebar-action-btn hover-lift" onClick={() => setShowDueDate(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', color: '#172B4D', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    <Clock size={16} /> Due Date
                                </button>
                                {showDueDate && (
                                    <div className="popover anim-pop-in" style={{ left: 0, top: '100%', padding: 16, minWidth: 260, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                        <div className="popover-header" style={{ paddingBottom: 12, borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Due Date</div>
                                        <input
                                            type="datetime-local"
                                            className="due-date-input"
                                            value={dueDateForInput}
                                            onChange={handleDueDateChange}
                                            style={{ margin: '16px 0', width: '100%', padding: '10px 12px', border: '1px solid #DFE1E6', borderRadius: 'var(--radius)', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                        {data.dueDate && (
                                            <button className="btn btn-danger hover-lift" onClick={() => { saveField({ dueDate: null }); setShowDueDate(false); }} style={{ padding: '8px 12px', background: 'rgba(235,90,70,.1)', color: '#EB5A46', border: 'none', borderRadius: 'var(--radius)', width: '100%', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', marginBottom: 8 }}>
                                <button className="sidebar-action-btn hover-lift" onClick={() => setShowAddChecklist(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', color: '#172B4D', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    <CheckSquare size={16} /> Checklist
                                </button>
                                {showAddChecklist && (
                                    <div className="popover anim-pop-in" style={{ left: 0, top: '100%', padding: 16, minWidth: 260, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                        <div className="popover-header" style={{ paddingBottom: 12, borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Add Checklist</div>
                                        <form onSubmit={handleAddChecklist} style={{ paddingTop: 16 }}>
                                            <input
                                                autoFocus
                                                className="add-checklist-input"
                                                style={{ width: '100%', marginBottom: 12, padding: '8px 12px', border: '1px solid #DFE1E6', borderRadius: 'var(--radius)', outline: 'none', fontFamily: 'inherit', fontSize: 14 }}
                                                value={addingChecklistTitle}
                                                onChange={e => setAddingChecklistTitle(e.target.value)}
                                                placeholder="Checklist title"
                                            />
                                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                <button className="sidebar-action-btn hover-lift" onClick={() => setShowCover(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(9,30,66,.04)', border: 'none', borderRadius: 'var(--radius)', color: '#172B4D', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    <span style={{ fontSize: 16 }}>🎨</span> Cover
                                </button>
                                {showCover && (
                                    <div className="popover anim-pop-in" style={{ left: 0, top: '100%', minWidth: 260, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }}>
                                        <div className="popover-header" style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Card Cover</div>
                                        <div className="color-grid" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            {COVER_COLORS.map(c => (
                                                <div key={c} className="color-swatch hover-lift" style={{ background: c, height: 48, borderRadius: 'var(--radius)', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} onClick={() => handleSetCover(c)} />
                                            ))}
                                        </div>
                                        {data.cover && <div className="popover-item hover-lift" onClick={() => { saveField({ cover: null }); setShowCover(false); }} style={{ padding: '12px 14px', textAlign: 'center', color: '#5E6C84', cursor: 'pointer', borderTop: '1px solid #DFE1E6' }}>Remove cover</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div>
                            <div className="modal-sidebar-label" style={{ fontSize: 12, fontWeight: 700, color: '#5E6C84', marginBottom: 8 }}>Actions</div>
                            <button className="sidebar-action-btn danger hover-lift" onClick={handleDelete} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(235,90,70,.1)', border: 'none', borderRadius: 'var(--radius)', color: '#EB5A46', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'var(--transition)' }}>
                                <Trash2 size={16} /> Delete Card
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
