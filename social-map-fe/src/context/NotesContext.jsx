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
      tabs: [{
        id: 'tab1',
        title: 'Tab 1',
        blocks: [{ id: 'block1', type: 'text', content: '' }]
      }],
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
        blocks: [{ id: `block${Date.now()}`, type: 'text', content: '' }],
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

  // Block management functions
  const addBlockToTab = (noteId, tabId, blockData, insertIndex = null) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const newBlock = {
          id: `block${Date.now()}`,
          ...blockData
        };
        let updatedBlocks = [...(tab.blocks || [])];

        if (insertIndex !== null && insertIndex >= 0 && insertIndex <= updatedBlocks.length) {
          updatedBlocks.splice(insertIndex, 0, newBlock);
        } else {
          updatedBlocks.push(newBlock);
        }

        updateTab(noteId, tabId, { blocks: updatedBlocks });
      }
    }
  };

  const updateBlockInTab = (noteId, tabId, blockId, updates) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const updatedBlocks = (tab.blocks || []).map(block =>
          block.id === blockId ? { ...block, ...updates } : block
        );
        updateTab(noteId, tabId, { blocks: updatedBlocks });
      }
    }
  };

  const removeBlockFromTab = (noteId, tabId, blockId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const updatedBlocks = (tab.blocks || []).filter(block => block.id !== blockId);
        updateTab(noteId, tabId, { blocks: updatedBlocks });
      }
    }
  };

  // Legacy functions for backward compatibility
  const addMarkerToTab = (noteId, tabId, markerData) => {
    addBlockToTab(noteId, tabId, { type: 'location', marker: markerData });
  };

  const removeMarkerFromTab = (noteId, tabId, markerId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const tab = note.tabs.find(t => t.id === tabId);
      if (tab) {
        const blockToRemove = (tab.blocks || []).find(block =>
          block.type === 'location' && block.marker?.id === markerId
        );
        if (blockToRemove) {
          removeBlockFromTab(noteId, tabId, blockToRemove.id);
        }
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
      addBlockToTab,
      updateBlockInTab,
      removeBlockFromTab,
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
