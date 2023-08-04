import static spark.Spark.before;
import static spark.Spark.exception;
import static spark.Spark.get;
import static spark.Spark.halt;
import static spark.Spark.options;
import static spark.Spark.port;
import static spark.Spark.post;
import static spark.Spark.delete;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nylas.NylasClient;
import com.nylas.models.Calendar;
import com.nylas.models.CodeExchangeRequest;
import com.nylas.models.CodeExchangeResponse;
import com.nylas.models.CreateEventQueryParams;
import com.nylas.models.CreateEventRequest;
import com.nylas.models.CreateEventRequest.When.Timespan;
import com.nylas.models.CreateRedirectUriRequest;
import com.nylas.models.Event;
import com.nylas.models.ListEventQueryParams;
import com.nylas.models.NylasApiError;
import com.nylas.models.NylasOAuthError;
import com.nylas.models.NylasSdkTimeoutError;
import com.nylas.models.Platform;
import com.nylas.models.RedirectUri;
import com.nylas.models.UrlForAuthenticationConfig;
import com.nylas.util.JsonHelper;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;

public class Server {
	public static final Type JSON_MAP = new TypeToken<Map<String, String>>() {
	}.getType();
	private static final Gson GSON = new Gson();
	private static final Dotenv dotenv = loadEnv();
	private static String PORT = dotenv.get("PORT", "3000");
	private static String NYLAS_API_SERVER = dotenv.get("NYLAS_API_SERVER", "https://api.nylas.com");
	private static String NYLAS_API_KEY = dotenv.get("NYLAS_API_KEY", "");
	private static String NYLAS_CLIENT_ID = dotenv.get("NYLAS_CLIENT_ID", "");
	private static String NYLAS_CLIENT_SECRET = dotenv.get("NYLAS_CLIENT_SECRET", "");

	public static void main(String[] args) throws NylasApiError, NylasSdkTimeoutError, IOException, URISyntaxException {

		// The port the Spark app will run on
		port(9000);

		// Enable CORS
		enableCORS();

		// Initialize an instance of the Nylas SDK using the client credentials
		NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

		/*
		 * Before we start our backend, we should register our frontend as a redirect
		 * URI. This is required for OAuth 2.0 Authentication with Nylas to work.
		 */
		String clientUri = dotenv.get("CLIENT_URI", "http://localhost:" + PORT);
		
		List<RedirectUri> redirectUris = nylasClient.applications().redirectUris().list().getData();
		if (redirectUris.stream().anyMatch(redirectUri -> redirectUri.getUrl().equals(clientUri))) {
			System.out.println("Redirect URI already registered.");
		} else {
			CreateRedirectUriRequest createRedirectUriRequest = new CreateRedirectUriRequest(clientUri, Platform.WEB, null);
			RedirectUri redirectUri =
			nylasClient.applications().redirectUris().create(createRedirectUriRequest).getData();
			System.out.println("Redirect URI registered: " + redirectUri.getId());
		}

		/*
		 * '/nylas/generate-auth-url': This route builds the URL for
		 * authenticating users to your Nylas application via Hosted Authentication
		 */
		post("/nylas/generate-auth-url", (request, response) -> {
			Map<String, String> requestBody = GSON.fromJson(request.body(), JSON_MAP);

			String authURL = nylasClient.auth().urlForOAuth2(
					new UrlForAuthenticationConfig.Builder(NYLAS_CLIENT_ID, clientUri)
							.loginHint(requestBody.get("emailAddress"))
							.build());

			return "{ \"auth_url\": \"" + authURL + "\" }"; 
		});

		get("/nylas/exchange-auth-code", (request, response) -> {
			String code = request.queryParams("code");
			String error = request.queryParams("error");
			String errorDescription = request.queryParams("error_description");

			if (error != null) {
				System.out.println("Error: " + error);
				System.out.println("Error Description: " + errorDescription);
				return null;
			}

			CodeExchangeResponse codeExchangeResponse = nylasClient.auth().exchangeCodeForToken(
					new CodeExchangeRequest.Builder(clientUri, code, NYLAS_CLIENT_ID, NYLAS_CLIENT_SECRET).build());

			return "{ \"grantId\": \"" + codeExchangeResponse.getGrantId() + "\" }";
		});

		// Load additional routes
		routes();

		// Handle Nylas OAuth exception
		exception(NylasOAuthError.class, (e, request, response) -> {
			e.printStackTrace();
			response.status(e.getStatusCode());

			Map<String, String> error = new HashMap<String,String>();
			error.put("message", e.getErrorDescription());

			response.body(GSON.toJson(error));
		});

		// Handle Nylas API exception
		exception(NylasApiError.class, (e, request, response) -> {
			e.printStackTrace();
			response.status(e.getStatusCode());

			Map<String, String> error = new HashMap<String,String>();
			error.put("message", e.getMessage());
			error.put("type", e.getType());

			response.body(GSON.toJson(error));
		});

		// Handle all other exceptions
		exception(Exception.class, (e, request, response) -> {
			e.printStackTrace();
			response.status(500);

			Map<String, String> error = new HashMap<String,String>();
			error.put("message", "Unexpected error");;

			response.body(GSON.toJson(error));
		});
	}

