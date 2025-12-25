import React, { useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNotes } from '../../context/NotesContext';
import LocationNote from './LocationNote';

const NotesEditor = ({ note }) => {
  const { updateBlockInTab, addBlockToTab, removeBlockFromTab } = useNotes();
  const editorRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [insertIndicatorIndex, setInsertIndicatorIndex] = useState(null);

  const activeTab = note.tabs.find(tab => tab.id === note.activeTabId);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);

    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const isNearBottom = e.clientY > rect.bottom - 30;

      if (isNearBottom) {
        setInsertIndicatorIndex(activeTab.blocks.length);
      } else {
        setInsertIndicatorIndex(null);
      }
    }
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
      // Insert location block at insert indicator position
      const insertIndex = insertIndicatorIndex !== null ? insertIndicatorIndex : activeTab.blocks.length;
      addBlockToTab(note.id, activeTab.id, { type: 'location', marker }, insertIndex);
      setInsertIndicatorIndex(null);
    }
  };

  // Listen for addMarkerToNotes event
  useEffect(() => {
    const handleAddMarkerToNotes = (event) => {
      const markerData = event.detail;
      // Insert location block at cursor position
      addBlockToTab(note.id, activeTab.id, { type: 'location', marker: markerData }, activeTab.blocks.length);
    };

    document.addEventListener('addMarkerToNotes', handleAddMarkerToNotes);

    return () => {
      document.removeEventListener('addMarkerToNotes', handleAddMarkerToNotes);
    };
  }, [activeTab, addBlockToTab, note.id]);

  const handleBlockChange = (blockId, content) => {
    flushSync(() => {
      updateBlockInTab(note.id, activeTab.id, blockId, { content });
    });
  };

  const handleBlockKeyDown = (e, blockId, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Insert new text block before current block
      addBlockToTab(note.id, activeTab.id, { type: 'text', content: '' }, index);
    } else if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
      e.preventDefault();
      // Remove empty block if not the last one
      if (activeTab.blocks.length > 1) {
        removeBlockFromTab(note.id, activeTab.id, blockId);
      }
    }
  };

  const handleRemoveBlock = (blockId) => {
    removeBlockFromTab(note.id, activeTab.id, blockId);
  };

  const handleBlockMouseEnter = (index) => {
    if (isDragOver) {
      setInsertIndicatorIndex(index);
    }
  };

  const handleBlockMouseLeave = () => {
    setInsertIndicatorIndex(null);
  };

  const handleDragOverBlock = (e, index) => {
    e.preventDefault();
    setInsertIndicatorIndex(index);
  };

  return (
    <div
      className={`notes-editor ${isDragOver ? 'drag-over' : ''}`}
      ref={editorRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="notes-editor-flow">
        {activeTab && activeTab.blocks && activeTab.blocks.map((block, index) => {
          const showInsertIndicator = insertIndicatorIndex === index;

          return (
            <React.Fragment key={block.id}>
              {showInsertIndicator && (
                <div className="insert-indicator" />
              )}

              {block.type === 'location' ? (
                <LocationNote
                  marker={block.marker}
                  onRemove={() => handleRemoveBlock(block.id)}
                  noteId={note.id}
                  tabId={activeTab.id}
                  inline
                />
              ) : (
                <div
                  contentEditable
                  className="text-block"
                  suppressContentEditableWarning
                  onInput={(e) => handleBlockChange(block.id, e.currentTarget.textContent)}
                  onKeyDown={(e) => handleBlockKeyDown(e, block.id, index)}
                  onMouseEnter={() => handleBlockMouseEnter(index)}
                  onMouseLeave={handleBlockMouseLeave}
                  onDragOver={(e) => handleDragOverBlock(e, index)}
                  data-placeholder={index === 0 ? "Start writing your note here... You can drag location markers here to add annotations." : "Continue writing..."}
                  ref={(el) => {
                    if (el && el.textContent !== block.content) {
                      el.textContent = block.content;
                    }
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
        {insertIndicatorIndex === activeTab.blocks.length && (
          <div className="insert-indicator" />
        )}
      </div>
    </div>
  );
};

export default NotesEditor;
