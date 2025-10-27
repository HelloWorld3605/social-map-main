package com.mapsocial;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MapSocialApplication {

    public static void main(String[] args) {
        SpringApplication.run(MapSocialApplication.class, args);
    }

}
