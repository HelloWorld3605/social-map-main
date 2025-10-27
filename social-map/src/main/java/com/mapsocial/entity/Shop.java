package com.mapsocial.entity;

import com.mapsocial.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.geom.Coordinate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "shops")
public class Shop {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "address")
    private String address;     // Ví dụ: "123 Nguyễn Trãi, Q.5, HCM"

    @Column(nullable = false)
    private Double latitude;    // 10.762622

    @Column(nullable = false)
    private Double longitude;   // 106.660172

    // Trường PostGIS: location (geography Point 4326)
    @Column(columnDefinition = "geography(Point,4326)")
    private Point location;

    @Column(length = 500)
    private String description; // mô tả shop (vd: quán ăn vặt, giá bình dân)

    @Column(name = "phone_number")
    private String phoneNumber; // số điện thoại liên hệ

    @Column(name = "opening_time")
    private LocalTime openingTime; // giờ mở cửa

    @Column(name = "closing_time")
    private LocalTime closingTime; // giờ đóng cửa

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShopStatus status = ShopStatus.OPEN; // trạng thái shop

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Menu> menus = new ArrayList<>();


    @Column(name = "rating")
    private Double rating = 0.0; // điểm đánh giá trung bình

    @Column(name = "review_count")
    private Integer reviewCount = 0; // số lượt review

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserShop> userShops = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @ManyToMany
    @JoinTable(
            name = "shop_tags",
            joinColumns = @JoinColumn(name = "shop_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (latitude != null && longitude != null) {
            GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
            this.location = factory.createPoint(new Coordinate(longitude, latitude));
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (latitude != null && longitude != null) {
            GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
            this.location = factory.createPoint(new Coordinate(longitude, latitude));
        }
    }

}
