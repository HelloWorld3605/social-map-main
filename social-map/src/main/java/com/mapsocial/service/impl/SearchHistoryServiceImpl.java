package com.mapsocial.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extract entity ID from JSON data
     * For user/shop types, data contains {"id": "...", ...}
     */
    private String extractEntityId(String data) {
        if (data == null || data.trim().isEmpty()) {
            return null;
        }
        try {
            JsonNode jsonNode = objectMapper.readTree(data);
            JsonNode idNode = jsonNode.get("id");
            return idNode != null ? idNode.asText() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Check if an existing history item matches the same entity
     * For user/shop: compare by entity ID from data field
     * For location/query: compare by data or query
     */
    private boolean isSameEntity(SearchHistory existing, String type, String data, String query) {
        if ("user".equals(type) || "shop".equals(type)) {
            // Compare by entity ID
            String existingEntityId = extractEntityId(existing.getData());
            String newEntityId = extractEntityId(data);
            return existingEntityId != null && existingEntityId.equals(newEntityId);
        } else if ("location".equals(type)) {
            // Compare by data (location coordinates)
            return existing.getData() != null && existing.getData().equals(data);
        } else {
            // For query type, compare by query text
            return existing.getQuery().equals(query);
        }
    }

    @Override
    @Transactional
    public void saveSearchHistory(UUID userId, String query, String type, String data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SearchHistory existingMatch = null;

        // For user/shop types, MUST check by entity ID ONLY (not by name)
        if (("user".equals(type) || "shop".equals(type)) && data != null) {
            String entityId = extractEntityId(data);
            System.out.println("=== DEBUG SEARCH HISTORY ===");
            System.out.println("Type: " + type);
            System.out.println("Query: " + query);
            System.out.println("Data: " + data);
            System.out.println("Extracted Entity ID: " + entityId);

            if (entityId != null && !entityId.trim().isEmpty()) {
                try {
                    // Use the repository method to find by entity ID
                    List<SearchHistory> existingByEntityId = searchHistoryRepository.findByUserIdAndTypeAndEntityId(userId, type, entityId);
                    System.out.println("Found existing by entity ID: " + existingByEntityId.size() + " records");
                    if (!existingByEntityId.isEmpty()) {
                        existingMatch = existingByEntityId.get(0);
                        System.out.println("Existing match found! ID: " + existingMatch.getId());
                    }
                } catch (Exception e) {
                    // If native query fails, try manual comparison
                    System.err.println("Error finding by entity ID: " + e.getMessage());
                    e.printStackTrace();
                    List<SearchHistory> allByType = searchHistoryRepository.findByUserIdAndType(userId, type);
                    System.out.println("Fallback: checking " + allByType.size() + " records manually");
                    for (SearchHistory history : allByType) {
                        String historyEntityId = extractEntityId(history.getData());
                        System.out.println("  Comparing: " + historyEntityId + " vs " + entityId);
                        if (entityId.equals(historyEntityId)) {
                            existingMatch = history;
                            System.out.println("  Match found via fallback!");
                            break;
                        }
                    }
                }
            }
            // NOTE: Do NOT fallback to query-based search for user/shop types
            // Different users/shops can have the same name, so we MUST check by ID only
        }

        // For location type, check by place_name (query) because locations don't have consistent IDs
        if (existingMatch == null && "location".equals(type)) {
            List<SearchHistory> existingList = searchHistoryRepository.findByUserIdAndQueryAndType(userId, query, type);
            if (!existingList.isEmpty()) {
                existingMatch = existingList.get(0);
            }
        }

        // For query type, check by query text
        if (existingMatch == null && "query".equals(type)) {
            List<SearchHistory> existingList = searchHistoryRepository.findByUserIdAndQueryAndType(userId, query, type);
            if (!existingList.isEmpty()) {
                existingMatch = existingList.get(0);
            }
        }

        if (existingMatch != null) {
            // Update the existing one - refresh timestamp and data
            System.out.println("UPDATING existing record ID: " + existingMatch.getId());
            existingMatch.setCreatedAt(LocalDateTime.now());
            existingMatch.setQuery(query); // Update query (name might have changed)
            existingMatch.setData(data); // Update data with latest version
            searchHistoryRepository.save(existingMatch);
            System.out.println("Updated successfully!");
        } else {
            // Save new entry - this is a different entity
            System.out.println("CREATING new record");
            SearchHistory searchHistory = SearchHistory.builder()
                    .user(user)
                    .query(query)
                    .type(type)
                    .data(data)
                    .createdAt(LocalDateTime.now())
                    .build();
            searchHistoryRepository.save(searchHistory);
            System.out.println("Created successfully! ID: " + searchHistory.getId());
        }
        System.out.println("=== END DEBUG ===\n");

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
