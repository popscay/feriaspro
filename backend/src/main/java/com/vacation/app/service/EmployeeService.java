package com.vacation.app.service;

import com.vacation.app.dto.EmployeeDTO;
import com.vacation.app.exception.BusinessException;
import com.vacation.app.exception.ForbiddenException;
import com.vacation.app.exception.ResourceNotFoundException;
import com.vacation.app.mapper.EmployeeMapper;
import com.vacation.app.model.Employee;
import com.vacation.app.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;

    public List<EmployeeDTO.Response> getAllEmployees(Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);

        return switch (currentUser.getRole()) {
            case ADMIN -> employeeRepository.findAll().stream()
                    .map(employeeMapper::toResponse)
                    .toList();
            case MANAGER -> employeeRepository.findByManagerId(currentUserId).stream()
                    .map(employeeMapper::toResponse)
                    .toList();
            case COLLABORATOR -> throw new ForbiddenException("Collaborators cannot list employees");
        };
    }

    public EmployeeDTO.Response getEmployeeById(Long id, Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        Employee target = getEmployee(id);

        return switch (currentUser.getRole()) {
            case ADMIN -> employeeMapper.toResponse(target);
            case MANAGER -> {
                if (target.getManager() == null || !target.getManager().getId().equals(currentUserId)) {
                    throw new ForbiddenException("You can only view your assigned employees");
                }
                yield employeeMapper.toResponse(target);
            }
            case COLLABORATOR -> {
                if (!target.getId().equals(currentUserId)) {
                    throw new ForbiddenException("You can only view your own profile");
                }
                yield employeeMapper.toResponse(target);
            }
        };
    }

    public EmployeeDTO.Response createEmployee(EmployeeDTO.Request request, Long currentUserId) {
        requireAdmin(currentUserId);

        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use: " + request.getEmail());
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = getEmployee(request.getManagerId());
            if (manager.getRole() != Employee.Role.MANAGER && manager.getRole() != Employee.Role.ADMIN) {
                throw new BusinessException("Manager must have MANAGER or ADMIN role");
            }
        }

        Employee employee = Employee.builder()
                .name(request.getName())
                .email(request.getEmail())
                .role(request.getRole())
                .manager(manager)
                .build();

        Employee saved = employeeRepository.save(employee);
        return employeeMapper.toResponse(saved);
    }

    public EmployeeDTO.Response updateEmployee(Long id, EmployeeDTO.Request request, Long currentUserId) {
        requireAdmin(currentUserId);

        Employee employee = getEmployee(id);

        if (!employee.getEmail().equals(request.getEmail()) &&
                employeeRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use: " + request.getEmail());
        }

        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = getEmployee(request.getManagerId());
            if (manager.getRole() != Employee.Role.MANAGER && manager.getRole() != Employee.Role.ADMIN) {
                throw new BusinessException("Manager must have MANAGER or ADMIN role");
            }
            if (manager.getId().equals(id)) {
                throw new BusinessException("Employee cannot be their own manager");
            }
        }

        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setRole(request.getRole());
        employee.setManager(manager);

        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    /*public void deleteEmployee(Long id, Long currentUserId) {
        requireAdmin(currentUserId);
        Employee employee = getEmployee(id);
        employeeRepository.delete(employee);
    }*/

    public void deleteEmployee(Long id, Long currentUserId) {
        requireAdmin(currentUserId);
        Employee employee = getEmployee(id);
        employeeRepository.delete(employee);
    }

    public List<EmployeeDTO.Summary> getManagers() {
        return employeeRepository.findByRole(Employee.Role.MANAGER).stream()
                .map(employeeMapper::toSummary)
                .toList();
    }

    private Employee getEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private void requireAdmin(Long currentUserId) {
        Employee currentUser = getEmployee(currentUserId);
        if (currentUser.getRole() != Employee.Role.ADMIN) {
            throw new ForbiddenException("Only admins can perform this action");
        }
    }
}
