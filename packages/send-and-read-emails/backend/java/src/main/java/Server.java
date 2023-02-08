import com.nylas.NylasApplication;
import com.nylas.NylasClient;
import io.github.cdimascio.dotenv.Dotenv;

import static spark.Spark.*;

public class Server {
	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure()
				.directory("../../../../")
				.load();

		// The port the Spark app will run on
		port(9000);

		// Enable CORS
		enableCORS();

		// The uri for the frontend
		String clientUri = dotenv.get("CLIENT_URI", "http://localhost:" + dotenv.get("PORT", "3000"));

		// Initialize an instance of the Nylas SDK using the client credentials
		NylasApplication application = new NylasClient()
				.application(dotenv.get("NYLAS_CLIENT_ID"), dotenv.get("NYLAS_CLIENT_SECRET"));

	}

	// Enables CORS on requests. This method is an initialization method and should be called once.
	private static void enableCORS() {

		options("/*", (request, response) -> {

			String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
			if (accessControlRequestHeaders != null) {
				response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
			}

			String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
			if (accessControlRequestMethod != null) {
				response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
			}

			return "OK";
		});

		before((request, response) -> {
			response.header("Access-Control-Allow-Origin", "*");
			response.header("Access-Control-Request-Method", "HEAD,GET,PUT,POST,DELETE,OPTIONS");
			response.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept, Authorization");
			response.type("application/json");
		});
	}
}
