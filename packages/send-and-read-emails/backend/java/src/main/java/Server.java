import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.*;
import com.nylas.models.AuthProvider;
import com.nylas.models.CodeExchangeRequest;
import com.nylas.models.CodeExchangeResponse;
import com.nylas.models.CreateRedirectUriRequest;
import com.nylas.models.ServerSideHostedAuthResponse;
import com.nylas.models.Platform;
import com.nylas.models.RedirectUri;
import com.nylas.models.ServerSideHostedAuthRequest;
import com.nylas.models.UrlForAuthenticationConfig;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import spark.utils.StringUtils;
import utils.User;
import utils.MockDB;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.eclipse.jetty.server.UserIdentity.Scope;

import static spark.Spark.*;

public class Server {
	public static final Type JSON_MAP = new TypeToken<Map<String, String>>(){}.getType();
	private static final Gson GSON = new Gson();
	private static Dotenv dotenv = loadEnv();
	private static String NYLAS_API_SERVER = dotenv.get("NYLAS_API_SERVER", "https://api.nylas.com");
	private static String NYLAS_API_KEY = dotenv.get("NYLAS_API_KEY", "");
	private static String NYLAS_CLIENT_ID = dotenv.get("NYLAS_CLIENT_ID", "");
	private static String NYLAS_CLIENT_SECRET = dotenv.get("NYLAS_CLIENT_SECRET", "");

	public static void main(String[] args) throws IOException, URISyntaxException {

		// The port the Spark app will run on
		port(9000);

		// Enable CORS
		enableCORS();

		// Initialize an instance of the Nylas SDK using the client credentials
		NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

		/*
		 * Before we start our backend, we should register our frontend as a redirect
		 * URI to ensure the auth completes
		 */
		String clientUri = dotenv.get("CLIENT_URI", "http://localhost:" + dotenv.get("PORT", "3000"));
		RedirectUri redirectUri = nylasClient.applications().redirectUris().create(new CreateRedirectUriRequest(clientUri, Platform.WEB, null)).getData();

		System.out.println("Application registered.");
		System.out.println("Redirect URI: " + redirectUri.getId());


		/*
		 * '/nylas/generate-auth-url': This route builds the URL for
		 * authenticating users to your Nylas application via Hosted Authentication
		 */
		post("/nylas/generate-auth-url", (request, response) -> {
			Map<String, String> requestBody = GSON.fromJson(request.body(), JSON_MAP);

			ServerSideHostedAuthResponse serverSideHostedAuthResponse = nylasClient.auth().serverSideHostedAuth(
				new ServerSideHostedAuthRequest.Builder(clientUri)
					.loginHint(requestBody.get("email_address"))
					.build()
			).getData();
			
			return serverSideHostedAuthResponse.getUrl();
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


			NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient(NYLAS_API_SERVER)
				.account(user.getAccessToken());

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
			NylasAccount nylas = new NylasClient(NYLAS_API_SERVER).account(user.getAccessToken());

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
			NylasAccount nylas = new NylasClient(NYLAS_API_SERVER).account(user.getAccessToken());

			String messageId = request.queryParams("id");

			return nylas.messages().get(messageId).toJSON();
		});

		get("/nylas/file", (request, response) -> {
			User user = isAuthenticated(request);

			// Create a Nylas API client instance using the user's access token
			NylasAccount nylas = new NylasClient(NYLAS_API_SERVER).account(user.getAccessToken());

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
