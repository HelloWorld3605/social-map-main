package com.mapsocial.mapper;

import com.mapsocial.entity.Marker;

/**
 * Mapper utility cho các entity kế thừa từ Marker
 * Xử lý các field chung như latitude, longitude
 */
public class MarkerMapper {

    private MarkerMapper() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Set latitude và longitude cho marker từ request có chứa coordinates
     * @param marker Entity kế thừa từ Marker (Shop, Event, etc.)
     * @param latitude Vĩ độ
     * @param longitude Kinh độ
     * @param <T> Type của Marker entity
     */
    public static <T extends Marker> void setCoordinates(T marker, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude và Longitude không được null");
        }
        marker.setLatitude(latitude);
        marker.setLongitude(longitude);
    }

    /**
     * Set coordinates từ object có method getLatitude() và getLongitude()
     * Sử dụng cho các DTO request
     */
    public static <T extends Marker> void setCoordinatesFromRequest(T marker, Object request) {
        try {
            Double latitude = (Double) request.getClass().getMethod("getLatitude").invoke(request);
            Double longitude = (Double) request.getClass().getMethod("getLongitude").invoke(request);
            setCoordinates(marker, latitude, longitude);
        } catch (Exception e) {
            throw new IllegalArgumentException("Request không có method getLatitude() hoặc getLongitude()", e);
        }
    }
}

