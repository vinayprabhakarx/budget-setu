package com.budgetsetu.parser;

import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.util.Locale;

public class TestRegex {
    public static void main(String[] args) {
        String clean = "14 MAY'26".trim().replaceAll("\\s+", " ");
        if (clean.matches("\\d{1,2}[-\\s,']+[A-Za-z]{3,9}[-\\s,']+\\d{2,4}")) {
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);
            String[] parts = clean.split("[-\\s,']+");
            int year = Integer.parseInt(parts[2]);
            if (year < 100)
                year += 2000;
            String m = parts[1].length() > 3 ? parts[1].substring(0, 3) : parts[1];
            m = m.substring(0, 1).toUpperCase() + m.substring(1).toLowerCase();
            LocalDate d = LocalDate.parse(parts[0] + " " + m + " " + year, dtf);
            System.out.println(d.toString());
        } else {
            System.out.println("No match");
        }
    }
}
