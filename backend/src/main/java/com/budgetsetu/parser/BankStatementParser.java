package com.budgetsetu.parser;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Interface that all bank-specific statement parsers must implement.
 * Implementations must follow the canonical extraction rules defined in
 * StatementParser.md.
 */
public interface BankStatementParser {

    /**
     * Try to parse the statement from an input stream.
     * 
     * @param inputStream the statement file
     * @param fileName    the original file name
     * @param password    the password if the file is encrypted
     * @return list of parsed transactions matching the canonical schema, or empty
     *         list if format doesn't match
     */
    List<Map<String, String>> parse(InputStream inputStream, String fileName, String password);

    /**
     * Try to parse the statement from raw text (e.g. extracted PDF/CSV/HTML text).
     * 
     * @param text     the raw text content of the statement
     * @param fileName the original file name
     * @return list of parsed transactions matching the canonical schema, or empty
     *         list if format doesn't match
     */
    List<Map<String, String>> parseText(String text, String fileName);

    /**
     * Return true if the file or text content matches this bank's statement format.
     * 
     * @param text     the raw text content of the statement
     * @param fileName the original file name
     * @return true if this parser can handle the statement
     */
    boolean canHandle(String text, String fileName);

    /**
     * Bank identifier key (e.g., "HDFC", "SBI", "ICICI")
     * 
     * @return a unique string identifier for this parser
     */
    String getBankKey();

    /**
     * Human-readable bank display name
     * 
     * @return display name to show in the UI dropdown
     */
    String getBankDisplayName();
}
