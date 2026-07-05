package com.budgetsetu.exception;

import com.budgetsetu.dto.response.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.UUID;

/**
 * Global exception handler — maps all exceptions to the standard API error
 * response format.
 * Never exposes stack traces, SQL, or internal IDs in user-facing messages.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "Invalid input.";
        String field = fieldError != null ? fieldError.getField() : null;

        return ResponseEntity.badRequest().body(ApiErrorResponse.builder()
                .status(400)
                .error("BAD_REQUEST")
                .message(message)
                .field(field)
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiErrorResponse.builder()
                .status(404)
                .error("NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(DuplicateTransactionException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateTransactionException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiErrorResponse.builder()
                .status(409)
                .error("CONFLICT")
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(InvalidStatementException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidStatement(InvalidStatementException ex) {
        return ResponseEntity.status(422).body(ApiErrorResponse.builder()
                .status(422)
                .error("UNPROCESSABLE_ENTITY")
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiErrorResponse.builder()
                .status(401)
                .error("UNAUTHORIZED")
                .message("Incorrect email or password.")
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleFileTooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(413).body(ApiErrorResponse.builder()
                .status(413)
                .error("PAYLOAD_TOO_LARGE")
                .message("This file is too large. Please upload files under 20MB.")
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.builder()
                .status(400)
                .error("BAD_REQUEST")
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiErrorResponse.builder()
                .status(429)
                .error("TOO_MANY_REQUESTS")
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex) {
        // Log internally but never expose to user
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiErrorResponse.builder()
                .status(500)
                .error("INTERNAL_SERVER_ERROR")
                .message("Something went wrong on our end. Please try again.")
                .timestamp(Instant.now())
                .requestId(generateRequestId())
                .build());
    }

    private String generateRequestId() {
        return "req_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
