package com.hostel.model;
import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class Room {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String roomNumber;
    @Column(nullable = false) private String floor;
    private String type; // SINGLE, DOUBLE, DORM
    @Column(nullable = false) private int capacity;
    private int occupied = 0;
    private double rent;
    private String status = "AVAILABLE"; // AVAILABLE, FULL, MAINTENANCE

    public Room() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getRoomNumber() { return roomNumber; } public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public String getFloor() { return floor; } public void setFloor(String floor) { this.floor = floor; }
    public String getType() { return type; } public void setType(String type) { this.type = type; }
    public int getCapacity() { return capacity; } public void setCapacity(int capacity) { this.capacity = capacity; }
    public int getOccupied() { return occupied; } public void setOccupied(int occupied) { this.occupied = occupied; }
    public double getRent() { return rent; } public void setRent(double rent) { this.rent = rent; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}