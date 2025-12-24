import React, { useRef, useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import NotesSidebar from './NotesSidebar';
import NotesTabHeader from './NotesTabHeader';
import NotesEditor from './NotesEditor';
import {
  FaStickyNote,
  FaChevronDown,
  FaChevronUp,
  FaThumbtack,
  FaTimes,
  FaWindowMaximize,
  FaWindowRestore,
  FaBars,
  FaAngleLeft
} from 'react-icons/fa';
import './Notes.css';

const NotesPopup = () => {
  const { isNotesOpen, closeNotes, togglePin, isPinned, activeNoteId, notes } = useNotes();
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [prevState, setPrevState] = useState(null);

  const activeNote = notes.find(note => note.id === activeNoteId);

  useEffect(() => {
    if (!isNotesOpen) return;

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
      } else if (isResizing) {
        let newX = position.x;
        let newY = position.y;
        let newWidth = size.width;
        let newHeight = size.height;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
        }
        if (resizeDirection.includes('w')) {
          const deltaX = resizeStart.x - e.clientX;
          newWidth = Math.max(300, resizeStart.width + deltaX);
          newX = Math.max(0, resizeStart.positionX - deltaX);
        }
        if (resizeDirection.includes('n')) {
          const deltaY = resizeStart.y - e.clientY;
          newHeight = Math.max(200, resizeStart.height + deltaY);
          newY = Math.max(0, resizeStart.positionY - deltaY);
        }

        setPosition({ x: newX, y: newY });
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isResizing, resizeStart, resizeDirection, isNotesOpen]);

  const handleMouseDown = (e) => {
    if (isPinned) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeMouseDown = (e, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      positionX: position.x,
      positionY: position.y,
    });
  };

  const handleDoubleClick = () => {
    if (isMaximized) {
      setPosition(prevState.position);
      setSize(prevState.size);
    } else {
      setPrevState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    setIsMaximized(!isMaximized);
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      // Restore from minimized state
      if (prevState) {
        setPosition(prevState.position);
        setSize(prevState.size);
        setIsMaximized(prevState.isMaximized || false);
      }
    } else {
      // Minimize to bottom right corner
      setPrevState({ position, size, isMaximized });
      setPosition({ x: window.innerWidth - 60, y: window.innerHeight - 60 });
      setSize({ width: 50, height: 50 });
      setIsMaximized(false);
    }
    setIsMinimized(!isMinimized);
  };

  if (!isNotesOpen) return null;

  return (
    <div className="notes-overlay" role="dialog" aria-modal="true">
      <div
        className={`notes-popup ${isPinned ? 'pinned' : ''} ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''} ${isResizing ? 'resizing' : ''}`}
        ref={popupRef}
        style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
        onClick={(e) => {
          e.stopPropagation();
          if (isMinimized) {
            toggleMinimize();
          }
        }}
        onDoubleClick={isMinimized ? undefined : handleDoubleClick}
        role="dialog"
        aria-labelledby="notes-title"
      >
        <div className="notes-header" onMouseDown={isMinimized ? undefined : handleMouseDown} title={isMinimized ? "Click to restore" : "Drag to move window"}>
          {!isMinimized && <div className="notes-title" id="notes-title">{activeNote ? activeNote.title : 'Notes'}</div>}
          {isMinimized && <div className="notes-icon"><FaStickyNote /></div>}
          <div className="notes-controls">
            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}>
              {isSidebarOpen ? <FaAngleLeft /> : <FaBars />}
            </button>
            <button className="maximize-btn" onClick={handleDoubleClick} title={isMaximized ? "Restore" : "Maximize"}>
              {isMaximized ? <FaWindowRestore /> : <FaWindowMaximize />}
            </button>
            <button className="minimize-btn" onClick={toggleMinimize} title={isMinimized ? "Restore" : "Minimize"}>
              {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            <button className="pin-btn" onClick={togglePin} title={isPinned ? "Unpin window" : "Pin window"}>
              {isPinned ? <FaThumbtack /> : <FaStickyNote />}
            </button>
            <button className="close-btn" onClick={closeNotes} title="Close">
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="notes-content">
          {isSidebarOpen && <NotesSidebar />}
          <div className="notes-main">
            {activeNote && (
              <>
                <NotesTabHeader note={activeNote} />
                <NotesEditor note={activeNote} />
              </>
            )}
          </div>
        </div>
        {!isMaximized && !isMinimized && (
          <>
            {/* Corner handles */}
            <div className="resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} title="Resize (bottom-right)"></div>
            <div className="resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} title="Resize (bottom-left)"></div>
            <div className="resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} title="Resize (top-right)"></div>
            <div className="resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} title="Resize (top-left)"></div>

            {/* Edge handles */}
            <div className="resize-handle e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} title="Resize (right)"></div>
            <div className="resize-handle w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} title="Resize (left)"></div>
            <div className="resize-handle n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} title="Resize (top)"></div>
            <div className="resize-handle s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} title="Resize (bottom)"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotesPopup;
