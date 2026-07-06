package com.budgetsetu.email;

public class EmailTemplateBuilder {

    private static final String PRIMARY_COLOR = "#1A5C4A"; // Light Brand
    private static final String BG_COLOR = "#F9F8F7";      // Light App BG
    private static final String CARD_BG = "#FFFFFF";       // Light Card BG
    private static final String TEXT_MAIN = "#1A1917";     // Light Primary Text
    private static final String TEXT_MUTED = "#534E49";    // Light Secondary Text
    private static final String BORDER_COLOR = "#E2DFDB";  // Light Border
    private static final String FOOTER_BG = "#F2F0EE";     // Light Footer BG
    private static final String TEXT_LIGHT = "#9A9390";    // Light Footer Text

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
        html.append("<meta name=\"color-scheme\" content=\"light dark\">\n");
        html.append("<meta name=\"supported-color-schemes\" content=\"light dark\">\n");
        html.append("<title>").append(title).append("</title>\n");
        
        // Add Dark Mode styles
        html.append("<style>\n");
        html.append("  @media (prefers-color-scheme: dark) {\n");
        html.append("    body, .email-bg { background-color: #141312 !important; }\n");
        html.append("    .email-card { background-color: #1E1D1B !important; }\n");
        html.append("    .email-text-main { color: #EDEAE7 !important; }\n");
        html.append("    .email-text-muted { color: #A09A94 !important; }\n");
        html.append("    .email-brand-text { color: #5CB5A0 !important; }\n");
        html.append("    .email-button { background-color: #5CB5A0 !important; color: #0C1F1A !important; }\n");
        html.append("    .email-border { border-color: #252320 !important; }\n");
        html.append("    .email-footer-bg { background-color: #141312 !important; }\n");
        html.append("    .email-footer-text { color: #6B6560 !important; }\n");
        html.append("  }\n");
        html.append("</style>\n");
        html.append("</head>\n");
        
        html.append("<body class=\"email-bg\" style=\"margin: 0; padding: 0; background-color: ").append(BG_COLOR).append("; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important;\">\n");
        
        // Wrapper Table
        html.append("<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"email-bg\" style=\"background-color: ").append(BG_COLOR).append(";\">\n");
        html.append("  <tr>\n");
        html.append("    <td align=\"center\" style=\"padding: 20px 10px;\">\n");
        
        // Card Table
        html.append("      <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" class=\"email-card\" style=\"background-color: ").append(CARD_BG).append("; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 600px; width: 100%;\">\n");
        
        // Header
        html.append("        <tr>\n");
        html.append("          <td align=\"center\" class=\"email-border\" style=\"padding: 30px 40px; border-bottom: 1px solid ").append(BORDER_COLOR).append(";\">\n");
        html.append("            <h1 class=\"email-brand-text\" style=\"margin: 0; color: ").append(PRIMARY_COLOR).append("; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;\">BudgetSetu</h1>\n");
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        // Content
        html.append("        <tr>\n");
        html.append("          <td style=\"padding: 40px;\">\n");
        if (greeting != null && !greeting.isEmpty()) {
            html.append("            <p class=\"email-text-main\" style=\"margin: 0 0 24px 0; color: ").append(TEXT_MAIN).append("; font-size: 20px; font-weight: 600;\">").append(greeting).append("</p>\n");
        }
        
        // Process bodyText
        String[] paragraphs = bodyText.split("\n\n");
        for (String p : paragraphs) {
            html.append("            <p class=\"email-text-muted\" style=\"margin: 0 0 20px 0; color: ").append(TEXT_MUTED).append("; font-size: 16px; line-height: 26px;\">").append(p.replace("\n", "<br/>")).append("</p>\n");
        }
        
        // Action Button
        if (buttonText != null && buttonUrl != null && !buttonText.isEmpty()) {
            html.append("            <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin-top: 30px; margin-bottom: 10px;\">\n");
            html.append("              <tr>\n");
            html.append("                <td align=\"center\">\n");
            html.append("                  <a href=\"").append(buttonUrl).append("\" class=\"email-button\" style=\"display: inline-block; padding: 14px 36px; background-color: ").append(PRIMARY_COLOR).append("; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;\">").append(buttonText).append("</a>\n");
            html.append("                </td>\n");
            html.append("              </tr>\n");
            html.append("            </table>\n");
        }
        
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        // Footer inside card
        html.append("        <tr>\n");
        html.append("          <td class=\"email-footer-bg email-border\" style=\"padding: 30px 40px; background-color: ").append(FOOTER_BG).append("; border-top: 1px solid ").append(BORDER_COLOR).append("; text-align: center;\">\n");
        if (footerText != null) {
            html.append("            <p class=\"email-footer-text\" style=\"margin: 0; color: ").append(TEXT_LIGHT).append("; font-size: 14px; line-height: 22px;\">").append(footerText).append("</p>\n");
        } else {
            html.append("            <p class=\"email-footer-text\" style=\"margin: 0; color: ").append(TEXT_LIGHT).append("; font-size: 14px; line-height: 22px;\">You received this email because you are registered with BudgetSetu.</p>\n");
        }
        html.append("          </td>\n");
        html.append("        </tr>\n");
        
        html.append("      </table>\n");
        
        // Company address/unsubscribe
        html.append("      <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"max-width: 600px; width: 100%; margin-top: 20px;\">\n");
        html.append("        <tr>\n");
        html.append("          <td align=\"center\" style=\"padding: 0 40px;\">\n");
        html.append("            <p class=\"email-footer-text\" style=\"margin: 0 0 10px 0; color: ").append(TEXT_LIGHT).append("; font-size: 13px; line-height: 18px;\">&copy; ").append(java.time.Year.now().getValue()).append(" BudgetSetu. All rights reserved.</p>\n");
        html.append("            <p class=\"email-footer-text\" style=\"margin: 0; color: ").append(TEXT_LIGHT).append("; font-size: 12px; line-height: 18px;\">This email was sent securely. If you need help, please contact our support team.</p>\n");
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
