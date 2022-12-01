import {DynamoDB} from "aws-sdk"
import crypto from "crypto"
import {Beyonce, Table} from "../../main"
import {Song, SongModel, table} from "./models"
import {Author, LibraryTable, ModelType} from "./LibraryModels"

export const port = 8000
const isRunningOnCI = process.env.CI_BUILD_ID !== undefined
// When running in the CI env, we run Dynamo in a Docker container. And the host must match the service name defined in codeship-services.yml
// see https://documentation.codeship.com/pro/builds-and-configuration/services/#container-networking
const endpoint = isRunningOnCI ? `http://dynamodb:${port}` : `http://localhost:${port}`

const deleteAllTables = async (client: DynamoDB) => {
  const { TableNames: tables } = await client.listTables().promise();
  for (const t of [table, LibraryTable]) {
    if (tables !== undefined && tables.indexOf(t.tableName) !== -1) {
      await client.deleteTable({TableName: t.tableName}).promise();
    }
  }
};

export async function setup(): Promise<Beyonce> {
  const { tableName } = table
  const client = createDynamoDB();

  await deleteAllTables(client);
  const request = table.asCreateTableInput("PAY_PER_REQUEST");
  await client.createTable(request).promise()

  return createBeyonce(client, table)
}

export function createDynamoDB(): DynamoDB {
  return new DynamoDB({
    endpoint,
    region: "us-west-2" // silly, but still need to specify region for LocalDynamo
  })
}

export function createBeyonce(db: DynamoDB, table: Table): Beyonce {
  return new Beyonce(table, db)
}

// DynamoDB has a 400kb Item limit w/ a 1MB response size limit
// Thus 25 song items comprise at least 100kb * 25 = ~2.5MB of data
// i.e. at least 3 pages
const mp3 = crypto.randomBytes(100_000)
const songs: Song[] = [...Array(25).keys()].map((songId) =>
  SongModel.create({
    musicianId: "1",
    id: songId.toString(),
    title: `Song ${songId}`,
    mp3
  })
)
export async function create25Songs(db: Beyonce): Promise<Song[]> {
  // Batch these to avoid DynamoDB local throwing errors about exceeding
  // the max payload size
  await Promise.all([
    db.batchWriteWithTransaction({ putItems: songs.slice(0, 5) }),
    db.batchWriteWithTransaction({ putItems: songs.slice(5, 10) }),
    db.batchWriteWithTransaction({ putItems: songs.slice(10, 15) }),
    db.batchWriteWithTransaction({ putItems: songs.slice(15) })
  ])
  return songs
}

export async function libraryTableSetup(): Promise<Beyonce> {
  const { tableName } = LibraryTable;
  const client = createDynamoDB();

  await deleteAllTables(client);

  await client.createTable({
    TableName: tableName,

    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" }
    ],

    AttributeDefinitions: [
      {
        AttributeName: "pk",
        AttributeType: "N"
      },
      {
        AttributeName: "sk",
        AttributeType: "S"
      }
    ],

    BillingMode: "PAY_PER_REQUEST"
  }).promise();

  const db = createBeyonce(client, LibraryTable);
  await db.put<Author>({
    pk: 123,
    sk: "Terry Pratchett",
    model: ModelType.Author
  });
  return db;
}
