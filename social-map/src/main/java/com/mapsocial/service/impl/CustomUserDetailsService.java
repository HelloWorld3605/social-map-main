package com.mapsocial.service.impl;

import com.mapsocial.entity.User;
import com.mapsocial.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Trong hệ thống này, username chính là email.
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Kiểm tra xem user có tồn tại không (bao gồm cả deleted)
        User userCheck = userRepository.findByEmail(email).orElse(null);

        // Nếu user đã bị xóa, throw message cụ thể
        if (userCheck != null && userCheck.getDeletedAt() != null) {
            throw new UsernameNotFoundException("Tài khoản của bạn đã bị xóa trong hệ thống. Vui lòng liên hệ admin để được hỗ trợ.");
        }

        // ✅ Sử dụng findActiveByEmail để chỉ lấy user chưa bị xóa
        User user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));

        // Không cần kiểm tra deletedAt nữa vì findActiveByEmail đã lọc rồi

        return UserPrincipal.create(user);
    }
    

    // Inner class để đại diện cho User trong Spring Security context
    public static class UserPrincipal implements UserDetails, java.security.Principal {
        private final User user;

        public UserPrincipal(User user) {
            this.user = user;
        }

        public static UserPrincipal create(User user) {
            return new UserPrincipal(user);
        }

        public User getUser() {
            return user;
        }

        @Override
        public String getName() {
            return user.getEmail(); // or user.getId().toString() if you prefer
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
            );
        }

        @Override
        public String getPassword() {
            return user.getPasswordHash();
        }

        @Override
        public String getUsername() {
            return user.getEmail();
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return user.getDeletedAt() == null; // Account locked nếu bị soft delete
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return user.getDeletedAt() == null; // Disabled nếu bị soft delete
        }
    }
}
