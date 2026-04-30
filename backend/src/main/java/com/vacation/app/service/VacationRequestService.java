package com.vacation.app.service;

import com.vacation.app.dto.VacationRequestDTO;
import com.vacation.app.exception.BusinessException;
import com.vacation.app.exception.ForbiddenException;
import com.vacation.app.exception.ResourceNotFoundException;
import com.vacation.app.mapper.VacationRequestMapper;
import com.vacation.app.model.Employee;
import com.vacation.app.model.VacationRequest;
import com.vacation.app.repository.EmployeeRepository;
import com.vacation.app.repository.VacationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VacationRequestService {

    private final VacationRequestRepository vacationRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final VacationRequestMapper vacationRequestMapper;

    public List<VacationRequestDTO.Response> getAllRequests(Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);

        return switch (currentUser.getRole()) {
            case ADMIN -> vacationRequestRepository.findAll().stream()
                    .map(vacationRequestMapper::toResponse)
                    .toList();
            case MANAGER -> vacationRequestRepository.findByManagerId(currentUserId).stream()
                    .map(vacationRequestMapper::toResponse)
                    .toList();
            case COLLABORATOR -> vacationRequestRepository.findByEmployeeId(currentUserId).stream()
                    .map(vacationRequestMapper::toResponse)
                    .toList();
        };
    }

    public VacationRequestDTO.Response getRequestById(Long id, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        VacationRequest request = getRequest(id);

        checkViewPermission(currentUser, request);
        return vacationRequestMapper.toResponse(request);
    }

    public VacationRequestDTO.Response createRequest(VacationRequestDTO.CreateRequest dto, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        Employee targetEmployee = getEmployee(dto.getEmployeeId());

        // Collaborators can only create for themselves
        if (currentUser.getRole() == Employee.Role.COLLABORATOR &&
                !targetEmployee.getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only create vacation requests for yourself");
        }

        // Managers cannot create for employees not assigned to them
        if (currentUser.getRole() == Employee.Role.MANAGER) {
            if (targetEmployee.getManager() == null ||
                    !targetEmployee.getManager().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only create requests for your assigned employees");
            }
        }

        validateDates(dto.getStartDate(), dto.getEndDate());
        checkOverlap(targetEmployee.getId(), dto.getStartDate(), dto.getEndDate(), null);

        VacationRequest vr = VacationRequest.builder()
                .employee(targetEmployee)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .status(VacationRequest.Status.PENDING)
                .build();

        return vacationRequestMapper.toResponse(vacationRequestRepository.save(vr));
    }

    public VacationRequestDTO.Response updateRequest(Long id, VacationRequestDTO.UpdateRequest dto, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        VacationRequest request = getRequest(id);

        if (currentUser.getRole() == Employee.Role.COLLABORATOR &&
                !request.getEmployee().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only edit your own requests");
        }

        if (request.getStatus() != VacationRequest.Status.PENDING) {
            throw new BusinessException("Only PENDING requests can be edited");
        }

        validateDates(dto.getStartDate(), dto.getEndDate());
        checkOverlap(request.getEmployee().getId(), dto.getStartDate(), dto.getEndDate(), id);

        request.setStartDate(dto.getStartDate());
        request.setEndDate(dto.getEndDate());

        return vacationRequestMapper.toResponse(vacationRequestRepository.save(request));
    }

    public VacationRequestDTO.Response cancelRequest(Long id, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        VacationRequest request = getRequest(id);

        if (currentUser.getRole() == Employee.Role.COLLABORATOR &&
                !request.getEmployee().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only cancel your own requests");
        }

        if (request.getStatus() == VacationRequest.Status.CANCELLED) {
            throw new BusinessException("Request is already cancelled");
        }

        if (request.getStatus() == VacationRequest.Status.APPROVED &&
                currentUser.getRole() == Employee.Role.COLLABORATOR) {
            throw new BusinessException("Collaborators cannot cancel approved requests");
        }

        request.setStatus(VacationRequest.Status.CANCELLED);
        return vacationRequestMapper.toResponse(vacationRequestRepository.save(request));
    }

    public VacationRequestDTO.Response approveRequest(Long id, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        VacationRequest request = getRequest(id);

        checkApproveRejectPermission(currentUser, request);

        if (request.getStatus() != VacationRequest.Status.PENDING) {
            throw new BusinessException("Only PENDING requests can be approved");
        }

        checkOverlap(request.getEmployee().getId(), request.getStartDate(), request.getEndDate(), id);

        request.setStatus(VacationRequest.Status.APPROVED);
        return vacationRequestMapper.toResponse(vacationRequestRepository.save(request));
    }

    public VacationRequestDTO.Response rejectRequest(Long id, VacationRequestDTO.RejectRequest dto, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        VacationRequest request = getRequest(id);

        checkApproveRejectPermission(currentUser, request);

        if (request.getStatus() != VacationRequest.Status.PENDING) {
            throw new BusinessException("Only PENDING requests can be rejected");
        }

        request.setStatus(VacationRequest.Status.REJECTED);
        request.setRejectionReason(dto.getRejectionReason());
        return vacationRequestMapper.toResponse(vacationRequestRepository.save(request));
    }

    // -- Private helpers --

    private Employee getEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private VacationRequest getRequest(Long id) {
        return vacationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacation request not found with id: " + id));
    }

    private void checkViewPermission(Employee currentUser, VacationRequest request) {
        switch (currentUser.getRole()) {
            case ADMIN -> {}
            case MANAGER -> {
                Employee emp = request.getEmployee();
                if (emp.getManager() == null || !emp.getManager().getId().equals(currentUser.getId())) {
                    throw new ForbiddenException("You can only view requests from your assigned employees");
                }
            }
            case COLLABORATOR -> {
                if (!request.getEmployee().getId().equals(currentUser.getId())) {
                    throw new ForbiddenException("You can only view your own requests");
                }
            }
        }
    }

    private void checkApproveRejectPermission(Employee currentUser, VacationRequest request) {
        switch (currentUser.getRole()) {
            case ADMIN -> {}
            case MANAGER -> {
                Employee emp = request.getEmployee();
                if (emp.getManager() == null || !emp.getManager().getId().equals(currentUser.getId())) {
                    throw new ForbiddenException("You can only approve/reject requests from your assigned employees");
                }
            }
            case COLLABORATOR -> throw new ForbiddenException("Collaborators cannot approve or reject requests");
        }
    }

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new BusinessException("End date must be after or equal to start date");
        }
    }

    private void checkOverlap(Long employeeId, java.time.LocalDate startDate, java.time.LocalDate endDate, Long excludeId) {
        List<VacationRequest> conflicts = vacationRequestRepository.findConflictingRequests(
                employeeId, startDate, endDate, excludeId);
        if (!conflicts.isEmpty()) {
            throw new BusinessException("Vacation period overlaps with another employee's approved or pending request");
        }
    }
}
