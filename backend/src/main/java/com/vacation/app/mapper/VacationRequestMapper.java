package com.vacation.app.mapper;

import com.vacation.app.dto.VacationRequestDTO;
import com.vacation.app.model.VacationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VacationRequestMapper {

    private final EmployeeMapper employeeMapper;

    public VacationRequestDTO.Response toResponse(VacationRequest vr) {
        if (vr == null) return null;
        return VacationRequestDTO.Response.builder()
                .id(vr.getId())
                .employee(employeeMapper.toSummary(vr.getEmployee()))
                .startDate(vr.getStartDate())
                .endDate(vr.getEndDate())
                .status(vr.getStatus())
                .rejectionReason(vr.getRejectionReason())
                .createdAt(vr.getCreatedAt())
                .updatedAt(vr.getUpdatedAt())
                .build();
    }
}
