import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';

const NotesTabHeader = ({ note }) => {
  const { updateNote, addTab, deleteTab } = useNotes();
  const [editingTabId, setEditingTabId] = useState(null);

  const handleTabClick = (tabId) => {
    updateNote(note.id, { activeTabId: tabId });
  };

  const handleTabDoubleClick = (tabId) => {
    setEditingTabId(tabId);
  };

  const handleTabTitleChange = (tabId, newTitle) => {
    updateNote(note.id, { tabs: note.tabs.map(tab => tab.id === tabId ? { ...tab, title: newTitle } : tab) });
    setEditingTabId(null);
  };

  const handleAddTab = () => {
    addTab(note.id);
  };

  const handleDeleteTab = (tabId, e) => {
    e.stopPropagation();
    deleteTab(note.id, tabId);
  };

  return (
    <div className="notes-tab-header">
      {note.tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab ${note.activeTabId === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
          onDoubleClick={() => handleTabDoubleClick(tab.id)}
        >
          {editingTabId === tab.id ? (
            <input
              type="text"
              defaultValue={tab.title}
              onBlur={(e) => handleTabTitleChange(tab.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTabTitleChange(tab.id, e.target.value);
                }
              }}
              autoFocus
            />
          ) : (
            <span>{tab.title}</span>
          )}
          {note.tabs.length > 1 && (
            <button className="delete-tab-btn" onClick={(e) => handleDeleteTab(tab.id, e)}>
              ×
            </button>
          )}
        </div>
      ))}
      <button className="add-tab-btn" onClick={handleAddTab}>+</button>
    </div>
  );
};

export default NotesTabHeader;
