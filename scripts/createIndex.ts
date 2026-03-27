import "dotenv/config";
import {
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
  SearchFieldDataType
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
        type: SearchFieldDataType.String,
        key: true,
        searchable: false
      },
      {
        name: "content",
        type: SearchFieldDataType.String,
        searchable: true
      },
      {
        name: "embedding",
        type: SearchFieldDataType.Collection(SearchFieldDataType.Single),
        searchable: false,
        // NEW SDK requires these two for vector fields:
        vectorSearchDimensions: 1536,
        vectorSearchProfileName: "my-hnsw-profile"
      },
      {
        name: "filename",
        type: SearchFieldDataType.String,
        searchable: false
      },
      {
        name: "blobUrl",
        type: SearchFieldDataType.String,
        searchable: false
      },
      {
        name: "title",
        type: SearchFieldDataType.String,
        searchable: true
      }
    ],

    vectorSearch: {
      algorithms: [
        {
          name: "my-hnsw",
          kind: "hnsw",
          hnswParameters: {
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
          algorithm: "my-hnsw"
        }
      ]
    }
  };

  console.log("Creating search index:", indexName);
  await client.createIndex(index);
  console.log("Index created successfully!");
}

main().catch(console.error);