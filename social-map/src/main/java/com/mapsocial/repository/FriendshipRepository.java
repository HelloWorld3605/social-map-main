package com.mapsocial.repository;

import com.mapsocial.entity.Friendship;
import com.mapsocial.entity.User;
import com.mapsocial.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findBySenderAndReceiver(User sender, User receiver);

    List<Friendship> findBySenderOrReceiverAndStatus(User sender, User receiver, FriendshipStatus status);

    List<Friendship> findByReceiverAndStatus(User receiver, FriendshipStatus status);

    List<Friendship> findBySenderAndStatus(User sender, FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE (f.sender = :u1 AND f.receiver = :u2) OR (f.sender = :u2 AND f.receiver = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") User u1, @Param("u2") User u2);

    @Query("""
    SELECT COUNT(DISTINCT CASE
        WHEN f1.sender.id = :userId THEN f1.receiver.id
        ELSE f1.sender.id
    END)
    FROM Friendship f1
    WHERE (f1.sender.id = :userId OR f1.receiver.id = :userId)
    AND f1.status = 'ACCEPTED'
    """)
    Long countFriendsByUserId(@Param("userId") UUID userId);

    @Query("""  
    FROM Friendship f1
    WHERE f1.status = 'ACCEPTED'
      AND (
        CASE WHEN f1.sender.id = :userId THEN f1.receiver.id ELSE f1.sender.id END
      ) IN (
        SELECT CASE
                 WHEN f2.sender.id = :otherUserId THEN f2.receiver.id
                 ELSE f2.sender.id
               END
        FROM Friendship f2
        WHERE f2.status = 'ACCEPTED'
          AND (:otherUserId IN (f2.sender.id, f2.receiver.id))
      )
      AND (:userId IN (f1.sender.id, f1.receiver.id))
""")
    Long countMutualFriends(@Param("userId") UUID userId,
                            @Param("otherUserId") UUID otherUserId);


}
