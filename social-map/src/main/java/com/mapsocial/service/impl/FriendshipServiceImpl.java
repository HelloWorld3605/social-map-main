package com.mapsocial.service.impl;


import com.mapsocial.dto.response.friendship.FriendListDTO;
import com.mapsocial.dto.response.friendship.FriendResponseDTO;
import com.mapsocial.entity.*;
import com.mapsocial.enums.FriendshipStatus;
import com.mapsocial.mapper.FriendshipMapper;
import com.mapsocial.repository.FriendshipRepository;
import com.mapsocial.repository.UserRepository;
import com.mapsocial.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendshipServiceImpl implements FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final FriendshipMapper friendshipMapper;

    @Override
    public FriendResponseDTO sendRequest(UUID senderId, UUID receiverId) {
        if (senderId.equals(receiverId))
            throw new IllegalArgumentException("Không thể kết bạn với chính mình.");

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender không tồn tại"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Receiver không tồn tại"));

        // Kiểm tra xem đã tồn tại mối quan hệ giữa 2 người (bất kể chiều)
        Optional<Friendship> existingOpt = friendshipRepository.findFriendshipBetween(sender, receiver);

        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();

            // Nếu đã là bạn bè
            if (existing.getStatus() == FriendshipStatus.ACCEPTED)
                throw new IllegalStateException("Hai người đã là bạn bè.");

            // Nếu đang bị chặn
            if (existing.getStatus() == FriendshipStatus.BLOCKED)
                throw new IllegalStateException("Không thể gửi lời mời vì một trong hai người đã chặn.");

            // Nếu người nhận cũ (receiver) giờ gửi lại → tự động chấp nhận
            if (existing.getStatus() == FriendshipStatus.PENDING &&
                    existing.getSender().equals(receiver) &&
                    existing.getReceiver().equals(sender)) {
                existing.setStatus(FriendshipStatus.ACCEPTED);
                existing.setUpdatedAt(LocalDateTime.now());
                friendshipRepository.save(existing);
                return friendshipMapper.toResponseDTO(existing);
            }

            // Nếu lời mời đã tồn tại cùng chiều
            if (existing.getSender().equals(sender) && existing.getReceiver().equals(receiver))
                throw new IllegalStateException("Lời mời kết bạn đã được gửi trước đó.");

            // Nếu là chiều ngược mà vẫn đang pending (đã xử lý ở trên) thì không cần làm gì thêm
        }

        // Nếu chưa có mối quan hệ nào → tạo mới
        Friendship friendship = Friendship.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendshipStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        friendshipRepository.save(friendship);
        return friendshipMapper.toResponseDTO(friendship);
    }


    @Override
    public FriendResponseDTO acceptRequest(Long friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời."));

        if (!friendship.getReceiver().getId().equals(userId))
            throw new IllegalStateException("Chỉ người nhận mới có thể chấp nhận.");

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setUpdatedAt(LocalDateTime.now());
        friendshipRepository.save(friendship);

        return friendshipMapper.toResponseDTO(friendship);
    }


    @Override
    public void cancelOrRejectRequest(Long friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời."));

        // Chỉ người gửi có thể hủy lời mời đang PENDING
        // Chỉ người nhận có thể từ chối lời mời đang PENDING
        if (friendship.getStatus() != FriendshipStatus.PENDING ||
                (!friendship.getSender().getId().equals(userId) &&
                        !friendship.getReceiver().getId().equals(userId))) {
            throw new IllegalStateException("Không thể hủy hoặc từ chối lời mời này.");
        }
        friendshipRepository.delete(friendship);

        friendshipRepository.findFriendshipBetween(
                friendship.getReceiver(), friendship.getSender()
        ).ifPresent(friendshipRepository::delete);
    }


    @Override
    public List<FriendListDTO> getFriendList(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user."));

        List<Friendship> friendships = friendshipRepository.findBySenderOrReceiverAndStatus(
                user, user, FriendshipStatus.ACCEPTED
        );

        return friendships.stream()
                .map(f -> f.getSender().equals(user) ? f.getReceiver() : f.getSender())
                .map(friendshipMapper::toFriendListDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<FriendResponseDTO> getPendingRequests(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user."));

        // Lấy các lời mời mà user là người nhận và trạng thái đang PENDING
        List<Friendship> pendingRequests = friendshipRepository.findByReceiverAndStatus(user, FriendshipStatus.PENDING);

        return pendingRequests.stream()
                .map(friendshipMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<FriendResponseDTO> getSentRequests(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user."));

        // Lấy các lời mời mà user là người gửi và trạng thái đang PENDING
        List<Friendship> sentRequests = friendshipRepository.findBySenderAndStatus(user, FriendshipStatus.PENDING);

        return sentRequests.stream()
                .map(friendshipMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FriendResponseDTO blockUser(UUID blockerId, UUID blockedId) {
        if (blockerId.equals(blockedId))
            throw new IllegalArgumentException("Không thể chặn chính mình.");

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new IllegalArgumentException("Người chặn không tồn tại"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new IllegalArgumentException("Người bị chặn không tồn tại"));

        // Tìm xem đã có mối quan hệ nào giữa 2 người chưa (theo cả 2 chiều)
        Optional<Friendship> existing = friendshipRepository.findFriendshipBetween(blocker, blocked);

        Friendship friendship;
        if (existing.isPresent()) {
            friendship = existing.get();
            // Nếu đã là bạn bè hoặc đang chờ → cập nhật thành BLOCKED
            friendship.setStatus(FriendshipStatus.BLOCKED);
        } else {
            // Nếu chưa có mối quan hệ nào → tạo mới
            friendship = Friendship.builder()
                    .sender(blocker)
                    .receiver(blocked)
                    .status(FriendshipStatus.BLOCKED)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        friendshipRepository.save(friendship);
        return friendshipMapper.toResponseDTO(friendship);
    }

    @Override
    public String getFriendshipStatus(UUID userId, UUID otherUserId) {
        if (userId.equals(otherUserId)) {
            return "SELF";
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user khác"));

        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetween(user, otherUser);

        if (friendship.isEmpty()) {
            return "NONE"; // Chưa có quan hệ
        }

        Friendship f = friendship.get();

        // Nếu đã là bạn bè
        if (f.getStatus() == FriendshipStatus.ACCEPTED) {
            return "ACCEPTED";
        }

        // Nếu bị chặn
        if (f.getStatus() == FriendshipStatus.BLOCKED) {
            return "BLOCKED";
        }

        // Nếu đang pending
        if (f.getStatus() == FriendshipStatus.PENDING) {
            // Kiểm tra xem mình là người gửi hay người nhận
            if (f.getSender().getId().equals(userId)) {
                return "PENDING"; // Mình đã gửi lời mời
            } else {
                return "RECEIVED"; // Mình nhận được lời mời
            }
        }

        return "NONE";
    }

    @Override
    public void unfriend(UUID userId, UUID friendId) {
        if (userId.equals(friendId)) {
            throw new IllegalArgumentException("Không thể hủy kết bạn với chính mình");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bạn bè"));

        // Tìm mối quan hệ giữa 2 người
        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetween(user, friend);

        if (friendship.isEmpty()) {
            throw new IllegalStateException("Hai người không phải bạn bè");
        }

        Friendship f = friendship.get();

        // Chỉ cho phép unfriend nếu đang là bạn bè
        if (f.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("Hai người không phải bạn bè");
        }

        // Xóa cả 2 chiều của mối quan hệ
        friendshipRepository.delete(f);

        // Tìm và xóa bản ghi ngược (nếu có)
        friendshipRepository.findFriendshipBetween(friend, user)
                .ifPresent(friendshipRepository::delete);
    }
}
