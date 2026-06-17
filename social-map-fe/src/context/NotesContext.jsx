import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as noteService from '../services/noteService';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [openNoteIds, setOpenNoteIds] = useState([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce timers per note id — avoid hammering the API on every keystroke
  const saveTimers = useRef({});

  // ── Load notes from backend ────────────────────────────────────────────────
  const fetchNotes = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    setIsLoading(true);
    noteService.getMyNotes()
      .then((data) => setNotes(data))
      .catch((err) => console.error('Failed to load notes:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch on mount (page reload / already logged in)
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Re-fetch when user logs in (App.jsx dispatches 'login' event)
  useEffect(() => {
    const handleLogin = () => fetchNotes();
    window.addEventListener('login', handleLogin);
    return () => window.removeEventListener('login', handleLogin);
  }, [fetchNotes]);

  // Clear notes on logout
  useEffect(() => {
    const handleLogout = () => {
      setNotes([]);
      setActiveNoteId(null);
      setOpenNoteIds([]);
      setIsNotesOpen(false);
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  // ── Debounced save to backend ──────────────────────────────────────────────
  const scheduleSave = useCallback((noteId, updatedNote) => {
    if (saveTimers.current[noteId]) {
      clearTimeout(saveTimers.current[noteId]);
    }
    saveTimers.current[noteId] = setTimeout(async () => {
      try {
        await noteService.updateNote(noteId, {
          title: updatedNote.title,
          tabs: updatedNote.tabs,
          activeTabId: updatedNote.activeTabId,
        });
      } catch (err) {
        console.error('Failed to auto-save note:', err);
      }
    }, 800);
  }, []);

  // ── Core note operations ───────────────────────────────────────────────────

  const addNote = async () => {
    const defaultTabs = [{
      id: 'tab1',
      title: 'Tab 1',
      blocks: [{ id: 'block1', type: 'text', content: '' }],
    }];

    try {
      const newNote = await noteService.createNote({
        title: `Note ${notes.length + 1}`,
        tabs: defaultTabs,
        activeTabId: 'tab1',
      });
      setNotes((prev) => [...prev, newNote]);
      setOpenNoteIds((prev) => [...prev, newNote.id]);
      setActiveNoteId(newNote.id);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  /**
   * updateNote keeps local state in sync immediately (optimistic),
   * then debounces a PUT to the backend.
   */
  const updateNote = useCallback((noteId, updates) => {
    setNotes((prev) => {
      const updatedNotes = prev.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note
      );
      const updatedNote = updatedNotes.find((n) => n.id === noteId);
      if (updatedNote) scheduleSave(noteId, updatedNote);
      return updatedNotes;
    });
  }, [scheduleSave]);

  const deleteNote = async (noteId) => {
    // Cancel any pending save for this note
    if (saveTimers.current[noteId]) {
      clearTimeout(saveTimers.current[noteId]);
      delete saveTimers.current[noteId];
    }

    try {
      await noteService.deleteNote(noteId);
    } catch (err) {
      console.error('Failed to delete note:', err);
      return; // Don't update UI if delete failed
    }

    setNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== noteId);
      setOpenNoteIds((ids) => ids.filter((id) => id !== noteId));
      setActiveNoteId((current) => {
        if (current !== noteId) return current;
        return remaining.length > 0 ? remaining[0].id : null;
      });
      return remaining;
    });
  };

  // ── Tab operations (all go through updateNote → debounced save) ────────────

  const addTab = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const newTab = {
      id: `tab${Date.now()}`,
      title: `Tab ${note.tabs.length + 1}`,
      blocks: [{ id: `block${Date.now()}`, type: 'text', content: '' }],
    };
    updateNote(noteId, {
      tabs: [...note.tabs, newTab],
      activeTabId: newTab.id,
    });
  };

  const updateTab = (noteId, tabId, updates) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const updatedTabs = note.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    );
    updateNote(noteId, { tabs: updatedTabs });
  };

  const deleteTab = (noteId, tabId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.tabs.length <= 1) return;
    const updatedTabs = note.tabs.filter((tab) => tab.id !== tabId);
    const newActiveTabId =
      note.activeTabId === tabId ? updatedTabs[0].id : note.activeTabId;
    updateNote(noteId, { tabs: updatedTabs, activeTabId: newActiveTabId });
  };

  // ── Block operations ───────────────────────────────────────────────────────

  const addBlockToTab = (noteId, tabId, blockData, insertIndex = null) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const tab = note.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const newBlock = { id: `block${Date.now()}`, ...blockData };
    const updatedBlocks = [...(tab.blocks || [])];

    if (insertIndex !== null && insertIndex >= 0 && insertIndex <= updatedBlocks.length) {
      updatedBlocks.splice(insertIndex, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }

    updateTab(noteId, tabId, { blocks: updatedBlocks });
  };

  const updateBlockInTab = (noteId, tabId, blockId, updates) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const tab = note.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const updatedBlocks = (tab.blocks || []).map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    updateTab(noteId, tabId, { blocks: updatedBlocks });
  };

  const removeBlockFromTab = (noteId, tabId, blockId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const tab = note.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const updatedBlocks = (tab.blocks || []).filter((block) => block.id !== blockId);
    updateTab(noteId, tabId, { blocks: updatedBlocks });
  };

  // ── Legacy marker helpers ──────────────────────────────────────────────────

  const addMarkerToTab = (noteId, tabId, markerData) => {
    addBlockToTab(noteId, tabId, { type: 'location', marker: markerData });
  };

  const removeMarkerFromTab = (noteId, tabId, markerId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const tab = note.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const blockToRemove = (tab.blocks || []).find(
      (block) => block.type === 'location' && block.marker?.id === markerId
    );
    if (blockToRemove) removeBlockFromTab(noteId, tabId, blockToRemove.id);
  };

  // ── Panel helpers ──────────────────────────────────────────────────────────

  const openNotes = (noteId = null) => {
    setIsNotesOpen(true);
    if (noteId && !openNoteIds.includes(noteId)) {
      setOpenNoteIds((prev) => [...prev, noteId]);
    }
    if (noteId) {
      setActiveNoteId(noteId);
    } else if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  };

  const closeNoteTab = (noteId) => {
    setOpenNoteIds((prev) => prev.filter((id) => id !== noteId));
    setActiveNoteId((current) => {
      if (current !== noteId) return current;
      const remaining = openNoteIds.filter((id) => id !== noteId);
      return remaining.length > 0 ? remaining[remaining.length - 1] : null;
    });
  };

  const closeNotes = () => setIsNotesOpen(false);

  const togglePin = () => setIsPinned((prev) => !prev);

  return (
    <NotesContext.Provider value={{
      notes,
      activeNoteId,
      setActiveNoteId,
      openNoteIds,
      isNotesOpen,
      isPinned,
      isLoading,
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
      closeNoteTab,
      closeNotes,
      togglePin,
      addMarkerToTab,
      removeMarkerFromTab,
    }}>
      {children}
    </NotesContext.Provider>
  );
};
