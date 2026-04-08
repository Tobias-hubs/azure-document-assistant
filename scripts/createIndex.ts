
/*
import "dotenv/config";
import {
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
  
} from "@azure/search-documents";

async function main() {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
  const apiKey = process.env.AZURE_SEARCH_API_KEY!;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME!;

  const client = new SearchIndexClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );

  const index: SearchIndex = {
    name: indexName,
    fields: [
      {
        name: "id",
        type: "Collection(Edm.String)",
        key: true,
        searchable: false
      },
      {
        name: "content",
        type: "Edm.String",
        searchable: true
      },
      {
        name: "embedding",
        type: "Collection(Edm.Single)",
        searchable: false,
        // NEW SDK requires these two for vector fields:
        vectorSearchDimensions: 1536,
        vectorSearchProfileName: "my-hnsw-profile"
      },
      {
        name: "filename",
        type: "Edm.String",
        searchable: false
      },
      {
        name: "blobUrl",
        type: "Edm.String",
        searchable: false
      },
      {
        name: "title",
        type: "Edm.String",
        searchable: true
      }
    ],

    vectorSearch: {
      algorithms: [
        {
          name: "my-hnsw",
          kind: "hnsw",
          parameters: {
            m: 4,
            efConstruction: 400,
            efSearch: 500,
            metric: "cosine"
          }
        }
      ],
      profiles: [
        {
          name: "my-hnsw-profile",
          algorithmConfigurationName: "my-hnsw"
        }
      ]
    }
  };

  console.log("Creating search index:", indexName);
  await client.createIndex(index);
  console.log("Index created successfully!");
}

main().catch(console.error);
*/