package com.mapsocial.service.impl;

import com.mapsocial.entity.SearchHistory;
import com.mapsocial.entity.User;
import com.mapsocial.repository.SearchHistoryRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchHistoryServiceImpl implements SearchHistoryService {

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void saveSearchHistory(UUID userId, String query, String type, String data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the same search history already exists
        List<SearchHistory> existingList = searchHistoryRepository.findByUserIdAndQueryAndTypeAndData(userId, query, type, data);
        if (!existingList.isEmpty()) {
            // Update the most recent one
            SearchHistory existing = existingList.get(0);
            existing.setCreatedAt(LocalDateTime.now());
            searchHistoryRepository.save(existing);
        } else {
            // Save new
            SearchHistory searchHistory = SearchHistory.builder()
                    .user(user)
                    .query(query)
                    .type(type)
                    .data(data)
                    .createdAt(LocalDateTime.now())
                    .build();
            searchHistoryRepository.save(searchHistory);
        }

        // Giữ tối đa 20 bản ghi mới nhất cho mỗi user
        searchHistoryRepository.deleteOldSearchHistory(userId, 20);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchHistory> getSearchHistory(UUID userId) {
        return searchHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchHistory> getTop5SearchHistory(UUID userId) {
        return searchHistoryRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public void deleteSearchHistory(UUID userId) {
        searchHistoryRepository.deleteAllByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SearchHistory> findById(Long id) {
        return searchHistoryRepository.findById(id);
    }

    @Override
    @Transactional
    public void delete(SearchHistory history) {
        searchHistoryRepository.delete(history);
    }
}
