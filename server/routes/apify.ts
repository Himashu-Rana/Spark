import { RequestHandler } from "express";
import {
  ListActorsResponse,
  GetActorSchemaResponse,
  ExecuteActorResponse,
  ValidateApiKeyResponse,
  ApifyActorListResponse,
  ApifyActorDetailResponse,
  ApifyRunResponse,
  ApifyDatasetResponse,
} from "@shared/api";

const APIFY_API_BASE = "https://api.apify.com/v2";

// Validate API key
export const validateApiKey: RequestHandler = async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    const response: ValidateApiKeyResponse = {
      valid: false,
      error: "API key is required",
    };
    return res.status(400).json(response);
  }

  try {
    const response = await fetch(`${APIFY_API_BASE}/acts`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const result: ValidateApiKeyResponse = { valid: true };
      res.json(result);
    } else {
      const result: ValidateApiKeyResponse = {
        valid: false,
        error: "Invalid API key",
      };
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("Error validating API key:", error);
    const result: ValidateApiKeyResponse = {
      valid: false,
      error: "Failed to validate API key",
    };
    res.status(500).json(result);
  }
};

// List user's actors
export const listActors: RequestHandler = async (req, res) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    const response: ListActorsResponse = {
      actors: [],
      error: "API key is required",
    };
    return res.status(401).json(response);
  }

  try {
    // Fetch both user's private actors and actors they have access to
    const [myActorsResponse, accessibleActorsResponse] = await Promise.all([
      fetch(`${APIFY_API_BASE}/acts?my=true&limit=100`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
      fetch(`${APIFY_API_BASE}/acts?limit=100`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    ]);

    if (!myActorsResponse.ok && !accessibleActorsResponse.ok) {
      const errorResponse: ListActorsResponse = {
        actors: [],
        error: `Failed to fetch actors: ${myActorsResponse.status} ${myActorsResponse.statusText}`,
      };
      return res.status(myActorsResponse.status).json(errorResponse);
    }

    const allActors = [];

    // Get user's own actors
    if (myActorsResponse.ok) {
      const myData: ApifyActorListResponse = await myActorsResponse.json();
      allActors.push(...myData.data.items);
    }

    // Get actors user has access to
    if (accessibleActorsResponse.ok) {
      const accessibleData: ApifyActorListResponse = await accessibleActorsResponse.json();
      // Filter out duplicates and only include public actors or those not already in the list
      const existingIds = new Set(allActors.map(actor => actor.id));
      const additionalActors = accessibleData.data.items.filter(
        actor => !existingIds.has(actor.id)
      );
      allActors.push(...additionalActors);
    }

    // Add popular public actors that users commonly need
    const popularActors = [
      'nwua9Gu5YrADL7ZDj', // Google Maps Scraper
      'apify/web-scraper',
      'apify/google-search-results-scraper'
    ];

    for (const actorId of popularActors) {
      const existingIds = new Set(allActors.map(actor => actor.id));
      if (!existingIds.has(actorId)) {
        try {
          const actorResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}`, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });
          if (actorResponse.ok) {
            const actorData: ApifyActorDetailResponse = await actorResponse.json();
            allActors.push(actorData.data);
          }
        } catch (error) {
          console.error(`Error fetching popular actor ${actorId}:`, error);
        }
      }
    }

    const successResponse: ListActorsResponse = {
      actors: allActors,
    };

    res.json(successResponse);
  } catch (error) {
    console.error("Error fetching actors:", error);
    const errorResponse: ListActorsResponse = {
      actors: [],
      error: "Failed to fetch actors from Apify",
    };
    res.status(500).json(errorResponse);
  }
};

// List popular public actors
export const listPublicActors: RequestHandler = async (req, res) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    const response: ListActorsResponse = {
      actors: [],
      error: "API key is required",
    };
    return res.status(401).json(response);
  }

  try {
    // Popular free actors that users can test with
    const popularActorIds = [
      'apify/web-scraper',
      'apify/google-search-results-scraper',
      'apify/instagram-scraper',
      'apify/youtube-scraper',
      'apify/facebook-posts-scraper',
      'apify/amazon-product-scraper'
    ];

    const actorPromises = popularActorIds.map(async (actorId) => {
      try {
        const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        if (response.ok) {
          const data: ApifyActorDetailResponse = await response.json();
          return data.data;
        } else {
          console.warn(`Actor ${actorId} not accessible: ${response.status}`);
        }
        return null;
      } catch (error) {
        console.error(`Error fetching actor ${actorId}:`, error);
        return null;
      }
    });

    const actors = await Promise.all(actorPromises);
    const validActors = actors.filter(actor => actor !== null);

    console.log(`Loaded ${validActors.length} public actors out of ${popularActorIds.length} attempted`);

    const successResponse: ListActorsResponse = {
      actors: validActors,
    };

    res.json(successResponse);
  } catch (error) {
    console.error("Error fetching public actors:", error);
    const errorResponse: ListActorsResponse = {
      actors: [],
      error: "Failed to fetch public actors from Apify",
    };
    res.status(500).json(errorResponse);
  }
};

// Get actor input schema
export const getActorSchema: RequestHandler = async (req, res) => {
  const { actorId } = req.params;
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    const response: GetActorSchemaResponse = {
      schema: null,
      error: "API key is required",
    };
    return res.status(401).json(response);
  }

  if (!actorId) {
    const response: GetActorSchemaResponse = {
      schema: null,
      error: "Actor ID is required",
    };
    return res.status(400).json(response);
  }

  try {
    console.log(`Fetching schema for actor: ${actorId}`);
    console.log(`Using API key: ${apiKey.substring(0, 10)}...`);

    // First, get actor details
    const actorResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    console.log(`Actor response status: ${actorResponse.status}`);

    if (!actorResponse.ok) {
      const errorText = await actorResponse.text();
      console.error(`Actor fetch failed: ${actorResponse.status} - ${errorText}`);
      const errorResponse: GetActorSchemaResponse = {
        schema: null,
        error: `Failed to fetch actor details: ${actorResponse.status} ${actorResponse.statusText}`,
      };
      return res.status(actorResponse.status).json(errorResponse);
    }

    const actorData: ApifyActorDetailResponse = await actorResponse.json();
    console.log(`Actor data for ${actorId}:`, JSON.stringify(actorData.data, null, 2));

    let schema = null;

    // Try to get schema from different sources
    if (actorData.data.versions && actorData.data.versions.length > 0) {
      const latestVersion = actorData.data.versions[0];
      console.log(`Latest version for ${actorId}:`, latestVersion.versionNumber);

      if (latestVersion.inputSchema) {
        schema = latestVersion.inputSchema;
        console.log(`Found schema in versions for ${actorId}`);
      }
    }

    // If no schema in versions, try getting the latest version separately
    if (!schema) {
      try {
        console.log(`Trying versions endpoint for ${actorId}`);
        const versionsResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/versions?limit=1&desc=true`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (versionsResponse.ok) {
          const versionsData = await versionsResponse.json();
          console.log(`Versions data for ${actorId}:`, JSON.stringify(versionsData, null, 2));

          if (versionsData.data?.items && versionsData.data.items.length > 0) {
            const latestVersion = versionsData.data.items[0];
            schema = latestVersion.inputSchema;
            console.log(`Found schema in versions endpoint for ${actorId}`);
          }
        }
      } catch (versionError) {
        console.error(`Error fetching versions for ${actorId}:`, versionError);
      }
    }

    // If still no schema, try getting build details from tagged builds
    if (!schema && actorData.data.taggedBuilds?.latest) {
      const latestBuild = actorData.data.taggedBuilds.latest;
      try {
        console.log(`Trying build details for ${actorId}/${latestBuild.buildId}`);
        const buildResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/builds/${latestBuild.buildId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (buildResponse.ok) {
          const buildData = await buildResponse.json();
          console.log(`Build details for ${actorId}:`, JSON.stringify(buildData, null, 2));
          schema = buildData.data?.inputSchema;
          if (schema) {
            console.log(`Found schema in build details for ${actorId}`);
          }
        }
      } catch (buildError) {
        console.error(`Error fetching build details for ${actorId}:`, buildError);
      }
    }

    // If still no schema, try getting from latest build directly
    if (!schema) {
      try {
        console.log(`Trying builds endpoint for ${actorId}`);
        const buildsResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/builds?limit=1&desc=true`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (buildsResponse.ok) {
          const buildsData = await buildsResponse.json();
          console.log(`Builds data for ${actorId}:`, JSON.stringify(buildsData, null, 2));

          if (buildsData.data?.items && buildsData.data.items.length > 0) {
            const latestBuild = buildsData.data.items[0];
            schema = latestBuild.inputSchema;
            if (schema) {
              console.log(`Found schema in builds endpoint for ${actorId}`);
            }
          }
        }
      } catch (buildError) {
        console.error(`Error fetching builds for ${actorId}:`, buildError);
      }
    }

    // Try actor runs for example input structure
    if (!schema && actorData.data.exampleRunInput) {
      try {
        console.log(`Trying to use example run input for ${actorId}`);
        // Parse the example input to understand the structure
        const exampleInput = actorData.data.exampleRunInput;
        if (exampleInput.body) {
          const parsed = JSON.parse(exampleInput.body);
          console.log(`Example input structure:`, parsed);

          // Create a schema based on the example
          schema = {
            title: actorData.data.title || "Actor Input",
            type: "object",
            description: actorData.data.description || "Input parameters for this actor",
            properties: {}
          };

          // Generate schema properties from example
          for (const [key, value] of Object.entries(parsed)) {
            const property: any = {
              title: key.charAt(0).toUpperCase() + key.slice(1),
              description: `Input parameter: ${key}`
            };

            if (typeof value === 'string') {
              property.type = 'string';
              if (value.length > 50) {
                property.format = 'textarea';
              }
            } else if (typeof value === 'number') {
              property.type = 'number';
            } else if (typeof value === 'boolean') {
              property.type = 'boolean';
            } else if (Array.isArray(value)) {
              property.type = 'array';
            } else if (typeof value === 'object') {
              property.type = 'object';
            } else {
              property.type = 'string';
            }

            schema.properties[key] = property;
          }

          console.log(`Generated schema from example for ${actorId}:`, schema);
        }
      } catch (exampleError) {
        console.error(`Error parsing example input for ${actorId}:`, exampleError);
      }
    }

    // Special handling for known actors with predefined schemas
    if (!schema && actorId === 'nwua9Gu5YrADL7ZDj') {
      console.log(`Using predefined schema for Google Maps Scraper`);
      schema = {
        title: "Google Maps Scraper",
        type: "object",
        description: "Extract business listings from Google Maps",
        properties: {
          searchQuery: {
            title: "🔍 Search Query",
            type: "string",
            description: "Type what you'd normally search for in the Google Maps search bar, like English breakfast or pet shelter. Aim for unique terms for faster processing.",
            example: "restaurants"
          },
          locationQuery: {
            title: "📍 Location",
            type: "string",
            description: "Define location using free text. Simpler formats work best; e.g., use City + Country rather than City + Country + State.",
            example: "New York, USA"
          },
          maxCrawledPlacesPerSearch: {
            title: "💯 Number of places to extract",
            type: "integer",
            description: "Number of results you expect to get per each Search term. The higher the number, the longer it will take.",
            example: 100,
            minimum: 1
          },
          language: {
            title: "🌍 Language",
            type: "string",
            description: "Results details will show in this language",
            default: "en",
            enum: ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh-CN"],
            example: "en"
          },
          categoryFilterWords: {
            title: "🎢 Place categories ($)",
            type: "array",
            description: "You can limit the places that are scraped based on the Category filter",
            items: { type: "string" },
            example: ["restaurant", "cafe", "bar"]
          },
          searchMatching: {
            title: "Get exact name matches ($)",
            type: "string",
            description: "Restrict what places are scraped based on matching their name with provided Search term",
            enum: ["all", "only_includes", "only_exact"],
            default: "all"
          },
          placeMinimumStars: {
            title: "Set a minimum star rating ($)",
            type: "string",
            description: "Scrape only places with a rating equal to or above the selected stars",
            enum: ["", "two", "twoAndHalf", "three", "threeAndHalf", "four", "fourAndHalf"],
            default: ""
          },
          website: {
            title: "Scrape places with/without a website ($)",
            type: "string",
            description: "Use this to exclude places without a website, or vice versa",
            enum: ["allPlaces", "withWebsite", "withoutWebsite"],
            default: "allPlaces"
          },
          skipClosedPlaces: {
            title: "⏩ Skip closed places ($)",
            type: "boolean",
            description: "Skip places that are marked as temporary or permanently closed",
            default: false
          },
          scrapePlaceDetailPage: {
            title: "Scrape place detail page ($)",
            type: "boolean",
            description: "Scrape detail pages of each place the Actor finds. This will slow down the Actor since it needs to open another page for each place individually.",
            default: false
          },
          maxReviews: {
            title: "Number of reviews to extract ($)",
            type: "integer",
            description: "Set the number of reviews you expect to get per place",
            default: 0,
            minimum: 0
          },
          maxImages: {
            title: "Number of additional images to extract ($)",
            type: "integer",
            description: "Set the number of images per place you expect to scrape",
            default: 0,
            minimum: 0
          },
          countryCode: {
            title: "🗺 Country",
            type: "string",
            description: "Set the country where the data extraction should be carried out",
            enum: ["", "us", "gb", "ca", "au", "de", "fr", "es", "it", "br", "mx", "in", "jp"],
            default: ""
          },
          city: {
            title: "🌇 City",
            type: "string",
            description: "Enter the city where the data extraction should be carried out",
            example: "Pittsburgh"
          },
          state: {
            title: "State",
            type: "string",
            description: "Set a state where the data extraction should be carried out (mainly for US addresses)",
            example: "Massachusetts"
          },
          postalCode: {
            title: "Postal code",
            type: "string",
            description: "Set the postal code of the area where the data extraction should be carried out",
            example: "10001"
          }
        },
        required: []
      };
    }

    // Final fallback for paid actors or actors without accessible schemas
    if (!schema) {
      console.log(`No schema found for actor ${actorId}, creating intelligent fallback`);

      // Check if it's a paid actor or has specific characteristics
      const isPaidActor = actorData.data.pricingInfos && actorData.data.pricingInfos.length > 0;
      const hasTrialMinutes = isPaidActor && actorData.data.pricingInfos[0].trialMinutes > 0;

      // Create a smart fallback based on actor metadata
      schema = {
        title: actorData.data.title || "Actor Input",
        type: "object",
        description: actorData.data.description || "Input parameters for this actor",
        properties: {
          // Common fields based on actor type and categories
          ...(actorData.data.categories?.includes('JOBS') && {
            keywords: {
              title: "Keywords",
              type: "array",
              description: "Job search keywords",
              items: { type: "string" }
            },
            location: {
              title: "Location",
              type: "string",
              description: "Job location or region"
            }
          }),
          // Generic input field
          input: {
            title: "Input Data",
            type: "string",
            format: "textarea",
            description: `Input data for ${actorData.data.title || 'this actor'}. ${isPaidActor ? `This is a paid actor${hasTrialMinutes ? ` with ${Math.round(actorData.data.pricingInfos[0].trialMinutes / 60)} hours of trial time` : ''}.` : ''}`
          }
        },
        required: []
      };

      if (isPaidActor) {
        schema.properties._pricing_info = {
          title: "Pricing Information",
          type: "string",
          description: `This actor costs $${actorData.data.pricingInfos[0].pricePerUnitUsd}/month${hasTrialMinutes ? ` with ${Math.round(actorData.data.pricingInfos[0].trialMinutes / 60)} hours free trial` : ''}`,
          readOnly: true
        };
      }

      console.log(`Created intelligent fallback schema for ${actorId}`);
    }

    console.log(`Final schema for actor ${actorId}:`, JSON.stringify(schema, null, 2));

    const successResponse: GetActorSchemaResponse = {
      schema,
    };

    res.json(successResponse);
  } catch (error) {
    console.error("Error fetching actor schema:", error);
    const errorResponse: GetActorSchemaResponse = {
      schema: null,
      error: "Failed to fetch actor schema from Apify",
    };
    res.status(500).json(errorResponse);
  }
};

// Execute actor run
export const executeActor: RequestHandler = async (req, res) => {
  const { actorId } = req.params;
  const { input } = req.body;
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    const response: ExecuteActorResponse = {
      run: {} as any,
      error: "API key is required",
    };
    return res.status(401).json(response);
  }

  if (!actorId) {
    const response: ExecuteActorResponse = {
      run: {} as any,
      error: "Actor ID is required",
    };
    return res.status(400).json(response);
  }

  try {
    // Start the actor run
    const runResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input || {}),
    });

    if (!runResponse.ok) {
      const errorResponse: ExecuteActorResponse = {
        run: {} as any,
        error: `Failed to start actor run: ${runResponse.status} ${runResponse.statusText}`,
      };
      return res.status(runResponse.status).json(errorResponse);
    }

    const runData: ApifyRunResponse = await runResponse.json();
    const run = runData.data;

    // Wait for the run to complete (with timeout)
    const maxWaitTime = 60000; // 60 seconds
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();

    let finalRun = run;
    let results: any[] = [];

    while (
      finalRun.status === "RUNNING" &&
      Date.now() - startTime < maxWaitTime
    ) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Poll for run status
      const statusResponse = await fetch(
        `${APIFY_API_BASE}/acts/${actorId}/runs/${run.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData: ApifyRunResponse = await statusResponse.json();
        finalRun = statusData.data;
      }
    }

    // If run completed successfully, fetch results
    if (finalRun.status === "SUCCEEDED") {
      try {
        const resultsResponse = await fetch(
          `${APIFY_API_BASE}/acts/${actorId}/runs/${run.id}/dataset/items?clean=true&format=json`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (resultsResponse.ok) {
          results = await resultsResponse.json();
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        // Continue without results - don't fail the whole request
      }
    }

    const successResponse: ExecuteActorResponse = {
      run: finalRun,
      results: results.length > 0 ? results : undefined,
    };

    res.json(successResponse);
  } catch (error) {
    console.error("Error executing actor:", error);
    const errorResponse: ExecuteActorResponse = {
      run: {} as any,
      error: "Failed to execute actor",
    };
    res.status(500).json(errorResponse);
  }
};
