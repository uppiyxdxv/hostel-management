package com.hostel.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "visitors")
public class Visitor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String visitorName;
    @Column(nullable = false) private String studentName;
    private Long studentId;
    private String phone;
    private String purpose;
    private LocalTime inTime;
    private LocalTime outTime;
    @Column(nullable = false) private LocalDate date = LocalDate.now();
    private String status = "IN"; // IN, OUT

    public Visitor() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getVisitorName() { return visitorName; } public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public Long getStudentId() { return studentId; } public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public String getPurpose() { return purpose; } public void setPurpose(String purpose) { this.purpose = purpose; }
    public LocalTime getInTime() { return inTime; } public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; } public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public LocalDate getDate() { return date; } public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}