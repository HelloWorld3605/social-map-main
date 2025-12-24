import React, { createContext, useContext, useState, useEffect } from 'react';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('socialMapNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('socialMapNotes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: `Note ${notes.length + 1}`,
      content: '',
      tabs: [{ id: 'tab1', title: 'Tab 1', content: '', markers: [] }],
      activeTabId: 'tab1',
      createdAt: new Date().toISOString(),
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (noteId, updates) => {
    setNotes(notes.map(note => note.id === noteId ? { ...note, ...updates } : note));
  };

  const deleteNote = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
    if (activeNoteId === noteId) {
      setActiveNoteId(notes.length > 1 ? notes[0].id : null);
    }
  };

  const addTab = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const newTab = {
        id: `tab${note.tabs.length + 1}`,
        title: `Tab ${note.tabs.length + 1}`,
        content: '',
        markers: [],
      };
      updateNote(noteId, {
        tabs: [...note.tabs, newTab],
        activeTabId: newTab.id,
      });
    }
  };

  const updateTab = (noteId, tabId, updates) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updatedTabs = note.tabs.map(tab => tab.id === tabId ? { ...tab, ...updates } : tab);
      updateNote(noteId, { tabs: updatedTabs });
    }
  };

  const deleteTab = (noteId, tabId) => {
    const note = notes.find(n => n.id === noteId);
    if (note && note.tabs.length > 1) {
      const updatedTabs = note.tabs.filter(tab => tab.id !== tabId);
      const newActiveTabId = note.activeTabId === tabId ? updatedTabs[0].id : note.activeTabId;
      updateNote(noteId, { tabs: updatedTabs, activeTabId: newActiveTabId });
    }
  };

  const addMarkerToTab = (noteId, tabId, markerData) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const updatedMarkers = [...(tab.markers || []), { ...markerData, id: Date.now().toString() }];
        updateTab(noteId, tabId, { markers: updatedMarkers });
      }
    }
  };

  const removeMarkerFromTab = (noteId, tabId, markerId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const updatedMarkers = (tab.markers || []).filter(marker => marker.id !== markerId);
        updateTab(noteId, tabId, { markers: updatedMarkers });
      }
    }
  };

  const openNotes = (noteId = null) => {
    setIsNotesOpen(true);
    if (noteId) {
      setActiveNoteId(noteId);
    } else if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  };

  const closeNotes = () => {
    setIsNotesOpen(false);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <NotesContext.Provider value={{
      notes,
      activeNoteId,
      isNotesOpen,
      isPinned,
      addNote,
      updateNote,
      deleteNote,
      addTab,
      updateTab,
      deleteTab,
      openNotes,
      closeNotes,
      togglePin,
      addMarkerToTab,
      removeMarkerFromTab,
    }}>
      {children}
    </NotesContext.Provider>
  );
};
