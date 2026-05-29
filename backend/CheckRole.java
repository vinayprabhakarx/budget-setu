import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckRole {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/budgetsetu";
        String user = "budgetsetu_user";
        String pass = "your_strong_password_here"; // Using from .env

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT email, role FROM users WHERE email = 'try.vinayprabhakar@gmail.com'")) {
            
            if (rs.next()) {
                System.out.println("User email: " + rs.getString("email"));
                System.out.println("User role: " + rs.getString("role"));
            } else {
                System.out.println("User not found!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
