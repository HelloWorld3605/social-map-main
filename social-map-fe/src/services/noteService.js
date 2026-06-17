import { api } from "./apiClient";

/**
 * Lấy tất cả notes của người dùng hiện tại
 * @returns {Promise<NoteResponse[]>}
 */
export const getMyNotes = async () => {
  const data = await api.get("/notes");
  return data.map(deserializeNote);
};

/**
 * Lấy một note theo ID
 * @param {string} noteId
 * @returns {Promise<NoteResponse>}
 */
export const getNoteById = async (noteId) => {
  const data = await api.get(`/notes/${noteId}`);
  return deserializeNote(data);
};

/**
 * Tạo note mới
 * @param {{ title: string, tabs?: object[], activeTabId?: string }} noteData
 * @returns {Promise<NoteResponse>}
 */
export const createNote = async (noteData) => {
  const payload = {
    title: noteData.title,
    tabs: noteData.tabs ? JSON.stringify(noteData.tabs) : undefined,
    activeTabId: noteData.activeTabId,
  };
  const data = await api.post("/notes", payload);
  return deserializeNote(data);
};

/**
 * Cập nhật note (title + toàn bộ tabs/blocks)
 * @param {string} noteId
 * @param {{ title: string, tabs: object[], activeTabId?: string }} noteData
 * @returns {Promise<NoteResponse>}
 */
export const updateNote = async (noteId, noteData) => {
  const payload = {
    title: noteData.title,
    tabs: JSON.stringify(noteData.tabs),
    activeTabId: noteData.activeTabId,
  };
  const data = await api.put(`/notes/${noteId}`, payload);
  return deserializeNote(data);
};

/**
 * Xóa note (soft delete)
 * @param {string} noteId
 * @returns {Promise<void>}
 */
export const deleteNote = async (noteId) => {
  return await api.delete(`/notes/${noteId}`);
};

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Backend trả tabs dưới dạng JSON string (do lưu jsonb).
 * Hàm này parse lại thành object trước khi đưa vào state React.
 */
function deserializeNote(note) {
  return {
    ...note,
    // id từ backend là UUID string, giữ nguyên để dùng làm key
    tabs: typeof note.tabs === "string" ? JSON.parse(note.tabs) : note.tabs,
  };
}
