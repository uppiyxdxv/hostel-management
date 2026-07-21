package com.hostel.repository;
import com.hostel.model.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {
    List<Visitor> findByStudentId(Long studentId);
    List<Visitor> findByStatus(String status);
    List<Visitor> findByDate(java.time.LocalDate date);
}