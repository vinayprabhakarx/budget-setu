package com.budgetsetu.repository.mongo;

import com.budgetsetu.model.mongo.ContactSubmission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactSubmissionRepository extends MongoRepository<ContactSubmission, String> {
    List<ContactSubmission> findAllByOrderByCreatedAtDesc();
}
