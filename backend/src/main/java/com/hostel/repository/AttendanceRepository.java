package com.hostel.repository;
import com.hostel.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByDate(LocalDate date);
    List<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);
    long countByDateAndStatus(LocalDate date, String status);
}