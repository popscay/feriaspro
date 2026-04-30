package com.vacation.app.controller;

import com.vacation.app.dto.ApiResponse;
import com.vacation.app.dto.VacationRequestDTO;
import com.vacation.app.service.VacationRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacation-requests")
@RequiredArgsConstructor
@Tag(name = "Vacation Requests", description = "Vacation request management endpoints")
public class VacationRequestController {

    private final VacationRequestService vacationRequestService;

    @GetMapping
    @Operation(summary = "List vacation requests based on current user role")
    public ResponseEntity<ApiResponse<List<VacationRequestDTO.Response>>> getAllRequests(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(vacationRequestService.getAllRequests(userId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vacation request by ID")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> getRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(vacationRequestService.getRequestById(id, userId)));
    }

    @PostMapping
    @Operation(summary = "Create a vacation request")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> createRequest(
            @Valid @RequestBody VacationRequestDTO.CreateRequest dto,
            @RequestHeader("X-User-Id") Long userId) {
        VacationRequestDTO.Response created = vacationRequestService.createRequest(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Vacation request created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a vacation request")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody VacationRequestDTO.UpdateRequest dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Request updated", vacationRequestService.updateRequest(id, dto, userId)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a vacation request")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> cancelRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Request cancelled", vacationRequestService.cancelRequest(id, userId)));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a vacation request (Admin or Manager)")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> approveRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Request approved", vacationRequestService.approveRequest(id, userId)));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a vacation request (Admin or Manager)")
    public ResponseEntity<ApiResponse<VacationRequestDTO.Response>> rejectRequest(
            @PathVariable Long id,
            @RequestBody VacationRequestDTO.RejectRequest dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Request rejected", vacationRequestService.rejectRequest(id, dto, userId)));
    }
}
