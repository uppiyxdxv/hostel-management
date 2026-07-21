package com.hostel.model;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "students")
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false) private String phone;
    private String address;
    private String gender;
    private LocalDate dob;
    @Column(nullable = false) private LocalDate registrationDate = LocalDate.now();
    private String roomNumber;
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    public Student() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; } public void setAddress(String address) { this.address = address; }
    public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
    public LocalDate getDob() { return dob; } public void setDob(LocalDate dob) { this.dob = dob; }
    public LocalDate getRegistrationDate() { return registrationDate; } public void setRegistrationDate(LocalDate registrationDate) { this.registrationDate = registrationDate; }
    public String getRoomNumber() { return roomNumber; } public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}