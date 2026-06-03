package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class BankDetector {

    private final List<BankStatementParser> bankParsers;

    public BankDetector(List<BankStatementParser> bankParsers) {
        this.bankParsers = bankParsers;
    }

    /**
     * Detect which bank parser handles this text/file, or null if none match.
     */
    public BankStatementParser detect(String text, String fileName) {
        for (BankStatementParser parser : bankParsers) {
            if (parser.canHandle(text, fileName)) {
                return parser;
            }
        }
        return null;
    }

    /**
     * Get parser by bank key, or null.
     */
    public BankStatementParser getByKey(String bankKey) {
        if (bankKey == null || bankKey.isBlank() || "AUTO".equalsIgnoreCase(bankKey)) {
            return null;
        }
        for (BankStatementParser parser : bankParsers) {
            if (parser.getBankKey().equalsIgnoreCase(bankKey)) {
                return parser;
            }
        }
        return null;
    }

    /**
     * Return all registered bank keys + display names for the frontend dropdown.
     */
    public List<Map<String, String>> getAvailableBanks() {
        return bankParsers.stream()
                .map(parser -> Map.of(
                        "key", parser.getBankKey(),
                        "displayName", parser.getBankDisplayName()
                ))
                .collect(Collectors.toList());
    }
}
