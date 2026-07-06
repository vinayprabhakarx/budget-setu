package com.budgetsetu.email;

public class EmailTemplateBuilder {

    private static final String PRIMARY_COLOR = "#1A5C4A"; // BudgetSetu Brand
    private static final String BG_COLOR = "#F9F8F7";      // App background
    private static final String CARD_BG = "#FFFFFF";       // White
    private static final String TEXT_MAIN = "#1A1917";     // Primary text
    private static final String TEXT_MUTED = "#534E49";    // Secondary text

    /**
     * Builds a bullet-proof, beautifully styled HTML email string.
     */
    public static String buildActionEmail(String title, String greeting, String bodyText, String buttonText, String buttonUrl, String footerText) {
        StringBuilder html = new StringBuilder();
        
        // Boilerplate for bullet-proof emails
        html.append("<!DOCTYPE html>\n");
        html.append("<html lang=\"en\">\n");
        html.append("<head>\n");
        html.append("<meta charset=\"UTF-8\">\n");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n");
        html.append("<title>").append(title).append("</title>\n");
        html.append("</head>\n");
        html.append("<body style=\"margin: 0; padding: 0; background-color: ").append(BG_COLOR).append("; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important;\">\n");
        
        // Wrapper Table
        html.append("<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: ").append(BG_COLOR).append("; padding: 60px 0;\">\n");
        html.append("  <tr>\n");
        html.append("    <td align=\"center\">\n");
        
        // Card Table
        html.append("      <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"background-color: ").append(CARD_BG).append("; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden; max-width: 600px; width: 100%;\">\n");
        
        // Header
        html.append("        <tr>\n");
        html.append("          <td align=\"center\" style=\"padding: 30px 40px; border-bottom: 1px solid #E2DFDB;\">\n");
        html.append("            <h1 style=\"margin: 0; color: ").append(PRIMARY_COLOR).append("; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;\">BudgetSetu</h1>\n");
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        // Content
        html.append("        <tr>\n");
        html.append("          <td style=\"padding: 40px;\">\n");
        if (greeting != null && !greeting.isEmpty()) {
            html.append("            <p style=\"margin: 0 0 24px 0; color: ").append(TEXT_MAIN).append("; font-size: 20px; font-weight: 600;\">").append(greeting).append("</p>\n");
        }
        
        // Process bodyText (allow double newline to split paragraphs)
        String[] paragraphs = bodyText.split("\n\n");
        for (String p : paragraphs) {
            html.append("            <p style=\"margin: 0 0 20px 0; color: ").append(TEXT_MUTED).append("; font-size: 16px; line-height: 26px;\">").append(p.replace("\n", "<br/>")).append("</p>\n");
        }
        
        // Action Button
        if (buttonText != null && buttonUrl != null && !buttonText.isEmpty()) {
            html.append("            <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin-top: 30px; margin-bottom: 10px;\">\n");
            html.append("              <tr>\n");
            html.append("                <td align=\"center\">\n");
            html.append("                  <a href=\"").append(buttonUrl).append("\" style=\"display: inline-block; padding: 14px 36px; background-color: ").append(PRIMARY_COLOR).append("; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;\">").append(buttonText).append("</a>\n");
            html.append("                </td>\n");
            html.append("              </tr>\n");
            html.append("            </table>\n");
        }
        
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        // Footer inside card
        html.append("        <tr>\n");
        html.append("          <td style=\"padding: 30px 40px; background-color: #F2F0EE; border-top: 1px solid #E2DFDB; text-align: center;\">\n");
        if (footerText != null) {
            html.append("            <p style=\"margin: 0; color: #9A9390; font-size: 14px; line-height: 22px;\">").append(footerText).append("</p>\n");
        } else {
            html.append("            <p style=\"margin: 0; color: #9A9390; font-size: 14px; line-height: 22px;\">You received this email because you are registered with BudgetSetu.</p>\n");
        }
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        html.append("      </table>\n");
        
        // Company address/unsubscribe (spam compliance outside the card)
        html.append("      <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"max-width: 600px; width: 100%; margin-top: 20px;\">\n");
        html.append("        <tr>\n");
        html.append("          <td align=\"center\" style=\"padding: 0 40px;\">\n");
        html.append("            <p style=\"margin: 0 0 10px 0; color: #9A9390; font-size: 13px; line-height: 18px;\">&copy; ").append(java.time.Year.now().getValue()).append(" BudgetSetu. All rights reserved.</p>\n");
        html.append("            <p style=\"margin: 0; color: #9A9390; font-size: 12px; line-height: 18px;\">This email was sent securely. If you need help, please contact our support team.</p>\n");
        html.append("          </td>\n");
        html.append("        </tr>\n");
        html.append("      </table>\n");
        
        html.append("    </td>\n");
        html.append("  </tr>\n");
        html.append("</table>\n");
        
        html.append("</body>\n");
        html.append("</html>");
        
        return html.toString();
    }
}
