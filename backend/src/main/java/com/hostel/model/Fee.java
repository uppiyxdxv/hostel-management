package com.hostel.model;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "fees")
public class Fee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long studentId;
    private String studentName;
    @Column(nullable = false) private double amount;
    @Column(nullable = false) private LocalDate dueDate;
    private LocalDate paidDate;
    private String status = "UNPAID"; // PAID, UNPAID, PARTIAL
    private String type; // HOSTEL, MESS, TOTAL
    private String remark;
    @Column(nullable = false) private LocalDate createdAt = LocalDate.now();

    public Fee() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; } public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public double getAmount() { return amount; } public void setAmount(double amount) { this.amount = amount; }
    public LocalDate getDueDate() { return dueDate; } public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getPaidDate() { return paidDate; } public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getType() { return type; } public void setType(String type) { this.type = type; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public LocalDate getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}