	/**
	 * Additional routes for the use case example
	 */
	private static void routes() {
		get("/nylas/:grantId/read-events", (request, response) -> {
			String grantId = request.params("grantId");

			String calendarId = request.queryParams("calendarId");
			if (calendarId == null) {
				halt(400, "{ \"message\": \"Calendar ID is required\" }");
				return null;
			}

			String startsAfter = request.queryParams("startsAfter");
			String endsBefore = request.queryParams("endsBefore");
			Integer limit = Integer.parseInt(request.queryParamOrDefault("limit", "20"));

			// Initialize an instance of the Nylas SDK using the client credentials
			NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

			ListEventQueryParams listEventQueryParams = new ListEventQueryParams.Builder(calendarId)
					.limit(limit)
					.start(startsAfter)
					.end(endsBefore)
					.build();

			List<Event> events = nylasClient.events().list(grantId, listEventQueryParams).getData();

			return JsonHelper.listToJson(events);
		});

		get("/nylas/:grantId/read-calendars", (request, response) -> {
			String grantId = request.params("grantId");

			NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

			List<Calendar> calendars = nylasClient.calendars().list(grantId).getData();

			return JsonHelper.listToJson(calendars);
		});

		post("/nylas/:grantId/create-event", (request, response) -> {
			String grantId = request.params("grantId");
			
			Map<String, String> requestBody = new Gson().fromJson(request.body(),
					JSON_MAP);

			String calendarId = requestBody.get("calendarId");
			String title = requestBody.get("title");
			String description = requestBody.get("description");
			Integer startTime = Integer.parseInt(requestBody.get("startTime"), 10);
			Integer endTime = Integer.parseInt(requestBody.get("endTime"), 10);
			List<String> participantEmails = Arrays.asList(requestBody.get("participants").split(",", 0));

			NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();

			Timespan timespan = new Timespan.Builder(startTime, endTime).build();

			List<CreateEventRequest.Participant> participants = participantEmails.stream()
					.map(email -> new CreateEventRequest.Participant.Builder(email).build())
					.collect(Collectors.toList());

			CreateEventRequest createEventRequest = new CreateEventRequest.Builder(timespan)
					.participants(participants)
					.title(title)
					.description(description)
					.build();

			CreateEventQueryParams createEventQueryParams = new CreateEventQueryParams.Builder(calendarId).build();

			Event event = nylasClient.events().create(grantId, createEventRequest, createEventQueryParams).getData();

			return JsonHelper.objectToJson(event);
		});

		delete("/nylas/:grantId/delete-grant", (request, response) -> {
			String grantId = request.params("grantId");
			if (grantId == null) {
				halt(401, "{ \"message\": \"Unauthorized\" }");
				return null;
			}

			NylasClient nylasClient = new NylasClient.Builder(NYLAS_API_KEY).baseUrl(NYLAS_API_SERVER).build();
			
			nylasClient.auth().grants().destroy(grantId);

			return "{ \"success\": true }";
		});
	}

	/**
	 * Loads .env file. Tries local directory first then a few directories up.
	 * 
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
	 * Enables CORS on requests. This method is an initialization method and should
	 * be called once.
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
			response.header("Access-Control-Allow-Headers",
					"X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept, Authorization");
			response.type("application/json");
		});
	}
}
