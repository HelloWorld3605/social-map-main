package com.mapsocial.service.impl;

import com.mapsocial.dto.request.note.CreateNoteRequest;
import com.mapsocial.dto.request.note.UpdateNoteRequest;
import com.mapsocial.dto.response.note.NoteResponse;
import com.mapsocial.entity.Note;
import com.mapsocial.entity.User;
import com.mapsocial.repository.NoteRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.NoteService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    // Default tab JSON khi user tạo note mới không kèm tabs
    private static final String DEFAULT_TABS =
            "[{\"id\":\"tab1\",\"title\":\"Tab 1\",\"blocks\":[{\"id\":\"block1\",\"type\":\"text\",\"content\":\"\"}]}]";

    @Override
    public List<NoteResponse> getMyNotes(UUID userId) {
        return noteRepository.findAllByUserIdAndNotDeleted(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public NoteResponse getNoteById(UUID userId, UUID noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Note không tìm thấy hoặc bạn không có quyền truy cập"));
        return toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse createNote(UUID userId, CreateNoteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User không tìm thấy"));

        String tabs = (request.getTabs() != null && !request.getTabs().isBlank())
                ? request.getTabs()
                : DEFAULT_TABS;

        String activeTabId = (request.getActiveTabId() != null && !request.getActiveTabId().isBlank())
                ? request.getActiveTabId()
                : "tab1";

        Note note = Note.builder()
                .user(user)
                .title(request.getTitle())
                .tabs(tabs)
                .activeTabId(activeTabId)
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Override
    @Transactional
    public NoteResponse updateNote(UUID userId, UUID noteId, UpdateNoteRequest request) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Note không tìm thấy hoặc bạn không có quyền truy cập"));

        note.setTitle(request.getTitle());
        note.setTabs(request.getTabs());

        if (request.getActiveTabId() != null) {
            note.setActiveTabId(request.getActiveTabId());
        }

        return toResponse(noteRepository.save(note));
    }

    @Override
    @Transactional
    public void deleteNote(UUID userId, UUID noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Note không tìm thấy hoặc bạn không có quyền truy cập"));

        note.setDeletedAt(LocalDateTime.now());
        noteRepository.save(note);
    }

    // ── mapper ──────────────────────────────────────────────────────────────

    private NoteResponse toResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .tabs(note.getTabs())
                .activeTabId(note.getActiveTabId())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
