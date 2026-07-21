package com.hostel.repository;
import com.hostel.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByEmail(String email);
    Optional<Student> findByRoomNumber(String roomNumber);
    long countByStatus(String status);
}