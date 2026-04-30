package com.vacation.app.mapper;

import com.vacation.app.dto.EmployeeDTO;
import com.vacation.app.model.Employee;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    public EmployeeDTO.Response toResponse(Employee employee) {
        if (employee == null) return null;
        return EmployeeDTO.Response.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .managerName(employee.getManager() != null ? employee.getManager().getName() : null)
                .build();
    }

    public EmployeeDTO.Summary toSummary(Employee employee) {
        if (employee == null) return null;
        return EmployeeDTO.Summary.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .role(employee.getRole())
                .build();
    }
}
