import * as AWS from 'aws-sdk'
import { customAlphabet } from 'nanoid'

export const nanoid = customAlphabet('1234567890abcdef', 5)

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_APP,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_APP,
  region: 'ap-southeast-1'
})


export const S3 = new AWS.S3()
export const dynamodb = AWS.DynamoDB
export default AWS