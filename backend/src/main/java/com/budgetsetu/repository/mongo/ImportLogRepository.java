package com.budgetsetu.repository.mongo;

import com.budgetsetu.model.mongo.ImportLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImportLogRepository extends MongoRepository<ImportLog, String> {

    Optional<ImportLog> findByImportId(String importId);

    void deleteByImportId(String importId);

    void deleteAllByUserId(String userId);
}
