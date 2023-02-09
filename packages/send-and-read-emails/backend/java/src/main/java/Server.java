import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.*;
import com.nylas.Thread;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;

import static spark.Spark.*;

public class Server {
	public static final Type JSON_MAP = new TypeToken<Map<String, String>>(){}.getType();
	private static final Gson GSON = new Gson();

	public static void main(String[] args) throws RequestFailedException, IOException {
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

		post("/nylas/generate-auth-url", (request, response) -> {
			Map<String, String> requestBody = GSON.fromJson(request.body(), JSON_MAP);

			return application.hostedAuthentication()
					.urlBuilder()
					.loginHint(requestBody.get("email_address"))
					.redirectUri(clientUri + requestBody.get("success_url"))
					.scopes(Scope.EMAIL_READ_ONLY, Scope.EMAIL_MODIFY, Scope.EMAIL_SEND)
					.buildUrl();
		});

		/*
		 * Before we start our backend, we should whitelist our frontend as a redirect
		 * URI to ensure the auth completes
		 */
		application.addRedirectUri(clientUri);
		System.out.println("Application whitelisted.");
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
