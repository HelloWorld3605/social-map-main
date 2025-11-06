package com.mapsocial.service;

import com.mapsocial.dto.request.BoundingBoxRequest;
import com.mapsocial.dto.response.ShopClusterResponse;

import java.util.List;

public interface ShopMapService {

    /**
     * Lấy shops hoặc clusters trong vùng bounding box
     * Tự động quyết định trả về clusters hoặc individual shops dựa vào zoom level
     */
    List<ShopClusterResponse> getShopsInBoundingBox(BoundingBoxRequest request);

    /**
     * Lấy tất cả shops trong vùng (không cluster) - dùng cho zoom level cao
     */
    List<ShopClusterResponse> getIndividualShopsInBoundingBox(BoundingBoxRequest request);

    /**
     * Lấy clusters trong vùng - dùng cho zoom level thấp
     */
    List<ShopClusterResponse> getClustersInBoundingBox(BoundingBoxRequest request);
}

