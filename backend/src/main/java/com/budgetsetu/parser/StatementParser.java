package com.budgetsetu.parser;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Interface that all statement parsers must implement.
 * Each bank/UPI format gets its own parser implementation.
 */
public interface StatementParser {

    /**
     * Parse a statement file and extract transaction rows.
     *
     * @param inputStream the uploaded file
     * @param fileName    original file name for format detection
     * @return list of parsed rows as key-value maps
     */
    List<Map<String, String>> parse(InputStream inputStream, String fileName);

    /**
     * @return the source identifier this parser handles (e.g., "HDFC_PDF", "PHONEPE_CSV")
     */
    String getSource();
}
