package com.mapsocial.service;

import com.mapsocial.dto.request.note.CreateNoteRequest;
import com.mapsocial.dto.request.note.UpdateNoteRequest;
import com.mapsocial.dto.response.note.NoteResponse;

import java.util.List;
import java.util.UUID;

public interface NoteService {

    /** Lấy tất cả notes của user hiện tại (không bị xóa mềm) */
    List<NoteResponse> getMyNotes(UUID userId);

    /** Lấy một note theo id, chỉ khi thuộc về user */
    NoteResponse getNoteById(UUID userId, UUID noteId);

    /** Tạo note mới */
    NoteResponse createNote(UUID userId, CreateNoteRequest request);

    /** Cập nhật toàn bộ nội dung note (title + tabs) */
    NoteResponse updateNote(UUID userId, UUID noteId, UpdateNoteRequest request);

    /** Xóa mềm note */
    void deleteNote(UUID userId, UUID noteId);
}
