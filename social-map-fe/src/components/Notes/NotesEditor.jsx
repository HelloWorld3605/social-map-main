import React, { useRef, useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import LocationNote from './LocationNote';

const NotesEditor = ({ note }) => {
  const { updateTab, addMarkerToTab, removeMarkerFromTab } = useNotes();
  const editorRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const activeTab = note.tabs.find(tab => tab.id === note.activeTabId);

  const handleContentChange = (content) => {
    updateTab(note.id, activeTab.id, { content });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const markerData = e.dataTransfer.getData('application/json');
    if (markerData) {
      const marker = JSON.parse(markerData);
      addMarkerToTab(note.id, activeTab.id, marker);
    }
  };

  // Listen for addMarkerToNotes event
  useEffect(() => {
    const handleAddMarkerToNotes = (event) => {
      const markerData = event.detail;
      addMarkerToTab(note.id, activeTab.id, markerData);
    };

    document.addEventListener('addMarkerToNotes', handleAddMarkerToNotes);

    return () => {
      document.removeEventListener('addMarkerToNotes', handleAddMarkerToNotes);
    };
  }, [activeTab, addMarkerToTab, note.id]);

  const handleRemoveMarker = (noteId, tabId, markerId) => {
    removeMarkerFromTab(noteId, tabId, markerId);
  };

  return (
    <div
      className={`notes-editor ${isDragOver ? 'drag-over' : ''}`}
      ref={editorRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Render LocationNote components */}
      {activeTab && activeTab.markers && activeTab.markers.map(marker => (
        <LocationNote
          key={marker.id}
          marker={marker}
          onRemove={handleRemoveMarker}
          noteId={note.id}
          tabId={activeTab.id}
        />
      ))}

      <textarea
        value={activeTab ? activeTab.content : ''}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing your note here... You can drag location markers here to add annotations."
        className="notes-textarea"
      />
    </div>
  );
};

export default NotesEditor;
