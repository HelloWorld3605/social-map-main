import React from 'react';
import { useNotes } from '../../context/NotesContext';

const NotesSidebar = () => {
  const { notes, activeNoteId, addNote, openNotes } = useNotes();

  return (
    <div className="notes-sidebar">
      <div className="sidebar-header">
        <button className="add-note-btn" onClick={addNote}>
          + Ghi chú mới
        </button>
      </div>
      <div className="notes-list">
        {notes.map(note => (
          <div
            key={note.id}
            className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
            onClick={() => openNotes(note.id)}
          >
            <div className="note-title">{note.title}</div>
            <div className="note-date">{new Date(note.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesSidebar;
