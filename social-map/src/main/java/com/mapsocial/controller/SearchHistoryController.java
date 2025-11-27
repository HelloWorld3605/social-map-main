package com.mapsocial.controller;

import com.mapsocial.dto.request.SaveSearchHistoryRequest;
import com.mapsocial.entity.SearchHistory;
import com.mapsocial.service.SearchHistoryService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/search-history")
@RequiredArgsConstructor
@Tag(name = "Search History", description = "API quản lý lịch sử tìm kiếm")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    @PostMapping
    @Operation(summary = "Lưu lịch sử tìm kiếm")
    public ResponseEntity<Void> saveSearchHistory(
            @RequestBody SaveSearchHistoryRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        UUID userId = userPrincipal.getUser().getId();
        searchHistoryService.saveSearchHistory(userId, request.getQuery(), request.getType(), request.getData());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "Lấy lịch sử tìm kiếm của người dùng")
    public ResponseEntity<List<SearchHistory>> getSearchHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("Not authenticated");
        }
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        UUID userId = userPrincipal.getUser().getId();
        List<SearchHistory> history = searchHistoryService.getTop5SearchHistory(userId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping
    @Operation(summary = "Xóa toàn bộ lịch sử tìm kiếm của người dùng")
    public ResponseEntity<Void> deleteSearchHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        UUID userId = userPrincipal.getUser().getId();
        searchHistoryService.deleteSearchHistory(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa một lịch sử tìm kiếm cụ thể")
    public ResponseEntity<Void> deleteSearchHistoryItem(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID userId = userPrincipal.getUser().getId();
        SearchHistory history = searchHistoryService.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        if (!history.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        searchHistoryService.delete(history);
        return ResponseEntity.ok().build();
    }
}
