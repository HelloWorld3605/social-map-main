package com.mapsocial.service;

import com.mapsocial.entity.SearchHistory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SearchHistoryService {

    void saveSearchHistory(UUID userId, String query, String type, String data);

    List<SearchHistory> getSearchHistory(UUID userId);

    List<SearchHistory> getTop5SearchHistory(UUID userId);

    void deleteSearchHistory(UUID userId);

    Optional<SearchHistory> findById(Long id);

    void delete(SearchHistory history);
}
