package com.mapsocial.controller;

import com.mapsocial.dto.request.note.CreateNoteRequest;
import com.mapsocial.dto.request.note.UpdateNoteRequest;
import com.mapsocial.dto.response.note.NoteResponse;
import com.mapsocial.service.NoteService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "API quản lý ghi chú cá nhân")
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    @Operation(summary = "Lấy tất cả notes của người dùng hiện tại")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công")
    })
    public ResponseEntity<List<NoteResponse>> getMyNotes(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID userId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(noteService.getMyNotes(userId));
    }

    @GetMapping("/{noteId}")
    @Operation(summary = "Lấy một note theo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy note")
    })
    public ResponseEntity<NoteResponse> getNoteById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID noteId) {
        UUID userId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(noteService.getNoteById(userId, noteId));
    }

    @PostMapping
    @Operation(summary = "Tạo note mới")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tạo thành công")
    })
    public ResponseEntity<NoteResponse> createNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateNoteRequest request) {
        UUID userId = userPrincipal.getUser().getId();
        NoteResponse response = noteService.createNote(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{noteId}")
    @Operation(summary = "Cập nhật note (title + toàn bộ tabs/blocks)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy note")
    })
    public ResponseEntity<NoteResponse> updateNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID noteId,
            @Valid @RequestBody UpdateNoteRequest request) {
        UUID userId = userPrincipal.getUser().getId();
        return ResponseEntity.ok(noteService.updateNote(userId, noteId, request));
    }

    @DeleteMapping("/{noteId}")
    @Operation(summary = "Xóa note (soft delete)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Xóa thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy note")
    })
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID noteId) {
        UUID userId = userPrincipal.getUser().getId();
        noteService.deleteNote(userId, noteId);
        return ResponseEntity.noContent().build();
    }
}
