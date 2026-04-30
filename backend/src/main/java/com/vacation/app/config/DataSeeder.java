package com.vacation.app.config;

import com.vacation.app.model.Employee;
import com.vacation.app.model.VacationRequest;
import com.vacation.app.repository.EmployeeRepository;
import com.vacation.app.repository.VacationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final VacationRequestRepository vacationRequestRepository;

    @Override
    public void run(String... args) {
        if (employeeRepository.count() > 0) return;

        log.info("Seeding initial data...");

        // Admin
        Employee admin = employeeRepository.save(Employee.builder()
                .name("Alice Admin")
                .email("alice@company.com")
                .role(Employee.Role.ADMIN)
                .build());

        // Managers
        Employee manager1 = employeeRepository.save(Employee.builder()
                .name("Mark Manager")
                .email("mark@company.com")
                .role(Employee.Role.MANAGER)
                .build());

        Employee manager2 = employeeRepository.save(Employee.builder()
                .name("Sarah Supervisor")
                .email("sarah@company.com")
                .role(Employee.Role.MANAGER)
                .build());

        // Collaborators under manager1
        Employee collab1 = employeeRepository.save(Employee.builder()
                .name("Carlos Coder")
                .email("carlos@company.com")
                .role(Employee.Role.COLLABORATOR)
                .manager(manager1)
                .build());

        Employee collab2 = employeeRepository.save(Employee.builder()
                .name("Diana Developer")
                .email("diana@company.com")
                .role(Employee.Role.COLLABORATOR)
                .manager(manager1)
                .build());

        // Collaborators under manager2
        Employee collab3 = employeeRepository.save(Employee.builder()
                .name("Elena Engineer")
                .email("elena@company.com")
                .role(Employee.Role.COLLABORATOR)
                .manager(manager2)
                .build());

        Employee collab4 = employeeRepository.save(Employee.builder()
                .name("Frank Frontend")
                .email("frank@company.com")
                .role(Employee.Role.COLLABORATOR)
                .manager(manager2)
                .build());

        // Sample vacation requests
        vacationRequestRepository.save(VacationRequest.builder()
                .employee(collab1)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(17))
                .status(VacationRequest.Status.PENDING)
                .build());

        vacationRequestRepository.save(VacationRequest.builder()
                .employee(collab2)
                .startDate(LocalDate.now().plusDays(20))
                .endDate(LocalDate.now().plusDays(25))
                .status(VacationRequest.Status.APPROVED)
                .build());

        vacationRequestRepository.save(VacationRequest.builder()
                .employee(collab3)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(8))
                .status(VacationRequest.Status.REJECTED)
                .rejectionReason("Critical project deadline")
                .build());

        vacationRequestRepository.save(VacationRequest.builder()
                .employee(collab4)
                .startDate(LocalDate.now().plusDays(30))
                .endDate(LocalDate.now().plusDays(35))
                .status(VacationRequest.Status.PENDING)
                .build());

        log.info("Seeded {} employees and {} vacation requests",
                employeeRepository.count(), vacationRequestRepository.count());
        log.info("Users: Admin(id={}), Manager1(id={}), Manager2(id={}), Collab1(id={}), Collab2(id={}), Collab3(id={}), Collab4(id={})",
                admin.getId(), manager1.getId(), manager2.getId(),
                collab1.getId(), collab2.getId(), collab3.getId(), collab4.getId());
    }
}
