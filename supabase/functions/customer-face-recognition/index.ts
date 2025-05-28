import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  ListCollectionsCommand,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

// Helper function to parse base64 image data
function getImageBytes(base64ImageData: string): Uint8Array {
  if (!base64ImageData) {
    throw new Error("No image data provided");
  }

  const parts = base64ImageData.split(",");
  if (!parts || parts.length !== 2 || !parts[1]) {
    throw new Error(
      "Invalid base64 image data format. Expected 'data:<mime_type>;base64,<data>'."
    );
  }
  const base64String = parts[1];
  return decode(base64String);
}

console.log(
  "customer-face-recognition: Edge function script loaded. Version 6 (Enhanced Logging)."
);

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const url = new URL(req.url);
  const isHealthCheckViaQuery =
    url.searchParams.get("action") === "health_check";

  console.log(
    `Request received: ${req.method} ${req.url}, Origin: ${
      requestOrigin || "N/A"
    }`
  );

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request.");
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  try {
    console.log("Step: Checking environment variables for AWS configuration.");
    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const awsRegion = Deno.env.get("AWS_REGION");
    const collectionId = Deno.env.get("AWS_REKOGNITION_COLLECTION_ID");

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !collectionId) {
      const missingVars = [
        !awsAccessKeyId && "AWS_ACCESS_KEY_ID",
        !awsSecretAccessKey && "AWS_SECRET_ACCESS_KEY",
        !awsRegion && "AWS_REGION",
        !collectionId && "AWS_REKOGNITION_COLLECTION_ID",
      ]
        .filter(Boolean)
        .join(", ");

      console.error(
        `FATAL: Missing AWS configuration in environment variables: ${missingVars}. Cannot proceed with AWS SDK initialization.`
      );
      return new Response(
        JSON.stringify({
          error: `Server configuration error: Missing AWS environment variables (${missingVars}).`,
          success: false,
        }),
        {
          headers: responseHeaders,
          status: 500,
        }
      );
    }

    console.log(
      `Step: AWS Config Check OK. Region: ${awsRegion}, Collection ID: ${collectionId}, Access Key ID (first 5 chars): ${awsAccessKeyId.substring(
        0,
        5
      )}`
    );

    let rekognitionClient: RekognitionClient;
    try {
      console.log(
        "Step: Initializing AWS RekognitionClient with explicit credentials..."
      );
      rekognitionClient = new RekognitionClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });
      console.log("Step: AWS RekognitionClient initialized successfully.");
    } catch (sdkError: any) {
      console.error(
        "FATAL: Error initializing AWS RekognitionClient. Message:",
        sdkError.message,
        "Stack:",
        sdkError.stack,
        "Full Error:",
        JSON.stringify(sdkError)
      );
      return new Response(
        JSON.stringify({
          error: "AWS SDK client initialization failed. Check server logs.",
          details: sdkError.message,
          success: false,
        }),
        {
          headers: responseHeaders,
          status: 500,
        }
      );
    }

    // Health Check Logic
    if (req.method === "GET" && isHealthCheckViaQuery) {
      console.log("Step: Performing health check (GET request)...");
      try {
        console.log(
          "Health Check: Sending ListCollectionsCommand to AWS Rekognition..."
        );
        const command = new ListCollectionsCommand({ MaxResults: 1 });
        const response = await rekognitionClient.send(command);
        console.log(
          "Health Check: ListCollectionsCommand successful. AWS Rekognition connection healthy.",
          "Response Metadata:",
          response.$metadata
        );
        return new Response(
          JSON.stringify({
            success: true,
            message: "AWS Rekognition connection healthy.",
            collectionCount: response.CollectionIds?.length || 0,
            httpStatusCode: response.$metadata?.httpStatusCode,
          }),
          {
            headers: responseHeaders,
            status: 200,
          }
        );
      } catch (healthError: any) {
        console.error("Health Check: FAILED. Error details:", {
          message: healthError.message,
          name: healthError.name,
          code: (healthError as any).Code || (healthError as any).code, // SDK v2 vs v3 style
          requestId: healthError.$metadata?.requestId,
          httpStatusCode: healthError.$metadata?.httpStatusCode,
          stack: healthError.stack,
          fullError: JSON.stringify(healthError),
        });
        return new Response(
          JSON.stringify({
            error: "AWS Rekognition health check failed. See server logs.",
            details: healthError.message,
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 500,
          }
        );
      }
    }

    if (req.method === "POST") {
      console.log("Step: Processing POST request.");
      let body;
      try {
        body = await req.json();
        console.log("Step: Request body parsed successfully.");
      } catch (jsonError: any) {
        console.error(
          "Error parsing request JSON:",
          jsonError.message,
          jsonError.stack
        );
        return new Response(
          JSON.stringify({
            error: "Invalid request body: Malformed JSON.",
            details: jsonError.message,
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      const { action, image, customerId } = body;
      console.log(
        `Step: Action: ${action}, CustomerID: ${
          customerId || "N/A"
        }, Image data present: ${!!image}`
      );

      if (action === "health_check") {
        console.log("Step: Performing health check (POST request)...");
        // ... (keep existing POST health_check logic, adding detailed error logging as above)
        try {
          console.log(
            "Health Check (POST): Sending ListCollectionsCommand to AWS Rekognition..."
          );
          const command = new ListCollectionsCommand({ MaxResults: 1 });
          const response = await rekognitionClient.send(command);
          console.log(
            "Health Check (POST): ListCollectionsCommand successful.",
            "Response Metadata:",
            response.$metadata
          );
          return new Response(
            JSON.stringify({
              success: true,
              message: "AWS Rekognition connection healthy (POST).",
              collectionCount: response.CollectionIds?.length || 0,
              collections: response.CollectionIds,
              httpStatusCode: response.$metadata?.httpStatusCode,
            }),
            {
              headers: responseHeaders,
              status: 200,
            }
          );
        } catch (healthError: any) {
          console.error("Health Check (POST): FAILED. Error details:", {
            message: healthError.message,
            name: healthError.name,
            code: (healthError as any).Code || (healthError as any).code,
            requestId: healthError.$metadata?.requestId,
            httpStatusCode: healthError.$metadata?.httpStatusCode,
            stack: healthError.stack,
            fullError: JSON.stringify(healthError),
          });
          return new Response(
            JSON.stringify({
              error:
                "AWS Rekognition health check (POST) failed. See server logs.",
              details: healthError.message,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 500,
            }
          );
        }
      }
      // ... keep existing validation for action and image ...
      if (!action || (action !== "register" && action !== "identify")) {
        console.warn("Invalid or missing 'action' in request body:", action);
        return new Response(
          JSON.stringify({
            error: "Invalid 'action'. Must be 'register' or 'identify'.",
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      if (!image && (action === "register" || action === "identify")) {
        console.warn("Missing 'image' in request body for action:", action);
        return new Response(
          JSON.stringify({
            error: "Missing 'image' in request body.",
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      let imageBytes!: Uint8Array; // Definite assignment assertion
      if (action === "register" || action === "identify") {
        try {
          console.log("Step: Processing image data (base64 to bytes)...");
          imageBytes = getImageBytes(image);
          console.log(
            `Step: Image data processed successfully, ${imageBytes.length} bytes.`
          );
        } catch (e: any) {
          console.error("Error processing image data:", e.message, e.stack);
          return new Response(
            JSON.stringify({
              error: `Invalid image data: ${e.message}`,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 400,
            }
          );
        }
      }

      if (action === "register") {
        console.log(
          `Step: Register action. CustomerId (ExternalImageId): ${customerId}`
        );
        if (!customerId) {
          console.warn(
            "Missing 'customerId' (ExternalImageId) for 'register' action."
          );
          return new Response(
            JSON.stringify({
              error:
                "Missing 'customerId' (ExternalImageId) for 'register' action.",
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 400,
            }
          );
        }

        const indexFacesParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageBytes },
          ExternalImageId: customerId,
          MaxFaces: 1,
          QualityFilter: "AUTO",
          DetectionAttributes: ["DEFAULT"],
        };
        console.log("Step: IndexFaces - Parameters prepared:", {
          CollectionId: collectionId,
          ExternalImageId: customerId,
          MaxFaces: 1,
          QualityFilter: "AUTO",
        });

        console.log(
          "Step: IndexFaces - Sending IndexFacesCommand to Rekognition..."
        );
        try {
          const command = new IndexFacesCommand(indexFacesParams);
          const response = await rekognitionClient.send(command);
          console.log(
            "Step: IndexFaces - Response received from Rekognition. HTTP Status:",
            response.$metadata?.httpStatusCode,
            "RequestId:",
            response.$metadata?.requestId
          );
          // console.log("Full IndexFaces Response:", JSON.stringify(response)); // Uncomment for very detailed debugging

          if (
            response?.FaceRecords &&
            Array.isArray(response.FaceRecords) &&
            response.FaceRecords.length > 0
          ) {
            const faceRecord = response.FaceRecords[0];
            console.log(
              "IndexFaces: Face registered successfully. FaceId:",
              faceRecord.Face?.FaceId,
              "ExternalImageId:",
              faceRecord.Face?.ExternalImageId
            );
            return new Response(
              JSON.stringify({
                success: true,
                externalImageId: faceRecord.Face?.ExternalImageId,
                rekognitionFaceId: faceRecord.Face?.FaceId,
                confidence: faceRecord.Face?.Confidence,
              }),
              { headers: responseHeaders, status: 200 }
            );
          } else {
            const unindexedFaces = response?.UnindexedFaces;
            let errorMessage =
              "No face detected or face is of too low quality for registration.";
            if (Array.isArray(unindexedFaces) && unindexedFaces.length > 0) {
              const unindexedReason = unindexedFaces[0]?.Reasons?.join(", ");
              if (unindexedReason)
                errorMessage += ` Reason: ${unindexedReason}`;
            }
            console.warn(
              "IndexFaces: Face registration issue:",
              errorMessage,
              "Full Rekognition response snippet:",
              {
                UnindexedFaces: response.UnindexedFaces,
                FaceRecordsCount: response.FaceRecords?.length,
              }
            );
            return new Response(
              JSON.stringify({
                error: errorMessage,
                success: false,
                details: response?.UnindexedFaces || "No face records",
              }),
              {
                headers: responseHeaders,
                status: 400,
              }
            );
          }
        } catch (rekError: any) {
          console.error(
            "IndexFaces: ERROR during face registration. Details:",
            {
              message: rekError.message,
              name: rekError.name,
              code: (rekError as any).Code || (rekError as any).code,
              requestId: rekError.$metadata?.requestId,
              httpStatusCode: rekError.$metadata?.httpStatusCode,
              stack: rekError.stack,
              // fullError: JSON.stringify(rekError) // Uncomment for very detailed error structure
            }
          );
          return new Response(
            JSON.stringify({
              error:
                "AWS Rekognition registration operation failed. Check server logs.",
              details: rekError.message,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 500,
            }
          );
        }
      } else if (action === "identify") {
        console.log("Step: Identify action.");
        const searchFacesParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageBytes },
          MaxFaces: 1,
          FaceMatchThreshold: 90, // Default is 80, can be adjusted
        };
        console.log("Step: SearchFacesByImage - Parameters prepared:", {
          CollectionId: collectionId,
          MaxFaces: 1,
          FaceMatchThreshold: searchFacesParams.FaceMatchThreshold,
        });

        console.log(
          "Step: SearchFacesByImage - Sending SearchFacesByImageCommand to Rekognition..."
        );
        try {
          const command = new SearchFacesByImageCommand(searchFacesParams);
          const response = await rekognitionClient.send(command);
          console.log(
            "Step: SearchFacesByImage - Response received from Rekognition. HTTP Status:",
            response.$metadata?.httpStatusCode,
            "RequestId:",
            response.$metadata?.requestId
          );
          // console.log("Full SearchFacesByImage Response:", JSON.stringify(response)); // Uncomment for very detailed debugging

          if (
            response?.FaceMatches &&
            Array.isArray(response.FaceMatches) &&
            response.FaceMatches.length > 0
          ) {
            const bestMatch = response.FaceMatches[0];
            console.log(
              "SearchFacesByImage: Face identified. ExternalImageId:",
              bestMatch.Face?.ExternalImageId,
              "Similarity:",
              bestMatch.Similarity
            );
            return new Response(
              JSON.stringify({
                success: true,
                customerId: bestMatch.Face?.ExternalImageId, // This is the ExternalImageId
                rekognitionFaceId: bestMatch.Face?.FaceId,
                confidence: bestMatch.Similarity,
              }),
              { headers: responseHeaders, status: 200 }
            );
          } else {
            console.log(
              "SearchFacesByImage: No matching face found in collection."
            );
            return new Response(
              JSON.stringify({
                error: "Face not recognized.",
                success: false,
                customerId: null,
              }),
              {
                headers: responseHeaders,
                status: 200,
              }
            );
          }
        } catch (rekError: any) {
          console.error(
            "SearchFacesByImage: ERROR during face identification. Details:",
            {
              message: rekError.message,
              name: rekError.name,
              code: (rekError as any).Code || (rekError as any).code,
              requestId: rekError.$metadata?.requestId,
              httpStatusCode: rekError.$metadata?.httpStatusCode,
              stack: rekError.stack,
              // fullError: JSON.stringify(rekError) // Uncomment for very detailed error structure
            }
          );
          return new Response(
            JSON.stringify({
              error:
                "AWS Rekognition identification operation failed. Check server logs.",
              details: rekError.message,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 500,
            }
          );
        }
      }
    }

    console.warn(
      "Step: Request did not match any processing logic (e.g., not POST, or unsupported action)."
    );
    return new Response(
      JSON.stringify({
        error: "Unsupported request method or invalid action.",
        success: false,
      }),
      {
        headers: responseHeaders,
        status: 405, // Method Not Allowed or 400 Bad Request
      }
    );
  } catch (error: any) {
    console.error(
      "FATAL: Unhandled top-level error in customer-face-recognition function. Message:",
      error.message,
      "Stack:",
      error.stack,
      "Full Error:",
      JSON.stringify(error)
    );
    return new Response(
      JSON.stringify({
        error: "An unexpected server error occurred. Check server logs.",
        details: error.message,
        success: false,
      }),
      {
        headers: responseHeaders,
        status: 500,
      }
    );
  }
});
