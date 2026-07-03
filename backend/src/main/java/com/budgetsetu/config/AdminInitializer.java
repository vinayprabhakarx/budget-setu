package com.budgetsetu.config;

import com.budgetsetu.model.sql.User;
import com.budgetsetu.repository.sql.UserRepository;
import com.budgetsetu.service.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private MailService mailService;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Value("${app.admin.email:try.vinayprabhakar@gmail.com}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (StringUtils.hasText(adminEmail) && StringUtils.hasText(adminPassword)) {
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .fullName("Vinay Prabhakar")
                        .role("ADMIN")
                        .emailVerified(true)
                        .build();

                userRepository.save(admin);
                log.info("Initialized system admin account: {}", adminEmail);
            } else {
                log.info("Admin account already exists for email: {}", adminEmail);
            }
        } else {
            log.info("Admin credentials not provided in environment. Skipping admin initialization.");
        }
    }
}
