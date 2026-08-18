const { MongoClient } = require("mongodb")
const dotenv = require("dotenv")

dotenv.config()

const {
  DATABASE_URL = "mongodb://erxes:5W7Y~JHvzxqfE2xR@core-db-2.mongodb.erxes.io:27017/"
} = process.env

if (!DATABASE_URL) {
  throw new Error("The DATABASE_URL environment variable must be set")
}

const client = new MongoClient(DATABASE_URL)

let coreDb
let Organizations

const formatMs = ms => `${(ms / 1000).toFixed(2)}s`

const log = message => {
  console.log(`[migrateSolongoSolutionData] ${message}`)
}

const logError = (message, error) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(
    `[migrateSolongoSolutionData] ERROR: ${message}: ${errorMessage}`
  )
}

const BATCH_SIZE = 500

const copyCollection = async (
  collectionName,
  sourceCollection,
  targetCollection
) => {
  const cursor = sourceCollection.find({}).batchSize(BATCH_SIZE)

  let batch = []
  let attempted = 0
  let inserted = 0
  let duplicates = 0
  let hadError = false

  const flush = async () => {
    if (!batch.length) return
    try {
      const result = await targetCollection.insertMany(batch, {
        ordered: false
      })
      inserted += result.insertedCount ?? 0
    } catch (error) {
      inserted += error?.result?.insertedCount ?? 0
      const writeErrors = Array.isArray(error?.writeErrors)
        ? error.writeErrors
        : []
      const dupErrors = writeErrors.filter(e => e?.code === 11000)
      duplicates += dupErrors.length
      const otherErrors = writeErrors.length - dupErrors.length
      if (otherErrors > 0 || (!writeErrors.length && error)) {
        hadError = true
        logError(`${collectionName}: insertMany failed`, error)
      }
    }
    batch = []
  }

  for await (const doc of cursor) {
    batch.push(doc)
    attempted++
    if (batch.length >= BATCH_SIZE) await flush()
  }
  await flush()

  log(
    `${collectionName}: inserted ${inserted}/${attempted} (skipped duplicates: ${duplicates})`
  )

  return { inserted, attempted, duplicates, hadError }
}

const command = async () => {
  const startedAt = Date.now()
  process.exitCode = 0

  try {
    log(`starting connect..`)
    await client.connect()
    log(`db connected`)

    coreDb = client.db("erxes_core")
    Organizations = coreDb.collection("organizations")

    log("starting work")

    const oldOrg = await Organizations.findOne({
      subdomain: "solongosolutionsllc"
    })

    if (!oldOrg?._id) {
      log("old org not found")
      process.exitCode = 1
      return
    }

    const newOrg = await Organizations.findOne({
      subdomain: "tsembiiauto"
    })

    if (!newOrg?._id) {
      log("new org not found")
      process.exitCode = 1
      return
    }

    const oldOrgId = oldOrg._id.toString()
    const newOrgId = newOrg._id.toString()

    log(`source orgId: ${oldOrgId} ${oldOrg.subdomain}`)
    log(`target orgId: ${newOrgId} ${newOrg.subdomain}`)

    const sourceDatabase = client.db(`erxes_${oldOrgId}`)
    const targetDatabase = client.db(`erxes_${newOrgId}`)

    const collectionsToCopy = ["customers", "companies"]

    let totalAttempted = 0
    let totalInserted = 0
    let hadAnyErrors = false

    for (const collectionName of collectionsToCopy) {
      const stepStartedAt = Date.now()

      try {
        const sourceCollection = sourceDatabase.collection(collectionName)
        const targetCollection = targetDatabase.collection(collectionName)

        const { attempted, inserted, hadError } = await copyCollection(
          collectionName,
          sourceCollection,
          targetCollection
        )

        totalAttempted += attempted
        totalInserted += inserted
        hadAnyErrors = hadAnyErrors || hadError

        log(
          `${collectionName}: done in ${formatMs(Date.now() - stepStartedAt)}`
        )
      } catch (error) {
        hadAnyErrors = true
        logError(`${collectionName}: migration step failed`, error)
      }
    }

    log(`summary: inserted ${totalInserted}/${totalAttempted}`)
    log(`total runtime: ${formatMs(Date.now() - startedAt)}`)

    if (hadAnyErrors) {
      process.exitCode = 2
    }
  } catch (error) {
    process.exitCode = 1
    logError("command failed", error)
  } finally {
    try {
      await client.close()
      log("db connection closed")
    } catch (error) {
      logError("failed to close db connection", error)
    }
  }
}
command()
