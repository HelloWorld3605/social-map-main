package com.mapsocial.config;

import com.mapsocial.service.ShopStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShopStatusCacheInitializer implements ApplicationRunner {

    private final ShopStatusService shopStatusService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Application started. Initializing shop status cache...");
        try {
            shopStatusService.initializeShopStatusCache();
        } catch (Exception e) {
            log.error("Failed to initialize shop status cache: {}", e.getMessage(), e);
        }
    }
}

