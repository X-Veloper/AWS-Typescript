import AWS, { nanoid }  from '../../aws'

const client = new AWS.S3()

export const createShortenUrl = async (redirectUrl: string) => {
  const shortenKey = nanoid()
  const params = {
    Bucket: 'links.dataslot.pro',
    Key: shortenKey,
    WebsiteRedirectLocation: redirectUrl
  }
  console.log(params)
  return new Promise<string>((resolve) => {
    client.putObject(params, function(err, data) {
      if (err){
        console.log('err : ', err)
        resolve('')
      }
      else {
        console.log(data)
        resolve(`links.dataslot.pro/${shortenKey}`)
      }
    })
  })
}

// const q = async () => {
//   const x:string = await createShortenUrl('xcaSDas', 'https://google.com')
//   console.log(x)

// }

// q()