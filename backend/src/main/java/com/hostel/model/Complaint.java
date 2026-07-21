package com.hostel.model;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "complaints")
public class Complaint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long studentId;
    private String studentName;
    @Column(nullable = false) private String title;
    @Column(length = 1000) private String description;
    private String category; // ELECTRIC, PLUMBING, CLEANING, OTHER
    private String status = "PENDING"; // PENDING, IN_PROGRESS, RESOLVED
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH
    private LocalDate createdAt = LocalDate.now();
    private LocalDate resolvedAt;
    private String resolution;

    public Complaint() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; } public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; } public void setPriority(String priority) { this.priority = priority; }
    public LocalDate getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
    public LocalDate getResolvedAt() { return resolvedAt; } public void setResolvedAt(LocalDate resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getResolution() { return resolution; } public void setResolution(String resolution) { this.resolution = resolution; }
}