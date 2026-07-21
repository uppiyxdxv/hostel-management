package com.hostel.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long studentId;
    private String studentName;
    @Column(nullable = false) private LocalDate date = LocalDate.now();
    private LocalTime inTime;
    private LocalTime outTime;
    @Column(nullable = false) private String status = "ABSENT"; // PRESENT, ABSENT, LEAVE
    private String remark;

    public Attendance() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; } public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public LocalDate getDate() { return date; } public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getInTime() { return inTime; } public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; } public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
}