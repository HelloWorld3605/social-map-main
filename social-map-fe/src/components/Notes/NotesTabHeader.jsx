import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';

const NotesTabHeader = () => {
  const { openNoteIds, activeNoteId, notes, closeNoteTab, setActiveNoteId, updateNote } = useNotes();
  const [editingTabId, setEditingTabId] = useState(null);

  const openNotes = notes.filter(note => openNoteIds.includes(note.id));

  const handleTabClick = (noteId) => {
    setActiveNoteId(noteId);
  };

  const handleTabDoubleClick = (noteId) => {
    setEditingTabId(noteId);
  };

  const handleTabTitleChange = (noteId, newTitle) => {
    updateNote(noteId, { title: newTitle });
    setEditingTabId(null);
  };

  const handleDeleteTab = (noteId, e) => {
    e.stopPropagation();
    closeNoteTab(noteId);
  };

  return (
    <div className="notes-tab-header">
      {openNotes.map(note => (
        <div
          key={note.id}
          className={`tab ${activeNoteId === note.id ? 'active' : ''}`}
          onClick={() => handleTabClick(note.id)}
          onDoubleClick={() => handleTabDoubleClick(note.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleTabClick(note.id);
            }
          }}
        >
          {editingTabId === note.id ? (
            <input
              type="text"
              defaultValue={note.title}
              onBlur={(e) => handleTabTitleChange(note.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTabTitleChange(note.id, e.target.value);
                }
              }}
              autoFocus
            />
          ) : (
            <span>{note.title}</span>
          )}
          {openNotes.length > 1 && (
            <button className="delete-tab-btn" onClick={(e) => handleDeleteTab(note.id, e)}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotesTabHeader;
