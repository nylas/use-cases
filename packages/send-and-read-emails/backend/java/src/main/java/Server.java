import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.*;
import com.nylas.Thread;
import io.github.cdimascio.dotenv.Dotenv;
import spark.utils.StringUtils;
import utils.User;
import utils.MockDB;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
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
		 * '/nylas/exchange-mailbox-token': This route exchanges an authorization
		 * code for an access token
		 * and sends the details of the authenticated user to the client
		 */
		post("/nylas/exchange-mailbox-token", (request, response) -> {
			Map<String, String> requestBody = new Gson().fromJson(request.body(), JSON_MAP);
			AccessToken accessToken = application.hostedAuthentication()
					.fetchToken(requestBody.get("token"));

			// Normally store the access token in the DB
			System.out.println("Access Token was generated for: " + accessToken.getEmailAddress());

			// Replace this mock code with your actual database operations
			System.out.println(requestBody);
			User user = MockDB.createOrUpdateUser(accessToken.getEmailAddress(), accessToken.getAccessToken());
			System.out.println(user);

			// Return an authorization object to the user
			Map<String, String> responsePayload = new HashMap<>();
			responsePayload.put("id", user.getId());
			responsePayload.put("emailAddress", user.getEmailAddress());
			return GSON.toJson(responsePayload);
		});

		post("/nylas/send-email", (request, response) -> {
			User user = isAuthenticated(request);
			Map<String, String> requestBody = new Gson().fromJson(request.body(), JSON_MAP);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			// Create a new draft object
			Draft draft = new Draft();

			// Fill draft with the contents from the payload
			draft.setFrom(new NameEmail(null, user.getEmailAddress()));
			draft.setTo(Collections.singletonList(new NameEmail(null, requestBody.get("to"))));
			draft.setSubject(requestBody.get("subject"));
			draft.setBody(requestBody.get("body"));

			// Send the draft
			Message message = nylas.drafts().send(draft);

			// Return the sent message object
			return GSON.toJson(message);
		});

		get("/nylas/read-emails", (request, response) -> {
			User user = isAuthenticated(request);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			/*
			 * Retrieve the first 5 threads from the Nylas API
			 * chaining expanded gives us the full thread object
			 */
			RemoteCollection<Thread> threads = nylas.threads().expanded(new ThreadQuery().limit(5));
			ArrayList<String> threadList = new ArrayList<>();

			threads.forEach(thread -> threadList.add(GSON.toJson(thread)));
			return threadList;
		});

		/*
		 * Before we start our backend, we should whitelist our frontend as a redirect
		 * URI to ensure the auth completes
		 */
		application.addRedirectUri(clientUri);
		System.out.println("Application whitelisted.");
	}

	/**
	 * Helper function that checks if the user is authenticated.
	 * If the user is authenticated, the user object will be returned.
	 * If the user is not authenticated, the server will return a 401 error.
	 * @param request The incoming request
	 * @return The user, if the user is authenticated
	 */
	private static User isAuthenticated(spark.Request request) {
		String auth = request.headers("authorization");
		if(StringUtils.isEmpty(auth)) {
			halt(401, "Unauthorized");
			return null;
		}

		User user = MockDB.findUser(auth);
		if(user == null) {
			halt(401, "Unauthorized");
		}

		return user;
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
