import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.*;
import com.nylas.services.Tunnel;
import com.nylas.Notification.Delta;
import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import spark.utils.StringUtils;
import utils.User;
import utils.MockDB;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static spark.Spark.*;

public class Server {
	public static final Type JSON_MAP = new TypeToken<Map<String, String>>(){}.getType();
	private static final Gson GSON = new Gson();

	public static void main(String[] args) throws RequestFailedException, IOException, URISyntaxException {
		Dotenv dotenv = loadEnv();

		// The port the Spark app will run on
		port(9000);

		// Enable CORS
		enableCORS();

		// Initialize an instance of the Nylas SDK using the client credentials
		NylasApplication application = new NylasClient()
				.application(dotenv.get("NYLAS_CLIENT_ID"), dotenv.get("NYLAS_CLIENT_SECRET"));

		/*
		 * Before we start our backend, we should whitelist our frontend as a redirect
		 * URI to ensure the auth completes
		 */
		String clientUri = dotenv.get("CLIENT_URI", "http://localhost:" + dotenv.get("PORT", "3000"));
		application.addRedirectUri(clientUri);
		System.out.println("Application whitelisted.");

		// Start the Nylas webhook
		Tunnel webhookTunnel = new Tunnel.Builder(application, new HandleNotifications()).build();
		webhookTunnel.connect();

		post("/nylas/generate-auth-url", (request, response) -> {
			Map<String, String> requestBody = GSON.fromJson(request.body(), JSON_MAP);

			return application.hostedAuthentication()
					.urlBuilder()
					.loginHint(requestBody.get("email_address"))
					.redirectUri(clientUri + requestBody.get("success_url"))
					.scopes(Scope.CALENDAR)
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
			User user = MockDB.createOrUpdateUser(accessToken.getEmailAddress(), accessToken.getAccessToken());

			// Return an authorization object to the user
			Map<String, String> responsePayload = new HashMap<>();
			responsePayload.put("id", user.getId());
			responsePayload.put("emailAddress", user.getEmailAddress());
			return GSON.toJson(responsePayload);
		});

		// Load additional routes
		routes();
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

	/**
	 * Additional routes for the use case example
	 */
	private static void routes() {
		get("/nylas/read-events", (request, response) -> {
			User user = isAuthenticated(request);

			String calendarId = request.queryParams("calendarId");
			String startsAfter = request.queryParams("startsAfter");
			String endsBefore = request.queryParams("endsBefore");
			String limit = request.queryParams("limit");

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			// Set the constraints
			EventQuery eventQuery = new EventQuery()
					.calendarId(calendarId)
					.startsAfter(Instant.ofEpochSecond(Long.parseLong(startsAfter)))
					.endsBefore(Instant.ofEpochSecond(Long.parseLong(endsBefore)))
					.limit(Integer.parseInt(limit));

			// Fetch the events with the constraints
			RemoteCollection<Event> events = nylas.events().list(eventQuery);
			ArrayList<String> eventList = new ArrayList<>();

			// Return the events
			events.forEach(event -> eventList.add(GSON.toJson(event)));
			return eventList;
		});
	}

	/**
	 * Loads .env file. Tries local directory first then a few directories up.
	 * @return The .env file contents
	 */
	private static Dotenv loadEnv() {
		try {
			return Dotenv.configure().load();
		} catch (DotenvException e) {
			return Dotenv.configure()
					.directory("../../../../")
					.load();
		}
	}

	/**
	 * Enables CORS on requests. This method is an initialization method and should be called once.
	 */
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

	/**
	 * Class that handles webhook notifications
	 */
	static class HandleNotifications implements Tunnel.WebhookHandler {
		@Override
		public void onMessage(Delta delta) {
			// Handle when an event is created
			if(delta.getTrigger().equals(Webhook.Trigger.EventCreated.getName())) {
				System.out.println("Webhook trigger received, event created. Details: " + delta);
			}
		}
	}
}
