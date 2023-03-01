import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.*;
import com.nylas.Thread;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
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
		 * Before we start our backend, we should register our frontend as a redirect
		 * URI to ensure the auth completes
		 */
		String clientUri = dotenv.get("CLIENT_URI", "http://localhost:" + dotenv.get("PORT", "3000"));
		application.addRedirectUri(clientUri);
		System.out.println("Application registered.");

		/*
		 * Class that handles webhook notifications
		 */
		class HandleNotifications implements Tunnel.WebhookHandler {
			// Handle when a new message is created (sent)
			@Override
			public void onMessage(Delta delta) {
				if(delta.getTrigger().equals(Webhook.Trigger.MessageCreated.getName())) {
					System.out.println("Webhook trigger received, message created. Details: " + delta);
				} else if(delta.getTrigger().equals(Webhook.Trigger.AccountConnected.getName())) {
					System.out.println("Webhook trigger received, account connected. Details: " + delta);
				}
			}
		}

		// Start the Nylas webhook
		Tunnel webhookTunnel = new Tunnel.Builder(application, new HandleNotifications()).build();
		webhookTunnel.connect();

		/*
		 * '/nylas/generate-auth-url': This route builds the URL for
		 * authenticating users to your Nylas application via Hosted Authentication
		 */
		post("/nylas/generate-auth-url", (request, response) -> {
			Map<String, String> requestBody = GSON.fromJson(request.body(), JSON_MAP);

			return application.hostedAuthentication()
					.urlBuilder()
					.loginHint(requestBody.get("email_address"))
					.redirectUri(clientUri + requestBody.get("success_url"))
					.scopes(Scope.EMAIL_MODIFY, Scope.EMAIL_SEND)
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
		post("/nylas/send-email", (request, response) -> {
			User user = isAuthenticated(request);
			Map<String, String> requestBody = new Gson().fromJson(request.body(), JSON_MAP);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			// Create a new draft object
			Draft draft = new Draft();

			// Fill draft with the contents from the payload
			draft.setTo(Collections.singletonList(new NameEmail(null, requestBody.get("to"))));
			draft.setSubject(requestBody.get("subject"));
			draft.setBody(requestBody.get("body"));

			// Send the draft and return the message
			return nylas.drafts().send(draft).toJSON();
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

		get("/nylas/message", (request, response) -> {
			User user = isAuthenticated(request);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			String messageId = request.queryParams("id");

			return nylas.messages().get(messageId).toJSON();
		});

		get("/nylas/file", (request, response) -> {
			User user = isAuthenticated(request);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient().account(user.getAccessToken());

			// Fetch the file from the Nylas API
			String fileId = request.queryParams("id");
			File file = nylas.files().get(fileId);

			// Set the file's content type as the response type
			response.type(file.getContentType());

			// Download the file
			return nylas.files().downloadBytes(fileId);
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
}
