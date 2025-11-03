package com.mapsocial.entity;

import com.mapsocial.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "shops")
public class Shop extends Marker {

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(length = 500)
    private String description;

    private String phoneNumber;

    private LocalTime openingTime;
    private LocalTime closingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShopStatus status = ShopStatus.OPEN;

    private Double rating = 0.0;
    private Integer reviewCount = 0;

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Menu> menus = new ArrayList<>();

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserShop> userShops = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "shop_tags",
            joinColumns = @JoinColumn(name = "shop_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags = new ArrayList<>();
}
