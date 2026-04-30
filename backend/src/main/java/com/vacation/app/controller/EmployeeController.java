package com.vacation.app.controller;

import com.vacation.app.dto.ApiResponse;
import com.vacation.app.dto.EmployeeDTO;
import com.vacation.app.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Employee management endpoints")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "List employees based on current user role")
    public ResponseEntity<ApiResponse<List<EmployeeDTO.Response>>> getAllEmployees(
            @Parameter(description = "Current user ID (simulated auth)")
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getAllEmployees(userId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<ApiResponse<EmployeeDTO.Response>> getEmployee(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getEmployeeById(id, userId)));
    }

    @PostMapping
    @Operation(summary = "Create a new employee (Admin only)")
    public ResponseEntity<ApiResponse<EmployeeDTO.Response>> createEmployee(
            @Valid @RequestBody EmployeeDTO.Request request,
            @RequestHeader("X-User-Id") Long userId) {
        EmployeeDTO.Response created = employeeService.createEmployee(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Employee created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an employee (Admin only)")
    public ResponseEntity<ApiResponse<EmployeeDTO.Response>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO.Request request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Employee updated", employeeService.updateEmployee(id, request, userId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an employee (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        employeeService.deleteEmployee(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Employee deleted", null));
    }

    @GetMapping("/managers")
    @Operation(summary = "Get all managers (for dropdown)")
    public ResponseEntity<ApiResponse<List<EmployeeDTO.Summary>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getManagers()));
    }
}
