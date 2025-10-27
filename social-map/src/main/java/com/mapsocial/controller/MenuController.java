package com.mapsocial.controller;

import com.mapsocial.dto.request.menu.CreateMenuRequest;
import com.mapsocial.dto.request.menu.UpdateMenuRequest;
import com.mapsocial.dto.response.menu.MenuResponse;
import com.mapsocial.service.MenuService;
import com.mapsocial.service.impl.CustomUserDetailsService.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @PostMapping()
    public ResponseEntity<MenuResponse> createMenu(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateMenuRequest request
    ) {
        UUID sellerId = userPrincipal.getUser().getId();
        MenuResponse response = menuService.createMenu(request, sellerId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuResponse> updateMenu(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMenuRequest request
    ) {
        UUID sellerId = userPrincipal.getUser().getId();
        MenuResponse response = menuService.updateMenu(id, request, sellerId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        UUID sellerId = userPrincipal.getUser().getId();
        menuService.deleteMenu(id, sellerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuResponse> getMenuById(@PathVariable UUID id) {
        return ResponseEntity.ok(menuService.getMenuById(id));
    }
}
