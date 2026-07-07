package com.budgetsetu.parser;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class ParserUtil {

    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        String clean = accountNumber.replaceAll("[^\\d]", "");
        if (clean.length() <= 4) {
            return "XXX" + clean;
        }
        return "XXX" + clean.substring(clean.length() - (clean.length() > 4 ? 4 : 3));
    }

    public static String normalizeDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank())
            return null;
        String clean = dateStr.trim().replaceAll("\\s+", " ");

        try {
            // Try standard ISO
            if (clean.matches("\\d{4}-\\d{2}-\\d{2}.*")) {
                return clean.substring(0, 10);
            }
            // Try DD/MM/YYYY or DD-MM-YYYY
            if (clean.matches("\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}")) {
                String[] parts = clean.split("[-/.]");
                int day = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                int year = Integer.parseInt(parts[2]);
                if (year < 100)
                    year += 2000;
                return String.format("%04d-%02d-%02d", year, month, day);
            }
            // Try DD MMM YY or DD-MMM-YYYY or DD MMMM YYYY
            if (clean.matches("\\d{1,2}[-\\s,']+[A-Za-z]{3,9}[-\\s,']+\\d{2,4}")) {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);
                String[] parts = clean.split("[-\\s,']+");
                int year = Integer.parseInt(parts[2]);
                if (year < 100)
                    year += 2000;
                String m = parts[1].length() > 3 ? parts[1].substring(0, 3) : parts[1];
                m = m.substring(0, 1).toUpperCase() + m.substring(1).toLowerCase();
                LocalDate d = LocalDate.parse(parts[0] + " " + m + " " + year, dtf);
                return d.toString();
            }
            // Try Month DD, YYYY
            if (clean.matches("[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4}")) {
                String normalizedMonth = clean.replaceAll(",.*", "").replaceAll("\\d.*", "").trim();
                if (normalizedMonth.equalsIgnoreCase("Sept"))
                    normalizedMonth = "Sep";
                String dayStr = clean.replaceAll("[A-Za-z]+", "").replaceAll(",", "").trim().split("\\s+")[0];
                String yearStr = clean.replaceAll("[A-Za-z]+", "").replaceAll(",", "").trim().split("\\s+")[1];

                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM d yyyy", Locale.ENGLISH);
                LocalDate d = LocalDate.parse(normalizedMonth.substring(0, 3) + " " + dayStr + " " + yearStr, dtf);
                return d.toString();
            }
        } catch (Exception ignored) {
        }

        return clean; // Fallback
    }

    public static String detectMode(String narration, String fallback) {
        if (narration == null)
            return fallback;
        String n = narration.toUpperCase();
        if (n.contains("UPI") || n.contains("PAYTM") || n.contains("PHONEPE") || n.contains("AMAZONPAY")
                || n.contains("GPAY") || n.contains("BHARATPE") || n.contains("CRED"))
            return "UPI";
        if (n.contains("IMPS") || n.contains("NEFT") || n.contains("RTGS") || n.contains("INB")
                || n.contains("NETBANKING") || n.contains("NET BANKING") || n.contains("INTERNET BANKING")
                || n.matches(".*\\bNET\\b.*"))
            return "NETBANKING";
        if (n.contains("ATM") || n.matches(".*\\bPOS\\b.*") || n.contains("ECOM") || n.contains("CARD"))
            return "CARD";
        if (n.contains("CASH"))
            return "CASH";
        if (n.contains("CBDC") || n.contains("E-RUPEE") || n.contains("ERUPEE"))
            return "CBDC";
        if (n.contains("CHEQUE") || n.contains("CHQ") || n.contains("CLG"))
            return "CHEQUE";
        if (n.contains("WALLET"))
            return "WALLET";

        // These are more like categories, but we keep them as OTHER if they are not
        // standard payment modes
        if (n.contains("CREDIT INTEREST") || n.contains("INT CR") || n.contains("MC COMM") || n.contains("GST")
                || n.contains("CHARGES") || n.contains("POSREFUND") || n.contains("REFUND") || n.contains("EMI")
                || n.contains("MANDATEE") || n.contains("AUTOPAY") || n.contains("AUTO PAY"))
            return "OTHER";

        return fallback;
    }

    public static String detectSuggestedCategory(String narration) {
        if (narration == null)
            return null;
        String n = narration.toUpperCase();
        if (n.contains("MC COMM") || n.contains("GST") || n.contains("CHARGES") || n.contains("FEE")
                || n.contains("DEDUCTION") || n.contains("AMC"))
            return "Bank Charges";
        if (n.contains("CREDIT INTEREST") || n.contains("INT CR") || n.contains("INT. PAID")
                || n.contains("INTEREST PAID") || n.contains("INT CR.") || n.contains("INT.PD"))
            return "Interest Income";
        if (n.contains("ATM WDL") || n.contains("CASH WITHDRAWAL"))
            return "Cash Withdrawal";
        if (n.contains("EMI") || n.contains("LOAN"))
            return "Loan / EMI";
        if (n.contains("POSREFUND") || n.contains("REFUND"))
            return "Refunds";
        return null;
    }

    public static String normalizeMerchant(String rawName) {
        if (rawName == null || rawName.isBlank())
            return null;
        String upper = rawName.toUpperCase();
        if (upper.contains("AMAZON") && !upper.contains("PAYLATER"))
            return "Amazon Pay";
        if (upper.contains("AMAZONPAYLATER") || upper.contains("AMAZON PAY LATER"))
            return "Amazon Pay Later";
        if (upper.contains("ZEPTO"))
            return "Zepto";
        if (upper.contains("PAYTM") || upper.contains("PTYS") || upper.contains("PTM"))
            return "Paytm";
        if (upper.contains("GPAY") || upper.contains("GOOGLE"))
            return "Google Pay";
        if (upper.contains("PHONEPE"))
            return "PhonePe";
        if (upper.contains("RAPIDO") || upper.contains("RZP@RX"))
            return "Rapido";
        if (upper.contains("JIO") || upper.contains("JIOP"))
            return "Jio";
        if (upper.contains("SNAPMINT"))
            return "Snapmint";
        if (upper.contains("IRCTC") || upper.contains("RAILSBI"))
            return "IRCTC";
        if (upper.contains("AIRTEL"))
            return "Airtel";
        if (upper.contains("SWIGGY"))
            return "Swiggy";
        if (upper.contains("SPOTIFY"))
            return "Spotify";
        if (upper.contains("BHARATPE") || upper.contains("BHARAT PE"))
            return "BharatPe";
        if (upper.contains("NETFLIX"))
            return "Netflix";
        if (upper.contains("LENSKART"))
            return "Lenskart";
        if (upper.contains("BMRC") || upper.contains("BANGALORE METRO"))
            return "Bangalore Metro";

        // basic person check - if space exists and length > 4, assume person for now
        if (rawName.contains(" ") && rawName.length() > 4)
            return null;
        return rawName.trim();
    }

    public static LocalDate[] extractDateRangeFromHeader(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String header = text.length() > 3000 ? text.substring(0, 3000) : text;
        
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b(\\d{1,2}[-/.\\s,]+[a-zA-Z]{3,9}[-/.\\s,']+\\d{2,4}(?!:)|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\b").matcher(header);
        
        LocalDate minDate = null;
        LocalDate maxDate = null;
        
        while (m.find()) {
            String dateStr = m.group(1);
            String normalized = normalizeDate(dateStr);
            if (normalized != null && normalized.matches("\\d{4}-\\d{2}-\\d{2}")) {
                try {
                    LocalDate d = LocalDate.parse(normalized);
                    // Sanity check: must be between 2000 and next year
                    if (d.getYear() > 2000 && d.getYear() <= LocalDate.now().getYear() + 1) {
                        if (minDate == null || d.isBefore(minDate)) {
                            minDate = d;
                        }
                        if (maxDate == null || d.isAfter(maxDate)) {
                            maxDate = d;
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
        
        if (minDate != null && maxDate != null) {
            return new LocalDate[]{minDate, maxDate};
        }
        return null;
    }

    public static Map<String, String> emptyTransaction() {
        Map<String, String> txn = new HashMap<>();
        txn.put("transaction_date", null);
        txn.put("value_date", null);
        txn.put("transaction_time", null);
        txn.put("narration", "");
        txn.put("transaction_type", "DEBIT");
        txn.put("mode", "OTHER");
        txn.put("amount", "0.0");
        txn.put("withdrawal_amount", "0.0");
        txn.put("deposit_amount", "0.0");
        txn.put("balance", null);
        txn.put("transaction_id", "");
        txn.put("cheque_number", null);
        txn.put("payee", "");
        txn.put("payer", "");
        txn.put("upi_id", "");
        txn.put("merchant", null);
        txn.put("remarks", null);
        return txn;
    }
}
