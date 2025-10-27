package com.mapsocial.entity;

import com.mapsocial.enums.ShopRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "user_shop")
public class UserShop {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShopRole managerRole = ShopRole.OWNER; // ví dụ: OWNER, STAFF, CASHIER

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    private LocalDateTime leftAt;
}
