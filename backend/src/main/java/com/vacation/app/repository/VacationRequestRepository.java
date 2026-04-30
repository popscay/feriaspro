package com.vacation.app.repository;

import com.vacation.app.model.VacationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VacationRequestRepository extends JpaRepository<VacationRequest, Long> {

    List<VacationRequest> findByEmployeeId(Long employeeId);

    @Query("SELECT vr FROM VacationRequest vr WHERE vr.employee.manager.id = :managerId")
    List<VacationRequest> findByManagerId(@Param("managerId") Long managerId);

    @Query("""
        SELECT vr FROM VacationRequest vr
        WHERE vr.employee.id = :employeeId
        AND vr.status = 'APPROVED'
        AND vr.startDate <= :endDate
        AND vr.endDate >= :startDate
        AND (:excludeId IS NULL OR vr.id <> :excludeId)
    """)
    List<VacationRequest> findOverlappingApproved(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );

    @Query("""
        SELECT vr FROM VacationRequest vr
        WHERE vr.status IN ('PENDING', 'APPROVED')
        AND vr.employee.id <> :employeeId
        AND vr.startDate <= :endDate
        AND vr.endDate >= :startDate
        AND (:excludeId IS NULL OR vr.id <> :excludeId)
    """)
    List<VacationRequest> findConflictingRequests(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );
}
