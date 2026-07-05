package com.budgetsetu.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Indian currency formatting utilities.
 */
public final class CurrencyUtil {

    private static final Locale INDIA = Locale.of("en", "IN");

    private CurrencyUtil() {
    }

    /** Format as ₹1,23,456.00 */
    public static String formatINR(BigDecimal amount) {
        if (amount == null)
            return "₹0.00";
        NumberFormat format = NumberFormat.getCurrencyInstance(INDIA);
        return format.format(amount);
    }
}
