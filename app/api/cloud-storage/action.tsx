'use server'

const { Storage } = require('@google-cloud/storage')

interface optionsI {
  version: 'v2' | 'v4'
  action: 'read' | 'write' | 'delete' | 'resumable'
  expires: number
}
const projectId = process.env.PROJECT_ID

export async function decomposeUri(uri: string) {
  const sourceUriParts = uri.replace('gs://', '').split('/')
  const sourceBucketName = sourceUriParts[0]
  const sourceObjectName = sourceUriParts.slice(1).join('/')

  return {
    bucketName: sourceBucketName,
    fileName: sourceObjectName,
  }
}

export async function getSignedURL(gcsURI: string) {
  const { bucketName, fileName } = await decomposeUri(gcsURI)

  const storage = new Storage({ projectId })

  const options: optionsI = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  }

  try {
    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options)
    return url
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while getting secured access to content.',
    }
  }
}

// TODO new bucket > new folder in bucket to avoid IAM Bucket admin sur
export async function ensureBucketExists(gcsURI: string) {
  const { bucketName } = await decomposeUri(gcsURI)

  try {
    const storage = new Storage({ projectId })
    const [bucketExists] = await storage.bucket(bucketName).exists()
    const location = process.env.GCS_BUCKET_LOCATION

    if (!bucketExists) {
      await storage.createBucket(bucketName, {
        location: location,
      })

      console.log(`Created new bucket: ${bucketName}`)
    }

    return gcsURI
  } catch (error) {
    console.error(error)
    return {
      error: 'Erorr while initializing content storage.',
    }
  }
}

export async function copyImageToTeamBucket(actualGcsUri: string, imageID: string) {
  const storage = new Storage({ projectId })
  const { bucketName, fileName } = await decomposeUri(actualGcsUri)

  try {
    const destinationBucketName = process.env.NEXT_PUBLIC_TEAM_BUCKET

    if (!bucketName || !fileName || !destinationBucketName) {
      throw new Error('Invalid source or destination URI.')
    }

    const sourceObject = storage.bucket(bucketName).file(fileName)
    const destinationBucket = storage.bucket(destinationBucketName)

    await sourceObject.copy(destinationBucket.file(imageID))
    const newUri = `gs://${destinationBucketName}/${imageID}`

    return newUri
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while moving image to team Library',
    }
  }
}

export async function downloadImage(gcsUri: string) {
  const storage = new Storage({ projectId })

  const { bucketName, fileName } = await decomposeUri(gcsUri)

  try {
    const [res] = await storage.bucket(bucketName).file(fileName).download() // Assuming download returns an array with the data at index 0

    const base64Image = Buffer.from(res).toString('base64')

    return {
      image: base64Image,
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while downloading the image',
    }
  }
}
