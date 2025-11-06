package com.mapsocial.service.impl;

import com.mapsocial.dto.request.BoundingBoxRequest;
import com.mapsocial.dto.response.ShopClusterResponse;
import com.mapsocial.entity.Shop;
import com.mapsocial.repository.ShopRepository;
import com.mapsocial.service.ShopMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopMapServiceImpl implements ShopMapService {

    private final ShopRepository shopRepository;

    // Ngưỡng quyết định clustering
    private static final int CLUSTER_THRESHOLD = 100; // Nếu > 100 shops thì cluster
    private static final int MAX_ZOOM_FOR_CLUSTERING = 14; // Zoom >= 14 thì không cluster
    private static final double CLUSTER_RADIUS_KM = 0.5; // Bán kính cluster (km)

    @Override
    public List<ShopClusterResponse> getShopsInBoundingBox(BoundingBoxRequest request) {
        // Đếm số lượng shops trong vùng
        Long count = shopRepository.countShopsInBoundingBox(
                request.getNorth(),
                request.getSouth(),
                request.getEast(),
                request.getWest()
        );

        log.info("Found {} shops in bounding box (zoom: {})", count, request.getZoom());

        // Quyết định clustering dựa vào số lượng và zoom level
        boolean shouldCluster = shouldUseCluster(count, request.getZoom());

        if (shouldCluster) {
            log.info("Using clustering mode");
            return getClustersInBoundingBox(request);
        } else {
            log.info("Using individual shops mode");
            return getIndividualShopsInBoundingBox(request);
        }
    }

    @Override
    public List<ShopClusterResponse> getIndividualShopsInBoundingBox(BoundingBoxRequest request) {
        // Lấy shops với giới hạn nếu có
        List<Shop> shops;

        if (request.getLimit() != null && request.getLimit() > 0) {
            shops = shopRepository.findShopsInBoundingBoxWithLimit(
                    request.getNorth(),
                    request.getSouth(),
                    request.getEast(),
                    request.getWest(),
                    request.getLimit()
            );
        } else {
            shops = shopRepository.findShopsInBoundingBox(
                    request.getNorth(),
                    request.getSouth(),
                    request.getEast(),
                    request.getWest()
            );
        }

        // Convert to response
        return shops.stream()
                .map(this::toShopResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShopClusterResponse> getClustersInBoundingBox(BoundingBoxRequest request) {
        // Lấy lightweight data (chỉ id, lat, lng, name) từ PostGIS query
        List<Object[]> locations =
                shopRepository.findShopLocationsInBoundingBox(
                        request.getNorth(),
                        request.getSouth(),
                        request.getEast(),
                        request.getWest()
                );

        // Thực hiện clustering bằng thuật toán đơn giản (grid-based)
        return performGridBasedClustering(locations);
    }

    /**
     * Quyết định có nên sử dụng clustering hay không
     */
    private boolean shouldUseCluster(Long shopCount, Integer zoom) {
        if (zoom == null) {
            // Nếu không có zoom, dựa vào số lượng
            return shopCount > CLUSTER_THRESHOLD;
        }

        // Zoom cao (gần) -> không cluster
        if (zoom >= MAX_ZOOM_FOR_CLUSTERING) {
            return false;
        }

        // Zoom thấp (xa) và nhiều shops -> cluster
        return shopCount > CLUSTER_THRESHOLD;
    }

    /**
     * Clustering đơn giản dựa trên grid
     * Chia bản đồ thành lưới và gom các shops trong cùng một ô
     * @param locations List of Object[] with [UUID id, Double lat, Double lng, String name]
     */
    private List<ShopClusterResponse> performGridBasedClustering(List<Object[]> locations) {

        if (locations.isEmpty()) {
            return Collections.emptyList();
        }

        // Grid size (độ lớn mỗi ô lưới) - có thể điều chỉnh
        double gridSize = 0.01; // ~1km

        // Map để gom nhóm shops theo grid cell
        Map<String, List<ShopLocation>> grid = new HashMap<>();

        for (Object[] row : locations) {
            UUID id = (UUID) row[0];
            Double latitude = (Double) row[1];
            Double longitude = (Double) row[2];
            String name = (String) row[3];

            ShopLocation location = new ShopLocation(id, latitude, longitude, name);
            String gridKey = getGridKey(latitude, longitude, gridSize);
            grid.computeIfAbsent(gridKey, k -> new ArrayList<>()).add(location);
        }

        // Convert grid cells to clusters hoặc individual shops
        List<ShopClusterResponse> result = new ArrayList<>();

        for (Map.Entry<String, List<ShopLocation>> entry : grid.entrySet()) {
            List<ShopLocation> cellShops = entry.getValue();

            if (cellShops.size() == 1) {
                // Chỉ có 1 shop -> hiển thị như individual shop
                ShopLocation shop = cellShops.getFirst();
                result.add(ShopClusterResponse.builder()
                        .type("shop")
                        .id(shop.getId().toString())
                        .name(shop.getName())
                        .latitude(shop.getLatitude())
                        .longitude(shop.getLongitude())
                        .build());
            } else {
                // Nhiều shops -> tạo cluster
                double avgLat = cellShops.stream()
                        .mapToDouble(ShopLocation::getLatitude)
                        .average()
                        .orElse(0.0);

                double avgLng = cellShops.stream()
                        .mapToDouble(ShopLocation::getLongitude)
                        .average()
                        .orElse(0.0);

                List<String> shopIds = cellShops.stream()
                        .map(s -> s.getId().toString())
                        .toList();

                result.add(ShopClusterResponse.builder()
                        .type("cluster")
                        .latitude(avgLat)
                        .longitude(avgLng)
                        .count(cellShops.size())
                        .shopIds(shopIds)
                        .build());
            }
        }

        log.info("Created {} clusters/shops from {} locations", result.size(), locations.size());
        return result;
    }

    /**
     * Tạo grid key từ tọa độ
     */
    private String getGridKey(double lat, double lng, double gridSize) {
        long latCell = (long) (lat / gridSize);
        long lngCell = (long) (lng / gridSize);
        return latCell + "_" + lngCell;
    }

    /**
     * Helper class để store shop location data
     */
    private static class ShopLocation {
        private final UUID id;
        private final Double latitude;
        private final Double longitude;
        private final String name;

        public ShopLocation(UUID id, Double latitude, Double longitude, String name) {
            this.id = id;
            this.latitude = latitude;
            this.longitude = longitude;
            this.name = name;
        }

        public UUID getId() { return id; }
        public Double getLatitude() { return latitude; }
        public Double getLongitude() { return longitude; }
        public String getName() { return name; }
    }

    /**
     * Convert Shop entity to response
     */
    private ShopClusterResponse toShopResponse(Shop shop) {
        // Get first image URL or null
        String imageUrl = null;
        if (shop.getImageShopUrl() != null && !shop.getImageShopUrl().isEmpty()) {
            imageUrl = shop.getImageShopUrl().get(0);
        }

        return ShopClusterResponse.builder()
                .type("shop")
                .id(shop.getId().toString())
                .name(shop.getName())
                .latitude(shop.getLatitude())
                .longitude(shop.getLongitude())
                .address(shop.getAddress())
                .imageUrl(imageUrl)
                .rating(shop.getRating())
                .status(shop.getStatus() != null ? shop.getStatus().toString() : null)
                .build();
    }
}

